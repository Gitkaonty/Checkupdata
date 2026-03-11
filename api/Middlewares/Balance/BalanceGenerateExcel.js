require('dotenv').config();
const path = require('path');

const logoPath = path.join(__dirname, `../../public/logo/${process.env.LOGO_EXPORT}`);

async function exportBalanceTableExcel(workbook, dossierName, data, texteDatePeriode) {
  const ws = workbook.addWorksheet('Balance');

  const logoId = workbook.addImage({
    filename: logoPath,
    extension: 'png',
  });

  ws.columns = [
    { key: 'compte', width: 18 },
    { key: 'libelle', width: 40 },
    { key: 'mvmcredit', width: 18, style: { numFmt: '#,##0.00' } },
    { key: 'mvtcredit', width: 18, style: { numFmt: '#,##0.00' } },
    { key: 'soldedebit', width: 18, style: { numFmt: '#,##0.00' } },
    { key: 'soldecredit', width: 18, style: { numFmt: '#,##0.00' } },
  ];

  const balance = ws.addRow(['BALANCE']);
  ws.mergeCells(`A${balance.number}:F${balance.number}`);
  const headerCell = ws.getCell(`A${balance.number}`);
  headerCell.font = { bold: true, size: 16 };
  headerCell.alignment = { horizontal: 'center', vertical: 'middle' };

  ws.addImage(logoId, {
    tl: { x: 10, y: 5 },
    ext: { width: 55, height: 55 },
    editAs: 'absolute',
  });

  const dossierRow = ws.addRow([`Dossier: ${dossierName || ''}`]);
  ws.mergeCells(`A${dossierRow.number}:F${dossierRow.number}`);
  const dossierCell = ws.getCell(`A${dossierRow.number}`);
  dossierCell.font = { bold: true, size: 14 };
  dossierCell.alignment = { horizontal: 'center', vertical: 'middle' };

  const periodeRow = ws.addRow([texteDatePeriode]);
  ws.mergeCells(`A${periodeRow.number}:F${periodeRow.number}`);
  const periodeCell = ws.getCell(`A${periodeRow.number}`);
  periodeCell.font = { italic: true, size: 12, color: { argb: 'FF555555' } };
  periodeCell.alignment = { horizontal: 'left', vertical: 'middle' };

  ws.addRow([]);

  const headerRow = ws.addRow(['Compte', 'Libellé', 'Mouvement débit', 'Mouvement crédit', 'Solde débit', 'Solde crédit']);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { horizontal: 'center' };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A5276' } };
  });

  let totMvtD = 0, totMvtC = 0, totSoldeD = 0, totSoldeC = 0;

  data.forEach(r => {
    totMvtD += Number(r.mvmcredit || 0);
    totMvtC += Number(r.mvmcredit || 0);
    totSoldeD += Number(r.soldedebit || 0);
    totSoldeC += Number(r.soldecredit || 0);
    ws.addRow({
      compte: r.compte || '',
      libelle: r.libelle || '',
      mvmcredit: Number(r.mvmcredit || 0),
      mvmcredit: Number(r.mvmcredit || 0),
      soldedebit: Number(r.soldedebit || 0),
      soldecredit: Number(r.soldecredit || 0)
    });
  });

  const totalRow = ws.addRow({ compte: 'TOTAL', mvmcredit: totMvtD, mvmcredit: totMvtC, soldedebit: totSoldeD, soldecredit: totSoldeC });
  totalRow.font = { bold: true };

  // ['C', 'D', 'E', 'F'].forEach(col => {
  //   ws.getColumn(col).alignment = { horizontal: 'right' };
  // });
}

module.exports = { exportBalanceTableExcel };
