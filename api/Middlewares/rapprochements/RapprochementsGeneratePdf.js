const db = require("../../Models");

const formatDateFr = (s) => {
  if (!s) return '';
  const d = new Date(s);
  if (isNaN(d.getTime())) return String(s).substring(0, 10);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

// Format amounts in French with spaces as thousand separators and 2 decimals
const fmtAmount = (value) => {
  if (value == null) return '0.00';
  try {
    return Number(value)
      .toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      .replace(/\u202F/g, ' ');
  } catch {
    const num = Number(value) || 0;
    return num.toFixed(2);
  }
};

const buildSummaryBlock = (row) => {
  const ecart =
    Number(row.solde_comptable || 0) -
    Number(row.solde_bancaire || 0) -
    Number(row.solde_non_rapproche || 0);

  const summaryTable = {
    table: {
      widths: ['*', 120],
      body: [
        [
          {
            text: 'Désignation',
            bold: true,
            fillColor: '#1A5276',
            color: 'white',
            alignment: 'left'
          },
          {
            text: 'Montant (Ar)',
            bold: true,
            fillColor: '#1A5276',
            color: 'white',
            alignment: 'right'
          }
        ],
        [
          { text: 'Solde comptable', noWrap: true },
          { text: fmtAmount(row.solde_comptable || 0), alignment: 'right', noWrap: true }
        ],
        [
          { text: 'Solde bancaire', noWrap: true },
          { text: fmtAmount(row.solde_bancaire || 0), alignment: 'right', noWrap: true }
        ],
        [
          { text: 'Solde ligne non rapprochées', noWrap: true },
          { text: fmtAmount(row.solde_non_rapproche || 0), alignment: 'right', noWrap: true }
        ],
        [
          { text: 'Écart final', bold: true, noWrap: true },
          { text: fmtAmount(ecart), alignment: 'right', bold: true, noWrap: true }
        ]
      ]
    },
    layout: {
      hLineWidth: () => 0.2,
      vLineWidth: () => 0.2,
      hLineColor: () => '#cccccc',
      vLineColor: () => '#cccccc',
      paddingLeft: () => 6,
      paddingRight: () => 6,
      paddingTop: () => 3,
      paddingBottom: () => 3
    }
  };

  return {
    columns: [
      { width: '*', text: '' },
      { width: '80%', ...summaryTable },
      { width: '*', text: '' }
    ],
    margin: [0, 10, 0, 10]
  };
};

const buildEcrituresTable = (ecritures) => {
  return {
    table: {
      headerRows: 1,
      widths: ['10%', '8%', '15%', '*', '9%', '10%', '12%', '12%'],
      body: [
        [
          { text: 'Date', style: 'tableHeader', alignment: 'left' },
          { text: 'Journal', style: 'tableHeader', alignment: 'left' },
          { text: 'Compte', style: 'tableHeader', alignment: 'left' },
          {
            text: 'Libellé',
            style: 'tableHeader',
            alignment: 'left',
            noWrap: true
          },
          { text: 'Rapproché', style: 'tableHeader', alignment: 'left' },
          { text: 'Date rappro.', style: 'tableHeader', alignment: 'left' },
          { text: 'Débit', style: 'tableHeader', alignment: 'right' },
          { text: 'Crédit', style: 'tableHeader', alignment: 'right' },
        ],
        ...ecritures.map(it => ([
          formatDateFr(it.dateecriture),
          it.code_journal || '',
          it.compte_ecriture || '',
          { text: it.libelle || '', fontSize: 8, alignment: 'left', noWrap: true },
          it.rapprocher ? 'NON' : 'OUI',
          formatDateFr(it.date_rapprochement),
          { text: fmtAmount(it.debit || 0), alignment: 'right' },
          { text: fmtAmount(it.credit || 0), alignment: 'right' },
        ]))
      ]
    },
    layout: {
      hLineWidth: () => 0.2,
      vLineWidth: () => 0.2,
      paddingTop: () => 3,
      paddingBottom: () => 3,
      hLineColor: () => '#cccccc',
      vLineColor: () => '#cccccc',
      fillColor: (rowIndex) => rowIndex % 2 === 0 ? null : '#f2f2f2'
    }
  };
};

async function fetchRapproData(fileId, compteId, exerciceId, pcId, rapproId, dateDebutEx, dateFinEx) {
  const pc = await db.dossierplancomptable.findByPk(pcId);
  let compte = null;
  if (pc) {
    compte = pc.compte;
  }
  const row = await db.rapprochements.findOne({ where: { id: rapproId, id_dossier: fileId, id_compte: compteId, id_exercice: exerciceId, pc_id: pcId } });
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

async function generateRapproContent(fileId, compteId, exerciceId, pcId, rapproId, dateDebutEx, dateFinEx) {
  const { pc, rjson, ecritures } = await fetchRapproData(fileId, compteId, exerciceId, pcId, rapproId, dateDebutEx, dateFinEx);
  const summary = buildSummaryBlock(rjson);
  //   const rapproTable = buildRapproTable(rjson)[0];
  const ecrituresTable = buildEcrituresTable(ecritures);
  return { pc, rjson, ecritures, summary, ecrituresTable };
}

module.exports = { generateRapproContent };
