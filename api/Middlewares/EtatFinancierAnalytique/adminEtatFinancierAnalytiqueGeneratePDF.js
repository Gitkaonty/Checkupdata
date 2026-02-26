const db = require("../../Models");
require('dotenv').config();

const recupEtatFinancierAnalytique = require('../../Middlewares/Administration/EtatFinancierAnalytique');
const getEtatFinancierAnalytiqueComplet = recupEtatFinancierAnalytique.getEtatFinancierAnalytiqueComplet;

const rubriqueExternesEvcpAnalytiques = db.rubriqueExternesEvcpAnalytiques;

const formatAmount = (value) => {
    if (value === null || value === undefined) return '';

    const absValue = Math.abs(Number(value));
    let str = absValue.toFixed(2);
    str = str.replace(/\B(?=(\d{3})+(?!\d))/g, ' ').replace('.', ',');

    return Number(value) < 0 ? `- ${str}` : str;
};

const formatShortAmount = (value) => {
    if (value === null || value === undefined || isNaN(Number(value))) return "";

    const num = Number(value);
    const billion = 1_000_000_000;

    if (Math.abs(num) < billion) {
        return String(formatAmount(num)).replace(/\u00A0/g, " ");
    }

    const inBillion = Math.trunc(num / billion);

    const formatted = inBillion.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");

    return `${formatted} Md`;
};

const generateBilanAnalytiqueContent = async (id_compte, id_dossier, id_exercice, id_axe, id_section) => {
    const data = await getEtatFinancierAnalytiqueComplet(id_compte, id_dossier, id_exercice, '', id_axe, id_section);
    const bilanActifData = data.filter(val => val.id_etat === 'BILAN_ACTIF');
    const bilanPassifData = data.filter(val => val.id_etat === 'BILAN_PASSIF');

    const buildTable = (data, type) => {
        const body = [];

        if (type === 'actif') {
            body.push([
                { text: 'Actif', style: 'tableHeader' },
                { text: 'Montant brut', style: 'tableHeader', alignment: 'right' },
                { text: 'Amort./Perte val.', style: 'tableHeader', alignment: 'right' },
                { text: 'Montant net N', style: 'tableHeader', alignment: 'right' },
                { text: 'Montant net N-1', style: 'tableHeader', alignment: 'right' }
            ]);

            data.forEach(row => {
                const isTitre = row.type === 'TITRE';
                const isTotal = row.type === 'TOTAL';
                const isSousTotal = row.type === 'SOUS-TOTAL';
                const bgColor = isTotal ? '#89A8B2' : isTitre ? '#f0f0f0' : isSousTotal ? '#9bc2cf' : null;

                body.push([
                    {
                        text: row.libelle || '',
                        fillColor: bgColor,
                        alignment: 'left',
                        valign: 'middle',
                        margin: [0, 2, 0, 2]
                    },
                    {
                        text: isTitre ? '' : formatShortAmount(row.montantbrut),
                        fillColor: bgColor, alignment: 'right',
                        valign: 'middle',
                        margin: [0, 2, 0, 2]
                    },
                    {
                        text: isTitre ? '' : formatShortAmount(row.montantamort),
                        fillColor: bgColor,
                        alignment: 'right',
                        valign: 'middle',
                        margin: [0, 2, 0, 2]
                    },
                    {
                        text: isTitre ? '' : formatShortAmount(row.montantnet),
                        fillColor: bgColor,
                        alignment: 'right',
                        valign: 'middle',
                        margin: [0, 2, 0, 2]
                    },
                    {
                        text: isTitre ? '' : formatShortAmount(row.montantnetn1),
                        fillColor: bgColor,
                        alignment: 'right',
                        valign: 'middle',
                        margin: [0, 2, 0, 2]
                    }
                ]);
            });

        } else if (type === 'passif') {
            body.push([
                { text: 'Capitaux propres', style: 'tableHeader' },
                { text: 'Montant N', style: 'tableHeader', alignment: 'right' },
                { text: 'Montant N-1', style: 'tableHeader', alignment: 'right' }
            ]);

            data.forEach(row => {
                const isTitre = row.type === 'TITRE';
                const isTotal = row.type === 'TOTAL';
                const isSousTotal = row.type === 'SOUS-TOTAL';
                const bgColor = isTotal ? '#89A8B2' : isTitre ? '#f0f0f0' : isSousTotal ? '#9bc2cf' : null;

                body.push([
                    {
                        text: row.libelle || '',
                        fillColor: bgColor,
                        alignment: 'left',
                        valign: 'middle',
                        margin: [0, 2, 0, 2]
                    },
                    {
                        text: isTitre ? '' : formatShortAmount(row.montantnet),
                        fillColor: bgColor,
                        alignment: 'right',
                        valign: 'middle',
                        margin: [0, 2, 0, 2]
                    },
                    {
                        text: isTitre ? '' : formatShortAmount(row.montantnetn1),
                        fillColor: bgColor,
                        alignment: 'right',
                        valign: 'middle',
                        margin: [0, 2, 0, 2]
                    }
                ]);
            });
        }

        return [
            {
                table: {
                    headerRows: 1,
                    widths: type === 'actif'
                        ? ['28%', '16%', '16%', '16%', '16%']
                        : ['52%', '24%', '24%'],
                    body
                },
                layout: 'lightHorizontalLines'
            }
        ];
    };

    return {
        buildTable,
        bilanActifData,
        bilanPassifData
    };
}

