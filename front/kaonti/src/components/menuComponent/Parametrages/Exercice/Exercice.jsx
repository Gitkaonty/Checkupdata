import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Typography, Stack, IconButton, FormLabel, FormControl, Input, FormHelperText, Button } from '@mui/material';
import { HiLockClosed } from "react-icons/hi2";
import Tooltip from '@mui/material/Tooltip';
import { DataGridStyle } from '../../../componentsTools/DatagridToolsStyle';
import { DataGrid, frFR } from '@mui/x-data-grid';
import QuickFilter from '../../../componentsTools/DatagridToolsStyle';
import { init } from '../../../../../init';
import axios from '../../../../../config/axios';
import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import { InfoFileStyle } from '../../../componentsTools/InfosFileStyle';
import PopupTestSelectedFile from '../../../componentsTools/popupTestSelectedFile';
import { BsChevronLeft, BsChevronRight } from "react-icons/bs";
import { IoMdTrash } from 'react-icons/io';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import { styled } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import { useFormik } from 'formik';
import * as Yup from "yup";
import useAuth from '../../../../hooks/useAuth';
import { jwtDecode } from 'jwt-decode';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import PopupActionConfirm from '../../../componentsTools/popupActionConfirm';
import { BsFillUnlockFill } from "react-icons/bs";
import usePermission from '../../../../hooks/usePermission';
import useAxiosPrivate from '../../../../../config/axiosPrivate';
import { IoMdAddCircle } from "react-icons/io";
import { MdCancel } from "react-icons/md";
import PopupCodeJouralNotExist from '../../administration/import/PopupCodeJouralNotExist';
import PopupGenerateRan from '../../../componentsTools/Paramettage/Exercice/PopupGenerateRan';
import { TbPlaylistAdd } from "react-icons/tb";
import PopupAddPeriode from '../../../componentsTools/Paramettage/Exercice/PopupAddPeriode';

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
    '& .MuiDialog-paper': {
        height: '300px',
    },
    '& .MuiDialogContent-root': {
        padding: theme.spacing(2),
    },
    '& .MuiDialogActions-root': {
        padding: theme.spacing(1),
    },
}));

