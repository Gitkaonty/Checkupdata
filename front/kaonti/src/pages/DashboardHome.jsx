import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Typography, Stack, Paper, Grid, Button, LinearProgress, CircularProgress } from '@mui/material';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import PopupTestSelectedFile from './popupTestSelectedFile';
import axios from '../../config/axios';
import Box from '@mui/material/Box';
import TabContext from '@mui/lab/TabContext';
import TabPanel from '@mui/lab/TabPanel';
import KPICard from './DashboardCard';
import { format } from 'date-fns';
import useAuth from '../hooks/useAuth';
import { jwtDecode } from 'jwt-decode';
import toast from 'react-hot-toast';
import usePermission from '../hooks/usePermission';
import { Line } from 'react-chartjs-2';
import useAxiosPrivate from '../hooks/useAxiosPrivate';
import { useExercicePeriode } from '../context/ExercicePeriodeContext';
import ExercicePeriodeSelector from './ExercicePeriodeSelector';
import {
  ErrorOutline, CheckCircleOutline, TrendingUpOutlined,
  AccountBalanceWalletOutlined, PaymentsOutlined,
  BarChartOutlined, ChevronRight,
  ArrowForwardOutlined, HistoryToggleOffOutlined,
  HomeOutlined,
  NavigateNext
} from '@mui/icons-material';
import AssessmentIcon from "@mui/icons-material/Assessment";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import SearchIcon from "@mui/icons-material/Search";

const SECTIONS_CONFIG = [
  {
    title: "Analyses analytiques",
    items: [
      {
        id: "revueNN1",
        title: "Revue analytique N/N-1",
        icon: <AssessmentIcon />,
        endpoint: "/dashboard/revuAnalytiqueNN1",
        route: "/tab/dashboard/revuAnalytiqueNN1",
        typeRevue: "analytiqueNN1",
        hasAnomalies: true,
        anomalies: 0,
        remaining: 0
      },
      {
        id: "revueMensuelle",
        title: "Revue analytique mensuelle",
        icon: <AssessmentIcon />,
        endpoint: "",
        route: "",
        typeRevue: "",
        hasAnomalies: false,
        anomalies: 0,
        remaining: 0
      }
    ]
  },
  {
    title: "Analyses comptables",
    items: [
      {
        id: "analyseGlobale",
        title: "Analyse globale des comptes",
        icon: <AccountBalanceIcon />,
        endpoint: "/administration/revisionControleAuto",
        route: "/tab/administration/revision",
        typeRevue: "controleAuto",
        hasAnomalies: true,
        anomalies: 0,
        remaining: 0
      },
      {
        id: "analyseFournisseurClient",
        title: "Analyse fournisseur / Client",
        icon: <AccountBalanceIcon />,
        endpoint: "/administration/revisionFournisseurClient",
        route: "/tab/administration/revisionFournisseurClient",
        typeRevue: "fournisseurClient",
        hasAnomalies: true,
        anomalies: 0,
        remaining: 0
      }
    ]
  },
  {
    title: "Contrôles & anomalies",
    items: [
      {
        id: "rechercheDoublon",
        title: "Recherche doublon",
        icon: <SearchIcon />,
        endpoint: "/administration/rechercheDoublon",
        route: "/tab/administration/revisiondoublon",
        typeRevue: "doublons",
        hasAnomalies: true,
        anomalies: 0,
        remaining: 0
      },
      {
        id: "controleCodeAnalytique",
        title: "Contrôle code analytique",
        icon: <SearchIcon />,
        endpoint: "/administration/revisionAnalytique",
        route: "/tab/administration/revisionAnalytique",
        typeRevue: "analytique",
        hasAnomalies: true,
        anomalies: 0,
        remaining: 0
      }
    ]
  }
];

// Format date as dd/mm/yyyy
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = String(date.getFullYear());
  return `${dd}/${mm}/${yyyy}`;
};

const NAV_DARK = '#0B1120';
const BG_SOFT = '#F8FAFC';

