require('dotenv').config();
const recupTableau = require('../../Middlewares/Ebilan/recupTableau');

const recupEbilan = require('../../Middlewares/Declaration/Ebilan/EblianMiddleware');
const getEbilanComplet = recupEbilan.getEbilanComplet;

const db = require("../../Models");
const dossierassocies = db.dossierassocies;
const dombancaires = db.dombancaires;

const exportActifToXml = async (tableau, id_dossier, id_compte, id_exercice) => {
    const data = await getEbilanComplet(id_compte, id_dossier, id_exercice);

    const bilanActif = data.filter(val => val.id_etat === 'BILAN' && val.subtable === 1);

    if (bilanActif.length === 0) {
        return
    }

    const bilanActifClean = bilanActif
        .filter((row) => row.nature !== "TITRE")
        .map((val) => ({
            id_rubrique: val?.id_rubrique,
            montantbrut: val?.montantbrut,
            montantamort: val?.montantamort,
            montantnet: val?.montantnet,
            montantnetn1: val?.montantnetn1,
        }));

    bilanActifClean.forEach((row) => {
        let id_rubrique =
            row.id_rubrique === 11 ? 23 :
                row.id_rubrique === 12 ? 11 :
                    row.id_rubrique === 14 ? 13 :
                        row.id_rubrique === 15 ? 14 :
                            row.id_rubrique === 16 ? 15 :
                                row.id_rubrique === 17 ? 16 :
                                    row.id_rubrique === 18 ? 17 :
                                        row.id_rubrique === 19 ? 18 :
                                            row.id_rubrique === 20 ? 19 :
                                                row.id_rubrique === 21 ? 20 :
                                                    row.id_rubrique === 22 ? 21 :
                                                        row.id_rubrique === 23 ? 22 :
                                                            row.id_rubrique;

        const mapFields = {
            [`PCG_ACTIF_${id_rubrique}_2`]: Math.round(row?.montantbrut ?? 0),
            [`PCG_ACTIF_${id_rubrique}_3`]: Math.round(row?.montantamort ?? 0),
            [`PCG_ACTIF_${id_rubrique}_4`]: Math.round(row?.montantnet ?? 0),
            [`PCG_ACTIF_${id_rubrique}_5`]: Math.round(row?.montantnetn1 ?? 0),
        };

        Object.entries(mapFields).forEach(([code, valeur]) => {
            const champTableauFixe = tableau.ele('champTableauFixe');
            champTableauFixe.ele('code').txt(code);
            champTableauFixe.ele('valeur').txt(valeur);
        });
    });
};

const exportPassifToXml = async (tableau, id_dossier, id_compte, id_exercice) => {
    const data = await getEbilanComplet(id_compte, id_dossier, id_exercice);

    const bilanPassif = data.filter(val => val.id_etat === 'BILAN' && val.subtable === 2);

    if (bilanPassif.length === 0) {
        return
    }

    const bilanPassifClean = bilanPassif
        .filter((row) => row.nature !== "TITRE")
        .map((val) => ({
            id_rubrique: val?.id_rubrique,
            montantnet: val?.montantnet,
            montantnetn1: val?.montantnetn1,
        }));

    bilanPassifClean.forEach((row) => {
        let id_rubrique =
            row.id_rubrique === 25 ? 2 :
                row.id_rubrique === 26 ? 3 :
                    row.id_rubrique === 27 ? 4 :
                        row.id_rubrique === 28 ? 5 :
                            row.id_rubrique === 29 ? 6 :
                                row.id_rubrique === 30 ? 7 :
                                    row.id_rubrique === 31 ? 8 :
                                        row.id_rubrique === 32 ? 9 :
                                            row.id_rubrique === 33 ? 10 :
                                                row.id_rubrique === 35 ? 12 :
                                                    row.id_rubrique === 36 ? 13 :
                                                        row.id_rubrique === 37 ? 14 :
                                                            row.id_rubrique === 38 ? 15 :
                                                                row.id_rubrique === 39 ? 16 :
                                                                    row.id_rubrique === 41 ? 18 :
                                                                        row.id_rubrique === 42 ? 25 :
                                                                            row.id_rubrique === 43 ? 19 :
                                                                                row.id_rubrique === 44 ? 20 :
                                                                                    row.id_rubrique === 45 ? 21 :
                                                                                        row.id_rubrique === 46 ? 22 :
                                                                                            row.id_rubrique === 47 ? 23 :
                                                                                                row.id_rubrique === 48 ? 24 :
                                                                                                    row.id_rubrique

        const mapFields = {
            [`PCG_PASSIF_${id_rubrique}_2`]: Math.round(row?.montantnet ?? 0),
            [`PCG_PASSIF_${id_rubrique}_3`]: Math.round(row?.montantnetn1 ?? 0),
        };

        Object.entries(mapFields).forEach(([code, valeur]) => {
            const champTableauFixe = tableau.ele('champTableauFixe');
            champTableauFixe.ele('code').txt(code);
            champTableauFixe.ele('valeur').txt(valeur);
        });
    });
};

