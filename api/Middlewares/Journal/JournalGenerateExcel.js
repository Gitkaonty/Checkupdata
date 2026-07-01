const db = require('../../Models');
const ExcelJS = require('exceljs');
const Sequelize = require('sequelize');
const { Op } = Sequelize;

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
    order: [[codejournals, 'code', 'ASC'], ['dateecriture', 'ASC'], ['id_ecriture', 'ASC'], ['id', 'ASC']]
  });

  return list.map(r => (r?.get ? r.get({ plain: true }) : r));
}

async function exportJournalTableExcel(id_compte, id_dossier, id_exercice, journalCodes, dateDebut, dateFin, workbook, dossierName, compteName, exStart, exEnd) {
  const rows = await getJournalRows(id_compte, id_dossier, id_exercice, journalCodes, dateDebut, dateFin);

  const ws = workbook.addWorksheet('Journal');
  ws.columns = [
    { key: 'date', width: 12 },
    { key: 'journal', width: 10 },
    { key: 'compte', width: 16 },
    { key: 'libelle', width: 80 },
    { key: 'piece', width: 16 },
    { key: 'lettrage', width: 12 },
    { key: 'devise', width: 10 },
    { key: 'debit', width: 16, style: { numFmt: '#,##0.00' } },
    { key: 'credit', width: 16, style: { numFmt: '#,##0.00' } },
  ];
  const fmtDate = (d) => {
    if (!d) return '';
    const date = new Date(d);
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };
  // Titre
  // ====== Ligne 1 : Titre principal (centré sur la largeur du tableau) ======
  ws.mergeCells('A1:E1');
  const titleCell = ws.getCell('A1');
  titleCell.value = 'JOURNAL';
  titleCell.font = { bold: true, size: 16, color: { argb: 'FF0E7C86' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

  // ====== Ligne 2 : Dossier centré sous le titre ======
  ws.mergeCells('A2:E2');
  const dossierCell = ws.getCell('A2');
  dossierCell.value = `Dossier : ${dossierName || ''}`;
  dossierCell.font = { italic: true, bold: true, size: 12, color: { argb: 'FF555555' } };
  dossierCell.alignment = { horizontal: 'center', vertical: 'middle' };

  // ====== Ligne 3 : Période alignée à gauche ======
  const periodeCell = ws.getCell('A3');
  periodeCell.value = `Période du : ${fmtDate(exStart) || ''} au ${fmtDate(exEnd) || ''}`;
  periodeCell.font = { italic: true, size: 12, color: { argb: 'FF555555' } };
  periodeCell.alignment = { horizontal: 'left', vertical: 'middle' };

  // Espace visuel avant le tableau
  ws.addRow([]);


  // En-têtes
  const headerRow = ws.addRow(['Date', 'Journal', 'Compte', 'Libellé', 'Pièce', 'Lettrage', 'Devise', 'Débit', 'Crédit']);
  headerRow.height = 20;
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0E7C86' } };
  });
  // (supprimé) insertion inutile qui pouvait décaler la mise en page

  let totD = 0, totC = 0;


  let prevEcr;
  let group = -1;
  rows.forEach((r, i) => {
    const ecr = String(r.id_ecriture ?? `__${i}`);
    if (i === 0 || ecr !== prevEcr) group += 1;
    const isNewEcr = i > 0 && ecr !== prevEcr;
    prevEcr = ecr;

    totD += Number(r.debit || 0);
    totC += Number(r.credit || 0);
    const dataRow = ws.addRow({
      date: fmtDate(r.dateecriture),
      journal: r.codejournal?.code || '',
      compte: r.compteaux || r.comptegen || r.dossierplancomptable?.compte || '',
      libelle: r.libelle || '',
      piece: r.piece || '',
      lettrage: r.lettrage || '',
      devise: r.devise || '',
      debit: Number(r.debit || 0),
      credit: Number(r.credit || 0),
    });

    const shade = group % 2 === 1;
    dataRow.eachCell((cell) => {
      if (shade) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFF7F4' } };
      }
      // Filet séparateur au-dessus d'une nouvelle écriture
      if (isNewEcr) {
        cell.border = { ...(cell.border || {}), top: { style: 'thin', color: { argb: 'FFB9D6D1' } } };
      }
    });
  });

  const totalRow = ws.addRow({ date: 'TOTAL', debit: totD, credit: totC });

  const cols = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];
  cols.forEach((col) => {
    const cell = ws.getCell(`${col}${totalRow.number}`);
    if (!cell.value) cell.value = '';
    cell.font = { bold: true, color: { argb: 'FF0E2733' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFCFE6E4' } };
    cell.alignment = { horizontal: (['H', 'I'].includes(col) ? 'right' : 'center'), vertical: 'middle' };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
      bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
      left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
      right: { style: 'thin', color: { argb: 'FFCCCCCC' } },
    };
  });

  // Si tu veux que les montants soient alignés à droite
  ['F', 'G', 'H', 'I'].forEach(col => {
    ws.getColumn(col).alignment = { horizontal: 'right' };
  });


}

module.exports = { exportJournalTableExcel };
