import React from 'react';
import { 
  Box, Typography, Stack, Divider, IconButton, 
  Autocomplete, TextField, Tooltip, Paper, Chip 
} from '@mui/material';
import { 
  CheckCircleOutline, ChatBubbleOutline, ChevronLeft, ChevronRight,
  ErrorOutline, PeopleOutline, ShoppingCartOutlined
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';

const AnalyseTiers = () => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
      
      {/* --- RÉCAPITULATIF GLOBAL --- */}
      <Stack direction="row" spacing={3} sx={{ p: 2, bgcolor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
        <Box>
          <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700 }}>ANOMALIES TIERS</Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="h6" sx={{ color: '#EF4444', fontWeight: 900, lineHeight: 1 }}>12</Typography>
            <ErrorOutline sx={{ color: '#EF4444', fontSize: 18 }} />
          </Stack>
        </Box>
        <Divider orientation="vertical" flexItem />
        <Box>
          <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700 }}>RESTANT À VALIDER</Typography>
          <Typography variant="h6" sx={{ color: '#F59E0B', fontWeight: 900, lineHeight: 1 }}>08</Typography>
        </Box>
      </Stack>

      <Box sx={{ p: 2, flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
        
        {/* --- SECTION FOURNISSEURS --- */}
        <SectionTiersUnique 
          title="Analyse Fournisseurs" 
          icon={<ShoppingCartOutlined sx={{ color: '#3B82F6' }} />}
          stats={{ anomalies: 7, restants: 4 }}
        />

        {/* --- SECTION CLIENTS --- */}
        <SectionTiersUnique 
          title="Analyse Clients" 
          icon={<PeopleOutline sx={{ color: '#10B981' }} />}
          stats={{ anomalies: 5, restants: 4 }}
        />

      </Box>
    </Box>
  );
};

// --- COMPOSANT DE SECTION UNIQUE (SANS ONGLETS) ---
const SectionTiersUnique = ({ title, icon, stats }) => {
  
  // Fonction pour styliser les labels d'anomalies
  const renderAnomalieLabel = (type) => {
    const config = {
      "Solde en suspens": { color: "#EF4444", bg: "#FEF2F2" },
      "Paiement sans facture": { color: "#F59E0B", bg: "#FFFBEB" },
      "Ajustement non traité": { color: "#6366F1", bg: "#EEF2FF" },
      "Facture non réglée": { color: "#64748B", bg: "#F8FAFC" }
    };
    const style = config[type] || config["Facture non réglée"];
    return (
      <Chip 
        label={type} 
        size="small" 
        sx={{ bgcolor: style.bg, color: style.color, fontWeight: 700, fontSize: '0.65rem', borderRadius: '4px' }} 
      />
    );
  };

  const columns = [
    { field: 'compte', headerName: 'Compte', width: 90, cellClassName: 'font-bold' },
    { 
      field: 'typeAnomalie', 
      headerName: 'Type d\'anomalie', 
      width: 180, 
      renderCell: (params) => renderAnomalieLabel(params.value) 
    },
    { field: 'journal', headerName: 'Jour.', width: 60 },
    { field: 'piece', headerName: 'Pièce', width: 90 },
    { field: 'libelle', headerName: 'Libellé', flex: 1 },
    { field: 'debit', headerName: 'Débit', width: 100, type: 'number' },
    { field: 'credit', headerName: 'Crédit', width: 100, type: 'number' },
    { field: 'lettrage', headerName: 'Let.', width: 50, align: 'center' },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 110,
      sortable: false,
      renderCell: () => (
        <Stack direction="row" spacing={1}>
          <IconButton size="small" sx={{ color: '#10B981', bgcolor: 'rgba(16, 185, 129, 0.05)' }}>
            <CheckCircleOutline fontSize="small" />
          </IconButton>
          <IconButton size="small" sx={{ color: '#64748B', bgcolor: '#F1F5F9' }}>
            <ChatBubbleOutline fontSize="small" />
          </IconButton>
        </Stack>
      )
    }
  ];

  return (
    <Box>
      {/* Header de Section avec stats */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          {icon}
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1E293B' }}>{title}</Typography>
        </Stack>
        <Stack direction="row" spacing={1}>
          <Chip label={`${stats.anomalies} anomalies`} size="small" sx={{ height: 20, bgcolor: '#FEF2F2', color: '#EF4444', fontWeight: 800, fontSize: '0.6rem' }} />
          <Chip label={`${stats.restants} à valider`} size="small" sx={{ height: 20, bgcolor: '#FFFBEB', color: '#F59E0B', fontWeight: 800, fontSize: '0.6rem' }} />
        </Stack>
      </Stack>

      <Paper variant="outlined" sx={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid #E2E8F0' }}>
        {/* Navigateur de compte intégré */}
        <Box sx={{ p: 1, bgcolor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 1 }}>
          <Autocomplete
            size="small"
            options={['401000 - Orange', '411000 - Client Alpha']}
            renderInput={(params) => (
              <TextField {...params} placeholder="Navigateur de compte..." sx={{ width: 250, '& .MuiInputBase-root': { fontSize: '0.75rem', height: 30, bgcolor: '#FFF' }}} />
            )}
          />
          <IconButton size="small" sx={{ border: '1px solid #E2E8F0', bgcolor: '#FFF' }}><ChevronLeft fontSize="small" /></IconButton>
          <IconButton size="small" sx={{ border: '1px solid #E2E8F0', bgcolor: '#FFF' }}><ChevronRight fontSize="small" /></IconButton>
        </Box>

        {/* Tableau Unique */}
        <Box sx={{ height: 350, width: '100%' }}>
          <DataGrid
            rows={[]} // Données mixtes (les 4 types d'anomalies ensemble)
            columns={columns}
            density="compact"
            disableRowSelectionOnClick
            sx={{
              border: 'none',
              '& .MuiDataGrid-columnHeaders': { bgcolor: '#F8FAFC', color: '#64748B', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase' },
              '& .MuiDataGrid-cell': { fontSize: '0.8rem', borderBottom: '1px solid #F1F5F9' },
              '& .font-bold': { fontWeight: 700 }
            }}
          />
        </Box>
      </Paper>
    </Box>
  );
};

export default AnalyseTiers;