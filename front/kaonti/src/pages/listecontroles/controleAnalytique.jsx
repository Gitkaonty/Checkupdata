import React, { useEffect, useState } from 'react';
import { 
  Box, Typography, Stack, Divider, IconButton, Paper, Tooltip, Chip, Button 
} from '@mui/material';
import { 
  CheckCircleOutline, 
  ChatBubbleOutline, 
  ErrorOutline,
  AssessmentOutlined,
  QueryStatsOutlined
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import axios from '../../../config/axios';
import useAxiosPrivate from '../../hooks/useAxiosPrivate';
import { useExercicePeriode } from '../../context/ExercicePeriodeContext';
import ConfirmActionDialog from '../../components/ConfirmActionDialog';

const ControleAnalytique = ({ id_exercice, id_periode }) => {
  const axiosPrivate = useAxiosPrivate();

  const {
    selectedExerciceId,
    selectedPeriodeId,
    selectedPeriodeDates,
    listePeriodes,
    currentExerciceDates,
  } = useExercicePeriode();

  const effectiveExerciceId = id_exercice ?? selectedExerciceId;
  const effectivePeriodeId = id_periode ?? selectedPeriodeId;

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const getIds = () => {
    return {
      id_compte: parseInt(sessionStorage.getItem('compteId')) || 1,
      id_dossier: parseInt(sessionStorage.getItem('fileId')) || 1,
      id_exercice: effectiveExerciceId || parseInt(sessionStorage.getItem('exerciceId')) || 1
    };
  };

  const resolveDates = async () => {
    if (selectedPeriodeDates?.date_debut && selectedPeriodeDates?.date_fin && String(effectivePeriodeId) === String(selectedPeriodeId)) {
      return {
        date_debut: selectedPeriodeDates.date_debut,
        date_fin: selectedPeriodeDates.date_fin
      };
    }

    if (effectivePeriodeId && effectivePeriodeId !== 'exercice') {
      const periodeFromContext = (listePeriodes || []).find(p => String(p.id) === String(effectivePeriodeId));
      if (periodeFromContext?.date_debut && periodeFromContext?.date_fin) {
        return {
          date_debut: periodeFromContext.date_debut,
          date_fin: periodeFromContext.date_fin
        };
      }

      if (effectiveExerciceId) {
        const response = await axios.get(`/paramExercice/listePeriodes/${effectiveExerciceId}`);
        if (response?.data?.state) {
          const periode = (response.data.list || []).find(p => String(p.id) === String(effectivePeriodeId));
          if (periode?.date_debut && periode?.date_fin) {
            return {
              date_debut: periode.date_debut,
              date_fin: periode.date_fin
            };
          }
        }
      }
    }

    if (currentExerciceDates?.date_debut && currentExerciceDates?.date_fin) {
      return {
        date_debut: currentExerciceDates.date_debut,
        date_fin: currentExerciceDates.date_fin
      };
    }

    return null;
  };

  const fetchResultats = async () => {
    if (!effectiveExerciceId) {
      setRows([]);
      return;
    }

    setLoading(true);
    try {
      const { id_compte, id_dossier, id_exercice } = getIds();
      const params = new URLSearchParams();
      if (effectivePeriodeId) params.append('id_periode', effectivePeriodeId);
      const queryString = params.toString();

      const url = `/administration/revisionAnalytique/${id_compte}/${id_dossier}/${id_exercice}${queryString ? `?${queryString}` : ''}`;
      const response = await axiosPrivate.get(url);
      if (response?.data?.state) {
        setRows(response.data.data || []);
      } else {
        setRows([]);
      }
    } catch (error) {
      console.error('Error fetching revision analytique results:', error);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  const handleControler = async () => {
    if (!effectiveExerciceId) return;
    if (!effectivePeriodeId || effectivePeriodeId === 'exercice') return;

    setLoading(true);
    try {
      const { id_compte, id_dossier, id_exercice } = getIds();
      const resolvedDates = await resolveDates();
      if (!resolvedDates?.date_debut || !resolvedDates?.date_fin) {
        setRows([]);
        return;
      }

      const params = new URLSearchParams();
      params.append('date_debut', resolvedDates.date_debut);
      params.append('date_fin', resolvedDates.date_fin);
      if (effectivePeriodeId) params.append('id_periode', effectivePeriodeId);
      const queryString = params.toString();

      const response = await axiosPrivate.post(`/administration/revisionAnalytique/${id_compte}/${id_dossier}/${id_exercice}?${queryString}`);
      if (response?.data?.state) {
        setRows(response.data.data || []);
      } else {
        setRows([]);
      }
    } catch (error) {
      console.error('Error executing revision analytique control:', error);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAskControler = () => {
    if (!effectiveExerciceId) return;
    if (!effectivePeriodeId || effectivePeriodeId === 'exercice') return;
    setConfirmOpen(true);
  };

  const handleConfirmControler = async () => {
    await handleControler();
    setConfirmOpen(false);
  };

  useEffect(() => {
    fetchResultats();
  }, [effectiveExerciceId, effectivePeriodeId]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', overflow: 'hidden' }}>
      
      {/* --- STATISTIQUES GLOBALES --- */}
      <Stack
        direction="row"
        spacing={3}
        sx={{
          p: 2,
          bgcolor: '#F8FAFC',
          borderBottom: '1px solid #E2E8F0',
          position: 'sticky',
          top: 0,
          zIndex: 2
        }}
      >
        <Box>
          <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700 }}>ERREURS D'IMPUTATION</Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="h6" sx={{ color: '#EF4444', fontWeight: 900, lineHeight: 1 }}>{rows.length}</Typography>
            <AssessmentOutlined sx={{ color: '#EF4444', fontSize: 18 }} />
          </Stack>
        </Box>
        <Divider orientation="vertical" flexItem />
        <Box>
          <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700 }}>NON RENSEIGNÉS</Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="h6" sx={{ color: '#F59E0B', fontWeight: 900, lineHeight: 1 }}>{rows.length}</Typography>
            <QueryStatsOutlined sx={{ color: '#F59E0B', fontSize: 18 }} />
          </Stack>
        </Box>
        <Divider orientation="vertical" flexItem />
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Button
            variant="contained"
            onClick={handleAskControler}
            disabled={!effectiveExerciceId || !effectivePeriodeId || effectivePeriodeId === 'exercice' || loading}
            sx={{
              height: '25px',
              bgcolor: '#064E3B',
              textTransform: 'none',
              fontWeight: 700,
              px: 3,
              borderRadius: '8px'
            }}
          >
            {loading ? 'Contrôle...' : 'Contrôler'}
          </Button>
        </Box>
      </Stack>

      <ConfirmActionDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmControler}
        title="Lancer le contrôle analytique"
        message="Voulez-vous lancer le contrôle analytique pour la période sélectionnée ?"
        confirmText="Lancer"
        cancelText="Annuler"
        loading={loading}
        color="#06b6d4"
      />

      <Box sx={{ p: 2, flexGrow: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* --- TABLEAU ANALYTIQUE --- */}
        <Paper
          variant="outlined"
          sx={{
            flexGrow: 1,
            minHeight: 0,
            borderRadius: '8px',
            overflow: 'hidden',
            bgcolor: '#FFFFFF',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <DataGrid
            rows={rows} // Données avec codes analytiques
            columns={[
              { field: 'date', headerName: 'Date', width: 120 },
              { field: 'compte', headerName: 'Compte', width: 150, cellClassName: 'font-bold' },
              { field: 'libelle', headerName: 'Libellé', flex: 1 },
              {
                field: 'debit',
                headerName: 'Débit',
                width: 130,
                align: 'right',
                headerAlign: 'right',
                valueFormatter: (params) => {
                  if (params.value === null || params.value === undefined) return '';
                  const n = Number(params.value);
                  if (Number.isNaN(n)) return '';
                  return n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                }
              },
              {
                field: 'credit',
                headerName: 'Crédit',
                width: 130,
                align: 'right',
                headerAlign: 'right',
                valueFormatter: (params) => {
                  if (params.value === null || params.value === undefined) return '';
                  const n = Number(params.value);
                  if (Number.isNaN(n)) return '';
                  return n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                }
              }
            ]}
            density="compact"
            sx={dataGridStyle}
            disableRowSelectionOnClick
            loading={loading}
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

export default ControleAnalytique;