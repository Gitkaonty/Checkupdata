import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from '../../../config/axios';
import { jwtDecode } from 'jwt-decode';
import {
  Box, Typography, Stack, Button, Paper, Grid,
  Breadcrumbs, Link, MenuItem, Select, Divider,
  TextField, InputAdornment, Autocomplete,
  Chip
} from '@mui/material';
import {
  NavigateNext, FileDownloadOutlined,
  HistoryOutlined, DateRangeOutlined,
  PictureAsPdfOutlined, TableChartOutlined,
  AccountBalanceWalletOutlined,
  DashboardOutlined
} from '@mui/icons-material';
import { format } from 'date-fns';
import { ListItemIcon, ListItemText } from '@mui/material';
import Checkbox from '@mui/material/Checkbox';
import useAuth from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import RestartAltIcon from '@mui/icons-material/RestartAlt';

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
const sectionTitleSx = {
  fontSize: '11px',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '.5px',
  color: T.ink,
  mb: 1.5,
};

// Ligne de récapitulatif (libellé / valeur)
const RecapRow = ({ label, value }) => (
  <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2} sx={{ py: 1.25 }}>
    <Typography sx={{ fontSize: '12.5px', fontWeight: 600, color: T.muted }}>{label}</Typography>
    <Typography sx={{ ...NUM, fontSize: '13px', fontWeight: 700, color: T.ink, textAlign: 'right' }}>{value}</Typography>
  </Stack>
);

// Ligne à puce
const BulletLine = ({ children }) => (
  <Stack direction="row" spacing={1} alignItems="flex-start">
    <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: T.accent, mt: '7px', flex: 'none' }} />
    <Typography sx={{ fontSize: '12.5px', color: T.text, lineHeight: 1.5 }}>{children}</Typography>
  </Stack>
);

