import React, { useEffect, useState } from 'react';
import { Box, Button, Stack, TextField, Tooltip, Typography } from '@mui/material';
import { init } from '../../../../init';
import toast from 'react-hot-toast';
import { DataGrid, frFR } from '@mui/x-data-grid';
import Dialog from '@mui/material/Dialog';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import Slide from '@mui/material/Slide';
import AddNewFile from './Home_addNewFile';
import QuickFilter, { DataGridStyle } from '../../componentsTools/DatagridToolsStyle';
import useAuth from '../../../hooks/useAuth';
// import axios from '../../../../config/axios';
import { jwtDecode } from 'jwt-decode';
import PopupConfirmDelete from '../../componentsTools/popupConfirmDelete';
import { useNavigate } from 'react-router-dom';
import useFileInfos from '../../../hooks/useFileInfos';
import usePermission from '../../../hooks/usePermission';
import useAxiosPrivate from '../../../../config/axiosPrivate';
import PopupConfirmPasswordDossier from '../../componentsTools/Dossier/PopupConfirmPasswordDossier';
import { IoMdAdd } from "react-icons/io";
import CardInfoDossier from '../../componentsTools/Dossier/CardInfoDossier';
import { IoFolder } from "react-icons/io5";
import { BsWalletFill } from "react-icons/bs";
import { FaBalanceScale } from "react-icons/fa";
import { FaUser } from "react-icons/fa";
import { RiDeleteBin6Line } from "react-icons/ri";
import { FaEye } from "react-icons/fa";
import { FaLock, FaLockOpen } from "react-icons/fa";

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="right" ref={ref} {...props} />;
});

