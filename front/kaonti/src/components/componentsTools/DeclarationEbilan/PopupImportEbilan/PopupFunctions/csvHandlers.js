import Papa from "papaparse";
import axios from "../../../../../../config/axios";
import toast from 'react-hot-toast';
import formatDateToISO from "./DateFormating";

const apiEndpoints = {
    "11": "/declaration/ebilan/importBhiapc",
    "12": "/declaration/ebilan/importMp",
    "13": "/declaration/ebilan/importDa",
    "15": "/declaration/ebilan/importEiafnc",
    "18": "/declaration/ebilan/importSe"
};

export const parseCsvFile = async ({
    file,
    type,
    expectedHeaders,
    processRow,
    startImport,
    setCsvFile,
    setShowAnomalieData,
    closePopup,
    setAnomalieData,
    setTraitementWaiting,
    setTraitementMsg,
    setProgressValue,
    setImportedCount
}) => {
    if (!file) return;

    if (setTraitementMsg) setTraitementMsg('Lecture du fichier en cours...');
    if (setTraitementWaiting) setTraitementWaiting(true);
    if (setProgressValue) setProgressValue(10);

    Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        delimiter: ';',
        complete: async (results) => {
            const actualHeaders = results?.meta?.fields || [];
            const missingHeaders = expectedHeaders.filter(h => !actualHeaders.includes(h));

            if (missingHeaders.length > 0) {
                toast.error("Colonnes manquantes : " + missingHeaders.join(', '));
                setCsvFile(null);
                if (setTraitementWaiting) setTraitementWaiting(false);
                if (setProgressValue) setProgressValue(0);
                return;
            }

            if (setTraitementMsg) setTraitementMsg('Validation des données en cours...');
            if (setProgressValue) setProgressValue(35);

            const anomalies = [];
            const parsedData = results.data.reduce((acc, row, rowIndex) => {
                const rowData = processRow(row, rowIndex, anomalies);
                if (rowData) acc.push(rowData);
                return acc;
            }, []);

            if (setImportedCount) setImportedCount(parsedData.length);

            if (anomalies.length > 0) {
                toast.error(`${anomalies.length} anomalies détectées. Import annulé.`);
                setAnomalieData(anomalies);
                setCsvFile(null);
                setShowAnomalieData(true);
                if (setTraitementWaiting) setTraitementWaiting(false);
                if (setProgressValue) setProgressValue(0);
                return;
            }

            const endpoint = apiEndpoints[type];
            if (endpoint) {
                let usedSSE = false;
                try {
                    if (setTraitementMsg) setTraitementMsg(`Envoi des données (${parsedData.length} lignes) en cours...`);
                    if (setProgressValue) setProgressValue(70);
                    if (startImport) {
                        usedSSE = true;
                        const sseEndpoint = `${endpoint}WithProgress`;
                        startImport(
                            sseEndpoint,
                            { data: parsedData },
                            (eventData) => {
                                if (setProgressValue) setProgressValue(100);
                                toast.success(eventData?.message || 'Import terminé');
                                closePopup();
                            },
                            (errMsg) => {
                                toast.error(errMsg || "Erreur lors de l'import");
                            }
                        );
                    } else {
                        const response = await axios.post(endpoint, { data: parsedData });
                        if (response?.data?.state) {
                            if (setProgressValue) setProgressValue(100);
                            toast.success(response.data.message);
                            closePopup();
                        } else {
                            toast.error(response.data.message);
                        }
                    }
                } catch (error) {
                    console.error(`Erreur API import type ${type} :`, error);
                    toast.error("Erreur lors de l'envoi des données à l'API.");
                } finally {
                    if (usedSSE) {
                        // Le hook SSE gère l'état et la fermeture du flux.
                        // Ne pas masquer la barre tant que le SSE n'a pas émis complete/error.
                        return;
                    }
                    if (setTraitementWaiting) {
                        setTimeout(() => {
                            setTraitementWaiting(false);
                            if (setProgressValue) setProgressValue(0);
                        }, 600);
                    } else if (setProgressValue) {
                        setProgressValue(0);
                    }
                }
            }

            setCsvFile(file);
        },
        error: (error) => {
            console.error("Erreur parsing CSV :", error);
            toast.error("Erreur lors de la lecture du fichier.");
            if (setTraitementWaiting) setTraitementWaiting(false);
            if (setProgressValue) setProgressValue(0);
        }
    });
};

