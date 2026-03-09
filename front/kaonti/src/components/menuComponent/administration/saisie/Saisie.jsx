import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Typography, Stack, Box, Tab, Button } from '@mui/material';

import { TabContext, TabList, TabPanel } from '@mui/lab';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';

import { init } from '../../../../../init';
import axios from '../../../../../config/axios';
import PopupTestSelectedFile from '../../../componentsTools/popupTestSelectedFile';
import { InfoFileStyle } from '../../../componentsTools/InfosFileStyle';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { DataGridStyle } from '../../../componentsTools/DatagridToolsStyle'
import { DataGrid, frFR } from '@mui/x-data-grid';
import QuickFilter from '../../../componentsTools/DatagridToolsStyle';

import PopupSaisie from '../../../componentsTools/Saisie/popupSaisie';
import PopupConfirmDelete from '../../../componentsTools/popupConfirmDelete';

import { Autocomplete, TextField } from '@mui/material';

import { IoMdAdd } from "react-icons/io";
import { AiFillEdit } from "react-icons/ai";
import { MdDelete } from "react-icons/md";

import useAuth from '../../../../hooks/useAuth';
import { jwtDecode } from 'jwt-decode';
import { useFormik } from 'formik';
import { MdFilePresent } from "react-icons/md";
import { GridPagination } from '@mui/x-data-grid';
import { MdFilterAlt } from "react-icons/md";
import { MdFilterAltOff } from "react-icons/md";
import { URL } from '../../../../../config/axios';

import usePermission from '../../../../hooks/usePermission';
import useAxiosPrivate from '../../../../../config/axiosPrivate';

