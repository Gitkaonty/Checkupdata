require('dotenv').config();
const db = require('../../../Models');
const { Op } = require('sequelize');
const { exportTvaTableExcel } = require('../../../Middlewares/tva/DeclTvaGenerateExcel');
const { generateTvaXml } = require('../../../Middlewares/tva/DeclTvaGenerateXml');
const PdfPrinter = require('pdfmake');
const { exportFormulaireTvaExcel } = require('../../../Middlewares/tva/FormTvaExcelDGE');
const { generateFormulairePdfContent } = require('../../../Middlewares/tva/FormTvaPdfDGE');

const Annex = db.etatsTvaAnnexes;
const FormTva = db.formulaireTvaAnnexes;
const FormTvaMatrices = db.formulaireTvaAnnexesMatrices;
const EtablDGE = db.etatsDge;
const EtablCFISC = db.etatsCentresFiscales;
const ParamTVA = db.paramtvas;
const ListeCodeTVA = db.listecodetvas;
const DossierPC = db.dossierplancomptable;
const Journals = db.journals;
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');
const Dossier = db.dossiers;
const { autoCalcDGE, autoCalcUnified } = require('../../../Middlewares/tva/AutoCalcFormTva');
const Etats = db.etats;
const EtatsDeclarations = db.etatsdeclarations;

const logoPath = path.join(__dirname, `../../../public/logo/${process.env.LOGO_EXPORT}`);

const logoBase64 = fs.readFileSync(logoPath).toString('base64');
const logoImage = `data:image/png;base64,${logoBase64}`;

// Helper: check if given mois/annee is within exercice date range
async function assertPeriodInExercice(exerciceId, mois, annee) {
  if (mois == null || annee == null) return { ok: true };
  try {
    const ex = await db.exercices.findByPk(Number(exerciceId));
    if (!ex || !ex.date_debut || !ex.date_fin) return { ok: true };
    const toYm = (d) => {
      const dt = new Date(d);
      if (isNaN(dt.getTime())) return null;
      return dt.getFullYear() * 100 + (dt.getMonth() + 1);
    };
    const ymStart = toYm(ex.date_debut);
    const ymEnd = toYm(ex.date_fin);
    const ym = Number(annee) * 100 + Number(mois);
    if (ymStart != null && ymEnd != null && (ym < ymStart || ym > ymEnd)) {
      return { ok: false, range: { start: ymStart, end: ymEnd } };
    }
    return { ok: true };
  } catch (_) {
    return { ok: true };
  }
}

// Frontend formulas replicated for backend checks
const formulas = {
  150: [100, 102, 103, 105, 106, 107, 108, 115, 125, 130, 140],
  161: [155, 160],
  170: [100, 102, 103, 105, 106, 107, 108, 130, 140, 161, 165],
  180: [270],
  200: { terms: [{ id: 102, w: 0.05 }] },
  205: { terms: [{ id: 103, w: 0.15 }] },
  210: {
    terms: [
      { id: 105, w: 0.2 }, { id: 106, w: 0.2 }, { id: 107, w: 0.2 }, { id: 108, w: 0.2 }, { id: 115, w: 0.2 }, { id: 125, w: 0.2 }
    ]
  },
  274: { terms: [{ id: 271, w: 1 }, { id: 272, w: 1 }, { id: 273, w: -1 }] },
  275: [200, 205, 210, 270, 273],
  310: [300, 305],
  360: [315, 316, 335, 340, 345, 350, 355, 359],

  400: { terms: [{ id: 375, w: 1 }, { id: 275, w: -1 }] },
  // Nouvelles formules
  366: { terms: [{ id: 360, w: 365 }, { id: 338, w: 1 }] },
  368: [320, 330],
  370: { terms: [{ id: 368, w: 365 }] },
  375: [310, 366, 370],
  700: {
    terms: [
      { id: 275, w: 1 }, { id: 620, w: 1 },
      { id: 375, w: -1 }, { id: 579, w: -1 }, { id: 589, w: -1 }, { id: 635, w: -1 }, { id: 640, w: -1 }, { id: 660, w: -1 }
    ]
  },
  701: {
    terms: [
      { id: 610, w: 1 }, { id: 400, w: 1 }, { id: 579, w: 1 }, { id: 589, w: 1 }, { id: 640, w: 1 },
      { id: 620, w: -1 }, { id: 630, w: -1 }, { id: 670, w: -1 }
    ]
  },
};

// Apply formulas on server to ensure computed lines (e.g., 400, 700, 701) are populated in exports
function applyFormulasServer(list) {
  try {
    if (!Array.isArray(list)) return [];
    // Work on a copy
    let current = list.map(r => ({ ...r, id: Number(r.id_code), montant: Number(r.montant) || 0 }));
    const getDef = (id) => formulas[id];
    const maxIterations = 5;
    for (let it = 0; it < maxIterations; it++) {
      let changed = false;
      const byId = new Map(current.map(r => [Number(r.id_code), r]));
      current = current.map(r => {
        const code = Number(r.id_code);
        const def = getDef(code);
        if (!def) return r;
        let value = 0;
        if (Array.isArray(def)) {
          value = def.reduce((acc, sid) => acc + (Number(byId.get(Number(sid))?.montant) || 0), 0);
        } else if (def && Array.isArray(def.terms)) {
          value = def.terms.reduce((acc, t) => acc + ((Number(byId.get(Number(t.id))?.montant) || 0) * Number(t.w || 0)), 0);
        } else {
          return r;
        }
        // round to 2 decimals similar to front rounding
        const rounded = Math.round(Number(value) * 100) / 100;
        if (Math.abs((Number(r.montant) || 0) - rounded) > 0.01) changed = true;
        return { ...r, montant: rounded };
      });
      if (!changed) break;
    }
    return current;
  } catch (e) {
    return list || [];
  }
}

