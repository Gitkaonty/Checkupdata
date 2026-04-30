const db = require('../../Models');
const { Op } = require('sequelize');

const journals = db.journals;
const dossierplancomptables = db.dossierplancomptables;
const codejournals = db.codejournals;

function formatAmount(value) {
  if (value == null) return '0.00';
  return Number(value)
    .toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    .replace(/\u202F/g, ' ');
}

function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return String(dateString);
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

async function getRows(id_compte, id_dossier, id_exercice, compteAux, dateDebut, dateFin) {
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
  // Filtre par compteaux si sélectionné
  if (Array.isArray(compteAux) && compteAux.length > 0) {
    where.compteaux = { [Op.in]: compteAux };
  }

  const list = await journals.findAll({
    where,
    include: [
      { model: dossierplancomptables, attributes: ['compte', 'libelle'], required: true },
      { model: codejournals, attributes: ['code'], required: false }
    ],
    order: [[dossierplancomptables, 'compte', 'ASC'], ['dateecriture', 'ASC'], ['id_ecriture', 'ASC'], ['id', 'ASC']]
  });

  return list.map(r => (r?.get ? r.get({ plain: true }) : r));
}

function groupByAccount(rows) {
  const groups = {};
  rows.forEach(r => {
    const cpt = r?.dossierplancomptable?.compte || r?.dossierplancomptables?.compte || 'INCONNU';
    if (!groups[cpt]) {
      groups[cpt] = { libelle: r?.dossierplancomptable?.libelle || r?.dossierplancomptables?.libelle || '', rows: [] };
    }
    groups[cpt].rows.push(r);
  });
  return groups;
}

function buildSections(groups) {
  const sections = [];

  const headerRow = [
    { text: 'Date', style: 'tableHeader' },
    { text: 'Journal', style: 'tableHeader' },
    { text: 'Pièce', style: 'tableHeader' },
    { text: 'Libellé', style: 'tableHeader' },
    { text: 'Lettr.', style: 'tableHeader' },
    { text: 'Débit', style: 'tableHeader' },
    { text: 'Crédit', style: 'tableHeader' },
    { text: 'Solde', style: 'tableHeader' }
  ];

  const body = [];
  body.push(headerRow);

  let totalGlobalDebit = 0;
  let totalGlobalCredit = 0;
  let totalGlobalSolde = 0;

  Object.entries(groups).forEach(([compte, info]) => {
    // Ligne du compte + libellé
    body.push([
      { text: compte, alignment: 'left', fillColor: '#D4E6F1', fontSize: 6, margin: [4, 2, 0, 2] },
      { text: info.libelle || '', alignment: 'center', colSpan: 6, fillColor: '#D4E6F1', fontSize: 6, margin: [0, 2, 0, 2] },
      {}, {}, {}, {}, {},
      { text: '', fillColor: '#D4E6F1', border: [false, false, false, false] }
    ]);


    // Tri: id_ecriture, puis date, puis code journal
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

    rowsSorted.forEach(r => {
      const d = Number(r.debit || 0);
      const c = Number(r.credit || 0);
      sumDebit += d;
      sumCredit += c;
      running = running === null ? d - c : running + d - c;

      body.push([
        { text: formatDate(r.dateecriture), alignment: 'center', fontSize: 6, margin: [0, 2, 0, 2], border: [false, false, false, false] },
        { text: r.codejournal?.code || '', alignment: 'center', fontSize: 6, margin: [0, 2, 0, 2], border: [false, false, false, false] },
        { text: r.piece || '', alignment: 'left', fontSize: 6, margin: [0, 2, 0, 2], border: [false, false, false, false] },
        { text: r.libelle || '', alignment: 'left', fontSize: 6, margin: [0, 2, 0, 2], noWrap: false, border: [false, false, false, false] },
        { text: r.lettrage || '', alignment: 'center', fontSize: 6, margin: [0, 2, 0, 2], border: [false, false, false, false] },
        { text: formatAmount(r.debit), alignment: 'right', fontSize: 6, margin: [0, 2, 0, 2], border: [false, false, false, false] },
        { text: formatAmount(r.credit), alignment: 'right', fontSize: 6, margin: [0, 2, 0, 2], border: [false, false, false, false] },
        { text: formatAmount(running), alignment: 'right', fontSize: 6, margin: [0, 2, 0, 2], border: [false, false, false, false] }
      ]);
    });

    // Sous-total
    body.push([
      { text: '', colSpan: 4, border: [false, false, false, false], fillColor: '#FFFFFF' }, {}, {}, {},
      { text: '', bold: true, alignment: 'right', margin: [0, 1, 0, 1], fillColor: '#FFFFFF', fontSize: 6 },
      { text: formatAmount(sumDebit), bold: true, alignment: 'right', margin: [0, 1, 0, 1], fillColor: '#D6EAF8', fontSize: 6 },
      { text: formatAmount(sumCredit), bold: true, alignment: 'right', margin: [0, 1, 0, 1], fillColor: '#D6EAF8', fontSize: 6 },
      { text: formatAmount(running), bold: true, alignment: 'right', margin: [0, 1, 0, 1], fillColor: '#D6EAF8', fontSize: 6 }
    ]);


    totalGlobalDebit += sumDebit;
    totalGlobalCredit += sumCredit;
    totalGlobalSolde += running;
  });

  // Total global à la fin
  body.push([
    { text: '', colSpan: 4, border: [false, false, false, false] }, {}, {}, {},
    { text: 'TOT.', bold: true, alignment: 'right', fillColor: '#EAECEE', margin: [0, 2, 0, 2] },
    { text: formatAmount(totalGlobalDebit), bold: true, alignment: 'right', fillColor: '#EAECEE', margin: [0, 2, 0, 2] },
    { text: formatAmount(totalGlobalCredit), bold: true, alignment: 'right', fillColor: '#EAECEE', margin: [0, 2, 0, 2] },
    { text: formatAmount(totalGlobalSolde), bold: true, alignment: 'right', fillColor: '#EAECEE', margin: [0, 2, 0, 2] }
  ]);

  sections.push({
    table: {
      headerRows: 1,
      widths: ['10%', '6%', '10%', '*', '5%', '12%', '12%', '12%'],
      body
    },
    layout: {
      hLineWidth: () => 0, // supprime toutes les lignes horizontales
      vLineWidth: () => 0,  // supprime toutes les lignes verticales
      fillColor: (rowIndex, node, columnIndex) => {
        // N'applique pas si la cellule a déjà un fillColor défini
        const row = body[rowIndex];
        if (Array.isArray(row)) {
          const cell = row[columnIndex];
          if (cell && cell.fillColor) return null;
        }
        return rowIndex % 2 === 0 ? null : '#fcfcfc';
      }
    },
    margin: [0, 0, 0, 10]
  });

  return sections;
}



async function generateGrandLivreContent(id_compte, id_dossier, id_exercice, compteAux, dateDebut, dateFin) {
  const rows = await getRows(id_compte, id_dossier, id_exercice, compteAux, dateDebut, dateFin);
  const groups = groupByAccount(rows);
  return { buildSections, groups };
}

module.exports = { generateGrandLivreContent };
