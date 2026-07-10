import React, { useState, useContext, useRef, useEffect } from 'react';
import {
  Box, Typography, Stack, Tabs, Tab, Paper,
  Divider, Button, Chip, Breadcrumbs, Link as MuiLink, TablePagination,
  Select,
  MenuItem,
  Menu,
  CircularProgress
} from '@mui/material';
import ExercicePeriodeContext from '../context/ExercicePeriodeContext';
import {
  CompareArrowsOutlined, CalendarMonthOutlined, AccountBalanceOutlined,
  PeopleAltOutlined, ContentCopyOutlined, HelpOutline,
  LabelOutlined, ChevronRight, FileDownloadOutlined, FilterListOutlined,
  DashboardOutlined, PictureAsPdf, TableChart, ArrowDropDown,
  FactCheckOutlined, NavigateNext
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import useAxiosPrivate from '../hooks/useAxiosPrivate';
import { fetchAnomaliesSynthese } from '../utils/anomaliesSynthese';
import { jwtDecode } from 'jwt-decode';
import RevueAnalytiqueTable from './listecontroles/revuenn1';
import RevueMensuelleTable from './listecontroles/revuemensuelle';
import GlobalBalance from './listecontroles/controleglobal';
import AnalyseTiers from './listecontroles/analyseTiers';
import RechercheDoublons from './listecontroles/rechercheDoublon';
import EcrituresSuspense from './listecontroles/EcrituresSuspense';
import ControleAnalytique from './listecontroles/controleAnalytique';
import ExercicePeriodeSelector from './ExercicePeriodeSelector';

// ─── Système de design (aligné sur ExportBalance / le tableau de bord) ───
const T = {
  ink: '#0E2733',
  canvas: '#F4F6F5',
  surface: '#FFFFFF',
  line: '#E2E6EA',
  ledger: '#EEF1F3',
  text: '#16202B',
  muted: '#6A7785',
  faint: '#9AA6B2',
  accent: '#0E7C86',
  accentDark: '#0a5d65',
  pos: '#1F8A70',
  neg: '#BE3A2F',
  accW: '#E2F0F1',
};
const CARD_SHADOW = '0 1px 2px rgba(16,39,51,.04), 0 8px 24px -16px rgba(16,39,51,.18)';

const DetailsControles = () => {
  const { selectedExerciceId, selectedPeriodeId, selectedPeriodeDates, setSelectedExerciceId, setSelectedPeriodeId, listePeriodes, handleChangePeriode: ctxChangePeriode } = useContext(ExercicePeriodeContext);

  // Une période est-elle réellement sélectionnée ? (sinon on vide les contrôles)
  const hasPeriode = !!selectedPeriodeId && selectedPeriodeId !== 'exercice';
  const { auth } = useAuth();
  const axiosPrivate = useAxiosPrivate();
  const decoded = auth?.accessToken ? jwtDecode(auth.accessToken) : undefined;
  const compteName = decoded?.UserInfo?.compte || 'Espace Client';
  const id_compte = parseInt(decoded?.UserInfo?.compteId) || parseInt(sessionStorage.getItem('compteId')) || 1;
  const id_dossier = parseInt(sessionStorage.getItem('fileId')) || 1;
  const [activeTab, setActiveTab] = useState(0);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [globalExporting, setGlobalExporting] = useState(false);
  const [exportAnchorEl, setExportAnchorEl] = useState(null);
  const revueAnalytiqueRef = useRef(null);
  const revueMensuelleRef = useRef(null);
  const globalBalanceRef = useRef(null);
  const analyseTiersRef = useRef(null);
  const rechercheDoublonRef = useRef(null);
  const ecrituresSuspenseRef = useRef(null);
  const controleAnalytiqueRef = useRef(null);

  const handleChangeExercice = (exerciceId) => {
    setSelectedExerciceId(exerciceId);
  };

  const handleChangePeriode = (periodeId) => {
    // Utilise le handler du contexte pour aussi renseigner les dates de la période
    if (ctxChangePeriode) ctxChangePeriode(periodeId);
    else setSelectedPeriodeId(periodeId);
  };

  // Auto-sélection de la première période à l'ouverture (une fois par exercice).
  // Si l'utilisateur retire ensuite la période, on ne la réimpose pas → les contrôles se vident.
  const autoSelectedRef = useRef(false);
  useEffect(() => { autoSelectedRef.current = false; }, [selectedExerciceId]);
  useEffect(() => {
    if (autoSelectedRef.current) return;
    if (!selectedExerciceId || !Array.isArray(listePeriodes) || listePeriodes.length === 0) return;
    const valid = hasPeriode && listePeriodes.some((p) => String(p.id) === String(selectedPeriodeId));
    autoSelectedRef.current = true;
    if (!valid) handleChangePeriode(listePeriodes[0].id);
  }, [selectedExerciceId, listePeriodes, selectedPeriodeId, hasPeriode]);

  const handleTabChange = (event, newValue) => setActiveTab(newValue);

  const activeRef = () => {
    if (activeTab === 0) return revueAnalytiqueRef.current;
    if (activeTab === 1) return revueMensuelleRef.current;
    if (activeTab === 2) return globalBalanceRef.current;
    if (activeTab === 3) return analyseTiersRef.current;
    if (activeTab === 4) return rechercheDoublonRef.current;
    if (activeTab === 5) return ecrituresSuspenseRef.current;
    if (activeTab === 6) return controleAnalytiqueRef.current;
    return null;
  };

  const handleExportExcel = async () => {
    setExportAnchorEl(null);
    try {
      setGlobalExporting(true);
      await activeRef()?.exportExcel();
    } catch (error) {
      console.error('Erreur export Excel (onglet courant):', error);
    } finally {
      setGlobalExporting(false);
    }
  };

  const handleExportPdf = async () => {
    setExportAnchorEl(null);
    try {
      setGlobalExporting(true);
      await activeRef()?.exportPdf();
    } catch (error) {
      console.error('Erreur export PDF (onglet courant):', error);
    } finally {
      setGlobalExporting(false);
    }
  };

  // Export GLOBAL : un seul fichier regroupant TOUS les contrôles
  const downloadBlob = (data, mime, filename) => {
    const blob = new Blob([data], { type: mime });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(link.href);
  };

  const buildGlobalUrl = (format) => {
    let url = `/administration/detailsControles/${id_compte}/${id_dossier}/${selectedExerciceId}/export/global/${format}`;
    if (selectedPeriodeId) url += `?id_periode=${selectedPeriodeId}`;
    return url;
  };

  // Calcule la synthèse des anomalies (identique au dashboard) à joindre en 1re page.
  const getSynthese = async () => {
    try {
      const id_periode = (selectedPeriodeId && selectedPeriodeId !== 'exercice') ? selectedPeriodeId : null;
      return await fetchAnomaliesSynthese(axiosPrivate, {
        id_compte, id_dossier, id_exercice: selectedExerciceId, id_periode,
        periodeDates: selectedPeriodeDates || null,
      });
    } catch (error) {
      console.error('Erreur calcul synthèse anomalies:', error);
      return null;
    }
  };

  const handleExportGlobalExcel = async () => {
    setExportAnchorEl(null);
    if (!selectedExerciceId) return;
    try {
      setGlobalExporting(true);
      const synthese = await getSynthese();
      const response = await axiosPrivate.post(buildGlobalUrl('excel'), { synthese }, { responseType: 'blob' });
      downloadBlob(response.data, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', `Controles_Globaux_${id_dossier}_${selectedExerciceId}.xlsx`);
    } catch (error) {
      console.error('Erreur export global Excel:', error);
    } finally {
      setGlobalExporting(false);
    }
  };

  const handleExportGlobalPdf = async () => {
    setExportAnchorEl(null);
    if (!selectedExerciceId) return;
    try {
      setGlobalExporting(true);
      const synthese = await getSynthese();
      const response = await axiosPrivate.post(buildGlobalUrl('pdf'), { synthese }, { responseType: 'blob' });
      downloadBlob(response.data, 'application/pdf', `Controles_Globaux_${id_dossier}_${selectedExerciceId}.pdf`);
    } catch (error) {
      console.error('Erreur export global PDF:', error);
    } finally {
      setGlobalExporting(false);
    }
  };

  const menuControles = [
    { label: 'Revue Analytique N/N-1', icon: <CompareArrowsOutlined sx={{ fontSize: 20 }} /> },
    { label: 'Revue Mensuelle', icon: <CalendarMonthOutlined sx={{ fontSize: 20 }} /> },
    { label: 'Contrôle Global Balance', icon: <AccountBalanceOutlined sx={{ fontSize: 20 }} /> },
    { label: 'Analyse Frns / Clients', icon: <PeopleAltOutlined sx={{ fontSize: 20 }} /> },
    { label: 'Recherche Doublons', icon: <ContentCopyOutlined sx={{ fontSize: 20 }} /> },
    { label: 'Écritures en suspens', icon: <HelpOutline sx={{ fontSize: 20 }} /> },
    { label: 'Codes Analytiques', icon: <LabelOutlined sx={{ fontSize: 20 }} /> },
  ];

  return (
    <Box sx={{
      p: 3, bgcolor: T.canvas, height: 'calc(100vh - 120px)',
      width: 'calc(100vw - 130px)', display: 'flex', flexDirection: 'column', overflow: 'hidden'
    }}>

      {/* --- EN-TÊTE --- */}
      <Box sx={{ mb: 2, flexShrink: 0 }}>
        <Breadcrumbs
          separator={<NavigateNext sx={{ fontSize: 16, color: T.faint }} />}
          sx={{ mb: 1.5, '& .MuiTypography-root, & a': { fontSize: '12.5px', fontWeight: 600 } }}
        >
          <MuiLink component={Link} to={`/tab/dashboard/${id_dossier}`} underline="hover" sx={{ display: 'flex', alignItems: 'center', color: T.muted }}>
            <DashboardOutlined sx={{ mr: 0.5, fontSize: 16 }} /> Dashboard
          </MuiLink>
          <Typography sx={{ color: T.ink, fontWeight: 700 }}>Détails des contrôles</Typography>
        </Breadcrumbs>

        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ md: 'center' }} spacing={2}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box sx={{ width: 38, height: 38, flex: 'none', borderRadius: '11px', display: 'grid', placeItems: 'center', color: T.accent, bgcolor: `${T.accent}14`, '& svg': { fontSize: 20 } }}>
              <FactCheckOutlined />
            </Box>
            <Box>
              <Typography sx={{ fontSize: '18px', fontWeight: 700, color: T.ink, letterSpacing: '.2px', lineHeight: 1.2 }}>
                Détails des contrôles
              </Typography>
              <Typography sx={{ fontSize: '12px', color: T.muted, mt: 0.2 }}>
                Revue analytique, contrôles comptables &amp; anomalies · {compteName}
              </Typography>
            </Box>
          </Stack>

          <ExercicePeriodeSelector
            selectedExerciceId={selectedExerciceId}
            selectedPeriodeId={selectedPeriodeId}
            onExerciceChange={handleChangeExercice}
            onPeriodeChange={handleChangePeriode}
            disabled={loading}
            size="small"
            sx={{ mb: 0, ml: 0, border: `1px solid ${T.line}`, borderRadius: '10px', boxShadow: CARD_SHADOW }}
          />
        </Stack>
      </Box>

      {/* --- ZONE PRINCIPALE : SIDEBAR + CONTENU --- */}
      <Box sx={{ flex: 1, minHeight: 0, display: 'flex', border: `1px solid ${T.line}`, borderRadius: '16px', overflow: 'hidden', bgcolor: T.surface, boxShadow: CARD_SHADOW }}>

        {/* SIDEBAR GAUCHE */}
        <Box sx={{ width: 264, flexShrink: 0, bgcolor: T.surface, borderRight: `1px solid ${T.line}`, py: 1.5, overflowY: 'auto' }}>
          <Tabs
            orientation="vertical"
            value={activeTab}
            onChange={handleTabChange}
            sx={{
              '& .MuiTabs-indicator': { left: 0, width: 3, borderRadius: '0 4px 4px 0', bgcolor: T.accent },
              '& .MuiTab-root': {
                justifyContent: 'flex-start',
                textTransform: 'none',
                minHeight: 46,
                color: T.muted,
                fontSize: '13px',
                fontWeight: 600,
                px: 2.5,
                textAlign: 'left',
                '&.Mui-selected': { color: T.accent, bgcolor: T.accW },
                '& .MuiTab-iconWrapper': {
                  marginRight: '12px',
                  minWidth: '22px',
                  display: 'flex',
                  justifyContent: 'center'
                }
              }
            }}
          >
            {menuControles.map((item, index) => (
              <Tab key={index} icon={item.icon} iconPosition="start" label={item.label} />
            ))}
          </Tabs>
        </Box>

        {/* ZONE DE TABLEAU À DROITE */}
        <Box sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          overflow: 'hidden',
          bgcolor: T.surface
        }}>
          {/* Header interne (Titre + Filtres + Export) */}
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 2.5, py: 1.5, borderBottom: `1px solid ${T.ledger}`, flexShrink: 0 }}>
            <Typography sx={{ fontSize: '14px', fontWeight: 700, color: T.ink }}>
              {menuControles[activeTab].label}
            </Typography>
            <Stack direction="row" spacing={1}>
              <Button size="small" startIcon={<FilterListOutlined />} sx={{ color: T.muted, textTransform: 'none', fontWeight: 600, fontSize: '13px' }}>Filtres</Button>
              <Button
                size="small"
                startIcon={<FileDownloadOutlined />}
                endIcon={<ArrowDropDown />}
                onClick={(e) => setExportAnchorEl(e.currentTarget)}
                disabled={globalExporting}
                sx={{ color: T.accent, textTransform: 'none', fontWeight: 600, fontSize: '13px' }}
              >
                {globalExporting ? 'Export en cours…' : 'Export'}
              </Button>
              {globalExporting && (
                <CircularProgress size={18} thickness={5} sx={{ color: '#1976d2' }} />
              )}
              <Menu
                anchorEl={exportAnchorEl}
                open={Boolean(exportAnchorEl)}
                onClose={() => setExportAnchorEl(null)}
                PaperProps={{ sx: { mt: 1, borderRadius: '10px', minWidth: 160, boxShadow: '0 8px 24px -12px rgba(16,39,51,.3)' } }}
              >
                <Typography sx={{ px: 2, pt: 1, pb: 0.5, fontSize: '11px', fontWeight: 700, color: T.faint, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Contrôle courant
                </Typography>
                <MenuItem onClick={handleExportExcel} sx={{ gap: 1.5, py: 1, fontSize: '13px' }}>
                  <TableChart sx={{ fontSize: 18, color: T.pos }} /> Export Excel
                </MenuItem>
                <MenuItem onClick={handleExportPdf} sx={{ gap: 1.5, py: 1, fontSize: '13px' }}>
                  <PictureAsPdf sx={{ fontSize: 18, color: T.neg }} /> Export PDF
                </MenuItem>
                <Divider sx={{ my: 0.5 }} />
                <Typography sx={{ px: 2, pt: 0.5, pb: 0.5, fontSize: '11px', fontWeight: 700, color: T.faint, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Tous les contrôles
                </Typography>
                <MenuItem onClick={handleExportGlobalExcel} sx={{ gap: 1.5, py: 1, fontSize: '13px' }}>
                  <TableChart sx={{ fontSize: 18, color: T.pos }} /> Tout exporter (Excel)
                </MenuItem>
                <MenuItem onClick={handleExportGlobalPdf} sx={{ gap: 1.5, py: 1, fontSize: '13px' }}>
                  <PictureAsPdf sx={{ fontSize: 18, color: T.neg }} /> Tout exporter (PDF)
                </MenuItem>
              </Menu>
            </Stack>
          </Stack>

          {/* Conteneur spécifique pour le tableau */}
          <Box sx={{
            flexGrow: 1,
            width: '100%', // S'occupe de remplir l'espace restant sans dépasser
            height: '100%',
            position: 'relative',
            minHeight: 0,
            overflow: 'auto'
          }}>
            {!hasPeriode ? (
              <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1.5, p: 4, textAlign: 'center' }}>
                <CalendarMonthOutlined sx={{ fontSize: 44, color: T.faint }} />
                <Typography sx={{ fontSize: '15px', fontWeight: 700, color: T.ink }}>
                  Sélectionnez une période
                </Typography>
                <Typography sx={{ fontSize: '13px', color: T.muted, maxWidth: 360 }}>
                  Choisissez une période dans le sélecteur en haut à droite pour afficher les résultats de ce contrôle.
                </Typography>
              </Box>
            ) : (
              <>
            {activeTab === 0 && <RevueAnalytiqueTable
              ref={revueAnalytiqueRef}
              id_exercice={selectedExerciceId}
              id_periode={selectedPeriodeId}
            />}
            {activeTab === 1 && <RevueMensuelleTable
              ref={revueMensuelleRef}
              id_exercice={selectedExerciceId}
              id_periode={selectedPeriodeId}
            />}
            {activeTab === 2 && (
              <GlobalBalance
                ref={globalBalanceRef}
                id_exercice={selectedExerciceId}
                id_periode={selectedPeriodeId}
              />
            )}

            {activeTab === 3 && (
              <AnalyseTiers
                ref={analyseTiersRef}
                id_exercice={selectedExerciceId}
                id_periode={selectedPeriodeId}
              />
            )}
            {activeTab === 4 && (
              <RechercheDoublons
                ref={rechercheDoublonRef}
                id_exercice={selectedExerciceId}
                id_periode={selectedPeriodeId}
              />
            )}
            {activeTab === 5 && (
              <EcrituresSuspense
                ref={ecrituresSuspenseRef}
                id_exercice={selectedExerciceId}
                id_periode={selectedPeriodeId}
              />
            )}
            {activeTab === 6 && (
              <ControleAnalytique
                ref={controleAnalytiqueRef}
                id_exercice={selectedExerciceId}
                id_periode={selectedPeriodeId}
              />
            )}
              </>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

const dataGridStyle = {
  border: 'none',
  '& .MuiDataGrid-columnHeaders': {
    bgcolor: '#F8FAFC',
    color: '#64748B',
    fontSize: '0.7rem',
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: 700,
    borderBottom: '1px solid #E2E8F0',
  },
  '& .MuiDataGrid-cell': {
    borderBottom: '1px solid #F1F5F9',
    fontSize: '0.85rem',
    '&:focus': { outline: 'none' }
  },
};

export default DetailsControles;