// -------------------------
// EXPORT FORMULAIRE TVA (EXCEL)
// -------------------------
exports.exportFormulaireExcel = async (req, res) => {
  try {
    const { id_dossier, id_compte, id_exercice } = req.params;
    const mois = req.query?.mois != null ? Number(req.query.mois) : null;
    const annee = req.query?.annee != null ? Number(req.query.annee) : null;
    if (!id_dossier || !id_compte || !id_exercice) {
      return res.status(400).json({ state: false, msg: 'Paramètres manquants' });
    }

    const dossier = await Dossier.findByPk(id_dossier);
    const exercice = await db.exercices.findByPk(id_exercice);
    const compte = await db.userscomptes.findByPk(id_compte);
    if (!dossier || !exercice || !compte) {
      return res.status(400).json({ state: false, msg: 'Dossier/Exercice/Compte introuvable' });
    }

    const where = { id_dossier: Number(id_dossier), id_compte: Number(id_compte), id_exercice: Number(id_exercice) };
    if (mois != null) where.mois = mois;
    if (annee != null) where.annee = annee;
    const rows = await FormTva.findAll({ where, order: [['id_code', 'ASC'], ['updatedAt', 'DESC']] });
    const seen = new Set();
    const unique = [];
    for (const r of (rows || [])) {
      const code = Number(r.id_code);
      if (seen.has(code)) continue;
      seen.add(code);
      unique.push(typeof r.toJSON === 'function' ? r.toJSON() : r);
    }
    const templates = await FormTvaMatrices.findAll();
    const mapCodeToGroupe = new Map((templates || []).map(t => [Number(t.id_code), t.groupe || null]));
    const enriched = unique.map(o => ({ ...o, groupe: mapCodeToGroupe.get(Number(o.id_code)) || null }));

    const workbook = new ExcelJS.Workbook();
    const mode = String((req.query?.mode || '')).toLowerCase() === 'dge' ? 'dge' : 'cfisc';
    const includeDetails = (String(req.query?.includeDetails || '').toLowerCase() === 'true') || (req.query?.includeDetails === '1');
    let detailsByCode = {};
    if (includeDetails) {
      const whereA = { id_dossier: Number(id_dossier), id_compte: Number(id_compte), id_exercice: Number(id_exercice) };
      if (mois != null) whereA.mois = Number(mois);
      if (annee != null) whereA.annee = Number(annee);
      const annexRows = await Annex.findAll({ where: whereA, order: [['date_facture', 'ASC']] });
      const map = {};
      for (const a of (annexRows || [])) {
        const codeRaw = String(a.code_tva || '').trim();
        const m = codeRaw.match(/\d+/);
        const norm = m ? String(Number(m[0])) : '';
        if (!norm) continue;
        if (!map[norm]) map[norm] = [];
        map[norm].push({
          reference_facture: a.reference_facture,
          date_facture: a.date_facture,
          libelle_operation: a.libelle_operation,
          montant_ht: Number(a.montant_ht || 0),
          montant_tva: Number(a.montant_tva || 0),
        });
      }
      detailsByCode = map;
    }
    // Compute exercise date range (DD/MM/YYYY - DD/MM/YYYY)
    const fmtDMYx = (d) => {
      const dt = d ? new Date(d) : null;
      if (!dt || isNaN(dt.getTime())) return '';
      return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`;
    };
    const exerciceRange = (exercice?.date_debut && exercice?.date_fin)
      ? `${fmtDMYx(exercice.date_debut)} - ${fmtDMYx(exercice.date_fin)}`
      : (exercice?.libelle_rang || '');

    await exportFormulaireTvaExcel({
      workbook,
      rows: applyFormulasServer(enriched),
      meta: {
        dossier: dossier?.dossier || '',
        compte: compte?.nom || '',
        exercice: exerciceRange,
        mois,
        annee,
        mode,
        includeDetails,
      },
      detailsByCode,
    });
    workbook.views = [{ activeTab: 0 }];
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    const fname = `formulaire_tva_${mode}_${id_dossier}_${id_exercice}${mois != null && annee != null ? `_${String(mois).padStart(2, '0')}-${annee}` : ''}.xlsx`;
    res.setHeader('Content-Disposition', `attachment; filename="${fname}"`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('[FormTVA][EXPORT_EXCEL] error:', err);
    return res.status(500).json({ state: false, msg: 'Erreur serveur' });
  }
};

// -------------------------
// EXPORT FORMULAIRE TVA (PDF)
// -------------------------
exports.exportFormulairePdf = async (req, res) => {
  try {
    const { id_dossier, id_compte, id_exercice } = req.params;
    const mois = req.query?.mois != null ? Number(req.query.mois) : null;
    const annee = req.query?.annee != null ? Number(req.query.annee) : null;
    if (!id_dossier || !id_compte || !id_exercice) {
      return res.status(400).json({ state: false, msg: 'Paramètres manquants' });
    }

    const dossier = await Dossier.findByPk(id_dossier);
    const exercice = await db.exercices.findByPk(id_exercice);
    const compte = await db.userscomptes.findByPk(id_compte);
    if (!dossier || !exercice || !compte) {
      return res.status(400).json({ state: false, msg: 'Dossier/Exercice/Compte introuvable' });
    }

    const where = { id_dossier: Number(id_dossier), id_compte: Number(id_compte), id_exercice: Number(id_exercice) };
    if (mois != null) where.mois = mois;
    if (annee != null) where.annee = annee;
    const rows = await FormTva.findAll({ where, order: [['id_code', 'ASC'], ['updatedAt', 'DESC']] });
    const seen = new Set();
    const unique = [];
    for (const r of (rows || [])) {
      const code = Number(r.id_code);
      if (seen.has(code)) continue;
      seen.add(code);
      unique.push(typeof r.toJSON === 'function' ? r.toJSON() : r);
    }
    const templates = await FormTvaMatrices.findAll();
    const mapCodeToGroupe = new Map((templates || []).map(t => [Number(t.id_code), t.groupe || null]));
    const enriched = unique.map(o => ({ ...o, groupe: mapCodeToGroupe.get(Number(o.id_code)) || null }));

    const fonts = { Helvetica: { normal: 'Helvetica', bold: 'Helvetica-Bold', italics: 'Helvetica-Oblique', bolditalics: 'Helvetica-BoldOblique' } };
    const printer = new PdfPrinter(fonts);
    const mode = String((req.query?.mode || '')).toLowerCase() === 'dge' ? 'dge' : 'cfisc';
    const includeDetails = (String(req.query?.includeDetails || '').toLowerCase() === 'true') || (req.query?.includeDetails === '1');
    let detailsByCode = {};
    if (includeDetails) {
      // Only annex-based details for groups 02/03
      const whereA = { id_dossier: Number(id_dossier), id_compte: Number(id_compte), id_exercice: Number(id_exercice) };
      if (mois != null) whereA.mois = Number(mois);
      if (annee != null) whereA.annee = Number(annee);
      const annexRows = await Annex.findAll({ where: whereA, order: [['date_facture', 'ASC']] });
      const map = {};
      for (const a of (annexRows || [])) {
        const codeRaw = String(a.code_tva || '').trim();
        const m = codeRaw.match(/\d+/);
        const norm = m ? String(Number(m[0])) : '';
        if (!norm) continue;
        if (!map[norm]) map[norm] = [];
        map[norm].push({
          reference_facture: a.reference_facture,
          date_facture: a.date_facture,
          libelle_operation: a.libelle_operation,
          montant_ht: Number(a.montant_ht || 0),
          montant_tva: Number(a.montant_tva || 0),
        });
      }
      detailsByCode = map;
    }
    // Compute exercise date range (DD/MM/YYYY - DD/MM/YYYY)
    const fmtDMY = (d) => {
      const dt = d ? new Date(d) : null;
      if (!dt || isNaN(dt.getTime())) return '';
      return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`;
    };
    const exerciceRangePdf = (exercice?.date_debut && exercice?.date_fin)
      ? `${fmtDMY(exercice.date_debut)} - ${fmtDMY(exercice.date_fin)}`
      : (exercice?.libelle_rang || '');

    const sections = generateFormulairePdfContent({ rows: applyFormulasServer(enriched), mode, detailsByCode });
    const docDefinition = {
      pageSize: 'A4',
      pageOrientation: 'portrait',
      pageMargins: [20, 60, 20, 40],
      defaultStyle: { font: 'Helvetica', fontSize: 9 },
      content: [
        { text: mode === 'dge' ? 'Formulaire de déclaration du TVA - Modèle DGE' : 'Formulaire de déclaration du TVA - Modèle Centre fiscal', style: 'title', alignment: 'center', margin: [0, 0, 0, 12] },
        { text: `Dossier : ${dossier?.dossier || ''}`, style: 'subTitle', margin: [0, 0, 0, 8], lineHeight: 1.2 },
        { text: `Exercice : ${exerciceRangePdf}${(mois != null && annee != null) ? `\nPériode : ${String(mois).padStart(2, '0')}/${annee}` : ''}`, style: 'subTitleExo', margin: [0, 0, 0, 8], lineHeight: 1.2 },
        ...sections
      ],
      styles: {
        title: { fontSize: 16, bold: true },
        subTitle: { fontSize: 11, bold: true, alignment: 'center' },
        subTitleExo: { fontSize: 11, bold: true },
        tableHeader: { bold: true, color: 'white', fillColor: '#1A5276', alignment: 'center' },
      }
    };
    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    res.setHeader('Content-Type', 'application/pdf');
    const fname = `formulaire_tva_${mode}_${id_dossier}_${id_exercice}${mois != null && annee != null ? `_${String(mois).padStart(2, '0')}-${annee}` : ''}.pdf`;
    res.setHeader('Content-Disposition', `inline; filename="${fname}"`);
    pdfDoc.pipe(res);
    pdfDoc.end();
  } catch (err) {
    console.error('[FormTVA][EXPORT_PDF] error:', err);
    return res.status(500).json({ state: false, msg: 'Erreur serveur' });
  }
};

// Helper: resolve code_tva for a given dossier/account mapping
async function resolveCodeTvaByCompte({ id_dossier, id_numcpt, id_ecriture }) {
  try {
    if (!id_dossier) return null;
    let effectiveNumcpt = id_numcpt ? Number(id_numcpt) : null;
    if (!effectiveNumcpt && id_ecriture) {
      const j = await Journals.findByPk(Number(id_ecriture));
      if (j?.id_numcpt) effectiveNumcpt = Number(j.id_numcpt);
    }
    if (!effectiveNumcpt) return null;
    // 1) Exact match by IDs
    const p = await ParamTVA.findOne({
      where: { id_dossier: Number(id_dossier), id_cptcompta: effectiveNumcpt },
      order: [['id', 'DESC']],
    });
    if (p && p?.type != null) {
      const typeId = Number(p.type);
      if (!Number.isFinite(typeId)) return null;
      const codeRow = await ListeCodeTVA.findByPk(typeId);
      return codeRow?.code || null;
    }
    // 2) Fallback by numero de compte (e.g., 4456xxxx)
    const pcRow = await DossierPC.findByPk(effectiveNumcpt);
    const numeroCompte = pcRow?.compte;
    if (!numeroCompte) return null;

    const params = await ParamTVA.findAll({ where: { id_dossier: Number(id_dossier) }, order: [['id', 'DESC']] });
    if (!params || params.length === 0) return null;

    const cptIds = Array.from(new Set(params.map(x => Number(x.id_cptcompta)).filter(Boolean)));
    const pcRows = await DossierPC.findAll({ where: { id: { [Op.in]: cptIds } } });
    const idToNumero = new Map(pcRows.map(r => [Number(r.id), r.compte]));
    const found = params.find(row => idToNumero.get(Number(row.id_cptcompta)) === numeroCompte && row.type != null);
    if (!found) return null;
    const typeId = Number(found.type);
    if (!Number.isFinite(typeId)) return null;
    const codeRow = await ListeCodeTVA.findByPk(typeId);
    return codeRow?.code || null;
  } catch (e) {
    return null;
  }
}

// -------------------------
// VERROUILLAGE FORMULAIRE TVA
// -------------------------
exports.infosVerrouillage = async (req, res) => {
  try {
    const { compteId, fileId, exerciceId, mois, annee } = req.body || {};

    let resData = { state: false, msg: 'une erreur est survenue lors du traitement.', liste: [] };
    const rows = await Etats.findAll({
      where: { id_compte: Number(compteId), id_dossier: Number(fileId), id_exercice: Number(exerciceId), mois: Number(mois), annee: Number(annee) },
      order: [['code', 'ASC']],
    });
    resData.state = true;
    resData.liste = rows || [];
    resData.msg = 'traitement terminé avec succès.';
    return res.json(resData);
  } catch (error) {
    console.error('[TVA][infosVerrouillage] error:', error);
    return res.json({ state: false, msg: 'Erreur serveur', liste: [] });
  }
};

