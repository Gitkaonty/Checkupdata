import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { styled, useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import MuiDrawer from '@mui/material/Drawer';
import MuiAppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import List from '@mui/material/List';
import CssBaseline from '@mui/material/CssBaseline';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import { Stack, Menu, MenuItem, Divider, GlobalStyles } from '@mui/material';
import { init } from '../../init';
import { Outlet } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import Dialog from '@mui/material/Dialog';
import useLogout from '../hooks/useLogout';
import { BsEscape } from "react-icons/bs";
import { TbPasswordUser } from "react-icons/tb";
import humburgerMenu from '../components/humburgerMenu/menuContent';
// import Administration from '../components/humburgerMenu/subMenu/Administration';
// import Declaration from '../components/humburgerMenu/subMenu/Declaration';
// import Parametrages from '../components/humburgerMenu/subMenu/Parametrages';
// import Revisions from '../components/humburgerMenu/subMenu/Revisions';
import useAuth from '../hooks/useAuth';
import { jwtDecode } from 'jwt-decode';
import { useLocation } from "react-router-dom";
import { MdAccountBox } from "react-icons/md";
import { RiAccountBoxLine } from "react-icons/ri";

import PopupDisconnectCompte from '../components/menuComponent/Compte/PopupDisconnectCompte';
import PopupPasswordChange from '../components/menuComponent/Compte/PopupPasswordChange';
import axios from '../../config/axios';
import Layout from '../components/componentsTools/Home/Layout';
import { usePageTitle } from '../hooks/usePageTitle';
const drawerWidth = 240;

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialogContent-root': {
    padding: theme.spacing(2),
  },
  '& .MuiDialogActions-root': {
    padding: theme.spacing(1),
  },
}));

//Création des composants pour le menu-------------------------------------------------------------------
const openedMixin = (theme) => ({
  width: drawerWidth,
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: 'hidden',
});

const closedMixin = (theme) => ({
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: 'hidden',
  width: `calc(${theme.spacing(7)} + 1px)`,
  [theme.breakpoints.up('sm')]: {
    width: `calc(${theme.spacing(8)} + 1px)`,
  },
});

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})(({ theme, open }) => ({
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(['width', 'margin'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const Drawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open }) => ({
    width: drawerWidth,
    flexShrink: 0,
    whiteSpace: 'nowrap',
    boxSizing: 'border-box',
    ...(open && {
      ...openedMixin(theme),
      '& .MuiDrawer-paper': openedMixin(theme),
    }),
    ...(!open && {
      ...closedMixin(theme),
      '& .MuiDrawer-paper': closedMixin(theme),
    }),
  }),
);

const ProfileImage = ({ name }) => {
  const nameParts = name.split(" ");
  const firstNameInitial = nameParts[0] ? nameParts[0][0].toUpperCase() : "";
  const lastNameInitial = nameParts[1] ? nameParts[1][0].toUpperCase() : "";

  return (
    <span
      className="user-profile-image"
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100%",
        width: "100%",
        fontSize: "16px",
        lineHeight: "1",
        backgroundColor: "transparent",
      }}
    >
      {firstNameInitial}{lastNameInitial}
    </span>
  );
};

