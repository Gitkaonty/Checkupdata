import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Typography, Stack, TextField, InputAdornment } from '@mui/material';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import PopupTestSelectedFile from '../../componentsTools/popupTestSelectedFile';
import axios from '../../../../config/axios';
import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import { InfoFileStyle } from '../../componentsTools/InfosFileStyle';
import DashboardCard from '../../componentsTools/Dashboard/DashboardCard';
import { format } from 'date-fns';
import LineChartComponent from '../../componentsTools/Dashboard/LineChartComponent';
import useAuth from '../../../hooks/useAuth';
import { jwtDecode } from 'jwt-decode';
import toast from 'react-hot-toast';
import VirtualTableJournalAttente from '../../componentsTools/Dashboard/VirtualTableJournalAttente';
import usePermission from '../../../hooks/usePermission';
import KpiCard from '../../componentsTools/Dashboard/KpiCard';
import KpiCardDouble from '../../componentsTools/Dashboard/KpiCardDouble';
import { FiShoppingCart, FiUsers, FiCreditCard, FiArchive } from "react-icons/fi";
import { FiSearch } from "react-icons/fi";

const columns = [
  {
    id: 'compte',
    label: 'Compte',
    minWidth: 120,
    align: 'left',
    format: (value) => value.toLocaleString('fr-FR'),
  },
  {
    id: 'dateecriture',
    label: 'Date',
    minWidth: 100,
    width: 100,
    isDate: true,
    format: (value) => value ? format(new Date(value), "dd/MM/yyyy") : "",
  },
  {
    id: 'codejournal',
    label: 'Jounal',
    minWidth: 50,
  },
  // {
  //   id: 'piece',
  //   label: 'Pièce',
  //   minWidth: 120,
  //   align: 'left',
  //   format: (value) => value.toLocaleString('fr-FR'),
  // },
  {
    id: 'libelle',
    label: 'Libellé',
    minWidth: 200,
    align: 'left'
  },
  {
    id: 'debit',
    label: 'Débit',
    minWidth: 100,
    align: 'right',
    format: (value) => value.toFixed(2),
    isNumber: true
  },
  {
    id: 'credit',
    label: 'Crédit',
    minWidth: 100,
    align: 'right',
    format: (value) => value.toFixed(2),
    isNumber: true
  },
];

const gridHeight = '70vh';
const gridSpacing = 1;

