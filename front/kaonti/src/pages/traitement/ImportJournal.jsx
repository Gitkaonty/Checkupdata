import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box, Typography, Stack, Button, Paper, Grid,
  Breadcrumbs, Link, MenuItem, Select, Divider,
  LinearProgress, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Dialog, DialogTitle, DialogContent, IconButton, List,
  Chip
} from '@mui/material';
import {
  NavigateNext, FileUploadOutlined,
  DownloadOutlined, CloudUploadOutlined, ErrorOutline,
  CheckCircleOutline, HistoryOutlined, Close, HomeOutlined, ChevronRight, DashboardOutlined
} from '@mui/icons-material';
import { jwtDecode } from 'jwt-decode';
import { DataGrid, frFR } from '@mui/x-data-grid';

import { format } from 'date-fns';
import { useFormik } from 'formik';
import * as Yup from "yup";
import useAuth from '../../hooks/useAuth';
import usePermission from '../../hooks/usePermission';
import useSSEImport from '../../hooks/useSSEImport';
import useAxiosPrivate from '../../../config/axiosPrivate';
import Papa from 'papaparse';
import axios from '../../../config/axios';
import toast from 'react-hot-toast';
import PopupTestSelectedFile from '../../components/PopupTestSelectedFile';
import ConfirmActionDialog from '../../components/ConfirmActionDialog';

