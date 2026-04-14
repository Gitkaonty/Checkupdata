import React from 'react';
import { 
  Box, Typography, Stack, Accordion, AccordionSummary, AccordionDetails, 
  Chip, Divider, IconButton, Autocomplete, TextField, Tooltip 
} from '@mui/material';
import { 
  ExpandMore, CheckCircleOutline, ChatBubbleOutline, 
  ChevronLeft, ChevronRight, ErrorOutline, WarningAmberOutlined,
  CheckCircle, HistoryOutlined, SyncAltOutlined, AccountBalanceWalletOutlined
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';

const GlobalBalance = () => {
  // Définition des sous-contrôles avec icônes, anomalies et restants
  const sousControles = [
    { id: 'atypique', label: 'Recherche montant atypique', icon: <HistoryOutlined color="warning" />, anomalies: 3, restants: 2 },
    { id: 'sens', label: 'Sens des soldes', icon: <SyncAltOutlined color="error" />, anomalies: 5, restants: 5 },
    { id: 'achat_vente', label: 'Sens des écritures achat et ventes', icon: <AccountBalanceWalletOutlined color="primary" />, anomalies: 0, restants: 0 },
    { id: 'reclassement', label: 'Reclassement immobilisation ou charges', icon: <WarningAmberOutlined color="warning" />, anomalies: 2, restants: 1 },
    { id: 'capital', label: 'Existence compte de capital', icon: <CheckCircle color="success" />, anomalies: 0, restants: 0 },
    { id: 'tva', label: 'Utilisation compte TVA sur immo', icon: <ErrorOutline color="error" />, anomalies: 1, restants: 1 },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
      
      {/* --- STATISTIQUES GLOBALES DU CONTRÔLE --- */}
      <Stack direction="row" spacing={3} sx={{ p: 2, bgcolor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
        <Box>
          <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700 }}>POINTS CRITIQUES</Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="h6" sx={{ color: '#EF4444', fontWeight: 900, lineHeight: 1 }}>07</Typography>
            <ErrorOutline sx={{ color: '#EF4444', fontSize: 18 }} />
          </Stack>
        </Box>
        <Divider orientation="vertical" flexItem />
        <Box>
          <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700 }}>RESTANT À VALIDER</Typography>
          <Typography variant="h6" sx={{ color: '#F59E0B', fontWeight: 900, lineHeight: 1 }}>14</Typography>
        </Box>
      </Stack>

      {/* --- LISTE DES SOUS-CONTRÔLES --- */}
      <Box sx={{ p: 2, flexGrow: 1, overflowY: 'auto' }}>
        {sousControles.map((ctrl) => (
          <Accordion 
            key={ctrl.id} 
            elevation={0} 
            sx={{ 
              mb: 1.5, 
              border: '1px solid #E2E8F0', 
              borderRadius: '8px !important', 
              '&:before': { display: 'none' },
              '&.Mui-expanded': { border: '1px solid #10B981', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.08)' }
            }}
          >
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ width: '100%' }}>
                {ctrl.icon}
                
                <Typography sx={{ fontWeight: 700, color: '#1E293B', flexGrow: 1 }}>
                  {ctrl.label}
                </Typography>

                {/* STATS SUR L'ACCORDÉON : ANOMALIES + RESTANTS */}
                <Stack direction="row" spacing={1}>
                  {ctrl.anomalies > 0 ? (
                    <>
                      <Chip 
                        label={`${ctrl.anomalies} anomalies`} 
                        size="small" 
                        sx={{ bgcolor: '#FEF2F2', color: '#EF4444', fontWeight: 800, fontSize: '0.65rem', height: 20 }} 
                      />
                      <Chip 
                        label={`${ctrl.restants} restants`} 
                        size="small" 
                        sx={{ bgcolor: '#FFFBEB', color: '#F59E0B', fontWeight: 800, fontSize: '0.65rem', height: 20 }} 
                      />
                    </>
                  ) : (
                    <Chip 
                      label="Conforme" 
                      size="small" 
                      icon={<CheckCircleOutline sx={{ fontSize: '12px !important' }} />}
                      sx={{ bgcolor: '#F0FDFA', color: '#10B981', fontWeight: 800, fontSize: '0.65rem', height: 20 }} 
                    />
                  )}
                </Stack>
              </Stack>
            </AccordionSummary>
            
            <AccordionDetails sx={{ p: 0, borderTop: '1px solid #F1F5F9' }}>
              <SousControleContent type={ctrl.id} />
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    </Box>
  );
};

const SousControleContent = ({ type }) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      {/* NAVIGATEUR DE COMPTE */}
      <Box sx={{ p: 1.5, bgcolor: '#FFFFFF', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748B', mr: 1 }}>NAVIGATEUR :</Typography>
        <Autocomplete
          size="small"
          options={['401000 - Fournisseurs', '445710 - TVA', '607000 - Achats']}
          renderInput={(params) => (
            <TextField {...params} placeholder="Compte..." sx={{ width: 220, '& .MuiInputBase-root': { fontSize: '0.75rem', height: 32 }}} />
          )}
        />
        <Stack direction="row" spacing={0.5}>
          <IconButton size="small" sx={{ border: '1px solid #E2E8F0', borderRadius: '4px' }}><ChevronLeft fontSize="small" /></IconButton>
          <IconButton size="small" sx={{ border: '1px solid #E2E8F0', borderRadius: '4px' }}><ChevronRight fontSize="small" /></IconButton>
        </Stack>
      </Box>

      {/* TABLEAU AVEC ACTIONS */}
      <Box sx={{ height: 300, width: '100%' }}>
        <DataGrid
          rows={[]} 
          columns={[
            { field: 'date', headerName: 'Date', width: 95 },
            { field: 'piece', headerName: 'Pièce', width: 95 },
            { field: 'libelle', headerName: 'Libellé', flex: 1 },
            { field: 'debit', headerName: 'Débit', width: 110, type: 'number' },
            { field: 'credit', headerName: 'Crédit', width: 110, type: 'number' },
            {
              field: 'actions',
              headerName: 'Actions',
              width: 110,
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
          ]}
          density="compact"
          sx={dataGridStyle}
        />
      </Box>
    </Box>
  );
};

const dataGridStyle = {
  border: 'none',
  '& .MuiDataGrid-columnHeaders': {
    bgcolor: '#F8FAFC',
    fontSize: '0.65rem',
    textTransform: 'uppercase',
    fontWeight: 800,
    color: '#64748B'
  },
  '& .MuiDataGrid-cell': { fontSize: '0.8rem', borderBottom: '1px solid #F1F5F9' }
};

export default GlobalBalance;