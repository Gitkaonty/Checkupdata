import React, { useEffect, useState } from 'react';
import {
    Box, Drawer, List, ListItemButton, ListItemIcon, ListItemText,
    Typography, Avatar, Badge, IconButton, Collapse, AppBar, Toolbar, Stack,
    Tooltip
} from '@mui/material';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

import HomeIcon from '@mui/icons-material/HomeOutlined';
import DashboardIcon from '@mui/icons-material/GridView';
import MenuIcon from '@mui/icons-material/Menu';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import { init } from '../../../../init';

import { exportList, importList, traitementList } from '../../humburgerMenu/subMenu/AdministrationLink';
import { fiscalesList, liassesList } from '../../humburgerMenu/subMenu/Revision';
import { declFiscalesList, declSocialesList } from '../../humburgerMenu/subMenu/Declaration';
import { comptaList, paramliassesList, socialesList } from '../../humburgerMenu/subMenu/Parametrage';
import AssessmentIcon from '@mui/icons-material/Assessment';
import BalanceIcon from '@mui/icons-material/Balance';
import DisplaySettingsIcon from '@mui/icons-material/DisplaySettings';

const initial = init[0];
const drawerWidth = 350;
const collapsedWidth = 88;
const ELECTRIC_BLUE = '#00F0FF';
const TOP_BLUE = '#0B1120';
const BOTTOM_BLACK = '#020617';

const mainSections = [
    {
        name: 'Administration',
        icon: <AssessmentIcon />,
        subSections: [
            { title: 'Traitement', list: traitementList },
            { title: 'Import', list: importList },
            { title: 'Export', list: exportList },
        ],
    },
    {
        name: 'Révision',
        icon: <DashboardIcon />,
        subSections: [
            { title: 'Liasses', list: liassesList },
            { title: 'Fiscales', list: fiscalesList },
        ],
    },
    {
        name: 'Déclaration',
        icon: <BalanceIcon />,
        subSections: [
            { title: 'Liasses fiscales', list: declFiscalesList },
            { title: 'Organismes', list: declSocialesList },
        ],
    },
    {
        name: 'Paramétrage',
        icon: <DisplaySettingsIcon />,
        subSections: [
            { title: 'Comptabilité', list: comptaList },
            { title: 'Liasses', list: paramliassesList },
            { title: 'Sociales', list: socialesList },
        ],
    },
];