const exportCrnToXml = async (tableau, id_dossier, id_compte, id_exercice) => {
    const data = await getEbilanComplet(id_compte, id_dossier, id_exercice);

    const crn = data.filter(val => val.id_etat === 'CRN' && val.subtable === 0);

    if (crn.length === 0) {
        return
    }

    const crnClean = crn
        .filter((row) => row.nature !== "TITRE")
        .map((val) => ({
            id_rubrique: val?.id_rubrique,
            montantbrut: val?.montantbrut,
            montantamort: val?.montantamort,
            montantnet: val?.montantnet,
            montantnetn1: val?.montantnetn1,
            senscalcul: val?.senscalcul
        }));

    crnClean.forEach((row) => {
        let id_rubrique =
            row.id_rubrique === 9 ? 34 :
                row.id_rubrique === 10 ? 9 :
                    row.id_rubrique === 11 ? 10 :
                        row.id_rubrique === 12 ? 11 :
                            row.id_rubrique === 13 ? 12 :
                                row.id_rubrique === 14 ? 13 :
                                    row.id_rubrique === 15 ? 14 :
                                        row.id_rubrique === 16 ? 15 :
                                            row.id_rubrique === 17 ? 16 :
                                                row.id_rubrique === 18 ? 17 :
                                                    row.id_rubrique === 19 ? 18 :
                                                        row.id_rubrique === 20 ? 19 :
                                                            row.id_rubrique === 21 ? 20 :
                                                                row.id_rubrique === 22 ? 21 :
                                                                    row.id_rubrique === 23 ? 22 :
                                                                        row.id_rubrique === 24 ? 23 :
                                                                            row.id_rubrique === 25 ? 24 :
                                                                                row.id_rubrique === 26 ? 25 :
                                                                                    row.id_rubrique === 27 ? 26 :
                                                                                        row.id_rubrique === 28 ? 27 :
                                                                                            row.id_rubrique === 29 ? 28 :
                                                                                                row.id_rubrique === 30 ? 29 :
                                                                                                    row.id_rubrique === 31 ? 30 :
                                                                                                        row.id_rubrique === 32 ? 31 :
                                                                                                            row.id_rubrique === 33 ? 32 :
                                                                                                                row.id_rubrique === 34 ? 33 :
                                                                                                                    row.id_rubrique

        const sensCalcul = row.senscalcul === "-" ? -1 : 1;

        const mapFields = {
            [`PCG_CRN_${id_rubrique}_2`]: (Math.round(row?.montantnet) * sensCalcul ?? 0),
            [`PCG_CRN_${id_rubrique}_3`]: (Math.round(row?.montantnetn1) * sensCalcul ?? 0),
        };

        Object.entries(mapFields).forEach(([code, valeur]) => {
            const champTableauFixe = tableau.ele('champTableauFixe');
            champTableauFixe.ele('code').txt(code);
            champTableauFixe.ele('valeur').txt(valeur);
        });
    });
};

const exportCrfToXml = async (tableau, id_dossier, id_compte, id_exercice) => {
    const data = await getEbilanComplet(id_compte, id_dossier, id_exercice);

    const crf = data.filter(val => val.id_etat === 'CRF' && val.subtable === 0);

    if (crf.length === 0) {
        return
    }

    const crfClean = crf
        .filter((row) => row.nature !== "TITRE")
        .map((val) => ({
            id_rubrique: val?.id_rubrique,
            montantbrut: val?.montantbrut,
            montantamort: val?.montantamort,
            montantnet: val?.montantnet,
            montantnetn1: val?.montantnetn1,
            senscalcul: val?.senscalcul
        }));

    crfClean.forEach((row) => {
        let id_rubrique =
            row.id_rubrique === 8 ? 10 :
                row.id_rubrique === 9 ? 15 :
                    row.id_rubrique === 10 ? 16 :
                        row.id_rubrique === 11 ? 17 :
                            row.id_rubrique === 12 ? 18 :
                                row.id_rubrique === 13 ? 19 :
                                    row.id_rubrique === 14 ? 20 :
                                        row.id_rubrique === 15 ? 21 :
                                            row.id_rubrique === 16 ? 22 :
                                                row.id_rubrique === 17 ? 23 :
                                                    row.id_rubrique === 18 ? 24 :
                                                        row.id_rubrique === 19 ? 25 :
                                                            row.id_rubrique === 20 ? 26 :
                                                                row.id_rubrique === 21 ? 27 :
                                                                    row.id_rubrique

        const sensCalcul = row.senscalcul === "-" ? -1 : 1;

        const mapFields = {
            [`PCG_CRF_${id_rubrique}_2`]: (Math.round(row?.montantnet) * sensCalcul ?? 0),
            [`PCG_CRF_${id_rubrique}_3`]: (Math.round(row?.montantnetn1) * sensCalcul ?? 0),
        };

        Object.entries(mapFields).forEach(([code, valeur]) => {
            const champTableauFixe = tableau.ele('champTableauFixe');
            champTableauFixe.ele('code').txt(code);
            champTableauFixe.ele('valeur').txt(valeur);
        });
    });
};

