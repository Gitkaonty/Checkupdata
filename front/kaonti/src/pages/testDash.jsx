import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Box,
    Grid,
    Card,
    CardContent,
    Chip,
    LinearProgress,
    Typography,
    Button,
    IconButton,
    Stack,
    FormControl,
    Select,
    MenuItem,
} from '@mui/material';
import { init } from '../../../../../init';
import useAxiosPrivate from '../../../../hooks/useAxiosPrivate';
import { InfoFileStyle } from '../../../componentsTools/InfosFileStyle';
import PopupTestSelectedFile from '../../../componentsTools/popupTestSelectedFile';
import AssessmentIcon from "@mui/icons-material/Assessment";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import SearchIcon from "@mui/icons-material/Search";
import { IoNavigate } from "react-icons/io5";
import { IoEye } from "react-icons/io5";
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import HistoryIcon from '@mui/icons-material/History';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import ExercicePeriodeSelector from '../../../componentsTools/ExercicePeriodeSelector/ExercicePeriodeSelector';

// Configuration des sections avec leurs endpoints et routes
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
                hasAnomalies: true
            },
            {
                id: "revueMensuelle",
                title: "Revue analytique mensuelle",
                icon: <AssessmentIcon />,
                endpoint: "/dashboard/revuAnalytiqueMensuelle",
                route: "/tab/dashboard/revuAnalytiqueMensuelle",
                typeRevue: "analytiqueMensuelle",
                hasAnomalies: true
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
                hasAnomalies: true
            },
            {
                id: "analyseFournisseurClient",
                title: "Analyse fournisseur / Client",
                icon: <AccountBalanceIcon />,
                endpoint: "/administration/revisionFournisseurClient",
                route: "/tab/administration/revisionFournisseurClient",
                typeRevue: "fournisseurClient",
                hasAnomalies: true
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
                hasAnomalies: true
            },
            {
                id: "controleCodeAnalytique",
                title: "Contrôle code analytique",
                icon: <SearchIcon />,
                endpoint: null,
                route: null,
                hasAnomalies: false,
                anomalies: 0,
                remaining: 0
            }
        ]
    }
];

// Format date as dd-mm-yy
const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yy = String(date.getFullYear()).slice(-2);
    return `${dd}/${mm}/${yy}`;
};
const NEON_MINT = '#00FF94';
const NAV_DARK = '#0B1120';
const BG_SOFT = '#F8FAFC';