export default function DashboardComponent() {
  const { canAdd, canModify, canDelete, canView } = usePermission();
  const [searchText, setSearchText] = useState("");

  const [fileInfos, setFileInfos] = useState('');
  const [noFile, setNoFile] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams();
  const [fileId, setFileId] = useState(0);
  const [listeExercice, setListeExercice] = useState([]);
  const [listeSituation, setListeSituation] = useState([]);

  //récupération des informations de connexion
  const { auth } = useAuth();
  const decoded = auth?.accessToken ? jwtDecode(auth.accessToken) : undefined;
  const compteId = decoded.UserInfo.compteId || null;
  const userId = decoded.UserInfo.userId || null;

  const [selectedExerciceId, setSelectedExerciceId] = useState(0);
  const [selectedPeriodeId, setSelectedPeriodeId] = useState(0);
  const [selectedPeriodeChoiceId, setSelectedPeriodeChoiceId] = useState(0);
  const [deviseParDefaut, setDeviseParDefaut] = useState([]);

  const [chiffresAffairesNGraph, setChiffresAffairesNGraph] = useState([]);
  const [chiffresAffairesN1Graph, setChiffresAffairesN1Graph] = useState([]);

  const [margeBruteNGraph, setMargeBruteNGraph] = useState([]);
  const [margeBruteN1Graph, setMargeBruteN1Graph] = useState([]);

  const [tresorerieBanqueNGraph, setTresorerieBanqueNGraph] = useState([]);
  const [tresorerieBanqueN1Graph, setTresorerieBanqueN1Graph] = useState([]);

  const [tresorerieCaisseNGraph, setTresorerieCaisseNGraph] = useState([]);
  const [tresorerieCaisseN1Graph, setTresorerieCaisseN1Graph] = useState([]);

  const [resultatN, setResultatN] = useState(0);
  const [resultatN1, setResultatN1] = useState(0);
  const [variationResultatN, setVariationResultatN] = useState(0);
  const [variationResultatN1, setVariationResultatN1] = useState(0);
  const [evolutionResultatN, setEvolutionResultatN] = useState('');
  const [evolutionResultatN1, setEvolutionResultatN1] = useState('');

  const [resultatChiffreAffaireN, setResultatChiffreAffaireN] = useState(0);
  const [resultatChiffreAffaireN1, setResultatChiffreAffaireN1] = useState(0);
  const [variationChiffreAffaireN, setVariationChiffreAffaireN] = useState(0);
  const [variationChiffreAffaireN1, setVariationChiffreAffaireN1] = useState(0);
  const [evolutionChiffreAffaireN, setEvolutionChiffreAffaireN] = useState('');
  const [evolutionChiffreAffaireN1, setEvolutionChiffreAffaireN1] = useState('');

  const [resultatDepenseAchatN, setResultatDepenseAchatN] = useState(0);
  const [resultatDepenseAchatN1, setResultatDepenseAchatN1] = useState(0);
  const [variationDepenseAchatN, setVariationDepenseAchatN] = useState(0);
  const [variationDepenseAchatN1, setVariationDepenseAchatN1] = useState(0);
  const [evolutionDepenseAchatN, setEvolutionDepenseAchatN] = useState('');
  const [evolutionDepenseAchatN1, setEvolutionDepenseAchatN1] = useState('');

  const [resultatDepenseSalarialeN, setResultatDepenseSalarialeN] = useState(0);
  const [resultatDepenseSalarialeN1, setResultatDepenseSalarialeN1] = useState(0);
  const [variationDepenseSalarialeN, setVariationDepenseSalarialeN] = useState(0);
  const [variationDepenseSalarialeN1, setVariationDepenseSalarialeN1] = useState(0);
  const [evolutionDepenseSalarialeN, setEvolutionDepenseSalarialeN] = useState('');
  const [evolutionDepenseSalarialeN1, setEvolutionDepenseSalarialeN1] = useState('');

  const [resultatTresorerieBanqueN, setResultatTresorerieBanqueN] = useState(0);
  const [resultatTresorerieBanqueN1, setResultatTresorerieBanqueN1] = useState(0);
  const [variationTresorerieBanqueN, setVariationTresorerieBanqueN] = useState(0);
  const [variationTresorerieBanqueN1, setVariationDTresorerieBanqueN1] = useState(0);
  const [evolutionTresorerieBanqueN, setEvolutionTresorerieBanqueN] = useState('');
  const [evolutionTresorerieBanqueN1, setEvolutionTresorerieBanqueN1] = useState('');

  const [resultatTresorerieCaisseN, setResultatTresorerieCaisseN] = useState(0);
  const [resultatTresorerieCaisseN1, setResultatTresorerieCaisseN1] = useState(0);
  const [variationTresorerieCaisseN, setVariationTresorerieCaisseN] = useState(0);
  const [variationTresorerieCaisseN1, setVariationDTresorerieCaisseN1] = useState(0);
  const [evolutionTresorerieCaisseN, setEvolutionTresorerieCaisseN] = useState('');
  const [evolutionTresorerieCaisseN1, setEvolutionTresorerieCaisseN1] = useState('');

  const [journalData, setJournalData] = useState([]);

  const filteredData = useMemo(() => {
    if (!searchText) return journalData;

    const lower = searchText.toLowerCase();
    return journalData.filter((row) => {
      return columns.some((col) => {
        const value = row[col.id];
        if (value === null || value === undefined) return false;
        return value.toString().toLowerCase().includes(lower);
      });
    });
  }, [searchText, journalData, columns]);

  const GetListeDossier = (id) => {
    axios.get(`/home/FileInfos/${id}`).then((response) => {
      const resData = response.data;

      if (resData.state) {
        setFileInfos(resData.fileInfos[0]);
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
    axios.get(`/paramExercice/listeExercice/${id}`).then((response) => {
      const resData = response.data;
      if (resData.state) {
        setListeExercice(resData.list);

        const exerciceNId = resData.list?.filter((item) => item.libelle_rang === "N");
        setListeSituation(exerciceNId);

        setSelectedExerciceId(exerciceNId[0]?.id);
        setSelectedPeriodeChoiceId(0);
        setSelectedPeriodeId(exerciceNId[0]?.id);

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

  // Récupération de toutes les informations
  const getAllInfo = () => {
    axios.get(`/dashboard/getAllInfo/${Number(compteId)}/${Number(fileId)}/${Number(selectedExerciceId)}`)
      .then((response) => {
        if (response?.data?.state) {
          setChiffresAffairesNGraph(response?.data?.chiffreAffaireN);
          setChiffresAffairesN1Graph(response?.data?.chiffreAffaireN1);

          setMargeBruteNGraph(response?.data?.margeBruteTotalN);
          setMargeBruteN1Graph(response?.data?.margeBruteTotalN1);

          setTresorerieBanqueNGraph(response?.data?.tresorerieBanqueN);
          setTresorerieBanqueN1Graph(response?.data?.tresorerieBanqueN1);

          setTresorerieCaisseNGraph(response?.data?.tresorerieCaisseN);
          setTresorerieCaisseN1Graph(response?.data?.tresorerieCaisseN1);

          setResultatN(response?.data?.resultatN);
          setResultatN1(response?.data?.resultatN1);
          setVariationResultatN(response?.data?.variationResultatN);
          setVariationResultatN1(response?.data?.variationResultatN1);
          setEvolutionResultatN(response?.data?.evolutionResultatN);
          setEvolutionResultatN1(response?.data?.evolutionResultatN1);

          setResultatChiffreAffaireN(response?.data?.resultatChiffreAffaireN);
          setResultatChiffreAffaireN1(response?.data?.resultatChiffreAffaireN1);
          setVariationChiffreAffaireN(response?.data?.variationChiffreAffaireN);
          setVariationChiffreAffaireN1(response?.data?.variationChiffreAffaireN1);
          setEvolutionChiffreAffaireN(response?.data?.evolutionChiffreAffaireN);
          setEvolutionChiffreAffaireN1(response?.data?.evolutionChiffreAffaireN1);

          setResultatDepenseSalarialeN(response?.data?.resultatDepenseSalarialeN);
          setResultatDepenseSalarialeN1(response?.data?.resultatDepenseSalarialeN1);
          setVariationDepenseSalarialeN(response?.data?.variationDepenseSalarialeN);
          setVariationDepenseSalarialeN1(response?.data?.variationDepenseSalarialeN1);
          setEvolutionDepenseSalarialeN(response?.data?.evolutionDepenseSalarialeN);
          setEvolutionDepenseSalarialeN1(response?.data?.evolutionDepenseSalarialeN1);

          setResultatDepenseAchatN(response?.data?.resultatDepenseAchatN);
          setResultatDepenseAchatN1(response?.data?.resultatDepenseAchatN1);
          setVariationDepenseAchatN(response?.data?.variationDepenseAchatN);
          setVariationDepenseAchatN1(response?.data?.variationDepenseAchatN1);
          setEvolutionDepenseAchatN(response?.data?.evolutionDepenseAchatN);
          setEvolutionDepenseAchatN1(response?.data?.evolutionDepenseAchatN1);

          setResultatTresorerieBanqueN(response?.data?.resultatTresorerieBanqueN);
          setResultatTresorerieBanqueN1(response?.data?.resultatTresorerieBanqueN1);
          setVariationTresorerieBanqueN(response?.data?.variationTresorerieBanqueN);
          setVariationDTresorerieBanqueN1(response?.data?.variationTresorerieBanqueN1);
          setEvolutionTresorerieBanqueN(response?.data?.evolutionTresorerieBanqueN);
          setEvolutionTresorerieBanqueN1(response?.data?.evolutionTresorerieBanqueN1);

          setResultatTresorerieCaisseN(response?.data?.resultatTresorerieCaisseN);
          setResultatTresorerieCaisseN1(response?.data?.resultatTresorerieCaisseN1);
          setVariationTresorerieCaisseN(response?.data?.variationTresorerieCaisseN);
          setVariationDTresorerieCaisseN1(response?.data?.variationTresorerieCaisseN1);
          setEvolutionTresorerieCaisseN(response?.data?.evolutionTresorerieCaisseN);
          setEvolutionTresorerieCaisseN1(response?.data?.evolutionTresorerieCaisseN1);
        }
      })
      .catch((err) => {
        console.error(err);
        toast.error(err?.response?.data?.message || err?.message || "Erreur inconnue");
      });
  }

  // Récupération de la liste des devises
  const getParDefaut = async () => {
    await axios.get(`/devises/devise/compte/${compteId}/${fileId}`).then((reponse => {
      const resData = reponse.data;
      const deviseParDefaut = resData.find(val => val.par_defaut === true);
      setDeviseParDefaut(deviseParDefaut?.code || 'MGA');
    }))
  }

  const getListeJournalEnAttente = () => {
    axios.get(`/dashboard/getListeJournalEnAttente/${Number(compteId)}/${Number(fileId)}/${Number(selectedExerciceId)}`)
      .then((response) => {
        if (response?.data) {
          setJournalData(response?.data);
        }
      })
      .catch((err) => {
        console.error(err);
        toast.error(err?.response?.data?.message || err?.message || "Erreur inconnue");
      });
  }

  const xAxis = [
    "Jan", "Fév", "Mar", "Avr", "Mai", "Juin",
    "Juil", "Août", "Sep", "Oct", "Nov", "Déc"
  ];

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

    GetListeDossier(idFile);
    GetListeExercice(idFile);
  }, []);

  useEffect(() => {
    if (compteId && fileId && selectedExerciceId && canView) {
      getAllInfo();
      getParDefaut();
      getListeJournalEnAttente();
    }
  }, [compteId, fileId, selectedExerciceId]);

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
      <Box>
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
          <TabPanel value="1" style={{ height: '100%' }}>
            <Stack width={"100%"} height={"100%"} spacing={6} alignItems={"flex-start"} alignContent={"flex-start"} justifyContent={"stretch"}>
              <Typography variant='h6' sx={{ color: "black", }} align='left'>Dashboard</Typography>

              <Stack width={"100%"} spacing={4} alignItems={"left"} alignContent={"center"} direction={"column"} style={{ marginLeft: "0px", marginTop: "20px" }}>
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
              </Stack>

              <Stack
                sx={{
                  height: { xs: "100vh", md: 405 },
                  width: "100%",
                }}
                direction={{ xs: "column", md: "row" }}
                spacing={0.5}
              >

                <KpiCardDouble
                  resultatChiffreAffaireN={resultatChiffreAffaireN}
                  resultatChiffreAffaireN1={resultatChiffreAffaireN1}
                  variationChiffreAffaireN={variationChiffreAffaireN}
                  resultatN={resultatN}
                  resultatN1={resultatN1}
                  variationResultatN={variationResultatN}
                  devise={deviseParDefaut}
                  evolutionResultatN={evolutionResultatN}
                  evolutionChiffreAffaireN={evolutionChiffreAffaireN}
                />

                <Stack
                  sx={{
                    width: { xs: "100%", md: "50%" },
                    height: { xs: "calc(100vh - 200px)", md: "100%" },
                  }}
                  spacing={0.5}
                >
                  <Stack
                    direction={{ xs: "column", md: "row" }}
                    spacing={0.5}
                    sx={{ flex: 1 }}
                  >
                    <KpiCard
                      title="Dépenses achats"
                      montantN={resultatDepenseAchatN}
                      montantN1={resultatDepenseAchatN1}
                      variation={variationDepenseAchatN}
                      evolution={evolutionDepenseAchatN}
                      devise={deviseParDefaut}
                      Icon={<FiShoppingCart size={24} color="white" />}
                    />
                    <KpiCard
                      title="Dépenses salariales"
                      montantN={resultatDepenseSalarialeN}
                      montantN1={resultatDepenseSalarialeN1}
                      variation={variationDepenseSalarialeN}
                      evolution={evolutionDepenseSalarialeN}
                      devise={deviseParDefaut}
                      Icon={<FiUsers size={24} color="white" />}
                    />
                  </Stack>

                  <Stack
                    direction={{ xs: "column", md: "row" }}
                    spacing={0.5}
                    sx={{ flex: 1 }}
                  >
                    <KpiCard
                      title="Trésoreries banque"
                      montantN={resultatTresorerieBanqueN}
                      montantN1={resultatTresorerieBanqueN1}
                      variation={variationTresorerieBanqueN}
                      evolution={evolutionTresorerieBanqueN}
                      devise={deviseParDefaut}
                      Icon={<FiCreditCard size={24} color="white" />}
                    />
                    <KpiCard
                      title="Trésoreries caisse"
                      montantN={resultatTresorerieCaisseN}
                      montantN1={resultatTresorerieCaisseN1}
                      variation={variationTresorerieCaisseN}
                      evolution={evolutionTresorerieCaisseN}
                      devise={deviseParDefaut}
                      Icon={<FiArchive size={24} color="white" />}
                    />
                  </Stack>
                </Stack>
              </Stack>

              <Stack
                width="100%"
                height="100%"
                direction={{ xs: "column", md: "row" }}
                justifyContent="space-between"
                spacing={2}
              >
                {/* COLONNE GAUCHE */}
                <Stack
                  width={{ xs: "100%", md: "55%" }}
                  direction="column"
                  spacing={2}
                >

                  {/* Card Graph */}
                  <Stack
                    sx={{
                      boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                      borderRadius: 2,
                      p: 2
                    }}
                    height={{ xs: 300, md: 500 }}
                  >
                    <LineChartComponent
                      xAxis={xAxis}
                      dataN={chiffresAffairesNGraph}
                      dataN1={chiffresAffairesN1Graph}
                      label={"Chiffre d'affaires"}
                    />
                  </Stack>

                  {/* Card Table */}
                  <Stack
                    sx={{
                      boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                      borderRadius: 2,
                      p: 2
                    }}
                    height={{ xs: 416, md: 535 }}
                  >
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      mb={2}
                    >
                      <Typography variant="h5" sx={{ color: "black" }}>
                        Comptes en attente
                      </Typography>

                      <TextField
                        size="small"
                        placeholder="Rechercher..."
                        variant="outlined"
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        sx={{
                          bgcolor: "#F5F5F5",
                          borderRadius: 2,
                          width: { xs: "40%", md: "250px" },
                          "& .MuiOutlinedInput-root": {
                            height: 36,
                            paddingRight: 0,
                          },
                          "& .MuiOutlinedInput-notchedOutline": {
                            borderColor: "#E0E0E0",
                          },
                        }}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <FiSearch color="#757575" />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Stack>

                    <VirtualTableJournalAttente
                      tableHeader={columns}
                      tableRow={filteredData}
                    />
                  </Stack>

                </Stack>

                {/* COLONNE DROITE */}
                <Stack
                  width={{ xs: "100%", md: "45%" }}
                  direction="column"
                  spacing={2}
                >
                  <Stack
                    height={{ xs: 250, md: 339 }}
                    sx={{
                      boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                      borderRadius: 2,
                      p: 2
                    }}
                  >
                    <LineChartComponent
                      xAxis={xAxis}
                      dataN={margeBruteNGraph}
                      dataN1={margeBruteN1Graph}
                      label={"Marges brutes"}
                    />
                  </Stack>

                  <Stack
                    height={{ xs: 250, md: 339 }}
                    sx={{
                      boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                      borderRadius: 2,
                      p: 2
                    }}
                  >
                    <LineChartComponent
                      xAxis={xAxis}
                      dataN={tresorerieBanqueNGraph}
                      dataN1={tresorerieBanqueN1Graph}
                      label={"Trésoreries (Banques)"}
                    />
                  </Stack>

                  <Stack
                    height={{ xs: 250, md: 339 }}
                    sx={{
                      boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                      borderRadius: 2,
                      p: 2
                    }}
                  >
                    <LineChartComponent
                      xAxis={xAxis}
                      dataN={tresorerieCaisseNGraph}
                      dataN1={tresorerieCaisseN1Graph}
                      label={"Trésoreries (Caisses)"}
                    />
                  </Stack>
                </Stack>
              </Stack>

            </Stack>
          </TabPanel>
        </TabContext>
      </Box>
    </>
  )
}
