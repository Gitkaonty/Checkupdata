import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Stack,
  Button,
  Paper,
  Grid,
  Breadcrumbs,
  Link,
  MenuItem,
  Select,
  Divider,
  TextField,
  FormControlLabel,
  Switch,
  Chip,
  Menu,
  ListItemIcon,
  ListItemText,
  CircularProgress
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import {
  NavigateNext,
  PictureAsPdfOutlined,
  TableChartOutlined,
  AccountBalanceOutlined,
  FilterListOutlined,
  DashboardOutlined,
  FileDownloadOutlined
} from '@mui/icons-material';
import { FaFilePdf, FaFileExcel } from 'react-icons/fa';
import useAuth from '../../hooks/useAuth';
import { jwtDecode } from 'jwt-decode';
import axios from '../../../config/axios';
import toast from 'react-hot-toast';
import PopupTestSelectedFile from '../../components/PopupTestSelectedFile';
import { format } from 'date-fns';

const ExportBalance = () => {
  const { auth } = useAuth();
  const decoded = auth?.accessToken ? jwtDecode(auth.accessToken) : undefined;
  const compteId = decoded?.UserInfo?.compteId || null;
  const compteName = decoded?.UserInfo?.compte || 'Espace Client';
  const navigate = useNavigate();
  const { id } = useParams();

  // Filtres
  const [checked, setChecked] = useState(false);
  const [unsoldedCompte, setUnsoldedCompte] = useState(false);
  const [movmentedCpt, setMovmentedCpt] = useState(false);
  const [type, setType] = useState(0);

  // États dossier/exercice
  const [fileId, setFileId] = useState(0);
  const [noFile, setNoFile] = useState(false);
  const [listeExercice, setListeExercice] = useState([]);
  const [selectedExerciceId, setSelectedExerciceId] = useState(0);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Données balance
  const [balance, setBalance] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const balanceFetchTimer = useRef(null);

  // Menu Export
  const [anchorElExport, setAnchorElExport] = useState(null);
  const openExportMenu = Boolean(anchorElExport);
  const handleOpenExportMenu = useCallback((event) => setAnchorElExport(event.currentTarget), []);
  const handleCloseExportMenu = useCallback(() => setAnchorElExport(null), []);

  // Récupération fileId depuis URL ou sessionStorage
  useEffect(() => {
    const navigationEntries = performance.getEntriesByType('navigation');
    let idFile = 0;

    if (navigationEntries.length > 0) {
      const navigationType = navigationEntries[0].type;
      if (navigationType === 'reload') {
        const idDossier = sessionStorage.getItem("fileId");
        setFileId(idDossier);
        idFile = idDossier;
      } else {
        sessionStorage.setItem('fileId', id);
        setFileId(id);
        idFile = id;
      }
    }

    if (!idFile || idFile === '0') {
      setNoFile(true);
    } else {
      setNoFile(false);
      GetListeExercice(idFile);
    }
  }, [id]);

  // Récupérer la liste des exercices
  const GetListeExercice = (idDossier) => {
    axios.get(`/api/exercices/listeExercice/${idDossier}`).then((response) => {
      const resData = response.data;
      if (resData.state) {
        setListeExercice(resData.list);
        if (resData.list.length > 0) {
          setSelectedExerciceId(resData.list[0].id);
        }
      } else {
        setListeExercice([]);
        toast.error("Erreur lors de la récupération des exercices");
      }
    });
  };

  // Mise à jour des dates quand l'exercice change
  useEffect(() => {
    const ex = Array.isArray(listeExercice) ? listeExercice.find((e) => Number(e?.id) === Number(selectedExerciceId)) : null;
    const toYmd = (d) => {
      if (!d) return '';
      const dt = new Date(d);
      if (Number.isNaN(dt.getTime())) return '';
      const yyyy = dt.getFullYear();
      const mm = String(dt.getMonth() + 1).padStart(2, '0');
      const dd = String(dt.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };
    setStartDate(toYmd(ex?.date_debut));
    setEndDate(toYmd(ex?.date_fin));
  }, [listeExercice, selectedExerciceId]);

  // Récupération de la balance
  const recupBalance = useCallback(() => {
    if (!compteId || !fileId || !selectedExerciceId) return;

    setLoading(true);
    setLoadingMsg('Chargement de la balance...');

    axios.post(`/traitement/exportBalance/recupBalanceFromJournal`, {
      centraliser: checked,
      unSolded: unsoldedCompte,
      movmentedCpt: movmentedCpt,
      compteId,
      fileId,
      exerciceId: selectedExerciceId,
      type,
      dateDebut: startDate || null,
      dateFin: endDate || null
    }).then((response) => {
      const resData = response.data;
      if (resData.state) {
        // Ajouter un id unique pour chaque ligne DataGrid
        const rowsWithId = (resData.list || []).map((row, idx) => ({
          ...row,
          id: idx + 1
        }));
        setBalance(rowsWithId);
      } else {
        if (resData?.msg && !String(resData.msg).includes('Paramètres manquants')) {
          toast.error(resData.msg);
        }
        setBalance([]);
      }
      setLoading(false);
      setLoadingMsg('');
    }).catch((err) => {
      console.error(err);
      toast.error('Erreur lors du chargement de la balance');
      setBalance([]);
      setLoading(false);
      setLoadingMsg('');
    });
  }, [checked, unsoldedCompte, movmentedCpt, compteId, fileId, selectedExerciceId, type, startDate, endDate]);

  // Déclencher le chargement de la balance quand les filtres changent
  useEffect(() => {
    if (!compteId || !fileId || !selectedExerciceId) return;
    if (balanceFetchTimer.current) clearTimeout(balanceFetchTimer.current);
    balanceFetchTimer.current = setTimeout(() => {
      recupBalance();
    }, 300);
    return () => {
      if (balanceFetchTimer.current) clearTimeout(balanceFetchTimer.current);
    };
  }, [recupBalance]);

  // Export PDF/Excel
  const doExport = useCallback(async (exportType) => {
    try {
      if (!compteId || !fileId || !selectedExerciceId) {
        toast.error('Veuillez sélectionner un exercice valide avant d\'exporter.');
        return;
      }
      setLoadingMsg('Génération en cours...');
      setLoading(true);
      const url = exportType === 'pdf' ? '/traitement/exportBalance/pdf' : '/traitement/exportBalance/excel';
      const body = {
        centraliser: checked,
        unSolded: unsoldedCompte,
        movmentedCpt: movmentedCpt,
        compteId,
        fileId,
        exerciceId: selectedExerciceId,
        data: balance
      };
      const response = await axios.post(url, body, { responseType: 'blob' });
      const blobType = exportType === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      const ext = exportType === 'pdf' ? 'pdf' : 'xlsx';
      const blob = new Blob([response.data], { type: blobType });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `Balance_${fileId}_${selectedExerciceId}.${ext}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Export réussi');
    } catch (e) {
      toast.error('Erreur lors de l\'export');
    } finally {
      setLoading(false);
      setLoadingMsg('');
      handleCloseExportMenu();
    }
  }, [checked, unsoldedCompte, movmentedCpt, compteId, fileId, selectedExerciceId, balance, handleCloseExportMenu]);

  // Calcul des totaux
  const balanceTotals = useMemo(() => {
    const rows = Array.isArray(balance) ? balance : [];
    const sum = (k) => rows.reduce((acc, r) => acc + (Number(r?.[k]) || 0), 0);
    return {
      mvmdebit: sum('mvmdebit'),
      mvmcredit: sum('mvmcredit'),
      soldedebit: sum('soldedebit'),
      soldecredit: sum('soldecredit'),
    };
  }, [balance]);

  // Redirection si pas de dossier
  const sendToHome = (value) => {
    setNoFile(!value);
    navigate('/home');
  };

  // Format monétaire
  const formatMoney = (v) => (Number(v) || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Colonnes DataGrid
  const columns = [
    {
      field: 'compte',
      headerName: 'N° COMPTE',
      flex: 1,
      renderCell: (params) => (
        <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: '#6366F1' }}>
          {params.value}
        </Typography>
      )
    },
    {
      field: 'libelle',
      headerName: 'INTITULÉ DU COMPTE',
      width: 200,
      renderCell: (params) => (
        <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#1E293B' }}>
          {params.value}
        </Typography>
      )
    },
    {
      field: 'mvmdebit',
      headerName: 'MOUV. DÉBIT',
      width: 100,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params) => (
        <Typography sx={{ fontSize: '0.75rem', fontWeight: 700 }}>
          {formatMoney(params.value)}
        </Typography>
      )
    },
    {
      field: 'mvmcredit',
      headerName: 'MOUV. CRÉDIT',
      width: 100,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params) => (
        <Typography sx={{ fontSize: '0.75rem', fontWeight: 700 }}>
          {formatMoney(params.value)}
        </Typography>
      )
    },
    {
      field: 'soldedebit',
      headerName: 'SOLDE DÉBIT',
      width: 100,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params) => (
        <Typography sx={{ fontSize: '0.75rem', fontWeight: 700 }}>
          {formatMoney(params.value)}
        </Typography>
      )
    },
    {
      field: 'soldecredit',
      headerName: 'SOLDE CRÉDIT',
      width: 100,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params) => (
        <Typography sx={{ fontSize: '0.75rem', fontWeight: 700 }}>
          {formatMoney(params.value)}
        </Typography>
      )
    },
  ];

  if (noFile) {
    return <PopupTestSelectedFile confirmationState={sendToHome} />;
  }

  return (
    <Box
      sx={{
        p: 3,
        bgcolor: '#F8FAFC',
        height: 'calc(100vh - 120px)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        width: 'calc(100vw - 130px)',
        // maxWidth: '100%',
        minWidth: 0,
      }}
    >

      {/* --- HEADER --- */}
      <Box sx={{ mb: 3, minWidth: 0 }}>
        <Stack
          direction="row"
          alignItems="center"
          spacing={2}
          sx={{
            mb: 1,
            flexWrap: 'wrap',
            minWidth: 0,
          }}
        >
          <Chip
            label={compteName}
            sx={{
              borderRadius: '4px',
              bgcolor: '#F1F5F9',
              color: '#475569',
              fontWeight: 700,
              fontSize: '0.95rem',
              border: '1px solid #E2E8F0',
              height: 24,
              maxWidth: '100%',
            }}
          />

          <Breadcrumbs
            separator={<NavigateNext fontSize="small" />}
            sx={{
              mb: 2,
              minWidth: 0,
              '& .MuiTypography-root': {
                fontSize: '0.85rem',
                fontWeight: 600
              }
            }}
          >
            <Link
              underline="hover"
              color="inherit"
              href="/dashboard"
              sx={{
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <DashboardOutlined sx={{ mr: 0.5, fontSize: 20 }} />
              Dashboard
            </Link>

            <Typography
              color="text.primary"
              sx={{
                fontWeight: 600,
                color: '#64748B'
              }}
            >
              Balance Générale
            </Typography>
          </Breadcrumbs>
        </Stack>

        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          flexWrap="wrap"
          gap={2}
          sx={{ minWidth: 0 }}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <Box
              sx={{
                p: 1,
                borderRadius: '8px',
                bgcolor: '#00B8D4',
                display: 'flex'
              }}
            >
              <AccountBalanceOutlined
                sx={{ color: 'white', fontSize: 24 }}
              />
            </Box>

            <Typography
              variant="h5"
              sx={{
                fontWeight: 900,
                color: '#1E293B',
                letterSpacing: '-0.5px'
              }}
            >
              Balance des Comptes
            </Typography>
          </Stack>

          <Stack
            direction="row"
            spacing={1.5}
            flexWrap="wrap"
          >
            <Button
              variant="outlined"
              startIcon={<TableChartOutlined />}
              onClick={() => doExport('excel')}
              disabled={!listeExercice?.length || !selectedExerciceId || loading}
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                color: '#10B981',
                borderColor: '#10B981',
                borderRadius: '8px'
              }}
            >
              Excel
            </Button>

            <Button
              variant="contained"
              startIcon={<PictureAsPdfOutlined />}
              onClick={() => doExport('pdf')}
              disabled={!listeExercice?.length || !selectedExerciceId || loading}
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                bgcolor: '#EF4444',
                borderRadius: '8px',
                '&:hover': {
                  bgcolor: '#DC2626'
                }
              }}
            >
              PDF
            </Button>
          </Stack>
        </Stack>
      </Box>

      <Paper
        variant="outlined"
        sx={{
          p: 2,
          mb: 3,
          borderRadius: '12px',
          bgcolor: '#FFF',
          overflow: 'hidden',
          width: '100%',
          minWidth: 0,
        }}
      >
        <Grid container spacing={3} alignItems="center">

          <Grid item>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 800,
                color: '#94A3B8',
                display: 'block',
                mb: 0.5,
                textTransform: 'uppercase',
                fontSize: '0.6rem'
              }}
            >
              Exercice
            </Typography>

            <Select
              value={selectedExerciceId}
              onChange={(e) => setSelectedExerciceId(e.target.value)}
              size="small"
              sx={{
                height: 35,
                fontSize: '0.8rem',
                fontWeight: 700,
                minWidth: 240,
                borderRadius: '8px',
                maxWidth: '100%',
              }}
            >
              {listeExercice.map((option) => (
                <MenuItem
                  key={option.id}
                  value={option.id}
                  sx={{ fontSize: '12px' }}
                >
                  {option.libelle_rang} :
                  {' '}
                  {format(new Date(option.date_debut), 'dd/MM/yyyy')}
                  {' - '}
                  {format(new Date(option.date_fin), 'dd/MM/yyyy')}
                </MenuItem>
              ))}
            </Select>
          </Grid>

          <Grid item>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 800,
                color: '#94A3B8',
                display: 'block',
                mb: 0.5,
                textTransform: 'uppercase',
                fontSize: '0.6rem'
              }}
            >
              Type
            </Typography>

            <Select
              value={type}
              onChange={(e) => setType(e.target.value)}
              size="small"
              sx={{
                height: 35,
                fontSize: '0.8rem',
                fontWeight: 700,
                minWidth: 140,
                borderRadius: '8px'
              }}
            >
              <MenuItem value={0} sx={{ fontSize: '12px' }}>
                Générale
              </MenuItem>

              <MenuItem value={1} sx={{ fontSize: '12px' }}>
                Fournisseurs
              </MenuItem>

              <MenuItem value={2} sx={{ fontSize: '12px' }}>
                Clients
              </MenuItem>
            </Select>
          </Grid>

          <Grid item>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 800,
                color: '#94A3B8',
                display: 'block',
                mb: 0.5,
                textTransform: 'uppercase',
                fontSize: '0.6rem'
              }}
            >
              Arrêté au
            </Typography>

            <TextField
              type="date"
              size="small"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  height: 35,
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  borderRadius: '8px'
                }
              }}
            />
          </Grid>

          <Grid
            item
            sx={{
              borderLeft: '1px solid #E2E8F0',
              ml: 2,
              pl: 4,
              mt: 4,
              minWidth: 0,
            }}
          >
            <Stack
              direction="row"
              flexWrap="wrap"
              gap={2}
            >
              <FormControlLabel
                control={
                  <Switch
                    checked={checked}
                    onChange={(e) => setChecked(e.target.checked)}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: '#6366F1'
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        bgcolor: '#6366F1'
                      }
                    }}
                  />
                }
                label={
                  <Typography
                    sx={{
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      color: '#1E293B'
                    }}
                  >
                    Centraliser
                  </Typography>
                }
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={unsoldedCompte}
                    onChange={(e) => setUnsoldedCompte(e.target.checked)}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: '#6366F1'
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        bgcolor: '#6366F1'
                      }
                    }}
                  />
                }
                label={
                  <Typography
                    sx={{
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      color: '#1E293B'
                    }}
                  >
                    Non soldés
                  </Typography>
                }
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={movmentedCpt}
                    onChange={(e) => setMovmentedCpt(e.target.checked)}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: '#6366F1'
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        bgcolor: '#6366F1'
                      }
                    }}
                  />
                }
                label={
                  <Typography
                    sx={{
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      color: '#1E293B'
                    }}
                  >
                    Mouvementés
                  </Typography>
                }
              />
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      {loading && (
        <Stack
          direction="row"
          spacing={2}
          alignItems="center"
          justifyContent="center"
          sx={{ mb: 2 }}
        >
          <CircularProgress size={22} />

          <Typography
            variant="body2"
            sx={{
              color: '#2973B2',
              fontWeight: 700
            }}
          >
            {loadingMsg}
          </Typography>
        </Stack>
      )}

      <Stack
        sx={{
          flex: 1,
          minHeight: 0
        }}
      >
        <Stack
          sx={{
            borderRadius: '12px',
            overflow: 'hidden',
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
          }}
        >

          <Box
            sx={{
              px: 2,
              py: 1.5,
              bgcolor: '#FCFDFF',
              borderBottom: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <FilterListOutlined
                sx={{
                  fontSize: 18,
                  color: '#64748B'
                }}
              />

              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 800,
                  fontSize: '0.75rem',
                  color: '#1E293B'
                }}
              >
                APERÇU DE LA BALANCE ({balance.length} lignes)
              </Typography>
            </Stack>
          </Box>

          <Box
            sx={{
              flex: 1,
              minHeight: 0,
              overflow: 'hidden',
              minWidth: 0,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <DataGrid
              rows={balance}
              columns={columns}
              density="compact"
              disableSelectionOnClick
              sx={{
                border: 'none',
                height: '100%',
                '& .MuiDataGrid-main': {
                  overflow: 'hidden',
                },

                '& .MuiDataGrid-columnHeaders': {
                  bgcolor: '#FCFDFF',
                  borderBottom: '1px solid #E2E8F0',

                  '& .MuiDataGrid-columnHeaderTitle': {
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    color: '#94A3B8',
                    letterSpacing: '0.05rem',
                  }
                },

                '& .MuiDataGrid-cell': {
                  borderBottom: '1px solid #F1F5F9',
                },

                '& .MuiDataGrid-virtualScroller': {
                  bgcolor: '#FFF',
                }
              }}
            />
          </Box>


          <Box
          sx={{
            p: 2,
            bgcolor: '#F8FAFC',
            borderTop: '2px solid #E2E8F0',
          }}
        >

          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            flexWrap="wrap"
            gap={2}
          >

            <Typography
              sx={{
                fontSize: '0.75rem',
                fontWeight: 900,
                color: '#1E293B'
              }}
            >
              TOTAL GÉNÉRAL
            </Typography>

            <Stack
              direction="row"
              useFlexGap
              flexWrap="wrap"
              gap={4}
            >

              <Stack alignItems="flex-end">
                <Typography
                  variant="caption"
                  sx={{
                    color: '#94A3B8',
                    fontWeight: 700,
                    fontSize: '0.6rem'
                  }}
                >
                  MOUV. DÉBIT
                </Typography>

                <Typography
                  sx={{
                    fontWeight: 900,
                    fontSize: '0.85rem',
                    color: '#1E293B'
                  }}
                >
                  {formatMoney(balanceTotals.mvmdebit)}
                </Typography>
              </Stack>

              <Stack alignItems="flex-end">
                <Typography
                  variant="caption"
                  sx={{
                    color: '#94A3B8',
                    fontWeight: 700,
                    fontSize: '0.6rem'
                  }}
                >
                  MOUV. CRÉDIT
                </Typography>

                <Typography
                  sx={{
                    fontWeight: 900,
                    fontSize: '0.85rem',
                    color: '#1E293B'
                  }}
                >
                  {formatMoney(balanceTotals.mvmcredit)}
                </Typography>
              </Stack>

              <Stack alignItems="flex-end">
                <Typography
                  variant="caption"
                  sx={{
                    color: '#94A3B8',
                    fontWeight: 700,
                    fontSize: '0.6rem'
                  }}
                >
                  SOLDE DÉBIT
                </Typography>

                <Typography
                  sx={{
                    fontWeight: 900,
                    fontSize: '0.85rem',
                    color: '#1E293B'
                  }}
                >
                  {formatMoney(balanceTotals.soldedebit)}
                </Typography>
              </Stack>

              <Stack alignItems="flex-end">
                <Typography
                  variant="caption"
                  sx={{
                    color: '#94A3B8',
                    fontWeight: 700,
                    fontSize: '0.6rem'
                  }}
                >
                  SOLDE CRÉDIT
                </Typography>

                <Typography
                  sx={{
                    fontWeight: 900,
                    fontSize: '0.85rem',
                    color: '#1E293B'
                  }}
                >
                  {formatMoney(balanceTotals.soldecredit)}
                </Typography>
              </Stack>

            </Stack>
          </Stack>
        </Box>
        </Stack>
      </Stack>
      <Menu
        id="export-menu"
        anchorEl={anchorElExport}
        open={openExportMenu}
        onClose={handleCloseExportMenu}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left'
        }}
      >
        <MenuItem onClick={() => doExport('pdf')}>
          <ListItemIcon>
            <FaFilePdf size={20} color="#D32F2F" />
          </ListItemIcon>

          <ListItemText primary="Exporter en PDF" />
        </MenuItem>

        <MenuItem onClick={() => doExport('excel')}>
          <ListItemIcon>
            <FaFileExcel size={20} color="#2E7D32" />
          </ListItemIcon>

          <ListItemText primary="Exporter en Excel" />
        </MenuItem>
      </Menu>

    </Box>
  );
};

export default ExportBalance;