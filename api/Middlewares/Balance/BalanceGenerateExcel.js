const db = require('../../Models');
const Sequelize = require('sequelize');
const { Op } = Sequelize;

const dossierplancomptable = db.dossierplancomptables;
const balances = db.balances;

async function getBalanceRows(id_compte, id_dossier, id_exercice, centraliser, unSolded, movmentedCpt) {
  const whereBalance = {
    id_compte: Number(id_compte),
    id_dossier: Number(id_dossier),
    id_exercice: Number(id_exercice),
    valeur: { [Op.gt]: unSolded ? 0 : -1 },
    [Op.or]: [
      { mvtdebit: { [Op.gt]: movmentedCpt ? 0 : -1 } },
      { mvtcredit: { [Op.gt]: movmentedCpt ? 0 : -1 } }
    ]
  };

  const list = await balances.findAll({
    where: whereBalance,
    include: [
      {
        model: dossierplancomptable,
        as: 'compteLibelle',
        attributes: [
          ['compte', 'compte'],
          ['libelle', 'libelle'],
          ['nature', 'nature']
        ],
        required: true,
        where: {
          id_compte: Number(id_compte),
          id_dossier: Number(id_dossier),
          nature: { [Op.ne]: centraliser ? 'Aux' : 'Collectif' }
        }
      }
    ],
    raw: true,
    order: [[{ model: dossierplancomptable, as: 'compteLibelle' }, 'compte', 'ASC']]
  });

  return list;
}

async function exportBalanceTableExcel(id_compte, id_dossier, id_exercice, centraliser, unSolded, movmentedCpt, workbook, dossierName, compteName, exStart, exEnd, data) {
  const rows = await getBalanceRows(id_compte, id_dossier, id_exercice, centraliser, unSolded, movmentedCpt);

  const ws = workbook.addWorksheet('Balance');

  function fmtDate(dateString) {
    if (!dateString) return '';
    const d = new Date(dateString);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }
  ws.mergeCells('A1:C1');
  const titleCell = ws.getCell('A1');
  titleCell.value = 'BALANCE';
  titleCell.font = { bold: true, size: 16 };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

  // ====== Ligne 2 : Dossier centré sous le titre ======
  ws.mergeCells('A2:C2');
  const dossierCell = ws.getCell('A2');
  dossierCell.value = `Dossier : ${dossierName || ''}`;
  dossierCell.font = { italic: true, bold: true, size: 14, color: { argb: 'FF555555' } };
  dossierCell.alignment = { horizontal: 'center', vertical: 'middle' };

  // ====== Ligne 3 : Période alignée à gauche ======
  const periodeCell = ws.getCell('A3');
  periodeCell.value = `Période du : ${fmtDate(exStart) || ''} au ${fmtDate(exEnd) || ''}`;
  periodeCell.font = { italic: true, size: 12, color: { argb: 'FF555555' } };
  periodeCell.alignment = { horizontal: 'left', vertical: 'middle' };

  // Espace visuel avant le tableau
  ws.addRow([]);


  // Définir les colonnes (largeurs + format), sans créer d'en-tête automatique
  ws.columns = [
    { key: 'compte', width: 18 },
    { key: 'libelle', width: 40 },
    { key: 'mvmcredit', width: 18, style: { numFmt: '#,##0.00' } },
    { key: 'mvtcredit', width: 18, style: { numFmt: '#,##0.00' } },
    { key: 'soldedebit', width: 18, style: { numFmt: '#,##0.00' } },
    { key: 'soldecredit', width: 18, style: { numFmt: '#,##0.00' } },
  ];

  // === TITRE GLOBAL centré sur les colonnes du tableau ===
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

  // Total row
  const totalRow = ws.addRow({ compte: 'TOTAL', mvmcredit: totMvtD, mvmcredit: totMvtC, soldedebit: totSoldeD, soldecredit: totSoldeC });
  totalRow.font = { bold: true };

  // Align numbers
  ['C', 'D', 'E', 'F'].forEach(col => {
    ws.getColumn(col).alignment = { horizontal: 'right' };
  });
}

module.exports = { exportBalanceTableExcel };