const generateBilanActifAnalytiqueContent = async (id_compte, id_dossier, id_exercice, id_axe, id_section) => {
    const data = await getEtatFinancierAnalytiqueComplet(id_compte, id_dossier, id_exercice, '', id_axe, id_section);
    const bilanActifData = data.filter(val => val.id_etat === 'BILAN_ACTIF');

    const buildTable = (data, type) => {
        const body = [];

        body.push([
            { text: 'Actif', style: 'tableHeader' },
            { text: 'Montant brut', style: 'tableHeader', alignment: 'right' },
            { text: 'Amort./Perte val.', style: 'tableHeader', alignment: 'right' },
            { text: 'Montant net N', style: 'tableHeader', alignment: 'right' },
            { text: 'Montant net N-1', style: 'tableHeader', alignment: 'right' }
        ]);

        data.forEach(row => {
            const isTitre = row.type === 'TITRE';
            const isTotal = row.type === 'TOTAL';
            const isSousTotal = row.type === 'SOUS-TOTAL';
            const bgColor = isTotal ? '#89A8B2' : isTitre ? '#f0f0f0' : isSousTotal ? '#9bc2cf' : null;

            body.push([
                {
                    text: row.libelle || '',
                    fillColor: bgColor,
                    alignment: 'left',
                    valign: 'middle',
                    margin: [0, 2, 0, 2]
                },
                {
                    text: isTitre ? '' : formatShortAmount(row.montantbrut),
                    fillColor: bgColor,
                    alignment: 'right',
                    valign: 'middle',
                    margin: [0, 2, 0, 2]
                },
                {
                    text: isTitre ? '' : formatShortAmount(row.montantamort),
                    fillColor: bgColor,
                    alignment: 'right',
                    valign: 'middle',
                    margin: [0, 2, 0, 2]
                },
                {
                    text: isTitre ? '' : formatShortAmount(row.montantnet),
                    fillColor: bgColor,
                    alignment: 'right',
                    valign: 'middle',
                    margin: [0, 2, 0, 2]
                },
                {
                    text: isTitre ? '' : formatShortAmount(row.montantnetn1),
                    fillColor: bgColor,
                    alignment: 'right',
                    valign: 'middle',
                    margin: [0, 2, 0, 2]
                }
            ]);
        });

        return [
            {
                table: {
                    headerRows: 1,
                    widths: ['32%', '17%', '17%', '17%', '17%'],
                    body
                },
                layout: 'lightHorizontalLines'
            }
        ];
    };

    return {
        buildTable,
        bilanActifData
    };
}

