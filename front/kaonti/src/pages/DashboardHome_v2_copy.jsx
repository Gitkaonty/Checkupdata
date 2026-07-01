import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Typography, Stack, Paper, Grid, Button, LinearProgress, CircularProgress, Divider } from '@mui/material';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import PopupTestSelectedFile from './popupTestSelectedFile';
import axios from '../../config/axios';
import Box from '@mui/material/Box';
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
  NavigateNext,
  SavingsOutlined, GroupsOutlined
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

// ─── Système de design (inspiré du cockpit comptable de référence) ───
const T = {
  ink: '#0E2733',
  canvas: '#F4F6F5',
  surface: '#FFFFFF',
  line: '#E2E6EA',
  ledger: '#EEF1F3',
  text: '#16202B',
  muted: '#6A7785',
  faint: '#9AA6B2',
  accent: '#0E7C86', // pétrole — couleur primaire
  pos: '#1F8A70',
  warn: '#B5791A',
  neg: '#BE3A2F',
  info: '#3A6EA5',
  accW: '#E2F0F1',
};
const MONO = 'ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace';
const NUM = { fontVariantNumeric: 'tabular-nums', fontFeatureSettings: '"tnum"' };
const CARD_SHADOW = '0 1px 2px rgba(16,39,51,.04), 0 8px 24px -16px rgba(16,39,51,.18)';
const panelSx = {
  border: `1px solid ${T.line}`,
  borderRadius: '16px',
  bgcolor: T.surface,
  boxShadow: CARD_SHADOW,
  overflow: 'hidden',
};

const dirOf = (evolution) =>
  evolution === 'augmentation' ? 'up' : evolution === 'diminution' ? 'down' : 'flat';

const fmtMontant = (num) => {
  if (num === null || num === undefined || isNaN(num)) return '—';
  return Number(num).toLocaleString('fr-FR');
};

