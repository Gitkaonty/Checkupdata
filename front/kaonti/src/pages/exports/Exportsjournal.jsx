import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Stack, Button, Paper, Grid,
  Breadcrumbs, Link, MenuItem, Select, Divider,
  TextField, InputAdornment, Autocomplete,
  Chip, Checkbox, Tooltip 
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';

import {
  NavigateNext, FileDownloadOutlined,
  HistoryOutlined, DateRangeOutlined,
  PictureAsPdfOutlined, TableChartOutlined,
  BookOutlined,
  DashboardOutlined
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import useAuth from '../../hooks/useAuth';
import { jwtDecode } from 'jwt-decode';
import axios from '../../../config/axios';
import { ListItemIcon, ListItemText } from '@mui/material';


const ExportJournal = () => {
  const [fileInfos, setFileInfos] = useState('');
  const [fileId, setFileId] = useState(0);
  const { id } = useParams();
  const [noFile, setNoFile] = useState(false);

  const [selectedExerciceId, setSelectedExerciceId] = useState(0);
  const [selectedPeriodeId, setSelectedPeriodeId] = useState(0);
  const [selectedPeriodeChoiceId, setSelectedPeriodeChoiceId] = useState(0);
  const [listeExercice, setListeExercice] = useState([]);
  const [listeSituation, setListeSituation] = useState([]);

  const [listeCodeJournaux, setListeCodeJournaux] = useState([]);
  const [journalCodes, setJournalCodes] = useState([]); // multiple codes
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [exporting, setExporting] = useState(false);
  const [exportMsg, setExportMsg] = useState('');
  const [anchorElExport, setAnchorElExport] = useState(null);
  const openExportMenu = Boolean(anchorElExport);
  const handleOpenExportMenu = (event) => setAnchorElExport(event.currentTarget);
  const handleCloseExportMenu = () => setAnchorElExport(null);

  // Helpers for select-all on journal codes
  const ALL_OPTION = '__ALL__';
  const allCodes = Array.isArray(listeCodeJournaux) ? listeCodeJournaux.map(v => v.code) : [];
  const isAllSelected = allCodes.length > 0 && journalCodes.length === allCodes.length && allCodes.every(c => journalCodes.includes(c));

  const handleChangeCodes = (value) => {
    if (value.includes(ALL_OPTION)) {
      if (isAllSelected) {
        setJournalCodes([]);
      } else {
        setJournalCodes(allCodes);
      }
    } else {
      setJournalCodes(value);
    }
  };

  const { auth } = useAuth();
  const decoded = auth?.accessToken ? jwtDecode(auth.accessToken) : undefined;
  const compteId = decoded?.UserInfo?.compteId || null;
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

  const GetListeSituation = (idDossier) => {
    axios.get(`/paramExercice/listeSituation/${idDossier}`).then((response) => {
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

  const GetListeCodeJournaux = () => {
    axios.get(`/param/codejournals/listeCodeJournaux/${fileId}`).then((response) => {
      const resData = response.data;
      if (resData.state) {
        setListeCodeJournaux(resData.list);
      } else {
        setListeCodeJournaux([]);
        toast.error(resData.msg);
      }
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
    const hasFilter = (Array.isArray(journalCodes) && journalCodes.length > 0) || (dateDebut && dateDebut !== '') || (dateFin && dateFin !== '');
    if (!hasFilter) {
      return toast.error('Veuillez sélectionner au moins un filtre (code journal ou dates).');
    }
    toast.success('Filtre appliqué');
  };

  const handleResetFilter = () => {
    setJournalCodes([]);
    setDateDebut('');
    setDateFin('');
    toast.success('Filtre réinitialisé');
  };

  const canExport = () => {
    const hasFilter = (Array.isArray(journalCodes) && journalCodes.length > 0) || (dateDebut && dateDebut !== '') || (dateFin && dateFin !== '');
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
        journalCodes,
        dateDebut,
        dateFin,
      };
      const response = await axios.post('/traitement/exportJournal/pdf', body, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `Journal_${fileId}_${selectedExerciceId}.pdf`;
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
        journalCodes,
        dateDebut,
        dateFin,
      };
      const response = await axios.post('/traitement/exportJournal/excel', body, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `Journal_${fileId}_${selectedExerciceId}.xlsx`;
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
    if (fileId && compteId) {
      GetListeCodeJournaux();
    }
  }, [fileId, compteId]);

  return (
    <Box sx={{ p: 3, bgcolor: '#F8FAFC', minHeight: '100vh' }}>

      {/* --- HEADER --- */}
      <Box sx={{ mb: 4 }}>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1 }}>
          <Chip
            label="Cabinet Randria & Associés"
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
            <Typography color="text.primary" sx={{ fontWeight: 600, color: '#64748B' }}>Export Journal</Typography>
          </Breadcrumbs>
        </Stack>

        <Stack direction="row" alignItems="center" spacing={1}>
          <Box sx={{ p: 1, borderRadius: '8px', bgcolor: '#6366F1', display: 'flex' }}>
            <FileDownloadOutlined sx={{ color: 'white', fontSize: 24 }} />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 900, color: '#1E293B', letterSpacing: '-0.5px' }}>
            Export des Journaux
          </Typography>
        </Stack>
      </Box>

      {/* --- CONFIGURATION DE L'EXPORT --- */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper variant="outlined" sx={{ p: 0, borderRadius: '12px', overflow: 'hidden' }}>
            <Box sx={{ p: 2, borderBottom: '1px solid #E2E8F0', bgcolor: '#FCFDFF' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, fontSize: '0.75rem' }}>CRITÈRES DE GÉNÉRATION</Typography>
            </Box>

            <Box sx={{ p: 3 }}>
              <Stack direction="row" spacing={4} alignItems="flex-start">

                {/* BLOC SÉLECTEURS GROUPÉS (Style Pro) */}
                <Stack
                  direction="row"
                  alignItems="center"
                  sx={{
                    p: 0.5,
                    bgcolor: '#FFFFFF',
                    borderRadius: '10px',
                    border: '1px solid #E2E8F0',
                    width: 'fit-content',
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
                      Sélection de journal
                    </Typography>
                    {/* Code Journal */}
                    <Autocomplete
                      multiple
                      disableCloseOnSelect
                      options={[ALL_OPTION, ...listeCodeJournaux.map((v) => v.code)]}
                      value={journalCodes}
                      onChange={(event, newValue) => {
                        // ✔ SELECT ALL LOGIC
                        if (newValue.includes(ALL_OPTION)) {
                          handleChangeCodes(
                            isAllSelected ? [] : listeCodeJournaux.map((v) => v.code)
                          );
                        } else {
                          handleChangeCodes(newValue);
                        }
                      }}
                      getOptionLabel={(option) => {
                        if (option === ALL_OPTION) return "Sélectionner tout";
                        const item = listeCodeJournaux.find((v) => v.code === option);
                        return item ? `${item.code} - ${item.libelle}` : option;
                      }}
                      sx={{
                        minWidth: 350,
                        width: "100%",
                        maxWidth: 420,
                        "& .MuiAutocomplete-inputRoot": {
                          flexWrap: "nowrap",
                          overflow: "hidden",
                        },
                        "& .MuiAutocomplete-tag": {
                          maxWidth: 140,
                        },
                      }}
                      renderOption={(props, option, { selected }) => {
                        const isAll = option === ALL_OPTION;

                        return (
                          <li {...props}>
                            <Checkbox
                              size="small"
                              style={{ marginRight: 8 }}
                              checked={isAll ? isAllSelected : selected}
                            />
                            <ListItemText
                              primary={isAll ? "Sélectionner tout" : option}
                              primaryTypographyProps={{
                                fontWeight: isAll ? 800 : 400,
                              }}
                            />
                          </li>
                        );
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          variant="standard"
                          placeholder="Rechercher un code journal..."
                          InputProps={{
                            ...params.InputProps,
                            disableUnderline: true,
                          }}
                          sx={{
                            "& .MuiInputBase-input": {
                              fontSize: "0.8rem",
                              fontWeight: 700,
                              color: "#6366F1",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            },
                          }}
                        />
                      )}
                      renderTags={(value, getTagProps) => {
                        const vals = value.filter((v) => v !== ALL_OPTION);
                        const visible = vals.slice(0, 5);
                        const hiddenCount = vals.length - visible.length;

                        return (
                          <Stack direction="row" spacing={0.5} sx={{ overflow: "hidden" }}>
                            {visible.map((val, index) => (
                              <Chip
                                key={val}
                                label={val}
                                size="small"
                                {...getTagProps({ index })}
                                onDelete={() =>
                                  handleChangeCodes(vals.filter((c) => c !== val))
                                }
                              />
                            ))}

                            {hiddenCount > 0 && (
                              <Tooltip title={vals.join(", ")} arrow>
                                <Chip label={`+${hiddenCount}`} size="small" />
                              </Tooltip>
                            )}
                          </Stack>
                        );
                      }}
                    />
                  </Box>
                </Stack>

                {/* Date Arrêté (Champ Date moderne) */}
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748B', display: 'block', mb: 0.5, textTransform: 'uppercase', fontSize: '0.6rem' }}>
                    Date d'arrêté
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
              </Stack>

              <Divider sx={{ my: 4, borderStyle: 'dashed' }} />

              {/* ACTIONS D'EXPORTATION */}
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: '#475569' }}>Sélectionnez le format d'export :</Typography>
                <Stack direction="row" spacing={2}>
                  <Button
                    variant="outlined"
                    onClick={exportExcel}
                    startIcon={<TableChartOutlined />}
                    sx={{
                      flex: 1,
                      py: 1.5,
                      textTransform: 'none',
                      fontWeight: 800,
                      borderRadius: '12px',
                      color: '#10B981',
                      borderColor: '#10B981',
                      '&:hover': { bgcolor: 'rgba(16, 185, 129, 0.05)', borderColor: '#059669' }
                    }}
                  >
                    Exporter en Excel
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={exportPdf}
                    startIcon={<PictureAsPdfOutlined />}
                    sx={{
                      flex: 1,
                      py: 1.5,
                      textTransform: 'none',
                      fontWeight: 800,
                      borderRadius: '12px',
                      color: '#EF4444',
                      borderColor: '#EF4444',
                      '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.05)', borderColor: '#DC2626' }
                    }}
                  >
                    Générer le PDF
                  </Button>
                </Stack>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* --- INFO PANEL (ASIDE) --- */}
        <Grid item xs={12} md={4}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: '12px', bgcolor: '#F1F5F9', border: 'none' }}>
            <Stack spacing={2}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <BookOutlined sx={{ color: '#64748B' }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Aide à l'export</Typography>
              </Stack>
              <Typography variant="caption" sx={{ color: '#64748B', lineHeight: 1.5 }}>
                L'export inclut toutes les écritures validées jusqu'à la date d'arrêté choisie.
                Si vous choisissez "Tous les journaux", un seul fichier consolidé sera généré.
              </Typography>
              <Divider />
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#1E293B' }}>
                Note : Pour un export légal (FEC), veuillez vous rendre dans le menu Paramètres\Conformité.
              </Typography>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ExportJournal;