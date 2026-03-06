import { useState, useEffect, useRef } from 'react';
import { Typography, Stack, Box, Button, Divider, DialogTitle, Tooltip, Autocomplete, TextField } from '@mui/material';
import { TabContext, TabPanel } from '@mui/lab';
import { styled } from '@mui/material/styles';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import { init } from '../../../../init';

import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Radio from '@mui/material/Radio';
import OptionJoy from '@mui/joy/Option';
import SelectJoy from '@mui/joy/Select';
import InputJoy from '@mui/joy/Input';
import { DataGridStyle } from '../DatagridToolsStyle';
import { DataGrid, frFR, useGridApiRef, GridRowModes } from '@mui/x-data-grid';
import QuickFilter from '../DatagridToolsStyle';

import { useFormik } from 'formik';
import PopupConfirmDelete from '../popupConfirmDelete';
import FormatedInput from '../FormatedInput';
import DropPDFUploader from '../FileUploader/DropPdfUploader';

import toast from 'react-hot-toast';

import useAuth from '../../../hooks/useAuth';
import { jwtDecode } from 'jwt-decode';
import { getSaisieColumnHeader } from './saisieColumns';

import { PiKeyboardDuotone } from "react-icons/pi";
import PopupAddNewAccount from '../PlanComptable/PopupAddNewAccount';
import { MdAccountBalance } from "react-icons/md";
import PopupAjustCa from './popupAjustCa';

import useAxiosPrivate from '../../../../config/axiosPrivate';
import { BsFillInfoCircleFill } from "react-icons/bs";
import { useCallback } from 'react';

let initial = init[0];

function createData(id, jour, compte, num_facture, piece, libelle, debit, credit) {
    return {
        id,
        jour,
        compte,
        piece,
        libelle,
        num_facture,
        debit,
        credit,
    };
}

const rows = [
    createData(-1, null, null, null, null, null, 0, 0),
];

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
    '& .MuiDialogContent-root': {
        padding: theme.spacing(2),
    },
    '& .MuiDialogActions-root': {
        padding: theme.spacing(1),
    },
}));

