import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Typography, Stack, Box, Tab, FormHelperText, Button, Badge } from '@mui/material';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import SaveAltIcon from '@mui/icons-material/SaveAlt';
import LogoutIcon from '@mui/icons-material/Logout';
import useAuth from '../../../../hooks/useAuth';
import { jwtDecode } from 'jwt-decode';
import axios from '../../../../../config/axios';
import toast from 'react-hot-toast';
import { init } from '../../../../../init';
import PopupTestSelectedFile from '../../../componentsTools/popupTestSelectedFile';
import { InfoFileStyle } from '../../../componentsTools/InfosFileStyle';
import { TabContext, TabPanel } from '@mui/lab';
import TabList from '@mui/lab/TabList';
import { format } from 'date-fns';
import { useFormik } from 'formik';
import * as Yup from "yup";
import Papa from 'papaparse';
import PopupViewDetailsImportJournal from '../../../componentsTools/popupViewDetailsImportJournal';
import PopupActionConfirm from '../../../componentsTools/popupActionConfirm';
import ImportProgressBar from '../../../componentsTools/ImportProgressBar';
import VirtualTableImportJournal from '../../../componentsTools/Administration/VirtualTableImportJournal';
import usePermission from '../../../../hooks/usePermission';
import useSSEImport from '../../../../hooks/useSSEImport';
import PopupCodeJouralNotExist from './PopupCodeJouralNotExist';

