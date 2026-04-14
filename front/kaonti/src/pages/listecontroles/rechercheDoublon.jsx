import React, { useState } from 'react';
import { 
  Box, Typography, Stack, Divider, IconButton, 
  ToggleButton, ToggleButtonGroup, Paper, Tooltip, Chip
} from '@mui/material';
import { 
  CheckCircleOutline, ChatBubbleOutline, ErrorOutline,
  FilterAltOutlined, LayersOutlined, CopyAllOutlined
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import { 
  AccountBalanceOutlined, 
  MenuBookOutlined, 
  TagOutlined, 
  ShortTextOutlined, 
  PaymentsOutlined,
  CheckCircle,
  EventOutlined
} from '@mui/icons-material';

const RechercheDoublons = () => {
  // État pour les critères de doublons
  const [criteres, setCriteres] = useState(['montant', 'compte']);

  const handleCriteres = (event, nouveauxCriteres) => {
    if (nouveauxCriteres.length > 0) {
      setCriteres(nouveauxCriteres);
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

const toggleCritere = (id) => {
  setCriteres(prev => 
    prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
  );
};

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
      
      {/* --- STATISTIQUES GLOBALES --- */}
      <Stack direction="row" spacing={3} sx={{ p: 2, bgcolor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
        <Box>
          <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700 }}>DOUBLONS DÉTECTÉS</Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="h6" sx={{ color: '#EF4444', fontWeight: 900, lineHeight: 1 }}>04</Typography>
            <CopyAllOutlined sx={{ color: '#EF4444', fontSize: 18 }} />
          </Stack>
        </Box>
        <Divider orientation="vertical" flexItem />
        <Box>
          <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700 }}>VALEUR POTENTIELLE</Typography>
          <Typography variant="h6" sx={{ color: '#1E293B', fontWeight: 900, lineHeight: 1 }}>1 450,00 €</Typography>
        </Box>
      </Stack>

      <Box sx={{ p: 2, flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
        
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
                {options.map((option) => {
                const isSelected = criteres.includes(option.id);
                return (
                    <Chip
                    key={option.id}
                    icon={isSelected ? <CheckCircle sx={{ fontSize: '16px !important' }} /> : option.icon}
                    label={option.label}
                    onClick={() => toggleCritere(option.id)}
                    sx={{
                        px: 1,
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        transition: 'all 0.2s',
                        bgcolor: isSelected ? '#10B98115' : 'transparent',
                        color: isSelected ? '#10B981' : '#64748B',
                        border: `1px solid ${isSelected ? '#10B981' : '#E2E8F0'}`,
                        '&:hover': {
                        bgcolor: isSelected ? '#10B98125' : '#F1F5F9',
                        borderColor: isSelected ? '#10B981' : '#CBD5E1',
                        },
                        '& .MuiChip-icon': {
                        color: 'inherit'
                        }
                    }}
                    />
                );
                })}
            </Stack>

            <Divider orientation="vertical" flexItem sx={{ mx: 1, height: 20, alignSelf: 'center' }} />

            <Typography 
                variant="caption" 
                onClick={() => setCriteres(options.map(o => o.id))}
                sx={{ 
                cursor: 'pointer', 
                color: '#6366F1', 
                fontWeight: 700, 
                '&:hover': { textDecoration: 'underline' } 
                }}
            >
                Tout sélectionner
            </Typography>
            </Stack>
        </Paper>

        {/* --- TABLEAU DES DOUBLONS --- */}
        <Paper variant="outlined" sx={{ flexGrow: 1, borderRadius: '8px', overflow: 'hidden' }}>
          <DataGrid
            rows={[]} // Les lignes devront être groupées par couleur ou séparateur pour voir les paires
            columns={[
              { field: 'compte', headerName: 'Compte', width: 100, cellClassName: 'font-bold' },
              { field: 'journal', headerName: 'Journal', width: 80 },
              { field: 'piece', headerName: 'Pièce', width: 110 },
              { field: 'libelle', headerName: 'Libellé', flex: 1 },
              { field: 'montant', headerName: 'Montant', width: 120, type: 'number', cellClassName: 'font-bold' },
              {
                field: 'actions',
                headerName: 'Actions',
                width: 120,
                renderCell: () => (
                  <Stack direction="row" spacing={1}>
                    <Tooltip title="Valider">
                      <IconButton size="small" sx={{ color: '#10B981', bgcolor: '#F0FDFA' }}>
                        <CheckCircleOutline fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Commenter">
                      <IconButton size="small" sx={{ color: '#64748B', bgcolor: '#F8FAFC' }}>
                        <ChatBubbleOutline fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                )
              }
            ]}
            density="compact"
            sx={dataGridStyle}
            disableRowSelectionOnClick
          />
        </Paper>
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