export default function ParamExerciceComponent() {
    const { canAdd, canModify, canDelete, canView } = usePermission();
    const axiosPrivate = useAxiosPrivate();

    const initial = init[0];
    const navigate = useNavigate();
    //récupération information du dossier sélectionné
    const { id } = useParams();
    const [fileId, setFileId] = useState(0);
    const [fileInfos, setFileInfos] = useState('');
    const [noFile, setNoFile] = useState(false);

    const [listeExercice, setListeExercice] = useState([]);
    const [listePeriode, setListePeriode] = useState([]);

    const [openDialogCreateFirstExercice, setEpenDialogCreateFirstExercice] = useState(false);
    const [openDialogCreatePeriode, setOpenDialogCreatePeriode] = useState(false);

    const [openActionConfirm, setOpenActionConfirm] = useState(false);
    const [openActionConfirmPrev, setOpenActionConfirmPrev] = useState(false);
    const [openActionConfirmVerrExercice, setOpenActionConfirmVerrExercice] = useState(false);
    const [msgVerrExercice, setMsgVerrExercice] = useState('');
    const [exerciceToLock, setExerciceToLock] = useState([]);
    const [openActionConfirmDeverrExercice, setOpenActionConfirmDeverrExercice] = useState(false);
    const [msgDeverrExercice, setMsgDeverrExercice] = useState('');
    const [exerciceToUnlock, setExerciceToUnlock] = useState([]);

    const [dateDebutPeriode, setDateDebutPeriode] = useState('');
    const [dateFinExercice, setDateFinExercice] = useState(Date());

    const [openActionConfirmDeleteExercice, setOpenActionConfirmDeleteExercice] = useState(false);
    const [openActionConfirmDeletePeriode, setOpenActionConfirmDeletePeriode] = useState(false);

    const [msgDeleteExercice, setMsgDeleteExercice] = useState('');
    const [msgDeletePeriode, setMsgDeletePeriode] = useState('');

    const [selectedExerciceRow, setSelectedExerciceRow] = useState([]);
    const [selectedPeriodeRow, setSelectedPeriodeRow] = useState([]);
    const [isRefreshedPeriode, setIsRefreshedPeriode] = useState(false);

    const [exerciceToDeleteId, setExerciceToDeleteId] = useState(0);
    const [exerciceToDeleteRang, setExerciceToDeleteRang] = useState(null);
    const [listeDevise, setListeDevise] = useState([]);
    const [openPopupDeleteRan, setOpenPopupDeleteRan] = useState(false);

    const [loadingCreateNextExercice, setLoadingCreateNextExercice] = useState(false);
    const [loadingCreatePreviousExercice, setLoadingPreviousExercice] = useState(false);

    const [openPopupCodejournal, setOpenPopupCodeJournal] = useState(false);
    const [openPopupGenerateRan, setOpenPopupGenerateRan] = useState(false);
    const [longeurCompte, setLongeurCompte] = useState(0);
    const [idRan, setIdRan] = useState(null);

    //récupération des informations de connexion
    const { auth } = useAuth();
    const decoded = auth?.accessToken ? jwtDecode(auth.accessToken) : undefined;
    const compteId = decoded.UserInfo.compteId || null;
    const userId = decoded.UserInfo.userId || null;

    //Entete du tableau
    const ExerciceColumnHeader = [
        {
            field: 'date_debut',
            headerName: 'Date début',
            type: 'Date',
            sortable: true,
            flex: 1,
            headerAlign: 'center',
            align: 'center',
            headerClassName: 'HeaderbackColor',
            valueFormatter: (params) => {
                return format(params.value, "dd/MM/yyyy");
            }
        },
        {
            field: 'date_fin',
            headerName: 'Date fin',
            type: 'Date',
            sortable: true,
            flex: 1,
            headerAlign: 'center',
            align: 'center',
            headerClassName: 'HeaderbackColor',
            valueFormatter: (params) => {
                return format(params.value, "dd/MM/yyyy");
            }
        },
        {
            field: 'libelle_rang',
            headerName: 'Position',
            type: 'string',
            sortable: true,
            flex: 1,
            headerAlign: 'center',
            align: 'center',
            headerClassName: 'HeaderbackColor',
        },
        {
            field: 'cloture',
            headerName: 'Vérrouillé',
            type: 'boolean',
            sortable: true,
            flex: 1,
            headerAlign: 'center',
            align: 'center',
            headerClassName: 'HeaderbackColor',
        },
    ];

    //Entete du tableau période
    const PeriodColumnHeader = [
        {
            field: 'date_debut',
            headerName: 'Date début',
            type: 'Date',
            sortable: true,
            flex: 1,
            headerAlign: 'center',
            align: 'center',
            headerClassName: 'HeaderbackColor',
            valueFormatter: (params) => {
                return format(params.value, "dd/MM/yyyy");
            }
        },
        {
            field: 'date_fin',
            headerName: 'Date fin',
            type: 'Date',
            sortable: true,
            flex: 1,
            headerAlign: 'center',
            align: 'center',
            headerClassName: 'HeaderbackColor',
            valueFormatter: (params) => {
                return format(params.value, "dd/MM/yyyy");
            }
        },
    ];

    //récupérer les informations du dossier sélectionné
    useEffect(() => {
        //tester si la page est renvoyer par useNavigate
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
    }, []);

    const GetInfosIdDossier = (id) => {
        axios.get(`/home/FileInfos/${id}`).then((response) => {
            const resData = response.data;

            if (resData.state) {
                setFileInfos(resData.fileInfos[0]);
                setLongeurCompte(resData?.fileInfos[0]?.longcomptestd);
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

    //Récupération données liste des devises
    const getListeDevises = () => {
        axios.get(`/devises/devise/compte/${compteId}/${fileId}`).then((response) => {
            setListeDevise(response.data);
        })
    }

    //Chargement de la liste des exercices associés à l'id dossier sélectionné
    const GetListeExercice = () => {
        axios.get(`/paramExercice/listeExercice/${fileId}/${compteId}`).then((response) => {
            const resData = response.data;
            if (resData.state) {
                setListeExercice(resData.list);
            } else {
                setListeExercice([]);
                //toast.error("une erreur est survenue lors de la récupération de la liste des exercices");
                return
            }

        })
    }

    // Chargement des périodes par exercice
    const getPeriodes = async () => {
        const id_exercice = Number(selectedExerciceRow[0]);
        const selectedRow = listeExercice.find(item => Number(item.id) === id_exercice);
        const dateDebutExercice = selectedRow?.date_debut;
        const dateFinExercice = selectedRow?.date_fin;
        setDateFinExercice(dateFinExercice);

        axios.get(`/paramExercice/getPeriodes/${id_exercice}`)
            .then((response) => {
                if (response?.data?.state) {
                    const data = response?.data?.data;

                    const maxDateFin = data.length > 0
                        ? (() => {
                            const d = new Date(Math.max(...data.map(d => new Date(d.date_fin))));
                            d.setDate(d.getDate() + 1);
                            return d;
                        })()
                        : new Date(dateDebutExercice);

                    const maxDateFinStr = maxDateFin
                        ? maxDateFin.toISOString().split('T')[0]
                        : null;

                    setDateDebutPeriode(maxDateFinStr);

                    setListePeriode(data);
                } else {
                    toast.error(response?.data?.message);
                }
            });
    };

    useEffect(() => {
        if (selectedExerciceRow.length === 1) {
            getPeriodes();
        } else {
            setListePeriode([]);
        }
    }, [selectedExerciceRow, isRefreshedPeriode]);

    useEffect(() => {
        if (canView && fileId && compteId) {
            GetListeExercice();
            getListeDevises();
        }
    }, [fileId, compteId]);

    //Création du premier exercice dans le tableau
    const handleCreateNextExercice = () => {
        if (listeExercice.length === 0) {
            firstExerciceForm.setFieldValue('id_compte', compteId);
            firstExerciceForm.setFieldValue('id_dossier', fileId);
            handleOpenDialogCreateFirstExercice();
        } else {
            setOpenActionConfirm(true);
        }
    }

    const handleCreateNextExercicePrev = () => {
        if (listeExercice.length === 0) {
            firstExerciceForm.setFieldValue('id_compte', compteId);
            firstExerciceForm.setFieldValue('id_dossier', fileId);
            handleOpenDialogCreateFirstExercice();
        } else {
            setOpenActionConfirmPrev(true);
        }
    }

    const handleOpenDialogCreateFirstExercice = () => {
        setEpenDialogCreateFirstExercice(true);
    }

    const handleCloseDialogCreateFirstExercice = () => {
        setEpenDialogCreateFirstExercice(false);
    }

    const handleOpenDialogCreatePeriode = () => {
        const id_exercice = Number(selectedExerciceRow[0]);
        if (id_exercice) {
            periodeForm.setFieldValue('id_compte', Number(compteId));
            periodeForm.setFieldValue('id_dossier', Number(fileId));
            periodeForm.setFieldValue('id_exercice', Number(id_exercice));
            periodeForm.setFieldValue('date_debut', dateDebutPeriode);
            setOpenDialogCreatePeriode(true);
        } else {
            toast.error('Veuillez sélectionner une exercice');
        }
    }

    const handleCloseDialogCreatePeriode = () => {
        periodeForm.resetForm();
        setOpenDialogCreatePeriode(false);
    }

    //formule pour la création du premier exercice
    const firstExerciceForm = useFormik({
        initialValues: {
            id_compte: 0,
            id_dossier: 0,
            date_debut: '',
            date_fin: ''
        },

        validationSchema: Yup.object({
            date_debut: Yup.string()
                .matches(
                    /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/, // = format du back pour la datapicker yyyy-MM-dd
                    'La date doit être au format jj/mm/aaaa'
                )
                .test('is-valid-date', 'La date doit être valide', (value) => {
                    if (!value) return false;

                    const [year, month, day] = value.split('-').map(Number);

                    // Vérifie les mois
                    if (month < 1 || month > 12) return false;

                    // Vérifie les jours en fonction du mois
                    const daysInMonth = new Date(year, month, 0).getDate();
                    return day >= 1 && day <= daysInMonth;
                }).required('La date est requise'),

            date_fin: Yup.string()
                .matches(
                    /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/, // = format du back pour la datapicker yyyy-MM-dd
                    'La date doit être au format jj/mm/aaaa'
                )
                .test('is-valid-date', 'La date doit être valide', (value) => {
                    if (!value) return false;

                    const [year, month, day] = value.split('-').map(Number);

                    // Vérifie les mois
                    if (month < 1 || month > 12) return false;

                    // Vérifie les jours en fonction du mois
                    const daysInMonth = new Date(year, month, 0).getDate();
                    return day >= 1 && day <= daysInMonth;
                }).required('La date est requise'),
        }),

        validate: (values) => {
            const errors = {};
            if (values.date_debut && values.date_fin) {
                const startDate = new Date(values.date_debut);
                const endDate = new Date(values.date_fin);

                // Vérifier si startDate est plus grande que endDate
                if (startDate > endDate) {
                    errors.date_fin = 'La date fin ne doit être antérieure à la date de début';
                }
            }
            return errors;
        },
    });

    const periodeForm = useFormik({
        initialValues: {
            id_compte: '',
            id_dossier: '',
            id_exercice: 0,
            date_debut: '',
            date_fin: ''
        },

        validationSchema: Yup.object({
            date_debut: Yup.string()
                .matches(
                    /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/,
                    'La date doit être au format yyyy-mm-dd'
                )
                .test('is-valid-date', 'La date doit être valide', (value) => {
                    if (!value) return false;
                    const [year, month, day] = value.split('-').map(Number);
                    const daysInMonth = new Date(year, month, 0).getDate();
                    return day >= 1 && day <= daysInMonth;
                })
                .required('La date est requise'),

            date_fin: Yup.string()
                .matches(
                    /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/,
                    'La date doit être au format yyyy-mm-dd'
                )
                .test('is-valid-date', 'La date doit être valide', (value) => {
                    if (!value) return false;
                    const [year, month, day] = value.split('-').map(Number);
                    const daysInMonth = new Date(year, month, 0).getDate();
                    return day >= 1 && day <= daysInMonth;
                })
                .test('max-date-fin', `La date fin ne doit pas dépasser ${format(dateFinExercice, 'dd/MM/yyyy')}`, (value) => {
                    if (!value) return false;
                    if (!dateFinExercice) return true;
                    const fin = new Date(value);
                    const max = new Date(dateFinExercice);
                    return fin <= max;
                })
                .required('La date est requise'),
        }),

        validate: (values) => {
            const errors = {};
            if (values.date_debut && values.date_fin) {
                const startDate = new Date(values.date_debut);
                const endDate = new Date(values.date_fin);

                if (startDate > endDate) {
                    errors.date_fin = 'La date fin ne doit pas être antérieure à la date de début';
                }
            }
            return errors;
        },
    });

    const createFirstExercice = () => {
        axiosPrivate.post(`/paramExercice/createFirstExercice`, firstExerciceForm.values).then((response) => {
            const resData = response.data;
            if (resData.state) {
                GetListeExercice();
                toast.success("La création du premier exercice a été effectuée avec succès");
            } else {
                toast.error(resData.msg);
            }
            handleCloseDialogCreateFirstExercice();
        });
    }

    const addPeriode = async () => {
        await axios.post(`/paramExercice/addPeriode`, periodeForm.values)
            .then((response) => {
                if (response?.data?.state) {
                    handleCloseDialogCreatePeriode();
                    toast.success(response?.data?.message);
                    setIsRefreshedPeriode(prev => !prev);
                } else {
                    toast.error(response?.data?.message);
                }
            })
    }

    //création de l'exercie suivant
    const createNextExercice = async (value) => {
        if (value) {
            setLoadingCreateNextExercice(true);
            try {
                await axiosPrivate.post(`/paramExercice/createNextExercice`, { compteId, fileId }).then((response) => {
                    const resData = response.data;
                    if (resData.state) {
                        GetListeExercice();
                        setOpenActionConfirm(false);
                        toast.success("La création de l'exercice suivant a été effectuée avec succès");
                    } else {
                        toast.error(resData.msg);
                    }
                });
            } catch (error) {
                const errMsg = error.response?.data?.message || error.message || "Erreur inconnue";
                toast.error(errMsg);
            } finally {
                setOpenActionConfirm(false);
            }
        } else {
            setOpenActionConfirm(false);
        }
        setLoadingCreateNextExercice(false);
    }

    //création de l'exercice précédent
    const createPreviewExercice = async (value) => {
        if (value) {
            setLoadingPreviousExercice(true);
            try {
                await axiosPrivate.post(`/paramExercice/createPreviewExercice`, { compteId, fileId }).then((response) => {
                    const resData = response.data;
                    if (resData.state) {
                        GetListeExercice();
                        setOpenActionConfirmPrev(false);
                        toast.success("La création de l'exercice précédent a été effectuée avec succès");
                    } else {
                        toast.error(resData.msg);
                    }
                });
            } catch (error) {
                const errMsg = error.response?.data?.message || error.message || "Erreur inconnue";
                toast.error(errMsg);
            } finally {
                setOpenActionConfirmPrev(false);
            }
        } else {
            setOpenActionConfirmPrev(false);
        }
        setLoadingPreviousExercice(false);
    }

    //Vérrouiller un exercice
    const handleVerrouillerExercice = () => {
        const listeNonCloture = listeExercice.filter(item => item.cloture == false);

        let oldestExercice = listeNonCloture.reduce((oldest, current) => {
            return current.date_debut < oldest.date_debut ? current : oldest;
        });

        setExerciceToLock(oldestExercice);
        const msgs = `Voulez vous vraiement verrouiller l'exercice du ${format(oldestExercice.date_debut, 'dd/MM/yyyy')} au ${format(oldestExercice.date_fin, 'dd/MM/yyyy')}?`;
        setMsgVerrExercice(msgs);
        setOpenActionConfirmVerrExercice(true);
    }

    const verrouillerExercice = (value) => {
        if (value) {
            const id_exercice = exerciceToLock.id;
            axios.post(`/paramExercice/verrouillerExercice`, { id_exercice, fileId }).then((response) => {
                const resData = response.data;
                if (resData.state) {
                    GetListeExercice();
                    toast.success("Exercice verrouillé");
                } else {
                    toast.error(resData.msg);
                }
            });
        }
        setOpenActionConfirmVerrExercice(false);
    }

    //Devérrouiller un exercice
    const handleDeverrouillerExercice = () => {
        const listeCloture = listeExercice.filter(item => item.cloture == true);

        let newestExercice = listeCloture.reduce((newest, current) => {
            return current.date_debut > newest.date_debut ? current : newest;
        });

        setExerciceToUnlock(newestExercice);
        const msgs = `Voulez vous vraiement déverrouiller l'exercice du ${format(newestExercice.date_debut, 'dd/MM/yyyy')} au ${format(newestExercice.date_fin, 'dd/MM/yyyy')}?`;
        setMsgDeverrExercice(msgs);
        setOpenActionConfirmDeverrExercice(true);
    }

    const deverrouillerExercice = (value) => {
        if (value) {
            const id_exercice = exerciceToUnlock.id;
            axios.post(`/paramExercice/deverrouillerExercice`, { id_exercice, fileId }).then((response) => {
                const resData = response.data;
                if (resData.state) {
                    GetListeExercice();
                    toast.success("Exercice déverrouillé");
                } else {
                    toast.error(resData.msg);
                }
            });
        }
        setOpenActionConfirmDeverrExercice(false);
    }

    //supprimer un exercice
    const saveSelectedExercice = (ids) => {
        setSelectedExerciceRow(ids);
    }

    const saveSelectedPeriode = (ids) => {
        setSelectedPeriodeRow(ids);
    }

    const handleDeleteExercice = () => {
        if (selectedExerciceRow.length > 1) {
            toast.error("Veuillez sélectionner un seul exercice avant de continuer.");
            return;
        }

        if (selectedExerciceRow.length === 0) {
            toast.error("Veuillez sélectionner un exercice avant de continuer.");
            return;
        }

        const selectedRow = listeExercice.filter(item => Number(item.id) === Number(selectedExerciceRow[0]));

        if (selectedRow) {
            if (selectedRow[0].cloture) {
                toast.error("Vous ne pouvez pas supprimer un exercice clôturé.");
            } else {
                let newestExercice = listeExercice.reduce((newest, current) => {
                    return current.date_debut > newest.date_debut ? current : newest;
                });

                let oldestExercice = listeExercice.reduce((oldest, current) => {
                    return current.date_debut < oldest.date_debut ? current : oldest;
                });

                if (newestExercice.date_fin === selectedRow[0].date_fin) {
                    const msgs = `Voulez vous vraiement supprimer l'exercice du ${format(newestExercice.date_debut, 'dd/MM/yyyy')} au ${format(newestExercice.date_fin, 'dd/MM/yyyy')}?`;
                    setMsgDeleteExercice(msgs);
                    setExerciceToDeleteId(selectedRow[0].id);
                    setExerciceToDeleteRang(selectedRow[0].rang);
                    setOpenActionConfirmDeleteExercice(true);
                } else {
                    if (oldestExercice.date_fin === selectedRow[0].date_fin) {
                        const msgs = `Voulez vous vraiement supprimer l'exercice du ${format(oldestExercice.date_debut, 'dd/MM/yyyy')} au ${format(oldestExercice.date_fin, 'dd/MM/yyyy')}?`;
                        setMsgDeleteExercice(msgs);
                        setExerciceToDeleteId(selectedRow[0].id);
                        setExerciceToDeleteRang(selectedRow[0].rang);
                        setOpenActionConfirmDeleteExercice(true);
                    } else {
                        toast.error("Un exercice antérieur et/ou suivant existe encore pour cet exercice sélectionné.");
                    }
                }
            }
        }
    }

    const handleDeletePeriode = () => {
        const selectedRow = listePeriode.find(item => Number(item.id) === Number(selectedPeriodeRow[0]));
        if (selectedRow) {
            setOpenActionConfirmDeletePeriode(true);
            setMsgDeletePeriode(`Voulez vous vraiement supprimer la période du ${format(selectedRow.date_debut, 'dd/MM/yyyy')} au ${format(selectedRow.date_fin, 'dd/MM/yyyy')} pour cette exercice ?`);
        }
    }

    const deletePeriode = async (value) => {
        if (value) {
            const id_periode = Number(selectedPeriodeRow[0]);
            if (id_periode) {
                await axios.delete(`/paramExercice/deletePeriode/${id_periode}`)
                    .then((response) => {
                        if (response?.data?.state) {
                            toast.success(response?.data?.message);
                            setIsRefreshedPeriode(prev => !prev);
                        } else {
                            toast.error(response?.data?.message);
                        }
                    })
            }
        }
        setOpenActionConfirmDeletePeriode(false);
    }

    const deleteExercice = (value) => {
        if (value) {
            const id_exerciceToDelete = exerciceToDeleteId;
            const rang = exerciceToDeleteRang;
            axiosPrivate.post(`/paramExercice/deleteExercice`, { id_exerciceToDelete, fileId, rang }).then((response) => {
                const resData = response.data;
                if (resData.state) {
                    GetListeExercice();
                    toast.success("Exercice supprimé");
                } else {
                    toast.error(resData.msg);
                }
            });
        }
        setOpenActionConfirmDeleteExercice(false);
    }

    const testIfRanExist = async () => {
        try {
            const response = await axios.post('/administration/ImportJournal/testIfRanExist', {
                id_dossier: Number(fileId),
                id_compte: Number(compteId)
            });
            const resData = response?.data;

            if (resData?.state) {
                setIdRan(resData.id);
                return resData?.exist;
            } else {
                toast.error(resData?.message || "Erreur inconnue");
                return false;
            }
        } catch (error) {
            toast.error(error.message);
            return false;
        }
    };

    const genererANouveau = async () => {
        const defaultDeviseData = listeDevise.find(val => val.par_defaut === true);
        if (!defaultDeviseData) {
            return toast.error('Veuillez sélectionner une devise par défaut dans le paramétrage CRM de ce dossier')
        }
        const ranExist = await testIfRanExist();
        if (!ranExist) {
            setOpenPopupCodeJournal(true);
            return;
        }
        setOpenPopupGenerateRan(true);
    }

    const handleDeleteANouveau = async (value) => {
        if (value) {
            const id_exercice = Number(selectedExerciceRow[0]);
            await axios.post(`/administration/traitementSaisie/deleteJournalRan`, { id_dossier: Number(fileId), id_exercice, id_compte: Number(compteId) })
                .then((response) => {
                    if (response?.data?.state) {
                        toast.success(response?.data?.message);
                    } else {
                        toast.error(response?.data?.message);
                    }
                })
        }
        setOpenPopupDeleteRan(false);
    }

    const handleOpenPopupDeleteRan = () => {
        setOpenPopupDeleteRan(true);
    }

    return (
        <Box>
            {noFile ? <PopupTestSelectedFile confirmationState={sendToHome} /> : null}

            {openActionConfirm ? <PopupActionConfirm msg={"Voulez-vous vraiment continuer la création de l'exercice suivant ?"} confirmationState={createNextExercice} isLoading={loadingCreateNextExercice} /> : null}
            {openActionConfirmPrev ? <PopupActionConfirm msg={"Voulez-vous vraiment continuer la création de l'exercice précédent ?"} confirmationState={createPreviewExercice} isLoading={loadingCreatePreviousExercice} /> : null}
            {openActionConfirmVerrExercice ? <PopupActionConfirm msg={msgVerrExercice} confirmationState={verrouillerExercice} /> : null}
            {openActionConfirmDeverrExercice ? <PopupActionConfirm msg={msgDeverrExercice} confirmationState={deverrouillerExercice} /> : null}
            {openActionConfirmDeleteExercice ? <PopupActionConfirm msg={msgDeleteExercice} isDelete={true} confirmationState={deleteExercice} /> : null}
            {openActionConfirmDeletePeriode && (<PopupActionConfirm msg={msgDeletePeriode} isDelete={true} confirmationState={deletePeriode} />)}
            {openPopupDeleteRan && (<PopupActionConfirm msg={"Voulez-vous vraiment supprimer toutes les écritures à nouveau de cet exercice ? Toutes les lettrages associées à ces écritures seront également supprimés"} isDelete={true} confirmationState={handleDeleteANouveau} />)}

            {
                openPopupCodejournal && (
                    <PopupCodeJouralNotExist
                        title={"La génération A-nouveaux a été intérompue"}
                        handleClose={() => setOpenPopupCodeJournal(false)}
                    />
                )
            }

            {
                openPopupGenerateRan && (
                    <PopupGenerateRan
                        handleClose={() => setOpenPopupGenerateRan(false)}
                        id_compte={Number(compteId)}
                        id_dossier={Number(fileId)}
                        selectedExerciceRow={selectedExerciceRow}
                        longeurCompte={longeurCompte}
                        listeExercice={listeExercice}
                        idRan={idRan}
                        defaultDeviseData={listeDevise.find(val => val.par_defaut === true)}
                    />
                )
            }

            {openDialogCreatePeriode && (
                <PopupAddPeriode
                    handleClose={handleCloseDialogCreatePeriode}
                    periodeForm={periodeForm}
                    handleSubmit={addPeriode}
                    open={openDialogCreatePeriode}
                />
            )}

            <form onSubmit={firstExerciceForm.handleSubmit}>
                <BootstrapDialog
                    onClose={handleCloseDialogCreateFirstExercice}
                    aria-labelledby="customized-dialog-title"
                    open={openDialogCreateFirstExercice}
                >
                    <DialogTitle sx={{ m: 0 }} id="customized-dialog-title" style={{ fontWeight: 'bold', width: '600px', backgroundColor: 'transparent' }}>
                        Création du premier exercice
                    </DialogTitle>

                    <IconButton
                        style={{ color: 'red', textTransform: 'none', outline: 'none' }}
                        aria-label="close"
                        onClick={handleCloseDialogCreateFirstExercice}
                        sx={{
                            position: 'absolute',
                            right: 8,
                            top: 8,
                            color: (theme) => theme.palette.grey[500],
                        }}
                    >
                        <CloseIcon />
                    </IconButton>

                    <DialogContent >
                        <Stack width={"95%"} height={"100%"} spacing={0} alignItems={'center'} alignContent={"center"}
                            direction={"column"} justifyContent={"center"} style={{ marginLeft: '10px' }}>
                            <Stack style={{ width: "100%" }} direction={'row'} alignContent={'baseline'} justifyContent={'space-between'} alignItems={'baseline'} spacing={2}>
                                <FormControl
                                    sx={{ width: "200px" }}
                                    error={firstExerciceForm.errors.date_debut && firstExerciceForm.touched.date_debut}
                                >
                                    <FormLabel id="datedebut-label" htmlFor="date_debut">
                                        <Typography level="title-date_debut">
                                            Date début :
                                        </Typography>

                                    </FormLabel>
                                    <Input
                                        type='date'
                                        name="date_debut"
                                        value={firstExerciceForm.values.date_debut}
                                        onChange={firstExerciceForm.handleChange}
                                        onBlur={firstExerciceForm.handleBlur}
                                        required
                                        slotProps={{
                                            button: {
                                                id: "niveau",
                                                "aria-labelledby": "niveau-label",
                                            },
                                        }}
                                    />
                                    <FormHelperText
                                        style={{
                                            marginLeft: 0,
                                            fontSize: "12px",
                                        }}
                                    >
                                        {firstExerciceForm.errors.date_debut &&
                                            firstExerciceForm.touched.date_debut &&
                                            firstExerciceForm.errors.date_debut}
                                    </FormHelperText>
                                </FormControl>

                                {/* <Typography sx={{ mt: 5 }} variant="body1" >
                                    au
                                </Typography> */}

                                <FormControl
                                    sx={{ width: "200px" }}
                                    error={firstExerciceForm.errors.date_fin && firstExerciceForm.touched.date_fin}
                                >
                                    <FormLabel id="datefint-label" htmlFor="date_fin">
                                        <Typography level="title-date_fin">
                                            Date fin :
                                        </Typography>

                                    </FormLabel>
                                    <Input
                                        type='date'
                                        name="date_fin"
                                        value={firstExerciceForm.values.date_fin}
                                        onChange={firstExerciceForm.handleChange}
                                        onBlur={firstExerciceForm.handleBlur}
                                        required
                                        slotProps={{
                                            button: {
                                                id: "niveau",
                                                "aria-labelledby": "niveau-label",
                                            },
                                        }}
                                    />
                                    <FormHelperText
                                        style={{
                                            marginLeft: 0,
                                            fontSize: "12px",
                                        }}
                                    >
                                        {firstExerciceForm.errors.date_fin &&
                                            firstExerciceForm.touched.date_fin &&
                                            firstExerciceForm.errors.date_fin}
                                    </FormHelperText>
                                </FormControl>
                            </Stack>
                        </Stack>
                    </DialogContent>

                    <DialogActions>
                        <Button autoFocus
                            style={{ backgroundColor: initial.theme, color: 'white', width: "100px", textTransform: 'none', outline: 'none' }}
                            type='submit'
                            onClick={handleCloseDialogCreateFirstExercice}
                        >
                            Annuler
                        </Button>
                        <Button autoFocus
                            disabled={!firstExerciceForm.isValid}
                            onClick={createFirstExercice}
                            style={{ backgroundColor: initial.theme, color: 'white', width: "100px", textTransform: 'none', outline: 'none' }}
                        >
                            Créer
                        </Button>
                    </DialogActions>
                </BootstrapDialog>
            </form>

            <TabContext value={"1"}>
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
                <TabPanel value="1">
                    <Stack style={{ marginTop: 0 }} width={"100%"} height={"100%"} spacing={2} alignItems={"flex-start"} justifyContent={"stretch"}>
                        <Typography variant='h6' sx={{ color: "black" }} align='left'>Paramétrages : Exercices</Typography>

                        <Stack
                            direction="row"
                            spacing={3}
                            sx={{ width: "100%" }}
                            alignItems="flex-start"
                        >
                            <Stack
                                flex={1}
                                minWidth={0}
                            >
                                <Stack width={"100%"} height={"30px"} spacing={0} alignItems={"center"} alignContent={"center"}
                                    direction={"row"} style={{ marginLeft: "0px", marginTop: "20px", justifyContent: "right" }}>
                                    <Stack width={"100%"} height={"30px"} spacing={0.5} justifyContent={'space-between'}
                                        direction={"row"} alignContent={'baseline'} sx={{ mb: 2 }} >
                                        <Stack sx={{ fontSize: 18 }}>Exercice</Stack>
                                        <Stack
                                            direction={'row'}
                                            spacing={0.5}
                                            alignContent={'start'}
                                        >
                                            <Tooltip title="Ajouter l'exercice précédent">
                                                <IconButton
                                                    disabled={!canAdd}
                                                    onClick={handleCreateNextExercicePrev}
                                                    variant="contained"
                                                    style={{
                                                        width: "35px", height: '35px',
                                                        borderRadius: "2px", borderColor: "transparent",
                                                        backgroundColor: initial.theme,
                                                        textTransform: 'none', outline: 'none'
                                                    }}
                                                >
                                                    <BsChevronLeft style={{ width: '25px', height: '25px', color: 'white' }} />
                                                </IconButton>
                                            </Tooltip>

                                            <Tooltip title="Ajouter l'exercice suivant">
                                                <IconButton
                                                    disabled={!canAdd}
                                                    onClick={handleCreateNextExercice}
                                                    variant="contained"
                                                    style={{
                                                        width: "35px", height: '35px',
                                                        borderRadius: "2px", borderColor: "transparent",
                                                        backgroundColor: initial.theme,
                                                        textTransform: 'none', outline: 'none'
                                                    }}
                                                >
                                                    <BsChevronRight style={{ width: '25px', height: '25px', color: 'white' }} />
                                                </IconButton>
                                            </Tooltip>

                                            <Tooltip title="Vérrouiller un exercice">
                                                <IconButton
                                                    onClick={handleVerrouillerExercice}
                                                    variant="contained"
                                                    style={{
                                                        width: "35px", height: '35px',
                                                        borderRadius: "2px", borderColor: "transparent",
                                                        backgroundColor: initial.theme,
                                                        textTransform: 'none', outline: 'none'
                                                    }}
                                                >
                                                    <HiLockClosed style={{ width: '25px', height: '25px', color: 'white' }} />
                                                </IconButton>
                                            </Tooltip>

                                            <Tooltip title="Déverrouiller un exercice">
                                                <IconButton
                                                    onClick={handleDeverrouillerExercice}
                                                    variant="contained"
                                                    style={{
                                                        width: "35px", height: '35px',
                                                        borderRadius: "2px", borderColor: "transparent",
                                                        backgroundColor: initial.theme,
                                                        textTransform: 'none', outline: 'none'
                                                    }}
                                                >
                                                    <BsFillUnlockFill style={{ width: '25px', height: '25px', color: 'white' }} />
                                                </IconButton>
                                            </Tooltip>

                                            <Button
                                                disabled={selectedExerciceRow.length === 0}
                                                onClick={genererANouveau}
                                                variant="contained"
                                                style={{
                                                    textTransform: 'none',
                                                    outline: 'none',
                                                    backgroundColor: initial.theme,
                                                    color: "white",
                                                    height: "35px",
                                                }}
                                                startIcon={<IoMdAddCircle size={20} />}
                                            >
                                                Générer A-nouveaux
                                            </Button>

                                            <Button
                                                disabled={selectedExerciceRow.length === 0}
                                                onClick={handleOpenPopupDeleteRan}
                                                variant="contained"
                                                style={{
                                                    textTransform: 'none',
                                                    outline: 'none',
                                                    backgroundColor: '#F44336',
                                                    color: "white",
                                                    height: "35px",
                                                }}
                                                startIcon={<MdCancel size={20} />}
                                            >
                                                Annuler A-nouveaux
                                            </Button>

                                            <Tooltip title="Supprimer un exercice">
                                                <span>
                                                    <IconButton
                                                        disabled={!canDelete || selectedExerciceRow.length === 0}
                                                        onClick={handleDeleteExercice}
                                                        variant="contained"
                                                        style={{
                                                            width: "35px", height: '35px',
                                                            borderRadius: "2px", borderColor: "transparent",
                                                            backgroundColor: initial.button_delete_color,
                                                            textTransform: 'none', outline: 'none'
                                                        }}
                                                    >
                                                        <IoMdTrash style={{ width: '50px', height: '50px', color: 'white' }} />
                                                    </IconButton>
                                                </span>
                                            </Tooltip>
                                        </Stack>
                                    </Stack>
                                </Stack>

                                <Stack
                                    sx={{ height: 600 }}
                                    style={{
                                        marginTop: '0px'
                                    }}
                                >
                                    <DataGrid
                                        disableMultipleSelection={DataGridStyle.disableMultipleSelection}
                                        disableColumnSelector={DataGridStyle.disableColumnSelector}
                                        disableDensitySelector={DataGridStyle.disableDensitySelector}

                                        localeText={frFR.components.MuiDataGrid.defaultProps.localeText}
                                        disableRowSelectionOnClick
                                        disableSelectionOnClick={true}
                                        slots={{ toolbar: QuickFilter }}
                                        sx={{
                                            ...DataGridStyle.sx,
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
                                            '& .MuiDataGrid-columnHeaders': {
                                                backgroundColor: initial.theme,
                                                color: 'white',
                                                fontWeight: 'bold',
                                            },
                                        }}
                                        rowHeight={DataGridStyle.rowHeight}
                                        columnHeaderHeight={DataGridStyle.columnHeaderHeight}
                                        editMode='row'
                                        rows={listeExercice}
                                        columns={ExerciceColumnHeader}
                                        initialState={{
                                            pagination: {
                                                paginationModel: { page: 0, pageSize: 100 },
                                            },
                                        }}
                                        pageSizeOptions={[50, 100]}
                                        pagination={DataGridStyle.pagination}
                                        checkboxSelection={DataGridStyle.checkboxSelection}
                                        columnVisibilityModel={{
                                            id: false,
                                        }}
                                        onRowSelectionModelChange={ids => {
                                            const single = Array.isArray(ids) && ids.length ? [ids[ids.length - 1]] : [];
                                            saveSelectedExercice(single);
                                        }}
                                        rowSelectionModel={selectedExerciceRow}
                                    />
                                </Stack>
                            </Stack>
                            <Stack
                                flex={0.6}
                                minWidth={0}
                            >
                                <Stack width={"100%"} height={"30px"} spacing={0} alignItems={"center"} alignContent={"center"}
                                    direction={"row"} style={{ marginLeft: "0px", marginTop: "20px", justifyContent: "right" }}>
                                    <Stack width={"100%"} height={"30px"} spacing={0.5} justifyContent={'space-between'}
                                        direction={"row"} alignContent={'baseline'}>
                                        <Stack sx={{ fontSize: 18 }}>Période</Stack>

                                        <Stack
                                            direction={'row'}
                                            spacing={0.5}
                                        >
                                            <Tooltip title="Ajouter une ligne">
                                                <div>
                                                    <IconButton
                                                        disabled={!canAdd || selectedExerciceRow.length === 0}
                                                        variant="contained"
                                                        onClick={handleOpenDialogCreatePeriode}
                                                        style={{
                                                            width: "35px", height: '35px',
                                                            borderRadius: "2px", borderColor: "transparent",
                                                            backgroundColor: initial.theme,
                                                            textTransform: 'none', outline: 'none'
                                                        }}
                                                    >
                                                        <TbPlaylistAdd style={{ width: '25px', height: '25px', color: 'white' }} />
                                                    </IconButton>
                                                </div>
                                            </Tooltip>

                                            <Tooltip title="Supprimer la ligne sélectionné">
                                                <div>
                                                    <IconButton
                                                        disabled={!canDelete || selectedPeriodeRow.length === 0}
                                                        onClick={handleDeletePeriode}
                                                        variant="contained"
                                                        style={{
                                                            width: "35px", height: '35px',
                                                            borderRadius: "2px", borderColor: "transparent",
                                                            backgroundColor: initial.button_delete_color,
                                                            textTransform: 'none', outline: 'none'
                                                        }}
                                                    >
                                                        <IoMdTrash style={{ width: '50px', height: '50px', color: 'white' }} />
                                                    </IconButton>
                                                </div>
                                            </Tooltip>

                                        </Stack>

                                    </Stack>
                                </Stack>

                                <Stack
                                    sx={{ height: 600 }}
                                    style={{
                                        marginTop: '0px'
                                    }}
                                >
                                    <DataGrid
                                        disableMultipleSelection={DataGridStyle.disableMultipleSelection}
                                        disableColumnSelector={DataGridStyle.disableColumnSelector}
                                        disableDensitySelector={DataGridStyle.disableDensitySelector}

                                        localeText={frFR.components.MuiDataGrid.defaultProps.localeText}
                                        disableRowSelectionOnClick
                                        disableSelectionOnClick={true}
                                        slots={{ toolbar: QuickFilter }}
                                        sx={{
                                            ...DataGridStyle.sx,
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
                                            '& .MuiDataGrid-columnHeaders': {
                                                backgroundColor: initial.theme,
                                                color: 'white',
                                                fontWeight: 'bold',
                                            },
                                        }}
                                        rowHeight={DataGridStyle.rowHeight}
                                        columnHeaderHeight={DataGridStyle.columnHeaderHeight}
                                        editMode='row'
                                        rows={listePeriode}
                                        columns={PeriodColumnHeader}
                                        initialState={{
                                            pagination: {
                                                paginationModel: { page: 0, pageSize: 100 },
                                            },
                                        }}
                                        pageSizeOptions={[50, 100]}
                                        pagination={DataGridStyle.pagination}
                                        checkboxSelection={DataGridStyle.checkboxSelection}
                                        columnVisibilityModel={{
                                            id: false,
                                        }}
                                        onRowSelectionModelChange={ids => {
                                            const single = Array.isArray(ids) && ids.length ? [ids[ids.length - 1]] : [];
                                            saveSelectedPeriode(single);
                                        }}
                                        rowSelectionModel={selectedPeriodeRow}
                                    />
                                </Stack>
                            </Stack>
                        </Stack>
                    </Stack>
                </TabPanel>
            </TabContext>
        </Box >
    )
}
