import React, { useState } from 'react';
import { 
  Box, Typography, Stack, Button, IconButton, Paper, 
  Breadcrumbs, Link
} from '@mui/material';
import { 
  DataGrid, GridActionsCellItem, GridRowModes 
} from '@mui/x-data-grid';
import { 
  AddOutlined, EditOutlined, DeleteOutline, 
  CheckOutlined, CloseOutlined, NavigateNext,
  FolderOutlined, DashboardOutlined, SaveOutlined
} from '@mui/icons-material';

const Portefeuille = () => {
  const [rows, setRows] = useState([
    { id: 1, nom: 'Dossiers Permanents' },
    { id: 2, nom: 'Archives Fiscales' },
    { id: 3, nom: 'Portefeuille Social' },
  ]);

  const [rowModesModel, setRowModesModel] = useState({});

  // --- LOGIQUE ACTIONS ---

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
    const id = Math.max(0, ...rows.map((r) => r.id)) + 1;
    setRows([{ id, nom: '', isNew: true }, ...rows]);
    setRowModesModel((oldModel) => ({
      ...oldModel,
      [id]: { mode: GridRowModes.Edit, fieldToFocus: 'nom' },
    }));
  };

  // --- COLONNES ---

  const columns = [
    { 
      field: 'nom', 
      headerName: 'NOM DU PORTEFEUILLE', 
      flex: 1, 
      editable: true,
      renderCell: (params) => (
        <Stack direction="row" spacing={1.5} alignItems="center">
          <FolderOutlined sx={{ color: '#94A3B8', fontSize: 18 }} />
          <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#1E293B' }}>
            {params.value}
          </Typography>
        </Stack>
      )
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

  return (
    <Box sx={{ p: 3, height: '100%', bgcolor: '#F8FAFC' }}>
      
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

      {/* --- HEADER --- */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 900, color: '#1E293B' }}>Gestion des Portefeuilles</Typography>
          <Typography variant="caption" sx={{ color: '#64748B' }}>Organisez vos dossiers par catégories</Typography>
        </Box>

        <Button 
          variant="contained" 
          onClick={handleAddRow}
          startIcon={<AddOutlined sx={{ color: '#10B981' }} />} 
          sx={{ 
            bgcolor: '#000000', 
            color: '#FFFFFF',
            textTransform: 'none', 
            borderRadius: '8px', 
            px: 3,
            fontWeight: 700,
            '&:hover': { bgcolor: '#222' } 
          }}
        >
          Ajouter
        </Button>
      </Stack>

      {/* --- DATAGRID --- */}
      <Paper variant="outlined" sx={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid #E2E8F0', height: 400 }}>
        <DataGrid
          rows={rows}
          columns={columns}
          editMode="row"
          rowModesModel={rowModesModel}
          onRowModesModelChange={(newModel) => setRowModesModel(newModel)}
          processRowUpdate={processRowUpdate}
          density="compact"
          disableSelectionOnClick
          sx={{
            border: 'none',
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
    </Box>
  );
};

export default Portefeuille;