const exportTftdToXml = async (tableau, id_dossier, id_compte, id_exercice) => {
    const data = await getEbilanComplet(id_compte, id_dossier, id_exercice);

    const tftd = data.filter(val => val.id_etat === 'TFTD' && val.subtable === 0);

    if (tftd.length === 0) {
        return
    }

    const tftdClean = tftd
        .filter((row) => row.nature !== "TITRE")
        .map((val) => ({
            id_rubrique: val?.id_rubrique,
            montantbrut: val?.montantbrut,
            montantamort: val?.montantamort,
            montantnet: val?.montantnet,
            montantnetn1: val?.montantnetn1,
            senscalcul: val?.senscalcul
        }));

    tftdClean.forEach((row) => {
        let id_rubrique = row.id_rubrique

        const sensCalcul = row.senscalcul === "-" ? -1 : 1;
        const isMontN1_10_12 = row.id_rubrique === 10 || row.id_rubrique === 12 ? -1 : 1;

        const mapFields = {
            [`PCG_TFTD_${id_rubrique}_2`]: (Math.round(row?.montantnet) * sensCalcul ?? 0),
            [`PCG_TFTD_${id_rubrique}_3`]: (Math.round(row?.montantnetn1) * sensCalcul * isMontN1_10_12 ?? 0),
        };

        Object.entries(mapFields).forEach(([code, valeur]) => {
            const champTableauFixe = tableau.ele('champTableauFixe');
            champTableauFixe.ele('code').txt(code);
            champTableauFixe.ele('valeur').txt(valeur);
        });
    });
};

const exportTftiToXml = async (tableau, id_dossier, id_compte, id_exercice) => {
    const data = await getEbilanComplet(id_compte, id_dossier, id_exercice);

    const tfti = data.filter(val => val.id_etat === 'TFTI' && val.subtable === 0);

    if (tfti.length === 0) {
        return
    }

    const tftiClean = tfti
        .filter((row) => row.nature !== "TITRE")
        .map((val) => ({
            id_rubrique: val?.id_rubrique,
            montantbrut: val?.montantbrut,
            montantamort: val?.montantamort,
            montantnet: val?.montantnet,
            montantnetn1: val?.montantnetn1,
            senscalcul: val?.senscalcul
        }));

    tftiClean.forEach((row) => {
        let id_rubrique =
            row.id_rubrique === 9 ? 26 :
                row.id_rubrique === 10 ? 9 :
                    row.id_rubrique === 12 ? 11 :
                        row.id_rubrique === 13 ? 12 :
                            row.id_rubrique === 14 ? 13 :
                                row.id_rubrique === 15 ? 27 :
                                    row.id_rubrique === 16 ? 14 :
                                        row.id_rubrique === 18 ? 16 :
                                            row.id_rubrique === 19 ? 17 :
                                                row.id_rubrique === 20 ? 18 :
                                                    row.id_rubrique === 21 ? 19 :
                                                        row.id_rubrique === 22 ? 28 :
                                                            row.id_rubrique === 23 ? 20 :
                                                                row.id_rubrique === 24 ? 21 :
                                                                    row.id_rubrique === 25 ? 22 :
                                                                        row.id_rubrique === 26 ? 23 :
                                                                            row.id_rubrique === 27 ? 24 :
                                                                                row.id_rubrique === 28 ? 25 :
                                                                                    row.id_rubrique

        const sensCalcul = row.senscalcul === "-" ? -1 : 1;
        const isMontN1_12_18_21 = row.id_rubrique === 12 || row.id_rubrique === 18 || row.id_rubrique === 21 ? -1 : 1;

        const mapFields = {
            [`PCG_TFTI_${id_rubrique}_2`]: (Math.round(row?.montantnet) * sensCalcul * isMontN1_12_18_21 ?? 0),
            [`PCG_TFTI_${id_rubrique}_3`]: (Math.round(row?.montantnetn1) * sensCalcul * isMontN1_12_18_21 ?? 0),
        };

        Object.entries(mapFields).forEach(([code, valeur]) => {
            const champTableauFixe = tableau.ele('champTableauFixe');
            champTableauFixe.ele('code').txt(code);
            champTableauFixe.ele('valeur').txt(valeur);
        });
    });
};

const exportEvcpToXml = async (tableau, id_dossier, id_compte, id_exercice) => {
    const evcp = await recupTableau.recupEVCP(id_compte, id_dossier, id_exercice);

    if (evcp.length === 0) {
        return
    }

    const evcpClean = evcp
        .filter((row) => row.nature !== "TITRE")
        .map((val) => ({
            id_rubrique: val?.id_rubrique,
            capitalsocial: val?.capitalsocial,
            primereserve: val?.primereserve,
            ecartdevaluation: val?.ecartdevaluation,
            resultat: val?.resultat,
            report_anouveau: val?.report_anouveau,
            total_varcap: val?.total_varcap
        }));

    evcpClean.forEach((row) => {
        let id_rubrique = row.id_rubrique

        const mapFields = {
            [`PCG_EVCP_${id_rubrique}_2`]: Math.round(row?.capitalsocial ?? 0),
            [`PCG_EVCP_${id_rubrique}_3`]: Math.round(row?.primereserve ?? 0),
            [`PCG_EVCP_${id_rubrique}_4`]: Math.round(row?.ecartdevaluation ?? 0),
            [`PCG_EVCP_${id_rubrique}_5`]: Math.round(row?.resultat ?? 0),
            [`PCG_EVCP_${id_rubrique}_6`]: Math.round(row?.report_anouveau ?? 0),
            [`PCG_EVCP_${id_rubrique}_7`]: Math.round(row?.total_varcap ?? 0),
        };

        Object.entries(mapFields).forEach(([code, valeur]) => {
            const champTableauFixe = tableau.ele('champTableauFixe');
            champTableauFixe.ele('code').txt(code);
            champTableauFixe.ele('valeur').txt(valeur);
        });
    });
};

