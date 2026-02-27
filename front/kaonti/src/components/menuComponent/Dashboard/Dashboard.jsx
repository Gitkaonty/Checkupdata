import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Typography, Stack, TextField, InputAdornment, Autocomplete, Checkbox, FormLabel, RadioGroup, FormControlLabel, Radio } from '@mui/material';
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
import { format } from 'date-fns';
import useAuth from '../../../hooks/useAuth';
import { jwtDecode } from 'jwt-decode';
import toast from 'react-hot-toast';
import VirtualTableJournalAttente from '../../componentsTools/Dashboard/VirtualTableJournalAttente';
import usePermission from '../../../hooks/usePermission';
import KpiCard from '../../componentsTools/Dashboard/KpiCard';
import KpiCardDouble from '../../componentsTools/Dashboard/KpiCardDouble';
import { FiShoppingCart, FiUsers, FiCreditCard, FiArchive } from "react-icons/fi";
import { FiSearch } from "react-icons/fi";
import ApexChart from '../../componentsTools/Dashboard/ApexChart';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';

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
    format: (value) => value.toLocaleString('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }),
    isNumber: true
  },
  {
    id: 'credit',
    label: 'Crédit',
    minWidth: 100,
    align: 'right',
    format: (value) => value.toLocaleString('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }),
    isNumber: true
  },
];

const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" />;

