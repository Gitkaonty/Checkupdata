require('dotenv').config();
const recupTableau = require('../../Middlewares/Ebilan/recupTableau');

const recupEbilan = require('../../Middlewares/Declaration/Ebilan/EblianMiddleware');
const getEbilanComplet = recupEbilan.getEbilanComplet;

const formatAmount = (value) => {
    if (value === null || value === undefined) return '';

    const absValue = Math.abs(Number(value));
    let str = absValue.toFixed(2);
    str = str.replace(/\B(?=(\d{3})+(?!\d))/g, ' ').replace('.', ',');

    return Number(value) < 0 ? `- ${str}` : str;
};

const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const [jour, mois, annee] = dateStr.split('-');

    return `${annee}/${mois.padStart(2, '0')}/${jour.padStart(2, '0')}`;
};

const generateBilanContent = async (id_compte, id_dossier, id_exercice) => {
    const data = await getEbilanComplet(id_compte, id_dossier, id_exercice);

    const bilanActif = data.filter(val => val.id_etat === 'BILAN' && val.subtable === 1);
    const bilanPassif = data.filter(val => val.id_etat === 'BILAN' && val.subtable === 2);

    const buildTable = (data, type) => {
        const body = [];

        if (type === 'actif') {
            body.push([
                { text: 'Actif', style: 'tableHeader' },
                { text: 'Note', style: 'tableHeader' },
                { text: 'Montant brut', style: 'tableHeader', alignment: 'right' },
                { text: 'Amort./Perte val.', style: 'tableHeader', alignment: 'right' },
                { text: 'Montant net N', style: 'tableHeader', alignment: 'right' },
                { text: 'Montant net N-1', style: 'tableHeader', alignment: 'right' }
            ]);

            data.forEach(row => {
                const isLevel0 = row.niveau === 0;
                const isLevel4 = row.niveau === 4;
                const bgColor = isLevel4 ? '#89A8B2' : isLevel0 ? '#f0f0f0' : null;

                body.push([
                    { text: row.libelle || '', fillColor: bgColor, alignment: 'left', valign: 'middle', margin: [0, 2, 0, 2] },
                    { text: row.note || '', fillColor: bgColor, alignment: 'left', valign: 'middle', margin: [0, 2, 0, 2] },
                    { text: isLevel0 ? '' : formatAmount(row.montantbrut), fillColor: bgColor, alignment: 'right', valign: 'middle', margin: [0, 2, 0, 2] },
                    { text: isLevel0 ? '' : formatAmount(row.montantamort), fillColor: bgColor, alignment: 'right', valign: 'middle', margin: [0, 2, 0, 2] },
                    { text: isLevel0 ? '' : formatAmount(row.montantnet), fillColor: bgColor, alignment: 'right', valign: 'middle', margin: [0, 2, 0, 2] },
                    { text: isLevel0 ? '' : formatAmount(row.montantnetn1), fillColor: bgColor, alignment: 'right', valign: 'middle', margin: [0, 2, 0, 2] }
                ]);
            });

        } else if (type === 'passif') {
            body.push([
                { text: 'Capitaux propres', style: 'tableHeader' },
                { text: 'Note', style: 'tableHeader' },
                { text: 'Montant N', style: 'tableHeader', alignment: 'right' },
                { text: 'Montant N-1', style: 'tableHeader', alignment: 'right' }
            ]);

            data.forEach(row => {
                const isLevel0 = row.niveau === 0;
                const isLevel4 = row.niveau === 4;
                const bgColor = isLevel4 ? '#89A8B2' : isLevel0 ? '#f0f0f0' : null;

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
                        text: isLevel0 ? '' : formatAmount(row.montantnet),
                        fillColor: bgColor,
                        alignment: 'right',
                        valign: 'middle',
                        margin: [0, 2, 0, 2]
                    },
                    {
                        text: isLevel0 ? '' : formatAmount(row.montantnetn1),
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
                        ? ['30%', '12%', '14.5%', '14.5%', '14.5%', '14.5%']
                        : ['48%', '12%', '20%', '20%'],
                    body
                },
                layout: 'lightHorizontalLines'
            }
        ];
    };

    return {
        buildTable,
        bilanActif,
        bilanPassif
    };
};

const generateBilanActifContent = async (id_compte, id_dossier, id_exercice) => {
    const data = await getEbilanComplet(id_compte, id_dossier, id_exercice);

    const bilanActif = data.filter(val => val.id_etat === 'BILAN' && val.subtable === 1);

    const buildTable = (data, type) => {
        const body = [];
        body.push([
            { text: 'Actif', style: 'tableHeader' },
            { text: 'Note', style: 'tableHeader' },
            { text: 'Montant brut', style: 'tableHeader', alignment: 'right' },
            { text: 'Amort./Perte val.', style: 'tableHeader', alignment: 'right' },
            { text: 'Montant net N', style: 'tableHeader', alignment: 'right' },
            { text: 'Montant net N-1', style: 'tableHeader', alignment: 'right' }
        ]);

        data.forEach(row => {
            const isLevel0 = row.niveau === 0;
            const isLevel4 = row.niveau === 4;
            const bgColor = isLevel4 ? '#89A8B2' : isLevel0 ? '#f0f0f0' : null;

            body.push([
                { text: row.libelle || '', fillColor: bgColor, alignment: 'left', valign: 'middle', margin: [0, 2, 0, 2] },
                { text: row.note || '', fillColor: bgColor, alignment: 'left', valign: 'middle', margin: [0, 2, 0, 2] },
                { text: isLevel0 ? '' : formatAmount(row.montantbrut), fillColor: bgColor, alignment: 'right', valign: 'middle', margin: [0, 2, 0, 2] },
                { text: isLevel0 ? '' : formatAmount(row.montantamort), fillColor: bgColor, alignment: 'right', valign: 'middle', margin: [0, 2, 0, 2] },
                { text: isLevel0 ? '' : formatAmount(row.montantnet), fillColor: bgColor, alignment: 'right', valign: 'middle', margin: [0, 2, 0, 2] },
                { text: isLevel0 ? '' : formatAmount(row.montantnetn1), fillColor: bgColor, alignment: 'right', valign: 'middle', margin: [0, 2, 0, 2] }
            ]);
        });
        return [
            {
                table: {
                    headerRows: 1,
                    widths: ['30%', '12%', '14.5%', '14.5%', '14.5%', '14.5%'],
                    body
                },
                layout: 'lightHorizontalLines'
            }
        ];
    };

    return {
        buildTable,
        bilanActif,
    };
}

const generateBilanPassifContent = async (id_compte, id_dossier, id_exercice) => {
    const data = await getEbilanComplet(id_compte, id_dossier, id_exercice);

    const bilanPassif = data.filter(val => val.id_etat === 'BILAN' && val.subtable === 2);

    const buildTable = (data, type) => {
        const body = [];
        body.push([
            { text: 'Capitaux propres', style: 'tableHeader' },
            { text: 'Note', style: 'tableHeader' },
            { text: 'Montant N', style: 'tableHeader', alignment: 'right' },
            { text: 'Montant N-1', style: 'tableHeader', alignment: 'right' }
        ]);

        data.forEach(row => {
            const isLevel0 = row.niveau === 0;
            const isLevel4 = row.niveau === 4;
            const bgColor = isLevel4 ? '#89A8B2' : isLevel0 ? '#f0f0f0' : null;

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
                    text: isLevel0 ? '' : formatAmount(row.montantnet),
                    fillColor: bgColor,
                    alignment: 'right',
                    valign: 'middle',
                    margin: [0, 2, 0, 2]
                },
                {
                    text: isLevel0 ? '' : formatAmount(row.montantnetn1),
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
                    widths: ['48%', '12%', '20%', '20%'],
                    body
                },
                layout: 'lightHorizontalLines'
            }
        ];
    };

    return {
        buildTable,
        bilanPassif
    };
};