function SectionList({ title, list, navigate, idDossier, sectionName, location, setIsCollapsed }) {
    return (
        <Stack sx={{ borderLeft: `2px solid rgba(0, 240, 255, 0.2)`, mt: 1.5 }}>
            <Typography
                variant="caption"
                sx={{
                    color: 'rgba(255,255,255,0.7)',
                    fontWeight: 800,
                    ml: 2.5,
                    mb: 1,
                    fontSize: '1rem',
                    display: 'block',
                }}
            >
                {title}
            </Typography>

            {[...list]
                .sort((a, b) => a.text.localeCompare(b.text))
                .map((item, index) => {
                    const pathToCheck = item.urldynamic && idDossier ? `${item.path}/${idDossier}` : item.path;
                    const isActive = location.pathname.startsWith(pathToCheck);

                    const ButtonContent = (
                        <ListItemButton
                            key={`${sectionName}-${title}-${item.name}-${index}`}
                            onClick={() => {
                                if (pathToCheck) {
                                    setIsCollapsed(true);
                                    setTimeout(() => {
                                        navigate(pathToCheck);
                                    }, 500);
                                }
                            }}
                            sx={{
                                py: 0.5,
                                color: isActive ? ELECTRIC_BLUE : 'rgba(255,255,255,0.5)',
                                borderRadius: '4px',
                                ml: 1,
                                backgroundColor: isActive ? 'rgba(0, 240, 255, 0.08)' : 'transparent',
                            }}
                        >
                            <ListItemText
                                primary={item.text}
                                primaryTypographyProps={{ fontSize: '0.85rem' }}
                            />
                        </ListItemButton>
                    );

                    return item.toolTip ? (
                        <Tooltip key={`${sectionName}-${title}-${item.name}-${index}`} title={item.toolTip} >
                            {ButtonContent}
                        </Tooltip>
                    ) : (
                        ButtonContent
                    );
                })}
        </Stack>
    );
}
const Layout = () => {
    const [isCollapsed, setIsCollapsed] = useState(true);
    const location = useLocation();
    const [activeItem, setActiveItem] = useState('');
    const [openSubMenus, setOpenSubMenus] = useState({ administration: false, revision: false, declaration: false, parametrage: false });
    let idDossier = null;
    if (typeof window !== 'undefined') {
        idDossier = sessionStorage.getItem("fileId");
    }
    const navigate = useNavigate();

    const toggleSidebar = () => setIsCollapsed(!isCollapsed);

    useEffect(() => {
        const getActiveSection = () => {
            for (const section of mainSections) {
                for (const sub of section.subSections) {
                    for (const item of sub.list) {
                        const pathToCheck = item.urldynamic && idDossier ? `${item.path}/${idDossier}` : item.path;
                        if (location.pathname.startsWith(pathToCheck)) {
                            return `${section.name}-${item.name}`;
                        }
                    }
                }
            }
            return '';
        };

        const newActiveItem = getActiveSection();
        if (newActiveItem && newActiveItem !== activeItem) {
            setActiveItem(newActiveItem);
        }
    }, [location.pathname, idDossier]);

    const getItemStyle = (name, isActive) => ({
        borderRadius: '10px',
        mb: 0.8,
        backgroundColor: isActive ? 'rgba(0, 240, 255, 0.08)' : 'transparent',
        border: isActive ? `1px solid rgba(0, 240, 255, 0.2)` : '1px solid transparent',
        '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.04)' },
        transition: 'all 0.3s ease',
    });

    return (
        <Stack
            sx={{
                display: 'absolute',
                width: '100%',
                height: '100%',
                bgcolor: initial.backgroundColor,
                overflowX: 'hidden'
            }}
        >

            <AppBar
                position="fixed"
                sx={{
                    width: `calc(100% - ${isCollapsed ? collapsedWidth : drawerWidth}px)`,
                    ml: `${isCollapsed ? collapsedWidth : drawerWidth}px`,
                    transition: 'all 0.3s ease',
                    background: 'rgba(11, 17, 32, 0.8)',
                    backdropFilter: 'blur(12px)',
                    boxShadow: 'none',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                }}
            >
                <Toolbar sx={{ justifyContent: 'space-between', px: 3 }}>

                    <Stack direction="row" spacing={2} alignItems="center">
                        <Avatar
                            variant="rounded"
                            sx={{
                                width: 32, height: 32,
                                bgcolor: 'rgba(0, 240, 255, 0.1)',
                                color: ELECTRIC_BLUE,
                                border: `1px solid ${ELECTRIC_BLUE}44`,
                                fontWeight: 'bold', fontSize: '0.8rem'
                            }}
                        >
                            EC
                        </Avatar>
                        <Box>
                            <Typography variant="subtitle2" sx={{ color: '#fff', fontWeight: 600, lineHeight: 1.2 }}>
                                Espace Client
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>
                                Instance Production
                            </Typography>
                        </Box>
                    </Stack>

                    <Stack direction="row" spacing={3} alignItems="center">
                        <IconButton sx={{ color: 'rgba(255,255,255,0.5)' }}>
                            <Badge variant="dot" color="error">
                                <NotificationsNoneIcon />
                            </Badge>
                        </IconButton>

                        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ cursor: 'pointer' }}>
                            <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
                                <Typography variant="subtitle2" sx={{ color: '#fff', fontWeight: 600, lineHeight: 1.2 }}>
                                    Jonathan
                                </Typography>
                                <Typography variant="caption" sx={{ color: ELECTRIC_BLUE, fontWeight: 500 }}>
                                    Administrateur
                                </Typography>
                            </Box>
                            <Avatar
                                src="https://i.pravatar.cc/150?u=bk"
                                sx={{ width: 38, height: 38, border: '2px solid rgba(255,255,255,0.1)' }}
                            />
                            <KeyboardArrowDownIcon sx={{ color: 'rgba(255,255,255,0.3)', fontSize: 18 }} />
                        </Stack>
                    </Stack>
                </Toolbar>
            </AppBar>

            <Drawer
                variant="permanent"
                sx={{
                    width: isCollapsed ? collapsedWidth : drawerWidth,
                    transition: 'width 0.3s ease',
                    '& .MuiDrawer-paper': {
                        width: isCollapsed ? collapsedWidth : drawerWidth,
                        transition: 'width 0.3s ease',
                        background: `linear-gradient(180deg, ${TOP_BLUE}CC 0%, ${BOTTOM_BLACK} 100%)`,
                        backdropFilter: 'blur(10px)',
                        WebkitBackdropFilter: 'blur(10px)',
                        color: '#FFFFFF',
                        padding: '20px 16px',
                        borderRight: '1px solid rgba(255, 255, 255, 0.1)',
                        overflowX: 'hidden',
                        overflowY: 'auto',
                        scrollbarWidth: 'thin',
                        scrollbarColor: 'rgba(255,255,255,0.3) transparent',
                        '&::-webkit-scrollbar': {
                            width: '6px',
                        },
                        '&::-webkit-scrollbar-thumb': {
                            backgroundColor: 'rgba(255,255,255,0.3)',
                            borderRadius: '3px',
                        },
                        '&::-webkit-scrollbar-track': {
                            backgroundColor: 'transparent',
                        },
                        position: 'absolute',
                        top: 0,
                        left: 0,
                    },
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 6, mt: 1, justifyContent: isCollapsed ? 'center' : 'space-between' }}>
                    {!isCollapsed && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box sx={{ bgcolor: ELECTRIC_BLUE, borderRadius: '8px', p: 0.6, display: 'flex', boxShadow: `0 0 15px ${ELECTRIC_BLUE}33` }}>
                                <AutoAwesomeIcon fontSize="small" sx={{ color: '#000' }} />
                            </Box>
                            <Typography variant="h6" fontWeight="800" sx={{ letterSpacing: '-0.5px' }}>Kaonty</Typography>
                        </Box>
                    )}
                    <IconButton onClick={toggleSidebar} size="small" sx={{ color: 'rgba(255,255,255,0.3)', '&:hover': { color: ELECTRIC_BLUE } }}>
                        <MenuIcon />
                    </IconButton>
                </Box>

                <List disablePadding sx={{ flexGrow: 1 }}>
                    <ListItemButton
                        onClick={() => {
                            setIsCollapsed(true);
                            setTimeout(() => {
                                if (idDossier) navigate(`/tab/home`);
                            }, 300);
                        }}
                        sx={{
                            ...getItemStyle('Accueil'),
                            backgroundColor: location.pathname === '/tab/home' ? 'rgba(0, 240, 255, 0.08)' : 'transparent',
                        }}
                    >
                        <ListItemIcon sx={{
                            color: location.pathname === '/tab/home' ? ELECTRIC_BLUE : '#64748B',
                            minWidth: isCollapsed ? 0 : 40,
                            justifyContent: 'center',
                        }}>
                            <HomeIcon />
                        </ListItemIcon>
                        {!isCollapsed && (
                            <ListItemText
                                primary="Accueil"
                                primaryTypographyProps={{
                                    fontSize: '0.9rem',
                                    fontWeight: location.pathname === '/tab/home' ? 600 : 400
                                }}
                            />
                        )}
                    </ListItemButton>

                    <ListItemButton
                        onClick={() => {
                            setIsCollapsed(true);
                            setTimeout(() => {
                                if (idDossier) navigate(`/tab/dashboard/${idDossier}`);
                            }, 300);
                        }}
                        sx={{
                            ...getItemStyle('Dashboard'),
                            backgroundColor: location.pathname.startsWith(`/tab/dashboard`) ? 'rgba(0, 240, 255, 0.08)' : 'transparent',
                        }}
                    >
                        <ListItemIcon sx={{
                            color: location.pathname.startsWith(`/tab/dashboard`) ? ELECTRIC_BLUE : '#64748B',
                            minWidth: isCollapsed ? 0 : 40,
                            justifyContent: 'center',
                        }}>
                            <DashboardIcon />
                        </ListItemIcon>
                        {!isCollapsed && (
                            <ListItemText
                                primary="Tableau de bord"
                                primaryTypographyProps={{
                                    fontSize: '0.9rem',
                                    fontWeight: location.pathname.startsWith(`/tab/dashboard`) ? 600 : 400
                                }}
                            />
                        )}
                    </ListItemButton>

                    {mainSections.map((section) => {
                        const isMotherActive = section.subSections.some((sub) =>
                            sub.list.some((item) => {
                                const pathToCheck = item.urldynamic && idDossier ? `${item.path}/${idDossier}` : item.path;
                                return location.pathname.startsWith(pathToCheck);
                            })
                        );
                        return (
                            <Box key={section.name}>
                                <ListItemButton
                                    onClick={() => {
                                        setActiveItem(section.name);
                                        if (!isCollapsed)
                                            setOpenSubMenus((prev) => ({
                                                ...prev,
                                                [section.name.toLowerCase()]: !prev[section.name.toLowerCase()],
                                            }));
                                        setIsCollapsed(false);
                                    }}
                                    sx={{
                                        ...getItemStyle(section.name),
                                        backgroundColor: isMotherActive ? 'rgba(0, 240, 255, 0.08)' : 'transparent',
                                        border: isMotherActive ? `1px solid rgba(0, 240, 255, 0.2)` : '1px solid transparent',
                                    }}
                                >
                                    <ListItemIcon
                                        sx={{
                                            color: isMotherActive ? ELECTRIC_BLUE : '#64748B',
                                            minWidth: isCollapsed ? 0 : 40,
                                            justifyContent: 'center',
                                        }}
                                    >
                                        {section.icon}
                                    </ListItemIcon>

                                    {!isCollapsed && (
                                        <>
                                            <ListItemText
                                                primary={section.name}
                                                primaryTypographyProps={{ fontSize: '0.9rem' }}
                                            />
                                            {openSubMenus[section.name.toLowerCase()] ? (
                                                <ExpandLess sx={{ fontSize: 18 }} />
                                            ) : (
                                                <ExpandMore sx={{ fontSize: 18 }} />
                                            )}
                                        </>
                                    )}
                                </ListItemButton>

                                <Collapse
                                    in={openSubMenus[section.name.toLowerCase()] && !isCollapsed}
                                    timeout="auto"
                                >
                                    <Box sx={{ mt: 1, ml: 5 }}>
                                        {section.subSections.map((sub, index) => (
                                            <SectionList
                                                key={`${section.name}-${sub.title}-${index}`}
                                                sectionName={section.name}
                                                title={sub.title}
                                                list={sub.list}
                                                activeItem={activeItem}
                                                setActiveItem={setActiveItem}
                                                isCollapsed={isCollapsed}
                                                setIsCollapsed={setIsCollapsed}
                                                navigate={navigate}
                                                idDossier={idDossier}
                                                location={location}
                                            />
                                        ))}
                                    </Box>
                                </Collapse>
                            </Box>
                        )
                    })}
                </List>
            </Drawer>

            <Box
                sx={{
                    position: 'relative',
                    zIndex: 200,
                    width: `calc(100% - ${collapsedWidth}px)`,
                    marginLeft: '90px',
                    marginTop: '60px',
                }}>
                <Outlet />
            </Box>

        </Stack>
    );
};

export default Layout;