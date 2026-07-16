import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, Stack, Button, Paper, Breadcrumbs, Link,
  Chip, IconButton, Tooltip, CircularProgress
} from '@mui/material';
import ConfirmDeleteDialog from '../../components/ConfirmDeleteDialog';

import {
  DataGrid, GridActionsCellItem, GridRowModes, GridRowEditStopReasons
} from '@mui/x-data-grid';
import {
  NavigateNext, HistoryOutlined, AddOutlined,
  EditOutlined, DeleteOutline, SaveOutlined,
  CloseOutlined, RuleOutlined, CheckCircleOutline,
  DoDisturbOnOutlined, CheckOutlined,
  DashboardOutlined
} from '@mui/icons-material';
import useAxiosPrivate from '../../../config/axiosPrivate';

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
  warn: '#B5791A',
  neg: '#BE3A2F',
  accW: '#E2F0F1',
};
const CARD_SHADOW = '0 1px 2px rgba(16,39,51,.04), 0 8px 24px -16px rgba(16,39,51,.18)';
const panelSx = {
  border: `1px solid ${T.line}`,
  borderRadius: '16px',
  bgcolor: T.surface,
  boxShadow: CARD_SHADOW,
  overflow: 'hidden',
};
const primaryBtnSx = {
  bgcolor: T.accent,
  color: '#fff',
  textTransform: 'none',
  fontWeight: 600,
  fontSize: '13px',
  borderRadius: '8px',
  boxShadow: 'none',
  '&:hover': { bgcolor: T.accentDark },
  '&.Mui-disabled': { bgcolor: T.ledger, color: T.faint },
};
const gridSx = {
  border: 'none',
  flex: 1,
  minHeight: 0,
  fontSize: '12.5px',
  '& .MuiDataGrid-columnHeaders': {
    bgcolor: T.ledger,
    borderBottom: `1px solid ${T.line}`,
    '& .MuiDataGrid-columnHeaderTitle': {
      fontSize: '11px',
      fontWeight: 700,
      color: T.muted,
      letterSpacing: '.3px',
      textTransform: 'uppercase',
    },
  },
  '& .MuiDataGrid-cell': { borderBottom: '1px solid #F1F4F6', '&:focus': { outline: 'none' } },
  '& .MuiDataGrid-row:hover': { bgcolor: '#FAFBFB' },
};
const MONO = 'ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace';
const NUM = { fontVariantNumeric: 'tabular-nums', fontFeatureSettings: '"tnum"' };

// Palette de chips (couleur stable par valeur) pour Type / Test
const CHIP_PALETTE = [
  { bg: '#E2F0F1', fg: '#0E7C86' }, // pétrole
  { bg: '#E7F2EE', fg: '#1F8A70' }, // vert
  { bg: '#E8EFF6', fg: '#3A6EA5' }, // bleu
  { bg: '#F6EEDD', fg: '#B5791A' }, // ambre
  { bg: '#EDE9F7', fg: '#6B4FBB' }, // violet
  { bg: '#F1EAE0', fg: '#8A6D3B' }, // brun
];
const pickColor = (str) => {
  const s = String(str || '');
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return CHIP_PALETTE[h % CHIP_PALETTE.length];
};

