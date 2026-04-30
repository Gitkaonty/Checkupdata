import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  Box,
  Typography,
  Button,
  Stack,
  FormControl,
  Select,
  MenuItem,
  Paper,
  Checkbox,
  FormControlLabel,
  Grid,
  IconButton,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  InputAdornment,
  Divider,
  Chip,
  Table,
  TableContainer,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableRow,
  Collapse
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';

import {
  AccountBalanceOutlined,
  MenuBookOutlined,
  TagOutlined,
  ShortTextOutlined,
  PaymentsOutlined,
  EventOutlined,
  Search, ChevronLeft,
  ChevronRight,
  Visibility,
  CheckCircle, CopyAllOutlined,
  WarningAmber, DeleteOutline, DoneAll, CalendarToday, Timer, FilterList
} from '@mui/icons-material';
import { init } from '../../../init';
import axios from '../../../config/axios';
import useAxiosPrivate from '../../hooks/useAxiosPrivate';
import { useExercicePeriode } from '../../context/ExercicePeriodeContext';
import ExercicePeriodeSelector from '../ExercicePeriodeSelector';
import ConfirmActionDialog from '../../components/ConfirmActionDialog';

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

const parseNumber = (value) => {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const normalized = String(value).replace(/\s/g, '').replace(',', '.');
  const num = Number(normalized);
  return Number.isFinite(num) ? num : null;
};