const ImportJournal = () => {
  const [importMode, setImportMode] = useState('update');
  const [exercise, setExercise] = useState('2024');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [openAnomalies, setOpenAnomalies] = useState(false); // État pour la popup

  const headerStyle = {
    fontWeight: 800, color: '#94A3B8', fontSize: '0.65rem',
    textTransform: 'uppercase', letterSpacing: '0.05rem',
    py: 1, borderBottom: '1px solid #E2E8F0', bgcolor: '#FCFDFF'
  };


  const [valSelectCptDispatch, setValSelectCptDispatch] = useState('None');
  const { canAdd, canModify, canDelete, canView } = usePermission();
  const axiosPrivate = useAxiosPrivate();

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
  const [activeStep, setActiveStep] = useState(0);
  const [ranCodesCreated, setRanCodesCreated] = useState(false);
  const [ranCodesList, setRanCodesList] = useState([]);
  const [ranCodeInput, setRanCodeInput] = useState('');
  const [nextRanId, setNextRanId] = useState(1);
  const [importLaunched, setImportLaunched] = useState(false);
  const [nbrImported, setNbrImported] = useState(0);
  const [nbrTotalLines, setNbrTotalLines] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  //récupération infos de connexion
  const { auth } = useAuth();
  const decoded = auth?.accessToken ? jwtDecode(auth.accessToken) : undefined;
  const compteId = decoded.UserInfo.compteId || null;
  const userId = decoded.UserInfo.userId || null;
  const compteName = decoded.UserInfo.compte || 'Espace Client';
  const navigate = useNavigate();

  // Hook SSE pour la progression en temps réel
  const { isImporting, progress: sseProgress, message: sseMessage, currentLine, totalLines, startImport } = useSSEImport();

  const anomalies = (Array.isArray(msgAnomalie) ? msgAnomalie : [])
    .filter(Boolean)
    .map((erreur, index) => ({
      ligne: index + 1,
      erreur: String(erreur)
    }));

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

  useEffect(() => {
    if (openPopupCodejournal) {
      toast.error("Veuillez créer le code journal RAN avant d'importer.");
      setOpenPopupCodeJournal(false);
    }
  }, [openPopupCodejournal]);

  useEffect(() => {
    setUploadProgress(Number(progressValue) || 0);
  }, [progressValue]);

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
    navigate('/home');
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
    axios.get(`/api/exercices/listeExercice/${id}`).then((response) => {
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
    axios.get(`/api/exercices/listeSituation/${id}`).then((response) => {
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
    axios.post(`/param/comptabilite/pc`, { fileId, compteId }).then((response) => {
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
    axios.get(`/param/codejournals/liste/${id}`).then((response) => {
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
      if (!Array.isArray(journalData) || journalData.length === 0) {
        toast.error('Veuillez sélectionner un fichier avant de lancer l\'import');
        return;
      }

      setImportLaunched(true);
      setNbrTotalLines(journalData.length); // Stocker le nombre total de lignes

      setOpenDialogConfirmImport(true);
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
    return s;
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
      const response = await axios.post('/traitement/ImportJournal/testIfRanExist', {
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
      const response = await axios.post('/traitement/ImportJournal/getAllCodeRan', {
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
    await processFile(file);
  };

  const processFile = async (file) => {
    if (!file) return;

      const ranExist = await testIfRanExist();
      if (!ranExist) {
        setOpenPopupCodeJournal(true);
        return;
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
            setMsgAnomalie([]);
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
              .map(val => String(val).trim())

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

            // const compteNonValideStd = Number(longeurCompteStd) > 0
            //     ? listeUniqueCompte.some((c) => String(c || '').trim() !== '' && String(c || '').trim().length !== Number(longeurCompteStd))
            //     : false;

            // if (compteNonValideStd) {
            //     msg.push('Attention, la longueur des comptes dans le fichier csv est différente de celle des comptes dans le paramétrage CRM du dossier.');
            //     nbrAnom = nbrAnom + 1;
            //     setNbrAnomalie(nbrAnom);
            //     setCouleurBoutonAnomalie(couleurAnom);
            // }

            //stocker en 2 variables les comptes généraux et comptesaux pour la création
            const listeUniqueCompteGenInitial = [
              ...new Set(
                activeData
                  .map(item => item.CompteNum)
                  .filter(val => val && val !== 0)
                  .map(val => String(val).trim())
              )
            ];
            const listeUniqueCompteGen = listeUniqueCompteGenInitial.filter(item => item !== '');

            const listeUniqueCompteAuxInitial = [
              ...new Set(
                activeData
                  .map(item => item.CompAuxNum)
                  .filter(val => val && val !== 0)
                  .map(val => String(val).trim())
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

            const ranCodesNormalized = Array.isArray(codeJournauxRan)
              ? codeJournauxRan.map((c) => String(c || '').trim().toUpperCase())
              : [];

            const dateDebut = formatDate(start);
            const dateFin = formatDate(end);

            if (dStart || dEnd) {
              const missingDate = activeData.filter(r => {
                const jnl = String(r.JournalCode || '').trim().toUpperCase();
                return !parseToDate(r.EcritureDate) && !ranCodesNormalized.includes(jnl);
              });
              const withDate = activeData.filter(r => !!parseToDate(r.EcritureDate));

              const outOfRange = withDate.filter(r => {
                const d = parseToDate(r.EcritureDate);
                const afterStart = dStart ? (d && d >= dStart) : true;
                const beforeEnd = dEnd ? (d && d <= dEnd) : true;

                const jnl = String(r.JournalCode || '').trim().toUpperCase();
                if (ranCodesNormalized.includes(jnl)) return false;

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

                const jnl = String(r.JournalCode || '').trim().toUpperCase();
                if (ranCodesNormalized.includes(jnl)) return true;

                return afterStart && beforeEnd;
              });
            }

            const finalDataCompteFormatted = finalData.map(item => {
              const date = new Date(start);
              const exerciceStartFormatted = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;

              return {
                ...item,
                CompteNum: String(item.CompteNum || '').trim(),
                CompAuxNum: String(item.CompAuxNum || '').trim(),
                exerciceStart: exerciceStartFormatted
              };
            });

            setJournalData(finalDataCompteFormatted);
            formikImport.setFieldValue('journalData', finalDataCompteFormatted);
            setImportLaunched(false);
            setNbrImported(0);
            setNbrTotalLines(0);

            const mapGen = new Map();

            finalDataCompteFormatted.forEach(item => {
              const compteGen = item.CompteNum;
              const compteAux = item.CompAuxNum;

              if (compteNotInParamsGen.includes(compteGen) && !mapGen.has(compteGen)) {
                mapGen.set(compteGen, {
                  CompteNum: compteGen,
                  // CompteLib: item.CompteLib,
                  CompteLib: item.CompteLib || item.EcritureLib || `Compte général ${compteGen}`,
                  CompAuxNum: compteAux
                });
              }
            });

            const cptToCreateGen = [...mapGen.values()];

            const mapAux = new Map();

            DataWithId.forEach(item => {
              const compte = String(item.CompAuxNum || '').trim();

              if (compteNotInParamsAux.includes(compte) && !mapAux.has(compte)) {
                mapAux.set(compte, {
                  CompAuxNum: compte,
                  // CompAuxLib: item.EcritureLib,
                  CompAuxLib: item.EcritureLib || item.CompteLib || `Compte auxiliaire ${compte}`,
                  CompteNum: String(item.CompteNum || '').trim() || ''
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
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);

    const file = event.dataTransfer.files[0];
    await processFile(file);
  };

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
    const response = await axios.post(`/traitement/ImportJournal/createNotExistingCodeJournal`, { compteId, fileId, codeJournalToCreate });
    const resData = response.data;
    return resData.list;
  }

  //création des comptes qui n'existe pas encore avant import journal
  const createCompteNotExisting = async () => {
    const response = await axios.post(`/traitement/ImportJournal/createNotExistingCompte`, { compteId, fileId, compteToCreateGen, compteToCreateAux });
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
          '/traitement/ImportJournal/importJournalWithProgress',
          { compteId, userId, fileId, selectedPeriodeId, fileTypeCSV, valSelectCptDispatch, journalData, longeurCompteStd, periodeStart, periodeEnd },
          (eventData) => {
            // Succès
            setTimeout(() => {
              setTraitementJournalMsg('');
              setTraitementJournalWaiting(false);
              setProgressValue(0);
              setNbrImported(eventData.nbrligne ?? eventData.total ?? eventData.current ?? 0);
              toast.success(eventData.message, {
                duration: 15000
              });
              setJournalData([]);
              setNbrAnomalie(0);
              setMsgAnomalie([]);
              setOpenDetailsAnomalie(false);
              recupPlanComptable(fileId, compteId);
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
  const buttonStyle = {
    minWidth: 120,
    height: 32,
    px: 2,
    textTransform: 'none',
    fontSize: '0.85rem',
    borderRadius: '6px',
    boxShadow: 'none',
    '& .MuiTouchRipple-root': {
      display: 'none',
    },
    '&:focus': {
      outline: 'none',
    },
    '&.Mui-focusVisible': {
      outline: 'none',
      boxShadow: 'none',
    },

    '&:hover': {
      boxShadow: 'none',
      backgroundColor: 'action.hover',
      border: 'none',
    },

    '&.Mui-disabled': {
      opacity: 0.4
    },
  };

  const steps = ['Création du code journal À nouveau', 'Import du fichier', 'Gestion des types'];

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
    // Réinitialiser importLaunched quand on revient à l'étape 1
    if (activeStep === 1) {
      setImportLaunched(false);
      setNbrImported(0);
      setNbrTotalLines(0);
    }
  };

  const handleFinish = () => {
    navigate(`/tab/dashboard/${fileId}`);
  };

  const handleReset = () => {
    setActiveStep(0);
    setRanCodesCreated(false);
    setRanCodesList([]);
    setNextRanId(1);
    setJournalData([]);
    setNbrAnomalie(0);
    setMsgAnomalie([]);
  };

  // Fonctions pour la gestion des codes RAN dans Step 1
  const handleAddRanCode = () => {
    if (!ranCodeInput.trim()) {
      toast.error('Veuillez saisir un code');
      return;
    }

    // Vérifier si le code existe déjà dans la liste
    if (ranCodesList.some(row => row.code.toUpperCase() === ranCodeInput.trim().toUpperCase())) {
      toast.error('Ce code existe déjà dans la liste');
      return;
    }

    const newCode = {
      id: nextRanId,
      code: ranCodeInput.trim().toUpperCase(),
      libelle: 'Report à Nouveau',
      type: 'RAN'
    };
    setRanCodesList([...ranCodesList, newCode]);
    setNextRanId(nextRanId + 1);
    setRanCodeInput(''); // Réinitialiser le champ
  };

  const handleDeleteRanCode = (id) => {
    setRanCodesList(ranCodesList.filter((row) => row.id !== id));
  };

  const handleSaveRanCodes = async () => {
    // Debug: vérifier les valeurs     
    if (!compteId || !fileId) {
      toast.error('Erreur: compteId ou fileId non défini. Veuillez rafraîchir la page.');
      return;
    }

    // Vérifier que tous les codes sont remplis
    const emptyCodes = ranCodesList.filter(row => !row.code || row.code.trim() === '');
    if (emptyCodes.length > 0) {
      toast.error('Veuillez remplir tous les codes journal');
      return;
    }

    // Vérifier si les codes existent déjà dans le dossier (pour un autre type que RAN)
    const existingCodes = codeJournal.map(cj => cj.code.toUpperCase());
    const duplicateWithExisting = ranCodesList.filter(row =>
      existingCodes.includes(row.code.trim().toUpperCase())
    );
    if (duplicateWithExisting.length > 0) {
      toast.error(`Les codes suivants existent déjà : ${duplicateWithExisting.map(r => r.code).join(', ')}`);
      return;
    }

    // Vérifier si un code de type RAN existe déjà dans le dossier
    const existingRanCode = codeJournal.find(cj => cj.type?.toUpperCase() === 'RAN');

    // Créer ou mettre à jour le code RAN
    try {
      const row = ranCodesList[0]; // On ne prend que le premier code (un seul RAN par dossier)

      const codeData = {
        idCompte: Number(compteId),
        idDossier: Number(fileId),
        idCode: existingRanCode ? existingRanCode.id : 0, // ID existant ou 0 pour nouveau
        code: row.code.trim().toUpperCase(),
        libelle: row.libelle || 'Report à Nouveau',
        type: 'RAN',
        compteassocie: ''
      };

      const response = await axiosPrivate.post(`/paramCodeJournaux/codeJournauxAdd`, codeData);

      if (response.data.state) {
        toast.success(existingRanCode
          ? 'Code journal RAN mis à jour avec succès'
          : 'Code journal RAN créé avec succès');
        setRanCodesCreated(true);
        GetListeCodeJournaux(fileId);
        handleNext();
      } else {
        toast.error(response.data.msg || 'Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('[handleSaveRanCodes] error:', error);
      toast.error('Erreur lors de la sauvegarde du code RAN: ' + (error.response?.data?.msg || error.message));
    }
  };

  if (noFile) {
    return <PopupTestSelectedFile confirmationState={sendToHome} />;
  }

  return (
    <Box
      sx={{
        px: 3,
        py: 2,
        bgcolor: '#F8FAFC',
        height: 'calc(100vh - 120px)',
        width: 'calc(100vw - 120px)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxSizing: 'border-box',
        position: 'absolute',
        // left: '72px', // Décale le bloc pour qu'il commence après la sidebar
      }}
    >

      {/* --- HEADER COMPACT --- */}
      <Box sx={{ mb: 2, flexShrink: 0 }}>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1 }}>
          <Chip
            label={compteName}
            sx={{
              borderRadius: '4px',
              bgcolor: '#F1F5F9',
              color: '#475569',
              fontWeight: 700,
              fontSize: '0.95rem',
              border: '1px solid #E2E8F0',
              height: 24,
            }}
          />
          <Divider orientation="vertical" flexItem sx={{ height: 16, my: 'auto', borderColor: '#CBD5E1' }} />
          <Breadcrumbs
            separator={<NavigateNext fontSize="small" />}
            sx={{ '& .MuiTypography-root': { fontSize: '0.85rem', fontWeight: 600 } }}
          >
            <Link underline="hover" color="inherit" href="/dashboard"
              sx={{ display: 'flex', alignItems: 'center' }}
            >
              <DashboardOutlined sx={{ mr: 0.5, fontSize: 20 }} /> Dashboard
            </Link>
            <Typography color="text.primary" sx={{ fontWeight: 600, color: '#64748B' }}>
              Import journal
            </Typography>
          </Breadcrumbs>
        </Stack>

        <Stack direction="column" spacing={1.5} sx={{ mt: 2 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <FileUploadOutlined sx={{ color: '#6366F1', fontSize: 24 }} />
            <Typography
              variant="h5"
              sx={{ fontWeight: 900, color: '#1E293B', letterSpacing: '-0.5px' }}
            >
              Import Journal
            </Typography>
          </Stack>

          <Stack
            direction="row"
            alignItems="center"
            sx={{
              p: 0.5,
              bgcolor: '#FFFFFF',
              borderRadius: '10px',
              border: '1px solid #E2E8F0',
              width: 'fit-content',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
          >
            <Box sx={{ px: 2, py: 0.5 }}>
              <Box sx={{ mb: 2 }}>
                <Typography sx={{ fontWeight: 500, mb: 0.5, color: '#666', fontSize: '0.85rem' }}>
                  Exercice
                </Typography>
                <Select
                  fullWidth
                  size="small"
                  value={selectedExerciceId}
                  onChange={(e) => handleChangeExercice(e.target.value)}
                  sx={{
                    height: 24,
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: '#1E293B',
                    minWidth: 100,
                    '& .MuiSelect-select': { py: 0 }
                  }}
                >
                  {listeExercice.map((option) => (
                    <MenuItem key={option.id} value={option.id} sx={{ fontSize: '0.9rem' }}>
                      {format(option.date_debut, "dd/MM/yyyy")} - {format(option.date_fin, "dd/MM/yyyy")}
                    </MenuItem>
                  ))}
                </Select>
              </Box>
              {/* <Select
                value={exercise}
                onChange={(e) => setExercise(e.target.value)}
                variant="standard"
                disableUnderline
                size="small"
                sx={{
                  height: 24,
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: '#1E293B',
                  minWidth: 100,
                  '& .MuiSelect-select': { py: 0 }
                }}
              >
                <MenuItem value="2024">Exercice 2024</MenuItem>
                <MenuItem value="2025">Exercice 2025</MenuItem>
              </Select> */}
            </Box>
          </Stack>
        </Stack>
      </Box>

      {/* --- ZONE DE CONFIGURATION --- */}
      <Grid container spacing={2} sx={{ mb: 2, flexShrink: 0 }}>
        <Grid item xs={12} md={7}>
          <Paper
            variant="outlined"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            sx={{
              p: 2,
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: 3,
              border: isDragging ? '2px dashed #6366F1' : '1px dashed #6366F1',
              bgcolor: isDragging ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.02)',
              height: '100%',
              boxSizing: 'border-box',
              transition: 'all 0.2s ease',
            }}
          >
            <CloudUploadOutlined sx={{ fontSize: 32, color: '#6366F1', flexShrink: 0 }} />
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Typography
                variant="body2"
                sx={{ fontWeight: 700, cursor: 'pointer' }}
                onClick={() => document.getElementById("fileInput").click()}
              >
                Glissez votre fichier ici ou{' '}
                <span style={{ color: '#6366F1' }}>parcourez</span>
              </Typography>
              <Typography variant="caption" color="textSecondary">
                XLSX, CSV (Max 10Mo)
              </Typography>
            </Box>

            <input
              type="file"
              accept={fileTypeCSV ? ".csv" : ".txt"}
              onChange={handleFileSelect}
              style={{ display: "none" }}
              id="fileInput"
            />

            <Divider orientation="vertical" flexItem />

            <Box sx={{ minWidth: 180, flexShrink: 0 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', display: 'block' }}>
                Type de fichier
              </Typography>
              <Select
                value={formikImport.values.type}
                onChange={handleChangeType}
                displayEmpty
                fullWidth
                size="small"
                sx={{ height: 32, fontSize: '0.8rem' }}
              >
                <MenuItem value="CSV" sx={{ fontSize: '0.9rem' }}>CSV</MenuItem>
                <MenuItem value="FEC" sx={{ fontSize: '0.9rem' }}>FEC</MenuItem>
              </Select>
            </Box>

            <Divider orientation="vertical" flexItem />
            <Box sx={{ minWidth: 180, flexShrink: 0 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', display: 'block' }}>
                Mode d'import
              </Typography>
              <Select
                value={formikImport.values.choixImport}
                onChange={handleChangeCptDispatch}
                displayEmpty
                fullWidth
                size="small"
                sx={{ height: 32, fontSize: '0.8rem' }}
              >
                <MenuItem value="" sx={{ fontSize: '0.9rem' }}>
                  <em>None</em>
                </MenuItem>
                <MenuItem value="ECRASER" sx={{ fontSize: '0.9rem' }}>
                  Ecraser les données déjà existantes
                </MenuItem>
                <MenuItem value="UPDATE" sx={{ fontSize: '0.9rem' }}>
                  Importer sans écraser
                </MenuItem>
              </Select>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={5}>
          <Stack direction="row" spacing={1} sx={{ height: '100%' }}>
            <Stack spacing={1} sx={{ flexGrow: 1, minWidth: 0 }}>
              <Button
                variant="outlined"
                startIcon={<DownloadOutlined />}
                disabled={!fileTypeCSV}
                onClick={fileTypeCSV ? handleDownloadModel : undefined}
                fullWidth
                size="small"
                sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '8px', height: 36 }}
              >
                Modèle Excel
              </Button>
              <Box>
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, fontSize: '0.65rem' }}>
                    Progression : {uploadProgress}%
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#EF4444', fontWeight: 800, fontSize: '0.65rem' }}>
                    {nbrAnomalie} Erreurs
                  </Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={uploadProgress}
                  sx={{
                    height: 4,
                    borderRadius: 2,
                    bgcolor: '#E2E8F0',
                    '& .MuiLinearProgress-bar': { bgcolor: '#6366F1' }
                  }}
                />
              </Box>
            </Stack>

            {/* --- BOUTON ROUGE CARRÉ POUR ANOMALIES --- */}
            <Button
              variant="contained"
              onClick={() => setOpenAnomalies(true)}
              disabled={nbrAnomalie === 0}
              sx={{
                minWidth: 80,
                width: 80,
                flexShrink: 0,
                bgcolor: '#FEE2E2',
                color: '#EF4444',
                borderRadius: '10px',
                border: '1px solid #FCA5A5',
                '&:hover': { bgcolor: '#FCA5A5', color: '#B91C1C' },
                display: 'flex',
                flexDirection: 'column',
                gap: 0.5,
                boxShadow: 'none',
              }}
            >
              <ErrorOutline sx={{ fontSize: 24 }} />
              <Typography sx={{ fontSize: '0.6rem', fontWeight: 900 }}>DETAIL</Typography>
            </Button>
          </Stack>
        </Grid>
      </Grid>

      {/* --- DATAGRID --- */}
      <Paper
        variant="outlined"
        sx={{
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
          flexGrow: 1,          // prend tout l'espace restant
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,         // CRITIQUE : permet au flexGrow de fonctionner
        }}
      >
        <Box
          sx={{
            px: 2,
            py: 1,
            bgcolor: '#FFF',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid #E2E8F0',
            flexShrink: 0,
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 900, fontSize: '0.75rem' }}>
            APERCU DES DONNEES
          </Typography>
          <Button
            type="button"
            disabled={journalData.length === 0}
            variant="contained"
            size="small"
            sx={{ bgcolor: '#10B981', fontWeight: 800, textTransform: 'none', px: 3 }}
            onClick={formikImport.handleSubmit}
          >
            Lancer l'import
          </Button>
        </Box>

        <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <DataGrid
            rows={journalData}
            columns={columnsTable.map(col => ({
              field: col.id,
              headerName: col.label,
              width: col.minWidth,
              align: col.align,
              headerAlign: col.align,
              valueFormatter: col.format
                ? (params) => col.format(params.value)
                : undefined
            }))}
            getRowId={(row) =>
              row.id || row.EcritureNum || row.RefInterne || Math.random().toString(36).substr(2, 9)
            }
            density="compact"
            // hideFooter
            disableColumnMenu
            sx={{
              border: 'none',
              fontSize: '0.75rem',
              height: '100%',
              '& .MuiDataGrid-columnHeaders': {
                bgcolor: '#F1F5F9',
                fontWeight: 800,
                fontSize: '0.75rem',
              },
              '& .MuiDataGrid-row': {
                height: '40px !important',
                minHeight: '40px !important',
                maxHeight: '40px !important',
              },
              '& .MuiDataGrid-row:hover': {
                bgcolor: '#F8FAFC',
              },
            }}
          />
        </Box>
      </Paper>

      {/* --- POPUP DES ANOMALIES --- */}
      <Dialog
        open={openAnomalies}
        onClose={() => setOpenAnomalies(false)}
        PaperProps={{ sx: { borderRadius: '16px', width: 500 } }}
      >
        <DialogTitle
          sx={{
            fontWeight: 900,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid #F1F5F9'
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <ErrorOutline sx={{ color: '#EF4444' }} />
            <Typography variant="h6" sx={{ fontWeight: 900 }}>
              Anomalies detectees
            </Typography>
          </Stack>
          <IconButton onClick={() => setOpenAnomalies(false)} size="small">
            <Close sx={{ fontSize: 20 }} />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 0 }}>
          <List sx={{ py: 0 }}>
            {anomalies.map((anom, index) => (
              <Box key={index}>
                <Stack
                  direction="row"
                  spacing={2}
                  sx={{ px: 3, py: 2, '&:hover': { bgcolor: '#FFF5F5' } }}
                >
                  <Typography
                    sx={{ color: '#EF4444', fontWeight: 800, fontSize: '0.8rem', minWidth: 60 }}
                  >
                    Ligne {anom.ligne}
                  </Typography>
                  <Typography sx={{ fontSize: '0.85rem', color: '#1E293B', fontWeight: 500 }}>
                    {anom.erreur}
                  </Typography>
                </Stack>
                {index < anomalies.length - 1 && <Divider sx={{ opacity: 0.5 }} />}
              </Box>
            ))}
          </List>
        </DialogContent>

        <Box sx={{ p: 2, textAlign: 'center', bgcolor: '#F8FAFC' }}>
          <Button
            onClick={() => setOpenAnomalies(false)}
            variant="contained"
            fullWidth
            sx={{
              bgcolor: '#1E293B',
              textTransform: 'none',
              borderRadius: '8px',
              fontWeight: 700
            }}
          >
            Fermer
          </Button>
        </Box>
      </Dialog>

      {/* --- POPUP DE CONFIRMATION D'IMPORT --- */}
      <ConfirmActionDialog
        open={openDialogConfirmImport}
        onClose={() => handleCloseDialogConfirmImport()}
        onConfirm={() => handleImportJournal(true)}
        title="Confirmer l'import"
        message="Voulez-vous vraiment importer le journal en cours ?"
        confirmText="Importer"
        cancelText="Annuler"
        color="#06b6d4"
      />

    </Box>
  );
};

export default ImportJournal;