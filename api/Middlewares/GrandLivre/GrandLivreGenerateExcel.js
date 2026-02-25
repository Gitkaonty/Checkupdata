const db = require('../../Models');
require('dotenv').config();
const { Op } = require('sequelize');
const path = require('path');

const logoPath = path.join(__dirname, `../../public/logo/${process.env.LOGO_EXPORT}`);

const journals = db.journals;
const dossierplancomptable = db.dossierplancomptable;
const codejournals = db.codejournals;

function fmtDate(dateString) {
  if (!dateString) return '';
  const d = new Date(dateString);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

async function getRows(id_compte, id_dossier, id_exercice, journalCodes, dateDebut, dateFin) {
  const where = {
    id_compte: Number(id_compte),
    id_dossier: Number(id_dossier),
    id_exercice: Number(id_exercice)
  };
  if (dateDebut && dateFin) {
    where.dateecriture = { [Op.between]: [new Date(dateDebut), new Date(dateFin)] };
  } else if (dateDebut) {
    where.dateecriture = { [Op.gte]: new Date(dateDebut) };
  } else if (dateFin) {
    where.dateecriture = { [Op.lte]: new Date(dateFin) };
  }

  const list = await journals.findAll({
    where,
    include: [
      { model: dossierplancomptable, attributes: ['compte', 'libelle'], required: true },
      { model: codejournals, attributes: ['code'], required: Array.isArray(journalCodes) && journalCodes.length > 0, where: (Array.isArray(journalCodes) && journalCodes.length > 0) ? { code: { [Op.in]: journalCodes } } : undefined }
    ],
    order: [[dossierplancomptable, 'compte', 'ASC'], ['dateecriture', 'ASC'], ['id_ecriture', 'ASC'], ['id', 'ASC']]
  });

  return list.map(r => (r?.get ? r.get({ plain: true }) : r));
}

function groupByAccount(rows) {
  const groups = new Map();
  rows.forEach(r => {
    const compte = r?.dossierplancomptable?.compte || 'INCONNU';
    const libelle = r?.dossierplancomptable?.libelle || '';
    if (!groups.has(compte)) groups.set(compte, { libelle, rows: [] });
    groups.get(compte).rows.push(r);
  });
  // Remove accounts without rows (defensive)
  for (const [k, v] of groups) {
    if (!v.rows || v.rows.length === 0) groups.delete(k);
  }
  return groups;
}

async function exportGrandLivreTableExcel(
  id_compte,
  id_dossier,
  id_exercice,
  journalCodes,
  dateDebut,
  dateFin,
  workbook,
  dossierName,
  compteName,
  exStart,
  exEnd
) {
  const rows = await getRows(id_compte, id_dossier, id_exercice, journalCodes, dateDebut, dateFin);
  const groups = groupByAccount(rows);

  const ws = workbook.addWorksheet('Grand Livre');

  const logoId = workbook.addImage({
    filename: logoPath,
    extension: 'png',
  });

  // === Colonnes ===
  ws.columns = [
    { key: 'date', width: 12 },
    { key: 'jal', width: 8 },
    { key: 'piece', width: 16 },
    { key: 'let', width: 10 },
    { key: 'intitule', width: 50 },
    { key: 'debit', width: 16, style: { numFmt: '#,##0.00' } },
    { key: 'credit', width: 16, style: { numFmt: '#,##0.00' } },
    { key: 'solde', width: 16, style: { numFmt: '#,##0.00' } },
  ];

  // === TITRE GLOBAL centré sur les colonnes du tableau ===

  ws.mergeCells('A1:H1');
  const titleCell = ws.getCell('A1');
  titleCell.value = 'GRAND LIVRE';
  titleCell.font = { bold: true, size: 16 };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

  ws.addImage(logoId, {
    tl: { x: 10, y: 5 },
    ext: { width: 55, height: 55 },
    editAs: 'absolute',
  });

  // ====== Ligne 2 : Dossier centré sous le titre ======
  ws.mergeCells('A2:H2');
  const dossierCell = ws.getCell('A2');
  dossierCell.value = `Dossier : ${dossierName || ''}`;
  dossierCell.font = { italic: true, bold: true, size: 14, color: { argb: 'FF555555' } };
  dossierCell.alignment = { horizontal: 'center', vertical: 'middle' };

  // ====== Ligne 3 : Période alignée à gauche ======
  ws.mergeCells('A3:H3');
  const periodeCell = ws.getCell('A3');
  periodeCell.value = `Période du : ${fmtDate(exStart) || ''} au ${fmtDate(exEnd) || ''}`;
  periodeCell.font = { italic: true, size: 12, color: { argb: 'FF555555' } };
  periodeCell.alignment = { horizontal: 'left', vertical: 'middle' };

  // Espace visuel avant le tableau
  ws.addRow([]);


  // === ENTÊTE DU TABLEAU ===
  const header = ['Date', 'Jrnl', 'Pièce', 'Let', 'Libellé', 'Débit', 'Crédit', 'Solde'];
  const headerRow = ws.addRow(header);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { horizontal: 'center' };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1A5276' }, // bleu foncé uniquement sur la ligne du tableau
    };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF000000' } },
      left: { style: 'thin', color: { argb: 'FF000000' } },
      right: { style: 'thin', color: { argb: 'FF000000' } },
      bottom: { style: 'thin', color: { argb: 'FF000000' } },
    };
  });

  // Accumulateurs totaux généraux
  let grandDebit = 0;
  let grandCredit = 0;
  let grandSolde = 0;

  // === DONNÉES PAR COMPTE ===
  for (const [compte, info] of groups) {

    const accRow = ws.addRow([compte, '', '', '', info.libelle || '', '', '', '']);

    ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].forEach(col => {
      const c = ws.getCell(`${col}${accRow.number}`);
      if (col === 'A') c.value = compte;
      if (col === 'E') c.value = info.libelle || '';
      c.font = { bold: true, size: 12, color: { argb: 'FF1A5276' } };
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F4FA' } };
      c.alignment = { horizontal: (col === 'A' ? 'left' : col === 'E' ? 'center' : 'right'), vertical: 'middle' };
      c.border = {
        top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        right: { style: 'thin', color: { argb: 'FFCCCCCC' } },
      };
    });

    // Écritures du compte (même tri et calcul que PDF)
    const rowsSorted = Array.isArray(info.rows)
      ? [...info.rows].sort((a, b) => {
        const iea = Number(a.id_ecriture || 0);
        const ieb = Number(b.id_ecriture || 0);
        if (iea !== ieb) return iea - ieb;
        const da = new Date(a.dateecriture || 0).getTime();
        const db = new Date(b.dateecriture || 0).getTime();
        if (da !== db) return da - db;
        const ja = (a.codejournal && a.codejournal.code) ? String(a.codejournal.code) : '';
        const jb = (b.codejournal && b.codejournal.code) ? String(b.codejournal.code) : '';
        return ja.localeCompare(jb);
      })
      : [];

    let running = null;
    let sumDebit = 0;
    let sumCredit = 0;
    for (const r of rowsSorted) {
      const d = Number(r.debit || 0);
      const c = Number(r.credit || 0);
      running = running === null ? d - c : running + d - c;
      sumDebit += d;
      sumCredit += c;

      const row = ws.addRow({
        date: fmtDate(r.dateecriture),
        jal: r.codejournal?.code || '',
        piece: r.piece || '',
        let: r.lettrage || '',
        intitule: r.libelle || '',
        debit: Number(r.debit || 0),
        credit: Number(r.credit || 0),
        solde: Number(running),
      });

      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
          left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
          right: { style: 'thin', color: { argb: 'FFE0E0E0' } },
          bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        };
      });
    }

    // Ligne sous-total (uniquement sur Débit, Crédit, Solde)
    const subTotalRow = ws.addRow(['', '', '', '', '', sumDebit, sumCredit, running]);

    ['F', 'G', 'H'].forEach(col => {
      const cell = subTotalRow.getCell(col);
      cell.font = { bold: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD6EAF8' } };
      // cell.alignment = { horizontal: 'right' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        right: { style: 'thin', color: { argb: 'FFCCCCCC' } },
      };
    });

    // Centrer le texte "Sous-total" dans la colonne Intitulé
    // const intituleCell = subTotalRow.getCell('E');
    // intituleCell.value = 'Sous-total';
    // intituleCell.alignment = { horizontal: 'center' };
    // intituleCell.font = { bold: true };


    // Accumulation des totaux généraux
    grandDebit += sumDebit;
    grandCredit += sumCredit;
    grandSolde += running; // équivalent à (sumDebit - sumCredit) si running repart de 0 par compte

    ws.addRow([]); // espace entre comptes
  }

  // Ligne TOTAL GENERAL
  const grandTotalRow = ws.addRow(['', '', '', '', 'TOTAL', grandDebit, grandCredit, grandSolde]);
  grandTotalRow.eachCell((cell, colNumber) => {
    cell.font = { bold: true };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFB3DAF1' } };
    cell.alignment = { horizontal: (colNumber >= 6 ? 'right' : (colNumber === 5 ? 'center' : 'center')) };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF999999' } },
      bottom: { style: 'thin', color: { argb: 'FF999999' } },
      left: { style: 'thin', color: { argb: 'FF999999' } },
      right: { style: 'thin', color: { argb: 'FF999999' } },
    };
  });

  // Alignement à droite pour les montants
  // ['F', 'G', 'H'].forEach((col) => {
  //   ws.getColumn(col).alignment = { horizontal: 'right' };
  // });
}

module.exports = { exportGrandLivreTableExcel };