export default function ImportJournal() {
    const [valSelectCptDispatch, setValSelectCptDispatch] = useState('None');
    const { canAdd, canModify, canDelete, canView } = usePermission();

    let initial = init[0];
    const [fileInfos, setFileInfos] = useState('');
    const [fileId, setFileId] = useState(0);
    const { id } = useParams();
    const [noFile, setNoFile] = useState(false);

    const [selectedExerciceId, setSelectedExerciceId] = useState(0);
    const [selectedPeriodeId, setSelectedPeriodeId] = useState(0);
    const [selectedPeriodeChoiceId, setSelectedPeriodeChoiceId] = useState(0);
    const [listeExercice, setListeExercice] = useState([]);
    const [listeSituation, setListeSituation] = useState([]);
    const [openPopupCodejournal, setOpenPopupCodeJournal] = useState(false);

    const [journalData, setJournalData] = useState([]);
    const [planComptable, setPlanComptable] = useState([]);
    const [codeJournal, setCodeJournal] = useState([]);
    const [devises, setDevises] = useState([]);
    const [msgAnomalie, setMsgAnomalie] = useState([]);
    const [couleurBoutonAnomalie, setCouleurBoutonAnomalie] = useState('white');
    const [nbrAnomalie, setNbrAnomalie] = useState(0);
    const [openDetailsAnomalie, setOpenDetailsAnomalie] = useState(false);
    const [fileTypeCSV, setFileTypeCSV] = useState(true);
    const [openDialogConfirmImport, setOpenDialogConfirmImport] = useState(false);
    const [codeJournalToCreate, setCodeJournalToCreate] = useState([]);
    const [compteToCreateGen, setCompteToCreateGen] = useState([]);
    const [compteToCreateAux, setCompteToCreateAux] = useState([]);

    const [traitementJournalWaiting, setTraitementJournalWaiting] = useState(false);
    const [traitementJournalMsg, setTraitementJournalMsg] = useState('');
    const [progressValue, setProgressValue] = useState(0);
    const [longeurCompteStd, setLongeurCompteStd] = useState(0);

    //récupération infos de connexion
    const { auth } = useAuth();
    const decoded = auth?.accessToken ? jwtDecode(auth.accessToken) : undefined;
    const compteId = decoded.UserInfo.compteId || null;
    const userId = decoded.UserInfo.userId || null;
    const navigate = useNavigate();

    // Hook SSE pour la progression en temps réel
    const { isImporting, progress: sseProgress, message: sseMessage, currentLine, totalLines, startImport } = useSSEImport();

    // Synchroniser les valeurs SSE avec l'affichage
    useEffect(() => {
        if (isImporting) {
            setProgressValue(sseProgress);
            const displayMessage = currentLine > 0 && totalLines > 0
                ? `${sseMessage} (${currentLine}/${totalLines} lignes)`
                : sseMessage;
            setTraitementJournalMsg(displayMessage);
        }
    }, [isImporting, sseProgress, sseMessage, currentLine, totalLines]);

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
        GetListeExercice(idFile);
    }, [id]);

    const GetInfosIdDossier = (id) => {
        axios.get(`/home/FileInfos/${id}`).then((response) => {
            const resData = response.data;

            if (resData.state) {
                setFileInfos(resData.fileInfos[0]);
                setLongeurCompteStd(resData.fileInfos[0]?.longcomptestd);
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

    const columnsTable = [
        {
            id: 'EcritureNum',
            label: 'ID',
            minWidth: 50,
            align: 'left',
            isnumber: false
        },
        {
            id: 'datesaisie',
            label: 'Date saisie',
            minWidth: 150,
            align: 'center',
            isnumber: false
        },
        {
            id: 'EcritureDate',
            label: 'Date écriture',
            minWidth: 150,
            align: 'center',
            isnumber: false
        },
        {
            id: 'CompteNum',
            label: 'Compte gen.',
            minWidth: 150,
            align: 'left',
            isnumber: false
        },
        {
            id: 'CompAuxNum',
            label: 'Compte centr.',
            minWidth: 150,
            align: 'left',
            isnumber: false
        },
        {
            id: 'EcritureLib',
            label: 'Libellé gen.',
            minWidth: 380,
            align: 'left',
            isnumber: false
        },
        {
            id: 'Debit',
            label: 'Débit',
            minWidth: 150,
            align: 'right',
            format: (value) => {
                const num = Number(value?.toString().replace(',', '.'));
                return !isNaN(num)
                    ? num.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    : '';
            },
            isnumber: true
        },
        {
            id: 'Credit',
            label: 'Crédit',
            minWidth: 150,
            align: 'right',
            format: (value) => {
                const num = Number(value?.toString().replace(',', '.'));
                return !isNaN(num)
                    ? num.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    : '';
            },
            isnumber: true
        },
        {
            id: 'JournalCode',
            label: 'Journal',
            minWidth: 80,
            align: 'left',
            isnumber: false
        },
        {
            id: 'PieceRef',
            label: 'Pièces',
            minWidth: 150,
            align: 'left',
            isnumber: false
        },
        {
            id: 'PieceDate',
            label: 'Pièce date',
            minWidth: 150,
            align: 'center',
            isnumber: false
        },
        {
            id: 'Idevise',
            label: 'Devise',
            minWidth: 70,
            align: 'center',
            isnumber: false
        },
        {
            id: 'EcritureLet',
            label: 'Lettrage',
            minWidth: 90,
            align: 'left',
            isnumber: false
        },
        {
            id: 'DateLet',
            label: 'Date let.',
            minWidth: 100,
            align: 'center',
            isnumber: false
        },
        {
            id: 'ModeRglt',
            label: 'Mode règl.',
            minWidth: 150,
            align: 'left',
            isnumber: false
        },
        {
            id: 'DateRglt',
            label: 'Date règl.',
            minWidth: 120,
            align: 'center',
            isnumber: false
        },
        {
            id: 'Analytique',
            label: 'Analytique',
            minWidth: 150,
            align: 'left',
            isnumber: false
        },
    ];

    //Récupérer la liste des exercices
    const GetListeExercice = (id) => {
        axios.get(`/paramExercice/listeExercice/${id}`).then((response) => {
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
                toast.error("une erreur est survenue lors de la récupération de la liste des exercices");
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
                toast.error("une erreur est survenue lors de la récupération de la liste des exercices");
            }
        })
    }

    //Choix exercice
    const handleChangeExercice = (exercice_id) => {
        setSelectedExerciceId(exercice_id);
        setSelectedPeriodeChoiceId("0");
        setListeSituation(listeExercice?.filter((item) => item.id === exercice_id));
        setSelectedPeriodeId(exercice_id);
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

    //Récupération du plan comptable
    const recupPlanComptable = (fileId, compteId) => {
        axios.post(`/paramPlanComptable/pc`, { fileId, compteId }).then((response) => {
            const resData = response.data;
            if (resData.state) {
                const list = Array.isArray(resData.liste) ? resData.liste : [];
                const unique = Object.values(
                    list.reduce((acc, r) => {
                        const k = String(r.compte || '');
                        if (!acc[k]) acc[k] = r;
                        return acc;
                    }, {})
                );
                setPlanComptable(unique);
            } else {
                toast.error(resData.msg);
            }
        });
    }

    // Récupérer la liste des devises existantes pour le dossier/compte
    const GetListeDevises = (id) => {
        if (!compteId || !id) { setDevises([]); return; }
        axios.get(`/devises/devise/compte/${compteId}/${id}`).then((res) => {
            const data = Array.isArray(res.data) ? res.data : [];
            setDevises(data);
        }).catch(() => setDevises([]));
    }

    //récupération données liste code journaux
    const GetListeCodeJournaux = (id) => {
        axios.get(`/paramCodeJournaux/listeCodeJournaux/${id}`).then((response) => {
            const resData = response.data;
            if (resData.state) {
                setCodeJournal(resData.list);
            } else {
                setCodeJournal([]);
                toast.error(resData.msg);
            }
        });
    }

    useEffect(() => {
        if (fileId && selectedExerciceId && compteId) {
            GetListeCodeJournaux(fileId);
            recupPlanComptable(fileId, compteId);
            GetListeDevises(fileId);
        }
    }, [fileId, selectedExerciceId, compteId]);

    //Valeur du listbox choix Type exercice-----------------------------------------------------
    const handleChangeType = (event) => {
        formikImport.setFieldValue('type', event.target.value);

        if (event.target.value === 'CSV') {
            setFileTypeCSV(true);
        } else {
            setFileTypeCSV(false);
        }
    };

    //Valeur du listbox choix compte à dispatcher----------------------------------------------------
    const handleChangeCptDispatch = (event) => {
        formikImport.setFieldValue('choixImport', event.target.value);
        setValSelectCptDispatch(event.target.value);
    };

    //Formulaire pour l'import du journal
    const formikImport = useFormik({
        initialValues: {
            idCompte: compteId,
            idDossier: fileId,
            idExercice: selectedPeriodeId,
            type: 'CSV',
            choixImport: '',
            journalData: [],
        },
        validationSchema: Yup.object({
            type: Yup.string().required("Veuillez choisir le type de fichier à importer"),
            choixImport: Yup.string().required("Veuillez choisir l'action à faire"),
            compteassocie: Yup.string()
        }),
        onSubmit: (values) => {
            handleOpenDialogConfirmImport();
        },
    });

    //download modele d'import
    const handleDownloadModel = () => {
        const fileUrl = '../../../../../public/modeleImport/modeleImportJournal.csv';
        const link = document.createElement('a');
        link.href = fileUrl;
        link.download = 'ModeleImportJournal';
        link.click();
    }

    //validation des entêtes si c'est bon ou pas
    const validateHeaders = (headers) => {

        let expectedHeaders = [];
        const expectedHeadersCSV = ["EcritureNum", "datesaisie", "EcritureDate", "JournalCode", "CompteNum", "CompAuxNum", "PieceRef", "PieceDate", "EcritureLib", "Debit", "Credit", "Idevise", "EcritureLet", "DateLet", "ModeRglt", "Analytique"];
        const expectedHeadersFEC = ["EcritureNum", "EcritureDate", "JournalCode", "CompteNum", "CompAuxNum", "PieceRef", "PieceDate", "EcritureLib", "Debit", "Credit", "Idevise", "EcritureLet", "DateLet", "Analytique"];

        if (fileTypeCSV) {
            expectedHeaders = expectedHeadersCSV;
        } else {
            expectedHeaders = expectedHeadersFEC;
        }

        // Comparer les en-têtes du CSV aux en-têtes attendus (sauf Analytique qui est optionnelle)
        const requiredHeaders = expectedHeaders.filter(h => h !== 'Analytique');
        const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));
        if (missingHeaders.length > 0) {
            toast.error(`Les en-têtes du modèle d'import suivants sont manquants : ${missingHeaders.join(', ')}`);
            return false;
        }
        return true;
    };

    //Test d'existance de code journal ou de compte par rapport aux données dans paramétrage
    const existance = (param, liste) => {
        const missingCode = liste.filter(item => !param.includes(item));
        return missingCode;
    };

    const padCompte = (val) => {
        if (val === null || val === undefined) return "";
        const s = String(val).trim();
        if (s === "" || s === "0") return "";
        return s.padEnd(longeurCompteStd, "0").slice(0, longeurCompteStd);
    };

    const parseCSVNumber = (value) => {
        if (!value) return 0;

        const cleaned = value.toString()
            .replace(/\s/g, '')
            .replace(/\./g, '')
            .replace(',', '.');

        const num = Number(cleaned);
        return isNaN(num) ? 0 : num;
    };

    const pluralizeCompte = (nbr) => {
        if (nbr === 1) {
            return `Ce compte n'existe`;
        }
        if (nbr > 1) {
            return `Ces ${nbr} comptes n'existent`;
        }
    }

    const pluralizeDevise = (nbr) => {
        if (nbr === 1) {
            return `Ce devise n'existe`;
        }
        if (nbr > 1) {
            return `Ces ${nbr} devises n'existent`;
        }
    }

    const pluralizeCodeJournal = (nbr) => {
        if (nbr === 1) {
            return `Ce code journal n'existe`;
        }
        if (nbr > 1) {
            return `Ces ${nbr} codes journaux n'existent`;
        }
    }

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const testIfRanExist = async () => {
        try {
            const response = await axios.post('/administration/ImportJournal/testIfRanExist', {
                id_dossier: Number(fileId),
                id_compte: Number(compteId)
            });
            const resData = response?.data;

            if (resData?.state) {
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

    const getAllCodeRan = async () => {
        try {
            const response = await axios.post('/administration/ImportJournal/getAllCodeRan', {
                id_dossier: Number(fileId),
                id_compte: Number(compteId)
            });
            const resData = response?.data;
            return resData?.list;
        } catch (error) {
            toast.error(error.message);
        }
    }

    const handleFileSelect = async (event) => {
        const file = event.target.files[0];

        if (file) {
            const ranExist = await testIfRanExist();
            if (!ranExist) {
                setOpenPopupCodeJournal(true);
                return console.log('Code journal de report à nouveau non trouvé, veuillez en créer un');
            }
            const codeJournauxRan = await getAllCodeRan();
            Papa.parse(file, {
                complete: (result) => {
                    const headers = result.meta.fields;

                    if (validateHeaders(headers)) {
                        setTraitementJournalMsg('Traitement du journal en cours...');
                        setTraitementJournalWaiting(true);
                        setProgressValue(0);

                        //réinitialiser les compteurs d'anomalies
                        const couleurAnom = "#EB5B00";
                        let nbrAnom = 0;
                        let msg = [];
                        setMsgAnomalie('');
                        setCouleurBoutonAnomalie('white');
                        setNbrAnomalie(0);

                        const normalizeCode = (v) => String(v || '').trim().toUpperCase();
                        const listeUniqueCodeJnlInitial = [...new Set(result.data.map(item => normalizeCode(item.JournalCode)))];
                        const listeUniqueCodeJnl = listeUniqueCodeJnlInitial.filter(item => item !== '');

                        const listeUniqueCompteInitial = [
                            ...new Set(
                                result.data.flatMap(item => [
                                    item.CompteNum,
                                    item.CompAuxNum
                                ]).filter(Boolean)
                            )
                        ];

                        const listeUniqueCompte = listeUniqueCompteInitial
                            .filter(item => item !== '')
                            .map(val => val.toString().padEnd(longeurCompteStd, "0").slice(0, longeurCompteStd))

                        let DataWithId = [];
                        if (fileTypeCSV) {
                            DataWithId = result.data.map((row, index) => ({ ...row, id: index, CompteLib: '', CompAuxLib: '' }));
                        } else {
                            DataWithId = result.data;
                        }

                        const activeData = DataWithId.filter(r => {
                            return (
                                r &&
                                (
                                    r.EcritureNum ||
                                    r.CompteNum ||
                                    r.JournalCode ||
                                    r.Debit ||
                                    r.Credit
                                )
                            );
                        });

                        const totalDebit = DataWithId.reduce((acc, item) => acc + parseCSVNumber(item.Debit), 0);
                        const totalCredit = DataWithId.reduce((acc, item) => acc + parseCSVNumber(item.Credit), 0);

                        const ecart = totalDebit - totalCredit;

                        const EPSILON = 0.00001;

                        if (Math.abs(ecart) > EPSILON) {
                            if (ecart > 0) {
                                msg.push(
                                    `Le journal n'est pas équilibré : Débit supérieur au Crédit de ${ecart.toLocaleString('fr-FR', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    })}`
                                );
                            } else {
                                msg.push(
                                    `Le journal n'est pas équilibré : Crédit supérieur au Débit de ${Math.abs(ecart).toLocaleString('fr-FR', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    })}`
                                );
                            }

                            nbrAnom += 1;
                            setNbrAnomalie(nbrAnom);
                        }

                        const compteNonValideStd = Number(longeurCompteStd) > 0
                            ? listeUniqueCompte.some((c) => String(c || '').trim() !== '' && String(c || '').trim().length !== Number(longeurCompteStd))
                            : false;

                        if (compteNonValideStd) {
                            msg.push('Attention, la longueur des comptes dans le fichier csv est différente de celle des comptes dans le paramétrage CRM du dossier.');
                            nbrAnom = nbrAnom + 1;
                            setNbrAnomalie(nbrAnom);
                            setCouleurBoutonAnomalie(couleurAnom);
                        }

                        //stocker en 2 variables les comptes généraux et comptesaux pour la création
                        const listeUniqueCompteGenInitial = [
                            ...new Set(
                                activeData
                                    .map(item => item.CompteNum)
                                    .filter(val => val && val !== 0)
                                    .map(val => val.toString().padEnd(longeurCompteStd, "0").slice(0, longeurCompteStd))
                            )
                        ];
                        const listeUniqueCompteGen = listeUniqueCompteGenInitial.filter(item => item !== '');

                        const listeUniqueCompteAuxInitial = [
                            ...new Set(
                                activeData
                                    .map(item => item.CompAuxNum)
                                    .filter(val => val && val !== 0)
                                    .map(val => val.toString().padEnd(longeurCompteStd, "0").slice(0, longeurCompteStd))
                            )
                        ];
                        const listeUniqueCompteAux = listeUniqueCompteAuxInitial.filter(item => item !== '');

                        const ListeCodeJnlParams = [...new Set(codeJournal.map(item => normalizeCode(item.code)))];
                        const ListeCompteParams = [...new Set(planComptable.map(item => item.compte))];

                        const codeJournalNotInParams = existance(ListeCodeJnlParams, listeUniqueCodeJnl);
                        // const codeJournalNotInParams = [];
                        const compteNotInParams = existance(ListeCompteParams, listeUniqueCompte);
                        // const compteNotInParams = [];

                        const compteNotInParamsGen = existance(ListeCompteParams, listeUniqueCompteGen);
                        const compteNotInParamsAux = existance(ListeCompteParams, listeUniqueCompteAux);

                        // Devises: détecter les codes manquants et les vides
                        const listeUniqueDevisesInitial = [...new Set(activeData.map(item => (item.Idevise || '').trim()))];
                        const listeUniqueDevises = listeUniqueDevisesInitial.filter(item => item !== '');
                        const listeDevisesParams = [...new Set((devises || []).map(d => d.code))];
                        const devisesNotInParams = existance(listeDevisesParams, listeUniqueDevises);
                        // const devisesNotInParams = [];
                        const numberOfEmptyDevises = activeData.filter(row => !row.Idevise || row.Idevise.trim() === '').length;

                        const codeJournalNotInParamsFiltered = [...new Set(codeJournalNotInParams.map(val => val))];

                        if (codeJournalNotInParamsFiltered.length > 0) {
                            msg.push(`${pluralizeCodeJournal(codeJournalNotInParamsFiltered.length)} pas encore dans votre dossier : ${codeJournalNotInParamsFiltered.join(', ')}`);
                            nbrAnom = nbrAnom + 1;
                            setNbrAnomalie(nbrAnom);
                            setCouleurBoutonAnomalie(couleurAnom);

                            // Construire { code, libelle } à partir du fichier importé (JournalLib si présent)
                            const missingCodeWithLib = codeJournalNotInParamsFiltered.map((code) => {
                                const row = activeData.find(r => normalizeCode(r.JournalCode) === code);
                                const libelle = row && (row.JournalLib || row.JournalLabel || row.Journal || '')
                                    ? (row.JournalLib || row.JournalLabel || row.Journal)
                                    : `Journal ${code}`;
                                return { code, libelle };
                            });
                            setCodeJournalToCreate(missingCodeWithLib);
                        }

                        const compteNotInParamsFiltered = [...new Set(compteNotInParams.map(val => padCompte(val)))];

                        if (compteNotInParamsFiltered.length > 0) {
                            msg.push(`${pluralizeCompte(compteNotInParamsFiltered.length)} pas encore dans votre dossier : ${compteNotInParamsFiltered.join(', ')}`);

                            nbrAnom = nbrAnom + 1;
                            setNbrAnomalie(nbrAnom);
                            setCouleurBoutonAnomalie(couleurAnom);
                        }

                        const devisesNotInParamsFiltered = [... new Set(devisesNotInParams.map(val => val))];

                        // Anomalies devises manquantes (seront créées automatiquement)
                        if (devisesNotInParamsFiltered.length > 0) {
                            msg.push(`${pluralizeDevise(devisesNotInParamsFiltered.length)} pas encore dans votre dossier : ${devisesNotInParamsFiltered.join(', ')}`);
                            nbrAnom = nbrAnom + 1;
                            setNbrAnomalie(nbrAnom);
                            setCouleurBoutonAnomalie(couleurAnom);
                        }

                        // Anomalies devises vides (par défaut MGA)
                        if (numberOfEmptyDevises > 0) {
                            const hasMGA = listeDevisesParams.includes('MGA') || devisesNotInParamsFiltered.includes('MGA');
                            const suffix = hasMGA ? '' : " (MGA sera créé au besoin)";
                            msg.push(`Certaines lignes n'ont pas de devise : elles utiliseront la devise par défaut 'MGA'${suffix}.`);
                            nbrAnom = nbrAnom + 1;
                            setNbrAnomalie(nbrAnom);
                            setCouleurBoutonAnomalie(couleurAnom);
                        }

                        setMsgAnomalie(msg);

                        // Déterminer la période de l'exercice sélectionné (période active)
                        const getExerciseRange = () => {
                            const all = [...(listeSituation || []), ...(listeExercice || [])];
                            const ex = all.find(e => e.id === selectedPeriodeId) || {};
                            const start = ex.datedebut || ex.date_debut || ex.debut || ex.startDate || null;
                            const end = ex.datefin || ex.date_fin || ex.fin || ex.endDate || null;
                            return { start, end };
                        };

                        const parseToDate = (str) => {
                            if (!str) return null;
                            if (typeof str === 'string') str = str.trim();
                            let d = null;
                            if (typeof str === 'string') {
                                if (str.includes('/')) {
                                    const [day, month, year] = str.split('/').map(s => s.trim());
                                    d = new Date(`${year}-${month}-${day}`);
                                } else if (/^\d{8}$/.test(str)) {
                                    d = new Date(`${str.substring(0, 4)}-${str.substring(4, 6)}-${str.substring(6, 8)}`);
                                } else {
                                    d = new Date(str);
                                }
                            } else {
                                d = new Date(str);
                            }
                            if (isNaN(d.getTime())) return null;
                            d.setHours(0, 0, 0, 0);
                            return d;
                        };

                        // Filtrage des lignes hors exercice si au moins une borne est disponible
                        const { start, end } = getExerciseRange();
                        let finalData = DataWithId;
                        const dStart = parseToDate(start);
                        const dEnd = parseToDate(end);

                        const dateDebut = formatDate(start);
                        const dateFin = formatDate(end);

                        if (dStart || dEnd) {
                            const missingDate = activeData.filter(r => !parseToDate(r.EcritureDate) && !codeJournauxRan.includes(r.JournalCode));
                            const withDate = activeData.filter(r => !!parseToDate(r.EcritureDate));

                            const outOfRange = withDate.filter(r => {
                                const d = parseToDate(r.EcritureDate);
                                const afterStart = dStart ? (d && d >= dStart) : true;
                                const beforeEnd = dEnd ? (d && d <= dEnd) : true;

                                if (codeJournauxRan.includes(r.JournalCode)) return false;

                                return !(afterStart && beforeEnd);
                            });

                            if (missingDate.length > 0) {
                                msg.push("Certaines lignes n'ont pas de date d'écriture valide, elles seront ignorées.");
                                nbrAnom = nbrAnom + 1;
                                setNbrAnomalie(nbrAnom);
                                setCouleurBoutonAnomalie(couleurAnom);
                            }
                            if (outOfRange.length > 0) {
                                msg.push(`Certaines lignes ne seront pas importées car leur date d'écriture n'est pas entre ${dateDebut} et ${dateFin}.`);
                                nbrAnom = nbrAnom + 1;
                                setNbrAnomalie(nbrAnom);
                                setCouleurBoutonAnomalie(couleurAnom);
                            }

                            finalData = withDate.filter(r => {
                                const d = parseToDate(r.EcritureDate);
                                const afterStart = dStart ? (d && d >= dStart) : true;
                                const beforeEnd = dEnd ? (d && d <= dEnd) : true;

                                if (codeJournauxRan.includes(r.JournalCode)) return true;

                                return afterStart && beforeEnd;
                            });
                        }

                        const finalDataCompteFormatted = finalData.map(item => {
                            const date = new Date(start);
                            const exerciceStartFormatted = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;

                            return {
                                ...item,
                                CompteNum: padCompte(item.CompteNum),
                                CompAuxNum: padCompte(item.CompAuxNum),
                                exerciceStart: exerciceStartFormatted
                            };
                        });

                        setJournalData(finalDataCompteFormatted);
                        formikImport.setFieldValue('journalData', finalDataCompteFormatted);

                        const mapGen = new Map();

                        finalDataCompteFormatted.forEach(item => {
                            const compteGen = item.CompteNum;
                            const compteAux = item.CompAuxNum;

                            if (compteNotInParamsGen.includes(compteGen) && !mapGen.has(compteGen)) {
                                mapGen.set(compteGen, {
                                    CompteNum: compteGen,
                                    CompteLib: item.EcritureLib,
                                    CompAuxNum: compteAux
                                });
                            }
                        });

                        const cptToCreateGen = [...mapGen.values()];

                        const mapAux = new Map();

                        DataWithId.forEach(item => {
                            const compte = item.CompAuxNum?.toString()
                                .padEnd(longeurCompteStd, "0")
                                .slice(0, longeurCompteStd);

                            if (compteNotInParamsAux.includes(compte) && !mapAux.has(compte)) {
                                mapAux.set(compte, {
                                    CompAuxNum: compte,
                                    CompAuxLib: item.EcritureLib,
                                    CompteNum: item.CompteNum?.toString()?.padEnd(longeurCompteStd, "0")?.slice(0, longeurCompteStd) || ''
                                });
                            }
                        });

                        const cptToCreateAux = [...mapAux.values()];

                        setCompteToCreateGen(cptToCreateGen);
                        setCompteToCreateAux(cptToCreateAux);

                        setMsgAnomalie(msg);

                        event.target.value = null;
                        setProgressValue(100);

                        setTimeout(() => {
                            setTraitementJournalWaiting(false);
                            setProgressValue(0);
                        }, 800);

                        handleOpenAnomalieDetails();
                    }
                },
                header: true,
                skipEmptyLines: true,
            });
        }
    }

    //afficher ou non les détails des anomalies de l'import
    const handleOpenAnomalieDetails = () => {
        setOpenDetailsAnomalie(true);
    }

    const handleCloseAnomalieDetails = (value) => {
        setOpenDetailsAnomalie(value);
    }

    //import du journal
    const handleOpenDialogConfirmImport = () => {
        formikImport.setFieldValue("idCompte", compteId);
        formikImport.setFieldValue("idDossier", fileId);
        formikImport.setFieldValue("idExercice", selectedPeriodeId);

        setOpenDialogConfirmImport(true);
    }

    const handleCloseDialogConfirmImport = () => {
        setOpenDialogConfirmImport(false);
    }

    //création des journaux qui n'existe pas encore avant import journal
    const createCodeJournalNotExisting = async () => {
        const response = await axios.post(`/administration/importJournal/createNotExistingCodeJournal`, { compteId, fileId, codeJournalToCreate });
        const resData = response.data;
        return resData.list;
    }

    //création des comptes qui n'existe pas encore avant import journal
    const createCompteNotExisting = async () => {
        const response = await axios.post(`/administration/importJournal/createNotExistingCompte`, { compteId, fileId, compteToCreateGen, compteToCreateAux });
        const resData = response.data;
        const list = Array.isArray(resData.list) ? resData.list : [];
        const unique = Object.values(
            list.reduce((acc, r) => {
                const k = String(r.compte || '');
                if (!acc[k]) acc[k] = r;
                return acc;
            }, {})
        );
        setPlanComptable(unique);
        return unique;
    }

    const handleImportJournal = async (value) => {
        if (value) {
            const UpdatedPlanComptable = await createCompteNotExisting();
            const UpdatedCodeJournal = await createCodeJournalNotExisting();

            if (!Array.isArray(UpdatedCodeJournal)) {
                toast.error("Un problème est survenu lors de la création des codes journaux manquants.");
            }

            if (!Array.isArray(UpdatedPlanComptable)) {
                toast.error("Un problème est survenu lors de la création des comptes manquants.");
            }

            if (Array.isArray(UpdatedCodeJournal) && Array.isArray(UpdatedPlanComptable)) {
                setTraitementJournalMsg('Importation du journal en cours...');
                setTraitementJournalWaiting(true);
                setProgressValue(0);
                // transmettre les bornes de l'exercice sélectionné pour filtrer côté backend
                const allPeriods = [...(listeSituation || []), ...(listeExercice || [])];
                const selectedObj = allPeriods.find(x => x.id === selectedPeriodeId) || {};
                const periodeStart = selectedObj.datedebut || selectedObj.date_debut || selectedObj.debut || selectedObj.startDate || null;
                const periodeEnd = selectedObj.datefin || selectedObj.date_fin || selectedObj.fin || selectedObj.endDate || null;

                // Utiliser SSE pour la progression en temps réel
                startImport(
                    '/administration/importJournal/importJournalWithProgress',
                    { compteId, userId, fileId, selectedPeriodeId, fileTypeCSV, valSelectCptDispatch, journalData, longeurCompteStd, periodeStart, periodeEnd },
                    (eventData) => {
                        // Succès
                        setTimeout(() => {
                            setTraitementJournalMsg('');
                            setTraitementJournalWaiting(false);
                            setProgressValue(0);
                            toast.success(eventData.message, {
                                duration: 15000
                            });
                            setJournalData([]);
                            setNbrAnomalie(0);
                            setMsgAnomalie([]);
                            setOpenDetailsAnomalie(false);
                            recupPlanComptable();
                        }, 800);
                    },
                    (error) => {
                        // Erreur
                        setTraitementJournalMsg('');
                        setTraitementJournalWaiting(false);
                        setProgressValue(0);
                        toast.error(error || "Import non effectué", {
                            duration: 15000
                        });
                    }
                );
            }

            handleCloseDialogConfirmImport();
        } else {
            handleCloseDialogConfirmImport();
        }
    }

    return (
        <Box>
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
                openDialogConfirmImport
                    ?
                    <PopupActionConfirm
                        msg={"Voulez-vous vraiment importer le journal en cours?"}
                        confirmationState={handleImportJournal}
                    />
                    :
                    null
            }
            {
                openDetailsAnomalie
                    ?
                    <PopupViewDetailsImportJournal
                        msg={msgAnomalie}
                        confirmationState={handleCloseAnomalieDetails}
                    />
                    :
                    null
            }
            {
                openPopupCodejournal && (
                    <PopupCodeJouralNotExist
                        handleClose={() => setOpenPopupCodeJournal(false)}
                    />
                )
            }
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
                <TabPanel value="1" style={{ height: '85%' }}>
                    <form onSubmit={formikImport.handleSubmit}>
                        <Stack width={"100%"} height={"100%"} spacing={4} alignItems={"flex-start"} alignContent={"flex-start"} justifyContent={"stretch"}>
                            <Typography variant='h6' sx={{ color: "black" }} align='left'>Administration - Import Journal</Typography>

                            <Stack width={"100%"} height={"80px"} spacing={4} alignItems={"left"} alignContent={"center"} direction={"row"} style={{ marginLeft: "0px", marginTop: "20px" }}>
                                <FormControl variant="standard" sx={{ m: 1, minWidth: 250 }}>
                                    <InputLabel id="demo-simple-select-standard-label">Exercice:</InputLabel>
                                    <Select
                                        labelId="demo-simple-select-standard-label"
                                        id="demo-simple-select-standard"
                                        value={selectedExerciceId}
                                        label={"valSelect"}
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
                                        value={selectedPeriodeChoiceId}
                                        label={"valSelect"}
                                        onChange={(e) => handleChangePeriode(e.target.value)}
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
                                        label={"valSelect"}
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

                            <Stack width={"100%"} height={"60px"} spacing={2} alignItems={"center"} alignContent={"center"} direction={"row"} style={{ marginLeft: "0px", marginTop: "0px" }}>
                                <FormControl variant="standard" sx={{ m: 0 }}>
                                    <InputLabel id="demo-simple-select-standard-label">Type de fichier</InputLabel>
                                    <Select
                                        labelId="demo-simple-select-standard-label"
                                        id="demo-simple-select-standard"
                                        value={formikImport.values.type}
                                        label={"valSelectType"}
                                        onChange={handleChangeType}
                                        sx={{ width: "140px", display: "flex", justifyContent: "left", alignItems: "flex-start", alignContent: "flex-start", textAlign: "left" }}
                                    >
                                        <MenuItem key={"CSV"} value={"CSV"}>CSV</MenuItem>
                                        <MenuItem key={"FEC"} value={"FEC"}>FEC</MenuItem>
                                    </Select>

                                    <FormHelperText style={{ color: 'red' }}>
                                        {formikImport.errors.type && formikImport.touched.type && formikImport.errors.type}
                                    </FormHelperText>
                                </FormControl>

                                <FormControl variant="standard" sx={{ m: 1, minWidth: 250 }}>
                                    <InputLabel id="demo-simple-select-standard-label">Choix d'import</InputLabel>
                                    <Select
                                        labelId="demo-simple-select-standard-label"
                                        id="demo-simple-select-standard"
                                        value={formikImport.values.choixImport}
                                        label={"valSelectCptDispatch"}
                                        onChange={handleChangeCptDispatch}
                                        sx={{ width: "300px", display: "flex", justifyContent: "left", alignItems: "flex-start", alignContent: "flex-start", textAlign: "left" }}
                                    >
                                        <MenuItem key={"None"} value={""}>
                                            <em>None</em>
                                        </MenuItem>
                                        <MenuItem key={"ECRASER"} value={"ECRASER"}>Ecraser les données déjà existantes</MenuItem>
                                        <MenuItem key={"UPDATE"} value={"UPDATE"}>Importer sans écraser</MenuItem>
                                    </Select>

                                    <FormHelperText style={{ color: 'red' }}>
                                        {formikImport.errors.choixImport && formikImport.touched.choixImport && formikImport.errors.choixImport}
                                    </FormHelperText>
                                </FormControl>

                                <Stack spacing={1} width={"400px"} height={"50px"} direction={"row"}
                                    style={{ border: '2px dashed rgba(5,96,116,0.60)', marginLeft: "30px", paddingLeft: "20px" }}
                                    alignContent={"center"} justifyContent={"left"} alignItems={"center"}
                                >
                                    <Typography variant='h7' sx={{ color: "black", fontWeight: "bold" }} align='left'>
                                        Télécharger ici le modèle d'import
                                    </Typography>

                                    <List style={{ marginLeft: "10px" }}>
                                        <ListItem style={{ width: "100px", justifyContent: "center" }}>
                                            <ListItemButton
                                                disabled={!fileTypeCSV}
                                                onClick={fileTypeCSV ? handleDownloadModel : undefined}
                                            >
                                                <ListItemIcon >
                                                    <LogoutIcon
                                                        style={{
                                                            width: "40px",
                                                            height: "30px",
                                                            color: fileTypeCSV ? 'rgba(5,96,116,0.60)' : '#bdbdbd',
                                                            transform: "rotate(270deg)"
                                                        }}
                                                    />
                                                </ListItemIcon>
                                            </ListItemButton>
                                        </ListItem>
                                    </List>
                                </Stack>

                                <Stack spacing={1} width={"350px"} height={"50px"} direction={"row"}
                                    style={{ border: '2px dashed rgba(5,96,116,0.60)', marginLeft: "30px", paddingLeft: "20px" }}
                                    alignContent={"center"} justifyContent={"left"} alignItems={"center"}
                                    backgroundColor={'rgba(5,96,116,0.05)'}
                                >
                                    <input
                                        type="file"
                                        accept={fileTypeCSV ? ".csv" : ".txt"}
                                        // webkitdirectory="true"
                                        onChange={handleFileSelect}
                                        style={{ display: 'none' }}
                                        id="fileInput"
                                    />

                                    <Typography variant='h7' sx={{ color: "black", fontWeight: "bold" }} align='left'>
                                        Importer depuis le fichier
                                    </Typography>

                                    <List style={{ marginLeft: "10px" }}>
                                        <ListItem style={{ width: "100px", justifyContent: "center" }}>
                                            <ListItemButton onClick={() => document.getElementById('fileInput').click()}>
                                                <ListItemIcon >
                                                    <SaveAltIcon style={{ width: "40px", height: "30px", color: 'rgba(5,96,116,0.60)' }} />
                                                </ListItemIcon>
                                            </ListItemButton>
                                        </ListItem>
                                    </List>
                                </Stack>

                                <Badge badgeContent={nbrAnomalie} color="warning">
                                    <Button
                                        onClick={handleOpenAnomalieDetails}
                                        variant="contained"
                                        style={{
                                            height: "50px",
                                            textTransform: 'none',
                                            outline: 'none',
                                            backgroundColor: initial.theme,
                                            color: couleurBoutonAnomalie
                                        }}
                                    >
                                        Anomalies
                                    </Button>
                                </Badge>


                                <Button
                                    type='submit'
                                    variant="contained"
                                    style={{
                                        height: "50px",
                                        textTransform: 'none',
                                        outline: 'none',
                                        backgroundColor: initial.theme
                                    }}
                                >
                                    Importer
                                </Button>
                            </Stack>

                            <ImportProgressBar
                                isVisible={traitementJournalWaiting}
                                message={traitementJournalMsg}
                                variant="determinate"
                                progress={progressValue}
                            />

                            <VirtualTableImportJournal tableHeader={columnsTable} tableRow={journalData} />

                        </Stack>
                    </form>
                </TabPanel>
            </TabContext>
        </Box>
    )
}