const ExportGrandLivre = () => {
  const [fileInfos, setFileInfos] = useState('');
  const [fileId, setFileId] = useState(0);
  const { id } = useParams();
  const [noFile, setNoFile] = useState(false);

  const [selectedExerciceId, setSelectedExerciceId] = useState(0);
  const [selectedPeriodeChoiceId, setSelectedPeriodeChoiceId] = useState(0);
  const [selectedPeriodeId, setSelectedPeriodeId] = useState(0);
  const [listeExercice, setListeExercice] = useState([]);
  const [listeSituation, setListeSituation] = useState([]);

  const [listeComptes, setListeComptes] = useState([]);
  const [compteAux, setCompteAux] = useState([]); // multiple comptes auxiliaires
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [exporting, setExporting] = useState(false);
  const [exportMsg, setExportMsg] = useState('');

  // Helpers for select-all on comptes
  const ALL_OPTION = '__ALL__';
  const allComptes = Array.isArray(listeComptes) ? listeComptes.map(v => v.compte) : [];
  const isAllSelected = allComptes.length > 0 && compteAux.length === allComptes.length && allComptes.every(c => compteAux.includes(c));

  const handleChangeComptes = (value) => {
    if (value.includes(ALL_OPTION)) {
      if (isAllSelected) {
        setCompteAux([]);
      } else {
        setCompteAux(allComptes);
      }
    } else {
      setCompteAux(value);
    }
  };
  const [anchorElExport, setAnchorElExport] = useState(null);
  const openExportMenu = Boolean(anchorElExport);
  const handleOpenExportMenu = (event) => setAnchorElExport(event.currentTarget);
  const handleCloseExportMenu = () => setAnchorElExport(null);

  const { auth } = useAuth();
  const decoded = auth?.accessToken ? jwtDecode(auth.accessToken) : undefined;
  const compteId = decoded?.UserInfo?.compteId || null;
  const compteName = decoded?.UserInfo?.compte || 'Espace Client';

  const navigate = useNavigate();

  const GetInfosIdDossier = (id) => {
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
    navigate('/home');
  }

  const handleChangeExercice = (exercice_id) => {
    setSelectedExerciceId(exercice_id);
    setSelectedPeriodeChoiceId("0");
    setListeSituation(listeExercice?.filter((item) => item.id === exercice_id));
    setSelectedPeriodeId(exercice_id);
    // Fixer les dates du filtre à l'année (intervalle) de l'exercice
    const ex = listeExercice.find((e) => e.id === exercice_id);
    if (ex) {
      const d1 = format(new Date(ex.date_debut), 'yyyy-MM-dd');
      const d2 = format(new Date(ex.date_fin), 'yyyy-MM-dd');
      setDateDebut(d1);
      setDateFin(d2);
    }
  }

  const GetListeExercice = (idDossier) => {
    axios.get(`/api/exercices/listeExercice/${idDossier}`).then((response) => {
      const resData = response.data;
      if (resData.state) {
        const list = Array.isArray(resData.list) ? resData.list : [];
        setListeExercice(list);
        // Exercice "N" si présent, sinon le premier de la liste (évite le crash undefined.id)
        const exSel = list.find((item) => item.libelle_rang === "N") || list[0];
        if (exSel) {
          setListeSituation(list.filter((item) => item.id === exSel.id));
          setSelectedExerciceId(exSel.id);
          setSelectedPeriodeChoiceId(0);
          setSelectedPeriodeId(exSel.id);
          // Initialiser les dates du filtre avec celles de l'exercice sélectionné
          setDateDebut(format(new Date(exSel.date_debut), 'yyyy-MM-dd'));
          setDateFin(format(new Date(exSel.date_fin), 'yyyy-MM-dd'));
        }
      } else {
        setListeExercice([]);
        toast.error("une erreur est survenue lors de la récupération de la liste des exercices");
      }
    }).catch(() => {
      setListeExercice([]);
      toast.error("une erreur est survenue lors de la récupération de la liste des exercices");
    })
  }

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

  const GetListeComptes = () => {
    axios.get(`/administration/exportGrandLivre/listeCompteAux/${compteId}/${fileId}/${selectedExerciceId}`).then((response) => {
      const resData = response.data;
      if (resData.state) {
        setListeComptes(resData.liste || []);
      } else {
        // Liste vide (aucune écriture) : pas une erreur bloquante
        setListeComptes([]);
      }
    }).catch((err) => {
      setListeComptes([]);
      toast.error('Erreur lors de la récupération des comptes');
    })
  }

  const handleChangePeriode = (choix) => {
    setSelectedPeriodeChoiceId(choix);
    if (choix === 0) {
      setListeSituation(listeExercice?.filter((item) => item.id === selectedExerciceId));
      setSelectedPeriodeId(selectedExerciceId);
    } else if (choix === 1) {
      GetListeSituation(selectedExerciceId);
    }
  }

  const handleChangeDateIntervalle = (id) => {
    setSelectedPeriodeId(id);
    // Adapter les dates si une situation est choisie (plage spécifique)
    const sit = listeSituation?.find((s) => s.id === id);
    if (sit) {
      const d1 = format(new Date(sit.date_debut), 'yyyy-MM-dd');
      const d2 = format(new Date(sit.date_fin), 'yyyy-MM-dd');
      setDateDebut(d1);
      setDateFin(d2);
    }
  }

  const handleApplyFilter = () => {
    const hasFilter = (Array.isArray(compteAux) && compteAux.length > 0) || (dateDebut && dateDebut !== '') || (dateFin && dateFin !== '');
    if (!hasFilter) {
      return toast.error('Veuillez sélectionner au moins un filtre (compte ou dates).');
    }
    toast.success('Filtre appliqué');
  };

  const handleResetFilter = () => {
    setCompteAux([]);
    setDateDebut('');
    setDateFin('');
    toast.success('Filtre réinitialisé');
  };

  const canExport = () => {
    const hasFilter = (Array.isArray(compteAux) && compteAux.length > 0) || (dateDebut && dateDebut !== '') || (dateFin && dateFin !== '');
    return hasFilter && !!compteId && !!fileId && !!selectedExerciceId;
  };

  const exportPdf = async () => {
    if (!canExport()) {
      return toast.error('Renseignez au moins un filtre et Sélectionnez un exercice.');
    }
    try {
      setExporting(true);
      setExportMsg('Génération du PDF...');
      const body = {
        compteId,
        fileId,
        exerciceId: selectedExerciceId,
        compteAux,
        dateDebut,
        dateFin,
      };
      const response = await axios.post('/administration/exportGrandLivre/pdf', body, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `GrandLivre_${fileId}_${selectedExerciceId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      toast.error('Erreur lors de l\'export du journal');
    } finally {
      setExporting(false);
      setExportMsg('');
    }
  };

  const exportExcel = async () => {
    if (!canExport()) {
      return toast.error('Renseignez au moins un filtre et Sélectionnez un exercice.');
    }
    try {
      setExporting(true);
      setExportMsg('Génération de l\'Excel...');
      const body = {
        compteId,
        fileId,
        exerciceId: selectedExerciceId,
        compteAux,
        dateDebut,
        dateFin,
      };
      const response = await axios.post('/administration/exportGrandLivre/excel', body, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `GrandLivre_${fileId}_${selectedExerciceId}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      toast.error('Erreur lors de l\'export du journal (Excel)');
    } finally {
      setExporting(false);
      setExportMsg('');
      handleCloseExportMenu();
    }
  };

  useEffect(() => {
    // Résolution robuste de l'id dossier : paramètre de route (:id), sinon sessionStorage
    const idFile = id || sessionStorage.getItem('fileId') || 0;
    if (idFile && idFile !== '0') {
      sessionStorage.setItem('fileId', idFile);
      setFileId(idFile);
    }
    GetInfosIdDossier(idFile);
    GetListeExercice(idFile);
  }, []);

  useEffect(() => {
    if (fileId && compteId && selectedExerciceId) {
      GetListeComptes();
    }
  }, [fileId, compteId, selectedExerciceId]);


  const optionsComptes = React.useMemo(() => {
    // Conserver l'ordre renvoyé par le backend (compte puis baseaux)
    return (listeComptes || []).map((c) => c.compte);
  }, [listeComptes]);

  const selectedEx = listeExercice.find((e) => e.id === selectedExerciceId);

  return (
    <Box
      sx={{
        p: 3,
        bgcolor: T.canvas,
        height: 'calc(100vh - 120px)',
        width: 'calc(100vw - 130px)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        minWidth: 0,
      }}
    >
      {/* --- EN-TÊTE --- */}
      <Box sx={{ mb: 2.5, flexShrink: 0, minWidth: 0 }}>
        <Breadcrumbs
          separator={<NavigateNext sx={{ fontSize: 16, color: T.faint }} />}
          sx={{ mb: 1.5, '& .MuiTypography-root, & a': { fontSize: '12.5px', fontWeight: 600 } }}
        >
          <Link underline="hover" href="/dashboard" sx={{ display: 'flex', alignItems: 'center', color: T.muted }}>
            <DashboardOutlined sx={{ mr: 0.5, fontSize: 16 }} /> Dashboard
          </Link>
          <Typography sx={{ color: T.ink, fontWeight: 700 }}>Grand livre</Typography>
        </Breadcrumbs>

        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box sx={{ width: 38, height: 38, flex: 'none', borderRadius: '11px', display: 'grid', placeItems: 'center', color: T.accent, bgcolor: `${T.accent}14`, '& svg': { fontSize: 20 } }}>
            <AccountBalanceWalletOutlined />
          </Box>
          <Box>
            <Typography sx={{ fontSize: '18px', fontWeight: 700, color: T.ink, letterSpacing: '.2px', lineHeight: 1.2 }}>
              Export du grand livre
            </Typography>
            <Typography sx={{ fontSize: '12px', color: T.muted, mt: 0.2 }}>
              Extraction détaillée des écritures par compte · {compteName}
            </Typography>
          </Box>
        </Stack>
      </Box>

      {/* ESPACE DE TRAVAIL : paramètres (gauche) + récapitulatif (droite) */}
      <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>

        {/* PANNEAU DE PARAMÈTRES (vertical) */}
        <Paper elevation={0} sx={{ ...panelSx, width: { xs: '100%', md: 360 }, flex: 'none', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          {/* Critères */}
          <Box sx={{ p: 2.5, borderBottom: `1px solid ${T.ledger}` }}>
            <Typography sx={sectionTitleSx}>Critères d'extraction</Typography>
            <Stack spacing={1.75}>
              <Box>
                <Typography sx={fieldLabelSx}>Exercice</Typography>
                <Select
                  fullWidth
                  value={selectedExerciceId}
                  onChange={(e) => handleChangeExercice(e.target.value)}
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
                <Typography sx={fieldLabelSx}>Sélection de comptes</Typography>
                <Autocomplete
                  multiple
                  size="small"
                  options={[ALL_OPTION, ...optionsComptes]}
                  value={compteAux}
                  disableCloseOnSelect
                  renderTags={(value) => {
                    const vals = value.filter((v) => v !== ALL_OPTION);
                    if (!vals.length) return null;
                    return (
                      <Chip
                        size="small"
                        label={`${vals.length} compte${vals.length > 1 ? 's' : ''}`}
                        sx={{ height: 22, fontSize: '12px', fontWeight: 700, bgcolor: T.accW, color: T.accent, m: 0.25 }}
                      />
                    );
                  }}
                  slotProps={{
                    popper: { style: { width: 'fit-content' } },
                    paper: { sx: { minWidth: 360, maxWidth: 640 } },
                  }}
                  onChange={(event, newValue) => {
                    if (newValue.includes(ALL_OPTION)) {
                      handleChangeComptes(isAllSelected ? [] : optionsComptes);
                    } else {
                      handleChangeComptes(newValue);
                    }
                  }}
                  getOptionLabel={(option) => {
                    if (option === ALL_OPTION) return 'Sélectionner tout';
                    const item = listeComptes.find((c) => c.compte === option);
                    return item && item.libelle ? `${item.compte} - ${item.libelle}` : option;
                  }}
                  renderOption={(props, option, { selected }) => {
                    const isAll = option === ALL_OPTION;
                    const item = listeComptes.find((c) => c.compte === option);
                    const label = isAll
                      ? 'Sélectionner tout'
                      : (item && item.libelle ? `${item.compte} - ${item.libelle}` : option);
                    return (
                      <li {...props} style={{ whiteSpace: 'nowrap', paddingTop: 2, paddingBottom: 2, minHeight: 0 }}>
                        <Checkbox size="small" sx={{ p: 0.25, mr: 1 }} checked={isAll ? isAllSelected : selected} />
                        <ListItemText primary={label} sx={{ my: 0 }} primaryTypographyProps={{ noWrap: true, fontSize: '13px', fontWeight: isAll ? 700 : 400 }} />
                      </li>
                    );
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder={compteAux.length ? '' : 'Tous les comptes'}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', fontSize: '13px' }, '& .MuiOutlinedInput-notchedOutline': { borderColor: T.line } }}
                    />
                  )}
                />
              </Box>

              <Box>
                <Typography sx={fieldLabelSx}>Arrêté au</Typography>
                <TextField
                  fullWidth
                  type="date"
                  size="small"
                  value={dateFin}
                  onChange={(e) => setDateFin(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <DateRangeOutlined sx={{ fontSize: 16, color: T.accent }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ '& .MuiOutlinedInput-root': { ...NUM, height: 34, fontSize: '13px', fontWeight: 600, borderRadius: '8px' }, '& .MuiOutlinedInput-notchedOutline': { borderColor: T.line } }}
                />
              </Box>

              <Button
                onClick={handleResetFilter}
                startIcon={<RestartAltIcon sx={{ fontSize: 16 }} />}
                sx={{ alignSelf: 'flex-start', px: 0, textTransform: 'none', fontWeight: 600, fontSize: '12.5px', color: T.muted, '&:hover': { bgcolor: 'transparent', color: T.accent } }}
              >
                Réinitialiser les filtres
              </Button>
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
                onClick={exportExcel}
                disabled={!canExport() || exporting}
                startIcon={<TableChartOutlined />}
                sx={{ textTransform: 'none', fontWeight: 600, fontSize: '13px', py: 1, bgcolor: T.pos, borderRadius: '8px', '&:hover': { bgcolor: '#176e59' }, '&.Mui-disabled': { bgcolor: T.ledger, color: T.faint } }}
              >
                Exporter en Excel
              </Button>
              <Button
                fullWidth
                variant="outlined"
                onClick={exportPdf}
                disabled={!canExport() || exporting}
                startIcon={<PictureAsPdfOutlined />}
                sx={{ textTransform: 'none', fontWeight: 600, fontSize: '13px', py: 1, color: T.neg, borderColor: T.line, borderRadius: '8px', '&:hover': { borderColor: T.neg, bgcolor: 'rgba(190,58,47,.06)' }, '&.Mui-disabled': { color: T.faint, borderColor: T.line } }}
              >
                Exporter en PDF
              </Button>
              {exporting && (
                <Typography sx={{ fontSize: '11.5px', color: T.muted, textAlign: 'center', mt: 0.5 }}>{exportMsg}</Typography>
              )}
            </Stack>
          </Box>
        </Paper>

        {/* PANNEAU RÉCAPITULATIF */}
        <Paper elevation={0} sx={{ ...panelSx, flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ px: 2.5, py: 1.5, borderBottom: `1px solid ${T.ledger}`, flexShrink: 0 }}>
            <Typography sx={{ fontSize: '13px', fontWeight: 700, color: T.ink }}>Résumé de l'extraction</Typography>
          </Box>

          <Box sx={{ p: 3, overflowY: 'auto' }}>
            <Stack divider={<Divider sx={{ borderColor: T.ledger }} />}>
              <RecapRow
                label="Exercice"
                value={selectedEx ? `${selectedEx.libelle_rang} · ${format(new Date(selectedEx.date_debut), 'dd/MM/yyyy')} – ${format(new Date(selectedEx.date_fin), 'dd/MM/yyyy')}` : '—'}
              />
              <RecapRow
                label="Comptes"
                value={compteAux.length ? `${compteAux.length} compte(s) sélectionné(s)` : 'Tous les comptes'}
              />
              <RecapRow
                label="Arrêté au"
                value={dateFin ? format(new Date(dateFin), 'dd/MM/yyyy') : '—'}
              />
            </Stack>

            <Typography sx={{ ...sectionTitleSx, mt: 3 }}>Contenu du grand livre</Typography>
            <Stack spacing={1}>
              <BulletLine>Inclut le report à nouveau (RAN).</BulletLine>
              <BulletLine>Détail ligne par ligne avec lettrage.</BulletLine>
              <BulletLine>Sous-totaux par compte comptable.</BulletLine>
            </Stack>

            <Stack direction="row" spacing={1.25} sx={{ mt: 3, p: 1.5, borderRadius: '10px', bgcolor: T.accW, border: `1px solid ${T.line}` }}>
              <Box component="span" sx={{ fontSize: '15px', lineHeight: 1.4 }}>💡</Box>
              <Typography sx={{ fontSize: '12px', color: T.ink, lineHeight: 1.5 }}>
                L'export PDF est optimisé pour l'impression <b>A4 paysage</b>.
              </Typography>
            </Stack>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default ExportGrandLivre;