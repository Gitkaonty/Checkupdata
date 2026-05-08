import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box, Typography, Stack, Paper, MenuItem, Select,
  Autocomplete, TextField, IconButton, Divider, Tooltip, Chip,
  Breadcrumbs, Button,
  Link
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import axios from '../../../config/axios';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import useAuth from '../../hooks/useAuth';
import { jwtDecode } from 'jwt-decode';
import { GrPrevious } from "react-icons/gr";
import { GrNext } from "react-icons/gr";

import usePermission from '../../hooks/usePermission';
import useAxiosPrivate from '../../../config/axiosPrivate';

import {
  NavigateBefore, NavigateNext, AccountBalanceWalletOutlined,
  DownloadOutlined, PrintOutlined, InfoOutlined,
  DashboardOutlined
} from '@mui/icons-material';

const ConsultationComptes = () => {

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

  const [openSaisiePopup, setOpenSaisiePopup] = useState(false);
  const [openAnalytiquePopup, setOpenAnalytiquePopup] = useState(false);
  const [openPopupAddEcriture, setOpenPopupAddEcriture] = useState(false);
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
  const [listePlanComptablePourAjout, setListePlanComptablePourAjout] = useState([]);
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
  const compteId = decoded?.UserInfo?.compteId || null;
  const compteName = decoded?.UserInfo?.compte || 'Espace Client';

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
      canView ? setListSaisie(resData) : setListSaisie([]);
    })
  }

  //Liste saisie with return statement
  const getListeSaisieReturn = async () => {
    const response = await axios.get(`/administration/traitementSaisie/getAllJournal/${compteId}/${id}/${selectedExerciceId}`);
    const resData = response.data;
    canView ? setListSaisie(resData) : setListSaisie([]);
    return resData;
  };

  //Récupération du plan comptable
  const getPc = () => {
    axios.get(`/param/comptabilite/PcIdLibelle/${compteId}/${fileId}`, {
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

  // const getPcForAjout = () => {
  //     axios.get(`/paramPlanComptable/recupPcIdLibelleForJournal/${compteId}/${fileId}`)
  //         .then((response) => {
  //             const resData = response.data;
  //             if (resData.state) {
  //                 setListePlanComptablePourAjout(resData.liste);
  //             } else {
  //                 toast.error(resData.msg);
  //             }
  //         })
  // }

  //Liste des sections avec ses axes
  const getListAxeSection = () => {
    axios.get(`/paramCa/list/getListAxeSection/${Number(compteId)}/${Number(fileId)}`).then((response) => {
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
      flex: 2.5,
      headerAlign: 'left',
      align: 'left',
      headerClassName: 'HeaderbackColor',
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
        const compte = String(params.row?.compte || '');
        const disabled = !canView || !/^(2|6|7)/.test(compte);

        return (
          <Tooltip title={disabled ? "Non applicable pour ce compte" : "Voir les répartitions analytiques"}>
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
                disabled={disabled}
                onClick={() => {
                  if (!disabled) {
                    handleOpenPopupShowAnalytique(params.row.id);
                  }
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
      (item) => item.compte?.toString() === compteSelectStr
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

  function calculateDebitCredit(tableRows) {
    const totalDebit = tableRows.reduce((total, row) => total + (parseFloat(row.debit) || 0), 0);
    const totalCredit = tableRows.reduce((total, row) => total + (parseFloat(row.credit) || 0), 0);

    const totalDebitFormatted = totalDebit.toLocaleString('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).replace(/\u202f/g, ' ');

    const totalCreditFormatted = totalCredit.toLocaleString('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).replace(/\u202f/g, ' ');

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
  }

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

  const rowsForTotals = useMemo(() => {
    if (valSelectedCompte && valSelectedCompte !== 'tout' && Array.isArray(filteredList)) {
      return filteredList;
    }
    return listSaisie;
  }, [filteredList, listSaisie, valSelectedCompte]);

  const totals = useMemo(() => calculateDebitCredit(rowsForTotals), [rowsForTotals]);

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
            toast.success('Lignes lettrés avec success');
            setIsRefreshed(!isRefresehed);
            setSelectedRows(selectedRows);
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
          toast.success('Ligne délettrés avec succès');
          setIsRefreshed(!isRefresehed);
          setSelectedRows(selectedRows);
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

  const createEcriture = (value) => {
    if (value) {
      setOpenPopupAddEcriture(false);
    } else {
      setOpenPopupAddEcriture(false);
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
          const compteObj = listePlanComptable.find(pc => pc.compte === row.compte);

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
      const resData = response.data;
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
        toast.error("une erreur est survenue lors de la récupération de la liste des exercices");
      }
    })
  }

  // Liste saisie
  useEffect(() => {
    if (fileId && selectedExerciceId && compteId && (listePlanComptable.length > 0 && listePlanComptableInitiale.length > 0)) {
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

  useEffect(() => {
    if (valSelectedCompte) {
      localStorage.setItem("valSelectedCompteConsultation", valSelectedCompte);
    }
  }, [valSelectedCompte]);

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
    <Box sx={{ p: 2, bgcolor: '#F8FAFC', height: 'calc(100vh - 120px)', width: 'calc(100vw - 130px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
        <Chip
          label={compteName}
          sx={{
            borderRadius: '4px', // Rectangulaire comme demandé
            bgcolor: '#F1F5F9',
            color: '#475569',
            fontWeight: 700,
            fontSize: '0.95rem',
            border: '1px solid #E2E8F0',
            height: 24,
          }}
        />
        <Breadcrumbs
          separator={<NavigateNext fontSize="small" />}
          sx={{ mb: 2, '& .MuiTypography-root': { fontSize: '0.85rem', fontWeight: 600 } }}
        >
          <Link underline="hover" color="inherit" href="/dashboard"
            sx={{ display: 'flex', alignItems: 'center' }}
          >
            <DashboardOutlined sx={{ mr: 0.5, fontSize: 20 }} /> Dashboard
          </Link>
          <Typography color="text.primary" sx={{ fontWeight: 600, color: '#64748B' }}>Consultation</Typography>
        </Breadcrumbs>
      </Stack>

      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 900, color: '#1E293B' }}>Consultation Grand Livre</Typography>
        <Typography variant="caption" sx={{ color: '#64748B' }}>Visualiser les détails de votre balance</Typography>
      </Box>

      {/* --- TOP BAR : FILTRES & NAVIGATION --- */}
      <Paper variant="outlined" sx={{ p: 2, borderRadius: '12px', mb: 3, border: '1px solid #E2E8F0' }}>
        <Stack direction="row" spacing={3} alignItems="center" justifyContent="space-between">

          <Stack direction="row" spacing={2} alignItems="center">
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 900, color: '#94A3B8', display: 'block', mb: 0.5, fontSize: '0.55rem' }}>EXERCICE</Typography>
              <Select value={selectedExerciceId} onChange={(e) => handleChangeExercice(e.target.value)} variant="standard" disableUnderline sx={{ fontSize: '0.9rem', fontWeight: 800 }}>
                {listeExercice.map((option) => (
                  <MenuItem key={option.id} value={option.id} sx={{ fontSize: 15 }}>
                    {option.libelle_rang}: {format(option.date_debut, "dd/MM/yyyy")} - {format(option.date_fin, "dd/MM/yyyy")}
                  </MenuItem>
                ))}
              </Select>
            </Box>

            <Divider orientation="vertical" flexItem sx={{ height: 32 }} />

            <Box sx={{ width: 350 }}>
              <Typography variant="caption" sx={{ fontWeight: 900, color: '#94A3B8', display: 'block', mb: 0.5, fontSize: '0.55rem' }}>COMPTE COMPTABLE</Typography>
              <Stack direction="row" spacing={1} alignItems="center" >
                <Autocomplete
                  sx={{ width: 300 }}
                  value={listePlanComptable.find(item => item.id === Number(valSelectedCompte)) || null}
                  onChange={(event, newValue) => {
                    setValSelectedCompte(newValue?.id || null);
                  }}
                  disabled={!canView || !selectedExerciceId || selectedExerciceId === 0}
                  renderOption={(props, option) => (
                    <li {...props}>
                      <span>
                        {option.compte} - {option.libelle}{' '}

                      </span>
                    </li>
                  )}
                  options={listePlanComptable}
                  getOptionLabel={(option) => `${option.compte || ''} - ${option.libelle || ''}`}
                  renderInput={(params) => (
                    <TextField {...params} variant="standard" InputProps={{ ...params.InputProps, disableUnderline: true }}
                      sx={{ '& .MuiInputBase-root': { fontSize: '0.9rem', fontWeight: 700 } }}
                    />
                  )}
                  isOptionEqualToValue={(option, value) => option?.id === value?.id}
                  disableClearable={false}
                  noOptionsText="Aucun compte disponible"
                />
                <Stack direction="row" sx={{ bgcolor: '#F1F5F9', borderRadius: '8px', p: 0.5 }}>
                  <Button
                    disabled={!canView || !selectedExerciceId || selectedExerciceId === 0 || valSelectedCompte === 'tout'}
                    sx={{
                      minWidth: 0,
                      padding: 1,
                      backgroundColor: 'transparent',
                      boxShadow: 'none',
                      '&:hover': { backgroundColor: 'transparent' },
                      '&:focus': { outline: 'none', backgroundColor: 'transparent', boxShadow: 'none' },
                      '&:active': { backgroundColor: 'transparent', boxShadow: 'none' },
                    }}
                    onClick={handlePrevious}
                  >
                    <GrPrevious color="gray" size={10} />
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
                      '&:hover': { backgroundColor: 'transparent' },
                      '&:focus': { outline: 'none', backgroundColor: 'transparent', boxShadow: 'none' },
                      '&:active': { backgroundColor: 'transparent', boxShadow: 'none' },
                    }}
                    onClick={handleNext}
                  >
                    <GrNext color="gray" size={10} />
                  </Button>
                </Stack>

                {/* <Stack direction="row" sx={{ bgcolor: '#F1F5F9', borderRadius: '8px', p: 0.5 }}>
                  <IconButton size="small" onClick={() => handleNavigate('prev')} disabled={listeComptes.findIndex(c => c.code === selectedCompte.code) === 0}>
                    <NavigateBefore fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleNavigate('next')} disabled={listeComptes.findIndex(c => c.code === selectedCompte.code) === listeComptes.length - 1}>
                    <NavigateNext fontSize="small" />
                  </IconButton>
                </Stack> */}
              </Stack>

            </Box>
          </Stack>

          {/* --- AFFICHAGE DU SOLDE (RÉSUMÉ) --- */}
          <Stack direction="row" spacing={4} sx={{ px: 3 }}>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="caption" sx={{ fontWeight: 900, color: '#94A3B8', display: 'block', fontSize: '0.55rem' }}>TOTAL DÉBIT</Typography>
              <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: '#1E293B' }}>{totals.debit}</Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="caption" sx={{ fontWeight: 900, color: '#94A3B8', display: 'block', fontSize: '0.55rem' }}>TOTAL CRÉDIT</Typography>
              <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: '#1E293B' }}>{totals.credit}</Typography>
            </Box>
            <Box sx={{ textAlign: 'right', minWidth: 120 }}>
              <Typography variant="caption" sx={{ fontWeight: 900, color: '#94A3B8', display: 'block', fontSize: '0.55rem' }}>SOLDE ACTUEL</Typography>
              <Typography sx={{
                fontSize: '1rem',
                fontWeight: 900,
                color: Number(totals.solde.replace(/\s/g, '').replace(',', '.')) < 0 ? '#EF4444' : '#10B981',
                px: 1, borderRadius: '4px'
              }}>
                {totals.solde}
              </Typography>
            </Box>
          </Stack>
        </Stack>
      </Paper>

      {/* --- TABLEAU DES ÉCRITURES --- */}
      <Paper variant="outlined" sx={{ borderRadius: '12px', overflow: 'hidden', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <DataGrid
          disableRowSelectionOnClick
          disableSelectionOnClick={true}
          editMode='row'
          density="compact"
          columns={ConsultationColumnHeader}
          rows={rowsAvecSolde}
          initialState={{
            pagination: {
              paginationModel: { page: 0, pageSize: 100 },
            },
          }}
          experimentalFeatures={{ newEditingApi: true }}
          pageSizeOptions={[5, 10, 20, 30, 50, 100]}
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
              setMessageLettrageDesequilibre(`Le lettrage ${lettrageValue} est déséquilibré de ${soldeLigne} Ar.\nLes lettrages vont être annulés.`)
              setSelectedLigneDesequilibre(selectedData);
              setOpenLettrageDesequilibrePopup(true);
            }
          }}
          sx={{
            border: 'none',
            flex: 1,
            minHeight: 0,
            '& .MuiDataGrid-columnHeaders': {
              bgcolor: '#F8FAFC',
              borderBottom: '1px solid #E2E8F0',
              '& .MuiDataGrid-columnHeaderTitle': {
                fontSize: '0.7rem',
                fontWeight: 800,
                color: '#64748B',
                textTransform: 'uppercase',
              }
            },
            '& .MuiDataGrid-cell': {
              borderBottom: '1px solid #F1F5F9',
              '&:focus': { outline: 'none' }
            },
            '& .MuiDataGrid-row:hover': {
              bgcolor: '#F1F5F930'
            }
          }}
        />
      </Paper>
    </Box>
  );
};

const dataGridStyle = {
  border: 'none',
  '& .MuiDataGrid-columnHeaders': {
    bgcolor: '#FCFDFF',
    borderBottom: '1px solid #E2E8F0',
    '& .MuiDataGrid-columnHeaderTitle': { fontSize: '0.65rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }
  },
  '& .MuiDataGrid-cell': { fontSize: '0.75rem', borderBottom: '1px solid #F1F5F9' },
  '& .MuiDataGrid-row:hover': { bgcolor: '#F8FAFC' }
};

export default ConsultationComptes;