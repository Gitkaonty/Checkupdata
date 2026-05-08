import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from '../../../config/axios';
import { jwtDecode } from 'jwt-decode';
import {
  Box, Typography, Stack, Button, Paper, Grid,
  Breadcrumbs, Link, MenuItem, Select, Divider,
  TextField, InputAdornment, Autocomplete,
  Chip
} from '@mui/material';
import {
  NavigateNext, FileDownloadOutlined,
  HistoryOutlined, DateRangeOutlined,
  PictureAsPdfOutlined, TableChartOutlined,
  AccountBalanceWalletOutlined,
  DashboardOutlined
} from '@mui/icons-material';
import { format } from 'date-fns';
import { ListItemIcon, ListItemText } from '@mui/material';
import Checkbox from '@mui/material/Checkbox';
import useAuth from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import RestartAltIcon from '@mui/icons-material/RestartAlt';

const ExportGrandLivre = () => {
  const [fileInfos, setFileInfos] = useState('');
  const [fileId, setFileId] = useState(0);
  const { id } = useParams();
  const [noFile, setNoFile] = useState(false);

  const [selectedExerciceId, setSelectedExerciceId] = useState(0);
  const [selectedPeriodeChoiceId, setSelectedPeriodeChoiceId] = useState(0);
  const [selectedPeriodeId, setSelectedPeriodeId] = useState(0);
  const [listeExercice, setListeExercice] = useState([]);
  const [listeSituation, setListeSituation] = useState([]);

  const [listeComptes, setListeComptes] = useState([]);
  const [compteAux, setCompteAux] = useState([]); // multiple comptes auxiliaires
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [exporting, setExporting] = useState(false);
  const [exportMsg, setExportMsg] = useState('');

  // Helpers for select-all on comptes
  const ALL_OPTION = '__ALL__';
  const allComptes = Array.isArray(listeComptes) ? listeComptes.map(v => v.compte) : [];
  const isAllSelected = allComptes.length > 0 && compteAux.length === allComptes.length && allComptes.every(c => compteAux.includes(c));

  const handleChangeComptes = (value) => {
    if (value.includes(ALL_OPTION)) {
      if (isAllSelected) {
        setCompteAux([]);
      } else {
        setCompteAux(allComptes);
      }
    } else {
      setCompteAux(value);
    }
  };
  const [anchorElExport, setAnchorElExport] = useState(null);
  const openExportMenu = Boolean(anchorElExport);
  const handleOpenExportMenu = (event) => setAnchorElExport(event.currentTarget);
  const handleCloseExportMenu = () => setAnchorElExport(null);

  const { auth } = useAuth();
  const decoded = auth?.accessToken ? jwtDecode(auth.accessToken) : undefined;
  const compteId = decoded?.UserInfo?.compteId || null;
  const compteName = decoded?.UserInfo?.compte || 'Espace Client';

  const navigate = useNavigate();

  const GetInfosIdDossier = (id) => {
    axios.get(`/home/FileInfos/${id}`).then((response) => {
      const resData = response.data;
      if (resData.state) {
        setFileInfos(resData.fileInfos[0]);
        setNoFile(false);
      } else {
        setFileInfos([]);
        setNoFile(true);
      }
    })
  }

  const sendToHome = (value) => {
    setNoFile(!value);
    navigate('/home');
  }

  const handleChangeExercice = (exercice_id) => {
    setSelectedExerciceId(exercice_id);
    setSelectedPeriodeChoiceId("0");
    setListeSituation(listeExercice?.filter((item) => item.id === exercice_id));
    setSelectedPeriodeId(exercice_id);
    // Fixer les dates du filtre à l'année (intervalle) de l'exercice
    const ex = listeExercice.find((e) => e.id === exercice_id);
    if (ex) {
      const d1 = format(new Date(ex.date_debut), 'yyyy-MM-dd');
      const d2 = format(new Date(ex.date_fin), 'yyyy-MM-dd');
      setDateDebut(d1);
      setDateFin(d2);
    }
  }

  const GetListeExercice = (idDossier) => {
    axios.get(`/api/exercices/listeExercice/${idDossier}`).then((response) => {
      const resData = response.data;
      if (resData.state) {
        setListeExercice(resData.list);
        const exerciceNId = resData.list?.filter((item) => item.libelle_rang === "N");
        setListeSituation(exerciceNId);
        setSelectedExerciceId(exerciceNId[0].id);
        setSelectedPeriodeChoiceId(0);
        setSelectedPeriodeId(exerciceNId[0].id);
        // Initialiser les dates du filtre avec celles de l'exercice courant
        const d1 = format(new Date(exerciceNId[0].date_debut), 'yyyy-MM-dd');
        const d2 = format(new Date(exerciceNId[0].date_fin), 'yyyy-MM-dd');
        setDateDebut(d1);
        setDateFin(d2);
      } else {
        setListeExercice([]);
        toast.error("une erreur est survenue lors de la récupération de la liste des exercices");
      }
    })
  }

  const GetListeSituation = (id) => {
    axios.get(`/paramExercice/listeSituation/${id}`).then((response) => {
      const resData = response.data;
      if (resData.state) {
        const list = resData.list;
        setListeSituation(resData.list);
        if (list.length > 0) {
          setSelectedPeriodeId(list[0].id);
        }
      } else {
        setListeSituation([]);
        toast.error("une erreur est survenue lors de la récupération de la liste des exercices");
      }
    })
  }

  const GetListeComptes = () => {
    axios.get(`/administration/exportGrandLivre/listeCompteAux/${compteId}/${fileId}/${selectedExerciceId}`).then((response) => {
      const resData = response.data;
      if (resData.state) {
        setListeComptes(resData.liste || []);
      } else {
        setListeComptes([]);
        toast.error(resData.msg || 'Erreur lors de la récupération des comptes');
      }
    }).catch((err) => {
      setListeComptes([]);
      toast.error('Erreur lors de la récupération des comptes');
    })
  }

  const handleChangePeriode = (choix) => {
    setSelectedPeriodeChoiceId(choix);
    if (choix === 0) {
      setListeSituation(listeExercice?.filter((item) => item.id === selectedExerciceId));
      setSelectedPeriodeId(selectedExerciceId);
    } else if (choix === 1) {
      GetListeSituation(selectedExerciceId);
    }
  }

  const handleChangeDateIntervalle = (id) => {
    setSelectedPeriodeId(id);
    // Adapter les dates si une situation est choisie (plage spécifique)
    const sit = listeSituation?.find((s) => s.id === id);
    if (sit) {
      const d1 = format(new Date(sit.date_debut), 'yyyy-MM-dd');
      const d2 = format(new Date(sit.date_fin), 'yyyy-MM-dd');
      setDateDebut(d1);
      setDateFin(d2);
    }
  }

  const handleApplyFilter = () => {
    const hasFilter = (Array.isArray(compteAux) && compteAux.length > 0) || (dateDebut && dateDebut !== '') || (dateFin && dateFin !== '');
    if (!hasFilter) {
      return toast.error('Veuillez sélectionner au moins un filtre (compte ou dates).');
    }
    toast.success('Filtre appliqué');
  };

  const handleResetFilter = () => {
    setCompteAux([]);
    setDateDebut('');
    setDateFin('');
    toast.success('Filtre réinitialisé');
  };

  const canExport = () => {
    const hasFilter = (Array.isArray(compteAux) && compteAux.length > 0) || (dateDebut && dateDebut !== '') || (dateFin && dateFin !== '');
    return hasFilter && !!compteId && !!fileId && !!selectedExerciceId;
  };

  const exportPdf = async () => {
    if (!canExport()) {
      return toast.error('Renseignez au moins un filtre et Sélectionnez un exercice.');
    }
    try {
      setExporting(true);
      setExportMsg('Génération du PDF...');
      const body = {
        compteId,
        fileId,
        exerciceId: selectedExerciceId,
        compteAux,
        dateDebut,
        dateFin,
      };
      const response = await axios.post('/administration/exportGrandLivre/pdf', body, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `GrandLivre_${fileId}_${selectedExerciceId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      toast.error('Erreur lors de l\'export du journal');
    } finally {
      setExporting(false);
      setExportMsg('');
    }
  };

  const exportExcel = async () => {
    if (!canExport()) {
      return toast.error('Renseignez au moins un filtre et Sélectionnez un exercice.');
    }
    try {
      setExporting(true);
      setExportMsg('Génération de l\'Excel...');
      const body = {
        compteId,
        fileId,
        exerciceId: selectedExerciceId,
        compteAux,
        dateDebut,
        dateFin,
      };
      const response = await axios.post('/administration/exportGrandLivre/excel', body, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `GrandLivre_${fileId}_${selectedExerciceId}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      toast.error('Erreur lors de l\'export du journal (Excel)');
    } finally {
      setExporting(false);
      setExportMsg('');
      handleCloseExportMenu();
    }
  };

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
    GetInfosIdDossier(idFile);
    GetListeExercice(idFile);
  }, []);

  useEffect(() => {
    if (fileId && compteId && selectedExerciceId) {
      GetListeComptes();
    }
  }, [fileId, compteId, selectedExerciceId]);


  const optionsComptes = React.useMemo(() => {
    const data = (listeComptes || []).map((c) => c.compte);

    return data.sort((a, b) => b.localeCompare(a)); // décroissant
  }, [listeComptes]);

  return (
    <Box sx={{ p: 3, bgcolor: '#F8FAFC', minHeight: '85vh' }}>

      {/* --- HEADER --- */}
      <Box sx={{ mb: 4 }}>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1 }}>
          <Chip
            label={compteName}
            sx={{
              borderRadius: '4px', // Rectangulaire comme demandé
              bgcolor: '#F1F5F9',
              color: '#475569',
              fontWeight: 700,
              fontSize: '0.95rem',
              border: '1px solid #E2E8F0',
              height: 24,
            }}
          />
          <Breadcrumbs
            separator={<NavigateNext fontSize="small" />}
            sx={{ mb: 2, '& .MuiTypography-root': { fontSize: '0.85rem', fontWeight: 600 } }}
          >
            <Link underline="hover" color="inherit" href="/dashboard"
              sx={{ display: 'flex', alignItems: 'center' }}
            >
              <DashboardOutlined sx={{ mr: 0.5, fontSize: 20 }} /> Dashboard
            </Link>
            <Typography color="text.primary" sx={{ fontWeight: 600, color: '#64748B' }}>Grand Livre</Typography>
          </Breadcrumbs>
        </Stack>

        <Stack direction="row" alignItems="center" spacing={1}>
          <Box sx={{ p: 1, borderRadius: '8px', bgcolor: '#0F172A', display: 'flex' }}>
            <AccountBalanceWalletOutlined sx={{ color: 'white', fontSize: 24 }} />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 900, color: '#1E293B', letterSpacing: '-0.5px' }}>
            Export du Grand Livre
          </Typography>
        </Stack>
      </Box>

      {/* --- CONFIGURATION --- */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper variant="outlined" sx={{ borderRadius: '12px', overflow: 'hidden' }}>
            <Box sx={{ p: 2, borderBottom: '1px solid #E2E8F0', bgcolor: '#FCFDFF' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, fontSize: '0.75rem' }}>CRITÈRES D'EXTRACTION</Typography>
            </Box>

            <Box sx={{ p: 3 }}>
              <Stack direction="row" spacing={3} alignItems="flex-start">

                {/* BLOC SÉLECTEURS GROUPÉS */}
                <Stack
                  direction="row"
                  alignItems="center"
                  sx={{
                    p: 0.5,
                    bgcolor: '#FFFFFF',
                    borderRadius: '10px',
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                  }}
                >
                  {/* Exercice */}
                  <Box sx={{ px: 2, py: 0.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#94A3B8', display: 'block', textTransform: 'uppercase', fontSize: '0.55rem' }}>
                      Exercice
                    </Typography>
                    <Select
                      value={selectedExerciceId}
                      onChange={(e) => handleChangeExercice(e.target.value)}
                      variant="standard"
                      disableUnderline
                      sx={{ height: 24, fontSize: '0.8rem', fontWeight: 700, color: '#1E293B', minWidth: 100 }}
                    >
                      {listeExercice.map((option) => (
                        <MenuItem key={option.id} value={option.id} sx={{ fontSize: 15 }}>
                          {option.libelle_rang}: {format(option.date_debut, "dd/MM/yyyy")} - {format(option.date_fin, "dd/MM/yyyy")}
                        </MenuItem>
                      ))}
                    </Select>
                  </Box>

                  <Divider orientation="vertical" flexItem sx={{ height: 28, alignSelf: 'center', borderColor: '#E2E8F0' }} />

                  {/* Choix de Compte */}
                  <Box sx={{ px: 2, py: 0.5, width: "100%", overflow: "visible" }}>
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 800,
                        color: "#94A3B8",
                        display: "block",
                        textTransform: "uppercase",
                        fontSize: "0.55rem",
                      }}
                    >
                      Sélection de compte
                    </Typography>

                    <Autocomplete
                      multiple
                      sx={{
                        minWidth: 350,
                        width: "100%",
                        maxWidth: 400,
                        "& .MuiAutocomplete-inputRoot": {
                          flexWrap: "nowrap",
                          overflow: "hidden",
                        },
                        "& .MuiAutocomplete-tag": {
                          maxWidth: 120,
                        },
                      }}
                      options={[ALL_OPTION, ...optionsComptes]}
                      value={compteAux}
                      disableCloseOnSelect
                      limitTags={2}
                      onChange={(event, newValue) => {
                        // ✔ SELECT ALL LOGIC
                        if (newValue.includes(ALL_OPTION)) {
                          handleChangeComptes(
                            isAllSelected ? [] : optionsComptes
                          );
                        } else {
                          handleChangeComptes(newValue);
                        }
                      }}
                      getOptionLabel={(option) =>
                        option === ALL_OPTION ? "Sélectionner tout" : option
                      }
                      renderOption={(props, option, { selected }) => {
                        const isAll = option === ALL_OPTION;

                        return (
                          <li
                            {...props}
                            style={{
                              whiteSpace: "normal",
                              wordBreak: "break-word",
                            }}
                          >
                            <Checkbox
                              style={{ marginRight: 8 }}
                              checked={
                                isAll ? isAllSelected : selected
                              }
                            />
                            <ListItemText
                              primary={isAll ? "Sélectionner tout" : option}
                              primaryTypographyProps={{
                                fontWeight: isAll ? "bold" : "normal",
                              }}
                            />
                          </li>
                        );
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          variant="standard"
                          placeholder="Rechercher un compte..."
                          sx={{
                            width: "100%",
                            "& .MuiInputBase-input": {
                              fontSize: "0.8rem",
                              fontWeight: 700,
                              color: "#6366F1",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            },
                          }}
                          InputProps={{
                            ...params.InputProps,
                            disableUnderline: true,
                          }}
                        />
                      )}
                    />
                  </Box>
                </Stack>

                {/* Date Arrêté */}
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748B', display: 'block', mb: 0.5, textTransform: 'uppercase', fontSize: '0.6rem' }}>
                    Arrêté au
                  </Typography>
                  <TextField
                    type="date"
                    size="small"
                    value={dateFin}
                    onChange={(e) => setDateFin(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <DateRangeOutlined sx={{ fontSize: 16, color: '#6366F1' }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        height: 35,
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        borderRadius: '8px',
                        bgcolor: '#F8FAFC'
                      }
                    }}
                  />
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748B', display: 'block', mb: 0.5, textTransform: 'uppercase', fontSize: '0.6rem' }}>
                    Réinitialiser
                  </Typography>
                  <Button
                    variant="contained"
                    disableElevation
                    size="small"
                    onClick={handleResetFilter}
                    startIcon={<RestartAltIcon sx={{ fontSize: 16 }} />}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        height: 35,
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        borderRadius: '8px',
                        bgcolor: '#F8FAFC'
                      }
                    }}
                  >
                    Réinitialiser
                  </Button>
                </Box>
              </Stack>

              <Divider sx={{ my: 4, borderStyle: 'dashed' }} />

              {/* FORMATS D'EXPORT */}
              <Stack direction="row" spacing={2}>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={exportExcel}
                  startIcon={<TableChartOutlined />}
                  sx={{
                    py: 1.5,
                    bgcolor: '#10B981',
                    textTransform: 'none',
                    fontWeight: 800,
                    borderRadius: '12px',
                    '&:hover': { bgcolor: '#059669' }
                  }}
                >
                  Exporter Excel (.xlsx)
                </Button>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={exportPdf}
                  startIcon={<PictureAsPdfOutlined />}
                  sx={{
                    py: 1.5,
                    bgcolor: '#EF4444',
                    textTransform: 'none',
                    fontWeight: 800,
                    borderRadius: '12px',
                    '&:hover': { bgcolor: '#DC2626' }
                  }}
                >
                  Exporter PDF (.pdf)
                </Button>
              </Stack>
            </Box>
          </Paper>
        </Grid>

        {/* --- ASIDE INFO --- */}
        <Grid item xs={12} md={4}>
          <Stack spacing={2}>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: '12px', bgcolor: '#F8FAFC' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 1, fontSize: '0.7rem', color: '#64748B', textTransform: 'uppercase' }}>
                Options du Grand Livre
              </Typography>
              <Typography variant="caption" sx={{ display: 'block', color: '#1E293B', mb: 1, fontWeight: 500 }}>
                • Inclut le report à nouveau (RAN).
              </Typography>
              <Typography variant="caption" sx={{ display: 'block', color: '#1E293B', mb: 1, fontWeight: 500 }}>
                • Détail ligne par ligne avec lettrage.
              </Typography>
              <Typography variant="caption" sx={{ display: 'block', color: '#1E293B', fontWeight: 500 }}>
                • Sous-totaux par compte comptable.
              </Typography>
            </Paper>

            <Box sx={{ p: 2, borderRadius: '12px', bgcolor: '#EEF2FF', border: '1px solid #C7D2FE' }}>
              <Typography variant="caption" sx={{ color: '#4338CA', fontWeight: 700 }}>
                Astuce : L'export au format PDF est optimisé pour l'impression A4 paysage.
              </Typography>
            </Box>
          </Stack>
        </Grid>
      </Grid>
    </Box >
  );
};

export default ExportGrandLivre;