// Petit graphique de tendance interne
const SparklineMini = ({ data = [], color = '#3B82F6', width = 200, height = 80 }) => {
  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - (min * 0.9) || 1; // Un peu de marge en bas

  const points = data.map((val, i) => ({
    x: (i / (data.length - 1)) * width,
    y: height - ((val - min) / range) * (height * 0.7) - (height * 0.15)
  }));

  // 1. Chemin de la ligne (la courbe)
  let linePath = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cp1x = prev.x + (curr.x - prev.x) * 0.4;
    const cp2x = curr.x - (curr.x - prev.x) * 0.4;
    linePath += ` C ${cp1x} ${prev.y}, ${cp2x} ${curr.y}, ${curr.x} ${curr.y}`;
  }

  // 2. Chemin pour le remplissage (on ferme la forme vers le bas)
  // On part de la fin de la courbe, on descend au coin bas-droit, puis bas-gauche
  const fillPath = `${linePath} L ${width} ${height} L 0 ${height} Z`;

  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      <defs>
        {/* Dégradé pour l'effet de fond */}
        <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* La zone remplie */}
      <path d={fillPath} fill={`url(#gradient-${color})`} stroke="none" />

      {/* La ligne de la courbe */}
      <path d={linePath} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
};

const dashboardCardHeight = 100;
const dashboardCardMinWidth = 80;