exports.computeFormAnomaliesPeriod = async (req, res) => {
  try {
    const id_dossier = Number(req.query?.id_dossier);
    const id_compte = Number(req.query?.id_compte);
    const id_exercice = Number(req.query?.id_exercice);
    const mois = req.query?.mois ? Number(req.query.mois) : null;
    const annee = req.query?.annee ? Number(req.query.annee) : null;
    const debug = (String(req.query?.debug || '').toLowerCase() === 'true') || (req.query?.debug === '1');
    if (!id_dossier || !id_compte || !id_exercice || !mois || !annee) {
      return res.status(400).json({ state: false, msg: 'Paramètres manquants', list: [] });
    }

    // Charger les lignes du formulaire en filtrant par période quand elle est fournie
    const formWhere = { id_dossier, id_compte, id_exercice };
    if (mois != null) formWhere.mois = Number(mois);
    if (annee != null) formWhere.annee = Number(annee);
    const formRows = await FormTva.findAll({ where: formWhere, order: [['id_code', 'ASC'], ['updatedAt', 'DESC']] });
    // Deduplicate by id_code: keep the most recent entry per code
    const seen = new Set();
    const uniqueFormRows = [];
    for (const r of (formRows || [])) {
      const code = Number(r.id_code);
      if (seen.has(code)) continue;
      seen.add(code);
      uniqueFormRows.push(r);
    }
    const templates = await FormTvaMatrices.findAll();
    const mapCodeToGroupe = new Map((templates || []).map(t => [Number(t.id_code), t.groupe || null]));

    // Helper: get details total TVA for a code (groups 02/03 => annexes)
    const getDetailsTotalTva = async (codeId) => {
      const whereA = { id_dossier, id_compte, id_exercice };
      if (mois != null) whereA.mois = Number(mois);
      if (annee != null) whereA.annee = Number(annee);
      const rows = await Annex.findAll({ where: whereA, order: [['date_facture', 'ASC']] });
      const normId = String(Number(codeId));
      const details = (rows || []).filter(a => {
        const code = String(a.code_tva || '').trim();
        const norm = (code.match(/\d+/) ? String(Number(code.match(/\d+/)[0])) : '');
        return norm === normId;
      });
      const total = details.reduce((acc, r) => acc + (Number(r.montant_tva) || 0), 0);
      return total;
    };

    const closeTo = (a, b) => {
      const A = Math.round((Number(a || 0)) * 100) / 100;
      const B = Math.round((Number(b || 0)) * 100) / 100;
      const absMax = Math.max(1, Math.abs(A), Math.abs(B));
      const tol = Math.max(0.01, 0.005 * absMax);
      return Math.abs(A - B) <= tol;
    };

    const anomalies = [];
    const mapCodeToAmount = new Map((uniqueFormRows || []).map(r => [Number(r.id_code), Number(r.montant) || 0]));
    const computeFormulaExpected = (code) => {
      const f = formulas[code];
      if (!f) return null;
      if (Array.isArray(f)) {
        return f.reduce((acc, c) => acc + (Number(mapCodeToAmount.get(Number(c)) || 0)), 0);
      }
      if (f && Array.isArray(f.terms)) {
        return f.terms.reduce((acc, t) => acc + (Number(mapCodeToAmount.get(Number(t.id)) || 0) * Number(t.w)), 0);
      }
      return null;
    };
    for (const r of (uniqueFormRows || [])) {
      const idCode = Number(r.id_code);
      const grp = mapCodeToGroupe.get(idCode) || null;
      if (!(grp === '02' || grp === '03')) continue; // only collected/deductible groups
      const actual = Math.round((Number(r.montant) || 0) * 100) / 100;
      const totalTVA = Math.round((await getDetailsTotalTva(idCode)) * 100) / 100;
      if (!closeTo(totalTVA, actual)) {
        const diff = Math.abs(totalTVA - actual);
        const fmt = (n) => {
          const v = Number(n || 0);
          return v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        };
        const msg = `- Total TVA "code ${idCode}" Détails = ${fmt(totalTVA)}\n- Total TVA "code ${idCode}" = ${fmt(actual)}\n- Ecart = ${fmt(diff)}`;
        if (debug) {
          console.log('[ANOMS][DETAILS]', { code: idCode, groupe: grp, expected: totalTVA, actual, diff, ctx: { id_dossier, id_compte, id_exercice, mois, annee } });
        }
        anomalies.push({
          code: idCode,
          groupe: grp,
          expected: totalTVA,
          actual,
          diff,
          kind: 'details',
          message: msg,
        });
      }
      // Formula-based anomaly (independent check)
      const expFormula = computeFormulaExpected(idCode);
      if (expFormula != null) {
        const expRounded = Math.round(Number(expFormula) * 100) / 100;
        if (!closeTo(expRounded, actual)) {
          const diff2 = Math.abs(expRounded - actual);
          const fmt = (n) => {
            const v = Number(n || 0);
            return v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
          };
          // Build a human-readable breakdown of the formula
          const f = formulas[idCode];
          let breakdown = '';
          if (Array.isArray(f)) {
            breakdown = `${idCode} = ${f.join(' + ')}`;
          } else if (f && Array.isArray(f.terms)) {
            const parts = f.terms.map(t => `${(Number(t.w) * 100).toFixed(0)}% de ${t.id}`);
            breakdown = `${idCode} = ${parts.join(' + ')}`;
          }
          if (debug) {
            console.log('[ANOMS][FORMULA]', { code: idCode, groupe: grp, expected: expRounded, actual, diff: diff2, breakdown, ctx: { id_dossier, id_compte, id_exercice, mois, annee } });
          }
          anomalies.push({
            code: idCode,
            groupe: grp,
            expected: expRounded,
            actual,
            diff: diff2,
            kind: 'formula',
            message: `- Montant attendu par formule (code ${idCode}) = ${fmt(expRounded)}\n- Montant formulaire (code ${idCode}) = ${fmt(actual)}\n- Ecart = ${fmt(diff2)}${breakdown ? `\n- Formule: ${breakdown}` : ''}`,
          });
        }
      }
    }

    anomalies.sort((a, b) => (String(a.groupe).localeCompare(String(b.groupe)) || (Number(a.code) - Number(b.code))));
    return res.json({ state: true, count: anomalies.length, list: anomalies, ctx: { id_dossier, id_compte, id_exercice, mois, annee } });
  } catch (err) {
    console.error('[TVA][ANOM][COMPUTE] error:', err);
    return res.status(500).json({ state: false, msg: 'Erreur serveur', list: [] });
  }
};

exports.verrouillerTableau = async (req, res) => {
  try {
    const { compteId, fileId, exerciceId, tableau, verr, mois, annee } = req.body || {};
    let resData = { state: false, msg: 'une erreur est survenue lors du traitement.' };
    const [count] = await Etats.update(
      { valide: !!verr },
      { where: { id_compte: Number(compteId), id_dossier: Number(fileId), id_exercice: Number(exerciceId), code: String(tableau), mois: Number(mois), annee: Number(annee) } }
    );
    if (count > 0) {
      resData.state = true;
      resData.msg = 'traitement terminé avec succès.';
    } else {
      resData.msg = 'Aucune ligne mise à jour (vérifiez le code)';
    }
    return res.json(resData);
  } catch (error) {
    console.error('[TVA][verrouillerTableau] error:', error);
    return res.json({ state: false, msg: 'Erreur serveur' });
  }
};

exports.infosVerrouillageDeclaration = async (req, res) => {
  try {
    const { compteId, fileId, exerciceId, mois = null, annee = null } = req.body || {};
    const where = {
      id_compte: Number(compteId),
      id_dossier: Number(fileId),
      id_exercice: Number(exerciceId),
    };
    if (mois != null && annee != null) {
      where.mois = Number(mois);
      where.annee = Number(annee);
    }
    const rows = await EtatsDeclarations.findAll({ where, order: [['code', 'ASC'], ['mois', 'ASC'], ['annee', 'ASC']] });
    return res.json({ state: true, liste: rows, msg: 'OK' });
  } catch (error) {
    console.error('[TVA][infosVerrouillageDeclaration] error:', error);
    return res.json({ state: false, msg: 'Erreur serveur', liste: [] });
  }
};

exports.verrouillerDeclaration = async (req, res) => {
  try {
    const { compteId, fileId, exerciceId, code, nom, mois = null, annee = null, verr = false, nbranomalie = null } = req.body || {};
    if (!compteId || !fileId || !exerciceId || !code) {
      return res.status(400).json({ state: false, msg: 'Paramètres manquants' });
    }
    const where = {
      id_compte: Number(compteId),
      id_dossier: Number(fileId),
      id_exercice: Number(exerciceId),
      code: String(code),
      mois: mois == null ? null : Number(mois),
      annee: annee == null ? null : Number(annee),
    };
    const payload = {
      nom: nom == null ? String(code) : String(nom),
      valide: !!verr,
    };
    if (nbranomalie != null) payload.nbranomalie = Number(nbranomalie) || 0;

    // Utiliser upsert pour éviter les problèmes de concurrence
    const [item, created] = await EtatsDeclarations.upsert(
      { ...where, ...payload },
      {
        conflictFields: ['id_compte', 'id_dossier', 'id_exercice', 'code', 'mois', 'annee'],
        returning: true
      }
    );

    const message = created ? 'Créé avec succès' : 'Mise à jour effectuée';
    return res.json({ state: true, msg: message, item });
  } catch (error) {
    console.error('[TVA][verrouillerDeclaration] error:', error);
    return res.json({ state: false, msg: 'Erreur serveur' });
  }
};