export default function HomePage() {
  //Récupérer les données de l'utilisateur
  const { auth } = useAuth();
  const location = useLocation();
  const title = usePageTitle();
  const parts = title.split(' / ');
  const before = parts[0] || '';
  const after = parts[1] || '';

  //paramètres de connexion------------------------------------
  const decoded = auth?.accessToken
    ? jwtDecode(auth.accessToken)
    : undefined

  const roles = decoded.UserInfo.roles;
  const compteId = decoded.UserInfo.compteId || null;
  const userId = decoded.UserInfo.userId || null;
  const username = decoded.UserInfo.username || null;
  const comptename = decoded.UserInfo.compte || null;

  const [isButtonAddVisible, setIsButtonAddVisible] = useState(false);
  const [isOpenPopupAddCompte, setIsOpenAddCompte] = useState(false);
  const [isOpenPopupDisconnect, setIsOpenPopupDisconnect] = useState(false);
  const [isOpenPopupChangePassword, setOpenPopupChangePassword] = useState(false);
  const [isButtonRolePermissionVisible, setIsButtonRolePermissionVisible] = useState(false);

  const [activeMenu, setActiveMenu] = useState("");
  const [listePortefeuille, setListePortefeuille] = useState([]);
  const [listeDossier, setListeDossier] = useState([]);
  const [listeRoles, setListeRoles] = useState([]);
  const [consolidation, setConsolidation] = useState([]);

  let idDossier = null;
  if (typeof window !== 'undefined') {
    idDossier = sessionStorage.getItem("fileId");
  }

  const navigate = useNavigate();
  let initial = init[0];
  const theme = useTheme();

  const [open, setOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState();

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
    // handleCloseSubMenu(false);
    setActiveMenu("");
  };

  //Choix d'affichage de sous menu----------------------------------------
  const [subMenuState, setSubMenuState] = useState({
    administration: false,
    revision: false,
    declaration: false,
    parametrages: false
  });

  function showSubMenu(name, subMenu, path, urlDynamic) {
    if (!subMenu) {
      setSubMenuState({
        administration: false,
        revision: false,
        declaration: false,
        parametrages: false,
      });

      if (urlDynamic) {
        navigate(`${path}/${idDossier}`);
      } else {
        navigate(path);
      }
      setOpen(false);
      setActiveMenu(path);
      return;
    }

    setSubMenuState(prev => {
      const isOpen = !!prev[name];
      const reset = {
        administration: false,
        revision: false,
        declaration: false,
        parametrages: false,
      };

      setActiveMenu(prevActive => (isOpen && prevActive === path ? "" : path));

      return isOpen ? reset : { ...reset, [name]: true };
    });
  }

  const handleCloseSubMenu = (newState) => {
    setSubMenuState({
      administration: newState,
      revision: newState,
      declaration: newState,
      parametrages: newState
    });
  }

  const subMenuPathNavigation = (path) => {
    setSubMenuState({
      administration: false,
      revision: false,
      declaration: false,
      parametrages: false
    });
    navigate(path);
    setOpen(false);
  }

  const GetInfosIdDossier = (id) => {
    axios.get(`/home/FileInfos/${id}`).then((response) => {
      const resData = response.data;
      if (resData.state) {
        setConsolidation(resData.fileInfos[0].consolidation);
      } else {
        setConsolidation(false);
      }
    });
  };

  //Fonction de deconnexion--------------------------------------------
  const logout = useLogout();

  const disconnect = async () => {
    await logout();
    navigate("/");
  }

  //Fonction de changement de mot de passe--------------------------------------------
  const [openPwdModificationModal, setOpenPwdModificationModal] = useState(false);
  const handleClickOpenPwdModificationModal = () => {
    setOpenPwdModificationModal(true);
    handleClose();
  };
  const handleClickClosePwdModificationModal = () => {
    setOpenPwdModificationModal(false);
  };

  //Creation de la liste du menu-------------------------------------------------
  const MenuSide = humburgerMenu;

  const setShowPopupDisconnect = (value) => {
    setIsOpenPopupDisconnect(value);
  }

  const setShowPopupChangePassword = (value) => {
    setOpenPopupChangePassword(value);
  }

  // Charger la liste des portefeuille
  const getAllPortefeuille = () => {
    axios.get(`/param/portefeuille/getAllPortefeuille/${compteId}`)
      .then(response => {
        const resData = response?.data;
        if (resData?.state) {
          setListePortefeuille(resData?.list)
        } else {
          toast.error(resData?.message);
        }
      })
  };

  // Charger la liste des dossier liés au compte
  const getAllDossierByCompte = () => {
    axios.get(`/home/getAllDossierByCompte/${compteId}`)
      .then(response => {
        const resData = response?.data;
        if (resData?.state) {
          setListeDossier(resData?.fileList);
        } else {
          toast.error(resData?.message);
        }
      })
  }

  // Récupérer la liste des roles
  const getAllRoles = () => {
    axios.get('sous-compte/getAllRoles')
      .then(response => {
        const resData = response?.data;
        setListeRoles(resData);
      })
  }

  const handleNavigateToRolePermission = () => {
    const currentPath = window.location.pathname;

    if (currentPath === '/tab/parametrages/role-permission') {
      return;
    }

    const url = window.location.origin + '/tab/parametrages/role-permission';
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  useEffect(() => {
    if ([5150, 3355].includes(roles)) {
      setIsButtonAddVisible(true);
      setIsButtonRolePermissionVisible(true);
    }
  }, [roles])

  useEffect(() => {
    getAllPortefeuille();
    getAllDossierByCompte();
    getAllRoles();
  }, [compteId]);

  useEffect(() => {
    GetInfosIdDossier(idDossier);
  }, [idDossier]);

  return (
    <>
      {
        isOpenPopupDisconnect && (
          <PopupDisconnectCompte open={isOpenPopupDisconnect} handleClose={() => setShowPopupDisconnect(false)} handleDisconnect={disconnect} />
        )
      }

      {
        isOpenPopupChangePassword && (
          <PopupPasswordChange open={isOpenPopupChangePassword} onClose={() => setShowPopupChangePassword(false)} id_compte={userId} />
        )
      }

      <Box
        sx={{
          width: "100%",
          height: "100vh",
          overflowX: open ? "hidden" : "",
          overflowY: open ? "hidden" : "",
          position: 'relative'
        }}
      >
        <CssBaseline />

        <Layout />

      </Box>
      <Box
        sx={{
          position: 'absolute',
          top: '64px',
          left: 90,
          right: 0,
          bottom: 0,
          overflowY: 'auto',
          width: `calc(100% - 88px)`,
          px: 0,
          py: 0,
        }}
      >
        <Box sx={{
          bgcolor: '#F8FAFC',
          width: '100%',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <GlobalStyles styles={{
            body: { margin: 0, padding: 0, overflowX: 'hidden' },
            html: { margin: 0, padding: 0 }
          }} />
          {
            before && after && (
              <Box sx={{ width: '100%', px: 4, py: 1.5, borderBottom: '1px solid #E2E8F0', bgcolor: '#fff', boxSizing: 'border-box' }}>
                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                  <span style={{ color: '#94A3B8' }}>{before}</span>
                  {after && <span style={{ color: '#94A3B8' }}> / </span>}
                  <span style={{ color: '#1E293B' }}>{after}</span>
                </Typography>
              </Box>
            )
          }
          <Outlet />
        </Box>
      </Box>
    </>
  );
}