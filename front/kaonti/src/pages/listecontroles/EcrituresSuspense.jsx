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

// ─── Système de design (aligné sur le tableau de bord) ───
const T = {
  ink: '#0E2733', canvas: '#F4F6F5', surface: '#FFFFFF', line: '#E2E6EA', ledger: '#EEF1F3',
  text: '#16202B', muted: '#6A7785', faint: '#9AA6B2',
  accent: '#0E7C86', accentDark: '#0a5d65', pos: '#1F8A70', warn: '#B5791A', neg: '#BE3A2F', accW: '#E2F0F1',
};
const NUM = { fontVariantNumeric: 'tabular-nums', fontFeatureSettings: '"tnum"' };
const CARD_SHADOW = '0 1px 2px rgba(16,39,51,.04), 0 8px 24px -16px rgba(16,39,51,.18)';
const statLabelSx = { fontSize: '10px', color: T.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.4px' };
const MoneyCell = ({ value }) => {
  const v = Number(value) || 0;
  if (!value) return <Typography sx={{ ...NUM, fontSize: '12.5px', width: '100%', textAlign: 'right', color: T.faint }}>—</Typography>;
  return (<Typography sx={{ ...NUM, fontSize: '12.5px', width: '100%', textAlign: 'right', color: v < 0 ? T.neg : T.text, fontWeight: 600 }}>
    {v.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/\s/g, ' ')}
  </Typography>);
};

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
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', bgcolor: T.canvas }}>

      {/* --- STATISTIQUES GLOBALES (Sous le titre) --- */}
      <Stack direction="row" spacing={3} sx={{ px: 2.5, py: 1.5, bgcolor: T.surface, borderBottom: `1px solid ${T.line}` }}>
        <Box>
          <Typography sx={statLabelSx}>Écritures en attente</Typography>
          <Stack direction="row" spacing={0.75} alignItems="center">
            <Typography sx={{ ...NUM, color: rows.length > 0 ? T.warn : T.pos, fontWeight: 800, fontSize: '20px', lineHeight: 1 }}>{rows.length}</Typography>
            <HourglassEmptyOutlined sx={{ color: rows.length > 0 ? T.warn : T.pos, fontSize: 18 }} />
          </Stack>
        </Box>
      </Stack>

      <Box sx={{ p: 2, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>

        {/* --- TABLEAU DES ÉCRITURES --- */}
        <Paper variant="outlined" sx={{ flexGrow: 1, borderRadius: '12px', overflow: 'hidden', bgcolor: T.surface, border: `1px solid ${T.line}`, boxShadow: CARD_SHADOW }}>
          <DataGrid
            rows={rows} // Données des comptes 47*
            columns={[
              { field: 'compte', headerName: 'Compte', width: 100, cellClassName: 'font-bold', renderCell: (p) => <Typography sx={{ ...NUM, fontSize: '13px', fontWeight: 700, color: T.ink }}>{p.value}</Typography> },
              { field: 'journal', headerName: 'Journal', width: 80 },
              { field: 'piece', headerName: 'Pièce', width: 110, renderCell: (p) => <Typography sx={{ ...NUM, fontSize: '12.5px', color: T.text }}>{p.value}</Typography> },
              { field: 'libelle', headerName: 'Libellé', flex: 1 },
              { field: 'debit', headerName: 'Débit', width: 120, type: 'number', align: 'right', headerAlign: 'right', renderCell: (p) => <MoneyCell value={p.value} /> },
              { field: 'credit', headerName: 'Crédit', width: 120, type: 'number', align: 'right', headerAlign: 'right', renderCell: (p) => <MoneyCell value={p.value} /> },
            ]}
            density="compact"
            sx={gridSx}
            disableRowSelectionOnClick
            loading={loading}
          />
        </Paper>
      </Box>
    </Box>
  );
});

const gridSx = {
  border: 'none', fontSize: '13px',
  '& .MuiDataGrid-columnHeaders': { bgcolor: T.ledger, borderBottom: `1px solid ${T.line}`,
    '& .MuiDataGrid-columnHeaderTitle': { fontSize: '11px', fontWeight: 700, color: T.muted, letterSpacing: '.3px', textTransform: 'uppercase' } },
  '& .MuiDataGrid-cell': { borderBottom: '1px solid #F1F4F6', color: T.text, '&:focus': { outline: 'none' } },
  '& .MuiDataGrid-row:hover': { bgcolor: '#FAFBFB' },
  '& .font-bold': { fontWeight: 700 },
};

export default EcrituresSuspense;