const exportDrfToXml = async (tableau, id_dossier, id_compte, id_exercice) => {
    const drf = await recupTableau.recupDRF(id_compte, id_dossier, id_exercice);

    if (drf.length === 0) {
        return
    }

    const drfClean = drf
        .filter((row) => row.nature !== "TITRE")
        .map((val) => ({
            id_rubrique: val?.id_rubrique,
            montant_brut: val?.montant_brut,
            signe: val?.signe
        }));

    drfClean.forEach((row) => {
        let id_rubrique =
            row.id_rubrique === 18 ? 22 :
                row.id_rubrique === 19 ? 23 :
                    row.id_rubrique === 20 ? 18 :
                        row.id_rubrique === 21 ? 20 :
                            row.id_rubrique === 22 ? 24 :
                                row.id_rubrique === 23 ? 25 :
                                    row.id_rubrique === 24 ? 26 :
                                        row.id_rubrique === 25 ? 21 :
                                            row.id_rubrique

        const signe = row.signe === "-" ? -1 : 1;

        const mapFields = {
            [`PCG_DRF_${id_rubrique}_2`]: Math.round(row?.montant_brut * signe) || '',
        };

        Object.entries(mapFields).forEach(([code, valeur]) => {
            const champTableauFixe = tableau.ele('champTableauFixe');
            champTableauFixe.ele('code').txt(code);
            champTableauFixe.ele('valeur').txt(valeur);
        });
    });
};

const exportBhiapcbToXml = async (tableau, id_dossier, id_compte, id_exercice) => {
    const bhiapc = await recupTableau.recupBHIAPC(id_compte, id_dossier, id_exercice);

    if (bhiapc.length === 0) {
        return
    }

    const totalMontantCharge = bhiapc.reduce((acc, curr) => acc + curr.montant_charge, 0);
    const totalMontantBeneficiaire = bhiapc.reduce((acc, curr) => acc + curr.montant_beneficiaire, 0);

    const champTotalMontantCharge = tableau.ele('champTableauFixe');
    champTotalMontantCharge.ele('code').txt('PCG_BHIAPCB_1_1');
    champTotalMontantCharge.ele('valeur').txt(Math.round(totalMontantCharge));

    const champTotalMontantBeneficiaire = tableau.ele('champTableauFixe');
    champTotalMontantBeneficiaire.ele('code').txt('PCG_BHIAPCB_1_2');
    champTotalMontantBeneficiaire.ele('valeur').txt(Math.round(totalMontantBeneficiaire));
};

const exportMpa2ToXml = async (tableau, id_dossier, id_compte, id_exercice) => {
    const mp = await recupTableau.recupMP(id_compte, id_dossier, id_exercice);

    if (mp.length === 0) {
        return
    }

    const mpFiltered = mp.filter(val => val.marche === 'MP');

    const totalMontantMarcheHt = mpFiltered.reduce((acc, curr) => acc + curr.montant_marche_ht, 0);
    const totalMontantPaye = mpFiltered.reduce((acc, curr) => acc + curr.montant_paye, 0);
    const totalTmp = mpFiltered.reduce((acc, curr) => acc + curr.tmp, 0);

    const champTotalMontantMarcheHt = tableau.ele('champTableauFixe');
    champTotalMontantMarcheHt.ele('code').txt('PCG_MPA2_1_1');
    champTotalMontantMarcheHt.ele('valeur').txt(Math.round(totalMontantMarcheHt));

    const champTotalMontantPaye = tableau.ele('champTableauFixe');
    champTotalMontantPaye.ele('code').txt('PCG_MPA2_1_2');
    champTotalMontantPaye.ele('valeur').txt(Math.round(totalMontantPaye));

    const champTotalTmp = tableau.ele('champTableauFixe');
    champTotalTmp.ele('code').txt('PCG_MPA2_1_3');
    champTotalTmp.ele('valeur').txt(Math.round(totalTmp));
};

const exportMpb2ToXml = async (tableau, id_dossier, id_compte, id_exercice) => {
    const mp = await recupTableau.recupMP(id_compte, id_dossier, id_exercice);

    if (mp.length === 0) {
        return
    }

    const mpFiltered = mp.filter(val => val.marche === 'AUTRE');

    const totalMontantMarcheHt = mpFiltered.reduce((acc, curr) => acc + curr.montant_marche_ht, 0);

    const champTotalMontantMarcheHt = tableau.ele('champTableauFixe');
    champTotalMontantMarcheHt.ele('code').txt('PCG_MPB2_1_1');
    champTotalMontantMarcheHt.ele('valeur').txt(Math.round(totalMontantMarcheHt));
};

