
import VirtualTableJournalAttente from '../../componentsTools/Dashboard/VirtualTableJournalAttente';
import { FiSearch } from "react-icons/fi";
import {
  CalendarToday
} from '@mui/icons-material';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Box, Grid, Paper, Typography, Stack, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  GlobalStyles,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  TableFooter,
  TextField,
  InputAdornment,
  Autocomplete,
  Checkbox
} from '@mui/material';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar
} from 'recharts';
import axios from '../../../../config/axios';
import { useNavigate, useParams } from 'react-router-dom';
import useAuth from '../../../hooks/useAuth';
import { jwtDecode } from 'jwt-decode';
import { format } from 'date-fns';
import usePermission from '../../../hooks/usePermission';
import toast from 'react-hot-toast';
import { Tooltip as RechartsTooltip } from 'recharts';
import { AutocompleteMultipleState, AutocompleteState, RadioGroupState } from '../../componentsTools/Global/Input/FieldState';
import SelectExercice from '../../componentsTools/Global/SelectExercice';

const columns = [
  {
    id: 'compte',
    label: 'Numéro de compte',
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

const COLORS = {
  navy: '#0F172A',
  electric: '#0EA5E9',
  cyan: '#22D3EE',
  success: '#10B981',
  error: '#EF4444',
  border: '#E2E8F0',
  bg: '#F8FAFC'
};

const kpiStyle = (isMain) => ({
  p: 2.5,
  borderRadius: '12px',
  height: '140px',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  background: isMain ? `linear-gradient(135deg, #020617 0%, ${COLORS.navy} 100%)` : '#FFFFFF',
  color: isMain ? '#FFFFFF' : COLORS.navy,
  border: isMain ? 'none' : `1px solid ${COLORS.border}`,
  boxShadow: isMain ? '0 8px 20px -6px rgba(0, 0, 0, 0.3)' : 'none'
});

const DashboardFinalOptimized = () => {
  let axeId = 0;
  if (typeof window !== "undefined") {
    axeId = localStorage.getItem('axeId');
  }
  const { canAdd, canModify, canDelete, canView } = usePermission();
  const [noFile, setNoFile] = useState(false);
  const [fileInfos, setFileInfos] = useState('');
  const [dossierAvecAnalytique, setDossierAvecAnalytique] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams();
  const [fileId, setFileId] = useState(0);
  const [listeExercice, setListeExercice] = useState([]);
  const [listeSituation, setListeSituation] = useState([]);
  const [listePeriode, setListePeriode] = useState([]);

  const [axesData, setAxesData] = useState([]);
  const [sectionsData, setSectionsData] = useState([]);

  const [selectedAxeId, setSelectedAxeId] = useState(0);
  const [selectedSectionsId, setSelectedSectionsId] = useState([]);

  const [selectedExerciceId, setSelectedExerciceId] = useState(0);
  const [selectedPeriodeId, setSelectedPeriodeId] = useState(0);
  const [selectedPeriodeChoiceId, setSelectedPeriodeChoiceId] = useState(0);
  const [avecAnalytique, setAvecAnalytique] = useState(false);
  const [deviseParDefaut, setDeviseParDefaut] = useState([]);

  const [chiffresAffairesNGraph, setChiffresAffairesNGraph] = useState([]);
  const [chiffresAffairesN1Graph, setChiffresAffairesN1Graph] = useState([]);

  const [margeBruteNGraph, setMargeBruteNGraph] = useState([]);
  const [tresorerieBanqueNGraph, setTresorerieBanqueNGraph] = useState([]);
  const [tresorerieCaisseNGraph, setTresorerieCaisseNGraph] = useState([]);

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

  const [resultatTresorerieGlobalN, setResultatTresorerieGlobalN] = useState(0);
  const [resultatTresorerieGlobalN1, setResultatTresorerieGlobalN1] = useState(0);
  const [variationTresorerieGlobalN, setVariationTresorerieGlobalN] = useState(0);
  const [evolutionTresorerieGlobalN, setEvolutionTresorerieGlobalN] = useState('');

  const [resultatMargeBruteN, setResultatMargeBruteN] = useState(0);
  const [resultatMargeBruteN1, setResultatMargeBruteN1] = useState(0);
  const [variationMargeBruteN, setVariationMargeBruteN] = useState(0);
  const [evolutionMargeBruteN, setEvolutionMargeBruteN] = useState('');

  const [searchText, setSearchText] = useState("");

  const [moisN, setMoisN] = useState([]);

  const [typeAffichage, setTypeAffichage] = useState('Globale');

  const [journalData, setJournalData] = useState([]);

  const clearAllData = () => {
    setChiffresAffairesNGraph([]);
    setChiffresAffairesN1Graph([]);
    setMargeBruteNGraph([]);
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
    setResultatTresorerieGlobalN(0);
    setResultatTresorerieGlobalN1(0);
    setVariationTresorerieGlobalN(0);
    setEvolutionTresorerieGlobalN('');
    setResultatMargeBruteN(0);
    setResultatMargeBruteN1(0);
    setVariationMargeBruteN(0);
    setEvolutionMargeBruteN('');
    setJournalData([]);
    setMoisN([]);
  }

  const formatMontant = (num) => {
    if (num === null || num === undefined || isNaN(num)) return "-";
    return num.toLocaleString('fr-FR') + ` ${deviseParDefaut}`;
  };

  const formatePourcentage = (value, evolution) => {
    if (!value) return "0.00 %";
    const formatted = parseFloat(value).toFixed(2);
    return (evolution === "augmentation" ? "+" : evolution === "diminution" ? "-" : "") + formatted + " %";
  };

  const getColor = (evolution) => {
    if (evolution === "augmentation") return COLORS.success;
    if (evolution === "diminution") return COLORS.errror;
    return "#000";
  };

  const { auth } = useAuth();
  const decoded = auth?.accessToken ? jwtDecode(auth.accessToken) : undefined;
  const compteId = decoded.UserInfo.compteId || null;

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

          setMargeBruteNGraph(response?.data?.margeBruteN);

          setTresorerieBanqueNGraph(response?.data?.tresorerieBanqueN);

          setTresorerieCaisseNGraph(response?.data?.tresorerieCaisseN);

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

          setResultatTresorerieGlobalN(response?.data?.resultatTresorerieGlobalN);
          setResultatTresorerieGlobalN1(response?.data?.resultatTresorerieGlobalN1);
          setVariationTresorerieGlobalN(response?.data?.variationTresorerieGlobalN);
          setEvolutionTresorerieGlobalN(response?.data?.evolutionTresorerieGlobalN);

          setResultatMargeBruteN(response?.data?.resultatMargeBruteN);
          setResultatMargeBruteN1(response?.data?.resultatMargeBruteN1);
          setVariationMargeBruteN(response?.data?.variationMargeBruteN);
          setEvolutionMargeBruteN(response?.data?.evolutionMargeBruteN);

          setMoisN(response?.data?.moisNMapped);
        } else {
          toast.error(response?.data?.message);
          clearAllData();
        }
      })
      .catch((err) => {
        console.error(err);
        toast.error(err?.response?.data?.message || err?.message || "Erreur inconnue");
      });
  }

  //Choix période
  const handleChangePeriode = (choix) => {
    setSelectedPeriodeChoiceId(choix);

    if (choix === 0) {
      setSelectedPeriodeId(0);
    }
  }

  const GetListeDossier = (id) => {
    axios.get(`/home/FileInfos/${id}`).then((response) => {
      const resData = response.data;
      if (resData.state) {
        setFileInfos(resData.fileInfos[0]);
        setDossierAvecAnalytique(resData?.fileInfos[0].avecanalytique);
        setNoFile(false);
      } else {
        setFileInfos([]);
        setNoFile(true);
      }
    })
  }

  const GetListeExercice = (id) => {
    axios.get(`/paramExercice/listeExercice/${id}/${compteId}`).then((response) => {
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
        return
      }
    })
  }

  const getParDefaut = async () => {
    await axios.get(`/devises/devise/compte/${compteId}/${fileId}`).then((reponse => {
      const resData = reponse.data;
      const deviseParDefaut = resData.find(val => val.par_defaut === true);
      setDeviseParDefaut(deviseParDefaut?.code || 'MGA');
    }))
  }

  const handleChangeExercice = (exercice_id) => {
    setSelectedExerciceId(exercice_id);
  }

  // Chargement des périodes par exercice
  const getPeriodes = async () => {
    const id_exercice = Number(selectedExerciceId);

    axios.get(`/paramExercice/getPeriodes/${id_exercice}`)
      .then((response) => {
        if (response?.data?.state) {
          const data = response?.data?.data;
          setListePeriode(data);
        } else {
          toast.error(response?.data?.message);
        }
      });
  };

  const handleChangePeriod = (period_id) => {
    setSelectedPeriodeId(period_id);
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
        console.log('response?.data : ', response?.data);
        if (response?.data) {
          setJournalData(response?.data);
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

  const dataChiffreAffaire = moisN.map((mois, i) => ({
    x: mois,
    N: chiffresAffairesNGraph[i],
    N1: chiffresAffairesN1Graph[i],
  }));

  const dataMargeBruteN = moisN.map((mois, i) => ({
    x: mois,
    v: margeBruteNGraph[i],
  }));

  const dataTresorerieBanq = moisN.map((mois, i) => ({
    x: mois,
    v: tresorerieBanqueNGraph[i],
  }));

  const dateTresorerieCaisse = moisN.map((mois, i) => ({
    x: mois,
    v: tresorerieCaisseNGraph[i],
  }));

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
      saved.some(s => s.value === sec.id)
    ).map(item => ({ value: item.id, nom: item.section }))

    setSelectedSectionsId(matched);
  }, [sectionsData]);

  useEffect(() => {
    if (selectedExerciceId) {
      getPeriodes();
    }
  }, [selectedExerciceId]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div
          style={{
            background: '#fff',
            padding: '10px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          }}
        >
          <p style={{ margin: 0, fontWeight: 600 }}>{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.stroke, margin: '2px 0' }}>
              {entry.name}: {formatMontant(entry.value)}
            </p>
          ))}
        </div>
      );
    }

    return null;
  };

  const CustomTooltipN = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const mois = payload[0].payload.x;
      const valeur = payload[0].value;

      return (
        <div style={{ background: '#fff', padding: '10px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          <p style={{ margin: 0, fontWeight: 600 }}>{mois}</p>
          <p style={{ color: COLORS.navy, margin: 0 }}>Marge brute : {formatMontant(valeur)}</p>
        </div>
      );
    }
    return null;
  };

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
      <Stack>
        <Box sx={{ p: 4, width: '100%', boxSizing: 'border-box' }}>
          <Stack width={"100%"} spacing={4} alignItems={"left"} alignContent={"center"} direction={"column"} style={{ marginLeft: "0px", marginTop: "0px", marginBottom: '15px' }}>
            <Stack
              direction={"row"}
              style={{
                marginTop: '-20px'
              }}
            >
              <SelectExercice
                selectedExerciceId={selectedExerciceId}
                handleChangeExercice={handleChangeExercice}
                listeExercice={listeExercice}
                selectedPeriodeChoiceId={selectedPeriodeChoiceId}
                handleChangePeriode={handleChangePeriode}
                listePeriode={listePeriode}
                selectedPeriodeId={selectedPeriodeId}
                handleChangePeriod={handleChangePeriod}
              />

            </Stack>
          </Stack>
          <Stack
            style={{
              marginTop: '5px',
              marginBottom: '5px',
              marginLeft: '8px',
            }}
          >
            <RadioGroupState
              row
              value={typeAffichage}
              onChange={(val) => {
                setTypeAffichage(val);
                setAvecAnalytique(val === 'Analytique');
              }}
              options={[
                { value: 'Globale', label: 'Globale' },
                { value: 'Analytique', label: 'Avec analytique', disabled: !dossierAvecAnalytique },
              ]}
            />
          </Stack>

          {
            avecAnalytique && (
              <Stack
                direction={'row'}
                spacing={2}
                alignItems={'flex-end'}
                style={{
                  marginTop: '10px',
                  marginLeft: '8px',
                  width: '100%',
                  backgroundColor: '#F4F9F9',
                  borderRadius: "5px",
                  marginBottom: '15px'
                }}
              >
                <AutocompleteState
                  label="Axe"
                  width="250px"
                  options={axesData.map(item => ({ value: item.id, label: item.code }))}
                  value={selectedAxeId}
                  setValue={setSelectedAxeId}
                />

                <AutocompleteMultipleState
                  label="Sections"
                  width={400}
                  options={sectionsData.map(item => ({ value: item.id, nom: item.section }))}
                  value={selectedSectionsId}
                  setValue={(newValue) => {
                    setSelectedSectionsId(newValue);
                    localStorage.setItem('sectionIds', JSON.stringify(newValue));

                    if (newValue.length === 0) {
                      clearAllData();
                    }
                  }}
                />

              </Stack>
            )
          }

          <Grid container spacing={2} sx={{ mb: 3 }}>
            {[
              { label: 'RÉSULTAT NET', n: formatMontant(resultatN), n1: formatMontant(resultatN1), evo: formatePourcentage(variationResultatN, evolutionResultatN), color: getColor(evolutionResultatN), style: true },
              { label: 'CHIFFRE D\'AFFAIRES', n: formatMontant(resultatChiffreAffaireN), n1: formatMontant(resultatChiffreAffaireN1), evo: formatePourcentage(variationChiffreAffaireN, evolutionChiffreAffaireN), color: getColor(evolutionChiffreAffaireN), style: false },
              { label: 'MARGES BRUTES', n: formatMontant(resultatMargeBruteN), n1: formatMontant(resultatMargeBruteN1), evo: formatePourcentage(variationMargeBruteN, evolutionMargeBruteN), color: getColor(evolutionMargeBruteN), style: false },
              { label: 'DÉPENSES ACHATS', n: formatMontant(resultatDepenseAchatN), n1: formatMontant(resultatDepenseAchatN1), evo: formatePourcentage(variationDepenseAchatN, evolutionDepenseAchatN), color: getColor(evolutionDepenseAchatN), style: false },
              { label: 'SALARIALES', n: formatMontant(resultatDepenseSalarialeN), n1: formatMontant(resultatDepenseSalarialeN1), evo: formatePourcentage(variationDepenseSalarialeN, evolutionDepenseSalarialeN), color: getColor(evolutionDepenseSalarialeN), style: false },
              { label: 'TRÉSORERIE GLOBALE', n: formatMontant(resultatTresorerieGlobalN), n1: formatMontant(resultatTresorerieGlobalN1), evo: formatePourcentage(variationTresorerieGlobalN, evolutionTresorerieGlobalN), color: getColor(evolutionTresorerieGlobalN), style: false },
            ].map((item, i) => (
              <Grid item xs={12} md={2} key={i}>
                <Paper sx={kpiStyle(item.style)}>
                  <Typography variant="caption" sx={{ color: item.style ? null : '#64748B', fontWeight: 800, fontSize: '0.7rem', letterSpacing: 0.5 }}>{item.label} (N)</Typography>
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 900, lineHeight: 1, fontSize: '1.2rem', color: item.style ? null : COLORS.navy }}>{item.n}</Typography>
                    <Typography variant="body1" sx={{ color: item.style ? null : '#94A3B8', fontSize: '0.85rem', fontWeight: 600, mt: 0.8 }}>
                      N-1 : {item.n1}
                    </Typography>
                  </Box>
                  <Typography variant="body1" sx={{ color: item.color, fontWeight: 900, fontSize: '0.85rem' }}>{item.evo} vs N-1</Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
          <Grid container spacing={2}>

            <Grid item xs={12} lg={8}>
              <Stack spacing={2}>
                <Paper sx={{ p: 3, borderRadius: '16px', border: `1px solid ${COLORS.border}`, height: '420px' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 4, letterSpacing: 1 }}>ÉVOLUTION DU CHIFFRE D'AFFAIRES (N vs N-1)</Typography>
                  <Box sx={{ width: '100%', height: '320px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={dataChiffreAffaire}
                        margin={{ left: -50 }}
                      >
                        <defs>
                          <linearGradient id="colorCA" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={COLORS.electric} stopOpacity={0.2} />
                            <stop offset="95%" stopColor={COLORS.electric} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                        <XAxis dataKey="x" axisLine={false} tickLine={false} tick={false} />
                        <YAxis
                          axisLine={false}
                          tick={false}
                          tickLine={false}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Area type="monotone" dataKey="N" stroke={COLORS.electric} strokeWidth={4} fill="url(#colorCA)" />
                        <Area type="monotone" dataKey="N1" stroke="#CBD5E1" strokeWidth={2} fill="none" strokeDasharray="5 5" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </Box>
                </Paper>

                <Paper sx={{ borderRadius: '16px', border: `1px solid ${COLORS.border}`, overflow: 'hidden' }}>
                  <Box sx={{ p: 2, bgcolor: COLORS.navy, color: '#FFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" sx={{ fontWeight: 900, letterSpacing: 1.5 }}>DÉTAILS COMPTES D'ATTENTE (CLASSE 47)</Typography>
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
                        }
                      }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <FiSearch color="#757575" />
                          </InputAdornment>
                        ),
                      }}
                    />
                    < Chip label="Opérations à lettrer" size="small" sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: '#FFF', fontSize: '0.65rem', fontWeight: 700 }} />
                  </Box>
                  <Stack>
                    <VirtualTableJournalAttente
                      tableHeader={columns}
                      tableRow={filteredData}
                    />
                  </Stack>
                </Paper>
              </Stack>
            </Grid>

            <Grid item xs={12} lg={4}>
              <Stack spacing={2}>
                <Paper sx={{ p: 2, borderRadius: '16px', border: `1px solid ${COLORS.border}`, height: '275px', display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="caption" sx={{ fontWeight: 900, color: '#64748B', mb: 2, letterSpacing: 0.5 }}>ANALYSE MARGES BRUTES</Typography>
                  <Box sx={{ flexGrow: 1 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dataMargeBruteN} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                        <Bar dataKey="v" fill={COLORS.navy} radius={[4, 4, 0, 0]} />
                        <Tooltip content={<CustomTooltipN />} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </Paper>

                <Paper sx={{ p: 2, borderRadius: '16px', border: `1px solid ${COLORS.border}`, height: '275px', display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="caption" sx={{ fontWeight: 900, color: '#64748B', mb: 2, letterSpacing: 0.5 }}>SOLDE BANQUE</Typography>
                  <Box sx={{ flexGrow: 1 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={dataTresorerieBanq} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                        <Area type="monotone" dataKey="v" stroke={COLORS.electric} fill={COLORS.electric} fillOpacity={0.15} strokeWidth={3} />
                        <Tooltip content={<CustomTooltipN />} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </Box>
                </Paper>

                <Paper sx={{ p: 2, borderRadius: '16px', border: `1px solid ${COLORS.border}`, height: '275px', display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="caption" sx={{ fontWeight: 900, color: '#64748B', mb: 2, letterSpacing: 0.5 }}>SOLDE CAISSE</Typography>
                  <Box sx={{ flexGrow: 1 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={dateTresorerieCaisse}>
                        <Area type="monotone" dataKey="v" stroke={COLORS.cyan} fill={COLORS.cyan} fillOpacity={0.15} strokeWidth={3} />
                        <Tooltip content={<CustomTooltipN />} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </Box>
                </Paper>
              </Stack>
            </Grid>

          </Grid>
        </Box >
      </Stack >
    </>
  );
};
export default DashboardFinalOptimized;