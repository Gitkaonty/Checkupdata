const db = require("../../Models");
const path = require('path');

const dossierplancomptables = db.dossierplancomptable;
const rapprochements = db.rapprochements;
require('dotenv').config();

const logoPath = path.join(__dirname, `../../public/logo/${process.env.LOGO_EXPORT}`);

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return String(dateString).substring(0, 10);
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

async function getRowAndEcritures(fileId, compteId, exerciceId, pcId, rapproId, dateDebutEx, dateFinEx) {
  const pc = await dossierplancomptables.findByPk(pcId);
  let compte = null;
  if (pc) {
    compte = pc.compte;
  }
  const row = await rapprochements.findOne({ where: { id: rapproId, id_dossier: fileId, id_compte: compteId, id_exercice: exerciceId, pc_id: pcId } });
  if (!row) throw new Error('Ligne de rapprochement introuvable');

  const rjson = row.toJSON ? row.toJSON() : row;
  const dateDebut = dateDebutEx;
  const dateFin = rjson?.date_fin || dateFinEx;
  const sql = `
    SELECT j.dateecriture, j.debit, j.credit, j.libelle, j.piece,
          j.compteaux AS compte_ecriture, cj.code AS code_journal,
          j.rapprocher, j.date_rapprochement
    FROM journals j
    JOIN codejournals cj ON cj.id = j.id_journal
    WHERE j.id_compte = :compteId
      AND j.id_dossier = :fileId
      AND j.id_exercice = :exerciceId
      AND cj.compteassocie = :compte
      AND j.compteaux <> :compte
      AND j.dateecriture BETWEEN :dateDebut AND :dateFin
      ORDER BY j.dateecriture ASC, j.id ASC
  `;
  const ecrituresAll = await db.sequelize.query(sql, {
    replacements: { fileId, compteId, exerciceId, pcId, compte, dateDebut, dateFin },
    type: db.Sequelize.QueryTypes.SELECT,
  });
  const ecritures = (ecrituresAll || []).filter(x => !x.rapprocher);
  return { pc, rjson, ecritures };
}