const fmtPct = (value) => {
  if (value === undefined || value === null || isNaN(value)) return '0,00';
  return Math.abs(parseFloat(value)).toFixed(2).replace('.', ',');
};

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

    setLoading(true);
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
      })
      .finally(() => {
        setLoading(false);
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

      // D'abord, déclencher la sauvegarde des anomalies pour la période sélectionnée.
      // Ces deux appels doivent se terminer AVANT de lire les stats (ils les sauvegardent),
      // mais ils peuvent tourner en parallèle entre eux.
      if (selectedPeriodeDates) {
        try {
          await Promise.all([
            axiosPrivate.get(`/dashboard/revuAnalytiqueNN1/${id_compte}/${id_dossier}/${id_exercice}?date_debut=${selectedPeriodeDates.date_debut}&date_fin=${selectedPeriodeDates.date_fin}&id_periode=${selectedPeriodeId}`),
            axiosPrivate.get(`/dashboard/revuAnalytiqueMensuelle/${id_compte}/${id_dossier}/${id_exercice}?date_debut=${selectedPeriodeDates.date_debut}&date_fin=${selectedPeriodeDates.date_fin}&id_periode=${selectedPeriodeId}`),
          ]);
        } catch (error) {
          console.error('[SyntheseAnomalies] Erreur lors de la sauvegarde des anomalies:', error);
        }
      }

      // Charger les stats de toutes les cartes EN PARALLÈLE (au lieu d'une par une).
      const updatedSections = await Promise.all(
        sectionsData.map(async (section) => {
          const items = await Promise.all(
            section.items.map(async (item) => {
              if (item.hasAnomalies && item.typeRevue) {
                const stats = await fetchAnomalyStats(item.typeRevue, item.endpoint);
                return { ...item, anomalies: stats.anomalies, remaining: stats.remaining };
              }
              return item;
            })
          );
          return { ...section, items };
        })
      );

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

  // Indicateurs financiers : configuration alignée sur le PCG (eyebrow = classe de compte)
  const financialKpis = [
    { label: 'Résultat', code: '12', icon: <TrendingUpOutlined />, accent: T.accent, trend: margeBruteNGraph, n: resultatN, n1: resultatN1, variation: variationResultatN, evolution: evolutionResultatN },
    { label: "Chiffre d'affaires", code: '70', icon: <BarChartOutlined />, accent: T.pos, trend: chiffresAffairesNGraph, n: resultatChiffreAffaireN, n1: resultatChiffreAffaireN1, variation: variationChiffreAffaireN, evolution: evolutionChiffreAffaireN },
    { label: 'Dépenses — Achats', code: '60', icon: <PaymentsOutlined />, accent: T.warn, trend: chiffresAffairesNGraph, n: resultatDepenseAchatN, n1: resultatDepenseAchatN1, variation: variationDepenseAchatN, evolution: evolutionDepenseAchatN },
    { label: 'Dépenses salariales', code: '64', icon: <GroupsOutlined />, accent: '#7C5CBF', trend: margeBruteNGraph, n: resultatDepenseSalarialeN, n1: resultatDepenseSalarialeN1, variation: variationDepenseSalarialeN, evolution: evolutionDepenseSalarialeN },
    { label: 'Trésorerie — Banques', code: '512', icon: <AccountBalanceIcon />, accent: T.info, trend: tresorerieBanqueNGraph, n: resultatTresorerieBanqueN, n1: resultatTresorerieBanqueN1, variation: variationTresorerieBanqueN, evolution: evolutionTresorerieBanqueN },
    { label: 'Trésorerie — Caisse', code: '53', icon: <SavingsOutlined />, accent: '#0E9F9F', trend: tresorerieCaisseNGraph, n: resultatTresorerieCaisseN, n1: resultatTresorerieCaisseN1, variation: variationTresorerieCaisseN, evolution: evolutionTresorerieCaisseN },
  ];

  const ecrituresEnAttente = Array.isArray(journalData) ? journalData.length : (Number(journalData?.length) || 0);

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
      <Box sx={{ height: 'calc(100vh - 110px)', width: 'calc(100vw - 130px)', position: 'relative', bgcolor: T.canvas }}>
        {(loading || loadingStats) && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              zIndex: 10,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              bgcolor: 'rgba(244,246,245,0.7)',
              backdropFilter: 'blur(2px)',
            }}
          >
            <CircularProgress size={44} thickness={4} sx={{ color: T.accent }} />
            <Typography sx={{ fontSize: '0.9rem', fontWeight: 600, color: T.muted }}>
              Chargement des données…
            </Typography>
          </Box>
        )}

        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* ─── BARRE SUPÉRIEURE ─── */}
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            alignItems={{ xs: 'flex-start', md: 'center' }}
            spacing={2}
            sx={{
              px: { xs: 2, md: 3 },
              py: 2,
              flexShrink: 0,
              borderBottom: `1px solid ${T.line}`,
              bgcolor: 'rgba(244,246,245,0.86)',
            }}
          >
            <Box>
              <Typography sx={{ fontSize: '18px', fontWeight: 700, color: T.ink, letterSpacing: '.2px', lineHeight: 1.2 }}>
                Tableau de bord
              </Typography>
              <Typography sx={{ fontSize: '12px', color: T.muted, mt: 0.3 }}>
                Pilotage financier &amp; suivi de la révision comptable
              </Typography>
            </Box>
            <Box sx={{ ml: { md: 'auto' }, width: { xs: '100%', md: 'auto' } }}>
              <ExercicePeriodeSelector
                selectedExerciceId={selectedExerciceId}
                selectedPeriodeId={selectedPeriodeId}
                onExerciceChange={handleChangeExercice}
                onPeriodeChange={handleChangePeriode}
                disabled={loading}
                size="small"
              />
            </Box>
          </Stack>

          {/* ─── CONTENU (défilant) ─── */}
          <Box
            sx={{
              flex: 1,
              minHeight: 0,
              overflowY: 'auto',
              px: { xs: 2, md: 3 },
              py: 3,
              '&::-webkit-scrollbar': { width: '8px' },
              '&::-webkit-scrollbar-thumb': { bgcolor: '#CBD5E1', borderRadius: '4px' },
              '&::-webkit-scrollbar-thumb:hover': { bgcolor: '#94A3B8' },
            }}
          >
            {/* MODULE 1 — Indicateurs financiers (1 panneau : indicateur principal + lignes) */}
            <Box sx={{ mb: 5 }}>
              <SectionHead
                code="N · cumul"
                title="Indicateurs financiers"
                desc="Soldes de la période et variation vs exercice précédent."
              />
              <Paper elevation={0} sx={panelSx}>
                <Stack direction={{ xs: 'column', md: 'row' }} divider={<Divider flexItem sx={{ borderColor: T.ledger }} />}>
                  {/* Indicateur principal mis en avant */}
                  <Box sx={{ flex: { md: '0 0 36%' }, minWidth: 0 }}>
                    <HeroKpi
                      label={financialKpis[0].label}
                      code={financialKpis[0].code}
                      icon={financialKpis[0].icon}
                      accent={financialKpis[0].accent}
                      trend={financialKpis[0].trend}
                      value={fmtMontant(financialKpis[0].n)}
                      unit={deviseParDefaut}
                      deltaDir={dirOf(financialKpis[0].evolution)}
                      deltaText={`${fmtPct(financialKpis[0].variation)} %`}
                      n1Text={`N-1 ${fmtMontant(financialKpis[0].n1)} ${deviseParDefaut || ''}`}
                    />
                  </Box>
                  {/* Les autres en lignes séparées par un filet */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    {financialKpis.slice(1).map((k, i, arr) => (
                      <KpiRow
                        key={k.label}
                        label={k.label}
                        code={k.code}
                        accent={k.accent}
                        trend={k.trend}
                        value={fmtMontant(k.n)}
                        unit={deviseParDefaut}
                        deltaDir={dirOf(k.evolution)}
                        deltaText={`${fmtPct(k.variation)} %`}
                        n1Text={`N-1 ${fmtMontant(k.n1)} ${deviseParDefaut || ''}`}
                        divider={i < arr.length - 1}
                      />
                    ))}
                  </Box>
                </Stack>
              </Paper>
            </Box>

            {/* MODULE 2 — Synthèse des anomalies (bande de stats divisée par des filets) */}
            <Box sx={{ mb: 5 }}>
              <SectionHead
                code="Contrôles"
                title="Synthèse des anomalies"
                desc={`${ecrituresEnAttente} écriture(s) en attente de lettrage`}
              />
              <Paper elevation={0} sx={panelSx}>
                <Stack direction={{ xs: 'column', sm: 'row' }} divider={<Divider flexItem sx={{ borderColor: T.ledger }} />}>
                  <StatCell
                    label="Total anomalies"
                    value={String(totalAnomalies)}
                    deltaText="détectées sur la période"
                    barPct={totalAnomalies > 0 ? 100 : 0}
                    barColor={T.neg}
                  />
                  <StatCell
                    label="Restantes à valider"
                    value={String(totalRemaining)}
                    deltaText={`${totalValidated} déjà validée(s)`}
                    barPct={totalAnomalies ? (totalRemaining / totalAnomalies) * 100 : 0}
                    barColor={T.warn}
                  />
                  <StatCell
                    label="Taux de validation"
                    value={String(globalProgress)}
                    unit="%"
                    deltaText="anomalies traitées"
                    barPct={globalProgress}
                    barColor={T.pos}
                  />
                </Stack>
              </Paper>
            </Box>

            {/* MODULE 3 — État des contrôles (liste en lignes, pas de grille de boîtes) */}
            <Box sx={{ mb: 1 }}>
              <SectionHead
                title="État des contrôles spécifiques"
                action={
                  <Button
                    endIcon={<ArrowForwardOutlined />}
                    onClick={() => navigate('/controles/details')}
                    sx={{
                      textTransform: 'none',
                      color: T.accent,
                      fontWeight: 600,
                      fontSize: '13px',
                      '&:hover': { bgcolor: T.accW },
                    }}
                  >
                    Voir les détails
                  </Button>
                }
              />
              <Paper elevation={0} sx={panelSx}>
                {sectionsData.flatMap((section) => section.items).map((item, index, arr) => {
                  const anomalies = Number(item.anomalies) || 0;
                  const remaining = Number(item.remaining) || 0;
                  const progress = anomalies === 0 ? 0 : Math.round(((anomalies - remaining) / anomalies) * 100);
                  return (
                    <ControlRow
                      key={index}
                      title={item.title}
                      anomalies={anomalies}
                      remaining={remaining}
                      progress={progress}
                      divider={index < arr.length - 1}
                    // onClick={() => handleNavigateToDetails(item)}
                    />
                  );
                })}
              </Paper>
            </Box>
          </Box>
        </Box>
      </Box>
    </>
  )
}