export default function DashboardComponent() {

  // Liste enrichie des points de contrôle
  const pointsDeControle = [
    { nom: 'Revue analytique N / N-1', anomalies: 12, restantes: 2, status: 85 },
    { nom: 'Revue analytique mensuelle', anomalies: 0, restantes: 0, status: 100 },
    { nom: 'Contrôle global balance', anomalies: 45, restantes: 28, status: 40 },
    { nom: 'Analyse Fournisseurs / Clients', anomalies: 30, restantes: 12, status: 60 },
    { nom: 'Recherche de doublons', anomalies: 8, restantes: 1, status: 95 },
    { nom: 'Contrôle codes analytiques', anomalies: 50, restantes: 40, status: 20 },
    { nom: 'Écritures en suspens', anomalies: 15, restantes: 15, status: 0 },
  ];

  const { canAdd, canModify, canDelete, canView } = usePermission();

  const [valueRevuAnalytique, setValueRevuAnalytique] = useState('1');

  const [fileInfos, setFileInfos] = useState('');
  const [noFile, setNoFile] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams();
  const [fileId, setFileId] = useState(0);
  const [listeExercice, setListeExercice] = useState([]);
  const [listeSituation, setListeSituation] = useState([]);
  const [loading, setLoading] = useState(false);
  const axiosPrivate = useAxiosPrivate();
  const { id: routeDossierId } = useParams();


  const {
    selectedExerciceId,
    selectedPeriodeId,
    selectedPeriodeDates,
    handleChangeExercice,
    handleChangePeriode,
    loading: contextLoading,
    getApiParams
  } = useExercicePeriode();

  const [sectionsData, setSectionsData] = useState(SECTIONS_CONFIG);
  const [loadingStats, setLoadingStats] = useState(false);
  const [resultats, setResultats] = useState([]);

  //récupération des informations de connexion
  const { auth } = useAuth();
  const decoded = auth?.accessToken ? jwtDecode(auth.accessToken) : undefined;
  const compteId = decoded.UserInfo.compteId || null;
  const userId = decoded.UserInfo.userId || null;

  const [deviseParDefaut, setDeviseParDefaut] = useState([]);

  const [chiffresAffairesNGraph, setChiffresAffairesNGraph] = useState([]);
  const [chiffresAffairesN1Graph, setChiffresAffairesN1Graph] = useState([]);

  const [moisN, setmoisN] = useState([]);
  const [moisN1, setmoisN1] = useState([]);

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

  const handleChangeRevuAnalytiqueTab = (event, newValue) => {
    setValueRevuAnalytique(newValue);
  };

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

  // Récupération de toutes les informations
  const getAllInfo = () => {
    console.log('>>> getAllInfo APPELÉ <<<');
    console.log('selectedExerciceId:', selectedExerciceId, '| selectedPeriodeDates:', selectedPeriodeDates);

    // Utiliser exerciceId pour l'API, avec dates de periode si selectionnee
    let url = `/dashboard/getAllInfo/${Number(compteId)}/${Number(fileId)}/${Number(selectedExerciceId)}`;
    if (selectedPeriodeDates && selectedPeriodeId) {
      url += `?date_debut=${selectedPeriodeDates.date_debut}&date_fin=${selectedPeriodeDates.date_fin}&id_periode=${selectedPeriodeId}`;
      console.log('URL avec période:', url);
    } else {
      console.log('URL sans période (exercice complet):', url);
    }

    axios.get(url)
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

          setmoisN(response?.data?.moisN);
          setmoisN1(response?.data?.moisN1);

          // Logs pour debug des variations
          // console.log('=== DEBUG VARIATIONS ===');
          // console.log('Période:', selectedPeriodeDates ? `${selectedPeriodeDates.date_debut} - ${selectedPeriodeDates.date_fin}` : 'Exercice complet');
          // console.log('--- RÉSULTAT ---');
          // console.log('N:', response?.data?.resultatN, '| N-1:', response?.data?.resultatN1, '| Variation:', response?.data?.variationResultatN?.toFixed(2) + '%');
          // console.log('--- CHIFFRE D\'AFFAIRES ---');
          // console.log('N:', response?.data?.resultatChiffreAffaireN, '| N-1:', response?.data?.resultatChiffreAffaireN1, '| Variation:', response?.data?.variationChiffreAffaireN?.toFixed(2) + '%');
          // console.log('--- DÉPENSES ACHATS ---');
          // console.log('N:', response?.data?.resultatDepenseAchatN, '| N-1:', response?.data?.resultatDepenseAchatN1, '| Variation:', response?.data?.variationDepenseAchatN?.toFixed(2) + '%');
          // console.log('--- DÉPENSES SALARIALES ---');
          // console.log('N:', response?.data?.resultatDepenseSalarialeN, '| N-1:', response?.data?.resultatDepenseSalarialeN1, '| Variation:', response?.data?.variationDepenseSalarialeN?.toFixed(2) + '%');
          // console.log('--- TRÉSORERIE BANQUE ---');
          // console.log('N:', response?.data?.resultatTresorerieBanqueN, '| N-1:', response?.data?.resultatTresorerieBanqueN1, '| Variation:', response?.data?.variationTresorerieBanqueN?.toFixed(2) + '%');
          // console.log('--- TRÉSORERIE CAISSE ---');
          // console.log('N:', response?.data?.resultatTresorerieCaisseN, '| N-1:', response?.data?.resultatTresorerieCaisseN1, '| Variation:', response?.data?.variationTresorerieCaisseN?.toFixed(2) + '%');
          // console.log('========================');
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
      setDeviseParDefaut(deviseParDefaut?.code || '€');
    }))
  }

  const getListeJournalEnAttente = () => {
    // Utiliser les dates de periode si selectionnee, sinon exercice complet
    const url = selectedPeriodeDates
      ? `/dashboard/getListeJournalEnAttente/${Number(compteId)}/${Number(fileId)}/${Number(selectedExerciceId)}?date_debut=${selectedPeriodeDates.date_debut}&date_fin=${selectedPeriodeDates.date_fin}`
      : `/dashboard/getListeJournalEnAttente/${Number(compteId)}/${Number(fileId)}/${Number(selectedExerciceId)}`;

    axios.get(url)
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
  }, []);

  useEffect(() => {
    if (compteId && fileId && selectedExerciceId && canView) {
      getAllInfo();
      getParDefaut();
      getListeJournalEnAttente();
    }
  }, [compteId, fileId, selectedExerciceId, selectedPeriodeDates]);

  const KpiCard = ({ title, value, color, icon, progress, trend }) => (
    <Paper elevation={0} sx={{ p: 3, border: '1px solid #E2E8F0', borderRadius: '16px', bgcolor: '#F8FAFC', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', position: 'relative' }}>
      <Stack direction="row" spacing={2.5} alignItems="center">
        <Box sx={{ p: 1.8, bgcolor: '#FFFFFF', color: color, borderRadius: '12px', display: 'flex', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', '& svg': { fontSize: 28 } }}>
          {icon}
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.75rem' }}>{title}</Typography>
          <Typography variant="h4" sx={{ fontWeight: 900, color: '#0F172A', lineHeight: 1.2 }}>{value}</Typography>
        </Box>
        {progress !== undefined && (
          <Box sx={{ position: 'relative', display: 'inline-flex' }}>
            <CircularProgress
              variant="determinate"
              value={100}
              size={50}
              sx={{
                color: '#E2E8F0',
                position: 'absolute',
                '& .MuiCircularProgress-circle': {
                  strokeLinecap: 'round',
                },
              }}
            />
            <CircularProgress
              variant="determinate"
              value={progress}
              size={50}
              sx={{
                color: color,
                '& .MuiCircularProgress-circle': {
                  strokeLinecap: 'round',
                },
              }}
            />
            <Box
              sx={{
                top: 0,
                left: 0,
                bottom: 0,
                right: 0,
                position: 'absolute',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography variant="caption" component="div" sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748B' }}>
                {`${progress}%`}
              </Typography>
            </Box>
          </Box>
        )}
      </Stack>
      {/* {trend && (
        <Box sx={{ position: 'absolute', bottom: 10, right: 10 }}>
          <SparklineMini data={trend} color={color} />
        </Box>
      )} */}
    </Paper>
  );

  const fetchAnomalyStats = async (typeRevue, endpoint) => {
    try {
      const { id_compte, id_dossier, id_exercice } = getIds();

      let url;

      // Construire l'URL selon le type de revue
      switch (typeRevue) {
        case 'controleAuto':
          url = `/administration/revisionControleAuto/${id_compte}/${id_dossier}/${id_exercice}/stats`;
          if (selectedPeriodeId && selectedPeriodeId !== 'exercice') {
            url += `?id_periode=${selectedPeriodeId}`;
          }
          break;
        case 'fournisseurClient':
          url = `/administration/revisionFournisseurClient/${id_compte}/${id_dossier}/${id_exercice}/stats`;
          if (selectedPeriodeId && selectedPeriodeId !== 'exercice') {
            url += `?id_periode=${selectedPeriodeId}`;
          }
          break;
        case 'doublons':
          url = `/administration/rechercheDoublon/${id_compte}/${id_dossier}/${id_exercice}/stats`;
          if (selectedPeriodeId && selectedPeriodeId !== 'exercice') {
            url += `?id_periode=${selectedPeriodeId}`;
          }
          break;
        case 'analytique': {
          url = `/administration/revisionAnalytique/${id_compte}/${id_dossier}/${id_exercice}`;
          const analytiqueParams = new URLSearchParams();
          if (selectedPeriodeId && selectedPeriodeId !== 'exercice') {
            analytiqueParams.append('id_periode', selectedPeriodeId);
          }
          const analytiqueResponse = await axiosPrivate.get(url + (analytiqueParams.toString() ? `?${analytiqueParams.toString()}` : ''));
          if (analytiqueResponse.data.state && analytiqueResponse.data.data) {
            const rows = analytiqueResponse.data.data;
            const totalAnomalies = rows.length;
            const nonValidees = rows.filter(r => r.valide === false || r.valide === 0).length;
            return { anomalies: totalAnomalies, remaining: nonValidees || totalAnomalies };
          }
          return { anomalies: 0, remaining: 0 };
        }
        case 'analytiqueNN1':
        case 'analytiqueMensuelle':
        default:
          url = `/revuAnalytiqueStats/totals?id_compte=${id_compte}&id_dossier=${id_dossier}&id_exercice=${id_exercice}&type_revue=${typeRevue}`;
          // Ajouter les paramètres de période pour les revues analytiques
          if (selectedPeriodeId && selectedPeriodeId !== 'exercice') {
            url += `&id_periode=${selectedPeriodeId}`;
          }
          if (selectedPeriodeDates) {
            url += `&date_debut=${selectedPeriodeDates.date_debut}&date_fin=${selectedPeriodeDates.date_fin}`;
          }
          break;
      }

      const response = await axiosPrivate.get(url);

      if (response.data.state && response.data.data) {
        const data = response.data.data;
        return {
          anomalies: data.total_anomalies || data.nbLignes || data.total || 0,
          remaining: data.restantes || data.remaining || data.nbGroupes || data.nonValide || 0
        };
      }
      return { anomalies: 0, remaining: 0 };
    } catch (error) {
      console.error(`Error fetching stats for ${typeRevue}:`, error);
      return { anomalies: 0, remaining: 0 };
    }
  };
  // Vérifier si un dossier est sélectionné au chargement
  useEffect(() => {
    const dossierFromSessionRaw = sessionStorage.getItem('fileId');
    const dossierFromSession = parseInt(dossierFromSessionRaw, 10);
    const dossierFromRoute = parseInt(routeDossierId, 10);

    const resolvedDossierId = Number.isFinite(dossierFromSession) && dossierFromSession !== 0
      ? dossierFromSession
      : (Number.isFinite(dossierFromRoute) && dossierFromRoute !== 0 ? dossierFromRoute : 0);

    if (!resolvedDossierId) {
      setNoFile(true);
      setFileId(0);
    } else {
      setFileId(resolvedDossierId);
      setNoFile(false);
    }
  }, [routeDossierId]);

  // Fonction pour charger toutes les statistiques
  const loadAllStats = async () => {
    if (!selectedExerciceId) return;

    setLoadingStats(true);
    try {
      const { id_compte, id_dossier, id_exercice } = getIds();

      // D'abord, déclencher la sauvegarde des anomalies pour la période sélectionnée
      if (selectedPeriodeDates) {
        try {
          // Appeler l'endpoint de revue analytique N/N-1 pour sauvegarder les anomalies
          await axiosPrivate.get(`/dashboard/revuAnalytiqueNN1/${id_compte}/${id_dossier}/${id_exercice}?date_debut=${selectedPeriodeDates.date_debut}&date_fin=${selectedPeriodeDates.date_fin}&id_periode=${selectedPeriodeId}`);

          // Appeler l'endpoint de revue analytique mensuelle pour sauvegarder les anomalies
          await axiosPrivate.get(`/dashboard/revuAnalytiqueMensuelle/${id_compte}/${id_dossier}/${id_exercice}?date_debut=${selectedPeriodeDates.date_debut}&date_fin=${selectedPeriodeDates.date_fin}&id_periode=${selectedPeriodeId}`);

        } catch (error) {
          console.error('[SyntheseAnomalies] Erreur lors de la sauvegarde des anomalies:', error);
        }
      }

      const updatedSections = [...sectionsData];

      for (let section of updatedSections) {
        for (let item of section.items) {
          if (item.hasAnomalies && item.typeRevue) {
            const stats = await fetchAnomalyStats(item.typeRevue, item.endpoint);
            item.anomalies = stats.anomalies;
            item.remaining = stats.remaining;
          }
        }
      }

      setSectionsData(updatedSections);
    } catch (error) {
      console.error('[SyntheseAnomalies] ❌ Error loading stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const getIds = () => {
    const dossierFromRoute = parseInt(routeDossierId, 10);
    const dossierFromSession = parseInt(sessionStorage.getItem('fileId'), 10);
    return {
      id_compte: parseInt(jwtDecode(auth?.accessToken)?.UserInfo?.compteId) || parseInt(sessionStorage.getItem('compteId'), 10) || 1,
      id_dossier: Number.isFinite(dossierFromSession)
        ? dossierFromSession
        : (Number.isFinite(dossierFromRoute) ? dossierFromRoute : 1),
      id_exercice: selectedExerciceId || parseInt(sessionStorage.getItem('exerciceId'), 10) || 1
    };
  };

  const allItems = sectionsData.flatMap(s => s.items);
  const totalAnomalies = allItems.reduce((sum, i) => sum + (Number(i.anomalies) || 0), 0);
  const totalRemaining = allItems.reduce((sum, i) => sum + (Number(i.remaining) || 0), 0);
  const totalValidated = totalAnomalies - totalRemaining;

  const globalProgress =
    totalAnomalies === 0 ? 0 : Math.round((totalValidated / totalAnomalies) * 100);

  // Tendances dynamiques basées sur les données réelles des sections
  const trendAnomalies = sectionsData.flatMap(s => s.items).map(i => Number(i.anomalies) || 0);
  const trendRemaining = sectionsData.flatMap(s => s.items).map(i => Number(i.remaining) || 0);

  // useEffect pour charger les statistiques quand exercice ou période change
  useEffect(() => {
    if (selectedExerciceId > 0) {
      // Ne charger les stats que si une période est sélectionnée
      if (selectedPeriodeId && selectedPeriodeId !== 'exercice') {
        loadAllStats();
      } else {
        // Pas de période sélectionnée : réinitialiser toutes les stats à zéro
        const resetSections = SECTIONS_CONFIG.map(section => ({
          ...section,
          items: section.items.map(item => ({
            ...item,
            anomalies: 0,
            remaining: 0
          }))
        }));
        setSectionsData(resetSections);
      }
    }
  }, [selectedExerciceId, selectedPeriodeDates, selectedPeriodeId]);

  // Listener pour rafraîchissement automatique après validation depuis un autre composant
  useEffect(() => {
    const handleAnomaliesUpdated = (event) => {
      const { id_compte, id_dossier, id_exercice, id_periode } = event.detail || {};
      const currentIds = getIds();

      // Vérifier que l'event concerne bien le contexte actuel
      const matchCompte = String(id_compte) === String(currentIds.id_compte);
      const matchDossier = String(id_dossier) === String(currentIds.id_dossier);
      const matchExercice = String(id_exercice) === String(currentIds.id_exercice);

      if (matchCompte && matchDossier && matchExercice) {
        console.log('[SyntheseAnomalies] ✅ Match OK - Rafraîchissement auto après validation');
        loadAllStats();
      } else {
        console.log('[SyntheseAnomalies] ❌ Match FAILED - Pas de rafraîchissement');
      }
    };

    // Écouter l'event CustomEvent (même onglet)
    window.addEventListener('anomalies:updated', handleAnomaliesUpdated);

    // Écouter localStorage (autres onglets)
    const handleStorageChange = (e) => {
      if (e.key === 'anomalies:updated') {
        try {
          const payload = JSON.parse(e.newValue);
          handleAnomaliesUpdated({ detail: payload });
        } catch (err) {
          console.error('[SyntheseAnomalies] Erreur parsing localStorage:', err);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // Vérifier au focus/visibility si une mise à jour est en attente
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const pending = localStorage.getItem('anomalies:updated');
        if (pending) {
          try {
            const payload = JSON.parse(pending);
            handleAnomaliesUpdated({ detail: payload });
            localStorage.removeItem('anomalies:updated');
          } catch (err) {
            console.error('[SyntheseAnomalies] Erreur parsing pending:', err);
          }
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('anomalies:updated', handleAnomaliesUpdated);
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [selectedExerciceId, selectedPeriodeId, selectedPeriodeDates]);

  const handleNavigateToDetails = (item) => {
    if (!item.route) return;
    // Cas spécial: Analyse globale => déclencher la révision tout de suite
    if (item.id === 'analyseGlobale') {
      (async () => {
        if (!selectedExerciceId) return;

        // Exiger une période spécifique
        if (!selectedPeriodeId || selectedPeriodeId === 'exercice' || !selectedPeriodeDates) {
          alert('Veuillez sélectionner une période avant de lancer la révision.');
          return;
        }

        try {
          const { id_compte, id_dossier, id_exercice } = getIds();
          let executeUrl = `/administration/revisionControleAuto/${id_compte}/${id_dossier}/${id_exercice}/executeAll`;

          const params = new URLSearchParams();
          params.append('date_debut', selectedPeriodeDates.date_debut);
          params.append('date_fin', selectedPeriodeDates.date_fin);
          params.append('id_periode', selectedPeriodeId);
          executeUrl += `?${params.toString()}`;

          await axiosPrivate.post(executeUrl);
        } catch (error) {
          console.error('[SyntheseAnomalies] Erreur lors du lancement de la révision globale:', error);
        }

        const { id_compte, id_dossier, id_exercice } = getIds();
        let url = `${window.location.origin}${item.route}/${id_dossier}/${id_exercice}`;
        const navParams = new URLSearchParams();
        navParams.append('date_debut', selectedPeriodeDates.date_debut);
        navParams.append('date_fin', selectedPeriodeDates.date_fin);
        if (selectedPeriodeId) {
          navParams.append('id_periode', selectedPeriodeId);
        }
        url += `?${navParams.toString()}`;
        window.open(url, '_blank');
      })();
      return;
    }

    const { id_compte, id_dossier, id_exercice } = getIds();
    let url = `${window.location.origin}${item.route}/${id_compte}/${id_dossier}/${id_exercice}`;

    // Ajouter les paramètres de date si une période est sélectionnée
    if (selectedPeriodeDates) {
      const params = new URLSearchParams();
      params.append('date_debut', selectedPeriodeDates.date_debut);
      params.append('date_fin', selectedPeriodeDates.date_fin);
      if (selectedPeriodeId) {
        params.append('id_periode', selectedPeriodeId);
      }
      url += `?${params.toString()}`;
    } else if (selectedExerciceId) {
      const exercice = listeExercice.find(e => e.id === selectedExerciceId);
      if (exercice) {
        const params = new URLSearchParams();
        params.append('date_debut', exercice.date_debut);
        params.append('date_fin', exercice.date_fin);
        url += `?${params.toString()}`;
      }
    }


    window.open(url, '_blank');
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
      <Box sx={{ height: 'calc(100vh - 110px)', width: 'calc(100vw - 130px)' }}>
        <TabContext value={"1"}>
          <TabPanel value="1" style={{ height: '100%', padding: 0, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              flex: 1,
              minHeight: 0,
              overflow: 'hidden'
            }}>
              <Typography variant='h6' sx={{ color: NAV_DARK, fontWeight: 800, mb: 0 }} align='left'>Dashboard</Typography>

              <Box width={"100%"} sx={{ mb: -1, ml: 2 }}>
                <Stack
                  direction={"row"}
                >
                  <ExercicePeriodeSelector
                    selectedExerciceId={selectedExerciceId}
                    selectedPeriodeId={selectedPeriodeId}
                    onExerciceChange={handleChangeExercice}
                    onPeriodeChange={handleChangePeriode}
                    disabled={loading}
                    size="small"
                  />
                </Stack>
              </Box>

              <Stack
                width={'100%'}
              >
                <Stack
                  direction="row"
                  spacing={0.5}
                  sx={{
                    flexWrap: 'nowrap',
                    overflowX: 'auto',
                    pb: 2,
                    gap: 1,
                    justifyContent: 'flex-start',
                    alignItems: 'stretch',
                    width: '100%',
                    '&::-webkit-scrollbar': { display: 'none' },
                    msOverflowStyle: 'none',
                    scrollbarWidth: 'none',
                  }}
                >
                  <KPICard
                    title={'Résultat'}
                    color={'#037934'}
                    resultatN={resultatN}
                    resultatN1={resultatN1}
                    variationN={variationResultatN}
                    variationN1={variationResultatN1}
                    evolutionN={evolutionResultatN}
                    evolutionN1={evolutionResultatN1}
                    trendN={margeBruteNGraph}
                    devise={deviseParDefaut}
                    compact
                    sx={{ minWidth: dashboardCardMinWidth, height: dashboardCardHeight, flex: '1 1 0' }}
                  />

                  <KPICard
                    title={"Chiffre d'affaires"}
                    color={'#037934'}
                    resultatN={resultatChiffreAffaireN}
                    resultatN1={resultatChiffreAffaireN1}
                    variationN={variationChiffreAffaireN}
                    variationN1={variationChiffreAffaireN1}
                    evolutionN={evolutionChiffreAffaireN}
                    evolutionN1={evolutionChiffreAffaireN1}
                    trendN={chiffresAffairesNGraph}
                    devise={deviseParDefaut}
                    compact
                    sx={{ minWidth: dashboardCardMinWidth, height: dashboardCardHeight, flex: '1 1 0' }}
                  />

                  <KPICard
                    title={'Dépenses (Achats)'}
                    color={'#fb8c00'}
                    resultatN={resultatDepenseAchatN}
                    resultatN1={resultatDepenseAchatN1}
                    variationN={variationDepenseAchatN}
                    variationN1={variationDepenseAchatN1}
                    evolutionN={evolutionDepenseAchatN}
                    evolutionN1={evolutionDepenseAchatN1}
                    trendN={chiffresAffairesNGraph}
                    devise={deviseParDefaut}
                    compact
                    sx={{ minWidth: dashboardCardMinWidth, height: dashboardCardHeight, flex: '1 1 0' }}
                  />

                  <KPICard
                    title={'Dépenses salariales'}
                    color={'#fb8c00'}
                    resultatN={resultatDepenseSalarialeN}
                    resultatN1={resultatDepenseSalarialeN1}
                    variationN={variationDepenseSalarialeN}
                    variationN1={variationDepenseSalarialeN1}
                    evolutionN={evolutionDepenseSalarialeN}
                    evolutionN1={evolutionDepenseSalarialeN1}
                    trendN={margeBruteNGraph}
                    devise={deviseParDefaut}
                    compact
                    sx={{ minWidth: dashboardCardMinWidth, height: dashboardCardHeight, flex: '1 1 0' }}
                  />

                  <KPICard
                    title={'Trésoreries (Banques)'}
                    color={'#095a9c'}
                    resultatN={resultatTresorerieBanqueN}
                    resultatN1={resultatTresorerieBanqueN1}
                    variationN={variationTresorerieBanqueN}
                    variationN1={variationTresorerieBanqueN1}
                    evolutionN={evolutionTresorerieBanqueN}
                    evolutionN1={evolutionTresorerieBanqueN1}
                    trendN={tresorerieBanqueNGraph}
                    devise={deviseParDefaut}
                    compact
                    sx={{ minWidth: dashboardCardMinWidth, height: dashboardCardHeight, flex: '1 1 0' }}
                  />

                  <KPICard
                    title={'Trésoreries (Caisse)'}
                    color={'#095a9c'}
                    resultatN={resultatTresorerieCaisseN}
                    resultatN1={resultatTresorerieCaisseN1}
                    variationN={variationTresorerieCaisseN}
                    variationN1={variationTresorerieCaisseN1}
                    evolutionN={evolutionTresorerieCaisseN}
                    evolutionN1={evolutionTresorerieCaisseN1}
                    trendN={tresorerieCaisseNGraph}
                    devise={deviseParDefaut}
                    compact
                    sx={{ minWidth: dashboardCardMinWidth, height: dashboardCardHeight, flex: '1 1 0' }}
                  />
                </Stack>
              </Stack>

              <Grid container spacing={3} sx={{ mb: 1, mt: -4, pl: 0 }}>
                <Grid item xs={12} md={4}>
                  <KpiCard title="Total Anomalies" value={totalAnomalies} color="#EF4444" icon={<ErrorOutline />} trend={trendAnomalies} />
                </Grid>
                <Grid item xs={12} md={4}>
                  <KpiCard title="Restantes à valider" value={totalRemaining} color="#F59E0B" icon={<HistoryToggleOffOutlined />} trend={trendRemaining} />
                </Grid>
                <Grid item xs={12} md={4}>
                  <KpiCard title="Progression Globale" value={`${globalProgress}%`} color="#10B981" icon={<CheckCircleOutline />} progress={globalProgress} />
                </Grid>
              </Grid>

              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3, mt: 3, width: '100%' }}>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A' }}>
                  État des contrôles spécifiques
                </Typography>
                <Button
                  endIcon={<ArrowForwardOutlined />}
                  onClick={() => navigate('/controles/details')}
                  sx={{
                    textTransform: 'none',
                    color: '#10B981',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    '&:hover': { bgcolor: 'rgba(16, 185, 129, 0.05)' }
                  }}
                >
                  Voir les détails
                </Button>
              </Stack>

              <Grid container spacing={3}>
                {sectionsData.flatMap((section) => section.items).map((item, index) => {
                  const anomalies = Number(item.anomalies) || 0;
                  const remaining = Number(item.remaining) || 0;
                  const progress = anomalies === 0 ? 0 : Math.round(((anomalies - remaining) / anomalies) * 100);
                  return (
                    <Grid item xs={12} md={6} lg={4} key={index} >
                      <AnalysisCard
                        title={item.title}
                        errors={anomalies}
                        pending={remaining}
                        progress={progress}
                      // onClick={() => handleNavigateToDetails(item)}
                      />
                    </Grid>
                  );
                })}
              </Grid>

            </Box>
          </TabPanel>
        </TabContext>

      </Box >
    </>
  )
}

const AnalysisCard = ({ title, errors, pending, progress, onClick }) => (
  <Paper
    elevation={0}
    onClick={onClick}
    sx={{
      p: 2,
      border: '1px solid #E2E8F0',
      borderRadius: '12px',
      cursor: 'pointer',
      transition: '0.2s',
      backgroundColor: '#FFFFFF',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      '&:hover': {
        borderColor: '#10B981',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        transform: 'translateY(-2px)'
      }
    }}
  >
    {/* TITLE */}
    <Typography
      variant="body2"
      sx={{ fontWeight: 700, color: '#1E293B', mb: 1.5, textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.65rem' }}
    >
      {title}
    </Typography>

    {/* STATS INLINE */}
    <Stack direction="row" spacing={2} sx={{ mb: 1.5 }}>
      {/* ANOMALIES */}
      <Box>
        <Typography
          variant="caption"
          sx={{ color: '#64748B', display: 'block', fontWeight: 600, fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.3px' }}
        >
          Anomalies
        </Typography>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 900,
            color: errors > 0 ? '#EF4444' : '#10B981',
            lineHeight: 1.2,
            fontSize: '1rem'
          }}
        >
          {errors}
        </Typography>
      </Box>

      {/* RESTANTES */}
      <Box>
        <Typography
          variant="caption"
          sx={{ color: '#64748B', display: 'block', fontWeight: 600, fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.3px' }}
        >
          Restantes
        </Typography>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 900,
            color: pending > 0 ? '#F59E0B' : '#10B981',
            lineHeight: 1.2,
            fontSize: '1rem'
          }}
        >
          {pending}
        </Typography>
      </Box>

      {/* PROGRESSION */}
      <Box sx={{ ml: 'auto', textAlign: 'right' }}>
        <Typography
          variant="caption"
          sx={{ color: '#64748B', display: 'block', fontWeight: 600, fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.3px' }}
        >
          Progression
        </Typography>
        <Typography
          variant="h6"
          sx={{ fontWeight: 900, color: '#1E293B', lineHeight: 1.2, fontSize: '1rem' }}
        >
          {progress}%
        </Typography>
      </Box>
    </Stack>

    {/* PROGRESS BAR */}
    <LinearProgress
      variant="determinate"
      value={progress}
      sx={{
        height: 6,
        borderRadius: 3,
        bgcolor: '#F1F5F9',
        '& .MuiLinearProgress-bar': {
          bgcolor:
            progress === 100
              ? '#10B981'
              : progress < 30
                ? '#EF4444'
                : '#3B82F6',
          borderRadius: 4
        }
      }}
    />
  </Paper>
);