export default function Home() {
  const navigate = useNavigate();
  const axios = useAxiosPrivate();

  const { canAdd, canModify, canDelete, canView } = usePermission();

  let initial = init[0];
  let [listeDossier, setListeDossier] = useState([]);
  let [finalListeDossier, setFinalListeDossier] = useState([]);
  let [findText, setFindText] = useState('');
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

  //Chargement des données dans datagrid
  const GetListeDossier = () => {
    axios.get(`/home/file/${compteId}`, { params: { userId: userId } }).then((response) => {
      const resData = response.data;
      setListeDossier(resData.fileList);
      canView ? setFinalListeDossier(resData.fileList) : setFinalListeDossier([]);
    })
  }

  //Filtrer la liste des dossiers
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

  //Restaurer la liste des dossiers si le champ de filtre est vide
  const handleChangeFindText = (e) => {
    setFindText(e.target.value)
    if (e.target.value === '') {
      setFinalListeDossier(listeDossier);
    }
  }

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
    GetListeDossier();
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
          <FaLock color="gray" size={16} />
        ) : (
          <FaLockOpen color="gray" size={16} />
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
          <Tooltip title="Ouvrir le dossier">
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
              <IoFolder size={25} color="#67bed9" />
              {params.row.dossier}
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
            <FaUser size={16} />
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
            <FaUser size={16} />
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
            <FaUser size={16} />
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
                  // disabled={!canDelete || selectedDossierRow.length > 1 || selectedDossierRow.length === 0}
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
        setListeDossier(resData.fileList);
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
      {/* MODAL POUR LA SUPPRESSION D'UN DOSSIER */}
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
        >
          <AppBar sx={{ position: 'relative' }} style={{ backgroundColor: initial.theme }}>
            <Toolbar style={{ backgroundColor: initial.theme }}>
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
                    backgroundColor: 'red',
                    outline: 'none'
                  }}
                >
                  <CloseIcon />
                </IconButton>
              </Stack>
            </Toolbar>
          </AppBar>

          <AddNewFile confirmationState={handleCloseAfterNewFileCreation} />
        </Dialog>
        : null
      }
      <Box
        sx={{
          paddingX: 3,
          paddingY: 2,
          width: "100%",
        }}
      >
        <Stack width={"100%"} height={"100%"} spacing={1} alignItems={"start"}
          justifyContent={"stretch"} alignContent={"flex-start"}>
          <Typography variant='h6' sx={{ color: "black" }} align='left'><span style={{ color: 'grey', fontWeight: 'initial' }}>Accueil</span> / Dossiers</Typography>

          <Stack
            width={"100%"}
            direction={"row"}
            alignItems={"center"}
            justifyContent={"space-between"}
            style={{
              paddingBlock: '15px',
              paddingInline: '20px',
              backgroundColor: 'white',
              borderRadius: "10px"
            }}
          >
            <Stack>
              <Typography variant='h5' sx={{ color: "black", fontWeight: 'bold' }} align='left'>Dossiers</Typography>
            </Stack>
            <Stack>
              <Button
                disabled={!canAdd}
                onClick={handleDialogClickOpen}
                variant="contained"
                style={{
                  textTransform: 'none',
                  outline: 'none',
                  backgroundColor: initial.theme,
                  color: "white",
                  height: "39px",
                }}
                startIcon={<IoMdAdd size={20} />}
              >
                Nouveau dossier
              </Button>
            </Stack>
          </Stack>

          <Stack
            width={"100%"}
            direction={"row"}
            alignItems={"center"}
            justifyContent={"space-between"}
            style={{
              paddingBlock: '30px',
              paddingInline: '20px',
              backgroundColor: 'white',
              borderRadius: "10px",
              height: '120px'
            }}
            spacing={2}
          >
            <CardInfoDossier
              backgroundColor={'#edf3fe'}
              text={'Dossiers'}
              nbr={infoCardDossier.nbr_dossiers}
              nbrColor={'#67bed9'}
              icon={<IoFolder size={50} color='#67bed9' />}
            />
            <CardInfoDossier
              backgroundColor={'#f7f2fe'}
              text={'Portefeuilles'}
              nbr={infoCardDossier.nbr_portefeuilles}
              nbrColor={'#1a123a'}
              icon={<BsWalletFill size={50} color='#1a123a' />}
            />
            <CardInfoDossier
              backgroundColor={'#ecf9f6'}
              text={'CAC'}
              nbr={infoCardDossier.nbr_cac}
              nbrColor={'#307145'}
              icon={<FaBalanceScale size={50} color='#307145' />}
            />
            <CardInfoDossier
              backgroundColor={'#e9f6fe'}
              text={'Experts'}
              nbr={infoCardDossier.nbr_expertcomptable}
              nbrColor={'#2e76a2'}
              icon={<FaUser size={50} color='#2e76a2' />}
            />
          </Stack>

          <Stack
            width={"100%"}
            spacing={1}
            backgroundColor={"white"}
            padding={"20px"}
            borderRadius={"10px"}
          >
            <Stack width={"100%"} height={"10%"} spacing={1} alignItems={"center"} direction={"row"}>
              <Stack
                alignItems={"center"}
                alignContent={"center"}
                width={"300px"}
                justifyContent={"right"}
                paddingRight={"0px"}
                direction={"row"}
                spacing={0.5}
              >
              </Stack>
            </Stack>

            <Stack width={"100%"} height={"500px"} spacing={1} alignItems={"flex-start"} direction={"row"}>
              <DataGrid
                disableRowSelectionOnClick
                localeText={frFR.components.MuiDataGrid.defaultProps.localeText}
                sx={DataGridStyle.sx}
                rowHeight={DataGridStyle.rowHeight}
                columnHeaderHeight={DataGridStyle.columnHeaderHeight}
                rows={finalListeDossier}
                columns={tableheader}
                initialState={{
                  pagination: {
                    paginationModel: { page: 0, pageSize: 100 },
                  },
                }}
                slots={{
                  toolbar: QuickFilter,
                }}
                pageSizeOptions={[50, 100]}
                pagination={DataGridStyle.pagination}
                checkboxSelection={false}
                columnVisibilityModel={{
                  id: false,
                }}
              />
            </Stack>
          </Stack>
        </Stack>
      </Box>
    </>
  )
};