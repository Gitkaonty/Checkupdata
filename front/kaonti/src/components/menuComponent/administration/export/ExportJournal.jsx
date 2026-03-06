import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Typography, Stack, Box, Tab, Button, IconButton, Chip } from '@mui/material';
import Checkbox from '@mui/material/Checkbox';
import { TabContext, TabList, TabPanel } from '@mui/lab';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import Menu from '@mui/material/Menu';
import { ListItemIcon, ListItemText } from '@mui/material';
import { FaFilePdf, FaFileExcel } from 'react-icons/fa';
import { CiExport } from 'react-icons/ci';
import { init } from '../../../../../init';
import axios from '../../../../../config/axios';
import PopupTestSelectedFile from '../../../componentsTools/popupTestSelectedFile';
import { InfoFileStyle } from '../../../componentsTools/InfosFileStyle';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import useAuth from '../../../../hooks/useAuth';
import { jwtDecode } from 'jwt-decode';

export default function ExportJournal() {
  let initial = init[0];
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

  const handleChangeCodes = (e) => {
    let value = typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value;
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
    navigate('/tab/home');
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

  const GetListeExercice = (id) => {
    axios.get(`/paramExercice/listeExercice/${id}`).then((response) => {
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
        //toast.error("une erreur est survenue lors de la récupération de la liste des exercices");
        return
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
        //toast.error("une erreur est survenue lors de la récupération de la liste des exercices");
        return
      }
    })
  }

  const GetListeCodeJournaux = () => {
    axios.get(`/paramCodeJournaux/listeCodeJournaux/${fileId}`).then((response) => {
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
      if (journalCodes.length === 0) {
        return toast.error('Veuillez sélectionner au moins une code journal');
      }
      const response = await axios.post('/administration/exportJournal/pdf', body, { responseType: 'blob' });
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
      if (journalCodes.length === 0) {
        return toast.error('Veuillez sélectionner au moins une code journal');
      }
      const response = await axios.post('/administration/exportJournal/excel', body, { responseType: 'blob' });
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
    <Box>
      {noFile ? <PopupTestSelectedFile confirmationState={sendToHome} /> : null}
      <TabContext value={"1"}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <TabList aria-label="lab API tabs example">
            <Tab
              style={{ textTransform: 'none', outline: 'none', border: 'none', margin: -5 }}
              label={InfoFileStyle(fileInfos?.dossier)} value="1"
            />
          </TabList>
        </Box>
        <TabPanel value="1" style={{ height: '100%' }}>
          <Stack width={"100%"} height={"100%"} spacing={6} alignItems={"flex-start"} alignContent={"flex-start"} justifyContent={"stretch"}>
            <Typography variant='h6' sx={{ color: "black" }} align='left'>Administration - Export journal</Typography>

            <Stack width={"100%"} spacing={4} alignItems={"center"} justifyContent="space-between" direction={"row"} style={{ marginLeft: "0px", marginTop: "20px" }}>
              <Stack direction={"row"}>
                <FormControl variant="standard" sx={{ m: 1, minWidth: 250 }}>
                  <InputLabel>Exercice:</InputLabel>
                  <Select
                    value={selectedExerciceId}
                    onChange={(e) => handleChangeExercice(e.target.value)}
                    sx={{ width: "300px", display: "flex", justifyContent: "left", alignItems: "flex-start", alignContent: "flex-start", textAlign: "left" }}
                    MenuProps={{ disableScrollLock: true }}
                  >
                    {listeExercice.map((option) => (
                      <MenuItem key={option.id} value={option.id}>{option.libelle_rang}: {format(option.date_debut, "dd/MM/yyyy")} - {format(option.date_fin, "dd/MM/yyyy")}</MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl variant="standard" sx={{ m: 1, minWidth: 150 }}>
                  <InputLabel>Période</InputLabel>
                  <Select
                    disabled
                    value={selectedPeriodeChoiceId}
                    onChange={(e) => handleChangePeriode(e.target.value)}
                    sx={{ width: "150px", display: "flex", justifyContent: "left", alignItems: "flex-start", alignContent: "flex-start", textAlign: "left" }}
                    MenuProps={{ disableScrollLock: true }}
                  >
                    <MenuItem value={0}>Toutes</MenuItem>
                    <MenuItem value={1}>Situations</MenuItem>
                  </Select>
                </FormControl>

                <FormControl variant="standard" sx={{ m: 1, minWidth: 250 }}>
                  <InputLabel>Du</InputLabel>
                  <Select
                    value={selectedPeriodeId}
                    onChange={(e) => handleChangeDateIntervalle(e.target.value)}
                    sx={{ width: "300px", display: "flex", justifyContent: "left", alignItems: "flex-start", alignContent: "flex-start", textAlign: "left" }}
                    MenuProps={{ disableScrollLock: true }}
                  >
                    {listeSituation?.map((option) => (
                      <MenuItem key={option.id} value={option.id}>{option.libelle_rang}: {format(option.date_debut, "dd/MM/yyyy")} - {format(option.date_fin, "dd/MM/yyyy")}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>
            </Stack>

            <Stack
              width={"100%"}
              paddingLeft={"5px"}
              alignItems={"center"}
              alignContent={"center"}
              direction={"row"}
              justifyContent={"flex-start"}
              style={{ marginLeft: "0px", marginTop: "20px", backgroundColor: '#F4F9F9', borderRadius: "5px" }}
              spacing={0.5}
            >
              <FormControl variant="standard" sx={{ width: '25%' }}>
                <InputLabel>Code journal</InputLabel>
                <Select
                  multiple
                  value={journalCodes}
                  onChange={handleChangeCodes}
                  renderValue={(selected) => (
                    Array.isArray(selected) ? (
                      <Stack direction="row" spacing={0.5} useFlexGap flexWrap="wrap">
                        {selected.filter(val => val !== ALL_OPTION).map((val) => (
                          <Chip
                            key={val}
                            label={val}
                            size="small"
                            onMouseDown={(e) => e.stopPropagation()}
                            onDelete={() => setJournalCodes((prev) => prev.filter((c) => c !== val))}
                          />
                        ))}
                      </Stack>
                    ) : ''
                  )}
                  MenuProps={{
                    disableScrollLock: true,
                    PaperProps: {
                      sx: {
                        "& .MuiMenuItem-root": {
                          paddingTop: "2px",    // réduit l’espace haut
                          paddingBottom: "2px", // réduit l’espace bas
                          minHeight: "auto",    // supprime la hauteur minimale par défaut
                        },
                      },
                    },
                  }}
                >
                  <MenuItem value={ALL_OPTION}>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <Checkbox size="small" checked={isAllSelected} indeterminate={!isAllSelected && journalCodes.length > 0} />
                    </ListItemIcon>
                    <ListItemText
                      primary="Sélectionner tout"
                      primaryTypographyProps={{ fontWeight: 'bold', backgroundColor: '#DFDFDF', color: 'black' }}
                    />
                  </MenuItem>
                  {listeCodeJournaux.map((value, index) => (
                    <MenuItem key={index} value={value.code}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <Checkbox size="small" checked={journalCodes.includes(value.code)} />
                      </ListItemIcon>
                      <ListItemText primary={`${value.code} - ${value.libelle}`} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>


              <TextField
                label="Date début"
                type="date"
                value={dateDebut}
                onChange={(e) => setDateDebut(e.target.value)}
                InputLabelProps={{ shrink: true }}
                variant="standard"
                sx={{ width: '20%' }}
              />

              <TextField
                label="Date fin"
                type="date"
                value={dateFin}
                onChange={(e) => setDateFin(e.target.value)}
                InputLabelProps={{ shrink: true }}
                variant="standard"
                sx={{ width: '20%' }}
              />

              <Stack direction={'row'} spacing={2} sx={{ ml: 4, alignItems: 'center' }}>
                <Button
                  variant="outlined"
                  onClick={handleResetFilter}
                  style={{ textTransform: 'none', outline: 'none', height: '36px' }}
                >
                  Réinitialiser
                </Button>
                <IconButton
                  disabled={!canExport()}
                  onClick={handleOpenExportMenu}
                  aria-controls={openExportMenu ? 'export-menu' : undefined}
                  aria-haspopup="true"
                  aria-expanded={openExportMenu ? 'true' : undefined}
                >
                  <CiExport style={{ width: 35, height: 35, color: '#1A5276' }} />
                </IconButton>
              </Stack>
            </Stack>

            <Menu
              id="export-menu"
              anchorEl={anchorElExport}
              open={openExportMenu}
              onClose={handleCloseExportMenu}
              keepMounted
              disablePortal={false}
              disableScrollLock
              disableAutoFocus
              disableEnforceFocus
              disableRestoreFocus
              TransitionProps={{ timeout: 0 }}
              transitionDuration={0}
              MenuListProps={{ dense: true, disablePadding: true }}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
              transformOrigin={{ vertical: 'top', horizontal: 'left' }}
            >
              <MenuItem onClick={exportPdf} disabled={exporting}>
                <ListItemIcon>
                  <FaFilePdf size={20} color="#D32F2F" />
                </ListItemIcon>
                <ListItemText primary={exporting ? 'Export...' : 'Exporter en PDF'} />
              </MenuItem>
              <MenuItem onClick={exportExcel} disabled={exporting}>
                <ListItemIcon>
                  <FaFileExcel size={20} color="#2E7D32" />
                </ListItemIcon>
                <ListItemText primary={exporting ? 'Export...' : 'Exporter en Excel'} />
              </MenuItem>
            </Menu>
          </Stack>
        </TabPanel>
      </TabContext>
    </Box>
  )
}