export default function SaisieComponent() {
    const { canAdd, canModify, canDelete, canView } = usePermission();

    const [typeActionSaisie, setTypeActionSaisie] = useState('');
    const axiosPrivate = useAxiosPrivate();
    const canAddOrModify = typeActionSaisie === 'ajout' ? canAdd : canModify;

    let initial = init[0];
    const [fileInfos, setFileInfos] = useState('');
    const [fileId, setFileId] = useState(0);
    const { id } = useParams();
    const [noFile, setNoFile] = useState(false);

    const [listSaisie, setListSaisie] = useState([]);
    const [listCompteAssocie, setListeCompteAssocie] = useState([]);
    const [listCa, setListCa] = useState([]);
    const [filteredList, setFilteredList] = useState(null);
    const [typeComptabilite, setTypeComptabilite] = useState(null);

    const [selectedRows, setSelectedRows] = useState([]);
    const [rowSelectionModel, setRowSelectionModel] = useState([]);

    const gridRef = useRef(null)
    const [scrollbarVisible, setScrollbarVisible] = useState(false);

    const [refresh, setRefresh] = useState(false);
    const [refreshListAxeSection, setRefreshListAxeSection] = useState(false);

    const [openDialogDeleteSaisie, setOpenDialogDeleteSaisie] = useState(false);
    const [isTypeComptaAutre, setIsTypeComptaAutre] = useState(false);

    //récupération infos de connexion
    const navigate = useNavigate();

    const [selectedExerciceId, setSelectedExerciceId] = useState(0);
    const [selectedPeriodeId, setSelectedPeriodeId] = useState(0);
    const [selectedPeriodeChoiceId, setSelectedPeriodeChoiceId] = useState(0);
    const [listeExercice, setListeExercice] = useState([]);
    const [listeSituation, setListeSituation] = useState([]);

    const [openSaisiePopup, setOpenSaisiePopup] = useState(false);

    const [listeCodeJournaux, setListeCodeJournaux] = useState([]);
    const [listePlanComptable, setListePlanComptable] = useState([]);
    const [listeDevise, setListeDevise] = useState([]);
    const [listeAnnee, setListeAnnee] = useState([]);

    const [isRefreshedPlanComptable, setIsRefreshedPlanComptable] = useState(false);
    const [isCaActive, setIsCaActive] = useState(false);

    //récupération des informations de connexion
    const { auth } = useAuth();
    const decoded = auth?.accessToken ? jwtDecode(auth.accessToken) : undefined;
    const compteId = decoded.UserInfo.compteId || null;

    const GetInfosIdDossier = (id) => {
        axios.get(`/home/FileInfos/${id}`).then((response) => {
            const resData = response.data;

            if (resData.state) {
                setFileInfos(resData.fileInfos[0]);
                setIsCaActive(resData?.fileInfos[0]?.avecanalytique);
                setTypeComptabilite(resData?.fileInfos[0]?.typecomptabilite);
                setIsTypeComptaAutre(resData?.fileInfos[0].typecompta === 'Autres');
                setNoFile(false);
            } else {
                setFileInfos([]);
                setNoFile(true);
            }
        })
    }

    const sendToHome = (value) => {
        setNoFile(!value);
        navigate('/tab/home');
    }

    //Choix exercice
    const handleChangeExercice = (exercice_id) => {
        setSelectedExerciceId(exercice_id);
        setSelectedPeriodeChoiceId("0");
        setListeSituation(listeExercice?.filter((item) => item.id === exercice_id));
        setSelectedPeriodeId(exercice_id);
    }

    //Récupérer la liste des exercices
    const GetListeExercice = (id) => {
        axios.get(`/paramExercice/listeExercice/${id}/${compteId}`).then((response) => {
            const resData = response.data;
            if (resData.state) {
                setListeExercice(resData.list);

                const exerciceNId = resData.list?.filter((item) => item.libelle_rang === "N");
                setListeSituation(exerciceNId);

                setSelectedExerciceId(exerciceNId[0].id);
                setSelectedPeriodeChoiceId(0);
                setSelectedPeriodeId(exerciceNId[0].id);

            } else {
                setListeExercice([]);
                //toast.error("une erreur est survenue lors de la récupération de la liste des exercices");
                return
            }
        })
    }

    //Récupérer la liste des exercices
    const GetListeSituation = (id) => {
        axios.get(`/paramExercice/listeSituation/${id}`).then((response) => {
            const resData = response.data;
            if (resData.state) {
                const list = resData.list;
                setListeSituation(resData.list);
                if (list.length > 0) {
                    setSelectedPeriodeId(list[0].id);
                }
            } else {
                setListeSituation([]);
                //toast.error("une erreur est survenue lors de la récupération de la liste des exercices");
                return
            }
        })
    }

    //Récupération données liste code journaux
    const GetListeCodeJournaux = () => {
        axios.get(`/paramCodeJournaux/listeCodeJournaux/${fileId}`).then((response) => {
            const resData = response.data;
            if (resData.state) {
                setListeCodeJournaux(resData.list);
            } else {
                setListeCodeJournaux([]);
                toast.error(resData.msg);
            }
        })
    }

    //Récupération du plan comptable
    const getPc = () => {
        axios.get(`/paramPlanComptable/PcIdLibelle/${compteId}/${fileId}`, {
            params: { typeComptabilite }
        })
            .then((response) => {
                const resData = response.data;
                if (resData.state) {
                    setListePlanComptable(resData.liste);
                } else {
                    toast.error(resData.msg);
                }
            })
    }

    // Récupération des listes des comptes associés dans le code journal
    const getCodeJournalsCompteAssocie = () => {
        axios.post('/administration/traitementSaisie/getCodeJournalsCompteAssocie', { id_dossier: Number(fileId), id_compte: Number(compteId) })
            .then((response) => {
                setListeCompteAssocie(response?.data || []);
            })
    }

    //Choix période
    const handleChangePeriode = (choix) => {
        setSelectedPeriodeChoiceId(choix);
        if (choix === 0) {
            setListeSituation(listeExercice?.filter((item) => item.id === selectedExerciceId));
            setSelectedPeriodeId(selectedExerciceId);
        } else if (choix === 1) {
            GetListeSituation(selectedExerciceId);
        }
    }

    //Liste saisie
    const getListeSaisie = () => {
        axios.get(`/administration/traitementSaisie/getJournal/${compteId}/${id}/${selectedExerciceId}`).then((response) => {
            const resData = response.data;
            canView ? setListSaisie(resData) : setListSaisie([])
        })
    }

    //Liste des sections avec ses axes
    const getListAxeSection = () => {
        axios.get(`/paramCa/getListAxeSection/${Number(compteId)}/${Number(fileId)}`).then((response) => {
            const resData = response.data;
            setListCa(resData);
        })
    }

    // Vérifier si la sélection contient un type RAN
    const isRanTypeSelected = useMemo(() => {
        if (selectedRows.length === 0 || listeCodeJournaux.length === 0) return false;
        const selectedJournalId = Number(selectedRows[0].id_journal);
        const codeJournal = listeCodeJournaux.find(cj => Number(cj.id) === selectedJournalId);
        return codeJournal?.type === 'RAN';
    }, [selectedRows, listeCodeJournaux]);

    //Header
    const SaisieColumnHeader = [
        {
            field: 'dossier',
            headerName: 'Dossier',
            type: 'string',
            sortable: true,
            flex: 0.6,
            headerAlign: 'left',
            align: 'left',
            headerClassName: 'HeaderbackColor',
        },
        {
            field: 'lettrage',
            headerName: 'Let',
            type: 'string',
            sortable: true,
            flex: 0.6,
            headerAlign: 'left',
            align: 'left',
            headerClassName: 'HeaderbackColor',
        },
        {
            field: 'dateecriture',
            headerName: 'Date',
            type: 'string',
            sortable: true,
            flex: 0.6,
            headerAlign: 'left',
            align: 'left',
            headerClassName: 'HeaderbackColor',
            renderCell: (params) => {
                const rawDate = params.value;
                const dateObj = new Date(rawDate);

                if (isNaN(dateObj.getTime())) return "";

                const day = String(dateObj.getDate()).padStart(2, '0');
                const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                const year = dateObj.getFullYear();

                return `${day}/${month}/${year}`;
            },
        },
        {
            field: 'journal',
            headerName: 'Journal',
            type: 'string',
            sortable: true,
            flex: 0.5,
            headerAlign: 'left',
            align: 'left',
            headerClassName: 'HeaderbackColor',
        },
        {
            field: 'compteaux',
            headerName: 'Compte',
            type: 'string',
            sortable: true,
            flex: 0.7,
            headerAlign: 'left',
            align: 'left',
            headerClassName: 'HeaderbackColor',
        },
        {
            field: 'piece',
            headerName: 'Pièce',
            type: 'string',
            sortable: true,
            flex: 0.7,
            headerAlign: 'left',
            align: 'left',
            headerClassName: 'HeaderbackColor',
        },
        {
            field: 'Fichier',
            headerName: 'Voir',
            type: 'string',
            sortable: false,
            flex: 0.4,
            headerAlign: 'center',
            align: 'center',
            headerClassName: 'HeaderbackColor',
            renderCell: (params) => {
                const file = params.row.fichier;
                return (
                    <>
                        <Button
                            onClick={() => file && viewFile(file)}
                            disabled={!file}
                            sx={{
                                boxShadow: 'none',
                                '&:focus': {
                                    outline: 'none',
                                    boxShadow: 'none',
                                }
                            }}
                        >
                            <MdFilePresent style={{ width: '30px', height: '30px' }} />
                        </Button>
                    </>
                )
            }
        },
        {
            field: 'libelle',
            headerName: 'Libellé',
            type: 'string',
            sortable: true,
            flex: 3,
            headerAlign: 'left',
            align: 'left',
            headerClassName: 'HeaderbackColor',
        },
        {
            field: 'num_facture',
            headerName: 'N° Facture',
            type: 'string',
            sortable: true,
            flex: 1,
            headerAlign: 'left',
            align: 'left',
            headerClassName: 'HeaderbackColor',
        }, {
            field: 'debit',
            headerName: 'Débit',
            type: 'string',
            sortable: true,
            flex: 1,
            headerAlign: 'right',
            align: 'right',
            headerClassName: 'HeaderbackColor',
            renderCell: (params) => {
                const formatted = Number(params.value).toLocaleString('fr-FR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                });
                return formatted.replace(/\u202f/g, ' ');
            },
        }, {
            field: 'credit',
            headerName: 'Crédit',
            type: 'string',
            sortable: true,
            flex: 1,
            headerAlign: 'right',
            align: 'right',
            headerClassName: 'HeaderbackColor',
            renderCell: (params) => {
                const formatted = Number(params.value).toLocaleString('fr-FR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                });
                return formatted.replace(/\u202f/g, ' ');
            },
        },
    ]

    //afficher ou non le popup du saisie
    const handleOpenSaisiePopup = (type) => {
        const defaultDeviseData = listeDevise.find(val => val.par_defaut === true);
        if (!defaultDeviseData) {
            return toast.error('Veuillez sélectionner une devise par défaut dans le paramétrage CRM de ce dossier')
        }

        if (type === 'modification' && selectedRows.length > 0) {
            const selectedJournalId = selectedRows[0].id_journal;
            const codeJournal = listeCodeJournaux.find(cj => cj.id === Number(selectedJournalId));

            if (codeJournal && codeJournal.type === 'RAN') {
                return toast.error('Impossible de modifier une écriture de type RAN');
            }
            if (codeJournal && codeJournal.type === 'OD' && codeJournal.code === 'Imau') {
                return toast.error("Impossible de modifier une écriture d'immobilisation");
            }
        }

        setOpenSaisiePopup(true);
        setTypeActionSaisie(type);
    }

    const handleCloseSaisieAddPopup = (value) => {
        setOpenSaisiePopup(value);
    }

    //Formik recherche saisie
    const formSaisieRecherche = useFormik({
        initialValues: {
            journal: null,
            compte: null,
            piece: "",
            libelle: '',
            debut: '',
            fin: ''
        },
        validateOnChange: false,
        validateOnBlur: true,
    })

    // Filtrer les saisies
    const handleSearch = () => {
        const { journal, compte, piece, libelle, debut, fin } = formSaisieRecherche.values;

        const hasFilters =
            (journal && journal.id !== "") ||
            (compte && compte.compte) ||
            (piece && piece !== "") ||
            (libelle && libelle !== "") ||
            (debut && debut !== "") &&
            (fin && fin !== "");

        if (!hasFilters) {
            setFilteredList(null);
            return toast.error('Veuillez sélectionner les filtres');
        }

        axiosPrivate.post('/administration/traitementSaisie/getJournalFiltered', {
            ...formSaisieRecherche.values,
            id_dossier: Number(fileId),
            id_compte: Number(compteId),
            id_exercice: Number(selectedExerciceId)
        }).then((response) => {
            if (response?.data?.state) {
                toast.success('Filtre appliqué');
                setFilteredList(response?.data?.list);
            } else {
                setFilteredList([]);
            }
        })
    };

    //Réinitialiser le filtre
    const handleReinitialize = () => {
        formSaisieRecherche.resetForm();
        toast.success('Filtre réinitialisé');
        setFilteredList(null);
    }

    const viewFile = (file) => {
        if (!file) return;

        const baseUrl = `${URL}/`;
        const fileUrl = baseUrl + file;

        window.open(fileUrl, "_blank");
    };

    // Calcul débit et crédit
    const tableRows = filteredList ?? listSaisie;
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

    const totalDebitFormatted = totalDebit.toLocaleString('fr-FR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).replace(/\u202f/g, ' ')

    const totalCreditFormatted = totalCredit.toLocaleString('fr-FR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).replace(/\u202f/g, ' ')

    //Supprimer des saisies
    const handleDeleteSelectedSaisies = (value) => {
        if (!value) {
            setOpenDialogDeleteSaisie(false);
            return;
        }

        const currentRows = filteredList ?? listSaisie;

        const rowIds = selectedRows
            .map(row => row.id)
            .filter(id => currentRows.some(r => r.id === id));

        if (!rowIds.length) {
            toast.error("Aucune saisie sélectionnée à supprimer");
            setOpenDialogDeleteSaisie(false);
            return;
        }

        if (selectedRows.length > 0) {
            const selectedJournalId = selectedRows[0].id_journal;
            const codeJournal = listeCodeJournaux.find(cj => cj.id === selectedJournalId);

            if (codeJournal && codeJournal.type === 'RAN') {
                toast.error('Impossible de supprimer une écriture de type RAN');
                setOpenDialogDeleteSaisie(false);
                return;
            }
        }

        axiosPrivate.delete('/administration/traitementSaisie/deleteJournal', {
            data: { ids: rowIds }
        }).then((response) => {
            const resData = response.data;
            if (resData.state) {
                toast.success(resData.msg);

                const newListSaisie = listSaisie.filter(item => !rowIds.includes(item.id));
                const newFilteredList = filteredList
                    ? filteredList.filter(item => !rowIds.includes(item.id))
                    : null;

                setListSaisie(newListSaisie);
                setFilteredList(newFilteredList);

                setSelectedRows([]);
                setRowSelectionModel([]);
            } else {
                toast.error(resData.msg);
            }
        }).catch((error) => {
            const errorMsg = error.response?.data?.msg || error.response?.data?.message || "Erreur lors de la suppression";
            toast.error(errorMsg);
        });

        setOpenDialogDeleteSaisie(false);
    };

    //Afficher le modal de suppression de saisies
    const handleOpenDialogConfirmDeleteSaisie = () => {
        if (selectedRows.length > 0) {
            const selectedJournalId = selectedRows[0].id_journal;
            const codeJournal = listeCodeJournaux.find(cj => cj.id === Number(selectedJournalId));

            if (codeJournal && codeJournal.type === 'RAN') {
                return toast.error('Impossible de supprimer une écriture de type RAN');
            }
            if (codeJournal && codeJournal.type === 'OD' && codeJournal.code === 'Imau') {
                return toast.error("Impossible de supprimer une écriture d'immobilisation");
            }
        }
        setOpenDialogDeleteSaisie(true);
    }

    //Récupération données liste des devises
    const getListeDevises = () => {
        axios.get(`/devises/devise/compte/${compteId}/${fileId}`).then((response) => {
            setListeDevise(response.data);
        })
    }

    //Recupérer l'année min et max de l'éxercice
    const getAnneesEntreDeuxDates = (dateDebut, dateFin) => {
        const debut = new Date(dateDebut).getFullYear();
        const fin = new Date(dateFin).getFullYear();
        const annees = [];

        for (let annee = debut; annee <= fin; annee++) {
            annees.push(annee);
        }

        return annees;
    };

    //Récupération la liste des exercices BY ID EXERCICE
    const getDateDebutFinExercice = () => {
        axios.get(`/paramExercice/listeExerciceById/${Number(selectedExerciceId)}`).then((response) => {
            const resData = response.data;
            if (resData.state) {
                const annee = getAnneesEntreDeuxDates(resData.list.date_debut, resData.list.date_fin)
                setListeAnnee(annee)
            } else {
                setListeAnnee([])
                //toast.error("une erreur est survenue lors de la récupération de la liste des exercices");
                return
            }
        })
    }

    useEffect(() => {
        let idFile = fileId || 0;
        const navigationEntries = performance.getEntriesByType('navigation');
        if (navigationEntries.length > 0) {
            const navigationType = navigationEntries[0].type;
            if (navigationType === 'reload') {
                idFile = sessionStorage.getItem("fileId");
                setFileId(idFile);
            } else if (!fileId) {
                sessionStorage.setItem('fileId', id);
                idFile = id;
                setFileId(idFile);
            }
        }

        if (idFile) {
            GetInfosIdDossier(idFile);
        }

        if (selectedExerciceId && idFile && compteId) {
            getDateDebutFinExercice();
            getListeSaisie();
        }

        if (idFile && compteId) {
            getListAxeSection();
        }

        if (idFile && compteId && typeComptabilite !== null) {
            GetListeCodeJournaux();
            getPc();
            getCodeJournalsCompteAssocie();
            getListeDevises();
        }

    }, [
        id,
        fileId,
        compteId,
        selectedExerciceId,
        typeComptabilite,
        refresh,
        refreshListAxeSection,
        isRefreshedPlanComptable
    ]);

    useEffect(() => {
        if (fileId && compteId) {
            GetListeExercice(fileId);
        }
    }, [fileId, compteId])

    useEffect(() => {
        const el = gridRef.current?.querySelector('.MuiDataGrid-virtualScroller');
        if (!el) return;

        const checkOverflow = () => {
            const isOverflowing = el.scrollHeight > el.clientHeight;
            setScrollbarVisible(isOverflowing);
        };

        checkOverflow();

        const resizeObserver = new ResizeObserver(checkOverflow);
        const mutationObserver = new MutationObserver(checkOverflow);

        resizeObserver.observe(el);
        mutationObserver.observe(el, { childList: true, subtree: true });

        return () => {
            resizeObserver.disconnect();
            mutationObserver.disconnect();
        };
    }, [filteredList?.length, listSaisie?.length]);

    return (
        <>
            {
                noFile ?
                    <PopupTestSelectedFile
                        confirmationState={sendToHome}
                    />
                    :
                    null
            }

            {
                (openSaisiePopup && canAddOrModify) ?
                    <PopupSaisie
                        confirmationState={handleCloseSaisieAddPopup}
                        fileId={fileId}
                        selectedExerciceId={selectedExerciceId}
                        rowsEdit={selectedRows}
                        setRefresh={() => setRefresh(!refresh)}
                        setRefreshListAxeSection={() => setRefreshListAxeSection(!refreshListAxeSection)}
                        setRowSelectionModel={() => setRowSelectionModel([])}
                        type={typeActionSaisie}
                        listeCodeJournaux={listeCodeJournaux}
                        listePlanComptable={listePlanComptable.filter(val => Number(val.id_dossier) === Number(fileId))}
                        listeAnnee={listeAnnee}
                        listeDevise={listeDevise}
                        setSelectedRowsSaisie={() => setSelectedRows([])}
                        setIsRefreshedPlanComptable={setIsRefreshedPlanComptable}
                        isCaActive={isCaActive}
                        listCa={listCa}
                        setListCa={setListCa}
                        canView={canView}
                        canAdd={canAdd}
                        canDelete={canDelete}
                        canModify={canModify}
                        isTypeComptaAutre={isTypeComptaAutre}
                        listCompteAssocie={listCompteAssocie}
                    /> : null
            }
            {
                (openDialogDeleteSaisie && canDelete) ?
                    <PopupConfirmDelete
                        msg={"Voulez-vous vraiment supprimer ces lignes sélectionnés ?"}
                        confirmationState={handleDeleteSelectedSaisies}
                        presonalisedMessage={true}
                    />
                    :
                    null
            }
            <Box>
                <TabContext value={"1"} >
                    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                        <TabList aria-label="lab API tabs example">
                            <Tab
                                style={{
                                    textTransform: 'none',
                                    outline: 'none',
                                    border: 'none',
                                    margin: -5
                                }}
                                label={InfoFileStyle(fileInfos?.dossier)} value="1"
                            />
                        </TabList>
                    </Box>
                    <TabPanel value="1" style={{ height: '100%' }}>
                        <Stack width={"100%"} height={"100%"} spacing={6} alignItems={"flex-start"} alignContent={"flex-start"} justifyContent={"stretch"}>
                            <Typography variant='h6' sx={{ color: "black" }} align='left'>Administration - Saisie</Typography>

                            <Stack width={"100%"} spacing={4} alignItems={"center"} justifyContent="space-between" direction={"row"} style={{ marginLeft: "0px", marginTop: "20px" }}>
                                <Stack
                                    direction={"row"}
                                >
                                    <FormControl variant="standard" sx={{ m: 1, minWidth: 250 }}>
                                        <InputLabel id="demo-simple-select-standard-label">Exercice:</InputLabel>
                                        <Select
                                            labelId="demo-simple-select-standard-label"
                                            id="demo-simple-select-standard"
                                            value={selectedExerciceId}
                                            label={"valSelect"}
                                            onChange={(e) => handleChangeExercice(e.target.value)}
                                            sx={{ width: "300px", display: "flex", justifyContent: "left", alignItems: "flex-start", alignContent: "flex-start", textAlign: "left" }}
                                            MenuProps={{
                                                disableScrollLock: true
                                            }}
                                        >
                                            {listeExercice.map((option) => (
                                                <MenuItem
                                                    key={option.id}
                                                    value={option.id}
                                                >{option.libelle_rang}: {format(option.date_debut, "dd/MM/yyyy")} - {format(option.date_fin, "dd/MM/yyyy")}</MenuItem>
                                            ))
                                            }
                                        </Select>
                                    </FormControl>

                                    <FormControl variant="standard" sx={{ m: 1, minWidth: 150 }}>
                                        <InputLabel id="demo-simple-select-standard-label">Période</InputLabel>
                                        <Select
                                            disabled
                                            labelId="demo-simple-select-standard-label"
                                            id="demo-simple-select-standard"
                                            value={selectedPeriodeChoiceId}
                                            label={"valSelect"}
                                            onChange={(e) => handleChangePeriode(e.target.value)}
                                            sx={{ width: "150px", display: "flex", justifyContent: "left", alignItems: "flex-start", alignContent: "flex-start", textAlign: "left" }}
                                            MenuProps={{
                                                disableScrollLock: true
                                            }}
                                        >
                                            <MenuItem value={0}>Toutes</MenuItem>
                                            <MenuItem value={1}>Situations</MenuItem>
                                        </Select>
                                    </FormControl>

                                    <FormControl variant="standard" sx={{ m: 1, minWidth: 250 }}>
                                        <InputLabel id="demo-simple-select-standard-label">Du</InputLabel>
                                        <Select
                                            labelId="demo-simple-select-standard-label"
                                            id="demo-simple-select-standard"
                                            value={selectedPeriodeId}
                                            label={"valSelect"}
                                            onChange={(e) => handleChangeDateIntervalle(e.target.value)}
                                            sx={{ width: "300px", display: "flex", justifyContent: "left", alignItems: "flex-start", alignContent: "flex-start", textAlign: "left" }}
                                            MenuProps={{
                                                disableScrollLock: true
                                            }}
                                        >
                                            {listeSituation?.map((option) => (
                                                <MenuItem key={option.id} value={option.id}>{option.libelle_rang}: {format(option.date_debut, "dd/MM/yyyy")} - {format(option.date_fin, "dd/MM/yyyy")}</MenuItem>
                                            ))
                                            }
                                        </Select>
                                    </FormControl>
                                </Stack>

                                <Stack
                                    direction="row"
                                    justifyContent="flex-end"
                                    width="100%"
                                    spacing={0.5}
                                    style={{
                                        marginLeft: "0px",
                                        marginTop: "5px",
                                        borderRadius: "5px"
                                    }}>
                                    <Button
                                        onClick={() => handleOpenSaisiePopup('ajout')}
                                        disabled={!canAdd || !listeExercice || listeExercice.length === 0}
                                        variant="contained"
                                        style={{
                                            textTransform: 'none',
                                            outline: 'none',
                                            backgroundColor: initial.theme,
                                            color: "white",
                                            height: "39px",
                                            marginTop: '10px'
                                        }}
                                        startIcon={<IoMdAdd size={20} />}
                                    >
                                        Nouvelle saisie
                                    </Button>
                                    <Button
                                        onClick={() => handleOpenSaisiePopup('modification')}
                                        disabled={
                                            !canModify ||
                                            selectedRows.length === 0 ||
                                            (selectedRows.filter(val => val.id_dossier === fileId)).length === 0 ||
                                            isRanTypeSelected
                                        }
                                        variant="contained"
                                        style={{
                                            textTransform: 'none',
                                            outline: 'none',
                                            backgroundColor: '#4CC0E4',
                                            color: "white",
                                            height: "39px",
                                            marginTop: '10px'
                                        }}
                                        startIcon={<AiFillEdit size={20} />}
                                    >
                                        Modifier
                                    </Button>
                                    <Button
                                        onClick={handleOpenDialogConfirmDeleteSaisie}
                                        disabled={
                                            !canDelete ||
                                            selectedRows.length === 0 ||
                                            (selectedRows.filter(val => val.id_dossier === fileId)).length === 0 ||
                                            isRanTypeSelected
                                        }
                                        variant="contained"
                                        style={{
                                            textTransform: 'none',
                                            outline: 'none',
                                            backgroundColor: initial.button_delete_color,
                                            color: "white",
                                            height: "39px",
                                            marginTop: '10px'
                                        }}
                                        startIcon={<MdDelete size={20} />}
                                    >
                                        Supprimer
                                    </Button>
                                </Stack>
                            </Stack>

                            <Stack
                                width={"100%"}
                                paddingLeft={"5px"}
                                alignItems={"center"}
                                alignContent={"center"}
                                direction={"row"}
                                justifyContent={"space-between"}
                                style={{
                                    marginLeft: "0px",
                                    marginTop: "20px",
                                    backgroundColor: '#F4F9F9',
                                    borderRadius: "5px"
                                }}
                            >
                                <Stack
                                    direction={"row"}
                                    sx={{ flexGrow: 1, flexWrap: 'wrap' }}
                                >
                                    <FormControl variant="standard" sx={{ width: '13%', marginRight: 5 }}>
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
                                            value={formSaisieRecherche.values.journal}
                                            onChange={(e, value) => {
                                                formSaisieRecherche.setFieldValue('journal', value);
                                            }}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    variant="standard"
                                                    name="journal"
                                                    label="Code journal"
                                                />
                                            )}
                                        />
                                    </FormControl>

                                    <FormControl variant="standard" sx={{ width: '13%', marginRight: 5 }}>
                                        <Autocomplete
                                            options={listePlanComptable}
                                            getOptionLabel={(option) => `${option.compte || ''} - ${option.libelle || ''}`}
                                            isOptionEqualToValue={(option, value) => option.id === value.id}
                                            PaperComponent={(props) => (
                                                <div {...props} style={{ width: 600, backgroundColor: 'white' }} />
                                            )}
                                            value={formSaisieRecherche.values.compte}
                                            onChange={(e, value) => {
                                                formSaisieRecherche.setFieldValue('compte', value);
                                            }}
                                            renderOption={(props, option, { index }) => (
                                                <li {...props} key={`${option.id}-${index}`}>
                                                    <span>
                                                        {option.compte} - {option.libelle}{' '}
                                                        <span style={{ color: '#1976d2', fontWeight: 600, fontSize: 14 }}>
                                                            ({option.dossier})
                                                        </span>
                                                    </span>
                                                </li>
                                            )}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    variant="standard"
                                                    name="compte"
                                                    label="Compte"
                                                />
                                            )}
                                        />
                                    </FormControl>

                                    <FormControl variant="standard" sx={{ width: "13%", marginRight: 5 }}>
                                        <TextField
                                            id="piece"
                                            label="Pièce"
                                            variant="standard"
                                            value={formSaisieRecherche.values.piece}
                                            onChange={formSaisieRecherche.handleChange}
                                            name="piece"
                                        />
                                    </FormControl>

                                    <FormControl variant="standard" sx={{ width: "18%", marginRight: 5 }}>
                                        <TextField
                                            id="libelle"
                                            label="Libellé"
                                            variant="standard"
                                            value={formSaisieRecherche.values.libelle}
                                            onChange={formSaisieRecherche.handleChange}
                                            name="libelle"
                                        />
                                    </FormControl>

                                    <FormControl variant="standard" sx={{ width: "10%", marginRight: 5 }}>
                                        <TextField
                                            id="debut"
                                            label="Début"
                                            variant="standard"
                                            type="date"
                                            value={formSaisieRecherche.values.debut}
                                            onChange={formSaisieRecherche.handleChange}
                                            InputLabelProps={{ shrink: true }}
                                            sx={{
                                                '& input::-webkit-calendar-picker-indicator': {
                                                    filter: 'brightness(0) saturate(100%) invert(21%) sepia(31%) saturate(684%) hue-rotate(165deg) brightness(93%) contrast(90%)',
                                                    cursor: 'pointer',
                                                },
                                            }}
                                        />
                                    </FormControl>

                                    <FormControl variant="standard" sx={{ width: "10%", marginRight: 3 }}>
                                        <TextField
                                            id="fin"
                                            label="Fin"
                                            variant="standard"
                                            type='date'
                                            value={formSaisieRecherche.values.fin}
                                            onChange={formSaisieRecherche.handleChange}
                                            InputLabelProps={{
                                                shrink: true,
                                            }}
                                            inputProps={{
                                                min: formSaisieRecherche.values.debut,
                                            }}
                                            sx={{
                                                '& input::-webkit-calendar-picker-indicator': {
                                                    filter: 'brightness(0) saturate(100%) invert(21%) sepia(31%) saturate(684%) hue-rotate(165deg) brightness(93%) contrast(90%)',
                                                    cursor: 'pointer',
                                                },
                                            }}
                                        />
                                    </FormControl>
                                </Stack>

                                <Stack direction="row" spacing={0.5}>
                                    <Button
                                        disabled={!canView}
                                        onClick={handleSearch}
                                        style={{
                                            textTransform: 'none',
                                            outline: 'none',
                                        }}
                                        variant="outlined"
                                        startIcon={<MdFilterAlt size={20} />}
                                    >
                                        Appliquer le filtre
                                    </Button>
                                    <Button
                                        disabled={!canView}
                                        onClick={handleReinitialize}
                                        style={{
                                            textTransform: 'none',
                                            outline: 'none',
                                        }}
                                        variant="outlined"
                                        startIcon={<MdFilterAltOff size={20} />}
                                    >
                                        Réinitialiser le filtre
                                    </Button>
                                </Stack>
                            </Stack>

                            <Stack
                                width="100%"
                                height="700px"
                                style={{
                                    marginLeft: "0px",
                                    marginTop: "20px",
                                    overflow: "auto",
                                }}
                            >
                                <DataGrid
                                    ref={gridRef}
                                    disableMultipleSelection={DataGridStyle.disableMultipleSelection}
                                    disableColumnSelector={DataGridStyle.disableColumnSelector}
                                    disableDensitySelector={DataGridStyle.disableDensitySelector}
                                    disableRowSelectionOnClick
                                    disableSelectionOnClick={true}
                                    localeText={frFR.components.MuiDataGrid.defaultProps.localeText}
                                    slots={{
                                        toolbar: QuickFilter,
                                        footer: () => (
                                            <>
                                                <Box
                                                    sx={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        bgcolor: '#F4F9F9',
                                                        borderTop: '1px solid #ccc',
                                                        height: '60px',
                                                        width: '100%',
                                                    }}
                                                >
                                                    <Box sx={{ flex: 0.6, px: 1 }}>
                                                        <Typography fontWeight="bold">Total</Typography>
                                                    </Box>
                                                    <Box sx={{ flex: 0.5, px: 1 }} />
                                                    <Box sx={{ flex: 0.7, px: 1 }} />
                                                    <Box sx={{ flex: 0.7, px: 1 }} />
                                                    <Box sx={{ flex: 0.3, px: 1 }} />
                                                    <Box sx={{ flex: 3, px: 1 }} />
                                                    <Box sx={{ flex: 1, textAlign: 'right', pr: 1, ml: 40 }}>
                                                        <Typography fontWeight="bold">{totalDebitFormatted}</Typography>
                                                    </Box>
                                                    <Box
                                                        sx={{
                                                            flex: 1,
                                                            textAlign: 'right',
                                                            pr: 1,
                                                            ...(scrollbarVisible ? { mr: 2.5 } : {})
                                                        }}
                                                    >
                                                        <Typography fontWeight="bold">{totalCreditFormatted}</Typography>
                                                    </Box>
                                                </Box>

                                                <GridPagination
                                                    sx={{
                                                        overflow: 'hidden',
                                                    }}
                                                />
                                            </>
                                        ),
                                    }}
                                    sx={{
                                        ...DataGridStyle.sx,
                                        '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': {
                                            outline: 'none',
                                            border: 'none',
                                        },
                                        '& .highlight-separator': {
                                            borderBottom: '1px solid red'
                                        },
                                        '& .MuiDataGrid-row.highlight-separator': {
                                            borderBottom: '1px solid red',
                                        },
                                        '& .MuiDataGrid-virtualScroller': {
                                            maxHeight: '700px',
                                        },
                                    }}
                                    rowHeight={DataGridStyle.rowHeight}
                                    columnHeaderHeight={DataGridStyle.columnHeaderHeight}
                                    editMode='row'
                                    columns={SaisieColumnHeader}
                                    rows={tableRows}
                                    initialState={{
                                        pagination: {
                                            paginationModel: { page: 0, pageSize: 100 },
                                        },
                                    }}
                                    experimentalFeatures={{ newEditingApi: true }}
                                    pageSizeOptions={[5, 10, 20, 30, 50, 100]}
                                    pagination={DataGridStyle.pagination}
                                    checkboxSelection={DataGridStyle.checkboxSelection}
                                    columnVisibilityModel={{
                                        id: false,
                                    }}
                                    getRowClassName={(params) => {
                                        const data = tableRows;
                                        const index = data.findIndex(row => row.id === params.id);

                                        if (index < data.length - 1) {
                                            const current = data[index];
                                            const next = data[index + 1];

                                            if (current?.id_ecriture !== next?.id_ecriture) {
                                                return 'highlight-separator';
                                            }
                                        }

                                        return '';
                                    }}
                                    rowSelectionModel={rowSelectionModel}
                                    onRowSelectionModelChange={(ids) => {
                                        const data = tableRows;
                                        const selectedID = ids[ids.length - 1];

                                        if (!selectedID) {
                                            setSelectedRows([]);
                                            setRowSelectionModel([]);
                                            return;
                                        }

                                        const selectedData = data.find((row) => row.id === selectedID);
                                        const id_ecriture = selectedData?.id_ecriture;

                                        if (!id_ecriture) {
                                            setSelectedRows([]);
                                            setRowSelectionModel([]);
                                            return;
                                        }

                                        const rows = data
                                            .filter((row) => row.id_ecriture === id_ecriture)
                                            .map((row) => {
                                                const [annee, mois, jour] = row.dateecriture.split('-');
                                                const compteObj = listePlanComptable.find(pc => pc.compte === row.compteaux);

                                                return {
                                                    ...row,
                                                    jour: parseInt(jour),
                                                    mois: parseInt(mois),
                                                    compte: Number(compteObj?.id ?? row.id_numcpt),
                                                };
                                            });

                                        const newRowIds = rows.map(row => row.id);

                                        setSelectedRows(rows);
                                        setRowSelectionModel(newRowIds);
                                    }}
                                />
                            </Stack>
                        </Stack>
                    </TabPanel>
                </TabContext>
            </Box>
        </>
    )
}
