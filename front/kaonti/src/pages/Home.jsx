import React, { useState } from 'react';
import { 
  Box, Typography, Button, Dialog, DialogTitle, DialogContent, 
  DialogActions, TextField, Stack, Paper, MenuItem 
} from '@mui/material';
import { DataGrid, GridActionsCellItem } from '@mui/x-data-grid';
import { 
  AddOutlined, DeleteOutline, FolderOutlined, 
  PersonOutline, BusinessOutlined 
} from '@mui/icons-material';

const DossiersPage = () => {
  const [open, setOpen] = useState(false);
  
  // Données de test
  const [rows, setRows] = useState([
    { id: 1, nom: 'Cabinet Randria & Co', portefeuille: 'Juridique', responsable: 'Daniela R.' },
    { id: 2, nom: 'Kaonty SaaS', portefeuille: 'Technologie', responsable: 'Daniela R.' },
    { id: 3, nom: 'Ecole Excellence', portefeuille: 'Education', responsable: 'Jean L.' },
  ]);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  // Configuration des colonnes du DataGrid
  const columns = [
    { 
      field: 'nom', 
      headerName: 'Nom du dossier', 
      flex: 1, // Prend l'espace disponible
      minWidth: 250,
      renderCell: (params) => (
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ height: '100%' }}>
          <Box sx={{ p: 0.8, bgcolor: '#F0FDFA', borderRadius: '8px', display: 'flex' }}>
            <FolderOutlined sx={{ color: '#10B981', fontSize: 20 }} />
          </Box>
          <Typography variant="body2" sx={{ fontWeight: 600, color: '#1E293B' }}>
            {params.value}
          </Typography>
        </Stack>
      )
    },
    { 
      field: 'portefeuille', 
      headerName: 'Portefeuille', 
      width: 200,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ color: '#64748B' }}>{params.value}</Typography>
      )
    },
    { 
      field: 'responsable', 
      headerName: 'Responsable', 
      width: 200,
      renderCell: (params) => (
        <Stack direction="row" spacing={1} alignItems="center">
          <PersonOutline sx={{ fontSize: 16, color: '#94A3B8' }} />
          <Typography variant="body2" sx={{ color: '#64748B' }}>{params.value}</Typography>
        </Stack>
      )
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 80,
      getActions: (params) => [
        <GridActionsCellItem
          icon={<DeleteOutline sx={{ color: '#EF4444' }} />}
          label="Supprimer"
          onClick={() => setRows(rows.filter(r => r.id !== params.id))}
        />,
      ],
    },
  ];

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: '#FFFFFF', minHeight: '100%' }}>
      
      {/* HEADER DE LA PAGE */}
      <Stack direction="row" justifyContent="space-between" alignItems="flex-end" sx={{ mb: 4 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F172A', mb: 0.5 }}>
            Dossiers Clients
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748B' }}>
            Visualisez et gérez l'ensemble de vos mandats en cours.
          </Typography>
        </Box>
        
        <Button 
          variant="contained" 
          startIcon={<AddOutlined />}
          onClick={handleOpen}
          sx={{ 
            bgcolor: '#10B981', 
            '&:hover': { bgcolor: '#059669' },
            textTransform: 'none',
            borderRadius: '10px',
            fontWeight: 700,
            px: 3,
            boxShadow: 'none'
          }}
        >
          Nouveau Dossier
        </Button>
      </Stack>

      {/* TABLEAU DATAGRID */}
      <Paper elevation={0} sx={{ 
        height: 600, 
        width: '100%', 
        borderRadius: '16px', 
        border: '1px solid #E2E8F0',
        overflow: 'hidden'
      }}>
        <DataGrid
          rows={rows}
          columns={columns}
          disableRowSelectionOnClick
          rowHeight={60}
          sx={{
            border: 'none',
            '& .MuiDataGrid-columnHeaders': {
              bgcolor: '#F8FAFC',
              color: '#475569',
              fontWeight: 700,
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: 1,
              borderBottom: '1px solid #E2E8F0',
            },
            '& .MuiDataGrid-cell': {
              borderBottom: '1px solid #F1F5F9',
              '&:focus': { outline: 'none' }
            },
            '& .MuiDataGrid-footerContainer': {
              borderTop: '1px solid #E2E8F0',
            },
          }}
        />
      </Paper>

      {/* MODAL DE CRÉATION (Dialog) */}
      <Dialog 
        open={open} 
        onClose={handleClose}
        PaperProps={{
          sx: { 
            bgcolor: '#FFFFFF', 
            borderRadius: '20px',
            width: '100%',
            maxWidth: '450px',
            p: 1,
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)'
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#0F172A', pt: 3, pb: 1 }}>
          Créer un nouveau dossier
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: '#64748B', mb: 3 }}>
            Veuillez renseigner les informations de base de l'entité.
          </Typography>
          
          <Stack spacing={3}>
            {/* Champ Nom */}
            <Box>
              <Typography variant="caption" sx={labelStyle}>NOM DE L'ENTITÉ</Typography>
              <TextField fullWidth placeholder="Ex: SARL Ma Boutique" variant="outlined" sx={inputStyle} />
            </Box>

            {/* Champ Portefeuille */}
            <Box>
              <Typography variant="caption" sx={labelStyle}>PORTEFEUILLE</Typography>
              <TextField 
                select 
                fullWidth 
                defaultValue="" 
                variant="outlined" 
                sx={inputStyle}
              >
                <MenuItem value="general">Général</MenuItem>
                <MenuItem value="techno">Technologie</MenuItem>
                <MenuItem value="artisans">Artisans</MenuItem>
              </TextField>
            </Box>

            {/* Champ Responsable */}
            <Box>
              <Typography variant="caption" sx={labelStyle}>RESPONSABLE DU DOSSIER</Typography>
              <TextField fullWidth placeholder="Nom du collaborateur" variant="outlined" sx={inputStyle} />
            </Box>
          </Stack>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button onClick={handleClose} sx={{ color: '#94A3B8', textTransform: 'none', fontWeight: 600 }}>
            Annuler
          </Button>
          <Button 
            variant="contained" 
            onClick={handleClose}
            sx={{ 
              bgcolor: '#10B981', 
              '&:hover': { bgcolor: '#059669' },
              textTransform: 'none',
              borderRadius: '10px',
              px: 4,
              fontWeight: 700,
              boxShadow: 'none'
            }}
          >
            Confirmer la création
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// --- STYLES PERSONNALISÉS POUR MODE CLAIR ---

const labelStyle = { 
  color: '#475569', 
  fontWeight: 700, 
  mb: 1, 
  display: 'block', 
  fontSize: '0.65rem', 
  letterSpacing: 1 
};

const inputStyle = {
  '& .MuiOutlinedInput-root': {
    color: '#1E293B',
    bgcolor: '#F8FAFC', // Très léger gris pour contraster avec le fond blanc
    borderRadius: '10px',
    fontSize: '0.9rem',
    '& fieldset': { borderColor: '#E2E8F0' },
    '&:hover fieldset': { borderColor: '#CBD5E1' },
    '&.Mui-focused fieldset': { borderColor: '#10B981', borderWidth: '1px' },
  },
  '& input::placeholder': { color: '#94A3B8', opacity: 1 }
};

export default DossiersPage;