const exportDaToXml = async (tableau, id_dossier, id_compte, id_exercice) => {
    const da = await recupTableau.recupDA(id_compte, id_dossier, id_exercice);

    if (da.length === 0) {
        return
    }

    const rubriques_poste = ["GOODWILL", "IMMO_INCORP", "IMMO_CORP", "IMMO_ENCOURS", "IMMO_FIN"];

    const fields = [
        "valeur_acquisition",
        "augmentation",
        "diminution",
        "amort_anterieur",
        "dotation_exercice",
        "amort_cumule",
        "valeur_nette"
    ];

    rubriques_poste.forEach((rubriques_poste, index) => {
        const lignes = da.filter(val => val.rubriques_poste === rubriques_poste);

        fields.forEach((field, fieldIndex) => {
            const total = lignes.reduce((acc, curr) => acc + (curr[field] || 0), 0);

            const champ = tableau.ele("champTableauFixe");
            champ.ele("code").txt(`PCG_DA_${index + 1}_${fieldIndex + 1}`);
            champ.ele("valeur").txt(Math.round(total));
        });
    });
};

const exportDpa1ToXml = async (tableau, id_dossier, id_compte, id_exercice) => {
    const dp = await recupTableau.recupDP(id_compte, id_dossier, id_exercice);

    if (dp.length === 0) {
        return
    }

    // Groupes
    const groupes = [
        { libelle: "RISQUE", data: dp.filter(val => val.nature_prov === "RISQUE").sort((a, b) => a.ordre - b.ordre) },
        { libelle: "DEPRECIATION", data: dp.filter(val => val.nature_prov === "DEPRECIATION").sort((a, b) => a.ordre - b.ordre) },
        { libelle: "AUTRE", data: dp.filter(val => val.nature_prov === "AUTRE") }
    ];

    // Pour stocker les totaux généraux
    let totalGeneral = { debut: 0, augm: 0, dim: 0, fin: 0 };

    groupes.forEach(group => {
        let sousTotal = { debut: 0, augm: 0, dim: 0, fin: 0 };
        let rubriqueRef = group.data[group.data.length - 1]?.id_rubrique || 0;

        group.data.forEach(row => {
            // Cumul des valeurs pour sous-total et total général
            sousTotal.debut += row?.montant_debut_ex || 0;
            sousTotal.augm += row?.augm_dot_ex || 0;
            sousTotal.dim += row?.dim_repr_ex || 0;
            sousTotal.fin += row?.montant_fin || 0;

            totalGeneral.debut += row?.montant_debut_ex || 0;
            totalGeneral.augm += row?.augm_dot_ex || 0;
            totalGeneral.dim += row?.dim_repr_ex || 0;
            totalGeneral.fin += row?.montant_fin || 0;

            // On n’affiche les lignes QUE si ce n’est pas AUTRE
            if (group.libelle !== "AUTRE") {
                const mapFields = {
                    [`PCG_DPA1_${row.id_rubrique}_1`]: Math.round(row?.montant_debut_ex ?? 0),
                    [`PCG_DPA1_${row.id_rubrique}_2`]: Math.round(row?.augm_dot_ex ?? 0),
                    [`PCG_DPA1_${row.id_rubrique}_3`]: Math.round(row?.dim_repr_ex ?? 0),
                    [`PCG_DPA1_${row.id_rubrique}_4`]: Math.round(row?.montant_fin ?? 0)
                };

                Object.entries(mapFields).forEach(([code, valeur]) => {
                    const champTableauFixe = tableau.ele('champTableauFixe');
                    champTableauFixe.ele('code').txt(code);
                    champTableauFixe.ele('valeur').txt(valeur);
                });
            }
        });

        // Ajout des sous-totaux
        if (group.data.length > 0) {
            let rubriqueSousTotal;

            if (group.libelle === "AUTRE") {
                rubriqueSousTotal = 25; // sous-total forcé
            } else {
                rubriqueSousTotal = rubriqueRef + 1;
            }

            const mapFieldsTotal = {
                [`PCG_DPA1_${rubriqueSousTotal}_1`]: Math.round(sousTotal.debut ?? 0),
                [`PCG_DPA1_${rubriqueSousTotal}_2`]: Math.round(sousTotal.augm ?? 0),
                [`PCG_DPA1_${rubriqueSousTotal}_3`]: Math.round(sousTotal.dim ?? 0),
                [`PCG_DPA1_${rubriqueSousTotal}_4`]: Math.round(sousTotal.fin ?? 0)
            };

            Object.entries(mapFieldsTotal).forEach(([code, valeur]) => {
                const champTableauFixe = tableau.ele('champTableauFixe');
                champTableauFixe.ele('code').txt(code);
                champTableauFixe.ele('valeur').txt(valeur);
            });
        }
    });

    // Ajout du total général en 26
    const mapFieldsGeneral = {
        [`PCG_DPA1_26_1`]: Math.round(totalGeneral.debut ?? 0),
        [`PCG_DPA1_26_2`]: Math.round(totalGeneral.augm ?? 0),
        [`PCG_DPA1_26_3`]: Math.round(totalGeneral.dim ?? 0),
        [`PCG_DPA1_26_4`]: Math.round(totalGeneral.fin ?? 0)
    };

    Object.entries(mapFieldsGeneral).forEach(([code, valeur]) => {
        const champTableauFixe = tableau.ele('champTableauFixe');
        champTableauFixe.ele('code').txt(code);
        champTableauFixe.ele('valeur').txt(valeur);
    });
};

