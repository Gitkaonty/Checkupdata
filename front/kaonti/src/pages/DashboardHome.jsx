import React from 'react';
import { 
  Box, Typography, Grid, Paper, LinearProgress, 
  Stack, Divider, Chip, Breadcrumbs, Link, Button
} from '@mui/material';
import { 
  ErrorOutline, CheckCircleOutline, TrendingUpOutlined, 
  AccountBalanceWalletOutlined, PaymentsOutlined, 
  BarChartOutlined, ChevronRight,
  ArrowForwardOutlined, HistoryToggleOffOutlined
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();

  // Ratios financiers du dossier (Bandeau supérieur)
  const ratios = [
    { label: 'Chiffre d\'Affaires', value: '450 000 €', icon: <BarChartOutlined />, color: '#1E293B' },
    { label: 'Marge Brute', value: '65%', icon: <TrendingUpOutlined />, color: '#10B981' },
    { label: 'Résultat Net', value: '+ 42 300 €', icon: <CheckCircleOutline />, color: '#10B981' },
    { label: 'Trésorerie Totale', value: '85 200 €', icon: <AccountBalanceWalletOutlined />, color: '#0EA5E9' },
    { label: 'Dépenses Salariales', value: '120 000 €', icon: <PaymentsOutlined />, color: '#F43F5E' },
  ];

  // Liste enrichie des points de contrôle
  const pointsDeControle = [
    { nom: 'Revue analytique N / N-1', anomalies: 12, restantes: 2, status: 85 },
    { nom: 'Revue analytique mensuelle', anomalies: 0, restantes: 0, status: 100 },
    { nom: 'Contrôle global balance', anomalies: 45, restantes: 28, status: 40 },
    { nom: 'Analyse Fournisseurs / Clients', anomalies: 30, restantes: 12, status: 60 },
    { nom: 'Recherche de doublons', anomalies: 8, restantes: 1, status: 95 },
    { nom: 'Contrôle codes analytiques', anomalies: 50, restantes: 40, status: 20 },
    { nom: 'Écritures en suspens', anomalies: 15, restantes: 15, status: 0 },
  ];

  return (
    <Box sx={{ p: 4, bgcolor: '#FFFFFF', minHeight: '100%' }}>
      
      {/* --- HEADER CONTEXTUEL (Chip + Breadcrumb) --- */}
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1 }}>
        <Chip 
          label="Cabinet Randria & Associés" 
          sx={{ 
            borderRadius: '4px', // Rectangulaire comme demandé
            bgcolor: '#F1F5F9', 
            color: '#475569', 
            fontWeight: 700,
            fontSize: '0.72rem',
            border: '1px solid #E2E8F0',
            height: 24
          }} 
        />
        <Divider orientation="vertical" flexItem sx={{ height: 16, my: 'auto', borderColor: '#CBD5E1' }} />
        <Breadcrumbs separator={<ChevronRight sx={{ fontSize: 14 }} />} sx={{ fontSize: '0.8rem' }}>
          <Link underline="hover" color="inherit" href="/" sx={{ color: '#94A3B8' }}>Dossiers</Link>
          <Typography color="text.primary" sx={{ fontWeight: 600, color: '#64748B' }}>Dashboard</Typography>
        </Breadcrumbs>
      </Stack>

      <Typography variant="h4" sx={{ fontWeight: 900, color: '#0F172A', mb: 4, letterSpacing: '-0.5px' }}>
        Dashboard
      </Typography>

      {/* --- 1. BANDEAU DES RATIOS --- */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {ratios.map((ratio, index) => (
          <Grid item xs={12} sm={6} md={2.4} key={index}>
            <Paper elevation={0} sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: '12px', bgcolor: '#F8FAFC' }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                <Box sx={{ color: ratio.color, display: 'flex', '& svg': { fontSize: 18 } }}>{ratio.icon}</Box>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', textTransform: 'uppercase', fontSize: '0.6rem' }}>
                  {ratio.label}
                </Typography>
              </Stack>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A' }}>{ratio.value}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* --- 2. RÉSUMÉ DES ANOMALIES --- */}
      <Grid container spacing={3} sx={{ mb: 6 }}>
        <Grid item xs={12} md={4}>
          <KpiCard title="Total Anomalies" value="170" color="#EF4444" icon={<ErrorOutline />} />
        </Grid>
        <Grid item xs={12} md={4}>
          <KpiCard title="Restantes à valider" value="98" color="#F59E0B" icon={<HistoryToggleOffOutlined />} />
        </Grid>
        <Grid item xs={12} md={4}>
          <KpiCard title="Progression Globale" value="58%" color="#10B981" icon={<CheckCircleOutline />} progress={58} />
        </Grid>
      </Grid>

      {/* --- 3. ÉTAT DES CONTRÔLES SPÉCIFIQUES --- */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A' }}>
          État des contrôles spécifiques
        </Typography>
        <Button 
          endIcon={<ArrowForwardOutlined />}
          onClick={() => navigate('/controles/details')}
          sx={{ 
            textTransform: 'none', 
            color: '#10B981', 
            fontWeight: 700,
            fontSize: '0.9rem',
            '&:hover': { bgcolor: 'rgba(16, 185, 129, 0.05)' }
          }}
        >
          Voir les détails
        </Button>
      </Stack>
      
      <Grid container spacing={2}>
        {pointsDeControle.map((ctrl, index) => (
          <Grid item xs={12} md={6} lg={4} key={index}>
            <Paper elevation={0} sx={{ p: 2.5, border: '1px solid #E2E8F0', borderRadius: '12px', transition: '0.2s', '&:hover': { borderColor: '#10B981', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' } }}>
              <Typography variant="body2" sx={{ fontWeight: 700, color: '#1E293B', mb: 2 }}>
                {ctrl.nom}
              </Typography>
              
              <Stack direction="row" spacing={3} sx={{ mb: 2 }}>
                <Box>
                  <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', fontWeight: 600 }}>Anomalies</Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: ctrl.anomalies > 0 ? '#EF4444' : '#10B981' }}>
                    {ctrl.anomalies}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', fontWeight: 600 }}>Restantes</Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: ctrl.restantes > 0 ? '#F59E0B' : '#10B981' }}>
                    {ctrl.restantes}
                  </Typography>
                </Box>
                <Box sx={{ ml: 'auto', textAlign: 'right' }}>
                  <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', fontWeight: 600 }}>Progression</Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1E293B' }}>{ctrl.status}%</Typography>
                </Box>
              </Stack>

              <LinearProgress 
                variant="determinate" 
                value={ctrl.status} 
                sx={{ 
                  height: 6, 
                  borderRadius: 3, 
                  bgcolor: '#F1F5F9',
                  '& .MuiLinearProgress-bar': { 
                    bgcolor: ctrl.status === 100 ? '#10B981' : (ctrl.status < 30 ? '#EF4444' : '#3B82F6') 
                  }
                }} 
              />
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

// Composant Carte KPI (Anomalies / Progression)
const KpiCard = ({ title, value, color, icon, progress }) => (
  <Paper elevation={0} sx={{ p: 3, border: '1px solid #E2E8F0', borderRadius: '16px', bgcolor: '#F8FAFC' }}>
    <Stack direction="row" spacing={2} alignItems="center">
      <Box sx={{ p: 1.5, bgcolor: '#FFFFFF', color: color, borderRadius: '12px', display: 'flex', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', '& svg': { fontSize: 24 } }}>
        {icon}
      </Box>
      <Box>
        <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title}</Typography>
        <Typography variant="h4" sx={{ fontWeight: 900, color: '#0F172A', lineHeight: 1.2 }}>{value}</Typography>
      </Box>
    </Stack>
    {progress !== undefined && (
      <Box sx={{ mt: 2.5 }}>
        <LinearProgress variant="determinate" value={progress} sx={{ height: 6, borderRadius: 3, bgcolor: '#E2E8F0', '& .MuiLinearProgress-bar': { bgcolor: color } }} />
      </Box>
    )}
  </Paper>
);

export default Dashboard;