// En-tête de module : eyebrow (code), titre, et description/action alignée à droite
const SectionHead = ({ code, title, desc, action }) => (
  <Stack
    direction="row"
    alignItems="baseline"
    spacing={1.5}
    sx={{ mb: 1.75, flexWrap: 'wrap', rowGap: 0.5 }}
  >
    {code && (
      <Box
        component="span"
        sx={{
          ...NUM,
          fontFamily: MONO,
          fontSize: '11px',
          fontWeight: 600,
          color: T.accent,
          bgcolor: T.accW,
          px: 1,
          py: '3px',
          borderRadius: '5px',
          whiteSpace: 'nowrap',
          alignSelf: 'center',
        }}
      >
        {code}
      </Box>
    )}
    <Typography sx={{ fontSize: '18px', fontWeight: 700, color: T.ink, letterSpacing: '.1px' }}>
      {title}
    </Typography>
    <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center' }}>
      {action ||
        (desc && (
          <Typography
            sx={{ fontSize: '12.5px', color: T.muted, textAlign: 'right', maxWidth: 440, display: { xs: 'none', md: 'block' } }}
          >
            {desc}
          </Typography>
        ))}
    </Box>
  </Stack>
);

const DELTA_COLOR = { up: T.pos, down: T.neg, flat: T.muted };
const DELTA_ARROW = { up: '▲', down: '▼', flat: '▬' };