export const processBhiapcRow = (row, rowIndex, anomalies) => {
    const anomaliesRow = [];

    const nif = Number(row.nif);
    if (isNaN(nif)) anomaliesRow.push("nif doit être un nombre");

    const montant_charge = Number(parseFloat(row.montant_charge?.replace(',', '.'))).toFixed(2);
    if (isNaN(montant_charge)) Number(anomaliesRow.push("montant_charge doit être un nombre")).toFixed(2);

    const montant_beneficiaire = parseFloat(row.montant_beneficiaire?.replace(',', '.'));
    if (isNaN(montant_beneficiaire)) anomaliesRow.push("montant_beneficiaire doit être un nombre");

    if (anomaliesRow.length > 0) {
        anomalies.push({ ligne: rowIndex + 2, anomalies: anomaliesRow });
        return null;
    }

    return {
        ...row,
        montant_charge,
        montant_beneficiaire,
        id_etat: 'MANUEL'
    };
};

export const processMpRow = (row, rowIndex, anomalies) => {
    const anomaliesRow = [];

    const montant_marche_ht = Number(parseFloat(row.montant_marche_ht?.replace(',', '.')).toFixed(2));
    if (isNaN(montant_marche_ht)) anomaliesRow.push("montant_marche_ht est obligatoire");

    const montant_paye = Number(parseFloat(row.montant_paye?.replace(',', '.')).toFixed(2));
    if (isNaN(montant_paye)) anomaliesRow.push("montant_paye est obligatoire");

    const tmp = Number(parseFloat(row.tmp?.replace(',', '.')).toFixed(2));
    if (isNaN(tmp)) anomaliesRow.push("tmp est obligatoire");

    const marche = row.marche ? row.marche.trim().toUpperCase() : null;
    if (marche && !["MP", "AUTRE"].includes(marche)) {
        anomaliesRow.push(`marche doit être "MP" ou "AUTRE"`);
    }

    const date = row.date ? formatDateToISO(row.date) : null;
    if (row.date && !date) anomaliesRow.push("date invalide");

    const date_paiement = row.date_paiement ? formatDateToISO(row.date_paiement) : null;
    if (row.date_paiement && !date_paiement) anomaliesRow.push("date_paiement invalide");

    const ref_marche = row.ref_marche ? row.ref_marche.trim().toUpperCase() : null;

    if (anomaliesRow.length > 0) {
        anomalies.push({ ligne: rowIndex + 2, anomalies: anomaliesRow });
        return null;
    }

    return {
        ...row,
        montant_marche_ht,
        montant_paye,
        tmp,
        marche,
        date,
        date_paiement,
        ref_marche,
        id_etat: 'MANUEL',
    };
};

