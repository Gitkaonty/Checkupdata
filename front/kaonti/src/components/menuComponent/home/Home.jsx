import React, { useEffect, useState } from 'react';
import { Box, Button, GlobalStyles, Grid, Stack, Tooltip, Typography } from '@mui/material';
import toast from 'react-hot-toast';
import Dialog from '@mui/material/Dialog';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import Slide from '@mui/material/Slide';
import AddNewFile from './Home_addNewFile';
import useAuth from '../../../hooks/useAuth';
// import axios from '../../../../config/axios';
import { jwtDecode } from 'jwt-decode';
import PopupConfirmDelete from '../../componentsTools/popupConfirmDelete';
import { useNavigate } from 'react-router-dom';
import useFileInfos from '../../../hooks/useFileInfos';
import usePermission from '../../../hooks/usePermission';
import useAxiosPrivate from '../../../../config/axiosPrivate';
import PopupConfirmPasswordDossier from '../../componentsTools/Dossier/PopupConfirmPasswordDossier';
import { RiDeleteBin6Line } from "react-icons/ri";
import { FaEye } from "react-icons/fa";

import AddIcon from '@mui/icons-material/Add';
import FolderIcon from '@mui/icons-material/FolderOpenOutlined';
import WalletIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import GavelIcon from '@mui/icons-material/GavelOutlined';
import PersonIcon from '@mui/icons-material/PersonOutline';
import LockIcon from '@mui/icons-material/LockOutlined';
import DatagridGlobal from '../../componentsTools/Dossier/Datagrid/DatagridGlobal';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const TABLE_BLUE = '#0B3156';

const MiniStatCard = ({ title, value, color, icon }) => (
  <Box sx={{
    bgcolor: color,
    p: 1.5,
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    height: '100%',
    width: '100%',
    border: '1px solid rgba(0,0,0,0.03)',
    boxSizing: 'border-box'
  }}>
    <Box sx={{
      width: 32, height: 32, borderRadius: '8px', bgcolor: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center', mr: 1.5,
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
    }}>
      {React.cloneElement(icon, { sx: { ...icon.props.sx, fontSize: 18 } })}
    </Box>
    <Box>
      <Typography sx={{ fontSize: '10px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', mb: -0.5 }}>
        {title}
      </Typography>
      <Typography sx={{ fontSize: '18px', fontWeight: 900, color: '#1E293B' }}>
        {value}
      </Typography>
    </Box>
  </Box>
);