const exportSdrToXml = async (tableau, id_dossier, id_compte, id_exercice) => {
    const sdr = await recupTableau.recupSDR(id_compte, id_dossier, id_exercice);

    if (sdr.length === 0) {
        return
    }

    const sdrClean = sdr.map((val) => ({
        id_rubrique: val?.id_rubrique,
        n6: val?.n6,
        n5: val?.n5,
        n4: val?.n4,
        n3: val?.n3,
        n2: val?.n2,
        n1: val?.n1,
        exercice: val?.exercice,
        total: val?.total,
        solde_imputable: val?.solde_imputable,
        solde_non_imputable: val?.solde_non_imputable
    }));

    sdrClean.forEach((row) => {
        const id_rubrique = row.id_rubrique;

        // Colonnes communes
        const mapFields = {
            [`PCG_SDR_${id_rubrique}_1`]: row?.n6 != null ? Math.round(row.n6) : 0,
            [`PCG_SDR_${id_rubrique}_2`]: row?.n5 != null ? Math.round(row.n5) : 0,
            [`PCG_SDR_${id_rubrique}_3`]: row?.n4 != null ? Math.round(row.n4) : 0,
            [`PCG_SDR_${id_rubrique}_4`]: row?.n3 != null ? Math.round(row.n3) : 0,
            [`PCG_SDR_${id_rubrique}_5`]: row?.n2 != null ? Math.round(row.n2) : 0,
            [`PCG_SDR_${id_rubrique}_6`]: row?.n1 != null ? Math.round(row.n1) : 0,
            [`PCG_SDR_${id_rubrique}_7`]: row?.exercice != null ? Math.round(row.exercice) : 0,
        };

        // Colonnes supplémentaires si id_rubrique < 9
        if (id_rubrique < 9) {
            mapFields[`PCG_SDR_${id_rubrique}_8`] = row?.total != null ? Math.round(row.total) : 0;
            mapFields[`PCG_SDR_${id_rubrique}_9`] = row?.solde_imputable != null ? Math.round(row.solde_imputable) : 0;
            mapFields[`PCG_SDR_${id_rubrique}_10`] = row?.solde_non_imputable != null ? Math.round(row.solde_non_imputable) : 0;
        }

        // Génération XML
        Object.entries(mapFields).forEach(([code, valeur]) => {
            const champTableauFixe = tableau.ele('champTableauFixe');
            champTableauFixe.ele('code').txt(code);
            champTableauFixe.ele('valeur').txt(valeur);
        });
    });
};

const exportSadToXml = async (tableau, id_dossier, id_compte, id_exercice) => {
    const sad = await recupTableau.recupSAD(id_compte, id_dossier, id_exercice);

    if (sad.length === 0) {
        return
    }

    const sadClean = sad
        .filter((row) => row.nature !== "TITRE")
        .map((val) => ({
            id_rubrique: val?.id_rubrique,
            n6: val?.n6,
            n5: val?.n5,
            n4: val?.n4,
            n3: val?.n3,
            n2: val?.n2,
            n1: val?.n1,
            n: val?.n,
            total_imputation: val?.total_imputation
        }));

    sadClean.forEach((row) => {
        let id_rubrique = row.id_rubrique

        const mapFields = {
            [`PCG_SAD_${id_rubrique}_1`]: Math.round(row?.n6 ?? 0),
            [`PCG_SAD_${id_rubrique}_2`]: Math.round(row?.n5 ?? 0),
            [`PCG_SAD_${id_rubrique}_3`]: Math.round(row?.n4 ?? 0),
            [`PCG_SAD_${id_rubrique}_4`]: Math.round(row?.n3 ?? 0),
            [`PCG_SAD_${id_rubrique}_5`]: Math.round(row?.n2 ?? 0),
            [`PCG_SAD_${id_rubrique}_8`]: Math.round(row?.n1 ?? 0),
            [`PCG_SAD_${id_rubrique}_6`]: Math.round(row?.n ?? 0),
            [`PCG_SAD_${id_rubrique}_7`]: Math.round(row?.total_imputation ?? 0),
        };

        Object.entries(mapFields).forEach(([code, valeur]) => {
            const champTableauFixe = tableau.ele('champTableauFixe');
            champTableauFixe.ele('code').txt(code);
            champTableauFixe.ele('valeur').txt(valeur);
        });
    });
};

