import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Stack, Paper, Autocomplete, Checkbox
} from '@mui/material';
import { DataGrid, GridActionsCellItem } from '@mui/x-data-grid';
import {
  AddOutlined, DeleteOutline, FolderOutlined,
  PersonOutline,
} from '@mui/icons-material';
import toast from 'react-hot-toast';

import { init } from '../../init';
// import { DataGridStyle } from '../../componentsTools/DatagridToolsStyle';
import useAuth from '../hooks/useAuth';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import useFileInfos from '../hooks/useFileInfos';
import usePermission from '../hooks/usePermission';
import useAxiosPrivate from '../hooks/useAxiosPrivate';
import ConfirmDeleteDialog from '../components/ConfirmDeleteDialog';

const DossiersPage = () => {
  const [open, setOpen] = useState(false);

  const navigate = useNavigate();
  const axios = useAxiosPrivate();
  const { canAdd, canModify, canDelete, canView } = usePermission();
  const { setIdDossier, setNomDossier } = useFileInfos();

  // États pour les données
  const [isHovered, setIsHovered] = useState(false);
  const [listeDossier, setListeDossier] = useState([]);
  const [finalListeDossier, setFinalListeDossier] = useState([]);
  const [findText, setFindText] = useState('');
  const [selectedIdDossier, setSelectedIdDossier] = useState(null);
  const [openDialogDeleteDossier, setOpenDialogDeleteDossier] = useState(false);
  const [selectedDossierRow, setSelectedDossierRow] = useState([]);
  const [showPopupConfirmPassword, setShowPopupConfirmPassword] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [selectedDossierForDelete, setSelectedDossierForDelete] = useState(null);

  const [newDossierNom, setNewDossierNom] = useState('');
  const [newDossierResponsable, setNewDossierResponsable] = useState('');
  const [listePortefeuille, setListePortefeuille] = useState([]);
  const [newDossierPortefeuilles, setNewDossierPortefeuilles] = useState([]);

  // Infos utilisateur
  const { auth } = useAuth();
  const decoded = auth?.accessToken ? jwtDecode(auth.accessToken) : undefined;
  const compteId = decoded?.UserInfo?.compteId || null;
  const userId = decoded?.UserInfo?.userId || null;
  let initial = init[0];

  // Timeout pour le menu
  const timeoutRef = React.useRef(null);

  // Fonctions de Home
  const GetListeDossier = () => {
    axios.get(`/home/file/${compteId}`, { params: { userId: userId } }).then((response) => {
      const resData = response.data;
      setListeDossier(resData.fileList);
      canView ? setFinalListeDossier(resData.fileList) : setFinalListeDossier([]);
    });
  };

  const handleChangeFindText = (e) => {
    setFindText(e.target.value);
    if (e.target.value === '') {
      setFinalListeDossier(listeDossier);  // Si vide : montre tout
    } else {
      const filterValue = e.target.value.toLowerCase();
      const filtered = listeDossier.filter(dossier =>
        dossier.dossier.toLowerCase().includes(filterValue)  // Filtre automatique
      );
      setFinalListeDossier(filtered);
    }
  };

  const HandleFindClick = () => {
    if (findText.trim() === '') {
      setFinalListeDossier(listeDossier);
    } else {
      const filterValue = findText.toLowerCase();
      const filtered = listeDossier.filter(dossier =>
        dossier.dossier.toLowerCase().includes(filterValue)
      );
      setFinalListeDossier(filtered);
    }
  };

  const handleDeleteText = () => {
    setFindText("");
    setFinalListeDossier(listeDossier);
  };

  const handleDialogClickOpen = () => {
    setOpen(true);
  };

  const handleDialogClose = () => {
    setOpen(false);
  };

  const handleCloseAfterNewFileCreation = (value) => {
    setOpen(value);
    GetListeDossier();
  };

  const handleOpenDialogConfirmDeleteDossier = () => {
    if (selectedDossierRow.length !== 1) {
      toast.error("Veuillez sélectionner seulement un dossier.");
      return;
    }
    setSelectedDossierForDelete(selectedDossierRow[0]);
    setOpenDialogDeleteDossier(true);
  }

  const deleteDossier = async () => {
    if (!selectedDossierForDelete) return;

    setLoadingDelete(true);
    try {
      const response = await axios.post(`/home/deleteFile`, { id_dossier: selectedDossierForDelete });
      const resData = response.data;
      if (resData.state) {
        toast.success(resData.msg);
        GetListeDossier();
      } else {
        toast.error(resData.msg);
      }
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors de la suppression');
    } finally {
      setLoadingDelete(false);
      setOpenDialogDeleteDossier(false);
      setSelectedDossierForDelete(null);
      setSelectedDossierRow([]);
    }
  }

  const selectFile = (row) => {
    const id = row.id;
    const avecMotDePasse = row.avecmotdepasse;
    if (avecMotDePasse) {
      setSelectedIdDossier(id);
      setShowPopupConfirmPassword(true);
    } else {
      axios.post('/home/deleteDossierPasswordAccess', { user_id: userId });
      setIdDossier(id);
      setNomDossier(row.dossier);
      navigate(`/tab/dashboard/${id}`);
      sessionStorage.setItem("fileId", id);
    }
  };

  const handleClosePopupConfirmPassword = () => {
    setShowPopupConfirmPassword(false);
    setSelectedIdDossier(null);
  };

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setNewDossierNom('');
    setNewDossierResponsable('');
    setNewDossierPortefeuilles([]);
  };

  const handleCreateNewDossier = async () => {
    if (!newDossierNom.trim()) {
      toast.error('Veuillez saisir un nom de dossier');
      return;
    }

    const portefeuilleIds = (Array.isArray(newDossierPortefeuilles) ? newDossierPortefeuilles : [])
      .map((p) => Number(p?.id))
      .filter((id) => Number.isFinite(id));

    const payload = {
      action: 'new',
      itemId: 0,
      idCompte: compteId,
      nomdossier: newDossierNom.trim(),
      responsable: newDossierResponsable.trim(),
      portefeuille: portefeuilleIds,

      centrefisc: 'DGE',
      raisonsociale: '',
      denomination: '',
      nif: '',
      stat: '',
      rcs: '',
      expertcomptable: '',
      cac: '',
      forme: '',
      activite: '',
      detailsactivite: '',
      adresse: '',
      email: '',
      telephone: '',
      province: '',
      region: '',
      district: '',
      commune: '',
      plancomptable: 0,
      longueurcptstd: 6,
      longueurcptaux: 6,
      autocompletion: true,
      avecanalytique: false,
      tauxir: 0,
      assujettitva: false,
      montantcapital: 0,
      nbrpart: 0,
      valeurpart: 0,
      listeAssocies: [],
      listeFiliales: [],
      listeDomBank: [],
      immo_amort_base_jours: 365,
      typecomptabilite: 'Français',
      devisepardefaut: 'EUR',
      consolidation: false,
      listeConsolidation: [],
      pays: '',
      avecMotDePasse: false,
      motDePasse: '',
    };

    try {
      const response = await axios.post('/home/newFile', payload);
      const resData = response?.data;
      if (resData?.state) {
        toast.success(resData?.msg || 'Dossier créé');
        handleClose();
        GetListeDossier();
      } else {
        toast.error(resData?.msg || 'Création échouée');
      }
    } catch (err) {
      console.error(err);
      toast.error('Erreur serveur');
    }
  };

  // Configuration des colonnes du DataGrid
  const columns = [
    {
      field: 'dossier',
      headerName: 'Nom du dossier',
      flex: 1,
      minWidth: 250,
      renderCell: (params) => (
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ height: '100%' }}>
          <Box sx={{ p: 0.8, bgcolor: '#F0FDFA', borderRadius: '8px', display: 'flex' }}>
            <FolderOutlined sx={{ color: '#10B981', fontSize: 20 }} />
          </Box>
          <Typography variant="body2" sx={{ fontWeight: 600, color: '#1E293B' }} onClick={() => selectFile(params.row)}>
            {params.row.dossier}
          </Typography>
        </Stack>
      )
    },
    {
      field: 'portefeuille',
      headerName: 'Portefeuille',
      width: 200,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ color: '#64748B' }}>{params.row.portefeuille}</Typography>
      )
    },
    {
      field: 'responsable',
      headerName: 'Responsable',
      width: 200,
      renderCell: (params) => (
        <Stack direction="row" spacing={1} alignItems="center">
          <PersonOutline sx={{ fontSize: 16, color: '#94A3B8' }} />
          <Typography variant="body2" sx={{ color: '#64748B' }}>{params.row.responsable}</Typography>
        </Stack>
      )
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 80,
      getActions: (params) => [
        <GridActionsCellItem
          disabled={!canDelete || selectedDossierRow.length > 1 || selectedDossierRow.length === 0}
          icon={<DeleteOutline sx={{ color: '#EF4444' }} />}
          label="Supprimer"
          onClick={handleOpenDialogConfirmDeleteDossier}
        />,
      ],
    },
  ];

  // Effects
  useEffect(() => {
    const fetchData = async () => {
      if (compteId && userId) {
        try {
          const response = await axios.get(`/home/file/${compteId}`, { params: { userId } });
          const resData = response.data;
          setListeDossier(resData.fileList);
          canView ? setFinalListeDossier(resData.fileList) : setFinalListeDossier([]);
        } catch (err) {
          console.error(err);
        }
      }
    };
    fetchData();
  }, [compteId, userId, canView]);

  useEffect(() => {
    const fetchPortefeuilles = async () => {
      if (!compteId) return;
      try {
        const response = await axios.get(`/param/portefeuille/getAllPortefeuille/${compteId}`);
        const resData = response?.data;
        if (resData?.state) {
          setListePortefeuille(Array.isArray(resData.list) ? resData.list : []);
        } else {
          setListePortefeuille([]);
        }
      } catch (err) {
        console.error(err);
        setListePortefeuille([]);
      }
    };
    fetchPortefeuilles();
  }, [compteId]);

  return (
    <>
      {
        openDialogDeleteDossier && canDelete
          ?
          <ConfirmDeleteDialog
            open={openDialogDeleteDossier}
            onClose={() => {
              setOpenDialogDeleteDossier(false);
              setSelectedDossierForDelete(null);
            }}
            onConfirm={deleteDossier}
            title="Supprimer le dossier"
            msg={"Voulez-vous vraiment supprimer le dossier sélectionné ?"}
            confirmationState={deleteDossier}
          />
          :
          null
      }
      <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: '#FFFFFF', minHeight: '100%' }}>

        {/* HEADER DE LA PAGE */}
        <Stack direction="row" justifyContent="space-between" alignItems="flex-end" sx={{ mb: 4 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F172A', mb: 0.5 }}>
              Dossiers Clients
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748B' }}>
              Visualisez et gérez l'ensemble de vos mandats en cours.
            </Typography>
          </Box>

          <Button
            variant="contained"
            startIcon={<AddOutlined />}
            disabled={!canAdd}
            onClick={handleOpen}
            sx={{
              bgcolor: '#10B981',
              '&:hover': { bgcolor: '#059669' },
              textTransform: 'none',
              borderRadius: '10px',
              fontWeight: 700,
              px: 3,
              boxShadow: 'none'
            }}
          >
            Nouveau Dossier
          </Button>
        </Stack>

        {/* TABLEAU DATAGRID */}
        <Paper elevation={0} sx={{
          height: 600,
          width: '100%',
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          overflow: 'hidden'
        }}>
          <DataGrid
            rows={finalListeDossier}
            columns={columns}
            getRowId={(row) => row.id ?? row.id_dossier}
            checkboxSelection
            onRowSelectionModelChange={(newSelection) => {
              setSelectedDossierRow(newSelection);
            }}
            rowSelectionModel={selectedDossierRow}
            rowHeight={60}
            sx={{
              border: 'none',
              '& .MuiDataGrid-columnHeaders': {
                bgcolor: '#F8FAFC',
                color: '#475569',
                fontWeight: 700,
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: 1,
                borderBottom: '1px solid #E2E8F0',
              },
              '& .MuiDataGrid-cell': {
                borderBottom: '1px solid #F1F5F9',
                '&:focus': { outline: 'none' }
              },
              '& .MuiDataGrid-footerContainer': {
                borderTop: '1px solid #E2E8F0',
              },
            }}
          />
        </Paper>

        {/* MODAL DE CRÉATION (Dialog) */}
        <Dialog
          open={open}
          onClose={handleClose}
          PaperProps={{
            sx: {
              bgcolor: '#FFFFFF',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '450px',
              p: 1,
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)'
            }
          }}
        >
          <DialogTitle sx={{ fontWeight: 800, color: '#0F172A', pt: 3, pb: 1 }}>
            Créer un nouveau dossier
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ color: '#64748B', mb: 3 }}>
              Veuillez renseigner les informations de base de l'entité.
            </Typography>

            <Stack spacing={3}>
              {/* Champ Nom */}
              <Box>
                <Typography variant="caption" sx={labelStyle}>NOM DE L'ENTITÉ</Typography>
                <TextField
                  fullWidth
                  value={newDossierNom}
                  onChange={(e) => setNewDossierNom(e.target.value)}
                  placeholder="Ex: SARL Ma Boutique"
                  variant="outlined"
                  sx={inputStyle}
                />
              </Box>

              {/* Champ Portefeuille */}
              <Box>
                <Typography variant="caption" sx={labelStyle}>PORTEFEUILLE</Typography>
                <Autocomplete
                  multiple
                  options={listePortefeuille}
                  disableCloseOnSelect
                  getOptionLabel={(option) => option?.nom || ''}
                  value={newDossierPortefeuilles}
                  onChange={(_, newValue) => setNewDossierPortefeuilles(newValue)}
                  renderOption={(props, option, { selected }) => (
                    <li {...props}>
                      <Checkbox sx={{ mr: 1 }} checked={selected} />
                      {option?.nom || ''}
                    </li>
                  )}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      variant="outlined"
                      sx={inputStyle}
                    />
                  )}
                />
              </Box>

              {/* Champ Responsable */}
              <Box>
                <Typography variant="caption" sx={labelStyle}>RESPONSABLE DU DOSSIER</Typography>
                <TextField
                  fullWidth
                  value={newDossierResponsable}
                  onChange={(e) => setNewDossierResponsable(e.target.value)}
                  placeholder="Nom du collaborateur"
                  variant="outlined"
                  sx={inputStyle}
                />
              </Box>
            </Stack>
          </DialogContent>

          <DialogActions sx={{ p: 3, pt: 1 }}>
            <Button onClick={handleClose} sx={{ color: '#94A3B8', textTransform: 'none', fontWeight: 600 }}>
              Annuler
            </Button>
            <Button
              variant="contained"
              onClick={handleCreateNewDossier}
              sx={{
                bgcolor: '#10B981',
                '&:hover': { bgcolor: '#059669' },
                textTransform: 'none',
                borderRadius: '10px',
                px: 4,
                fontWeight: 700,
                boxShadow: 'none'
              }}
            >
              Confirmer la création
            </Button>
          </DialogActions>
        </Dialog>

        {/* Dialog de suppression */}
        <ConfirmDeleteDialog
          open={openDialogDeleteDossier}
          onClose={() => {
            setOpenDialogDeleteDossier(false);
            setSelectedDossierForDelete(null);
          }}
          onConfirm={deleteDossier}
          title="Supprimer le dossier"
          message="Êtes-vous sûr de vouloir supprimer ce dossier ? Cette action est irréversible."
          loading={loadingDelete}
        />
      </Box>
    </>
  );
};

// --- STYLES PERSONNALISÉS POUR MODE CLAIR ---

const labelStyle = {
  color: '#475569',
  fontWeight: 700,
  mb: 1,
  display: 'block',
  fontSize: '0.65rem',
  letterSpacing: 1
};

const inputStyle = {
  '& .MuiOutlinedInput-root': {
    color: '#1E293B',
    bgcolor: '#F8FAFC', // Très léger gris pour contraster avec le fond blanc
    borderRadius: '10px',
    fontSize: '0.9rem',
    '& fieldset': { borderColor: '#E2E8F0' },
    '&:hover fieldset': { borderColor: '#CBD5E1' },
    '&.Mui-focused fieldset': { borderColor: '#10B981', borderWidth: '1px' },
  },
  '& input::placeholder': { color: '#94A3B8', opacity: 1 }
};

export default DossiersPage;