async function exportRapprochementExcel(fileId, compteId, exerciceId, pcId, rapproId, workbook, dossierName, userName, dateDebutEx, dateFinEx) {
  const ws = workbook.addWorksheet('Rapprochement');

  const logoId = workbook.addImage({
    filename: logoPath,
    extension: 'png',
  });

  const { pc, rjson, ecritures } = await getRowAndEcritures(fileId, compteId, exerciceId, pcId, rapproId, dateDebutEx, dateFinEx);

  ws.columns = [
    { width: 14 },  // Date écriture
    { width: 8 },   // Code journal
    { width: 16 },  // Compte
    { width: 45 },  // Libellé
    { width: 11 },  // Rapproché
    { width: 14 },  // Date rapprochement
    { width: 16 },  // Débit
    { width: 16 },  // Crédit
  ];

  const headerRow = ws.addRow(['RAPPROCHEMENT BANCAIRE']);
  ws.mergeCells(`A${headerRow.number}:H${headerRow.number}`);
  const headerCell = ws.getCell(`A${headerRow.number}`);
  headerCell.font = { bold: true, size: 16 };
  headerCell.alignment = { horizontal: 'center', vertical: 'middle' };

  ws.addImage(logoId, {
    tl: { col: 0, row: headerRow.number - 1 },
    ext: { width: 55, height: 55 },
    editAs: 'oneCell',
  });

  const dossierRow = ws.addRow([`Dossier: ${dossierName || ''}`]);
  ws.mergeCells(`A${dossierRow.number}:H${dossierRow.number}`);
  const dossierCell = ws.getCell(`A${dossierRow.number}`);
  dossierCell.font = { bold: true, size: 14 };
  dossierCell.alignment = { horizontal: 'center', vertical: 'middle' };

  const emptyLine1 = ws.addRow([]);
  ws.mergeCells(`A${emptyLine1.number}:H${emptyLine1.number}`);

  const exerciceRow = ws.addRow([`Exercice: ${formatDate(dateDebutEx)} - ${formatDate(dateFinEx)}`]);
  ws.mergeCells(`A${exerciceRow.number}:H${exerciceRow.number}`);
  ws.getCell(`A${exerciceRow.number}`).font = { bold: true };
  ws.getCell(`A${exerciceRow.number}`).alignment = { horizontal: 'left', vertical: 'bottom' };

  const periodeRow = ws.addRow([`Période: du ${formatDate(rjson?.date_debut)} au ${formatDate(rjson?.date_fin)}`]);
  ws.mergeCells(`A${periodeRow.number}:H${periodeRow.number}`);
  ws.getCell(`A${periodeRow.number}`).font = { bold: true };
  ws.getCell(`A${periodeRow.number}`).alignment = { horizontal: 'left', vertical: 'bottom' };

  const dateRow = ws.addRow([`Date d'édition : ${formatDate(new Date())}`]);
  ws.mergeCells(`A${dateRow.number}:H${dateRow.number}`);
  ws.getCell(`A${dateRow.number}`).font = { bold: true };
  ws.getCell(`A${dateRow.number}`).alignment = { horizontal: 'left', vertical: 'bottom' };

  const emptyLine2 = ws.addRow([]);
  ws.mergeCells(`A${emptyLine2.number}:H${emptyLine2.number}`);

  const syntheseRow = ws.addRow(['1. Synthèse financière']);
  syntheseRow.font = { bold: true, size: 12 };
  ws.mergeCells(`A${syntheseRow.number}:H${syntheseRow.number}`);

  const ecart = Number(rjson.solde_comptable || 0) - Number(rjson.solde_bancaire || 0) - Number(rjson.solde_non_rapproche || 0);

  const soldeRows = [
    ['Solde comptable', Number(rjson.solde_comptable || 0)],
    ['Solde bancaire', Number(rjson.solde_bancaire || 0)],
    ['Solde ligne non rapproché', Number(rjson.solde_non_rapproche || 0)],
    ['Écart final', ecart],
  ];

  const tableHeader = ws.addRow(['Désignation', 'Montant (Ar)']);
  tableHeader.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  const headerFillSynthese = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A5276' } };
  for (let c = 1; c <= 2; c++) {
    const cell = tableHeader.getCell(c);
    cell.fill = headerFillSynthese;
    cell.alignment = c === 1 ? { horizontal: 'left', vertical: 'middle' } : { horizontal: 'right', vertical: 'middle' };
  }

  soldeRows.forEach(rowData => {
    const row = ws.addRow(rowData);

    const leftCell = row.getCell(1);
    leftCell.alignment = { horizontal: 'left', vertical: 'middle' };
    leftCell.font = { bold: false, color: { argb: 'FF000000' } };

    const rightCell = row.getCell(2);
    rightCell.alignment = { horizontal: 'right', vertical: 'middle' };
    rightCell.font = { bold: false, color: { argb: 'FF000000' } };
    rightCell.numFmt = '#,##0.00';

    if (rowData[0] === 'Écart final') {
      leftCell.font.bold = true;
      rightCell.font.bold = true;
    }
  });

  ws.getColumn(1).width = 30;
  ws.getColumn(2).width = 16;

  const emptyLine3 = ws.addRow([]);
  ws.mergeCells(`A${emptyLine3.number}:H${emptyLine3.number}`);

  const detailRow = ws.addRow(['2. Détail des écritures bancaires']);
  detailRow.font = { bold: true, size: 12 };
  ws.mergeCells(`A${detailRow.number}:H${detailRow.number}`);

  const header = ws.addRow(['Date écriture', 'Code journal', 'Compte', 'Libellé', 'Rapproché', 'Date rappro', 'Débit', 'Crédit']);
  header.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  const headerFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A5276' } };
  for (let c = 1; c <= 8; c++) {
    const cell = header.getCell(c);
    cell.fill = headerFill;
    cell.alignment = c <= 6 ? { horizontal: 'left', vertical: 'middle' } : { horizontal: 'right', vertical: 'middle' };
  }

  // Remplissage des écritures
  ecritures.forEach(it => {
    ws.addRow([
      formatDate(it.dateecriture),
      it.code_journal || '',
      it.compte_ecriture || '',
      it.libelle || '',
      it.rapprocher || '',
      formatDate(it.date_rapprochement),
      Number(it.debit || 0),
      Number(it.credit || 0),
    ]);
  });
}

module.exports = { exportRapprochementExcel };
