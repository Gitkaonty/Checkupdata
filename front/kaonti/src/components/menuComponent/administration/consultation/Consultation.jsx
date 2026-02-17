import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Autocomplete, Typography, Stack, Box, Tab, Button, TextField, Tooltip } from '@mui/material';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Radio from '@mui/material/Radio';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import { init } from '../../../../../init';
import { LuView } from "react-icons/lu";
import { MdFilePresent } from "react-icons/md";

import axios, { URL } from '../../../../../config/axios';
import PopupTestSelectedFile from '../../../componentsTools/popupTestSelectedFile';
import { TbPlugConnected } from "react-icons/tb";
import { TbPlugConnectedX } from "react-icons/tb";

import { TabContext, TabList, TabPanel } from '@mui/lab';

import { InfoFileStyle } from '../../../componentsTools/InfosFileStyle';

import { AiFillEdit } from "react-icons/ai";

import { DataGrid, frFR } from '@mui/x-data-grid';

import { DataGridStyle } from '../../../componentsTools/DatagridToolsStyle';
import QuickFilter from '../../../componentsTools/DatagridToolsStyle';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

import useAuth from '../../../../hooks/useAuth';
import { jwtDecode } from 'jwt-decode';

import { GrPrevious } from "react-icons/gr";
import { GrNext } from "react-icons/gr";
import { CgAssign } from "react-icons/cg";

import PopupSaisie from '../../../componentsTools/Saisie/popupSaisie';
import PopupInfoAnalytique from '../../../componentsTools/Saisie/PopupInfoAnalytique';

import usePermission from '../../../../hooks/usePermission';
import useAxiosPrivate from '../../../../../config/axiosPrivate';
import PopupConfirmDelete from '../../../componentsTools/popupConfirmDelete';

import PopupAddSaisieFromConsultation from '../../../componentsTools/Saisie/PopupAddSaisieFromConsultation';
import PopupReaffecterLigne from '../../../componentsTools/Saisie/PopupReaffecterLigne';

