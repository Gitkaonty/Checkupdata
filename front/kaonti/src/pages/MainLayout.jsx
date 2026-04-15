import React, { useState } from 'react';
import {
  Box, Drawer, AppBar, Toolbar, List, Typography, Divider,
  Avatar, Badge, Stack, Menu, MenuItem, Collapse,
  ButtonBase, ListItemButton, ListItemIcon, ListItemText,
  IconButton
} from '@mui/material';
import {
  DashboardOutlined, HomeOutlined, SettingsOutlined,
  NotificationsOutlined, LogoutOutlined, PersonOutline,
  ExpandLess, ExpandMore, AccountBalanceWalletOutlined,
  BusinessOutlined, HistoryOutlined
} from '@mui/icons-material';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const drawerWidth = 280;
const closedDrawerWidth = 80;

const MainLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [isHovered, setIsHovered] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  
  // États pour l'ouverture des dossiers
  const [openTraitement, setOpenTraitement] = useState(true);
  const [openExport, setOpenExport] = useState(false);
  const [openParams, setOpenParams] = useState(false);

  const handleUserMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleUserMenuClose = () => setAnchorEl(null);

  // --- CONFIGURATION DES MENUS ---
  const traitementItems = [
    { label: 'Consultation', path: '/traitement/consultation' },
    { label: 'Import journal', path: '/traitement/importjournal' },
    { label: 'Dossier de révision', path: '/traitement/dossierrevision' },
    { 
      label: 'Export', 
      isSubmenu: true, 
      children: [
        { label: 'Balance', path: '/traitement/export/balance' },
        { label: 'Grand Livre', path: '/traitement/export/grandlivre' },
        { label: 'Journal', path: '/traitement/export/journal' },
      ]
    },
  ];

  const paramItems = [
    { label: 'CRM', path: '/parametres/crm' },
    { label: 'Exercice', path: '/parametres/exercice' },
    { label: 'Portefeuille', path: '/parametres/portefeuille' },
    { label: 'Gestion des contrôles', path: '/parametres/gestioncontrole' },
  ];

  const drawer = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: '#0F172A', color: '#FFFFFF' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Box sx={{ p: 3, display: 'flex', alignItems: 'center', height: 64 }}>
        <Avatar sx={{ width: 32, height: 32, bgcolor: '#10B981', fontWeight: 'bold', fontSize: 14 }}>Cd</Avatar>
        {isHovered && <Typography variant="h6" sx={{ml:1, fontWeight: 800, color: 'white', letterSpacing: '-0.5px' }}>
          Checkup<span style={{ color: '#10B981' }}>Data</span>
        </Typography>}
      </Box>

      <List sx={{ px: 2, flexGrow: 1 }}>
        <ListItemButton onClick={() => navigate('/home')} selected={location.pathname === '/home'} sx={menuItemStyle}>
          <ListItemIcon sx={iconStyle}><HomeOutlined /></ListItemIcon>
          <ListItemText primary="Accueil" sx={{ opacity: isHovered ? 1 : 0 }} />
        </ListItemButton>

        <ListItemButton onClick={() => navigate('/dashboard')} selected={location.pathname === '/dashboard'} sx={menuItemStyle}>
          <ListItemIcon sx={iconStyle}><DashboardOutlined /></ListItemIcon>
          <ListItemText primary="Dashboard" sx={{ opacity: isHovered ? 1 : 0 }} />
        </ListItemButton>

        <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.05)' }} />

        <Box>
          <ListItemButton onClick={() => setOpenTraitement(!openTraitement)} sx={menuItemStyle}>
            <ListItemIcon sx={iconStyle}><AccountBalanceWalletOutlined /></ListItemIcon>
            <ListItemText primary="Traitement" sx={{ opacity: isHovered ? 1 : 0 }} />
            {isHovered && (openTraitement ? <ExpandLess /> : <ExpandMore />)}
          </ListItemButton>

          <Collapse in={openTraitement && isHovered} timeout="auto" unmountOnExit>
            <Box sx={{ ml: 2.5, pl: 2, borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
              {traitementItems.map((item) => (
                <React.Fragment key={item.label}>
                  {item.isSubmenu ? (
                    <>
                      <ListItemButton onClick={() => setOpenExport(!openExport)} sx={subItemStyle}>
                        <ListItemText primary={item.label} />
                        {openExport ? <ExpandLess sx={{ fontSize: 16 }} /> : <ExpandMore sx={{ fontSize: 16 }} />}
                      </ListItemButton>
                      <Collapse in={openExport} timeout="auto">
                        <Box sx={{ ml: 1, pl: 2, borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
                          {item.children.map((child) => (
                            <ListItemButton 
                              key={child.label} 
                              component={Link} 
                              to={child.path}
                              selected={location.pathname === child.path}
                              sx={subItemStyle}
                            >
                              <ListItemText primary={child.label} primaryTypographyProps={{ fontSize: '0.75rem' }} />
                            </ListItemButton>
                          ))}
                        </Box>
                      </Collapse>
                    </>
                  ) : (
                    <ListItemButton 
                      component={Link} 
                      to={item.path} 
                      selected={location.pathname === item.path}
                      sx={subItemStyle}
                    >
                      <ListItemText primary={item.label} />
                    </ListItemButton>
                  )}
                </React.Fragment>
              ))}
            </Box>
          </Collapse>
        </Box>

        <Box sx={{ mt: 1 }}>
          <ListItemButton onClick={() => setOpenParams(!openParams)} sx={menuItemStyle}>
            <ListItemIcon sx={iconStyle}><SettingsOutlined /></ListItemIcon>
            <ListItemText primary="Paramètres" sx={{ opacity: isHovered ? 1 : 0 }} />
            {isHovered && (openParams ? <ExpandLess /> : <ExpandMore />)}
          </ListItemButton>

          <Collapse in={openParams && isHovered} timeout="auto" unmountOnExit>
            <Box sx={{ ml: 2.5, pl: 2, borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
                {paramItems.map((item) => (
                <ListItemButton
                    key={item.label}
                    component={Link}
                    to={item.path}
                    selected={location.pathname === item.path}
                    sx={subItemStyle}
                >
                    <ListItemText primary={item.label} />
                </ListItemButton>
                ))}
            </Box>
          </Collapse>
        </Box>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', bgcolor: '#ffffff', minHeight: '100vh' }}>
        <AppBar
            position="fixed"
            elevation={0}
            sx={{
                width: { sm: `calc(100% - ${isHovered ? drawerWidth : closedDrawerWidth}px)` },
                ml: { sm: `${isHovered ? drawerWidth : closedDrawerWidth}px` },
                bgcolor: 'rgba(15, 23, 42, 0.9)',
                backdropFilter: 'blur(12px)',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                transition: 'all 0.3s ease',
                zIndex: (theme) => theme.zIndex.drawer + 1,
            }}
            >
            <Toolbar sx={{ justifyContent: 'space-between', px: 3 }}>
                <Stack direction="row" spacing={2} alignItems="center">
                    <Box sx={{ p: 1, borderRadius: '8px', bgcolor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center' }}>
                        <BusinessOutlined sx={{ color: '#10B981', fontSize: 20 }} />
                    </Box>
                    <Box>
                        <Typography variant="caption" sx={{ color: '#64748B', display: 'block', fontWeight: 600, fontSize: '0.65rem', textTransform: 'uppercase' }}>
                            Espace Client
                        </Typography>
                        <Typography variant="subtitle2" sx={{ color: '#F8FAFC', fontWeight: 700 }}>
                            Cabinet Randria & Associés
                        </Typography>
                    </Box>
                </Stack>

                <Stack direction="row" spacing={3} alignItems="center">
                    <IconButton sx={{ color: '#64748B' }}>
                        <Badge badgeContent={4} color="error"><NotificationsOutlined /></Badge>
                    </IconButton>
                    
                    {/* --- BOUTON PROFILE --- */}
                    <ButtonBase onClick={handleUserMenuOpen} sx={{ p: 0.5, pr: 1.5, borderRadius: '12px', transition: '0.2s', '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' } }}>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                            <Avatar sx={{ width: 38, height: 38, bgcolor: '#1E293B', color: '#10B981', fontSize: 14, fontWeight: 'bold', border: '1px solid rgba(16, 185, 129, 0.2)' }}>DR</Avatar>
                            <Box sx={{ display: { xs: 'none', md: 'block' }, textAlign: 'left' }}>
                                <Typography variant="subtitle2" sx={{ color: '#F8FAFC', fontWeight: 600 }}>Daniela Randria</Typography>
                                <Typography variant="caption" sx={{ color: '#64748B' }}>Administrateur</Typography>
                            </Box>
                            <ExpandMore sx={{ color: '#64748B', fontSize: 18, transform: anchorEl ? 'rotate(180deg)' : 'none', transition: '0.3s' }} />
                        </Stack>
                    </ButtonBase>

                    {/* --- MENU DEROULANT REINSTAURÉ --- */}
                    <Menu
                      anchorEl={anchorEl}
                      open={Boolean(anchorEl)}
                      onClose={handleUserMenuClose}
                      PaperProps={{
                        sx: {
                          mt: 1.5,
                          width: 200,
                          borderRadius: '12px',
                          bgcolor: '#0F172A',
                          color: '#F8FAFC',
                          border: '1px solid rgba(255,255,255,0.08)',
                          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)',
                          '& .MuiMenuItem-root': {
                            fontSize: '0.85rem',
                            py: 1.2,
                            px: 2,
                            gap: 1.5,
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' },
                            '& .MuiSvgIcon-root': { fontSize: 18, color: '#64748B' }
                          }
                        }
                      }}
                      transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                    >
                      <MenuItem onClick={handleUserMenuClose}>
                        <PersonOutline /> Mon profil
                      </MenuItem>
                      <MenuItem onClick={handleUserMenuClose}>
                        <SettingsOutlined /> Paramètres
                      </MenuItem>
                      <Divider sx={{ my: 1, borderColor: 'rgba(255,255,255,0.05)' }} />
                      <MenuItem onClick={() => { handleUserMenuClose(); navigate('/login'); }} sx={{ color: '#EF4444' }}>
                        <LogoutOutlined sx={{ color: '#EF4444 !important' }} /> Se déconnecter
                      </MenuItem>
                    </Menu>
                </Stack>
            </Toolbar>
        </AppBar>

      <Box component="nav" sx={{ width: { sm: isHovered ? drawerWidth : closedDrawerWidth }, transition: '0.3s' }}>
        <Drawer variant="permanent" sx={{ '& .MuiDrawer-paper': { width: isHovered ? drawerWidth : closedDrawerWidth, bgcolor: '#0F172A', transition: '0.3s', overflowX: 'hidden', borderRight: '1px solid rgba(255,255,255,0.05)' } }} open>
          {drawer}
        </Drawer>
      </Box>

      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8 }}>
        {children}
      </Box>
    </Box>
  );
};

// --- STYLES ---
const menuItemStyle = {
  borderRadius: '8px', mb: 0.5, color: '#94A3B8',
  '&.Mui-selected': { bgcolor: 'rgba(16, 185, 129, 0.1) !important', color: '#10B981', '& .MuiListItemIcon-root': { color: '#10B981' } },
  '&:hover': { bgcolor: 'rgba(255,255,255,0.03)', color: '#FFFFFF' }
};

const subItemStyle = {
  borderRadius: '6px', mb: 0.2, color: '#64748B', position: 'relative',
  '&:before': { content: '""', position: 'absolute', left: -16, top: '50%', width: 12, height: '1px', bgcolor: 'rgba(255,255,255,0.1)' },
  '&:hover': { color: '#10B981', bgcolor: 'transparent' },
  '&.Mui-selected': { color: '#10B981', '& .MuiTypography-root': { fontWeight: 800 } },
  '& .MuiTypography-root': { fontSize: '0.85rem', fontWeight: 500 }
};

const iconStyle = { minWidth: 40, color: 'inherit' };

export default MainLayout;