const RechercheDoublons = ({ id_exercice, id_periode }) => {
  let initial = init[0];

  // État pour gérer l'expansion des groupes
  const [expandedId, setExpandedId] = useState(null);
  const axiosPrivate = useAxiosPrivate();
  const navigate = useNavigate();

  const [validatingGroup, setValidatingGroup] = useState(null);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const detailsRef = useRef(null);

  const {
    selectedExerciceId,
    selectedPeriodeId,
    selectedPeriodeDates,
    currentExerciceDates,
    listePeriodes,
    handleChangeExercice,
    handleChangePeriode,
    loading: contextLoading,
    getApiParams
  } = useExercicePeriode();

  const [fileInfos, setFileInfos] = useState(null);
  const [loading, setLoading] = useState(false);
  const [noFile, setNoFile] = useState(false);
  const [fileId, setFileId] = useState(0);

  const [resultats, setResultats] = useState([]);
  const [stats, setStats] = useState({ nbGroupes: 0, nbLignes: 0 });

  // === Navigation par groupe ===
  const [currentGroupe, setCurrentGroupe] = useState(1);
  const [inputGroupe, setInputGroupe] = useState('1');

  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [openErrorDialog, setOpenErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const maxGroupe = stats.nbGroupes;

  const [openConfirmValidationDialog, setOpenConfirmValidationDialog] = useState(false);
  const [pendingValidationGroupId, setPendingValidationGroupId] = useState(null);

  const [openInfoDialog, setOpenInfoDialog] = useState(false);
  const [infoDialogTitle, setInfoDialogTitle] = useState('');
  const [infoDialogMessage, setInfoDialogMessage] = useState('');

  const effectiveExerciceId = id_exercice ?? selectedExerciceId;
  const effectivePeriodeId = id_periode ?? selectedPeriodeId;

  // Résultats filtrés par groupe
  const filteredResultats = resultats.filter(row => row.id_doublon === currentGroupe);

  // Grouper les résultats par ID de doublon pour le nouveau format
  const groupedDoublons = resultats.reduce((groups, row) => {
    const groupId = row.id_doublon;
    if (!groups[groupId]) {
      groups[groupId] = {
        id: `GRP-${groupId}`,
        id_doublon: groupId,
        compte: row.compte,
        libelle: row.libelle,
        montant: (parseFloat(row.debit || 0) - parseFloat(row.credit || 0)).toFixed(2),
        debit: row.debit,
        credit: row.credit,
        date: row.date ?? row.date_ecriture ?? row.date_piece,
        journal: row.journal,
        piece: row.piece,
        ecritures: [],
        occurences: 0,
        statut: row.statut || 'NON_VALIDE'
      };
    }
    groups[groupId].ecritures.push(row);
    groups[groupId].occurences++;
    return groups;
  }, {});

  const doublonsGroups = Object.values(groupedDoublons);

  const totalDoublonsGroupes = doublonsGroups.length;

  const selectedGroup = doublonsGroups.find(g => String(g.id_doublon) === String(selectedGroupId)) || null;

  const buildEcrituresRows = (group) => (group?.ecritures || []).map((e, idx) => ({
    id: `${group?.id_doublon}-${idx}`,
    date: e.date ?? e.date_ecriture ?? e.date_piece,
    journal: e.journal ?? e.code_journal,
    libelle: e.libelle ?? e.libelle_ecriture,
    piece: e.piece ?? e.numero_piece,
    debit: e.debit ?? e.montant_debit,
    credit: e.credit ?? e.montant_credit,
  }));

  useEffect(() => {
    if (selectedGroup && detailsRef.current) {
      detailsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [selectedGroup]);

  const [criteres, setCriteres] = useState({
    date: false,
    compte: false,
    journal: false,
    piece: false,
    libelle: false,
    montant: false,
  });

  const handleCriteres = (event, nouveauxCriteres) => {
    if (nouveauxCriteres.length > 0) {
      setCriteres(nouveauxCriteres);
    }
  };

  const handleCritereChange = (critere) => {
    if (critere === 'tous') {
      const allChecked = Object.values(criteres).every(v => v);
      setCriteres({
        date: !allChecked,
        compte: !allChecked,
        journal: !allChecked,
        piece: !allChecked,
        libelle: !allChecked,
        montant: !allChecked,
      });
    } else {
      setCriteres(prev => ({
        ...prev,
        [critere]: !prev[critere]
      }));
    }
  };

  const handleConfirmRechercher = () => {
    setOpenConfirmDialog(false);
    executeRechercher();
  };

  const handleRequestValidateGroup = (groupId) => {
    setPendingValidationGroupId(groupId);
    setOpenConfirmValidationDialog(true);
  };

  const handleCloseConfirmValidationDialog = () => {
    setOpenConfirmValidationDialog(false);
    setPendingValidationGroupId(null);
  };

  const handleConfirmValidateGroup = () => {
    if (pendingValidationGroupId === null || pendingValidationGroupId === undefined) return;
    handleValidateGroup(pendingValidationGroupId);
    setOpenConfirmValidationDialog(false);
    setPendingValidationGroupId(null);
  };

  const getIds = () => {
    const pathParts = window.location.pathname.split('/');
    const idIndex = pathParts.indexOf('rechercheDoublon') + 1;
    return {
      id_compte: parseInt(sessionStorage.getItem('compteId')) || 1,
      id_dossier: parseInt(sessionStorage.getItem('fileId')) || parseInt(pathParts[idIndex]) || 1,
      id_exercice: effectiveExerciceId || parseInt(sessionStorage.getItem('exerciceId')) || 1
    };
  };

  const resolveDatesForSearch = async () => {
    if (selectedPeriodeDates?.date_debut && selectedPeriodeDates?.date_fin && String(effectivePeriodeId) === String(selectedPeriodeId)) {
      return {
        date_debut: selectedPeriodeDates.date_debut,
        date_fin: selectedPeriodeDates.date_fin
      };
    }

    if (effectivePeriodeId && effectivePeriodeId !== 'exercice') {
      const periodeFromContext = (listePeriodes || []).find(p => String(p.id) === String(effectivePeriodeId));
      if (periodeFromContext?.date_debut && periodeFromContext?.date_fin) {
        return {
          date_debut: periodeFromContext.date_debut,
          date_fin: periodeFromContext.date_fin
        };
      }

      if (effectiveExerciceId) {
        const response = await axios.get(`/paramExercice/listePeriodes/${effectiveExerciceId}`);
        if (response?.data?.state) {
          const periode = (response.data.list || []).find(p => String(p.id) === String(effectivePeriodeId));
          if (periode?.date_debut && periode?.date_fin) {
            return {
              date_debut: periode.date_debut,
              date_fin: periode.date_fin
            };
          }
        }
      }
    }

    if (currentExerciceDates?.date_debut && currentExerciceDates?.date_fin) {
      return {
        date_debut: currentExerciceDates.date_debut,
        date_fin: currentExerciceDates.date_fin
      };
    }

    return null;
  };

  const executeRechercher = async () => {
    setLoading(true);
    try {
      const { id_compte, id_dossier, id_exercice } = getIds();

      const resolvedDates = await resolveDatesForSearch();
      if (!resolvedDates?.date_debut || !resolvedDates?.date_fin) {
        setErrorMessage('Dates de période introuvables. Veuillez re-sélectionner la période avant de lancer la recherche.');
        setOpenErrorDialog(true);
        return;
      }

      const params = new URLSearchParams();
      params.append('date_debut', resolvedDates.date_debut);
      params.append('date_fin', resolvedDates.date_fin);
      if (effectivePeriodeId) {
        params.append('id_periode', effectivePeriodeId);
      }

      Object.entries(criteres).forEach(([key, value]) => {
        if (value) {
          params.append(`critere_${key}`, 'true');
        }
      });

      const queryString = params.toString();

      const response = await axiosPrivate.post(`/administration/rechercheDoublon/${id_compte}/${id_dossier}/${id_exercice}?${queryString}`);

      if (response.data.state) {
        setResultats(response.data.data || []);

        setStats({
          nbGroupes: response.data.nbGroupes || 0,
          nbLignes: response.data.nbLignes || 0
        });
        setCurrentGroupe(1);
        setInputGroupe('1');
        setSelectedGroupId(null);
      } else {
        alert(response.data.message || 'Erreur lors de la recherche');
      }

    } catch (error) {
      console.error('Error searching duplicates:', error);
      alert('Erreur lors de la recherche de doublons');
    } finally {
      setLoading(false);
      setOpenConfirmDialog(false);
    }
  };

  const handleValidateGroup = async (groupId) => {
    setValidatingGroup(groupId);
    try {
      const { id_compte, id_dossier, id_exercice } = getIds();
      const url = `/administration/rechercheDoublon/validerGroupeDoublon/${id_compte}/${id_dossier}/${id_exercice}/${groupId}`;
      const response = await axiosPrivate.post(url);

      if (response?.data?.state) {
        setResultats((prev) => prev.map((item) => (
          item.id_doublon === groupId
            ? { ...item, statut: 'VALIDE', date_validation: new Date().toISOString() }
            : item
        )));
        setInfoDialogTitle('Validation réussie');
        setInfoDialogMessage('Le groupe a été validé avec succès.');
        setOpenInfoDialog(true);
      } else {
        setErrorMessage(response?.data?.message || 'Erreur lors de la validation du groupe');
        setOpenErrorDialog(true);
      }
    } catch (error) {
      console.error('Error validating group:', error);
      setErrorMessage('Erreur lors de la validation du groupe');
      setOpenErrorDialog(true);
    } finally {
      setValidatingGroup(null);
    }
  };

  const options = [
    { id: 'date', label: 'Date', icon: <EventOutlined sx={{ fontSize: 16 }} /> },
    { id: 'compte', label: 'Compte', icon: <AccountBalanceOutlined sx={{ fontSize: 16 }} /> },
    { id: 'journal', label: 'Journal', icon: <MenuBookOutlined sx={{ fontSize: 16 }} /> },
    { id: 'piece', label: 'N° Pièce', icon: <TagOutlined sx={{ fontSize: 16 }} /> },
    { id: 'libelle', label: 'Libellé', icon: <ShortTextOutlined sx={{ fontSize: 16 }} /> },
    { id: 'montant', label: 'Montant', icon: <PaymentsOutlined sx={{ fontSize: 16 }} /> },
  ];

  const handleToggleAllCriteres = () => {
    const allChecked = Object.values(criteres).every(v => v);
    setCriteres({
      date: !allChecked,
      compte: !allChecked,
      journal: !allChecked,
      piece: !allChecked,
      libelle: !allChecked,
      montant: !allChecked,
    });
  };

  const groupsRows = doublonsGroups.map((g) => ({
    ...g,
    id: g.id,
    montant_num: Number(g.montant)
  }));

  const groupsColumns = [
    {
      field: 'voir',
      headerName: '',
      width: 60,
      sortable: false,
      renderCell: (params) => (
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            const groupId = params?.row?.id_doublon;
            if (groupId !== undefined && groupId !== null) {
              setSelectedGroupId(groupId);
            }
          }}
        >
          <Visibility fontSize="small" color={String(selectedGroupId) === String(params?.row?.id_doublon) ? 'primary' : 'action'} />
        </IconButton>
      )
    },
    { field: 'id', headerName: 'GROUPE', width: 110, cellClassName: 'font-bold' },
    { field: 'compte', headerName: 'COMPTE', width: 110 },
    {
      field: 'resume',
      headerName: 'RÉSUMÉ',
      flex: 1,
      valueGetter: (params) => {
        const row = params?.row;
        if (!row) return '';
        const montant = Number(row.montant || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 });
        return `${row.date || ''},${row.compte || ''},${row.journal || ''},${row.piece || ''},${row.libelle || ''}, ${montant} €`;
      }
    },
    {
      field: 'montant_num',
      headerName: 'MONTANT',
      width: 140,
      type: 'number',
      align: 'right',
      headerAlign: 'right',
      valueFormatter: (params) => {
        const num = parseNumber(params?.value);
        return num === null ? '-' : `${num.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €`;
      }
    },
    {
      field: 'occurences',
      headerName: 'DOUBLONS',
      width: 110,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Chip label={params.value} size="small" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 900 }} />
      )
    },
    {
      field: 'statut',
      headerName: 'STATUT',
      width: 90,
      align: 'center',
      headerAlign: 'center',
      sortable: false,
      renderCell: (params) => (
        params.row.statut === 'VALIDE'
          ? <CheckCircle sx={{ color: '#10B981', fontSize: '1.2rem' }} />
          : <WarningAmber sx={{ color: '#F59E0B', fontSize: '1.2rem' }} />
      )
    },
    {
      field: 'action',
      headerName: 'ACTION',
      width: 160,
      sortable: false,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params) => (
        params.row.statut === 'VALIDE'
          ? (
            <Chip
              label="VALIDÉ"
              size="small"
              color="success"
              sx={{ fontWeight: 900, fontSize: '0.7rem' }}
            />
          )
          : (
            <Button
              variant="outlined"
              size="small"
              color="success"
              onClick={() => handleRequestValidateGroup(params.row.id_doublon)}
              disabled={validatingGroup === params.row.id_doublon}
              sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '6px', fontSize: '0.75rem' }}
            >
              {validatingGroup === params.row.id_doublon ? 'Validation...' : 'Valider'}
            </Button>
          )
      )
    }
  ];

  const ecrituresRows = (selectedGroup?.ecritures || []).map((e, idx) => ({
    id: `${selectedGroup?.id_doublon}-${idx}`,
    date: e.date ?? e.date_ecriture ?? e.date_piece,
    journal: e.journal ?? e.code_journal,
    libelle: e.libelle ?? e.libelle_ecriture,
    piece: e.piece ?? e.numero_piece,
    debit: e.debit ?? e.montant_debit,
    credit: e.credit ?? e.montant_credit,
  }));

  const ecrituresColumns = [
    { field: 'date', headerName: 'DATE', width: 110, valueFormatter: (params) => formatDate(params?.value) },
    { field: 'journal', headerName: 'JOURNAL', width: 110 },
    { field: 'libelle', headerName: 'LIBELLÉ', flex: 1 },
    { field: 'piece', headerName: 'PIÈCE', width: 110 },
    {
      field: 'debit',
      headerName: 'DÉBIT',
      width: 120,
      align: 'right',
      headerAlign: 'right',
      valueFormatter: (params) => {
        const num = parseNumber(params?.value);
        return num === null ? '-' : num.toLocaleString('fr-FR', { minimumFractionDigits: 2 });
      }
    },
    {
      field: 'credit',
      headerName: 'CRÉDIT',
      width: 120,
      align: 'right',
      headerAlign: 'right',
      valueFormatter: (params) => {
        const num = parseNumber(params?.value);
        return num === null ? '-' : num.toLocaleString('fr-FR', { minimumFractionDigits: 2 });
      }
    },
  ];

  const handleOpenConfirmDialog = () => {
    if (!effectiveExerciceId) return;

    const hasCritere = Object.values(criteres).some(v => v);
    const hasPeriode = !!effectivePeriodeId && effectivePeriodeId !== 'exercice';

    if (!hasCritere || !hasPeriode) {
      if (!hasCritere && !hasPeriode) {
        setErrorMessage('Veuillez sélectionner au moins un critère de recherche et une période');
      } else if (!hasCritere) {
        setErrorMessage('Veuillez sélectionner au moins un critère de recherche');
      } else {
        setErrorMessage('Veuillez sélectionner une période');
      }
      setOpenErrorDialog(true);
      return;
    }

    setOpenConfirmDialog(true);
  };

  const handleCloseConfirmDialog = () => {
    setOpenConfirmDialog(false);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', overflow: 'hidden' }}>

      {/* --- STATISTIQUES GLOBALES --- */}
      <Stack direction="row" spacing={3} sx={{ p: 2, bgcolor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
        <Box>
          <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700 }}>DOUBLONS DÉTECTÉS</Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="h6" sx={{ color: '#EF4444', fontWeight: 900, lineHeight: 1 }}>{totalDoublonsGroupes}</Typography>
            <CopyAllOutlined sx={{ color: '#EF4444', fontSize: 18 }} />
          </Stack>
        </Box>
      </Stack>

      <Box sx={{ p: 2, flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 2, minHeight: 0, overflow: 'hidden' }}>

        {/* --- BARRE D'OPTIONS DE FILTRAGE (CRITÈRES) --- */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: '12px',
            border: '1px solid #E2E8F0',
            bgcolor: '#FFFFFF'
          }}
        >
          <Stack direction="row" alignItems="center" spacing={2} flexWrap="wrap">
            <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Comparer par :
            </Typography>

            <Stack direction="row" spacing={1} flexWrap="wrap">
              {options.map((opt) => {
                const isActive = !!criteres[opt.id];
                return (
                  <Chip
                    key={opt.id}
                    icon={opt.icon}
                    label={opt.label}
                    onClick={() => handleCritereChange(opt.id)}
                    variant={isActive ? 'filled' : 'outlined'}
                    sx={{
                      px: 1,
                      fontWeight: 800,
                      fontSize: '0.75rem',
                      height: 28,
                      transition: 'all 0.2s',
                      bgcolor: isActive ? 'rgba(6, 182, 212, 0.12)' : '#FFFFFF',
                      color: isActive ? '#0891B2' : '#64748B',
                      border: '1px solid',
                      borderColor: isActive ? '#06b6d4' : '#E2E8F0',
                      '&:hover': {
                        bgcolor: isActive ? 'rgba(6, 182, 212, 0.18)' : '#F8FAFC',
                        borderColor: isActive ? '#06b6d4' : '#CBD5E1',
                      },
                      '& .MuiChip-icon': { color: 'inherit' }
                    }}
                  />
                );
              })}
            </Stack>

            <Divider orientation="vertical" flexItem sx={{ mx: 1, height: 20, alignSelf: 'center' }} />

            <Typography
              variant="caption"
              sx={{
                cursor: 'pointer',
                color: '#6366F1',
                fontWeight: 700,
                '&:hover': { textDecoration: 'underline' }
              }}
              onClick={handleToggleAllCriteres}
            >
              Tout sélectionner
            </Typography>

            <Divider orientation="vertical" flexItem sx={{ mx: 1, height: 20, alignSelf: 'center' }} />

            <Button
              variant="contained"
              onClick={handleOpenConfirmDialog}
              disabled={!effectiveExerciceId || loading}
              sx={{
                textTransform: 'none',
                outline: 'none',
                backgroundColor: initial.theme,
                color: "white",
                height: "32px",
              }}
            >
              {loading ? 'Recherche...' : 'Rechercher'}
            </Button>
          </Stack>
        </Paper>

        {/* --- RÉSULTATS (Table) --- */}
        <Box
          sx={{
            p: 2,
            borderRadius: '12px',
            border: '1px solid #E2E8F0',
            bgcolor: '#F8FAFC',
            flexGrow: 1,
            minHeight: 0,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}
        >

          {/* --- TABLEAU PRINCIPAL --- */}
          {doublonsGroups.length > 0 && (
            <TableContainer
              component={Paper}
              elevation={0}
              sx={{
                borderRadius: '12px',
                border: '1px solid #E2E8F0',
                flexGrow: 1,
                minHeight: 0,
                overflow: 'auto'
              }}
            >
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow sx={{ '& th': { bgcolor: '#F8FAFC', fontWeight: 800, color: '#64748B', py: 1.5, fontSize: '0.75rem', textTransform: 'uppercase' } }}>
                    <TableCell width={40}></TableCell>
                    <TableCell>GROUPE</TableCell>
                    <TableCell>COMPTE</TableCell>
                    <TableCell>LIBELLÉ COMMUN</TableCell>
                    <TableCell align="right">MONTANT</TableCell>
                    <TableCell align="center">DOUBLONS</TableCell>
                    <TableCell align="center">STATUT</TableCell>
                    <TableCell align="right">ACTION</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {doublonsGroups.map((group) => (
                    <React.Fragment key={group.id}>
                      <TableRow hover sx={{ '& > *': { borderBottom: 'unset' } }}>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => setExpandedId(expandedId === group.id ? null : group.id)}
                          >
                            <Visibility fontSize="small" color={expandedId === group.id ? "primary" : "action"} />
                          </IconButton>
                        </TableCell>
                        <TableCell sx={{ fontWeight: 800, fontSize: '0.85rem' }}>{group.id}</TableCell>
                        <TableCell sx={{ fontSize: '0.85rem' }}>{group.compte}</TableCell>
                        <TableCell sx={{ fontSize: '0.8rem', color: '#64748B' }}>{group.date},{group.compte},{group.journal},{group.piece},{group.libelle},                                                    {parseFloat(group.montant).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 900, fontSize: '0.85rem' }}>
                          {parseFloat(group.montant).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={group.occurences}
                            size="small"
                            sx={{ height: 18, fontSize: '0.65rem', fontWeight: 900 }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          {group.statut === 'VALIDE' ? (
                            <CheckCircle sx={{ color: '#10B981', fontSize: '1.2rem' }} />
                          ) : (
                            <WarningAmber sx={{ color: '#F59E0B', fontSize: '1.2rem' }} />
                          )}
                        </TableCell>
                        <TableCell align="right">
                          {group.statut === 'VALIDE' ? (
                            <Chip
                              label="VALIDÉ"
                              size="small"
                              color="success"
                              sx={{ fontWeight: 900, fontSize: '0.7rem' }}
                            />
                          ) : (
                            <Button
                              variant="outlined"
                              size="small"
                              color="success"
                              onClick={() => handleRequestValidateGroup(group.id_doublon)}
                              disabled={validatingGroup === group.id_doublon}
                              sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '6px', fontSize: '0.75rem' }}
                            >
                              {validatingGroup === group.id_doublon ? 'Validation...' : 'Valider'}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>

                      {/* --- CONTENU DU COLLAPSE --- */}
                      <TableRow>
                        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={9}>
                          <Collapse in={expandedId === group.id} timeout="auto" unmountOnExit>
                            <Box sx={{ py: 3, px: 10, bgcolor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                              <Typography
                                variant="subtitle2"
                                sx={{ fontWeight: 800, mb: 1.5, color: '#475569', display: 'flex', alignItems: 'center', gap: 1 }}
                              >
                                Écritures détectées <Chip label={group.occurences} size="small" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 900 }} />
                              </Typography>

                              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                                <Table size="small">
                                  <TableHead sx={{ bgcolor: 'white' }}>
                                    <TableRow>
                                      <TableCell sx={{ fontWeight: 700, color: '#64748B', fontSize: '0.7rem' }}>DATE</TableCell>
                                      <TableCell sx={{ fontWeight: 700, color: '#64748B', fontSize: '0.7rem' }}>JOURNAL</TableCell>
                                      <TableCell sx={{ fontWeight: 700, color: '#64748B', fontSize: '0.7rem' }}>LIBELLÉ</TableCell>
                                      <TableCell sx={{ fontWeight: 700, color: '#64748B', fontSize: '0.7rem' }}>PIÈCE</TableCell>
                                      <TableCell sx={{ fontWeight: 700, color: '#64748B', fontSize: '0.7rem' }}>DÉBIT</TableCell>
                                      <TableCell sx={{ fontWeight: 700, color: '#64748B', fontSize: '0.7rem' }}>CRÉDIT</TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody sx={{ bgcolor: 'white' }}>
                                    {(group?.ecritures || []).map((ecriture, idx) => {
                                      const date = ecriture?.date ?? ecriture?.date_ecriture ?? ecriture?.date_piece;
                                      const journal = ecriture?.journal ?? ecriture?.code_journal;
                                      const libelle = ecriture?.libelle ?? ecriture?.libelle_ecriture;
                                      const piece = ecriture?.piece ?? ecriture?.numero_piece;
                                      const debit = parseNumber(ecriture?.debit ?? ecriture?.montant_debit);
                                      const credit = parseNumber(ecriture?.credit ?? ecriture?.montant_credit);

                                      return (
                                        <TableRow key={idx} sx={{ bgcolor: idx === 0 ? 'rgba(16, 185, 129, 0.05)' : 'inherit' }}>
                                          <TableCell sx={{ fontSize: '0.8rem' }}>{formatDate(date)}</TableCell>
                                          <TableCell sx={{ fontSize: '0.8rem' }}>{journal || '-'}</TableCell>
                                          <TableCell sx={{ fontSize: '0.8rem' }}>{libelle || '-'}</TableCell>
                                          <TableCell sx={{ fontSize: '0.8rem', fontWeight: 600 }}>{piece || '-'}</TableCell>
                                          <TableCell sx={{ fontSize: '0.8rem' }}>
                                            {debit === null ? '-' : debit.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                                          </TableCell>
                                          <TableCell sx={{ fontSize: '0.8rem' }}>
                                            {credit === null ? '-' : credit.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                                          </TableCell>
                                        </TableRow>
                                      );
                                    })}
                                  </TableBody>
                                </Table>
                              </TableContainer>
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* --- POPUPS --- */}
          <Dialog
            open={openErrorDialog}
            onClose={() => setOpenErrorDialog(false)}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle sx={{ color: 'warning.main', display: 'flex', alignItems: 'center', gap: 1 }}>
              <span>⚠️</span> Alerte
            </DialogTitle>
            <DialogContent>
              <Typography>
                {errorMessage}
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button
                variant="contained"
                onClick={() => setOpenErrorDialog(false)}
                sx={{ backgroundColor: initial.theme }}
              >
                OK
              </Button>
            </DialogActions>
          </Dialog>

          <Dialog
            open={openInfoDialog}
            onClose={() => setOpenInfoDialog(false)}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>Succès</DialogTitle>
            <DialogContent>
              <DialogContentText>
                {infoDialogMessage}
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button variant="contained" onClick={() => setOpenInfoDialog(false)} sx={{ backgroundColor: initial.theme }}>
                OK
              </Button>
            </DialogActions>
          </Dialog>

          <ConfirmActionDialog
            open={openConfirmDialog}
            onClose={handleCloseConfirmDialog}
            onConfirm={handleConfirmRechercher}
            title="Confirmer la modification"
            message="Êtes-vous sûr de vouloir lancer la recherche de doublons ?"
            confirmText="Lancer la recherche"
            cancelText="Annuler"
            loading={loading}
            color="#06b6d4"
          />

          <ConfirmActionDialog
            open={openConfirmValidationDialog}
            onClose={handleCloseConfirmValidationDialog}
            onConfirm={handleConfirmValidateGroup}
            title="Validation"
            message="Voulez-vous valider ce groupe de doublons ?"
            confirmText="Confirmer la validation"
            cancelText="Annuler"
            loading={pendingValidationGroupId !== null && validatingGroup === pendingValidationGroupId}
            color="#06b6d4"
          />
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
    fontSize: '0.65rem',
    fontWeight: 800,
    textTransform: 'uppercase',
    borderBottom: '1px solid #E2E8F0'
  },
  '& .MuiDataGrid-cell': {
    fontSize: '0.8rem',
    borderBottom: '1px solid #F1F5F9',
    '&:focus': { outline: 'none' }
  },
  '& .font-bold': { color: '#1E293B', fontWeight: 700 }
};

export default RechercheDoublons;