const generateBilanPassifAnalytiqueContent = async (id_compte, id_dossier, id_exercice, id_axe, id_section) => {
    const data = await getEtatFinancierAnalytiqueComplet(id_compte, id_dossier, id_exercice, '', id_axe, id_section);
    const bilanPassifData = data.filter(val => val.id_etat === 'BILAN_PASSIF');
    const buildTable = (data, type) => {
        const body = [];

        body.push([
            { text: 'Capitaux propres', style: 'tableHeader' },
            { text: 'Montant N', style: 'tableHeader', alignment: 'right' },
            { text: 'Montant N-1', style: 'tableHeader', alignment: 'right' }
        ]);

        data.forEach(row => {
            const isTitre = row.type === 'TITRE';
            const isTotal = row.type === 'TOTAL';
            const isSousTotal = row.type === 'SOUS-TOTAL';
            const bgColor = isTotal ? '#89A8B2' : isTitre ? '#f0f0f0' : isSousTotal ? '#9bc2cf' : null;

            body.push([
                {
                    text: row.libelle || '',
                    fillColor: bgColor,
                    alignment: 'left',
                    valign: 'middle',
                    margin: [0, 2, 0, 2]
                },
                {
                    text: isTitre ? '' : formatShortAmount(row.montantnet),
                    fillColor: bgColor,
                    alignment: 'right',
                    valign: 'middle',
                    margin: [0, 2, 0, 2]
                },
                {
                    text: isTitre ? '' : formatShortAmount(row.montantnetn1),
                    fillColor: bgColor,
                    alignment: 'right',
                    valign: 'middle',
                    margin: [0, 2, 0, 2]
                }
            ]);
        });
        return [
            {
                table: {
                    headerRows: 1,
                    widths: ['52%', '24%', '24%'],
                    body
                },
                layout: 'lightHorizontalLines'
            }
        ];
    };

    return {
        buildTable,
        bilanPassifData
    };
}

const generateCrnAnalytiqueContent = async (id_compte, id_dossier, id_exercice, id_axe, id_section) => {
    const data = await getEtatFinancierAnalytiqueComplet(id_compte, id_dossier, id_exercice, '', id_axe, id_section);
    const crnData = data.filter(val => val.id_etat === 'CRN');
    const buildTable = (data) => {
        const body = [];

        body.push([
            { text: 'Rubriques', style: 'tableHeader' },
            { text: 'Montant net N', style: 'tableHeader', alignment: 'right' },
            { text: 'Montant net N-1', style: 'tableHeader', alignment: 'right' }
        ]);

        data.forEach(row => {
            const isTitre = row.type === 'TITRE';
            const isTotal = row.type === 'TOTAL';
            const isSousTotal = row.type === 'SOUS-TOTAL';
            const bgColor = isTotal ? '#89A8B2' : isTitre ? '#f0f0f0' : isSousTotal ? '#9bc2cf' : null;

            body.push([
                {
                    text: row.libelle || '',
                    fillColor: bgColor,
                    alignment: 'left',
                    valign: 'middle',
                    margin: [0, 2, 0, 2]
                },
                {
                    text: isTitre ? '' : formatShortAmount(row.montantnet),
                    fillColor: bgColor,
                    alignment: 'right',
                    valign: 'middle',
                    margin: [0, 2, 0, 2]
                },
                {
                    text: isTitre ? '' : formatShortAmount(row.montantnetn1),
                    fillColor: bgColor,
                    alignment: 'right',
                    valign: 'middle',
                    margin: [0, 2, 0, 2]
                }
            ]);
        });

        return [
            {
                table: {
                    headerRows: 1,
                    widths: ['52%', '24%', '24%'],
                    body
                },
                layout: 'lightHorizontalLines'
            }
        ];
    };

    return {
        buildTable,
        crnData
    }
}