const deltaBg = (dir) =>
  dir === 'up' ? 'rgba(31,138,112,.12)' : dir === 'down' ? 'rgba(190,58,47,.12)' : 'rgba(106,119,133,.12)';

// Pilule de variation (flèche + valeur)
const DeltaPill = ({ dir = 'flat', text, size = 'sm' }) => (
  <Stack
    direction="row"
    alignItems="center"
    spacing={0.4}
    sx={{ flex: 'none', px: 0.9, py: 0.4, borderRadius: '99px', bgcolor: deltaBg(dir) }}
  >
    <Box component="span" sx={{ fontSize: size === 'lg' ? '10px' : '9px', color: DELTA_COLOR[dir], lineHeight: 1 }}>
      {DELTA_ARROW[dir]}
    </Box>
    <Typography sx={{ ...NUM, fontSize: size === 'lg' ? '12px' : '11px', fontWeight: 700, color: DELTA_COLOR[dir] }}>
      {text}
    </Typography>
  </Stack>
);

// Indicateur principal mis en avant : grand chiffre + sparkline pleine largeur
const HeroKpi = ({ label, code, value, unit, deltaText, deltaDir = 'flat', n1Text, icon, accent = T.accent, trend }) => (
  <Box sx={{ p: { xs: 2.5, md: 3 }, display: 'flex', flexDirection: 'column', height: '100%', minWidth: 0 }}>
    <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 2 }}>
      <Box
        sx={{
          width: 34, height: 34, flex: 'none', borderRadius: '10px', display: 'grid', placeItems: 'center',
          color: accent, bgcolor: `${accent}14`, '& svg': { fontSize: 18 },
        }}
      >
        {icon}
      </Box>
      <Typography sx={{ fontSize: '13px', fontWeight: 600, color: T.muted }}>{label}</Typography>
      {code && <Box component="span" sx={{ ...NUM, fontFamily: MONO, fontSize: '10px', color: T.faint }}>{code}</Box>}
    </Stack>

    <Typography sx={{ ...NUM, fontSize: { xs: '30px', md: '36px' }, fontWeight: 800, letterSpacing: '-1px', lineHeight: 1, color: T.ink }}>
      {value}
      {unit && <Box component="span" sx={{ fontSize: '16px', fontWeight: 600, color: T.muted, ml: '5px' }}>{unit}</Box>}
    </Typography>

    <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1.25 }}>
      {deltaText && <DeltaPill dir={deltaDir} text={deltaText} size="lg" />}
      <Typography noWrap sx={{ ...NUM, fontSize: '11.5px', color: T.faint }}>{n1Text}</Typography>
    </Stack>

    <Box sx={{ mt: 'auto', pt: 2.5 }}>
      <Sparkline data={trend} color={accent} height={58} />
    </Box>
  </Box>
);