export const processSeRow = (row, rowIndex, anomalies) => {
    const anomaliesRow = [];

    // Ligne obligatoire
    const montant_emprunt = parseFloat(row.montant_emprunt?.replace(',', '.'));
    if (isNaN(montant_emprunt)) anomaliesRow.push("montant_emprunt est obligatoire");

    const montant_interet = parseFloat(row.montant_interet?.replace(',', '.'));
    if (isNaN(montant_interet)) anomaliesRow.push("montant_interet est obligatoire");

    const montant_total = parseFloat(row.montant_total?.replace(',', '.'));
    if (isNaN(montant_total)) anomaliesRow.push("montant_total est obligatoire");

    const montant_rembourse_capital = parseFloat(row.montant_rembourse_capital?.replace(',', '.'));
    if (isNaN(montant_rembourse_capital)) anomaliesRow.push("montant_rembourse_capital est obligatoire");

    const montant_rembourse_interet = parseFloat(row.montant_rembourse_interet?.replace(',', '.'));
    if (isNaN(montant_rembourse_interet)) anomaliesRow.push("montant_rembourse_interet est obligatoire");

    const solde_non_rembourse = parseFloat(row.solde_non_rembourse?.replace(',', '.'));
    if (isNaN(solde_non_rembourse)) anomaliesRow.push("solde_non_rembourse est obligatoire");

    // Ligne facultatif
    const duree_contrat = row.duree_contrat ? Number(row.duree_contrat) : null;
    if (row.duree_contrat && isNaN(duree_contrat)) anomaliesRow.push("La durée de contrat doit être un nombre");

    const date_contrat = row.date_contrat ? formatDateToISO(row.date_contrat) : null;
    if (row.date_contrat && !date_contrat) date_contrat.push("date_contrat invalide");

    const date_disposition = row.date_disposition ? formatDateToISO(row.date_disposition) : null;
    if (row.date_disposition && !date_disposition) date_disposition.push("date_disposition invalide");

    const date_remboursement = row.date_remboursement ? formatDateToISO(row.date_remboursement) : null;
    if (row.date_remboursement && !date_remboursement) date_remboursement.push("date_remboursement invalide");

    if (!row.liste_emprunteur || row.liste_emprunteur.trim() === "") {
        anomaliesRow.push("liste_emprunteur est obligatoire");
    }

    if (anomaliesRow.length > 0) {
        anomalies.push({ ligne: rowIndex + 2, anomalies: anomaliesRow });
        return null;
    }

    return {
        ...row,
        montant_emprunt: Number(montant_emprunt.toFixed(2)),
        montant_interet: Number(montant_interet.toFixed(2)),
        montant_total: Number(montant_total.toFixed(2)),
        date_contrat,
        duree_contrat,
        date_disposition,
        date_remboursement,
        montant_rembourse_capital: Number(montant_rembourse_capital.toFixed(2)),
        montant_rembourse_interet: Number(montant_rembourse_interet.toFixed(2)),
        solde_non_rembourse: Number(solde_non_rembourse.toFixed(2)),
        id_etat: 'MANUEL',
    };
};

export const processDaRow = (row, rowIndex, anomalies) => {
    const anomaliesRow = [];

    const rubriques_poste = row.rubriques_poste ? row.rubriques_poste.trim().toUpperCase() : "";
    if (rubriques_poste && !["IMMO_CORP", "GOODWILL", "IMMO_INCORP", "IMMO_FIN", "IMMO_ENCOURS"].includes(rubriques_poste)) {
        anomaliesRow.push(
            `${rubriques_poste} n'est pas reconnue dans "IMMO_CORP", "GOODWILL", "IMMO_INCORP", "IMMO_FIN" ou "IMMO_ENCOURS"`
        );
    }

    // Libelle (OBLIGATOIRE mais si rempli, validation)
    const libelle = row.libelle ? row.libelle.trim().toUpperCase() : "";
    if (!libelle) anomaliesRow.push("libelle est obligatoire");

    // Num compte (OPTIONNEL)
    const num_compte = row.num_compte !== undefined && row.num_compte !== ""
        ? Number(row.num_compte)
        : null;
    if (num_compte !== null && isNaN(num_compte)) anomaliesRow.push("num_compte invalide");

    // Date acquisition (OBLIGATOIRE et valide)
    const date_acquisition = row.date_acquisition ? formatDateToISO(row.date_acquisition) : null;
    if (!date_acquisition) anomaliesRow.push("date_acquisition est obligatoire ou invalide");

    // Taux (OBLIGATOIRE et valide)
    const taux = row.taux !== undefined && row.taux !== ""
        ? Number(parseFloat(row.taux.replace(',', '.')).toFixed(2))
        : null;
    if (taux === null || isNaN(taux)) anomaliesRow.push("taux est obligatoire et doit être un nombre");

    // Valeur acquisition (OBLIGATOIRE et valide)
    const valeur_acquisition = row.valeur_acquisition !== undefined && row.valeur_acquisition !== ""
        ? Number(parseFloat(row.valeur_acquisition.replace(',', '.')).toFixed(2))
        : null;
    if (valeur_acquisition === null || isNaN(valeur_acquisition)) anomaliesRow.push("valeur_acquisition est obligatoire et doit être un nombre");

    // Augmentation (OPTIONNEL)
    const augmentation = row.augmentation !== undefined && row.augmentation !== ""
        ? Number(parseFloat(row.augmentation.replace(',', '.')).toFixed(2))
        : 0;
    if (augmentation !== null && isNaN(augmentation)) anomaliesRow.push("augmentation doit être un nombre");

    // Diminution (OPTIONNEL)
    const diminution = row.diminution !== undefined && row.diminution !== ""
        ? Number(parseFloat(row.diminution.replace(',', '.')).toFixed(2))
        : 0;
    if (diminution !== null && isNaN(diminution)) anomaliesRow.push("diminution doit être un nombre");

    // Amortissement antérieur (OBLIGATOIRE)
    const amort_anterieur = row.amort_anterieur !== undefined && row.amort_anterieur !== ""
        ? Number(parseFloat(row.amort_anterieur.replace(',', '.')).toFixed(2))
        : null;
    if (amort_anterieur === null || isNaN(amort_anterieur)) anomaliesRow.push("amort_anterieur est obligatoire et doit être un nombre");

    // Dotation exercice (OBLIGATOIRE)
    const dotation_exercice = row.dotation_exercice !== undefined && row.dotation_exercice !== ""
        ? Number(parseFloat(row.dotation_exercice.replace(',', '.')).toFixed(2))
        : null;
    if (dotation_exercice === null || isNaN(dotation_exercice)) anomaliesRow.push("dotation_exercice est obligatoire et doit être un nombre");

    // Si anomalies => enregistrer et ignorer la ligne
    if (anomaliesRow.length > 0) {
        anomalies.push({ ligne: rowIndex + 2, anomalies: anomaliesRow });
        return null;
    }

    const amort_cumule = amort_anterieur + dotation_exercice;
    const valeur_nette = valeur_acquisition + augmentation - diminution - amort_cumule;

    return {
        ...row,
        taux,
        libelle,
        date_acquisition,
        valeur_acquisition,
        amort_cumule,
        valeur_nette,
        augmentation,
        diminution,
        amort_anterieur,
        dotation_exercice,
        id_etat: 'MANUEL',
    };
};