const generateCrnContent = async (id_compte, id_dossier, id_exercice) => {
    const data = await getEbilanComplet(id_compte, id_dossier, id_exercice);

    const crn = data.filter(val => val.id_etat === 'CRN' && val.subtable === 0);

    const buildTable = (data) => {
        const body = [];

        body.push([
            { text: 'Rubriques', style: 'tableHeader' },
            { text: 'Note', style: 'tableHeader' },
            { text: 'Montant net N', style: 'tableHeader', alignment: 'right' },
            { text: 'Montant net N-1', style: 'tableHeader', alignment: 'right' }
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
                    text: formatAmount(row.montantnet),
                    fillColor: bgColor,
                    alignment: 'right',
                    valign: 'middle',
                    margin: [0, 2, 0, 2]
                },
                {
                    text: formatAmount(row.montantnetn1),
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
                    widths: ['48%', '12%', '20%', '20%'],
                    body
                },
                layout: 'lightHorizontalLines'
            }
        ];
    };

    return {
        buildTable,
        crn
    }
}

const generateCrfContent = async (id_compte, id_dossier, id_exercice) => {
    const data = await getEbilanComplet(id_compte, id_dossier, id_exercice);

    const crf = data.filter(val => val.id_etat === 'CRF' && val.subtable === 0);

    const buildTable = (data) => {
        const body = [];

        body.push([
            { text: 'Rubriques', style: 'tableHeader' },
            { text: 'Note', style: 'tableHeader' },
            { text: 'Montant net N', style: 'tableHeader', alignment: 'right' },
            { text: 'Montant net N-1', style: 'tableHeader', alignment: 'right' }
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
                    text: formatAmount(row.montantnet),
                    fillColor: bgColor,
                    alignment: 'right',
                    valign: 'middle',
                    margin: [0, 2, 0, 2]
                },
                {
                    text: formatAmount(row.montantnetn1),
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
                    widths: ['48%', '12%', '20%', '20%'],
                    body
                },
                layout: 'lightHorizontalLines'
            }
        ];
    };

    return {
        buildTable,
        crf
    }
}

const generateTftdContent = async (id_compte, id_dossier, id_exercice) => {
    const data = await getEbilanComplet(id_compte, id_dossier, id_exercice);

    const tftd = data.filter(val => val.id_etat === 'TFTD' && val.subtable === 0);

    const buildTable = (data) => {
        const body = [];

        body.push([
            { text: 'Rubriques', style: 'tableHeader' },
            { text: 'Note', style: 'tableHeader' },
            { text: 'Sens', style: 'tableHeader', alignment: 'center' },
            { text: 'Montant net N', style: 'tableHeader', alignment: 'right' },
            { text: 'Montant net N-1', style: 'tableHeader', alignment: 'right' }
        ]);

        data.forEach(row => {
            const isLevel1 = row.niveau === 1;
            const isLevel4 = row.niveau === 4;
            const bgColor = isLevel4 ? '#89A8B2' : isLevel1 ? '#f0f0f0' : null;

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
                    text: row.senscalcul || '',
                    fillColor: bgColor,
                    alignment: 'center',
                    valign: 'middle',
                    margin: [0, 2, 0, 2]
                },
                {
                    text: isLevel1 ? "" : formatAmount(row.montantnet),
                    fillColor: bgColor,
                    alignment: 'right',
                    valign: 'middle',
                    margin: [0, 2, 0, 2]
                },
                {
                    text: isLevel1 ? "" : formatAmount(row.montantnetn1),
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
                    widths: ['48%', '12%', '8%', '16%', '16%'],
                    body
                },
                layout: 'lightHorizontalLines'
            }
        ];
    };

    return {
        buildTable,
        tftd
    }
}

const generateTftiContent = async (id_compte, id_dossier, id_exercice) => {
    const data = await getEbilanComplet(id_compte, id_dossier, id_exercice);

    const tfti = data.filter(val => val.id_etat === 'TFTI' && val.subtable === 0);

    const buildTable = (data) => {
        const body = [];

        body.push([
            { text: 'Rubriques', style: 'tableHeader' },
            { text: 'Note', style: 'tableHeader' },
            { text: 'Montant net N', style: 'tableHeader', alignment: 'right' },
            { text: 'Montant net N-1', style: 'tableHeader', alignment: 'right' }
        ]);

        data.forEach(row => {
            const isLevel1 = row.niveau === 1;
            const isLevel4 = row.niveau === 4;
            const bgColor = isLevel4 ? '#89A8B2' : isLevel1 ? '#f0f0f0' : null;

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
                    text: isLevel1 ? "" : formatAmount(row.montantnet),
                    fillColor: bgColor,
                    alignment: 'right',
                    valign: 'middle',
                    margin: [0, 2, 0, 2]
                },
                {
                    text: isLevel1 ? "" : formatAmount(row.montantnetn1),
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
                    widths: ['48%', '12%', '20%', '20%'],
                    body
                },
                layout: 'lightHorizontalLines'
            }
        ];
    };

    return {
        buildTable,
        tfti
    }
}

const generateEvcpContent = async (id_compte, id_dossier, id_exercice) => {
    const evcp = await recupTableau.recupEVCP(id_compte, id_dossier, id_exercice);

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
                    text: row.rubriquesmatrix?.libelle || '',
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
        evcp
    }
}

