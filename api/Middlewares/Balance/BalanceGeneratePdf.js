const generateBalanceContent = async (data) => {
  const buildTable = (data) => {
    const body = [];
    body.push([
      { text: 'Compte', style: 'tableHeader' },
      { text: 'Libellé', style: 'tableHeader' },
      { text: 'Mouvement débit', style: 'tableHeader' },
      { text: 'Mouvement crédit', style: 'tableHeader' },
      { text: 'Solde débit', style: 'tableHeader' },
      { text: 'Solde crédit', style: 'tableHeader' }
    ]);

    let totMvtD = 0, totMvtC = 0, totSoldeD = 0, totSoldeC = 0;
    const fmt = (v) =>
      Number(v || 0)
        .toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        .replace(/\u202F/g, ' ');

    data.forEach((r, i) => {
      const isEven = i % 2 === 0; // lignes paires et impaires
      const rowColor = isEven ? '#FFFFFF' : '#F8F9F9'; // blanc / gris clair

      totMvtD += Number(r.mvmdebit || 0);
      totMvtC += Number(r.mvmcredit || 0);
      totSoldeD += Number(r.soldedebit || 0);
      totSoldeC += Number(r.soldecredit || 0);

      body.push([
        { text: r.compte || '', alignment: 'left', margin: [0, 2, 0, 2], fillColor: rowColor },
        { text: r.libelle || '', alignment: 'left', margin: [0, 2, 0, 2], fillColor: rowColor },
        { text: fmt(r.mvmdebit), alignment: 'right', margin: [0, 2, 0, 2], fillColor: rowColor },
        { text: fmt(r.mvmcredit), alignment: 'right', margin: [0, 2, 0, 2], fillColor: rowColor },
        { text: fmt(r.soldedebit), alignment: 'right', margin: [0, 2, 0, 2], fillColor: rowColor },
        { text: fmt(r.soldecredit), alignment: 'right', margin: [0, 2, 0, 2], fillColor: rowColor }
      ]);
    });

    // Ligne total
    body.push([
      { text: 'TOTAL', bold: true, alignment: 'left', margin: [0, 2, 0, 2], fillColor: '#89A8B2' },
      { text: '', fillColor: '#89A8B2' },
      { text: fmt(totMvtD), bold: true, alignment: 'right', margin: [0, 2, 0, 2], fillColor: '#89A8B2' },
      { text: fmt(totMvtC), bold: true, alignment: 'right', margin: [0, 2, 0, 2], fillColor: '#89A8B2' },
      { text: fmt(totSoldeD), bold: true, alignment: 'right', margin: [0, 2, 0, 2], fillColor: '#89A8B2' },
      { text: fmt(totSoldeC), bold: true, alignment: 'right', margin: [0, 2, 0, 2], fillColor: '#89A8B2' }
    ]);

    return [
      {
        table: {
          headerRows: 1,
          widths: [70, '*', 100, 100, 100, 100],
          body
        },
        layout: 'lightHorizontalLines'
      }
    ];
  };

  return { buildTable, list: data };
};

module.exports = { generateBalanceContent };