const PopupSaisie = ({
    confirmationState,
    fileId,
    selectedExerciceId,
    setRefresh,
    setRefreshListAxeSection,
    type,
    rowsEdit,
    setRowSelectionModel,
    listeCodeJournaux,
    listePlanComptable,
    listeAnnee,
    listeDevise,
    setIsRefreshedPlanComptable,
    isCaActive,
    listCa,
    setListCa,
    canView,
    canAdd,
    canDelete,
    canModify,
    isTypeComptaAutre,
    listCompteAssocie
}) => {

    const defaultDeviseData = listeDevise.find(val => val.par_defaut === true);

    const defaultDevise = defaultDeviseData.code === 'MGA' ? 'MGA' : 'Devises';

    const axiosPrivate = useAxiosPrivate();

    const [taux, setTaux] = useState(rowsEdit[0]?.taux || 0);
    const selectRef = useRef();

    const [tableRows, setTableRows] = useState(type === 'ajout' ? rows : rowsEdit);
    const [invalidRows, setInvalidRows] = useState([]);
    const [rowModesModel, setRowModesModel] = useState({});

    const [deletedRowIds, setDeletedRowIds] = useState([]);
    const [isDisabledAddButton, setIsDisabledAddButton] = useState(false);

    const [openDialogDeleteSaisie, setOpenDialogDeleteSaisie] = useState(false);
    const [openDialogAddNewAccount, setOpenDialogAddNewAccount] = useState(false);

    const [selectedCell, setSelectedCell] = useState({ id: null, field: null });

    const [openPopupCa, setOpenPopupCa] = useState(false);
    const [popupCaData, setPopupCaData] = useState(null);
    const [listCaFinal, setListCaFinal] = useState([]);

    const handleOpenPopupCa = (rowId, type, montant) => {
        setRefreshListAxeSection();
        setListCaFinal(prev => {
            const newEntries = listCa.map(item => ({
                id_dossier: Number(fileId),
                id_exercice: Number(selectedExerciceId),
                id_compte: Number(compteId),
                id_axe: item.id_axe,
                id_section: item.id_section,
                id_ligne_ecriture: rowId,
                code_axe: item.code_axe,
                libelle_axe: item.libelle_axe,
                compte_axe: item.compte_axe,
                pourcentage: item.pourcentage,
                section: item.section,
                intitule_section: item.intitule_section,
                debit: 0,
                credit: 0,
            }));

            const filteredEntries = newEntries.filter(
                entry => !prev.some(e => e.id_ligne_ecriture === rowId && e.id_section === entry.id_section)
            );

            return [...prev, ...filteredEntries];
        });
        setPopupCaData({ rowId, type, montant });
        setOpenPopupCa(true);
    };

    const handleClosePopupCa = () => {
        setOpenPopupCa(false);
        setPopupCaData(null);
        setRefreshListAxeSection();
    };

    const apiRef = useGridApiRef();

    //récupération des informations de connexion
    const { auth } = useAuth();
    const decoded = auth?.accessToken ? jwtDecode(auth.accessToken) : undefined;
    const compteId = decoded.UserInfo.compteId || null;

    //Fichier importé
    const [file, setFile] = useState(type === 'ajout' ? null : rowsEdit[0]?.fichier);

    //Id du ligne à supprimer
    const [selectedIdToDelete, setSelectedIdToDelete] = useState(null);

    const formSaisie = useFormik({
        initialValues: {
            valSelectCodeJnl: listeCodeJournaux.find(
                j => j.id === Number(rowsEdit[0]?.id_journal)
            ) || null,
            valSelectMois: parseInt(rowsEdit[0]?.dateecriture?.split('-')[1]) || "",
            valSelectAnnee: rowsEdit[0]?.dateecriture?.split('-')[0] || "",
            choixDevise: rowsEdit[0]?.devise || defaultDevise,
            taux: rowsEdit[0]?.taux || taux,
            currency: rowsEdit[0]?.devise || defaultDeviseData.code,
            tableRows: [],
            file: rowsEdit[0]?.fichier || null,
            id_dossier: fileId,
            id_compte: compteId,
            id_exercice: selectedExerciceId,
            id_devise: '',
        }
    })

    const typeCodeJournal = (formSaisie.values.valSelectCodeJnl?.type || '').toUpperCase();
    const compteAssocieCodeJournal = (formSaisie.values.valSelectCodeJnl?.compteassocie || '').trim().toUpperCase();

    const normalizedListCompteAssocie = listCompteAssocie.map(c => c.trim().toUpperCase());

    let newList;

    if (!['BANQUE', 'CAISSE'].includes(typeCodeJournal)) {
        newList = listePlanComptable.filter(
            val => !normalizedListCompteAssocie.includes(val.compte.trim().toUpperCase())
        );
    } else {
        const newListeCompteAssocie = normalizedListCompteAssocie.filter(val => val !== compteAssocieCodeJournal);
        newList = compteAssocieCodeJournal
            ? listePlanComptable.filter(val => !newListeCompteAssocie.includes(val.compte.trim().toUpperCase()))
            : listePlanComptable;
    }

    const handleRowModesModelChange = (newRowModesModel) => {
        setRowModesModel(newRowModesModel);
    };

    //supprimer un saisie
    const handleOpenDialogConfirmDeleteSaisie = (id) => {
        const selectedJournalId = formSaisie.values.valSelectCodeJnl;
        const codeJournal = listeCodeJournaux.find(cj => cj.id === selectedJournalId);

        if (codeJournal && codeJournal.type === 'RAN') {
            return toast.error('Impossible de supprimer une ligne d\'une écriture de type RAN');
        }

        setOpenDialogDeleteSaisie(true);
        setSelectedIdToDelete(id);
    }

    const handleOpenDialogAddNewAccount = () => {
        setOpenDialogAddNewAccount(true);
    }

    const handleCloseDialogAddNewAccount = () => {
        setOpenDialogAddNewAccount(false);
        setIsRefreshedPlanComptable(prev => !prev);
    }

    const isDatagridEditing = () => {
        return Object.keys(apiRef.current?.state?.editRows || {}).length > 0;
    };

    const equilibrateDebitCredit = (id, type) => {
        let totalDebit = 0.0;
        let totalCredit = 0.0;

        // Fonction de nettoyage de nombre
        const parseNumber = (val) => {
            const num = parseFloat(val);
            return isNaN(num) ? 0 : num;
        };

        // 1. Calcul des totaux
        tableRows.forEach((row) => {
            const debitNum = parseNumber(row.debit);
            const creditNum = parseNumber(row.credit);

            totalDebit += debitNum;
            totalCredit += creditNum;
        });

        const difference = parseFloat((totalDebit - totalCredit).toFixed(2));

        const rowIndex = tableRows.findIndex((row) => row.id === id);
        if (rowIndex === -1) {
            toast.error("Ligne introuvable.", {
                duration: 1000
            });
            return;
        }

        const selectedRow = tableRows[rowIndex];
        const newRows = [...tableRows];

        const debit = parseNumber(selectedRow.debit);
        const credit = parseNumber(selectedRow.credit);

        if (type === "debit" && difference <= 0) {
            if (credit !== 0) {
                toast.error("Aucun ajustement car un seul montant est renseigné.", {
                    duration: 1000
                });
                return;
            }

            const adjustedDebit = parseFloat((debit + Math.abs(difference)).toFixed(2));
            let adjustedMontantDevise = selectedRow.montant_devise;

            if (formSaisie.values.choixDevise !== 'MGA') {
                const taux = parseNumber(formSaisie.values.taux);

                if (!taux || taux <= 0) {
                    toast.error("Taux invalide pour la conversion.", {
                        duration: 1000
                    });
                    return;
                }

                adjustedMontantDevise = parseFloat((adjustedDebit / taux).toFixed(2));
            }

            newRows[rowIndex] = {
                ...selectedRow,
                debit: adjustedDebit,
                ...(formSaisie.values.choixDevise !== 'MGA' && {
                    montant_devise: adjustedMontantDevise,
                }),
            };

            setTableRows(newRows);
            toast.success("Débit ajusté pour équilibrer les montants.", {
                duration: 1000
            });
        }
        else if (type === "credit" && difference >= 0) {
            if (debit !== 0) {
                toast.error("Aucun ajustement car un seul montant est renseigné.", {
                    duration: 1000
                });
                return;
            }

            const adjustedCredit = parseFloat((credit + difference).toFixed(2));
            let adjustedMontantDevise = selectedRow.montant_devise;

            if (formSaisie.values.choixDevise !== 'MGA') {
                const taux = parseNumber(formSaisie.values.taux);

                if (!taux || taux <= 0) {
                    toast.error("Taux invalide pour la conversion.", {
                        duration: 1000
                    });
                    return;
                }

                adjustedMontantDevise = parseFloat((adjustedCredit / taux).toFixed(2));
            }

            newRows[rowIndex] = {
                ...selectedRow,
                credit: adjustedCredit,
                ...(formSaisie.values.choixDevise !== 'MGA' && {
                    montant_devise: adjustedMontantDevise,
                }),
            };

            setTableRows(newRows);
            toast.success("Crédit ajusté pour équilibrer les montants.", {
                duration: 1000
            });
        }
        else {
            toast.error("Aucun ajustement nécessaire.", {
                duration: 1000
            });
        }
    };

    //Ajouter une ligne
    const ajouterNouvelleLigne = useCallback(() => {
        if (isDisabledAddButton) {
            toast.error("Impossible d'ajouter une ligne dans le mode édition");
            return;
        }

        if (!formSaisie.values.valSelectCodeJnl &&
            !formSaisie.values.valSelectMois &&
            !formSaisie.values.valSelectAnnee) {
            toast.error("Veuillez remplir les formulaires s'il vous plaît !");
            return;
        }

        if (!formSaisie.values.valSelectCodeJnl) {
            toast.error("Sélectionner le code journal s'il vous plaît !");
            return;
        }

        if (!formSaisie.values.valSelectMois) {
            toast.error("Sélectionner le mois s'il vous plaît !");
            return;
        }

        if (!formSaisie.values.valSelectAnnee) {
            toast.error("Sélectionner l'année s'il vous plaît !");
            return;
        }

        if (formSaisie.values.choixDevise !== 'MGA' &&
            !formSaisie.values.currency) {
            toast.error("Veuillez sélectionner une devise s'il vous plaît !");
            return;
        }

        const minId = Math.min(...tableRows.map(r => r.id), -1);
        const newId = minId <= 0 ? minId - 1 : -1;

        let dernierJour = '';
        let dernierLibelle = '';
        let dernierPiece = '';
        let dernierNumfacture = '';

        for (let i = tableRows.length - 1; i >= 0; i--) {
            const row = tableRows[i];

            if (!dernierJour && row.jour) dernierJour = row.jour;
            if (!dernierLibelle && row.libelle) dernierLibelle = row.libelle;
            if (!dernierPiece && row.piece) dernierPiece = row.piece;
            if (!dernierNumfacture && row.num_facture) dernierNumfacture = row.num_facture;

            if (dernierJour && dernierLibelle && dernierPiece && dernierNumfacture) break;
        }

        const newRow = {
            id: newId,
            jour: dernierJour,
            piece: dernierPiece,
            libelle: dernierLibelle,
            num_facture: dernierNumfacture,
            debit: 0,
            credit: 0,
        };

        setTableRows(prev => [...prev, newRow]);

        setRowModesModel(prev => ({
            ...prev,
            [newId]: { mode: GridRowModes.Edit }
        }));

        setTimeout(() => {
            apiRef.current?.setCellFocus(newId, 'jour');
        });

    }, [tableRows, formSaisie.values, isDisabledAddButton]);

    const handleClose = () => {
        confirmationState(false);
    }

    const columns = getSaisieColumnHeader({
        formSaisie,
        setInvalidRows,
        invalidRows,
        selectedCell,
        listePlanComptable: newList,
        taux,
        equilibrateDebitCredit,
        tableRows,
        handleOpenDialogConfirmDeleteSaisie,
        isDatagridEditing,
        ajouterNouvelleLigne,
        isCaActive,
        handleOpenPopupCa,
        listeCodeJournaux,
        setRowModesModel
    });

    //Supprimer la ligne pour ajout
    const handleDeleteRowAdd = (value) => {
        exitEditingToDatagrid();
        if (value) {
            setTableRows((prevRows) => prevRows.filter((row) => row.id !== selectedIdToDelete));
            setListCaFinal(prev => prev.filter(item => item.id_ligne_ecriture !== selectedIdToDelete));
            setOpenDialogDeleteSaisie(false);
            toast.success('Ligne supprimée avec succès');
        } else {
            setOpenDialogDeleteSaisie(false);
        }
    };

    const handleDeleteRowEdit = (value) => {
        exitEditingToDatagrid();
        if (value) {
            setTableRows((prevRows) => prevRows.filter((row) => row.id !== selectedIdToDelete));
            setListCaFinal(prev => prev.filter(item => item.id_ligne_ecriture !== selectedIdToDelete));
            setOpenDialogDeleteSaisie(false);
            if (selectedIdToDelete > 0) {
                setDeletedRowIds(prev => [...prev, selectedIdToDelete]);
            }
            toast.success('Ligne supprimée avec succès');
        } else {
            setOpenDialogDeleteSaisie(false);
        }
    };

    const handleDeleteRow = type === 'ajout' ? handleDeleteRowAdd : handleDeleteRowEdit;

    // Lors d’un clic sur une cellule
    const handleCellClick = (params) => {
        if (params.field === '__check__') return;

        if (
            ['debit', 'credit', 'libelle', 'piece', 'compte', 'jour', 'montant_devise', 'num_facture'].includes(params.field)
        ) {
            setSelectedCell({ id: params.id, field: params.field });
        }

        if ((params.field === 'debit' || params.field === 'credit')) {
            if (!window.lastDebitCreditToast || Date.now() - window.lastDebitCreditToast > 3000) {
                toast.custom((t) => (
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                            backgroundColor: '#2B2D42',
                            color: '#fff',
                            padding: '12px 16px',
                            borderRadius: '12px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                            borderLeft: `6px solid ${params.field === 'debit' ? '#00bfa5' : '#ffb703'}`,
                            minWidth: '320px',
                        }}
                    >
                        <PiKeyboardDuotone size={28} color="#90caf9" />
                        <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                Raccourci disponible !
                            </Typography>
                            <Typography variant="body2">
                                Appuyez sur <b>Ctrl + Espace</b> pour équilibrer automatiquement le solde du
                                <b> {params.field === 'debit' ? 'débit' : 'crédit'}</b>.
                            </Typography>
                        </Box>
                    </Box>
                ), { duration: 1000 });
                window.lastDebitCreditToast = Date.now();
            }
            return;
        }
    };

    //Afficher une erreur si aucune mois n'est selectionné
    const handleRowEditStart = (params, event) => {
        if (!formSaisie.values.valSelectMois) {
            event.defaultMuiPrevented = true;
            toast.error("Veuillez d'abord sélectionner un mois");
        }
    };

    const exitEditingToDatagrid = () => {
        const editingRows = Object.keys(apiRef.current.state.editRows || {});

        editingRows.forEach((id) => {
            const rowInEdit = apiRef.current.getRow(id);

            apiRef.current.updateRows([rowInEdit]);

            apiRef.current.stopRowEditMode({ id, ignoreModifications: false });
        });
    };

    const addOrUpdateJournal = async () => {
        const listCaFinalFiltered = listCaFinal.filter(val => val.debit !== 0 || val.credit !== 0);

        const rowsInvalides = [];

        tableRows.forEach((row) => {
            const champsVides = [];

            if (!row.jour) champsVides.push('jour');
            if (!row.compte) champsVides.push('compte');
            if (!row.libelle) champsVides.push('libelle');
            if (formSaisie.values.choixDevise !== 'MGA' && !row.montant_devise)
                champsVides.push('montant_devise');

            const debitVide = !row.debit || isNaN(Number(row.debit)) || Number(row.debit) === 0;
            const creditVide = !row.credit || isNaN(Number(row.credit)) || Number(row.credit) === 0;
            if (debitVide && creditVide) champsVides.push('debit', 'credit');

            if (champsVides.length > 0) {
                rowsInvalides.push({ id: row.id, fields: champsVides });
            }
        });

        let id_devise = '';

        if (formSaisie.values.choixDevise === 'MGA') {
            const devise = listeDevise.find((val) => val.code === 'MGA');
            id_devise = devise?.id;
        } else {
            const devise = listeDevise.find((val) => val.code === formSaisie.values.currency);
            id_devise = devise?.id;
        }

        setInvalidRows(rowsInvalides);

        if (rowsInvalides.length > 0) {
            toast.error('Les champs en surbrillance sont obligatoires');
            return;
        }

        if (total !== 0) {
            toast.error('L\'écriture est déséquilibrée');
            return;
        }

        try {
            const formData = new FormData();
            formSaisie.values.id_devise = id_devise;

            const conserverFichier = type === 'modification' ? (!file && !!formSaisie.values.file) : undefined;

            const valeursSansFichier = {
                ...formSaisie.values,
                file: undefined,
                valSelectCodeJnl: formSaisie.values.valSelectCodeJnl?.id,
                tableRows,
                listCa: listCaFinalFiltered,
                ...(type === 'modification' ? { conserverFichier, deletedIds: deletedRowIds } : {})
            };

            formData.append("data", JSON.stringify(valeursSansFichier));
            if (file) formData.append("file", file);

            const url =
                type === 'ajout'
                    ? '/administration/traitementSaisie/ajoutJournal'
                    : '/administration/traitementSaisie/modificationJournal';

            const response = await axiosPrivate.post(url, formData, {
                headers: {
                    ...axiosPrivate.defaults.headers,
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (response?.data?.state) {
                toast.success(response?.data?.message);
                setRowSelectionModel();

                if (type === 'ajout') {
                    clearData();
                }

                setRefresh();
                setInvalidRows([]);
            } else {
                toast.error(response?.data?.message);
            }

        } catch (error) {
            toast.error(error);
        }
    };

    const totalDebitNotParsed = tableRows.reduce((total, row) => {
        const debit = parseFloat(row.debit) || 0;
        return total + debit;
    }, 0);

    const totalDebit = parseFloat(totalDebitNotParsed.toFixed(2));

    const totalCreditNotParsed = tableRows.reduce((total, row) => {
        const credit = parseFloat(row.credit) || 0;
        return total + credit;
    }, 0)

    const totalCredit = parseFloat(totalCreditNotParsed.toFixed(2));

    const total = totalDebit - totalCredit

    const totalFormatted = total.toLocaleString('fr-FR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).replace(/\u202f/g, ' ')

    const totalDebitFormatted = totalDebit.toLocaleString('fr-FR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).replace(/\u202f/g, ' ')

    const totalCreditFormatted = totalCredit.toLocaleString('fr-FR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).replace(/\u202f/g, ' ')

    //Equilibrer le debit et credit
    const EquilibrateDebitCredit = (id, type) => {
        let totalDebit = 0.0;
        let totalCredit = 0.0;

        const parseNumber = (val) => {
            const num = parseFloat(val);
            return isNaN(num) ? 0 : num;
        };

        tableRows.forEach((row) => {
            const debitNum = parseNumber(row.debit);
            const creditNum = parseNumber(row.credit);

            totalDebit += debitNum;
            totalCredit += creditNum;
        });

        const difference = parseFloat((totalDebit - totalCredit).toFixed(2));

        const rowIndex = tableRows.findIndex((row) => row.id === id);
        if (rowIndex === -1) {
            toast.error("Ligne introuvable.");
            return;
        }

        const selectedRow = tableRows[rowIndex];
        const newRows = [...tableRows];

        const debit = parseNumber(selectedRow.debit);
        const credit = parseNumber(selectedRow.credit);

        if (type === "debit" && difference <= 0) {
            if (credit !== 0) {
                toast.error("Aucun ajustement car un seul montant est renseigné.");
                return;
            }

            const adjustedDebit = parseFloat((debit + Math.abs(difference)).toFixed(2));
            let adjustedMontantDevise = selectedRow.montant_devise;

            if (formSaisie.values.choixDevise !== 'MGA') {
                const taux = parseNumber(formSaisie.values.taux);

                if (!taux || taux <= 0) {
                    toast.error("Taux invalide pour la conversion.");
                    return;
                }

                adjustedMontantDevise = parseFloat((adjustedDebit / taux).toFixed(2));
            }

            newRows[rowIndex] = {
                ...selectedRow,
                debit: adjustedDebit,
                ...(formSaisie.values.choixDevise !== 'MGA' && {
                    montant_devise: adjustedMontantDevise,
                }),
            };

            setTableRows(newRows);
            toast.success("Débit ajusté pour équilibrer les montants.");
        }
        else if (type === "credit" && difference >= 0) {
            if (debit !== 0) {
                toast.error("Aucun ajustement car un seul montant est renseigné.");
                return;
            }

            const adjustedCredit = parseFloat((credit + difference).toFixed(2));
            let adjustedMontantDevise = selectedRow.montant_devise;

            if (formSaisie.values.choixDevise !== 'MGA') {
                const taux = parseNumber(formSaisie.values.taux);

                if (!taux || taux <= 0) {
                    toast.error("Taux invalide pour la conversion.");
                    return;
                }

                adjustedMontantDevise = parseFloat((adjustedCredit / taux).toFixed(2));
            }

            newRows[rowIndex] = {
                ...selectedRow,
                credit: adjustedCredit,
                ...(formSaisie.values.choixDevise !== 'MGA' && {
                    montant_devise: adjustedMontantDevise,
                }),
            };

            setTableRows(newRows);
            toast.success("Crédit ajusté pour équilibrer les montants.");
        }
        else {
            toast.error("Aucun ajustement nécessaire.");
        }
    };

    const clearData = () => {
        formSaisie.resetForm();
        setTaux(0);
        setTableRows(rows);
        setFile(null);
    }

    const handleCellKeyDown = (params, event) => {
        const api = apiRef.current;

        if (params.field === 'actions') {
            return;
        }

        const allCols = api.getAllColumns().filter(c => c.editable);
        const sortedRowIds = api.getSortedRowIds();
        const currentColIndex = allCols.findIndex(c => c.field === params.field);
        const currentRowIndex = sortedRowIds.indexOf(params.id);

        let nextColIndex = currentColIndex;
        let nextRowIndex = currentRowIndex;

        if (event.key === 'Tab' && !event.shiftKey) {
            event.preventDefault();
            nextColIndex = currentColIndex + 1;
            if (nextColIndex >= allCols.length) {
                nextColIndex = 0;
                nextRowIndex = currentRowIndex + 1;
            }
        } else if (event.key === 'Tab' && event.shiftKey) {
            event.preventDefault();
            nextColIndex = currentColIndex - 1;
            if (nextColIndex < 0) {
                nextColIndex = allCols.length - 1;
                nextRowIndex = currentRowIndex - 1;
            }
        } else if (event.key === 'ArrowRight') {
            event.preventDefault();
            nextColIndex = currentColIndex + 1;
            if (nextColIndex >= allCols.length) nextColIndex = allCols.length - 1;
        } else if (event.key === 'ArrowLeft') {
            event.preventDefault();
            nextColIndex = currentColIndex - 1;
            if (nextColIndex < 0) nextColIndex = 0;
        }

        const nextRowId = sortedRowIds[nextRowIndex];
        const targetCol = allCols[nextColIndex];

        if (!nextRowId || !targetCol) return;

        try {
            api.stopCellEditMode({ id: params.id, field: params.field });
        } catch (err) {
            console.warn('Erreur stopCellEditMode ignorée:', err);
        }

        setTimeout(() => {
            const cellInput = document.querySelector(
                `[data-id="${nextRowId}"] [data-field="${targetCol.field}"] input, 
             [data-id="${nextRowId}"] [data-field="${targetCol.field}"] textarea`
            );
            if (cellInput) cellInput.focus();
        }, 50);
    };

    const paddingRightTotal = tableRows.length >= 20 ? 25.5 : 23.2;

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.ctrlKey && (event.key === ' ' || event.key === 'Spacebar')) {
                if (selectedCell) {
                    const { id, field } = selectedCell;

                    if (field === 'debit') {
                        EquilibrateDebitCredit(id, 'debit');
                    } else if (field === 'credit') {
                        EquilibrateDebitCredit(id, 'credit');
                    }
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedCell]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!selectedCell.id && !selectedCell.field) return;

            let el = event.target;
            let clickedOnCell = false;
            while (el) {
                if (el.classList && el.classList.contains('MuiDataGrid-cell')) {
                    clickedOnCell = true;
                    break;
                }
                el = el.parentElement;
            }

            if (!clickedOnCell) {
                setSelectedCell({ id: null, field: null });
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [selectedCell]);

    useEffect(() => {
        if (formSaisie.values.choixDevise === "MGA") {
            formSaisie.setFieldValue('currency', '');
            setTaux(0);
        }
    }, [formSaisie.values.choixDevise]);

    useEffect(() => {
        if (formSaisie.values.choixDevise === 'MGA') {
            setTableRows(prevRows => prevRows.map(row => {
                const newRow = { ...row };
                delete newRow.montant_devise;
                return newRow;
            }));
        }
    }, [formSaisie.values.choixDevise]);

    useEffect(() => {
        function handleClickOutside(event) {
            if (selectRef.current && !selectRef.current.contains(event.target)) {
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        setIsDisabledAddButton(isDatagridEditing());
    }, [tableRows, apiRef.current?.state?.editRows]);

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'l') {
                event.preventDefault();
                ajouterNouvelleLigne();
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [ajouterNouvelleLigne]);

    return (
        <>
            {
                openDialogDeleteSaisie ?
                    <PopupConfirmDelete
                        msg={"Voulez-vous vraiment supprimer la ligne sélectionné ?"}
                        confirmationState={handleDeleteRow}
                    />
                    :
                    null
            }
            {
                openDialogAddNewAccount && (
                    <PopupAddNewAccount
                        id_dossier={fileId}
                        id_compte={compteId}
                        selectedRow={[]}
                        open={openDialogAddNewAccount}
                        onClose={handleCloseDialogAddNewAccount}
                        stateAction={'ajout'}
                        isTypeComptaAutre={isTypeComptaAutre}
                    />
                )
            }
            {
                openPopupCa && (
                    <PopupAjustCa
                        open={openPopupCa}
                        onClose={handleClosePopupCa}
                        data={popupCaData}
                        type={type}
                        setListCaFinal={setListCaFinal}
                        listCaFinal={listCaFinal}
                        listCa={listCa}
                    />
                )
            }
            <BootstrapDialog
                onClose={handleClose}
                aria-labelledby="dialog-journal"
                open={true}
                fullWidth={true}
                fullScreen={true}
            >
                <DialogTitle
                    sx={{
                        m: 0,
                        py: 1.5,
                        px: 2,
                        bgcolor: "#f5f5f5",
                        borderBottom: "1px solid #ddd",
                    }}
                >
                    <Stack
                        direction="row"
                        alignItems="center"
                        justifyContent="space-between"
                    >
                        <Stack
                            direction={'row'}
                            alignItems={'center'}
                            spacing={2}
                        >
                            <Typography
                                variant="h6"
                                component="div"
                                fontWeight="bold"
                                color="text.primary"
                            >
                                {
                                    type === "ajout"
                                        ? "Ajout d'une nouvelle écriture"
                                        : "Modification d'une écriture"
                                }
                            </Typography>
                            <Stack>
                                <Tooltip
                                    title={
                                        `Raccourcis clavier disponibles :

                                        • Ctrl + Espace :
                                        Équilibrer automatiquement les montants Débit et Crédit.

                                        • Ctrl + Shift + L :
                                        Ajouter une nouvelle ligne d'écriture.`
                                    }
                                    arrow
                                    placement="bottom-start"
                                    slotProps={{
                                        tooltip: {
                                            sx: {
                                                fontSize: '14px',
                                                maxWidth: 400,
                                                whiteSpace: 'pre-line'
                                            }
                                        }
                                    }}
                                >
                                    <span style={{ marginBottom: -2 }}>
                                        <BsFillInfoCircleFill
                                            size={18}
                                            style={{ color: '#6c757d', cursor: 'pointer' }}
                                        />
                                    </span>
                                </Tooltip>

                            </Stack>
                        </Stack>

                        <IconButton
                            onClick={handleClose}
                            style={{ color: 'red', textTransform: 'none', outline: 'none' }}
                        >
                            <CloseIcon />
                        </IconButton>
                    </Stack>
                </DialogTitle>
                <DialogContent >
                    <TabContext value={"1"} >
                        <TabPanel value="1" style={{ height: '85%' }}>
                            <Stack width={"100%"} height={"100%"} spacing={6} alignItems={"flex-start"} alignContent={"flex-start"} justifyContent={"stretch"}>
                                <Stack
                                    sx={{ width: '100%', p: 1 }}
                                    direction={'row'}
                                    justifyContent={'space-between'}
                                    alignItems={'center'}
                                    style={{
                                        marginLeft: "0px",
                                        backgroundColor: '#F4F9F9',
                                        borderRadius: "5px"
                                    }}
                                >
                                    <Stack
                                        direction="row"
                                        flexWrap="wrap"
                                        spacing={3}
                                        alignItems="center"
                                        justifyContent="flex-start"
                                        sx={{ width: '100%' }}
                                    >
                                        {/* Code Journal */}
                                        <FormControl variant="standard" sx={{ width: 250 }}>
                                            <Autocomplete
                                                options={Array.from(
                                                    new Map(listeCodeJournaux.map(item => [item.id, item])).values()
                                                )}
                                                getOptionLabel={(option) => `${option.code || ''} - ${option.libelle || ''}`}
                                                renderOption={(props, option, { index }) => (
                                                    <li {...props} key={`${option.id}-${index}`}>
                                                        <span>
                                                            {option.code} - {option.libelle}
                                                        </span>
                                                    </li>
                                                )}
                                                isOptionEqualToValue={(option, value) => option.id === value.id}
                                                PaperComponent={(props) => (
                                                    <div {...props} style={{ width: 280, backgroundColor: 'white' }} />
                                                )}
                                                value={formSaisie.values.valSelectCodeJnl}
                                                onChange={(e, value) => {
                                                    formSaisie.setFieldValue('valSelectCodeJnl', value);
                                                }}
                                                renderInput={(params) => (
                                                    <TextField
                                                        {...params}
                                                        variant="standard"
                                                        name="valSelectCodeJnl"
                                                        label="Code journal"
                                                    />
                                                )}
                                            />
                                        </FormControl>

                                        {/* Mois */}
                                        <FormControl variant="standard" sx={{ width: 115 }}>
                                            <InputLabel>Mois</InputLabel>
                                            <Select
                                                value={formSaisie.values.valSelectMois}
                                                onChange={formSaisie.handleChange}
                                                name="valSelectMois"
                                            >
                                                {[...Array(12).keys()].map(m => (
                                                    <MenuItem key={m + 1} value={m + 1}>
                                                        {new Date(0, m).toLocaleString('fr-FR', { month: 'long' }).replace(/^./, c => c.toUpperCase())}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>

                                        {/* Année */}
                                        <FormControl variant="standard" sx={{ width: 90 }} style={{ marginRight: '50px' }} >
                                            <InputLabel>Année</InputLabel>
                                            <Select
                                                value={formSaisie.values.valSelectAnnee}
                                                onChange={formSaisie.handleChange}
                                                name="valSelectAnnee"
                                            >
                                                {listeAnnee.map((year) => (
                                                    <MenuItem key={year} value={year}>
                                                        {year}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>

                                        {/* Choix devise */}
                                        <RadioGroup
                                            row
                                            name="choixDevise"
                                            value={formSaisie.values.choixDevise}
                                            onChange={formSaisie.handleChange}
                                        >
                                            <FormControlLabel value="MGA" control={<Radio />} label="MGA" />
                                            <FormControlLabel value="Devises" control={<Radio />} label="Autres" />
                                        </RadioGroup>

                                        {/* Taux de conversion */}
                                        <Stack spacing={1.5} sx={{ width: 220 }}>
                                            <InputJoy
                                                placeholder="Taux"
                                                type="text"
                                                name="taux"
                                                step="0.01"
                                                value={taux}
                                                onChange={(e) => {
                                                    let value = e.target.value;
                                                    if (typeof value === 'object' && value !== null) {
                                                        value = value.floatValue ?? 0;
                                                    }
                                                    if (typeof value === 'number') {
                                                        setTaux(value);
                                                        formSaisie.setFieldValue('taux', value);
                                                        return;
                                                    }
                                                    const parsedValue = String(value)
                                                        .replace(/\s/g, '')
                                                        .replace(',', '.');

                                                    setTaux(parsedValue);
                                                    formSaisie.setFieldValue('taux', parsedValue);
                                                    selectRef.current?.blur();
                                                }}

                                                disabled={formSaisie.values.choixDevise === "MGA"}
                                                slotProps={{
                                                    input: {
                                                        component: FormatedInput,
                                                        sx: {
                                                            textAlign: 'right',
                                                        },
                                                    },
                                                }}
                                                endDecorator={
                                                    <>
                                                        <Divider orientation="vertical" />
                                                        <SelectJoy
                                                            ref={selectRef}
                                                            variant="plain"
                                                            value={formSaisie.values.currency}
                                                            onChange={(_, value) => formSaisie.setFieldValue('currency', value)}
                                                            name="currency"
                                                            slotProps={{
                                                                button: {
                                                                    sx: {
                                                                        boxShadow: 'none',
                                                                        outline: 'none',
                                                                        border: 'none',
                                                                        '&:focus': { outline: 'none' },
                                                                        '&:focus-visible': { outline: 'none' },
                                                                    },
                                                                },
                                                                listbox: {
                                                                    variant: 'plain',
                                                                    sx: {
                                                                        zIndex: 2000,
                                                                    },
                                                                },
                                                            }}
                                                            sx={{
                                                                mr: -1.5,
                                                                border: 'none',
                                                                outline: 'none',
                                                                boxShadow: 'none',
                                                                '--Select-focusedThickness': '0px',
                                                                '--Select-indicator-thickness': '0px',
                                                                '&:focus': { outline: 'none' },
                                                                '&:focus-visible': { outline: 'none' },
                                                            }}
                                                        >
                                                            {listeDevise
                                                                .filter(val => val.code !== 'MGA')
                                                                .map((value, index) => (
                                                                    <OptionJoy key={index} value={value.code}>
                                                                        {`${value.code}`}
                                                                    </OptionJoy>
                                                                ))}
                                                        </SelectJoy>
                                                    </>
                                                }
                                                sx={{
                                                    width: '100%',
                                                    '& input[type=number]': { MozAppearance: 'textfield' },
                                                    '& input[type=number]::-webkit-outer-spin-button': { WebkitAppearance: 'none', margin: 0 },
                                                    '& input[type=number]::-webkit-inner-spin-button': { WebkitAppearance: 'none', margin: 0 },
                                                }}
                                            />
                                        </Stack>
                                    </Stack>

                                    <Stack
                                        direction="row"
                                        alignItems={'center'}
                                        sx={{ flex: 0.06 }}
                                        spacing={0.5}
                                    >
                                        <Button
                                            autoFocus
                                            variant="contained"
                                            style={{
                                                height: "39px",
                                                textTransform: 'none',
                                                outline: 'none',
                                                backgroundColor: initial.theme,
                                                color: "white",
                                                marginTop: '0px',
                                            }}
                                            onClick={addOrUpdateJournal}
                                            disabled={
                                                !formSaisie.values.valSelectCodeJnl
                                                || !formSaisie.values.valSelectMois
                                                || !formSaisie.values.valSelectAnnee
                                                || tableRows.length === 0
                                                || isDisabledAddButton
                                            }
                                        >
                                            {type === 'ajout' ? 'Enregistrer' : 'Modifier'}
                                        </Button>
                                        <Tooltip title="Ajouter un nouveau compte">
                                            <IconButton
                                                onClick={handleOpenDialogAddNewAccount}
                                                variant="contained"
                                                style={{
                                                    width: "39px", height: '39px',
                                                    borderRadius: "5px", borderColor: "transparent",
                                                    backgroundColor: '#4CAF50',
                                                    textTransform: 'none', outline: 'none'
                                                }}
                                            >
                                                <MdAccountBalance style={{ width: '25px', height: '25px', color: 'white' }} />
                                            </IconButton>
                                        </Tooltip>
                                    </Stack>
                                </Stack>
                                <Stack
                                    width={"100%"}
                                    style={{
                                        marginLeft: "0px",
                                        marginTop: "20px",
                                    }}
                                >
                                    <Stack
                                        width="100%"
                                        maxHeight="900px"
                                        minHeight="600px"
                                        style={{
                                            marginLeft: "0px",
                                        }}
                                    >
                                        <DataGrid
                                            apiRef={apiRef}
                                            disableMultipleSelection={DataGridStyle.disableMultipleSelection}
                                            disableColumnSelector={DataGridStyle.disableColumnSelector}
                                            disableDensitySelector={DataGridStyle.disableDensitySelector}
                                            disableRowSelectionOnClick
                                            disableSelectionOnClick={true}
                                            localeText={frFR.components.MuiDataGrid.defaultProps.localeText}
                                            slots={{
                                                toolbar: QuickFilter,
                                            }}
                                            sx={{
                                                ...DataGridStyle.sx,
                                                '& .MuiDataGrid-columnHeaders': {
                                                    backgroundColor: initial.theme,
                                                    color: 'white',
                                                    fontWeight: 'bold',
                                                },
                                                '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': {
                                                    outline: 'none',
                                                    border: 'none',
                                                },
                                                '& .MuiInputBase-root': {
                                                    boxShadow: 'none',
                                                    border: 'none',
                                                },
                                                '& .MuiOutlinedInput-notchedOutline': {
                                                    border: 'none',
                                                },
                                                '& .cell-error': {
                                                    backgroundColor: 'rgba(238, 109, 109, 0.3) ',
                                                },
                                                '& .cell-selected': {
                                                    backgroundColor: '#e0f7fa',
                                                },
                                            }}
                                            processRowUpdate={(newRow, oldRow) => {
                                                const updatedRows = tableRows.map((row) =>
                                                    row.id === oldRow.id ? { ...row, ...newRow } : row
                                                );
                                                setTableRows(updatedRows);
                                                return newRow;
                                            }}
                                            rowHeight={DataGridStyle.rowHeight}
                                            columnHeaderHeight={DataGridStyle.columnHeaderHeight}
                                            editMode='row'
                                            columns={columns}
                                            rows={tableRows}
                                            initialState={{
                                                pagination: {
                                                    paginationModel: { page: 0, pageSize: 100 },
                                                },
                                            }}
                                            experimentalFeatures={{ newEditingApi: true }}
                                            pageSizeOptions={[5, 10, 20, 30, 50, 100]}
                                            pagination={DataGridStyle.pagination}
                                            columnVisibilityModel={{
                                                id: false,
                                            }}
                                            onRowEditStart={handleRowEditStart}
                                            onCellClick={handleCellClick}
                                            onCellKeyDown={handleCellKeyDown}
                                            getRowId={(row) => row.id}
                                            rowModesModel={rowModesModel}
                                            onRowModesModelChange={handleRowModesModelChange}
                                        />
                                    </Stack>
                                    <Typography fontWeight="bold">
                                        {
                                            "Débit - Crédit : " + totalFormatted + " " +
                                            (formSaisie.values.choixDevise === "MGA" ? formSaisie.values.choixDevise : formSaisie.values.currency === null ? '' : formSaisie.values.currency)
                                        }
                                    </Typography>
                                    <Stack
                                        style={{
                                            marginBottom: '25px'
                                        }}
                                    >
                                        <DropPDFUploader
                                            mode={type}
                                            file={file}
                                            setFile={setFile}
                                        />
                                    </Stack>
                                </Stack>
                            </Stack>
                        </TabPanel>
                    </TabContext>
                </DialogContent>

                <DialogTitle
                    sx={{
                        m: 0,
                        py: 1.5,
                        px: 2,
                        bgcolor: "#F9FAFB",
                        borderTop: "1px solid #ddd",
                    }}
                >
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            width: '100%',
                            px: 2,
                        }}
                    >
                        <Box sx={{ flex: 0.4, display: 'flex', justifyContent: 'flex-start' }}>
                            <Typography fontWeight="bold" variant="h6" color="text.primary">
                                Total
                            </Typography>
                        </Box>
                        <Box sx={{ flex: 0.8 }} />
                        <Box sx={{ flex: 1.3 }} />
                        <Box sx={{ flex: 2.7 }} />

                        {
                            (formSaisie.values.choixDevise === 'Devises' && (
                                <Box sx={{ flex: 1.3 }} />
                            ))
                        }

                        <Box sx={{ flex: 1.4, textAlign: 'right', pr: 1 }}>
                            <Typography fontWeight="bold" variant="subtitle1" color={'red'} >
                                {totalDebitFormatted}
                            </Typography>
                        </Box>

                        <Box sx={{ flex: 1.3, textAlign: 'right', pr: paddingRightTotal }}>
                            <Typography fontWeight="bold" variant="subtitle1" color={'red'} >
                                {totalCreditFormatted}
                            </Typography>
                        </Box>
                    </Box>
                </DialogTitle>
            </BootstrapDialog>
        </>
    )
}

export default PopupSaisie;
