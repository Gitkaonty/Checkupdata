import React, { useState } from 'react';
import { 
  Box, Typography, Stack, Tabs, Tab, Paper, 
  Divider, Button, Chip, Breadcrumbs, Link as MuiLink,
  Select,
  MenuItem
} from '@mui/material';
import { 
  CompareArrowsOutlined, CalendarMonthOutlined, AccountBalanceOutlined,
  PeopleAltOutlined, ContentCopyOutlined, HelpOutline,
  LabelOutlined, ChevronRight, FileDownloadOutlined, FilterListOutlined
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import { Link, useNavigate } from 'react-router-dom';
import RevueAnalytiqueTable from './listecontroles/revuenn1';
import RevueMensuelleTable from './listecontroles/revuemensuelle';
import GlobalBalance from './listecontroles/controleglobal';
import AnalyseTiers from './listecontroles/analyseTiers';
import RechercheDoublons from './listecontroles/rechercheDoublon';
import EcrituresSuspense from './listecontroles/EcrituresSuspense';
import ControleAnalytique from './listecontroles/controleAnalytique';

const DetailsControles = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [exercise, setExercise] = useState('2024');
  const [periode, setPeriode] = useState('2024');
  const navigate = useNavigate();

  const handleTabChange = (event, newValue) => setActiveTab(newValue);

  const menuControles = [
    { label: 'Revue Analytique N/N-1', icon: <CompareArrowsOutlined sx={{ fontSize: 20 }} /> },
    { label: 'Revue Mensuelle', icon: <CalendarMonthOutlined sx={{ fontSize: 20 }} /> },
    { label: 'Contrôle Global Balance', icon: <AccountBalanceOutlined sx={{ fontSize: 20 }} /> },
    { label: 'Analyse Frns / Clients', icon: <PeopleAltOutlined sx={{ fontSize: 20 }} /> },
    { label: 'Recherche Doublons', icon: <ContentCopyOutlined sx={{ fontSize: 20 }} /> },
    { label: 'Écritures en suspens', icon: <HelpOutline sx={{ fontSize: 20 }} /> },
    { label: 'Codes Analytiques', icon: <LabelOutlined sx={{ fontSize: 20 }} /> },
  ];

  return (
    <Box sx={{ p: 0.5, bgcolor: '#FFFFFF', minHeight: '100vh', maxWidth:'92vw' }}>
      
      {/* --- HEADER CONTEXTUEL (Identique au Dashboard) --- */}
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1 }}>
        <Chip 
          label="Cabinet Randria & Associés" 
          sx={{ 
            borderRadius: '4px', 
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
          <MuiLink component={Link} to="/" underline="hover" color="inherit" sx={{ color: '#94A3B8' }}>Dossiers</MuiLink>
          <MuiLink component={Link} to="/dashboard" underline="hover" color="inherit" sx={{ color: '#94A3B8' }}>Dashboard</MuiLink>
          <Typography sx={{ fontWeight: 600, color: '#64748B' }}>Détails des contrôles</Typography>
        </Breadcrumbs>
      </Stack>

      <Typography variant="h4" sx={{ fontWeight: 900, color: '#0F172A', mb: 4, letterSpacing: '-0.5px' }}>
        Détails des contrôles
      </Typography>

      <Stack 
        direction="row" 
        alignItems="center" 
        sx={{ 
          mb: 3, 
          p: 0.5, 
          bgcolor: '#FFFFFF', 
          borderRadius: '10px', 
          border: '1px solid #E2E8F0',
          width: 'fit-content',
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
        }}
      >
        {/* BLOC EXERCICE */}
        <Box sx={{ px: 2, py: 0.5 }}>
          <Typography 
            variant="caption" 
            sx={{ 
              fontWeight: 800, 
              color: '#94A3B8', 
              display: 'block', 
              mb: 0, 
              textTransform: 'uppercase', 
              fontSize: '0.55rem',
              letterSpacing: '0.02rem'
            }}
          >
            Exercice
          </Typography>
          <Select 
            value={exercise} 
            onChange={(e) => setExercise(e.target.value)} 
            variant="standard"
            disableUnderline
            size="small" 
            sx={{ 
              height: 24, 
              fontSize: '0.8rem', 
              fontWeight: 700, 
              color: '#1E293B',
              minWidth: 100,
              '& .MuiSelect-select': { py: 0 }
            }}
          >
            <MenuItem value="2024">Exercice 2024</MenuItem>
            <MenuItem value="2025">Exercice 2025</MenuItem>
          </Select>
        </Box>

        <Divider orientation="vertical" flexItem sx={{ height: 28, alignSelf: 'center', borderColor: '#E2E8F0' }} />

        {/* BLOC PÉRIODE */}
        <Box sx={{ px: 2, py: 0.5 }}>
          <Typography 
            variant="caption" 
            sx={{ 
              fontWeight: 800, 
              color: '#94A3B8', 
              display: 'block', 
              mb: 0, 
              textTransform: 'uppercase', 
              fontSize: '0.55rem',
              letterSpacing: '0.02rem'
            }}
          >
            Période
          </Typography>
          <Select 
            value={periode} 
            onChange={(e) => setPeriode(e.target.value)} 
            variant="standard"
            disableUnderline
            size="small" 
            sx={{ 
              height: 24, 
              fontSize: '0.8rem', 
              fontWeight: 700, 
              color: '#1E293B',
              minWidth: 140,
              '& .MuiSelect-select': { py: 0 }
            }}
          >
            <MenuItem value="01-2024">Janvier 2024</MenuItem>
            <MenuItem value="02-2024">Février 2024</MenuItem>
            <MenuItem value="T1-2024">Trimestre 1 2024</MenuItem>
          </Select>
        </Box>
      </Stack>

      {/* --- ZONE PRINCIPALE : SIDEBAR + CONTENU --- */}
      <Box sx={{ display: 'flex', border: '1px solid #E2E8F0', borderRadius: '16px', overflow: 'hidden', height: '70vh' }}>
        
        {/* SIDEBAR GAUCHE ALIGNÉE */}
        <Box sx={{ width: 280, bgcolor: '#F8FAFC', borderRight: '1px solid #E2E8F0', py: 2 }}>
          <Tabs
            orientation="vertical"
            value={activeTab}
            onChange={handleTabChange}
            sx={{
              '& .MuiTabs-indicator': { left: 0, width: 3, borderRadius: '0 4px 4px 0', bgcolor: '#10B981' },
              '& .MuiTab-root': { 
                justifyContent: 'flex-start', 
                textTransform: 'none',
                minHeight: 52,
                color: '#64748B',
                fontSize: '0.85rem',
                fontWeight: 600,
                px: 3,
                textAlign: 'left',
                '&.Mui-selected': { color: '#10B981', bgcolor: 'rgba(16, 185, 129, 0.05)' },
                '& .MuiTab-iconWrapper': { 
                    marginRight: '12px',
                    minWidth: '24px', // Aligne les textes verticalement
                    display: 'flex',
                    justifyContent: 'center'
                }
              }
            }}
          >
            {menuControles.map((item, index) => (
              <Tab key={index} icon={item.icon} iconPosition="start" label={item.label} />
            ))}
          </Tabs>
        </Box>

        {/* ZONE DE TABLEAU À DROITE */}
        <Box sx={{ 
            flexGrow: 1, 
            display: 'flex', 
            flexDirection: 'column', 
            minWidth: 0, // CRUCIAL : permet au conteneur de rétrécir plus petit que son contenu
            overflow: 'hidden', // Empêche le débordement sur la sidebar
            bgcolor: '#FFFFFF'
            }}>
            {/* Header interne (Titre + Filtres) */}
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ p: 2, borderBottom: '1px solid #F1F5F9' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1E293B' }}>
                {menuControles[activeTab].label}
                </Typography>
                <Stack direction="row" spacing={1}>
                    <Button size="small" startIcon={<FilterListOutlined />} sx={{ color: '#64748B', textTransform: 'none' }}>Filtres</Button>
                    <Button size="small" startIcon={<FileDownloadOutlined />} sx={{ color: '#10B981', textTransform: 'none' }}>Export</Button>
                </Stack>
            </Stack>

            {/* Conteneur spécifique pour le tableau */}
            <Box sx={{ 
                flexGrow: 1, 
                width: '100%', // S'occupe de remplir l'espace restant sans dépasser
                height: '100%',
                position: 'relative'
            }}>
                 {activeTab === 0 && <RevueAnalytiqueTable />}
                {activeTab === 1 && <RevueMensuelleTable />}
                {activeTab === 2 && <GlobalBalance />}
                {activeTab === 3 && <AnalyseTiers />}
                {activeTab === 4 && <RechercheDoublons />}
                {activeTab === 5 && <EcrituresSuspense />}
                {activeTab === 6 && <ControleAnalytique />}
            </Box>
            </Box>
      </Box>
    </Box>
  );
};

const dataGridStyle = {
  border: 'none',
  '& .MuiDataGrid-columnHeaders': {
    bgcolor: '#F8FAFC',
    color: '#64748B',
    fontSize: '0.7rem',
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: 700,
    borderBottom: '1px solid #E2E8F0',
  },
  '& .MuiDataGrid-cell': {
    borderBottom: '1px solid #F1F5F9',
    fontSize: '0.85rem',
    '&:focus': { outline: 'none' }
  },
};

export default DetailsControles;