// Indicateur secondaire en ligne (séparé par un filet)
const KpiRow = ({ label, code, value, unit, deltaText, deltaDir = 'flat', n1Text, accent = T.accent, trend, divider }) => (
  <Stack
    direction="row"
    alignItems="center"
    spacing={2}
    sx={{ px: { xs: 2.5, md: 3 }, py: 1.6, borderBottom: divider ? `1px solid ${T.ledger}` : 'none' }}
  >
    <Box sx={{ minWidth: 0, flex: 1 }}>
      <Stack direction="row" alignItems="center" spacing={0.75}>
        <Typography noWrap sx={{ fontSize: '13px', fontWeight: 600, color: T.ink }}>{label}</Typography>
        {code && <Box component="span" sx={{ ...NUM, fontFamily: MONO, fontSize: '9.5px', color: T.faint }}>{code}</Box>}
      </Stack>
      <Typography noWrap sx={{ ...NUM, fontSize: '11px', color: T.faint, mt: 0.2 }}>{n1Text}</Typography>
    </Box>

    <Box sx={{ width: 60, flex: 'none', display: { xs: 'none', sm: 'block' } }}>
      <Sparkline data={trend} color={accent} height={26} />
    </Box>

    <Box sx={{ textAlign: 'right', flex: 'none', minWidth: 92 }}>
      <Typography sx={{ ...NUM, fontSize: '17px', fontWeight: 700, lineHeight: 1.15, color: T.ink }}>
        {value}
        {unit && <Box component="span" sx={{ fontSize: '11px', fontWeight: 600, color: T.muted, ml: '3px' }}>{unit}</Box>}
      </Typography>
      <Stack direction="row" alignItems="center" justifyContent="flex-end" spacing={0.4} sx={{ mt: 0.3 }}>
        <Box component="span" sx={{ fontSize: '8px', color: DELTA_COLOR[deltaDir] }}>{DELTA_ARROW[deltaDir]}</Box>
        <Typography sx={{ ...NUM, fontSize: '11px', fontWeight: 700, color: DELTA_COLOR[deltaDir] }}>{deltaText}</Typography>
      </Stack>
    </Box>
  </Stack>
);

// Cellule de stat dans une bande (synthèse anomalies)
const StatCell = ({ label, value, unit, deltaText, barPct, barColor = T.accent }) => (
  <Box sx={{ flex: 1, p: { xs: 2.5, md: 3 }, minWidth: 0 }}>
    <Typography sx={{ fontSize: '12.5px', fontWeight: 600, color: T.muted, mb: 1 }}>{label}</Typography>
    <Typography sx={{ ...NUM, fontSize: { xs: '26px', md: '30px' }, fontWeight: 800, letterSpacing: '-.6px', lineHeight: 1, color: T.ink }}>
      {value}
      {unit && <Box component="span" sx={{ fontSize: '14px', fontWeight: 600, color: T.muted, ml: '4px' }}>{unit}</Box>}
    </Typography>
    {deltaText && <Typography sx={{ fontSize: '11.5px', color: T.muted, mt: 0.8 }}>{deltaText}</Typography>}
    {barPct !== undefined && (
      <Box sx={{ mt: 1.5, height: 4, borderRadius: 99, bgcolor: T.ledger, overflow: 'hidden' }}>
        <Box sx={{ height: '100%', borderRadius: 99, width: `${Math.max(0, Math.min(100, barPct))}%`, bgcolor: barColor }} />
      </Box>
    )}
  </Box>
);