const exportCapToXml = async (tableau, id_dossier) => {
    const listAssocie = await dossierassocies.findAll({
        where: {
            id_dossier,
            enactivite: true
        },
        order: [['id', 'ASC']]
    });

    if (listAssocie.length === 0) {
        return
    }

    ['nom', 'nbrpart', 'adresse'].forEach((field, i) => {
        listAssocie.forEach((associe, index) => {
            const ligne = index + 1;
            const champ = tableau.ele('champTableauVariable');
            champ.ele('colonne').txt(`PCG_CAP_${i + 1}`);
            champ.ele('ligne').txt(ligne);
            champ.ele('valeur').txt((associe[field] ?? '').toString().trim());
        });
    });
};

const exportDbToXml = async (tableau, id_dossier) => {
    const listDomBank = await dombancaires.findAll({
        where:
        {
            id_dossier,
            enactivite: true
        },
        order: [['id', 'ASC']]
    });

    if (listDomBank.length === 0) {
        return
    }

    ['banque', 'numcompte', 'devise', 'pays'].forEach((field, i) => {
        listDomBank.forEach((associe, index) => {
            const ligne = index + 1;
            const champ = tableau.ele('champTableauVariable');
            champ.ele('colonne').txt(`PCG_DB_${i + 1}`);
            champ.ele('ligne').txt(ligne);
            champ.ele('valeur').txt((associe[field] ?? '').toString().trim());
        });
    });
};

const exportBhiapcaToXml = async (tableau, id_dossier, id_compte, id_exercice) => {
    const listBhiapc = await recupTableau.recupBHIAPC(id_compte, id_dossier, id_exercice);

    if (listBhiapc.length === 0) {
        return
    }

    ['nif', 'raison_sociale', 'adresse', 'montant_charge', 'montant_beneficiaire'].forEach((field, i) => {
        listBhiapc.forEach((associe, index) => {
            const ligne = index + 1;
            const champ = tableau.ele('champTableauVariable');
            champ.ele('colonne').txt(`PCG_BHIAPCA_${i + 1}`);
            champ.ele('ligne').txt(ligne);

            let valeur = associe[field];
            if (typeof valeur === 'number') {
                valeur = Math.round(valeur);
            }
            champ.ele('valeur').txt((valeur ?? '').toString().trim());
        });
    });
};

const exportMpa1ToXml = async (tableau, id_dossier, id_compte, id_exercice) => {
    const listMp = await recupTableau.recupMP(id_compte, id_dossier, id_exercice);

    if (listMp.length === 0) {
        return
    }

    const listMpFiltered = listMp.filter(val => val.marche === 'MP');

    ['ref_marche', 'date', 'date_paiement', 'montant_marche_ht', 'montant_paye', 'tmp'].forEach((field, i) => {
        listMpFiltered.forEach((associe, index) => {
            const ligne = index + 1;
            const champ = tableau.ele('champTableauVariable');
            champ.ele('colonne').txt(`PCG_MPA1_${i + 1}`);
            champ.ele('ligne').txt(ligne);

            let valeur = associe[field];

            if (typeof valeur === 'number') {
                valeur = Math.round(valeur);
            }

            if (typeof valeur === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(valeur)) {
                const [year, month, day] = valeur.split('-');
                valeur = `${day}/${month}/${year}`;
            }

            champ.ele('valeur').txt((valeur ?? '').toString().trim());
        });
    });
};

const exportMpb1ToXml = async (tableau, id_dossier, id_compte, id_exercice) => {
    const listMp = await recupTableau.recupMP(id_compte, id_dossier, id_exercice);

    if (listMp.length === 0) {
        return
    }

    const listMpFiltered = listMp.filter(val => val.marche === 'AUTRE');

    ['ref_marche', 'montant_marche_ht'].forEach((field, i) => {
        listMpFiltered.forEach((associe, index) => {
            const ligne = index + 1;
            const champ = tableau.ele('champTableauVariable');
            champ.ele('colonne').txt(`PCG_MPB1_${i + 1}`);
            champ.ele('ligne').txt(ligne);

            let valeur = associe[field];

            if (typeof valeur === 'number') {
                valeur = Math.round(valeur);
            }

            if (typeof valeur === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(valeur)) {
                const [year, month, day] = valeur.split('-');
                valeur = `${day}/${month}/${year}`;
            }

            champ.ele('valeur').txt((valeur ?? '').toString().trim());
        });
    });
};