////////////////ANNEXES
exports.listAnnexes = async (req, res) => {
  try {
    const { compteId, dossierId, exerciceId, mois, annee } = req.query;

    const where = {};
    if (dossierId) where.id_dossier = dossierId;
    if (exerciceId) where.id_exercice = exerciceId;
    if (compteId) where.id_compte = compteId;
    if (mois) where.mois = Number(mois);
    if (annee) where.annee = Number(annee);

    const rows = await Annex.findAll({ where, order: [['id', 'ASC']] });

    // Preload mappings for performance
    const dossierIdNum = where.id_dossier;
    let paramRows = [];
    let codeRows = [];
    let pcRows = [];
    if (dossierIdNum) {
      paramRows = await ParamTVA.findAll({ where: { id_dossier: Number(dossierIdNum) } });
      codeRows = await ListeCodeTVA.findAll();
      const cptIds = Array.from(new Set((paramRows || []).map(p => Number(p.id_cptcompta)).filter(Boolean)));
      if (cptIds.length > 0) {
        pcRows = await DossierPC.findAll({ where: { id: { [Op.in]: cptIds } } });
      }
    }
    const mapCompteToType = new Map(
      (paramRows || []).map((p) => [Number(p.id_cptcompta), Number(p.type)])
    );
    const mapTypeToCode = new Map(
      (codeRows || []).map((c) => [Number(c.id), c.code])
    );
    const mapCompteIdToNumero = new Map((pcRows || []).map((pc) => [Number(pc.id), pc.compte]));
    const mapNumeroToType = new Map();
    (paramRows || []).forEach((p) => {
      const numero = mapCompteIdToNumero.get(Number(p.id_cptcompta));
      if (numero && p.type != null) {
        mapNumeroToType.set(numero, Number(p.type));
      }
    });

    // Ensure anomalies/commentaire/code_tva are present and consistent
    const result = rows.map((r) => {
      const o = typeof r.toJSON === 'function' ? r.toJSON() : r;
      const isEmpty = (v) => {
        const s = String(v ?? '').trim();
        if (s === '') return true;
        const low = s.toLowerCase();
        return low === 'n/a' || low === 'na' || low === 'null' || low === 'undefined' || low === '-';
      };
      const notes = [];
      if (isEmpty(o?.nif)) notes.push('NIF vide');
      if (isEmpty(o?.stat)) notes.push('STAT vide');
      if (isEmpty(o?.raison_sociale)) notes.push('Raison sociale vide');
      if (isEmpty(o?.adresse)) notes.push('Adresse vide');
      if (isEmpty(o?.reference_facture)) notes.push('Référence facture vide');
      if (isEmpty(o?.date_facture)) notes.push('Date facture vide');
      // code_tva mapping fallback
      let finalCode = o?.code_tva;
      if (!finalCode && (o?.id_numcpt || o?.id_ecriture)) {
        // Try by identical IDs
        if (o?.id_numcpt) {
          const typeIdA = mapCompteToType.get(Number(o.id_numcpt));
          if (typeIdA) {
            const candidate = mapTypeToCode.get(Number(typeIdA));
            if (candidate) finalCode = candidate;
          }
        }
        // Fallback by numero de compte
        if (!finalCode && o?.id_numcpt) {
          const numero = mapCompteIdToNumero.get(Number(o.id_numcpt));
          if (numero) {
            const typeIdB = mapNumeroToType.get(numero);
            if (typeIdB) {
              const candidate = mapTypeToCode.get(Number(typeIdB));
              if (candidate) finalCode = candidate;
            }
          }
        }
        // Last resort: if id_numcpt missing but id_ecriture present, derive via journal
        if (!finalCode && !o?.id_numcpt && o?.id_ecriture) {
          // Resolve code dynamically using helper
          // Note: not awaiting per-row DB calls here to avoid N+1; handled by helper at create/update.
        }
      }
      if (!finalCode) notes.push('Code TVA introuvable pour le compte');

      const computedComment = notes.join(', ');
      const anomaliesBool = o?.anomalies === true || o?.anomalies === 1 || o?.anomalies === '1' || o?.anomalies === 'true' || o?.anomalies === 'TRUE';
      const hasAnomaly = notes.length > 0;

      return {
        ...o,
        code_tva: finalCode || '',
        anomalies: anomaliesBool || hasAnomaly,
        commentaire: (o?.commentaire && String(o.commentaire).trim()) ? o.commentaire : computedComment,
      };
    });

    return res.json({ state: true, list: result, msg: 'OK' });
  } catch (err) {
    console.error('[Annexes] list error:', err);
    return res.json({ state: false, list: [], msg: 'Erreur serveur' });
  }
};

exports.getFormulaireDetails = async (req, res) => {
  try {
    const dossierId = Number(req.params.dossierId);
    const compteId = Number(req.params.compteId);
    const exerciceId = Number(req.params.exerciceId);
    const idCode = String(Number(req.params.idCode));
    const mois = req.query?.mois ? Number(req.query.mois) : null;
    const annee = req.query?.annee ? Number(req.query.annee) : null;

    console.log('[TVA][FORM][DETAILS] >>> params', { dossierId, compteId, exerciceId, idCode, mois, annee });

    if (!dossierId || !compteId || !exerciceId || !idCode) {
      return res.status(400).json({ state: false, msg: 'Paramètres manquants' });
    }

    const mat = await FormTvaMatrices.findOne({ where: { id_code: Number(idCode) } });
    const groupe = mat?.groupe || null;
    console.log('[TVA][FORM][DETAILS] >>> groupe trouvé:', groupe);

    if (groupe === '01') {
      // Construire la liste des comptes (classe 7) mappés au code demandé via ParamTVA
      const codeNum = String(Number(idCode));
      const allParams = await ParamTVA.findAll({ where: { id_dossier: Number(dossierId) } });
      const allCodes = await ListeCodeTVA.findAll();
      const idToCode = new Map((allCodes || []).map(c => [Number(c.id), String(c.code || '').trim()]));
      const mappedAccounts = [];
      for (const p of (allParams || [])) {
        const raw = idToCode.get(Number(p?.type)) || '';
        const m = raw.match(/\d+/);
        const norm = m ? String(Number(m[0])) : '';
        if (!norm) continue;
        if (norm !== codeNum) continue; // ne garder que les comptes mappés au code demandé
        if (p?.id_cptcompta) mappedAccounts.push(Number(p.id_cptcompta));
      }
      const uniqAccounts = Array.from(new Set(mappedAccounts));
      console.log('[G01][DETAILS][MAP]', { idCode: codeNum, mappedAccountsCount: uniqAccounts.length, mappedAccounts: uniqAccounts });

      const whereJ = {
        id_dossier: dossierId,
        id_compte: compteId,
        id_exercice: exerciceId,
      };
      if (mois && annee) {
        whereJ.decltva = true;
        whereJ.decltvamois = Number(mois);
        whereJ.decltvaannee = Number(annee);
        console.log('[TVA][FORM][DETAILS] >>> Filtrage par mois/annee:', { mois, annee });
      } else {
        console.log('[TVA][FORM][DETAILS] >>> Pas de filtrage mois/annee, on prend tout');
      }

      // DEBUG: afficher le where utilisé pour la période du groupe 01
      console.log('[G01][WHERE]', {
        id_dossier: whereJ.id_dossier,
        id_compte: whereJ.id_compte,
        id_exercice: whereJ.id_exercice,
        decltva: whereJ.decltva,
        decltvamois: whereJ.decltvamois,
        decltvaannee: whereJ.decltvaannee,
        filterAccounts: uniqAccounts,
      });
      const jrns = await Journals.findAll({
        where: uniqAccounts.length > 0 ? { ...whereJ, id_numcpt: { [Op.in]: uniqAccounts } } : { ...whereJ, id_numcpt: -1 },
        attributes: ['id_numcpt', 'debit', 'credit', 'dateecriture', 'libelle', 'decltva', 'decltvamois', 'decltvaannee'],
        include: [{
          model: DossierPC,
          as: 'dossierplancomptable',
          attributes: ['compte', 'libelle'],
          required: true,
          where: { compte: { [Op.like]: '7%' } },
        }],
        order: [['dateecriture', 'ASC']],
      });

      // DEBUG: stats sur les périodes et dates
      const periods = new Set();
      let minDate = null, maxDate = null;
      for (const j of (jrns || [])) {
        const m = Number(j?.decltvamois || 0);
        const y = Number(j?.decltvaannee || 0);
        if (m && y) periods.add(`${m}-${y}`);
        const d = j?.dateecriture ? new Date(j.dateecriture) : null;
        if (d) {
          if (!minDate || d < minDate) minDate = d;
          if (!maxDate || d > maxDate) maxDate = d;
        }
      }
      console.log('[G01][RESULT]', {
        count: (jrns || []).length,
        distinct_declared_periods: Array.from(periods.values()),
        min_dateecriture: minDate ? minDate.toISOString().slice(0, 10) : null,
        max_dateecriture: maxDate ? maxDate.toISOString().slice(0, 10) : null,
      });

      console.log('[TVA][FORM][DETAILS] >>> Journaux trouvés:', jrns.length);

      const detailsEntries = (jrns || []).map((j) => {
        const numero = String(j?.dossierplancomptable?.compte || j.id_numcpt || '');
        const libelle = j?.libelle ? String(j.libelle) : '';
        const debit = Number(j.debit || 0);
        const credit = Number(j.credit || 0);
        const net = credit - debit;

        console.log('[TVA][FORM][DETAILS] Ligne:', {
          compte: numero,
          dateecriture: j.dateecriture,
          debit,
          credit,
          net,
        });

        return { compte: numero, libelle, debit, credit, net, dateecriture: j.dateecriture };
      });

      const byAccount = new Map();
      for (const e of detailsEntries) {
        const prev = byAccount.get(e.compte) || { compte: e.compte, libelle: e.libelle, debit: 0, credit: 0 };
        prev.debit += e.debit;
        prev.credit += e.credit;
        byAccount.set(e.compte, prev);
      }
      const details = Array.from(byAccount.values()).map(r => ({ ...r, net: Number(r.credit) - Number(r.debit) }));

      console.log('[TVA][FORM][DETAILS] >>> Résumé par compte:', details);

      const total = detailsEntries.reduce(
        (acc, r) => ({ debit: acc.debit + r.debit, credit: acc.credit + r.credit, net: acc.net + r.net }),
        { debit: 0, credit: 0, net: 0 }
      );

      console.log('[TVA][FORM][DETAILS] >>> Totaux globaux:', total);

      // Groupe 01: persister automatiquement le montant du formulaire PAR PERIODE (mois/annee)
      try {
        const key = {
          id_dossier: dossierId,
          id_compte: compteId,
          id_exercice: exerciceId,
          id_code: Number(idCode),
          mois: mois == null ? null : Number(mois),
          annee: annee == null ? null : Number(annee),
        };
        const montant = Number(total?.net || 0);
        const exist = await FormTva.findOne({ where: key });
        if (exist) {
          await exist.update({ montant });
          console.log('[G01][FORMTva][PERIOD] update', { ...key, montant });
        } else {
          await FormTva.create({ ...key, montant });
          console.log('[G01][FORMTva][PERIOD] create', { ...key, montant });
        }
      } catch (e) {
        console.warn('[G01][FORMTva][PERIOD] persist error (non-bloquant):', e?.message || e);
      }

      return res.json({ state: true, groupe, details, detailsEntries, total });
    }

    if (groupe === '02' || groupe === '03') {
      // Details from annexes matched by code and period
      const whereA = { id_dossier: dossierId, id_compte: compteId, id_exercice: exerciceId };
      if (mois) whereA.mois = Number(mois);
      if (annee) whereA.annee = Number(annee);
      const rows = await Annex.findAll({ where: whereA, order: [['date_facture', 'ASC']] });
      const details = (rows || []).filter(a => {
        const code = String(a.code_tva || '').trim();
        const norm = (code.match(/\d+/) ? String(Number(code.match(/\d+/)[0])) : '');
        return norm === idCode;
      }).map(a => ({
        reference_facture: a.reference_facture,
        date_facture: a.date_facture,
        libelle_operation: a.libelle_operation,
        montant_ht: Number(a.montant_ht || 0),
        montant_tva: Number(a.montant_tva || 0),
      }));
      const total = details.reduce((acc, r) => ({ montant_ht: acc.montant_ht + r.montant_ht, montant_tva: acc.montant_tva + r.montant_tva }), { montant_ht: 0, montant_tva: 0 });
      return res.json({ state: true, groupe, details, total });
    }

    return res.json({ state: true, groupe: groupe || null, details: [], total: {} });
  } catch (err) {
    console.error('[TVA][FORM][DETAILS] error:', err);
    return res.status(500).json({ state: false, msg: 'Erreur serveur' });
  }
};

