const db = require("../../Models");
require('dotenv').config();

const recupEtatFinancier = require('../../Middlewares/Administration/EtatFinancier');
const getEtatFinancierComplet = recupEtatFinancier.getEtatFinancierComplet;
const getSigComplet = recupEtatFinancier.getSigComplet;

const rubriqueExternesEvcp = db.rubriqueExternesEvcp;

const formatAmount = (value) => {
    if (value === null || value === undefined) return '';

    const absValue = Math.abs(Number(value));
    let str = absValue.toFixed(2);
    str = str.replace(/\B(?=(\d{3})+(?!\d))/g, ' ').replace('.', ',');

    return Number(value) < 0 ? `- ${str}` : str;
};

const generateBilanContent = async (id_compte, id_dossier, id_exercice, date_debut_periode, date_fin_periode) => {
    const data = await getEtatFinancierComplet(id_compte, id_dossier, id_exercice, date_debut_periode, date_fin_periode);
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
                    { text: row.libelle || '', fillColor: bgColor, alignment: 'left', valign: 'middle', margin: [0, 2, 0, 2] },
                    { text: isTitre ? '' : formatAmount(row.montantbrut), fillColor: bgColor, alignment: 'right', valign: 'middle', margin: [0, 2, 0, 2] },
                    { text: isTitre ? '' : formatAmount(row.montantamort), fillColor: bgColor, alignment: 'right', valign: 'middle', margin: [0, 2, 0, 2] },
                    { text: isTitre ? '' : formatAmount(row.montantnet), fillColor: bgColor, alignment: 'right', valign: 'middle', margin: [0, 2, 0, 2] },
                    { text: isTitre ? '' : formatAmount(row.montantnetn1), fillColor: bgColor, alignment: 'right', valign: 'middle', margin: [0, 2, 0, 2] }
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
                        text: isTitre ? '' : formatAmount(row.montantnet),
                        fillColor: bgColor,
                        alignment: 'right',
                        valign: 'middle',
                        margin: [0, 2, 0, 2]
                    },
                    {
                        text: isTitre ? '' : formatAmount(row.montantnetn1),
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
                        ? ['32%', '17%', '17%', '17%', '17%']
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

const generateBilanActifContent = async (id_compte, id_dossier, id_exercice, date_debut_periode, date_fin_periode) => {
    const data = await getEtatFinancierComplet(id_compte, id_dossier, id_exercice, date_debut_periode, date_fin_periode);
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
                { text: row.libelle || '', fillColor: bgColor, alignment: 'left', valign: 'middle', margin: [0, 2, 0, 2] },
                { text: isTitre ? '' : formatAmount(row.montantbrut), fillColor: bgColor, alignment: 'right', valign: 'middle', margin: [0, 2, 0, 2] },
                { text: isTitre ? '' : formatAmount(row.montantamort), fillColor: bgColor, alignment: 'right', valign: 'middle', margin: [0, 2, 0, 2] },
                { text: isTitre ? '' : formatAmount(row.montantnet), fillColor: bgColor, alignment: 'right', valign: 'middle', margin: [0, 2, 0, 2] },
                { text: isTitre ? '' : formatAmount(row.montantnetn1), fillColor: bgColor, alignment: 'right', valign: 'middle', margin: [0, 2, 0, 2] }
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

const generateBilanPassifContent = async (id_compte, id_dossier, id_exercice, date_debut_periode, date_fin_periode) => {
    const data = await getEtatFinancierComplet(id_compte, id_dossier, id_exercice, date_debut_periode, date_fin_periode);
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
                    text: isTitre ? '' : formatAmount(row.montantnet),
                    fillColor: bgColor,
                    alignment: 'right',
                    valign: 'middle',
                    margin: [0, 2, 0, 2]
                },
                {
                    text: isTitre ? '' : formatAmount(row.montantnetn1),
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

const generateCrnContent = async (id_compte, id_dossier, id_exercice, date_debut_periode, date_fin_periode) => {
    const data = await getEtatFinancierComplet(id_compte, id_dossier, id_exercice, date_debut_periode, date_fin_periode);
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
                    text: isTitre ? '' : formatAmount(row.montantnet),
                    fillColor: bgColor,
                    alignment: 'right',
                    valign: 'middle',
                    margin: [0, 2, 0, 2]
                },
                {
                    text: isTitre ? '' : formatAmount(row.montantnetn1),
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

const generateCrfContent = async (id_compte, id_dossier, id_exercice, date_debut_periode, date_fin_periode) => {
    const data = await getEtatFinancierComplet(id_compte, id_dossier, id_exercice, date_debut_periode, date_fin_periode);
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
                    text: isTitre ? '' : formatAmount(row.montantnet),
                    fillColor: bgColor,
                    alignment: 'right',
                    valign: 'middle',
                    margin: [0, 2, 0, 2]
                },
                {
                    text: isTitre ? '' : formatAmount(row.montantnetn1),
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

const generateTftdContent = async (id_compte, id_dossier, id_exercice, date_debut_periode, date_fin_periode) => {
    const data = await getEtatFinancierComplet(id_compte, id_dossier, id_exercice, date_debut_periode, date_fin_periode);
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
                    text: isTitre ? '' : formatAmount(row.montantnet),
                    fillColor: bgColor,
                    alignment: 'right',
                    valign: 'middle',
                    margin: [0, 2, 0, 2]
                },
                {
                    text: isTitre ? '' : formatAmount(row.montantnetn1),
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

const generateTftiContent = async (id_compte, id_dossier, id_exercice, date_debut_periode, date_fin_periode) => {
    const data = await getEtatFinancierComplet(id_compte, id_dossier, id_exercice, date_debut_periode, date_fin_periode);
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
                    text: isTitre ? "" : formatAmount(row.montantnet),
                    fillColor: bgColor,
                    alignment: 'right',
                    valign: 'middle',
                    margin: [0, 2, 0, 2]
                },
                {
                    text: isTitre ? "" : formatAmount(row.montantnetn1),
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

const generateEvcpContent = async (id_compte, id_dossier, id_exercice) => {
    const evcpData = await rubriqueExternesEvcp.findAll({
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
                    text: formatAmount(row.capitalsocial),
                    fillColor: bgColor,
                    alignment: 'right',
                    valign: 'middle',
                    margin: [0, 2, 0, 2]
                },
                {
                    text: formatAmount(row.primereserve),
                    fillColor: bgColor,
                    alignment: 'right',
                    valign: 'middle',
                    margin: [0, 2, 0, 2]
                },
                {
                    text: formatAmount(row.ecartdevaluation),
                    fillColor: bgColor,
                    alignment: 'right',
                    valign: 'middle',
                    margin: [0, 2, 0, 2]
                },
                {
                    text: formatAmount(row.resultat),
                    fillColor: bgColor,
                    alignment: 'right',
                    valign: 'middle',
                    margin: [0, 2, 0, 2]
                },
                {
                    text: formatAmount(row.report_anouveau),
                    fillColor: bgColor,
                    alignment: 'right',
                    valign: 'middle',
                    margin: [0, 2, 0, 2]
                },
                {
                    text: formatAmount(row.total_varcap),
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

const generateSigContent = async (id_compte, id_dossier, id_exercice, date_debut_periode, date_fin_periode) => {
    const sigData = await getSigComplet(id_compte, id_dossier, id_exercice, date_debut_periode, date_fin_periode);
    const buildTable = (data) => {
        const body = [];

        body.push([
            { text: 'Rubriques', style: 'tableHeader' },
            { text: 'Montant net N', style: 'tableHeader', alignment: 'right' },
            { text: '%(N)', style: 'tableHeader', alignment: 'center' },
            { text: 'Montant net N-1', style: 'tableHeader', alignment: 'right' },
            { text: '%(N-1)', style: 'tableHeader', alignment: 'center' },
            { text: 'Variation N/N-1', style: 'tableHeader', alignment: 'right' },
            { text: '%(Var)', style: 'tableHeader', alignment: 'center' },
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
                    text: isTitre ? "" : formatAmount(row.montantnet),
                    fillColor: bgColor,
                    alignment: 'right',
                    valign: 'middle',
                    margin: [0, 2, 0, 2]
                },
                {
                    text: isTitre ? "" : row.pourcentagen || 0,
                    fillColor: bgColor,
                    alignment: 'center',
                    valign: 'middle',
                    margin: [0, 2, 0, 2]
                },
                {
                    text: isTitre ? "" : formatAmount(row.montantnetn1),
                    fillColor: bgColor,
                    alignment: 'right',
                    valign: 'middle',
                    margin: [0, 2, 0, 2]
                },
                {
                    text: isTitre ? "" : row.pourcentagen1 || 0,
                    fillColor: bgColor,
                    alignment: 'center',
                    valign: 'middle',
                    margin: [0, 2, 0, 2]
                },
                {
                    text: isTitre ? "" : row.variation || 0,
                    fillColor: bgColor,
                    alignment: 'right',
                    valign: 'middle',
                    margin: [0, 2, 0, 2]
                },
                {
                    text: isTitre ? "" : row.pourcentagevariation || 0,
                    fillColor: bgColor,
                    alignment: 'center',
                    valign: 'middle',
                    margin: [0, 2, 0, 2]
                },
            ]);
        });

        return [
            {
                table: {
                    headerRows: 1,
                    widths: ['37%', '15%', '6%', '15%', '6%', '15%', '6%'],
                    body
                },
                layout: 'lightHorizontalLines'
            }
        ];
    };

    return {
        buildTable,
        sigData
    }
}

module.exports = {
    generateBilanContent,
    generateBilanActifContent,
    generateBilanPassifContent,
    generateCrnContent,
    generateCrfContent,
    generateTftdContent,
    generateTftiContent,
    generateEvcpContent,
    generateSigContent
}