const exportDa1ToXml = async (tableau, id_dossier, id_compte, id_exercice) => {
    const listDa = await recupTableau.recupDA(id_compte, id_dossier, id_exercice);

    if (listDa.length === 0) {
        return
    }

    const rubriques_poste = ["GOODWILL", "IMMO_INCORP", "IMMO_CORP", "IMMO_ENCOURS", "IMMO_FIN"];
    const fields = [
        "num_compte",
        "date_acquisition",
        "taux",
        "valeur_acquisition",
        "augmentation",
        "diminution",
        "amort_anterieur",
        "dotation_exercice",
        "amort_cumule",
        "valeur_nette"
    ];

    rubriques_poste.forEach((rubrique, rubIndex) => {
        const lignes = listDa.filter(row => row.rubriques_poste === rubrique);

        fields.forEach((field, fieldIndex) => {
            lignes.forEach((associe, ligneIndex) => {
                const champ = tableau.ele('champTableauVariable');
                champ.ele('colonne').txt(`PCG_DA${rubIndex + 1}_${fieldIndex + 11}`);
                champ.ele('ligne').txt(ligneIndex + 1);

                let valeur = associe[field];

                if (field === "taux" && typeof valeur === "number") {
                    valeur = valeur / 100;
                }

                else if (typeof valeur === 'number') {
                    valeur = Math.round(valeur);
                }

                if (typeof valeur === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(valeur)) {
                    const [year, month, day] = valeur.split('-');
                    valeur = `${day}/${month}/${year}`;
                }

                champ.ele('valeur').txt((valeur ?? '').toString().trim());
            });
        });
    });
};

const exportDpa2ToXml = async (tableau, id_dossier, id_compte, id_exercice) => {
    const dp = await recupTableau.recupDP(id_compte, id_dossier, id_exercice);

    if (dp.length === 0) {
        return
    }

    const dpAutres = dp.filter(val => val.nature_prov === "AUTRE");

    if (dpAutres.length === 0) {
        return
    }

    ['montant_debut_ex', 'augm_dot_ex', 'dim_repr_ex', 'montant_fin'].forEach((field, i) => {
        dpAutres.forEach((associe, index) => {
            const ligne = index + 1;
            const champ = tableau.ele('champTableauVariable');
            champ.ele('colonne').txt(`PCG_DPA2_${i + 2}`);
            champ.ele('ligne').txt(ligne);
            champ.ele('valeur').txt(Math.round((associe[field] ?? 0)));
        });
    });
};

const exportEiafncaToXml = async (tableau, id_dossier, id_compte, id_exercice) => {
    const listEiafnc = await recupTableau.recupEIAFNC(id_compte, id_dossier, id_exercice);

    if (listEiafnc.length === 0) {
        return
    }

    const rubriqueMapping = {
        IMMOINCORP: "A",
        IMMOCORP: "B",
        IMMOENCOUR: "C",
        IMMOFIN: "D",
        AUTREACTIF: "F",
        PART: "E"
    };

    const fieldMapping = {
        libelle: 1,
        num_compte: 6,
        valeur_acquisition: 7,
        augmentation: 8,
        diminution: 9,
        valeur_brute: 10
    };

    Object.entries(rubriqueMapping).forEach(([rubrique, letter]) => {
        const lignes = listEiafnc.filter(row => row.rubriques_poste === rubrique);

        Object.entries(fieldMapping).forEach(([field, colIndex]) => {
            lignes.forEach((associe, ligneIndex) => {
                const champ = tableau.ele('champTableauVariable');

                champ.ele('colonne').txt(`PCG_EIAFNC${letter}_${colIndex}`);
                champ.ele('ligne').txt(ligneIndex + 1);

                let valeur = associe[field];
                if (typeof valeur === 'number') {
                    valeur = Math.round(valeur);
                }

                champ.ele('valeur').txt((valeur ?? '').toString().trim());
            });
        });
    });
};

const exportSeToXml = async (tableau, id_dossier, id_compte, id_exercice) => {
    const listSe = await recupTableau.recupSE(id_compte, id_dossier, id_exercice);

    if (listSe.length === 0) {
        return
    }

    ['liste_emprunteur', 'date_contrat', 'duree_contrat', 'montant_emprunt', 'montant_interet', 'montant_total', 'date_disposition', 'date_remboursement', 'montant_rembourse_capital', 'montant_rembourse_interet', 'solde_non_rembourse'].forEach((field, i) => {
        listSe.forEach((associe, index) => {
            const ligne = index + 1;
            const champ = tableau.ele('champTableauVariable');
            champ.ele('colonne').txt(`PCG_SE_${i + 1}`);
            champ.ele('ligne').txt(ligne);

            let valeur = associe[field];

            if (typeof valeur === 'number') {
                valeur = Math.round(valeur);
            } else if (typeof valeur === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(valeur)) {
                const [year, month, day] = valeur.split('-');
                valeur = `${day}/${month}/${year}`;
            }

            champ.ele('valeur').txt((valeur ?? '').toString().trim());
        });
    });
};

module.exports = {
    // Ligne fixe
    exportActifToXml,
    exportPassifToXml,
    exportCrnToXml,
    exportCrfToXml,
    exportTftdToXml,
    exportTftiToXml,
    exportEvcpToXml,
    exportDrfToXml,
    exportBhiapcbToXml,
    exportMpa2ToXml,
    exportMpb2ToXml,
    exportDaToXml,
    exportDpa1ToXml,
    exportSdrToXml,
    exportSadToXml,

    // Ligne variable
    exportCapToXml,
    exportDbToXml,
    exportBhiapcaToXml,
    exportMpa1ToXml,
    exportMpb1ToXml,
    exportDa1ToXml,
    exportDpa2ToXml,
    exportEiafncaToXml,
    exportSeToXml
}