exports.createAnnexe = async (req, res) => {
  try {
    const payload = req.body || {};
    // Basic server-side defaults
    if (payload.montant_ht == null) payload.montant_ht = 0;
    if (payload.montant_tva == null) payload.montant_tva = 0;

    // Server-side anomaly computation (fallback if not provided by frontend)
    if (payload.anomalies === undefined || payload.commentaire === undefined) {
      const isEmpty = (v) => {
        const s = String(v ?? '').trim();
        if (s === '') return true;
        const low = s.toLowerCase();
        return low === 'n/a' || low === 'na' || low === 'null' || low === 'undefined' || low === '-';
      };

      const anomaliesNotes = [];
      if (isEmpty(payload.nif)) anomaliesNotes.push('NIF vide');
      if (isEmpty(payload.stat)) anomaliesNotes.push('STAT vide');
      if (isEmpty(payload.raison_sociale)) anomaliesNotes.push('Raison sociale vide');
      if (isEmpty(payload.adresse)) anomaliesNotes.push('Adresse vide');
      if (isEmpty(payload.reference_facture)) anomaliesNotes.push('Référence facture vide');
      if (isEmpty(payload.date_facture)) anomaliesNotes.push('Date facture vide');

      payload.anomalies = anomaliesNotes.length > 0;
      payload.commentaire = anomaliesNotes.join(', ');
    }

    // Resolve code_tva if missing
    if (!payload.code_tva) {
      const code = await resolveCodeTvaByCompte({ id_dossier: payload.id_dossier, id_numcpt: payload.id_numcpt, id_ecriture: payload.id_ecriture });
      if (code) {
        payload.code_tva = code;
      } else {
        // Mark anomaly reason if not already present
        const notesArr = (payload.commentaire ? String(payload.commentaire).split(',').map(s => s.trim()).filter(Boolean) : []);
        notesArr.push('Code TVA introuvable pour le compte');
        payload.commentaire = Array.from(new Set(notesArr)).join(', ');
        payload.anomalies = true;
      }
    }

    const created = await Annex.create(payload);
    return res.json({ state: true, item: created, msg: 'Créé avec succès' });
  } catch (err) {
    console.error('[Annexes] create error:', err);
    return res.json({ state: false, msg: 'Erreur lors de la création' });
  }
};

exports.updateAnnexe = async (req, res) => {
  try {
    const { id } = req.params;
    const payload = req.body || {};

    // Backend field restrictions: prevent updates to locked columns
    const locked = new Set([
      'raison_sociale',
      'montant_ht',
      'montant_tva',
      'date_facture',
      'nature',
      'mois',
      'annee',
      'date_paiement',
    ]);
    // Only allow specific editable fields to be updated
    const allowedEditable = new Set([
      'collecte_deductible',
      'local_etranger',
      'nif',
      'stat',
      'adresse',
      'reference_facture',
      'libelle_operation',
      'observation',
      'n_dau',
      'ligne_formulaire',
      'code_tva',
      'commentaire',
      'anomalies',
    ]);

    const filtered = {};
    Object.keys(payload || {}).forEach((k) => {
      if (!locked.has(k) && allowedEditable.has(k)) {
        filtered[k] = payload[k];
      }
    });

    // server-side recalc as safety if anomalies/commentaire provided/omitted
    if (filtered.anomalies === undefined || filtered.commentaire === undefined) {
      const base = typeof (await Annex.findByPk(id))?.toJSON === 'function' ? (await Annex.findByPk(id)).toJSON() : await Annex.findByPk(id);
      const src = { ...(base || {}), ...(payload || {}) };
      const isEmpty = (v) => {
        const s = String(v ?? '').trim();
        if (s === '') return true;
        const low = s.toLowerCase();
        return low === 'n/a' || low === 'na' || low === 'null' || low === 'undefined' || low === '-';
      };
      const notes = [];
      if (isEmpty(src?.nif)) notes.push('NIF vide');
      if (isEmpty(src?.stat)) notes.push('STAT vide');
      if (isEmpty(src?.raison_sociale)) notes.push('Raison sociale vide');
      if (isEmpty(src?.adresse)) notes.push('Adresse vide');
      if (isEmpty(src?.reference_facture)) notes.push('Référence facture vide');
      if (isEmpty(src?.date_facture)) notes.push('Date facture vide');
      filtered.anomalies = notes.length > 0;
      filtered.commentaire = notes.join(', ');
    }

    // Resolve code_tva if still missing/empty
    if (!filtered.code_tva) {
      const baseRow = await Annex.findByPk(id);
      const base = typeof baseRow?.toJSON === 'function' ? baseRow.toJSON() : baseRow;
      const code = await resolveCodeTvaByCompte({ id_dossier: base?.id_dossier, id_numcpt: base?.id_numcpt, id_ecriture: base?.id_ecriture });
      if (code) {
        filtered.code_tva = code;
      } else {
        const isEmpty = (v) => {
          const s = String(v ?? '').trim();
          if (s === '') return true;
          const low = s.toLowerCase();
          return low === 'n/a' || low === 'na' || low === 'null' || low === 'undefined' || low === '-';
        };
        const src = { ...(base || {}), ...(payload || {}) };
        const notes = [];
        if (isEmpty(src?.nif)) notes.push('NIF vide');
        if (isEmpty(src?.stat)) notes.push('STAT vide');
        if (isEmpty(src?.raison_sociale)) notes.push('Raison sociale vide');
        if (isEmpty(src?.adresse)) notes.push('Adresse vide');
        if (isEmpty(src?.reference_facture)) notes.push('Référence facture vide');
        if (isEmpty(src?.date_facture)) notes.push('Date facture vide');
        notes.push('Code TVA introuvable pour le compte');
        filtered.anomalies = true;
        filtered.commentaire = notes.join(', ');
      }
    }

    const [count] = await Annex.update(filtered, { where: { id } });
    if (count > 0) {
      const updated = await Annex.findByPk(id);
      return res.json({ state: true, item: updated, msg: 'Mis à jour avec succès' });
    }
    return res.json({ state: false, msg: 'Ligne introuvable ou inchangée' });
  } catch (err) {
    console.error('[Annexes] update error:', err);
    return res.json({ state: false, msg: 'Erreur lors de la mise à jour' });
  }
};

exports.deleteAnnexe = async (req, res) => {
  try {
    const { id, id_dossier, id_compte, id_exercice, mois, annee } = req.params;

    if (!id || !id_dossier || !id_compte || !id_exercice || !mois || !annee) {
      return res.status(400).json({ state: false, msg: 'Paramètres manquants' });
    }

    const where = {
      id: Number(id),
      id_dossier: Number(id_dossier),
      id_compte: Number(id_compte),
      id_exercice: Number(id_exercice),
      mois: Number(mois),
      annee: Number(annee),
    };
    console.log('[DELETE][ANNEXE][WHERE]', where);
    const deleted = await Annex.destroy({ where });
    if (deleted > 0) {
      return res.json({ state: true, msg: 'Supprimé avec succès' });
    }
    return res.json({ state: false, msg: 'Ligne introuvable' });
  } catch (err) {
    console.error('[Annexes] delete error:', err);
    return res.json({ state: false, msg: 'Erreur lors de la suppression' });
  }
};

////////////////CFISC
exports.listCFISC = async (req, res) => {
  try {
    // Accept either params-style or query-style to be compatible with route variants
    const dossierId = req.params.dossierId || req.query.dossierId;
    const exerciceId = req.params.exerciceId || req.query.exerciceId;
    const compteId = req.params.compteId || req.query.compteId;

    let resData = { state: false, msg: 'Erreur lors du traitement.', list: [] };

    const where = { id_dossier: dossierId };
    if (exerciceId) where.id_exercice = exerciceId;
    if (compteId) where.id_compte = compteId;

    const rows = await EtablCFISC.findAll({ where, order: [['id_cfisc', 'ASC']] });

    resData.state = true;
    resData.list = rows || [];
    return res.json(resData);
  } catch (err) {
    console.error('[CFISC] list error:', err);
    return res.json({ state: false, msg: 'Erreur serveur', list: [] });
  }
};

exports.updateMontantCFISC = async (req, res) => {
  try {
    const { id_cfisc } = req.params;
    const { montant } = req.body;

    let resData = { state: false, msg: 'Erreur lors de la mise à jour.' };

    const [count] = await EtablCFISC.update(
      { montant },
      { where: { id_cfisc } }
    );

    if (count > 0) {
      resData.state = true;
      resData.msg = 'Montant mis à jour avec succès';
    } else {
      resData.msg = "Ligne introuvable ou inchangée";
    }
    return res.json(resData);
  } catch (err) {
    console.error('[CFISC] update error:', err);
    return res.json({ state: false, msg: 'Erreur serveur' });
  }
};

