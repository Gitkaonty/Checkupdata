import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, Stack, Button, IconButton, Paper, Chip,
  Breadcrumbs, Link
} from '@mui/material';
import { DataGrid, frFR, GridRowEditStopReasons, GridRowModes, useGridApiRef, GridActionsCellItem } from '@mui/x-data-grid';
import {
  AddOutlined, EditOutlined, DeleteOutline,
  CheckOutlined, CloseOutlined, NavigateNext,
  FolderOutlined, DashboardOutlined, SaveOutlined
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import useAuth from '../../hooks/useAuth';
import { jwtDecode } from 'jwt-decode';
import useAxiosPrivate from '../../hooks/useAxiosPrivate';
import usePermission from '../../hooks/usePermission';
import { useParams, useNavigate } from 'react-router-dom';
import PopupTestSelectedFile from '../../components/PopupTestSelectedFile';
import ConfirmDeleteDialog from '../../components/ConfirmDeleteDialog';

const Portefeuille = () => {
  const apiRef = useGridApiRef();
  const { canAdd, canModify, canDelete, canView } = usePermission();
  const axiosPrivate = useAxiosPrivate();

  const { id } = useParams();
  const [fileId, setFileId] = useState(0);
  const [fileInfos, setFileInfos] = useState('');
  const [noFile, setNoFile] = useState(false);
  const [rows, setRows] = useState([]);
  const { auth } = useAuth();
  const decoded = auth?.accessToken ? jwtDecode(auth.accessToken) : undefined;
  const compteId = decoded?.UserInfo?.compteId || null;
  const compteName = decoded?.UserInfo?.compte || 'Espace Client';

  const navigate = useNavigate();

  const sendToHome = () => {
    navigate('/home');
  };

  useEffect(() => {
    const storedFileId = sessionStorage.getItem('fileId');
    const currentId = id || storedFileId;
    if (currentId && currentId !== '0' && currentId !== 0) {
      setFileId(currentId);
      setNoFile(false);
    } else {
      setNoFile(true);
    }
  }, [id]);

  const [editableRow, setEditableRow] = useState(true);

  const [rowModesModel, setRowModesModel] = useState({});
  const [selectedRowId, setSelectedRowId] = useState([]);
  const [disableModifyBouton, setDisableModifyBouton] = useState(true);
  const [disableCancelBouton, setDisableCancelBouton] = useState(true);
  const [currentEditedValues, setCurrentEditedValues] = useState({});

  // --- CAPTURER LES VALEURS ÉDITÉES ---
  const handleCellEditCommit = (params, event) => {
    const { id, field, value } = params;
    console.log(' Cell edit commit:', { id, field, value });
    setCurrentEditedValues(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value
      }
    }));
  };
  const [disableSaveBouton, setDisableSaveBouton] = useState(true);
  const [disableDeleteBouton, setDisableDeleteBouton] = useState(true);
  const [disableAddRowBouton, setDisableAddRowBouton] = useState(false);
  const [selectedRow, setSelectedRow] = useState([]);

  const [openDialogDeleteRow, setOpenDialogDeleteRow] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [dataGridKey, setDataGridKey] = useState(0);

  const [submitAttempt, setSubmitAttempt] = useState(false);
  const [isRefreshed, setIsRefreshed] = useState(false);
  const [searchText, setSearchText] = useState('');

  const [loading, setLoading] = useState(false);

  // --- CHARGER LES PORTEFEUILLES ---
  const loadPortefeuilles = async () => {
    if (!compteId) {
      toast.error('Compte non trouvé');
      return;
    }

    setLoading(true);
    try {
      const response = await axiosPrivate.get(`/param/portefeuille/getAllPortefeuille/${compteId}`);
      const data = response?.data;
      if (data?.state && Array.isArray(data?.list)) {
        setRows(data.list);
      } else {
        toast.error(data?.message || 'Erreur lors du chargement');
        setRows([]);
      }
    } catch (err) {
      console.error(' Erreur chargement portefeuilles:', err);
      toast.error('Erreur serveur');
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPortefeuilles();
  }, [compteId]);

  // --- LOGIQUE ACTIONS ---

  const handleEditClick = (id) => () => {
    setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.Edit } });
  };

  const handleSaveClick = (id) => async () => {
    try {
      apiRef.current.stopRowEditMode({ id });
    } catch (err) {
      console.error(' Erreur stopRowEditMode:', err);
    }
  };

  const handleDeleteClick = (id) => async () => {
    const targetRow = rows.find((r) => r.id === id);
    if (targetRow?.isNew) {
      setRows(rows.filter((row) => row.id !== id));
      return;
    }

    setDeleteTargetId(id);
    setOpenDialogDeleteRow(true);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDialogDeleteRow(false);
    setDeleteTargetId(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;

    try {
      setDeleteLoading(true);
      const response = await axiosPrivate.delete(`/param/portefeuille/deletePortefeuille/${deleteTargetId}`);
      const data = response?.data;

      if (data?.state) {
        toast.success('Portefeuille supprimé');
        setRows((prev) => prev.filter((row) => row.id !== deleteTargetId));
        handleCloseDeleteDialog();
      } else {
        toast.error(data?.message || 'Erreur lors de la suppression');
      }
    } catch (err) {
      console.error(' Erreur suppression:', err);
      toast.error('Erreur serveur');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleCancelClick = (id) => () => {
    setRowModesModel({
      ...rowModesModel,
      [id]: { mode: GridRowModes.View, ignoreModifications: true },
    });
    // Nettoyer les valeurs éditée lors de l'annulation
    setCurrentEditedValues(prev => {
      const newValues = { ...prev };
      delete newValues[id];
      return newValues;
    });
  };

  const processRowUpdate = async (newRow) => {
    console.log(' processRowUpdate called with:', newRow);

    // Validation
    if (!newRow?.nom?.trim()) {
      toast.error('Le nom du portefeuille est requis');
      // Rester en mode édition
      setRowModesModel(prev => ({ ...prev, [newRow.id]: { mode: GridRowModes.Edit } }));
      return rows.find(r => r.id === newRow.id) || newRow; // Retourner la ligne originale
    }

    try {
      const payload = {
        idPortefeuille: newRow.isNew ? undefined : newRow.id,
        nom: newRow.nom.trim(),
        id_compte: compteId,
      };

      const response = await axiosPrivate.post('/param/portefeuille/addOrUpdatePortefeuille', payload);
      const data = response?.data;

      if (data?.state) {
        toast.success(data?.msg || 'Portefeuille sauvegardé');
        setRowModesModel(prev => ({ ...prev, [newRow.id]: { mode: GridRowModes.View } }));

        // Nettoyer les valeurs éditée
        setCurrentEditedValues(prev => {
          const newValues = { ...prev };
          delete newValues[newRow.id];
          return newValues;
        });
        // Recharger la liste
        await loadPortefeuilles();
        return newRow;
      } else {
        toast.error(data?.msg || data?.message || 'Erreur lors de la sauvegarde');
        // Rester en mode édition en cas d'erreur
        setRowModesModel(prev => ({ ...prev, [newRow.id]: { mode: GridRowModes.Edit } }));
        return rows.find(r => r.id === newRow.id) || newRow;
      }
    } catch (err) {
      console.error(' Erreur sauvegarde:', err);
      toast.error('Erreur serveur');
      // Rester en mode édition en cas d'erreur
      setRowModesModel(prev => ({ ...prev, [newRow.id]: { mode: GridRowModes.Edit } }));
      return rows.find(r => r.id === newRow.id) || newRow;
    }
  };

  const handleAddRow = async () => {
    if (!compteId) {
      toast.error('Compte non trouvé');
      return;
    }

    try {
      // Créer une nouvelle ligne temporaire
      const tempId = Math.max(0, ...rows.map((r) => r.id || 0)) + 1;
      const newRow = { id: tempId, nom: '', isNew: true };
      setRows([newRow, ...rows]);
      setRowModesModel((oldModel) => ({
        ...oldModel,
        [tempId]: { mode: GridRowModes.Edit, fieldToFocus: 'nom' },
      }));
    } catch (err) {
      console.error(' Erreur ajout ligne:', err);
      toast.error('Erreur lors de l\'ajout');
    }
  };

  const handleRowModesModelChange = (newRowModesModel) => {
    setRowModesModel(newRowModesModel);
  };

  const handleCellKeyDown = (params, event) => {
    const api = apiRef.current;

    const allCols = api.getAllColumns().filter(c => c.editable);
    const sortedRowIds = api.getSortedRowIds();
    const currentColIndex = allCols.findIndex(c => c.field === params.field);
    const currentRowIndex = sortedRowIds.indexOf(params.id);

    let nextColIndex = currentColIndex;
    let nextRowIndex = currentRowIndex;

    if (event.key === 'Tab' && !event.shiftKey) {
      event.preventDefault();
      nextColIndex = currentColIndex + 1;
      if (nextColIndex >= allCols.length) {
        nextColIndex = 0;
        nextRowIndex = currentRowIndex + 1;
      }
    } else if (event.key === 'Tab' && event.shiftKey) {
      event.preventDefault();
      nextColIndex = currentColIndex - 1;
      if (nextColIndex < 0) {
        nextColIndex = allCols.length - 1;
        nextRowIndex = currentRowIndex - 1;
      }
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      nextColIndex = currentColIndex + 1;
      if (nextColIndex >= allCols.length) nextColIndex = allCols.length - 1;
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      nextColIndex = currentColIndex - 1;
      if (nextColIndex < 0) nextColIndex = 0;
    }

    const nextRowId = sortedRowIds[nextRowIndex];
    const targetCol = allCols[nextColIndex];

    if (!nextRowId || !targetCol) return;

    try {
      api.stopCellEditMode({ id: params.id, field: params.field });
    } catch (err) {
      console.warn('Erreur stopCellEditMode ignorée:', err);
    }

    setTimeout(() => {
      const cellInput = document.querySelector(
        `[data-id="${nextRowId}"] [data-field="${targetCol.field}"] input, 
             [data-id="${nextRowId}"] [data-field="${targetCol.field}"] textarea`
      );
      if (cellInput) cellInput.focus();
    }, 50);
  };

  // --- COLONNES ---

  const columns = [
    {
      field: 'nom',
      headerName: 'NOM DU PORTEFEUILLE',
      flex: 1,
      editable: true,
      checkboxSelection: true,
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'ACTIONS',
      width: 120,
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
            icon={<EditOutlined sx={{ color: '#6366F1' }} />}
            label="Edit"
            onClick={handleEditClick(id)}
            sx={{ bgcolor: '#EEF2FF', mr: 1 }}
          />,
          <GridActionsCellItem
            icon={<DeleteOutline sx={{ color: '#EF4444' }} />}
            label="Delete"
            onClick={handleDeleteClick(id)}
            sx={{ bgcolor: '#FEF2F2' }}
          />,
        ];
      },
    },
  ];

  if (noFile) {
    return <PopupTestSelectedFile confirmationState={sendToHome} />;
  }

  return (
    <Box sx={{
      p: 3, height: 'calc(100vh - 120px)',
      width: 'calc(100vw - 130px)', bgcolor: '#F8FAFC', display: 'flex', flexDirection: 'column', overflow: 'hidden'
    }}>
      <Box sx={{ mb: 4 }}>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1 }}>
          <Chip
            label={compteName}
            sx={{
              borderRadius: '4px', // Rectangulaire comme demandé
              bgcolor: '#F1F5F9',
              color: '#475569',
              fontWeight: 700,
              fontSize: '0.95rem',
              border: '1px solid #E2E8F0',
              height: 24,
            }}
          />
          {/* --- BREADCRUMBS --- */}
          <Breadcrumbs
            separator={<NavigateNext fontSize="small" />}
            sx={{ mb: 2, '& .MuiTypography-root': { fontSize: '0.85rem', fontWeight: 600 } }}
          >
            <Link underline="hover" color="inherit" href="/dashboard" sx={{ display: 'flex', alignItems: 'center' }}>
              <DashboardOutlined sx={{ mr: 0.5, fontSize: 20 }} /> Dashboard
            </Link>
            <Typography color="text.primary" sx={{ fontWeight: 600, color: '#64748B' }}>Portefeuilles</Typography>
          </Breadcrumbs>

        </Stack>

        {/* --- HEADER --- */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 900, color: '#1E293B' }}>Gestion des Portefeuilles</Typography>
            <Typography variant="caption" sx={{ color: '#64748B' }}>Organisez vos dossiers par catégories</Typography>
          </Box>

          <Button
            variant="contained"
            onClick={handleAddRow}
            disabled={loading}
            startIcon={<AddOutlined sx={{ color: '#10B981' }} />}
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
            Ajouter
          </Button>
        </Stack>
      </Box>

      {/* --- DATAGRID --- */}
      <Paper variant="outlined" sx={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid #E2E8F0', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <DataGrid
          rows={rows}
          columns={columns}
          editMode="row"
          rowModesModel={rowModesModel}
          onRowModesModelChange={(newModel) => setRowModesModel(newModel)}
          onCellEditCommit={handleCellEditCommit}
          processRowUpdate={processRowUpdate}
          loading={loading}
          density="compact"
          checkboxSelection
          disableSelectionOnClick
          apiRef={apiRef}
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
        open={openDialogDeleteRow}
        onClose={handleCloseDeleteDialog}
        onConfirm={handleConfirmDelete}
        title="Confirmer la suppression"
        message="Êtes-vous sûr de vouloir supprimer ce portefeuille ? Cette action est irréversible."
        loading={deleteLoading}
      />
    </Box>
  );
};

export default Portefeuille;