export default function Home() {
  const navigate = useNavigate();
  const axios = useAxiosPrivate();

  const { canAdd, canModify, canDelete, canView } = usePermission();

  let [finalListeDossier, setFinalListeDossier] = useState([]);
  const [selectedIdDossier, setSelectedIdDossier] = useState(null);
  const [openDialogDeleteDossier, setOpenDialogDeleteDossier] = useState(false);
  const { setIdDossier, setNomDossier } = useFileInfos();
  const [showPopupConfirmPassword, setShowPopupConfirmPassword] = useState(false);

  const [idToDelete, setIdToDelete] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [infoCardDossier, setInfoCardDossier] = useState({
    nbr_dossiers: 0,
    nbr_portefeuilles: 0,
    nbr_cac: 0,
    nbr_expertcomptable: 0
  });

  //récupération des informations de connexion
  const { auth } = useAuth();
  const decoded = auth?.accessToken ? jwtDecode(auth.accessToken) : undefined;
  const compteId = decoded.UserInfo.compteId || null;
  const userId = decoded.UserInfo.userId || null;

  //Gestion fenetre modale de création d'un nouveau dossier
  const [open, setOpen] = React.useState(false);

  const handleDialogClickOpen = () => {
    setOpen(true);
  };

  const handleDialogClose = () => {
    setOpen(false);
  };

  const handleCloseAfterNewFileCreation = (value) => {
    setOpen(value);
  }

  //supprimer un dossier
  const handleOpenDialogConfirmDeleteDossier = () => {
    setOpenDialogDeleteDossier(true);
  }

  const deleteDossier = (value) => {
    if (value) {
      if (!idToDelete) {
        toast.error("Veuillez sélectionner un dossier à supprimer.");
        setOpenDialogDeleteDossier(false);
        return;
      }
      else {
        const id_dossier = Number(idToDelete);
        axios.post(`/home/deleteFile`, { id_dossier }).then((response) => {
          const resData = response.data;
          if (resData.state) {
            toast.success(resData.msg);
            setIdToDelete(null);
            setIsRefreshing(prev => !prev);
          } else {
            toast.error(resData.msg);
          }
          setOpenDialogDeleteDossier(false);
        });
      }
    } else {
      setOpenDialogDeleteDossier(false);
    }
  }

  const selectFile = (row) => {
    const id = row.id;
    const avecMotDePasse = row.avecmotdepasse;
    if (avecMotDePasse) {
      setSelectedIdDossier(id);
      setShowPopupConfirmPassword(true);
    } else {
      axios.post('/home/deleteDossierPasswordAccess', { user_id: userId })
      setIdDossier(id);
      setNomDossier(row.dossier);
      navigate(`/tab/dashboard/${id}`);
      sessionStorage.setItem("fileId", id);
    }
  }

  const handleClosePopupConfirmPassword = () => {
    setShowPopupConfirmPassword(false);
    setSelectedIdDossier(null);
  }

  const tableheader = [
    {
      field: 'avecmotdepasse',
      headerName: "Sécurité",
      type: 'string',
      sortable: true,
      width: 70,
      headerAlign: 'center',
      headerClassName: 'HeaderbackColor',
      align: 'center',
      renderCell: (params) => {
        return params.value ? (
          <LockIcon sx={{ fontSize: 25, color: '#94A3B8' }} />
        ) : (
          // <LockOpenIcon sx={{ fontSize: 25, color: '#94A3B8' }} />
          null
        );
      }
    },
    {
      field: 'dossier',
      headerName: "Dossier",
      type: 'string',
      sortable: true,
      flex: 2,
      headerAlign: 'left',
      headerClassName: 'HeaderbackColor',
      renderCell: (params) => {
        return (
          <Tooltip title="Ouvrir le dossier" >
            <Box
              onClick={() => selectFile(params.row)}
              sx={{
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'start',
                width: '100%',
                gap: 1,
              }}
            >
              <FolderIcon sx={{ color: '#3B82F6', fontSize: 25 }} />
              <p style={{ fontWeight: 'bold' }}> {params.row.dossier}</p>
            </Box>
          </Tooltip>
        )
      }
    },
    {
      field: 'portefeuille',
      headerName: "Portefeuille",
      type: 'string',
      sortable: true,
      flex: 1.5,
      headerAlign: 'left',
      headerClassName: 'HeaderbackColor'
    },
    {
      field: 'nif',
      headerName: "Nif",
      type: 'string',
      sortable: true,
      flex: 2,
      headerAlign: 'left',
      headerClassName: 'HeaderbackColor'
    },
    {
      field: 'stat',
      headerName: "N° statistique",
      type: 'string',
      sortable: true,
      flex: 2,
      headerAlign: 'left',
      headerClassName: 'HeaderbackColor'
    },
    {
      field: 'responsable',
      headerName: "Résponsable",
      type: 'string',
      sortable: true,
      flex: 2.5,
      headerAlign: 'left',
      headerClassName: 'HeaderbackColor',
      renderCell: (params) => {
        const value = params.value;
        return (
          <Stack
            direction={'row'}
            alignItems={'center'}
            justifyContent={'start'}
            width={'100%'}
            spacing={1}
          >
            <PersonIcon sx={{ fontSize: 25, color: '#64748B' }} />
            <Typography variant="body2" noWrap>
              {value}
            </Typography>
          </Stack>
        );
      }
    },
    {
      field: 'expertcomptable',
      headerName: "Expert comptable",
      type: 'string',
      sortable: true,
      flex: 2.5,
      headerAlign: 'left',
      headerClassName: 'HeaderbackColor',
      renderCell: (params) => {
        const value = params.value;
        return (
          <Stack
            direction={'row'}
            alignItems={'center'}
            justifyContent={'start'}
            width={'100%'}
            spacing={1}
          >
            <PersonIcon sx={{ fontSize: 25, color: '#64748B' }} />
            <Typography variant="body2" noWrap>
              {value}
            </Typography>
          </Stack>
        );
      }
    },
    {
      field: 'cac',
      headerName: "Cac",
      type: 'string',
      sortable: true,
      flex: 2,
      headerAlign: 'left',
      headerClassName: 'HeaderbackColor',
      renderCell: (params) => {
        const value = params.value;
        return (
          <Stack
            direction={'row'}
            alignItems={'center'}
            justifyContent={'start'}
            width={'100%'}
            spacing={1}
          >
            <PersonIcon sx={{ fontSize: 25, color: '#64748B' }} />
            <Typography variant="body2" noWrap>
              {value}
            </Typography>
          </Stack>
        );
      }
    },
    {
      field: 'actions',
      headerName: "Actions",
      type: 'string',
      sortable: true,
      width: 100,
      headerAlign: 'center',
      headerClassName: 'HeaderbackColor',
      renderCell: (params) => {
        const id = params.row.id;
        return (
          <Stack width={'100%'} direction={'row'} alignItems={'center'} alignContent={'center'} justifyContent={'center'} spacing={0.5}>
            <Tooltip title="Supprimer le dossier">
              <span>
                <IconButton
                  onClick={() => {
                    setIdToDelete(id);
                    handleOpenDialogConfirmDeleteDossier();
                  }}
                  variant="contained"
                  style={{
                    width: "35px", height: '35px', borderRadius: "5px",
                    borderColor: "transparent",
                    textTransform: 'none', outline: 'none'
                  }}
                >
                  <RiDeleteBin6Line size={20} style={{ color: 'red' }} />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Voir le dossier">
              <span>
                <IconButton
                  variant="contained"
                  style={{
                    width: "35px", height: '35px', borderRadius: "5px",
                    borderColor: "transparent",
                    textTransform: 'none', outline: 'none'
                  }}
                >
                  <FaEye style={{ color: 'gray' }} />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
        )
      }
    }
  ];

  const getInfoCardDossier = () => {
    axios.get(`/home/getInfoCardDossier/${Number(compteId)}`).then((response) => {
      const resData = response.data.data;
      const nbr_dossiers = resData.nbr_dossiers;
      const nbr_portefeuilles = resData.nbr_portefeuilles;
      const nbr_cac = resData.nbr_cac;
      const nbr_expertcomptable = resData.nbr_expertcomptable;
      setInfoCardDossier({ nbr_dossiers, nbr_portefeuilles, nbr_cac, nbr_expertcomptable });
    })
  }

  const fetchData = async () => {
    if (compteId && userId) {
      try {
        const response = await axios.get(`/home/file/${compteId}`, { params: { userId } });
        const resData = response.data;
        canView ? setFinalListeDossier(resData.fileList) : setFinalListeDossier([]);
      } catch (err) {
        console.error(err);
      }
    }
  };

  useEffect(() => {
    fetchData();
    getInfoCardDossier();
  }, [compteId, userId, canView, isRefreshing]);

  return (
    <>
      {
        openDialogDeleteDossier && canDelete
          ?
          <PopupConfirmDelete
            msg={"Voulez-vous vraiment supprimer le dossier sélectionné ?"}
            confirmationState={deleteDossier}
          />
          :
          null
      }
      {
        showPopupConfirmPassword && (
          <PopupConfirmPasswordDossier
            onClose={handleClosePopupConfirmPassword}
            id_dossier={selectedIdDossier}
          />
        )
      }

      {open ?
        <Dialog
          fullScreen
          open={true}
          onClose={handleDialogClose}
          TransitionComponent={Transition}
          PaperProps={{
            sx: {
              backgroundColor: 'transparent',
              overflow: 'hidden'
            }
          }}
        >
          <AppBar sx={{ position: 'fixed' }}
          >
            <Toolbar style={{
              transition: 'all 0.3s ease',
              background: 'rgba(11, 17, 32, 0.8)',
              backdropFilter: 'blur(5px)',
              boxShadow: 'none',
            }}>
              <Stack
                sx={{ width: "100%" }}
                direction={'row'}
                display={'flex'}
                alignItems={'center'}
                justifyContent={'space-between'}
              >
                <Typography variant="h6" component="div">
                  Création d'un nouveau dossier
                </Typography>
                <IconButton
                  edge="start"
                  color="inherit"
                  onClick={handleDialogClose}
                  aria-label="close"
                  style={{
                    // backgroundColor: 'red',
                    outline: 'none'
                  }}
                >
                  <CloseIcon />
                </IconButton>
              </Stack>
            </Toolbar>
          </AppBar>

          <Stack
            sx={{
              height: '100%',
              pt: '64px',
              overflow: 'hidden',
              backgroundColor: '#F8FAFC',
            }}
          >
            <Box
              sx={{
                flex: 1,
                overflowY: 'auto',
              }}
            >
              <AddNewFile confirmationState={handleCloseAfterNewFileCreation} refresh={() => setIsRefreshing(prev => !prev)} />
            </Box>
          </Stack>
        </Dialog>
        : null
      }

      <Box sx={{
        bgcolor: '#F8FAFC',
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <GlobalStyles styles={{
          body: { margin: 0, padding: 0, overflowX: 'hidden' },
          html: { margin: 0, padding: 0 }
        }} />

        <Box sx={{ width: '100%', px: 4, py: 1.5, borderBottom: '1px solid #E2E8F0', bgcolor: '#fff', boxSizing: 'border-box' }}>
          <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 600 }}>
            Accueil / <span style={{ color: '#1E293B' }}>Dossiers</span>
          </Typography>
        </Box>

        <Box sx={{ p: 4, width: '100%', boxSizing: 'border-box' }}>

          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 900, color: '#1E293B', letterSpacing: '-0.02em' }}>
              Dossiers
            </Typography>
            <Button
              variant="contained"
              onClick={handleDialogClickOpen}
              disableElevation
              startIcon={<AddIcon />}
              sx={{ bgcolor: TABLE_BLUE, borderRadius: '8px', textTransform: 'none', fontWeight: 700, px: 3, height: '40px' }}
            >
              Nouveau dossier
            </Button>
          </Stack>

          <Grid container spacing={2} sx={{ mb: 4, width: '100%', ml: 0 }}>
            <Grid item xs={3}>
              <MiniStatCard title="Dossiers" value={infoCardDossier.nbr_dossiers} color="#E0F2FE" icon={<FolderIcon sx={{ color: '#0EA5E9' }} />} />
            </Grid>
            <Grid item xs={3}>
              <MiniStatCard title="Portefeuilles" value={infoCardDossier.nbr_portefeuilles} color="#F5F3FF" icon={<WalletIcon sx={{ color: '#8B5CF6' }} />} />
            </Grid>
            <Grid item xs={3}>
              <MiniStatCard title="CAC" value={infoCardDossier.nbr_cac} color="#F0FDF4" icon={<GavelIcon sx={{ color: '#22C55E' }} />} />
            </Grid>
            <Grid item xs={3}>
              <MiniStatCard title="Experts" value={infoCardDossier.nbr_expertcomptable} color="#EFF6FF" icon={<PersonIcon sx={{ color: '#3B82F6' }} />} />
            </Grid>
          </Grid>

          <DatagridGlobal
            list={finalListeDossier}
            setList={setFinalListeDossier}
            columnHeader={tableheader}
            withAddButton={false}
            withColumnActions={false}
            setEditableRow={null}
            datagridHeight={'500px'}
          />

        </Box>
      </Box>
    </>
  )
};