//////////////////DGE
exports.listDGE = async (req, res) => {
  try {
    // Accept either params-style or query-style to be compatible with route variants
    const dossierId = req.params.dossierId || req.query.dossierId;
    const exerciceId = req.params.exerciceId || req.query.exerciceId;
    const compteId = req.params.compteId || req.query.compteId;

    let resData = { state: false, msg: 'Erreur lors du traitement.', list: [] };

    const where = { id_dossier: dossierId };
    if (exerciceId) where.id_exercice = exerciceId;
    if (compteId) where.id_compte = compteId;

    const rows = await EtablDGE.findAll({ where, order: [['id_dge', 'ASC']] });

    // Enrichir avec le groupe provenant de la matrice DGE
    let enriched = rows || [];
    try {
      const templates = await db.etatsDgeMatrices.findAll();
      const mapIdToGroupe = new Map((templates || []).map(t => [Number(t.id_dge), t.groupe || null]));
      enriched = (rows || []).map(r => {
        const o = typeof r.toJSON === 'function' ? r.toJSON() : r;
        const grp = mapIdToGroupe.get(Number(o.id_dge)) || null;
        return { ...o, groupe: grp };
      });
    } catch (e) {
      // si matrice indisponible, renvoyer sans groupe
      enriched = rows || [];
    }

    resData.state = true;
    resData.list = enriched;
    return res.json(resData);
  } catch (err) {
    console.error('[DGE] list error:', err);
    return res.json({ state: false, msg: 'Erreur serveur', list: [] });
  }
};

exports.updateMontantDGE = async (req, res) => {
  try {
    const { id_dge } = req.params;
    const { montant } = req.body;

    let resData = { state: false, msg: 'Erreur lors de la mise à jour.' };

    const [count] = await EtablDGE.update(
      { montant },
      { where: { id_dge } }
    );

    if (count > 0) {
      resData.state = true;
      resData.msg = 'Montant mis à jour avec succès';
    } else {
      resData.msg = "Ligne introuvable ou inchangée";
    }
    return res.json(resData);
  } catch (err) {
    console.error('[DGE] update error:', err);
    return res.json({ state: false, msg: 'Erreur serveur' });
  }
};

// -------------------------
// EXPORT XML ANNEXES TVA
// -------------------------
exports.exportTvaXml = async (req, res) => {
  try {
    const { id_dossier, id_compte, id_exercice, mois, annee } = req.params;
    if (!id_dossier || !id_compte || !id_exercice || !mois || !annee) {
      return res.status(400).json({ msg: 'Paramètres manquants', state: false });
    }

    const dossier = await Dossier.findByPk(id_dossier);
    const exercice = await db.exercices.findByPk(id_exercice);
    const compte = await db.userscomptes.findByPk(id_compte);

    if (!dossier) {
      return res.status(400).json({ msg: 'Dossier non trouvé', state: false });
    }
    if (!exercice) {
      return res.status(400).json({ msg: 'Exercice non trouvé', state: false });
    }
    if (!compte) {
      return res.status(400).json({ msg: 'Compte non trouvé', state: false });
    }

    let nif = String(dossier?.nif || '').trim();
    if (!nif) return res.status(400).json({ state: false, msg: "Veuillez renseigner le NIF dans les informations du dossier." });

    const xml = await generateTvaXml(id_compte, id_dossier, id_exercice, mois, annee, nif);

    const fname = `tva_${String(mois).padStart(2, '0')}-${annee}.xml`;
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Content-Disposition', `attachment; filename="${fname}"`);
    return res.end(xml);
  } catch (err) {
    console.error('[TVA][EXPORT_XML] error:', err);
    return res.status(500).json({ state: false, msg: "Erreur lors de la génération du XML" });
  }
};

// -------------------------
// EXPORT EXCEL ANNEXES TVA  
// -------------------------
exports.exportTvaTableExcel = async (req, res) => {
  try {
    const { id_dossier, id_compte, id_exercice, mois, annee } = req.params;
    if (!id_dossier || !id_compte || !id_exercice || !mois || !annee) {
      return res.status(400).json({ msg: 'Paramètres manquants', state: false });
    }

    const dossier = await Dossier.findByPk(id_dossier);
    const exercice = await db.exercices.findByPk(id_exercice);
    const compte = await db.userscomptes.findByPk(id_compte);

    if (!dossier) {
      return res.status(400).json({ msg: 'Dossier non trouvé', state: false });
    }
    if (!exercice) {
      return res.status(400).json({ msg: 'Exercice non trouvé', state: false });
    }
    if (!compte) {
      return res.status(400).json({ msg: 'Compte non trouvé', state: false });
    }

    const moisNoms = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];

    const formatDate = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return String(dateString);
      const dd = String(date.getDate()).padStart(2, '0');
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const yyyy = date.getFullYear();
      return `${dd}/${mm}/${yyyy}`;
    };

    const workbook = new ExcelJS.Workbook();

    await exportTvaTableExcel(id_compte, id_dossier, id_exercice, mois, annee, workbook, dossier?.dossier, compte?.nom, moisNoms[mois - 1], formatDate(exercice?.date_debut), formatDate(exercice?.date_fin));

    workbook.views = [
      { activeTab: 0 }
    ];

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=TVA_${mois}_${annee}.xlsx`
    );
    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    return res.status(500).json({
      state: false,
      message: "Erreur serveur", error: error.message
    });
  }
}

exports.exportTvaToPDF = async (req, res) => {
  try {
    const { id_dossier, id_compte, id_exercice, mois, annee } = req.params;
    if (!id_dossier || !id_compte || !id_exercice || !mois || !annee) {
      return res.status(400).json({ msg: 'Paramètres manquants', state: false });
    }
    const dossier = await Dossier.findByPk(id_dossier);
    const exercice = await db.exercices.findByPk(id_exercice);
    const compte = await db.userscomptes.findByPk(id_compte);
    if (!dossier) {
      return res.status(400).json({ msg: 'Dossier non trouvé', state: false });
    }
    if (!exercice) {
      return res.status(400).json({ msg: 'Exercice non trouvé', state: false });
    }
    if (!compte) {
      return res.status(400).json({ msg: 'Compte non trouvé', state: false });
    }
    const fonts = {
      Helvetica: {
        normal: 'Helvetica',
        bold: 'Helvetica-Bold',
        italics: 'Helvetica-Oblique',
        bolditalics: 'Helvetica-BoldOblique'
      }
    };
    const printer = new PdfPrinter(fonts);

    const moisNoms = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];

    const formatDate = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return String(dateString);
      const dd = String(date.getDate()).padStart(2, '0');
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const yyyy = date.getFullYear();
      return `${dd}/${mm}/${yyyy}`;
    };

    const { generateTvaContent } = require('../../../Middlewares/tva/DeclTvaGeneratePdf');
    const { buildTable, annexes } = await generateTvaContent(id_compte, id_dossier, id_exercice, mois, annee);

    const docDefinition = {
      pageSize: 'A3',
      pageOrientation: 'landscape',
      pageMargins: [10, 60, 10, 60],
      defaultStyle: {
        font: 'Helvetica',
        fontSize: 7
      },
      content: [
        {
          text: 'DÉCLARATION TVA',
          style: 'title',
          alignment: 'center',
          margin: [0, 0, 0, 20]
        },
        // Sous-titre
        {
          text: `Dossier : ${dossier?.dossier || ''}`,
          style: 'subTitle',
          lineHeight: 1.2,
          margin: [0, 0, 0, 10]
        },
        {
          text: `Mois et année : ${moisNoms[mois - 1]} ${annee}`,
          style: 'subTitleExo',
          lineHeight: 1.2,
          margin: [0, 0, 0, 8]
        },
        {
          text: `Exercice du : ${formatDate(exercice?.date_debut)} au ${formatDate(exercice?.date_fin)}`,
          style: 'subTitleExo',
          lineHeight: 1.2,
          margin: [0, 0, 0, 8]
        },
        {
          ...buildTable(annexes, {
            headerStyle: 'tableHeader',
            font: 'Helvetica'
          })[0],
          layout: {
            ...(
              buildTable(annexes, {
                headerStyle: 'tableHeader',
                font: 'Helvetica'
              })[0].layout || {}
            ),
            hLineWidth: () => 0, // pas de ligne horizontale
            vLineWidth: () => 0, // pas de ligne verticale
            paddingTop: () => 4,
            paddingBottom: () => 4
          }
        }
      ],
      background: function (currentPage, pageSize) {
        if (currentPage === 1) {
          return [
            {
              image: logoImage,
              width: 50,
              absolutePosition: { x: 10, y: 10 }
            }
          ];
        }
        return [];
      },
      styles: {
        title: { fontSize: 20, bold: true, alignment: 'center', font: 'Helvetica', margin: [0, 0, 0, 10] },
        subTitle: { fontSize: 14, bold: true, font: 'Helvetica', alignment: 'center' },
        subTitleExo: { fontSize: 10, bold: true, font: 'Helvetica', margin: [0, 0, 0, 8] },
        tableHeader: {
          bold: true,
          fontSize: 7,
          color: 'white',
          fillColor: '#1A5276',
          alignment: 'center',
          font: 'Helvetica',
          margin: [0, 2, 0, 2],
          lineHeight: 1.2
        },
      }
    }
    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="TVA_${mois}_${annee}.pdf"`);
    pdfDoc.pipe(res);
    pdfDoc.end();

  } catch (error) {
    return res.status(500).json({
      state: false,
      message: "Erreur serveur", error: error.message
    });
  }
}

