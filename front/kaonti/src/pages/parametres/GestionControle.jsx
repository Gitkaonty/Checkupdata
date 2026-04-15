import React, { useState } from 'react';
import { 
  Box, Typography, Stack, Button, Paper, Breadcrumbs, Link, 
  Chip, IconButton, Tooltip 
} from '@mui/material';
import { 
  DataGrid, GridActionsCellItem, GridRowModes, GridRowEditStopReasons 
} from '@mui/x-data-grid';
import { 
  NavigateNext, HistoryOutlined, AddOutlined, 
  EditOutlined, DeleteOutline, SaveOutlined, 
  CloseOutlined, RuleOutlined, CheckCircleOutline, 
  DoDisturbOnOutlined, 
  DashboardOutlined
} from '@mui/icons-material';

const GestionControles = () => {
  const [rows, setRows] = useState([
    { id: 1, controle: 'TVA_01', description: 'Vérification cohérence TVA/HT', anomalies: 'TVA ne correspond pas au taux 20%', param: 'Taux: 20%', etat: true },
    { id: 2, controle: 'BAN_05', description: 'Doublons de relevés bancaires', anomalies: 'N° de pièce identique sur la période', param: 'Champ: Ref_Piece', etat: true },
    { id: 3, controle: 'CPT_09', description: 'Compte 471 non soldé', anomalies: 'Solde différent de zéro en fin d\'exercice', param: 'Compte: 471000', etat: false },
  ]);

  const [rowModesModel, setRowModesModel] = useState({});

  // --- LOGIQUE D'EDITION ---
  const handleEditClick = (id) => () => {
    setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.Edit } });
  };

  const handleSaveClick = (id) => () => {
    setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.View } });
  };

  const handleDeleteClick = (id) => () => {
    setRows(rows.filter((row) => row.id !== id));
  };

  const handleCancelClick = (id) => () => {
    setRowModesModel({
      ...rowModesModel,
      [id]: { mode: GridRowModes.View, ignoreModifications: true },
    });
  };

  const processRowUpdate = (newRow) => {
    const updatedRow = { ...newRow, isNew: false };
    setRows(rows.map((row) => (row.id === newRow.id ? updatedRow : row)));
    return updatedRow;
  };

  const handleAddRow = () => {
    const id = Math.max(...rows.map((r) => r.id)) + 1;
    setRows([{ id, controle: '', description: '', anomalies: '', param: '', etat: true, isNew: true }, ...rows]);
    setRowModesModel((oldModel) => ({
      ...oldModel,
      [id]: { mode: GridRowModes.Edit, fieldToFocus: 'controle' },
    }));
  };

  const columns = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'controle', headerName: 'CODE CONTROLE', flex: 1, editable: true },
    { field: 'description', headerName: 'DESCRIPTION', flex: 2, editable: true },
    { field: 'anomalies', headerName: 'ANOMALIES DÉTECTÉES', flex: 2, editable: true },
    { field: 'param', headerName: 'PARAMÈTRES', flex: 1.5, editable: true },
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
              icon={<SaveOutlined sx={{ color: '#10B981' }} />}
              label="Save"
              onClick={handleSaveClick(id)}
            />,
            <GridActionsCellItem
              icon={<CloseOutlined sx={{ color: '#EF4444' }} />}
              label="Cancel"
              onClick={handleCancelClick(id)}
            />,
          ];
        }

        return [
          <GridActionsCellItem
            icon={<EditOutlined sx={{ color: '#2563EB' }} />}
            label="Edit"
            onClick={handleEditClick(id)}
          />,
          <GridActionsCellItem
            icon={<DeleteOutline sx={{ color: '#94A3B8' }} />}
            label="Delete"
            onClick={handleDeleteClick(id)}
          />,
        ];
      },
    },
  ];

  return (
    <Box sx={{ p: 3, bgcolor: '#F8FAFC', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
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
              bgcolor: '#2563EB', 
              textTransform: 'none', 
              fontWeight: 800, 
              borderRadius: '8px',
              px: 3,
              '&:hover': { bgcolor: '#1E40AF' }
            }}
          >
            Nouveau contrôle
          </Button>
        </Stack>
      </Box>

      {/* --- DATAGRID --- */}
      <Paper variant="outlined" sx={{ borderRadius: '12px', overflow: 'hidden', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <DataGrid
          rows={rows}
          columns={columns}
          editMode="row"
          rowModesModel={rowModesModel}
          onRowModesModelChange={(newModel) => setRowModesModel(newModel)}
          processRowUpdate={processRowUpdate}
          density="comfortable"
          sx={{
            border: 'none',
            '& .MuiDataGrid-columnHeaders': {
              bgcolor: '#FCFDFF',
              borderBottom: '1px solid #E2E8F0',
              '& .MuiDataGrid-columnHeaderTitle': {
                fontSize: '0.65rem',
                fontWeight: 800,
                color: '#94A3B8',
                textTransform: 'uppercase',
              }
            },
            '& .MuiDataGrid-cell': {
              fontSize: '0.8rem',
              color: '#1E293B',
              borderBottom: '1px solid #F1F5F9',
              '&:focus-within': { outline: 'none !important' }
            },
            '& .MuiDataGrid-row:hover': {
              bgcolor: '#F8FAFC'
            },
            '& .MuiDataGrid-row.Mui-editing': {
              bgcolor: '#EFF6FF'
            }
          }}
        />
      </Paper>
    </Box>
  );
};

export default GestionControles;