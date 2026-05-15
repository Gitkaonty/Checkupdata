import React, { useState, useEffect, useCallback, useRef, forwardRef, useImperativeHandle } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Box,
  Button,
  Typography,
  Stack,
  FormControl,
  Select,
  MenuItem,
  Paper,
  IconButton,
  alpha,
  Badge,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Breadcrumbs,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import {
  CheckCircleOutline,
  ChatBubbleOutline,
  CheckCircle,
  Cancel,
  ErrorOutline
} from '@mui/icons-material';
import useAxiosPrivate from '../../hooks/useAxiosPrivate';
import useAuth from '../../hooks/useAuth';
import { jwtDecode } from 'jwt-decode';
import { useExercicePeriode } from '../../context/ExercicePeriodeContext';
import CommentDialog from '../../components/commetDialog';
import ConfirmActionDialog from '../../components/ConfirmActionDialog';
import CommentIcon from '@mui/icons-material/Comment';

// Format date as dd-mm-yy
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yy = String(date.getFullYear()).slice(-2);
  return `${dd}/${mm}/${yy}`;
};

const RevueMensuelleTable = forwardRef(function RevueMensuelleTable({ id_exercice: id_exercice_prop, id_periode: id_periode_prop }, ref) {
  const NAV_DARK = '#0B1120';
  const BG_SOFT = '#F8FAFC';
  const axiosPrivate = useAxiosPrivate();
  const navigate = useNavigate();
  const { auth } = useAuth();
  const { id_compte, id_dossier } = useParams();
  const [searchParams] = useSearchParams();

  const id_compte_val = parseInt(jwtDecode(auth?.accessToken)?.UserInfo?.compteId) || parseInt(id_compte) || parseInt(sessionStorage.getItem('compteId')) || 1;
  const id_dossier_val = parseInt(id_dossier) || parseInt(sessionStorage.getItem('fileId')) || 1;

  const handleExportExcel = async () => {
    if (!id_exercice_prop) return;
    try {
      let url = `/dashboard/revuAnalytiqueMensuelle/${id_compte_val}/${id_dossier_val}/${id_exercice_prop}/export/excel`;
      if (id_periode_prop) url += `?id_periode=${id_periode_prop}`;
      const response = await axiosPrivate.get(url, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `Revue_Mensuelle_${id_dossier_val}_${id_exercice_prop}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting Excel:', error);
    }
  };

  const handleExportPdf = async () => {
    if (!id_exercice_prop) return;
    try {
      let url = `/dashboard/revuAnalytiqueMensuelle/${id_compte_val}/${id_dossier_val}/${id_exercice_prop}/export/pdf`;
      if (id_periode_prop) url += `?id_periode=${id_periode_prop}`;
      const response = await axiosPrivate.get(url, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `Revue_Mensuelle_${id_dossier_val}_${id_exercice_prop}.pdf`;
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

  // Récupérer les paramètres d'URL si présents
  const urlDateDebut = searchParams.get('date_debut');
  const urlDateFin = searchParams.get('date_fin');

  const [listeExercice, setListeExercice] = useState([]);
  const [fileInfos, setFileInfos] = useState(null);
  const [loading, setLoading] = useState(false);
  const [noFile, setNoFile] = useState(false);
  const [fileId, setFileId] = useState(parseInt(id_dossier) || 0);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmDialogData, setConfirmDialogData] = useState({ row: null, checked: false, type: '' });

  // === Dialog commentaire ===
  const [openCommentDialog, setOpenCommentDialog] = useState(false);
  const [commentLoading, setCommentLoading] = useState(false);

  // === Données du tableau ===
  const [rows, setRows] = useState([]);
  const [moisColumns, setMoisColumns] = useState([]);
  const [popupOpen, setPopupOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const scrollContainerRef = useRef(null);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const {
    selectedExerciceId,
    selectedPeriodeId,
    selectedPeriodeDates,
    currentExerciceDates,
    listePeriodes: periodesFromContext,
  } = useExercicePeriode();

  // Utiliser les props de DetailsControles, sinon le contexte
  const effectiveExerciceId = id_exercice_prop ?? selectedExerciceId;
  const effectivePeriodeId = id_periode_prop ?? selectedPeriodeId;

  const sendToHome = (value) => {
    setNoFile(!value);
    navigate('/tab/home');
  };

  // Vérifier si un dossier est sélectionné au chargement
  useEffect(() => {
    const idDossier = id_dossier || sessionStorage.getItem('fileId');
    if (!idDossier || idDossier === '0') {
      setNoFile(true);
    } else {
      setFileId(parseInt(idDossier));
      setNoFile(false);
    }
  }, [id_dossier]);

  const getIds = useCallback(() => {
    return {
      id_compte: parseInt(jwtDecode(auth?.accessToken)?.UserInfo?.compteId) || parseInt(id_compte) || parseInt(sessionStorage.getItem('compteId')) || 1,
      id_dossier: parseInt(id_dossier) || fileId || parseInt(sessionStorage.getItem('fileId')) || 1,
      id_exercice: effectiveExerciceId || parseInt(sessionStorage.getItem('exerciceId')) || 1
    };
  }, [id_compte, id_dossier, fileId, effectiveExerciceId]);

  const fetchExercices = useCallback(async () => {
    try {
      const { id_dossier } = getIds();
      const response = await axiosPrivate.get(`/paramExercice/listeExercice/${id_dossier}`);
      const resData = response.data;
      if (resData.state) {
        setListeExercice(resData.list);
        // Sélectionner l'exercice correspondant aux dates URL ou le premier
        if (resData.list && resData.list.length > 0) {
          if (urlDateDebut && urlDateFin) {
            const matchingExercice = resData.list.find(e =>
              e.date_debut === urlDateDebut && e.date_fin === urlDateFin
            );
            if (matchingExercice) {
              setSelectedExerciceId(matchingExercice.id);
            } else {
              setSelectedExerciceId(resData.list[0].id);
            }
          } else if (selectedExerciceId === 0) {
            setSelectedExerciceId(resData.list[0].id);
          }
        }
      } else {
        console.error('[RevuAnalytiqueMensuelleDetail] Erreur dans la réponse exercices - state false:', resData);
      }
    } catch (error) {
      console.error('[RevuAnalytiqueMensuelleDetail] Error fetching exercices:', error);
      console.error('[RevuAnalytiqueMensuelleDetail] Détails erreur:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
    }
  }, [axiosPrivate, getIds, urlDateDebut, urlDateFin, selectedExerciceId]);

  const fetchDossierInfos = useCallback(async () => {
    try {
      const { id_dossier } = getIds();
      const response = await axiosPrivate.get(`/home/FileInfos/${id_dossier}`);
      const resData = response.data;
      if (resData.state && resData.fileInfos && resData.fileInfos.length > 0) {
        setFileInfos(resData.fileInfos[0]);
      } else {
        console.error('[RevuAnalytiqueMensuelleDetail] Erreur dans la réponse infos dossier - state false ou fileInfos vide:', resData);
      }
    } catch (error) {
      console.error('[RevuAnalytiqueMensuelleDetail] Error fetching dossier infos:', error);
      console.error('[RevuAnalytiqueMensuelleDetail] Détails erreur:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
    }
  }, [axiosPrivate, getIds]);

  const resolveDatesForAnalysis = useCallback(async () => {
    if (selectedPeriodeDates?.date_debut && selectedPeriodeDates?.date_fin) {
      return {
        date_debut: selectedPeriodeDates.date_debut,
        date_fin: selectedPeriodeDates.date_fin
      };
    }

    if (effectivePeriodeId && effectivePeriodeId !== 'exercice') {
      const periodeFromContext = (periodesFromContext || []).find(p => String(p.id) === String(effectivePeriodeId));
      if (periodeFromContext?.date_debut && periodeFromContext?.date_fin) {
        return {
          date_debut: periodeFromContext.date_debut,
          date_fin: periodeFromContext.date_fin
        };
      }

      if (effectiveExerciceId) {
        const response = await axiosPrivate.get(`/paramExercice/listePeriodes/${effectiveExerciceId}`);
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
  }, [selectedPeriodeDates, effectivePeriodeId, effectiveExerciceId, currentExerciceDates, periodesFromContext, axiosPrivate]);

  useEffect(() => {
    fetchDossierInfos();
  }, [fetchDossierInfos]);

  // Récupérer les données de la revue analytique mensuelle
  useEffect(() => {
    const fetchRevuAnalytiqueMensuelle = async () => {
      try {
        setLoading(true);
        const { id_compte, id_dossier } = getIds();

        // Ne pas faire l'appel si l'exerciceId n'est pas valide
        if (!effectiveExerciceId) {
          console.error('[RevuAnalytiqueMensuelleDetail] effectiveExerciceId invalide - annulation de la requête');
          setRows([]);
          setMoisColumns([]);
          return;
        }

        let url = `/dashboard/revuAnalytiqueMensuelle/${id_compte}/${id_dossier}/${effectiveExerciceId}`;

        const resolvedDates = await resolveDatesForAnalysis();
        if (resolvedDates) {
          url += `?date_debut=${resolvedDates.date_debut}&date_fin=${resolvedDates.date_fin}`;
          if (effectivePeriodeId) {
            url += `&id_periode=${effectivePeriodeId}`;
          }
        }

        const response = await axiosPrivate.get(url);

        if (response.data.state) {
          setRows(response.data.data);
          setMoisColumns(response.data.moisColumns || []);
        } else {
          console.error('[RevuAnalytiqueMensuelleDetail] Erreur dans la réponse revue analytique mensuelle - state false:', response.data);
          setRows([]);
          setMoisColumns([]);
        }
      } catch (error) {
        console.error('[RevuAnalytiqueMensuelleDetail] Erreur lors de la récupération des données mensuelles:', error);
        console.error('[RevuAnalytiqueMensuelleDetail] Détails erreur:', {
          message: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data
        });
        setRows([]);
        setMoisColumns([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRevuAnalytiqueMensuelle();
  }, [axiosPrivate, getIds, effectiveExerciceId, effectivePeriodeId, resolveDatesForAnalysis]);

  const handleToggleAnomalie = useCallback(
    (row, checked) => {
      // Ouvrir la popup de confirmation pour anomalie
      setConfirmDialogData({ row, checked, type: 'anomalie' });
      setConfirmDialogOpen(true);
    },
    []
  );

  const handleConfirmAnomalie = async () => {
    const { row, checked } = confirmDialogData;
    if (!row) return;

    try {
      const { id_compte, id_dossier, id_exercice } = getIds();
      const id_periode = effectivePeriodeId || null;

      // Appeler l'API RevuAnalytique pour incrémenter/décrémenter
      const endpoint = checked ? '/revuAnalytiqueStats/incrementAnomaly' : '/revuAnalytiqueStats/decrementAnomaly';
      await axiosPrivate.post(endpoint, {
        id_compte: id_compte,
        id_exercice: id_exercice,
        id_dossier: id_dossier,
        id_periode: id_periode,
        compte: row.compte,
        type_revue: 'analytiqueMensuelle'
      });

      // Mettre à jour le commentaire avec anomalies et id_periode
      await axiosPrivate.post('/commentaireAnalytiqueMensuelle/addOrUpdate', {
        id_compte: id_compte,
        id_exercice: id_exercice,
        id_dossier: id_dossier,
        id_periode: id_periode,
        compte: row.compte,
        commentaire: row.commentaire || '',
        anomalies: checked,
        valide_anomalie: row.valide_anomalie
      });

      setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, anomalies: checked } : r)));
    } catch (error) {
      console.error('Erreur lors de la mise à jour anomalie:', error);
    } finally {
      setConfirmDialogOpen(false);
      setConfirmDialogData({ row: null, checked: false, type: '' });
    }
  };

  const handleToggleValide = useCallback(
    (row, checked) => {
      // Ouvrir la popup de confirmation pour validation
      setConfirmDialogData({ row, checked, type: 'validation' });
      setConfirmDialogOpen(true);
    },
    []
  );

  const handleConfirmValidation = async () => {
    const { row, checked } = confirmDialogData;
    if (!row) return;

    try {
      const { id_compte, id_dossier, id_exercice } = getIds();

      await axiosPrivate.post('/revuAnalytiqueStats/validateAnomaly', {
        id_compte: id_compte,
        id_exercice: id_exercice,
        id_dossier: id_dossier,
        id_periode: effectivePeriodeId || null,
        compte: row.compte,
        type_revue: 'analytiqueMensuelle',
        validated: checked
      });

      await axiosPrivate.post('/commentaireAnalytiqueMensuelle/addOrUpdate', {
        id_compte: id_compte,
        id_exercice: id_exercice,
        id_dossier: id_dossier,
        id_periode: effectivePeriodeId || null,
        compte: row.compte,
        commentaire: row.commentaire || '',
        anomalies: row.anomalies,
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

  const handleCancelValidation = () => {
    setConfirmDialogOpen(false);
    setConfirmDialogData({ row: null, checked: false });
  };

  const handleSaveCommentaire = async (comment) => {
    if (!selectedRow) return;
    try {
      setCommentLoading(true);
      const { id_compte, id_dossier, id_exercice } = getIds();
      const id_periode = effectivePeriodeId || null;

      const response = await axiosPrivate.post('/commentaireAnalytiqueMensuelle/addOrUpdate', {
        id_compte: id_compte,
        id_exercice: id_exercice,
        id_dossier: id_dossier,
        id_periode: id_periode,
        compte: selectedRow.compte,
        commentaire: comment,
        anomalies: selectedRow.anomalies || false,
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

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Calcul des lignes à afficher pour la page courante
  const displayedRows = rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  // Build dynamic columns based on API moisColumns
  const columns = [
    {
      field: 'compte',
      headerName: 'Compte',
      width: 90,
      headerClassName: 'sticky-header',
      cellClassName: 'font-bold sticky-cell'
    },
    {
      field: 'libelle',
      headerName: 'Libellé',
      width: 300,
      headerClassName: 'sticky-header',
      cellClassName: 'sticky-cell'
    },
    {
      field: 'total_exercice',
      headerName: 'TOTAL',
      width: 110,
      type: 'number',
      cellClassName: 'total-cell',
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 800, fontFamily: 'monospace' }}>
          {params.value?.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'}
        </Typography>
      )
    },
    ...moisColumns.map((mois) => ({
      field: mois.nom,
      headerName: mois.nomAffiche,
      width: 110,
      type: 'number',
      renderCell: (params) => {
        const value = params.value;
        return (
          <Typography variant="body2" sx={{
            fontSize: '0.75rem',
            fontFamily: 'monospace',
            color: value > 0 ? '#2563eb' : value < 0 ? '#dc2626' : '#64748B',
            fontWeight: value !== 0 ? 600 : 400
          }}>
            {value?.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'}
          </Typography>
        );
      }
    })),
    {
      field: 'anomalies',
      headerName: 'Anomalies',
      width: 80,
      align: 'center',
      // renderCell: (params) => (
      //   <Checkbox
      //     size="small"
      //     checked={!!params.value}
      //     onChange={(e) => handleToggleAnomalie(params.row, e.target.checked)}
      //     sx={{
      //       p: 0,
      //       color: params.value ? 'orange' : 'green',
      //       '&.Mui-checked': { color: 'orange' }
      //     }}
      //   />
      // )
      renderCell: (params) => {
        const hasAnomaly = !!params.value;

        return (
          <Tooltip
            title={hasAnomaly ? 'Anomalie détectée' : 'Aucune anomalie'}
            arrow
          >
            <IconButton
              size="small"
              onClick={() => handleToggleAnomalie(params.row, !hasAnomaly)}
              color={hasAnomaly ? 'success' : 'error'}
              sx={{
                transition: '0.2s',
                '&:hover': {
                  transform: 'scale(1.1)'
                }
              }}
            >
              {hasAnomaly ? (
                <CheckCircle fontSize="small" />
              ) : (
                <Cancel fontSize="small" />
              )}
            </IconButton>
          </Tooltip >
        );
      }
    },
    {
      field: 'valide_anomalie',
      headerName: 'Validé',
      width: 70,
      align: 'center',
      renderCell: (params) => {
        const isValid = !!params.value;

        return (
          <Tooltip
            title={isValid ? 'Validé' : 'Non validé'}
            arrow
          >
            <IconButton
              size="small"
              onClick={() => handleToggleValide(params.row, !isValid)}
              color={isValid ? 'success' : 'error'}
              sx={{
                p: 0,
                transition: '0.2s',
                '&:hover': {
                  transform: 'scale(1.1)'
                }
              }}
            >
              {isValid ? (
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
      field: 'commentaire',
      headerName: 'Commentaire',
      width: 200,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Badge
            variant={params.value && String(params.value).trim() ? 'dot' : 'standard'}
            overlap="circular"
            sx={{
              '& .MuiBadge-badge': {
                backgroundColor: 'orange',
                color: 'orange'
              }
            }}
          >
            <Tooltip
              title={params.value || ''}
              arrow
              componentsProps={{
                tooltip: {
                  sx: {
                    backgroundColor: 'white',
                    color: '#334155',
                    fontSize: '12px',
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    maxWidth: 250
                  }
                },
                arrow: {
                  sx: {
                    color: 'white'
                  }
                }
              }}
            >
              <span>
                <IconButton
                  size="small"
                  color="primary"
                  onClick={() => {
                    setSelectedRow(params.row);
                    setOpenCommentDialog(true);
                  }}
                >
                  <CommentIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </Badge>

          {/* <Typography
            sx={{
              fontSize: '11px',
              color: '#64748B',
              fontStyle: 'italic',
              maxWidth: '200px',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}
          >
            {params.value}
          </Typography> */}
        </Box>
      )
    }
  ];

  return (
    <>
      {noFile ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <Typography variant="h6">Veuillez sélectionner un dossier</Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>

          {/* HEADER DE STATISTIQUES (Fixe en haut) */}
          <Stack direction="row" spacing={3} sx={{ p: 2, bgcolor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
            <Box>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700 }}>ANOMALIES DÉTECTÉES</Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="h6" sx={{ color: '#EF4444', fontWeight: 900, lineHeight: 1 }}>N/A</Typography>
                <ErrorOutline sx={{ color: '#EF4444', fontSize: 16 }} />
              </Stack>
            </Box>
            <Divider orientation="vertical" flexItem />
            <Box>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700 }}>RESTANT À VALIDER</Typography>
              <Typography variant="h6" sx={{ color: '#F59E0B', fontWeight: 900, lineHeight: 1 }}>N/A</Typography>
            </Box>
          </Stack>

          {/* ZONE DU TABLEAU AVEC SCROLL INTERNE */}
          <Box sx={{ flexGrow: 1, width: '100%', overflow: 'hidden' }}>
            <DataGrid
              rows={rows}
              columns={columns}
              density="compact"
              disableRowSelectionOnClick
              sx={{
                border: 'none',
                '& .MuiDataGrid-main': {
                  overflow: 'auto', // Permet le scroll horizontal et vertical interne
                },
                '& .MuiDataGrid-columnHeaders': { bgcolor: '#F8FAFC', color: '#64748B', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase' },
                '& .MuiDataGrid-cell': { fontSize: '0.8rem', borderBottom: '1px solid #F1F5F9' },
                '& .font-bold': { fontWeight: 700 }

              }}
            />
          </Box>
        </Box>
      )}

      {/* Dialog de confirmation pour validation/anomalie */}
      <ConfirmActionDialog
        open={confirmDialogOpen}
        onClose={() => { setConfirmDialogOpen(false); setConfirmDialogData({ row: null, checked: false, type: '' }); }}
        onConfirm={confirmDialogData.type === 'anomalie' ? handleConfirmAnomalie : handleConfirmValidation}
        title={confirmDialogData.type === 'anomalie'
          ? (confirmDialogData.checked ? 'Signaler une anomalie' : 'Retirer l\'anomalie')
          : (confirmDialogData.checked ? 'Valider l\'anomalie' : 'Annuler la validation')}
        message={confirmDialogData.type === 'anomalie'
          ? (confirmDialogData.checked
            ? `Voulez-vous signaler le compte ${confirmDialogData.row?.compte} comme anomalie ?`
            : `Voulez-vous retirer l'anomalie du compte ${confirmDialogData.row?.compte} ?`)
          : (confirmDialogData.checked
            ? `Voulez-vous valider l'anomalie du compte ${confirmDialogData.row?.compte} ?`
            : `Voulez-vous annuler la validation du compte ${confirmDialogData.row?.compte} ?`)}
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
    </>
  );
});

export default RevueMensuelleTable;