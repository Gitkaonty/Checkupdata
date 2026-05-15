import React, { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { 
  Box, Typography, Stack, Divider, IconButton, 
  Paper, Tooltip, Chip 
} from '@mui/material';

import { 
  CheckCircleOutline, 
  ChatBubbleOutline, 
  ErrorOutline,
  HourglassEmptyOutlined,
  HistoryToggleOffOutlined
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import axios from '../../../config/axios';
import useAxiosPrivate from '../../hooks/useAxiosPrivate';
import useAuth from '../../hooks/useAuth';
import { jwtDecode } from 'jwt-decode';
import { useExercicePeriode } from '../../context/ExercicePeriodeContext';

const EcrituresSuspense = forwardRef(({ id_exercice, id_periode }, ref) => {
  const axiosPrivate = useAxiosPrivate();
  const { auth } = useAuth();

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

  const getIds = () => {
    return {
      id_compte: parseInt(jwtDecode(auth?.accessToken)?.UserInfo?.compteId) || parseInt(sessionStorage.getItem('compteId')) || 1,
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

  const fetchRows = async () => {
    if (!effectiveExerciceId) {
      setRows([]);
      return;
    }

    setLoading(true);
    try {
      const { id_compte, id_dossier, id_exercice } = getIds();
      const resolvedDates = await resolveDates();
      const params = new URLSearchParams();
      if (resolvedDates?.date_debut) params.append('date_debut', resolvedDates.date_debut);
      if (resolvedDates?.date_fin) params.append('date_fin', resolvedDates.date_fin);
      if (effectivePeriodeId) params.append('id_periode', effectivePeriodeId);

      const queryString = params.toString();
      const url = `/administration/ecrituresSuspense/${id_compte}/${id_dossier}/${id_exercice}${queryString ? `?${queryString}` : ''}`;

      const response = await axiosPrivate.get(url);
      if (response?.data?.state) {
        setRows(response.data.data || []);
      } else {
        setRows([]);
      }
    } catch (error) {
      console.error('Error fetching ecritures suspense:', error);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = async () => {
    if (!effectiveExerciceId) return;
    try {
      const { id_compte, id_dossier, id_exercice } = getIds();
      const resolvedDates = await resolveDates();
      const params = new URLSearchParams();
      if (resolvedDates?.date_debut) params.append('date_debut', resolvedDates.date_debut);
      if (resolvedDates?.date_fin) params.append('date_fin', resolvedDates.date_fin);
      if (effectivePeriodeId) params.append('id_periode', effectivePeriodeId);
      const url = `/administration/ecrituresSuspense/${id_compte}/${id_dossier}/${id_exercice}/export/excel?${params.toString()}`;
      const response = await axiosPrivate.get(url, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `Ecritures_Suspense_${id_dossier}_${id_exercice}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting Excel:', error);
    }
  };

  const handleExportPdf = async () => {
    if (!effectiveExerciceId) return;
    try {
      const { id_compte, id_dossier, id_exercice } = getIds();
      const resolvedDates = await resolveDates();
      const params = new URLSearchParams();
      if (resolvedDates?.date_debut) params.append('date_debut', resolvedDates.date_debut);
      if (resolvedDates?.date_fin) params.append('date_fin', resolvedDates.date_fin);
      if (effectivePeriodeId) params.append('id_periode', effectivePeriodeId);
      const url = `/administration/ecrituresSuspense/${id_compte}/${id_dossier}/${id_exercice}/export/pdf?${params.toString()}`;
      const response = await axiosPrivate.get(url, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `Ecritures_Suspense_${id_dossier}_${id_exercice}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting PDF:', error);
    }
  };

  useImperativeHandle(ref, () => ({
    exportExcel: handleExportExcel,
    exportPdf: handleExportPdf
  }), [effectiveExerciceId, effectivePeriodeId]);

  useEffect(() => {
    fetchRows();
  }, [effectiveExerciceId, effectivePeriodeId, selectedPeriodeDates, currentExerciceDates]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
      
      {/* --- STATISTIQUES GLOBALES (Sous le titre) --- */}
      <Stack direction="row" spacing={3} sx={{ p: 2, bgcolor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
        <Box>
          <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700 }}>ÉCRITURES EN ATTENTE</Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="h6" sx={{ color: '#EF4444', fontWeight: 900, lineHeight: 1 }}>{rows.length}</Typography>
            <HourglassEmptyOutlined sx={{ color: '#EF4444', fontSize: 18 }} />
          </Stack>
        </Box>
      </Stack>

      <Box sx={{ p: 2, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        
        {/* --- TABLEAU DES ÉCRITURES (Même style que Doublons) --- */}
        <Paper variant="outlined" sx={{ flexGrow: 1, borderRadius: '8px', overflow: 'hidden', bgcolor: '#FFFFFF' }}>
          <DataGrid
            rows={rows} // Données des comptes 47*
            columns={[
              { field: 'compte', headerName: 'Compte', width: 100, cellClassName: 'font-bold' },
              { field: 'journal', headerName: 'Journal', width: 80 },
              { field: 'piece', headerName: 'Pièce', width: 110 },
              { field: 'libelle', headerName: 'Libellé', flex: 1 },
              { field: 'debit', headerName: 'Débit', width: 120, type: 'number' },
              { field: 'credit', headerName: 'Crédit', width: 120, type: 'number' },
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
});

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

export default EcrituresSuspense;