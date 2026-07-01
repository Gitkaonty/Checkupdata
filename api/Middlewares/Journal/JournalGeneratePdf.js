const db = require("../../Models");
const Sequelize = require('sequelize');
const { Op } = require('sequelize');

const journals = db.journals;
const dossierplancomptables = db.dossierplancomptables;
const codejournals = db.codejournals;

async function getJournalRows(id_compte, id_dossier, id_exercice, journalCodes, dateDebut, dateFin) {
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
      { model: dossierplancomptables, attributes: ['compte', 'libelle'], required: false },
      { model: codejournals, attributes: ['code'], required: Array.isArray(journalCodes) && journalCodes.length > 0, where: (Array.isArray(journalCodes) && journalCodes.length > 0) ? { code: { [Op.in]: journalCodes } } : undefined }
    ],
    // Tri : journal, puis date, puis numéro d'écriture
    order: [[codejournals, 'code', 'ASC'], ['dateecriture', 'ASC'], ['id_ecriture', 'ASC'], ['id', 'ASC']]
  });

  // Return plain objects for ease of use
  return list.map(r => (r?.get ? r.get({ plain: true }) : r));
}

const fmtAmount = (value) => {
  if (value == null) return '0.00';
  return String(Number(value)
    .toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))
    .replace(/[  ]/g, ' ')
    .replace(/ /g, ' ');
};

// Construit le corps du tableau + les métadonnées de séparation par écriture
function buildJournalTable(data) {
  const widths = ['9%', '6%', '11%', '*', '11%', '7%', '6%', '12%', '12%'];

  const header = [
    { text: 'Date', style: 'tableHeader' },
    { text: 'Journal', style: 'tableHeader' },
    { text: 'Compte', style: 'tableHeader' },
    { text: 'Libellé', style: 'tableHeader' },
    { text: 'Pièce', style: 'tableHeader' },
    { text: 'Lettrage', style: 'tableHeader' },
    { text: 'Devise', style: 'tableHeader' },
    { text: 'Débit', style: 'tableHeader' },
    { text: 'Crédit', style: 'tableHeader' },
  ];

  const body = [header];
  const boundaries = new Set(); // index de ligne (corps) où tracer un filet séparateur (au-dessus)
  const shaded = new Set();     // lignes à trame (écritures d'indice impair)

  let totD = 0, totC = 0;
  let prevEcr;
  let group = -1;

  (data || []).forEach((r, idx) => {
    const ecr = String(r.id_ecriture ?? `__${idx}`);
    const rowIndex = body.length;

    // Nouvelle écriture -> nouveau groupe + séparateur
    if (idx === 0 || ecr !== prevEcr) {
      group += 1;
      if (idx > 0) boundaries.add(rowIndex);
    }
    prevEcr = ecr;
    if (group % 2 === 1) shaded.add(rowIndex);

    totD += Number(r.debit || 0);
    totC += Number(r.credit || 0);

    const dateObj = r.dateecriture ? new Date(r.dateecriture) : null;
    const dd = dateObj ? String(dateObj.getDate()).padStart(2, '0') : '';
    const mm = dateObj ? String(dateObj.getMonth() + 1).padStart(2, '0') : '';
    const yyyy = dateObj ? dateObj.getFullYear() : '';

    body.push([
      { text: dateObj ? `${dd}/${mm}/${yyyy}` : '', alignment: 'center', margin: [0, 2, 0, 2] },
      { text: r.codejournal?.code || '', alignment: 'left', margin: [0, 2, 0, 2] },
      { text: r.compteaux || r.comptegen || r.dossierplancomptable?.compte || '', alignment: 'left', margin: [0, 2, 0, 2] },
      { text: r.libelle || '', alignment: 'left', margin: [0, 2, 0, 2], noWrap: false },
      { text: r.piece || '', alignment: 'left', margin: [0, 2, 0, 2] },
      { text: r.lettrage || '', alignment: 'center', margin: [0, 2, 0, 2] },
      { text: r.devise || '', alignment: 'center', margin: [0, 2, 0, 2] },
      { text: fmtAmount(r.debit), alignment: 'right', margin: [0, 2, 0, 2] },
      { text: fmtAmount(r.credit), alignment: 'right', margin: [0, 2, 0, 2] },
    ]);
  });

  // Ligne TOTAL (séparateur au-dessus)
  boundaries.add(body.length);
  body.push([
    { text: 'TOTAL', bold: true, alignment: 'right', margin: [0, 3, 0, 3], fillColor: '#CFE6E4', colSpan: 7 },
    { text: '', fillColor: '#CFE6E4' },
    { text: '', fillColor: '#CFE6E4' },
    { text: '', fillColor: '#CFE6E4' },
    { text: '', fillColor: '#CFE6E4' },
    { text: '', fillColor: '#CFE6E4' },
    { text: '', fillColor: '#CFE6E4' },
    { text: fmtAmount(totD), bold: true, alignment: 'right', margin: [0, 3, 0, 3], fillColor: '#CFE6E4' },
    { text: fmtAmount(totC), bold: true, alignment: 'right', margin: [0, 3, 0, 3], fillColor: '#CFE6E4' },
  ]);

  return { header, body, widths, boundaries, shaded };
}

async function generateJournalContent(id_compte, id_dossier, id_exercice, journalCodes, dateDebut, dateFin) {
  const list = await getJournalRows(id_compte, id_dossier, id_exercice, journalCodes, dateDebut, dateFin);
  return { buildJournalTable, list };
}

module.exports = { generateJournalContent };