// -------------------------
// INITIALISATION FORMULAIRES TVA
// -------------------------
exports.initializeCFISC = async (req, res) => {
  try {
    const { dossierId, compteId, exerciceId } = req.params;
    if (!dossierId || !compteId || !exerciceId) {
      return res.status(400).json({ state: false, msg: 'Paramètres manquants' });
    }

    const where = { id_dossier: Number(dossierId), id_compte: Number(compteId), id_exercice: Number(exerciceId) };
    const count = await EtablCFISC.count({ where });
    if (count > 0) {
      const existing = await EtablCFISC.findAll({ where, order: [['id_cfisc', 'ASC']] });
      return res.json({ state: true, msg: 'Déjà initialisé', list: existing });
    }

    // Alimenter depuis la matrice CFISC (table etatsCentresFiscalesmatrices)
    const templates = await db.etatsCentresFiscalesmatrices.findAll({ order: [['id_cfisc', 'ASC']] });
    if (!templates || templates.length === 0) {
      return res.status(400).json({ state: false, msg: 'Aucune matrice CFISC trouvée (etatsCentresFiscalesmatrices)' });
    }
    const payloads = templates.map((t) => ({
      id_cfisc: Number(t.id_cfisc),
      id_dossier: Number(dossierId),
      id_compte: Number(compteId),
      id_exercice: Number(exerciceId),
      libelle: t.libelle,
      montant: Number(t.montant) || 0
    }));
    await EtablCFISC.bulkCreate(payloads);
    const created = await EtablCFISC.findAll({ where, order: [['id_cfisc', 'ASC']] });
    return res.json({ state: true, msg: 'Formulaire CFISC initialisé', list: created });
  } catch (err) {
    console.error('[TVA][CFISC][INIT] error:', err);
    return res.status(500).json({ state: false, msg: 'Erreur serveur' });
  }
};

exports.initializeDGE = async (req, res) => {
  try {
    const { dossierId, compteId, exerciceId } = req.params;
    if (!dossierId || !compteId || !exerciceId) {
      return res.status(400).json({ state: false, msg: 'Paramètres manquants' });
    }

    const where = { id_dossier: Number(dossierId), id_compte: Number(compteId), id_exercice: Number(exerciceId) };
    const count = await EtablDGE.count({ where });
    if (count > 0) {
      const existing = await EtablDGE.findAll({ where, order: [['id_dge', 'ASC']] });
      return res.json({ state: true, msg: 'Déjà initialisé', list: existing });
    }

    // Alimenter depuis la matrice DGE (table dgematrices)
    const templates = await db.etatsDgeMatrices.findAll({ order: [['id_dge', 'ASC']] });
    if (!templates || templates.length === 0) {
      return res.status(400).json({ state: false, msg: 'Aucune matrice DGE trouvée (dgematrices)' });
    }
    const payloads = templates.map((t) => ({
      id_dge: Number(t.id_dge),
      id_dossier: Number(dossierId),
      id_compte: Number(compteId),
      id_exercice: Number(exerciceId),
      libelle: t.libelle,
      montant: Number(t.montant) || 0
    }));
    await EtablDGE.bulkCreate(payloads);
    const created = await EtablDGE.findAll({ where, order: [['id_dge', 'ASC']] });
    return res.json({ state: true, msg: 'Formulaire DGE initialisé', list: created });
  } catch (err) {
    console.error('[TVA][DGE][INIT] error:', err);
    return res.status(500).json({ state: false, msg: 'Erreur serveur' });
  }
};

exports.autoCalcDGEFromAnnexes = async (req, res) => {
  try {
    const { dossierId, compteId, exerciceId } = req.params;
    const { mois, annee, debug: debugBody } = req.body || {};
    const debug = Boolean(debugBody || req.query?.debug);
    if (!dossierId || !compteId || !exerciceId) {
      return res.status(400).json({ state: false, msg: 'Paramètres manquants' });
    }
    const result = await autoCalcDGE({ dossierId, compteId, exerciceId, mois, annee, debug });
    return res.json({ state: true, msg: 'Auto-calcul DGE effectué', ...result });
  } catch (err) {
    console.error('[TVA][DGE][AUTO_CALC] error:', err);
    return res.status(500).json({ state: false, msg: 'Erreur serveur' });
  }
};
// -------------------------
// FORMULAIRE TVA UNIFIE (DGE/CFISC)
// -------------------------
exports.listFormulaire = async (req, res) => {
  try {
    const dossierId = Number(req.params.dossierId || req.query.dossierId);
    const compteId = Number(req.params.compteId || req.query.compteId);
    const exerciceId = Number(req.params.exerciceId || req.query.exerciceId);
    const mois = req.query?.mois ? Number(req.query.mois) : null;
    const annee = req.query?.annee ? Number(req.query.annee) : null;
    if (!dossierId || !compteId || !exerciceId) {
      return res.status(400).json({ state: false, msg: 'Paramètres manquants', list: [] });
    }

    const where = { id_dossier: dossierId, id_compte: compteId, id_exercice: exerciceId };
    if (mois != null) where.mois = mois;
    if (annee != null) where.annee = annee;
    console.log('[FormTVA][LIST] params:', { dossierId, compteId, exerciceId, mois, annee });
    console.log('[FormTVA][LIST] where:', where);
    // Récupérer trié par code puis updatedAt DESC pour pouvoir dédupliquer
    const rows = await FormTva.findAll({ where, order: [['id_code', 'ASC'], ['updatedAt', 'DESC']] });

    // Dédupliquer par id_code: garder la plus récente (updatedAt DESC)
    const seen = new Set();
    const uniqueRows = [];
    for (const r of (rows || [])) {
      const code = Number(r.id_code);
      if (seen.has(code)) continue;
      seen.add(code);
      uniqueRows.push(r);
    }

    const templates = await FormTvaMatrices.findAll();
    const mapCodeToGroupe = new Map((templates || []).map(t => [Number(t.id_code), t.groupe || null]));

    const enriched = (uniqueRows || []).map(r => {
      const o = typeof r.toJSON === 'function' ? r.toJSON() : r;
      const grp = mapCodeToGroupe.get(Number(o.id_code)) || null;
      return { ...o, groupe: grp };
    });

    return res.json({ state: true, list: enriched, msg: 'OK' });
  } catch (err) {
    console.error('[FormTVA] list error:', err);
    return res.status(500).json({ state: false, msg: 'Erreur serveur', list: [] });
  }
};

exports.updateMontantFormulaire = async (req, res) => {
  try {
    const id_code = Number(req.params.id_code);
    const { id_dossier, id_compte, id_exercice, montant, mois, annee } = req.body || {};
    if (!id_code || !id_dossier || !id_compte || !id_exercice) {
      return res.status(400).json({ state: false, msg: 'Paramètres manquants' });
    }
    // Sécuriser l'update à la période sélectionnée uniquement
    const m = mois != null ? Number(mois) : null;
    const y = annee != null ? Number(annee) : null;
    if (m == null || y == null) {
      return res.status(400).json({ state: false, msg: 'Période (mois/annee) requise pour la mise à jour.' });
    }
    const chk = await assertPeriodInExercice(id_exercice, m, y);
    if (!chk.ok) {
      return res.status(400).json({ state: false, msg: 'Période hors bornes de l\'exercice.' });
    }
    const where = {
      id_code: Number(id_code),
      id_dossier: Number(id_dossier),
      id_compte: Number(id_compte),
      id_exercice: Number(id_exercice),
      mois: m,
      annee: y,
    };
    const [count] = await FormTva.update({ montant: Number(montant) || 0 }, { where });
    if (count > 0) return res.json({ state: true, msg: 'Montant mis à jour' });
    return res.json({ state: false, msg: 'Ligne introuvable ou inchangée' });
  } catch (err) {
    console.error('[FormTVA] update error:', err);
    return res.status(500).json({ state: false, msg: 'Erreur serveur' });
  }
};

exports.initializeFormulaire = async (req, res) => {
  try {
    const dossierId = Number(req.params.dossierId);
    const compteId = Number(req.params.compteId);
    const exerciceId = Number(req.params.exerciceId);
    const mois = req.body?.mois != null ? Number(req.body.mois) : (req.query?.mois != null ? Number(req.query.mois) : null);
    const annee = req.body?.annee != null ? Number(req.body.annee) : (req.query?.annee != null ? Number(req.query.annee) : null);
    if (!dossierId || !compteId || !exerciceId) {
      return res.status(400).json({ state: false, msg: 'Paramètres manquants' });
    }
    const where = { id_dossier: dossierId, id_compte: compteId, id_exercice: exerciceId };
    if (mois != null) where.mois = mois;
    if (annee != null) where.annee = annee;
    console.log('[FormTVA][INIT] params:', { dossierId, compteId, exerciceId, mois, annee });
    console.log('[FormTVA][INIT] where:', where);

    // Validation de période par rapport à l'exercice
    const chkInit = await assertPeriodInExercice(exerciceId, mois, annee);
    if (!chkInit.ok) {
      return res.status(400).json({ state: false, msg: 'Période hors bornes de l\'exercice.' });
    }
    // Si une période est fournie, tenter d'abord de réutiliser les lignes placeholder (mois/annee NULL)
    if (mois != null && annee != null) {
      const placeholderWhere = {
        id_dossier: dossierId,
        id_compte: compteId,
        id_exercice: exerciceId,
        mois: { [Op.is]: null },
        annee: { [Op.is]: null },
      };
      const placeholderCount = await FormTva.count({ where: placeholderWhere });
      if (placeholderCount > 0) {
        // Mettre à jour les placeholders vers la période demandée
        await FormTva.update({ mois: mois, annee: annee }, { where: placeholderWhere });
        const updated = await FormTva.findAll({ where, order: [['id_code', 'ASC']] });
        return res.json({ state: true, msg: 'Formulaire réaffecté à la période', list: updated });
      }
    }

    const count = await FormTva.count({ where });
    if (count > 0) {
      const existing = await FormTva.findAll({ where, order: [['id_code', 'ASC']] });
      return res.json({ state: true, msg: 'Déjà initialisé', list: existing });
    }
    const templates = await FormTvaMatrices.findAll({ order: [['id_code', 'ASC']] });
    const payloads = templates.map(t => ({
      id_code: Number(t.id_code),
      libelle: t.libelle,
      montant: 0,
      id_compte: compteId,
      id_dossier: dossierId,
      id_exercice: exerciceId,
      mois: mois == null ? null : mois,
      annee: annee == null ? null : annee,
    }));
    console.log('[FormTVA][INIT] creating rows:', payloads.length);
    try {
      await FormTva.bulkCreate(payloads);
    } catch (e) {
      // Handle potential race/unique conflicts gracefully
      console.warn('[FormTVA][INIT] bulkCreate error, attempting graceful recovery:', e?.message || e);
      if (e?.name === 'SequelizeUniqueConstraintError') {
        const existing = await FormTva.findAll({ where, order: [['id_code', 'ASC']] });
        return res.json({ state: true, msg: 'Déjà initialisé (conflit d\'unicité géré)', list: existing });
      }
      throw e;
    }
    const created = await FormTva.findAll({ where, order: [['id_code', 'ASC']] });
    return res.json({ state: true, msg: 'Formulaire initialisé', list: created });
  } catch (err) {
    // Log detailed diagnostics for troubleshooting
    try {
      console.error('[TVA][FORM][INIT] error message:', err?.message);
      if (err?.stack) console.error('[TVA][FORM][INIT] stack:', err.stack);
      if (err?.parent) {
        console.error('[TVA][FORM][INIT] parent.detail:', err.parent?.detail);
        console.error('[TVA][FORM][INIT] parent.constraint:', err.parent?.constraint);
        console.error('[TVA][FORM][INIT] parent.code:', err.parent?.code);
      }
    } catch { }
    // Graceful fallback for unique conflicts
    if (err?.name === 'SequelizeUniqueConstraintError') {
      try {
        const dossierId = Number(req.params.dossierId);
        const compteId = Number(req.params.compteId);
        const exerciceId = Number(req.params.exerciceId);
        const mois = req.body?.mois != null ? Number(req.body.mois) : (req.query?.mois != null ? Number(req.query.mois) : null);
        const annee = req.body?.annee != null ? Number(req.body.annee) : (req.query?.annee != null ? Number(req.query.annee) : null);
        const where = { id_dossier: dossierId, id_compte: compteId, id_exercice: exerciceId };
        if (mois != null) where.mois = mois;
        if (annee != null) where.annee = annee;
        const existing = await FormTva.findAll({ where, order: [['id_code', 'ASC']] });
        return res.json({ state: true, msg: 'Déjà initialisé (conflit d\'unicité)', list: existing });
      } catch { }
    }
    return res.status(500).json({ state: false, msg: 'Erreur serveur' });
  }
};

