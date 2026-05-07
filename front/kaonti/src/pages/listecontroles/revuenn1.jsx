import React, { useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import {
  Box, Typography, Stack, IconButton, Tooltip, Divider, Chip, Badge, alpha,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { CheckCircle, Cancel, ErrorOutline } from '@mui/icons-material';
import CommentIcon from '@mui/icons-material/Comment';
import useAxiosPrivate from '../../hooks/useAxiosPrivate';
import CommentDialog from '../../components/commetDialog';
import ConfirmActionDialog from '../../components/ConfirmActionDialog';

const RevueAnalytiqueTable = forwardRef(function RevueAnalytiqueTable({ id_exercice, id_periode }, ref) {

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmDialogData, setConfirmDialogData] = useState({ row: null, checked: false });
  const [openCommentDialog, setOpenCommentDialog] = useState(false);
  const [commentLoading, setCommentLoading] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const axiosPrivate = useAxiosPrivate();

  const handleExportExcel = async () => {
    if (!id_exercice) return;
    try {
      const id_compte = parseInt(sessionStorage.getItem('compteId')) || 1;
      const id_dossier = parseInt(sessionStorage.getItem('fileId')) || 1;
      let url = `/dashboard/revuAnalytiqueNN1/${id_compte}/${id_dossier}/${id_exercice}/export/excel`;
      if (id_periode) url += `?id_periode=${id_periode}`;
      const response = await axiosPrivate.get(url, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `Revue_Analytique_${id_dossier}_${id_exercice}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting Excel:', error);
    }
  };

  const handleExportPdf = async () => {
    if (!id_exercice) return;
    try {
      const id_compte = parseInt(sessionStorage.getItem('compteId')) || 1;
      const id_dossier = parseInt(sessionStorage.getItem('fileId')) || 1;
      let url = `/dashboard/revuAnalytiqueNN1/${id_compte}/${id_dossier}/${id_exercice}/export/pdf`;
      if (id_periode) url += `?id_periode=${id_periode}`;
      const response = await axiosPrivate.get(url, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `Revue_Analytique_${id_dossier}_${id_exercice}.pdf`;
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
  }));

  const fetchRevuAnalytique = useCallback(async () => {
    try {
      setLoading(true);
      const id_compte = parseInt(sessionStorage.getItem('compteId')) || 1;
      const id_dossier = parseInt(sessionStorage.getItem('fileId')) || 1;

      if (!id_exercice) {
        setRows([]);
        return;
      }

      let url = `/dashboard/revuAnalytiqueNN1/${id_compte}/${id_dossier}/${id_exercice}`;
      if (id_periode) {
        url += `?id_periode=${id_periode}`;
      }

      const response = await axiosPrivate.get(url);

      if (response.data.state) {
        const formattedRows = response.data.data.map((row, index) => ({
          id: index,
          compte: row.compte,
          libelle: row.libelle,
          soldeN: row.soldeN,
          soldeN1: row.soldeN1,
          var: row.var,
          varPourcent: row.varPourcent,
          anomalies: row.anomalies,
          commentaire: row.commentaire,
          valide_anomalie: row.valide_anomalie
        }));
        setRows(formattedRows);
      }
    } catch (error) {
      console.error('Erreur:', error);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [axiosPrivate, id_exercice, id_periode]);

  useEffect(() => {
    if (id_exercice) {
      fetchRevuAnalytique();
    } else {
      setRows([]);
    }
  }, [fetchRevuAnalytique, id_exercice, id_periode]);

  // === Validation toggle avec confirmation ===
  const handleToggleValide = useCallback((row, checked) => {
    setConfirmDialogData({ row, checked });
    setConfirmDialogOpen(true);
  }, []);

  const handleConfirmValidation = async () => {
    const { row, checked } = confirmDialogData;
    if (!row) return;

    try {
      const id_compte = parseInt(sessionStorage.getItem('compteId')) || 1;
      const id_dossier = parseInt(sessionStorage.getItem('fileId')) || 1;

      await axiosPrivate.post('/revuAnalytiqueStats/validateAnomaly', {
        id_compte,
        id_dossier,
        id_exercice,
        id_periode: id_periode || null,
        compte: row.compte,
        type_revue: 'analytiqueNN1',
        validated: checked
      });

      await axiosPrivate.post('/commentaireAnalytique/addOrUpdate', {
        id_compte,
        id_dossier,
        id_exercice,
        id_periode: id_periode || null,
        compte: row.compte,
        commentaire: row.commentaire || '',
        valide_anomalie: checked
      });

      setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, valide_anomalie: checked } : r)));
    } catch (error) {
      console.error('Erreur lors de la validation anomalie:', error);
    } finally {
      setConfirmDialogOpen(false);
      setConfirmDialogData({ row: null, checked: false });
    }
  };

  // === Commentaire ===
  const handleSaveCommentaire = async (comment) => {
    if (!selectedRow) return;
    try {
      setCommentLoading(true);
      const id_compte = parseInt(sessionStorage.getItem('compteId')) || 1;
      const id_dossier = parseInt(sessionStorage.getItem('fileId')) || 1;

      const response = await axiosPrivate.post('/commentaireAnalytique/addOrUpdate', {
        id_compte,
        id_dossier,
        id_exercice,
        id_periode: id_periode || null,
        compte: selectedRow.compte,
        commentaire: comment,
        valide_anomalie: selectedRow.valide_anomalie || false
      });

      if (response.data.state) {
        setRows((prevRows) =>
          prevRows.map((row) =>
            row.compte === selectedRow.compte
              ? { ...row, commentaire: comment }
              : row
          )
        );
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du commentaire:', error);
    } finally {
      setCommentLoading(false);
      setOpenCommentDialog(false);
      setSelectedRow(null);
    }
  };

  // === Statistiques calculées ===
  const totalAnomalies = rows.filter(r => r.anomalies).length;
  const restantAValider = rows.filter(r => r.anomalies && !r.valide_anomalie).length;

  const columns = [
    {
      field: 'compte',
      headerName: 'Compte',
      width: 150,
      cellClassName: 'font-bold'
    },
    {
      field: 'libelle',
      headerName: 'Libellé',
      width: 350,
    },
    {
      field: 'soldeN1',
      headerName: 'Solde N-1',
      width: 130,
      type: 'number',
      align: 'right',
      headerAlign: 'right',
      renderCell: (params) => {
        const value = params.value;
        return (
          <Typography variant="body2" sx={{
            fontSize: '0.75rem', fontFamily: 'monospace',
            color: value > 0 ? '#2563eb' : value < 0 ? '#dc2626' : '#64748B',
            fontWeight: value !== 0 ? 600 : 400, width: '100%', textAlign: 'right'
          }}>
            {value?.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'}
          </Typography>
        );
      }
    },
    {
      field: 'soldeN',
      headerName: 'Solde N',
      width: 130,
      type: 'number',
      align: 'right',
      headerAlign: 'right',
      renderCell: (params) => {
        const value = params.value;
        return (
          <Typography variant="body2" sx={{
            fontSize: '0.75rem', fontFamily: 'monospace',
            color: value > 0 ? '#2563eb' : value < 0 ? '#dc2626' : '#64748B',
            fontWeight: value !== 0 ? 600 : 400, width: '100%', textAlign: 'right'
          }}>
            {value?.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'}
          </Typography>
        );
      }
    },
    {
      field: 'var',
      headerName: 'Variation',
      width: 120,
      type: 'number',
      align: 'right',
      headerAlign: 'right',
      renderCell: (params) => {
        const value = params.value;
        return (
          <Typography variant="body2" sx={{
            fontSize: '0.75rem', fontFamily: 'monospace',
            color: value > 0 ? '#2563eb' : value < 0 ? '#dc2626' : '#64748B',
            fontWeight: value !== 0 ? 600 : 400, width: '100%', textAlign: 'right'
          }}>
            {value?.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'}
          </Typography>
        );
      }
    },
    {
      field: 'varPourcent',
      headerName: 'Variation %',
      width: 120,
      type: 'number',
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => {
        const value = params.value;
        if (value === null || value === undefined) {
          return <Box sx={{ color: alpha('#64748B', 0.3), textAlign: 'center' }}>-</Box>;
        }
        return (
          <Chip
            label={`${value > 0 ? '+' : ''}${value}%`}
            size="small"
            variant="outlined"
            sx={{
              height: 22, minWidth: '55px', fontSize: '10px', fontWeight: 700, fontFamily: 'monospace',
              color: value > 0 ? '#2563eb' : value < 0 ? '#dc2626' : '#64748B',
              borderColor: value > 0 ? alpha('#2563eb', 0.5) : value < 0 ? alpha('#dc2626', 0.5) : alpha('#64748B', 0.3),
              bgcolor: value > 0 ? alpha('#2563eb', 0.04) : value < 0 ? alpha('#dc2626', 0.04) : 'transparent',
              '& .MuiChip-label': { px: 0.5, width: '100%', textAlign: 'center' }
            }}
          />
        );
      }
    },
    {
      field: 'anomalies',
      headerName: 'Anomalies',
      width: 90,
      align: 'center',
      renderCell: (params) => {
        const hasAnomaly = !!params.value;

        return (
          <Tooltip
            title={
              hasAnomaly
                ? 'Anomalie détectée (variation ≥ seuil du dossier)'
                : 'Aucune anomalie'
            }
            arrow
          >
            <IconButton
              size="small"
              disableRipple
              sx={{
                color: hasAnomaly ? '#16a34a' : '#EF4444', // rouge / vert
                cursor: 'default'
              }}
            >
              {hasAnomaly ? (
                <CheckCircle fontSize="small" />
              ) : (
                <Cancel fontSize="small" />
              )}
            </IconButton>
          </Tooltip>
        );
      }
    },
    {
      field: 'valide_anomalie',
      headerName: 'Validé',
      width: 80,
      align: 'center',
      renderCell: (params) => {
        const isValid = !!params.value;
        return (
          <Tooltip title={isValid ? 'Validé' : 'Non validé'} arrow>
            <IconButton
              size="small"
              onClick={() => handleToggleValide(params.row, !isValid)}
              color={isValid ? 'success' : 'error'}
              sx={{ p: 0, transition: '0.2s', '&:hover': { transform: 'scale(1.1)' } }}
            >
              {isValid ? <CheckCircle fontSize="small" /> : <Cancel fontSize="small" />}
            </IconButton>
          </Tooltip>
        );
      }
    },
    {
      field: 'commentaire',
      headerName: 'Commentaire',
      width: 200,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Badge
            variant={params.value && String(params.value).trim() ? 'dot' : 'standard'}
            overlap="circular"
            sx={{ '& .MuiBadge-badge': { backgroundColor: 'orange', color: 'orange' } }}
          >
            <Tooltip
              title={params.value || ''}
              arrow
              componentsProps={{
                tooltip: { sx: { backgroundColor: 'white', color: '#334155', fontSize: '12px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', maxWidth: 250 } },
                arrow: { sx: { color: 'white' } }
              }}
            >
              <span>
                <IconButton
                  size="small"
                  color="primary"
                  onClick={() => { setSelectedRow(params.row); setOpenCommentDialog(true); }}
                >
                  <CommentIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </Badge>
        </Box>
      )
    }
  ];

  return (
    <Box sx={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* STATISTIQUES */}
      <Stack direction="row" spacing={3} sx={{ p: 2, bgcolor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
        <Box>
          <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700 }}>ANOMALIES DÉTECTÉES</Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="h6" sx={{ color: '#EF4444', fontWeight: 900, lineHeight: 1 }}>{totalAnomalies}</Typography>
            <ErrorOutline sx={{ color: '#EF4444', fontSize: 16 }} />
          </Stack>
        </Box>
        <Divider orientation="vertical" flexItem />
        <Box>
          <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700 }}>RESTANT À VALIDER</Typography>
          <Typography variant="h6" sx={{ color: '#F59E0B', fontWeight: 900, lineHeight: 1 }}>{restantAValider}</Typography>
        </Box>
        <Divider orientation="vertical" flexItem />
        {/* <Box>
          <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700 }}>PÉRIODE</Typography>
          <Typography variant="h6" sx={{ color: '#3B82F6', fontWeight: 900, lineHeight: 1 }}>
            {id_periode ? `P${id_periode}` : 'Global'}
          </Typography>
        </Box> */}
        {/* <Divider orientation="vertical" flexItem />
        <Box>
          <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700 }}>TOTAL LIGNES</Typography>
          <Typography variant="h6" sx={{ color: '#6B7280', fontWeight: 900, lineHeight: 1 }}>{rows.length}</Typography>
        </Box> */}
      </Stack>

      {/* TABLEAU */}
      <Box sx={{ flexGrow: 1, width: '100%', overflow: 'hidden' }}>
        <DataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          density="compact"
          disableRowSelectionOnClick
          sx={{
            border: 'none',
            '& .MuiDataGrid-main': { overflow: 'auto' },
            '& .MuiDataGrid-columnHeaders': { bgcolor: '#F8FAFC', color: '#64748B', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase' },
            '& .MuiDataGrid-cell': { fontSize: '0.8rem', borderBottom: '1px solid #F1F5F9' },
            '& .font-bold': { fontWeight: 700 }
          }}
        />
      </Box>

      {/* Dialog de confirmation pour validation */}
      <ConfirmActionDialog
        open={confirmDialogOpen}
        onClose={() => { setConfirmDialogOpen(false); setConfirmDialogData({ row: null, checked: false }); }}
        onConfirm={handleConfirmValidation}
        title={confirmDialogData.checked ? 'Valider l\'anomalie' : 'Annuler la validation'}
        message={confirmDialogData.checked
          ? `Voulez-vous valider l'anomalie du compte ${confirmDialogData.row?.compte} ?`
          : `Voulez-vous annuler la validation du compte ${confirmDialogData.row?.compte} ?`}
        confirmText="Confirmer"
        cancelText="Annuler"
      />

      {/* Dialog commentaire */}
      <CommentDialog
        open={openCommentDialog}
        onClose={() => { setOpenCommentDialog(false); setSelectedRow(null); }}
        onSave={handleSaveCommentaire}
        initialValue={selectedRow?.commentaire || ''}
        title={`Commentaire - ${selectedRow?.compte || ''}`}
        placeholder="Saisissez votre commentaire..."
        loading={commentLoading}
      />
    </Box>
  );
});

export default RevueAnalytiqueTable;