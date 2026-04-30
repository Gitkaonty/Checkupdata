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
    order: [['id_ecriture', 'ASC'], ['dateecriture', 'ASC'], [codejournals, 'code', 'ASC']]
  });

  // Return plain objects for ease of use
  return list.map(r => (r?.get ? r.get({ plain: true }) : r));
}

function buildTable(data) {
  const body = [];

  // En-têtes stylés (comme IRSA)
  body.push([
    { text: 'Date', style: 'tableHeader' },
    { text: 'Journal', style: 'tableHeader' },
    { text: 'Compte', style: 'tableHeader' },
    { text: 'Libellé', style: 'tableHeader' },
    { text: 'Pièce', style: 'tableHeader' },
    { text: 'Lettrage', style: 'tableHeader' },
    { text: 'Devise', style: 'tableHeader' },
    { text: 'Débit', style: 'tableHeader' },
    { text: 'Crédit', style: 'tableHeader' },
  ]);

  // Formateurs
  const fmtAmount = (value) => {
    if (value == null) return '0.00';
    return Number(value)
      .toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      .replace(/\u202F/g, ' ');
  };

  let totD = 0, totC = 0;

  data.forEach(r => {
    totD += Number(r.debit || 0);
    totC += Number(r.credit || 0);
    const dateObj = r.dateecriture ? new Date(r.dateecriture) : null;
    const dd = dateObj ? String(dateObj.getDate()).padStart(2, '0') : '';
    const mm = dateObj ? String(dateObj.getMonth() + 1).padStart(2, '0') : '';
    const yyyy = dateObj ? dateObj.getFullYear() : '';
    body.push([
      { text: `${dd}/${mm}/${yyyy}`, alignment: 'center', margin: [0,2,0,2] },
      { text: r.codejournal?.code || '', alignment: 'left', margin: [0,2,0,2] },
      { text: r.dossierplancomptables?.compte || '', alignment: 'left', margin: [0,2,0,2] },
      { text: r.libelle || '', alignment: 'left', margin: [0,2,0,2], noWrap: false },
      { text: r.piece || '', alignment: 'left', margin: [0,2,0,2] },
      { text: r.lettrage || '', alignment: 'center', margin: [0,2,0,2] },
      { text: r.devise || '', alignment: 'center', margin: [0,2,0,2] },
      { text: fmtAmount(r.debit), alignment: 'right', margin: [0,2,0,2] },
      { text: fmtAmount(r.credit), alignment: 'right', margin: [0,2,0,2] },
    ]);
  });

  // Ligne TOTAL avec fond
  body.push([
    { text: 'TOTAL', bold: true, alignment: 'right', margin: [0,2,0,2], fillColor: '#89A8B2', colSpan: 7 },
    { text: '', fillColor: '#89A8B2' },
    { text: '', fillColor: '#89A8B2' },
    { text: '', fillColor: '#89A8B2' },
    { text: '', fillColor: '#89A8B2' },
    { text: '', fillColor: '#89A8B2' },
    { text: '', fillColor: '#89A8B2' },
    { text: fmtAmount(totD), bold: true, alignment: 'right', margin: [0,2,0,2], fillColor: '#89A8B2' },
    { text: fmtAmount(totC), bold: true, alignment: 'right', margin: [0,2,0,2], fillColor: '#89A8B2' },
  ]);

  return [
    {
      table: {
        headerRows: 1,
        widths: ['10%', '10%', '12%', '*', '12%', '10%', '8%', '12%', '12%'],
        body
      },
      layout: 'lightHorizontalLines'
    }
  ];
}

async function generateJournalContent(id_compte, id_dossier, id_exercice, journalCodes, dateDebut, dateFin) {
  const list = await getJournalRows(id_compte, id_dossier, id_exercice, journalCodes, dateDebut, dateFin);
  return { buildTable, list };
}

module.exports = { generateJournalContent };