exports.autoCalcFormulaireFromAnnexes = async (req, res) => {
  try {
    const { dossierId, compteId, exerciceId } = req.params;
    const { mois, annee, debug: debugBody, includeAnoms, resetManual } = req.body || {};
    const debug = Boolean(debugBody || req.query?.debug);
    if (!dossierId || !compteId || !exerciceId) {
      return res.status(400).json({ state: false, msg: 'Paramètres manquants' });
    }
    // Validation de période par rapport à l'exercice
    const chkAuto = await assertPeriodInExercice(exerciceId, mois, annee);
    if (!chkAuto.ok) {
      return res.status(400).json({ state: false, msg: 'Période hors bornes de l\'exercice.' });
    }
    const result = await autoCalcUnified({ dossierId, compteId, exerciceId, mois, annee, debug });

    if (resetManual === true || String(resetManual).toLowerCase() === 'true') {
      try {
        // Récupérer les codes du groupe 04 depuis la matrice
        const matrices = await db.formulaireTvaAnnexesMatrices.findAll();
        const codesG04 = (matrices || [])
          .filter(t => String(t?.groupe || '').trim() === '04')
          .map(t => Number(t.id_code))
          .filter(Boolean);

        if (codesG04.length > 0) {
          const whereReset = {
            id_dossier: Number(dossierId),
            id_compte: Number(compteId),
            id_exercice: Number(exerciceId),
            id_code: { [db.Sequelize.Op.in]: codesG04 },
          };
          if (mois != null) whereReset.mois = Number(mois);
          if (annee != null) whereReset.annee = Number(annee);

          const [count] = await db.formulaireTvaAnnexes.update(
            { montant: 0 },
            { where: whereReset }
          );
          if (debug) console.log('[AUTO-CALC] reset groupe 04 -> lignes mises à 0:', count);
        }
      } catch (e) {
        console.warn('[AUTO-CALC] reset groupe 04 échoué (non bloquant):', e?.message || e);
      }
    }

    // Optionnel: inclure le calcul d'anomalies (sans persistance)
    let anomaliesBlock = undefined;
    try {
      const want = (includeAnoms === true) || (String(includeAnoms).toLowerCase() === 'true') || (req.query?.includeAnoms === 'true');
      if (want) {
        const formWhere = { id_dossier: Number(dossierId), id_compte: Number(compteId), id_exercice: Number(exerciceId) };
        if (mois != null) formWhere.mois = Number(mois);
        if (annee != null) formWhere.annee = Number(annee);
        const formRows = await FormTva.findAll({ where: formWhere, order: [['id_code', 'ASC']] });
        const templates = await FormTvaMatrices.findAll();
        const mapCodeToGroupe = new Map((templates || []).map(t => [Number(t.id_code), t.groupe || null]));

        const whereA = { id_dossier: Number(dossierId), id_compte: Number(compteId), id_exercice: Number(exerciceId), mois: Number(mois), annee: Number(annee) };
        const annexRows = await Annex.findAll({ where: whereA, order: [['date_facture', 'ASC']] });
        const getTotalTva = (codeId) => {
          const normId = String(Number(codeId));
          const det = (annexRows || []).filter(a => {
            const code = String(a.code_tva || '').trim();
            const norm = (code.match(/\d+/) ? String(Number(code.match(/\d+/)[0])) : '');
            return norm === normId;
          });
          return det.reduce((acc, r) => acc + (Number(r.montant_tva) || 0), 0);
        };
        const closeTo = (a, b) => {
          const A = Math.round((Number(a || 0)) * 100) / 100;
          const B = Math.round((Number(b || 0)) * 100) / 100;
          const absMax = Math.max(1, Math.abs(A), Math.abs(B));
          const tol = Math.max(0.01, 0.005 * absMax);
          return Math.abs(A - B) <= tol;
        };
        const fmt = (n) => {
          const v = Number(n || 0);
          return v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        };
        const anoms = [];
        // Build map for formula computation
        const mapCodeToAmount = new Map((formRows || []).map(r => [Number(r.id_code), Number(r.montant) || 0]));
        const computeFormulaExpected = (code) => {
          const f = formulas[code];
          if (!f) return null;
          if (Array.isArray(f)) return f.reduce((acc, c) => acc + (Number(mapCodeToAmount.get(Number(c)) || 0)), 0);
          if (f && Array.isArray(f.terms)) return f.terms.reduce((acc, t) => acc + (Number(mapCodeToAmount.get(Number(t.id)) || 0) * Number(t.w)), 0);
          return null;
        };
        for (const r of (formRows || [])) {
          const idCode = Number(r.id_code);
          const grp = mapCodeToGroupe.get(idCode) || null;
          const actual = Math.round((Number(r.montant) || 0) * 100) / 100;
          // Details anomalies: only for groupes 02/03
          if (grp === '01' || grp === '02' || grp === '03') {
            const expected = Math.round(getTotalTva(idCode) * 100) / 100;
            if (!closeTo(expected, actual)) {
              const diff = Math.abs(expected - actual);
              if (debug) console.log('[ANOMS][DETAILS][AUTO]', { code: idCode, groupe: grp, expected, actual, diff, ctx: { dossierId, compteId, exerciceId, mois, annee } });
              anoms.push({
                code: idCode,
                groupe: grp,
                expected,
                actual,
                diff,
                kind: 'details',
                message: `- Total TVA "code ${idCode}" Détails = ${fmt(expected)}\n- Total TVA "code ${idCode}" = ${fmt(actual)}\n- Ecart = ${fmt(diff)}`,
              });
            }
          }
          // Formula anomalies: for any code that has a formula definition
          const expFormula = computeFormulaExpected(idCode);
          if (expFormula != null) {
            const expRounded = Math.round(Number(expFormula) * 100) / 100;
            if (!closeTo(expRounded, actual)) {
              const diff2 = Math.abs(expRounded - actual);
              const f = formulas[idCode];
              let breakdown = '';
              if (Array.isArray(f)) breakdown = `${idCode} = ${f.join(' + ')}`;
              else if (f && Array.isArray(f.terms)) breakdown = `${idCode} = ${f.terms.map(t => `${(Number(t.w) * 100).toFixed(0)}% de ${t.id}`).join(' + ')}`;
              if (debug) console.log('[ANOMS][FORMULA][AUTO]', { code: idCode, groupe: grp, expected: expRounded, actual, diff: diff2, breakdown, ctx: { dossierId, compteId, exerciceId, mois, annee } });
              anoms.push({
                code: idCode,
                groupe: grp,
                expected: expRounded,
                actual,
                diff: diff2,
                kind: 'formula',
                message: `- Montant attendu par formule (code ${idCode}) = ${fmt(expRounded)}\n- Montant formulaire (code ${idCode}) = ${fmt(actual)}\n- Ecart = ${fmt(diff2)}${breakdown ? `\n- Formule: ${breakdown}` : ''}`,
              });
            }
          }
        }
        anoms.sort((a, b) => (String(a.groupe).localeCompare(String(b.groupe)) || (Number(a.code) - Number(b.code))));
        anomaliesBlock = { count: anoms.length, list: anoms };
      }
    } catch (e) {
      // ne bloque pas la réponse principale
      anomaliesBlock = { count: 0, list: [], error: 'compute_failed' };
    }

    return res.json({ state: true, msg: 'Auto-calcul Formulaire effectué', ...result, anomalies: anomaliesBlock });
  } catch (err) {
    console.error('[TVA][FORM][AUTO_CALC] error:', err);
    return res.status(500).json({ state: false, msg: 'Erreur serveur' });
  }
};