// Ligne de contrôle (liste, séparée par un filet)
const ControlRow = ({ title, anomalies, remaining, progress, divider, onClick }) => {
  const barColor = progress >= 100 ? T.pos : progress < 30 ? T.neg : T.accent;
  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={2.5}
      onClick={onClick}
      sx={{
        px: { xs: 2.5, md: 3 },
        py: 1.75,
        borderBottom: divider ? `1px solid ${T.ledger}` : 'none',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'background .15s',
        '&:hover': onClick ? { bgcolor: '#FAFBFB' } : {},
      }}
    >
      <Typography sx={{ flex: 1, minWidth: 0, fontSize: '13px', fontWeight: 600, color: T.ink, lineHeight: 1.3 }}>
        {title}
      </Typography>

      <Box sx={{ textAlign: 'right', flex: 'none', width: 64, display: { xs: 'none', sm: 'block' } }}>
        <Typography sx={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '.4px', color: T.faint, fontWeight: 600 }}>Anom.</Typography>
        <Typography sx={{ ...NUM, fontSize: '14px', fontWeight: 700, color: anomalies > 0 ? T.neg : T.pos }}>{anomalies}</Typography>
      </Box>
      <Box sx={{ textAlign: 'right', flex: 'none', width: 64, display: { xs: 'none', sm: 'block' } }}>
        <Typography sx={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '.4px', color: T.faint, fontWeight: 600 }}>Rest.</Typography>
        <Typography sx={{ ...NUM, fontSize: '14px', fontWeight: 700, color: remaining > 0 ? T.warn : T.pos }}>{remaining}</Typography>
      </Box>

      <Box sx={{ flex: 'none', width: { xs: 96, md: 170 }, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box sx={{ flex: 1, height: 6, borderRadius: 99, bgcolor: T.ledger, overflow: 'hidden' }}>
          <Box sx={{ height: '100%', borderRadius: 99, width: `${Math.max(0, Math.min(100, progress))}%`, bgcolor: barColor }} />
        </Box>
        <Typography sx={{ ...NUM, fontSize: '12px', fontWeight: 700, color: T.ink, width: 34, textAlign: 'right' }}>{progress}%</Typography>
      </Box>
    </Stack>
  );
};

// Mini-graphique de tendance en aire dégradée (responsive, courbe lissée)
const Sparkline = ({ data = [], color = T.accent, height = 46 }) => {
  const nums = (Array.isArray(data) ? data : []).map(Number).filter((v) => !isNaN(v));
  if (nums.length < 2) return <Box sx={{ height }} />;

  const W = 100, H = 100;
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  const range = max - min || 1;
  const pts = nums.map((v, i) => [
    (i / (nums.length - 1)) * W,
    H - ((v - min) / range) * (H * 0.78) - H * 0.12,
  ]);

  let line = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [px, py] = pts[i - 1];
    const [cx, cy] = pts[i];
    const mx = (px + cx) / 2;
    line += ` C ${mx} ${py}, ${mx} ${cy}, ${cx} ${cy}`;
  }
  const area = `${line} L ${W} ${H} L 0 ${H} Z`;
  const gid = `spark-${color.replace('#', '')}`;

  return (
    <Box sx={{ height, width: '100%' }}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" width="100%" height={height} style={{ display: 'block' }}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.30" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#${gid})`} stroke="none" />
        <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      </svg>
    </Box>
  );
};