export default function AuditDashboard() {
    let initial = init[0];
    const axiosPrivate = useAxiosPrivate();
    const navigate = useNavigate();
    const { id: routeDossierId } = useParams();

    const [listeExercice, setListeExercice] = useState([]);
    const [selectedExerciceId, setSelectedExerciceId] = useState(0);
    const [fileInfos, setFileInfos] = useState(null);
    const [loading, setLoading] = useState(false);
    const [noFile, setNoFile] = useState(false);
    const [fileId, setFileId] = useState(0);

    // === Périodes ===
    const [listePeriodes, setListePeriodes] = useState([]);
    const [selectedPeriodeId, setSelectedPeriodeId] = useState('');
    const [selectedPeriodeDates, setSelectedPeriodeDates] = useState(null);

    // === Résultats ===
    const [resultats, setResultats] = useState([]);

    // === Données des sections (statistiques réelles) ===
    const [sectionsData, setSectionsData] = useState(SECTIONS_CONFIG);
    const [loadingStats, setLoadingStats] = useState(false);

    // Fonction pour récupérer les statistiques d'une API
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

    const sendToHome = (value) => {
        setNoFile(!value);
        navigate('/tab/home');
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

    const getIds = () => {
        const dossierFromRoute = parseInt(routeDossierId, 10);
        const dossierFromSession = parseInt(sessionStorage.getItem('fileId'), 10);
        return {
            id_compte: parseInt(sessionStorage.getItem('compteId'), 10) || 1,
            id_dossier: Number.isFinite(dossierFromSession)
                ? dossierFromSession
                : (Number.isFinite(dossierFromRoute) ? dossierFromRoute : 1),
            id_exercice: selectedExerciceId || parseInt(sessionStorage.getItem('exerciceId'), 10) || 1
        };
    };

    const fetchExercices = async () => {
        try {
            const { id_dossier } = getIds();
            const response = await axiosPrivate.get(`/paramExercice/listeExercice/${id_dossier}`);
            const resData = response.data;
            if (resData.state) {
                setListeExercice(resData.list);
                if (resData.list && resData.list.length > 0 && selectedExerciceId === 0) {
                    setSelectedExerciceId(resData.list[0].id);
                }
            }
        } catch (error) {
            console.error('Error fetching exercices:', error);
        }
    };

    const fetchDossierInfos = async () => {
        try {
            const { id_dossier } = getIds();
            const response = await axiosPrivate.get(`/home/FileInfos/${id_dossier}`);
            const resData = response.data;
            if (resData.state && resData.fileInfos && resData.fileInfos.length > 0) {
                setFileInfos(resData.fileInfos[0]);
            }
        } catch (error) {
            console.error('Error fetching dossier infos:', error);
        }
    };

    const fetchPeriodes = useCallback(async (exerciceId) => {
        if (!exerciceId) return;
        try {
            const response = await axiosPrivate.get(`/paramExercice/listePeriodes/${exerciceId}`);
            if (response.data.state) {
                setListePeriodes(response.data.list || []);
            } else {
                setListePeriodes([]);
            }
        } catch (error) {
            console.error('Error fetching periodes:', error);
            setListePeriodes([]);
        }
    }, [axiosPrivate]);

    useEffect(() => {
        fetchExercices();
        fetchDossierInfos();
    }, []);

    useEffect(() => {
        if (selectedExerciceId > 0) {
            fetchPeriodes(selectedExerciceId);
        }
    }, [selectedExerciceId, fetchPeriodes]);

    const handleChangeExercice = (exerciceId) => {
        setSelectedExerciceId(exerciceId);
        setSelectedPeriodeId('');
        setSelectedPeriodeDates(null);
        setResultats([]);
        fetchPeriodes(exerciceId);
    };

    const handleChangePeriode = (periodeId) => {
        setSelectedPeriodeId(periodeId);
        if (periodeId && periodeId !== 'exercice') {
            const periode = listePeriodes.find(p => p.id === periodeId);
            if (periode) {
                setSelectedPeriodeDates({
                    date_debut: periode.date_debut,
                    date_fin: periode.date_fin
                });
            }
        } else {
            setSelectedPeriodeDates(null);
        }
    };

    const handleControler = async () => {
        if (!selectedExerciceId) return;

        // Vérifier qu'une période est sélectionnée
        if (!selectedPeriodeId) {
            alert('Veuillez sélectionner une période avant de lancer le contrôle.');
            return;
        }

        setLoading(true);
        try {
            const { id_compte, id_dossier, id_exercice } = getIds();

            const params = new URLSearchParams();
            if (selectedPeriodeDates) {
                params.append('date_debut', selectedPeriodeDates.date_debut);
                params.append('date_fin', selectedPeriodeDates.date_fin);
            } else {
                const exercice = listeExercice.find(e => e.id === selectedExerciceId);
                if (exercice) {
                    params.append('date_debut', exercice.date_debut);
                    params.append('date_fin', exercice.date_fin);
                }
            }
            if (selectedPeriodeId) {
                params.append('id_periode', selectedPeriodeId);
            }

            const queryString = params.toString();

            const response = await axiosPrivate.post(`/administration/revisionAnalytique/${id_compte}/${id_dossier}/${id_exercice}?${queryString}`);
            if (response.data.state) {
                setResultats(response.data.data || []);
            } else {
                alert(response.data.message || 'Erreur lors du contrôle');
            }
        } catch (error) {
            console.error('Error executing control:', error);
            alert('Erreur lors du contrôle analytique');
        } finally {
            setLoading(false);
        }
    };

    const allItems = sectionsData.flatMap(s => s.items);
    const totalAnomalies = allItems.reduce((sum, i) => sum + (Number(i.anomalies) || 0), 0);
    const totalRemaining = allItems.reduce((sum, i) => sum + (Number(i.remaining) || 0), 0);
    const totalValidated = totalAnomalies - totalRemaining;

    const globalProgress =
        totalAnomalies === 0 ? 100 : Math.round((totalValidated / totalAnomalies) * 100);

    // useEffect pour charger les statistiques quand exercice ou période change
    useEffect(() => {
        if (selectedExerciceId > 0) {
            // Ne charger les stats que si une période est sélectionnée
            if (selectedPeriodeId && selectedPeriodeId !== 'exercice') {
                loadAllStats();
            } else {
                // Pas de période sélectionnée : initialiser les données à zéro
                setResultats([]);
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

    // Fonction pour naviguer vers les détails dans un nouvel onglet
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
            {noFile ? (
                <PopupTestSelectedFile
                    confirmationState={sendToHome}
                />
            ) : (
                <Box sx={{ p: 2, minHeight: '100vh', backgroundColor: '#f5f5f5' }}>

                    {/* Header with Exercise, Period and Controler button */}
                    <Box
                        sx={{
                            mb: 3,
                            backgroundColor: 'white',
                            p: 2,
                            borderRadius: 1,
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            border: '3px solid rgba(241, 241, 241, 1)',
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            <Typography component="div" variant="h6" sx={{ fontWeight: 700, color: NAV_DARK }} >
                                Synthèse des Anomalies
                            </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                            <ExercicePeriodeSelector
                                selectedExerciceId={selectedExerciceId}
                                selectedPeriodeId={selectedPeriodeId}
                                onExerciceChange={handleChangeExercice}
                                onPeriodeChange={handleChangePeriode}
                                disabled={loading}
                                size="small"
                            />
                        </Box>
                        <Box p={4}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 3, color: '#1E293B', letterSpacing: '0.5px' }}>Synthèses</Typography>

                            <Grid container spacing={3} sx={{ maxWidth: '1200px', mb: 8 }}>
                                {/* Carte Anomalies détectées */}
                                <StatCard
                                    label="Anomalies détectées"
                                    value={totalAnomalies}
                                    color="#EF4444"
                                    icon={<ErrorOutlineIcon />}
                                />

                                {/* Carte Restantes à valider */}
                                <StatCard
                                    label="Restantes à valider"
                                    value={totalRemaining}
                                    color="#F59E0B"
                                    icon={<HistoryIcon />}
                                />

                                {/* Carte Validées */}
                                <StatCard
                                    label="Validées"
                                    value={totalValidated}
                                    color={NEON_MINT}
                                    icon={<CheckCircleOutlineIcon />}
                                />

                                {/* Carte Taux de validation */}
                                <Grid item xs={3}>
                                    <Stack variant="outlined" sx={{ height: '110px', borderRadius: '16px', display: 'flex', alignItems: 'center', px: 4, bgcolor: '#fff', border: '1px solid #E2E8F0', justifyContent: 'center' }}>
                                        <Box sx={{ width: '100%' }}>
                                            <Typography sx={{ fontSize: '12px', color: '#64748B', mb: 1.5, fontWeight: 600 }}>Taux de validation : {globalProgress}%</Typography>
                                            <LinearProgress variant="determinate" value={globalProgress} sx={{ height: 6, borderRadius: 3, bgcolor: '#F1F5F9', '& .MuiLinearProgress-bar': { bgcolor: NEON_MINT } }} />
                                        </Box>
                                    </Stack>
                                </Grid>
                            </Grid>

                            {sectionsData.map((section, i) => (
                                <Box key={i} mb={6}>
                                    <Typography
                                        variant="subtitle2"
                                        sx={{
                                            fontWeight: 800,
                                            mb: 3,
                                            color: '#1E293B',
                                            letterSpacing: '0.5px'
                                        }}
                                    >
                                        {section.title.toUpperCase()}
                                    </Typography>

                                    <Grid container spacing={2}>
                                        {section.items.map((item, index) => {
                                            const progress =
                                                item.anomalies === 0
                                                    ? 100
                                                    : Math.round(
                                                        ((item.anomalies - item.remaining) / item.anomalies) * 100
                                                    );

                                            const isLast = index === section.items.length - 1;

                                            return (
                                                <Grid
                                                    item
                                                    xs={12}
                                                    md={6}
                                                    lg={isLast ? 12 : 4} // 🔥 3 par ligne + dernier en bas
                                                    key={index}
                                                >
                                                    <AnalysisCard
                                                        title={item.title}
                                                        errors={item.anomalies}
                                                        pending={item.remaining}
                                                        progress={progress}
                                                        onClick={() => handleNavigateToDetails(item)}
                                                    />
                                                </Grid>
                                            );
                                        })}
                                    </Grid>
                                </Box>
                            ))}
                        </Box>
                    </Box>
                </Box>
            )}
        </>
    );
}

// Composant StatCard moderne
const StatCard = ({ label, value, color, icon }) => (
    <Grid item xs={3}>
        <Stack variant="outlined" sx={{
            height: '110px',
            borderRadius: '16px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            px: 4,
            bgcolor: '#fff',
            border: '1px solid #E2E8F0'
        }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography sx={{ fontSize: '36px', fontWeight: 300, color: '#1E293B', lineHeight: 1 }}>{value}</Typography>
                <Box sx={{ color: color, opacity: 0.8 }}>{icon}</Box>
            </Stack>
            <Typography sx={{ fontSize: '11px', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', mt: 1 }}>{label}</Typography>
        </Stack>
    </Grid>
);

// Composant AnalysisCard moderne
const AnalysisCard = ({ title, errors, pending, progress, onClick }) => (
    <Grid item xs={12} md={6} lg={4}>
        <Paper
            elevation={0}
            onClick={onClick}
            sx={{
                p: 2.5,
                border: '1px solid #E2E8F0',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: '0.2s',
                '&:hover': {
                    borderColor: '#10B981',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                }
            }}
        >
            {/* TITLE */}
            <Typography
                variant="body2"
                sx={{ fontWeight: 700, color: '#1E293B', mb: 2 }}
            >
                {title}
            </Typography>

            {/* STATS INLINE */}
            <Stack direction="row" spacing={3} sx={{ mb: 2 }}>
                {/* ANOMALIES */}
                <Box>
                    <Typography
                        variant="caption"
                        sx={{ color: '#94A3B8', display: 'block', fontWeight: 600 }}
                    >
                        Anomalies
                    </Typography>
                    <Typography
                        variant="subtitle2"
                        sx={{
                            fontWeight: 800,
                            color: errors > 0 ? '#EF4444' : '#10B981'
                        }}
                    >
                        {errors}
                    </Typography>
                </Box>

                {/* RESTANTES */}
                <Box>
                    <Typography
                        variant="caption"
                        sx={{ color: '#94A3B8', display: 'block', fontWeight: 600 }}
                    >
                        Restantes
                    </Typography>
                    <Typography
                        variant="subtitle2"
                        sx={{
                            fontWeight: 800,
                            color: pending > 0 ? '#F59E0B' : '#10B981'
                        }}
                    >
                        {pending}
                    </Typography>
                </Box>

                {/* PROGRESSION */}
                <Box sx={{ ml: 'auto', textAlign: 'right' }}>
                    <Typography
                        variant="caption"
                        sx={{ color: '#94A3B8', display: 'block', fontWeight: 600 }}
                    >
                        Progression
                    </Typography>
                    <Typography
                        variant="subtitle2"
                        sx={{ fontWeight: 800, color: '#1E293B' }}
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
                                    : '#3B82F6'
                    }
                }}
            />
        </Paper>
    </Grid>
);