const GestionControles = () => {
  const axiosPrivate = useAxiosPrivate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [rowModesModel, setRowModesModel] = useState({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [activatingAll, setActivatingAll] = useState(false);

  // Chargement initial des données
  useEffect(() => {
    const fetchControles = async () => {
      try {
        setLoading(true);
        const response = await axiosPrivate.get('/param/revisionControleMatrix');
        if (response.data.state) {
          // Mapper les champs DB vers les colonnes du front
          const mappedRows = response.data.matrices.map((m) => ({
            id: m.id,
            controle: m.id_controle,
            Type: m.Type,
            compte: m.compte,
            test: m.test,
            description: m.description,
            anomalies: m.anomalies || '',
            param: m.paramUn ? String(m.paramUn) : '',
            etat: m.Valider,
          }));
          setRows(mappedRows);
        } else {
          setError('Erreur lors du chargement des contrôles');
        }
      } catch (err) {
        console.error('Erreur fetch controles:', err);
        setError('Erreur de connexion au serveur');
      } finally {
        setLoading(false);
      }
    };

    fetchControles();
  }, [axiosPrivate]);

  // --- LOGIQUE D'EDITION ---
  const handleEditClick = (id) => () => {
    setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.Edit } });
  };

  const handleSaveClick = (id) => () => {
    setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.View } });
  };

  const handleDeleteClick = (id) => () => {
    // Si l'id est temporaire (nouvelle ligne non sauvegardée), on supprime juste localement
    if (typeof id === 'number' && id > 1000000000) {
      setRows(rows.filter((row) => row.id !== id));
      return;
    }
    setDeleteTargetId(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;

    try {
      setDeleteLoading(true);
      await axiosPrivate.delete(`/param/revisionControleMatrix/${deleteTargetId}`);
      setRows(rows.filter((row) => row.id !== deleteTargetId));
      setDeleteDialogOpen(false);
      setDeleteTargetId(null);
    } catch (err) {
      console.error('Erreur suppression:', err);
      setError('Erreur lors de la suppression');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setDeleteTargetId(null);
  };

  const handleCancelClick = (id) => () => {
    setRowModesModel({
      ...rowModesModel,
      [id]: { mode: GridRowModes.View, ignoreModifications: true },
    });
  };

  const processRowUpdate = async (newRow) => {
    try {
      const payload = {
        id_controle: newRow.controle,
        Type: newRow.Type || 'GENERAL',
        compte: newRow.compte || '*',
        test: newRow.test || 'EXISTE',
        description: newRow.description || '',
        anomalies: newRow.anomalies || '',
        Valider: Boolean(newRow.etat),
        paramUn: newRow.param ? parseInt(newRow.param, 10) || null : null,
      };

      if (newRow.isNew) {
        // Création
        const response = await axiosPrivate.post('/param/revisionControleMatrix', payload);
        if (response.data.state) {
          const updatedRow = {
            ...newRow,
            id: response.data.matrix.id,
            isNew: false
          };
          setRows(rows.map((row) => (row.id === newRow.id ? updatedRow : row)));
          return updatedRow;
        }
      } else {
        // Mise à jour
        const response = await axiosPrivate.post('/param/revisionControleMatrix', payload);
        if (response.data.state) {
          const updatedRow = { ...newRow, isNew: false };
          setRows(rows.map((row) => (row.id === newRow.id ? updatedRow : row)));
          return updatedRow;
        }
      }
    } catch (err) {
      console.error('Erreur sauvegarde:', err);
      setError('Erreur lors de la sauvegarde');
      throw err;
    }
    return newRow;
  };

  const handleAddRow = () => {
    const maxId = rows.length > 0 ? Math.max(...rows.map((r) => typeof r.id === 'number' ? r.id : 0)) : 0;
    const tempId = maxId + 1; // ID temporaire pour nouvelle ligne
    setRows([{
      id: tempId,
      controle: '',
      Type: 'GENERAL',
      compte: '*',
      test: 'EXISTE',
      description: '',
      anomalies: '',
      param: '',
      etat: true,
      isNew: true
    }, ...rows]);
    setRowModesModel((oldModel) => ({
      ...oldModel,
      [tempId]: { mode: GridRowModes.Edit, fieldToFocus: 'controle' },
    }));
  };

  // Bascule : activer OU désactiver TOUS les contrôles en une seule fois
  const savableRows = rows.filter((r) => !r.isNew && r.controle);
  const allActivated = savableRows.length > 0 && savableRows.every((r) => r.etat);

  const handleToggleAll = async () => {
    const target = !allActivated; // si tout est activé → on désactive, sinon on active
    const toUpdate = savableRows.filter((r) => Boolean(r.etat) !== target);
    if (toUpdate.length === 0) {
      setRows((prev) => prev.map((r) => (r.isNew ? r : { ...r, etat: target })));
      return;
    }
    try {
      setActivatingAll(true);
      setError(null);
      await Promise.all(toUpdate.map((r) => axiosPrivate.post('/param/revisionControleMatrix', {
        id_controle: r.controle,
        Type: r.Type || 'GENERAL',
        compte: r.compte || '*',
        test: r.test || 'EXISTE',
        description: r.description || '',
        anomalies: r.anomalies || '',
        Valider: target,
        paramUn: r.param ? parseInt(r.param, 10) || null : null,
      })));
      setRows((prev) => prev.map((r) => (r.isNew ? r : { ...r, etat: target })));
    } catch (err) {
      console.error('Erreur bascule globale:', err);
      setError(`Erreur lors de l'${target ? 'activation' : 'désactivation'} de tous les contrôles`);
    } finally {
      setActivatingAll(false);
    }
  };

  const typeValueOptions = useMemo(() => {
    const existing = rows
      .map((r) => r?.Type)
      .filter((v) => typeof v === 'string' && v.trim().length > 0)
      .map((v) => v.trim());
    return Array.from(new Set([...existing]));
  }, [rows]);

  const testValueOptions = useMemo(() => {
    const existing = rows
      .map((r) => r?.test)
      .filter((v) => typeof v === 'string' && v.trim().length > 0)
      .map((v) => v.trim());
    return Array.from(new Set([...existing]));
  }, [rows]);

  const columns = [
    {
      field: 'controle', headerName: 'CODE CONTRÔLE', flex: 1, editable: true, checkboxSelection: true,
      renderCell: (p) => p.value
        ? <Box component="span" sx={{ fontFamily: MONO, fontSize: '12px', fontWeight: 700, color: T.accent, bgcolor: T.accW, px: 1, py: '3px', borderRadius: '6px' }}>{p.value}</Box>
        : <Typography sx={{ color: T.faint, fontSize: '12px' }}>—</Typography>,
    },
    {
      field: 'Type',
      headerName: 'TYPE',
      flex: 0.8,
      editable: true,
      type: 'singleSelect',
      valueOptions: typeValueOptions,
      renderCell: (p) => {
        if (!p.value) return null;
        const c = pickColor(p.value);
        return <Chip label={p.value} size="small" sx={{ bgcolor: c.bg, color: c.fg, fontWeight: 700, fontSize: '11px', height: 22, borderRadius: '6px' }} />;
      },
    },
    {
      field: 'compte', headerName: 'COMPTE', flex: 0.7, editable: true,
      renderCell: (p) => <Box component="span" sx={{ ...NUM, fontFamily: MONO, fontSize: '12px', fontWeight: 600, color: p.value === '*' ? T.faint : T.text }}>{p.value || '—'}</Box>,
    },
    {
      field: 'test',
      headerName: 'TEST',
      flex: 1,
      editable: true,
      type: 'singleSelect',
      valueOptions: testValueOptions,
      renderCell: (p) => {
        if (!p.value) return null;
        const c = pickColor(p.value);
        return <Chip label={p.value} size="small" variant="outlined" sx={{ borderColor: c.fg, color: c.fg, bgcolor: c.bg, fontWeight: 700, fontSize: '11px', height: 22, borderRadius: '6px' }} />;
      },
    },
    {
      field: 'description', headerName: 'DESCRIPTION', flex: 2, editable: true,
      renderCell: (p) => <Typography noWrap title={p.value || ''} sx={{ fontSize: '12.5px', color: T.text }}>{p.value}</Typography>,
    },
    {
      field: 'anomalies', headerName: 'ANOMALIES DÉTECTÉES', flex: 2, editable: true,
      renderCell: (p) => p.value
        ? <Typography noWrap title={p.value} sx={{ fontSize: '12px', color: T.warn }}>{p.value}</Typography>
        : <Typography sx={{ color: T.faint, fontSize: '12px' }}>—</Typography>,
    },
    {
      field: 'param', headerName: 'PARAMÈTRES', flex: 0.8, editable: true,
      renderCell: (p) => (p.value !== '' && p.value != null)
        ? <Box component="span" sx={{ ...NUM, fontFamily: MONO, fontSize: '12px', fontWeight: 700, color: T.ink, bgcolor: T.ledger, px: 1, py: '3px', borderRadius: '6px' }}>{p.value}</Box>
        : <Typography sx={{ color: T.faint, fontSize: '12px' }}>—</Typography>,
    },
    {
      field: 'etat',
      headerName: 'ÉTAT',
      width: 130,
      type: 'boolean',
      editable: true,
      renderCell: (params) => (
        <Chip
          icon={params.value ? <CheckCircleOutline sx={{ fontSize: '15px !important' }} /> : <DoDisturbOnOutlined sx={{ fontSize: '15px !important' }} />}
          label={params.value ? "Activé" : "Désactivé"}
          size="small"
          sx={{
            fontWeight: 700,
            fontSize: '11px',
            height: 22,
            borderRadius: '6px',
            bgcolor: params.value ? T.accW : '#F7E7E4',
            color: params.value ? T.pos : T.neg,
            '& .MuiChip-icon': { color: 'inherit' },
          }}
        />
      )
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'ACTIONS',
      width: 100,
      cellClassName: 'actions',
      getActions: ({ id }) => {
        const isInEditMode = rowModesModel[id]?.mode === GridRowModes.Edit;

        if (isInEditMode) {
          return [
            <GridActionsCellItem
              icon={<CheckOutlined sx={{ color: '#10B981' }} />}
              label="Save"
              onClick={handleSaveClick(id)}
              sx={{ bgcolor: '#e6fff5ff', mr: 1 }}
            />,
            <GridActionsCellItem
              icon={<CloseOutlined sx={{ color: '#EF4444' }} />}
              label="Cancel"
              onClick={handleCancelClick(id)}
              sx={{ bgcolor: '#FEF2F2' }}
            />,
          ];
        }

        return [
          <GridActionsCellItem
            icon={<EditOutlined sx={{ color: T.accent }} />}
            label="Edit"
            onClick={handleEditClick(id)}
            sx={{ bgcolor: T.accW, mr: 1 }}
          />,
          <GridActionsCellItem
            icon={<DeleteOutline sx={{ color: '#94A3B8' }} />}
            label="Delete"
            onClick={handleDeleteClick(id)}
            sx={{ bgcolor: '#FEF2F2' }}
          />,
        ];
      },
    },
  ];

  return (
    <Box sx={{
      p: 3, bgcolor: T.canvas, height: 'calc(100vh - 120px)',
      width: 'calc(100vw - 130px)', display: 'flex', flexDirection: 'column', overflow: 'hidden'
    }}>

      {/* --- EN-TÊTE --- */}
      <Box sx={{ mb: 2.5, flexShrink: 0 }}>
        <Breadcrumbs
          separator={<NavigateNext sx={{ fontSize: 16, color: T.faint }} />}
          sx={{ mb: 1.5, '& .MuiTypography-root, & a': { fontSize: '12.5px', fontWeight: 600 } }}
        >
          <Link underline="hover" href={`/tab/dashboard/${sessionStorage.getItem('fileId')}`} sx={{ display: 'flex', alignItems: 'center', color: T.muted }}>
            <DashboardOutlined sx={{ mr: 0.5, fontSize: 16 }} /> Dashboard
          </Link>
          <Typography sx={{ color: T.ink, fontWeight: 700 }}>Gestion des contrôles</Typography>
        </Breadcrumbs>

        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ md: 'center' }} spacing={2}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box sx={{ width: 38, height: 38, flex: 'none', borderRadius: '11px', display: 'grid', placeItems: 'center', color: T.accent, bgcolor: `${T.accent}14`, '& svg': { fontSize: 20 } }}>
              <RuleOutlined />
            </Box>
            <Box>
              <Typography sx={{ fontSize: '18px', fontWeight: 700, color: T.ink, letterSpacing: '.2px', lineHeight: 1.2 }}>
                Gestion des contrôles
              </Typography>
              <Typography sx={{ fontSize: '12px', color: T.muted, mt: 0.2 }}>
                Configurez les règles automatiques de vérification des écritures
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Button
              variant="outlined"
              disableElevation
              startIcon={activatingAll
                ? <CircularProgress size={16} sx={{ color: allActivated ? T.neg : T.accent }} />
                : (allActivated ? <DoDisturbOnOutlined /> : <CheckCircleOutline />)}
              onClick={handleToggleAll}
              disabled={activatingAll || savableRows.length === 0}
              sx={{
                textTransform: 'none', fontWeight: 600, fontSize: '13px', px: 2.5, height: 40,
                borderRadius: '8px',
                color: allActivated ? T.neg : T.accent,
                borderColor: allActivated ? T.neg : T.accent,
                '&:hover': { borderColor: allActivated ? T.neg : T.accentDark, bgcolor: allActivated ? '#F7E7E4' : T.accW },
                '&.Mui-disabled': { color: T.faint, borderColor: T.line },
              }}
            >
              {activatingAll ? (allActivated ? 'Désactivation…' : 'Activation…') : (allActivated ? 'Tout désactiver' : 'Tout activer')}
            </Button>
            <Button
              variant="contained"
              disableElevation
              startIcon={<AddOutlined />}
              onClick={handleAddRow}
              sx={{ ...primaryBtnSx, px: 3, height: 40 }}
            >
              Nouveau contrôle
            </Button>
          </Stack>
        </Stack>
      </Box>

      {/* --- DATAGRID --- */}
      {error && (
        <Box sx={{ p: 2, mb: 2, borderRadius: '10px', bgcolor: '#F7E7E4', border: '1px solid #F0C9C4', flexShrink: 0 }}>
          <Typography sx={{ fontSize: '13px', color: T.neg, fontWeight: 600 }}>{error}</Typography>
        </Box>
      )}
      <Paper elevation={0} sx={{ ...panelSx, flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <DataGrid
          rows={rows}
          columns={columns}
          editMode="row"
          rowModesModel={rowModesModel}
          onRowModesModelChange={(newModel) => setRowModesModel(newModel)}
          processRowUpdate={processRowUpdate}
          density="compact"
          loading={loading}
          checkboxSelection
          disableSelectionOnClick={false}
          sx={gridSx}
        />
      </Paper>

      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        onConfirm={handleConfirmDelete}
        title="Confirmer la suppression"
        message="Êtes-vous sûr de vouloir supprimer ce contrôle ? Cette action est irréversible."
        loading={deleteLoading}
      />
    </Box>
  );
};

export default GestionControles;