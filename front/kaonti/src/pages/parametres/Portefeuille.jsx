import React, { useState } from 'react';
import { 
  Box, Typography, Stack, Button, IconButton, Paper, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, Breadcrumbs, Link
} from '@mui/material';
import { 
  AddOutlined, EditOutlined, DeleteOutline, 
  CheckOutlined, CloseOutlined, NavigateNext,
  SettingsOutlined, FolderOutlined,
  DashboardOutlined
} from '@mui/icons-material';

const Portefeuille = () => {
  // Liste fictive de portefeuilles
  const [items, setItems] = useState([
    { id: 1, nom: 'Dossiers Permanents', isEditing: false },
    { id: 2, nom: 'Archives Fiscales', isEditing: false },
    { id: 3, nom: 'Portefeuille Social', isEditing: false },
  ]);

  const [editValue, setEditValue] = useState("");

  // Activer le mode édition
  const handleEditClick = (id, currentNom) => {
    setEditValue(currentNom);
    setItems(items.map(item => item.id === id ? { ...item, isEditing: true } : item));
  };

  // Annuler l'édition
  const handleCancel = (id) => {
    setItems(items.map(item => item.id === id ? { ...item, isEditing: false } : item));
  };

  // Sauvegarder (simulation)
  const handleSave = (id) => {
    setItems(items.map(item => item.id === id ? { ...item, nom: editValue, isEditing: false } : item));
  };

  return (
    <Box sx={{ p: 3, height: '100%', bgcolor: '#F8FAFC' }}>
      
      {/* --- BREADCRUMBS --- */}
      <Breadcrumbs 
        separator={<NavigateNext fontSize="small" />} 
        sx={{ mb: 2, '& .MuiTypography-root': { fontSize: '0.85rem', fontWeight: 600 } }}
      >
        <Link underline="hover" color="inherit" href="/dashboard" 
          sx={{ display: 'flex', alignItems: 'center' }}
          >
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
          startIcon={<AddOutlined sx={{ color: '#10B981' }} />} // Icône en vert (Neon Cyan/Emerald)
          sx={{ 
            bgcolor: '#000000', // Bouton noir
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

      {/* --- TABLEAU --- */}
      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid #E2E8F0' }}>
        <Table size="small">
          <TableHead sx={{ bgcolor: '#F8FAFC' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 800, color: '#64748B', py: 1.5, fontSize: '0.7rem', textTransform: 'uppercase' }}>
                Nom du Portefeuille
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 800, color: '#64748B', fontSize: '0.7rem', textTransform: 'uppercase' }}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((row) => (
              <TableRow key={row.id} sx={{ '&:hover': { bgcolor: '#F1F5F930' } }}>
                <TableCell sx={{ py: 1 }}>
                  {row.isEditing ? (
                    <TextField 
                      fullWidth 
                      size="small" 
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      autoFocus
                      sx={{ 
                        '& .MuiInputBase-input': { fontSize: '0.85rem', fontWeight: 600, py: 0.5 } 
                      }}
                    />
                  ) : (
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <FolderOutlined sx={{ color: '#94A3B8', fontSize: 18 }} />
                      <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#1E293B' }}>
                        {row.nom}
                      </Typography>
                    </Stack>
                  )}
                </TableCell>
                
                <TableCell align="right">
                  {row.isEditing ? (
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Button 
                        size="small" 
                        variant="contained" 
                        color="success"
                        onClick={() => handleSave(row.id)}
                        startIcon={<CheckOutlined />}
                        sx={{ textTransform: 'none', fontSize: '0.7rem', fontWeight: 800, bgcolor: '#10B981', '&:hover': { bgcolor: '#059669' } }}
                      >
                        Sauvegarder
                      </Button>
                      <Button 
                        size="small" 
                        variant="outlined" 
                        color="error"
                        onClick={() => handleCancel(row.id)}
                        startIcon={<CloseOutlined />}
                        sx={{ textTransform: 'none', fontSize: '0.7rem', fontWeight: 800 }}
                      >
                        Annuler
                      </Button>
                    </Stack>
                  ) : (
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <IconButton size="small" onClick={() => handleEditClick(row.id, row.nom)} sx={{ color: '#6366F1', bgcolor: '#EEF2FF' }}>
                        <EditOutlined fontSize="small" />
                      </IconButton>
                      <IconButton size="small" sx={{ color: '#EF4444', bgcolor: '#FEF2F2' }}>
                        <DeleteOutline fontSize="small" />
                      </IconButton>
                    </Stack>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default Portefeuille;