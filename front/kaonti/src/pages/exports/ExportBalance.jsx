import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Stack,
  Button,
  Paper,
  Grid,
  Breadcrumbs,
  Link,
  MenuItem,
  Select,
  Divider,
  TextField,
  FormControlLabel,
  Switch,
  Chip,
  Menu,
  ListItemIcon,
  ListItemText,
  CircularProgress
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import {
  NavigateNext,
  PictureAsPdfOutlined,
  TableChartOutlined,
  AccountBalanceOutlined,
  FilterListOutlined,
  DashboardOutlined,
  FileDownloadOutlined
} from '@mui/icons-material';
import { FaFilePdf, FaFileExcel } from 'react-icons/fa';
import useAuth from '../../hooks/useAuth';
import { jwtDecode } from 'jwt-decode';
import axios from '../../../config/axios';
import toast from 'react-hot-toast';
import PopupTestSelectedFile from '../../components/PopupTestSelectedFile';
import { format } from 'date-fns';

// ─── Système de design (aligné sur le tableau de bord) ───
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
  warn: '#B5791A',
  neg: '#BE3A2F',
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
const fieldLabelSx = {
  fontSize: '10px',
  textTransform: 'uppercase',
  letterSpacing: '.4px',
  fontWeight: 600,
  color: T.faint,
  mb: 0.5,
  display: 'block',
};
const selectSx = {
  height: 34,
  fontSize: '13px',
  borderRadius: '8px',
  bgcolor: T.surface,
  '& .MuiOutlinedInput-notchedOutline': { borderColor: T.line },
  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#CBD5E1' },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: T.accent },
};
const switchSx = {
  '& .MuiSwitch-switchBase.Mui-checked': { color: T.accent },
  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: T.accent },
};
const sectionTitleSx = {
  fontSize: '11px',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '.5px',
  color: T.ink,
  mb: 1.5,
};

// Total d'une colonne (libellé + montant tabulaire)
const TotalItem = ({ label, value, fmt }) => (
  <Stack alignItems="flex-end">
    <Typography sx={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '.3px', color: T.faint, fontWeight: 600 }}>
      {label}
    </Typography>
    <Typography sx={{ ...NUM, fontSize: '15px', fontWeight: 800, color: T.ink }}>{fmt(value)}</Typography>
  </Stack>
);