export default function DashboardComponent() {
  let axeId = 0;
  if (typeof window !== "undefined") {
    axeId = localStorage.getItem('axeId');
  }

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

  const [axesData, setAxesData] = useState([]);
  const [sectionsData, setSectionsData] = useState([]);

  const [selectedAxeId, setSelectedAxeId] = useState(0);
  const [selectedSectionsId, setSelectedSectionsId] = useState([]);

  const [selectedExerciceId, setSelectedExerciceId] = useState(0);
  const [selectedPeriodeId, setSelectedPeriodeId] = useState(0);
  const [selectedPeriodeChoiceId, setSelectedPeriodeChoiceId] = useState(0);
  const [deviseParDefaut, setDeviseParDefaut] = useState([]);
  const [avecAnalytique, setAvecAnalytique] = useState(false);

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
  const [evolutionResultatN, setEvolutionResultatN] = useState('');

  const [resultatChiffreAffaireN, setResultatChiffreAffaireN] = useState(0);
  const [resultatChiffreAffaireN1, setResultatChiffreAffaireN1] = useState(0);
  const [variationChiffreAffaireN, setVariationChiffreAffaireN] = useState(0);
  const [evolutionChiffreAffaireN, setEvolutionChiffreAffaireN] = useState('');

  const [resultatDepenseAchatN, setResultatDepenseAchatN] = useState(0);
  const [resultatDepenseAchatN1, setResultatDepenseAchatN1] = useState(0);
  const [variationDepenseAchatN, setVariationDepenseAchatN] = useState(0);
  const [evolutionDepenseAchatN, setEvolutionDepenseAchatN] = useState('');

  const [resultatDepenseSalarialeN, setResultatDepenseSalarialeN] = useState(0);
  const [resultatDepenseSalarialeN1, setResultatDepenseSalarialeN1] = useState(0);
  const [variationDepenseSalarialeN, setVariationDepenseSalarialeN] = useState(0);
  const [evolutionDepenseSalarialeN, setEvolutionDepenseSalarialeN] = useState('');

  const [resultatTresorerieBanqueN, setResultatTresorerieBanqueN] = useState(0);
  const [resultatTresorerieBanqueN1, setResultatTresorerieBanqueN1] = useState(0);
  const [variationTresorerieBanqueN, setVariationTresorerieBanqueN] = useState(0);
  const [evolutionTresorerieBanqueN, setEvolutionTresorerieBanqueN] = useState('');

  const [resultatTresorerieCaisseN, setResultatTresorerieCaisseN] = useState(0);
  const [resultatTresorerieCaisseN1, setResultatTresorerieCaisseN1] = useState(0);
  const [variationTresorerieCaisseN, setVariationTresorerieCaisseN] = useState(0);
  const [evolutionTresorerieCaisseN, setEvolutionTresorerieCaisseN] = useState('');

  const [typeAffichage, setTypeAffichage] = useState('Globale');

  const [journalData, setJournalData] = useState([]);

  const clearAllData = () => {
    setChiffresAffairesNGraph([]);
    setChiffresAffairesN1Graph([]);
    setMargeBruteNGraph([]);
    setMargeBruteN1Graph([]);
    setResultatN(0);
    setResultatN1(0);
    setVariationResultatN(0);
    setEvolutionResultatN('');
    setResultatChiffreAffaireN(0);
    setResultatChiffreAffaireN1(0);
    setVariationChiffreAffaireN(0);
    setEvolutionChiffreAffaireN('');
    setResultatDepenseAchatN(0);
    setResultatDepenseAchatN1(0);
    setVariationDepenseAchatN(0);
    setEvolutionDepenseAchatN('');
    setResultatDepenseSalarialeN(0);
    setResultatDepenseSalarialeN1(0);
    setVariationDepenseSalarialeN(0);
    setEvolutionDepenseSalarialeN('');
    setJournalData([]);
  }

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

  const handleChangeAxe = (e) => {
    setSelectedAxeId(e.target.value);
    setSelectedSectionsId([]);
    localStorage.setItem('axeId', e.target.value);
    localStorage.removeItem('sectionIds');
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
    const sectionIds = selectedSectionsId.map(val => Number(val.id));
    axios.post(`/dashboard/getAllInfo`, {
      id_compte: Number(compteId),
      id_dossier: Number(fileId),
      id_exercice: Number(selectedExerciceId),
      id_axe: Number(selectedAxeId),
      id_sections: sectionIds,
      avecAnalytique
    })
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
          setEvolutionResultatN(response?.data?.evolutionResultatN);

          setResultatChiffreAffaireN(response?.data?.resultatChiffreAffaireN);
          setResultatChiffreAffaireN1(response?.data?.resultatChiffreAffaireN1);
          setVariationChiffreAffaireN(response?.data?.variationChiffreAffaireN);
          setEvolutionChiffreAffaireN(response?.data?.evolutionChiffreAffaireN);

          setResultatDepenseSalarialeN(response?.data?.resultatDepenseSalarialeN);
          setResultatDepenseSalarialeN1(response?.data?.resultatDepenseSalarialeN1);
          setVariationDepenseSalarialeN(response?.data?.variationDepenseSalarialeN);
          setEvolutionDepenseSalarialeN(response?.data?.evolutionDepenseSalarialeN);

          setResultatDepenseAchatN(response?.data?.resultatDepenseAchatN);
          setResultatDepenseAchatN1(response?.data?.resultatDepenseAchatN1);
          setVariationDepenseAchatN(response?.data?.variationDepenseAchatN);
          setEvolutionDepenseAchatN(response?.data?.evolutionDepenseAchatN);

          setResultatTresorerieBanqueN(response?.data?.resultatTresorerieBanqueN);
          setResultatTresorerieBanqueN1(response?.data?.resultatTresorerieBanqueN1);
          setVariationTresorerieBanqueN(response?.data?.variationTresorerieBanqueN);
          setEvolutionTresorerieBanqueN(response?.data?.evolutionTresorerieBanqueN);

          setResultatTresorerieCaisseN(response?.data?.resultatTresorerieCaisseN);
          setResultatTresorerieCaisseN1(response?.data?.resultatTresorerieCaisseN1);
          setVariationTresorerieCaisseN(response?.data?.variationTresorerieCaisseN);
          setEvolutionTresorerieCaisseN(response?.data?.evolutionTresorerieCaisseN);
        }
      })
      .catch((err) => {
        console.error(err);
        toast.error(err?.response?.data?.message || err?.message || "Erreur inconnue");
      });
  }

  const handleGetAxes = () => {
    axios.get(`/paramCa/getAxes/${Number(compteId)}/${Number(fileId)}`)
      .then((response) => {
        if (response?.data?.state) {
          setAxesData(response?.data?.data);
          setSelectedAxeId(axeId || response?.data?.data[0]?.id)
        } else {
          toast.error(response?.data?.message);
        }
      })
  }

  const handleGetSections = () => {
    axios.post(`/paramCa/getSectionsByAxeIds/${Number(compteId)}/${Number(fileId)}`, {
      selectedRowAxeId: Number(selectedAxeId)
    })
      .then((response) => {
        if (response?.data?.state) {
          setSectionsData(response?.data?.data)
        } else {
          toast.error(response?.data?.message);
        }
      })
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
    const sectionIds = selectedSectionsId.map(val => Number(val.id));
    axios.post(`/dashboard/getListeJournalEnAttente`, {
      id_compte: Number(compteId),
      id_dossier: Number(fileId),
      id_exercice: Number(selectedExerciceId),
      id_axe: Number(selectedAxeId),
      id_sections: sectionIds,
      avecAnalytique
    })
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
    if (compteId && fileId && selectedExerciceId && canView && selectedSectionsId.length !== 0) {
      getAllInfo();
      getParDefaut();
      getListeJournalEnAttente();
    }
  }, [compteId, fileId, selectedExerciceId, selectedAxeId, avecAnalytique, selectedSectionsId]);

  useEffect(() => {
    handleGetAxes();
  }, [selectedExerciceId])

  useEffect(() => {
    if (selectedAxeId) {
      handleGetSections();
    }
  }, [selectedAxeId])

  useEffect(() => {
    if (!sectionsData.length) return;

    const raw = localStorage.getItem("sectionIds");
    if (!raw) return;

    const saved = JSON.parse(raw);

    const matched = sectionsData.filter(sec =>
      saved.some(s => s.id === sec.id)
    );

    setSelectedSectionsId(matched);
  }, [sectionsData]);

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
              <FormControl
                style={{
                  marginTop: '10px',
                  marginLeft: '8px',
                }}
              >
                <FormLabel id="radio-group-dashboard">Type d'affichage</FormLabel>
                <RadioGroup
                  row
                  aria-labelledby="radio-group-dashboard"
                  value={typeAffichage}
                  onChange={(e) => {
                    e.preventDefault;
                    const val = e.target.value;
                    val === 'Analytique' ? setAvecAnalytique(true) : setAvecAnalytique(false);
                    setTypeAffichage(val);
                  }}
                  name="radio-group-buttons-dashboard"
                >
                  <FormControlLabel value="Globale" control={<Radio />} label="Globale" />
                  <FormControlLabel value="Analytique" control={<Radio />} label="Avec analytique" />
                </RadioGroup>
              </FormControl>
              {
                avecAnalytique && (
                  <Stack
                    direction={'row'}
                    spacing={2}
                    alignItems={'flex-start'}
                    style={{
                      marginTop: '10px',
                      marginLeft: '8px',
                      width: '100%',
                      backgroundColor: '#F4F9F9',
                      borderRadius: "5px"
                    }}
                  >
                    <FormControl variant="standard" sx={{ minWidth: 150 }}>
                      <InputLabel>Axe</InputLabel>
                      <Select
                        value={selectedAxeId}
                        onChange={handleChangeAxe}
                        sx={{ width: "150px", display: "flex", height: '38px', justifyContent: "left", alignItems: "flex-start", alignContent: "flex-start", textAlign: "left" }}
                        MenuProps={{
                          disableScrollLock: true
                        }}
                      >
                        {
                          axesData.map(val => {
                            return (
                              <MenuItem key={val.id} value={val.id}>{val.code}</MenuItem>
                            )
                          })
                        }
                      </Select>
                    </FormControl>
                    <FormControl variant="standard" sx={{ width: '100%' }}>
                      <Autocomplete
                        multiple
                        id="checkboxes-tags-demo"
                        options={sectionsData}
                        disableCloseOnSelect
                        getOptionLabel={(option) => option.section}
                        onChange={(_event, newValue) => {
                          setSelectedSectionsId(newValue);
                          localStorage.setItem('sectionIds', JSON.stringify(newValue));
                          if (newValue.length === 0) {
                            clearAllData();
                          }
                        }}
                        value={selectedSectionsId}
                        sx={{
                          '& .MuiAutocomplete-inputRoot': {
                            paddingTop: 0,
                            paddingBottom: 0,
                            minHeight: '38px',
                          },
                        }}
                        renderOption={(props, option, { selected }) => {
                          const { key, ...optionProps } = props;
                          return (
                            <li
                              key={key}
                              {...optionProps}
                              style={{
                                paddingTop: 2,
                                paddingBottom: 2,
                                paddingLeft: 4,
                                paddingRight: 4,
                                fontSize: "0.8rem",
                                display: "flex",
                                alignItems: "center"
                              }}
                            >
                              <Checkbox
                                icon={icon}
                                checkedIcon={checkedIcon}
                                style={{ marginRight: 8 }}
                                checked={selected}
                              />
                              {option.section}
                            </li>
                          );
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            variant="standard"
                            label="Section"
                          />
                        )}
                      />

                    </FormControl>
                  </Stack>
                )
              }
              <Stack
                sx={{
                  height: { xs: "100vh", md: 405 },
                  width: "100%",
                }}
                style={{
                  marginTop: '20px'
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
                      title="Trésoreries banques (Globale)"
                      montantN={resultatTresorerieBanqueN}
                      montantN1={resultatTresorerieBanqueN1}
                      variation={variationTresorerieBanqueN}
                      evolution={evolutionTresorerieBanqueN}
                      devise={deviseParDefaut}
                      Icon={<FiCreditCard size={24} color="white" />}
                    />
                    <KpiCard
                      title="Trésoreries caisses (Globale)"
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
                    width={"100%"}
                  >
                    <ApexChart
                      xAxis={xAxis}
                      dataN={chiffresAffairesNGraph}
                      dataN1={chiffresAffairesN1Graph}
                      label={"Chiffre d'affaires"}
                      type={'area'}
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
                    <ApexChart
                      xAxis={xAxis}
                      dataN={margeBruteNGraph}
                      dataN1={margeBruteN1Graph}
                      label={"Marges brutes"}
                      type={'area'}
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
                    <ApexChart
                      xAxis={xAxis}
                      dataN={tresorerieBanqueNGraph}
                      dataN1={tresorerieBanqueN1Graph}
                      label={"Trésoreries banques (Globale)"}
                      type={'bar'}
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
                    <ApexChart
                      xAxis={xAxis}
                      dataN={tresorerieCaisseNGraph}
                      dataN1={tresorerieCaisseN1Graph}
                      label={"Trésoreries caisses (Globale)"}
                      type={'bar'}
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