const generateCrfAnalytiqueContent = async (id_compte, id_dossier, id_exercice, id_axe, id_section) => {
    const data = await getEtatFinancierAnalytiqueComplet(id_compte, id_dossier, id_exercice, '', id_axe, id_section);
    const crfData = data.filter(val => val.id_etat === 'CRF');
    const buildTable = (data) => {
        const body = [];

        body.push([
            { text: 'Rubriques', style: 'tableHeader' },
            { text: 'Montant net N', style: 'tableHeader', alignment: 'right' },
            { text: 'Montant net N-1', style: 'tableHeader', alignment: 'right' }
        ]);

        data.forEach(row => {
            const isTitre = row.type === 'TITRE';
            const isTotal = row.type === 'TOTAL';
            const isSousTotal = row.type === 'SOUS-TOTAL';
            const bgColor = isTotal ? '#89A8B2' : isTitre ? '#f0f0f0' : isSousTotal ? '#9bc2cf' : null;

            body.push([
                {
                    text: row.libelle || '',
                    fillColor: bgColor,
                    alignment: 'left',
                    valign: 'middle',
                    margin: [0, 2, 0, 2]
                },
                {
                    text: isTitre ? '' : formatShortAmount(row.montantnet),
                    fillColor: bgColor,
                    alignment: 'right',
                    valign: 'middle',
                    margin: [0, 2, 0, 2]
                },
                {
                    text: isTitre ? '' : formatShortAmount(row.montantnetn1),
                    fillColor: bgColor,
                    alignment: 'right',
                    valign: 'middle',
                    margin: [0, 2, 0, 2]
                }
            ]);
        });

        return [
            {
                table: {
                    headerRows: 1,
                    widths: ['52%', '24%', '24%'],
                    body
                },
                layout: 'lightHorizontalLines'
            }
        ];
    };

    return {
        buildTable,
        crfData
    }
}

const generateTftdAnalytiqueContent = async (id_compte, id_dossier, id_exercice, id_axe, id_section) => {
    const data = await getEtatFinancierAnalytiqueComplet(id_compte, id_dossier, id_exercice, '', id_axe, id_section);
    const tftdData = data.filter(val => val.id_etat === 'TFTD');
    const buildTable = (data) => {
        const body = [];

        body.push([
            { text: 'Rubriques', style: 'tableHeader' },
            { text: 'Montant net N', style: 'tableHeader', alignment: 'right' },
            { text: 'Montant net N-1', style: 'tableHeader', alignment: 'right' }
        ]);

        data.forEach(row => {
            const isTitre = row.type === 'TITRE';
            const isTotal = row.type === 'TOTAL';
            const isSousTotal = row.type === 'SOUS-TOTAL';
            const bgColor = isTotal ? '#89A8B2' : isTitre ? '#f0f0f0' : isSousTotal ? '#9bc2cf' : null;

            body.push([
                {
                    text: row.libelle || '',
                    fillColor: bgColor,
                    alignment: 'left',
                    valign: 'middle',
                    margin: [0, 2, 0, 2]
                },
                {
                    text: isTitre ? '' : formatShortAmount(row.montantnet),
                    fillColor: bgColor,
                    alignment: 'right',
                    valign: 'middle',
                    margin: [0, 2, 0, 2]
                },
                {
                    text: isTitre ? '' : formatShortAmount(row.montantnetn1),
                    fillColor: bgColor,
                    alignment: 'right',
                    valign: 'middle',
                    margin: [0, 2, 0, 2]
                }
            ]);
        });

        return [
            {
                table: {
                    headerRows: 1,
                    widths: ['55%', '22.5%', '22.5%'],
                    body
                },
                layout: 'lightHorizontalLines'
            }
        ];
    };

    return {
        buildTable,
        tftdData
    }
}

const generateTftiAnalytiqueContent = async (id_compte, id_dossier, id_exercice, id_axe, id_section) => {
    const data = await getEtatFinancierAnalytiqueComplet(id_compte, id_dossier, id_exercice, '', id_axe, id_section);
    const tftiData = data.filter(val => val.id_etat === 'TFTI');
    const buildTable = (data) => {
        const body = [];

        body.push([
            { text: 'Rubriques', style: 'tableHeader' },
            { text: 'Montant net N', style: 'tableHeader', alignment: 'right' },
            { text: 'Montant net N-1', style: 'tableHeader', alignment: 'right' }
        ]);

        data.forEach(row => {
            const isTitre = row.type === 'TITRE';
            const isTotal = row.type === 'TOTAL';
            const isSousTotal = row.type === 'SOUS-TOTAL';
            const bgColor = isTotal ? '#89A8B2' : isTitre ? '#f0f0f0' : isSousTotal ? '#9bc2cf' : null;

            body.push([
                {
                    text: row.libelle || '',
                    fillColor: bgColor,
                    alignment: 'left',
                    valign: 'middle',
                    margin: [0, 2, 0, 2]
                },
                {
                    text: isTitre ? "" : formatShortAmount(row.montantnet),
                    fillColor: bgColor,
                    alignment: 'right',
                    valign: 'middle',
                    margin: [0, 2, 0, 2]
                },
                {
                    text: isTitre ? "" : formatShortAmount(row.montantnetn1),
                    fillColor: bgColor,
                    alignment: 'right',
                    valign: 'middle',
                    margin: [0, 2, 0, 2]
                }
            ]);
        });

        return [
            {
                table: {
                    headerRows: 1,
                    widths: ['52%', '24%', '24%'],
                    body
                },
                layout: 'lightHorizontalLines'
            }
        ];
    };

    return {
        buildTable,
        tftiData
    }
}