export default function ConsultationComponent() {
    let initial = init[0];

    const { canAdd, canModify, canDelete, canView } = usePermission();

    const axiosPrivate = useAxiosPrivate();
    const [typeComptabilite, setTypeComptabilite] = useState(null);
    const [isTypeComptaAutre, setIsTypeComptaAutre] = useState(false);

    const [fileInfos, setFileInfos] = useState('');
    const [fileId, setFileId] = useState(0);
    const [noFile, setNoFile] = useState(false);
    const [listeExercice, setListeExercice] = useState([]);
    const [listeSituation, setListeSituation] = useState([]);
    const [selectedExerciceId, setSelectedExerciceId] = useState(0);
    const [selectedPeriodeId, setSelectedPeriodeId] = useState(0);
    const [deviseParDefaut, setDeviseParDefaut] = useState('MGA');

    const [openSaisiePopup, setOpenSaisiePopup] = useState(false);
    const [openAnalytiquePopup, setOpenAnalytiquePopup] = useState(false);
    const [openPopupAddEcriture, setOpenPopupAddEcriture] = useState(false);
    const [openPopupReaffecter, setOpenPopupReaffecter] = useState(false);
    const [idJournal, setIdJournal] = useState(null);

    const [selectedRows, setSelectedRows] = useState([]);
    const [rowSelectionModel, setRowSelectionModel] = useState([]);

    const [isRefresehed, setIsRefreshed] = useState(false);
    const [refreshListAxeSection, setRefreshListAxeSection] = useState(false);
    const [listCa, setListCa] = useState([]);
    const [isCaActive, setIsCaActive] = useState(false);

    const { id } = useParams();

    const [listSaisie, setListSaisie] = useState([]);
    const [filteredList, setFilteredList] = useState(null);
    const [listePlanComptable, setListePlanComptable] = useState([]);
    const [listePlanComptableInitiale, setListePlanComptableInitiale] = useState([]);
    const [listeCodeJournaux, setListeCodeJournaux] = useState([]);
    const [listeDevise, setListeDevise] = useState([]);
    const [listeAnnee, setListeAnnee] = useState([]);

    const [isRefreshedPlanComptable, setIsRefreshedPlanComptable] = useState(false);

    const [filtrageCompte, setFiltrageCompte] = useState("0");
    const [selectedLigneDesequilibre, setSelectedLigneDesequilibre] = useState([]);
    const [openLettrageDesequilibrePopup, setOpenLettrageDesequilibrePopup] = useState(false);
    const [messageLettrageDesequlibre, setMessageLettrageDesequilibre] = useState('');

    // Vérifier si la sélection contient un type RAN
    const isRanTypeSelected = useMemo(() => {
        if (selectedRows.length === 0 || listeCodeJournaux.length === 0) return false;
        const selectedJournalId = Number(selectedRows[0].id_journal);
        const codeJournal = listeCodeJournaux.find(cj => Number(cj.id) === selectedJournalId);
        return codeJournal?.type === 'RAN';
    }, [selectedRows, listeCodeJournaux]);

    //Valeur du listbox choix compte
    const [valSelectedCompte, setValSelectedCompte] = useState('')

    //récupération des informations de connexion
    const { auth } = useAuth();
    const decoded = auth?.accessToken ? jwtDecode(auth.accessToken) : undefined;
    const compteId = decoded.UserInfo.compteId || null;

    //récupération infos de connexion
    const navigate = useNavigate();

    const GetInfosIdDossier = (id) => {
        axios.get(`/home/FileInfos/${id}`).then((response) => {
            const resData = response.data;

            if (resData.state) {
                setFileInfos(resData.fileInfos[0]);
                setTypeComptabilite(resData?.fileInfos[0]?.typecomptabilite);
                setIsTypeComptaAutre(resData.fileInfos[0].typecomptabilite === 'Autres');
                setIsCaActive(resData?.fileInfos[0]?.avecanalytique);
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
        setListeSituation(listeExercice?.filter((item) => item.id === exercice_id));
        setSelectedPeriodeId(exercice_id);
    }

    const handleCloseSaisieAddPopup = (value) => {
        setOpenSaisiePopup(value);
    }

    //Récupérer la liste des exercices
    const GetListeExercice = (id) => {
        axios.get(`/paramExercice/listeExercice/${id}`).then((response) => {
            const resData = response.data;
            if (resData.state) {

                setListeExercice(resData.list);

                const exerciceNId = resData.list?.filter((item) => item.libelle_rang === "N");
                setListeSituation(exerciceNId);

                setSelectedExerciceId(exerciceNId[0].id);
                setSelectedPeriodeId(exerciceNId[0].id);

            } else {
                setListeExercice([]);
                toast.error("Une erreur est survenue lors de la récupération de la liste des exercices");
            }
        })
    }

    //Liste saisie
    const getListeSaisie = () => {
        axios.get(`/administration/traitementSaisie/getAllJournal/${compteId}/${id}/${selectedExerciceId}`).then((response) => {
            const resData = response.data;
            if (canView) {
                setListSaisie(resData);
            } else {
                setListSaisie([]);
            }
        })
    }

    //Liste saisie with return statement
    const getListeSaisieReturn = async () => {
        const response = await axios.get(`/administration/traitementSaisie/getAllJournal/${compteId}/${id}/${selectedExerciceId}`);
        const resData = response.data;
        if (canView) {
            setListSaisie(resData);
        } else {
            setListSaisie(resData);
        }
        canView ? setListSaisie(resData) : setListSaisie([]);
        return resData;
    };

    //Récupération du plan comptable
    const getPc = () => {
        axios.get(`/paramPlanComptable/PcIdLibelle/${compteId}/${fileId}`, {
            params: { typeComptabilite }
        })
            .then((response) => {
                const resData = response.data;
                if (resData.state) {
                    setListePlanComptable(resData.liste);
                    setListePlanComptableInitiale(resData.liste);
                } else {
                    toast.error(resData.msg);
                }
            })
    }

    //Liste des sections avec ses axes
    const getListAxeSection = () => {
        axios.get(`/paramCa/getListAxeSection/${Number(compteId)}/${Number(fileId)}`).then((response) => {
            const resData = response.data;
            setListCa(resData);
        })
    }

    const handleOpenPopupShowAnalytique = (id) => {
        setOpenAnalytiquePopup(true);
        setIdJournal(id);
    }

    const handleClosePopupShowAnalytique = (id) => {
        setOpenAnalytiquePopup(false);
        setIdJournal(null);
    }

    const viewFile = (file) => {
        if (!file) return;

        const baseUrl = `${URL}/`;
        const fileUrl = baseUrl + file;

        window.open(fileUrl, "_blank");
    };

    //Header
    const ConsultationColumnHeader = [
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
            flex: 0.43,
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
        }, {
            field: 'libelle',
            headerName: 'Libellé',
            type: 'string',
            sortable: true,
            flex: 2.2,
            headerAlign: 'left',
            align: 'left',
            headerClassName: 'HeaderbackColor',
        },
        {
            field: 'fichier',
            headerName: 'Fichier',
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
        }, {
            field: 'debit',
            headerName: 'Débit',
            type: 'string',
            sortable: true,
            flex: 0.9,
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
            flex: 0.9,
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
        {
            field: 'solde',
            headerName: 'Solde',
            type: 'number',
            sortable: true,
            flex: 1,
            headerAlign: 'right',
            align: 'right',
            headerClassName: 'HeaderbackColor',
            renderCell: (params) => {
                const solde = Number(params.value) || 0;
                const formatted = solde.toLocaleString('fr-FR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                });
                return (
                    <Stack sx={{ color: `${solde >= 0 ? '#2433a5ff' : '#FF8A8A'}` }}>
                        {formatted.replace(/\u202f/g, ' ')}
                    </Stack>
                )
            },
        }, {
            field: 'lettrage',
            headerName: 'Lettrage',
            type: 'string',
            sortable: true,
            flex: 0.45,
            headerAlign: 'left',
            align: 'left',
            headerClassName: 'HeaderbackColor',
        },
    ]

    if (isCaActive) {
        ConsultationColumnHeader.push({
            field: 'repartition_analytique',
            headerName: 'Analytique',
            sortable: false,
            width: 85,
            headerAlign: 'center',
            align: 'center',
            headerClassName: 'HeaderbackColor',
            renderCell: (params) => {
                return (
                    <Tooltip title={"Voir les répartitions analytiques"}>
                        <span>
                            <Button
                                sx={{
                                    outline: 'none',
                                    boxShadow: 'none',
                                    minWidth: 0,
                                    p: 0.5,
                                    '&:focus': { outline: 'none', boxShadow: 'none' },
                                    '&:focus-visible': { outline: 'none', boxShadow: 'none' },
                                }}
                                onClick={() => {
                                    handleOpenPopupShowAnalytique(params.row.id);
                                }}
                            >
                                <LuView style={{ width: 85, height: 30 }} />
                            </Button>
                        </span>
                    </Tooltip>
                );
            },
        });
    }

    const handleSearch = () => {
        if (!valSelectedCompte || valSelectedCompte === 'tout') {
            setFilteredList([]);
            return;
        }

        if (!listePlanComptable || listePlanComptable.length === 0) {
            toast.error("Liste plan comptable pas encore chargée");
            return;
        }

        const compteSelect = (listePlanComptableInitiale || listePlanComptable).find(
            (item) => item.id === Number(valSelectedCompte)
        );

        if (!compteSelect || compteSelect.compte == null) {
            setFilteredList([]);
            return;
        }

        const compteSelectStr = compteSelect.compte.toString();

        const filtered = listSaisie.filter(
            (item) => item.compteaux?.toString() === compteSelectStr
        );

        setFilteredList(filtered);
    };

    const handlePrevious = () => {
        const currentIndex = listePlanComptable.findIndex(item => item.id === Number(valSelectedCompte));
        if (currentIndex > 0) {
            setValSelectedCompte(listePlanComptable[currentIndex - 1].id);
        } else if (currentIndex === 0) {
            setValSelectedCompte("tout");
        }
    };

    const handleNext = () => {
        const currentIndex = listePlanComptable.findIndex(item => item.id === Number(valSelectedCompte));
        if (currentIndex < listePlanComptable.length - 1) {
            setValSelectedCompte(listePlanComptable[currentIndex + 1].id);
        }
    };

    //Cacule solde
    const calculerSoldeCumule = (rows) => {
        const newRows = [];

        for (let i = 0; i < rows.length; i++) {
            const debit = Number(rows[i].debit) || 0;
            const credit = Number(rows[i].credit) || 0;

            const previousSolde = i > 0 ? newRows[i - 1].solde : 0;
            let solde = previousSolde + (debit - credit);

            if (Math.abs(solde) < 0.005) {
                solde = 0;
            }

            newRows.push({ ...rows[i], solde });
        }

        return newRows;
    };

    const rowsAvecSolde = calculerSoldeCumule(filteredList ?? listSaisie);

    const ajoutLettrage = () => {
        if (selectedRows.length === 0) {
            toast.error("Aucune ligne sélectionnée");
            return;
        }
        const isHavingLettrage = selectedRows.some(row => row.lettrage && row.lettrage.trim() !== '');
        if (isHavingLettrage) {
            toast.error("Il y a déjà une lettrage pour certaines lignes");
        } else {
            const soldeStr = calculateDebitCredit(selectedRows).solde.replace(/\s/g, '').replace(',', '.');
            const solde = parseFloat(soldeStr);
            if (solde === 0) {
                const ids = selectedRows.map(row => row.id);
                axiosPrivate.post('/administration/traitementSaisie/addLettrage',
                    {
                        data: ids,
                        id_compte: compteId,
                        id_dossier: id,
                        id_exercice: selectedExerciceId
                    }
                ).then((response) => {
                    const resData = response.data;
                    if (resData.state) {
                        setIsRefreshed(!isRefresehed);
                        setSelectedRows(resData?.list);
                        toast.success('Lignes lettrés avec success');
                    } else {
                        toast.error(resData.message);
                    }
                })
            } else {
                toast.error("Le total crédit doit être égal au total débit");
            }
        }
    }

    const supprimerLettrage = () => {
        if (selectedRows.length === 0) {
            toast.error("Aucune ligne sélectionnée");
            return;
        }

        const firstLettrage = selectedRows[0].lettrage?.trim();

        const allHaveSameLettrage = firstLettrage &&
            selectedRows.every(row => row.lettrage?.trim() === firstLettrage);

        if (!allHaveSameLettrage) {
            toast.error("Les lettrages ne sont pas les mêmes ou sont vides");
            return;
        }

        const soldeStr = calculateDebitCredit(selectedRows).solde.replace(/\s/g, '').replace(',', '.');
        const solde = parseFloat(soldeStr);

        if (solde === 0) {
            const ids = selectedRows.map(row => row.id);
            axiosPrivate.put('/administration/traitementSaisie/deleteLettrage', {
                data: ids,
                id_compte: compteId,
                id_dossier: id,
                id_exercice: selectedExerciceId
            }).then((response) => {
                const resData = response.data;
                if (resData.state) {
                    setIsRefreshed(!isRefresehed);
                    setSelectedRows(resData?.list);
                    toast.success('Ligne délettrés avec succès');
                } else {
                    toast.error(resData.message);
                }
            }).catch(err => {
                toast.error("Erreur lors de la suppression du lettrage");
            });
        } else {
            toast.error("Le total crédit doit être égal au total débit");
        }
    };

    const handleOpenPopupAddEcriture = () => {
        setOpenPopupAddEcriture(true);
    }

    const confirmationStateCreateEcriture = (value) => {
        if (value) {
            setOpenPopupAddEcriture(false);
        } else {
            setOpenPopupAddEcriture(false);
        }
    }

    const handleOpenPopupReaffecter = () => {
        setOpenPopupReaffecter(true);
    }

    const confirmationStateReaffecter = (value) => {
        if (value) {
            setOpenPopupReaffecter(false);
        } else {
            setOpenPopupReaffecter(false);
        }
    }

    const supprimerLettrageDesequilibre = (value) => {
        if (value) {
            const ids = selectedLigneDesequilibre.map(row => row.id);
            axiosPrivate.put('/administration/traitementSaisie/deleteLettrage', {
                data: ids,
                id_compte: compteId,
                id_dossier: id,
                id_exercice: selectedExerciceId
            }).then((response) => {
                const resData = response.data;
                if (resData.state) {
                    toast.success('Ligne délettrés avec succès');
                    setIsRefreshed(!isRefresehed);
                } else {
                    toast.error(resData.message);
                }
                setOpenLettrageDesequilibrePopup(false);
            }).catch(err => {
                toast.error("Erreur lors de la suppression du lettrage");
            });
        } else {
            setOpenLettrageDesequilibrePopup(false);
        }
    }

    const handleOpenSaisiePopup = () => {
        const defaultDeviseData = listeDevise.find(val => val.par_defaut === true);
        if (!defaultDeviseData) {
            return toast.error('Veuillez sélectionner une devise par défaut dans le paramétrage CRM de ce dossier')
        }
        let id_ecriture = '';
        if (selectedRows.length === 1) {
            id_ecriture = selectedRows[0].id_ecriture;
            const rows = listSaisie
                .filter((row) => row.id_ecriture === id_ecriture)
                .map((row) => {
                    const [annee, mois, jour] = row.dateecriture.split('-');
                    const compteObj = listePlanComptable.find(pc => pc.compte === row.compteaux);

                    return {
                        ...row,
                        jour: parseInt(jour),
                        mois: parseInt(mois),
                        compte: Number(compteObj?.id ?? row.id_numcpt),
                        libelle: compteObj?.libelle ?? row.libelle
                    };
                });
            setSelectedRows(rows);
            setOpenSaisiePopup(true);
        } else {
            toast.error('Sélectionner une ligne pour modifier')
        }
    }

    const calculateDebitCredit = (tableRows) => {
        const totalDebit = tableRows.reduce((total, row) => total + (parseFloat(row.debit) || 0), 0);
        const totalCredit = tableRows.reduce((total, row) => total + (parseFloat(row.credit) || 0), 0);

        const total = totalDebit - totalCredit;

        const totalDebitFormatted = totalDebit.toLocaleString('fr-FR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).replace(/\u202f/g, ' ');

        const totalCreditFormatted = totalCredit.toLocaleString('fr-FR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).replace(/\u202f/g, ' ');

        // Calcul du solde final à la main
        let solde = 0;

        for (let i = 0; i < tableRows.length; i++) {
            const debit = parseFloat(tableRows[i].debit) || 0;
            const credit = parseFloat(tableRows[i].credit) || 0;

            solde += debit - credit;
        }

        if (Math.abs(solde) < 0.005) {
            solde = 0;
        }

        return {
            debit: totalDebitFormatted,
            credit: totalCreditFormatted,
            solde: solde.toLocaleString('fr-FR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).replace(/\u202f/g, ' ')
        };
    };

    const soldeStr = calculateDebitCredit(selectedRows).solde.replace(/\s/g, '').replace(',', '.');
    const solde = parseFloat(soldeStr);

    const soldeLigneStr = calculateDebitCredit(filteredList || []).solde.replace(/\s/g, '').replace(',', '.');
    const soldeLigne = parseFloat(soldeLigneStr);

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

    //Récupération données liste des devises
    const getListeDevises = () => {
        axios.get(`/devises/devise/compte/${compteId}/${fileId}`).then((response) => {
            const data = response?.data;
            setListeDevise(response.data);
            const defaultDevise = data.find(val => val.par_defaut === true);
            if (defaultDevise) {
                setDeviseParDefaut(defaultDevise.code);
            }
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
                toast.error("une erreur est survenue lors de la récupération de la liste des exercices");
            }
        })
    }

    // Liste saisie
    useEffect(() => {
        if (fileId && selectedExerciceId && compteId) {
            getListeSaisie();
        }
    }, [selectedPeriodeId, selectedExerciceId, selectedExerciceId, isRefresehed])

    //récupérer les informations du dossier sélectionné
    useEffect(() => {
        const navigationEntries = performance.getEntriesByType('navigation');
        let idFile = 0;

        if (navigationEntries.length > 0) {
            const navigationType = navigationEntries[0].type;
            if (navigationType === 'reload') {
                const idDossier = sessionStorage.getItem("fileId");
                setFileId(idDossier);
                idFile = idDossier;
            } else {
                sessionStorage.setItem('fileId', id);
                setFileId(id);
                idFile = id;
            }
        }

        GetInfosIdDossier(idFile);
        GetListeExercice(idFile);
    }, []);

    useEffect(() => {
        if (listePlanComptable.length > 0 || listePlanComptableInitiale.length > 0 && valSelectedCompte && (fileId && compteId)) {
            const existe = listePlanComptable.some(item => item.id === Number(valSelectedCompte));
            if (!existe && valSelectedCompte !== "tout") {
                setValSelectedCompte("tout");
                return;
            }

            handleSearch();
        }
    }, [listePlanComptable, listePlanComptableInitiale, valSelectedCompte, listSaisie]);

    useEffect(() => {
        if (fileId && compteId && typeComptabilite !== null) {
            getPc();
        }
    }, [fileId, compteId, selectedExerciceId, isRefreshedPlanComptable])

    useEffect(() => {
        if (fileId && compteId) {
            GetListeCodeJournaux();
            getListeDevises();
        }
    }, [fileId, compteId]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const resData = await getListeSaisieReturn();
                const comptesAvecSolde = resData.map(row => String(row.compteaux));

                const listePlanComptableFiltree = listePlanComptableInitiale.filter(plan =>
                    comptesAvecSolde.includes(String(plan.compte))
                );

                if (filtrageCompte === "1") {
                    // Comptes mouvementés
                    setListePlanComptable(listePlanComptableFiltree);

                } else if (filtrageCompte === "2") {
                    // Comptes soldés
                    const comptesEquilibres = listePlanComptableFiltree.filter(plan => {
                        const lignes = resData.filter(row => String(row.compteaux) === String(plan.compte));
                        const totalDebit = lignes.reduce((sum, row) => sum + (Number(row.debit) || 0), 0);
                        const totalCredit = lignes.reduce((sum, row) => sum + (Number(row.credit) || 0), 0);
                        return Math.abs(totalDebit - totalCredit) < 0.01;
                    });

                    setListePlanComptable(comptesEquilibres);

                } else if (filtrageCompte === "3") {
                    // Comptes non soldés
                    const comptesDesequilibres = listePlanComptableFiltree.filter(plan => {
                        const lignes = resData.filter(row => String(row.compteaux) === String(plan.compte));
                        const totalDebit = lignes.reduce((sum, row) => sum + (Number(row.debit) || 0), 0);
                        const totalCredit = lignes.reduce((sum, row) => sum + (Number(row.credit) || 0), 0);
                        return Math.abs(totalDebit - totalCredit) >= 0.01;
                    });

                    setListePlanComptable(comptesDesequilibres);
                }
            } catch (error) {
                console.error("Erreur lors du chargement des écritures :", error);
            }
        }
        if (fileId && compteId) {
            fetchData();
        }
    }, [filtrageCompte, fileId, listePlanComptableInitiale]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (canView) {
                if (e.ctrlKey && e.key === "ArrowRight") {
                    // Ctrl + →
                    handleNext();
                } else if (e.ctrlKey && e.key === "ArrowLeft") {
                    // Ctrl + ←
                    handlePrevious();
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [listePlanComptable, valSelectedCompte]);

    // Liste des années
    useEffect(() => {
        if (selectedExerciceId) {
            getDateDebutFinExercice();
        }
    }, [selectedExerciceId])

    useEffect(() => {
        getListAxeSection();
    }, [selectedPeriodeId, refreshListAxeSection])

    return (
        <>
            {
                noFile
                    ?
                    <PopupTestSelectedFile
                        confirmationState={sendToHome}
                    />
                    :
                    null
            }
            {
                openSaisiePopup && canModify ?
                    <PopupSaisie
                        confirmationState={handleCloseSaisieAddPopup}
                        fileId={fileId}
                        selectedExerciceId={selectedExerciceId}
                        rowsEdit={selectedRows}
                        setRefresh={() => setIsRefreshed(!isRefresehed)}
                        setRefreshListAxeSection={() => setRefreshListAxeSection(!refreshListAxeSection)}
                        setRowSelectionModel={() => setRowSelectionModel([])}
                        type={'modification'}
                        listeCodeJournaux={listeCodeJournaux}
                        listePlanComptable={listePlanComptableInitiale.filter(val => Number(val.id_dossier) === Number(fileId))}
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
                    /> : null
            }
            {
                (openAnalytiquePopup && canView) && (
                    <PopupInfoAnalytique
                        onClose={handleClosePopupShowAnalytique}
                        open={openAnalytiquePopup}
                        id={idJournal}
                    />
                )
            }
            {
                openLettrageDesequilibrePopup && (
                    <PopupConfirmDelete
                        confirmationState={supprimerLettrageDesequilibre}
                        msg={messageLettrageDesequlibre}
                        presonalisedMessage={true}
                    />
                )
            }
            {
                openPopupAddEcriture && (
                    <PopupAddSaisieFromConsultation
                        confirmationState={confirmationStateCreateEcriture}
                        listePlanComptable={listePlanComptableInitiale}
                        valSelectedCompte={valSelectedCompte}
                        id_dossier={Number(fileId)}
                        id_exercice={Number(selectedExerciceId)}
                        id_compte={Number(compteId)}
                        solde={solde}
                        refresh={() => setIsRefreshed(prev => !prev)}
                    />
                )
            }
            {
                openPopupReaffecter && (
                    <PopupReaffecterLigne
                        confirmationState={confirmationStateReaffecter}
                        listePlanComptable={listePlanComptableInitiale}
                        id_dossier={Number(fileId)}
                        id_exercice={Number(selectedExerciceId)}
                        id_compte={Number(compteId)}
                        refresh={() => setIsRefreshed(prev => !prev)}
                        selectedRows={selectedRows}
                        selectedCompte={valSelectedCompte}
                    />
                )
            }
            <Box >
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
                    <TabPanel value="1" style={{ height: '85%' }}>
                        <Stack width={"100%"} height={"100%"} spacing={6} alignItems={"flex-start"} alignContent={"flex-start"} justifyContent={"stretch"}>
                            <Typography variant='h6' sx={{ color: "black" }} align='left'>Administration - Consultation</Typography>
                            <Stack width={"100%"} height={"80px"} spacing={4} alignItems={"left"} alignContent={"center"} direction={"row"} style={{ marginLeft: "0px", marginTop: "20px" }}>
                                <Stack
                                    direction={'row'}
                                >
                                    <FormControl variant="standard" sx={{ m: 1, minWidth: 250 }}>
                                        <InputLabel id="demo-simple-select-standard-label">Exercice:</InputLabel>
                                        <Select
                                            labelId="demo-simple-select-standard-label"
                                            id="demo-simple-select-standard"
                                            value={selectedExerciceId}
                                            label={"exercice"}
                                            onChange={(e) => handleChangeExercice(e.target.value)}
                                            sx={{ width: "300px", display: "flex", justifyContent: "left", alignItems: "flex-start", alignContent: "flex-start", textAlign: "left" }}
                                        >
                                            {listeExercice.map((option) => (
                                                <MenuItem key={option.id} value={option.id}>{option.libelle_rang}: {format(option.date_debut, "dd/MM/yyyy")} - {format(option.date_fin, "dd/MM/yyyy")}</MenuItem>
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
                                            label={"periode"}
                                            sx={{ width: "150px", display: "flex", justifyContent: "left", alignItems: "flex-start", alignContent: "flex-start", textAlign: "left" }}
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
                                            label={"du"}
                                            onChange={(e) => handleChangeDateIntervalle(e.target.value)}
                                            sx={{ width: "300px", display: "flex", justifyContent: "left", alignItems: "flex-start", alignContent: "flex-start", textAlign: "left" }}
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
                                    width="70%"
                                    spacing={0.5}
                                    style={{
                                        marginLeft: "0px",
                                        marginTop: "5px",
                                        borderRadius: "5px"
                                    }}>
                                    <Button
                                        onClick={handleOpenSaisiePopup}
                                        disabled={
                                            !canModify ||
                                            selectedRows.length === 0 ||
                                            selectedRows.every(row => Number(row.id_dossier) !== Number(fileId)) ||
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
                                </Stack>
                            </Stack>

                            <Stack
                                width={"100%"}
                                paddingLeft={"5px"}
                                alignItems={"left"}
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
                                <FormControl
                                    variant="standard"
                                >
                                    <Stack direction={'row'} alignContent={'center'}>
                                        <Stack
                                            sx={{
                                                width: 600,
                                                mr: 2
                                            }}
                                        >
                                            <Autocomplete
                                                disabled={!canView || !selectedExerciceId || selectedExerciceId === 0}
                                                value={listePlanComptable.find(item => item.id === Number(valSelectedCompte)) || null}
                                                onChange={(event, newValue) => {
                                                    setValSelectedCompte(newValue?.id || null);
                                                }}
                                                PaperComponent={(props) => (
                                                    <div {...props} style={{ width: 600, backgroundColor: 'white' }} />
                                                )}
                                                renderOption={(props, option) => {
                                                    const { key, ...otherProps } = props;
                                                    return (
                                                        <li key={option.id} {...otherProps}>
                                                            <span>
                                                                {option.compte} - {option.libelle}{' '}
                                                                <span style={{ color: '#1976d2', fontWeight: 600, fontSize: 14 }}>
                                                                    ({option.dossier})
                                                                </span>
                                                            </span>
                                                        </li>
                                                    );
                                                }}
                                                options={listePlanComptable}
                                                getOptionLabel={(option) => `${option.compte || ''} - ${option.libelle || ''}`}
                                                renderInput={(params) => <TextField {...params} label="Compte" variant="standard" />}
                                                isOptionEqualToValue={(option, value) => option?.id === value?.id}
                                                disableClearable={false}
                                                noOptionsText="Aucun compte disponible"
                                            />

                                        </Stack>
                                        <Stack direction={'row'} spacing={1}>
                                            <Button
                                                disabled={!canView || !selectedExerciceId || selectedExerciceId === 0 || valSelectedCompte === 'tout'}
                                                sx={{
                                                    minWidth: 0,
                                                    padding: 1,
                                                    backgroundColor: 'transparent',
                                                    boxShadow: 'none',
                                                    '&:hover': {
                                                        backgroundColor: 'transparent',
                                                    },
                                                    '&:focus': {
                                                        outline: 'none',
                                                        backgroundColor: 'transparent',
                                                        boxShadow: 'none',
                                                    },
                                                    '&:active': {
                                                        backgroundColor: 'transparent',
                                                        boxShadow: 'none',
                                                    },
                                                }}
                                                onClick={handlePrevious}
                                            >
                                                <GrPrevious
                                                    color="gray"
                                                    size={20}
                                                />
                                            </Button>
                                            <Button
                                                disabled={
                                                    !canView ||
                                                    !selectedExerciceId || selectedExerciceId === 0 ||
                                                    listePlanComptable.findIndex(item => item.id === valSelectedCompte) >= listePlanComptable.length - 1
                                                }
                                                sx={{
                                                    minWidth: 0,
                                                    padding: 1,
                                                    backgroundColor: 'transparent',
                                                    boxShadow: 'none',
                                                    '&:hover': {
                                                        backgroundColor: 'transparent',
                                                    },
                                                    '&:focus': {
                                                        outline: 'none',
                                                        backgroundColor: 'transparent',
                                                        boxShadow: 'none',
                                                    },
                                                    '&:active': {
                                                        backgroundColor: 'transparent',
                                                        boxShadow: 'none',
                                                    },
                                                }}
                                                onClick={handleNext}
                                            >
                                                <GrNext
                                                    color="gray"
                                                    size={20}
                                                />
                                            </Button>
                                        </Stack>
                                    </Stack>
                                </FormControl>

                                <RadioGroup
                                    row
                                    aria-labelledby="filtrageCompte"
                                    name="filtrageCompte"
                                    onChange={(e) => {
                                        setFiltrageCompte(e.target.value);
                                        setFilteredList([]);
                                        setListSaisie([]);
                                        handleSearch();
                                    }}
                                    value={filtrageCompte}
                                >
                                    <FormControlLabel value="0" control={<Radio disabled={!canView} />} label="Tous" style={{ marginLeft: "5px" }} />
                                    <FormControlLabel value="1" control={<Radio disabled={!canView} />} label="Comptes mouvementés" style={{ marginLeft: "5px" }} />
                                    <FormControlLabel value="2" control={<Radio disabled={!canView} />} label="Comptes soldés" style={{ marginLeft: "5px" }} />
                                    <FormControlLabel value="3" control={<Radio disabled={!canView} />} label="Comptes non soldés" style={{ marginLeft: "5px" }} />
                                </RadioGroup>
                            </Stack>

                            <Stack
                                direction={'row'}
                                alignItems={'end'}
                                style={{
                                    marginTop: '25px'
                                }}
                                justifyContent={'space-between'}
                                width={"100%"}
                            >
                                <Stack
                                    direction={"row"}
                                >
                                    <span style={{ whiteSpace: 'nowrap' }}>
                                        Solde : <strong
                                            style={{
                                                color: `${soldeLigneStr.includes('-') ? '#FF8A8A' : '#2433a5ff'}`
                                            }}
                                        >
                                            {
                                                soldeLigne.toLocaleString('fr-FR', {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2
                                                }).replace(/\u202f/g, ' ')
                                            }
                                        </strong>
                                    </span>
                                </Stack>
                                <Stack
                                    direction="row"
                                    justifyContent="flex-end"
                                    alignItems="center"
                                    width="100%"
                                    spacing={0.5}
                                    style={{
                                        marginLeft: "0px",
                                        borderRadius: "5px"
                                    }}>

                                    <Button
                                        disabled={!canAdd || selectedRows.length === 0 || !valSelectedCompte || selectedRows.every(row => Number(row.id_dossier) !== Number(fileId))}
                                        variant="contained"
                                        style={{
                                            textTransform: 'none',
                                            outline: 'none',
                                            backgroundColor: initial.theme,
                                            color: "white",
                                            height: "39px",
                                            marginTop: '10px'
                                        }}
                                        onClick={handleOpenPopupReaffecter}
                                        startIcon={<CgAssign size={20} />}
                                    >
                                        Réaffecter
                                    </Button>
                                    <Button
                                        disabled={!canAdd || selectedRows.length === 0 || !valSelectedCompte || selectedRows.every(row => Number(row.id_dossier) !== Number(fileId))}
                                        variant="contained"
                                        style={{
                                            textTransform: 'none',
                                            outline: 'none',
                                            backgroundColor: initial.theme,
                                            color: "white",
                                            height: "39px",
                                            marginTop: '10px'
                                        }}
                                        onClick={handleOpenPopupAddEcriture}
                                        startIcon={<TbPlugConnected size={20} />}
                                    >
                                        Lettrer : Avec écart
                                    </Button>
                                    <Button
                                        disabled={!canAdd || selectedRows.length === 0 || solde !== 0 || selectedRows.every(row => Number(row.id_dossier) !== Number(fileId))}
                                        variant="contained"
                                        style={{
                                            textTransform: 'none',
                                            outline: 'none',
                                            backgroundColor: initial.theme,
                                            color: "white",
                                            height: "39px",
                                            marginTop: '10px'
                                        }}
                                        onClick={ajoutLettrage}
                                        startIcon={<TbPlugConnected size={20} />}
                                    >
                                        Lettrer
                                    </Button>
                                    <Button
                                        disabled={!canDelete || selectedRows.length === 0 || solde !== 0 || selectedRows.every(row => Number(row.id_dossier) !== Number(fileId))}
                                        variant="contained"
                                        style={{
                                            textTransform: 'none',
                                            outline: 'none',
                                            backgroundColor: '#FF8A8A',
                                            color: "white",
                                            height: "39px",
                                            marginTop: '10px'
                                        }}
                                        onClick={supprimerLettrage}
                                        startIcon={<TbPlugConnectedX size={20} />}
                                    >
                                        Délettrer
                                    </Button>

                                </Stack>
                            </Stack>

                            <Stack
                                width={"100%"}
                                // height={'80%'}
                                style={{
                                    marginLeft: "0px",
                                    marginTop: "20px",
                                }}
                                height={"600px"}>
                                <Stack
                                    width={"50%"}
                                >
                                </Stack>
                                <DataGrid
                                    disableMultipleSelection={DataGridStyle.disableMultipleSelection}
                                    disableColumnSelector={DataGridStyle.disableColumnSelector}
                                    disableDensitySelector={DataGridStyle.disableDensitySelector}
                                    disableRowSelectionOnClick
                                    disableSelectionOnClick={true}
                                    localeText={frFR.components.MuiDataGrid.defaultProps.localeText}
                                    slots={{ toolbar: QuickFilter }}
                                    sx={{
                                        ...DataGridStyle.sx,
                                        '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': {
                                            outline: 'none',
                                            border: 'none',
                                        }
                                    }}
                                    rowHeight={DataGridStyle.rowHeight}
                                    columnHeaderHeight={DataGridStyle.columnHeaderHeight}
                                    editMode='row'
                                    columns={ConsultationColumnHeader}
                                    rows={rowsAvecSolde}
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
                                    rowSelectionModel={rowSelectionModel}
                                    onRowSelectionModelChange={(ids) => {
                                        const selectedData = rowsAvecSolde.filter((row) => ids.includes(row.id));
                                        setSelectedRows(selectedData);

                                        const newRowIds = selectedData.map(row => row.id);
                                        setRowSelectionModel(newRowIds);

                                        const lettrages = selectedData.map(row => row.lettrage);

                                        const hasNullLettrage = lettrages.some(l => !l || l.trim() === "");
                                        if (hasNullLettrage) return;

                                        const cleaned = lettrages.map(l => l.trim());

                                        const allSameLettrage = cleaned.every(l => l === cleaned[0]);
                                        if (!allSameLettrage) return;

                                        const lettrageValue = cleaned[0];

                                        const soldeLigne = calculateDebitCredit(selectedData).solde;

                                        const soldeNum = parseFloat(soldeLigne.toString().replace(',', '.'));

                                        if (soldeNum !== 0) {
                                            setMessageLettrageDesequilibre(`Le lettrage ${lettrageValue} est déséquilibré de ${soldeLigne} ${deviseParDefaut}.\nLes lettrages vont être annulés.`)
                                            setSelectedLigneDesequilibre(selectedData);
                                            setOpenLettrageDesequilibrePopup(true);
                                        }
                                    }}
                                />
                            </Stack>
                        </Stack>
                        {
                            selectedRows.length > 0 && (
                                <>
                                    <span>
                                        Débit : <strong
                                            style={{
                                                color: '#FF8A8A'
                                            }}
                                        >
                                            {calculateDebitCredit(selectedRows).debit}
                                        </strong>,{" "}
                                    </span>
                                    <span>
                                        Crédit : <strong
                                            style={{
                                                color: '#FF8A8A'
                                            }}
                                        >
                                            {calculateDebitCredit(selectedRows).credit}
                                        </strong>,{" "}
                                    </span>
                                    <span>
                                        Solde : <strong
                                            style={{
                                                color: `${calculateDebitCredit(selectedRows).solde.includes('-') ? '#FF8A8A' : '#2433a5ff'}`
                                            }}
                                        >
                                            {calculateDebitCredit(selectedRows).solde}
                                        </strong>
                                    </span>
                                </>
                            )
                        }
                    </TabPanel>
                </TabContext>
            </Box>
        </>
    )
}
