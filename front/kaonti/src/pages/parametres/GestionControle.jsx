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

const GestionControles = () => {
  const axiosPrivate = useAxiosPrivate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [rowModesModel, setRowModesModel] = useState({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

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
    { field: 'controle', headerName: 'CODE CONTROLE', flex: 1, editable: true, checkboxSelection: true },
    {
      field: 'Type',
      headerName: 'TYPE',
      flex: 0.8,
      editable: true,
      type: 'singleSelect',
      valueOptions: typeValueOptions,
    },
    { field: 'compte', headerName: 'COMPTE', flex: 0.8, editable: true },
    {
      field: 'test',
      headerName: 'TEST',
      flex: 1,
      editable: true,
      type: 'singleSelect',
      valueOptions: testValueOptions,
    },
    { field: 'description', headerName: 'DESCRIPTION', flex: 2, editable: true },
    { field: 'anomalies', headerName: 'ANOMALIES DÉTECTÉES', flex: 2, editable: true },
    { field: 'param', headerName: 'PARAMÈTRES', flex: 1, editable: true },
    {
      field: 'etat',
      headerName: 'ÉTAT',
      width: 120,
      type: 'boolean',
      editable: true,
      renderCell: (params) => (
        <Chip
          icon={params.value ? <CheckCircleOutline /> : <DoDisturbOnOutlined />}
          label={params.value ? "Activé" : "Désactivé"}
          size="small"
          sx={{
            fontWeight: 700,
            fontSize: '0.65rem',
            bgcolor: params.value ? '#ECFDF5' : '#FEF2F2',
            color: params.value ? '#10B981' : '#EF4444',
            border: `1px solid ${params.value ? '#10B981' : '#EF4444'}30`
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
            icon={<EditOutlined sx={{ color: '#2563EB' }} />}
            label="Edit"
            onClick={handleEditClick(id)}
            sx={{ bgcolor: '#EEF2FF', mr: 1 }}
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
      p: 3, bgcolor: '#F8FAFC', height: 'calc(100vh - 120px)',
      width: 'calc(100vw - 130px)', display: 'flex', flexDirection: 'column', overflow: 'hidden'
    }}>

      {/* --- HEADER --- */}
      <Box sx={{ mb: 3 }}>
        <Breadcrumbs
          separator={<NavigateNext fontSize="small" />}
          sx={{ mb: 2, '& .MuiTypography-root': { fontSize: '0.85rem', fontWeight: 600 } }}
        >
          <Link underline="hover" color="inherit" href="/dashboard"
            sx={{ display: 'flex', alignItems: 'center' }}
          >
            <DashboardOutlined sx={{ mr: 0.5, fontSize: 20 }} /> Dashboard
          </Link>
          <Typography color="text.primary" sx={{ fontWeight: 600, color: '#64748B' }}>Gestion des contrôles</Typography>
        </Breadcrumbs>

        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box sx={{ p: 1, borderRadius: '8px', bgcolor: '#0F172A', display: 'flex' }}>
              <RuleOutlined sx={{ color: '#00B8D4', fontSize: 24 }} />
            </Box>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 900, color: '#1E293B', letterSpacing: '-0.5px', lineHeight: 1.2 }}>
                Gestion des Contrôles
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                Configurez les règles automatiques de vérification des écritures.
              </Typography>
            </Box>
          </Stack>

          <Button
            variant="contained"
            startIcon={<AddOutlined />}
            onClick={handleAddRow}
            sx={{
              bgcolor: '#000000',
              color: '#FFFFFF',
              textTransform: 'none',
              borderRadius: '8px',
              px: 3,
              fontWeight: 700,
              '&:hover': { bgcolor: '#222' },
              '&:disabled': { bgcolor: '#CCCCCC', color: '#666' }
            }}
          >
            Nouveau contrôle
          </Button>
        </Stack>
      </Box>

      {/* --- DATAGRID --- */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      )}
      {error && (
        <Box sx={{ p: 2, color: 'error.main' }}>
          <Typography>{error}</Typography>
        </Box>
      )}
      <Paper variant="outlined" sx={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid #E2E8F0', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
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

          sx={{
            border: 'none',
            flex: 1,
            minHeight: 0,
            '& .MuiDataGrid-columnHeaders': {
              bgcolor: '#F8FAFC',
              borderBottom: '1px solid #E2E8F0',
              '& .MuiDataGrid-columnHeaderTitle': {
                fontSize: '0.7rem',
                fontWeight: 800,
                color: '#64748B',
                textTransform: 'uppercase',
              }
            },
            '& .MuiDataGrid-cell': {
              borderBottom: '1px solid #F1F5F9',
              '&:focus': { outline: 'none' }
            },
            '& .MuiDataGrid-row:hover': {
              bgcolor: '#F1F5F930'
            }
          }}
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