const generateEvcpAnalytiqueContent = async (id_compte, id_dossier, id_exercice) => {
    const evcpData = await rubriqueExternesEvcpAnalytiques.findAll({
        where: {
            id_dossier,
            id_exercice,
            id_compte
        }
    });
    const buildTable = (data) => {
        const body = [];

        body.push([
            { text: 'Rubriques', style: 'tableHeader' },
            { text: 'Note', style: 'tableHeader' },
            { text: 'Capital social', style: 'tableHeader', alignment: 'right' },
            { text: 'Capital prime & res', style: 'tableHeader', alignment: 'right', fontSize: 5.5 },
            { text: 'Ecart d\'évaluation', style: 'tableHeader', alignment: 'right', fontSize: 5.5 },
            { text: 'Résultat', style: 'tableHeader', alignment: 'right' },
            { text: 'Report à nouveau', style: 'tableHeader', alignment: 'right', fontSize: 5.5 },
            { text: 'Total', style: 'tableHeader', alignment: 'right' }
        ]);

        data.forEach(row => {
            const isLevel1 = row.niveau === 1;
            const bgColor = isLevel1 ? '#f0f0f0' : null;

            body.push([
                {
                    text: row.libelle || '',
                    fillColor: bgColor,
                    alignment: 'left',
                    valign: 'middle',
                    margin: [0, 2, 0, 2]
                },
                {
                    text: row.note || '',
                    fillColor: bgColor,
                    alignment: 'left',
                    valign: 'middle',
                    margin: [0, 2, 0, 2]
                },
                {
                    text: formatShortAmount(row.capitalsocial),
                    fillColor: bgColor,
                    alignment: 'right',
                    valign: 'middle',
                    margin: [0, 2, 0, 2]
                },
                {
                    text: formatShortAmount(row.primereserve),
                    fillColor: bgColor,
                    alignment: 'right',
                    valign: 'middle',
                    margin: [0, 2, 0, 2]
                },
                {
                    text: formatShortAmount(row.ecartdevaluation),
                    fillColor: bgColor,
                    alignment: 'right',
                    valign: 'middle',
                    margin: [0, 2, 0, 2]
                },
                {
                    text: formatShortAmount(row.resultat),
                    fillColor: bgColor,
                    alignment: 'right',
                    valign: 'middle',
                    margin: [0, 2, 0, 2]
                },
                {
                    text: formatShortAmount(row.report_anouveau),
                    fillColor: bgColor,
                    alignment: 'right',
                    valign: 'middle',
                    margin: [0, 2, 0, 2]
                },
                {
                    text: formatShortAmount(row.total_varcap),
                    fillColor: bgColor,
                    alignment: 'right',
                    valign: 'middle',
                    margin: [0, 2, 0, 2]
                }
            ]);
        });

        return [
            {
                table: {
                    headerRows: 1,
                    widths: ['20%', '7.5%', '12,25%', '12,25%', '12,25%', '12,25%', '12,25%', '12,25%'],
                    body
                },
                layout: 'lightHorizontalLines'
            }
        ];
    };

    return {
        buildTable,
        evcpData
    }
}

module.exports = {
    generateBilanAnalytiqueContent,
    generateBilanActifAnalytiqueContent,
    generateBilanPassifAnalytiqueContent,
    generateCrnAnalytiqueContent,
    generateCrfAnalytiqueContent,
    generateTftdAnalytiqueContent,
    generateTftiAnalytiqueContent,
    generateEvcpAnalytiqueContent,
}