const generateDrfContent = async (id_compte, id_dossier, id_exercice) => {
    const drf = await recupTableau.recupDRF(id_compte, id_dossier, id_exercice);

    const buildTable = (data) => {
        const body = [];

        body.push([
            { text: 'Rubriques', style: 'tableHeader' },
            { text: 'Note', style: 'tableHeader' },
            { text: 'Signe', style: 'tableHeader', alignment: 'center' },
            { text: 'Montant', style: 'tableHeader', alignment: 'right' }
        ]);

        data.forEach(row => {
            const isLevel1 = row.niveau === 1;
            const isLevel4 = row.niveau === 4;
            const bgColor = isLevel4 ? '#89A8B2' : isLevel1 ? '#f0f0f0' : null;

            body.push([
                {
                    text: row.rubriquesmatrix?.libelle || '',
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
                    text: row.signe,
                    fillColor: bgColor,
                    alignment: 'center',
                    valign: 'middle',
                    margin: [0, 2, 0, 2]
                },
                {
                    text: formatAmount(row.montant_brut),
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
                    widths: ['57%', '22%', '7%', '14%'],
                    body
                },
                layout: 'lightHorizontalLines'
            }
        ];
    };

    return {
        buildTable,
        drf
    }
}

const generateBhiapcContent = async (id_compte, id_dossier, id_exercice) => {
    const bhiapc = await recupTableau.recupBHIAPC(id_compte, id_dossier, id_exercice);

    const buildTable = (data) => {
        const body = [];

        body.push([
            { text: 'NIF', style: 'tableHeader' },
            { text: 'Raison sociale', style: 'tableHeader' },
            { text: 'Adresse', style: 'tableHeader' },
            { text: 'Montant charge', style: 'tableHeader', alignment: 'right' },
            { text: 'Montant bénéfiaire', style: 'tableHeader', alignment: 'right' }
        ]);
        let totalCharge = 0;
        let totalBenef = 0;

        data.forEach(row => {
            totalCharge += parseFloat(row.montant_charge) || 0;
            totalBenef += parseFloat(row.montant_beneficiaire) || 0;
            body.push([
                {
                    text: row.nif,
                    alignment: 'left',
                    valign: 'middle',
                    margin: [0, 2, 0, 2]
                },
                {
                    text: row.raison_sociale,
                    alignment: 'left',
                    valign: 'middle',
                    margin: [0, 2, 0, 2]
                },
                {
                    text: row.adresse,
                    alignment: 'left',
                    valign: 'middle',
                    margin: [0, 2, 0, 2]
                },
                {
                    text: formatAmount(row.montant_charge),
                    alignment: 'right',
                    valign: 'middle',
                    margin: [0, 2, 0, 2]
                },
                {
                    text: formatAmount(row.montant_beneficiaire),
                    alignment: 'right',
                    valign: 'middle',
                    margin: [0, 2, 0, 2]
                }
            ]);
        });
        body.push([
            {
                text: 'TOTAL',
                bold: true,
                alignment: 'left',
                margin: [0, 2, 0, 2],
                fillColor: '#89A8B2',
            },
            {
                text: '',
                fillColor: '#89A8B2',
            },
            {
                text: '',
                fillColor: '#89A8B2',
            },
            {
                text: formatAmount(totalCharge),
                bold: true,
                alignment: 'right',
                margin: [0, 2, 0, 2],
                fillColor: '#89A8B2',
            },
            {
                text: formatAmount(totalBenef),
                bold: true,
                alignment: 'right',
                margin: [0, 2, 0, 2],
                fillColor: '#89A8B2',
            }
        ]);

        return [
            {
                table: {
                    headerRows: 1,
                    widths: ['20%', '20%', '20%', '20%', '20%'],
                    body
                },
                layout: 'lightHorizontalLines'
            }
        ];
    };

    return {
        buildTable,
        bhiapc
    }
}

const generateMpContent = async (id_compte, id_dossier, id_exercice) => {
    const mp = await recupTableau.recupMP(id_compte, id_dossier, id_exercice);

    const buildTable = (data) => {
        const body = [];

        body.push([
            { text: 'Marché', style: 'tableHeader' },
            { text: 'Référence', style: 'tableHeader' },
            { text: 'Date', style: 'tableHeader' },
            { text: 'Date payement', style: 'tableHeader' },
            { text: 'Montant HT', style: 'tableHeader', alignment: 'right' },
            { text: 'Montant payé', style: 'tableHeader', alignment: 'right' },
            { text: 'TMP', style: 'tableHeader', alignment: 'right' }
        ]);
        let totalMarche = 0;
        let totalPaye = 0;
        let totalTmp = 0;

        data.forEach(row => {
            totalMarche += parseFloat(row.montant_marche_ht) || 0;
            totalPaye += parseFloat(row.montant_paye) || 0;
            totalTmp += parseFloat(row.tmp) || 0;
            body.push([
                {
                    text: row.marche,
                    alignment: 'left',
                    valign: 'middle',
                    margin: [0, 2, 0, 2]
                },
                {
                    text: row.ref_marche,
                    alignment: 'left',
                    valign: 'middle',
                    margin: [0, 2, 0, 2]
                },
                {
                    text: formatDate(row.date),
                    alignment: 'left',
                    valign: 'middle',
                    margin: [0, 2, 0, 2]
                },
                {
                    text: formatDate(row.date_paiement),
                    alignment: 'left',
                    valign: 'middle',
                    margin: [0, 2, 0, 2]
                },
                {
                    text: formatAmount(row.montant_marche_ht),
                    alignment: 'right',
                    valign: 'middle',
                    margin: [0, 2, 0, 2]
                },
                {
                    text: formatAmount(row.montant_paye),
                    alignment: 'right',
                    valign: 'middle',
                    margin: [0, 2, 0, 2]
                },
                {
                    text: formatAmount(row.tmp),
                    alignment: 'right',
                    valign: 'middle',
                    margin: [0, 2, 0, 2]
                }
            ]);
        });
        body.push([
            {
                text: 'TOTAL',
                bold: true,
                alignment: 'left',
                margin: [0, 2, 0, 2],
                fillColor: '#89A8B2',
            },
            {
                text: '',
                fillColor: '#89A8B2',
            },
            {
                text: '',
                fillColor: '#89A8B2',
            },
            {
                text: '',
                fillColor: '#89A8B2',
            },
            {
                text: formatAmount(totalMarche),
                bold: true,
                alignment: 'right',
                margin: [0, 2, 0, 2],
                fillColor: '#89A8B2',
            },
            {
                text: formatAmount(totalPaye),
                bold: true,
                alignment: 'right',
                margin: [0, 2, 0, 2],
                fillColor: '#89A8B2',
            },
            {
                text: formatAmount(totalTmp),
                bold: true,
                alignment: 'right',
                margin: [0, 2, 0, 2],
                fillColor: '#89A8B2',
            }
        ]);

        return [
            {
                table: {
                    headerRows: 1,
                    widths: [
                        '14.28%', // Marché
                        '14.28%', // Référence
                        '14.28%', // Date
                        '14.28%', // Date paiement
                        '14.28%', // Montant HT
                        '14.2%', // Montant payé
                        '14.28%'  // TMP
                    ],
                    body
                },
                layout: 'lightHorizontalLines'
            }
        ];
    };

    return {
        buildTable,
        mp
    }
}

const generateDaContent = async (id_compte, id_dossier, id_exercice) => {
    const da = await recupTableau.recupDA(id_compte, id_dossier, id_exercice);

    const buildTable = (data) => {
        const body = [];

        body.push([
            { text: 'Designation', style: 'tableHeader' },
            { text: 'N° compte', style: 'tableHeader' },
            { text: 'Date acquis.', style: 'tableHeader' },
            { text: 'Taux', style: 'tableHeader', alignment: 'center' },
            { text: 'Valeur acquis. (A)', style: 'tableHeader', alignment: 'right' },
            { text: 'Augmentation (B)', style: 'tableHeader', alignment: 'right' },
            { text: 'Diminution (C)', style: 'tableHeader', alignment: 'right' },
            { text: 'Amort. cumulés en début d\'éxercice (D)', style: 'tableHeader', alignment: 'right' },
            { text: 'Dot. exercice (E)', style: 'tableHeader', alignment: 'right' },
            { text: 'Amort. cumulés en fin d\'éxercice (F) = (D)+(E)', style: 'tableHeader', alignment: 'right' },
            { text: 'Valeur nette comptable (G) = (A)+(B)-(C)-(F)', style: 'tableHeader', alignment: 'right' },
        ]);

        let total_valeur_acquisition = 0;
        let total_augmentation = 0;
        let total_diminution = 0;
        let total_amort_anterieur_debut = 0;
        let total_dotation_exercice = 0;
        let total_amort_cumule_fin = 0;
        let total_valeur_nette = 0;

        let currentRubrique = null;
        let sousTotal = {
            valeur_acquisition: 0,
            augmentation: 0,
            diminution: 0,
            amort_anterieur: 0,
            dotation_exercice: 0,
            amort_cumule: 0,
            valeur_nette: 0
        };

        data.forEach((row, index) => {
            total_valeur_acquisition += parseFloat(row.valeur_acquisition) || 0;
            total_augmentation += parseFloat(row.augmentation) || 0;
            total_diminution += parseFloat(row.diminution) || 0;
            total_amort_anterieur_debut += parseFloat(row.amort_anterieur) || 0;
            total_dotation_exercice += parseFloat(row.dotation_exercice) || 0;
            total_amort_cumule_fin += parseFloat(row.amort_cumule) || 0;
            total_valeur_nette += parseFloat(row.valeur_nette) || 0;
            // Détecter changement de rubrique
            if (row.rubriques_poste !== currentRubrique) {
                // Ajouter ligne sous-total du groupe précédent si ce n'est pas le premier
                if (currentRubrique !== null) {
                    body.push([
                        { text: `SOUS-TOTAL`, bold: true, fillColor: '#859e9e', margin: [0, 2, 0, 2] },
                        { text: '', bold: true, alignment: 'right', fillColor: '#859e9e', margin: [0, 2, 0, 2] },
                        { text: '', bold: true, alignment: 'right', fillColor: '#859e9e', margin: [0, 2, 0, 2] },
                        { text: '', bold: true, alignment: 'right', fillColor: '#859e9e', margin: [0, 2, 0, 2] },
                        { text: formatAmount(sousTotal.valeur_acquisition), bold: true, alignment: 'right', fillColor: '#859e9e', margin: [0, 2, 0, 2] },
                        { text: formatAmount(sousTotal.augmentation), bold: true, alignment: 'right', fillColor: '#859e9e', margin: [0, 2, 0, 2] },
                        { text: formatAmount(sousTotal.diminution), bold: true, alignment: 'right', fillColor: '#859e9e', margin: [0, 2, 0, 2] },
                        { text: formatAmount(sousTotal.amort_anterieur), bold: true, alignment: 'right', fillColor: '#859e9e', margin: [0, 2, 0, 2] },
                        { text: formatAmount(sousTotal.dotation_exercice), bold: true, alignment: 'right', fillColor: '#859e9e', margin: [0, 2, 0, 2] },
                        { text: formatAmount(sousTotal.amort_cumule), bold: true, alignment: 'right', fillColor: '#859e9e', margin: [0, 2, 0, 2] },
                        { text: formatAmount(sousTotal.valeur_nette), bold: true, alignment: 'right', fillColor: '#859e9e', margin: [0, 2, 0, 2] }
                    ]);
                }

                // Mettre à jour la rubrique courante
                currentRubrique = row.rubriques_poste;

                let rubriqueLabel =
                    currentRubrique === "GOODWILL" ? "GOODWILL" :
                        currentRubrique === "IMMO_CORP" ? "Immobilisations corporelles" :
                            currentRubrique === "IMMO_ENCOURS" ? "Immobilisations en cours" :
                                currentRubrique === "IMMO_FIN" ? "Immobilisations financières" :
                                    currentRubrique === "IMMO_INCORP" ? "Immobilisations incorporelles" :
                                        "Indéfinie";

                // Ajouter une ligne de titre pour la nouvelle rubrique
                body.push([
                    {
                        text: rubriqueLabel,
                        bold: true,
                        colSpan: 11,
                        fillColor: '#D5DBDB',
                        margin: [0, 2, 0, 2]
                    },
                    {}, {}, {}, {}, {}, {}, {}, {}, {}, {}
                ]);

                // Réinitialiser les sous-totaux
                sousTotal = {
                    valeur_acquisition: 0,
                    augmentation: 0,
                    diminution: 0,
                    amort_anterieur: 0,
                    dotation_exercice: 0,
                    amort_cumule: 0,
                    valeur_nette: 0
                };
            }

            // Ajouter les valeurs de la ligne au sous-total
            sousTotal.valeur_acquisition += parseFloat(row.valeur_acquisition) || 0;
            sousTotal.augmentation += parseFloat(row.augmentation) || 0;
            sousTotal.diminution += parseFloat(row.diminution) || 0;
            sousTotal.amort_anterieur += parseFloat(row.amort_anterieur) || 0;
            sousTotal.dotation_exercice += parseFloat(row.dotation_exercice) || 0;
            sousTotal.amort_cumule += parseFloat(row.amort_cumule) || 0;
            sousTotal.valeur_nette += parseFloat(row.valeur_nette) || 0;

            // Ajouter la ligne normale
            body.push([
                { text: row.libelle, alignment: 'left', valign: 'middle', margin: [0, 2, 0, 2] },
                { text: row.num_compte, alignment: 'left', valign: 'middle', margin: [0, 2, 0, 2] },
                { text: formatDate(row.date_acquisition), alignment: 'left', valign: 'middle', margin: [0, 2, 0, 2] },
                { text: row.taux, alignment: 'center', valign: 'middle', margin: [0, 2, 0, 2] },
                { text: formatAmount(row.valeur_acquisition), alignment: 'right', valign: 'middle', margin: [0, 2, 0, 2] },
                { text: formatAmount(row.augmentation), alignment: 'right', valign: 'middle', margin: [0, 2, 0, 2] },
                { text: formatAmount(row.diminution), alignment: 'right', valign: 'middle', margin: [0, 2, 0, 2] },
                { text: formatAmount(row.amort_anterieur), alignment: 'right', valign: 'middle', margin: [0, 2, 0, 2] },
                { text: formatAmount(row.dotation_exercice), alignment: 'right', valign: 'middle', margin: [0, 2, 0, 2] },
                { text: formatAmount(row.amort_cumule), alignment: 'right', valign: 'middle', margin: [0, 2, 0, 2] },
                { text: formatAmount(row.valeur_nette), alignment: 'right', valign: 'middle', margin: [0, 2, 0, 2] }
            ]);

            // Si c’est la dernière ligne, ajouter le sous-total final
            if (index === data.length - 1) {
                body.push([
                    { text: `SOUS-TOTAL`, bold: true, fillColor: '#859e9e', margin: [0, 2, 0, 2] },
                    { text: '', bold: true, alignment: 'right', fillColor: '#859e9e', margin: [0, 2, 0, 2] },
                    { text: '', bold: true, alignment: 'right', fillColor: '#859e9e', margin: [0, 2, 0, 2] },
                    { text: '', bold: true, alignment: 'right', fillColor: '#859e9e', margin: [0, 2, 0, 2] },
                    { text: formatAmount(sousTotal.valeur_acquisition), bold: true, alignment: 'right', fillColor: '#859e9e', margin: [0, 2, 0, 2] },
                    { text: formatAmount(sousTotal.augmentation), bold: true, alignment: 'right', fillColor: '#859e9e', margin: [0, 2, 0, 2] },
                    { text: formatAmount(sousTotal.diminution), bold: true, alignment: 'right', fillColor: '#859e9e', margin: [0, 2, 0, 2] },
                    { text: formatAmount(sousTotal.amort_anterieur), bold: true, alignment: 'right', fillColor: '#859e9e', margin: [0, 2, 0, 2] },
                    { text: formatAmount(sousTotal.dotation_exercice), bold: true, alignment: 'right', fillColor: '#859e9e', margin: [0, 2, 0, 2] },
                    { text: formatAmount(sousTotal.amort_cumule), bold: true, alignment: 'right', fillColor: '#859e9e', margin: [0, 2, 0, 2] },
                    { text: formatAmount(sousTotal.valeur_nette), bold: true, alignment: 'right', fillColor: '#859e9e', margin: [0, 2, 0, 2] }
                ]);
            }
        });

        body.push([
            {
                text: 'TOTAL',
                bold: true,
                alignment: 'left',
                margin: [0, 2, 0, 2],
                fillColor: '#89A8B2',
            },
            {
                text: '',
                fillColor: '#89A8B2',
            },
            {
                text: '',
                fillColor: '#89A8B2',
            },
            {
                text: '',
                fillColor: '#89A8B2',
            },
            {
                text: formatAmount(total_valeur_acquisition),
                bold: true,
                alignment: 'right',
                margin: [0, 2, 0, 2],
                fillColor: '#89A8B2',
            },
            {
                text: formatAmount(total_augmentation),
                bold: true,
                alignment: 'right',
                margin: [0, 2, 0, 2],
                fillColor: '#89A8B2',
            },
            {
                text: formatAmount(total_diminution),
                bold: true,
                alignment: 'right',
                margin: [0, 2, 0, 2],
                fillColor: '#89A8B2',
            },
            {
                text: formatAmount(total_amort_anterieur_debut),
                bold: true,
                alignment: 'right',
                margin: [0, 2, 0, 2],
                fillColor: '#89A8B2',
            },
            {
                text: formatAmount(total_dotation_exercice),
                bold: true,
                alignment: 'right',
                margin: [0, 2, 0, 2],
                fillColor: '#89A8B2',
            },
            {
                text: formatAmount(total_amort_cumule_fin),
                bold: true,
                alignment: 'right',
                margin: [0, 2, 0, 2],
                fillColor: '#89A8B2',
            },
            {
                text: formatAmount(total_valeur_nette),
                bold: true,
                alignment: 'right',
                margin: [0, 2, 0, 2],
                fillColor: '#89A8B2',
            }
        ]);

        return [
            {
                table: {
                    headerRows: 1,
                    widths: [
                        '14%', // Designation
                        '9%', // N° compte
                        '8%', // Date acquis
                        '5%', // Taux
                        '9%', // Valeur acquis
                        '9%', // Augmentation
                        '9%', // Diminution
                        '9%', // Amort cumulés en début d'exercice
                        '9%', // Dotation exercice
                        '9%', // Amort cumulés en fin d'exercice
                        '9%'  // Valeur nette comptable
                    ],
                    body
                },
                layout: 'lightHorizontalLines'
            }
        ];
    };

    return {
        buildTable,
        da
    }
}

const generateDpContent = async (id_compte, id_dossier, id_exercice) => {
    const dp = await recupTableau.recupDP(id_compte, id_dossier, id_exercice);

    const buildTable = (data) => {
        const body = [];

        body.push([
            { text: 'Provisions', style: 'tableHeader' },
            { text: 'Montant début exercice (A)', style: 'tableHeader', alignment: 'right' },
            { text: 'Augmentation dot. de l\'exercice (B)', style: 'tableHeader', alignment: 'right' },
            { text: 'Diminution reprise de l\'exercice (C)', style: 'tableHeader', alignment: 'right' },
            { text: 'Montant fin exercice (D) = (A)+(B)-(C)', style: 'tableHeader', alignment: 'right' },
        ]);

        let total_montant_debut_ex = 0;
        let total_augm_dot_ex = 0;
        let total_dim_repr_ex = 0;
        let total_montant_fin = 0;

        let currentNature = null;
        let sousTotal = {
            montant_debut_ex: 0,
            augm_dot_ex: 0,
            dim_repr_ex: 0,
            montant_fin: 0,
        };

        data.forEach((row, index) => {
            total_montant_debut_ex += parseFloat(row.montant_debut_ex) || 0;
            total_augm_dot_ex += parseFloat(row.augm_dot_ex) || 0;
            total_dim_repr_ex += parseFloat(row.dim_repr_ex) || 0;
            total_montant_fin += parseFloat(row.montant_fin) || 0;
            // Détecter changement de rubrique
            if (row.nature_prov !== currentNature) {
                // Ajouter ligne sous-total du groupe précédent si ce n'est pas le premier
                if (currentNature !== null) {
                    body.push([
                        { text: `SOUS-TOTAL`, bold: true, fillColor: '#859e9e', margin: [0, 2, 0, 2] },
                        { text: formatAmount(sousTotal.montant_debut_ex), bold: true, alignment: 'right', fillColor: '#859e9e', margin: [0, 2, 0, 2] },
                        { text: formatAmount(sousTotal.augm_dot_ex), bold: true, alignment: 'right', fillColor: '#859e9e', margin: [0, 2, 0, 2] },
                        { text: formatAmount(sousTotal.dim_repr_ex), bold: true, alignment: 'right', fillColor: '#859e9e', margin: [0, 2, 0, 2] },
                        { text: formatAmount(sousTotal.montant_fin), bold: true, alignment: 'right', fillColor: '#859e9e', margin: [0, 2, 0, 2] },
                    ]);
                }

                // Mettre à jour la rubrique courante
                currentNature = row.nature_prov;

                // Ajouter une ligne de titre pour la nouvelle rubrique
                body.push([
                    {
                        text: currentNature,
                        bold: true,
                        colSpan: 5,
                        fillColor: '#D5DBDB',
                        margin: [0, 2, 0, 2]
                    },
                    {}, {}, {}, {}
                ]);

                // Réinitialiser les sous-totaux
                sousTotal = {
                    montant_debut_ex: 0,
                    augm_dot_ex: 0,
                    dim_repr_ex: 0,
                    montant_fin: 0,
                };
            }

            // Ajouter les valeurs de la ligne au sous-total
            sousTotal.montant_debut_ex += parseFloat(row.montant_debut_ex) || 0;
            sousTotal.augm_dot_ex += parseFloat(row.augm_dot_ex) || 0;
            sousTotal.dim_repr_ex += parseFloat(row.dim_repr_ex) || 0;
            sousTotal.montant_fin += parseFloat(row.montant_fin) || 0;

            // Ajouter la ligne normale
            body.push([
                { text: row.libelle, alignment: 'left', valign: 'middle', margin: [0, 2, 0, 2] },
                { text: formatAmount(row.montant_debut_ex), alignment: 'right', valign: 'middle', margin: [0, 2, 0, 2] },
                { text: formatAmount(row.augm_dot_ex), alignment: 'right', valign: 'middle', margin: [0, 2, 0, 2] },
                { text: formatAmount(row.dim_repr_ex), alignment: 'right', valign: 'middle', margin: [0, 2, 0, 2] },
                { text: formatAmount(row.montant_fin), alignment: 'right', valign: 'middle', margin: [0, 2, 0, 2] },
            ]);

            // Si c’est la dernière ligne, ajouter le sous-total final
            if (index === data.length - 1) {
                body.push([
                    { text: `SOUS-TOTAL`, bold: true, fillColor: '#859e9e', margin: [0, 2, 0, 2] },
                    { text: formatAmount(sousTotal.montant_debut_ex), bold: true, alignment: 'right', fillColor: '#859e9e', margin: [0, 2, 0, 2] },
                    { text: formatAmount(sousTotal.augm_dot_ex), bold: true, alignment: 'right', fillColor: '#859e9e', margin: [0, 2, 0, 2] },
                    { text: formatAmount(sousTotal.dim_repr_ex), bold: true, alignment: 'right', fillColor: '#859e9e', margin: [0, 2, 0, 2] },
                    { text: formatAmount(sousTotal.montant_fin), bold: true, alignment: 'right', fillColor: '#859e9e', margin: [0, 2, 0, 2] },
                ]);
            }
        });

        body.push([
            {
                text: 'TOTAL',
                bold: true,
                alignment: 'left',
                margin: [0, 2, 0, 2],
                fillColor: '#89A8B2',
            },
            {
                text: formatAmount(total_montant_debut_ex),
                bold: true,
                alignment: 'right',
                margin: [0, 2, 0, 2],
                fillColor: '#89A8B2',
            },
            {
                text: formatAmount(total_augm_dot_ex),
                bold: true,
                alignment: 'right',
                margin: [0, 2, 0, 2],
                fillColor: '#89A8B2',
            },
            {
                text: formatAmount(total_dim_repr_ex),
                bold: true,
                alignment: 'right',
                margin: [0, 2, 0, 2],
                fillColor: '#89A8B2',
            },
            {
                text: formatAmount(total_montant_fin),
                bold: true,
                alignment: 'right',
                margin: [0, 2, 0, 2],
                fillColor: '#89A8B2',
            },
        ]);

        return [
            {
                table: {
                    headerRows: 1,
                    widths: [
                        '20%', // Provision
                        '20%', // Montants début
                        '20%', // Augmentation
                        '20%', // Diminution
                        '20%', // Montant fin
                    ],
                    body
                },
                layout: 'lightHorizontalLines'
            }
        ];
    };

    return {
        buildTable,
        dp
    }
}

const generateEiafncContent = async (id_compte, id_dossier, id_exercice) => {
    const eiafnc = await recupTableau.recupEIAFNC(id_compte, id_dossier, id_exercice);

    const buildTable = (data) => {
        const body = [];

        body.push([
            { text: 'N° compte', style: 'tableHeader' },
            { text: 'Libelle', style: 'tableHeader', alignment: 'left' },
            { text: 'Valeur brut début de l\'exercice (A)', style: 'tableHeader', alignment: 'right' },
            { text: 'Augmentation de l\'exercice (B)', style: 'tableHeader', alignment: 'right' },
            { text: 'Diminution de l\'exercice (C)', style: 'tableHeader', alignment: 'right' },
            { text: 'Val. brut clôture (D) = (A)+(B)-(C)', style: 'tableHeader', alignment: 'right' },
        ]);

        let total_valeur_acquisition = 0;
        let total_augmentation = 0;
        let total_diminution = 0;
        let total_valeur_brute = 0;

        let currentRubriquesPoste = null;
        let sousTotal = {
            valeur_brute: 0,
            augmentation: 0,
            diminution: 0,
            valeur_brute: 0,
        };

        data.forEach((row, index) => {
            total_valeur_acquisition += parseFloat(row.valeur_acquisition) || 0;
            total_augmentation += parseFloat(row.augmentation) || 0;
            total_diminution += parseFloat(row.diminution) || 0;
            total_valeur_brute += parseFloat(row.valeur_brute) || 0;
            if (row.rubriques_poste !== currentRubriquesPoste) {
                if (currentRubriquesPoste !== null) {
                    body.push([
                        { text: `SOUS-TOTAL`, bold: true, fillColor: '#859e9e', margin: [0, 2, 0, 2] },
                        { text: '', fillColor: '#859e9e', margin: [0, 2, 0, 2] },
                        { text: formatAmount(sousTotal.valeur_acquisition), bold: true, alignment: 'right', fillColor: '#859e9e', margin: [0, 2, 0, 2] },
                        { text: formatAmount(sousTotal.augmentation), bold: true, alignment: 'right', fillColor: '#859e9e', margin: [0, 2, 0, 2] },
                        { text: formatAmount(sousTotal.diminution), bold: true, alignment: 'right', fillColor: '#859e9e', margin: [0, 2, 0, 2] },
                        { text: formatAmount(sousTotal.valeur_brute), bold: true, alignment: 'right', fillColor: '#859e9e', margin: [0, 2, 0, 2] },
                    ]);
                }

                currentRubriquesPoste = row.rubriques_poste;

                body.push([
                    {
                        text: currentRubriquesPoste,
                        bold: true,
                        colSpan: 6,
                        fillColor: '#D5DBDB',
                        margin: [0, 2, 0, 2]
                    },
                    {}, {}, {}, {}, {}
                ]);

                sousTotal = {
                    valeur_acquisition: 0,
                    augmentation: 0,
                    diminution: 0,
                    valeur_brute: 0,
                };
            }

            sousTotal.valeur_acquisition += parseFloat(row.valeur_acquisition) || 0;
            sousTotal.augmentation += parseFloat(row.augmentation) || 0;
            sousTotal.diminution += parseFloat(row.diminution) || 0;
            sousTotal.valeur_brute += parseFloat(row.valeur_brute) || 0;

            body.push([
                { text: row.num_compte, alignment: 'left', valign: 'middle', margin: [0, 2, 0, 2] },
                { text: row.libelle, alignment: 'left', valign: 'middle', margin: [0, 2, 0, 2] },
                { text: formatAmount(row.valeur_acquisition), alignment: 'right', valign: 'middle', margin: [0, 2, 0, 2] },
                { text: formatAmount(row.augmentation), alignment: 'right', valign: 'middle', margin: [0, 2, 0, 2] },
                { text: formatAmount(row.diminution), alignment: 'right', valign: 'middle', margin: [0, 2, 0, 2] },
                { text: formatAmount(row.valeur_brute), alignment: 'right', valign: 'middle', margin: [0, 2, 0, 2] },
            ]);

            if (index === data.length - 1) {
                body.push([
                    { text: `SOUS-TOTAL`, bold: true, fillColor: '#859e9e', margin: [0, 2, 0, 2] },
                    { text: '', fillColor: '#859e9e', margin: [0, 2, 0, 2] },
                    { text: formatAmount(sousTotal.valeur_acquisition), bold: true, alignment: 'right', fillColor: '#859e9e', margin: [0, 2, 0, 2] },
                    { text: formatAmount(sousTotal.augmentation), bold: true, alignment: 'right', fillColor: '#859e9e', margin: [0, 2, 0, 2] },
                    { text: formatAmount(sousTotal.diminution), bold: true, alignment: 'right', fillColor: '#859e9e', margin: [0, 2, 0, 2] },
                    { text: formatAmount(sousTotal.valeur_brute), bold: true, alignment: 'right', fillColor: '#859e9e', margin: [0, 2, 0, 2] },
                ]);
            }
        });

        body.push([
            {
                text: 'TOTAL',
                bold: true,
                alignment: 'left',
                margin: [0, 2, 0, 2],
                fillColor: '#89A8B2',
            },
            {
                text: '',
                margin: [0, 2, 0, 2],
                fillColor: '#89A8B2',
            },
            {
                text: formatAmount(total_valeur_acquisition),
                bold: true,
                alignment: 'right',
                margin: [0, 2, 0, 2],
                fillColor: '#89A8B2',
            },
            {
                text: formatAmount(total_augmentation),
                bold: true,
                alignment: 'right',
                margin: [0, 2, 0, 2],
                fillColor: '#89A8B2',
            },
            {
                text: formatAmount(total_diminution),
                bold: true,
                alignment: 'right',
                margin: [0, 2, 0, 2],
                fillColor: '#89A8B2',
            },
            {
                text: formatAmount(total_valeur_brute),
                bold: true,
                alignment: 'right',
                margin: [0, 2, 0, 2],
                fillColor: '#89A8B2',
            },
        ]);

        return [
            {
                table: {
                    headerRows: 1,
                    widths: [
                        '16.6%', // Num compte
                        '16.6%', // Libelle
                        '16.6%', // Valeur brut début
                        '16.6%', // Augmentation 
                        '16.6%', // Diminution
                        '16.6%', // Valeur brut cloture
                    ],
                    body
                },
                layout: 'lightHorizontalLines'
            }
        ];
    };

    return {
        buildTable,
        eiafnc
    }
}

const generateSadContent = async (id_compte, id_dossier, id_exercice) => {
    const sad = await recupTableau.recupSAD(id_compte, id_dossier, id_exercice);

    const buildTable = (data) => {
        const body = [];

        body.push([
            { text: 'Libelle', style: 'tableHeader' },
            { text: 'N-6', style: 'tableHeader', alignment: 'right' },
            { text: 'N-5', style: 'tableHeader', alignment: 'right' },
            { text: 'N-4', style: 'tableHeader', alignment: 'right' },
            { text: 'N-3', style: 'tableHeader', alignment: 'right' },
            { text: 'N-2', style: 'tableHeader', alignment: 'right' },
            { text: 'N-1', style: 'tableHeader', alignment: 'right' },
            { text: 'N', style: 'tableHeader', alignment: 'right' },
            { text: 'Total imputation', style: 'tableHeader', alignment: 'right' }
        ]);

        data.forEach(row => {

            body.push([
                {
                    text: row.libelle || '',
                    alignment: 'left',
                    valign: 'middle',
                    margin: [0, 2, 0, 2]
                },
                {
                    text: formatAmount(row.n6),
                    alignment: 'right',
                    valign: 'middle',
                    margin: [0, 2, 0, 2]
                },
                {
                    text: formatAmount(row.n5),
                    alignment: 'right',
                    valign: 'middle',
                    margin: [0, 2, 0, 2]
                },
                {
                    text: formatAmount(row.n4),
                    alignment: 'right',
                    valign: 'middle',
                    margin: [0, 2, 0, 2]
                },
                {
                    text: formatAmount(row.n3),
                    alignment: 'right',
                    valign: 'middle',
                    margin: [0, 2, 0, 2]
                },
                {
                    text: formatAmount(row.n2),
                    alignment: 'right',
                    valign: 'middle',
                    margin: [0, 2, 0, 2]
                },
                {
                    text: formatAmount(row.n1),
                    alignment: 'right',
                    valign: 'middle',
                    margin: [0, 2, 0, 2]
                },
                {
                    text: formatAmount(row.n),
                    alignment: 'right',
                    valign: 'middle',
                    margin: [0, 2, 0, 2]
                },
                {
                    text: formatAmount(row.total_imputation),
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
                    widths: ['11.1%', '11.1%', '11.1%', '11.1%', '11.1%', '11.1%', '11.1%', '11.1%', '11.1%'],
                    body
                },
                layout: 'lightHorizontalLines'
            }
        ];
    };

    return {
        buildTable,
        sad
    }
}

const generateSdrContent = async (id_compte, id_dossier, id_exercice) => {
    const sdr = await recupTableau.recupSDR(id_compte, id_dossier, id_exercice);

    const buildTable = (data) => {
        const body = [];

        body.push([
            { text: 'Constitution / Imputation', style: 'tableHeader' },
            { text: 'N-6', style: 'tableHeader', alignment: 'right' },
            { text: 'N-5', style: 'tableHeader', alignment: 'right' },
            { text: 'N-4', style: 'tableHeader', alignment: 'right' },
            { text: 'N-3', style: 'tableHeader', alignment: 'right' },
            { text: 'N-2', style: 'tableHeader', alignment: 'right' },
            { text: 'N-1', style: 'tableHeader', alignment: 'right' },
            { text: 'Exercice', style: 'tableHeader', alignment: 'right' },
            { text: 'Total', style: 'tableHeader', alignment: 'right' },
            { text: 'Solde imp. sur ex. ultérieur', style: 'tableHeader', alignment: 'right' },
            { text: 'Solde non imp. sur ex. ultérieur', style: 'tableHeader', alignment: 'right' }
        ]);

        data.forEach(row => {
            const isLevel1 = row.niveau === 1;
            const isLevel40 = row.niveau === 40;
            const bgColor = isLevel1 ? '#f0f0f0' : isLevel40 ? '#859e9e' : null;
            body.push([
                {
                    text: row.libelle || '',
                    alignment: 'left',
                    valign: 'middle',
                    fillColor: bgColor,
                    margin: [0, 2, 0, 2]
                },
                {
                    text: formatAmount(row.n6),
                    alignment: 'right',
                    valign: 'middle',
                    fillColor: bgColor,
                    margin: [0, 2, 0, 2]
                },
                {
                    text: formatAmount(row.n5),
                    alignment: 'right',
                    valign: 'middle',
                    fillColor: bgColor,
                    margin: [0, 2, 0, 2]
                },
                {
                    text: formatAmount(row.n4),
                    alignment: 'right',
                    valign: 'middle',
                    fillColor: bgColor,
                    margin: [0, 2, 0, 2]
                },
                {
                    text: formatAmount(row.n3),
                    alignment: 'right',
                    valign: 'middle',
                    fillColor: bgColor,
                    margin: [0, 2, 0, 2]
                },
                {
                    text: formatAmount(row.n2),
                    alignment: 'right',
                    valign: 'middle',
                    fillColor: bgColor,
                    margin: [0, 2, 0, 2]
                },
                {
                    text: formatAmount(row.n1),
                    alignment: 'right',
                    valign: 'middle',
                    fillColor: bgColor,
                    margin: [0, 2, 0, 2]
                },
                {
                    text: formatAmount(row.exercice),
                    alignment: 'right',
                    valign: 'middle',
                    fillColor: bgColor,
                    margin: [0, 2, 0, 2]
                },
                {
                    text: formatAmount(row.total),
                    alignment: 'right',
                    valign: 'middle',
                    fillColor: bgColor,
                    margin: [0, 2, 0, 2]
                },
                {
                    text: formatAmount(row.solde_imputable),
                    alignment: 'right',
                    valign: 'middle',
                    fillColor: bgColor,
                    margin: [0, 2, 0, 2]
                },
                {
                    text: formatAmount(row.solde_non_imputable),
                    alignment: 'right',
                    valign: 'middle',
                    fillColor: bgColor,
                    margin: [0, 2, 0, 2]
                }
            ]);
        });

        return [
            {
                table: {
                    headerRows: 1,
                    widths: ['9.09%', '9.09%', '9.09%', '9.09%', '9.09%', '9.09%', '9.09%', '9.09%', '9.09%', '9.09%', '9.09%'],
                    body
                },
                layout: 'lightHorizontalLines'
            }
        ];
    };

    return {
        buildTable,
        sdr
    }
}

const generateSeContent = async (id_compte, id_dossier, id_exercice) => {
    const se = await recupTableau.recupSE(id_compte, id_dossier, id_exercice);

    const buildTable = (data) => {
        const body = [];

        body.push([
            { text: 'Emprunteurs', style: 'tableHeader' },
            { text: 'Date contrat', style: 'tableHeader' },
            { text: 'Durée contrat', style: 'tableHeader' },
            { text: 'Montant emprunts (capital)', style: 'tableHeader', alignment: 'right' },
            { text: 'Montant intérêts', style: 'tableHeader', alignment: 'right' },
            { text: 'Montant total', style: 'tableHeader', alignment: 'right' },
            { text: 'Date mise à disp.', style: 'tableHeader' },
            { text: 'Date de remboursement', style: 'tableHeader' },
            { text: 'Montant remb. de la période (capital)', style: 'tableHeader', alignment: 'right' },
            { text: 'Montant remb. de la période (intérêts)', style: 'tableHeader', alignment: 'right' },
            { text: 'Solde non remb. fin d\'exercice', style: 'tableHeader', alignment: 'right' },
        ]);

        let total_montant_emprunt = 0;
        let total_montant_interet = 0;
        let total_montant_total = 0;
        let total_montant_rembourse_capital = 0;
        let total_montant_rembourse_interet = 0;
        let total_solde_non_rembourse = 0;

        data.forEach(row => {
            total_montant_emprunt += parseFloat(row.montant_emprunt) || 0;
            total_montant_interet += parseFloat(row.montant_interet) || 0;
            total_montant_total += parseFloat(row.montant_total) || 0;
            total_montant_rembourse_capital += parseFloat(row.montant_rembourse_capital) || 0;
            total_montant_rembourse_interet += parseFloat(row.montant_rembourse_interet) || 0;
            total_solde_non_rembourse += parseFloat(row.solde_non_rembourse) || 0;
            body.push([
                {
                    text: row.liste_emprunteur,
                    alignment: 'left',
                    valign: 'middle',
                    margin: [0, 2, 0, 2]
                },
                {
                    text: formatDate(row.date_contrat),
                    alignment: 'left',
                    valign: 'middle',
                    margin: [0, 2, 0, 2]
                },
                {
                    text: row.duree_contrat,
                    alignment: 'left',
                    valign: 'middle',
                    margin: [0, 2, 0, 2]
                },
                {
                    text: formatAmount(row.montant_emprunt),
                    alignment: 'right',
                    valign: 'middle',
                    margin: [0, 2, 0, 2]
                },
                {
                    text: formatAmount(row.montant_interet),
                    alignment: 'right',
                    valign: 'middle',
                    margin: [0, 2, 0, 2]
                },
                {
                    text: formatAmount(row.montant_total),
                    alignment: 'right',
                    valign: 'middle',
                    margin: [0, 2, 0, 2]
                },
                {
                    text: formatDate(row.date_disposition),
                    alignment: 'left',
                    valign: 'middle',
                    margin: [0, 2, 0, 2]
                },
                {
                    text: formatDate(row.date_remboursement),
                    alignment: 'left',
                    valign: 'middle',
                    margin: [0, 2, 0, 2]
                },
                {
                    text: formatAmount(row.montant_rembourse_capital),
                    alignment: 'right',
                    valign: 'middle',
                    margin: [0, 2, 0, 2]
                },
                {
                    text: formatAmount(row.montant_rembourse_interet),
                    alignment: 'right',
                    valign: 'middle',
                    margin: [0, 2, 0, 2]
                },
                {
                    text: formatAmount(row.solde_non_rembourse),
                    alignment: 'right',
                    valign: 'middle',
                    margin: [0, 2, 0, 2]
                },
            ]);
        });
        body.push([
            {
                text: 'TOTAL',
                bold: true,
                alignment: 'left',
                margin: [0, 2, 0, 2],
                fillColor: '#89A8B2',
            },
            {
                text: '',
                fillColor: '#89A8B2',
            },
            {
                text: '',
                fillColor: '#89A8B2',
            },
            {
                text: formatAmount(total_montant_emprunt),
                bold: true,
                alignment: 'right',
                margin: [0, 2, 0, 2],
                fillColor: '#89A8B2',
            },
            {
                text: formatAmount(total_montant_interet),
                bold: true,
                alignment: 'right',
                margin: [0, 2, 0, 2],
                fillColor: '#89A8B2',
            },
            {
                text: formatAmount(total_montant_total),
                bold: true,
                alignment: 'right',
                margin: [0, 2, 0, 2],
                fillColor: '#89A8B2',
            },
            {
                text: '',
                fillColor: '#89A8B2',
            },
            {
                text: '',
                fillColor: '#89A8B2',
            },
            {
                text: formatAmount(total_montant_rembourse_capital),
                bold: true,
                alignment: 'right',
                margin: [0, 2, 0, 2],
                fillColor: '#89A8B2',
            },
            {
                text: formatAmount(total_montant_rembourse_interet),
                bold: true,
                alignment: 'right',
                margin: [0, 2, 0, 2],
                fillColor: '#89A8B2',
            },
            {
                text: formatAmount(total_solde_non_rembourse),
                bold: true,
                alignment: 'right',
                margin: [0, 2, 0, 2],
                fillColor: '#89A8B2',
            },
        ]);

        return [
            {
                table: {
                    headerRows: 1,
                    widths: ['9.09%', '9.09%', '9.09%', '9.09%', '9.09%', '9.09%', '9.09%', '9.09%', '9.09%', '9.09%', '9.09%'],
                    body
                },
                layout: 'lightHorizontalLines'
            }
        ];
    };

    return {
        buildTable,
        se
    }
}

const generateNeContent = async (id_compte, id_dossier, id_exercice) => {
    const ne = await recupTableau.recupNE(id_compte, id_dossier, id_exercice);

    const buildTable = (data) => {
        const body = [];

        body.push([
            { text: 'Tableau', style: 'tableHeader' },
            { text: 'Note', style: 'tableHeader' },
            { text: 'Commentaires', style: 'tableHeader' },
        ]);

        data.forEach(row => {
            body.push([
                {
                    text: row.tableau,
                    alignment: 'left',
                    valign: 'middle',
                    margin: [0, 2, 0, 2]
                },
                {
                    text: row.ref_note,
                    alignment: 'left',
                    valign: 'middle',
                    margin: [0, 2, 0, 2]
                },
                {
                    text: row.commentaires,
                    alignment: 'left',
                    valign: 'middle',
                    margin: [0, 2, 0, 2]
                },
            ]);
        });
        return [
            {
                table: {
                    headerRows: 1,
                    widths: ['12%', '22%', '66%'],
                    body
                },
                layout: 'lightHorizontalLines'
            }
        ];
    };

    return {
        buildTable,
        ne
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
    generateDrfContent,
    generateBhiapcContent,
    generateMpContent,
    generateDaContent,
    generateDpContent,
    generateEiafncContent,
    generateSadContent,
    generateSdrContent,
    generateSeContent,
    generateNeContent
}