export const processEiafncRow = (row, rowIndex, anomalies) => {
    const anomaliesRow = [];

    // Rubriques poste (optionnel mais validation si rempli)
    const rubriques_poste = row.rubriques_poste ? row.rubriques_poste.trim().toUpperCase() : "";
    if (rubriques_poste && !["AUTRESACTIF", "IMMOCORP", "IMMOENCOUR", "IMMOINCORP", "IMMOFIN", "PART"].includes(rubriques_poste)) {
        anomaliesRow.push(
            `${rubriques_poste} n'est pas reconnue dans "AUTRESACTIF", "IMMOCORP", "IMMOENCOUR", "IMMOINCORP", "IMMOFIN" ou "PART"`
        );
    }

    // Libelle (optionnel mais validation si rempli)
    const libelle = row.libelle ? row.libelle.trim().toUpperCase() : "";

    // Num compte (optionnel mais validation si rempli)
    const num_compte = Number(row.num_compte);
    if (isNaN(num_compte)) anomaliesRow.push("num_compte est OBLIGATOIRE et doit être un nombre");

    // Valeur acquisition (OBLIGATOIRE et valide)
    const valeur_acquisition = Number(parseFloat(row.valeur_acquisition?.replace(',', '.')).toFixed(2));
    if (isNaN(valeur_acquisition)) anomaliesRow.push("valeur_acquisition est obligatoire");

    // Autres champs facultatifs mais valides si remplis
    const augmentation = row.augmentation !== undefined && row.augmentation !== ""
        ? Number(parseFloat(row.augmentation?.replace(',', '.')).toFixed(2))
        : 0;
    if (augmentation !== null && isNaN(augmentation)) anomaliesRow.push("augmentation doit être un nombre");

    const diminution = row.diminution !== undefined && row.diminution !== ""
        ? Number(parseFloat(row.diminution?.replace(',', '.')).toFixed(2))
        : 0;
    if (diminution !== null && isNaN(diminution)) anomaliesRow.push("diminution doit être un nombre");

    // Si anomalies => enregistrer et ignorer la ligne
    if (anomaliesRow.length > 0) {
        anomalies.push({ ligne: rowIndex + 2, anomalies: anomaliesRow });
        return null;
    }

    const valeur_brute = valeur_acquisition + augmentation - diminution;

    return {
        ...row,
        libelle,
        valeur_acquisition,
        augmentation,
        diminution,
        valeur_brute,
        id_etat: 'MANUEL',
    };
};