const ExportBalance = () => {
  const { auth } = useAuth();
  const decoded = auth?.accessToken ? jwtDecode(auth.accessToken) : undefined;
  const compteId = decoded?.UserInfo?.compteId || null;
  const compteName = decoded?.UserInfo?.compte || 'Espace Client';
  const navigate = useNavigate();
  const { id } = useParams();

  // Filtres
  const [checked, setChecked] = useState(false);
  const [unsoldedCompte, setUnsoldedCompte] = useState(false);
  const [movmentedCpt, setMovmentedCpt] = useState(false);
  const [type, setType] = useState(0);

  // États dossier/exercice
  const [fileId, setFileId] = useState(0);
  const [noFile, setNoFile] = useState(false);
  const [listeExercice, setListeExercice] = useState([]);
  const [selectedExerciceId, setSelectedExerciceId] = useState(0);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Données balance
  const [balance, setBalance] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const balanceFetchTimer = useRef(null);

  // Menu Export
  const [anchorElExport, setAnchorElExport] = useState(null);
  const openExportMenu = Boolean(anchorElExport);
  const handleOpenExportMenu = useCallback((event) => setAnchorElExport(event.currentTarget), []);
  const handleCloseExportMenu = useCallback(() => setAnchorElExport(null), []);

  // Récupération fileId depuis URL ou sessionStorage
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

    if (!idFile || idFile === '0') {
      setNoFile(true);
    } else {
      setNoFile(false);
      GetListeExercice(idFile);
    }
  }, [id]);

  // Récupérer la liste des exercices
  const GetListeExercice = (idDossier) => {
    axios.get(`/api/exercices/listeExercice/${idDossier}`).then((response) => {
      const resData = response.data;
      if (resData.state) {
        setListeExercice(resData.list);
        if (resData.list.length > 0) {
          setSelectedExerciceId(resData.list[0].id);
        }
      } else {
        setListeExercice([]);
        toast.error("Erreur lors de la récupération des exercices");
      }
    });
  };

  // Mise à jour des dates quand l'exercice change
  useEffect(() => {
    const ex = Array.isArray(listeExercice) ? listeExercice.find((e) => Number(e?.id) === Number(selectedExerciceId)) : null;
    const toYmd = (d) => {
      if (!d) return '';
      const dt = new Date(d);
      if (Number.isNaN(dt.getTime())) return '';
      const yyyy = dt.getFullYear();
      const mm = String(dt.getMonth() + 1).padStart(2, '0');
      const dd = String(dt.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };
    setStartDate(toYmd(ex?.date_debut));
    setEndDate(toYmd(ex?.date_fin));
  }, [listeExercice, selectedExerciceId]);

  // Récupération de la balance
  const recupBalance = useCallback(() => {
    if (!compteId || !fileId || !selectedExerciceId) return;

    setLoading(true);
    setLoadingMsg('Chargement de la balance...');

    axios.post(`/traitement/exportBalance/recupBalanceFromJournal`, {
      centraliser: checked,
      unSolded: unsoldedCompte,
      movmentedCpt: movmentedCpt,
      compteId,
      fileId,
      exerciceId: selectedExerciceId,
      type,
      dateDebut: startDate || null,
      dateFin: endDate || null
    }).then((response) => {
      const resData = response.data;
      if (resData.state) {
        // Ajouter un id unique pour chaque ligne DataGrid
        const rowsWithId = (resData.list || []).map((row, idx) => ({
          ...row,
          id: idx + 1
        }));
        setBalance(rowsWithId);
      } else {
        if (resData?.msg && !String(resData.msg).includes('Paramètres manquants')) {
          toast.error(resData.msg);
        }
        setBalance([]);
      }
      setLoading(false);
      setLoadingMsg('');
    }).catch((err) => {
      console.error(err);
      toast.error('Erreur lors du chargement de la balance');
      setBalance([]);
      setLoading(false);
      setLoadingMsg('');
    });
  }, [checked, unsoldedCompte, movmentedCpt, compteId, fileId, selectedExerciceId, type, startDate, endDate]);

  // Déclencher le chargement de la balance quand les filtres changent
  useEffect(() => {
    if (!compteId || !fileId || !selectedExerciceId) return;
    if (balanceFetchTimer.current) clearTimeout(balanceFetchTimer.current);
    balanceFetchTimer.current = setTimeout(() => {
      recupBalance();
    }, 300);
    return () => {
      if (balanceFetchTimer.current) clearTimeout(balanceFetchTimer.current);
    };
  }, [recupBalance]);

  // Export PDF/Excel
  const doExport = useCallback(async (exportType) => {
    try {
      if (!compteId || !fileId || !selectedExerciceId) {
        toast.error('Veuillez sélectionner un exercice valide avant d\'exporter.');
        return;
      }
      setLoadingMsg('Génération en cours...');
      setLoading(true);
      const url = exportType === 'pdf' ? '/traitement/exportBalance/pdf' : '/traitement/exportBalance/excel';
      const body = {
        centraliser: checked,
        unSolded: unsoldedCompte,
        movmentedCpt: movmentedCpt,
        compteId,
        fileId,
        exerciceId: selectedExerciceId,
        data: balance
      };
      const response = await axios.post(url, body, { responseType: 'blob' });
      const blobType = exportType === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      const ext = exportType === 'pdf' ? 'pdf' : 'xlsx';
      const blob = new Blob([response.data], { type: blobType });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `Balance_${fileId}_${selectedExerciceId}.${ext}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Export réussi');
    } catch (e) {
      toast.error('Erreur lors de l\'export');
    } finally {
      setLoading(false);
      setLoadingMsg('');
      handleCloseExportMenu();
    }
  }, [checked, unsoldedCompte, movmentedCpt, compteId, fileId, selectedExerciceId, balance, handleCloseExportMenu]);

  // Calcul des totaux
  const balanceTotals = useMemo(() => {
    const rows = Array.isArray(balance) ? balance : [];
    const sum = (k) => rows.reduce((acc, r) => acc + (Number(r?.[k]) || 0), 0);
    return {
      mvmdebit: sum('mvmdebit'),
      mvmcredit: sum('mvmcredit'),
      soldedebit: sum('soldedebit'),
      soldecredit: sum('soldecredit'),
    };
  }, [balance]);

  // Équilibre de la balance (solde débit vs solde crédit)
  const soldeEcart = Math.abs((balanceTotals.soldedebit || 0) - (balanceTotals.soldecredit || 0));
  const isBalanced = soldeEcart < 0.005;

  // Redirection si pas de dossier
  const sendToHome = (value) => {
    setNoFile(!value);
    navigate('/home');
  };

  // Format monétaire
  const formatMoney = (v) => (Number(v) || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Colonnes DataGrid
  const moneyCol = (field, headerName) => ({
    field,
    headerName,
    width: 140,
    align: 'right',
    headerAlign: 'right',
    renderCell: (params) => (
      <Typography sx={{ ...NUM, fontSize: '0.78rem', fontWeight: 600, color: T.text }}>
        {formatMoney(params.value)}
      </Typography>
    ),
  });

  const columns = [
    {
      field: 'compte',
      headerName: 'N° COMPTE',
      width: 120,
      renderCell: (params) => (
        <Typography sx={{ ...NUM, fontSize: '0.78rem', fontWeight: 700, color: T.accent }}>
          {params.value}
        </Typography>
      )
    },
    {
      field: 'libelle',
      headerName: 'INTITULÉ DU COMPTE',
      flex: 1,
      minWidth: 220,
      renderCell: (params) => (
        <Typography noWrap sx={{ fontSize: '0.78rem', fontWeight: 600, color: T.text }}>
          {params.value}
        </Typography>
      )
    },
    moneyCol('mvmdebit', 'MOUV. DÉBIT'),
    moneyCol('mvmcredit', 'MOUV. CRÉDIT'),
    moneyCol('soldedebit', 'SOLDE DÉBIT'),
    moneyCol('soldecredit', 'SOLDE CRÉDIT'),
  ];

  if (noFile) {
    return <PopupTestSelectedFile confirmationState={sendToHome} />;
  }

  return (
    <Box
      sx={{
        p: 3,
        bgcolor: T.canvas,
        height: 'calc(100vh - 120px)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        width: 'calc(100vw - 130px)',
        minWidth: 0,
      }}
    >

      {/* --- EN-TÊTE --- */}
      <Box sx={{ mb: 2.5, flexShrink: 0, minWidth: 0 }}>
        <Breadcrumbs
          separator={<NavigateNext sx={{ fontSize: 16, color: T.faint }} />}
          sx={{ mb: 1.5, '& .MuiTypography-root, & a': { fontSize: '12.5px', fontWeight: 600 } }}
        >
          <Link underline="hover" onClick={() => navigate(`/tab/dashboard/${fileId}`)} sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center', color: T.muted }}>
            <DashboardOutlined sx={{ mr: 0.5, fontSize: 16 }} /> Dashboard
          </Link>
          <Typography sx={{ color: T.ink, fontWeight: 700 }}>Balance générale</Typography>
        </Breadcrumbs>

        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box sx={{ width: 38, height: 38, flex: 'none', borderRadius: '11px', display: 'grid', placeItems: 'center', color: T.accent, bgcolor: `${T.accent}14`, '& svg': { fontSize: 20 } }}>
            <AccountBalanceOutlined />
          </Box>
          <Box>
            <Typography sx={{ fontSize: '18px', fontWeight: 700, color: T.ink, letterSpacing: '.2px', lineHeight: 1.2 }}>
              Balance des comptes
            </Typography>
            <Typography sx={{ fontSize: '12px', color: T.muted, mt: 0.2 }}>
              Consultez et exportez la balance · {compteName}
            </Typography>
          </Box>
        </Stack>
      </Box>

      {/* ESPACE DE TRAVAIL : paramètres (gauche) + aperçu (droite) */}
      <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>

        {/* PANNEAU DE PARAMÈTRES (vertical) */}
        <Paper elevation={0} sx={{ ...panelSx, width: { xs: '100%', md: 320 }, flex: 'none', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          {/* Paramètres */}
          <Box sx={{ p: 2.5, borderBottom: `1px solid ${T.ledger}` }}>
            <Typography sx={sectionTitleSx}>Paramètres</Typography>
            <Stack spacing={1.75}>
              <Box>
                <Typography sx={fieldLabelSx}>Exercice</Typography>
                <Select
                  fullWidth
                  value={selectedExerciceId}
                  onChange={(e) => setSelectedExerciceId(e.target.value)}
                  size="small"
                  sx={{ ...selectSx, ...NUM, fontWeight: 700 }}
                >
                  {listeExercice.map((option) => (
                    <MenuItem key={option.id} value={option.id} sx={{ ...NUM, fontSize: '13px' }}>
                      <Box
                          component="span"
                          sx={{
                              display: 'inline-block',
                              px: 0.75,
                              py: '2px',
                              mr: 0.75,
                              borderRadius: '5px',
                              bgcolor: '#E7F2EE',
                              color: '#1F8A70',
                              fontWeight: 700,
                              fontSize: '0.7rem',
                              lineHeight: 1.4,
                              width: 30
                          }}
                      >
                        {option.libelle_rang}
                      </Box>
                       
                      : {format(new Date(option.date_debut), 'dd/MM/yyyy')} – {format(new Date(option.date_fin), 'dd/MM/yyyy')}
                    </MenuItem>
                  ))}
                </Select>
              </Box>
              <Box>
                <Typography sx={fieldLabelSx}>Type de balance</Typography>
                <Select
                  fullWidth
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  size="small"
                  sx={{ ...selectSx, fontWeight: 700 }}
                >
                  <MenuItem value={0} sx={{ fontSize: '13px' }}>Générale</MenuItem>
                  <MenuItem value={1} sx={{ fontSize: '13px' }}>Fournisseurs</MenuItem>
                  <MenuItem value={2} sx={{ fontSize: '13px' }}>Clients</MenuItem>
                </Select>
              </Box>
              <Box>
                <Typography sx={fieldLabelSx}>Arrêté au</Typography>
                <TextField
                  fullWidth
                  type="date"
                  size="small"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  sx={{ '& .MuiOutlinedInput-root': { ...NUM, height: 34, fontSize: '13px', fontWeight: 600, borderRadius: '8px' }, '& .MuiOutlinedInput-notchedOutline': { borderColor: T.line } }}
                />
              </Box>
            </Stack>
          </Box>

          {/* Options d'affichage */}
          <Box sx={{ p: 2.5, borderBottom: `1px solid ${T.ledger}` }}>
            <Typography sx={sectionTitleSx}>Options d'affichage</Typography>
            <Stack>
              <FormControlLabel
                control={<Switch size="small" checked={checked} onChange={(e) => setChecked(e.target.checked)} sx={switchSx} />}
                label={<Typography sx={{ fontSize: '13px', fontWeight: 600, color: T.text }}>Centraliser</Typography>}
              />
              <FormControlLabel
                control={<Switch size="small" checked={unsoldedCompte} onChange={(e) => setUnsoldedCompte(e.target.checked)} sx={switchSx} />}
                label={<Typography sx={{ fontSize: '13px', fontWeight: 600, color: T.text }}>Comptes non soldés</Typography>}
              />
              <FormControlLabel
                control={<Switch size="small" checked={movmentedCpt} onChange={(e) => setMovmentedCpt(e.target.checked)} sx={switchSx} />}
                label={<Typography sx={{ fontSize: '13px', fontWeight: 600, color: T.text }}>Comptes mouvementés</Typography>}
              />
            </Stack>
          </Box>

          {/* Export */}
          <Box sx={{ p: 2.5, mt: 'auto' }}>
            <Typography sx={sectionTitleSx}>Exporter</Typography>
            <Stack spacing={1}>
              <Button
                fullWidth
                variant="contained"
                disableElevation
                startIcon={<TableChartOutlined />}
                onClick={() => doExport('excel')}
                disabled={!balance.length || loading}
                sx={{ textTransform: 'none', fontWeight: 600, fontSize: '13px', bgcolor: T.pos, borderRadius: '8px', '&:hover': { bgcolor: '#176e59' }, '&.Mui-disabled': { bgcolor: T.ledger, color: T.faint } }}
              >
                Exporter en Excel
              </Button>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<PictureAsPdfOutlined />}
                onClick={() => doExport('pdf')}
                disabled={!balance.length || loading}
                sx={{ textTransform: 'none', fontWeight: 600, fontSize: '13px', color: T.neg, borderColor: T.line, borderRadius: '8px', '&:hover': { borderColor: T.neg, bgcolor: 'rgba(190,58,47,.06)' } }}
              >
                Exporter en PDF
              </Button>
            </Stack>
          </Box>
        </Paper>

        {/* APERÇU + TOTAUX */}
        <Paper elevation={0} sx={{ ...panelSx, flex: 1, minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        {/* En-tête : titre + nb lignes + chargement + équilibre */}
        <Box sx={{ px: 2.5, py: 1.5, borderBottom: `1px solid ${T.ledger}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexShrink: 0, flexWrap: 'wrap', rowGap: 1 }}>
          <Stack direction="row" alignItems="center" spacing={1.25}>
            <Typography sx={{ fontSize: '13px', fontWeight: 700, color: T.ink }}>Aperçu de la balance</Typography>
            <Box component="span" sx={{ ...NUM, fontFamily: MONO, fontSize: '10px', fontWeight: 600, color: T.accent, bgcolor: T.accW, px: 1, py: '3px', borderRadius: '5px' }}>
              {balance.length} lignes
            </Box>
            {loading && (
              <Stack direction="row" alignItems="center" spacing={0.75}>
                <CircularProgress size={13} thickness={5} sx={{ color: T.accent }} />
                <Typography sx={{ fontSize: '11.5px', color: T.muted }}>{loadingMsg || 'Chargement…'}</Typography>
              </Stack>
            )}
          </Stack>

          {balance.length > 0 && (
            <Stack direction="row" alignItems="center" spacing={0.75} sx={{ px: 1, py: 0.4, borderRadius: '99px', bgcolor: isBalanced ? 'rgba(31,138,112,.12)' : 'rgba(190,58,47,.12)' }}>
              <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: isBalanced ? T.pos : T.neg }} />
              <Typography sx={{ ...NUM, fontSize: '11.5px', fontWeight: 700, color: isBalanced ? T.pos : T.neg }}>
                {isBalanced ? 'Balance équilibrée' : `Écart : ${formatMoney(soldeEcart)}`}
              </Typography>
            </Stack>
          )}
        </Box>

        {/* Grille / état vide */}
        <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          {balance.length === 0 && !loading ? (
            <Stack alignItems="center" justifyContent="center" spacing={1.5} sx={{ flex: 1, px: 3, textAlign: 'center' }}>
              <Box sx={{ width: 56, height: 56, borderRadius: '16px', display: 'grid', placeItems: 'center', color: T.faint, bgcolor: T.ledger }}>
                <AccountBalanceOutlined sx={{ fontSize: 28 }} />
              </Box>
              <Typography sx={{ fontSize: '14px', fontWeight: 600, color: T.muted }}>Aucune ligne à afficher</Typography>
              <Typography sx={{ fontSize: '12.5px', color: T.faint, maxWidth: 360 }}>
                Ajustez les filtres ci-dessus (exercice, type, date d'arrêté, options) pour générer la balance.
              </Typography>
            </Stack>
          ) : (
            <DataGrid
              rows={balance}
              columns={columns}
              density="compact"
              disableSelectionOnClick
              sx={{
                border: 'none',
                height: '100%',
                ...NUM,
                fontSize: '12.5px',
                '& .MuiDataGrid-main': { overflow: 'hidden' },
                '& .MuiDataGrid-columnHeaders': {
                  bgcolor: T.ledger,
                  borderBottom: `1px solid ${T.line}`,
                  '& .MuiDataGrid-columnHeaderTitle': { fontSize: '11px', fontWeight: 700, color: T.muted, letterSpacing: '.3px' },
                },
                '& .MuiDataGrid-cell': { borderBottom: '1px solid #F1F4F6', color: T.text },
                '& .MuiDataGrid-virtualScroller': { bgcolor: T.surface },
                '& .MuiDataGrid-row:hover': { bgcolor: '#FAFBFB' },
              }}
            />
          )}
        </Box>

        {/* TOTAUX */}
        <Box sx={{ px: 2.5, py: 1.5, borderTop: `1px solid ${T.line}`, bgcolor: '#FCFDFD', flexShrink: 0 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
            <Typography sx={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', color: T.muted }}>
              Total général
            </Typography>
            <Stack direction="row" useFlexGap flexWrap="wrap" gap={4}>
              <TotalItem label="Mouv. débit" value={balanceTotals.mvmdebit} fmt={formatMoney} />
              <TotalItem label="Mouv. crédit" value={balanceTotals.mvmcredit} fmt={formatMoney} />
              <TotalItem label="Solde débit" value={balanceTotals.soldedebit} fmt={formatMoney} />
              <TotalItem label="Solde crédit" value={balanceTotals.soldecredit} fmt={formatMoney} />
            </Stack>
          </Stack>
        </Box>
        </Paper>
      </Box>

    </Box>
  );
};

export default ExportBalance;