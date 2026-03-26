import React, { useState } from 'react';
import {
  Box, TextField, Button, Typography, Checkbox,
  FormControlLabel, InputAdornment, IconButton,
  Grid, createTheme, ThemeProvider, CssBaseline, alpha, Divider
} from '@mui/material';
import {
  Visibility, VisibilityOff, MailOutlineRounded,
  LockOutlined, VerifiedUserRounded, ArrowForwardRounded,
  SettingsSuggestRounded, RuleRounded, AccountBalanceWalletRounded
} from '@mui/icons-material';

import useAuth from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from '../../config/axios';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#00E5FF' },
    background: { default: '#FFFFFF' },
  },
  typography: {
    fontFamily: '"Inter", sans-serif',
    h3: { fontWeight: 900, letterSpacing: '-2px' }
  },
});

export default function KaontyProSplit() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { setAuth } = useAuth();
  const navigate = useNavigate();

  const textFieldStyle = {
    '& .MuiOutlinedInput-root': {
      borderRadius: '4px',
      backgroundColor: '#FCFCFC',
      '& fieldset': { borderColor: '#E2E8F0' },
      '&:hover fieldset': { borderColor: '#CBD5E1' },
      '&.Mui-focused fieldset': { borderColor: '#00E5FF', borderWidth: '1px' },
    },
    '& input': { fontSize: '0.9rem', py: 1.5 }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {

      const response = await axios.post('/', { email, password },
        {
          headers: { 'Content-Type': 'application/json' },
          withCredentials: true
        }
      );

      const accessToken = response?.data?.accessToken;
      setAuth({ accessToken });
      navigate("/tab/home");
    } catch (err) {
      if (!err.response) {
        toast.error('Le serveur ne repond pas');
      } else if (err.response?.status === 400) {
        toast.error('Veuillez insérer votre email et mot de passe correctement');
      } else if (err.response?.status === 401) {
        toast.error(err.response?.data?.message);
      } else {
        toast.error('Erreur de connexion');
      }
    }
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Grid container sx={{ minHeight: '100vh' }}>

        {/* --- CÔTÉ GAUCHE : FORMULAIRE CHIRURGICAL --- */}
        <Grid item xs={12} md={5} lg={4} sx={{
          display: 'flex', flexDirection: 'column', p: { xs: 4, md: 8 }, bgcolor: '#FFFFFF'
        }}>
          <Box sx={{ mb: 'auto' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 8 }}>
              <Box sx={{ width: 35, height: 35, bgcolor: '#010810', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="h6" sx={{ color: '#00E5FF', fontWeight: 900, fontSize: '1rem' }}>K</Typography>
              </Box>
              <Typography variant="h6" fontWeight={900} color="#010810" sx={{ letterSpacing: '-1px' }}>KAONTY</Typography>
            </Box>

            <Typography variant="h5" sx={{ fontWeight: 900, color: '#010810', mb: 1 }}>Connexion Expert</Typography>
            <Typography variant="body2" sx={{ color: '#64748B', mb: 5 }}>Accédez à votre terminal de gestion comptable Malagasy.</Typography>

            <Box component="form">
              <Typography variant="caption" sx={{ fontWeight: 800, color: '#010810', display: 'block', mb: 1 }}>EMAIL PROFESSIONNEL</Typography>
              <TextField
                fullWidth placeholder="nom@cabinet.mg"
                onChange={e => setEmail(e.target.value)}
                sx={{ ...textFieldStyle, mb: 3 }}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><MailOutlineRounded sx={{ fontSize: 20, color: '#94A3B8' }} /></InputAdornment>,
                }}
              />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#010810' }}>MOT DE PASSE</Typography>
                <Typography variant="caption" sx={{ color: '#00E5FF', fontWeight: 700, cursor: 'pointer' }}>Oublié ?</Typography>
              </Box>
              <TextField
                fullWidth type={showPassword ? 'text' : 'password'} placeholder="••••••••"
                onChange={e => setPassword(e.target.value)}
                sx={{ ...textFieldStyle, mb: 4 }}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><LockOutlined sx={{ fontSize: 20, color: '#94A3B8' }} /></InputAdornment>,
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} size="small"><Visibility fontSize="small" /></IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                fullWidth variant="contained"
                type='submit'
                onClick={handleSubmit}
                endIcon={<ArrowForwardRounded />}
                sx={{
                  py: 1.8, borderRadius: '4px', fontWeight: 800,
                  bgcolor: '#010810', color: '#FFFFFF', textTransform: 'none',
                  '&:hover': { bgcolor: '#00E5FF', color: '#010810', boxShadow: 'none' }
                }}
              >
                Accéder au terminal
              </Button>

              <FormControlLabel
                control={<Checkbox size="small" defaultChecked />}
                label={<Typography variant="caption" sx={{ color: '#64748B', fontWeight: 500 }}>Maintenir la session active</Typography>}
                sx={{ mt: 3 }}
              />
            </Box>
          </Box>

          <Typography variant="caption" sx={{ color: '#CBD5E1', mt: 4 }}>
            © 2026 Kaonty • Standard PCG 2005 conforme
          </Typography>
        </Grid>

        <Grid item xs={12} md={7} lg={8} sx={{
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column', justifyContent: 'center',
          p: 12,
          background: 'radial-gradient(circle at 20% 30%, #2f4566 0%, #010810 100%)',
          position: 'relative'
        }}>
          <Box sx={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            backgroundImage: 'radial-gradient(#ffffff05 1px, transparent 1px)',
            backgroundSize: '30px 30px', opacity: 0.5
          }} />

          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, px: 2, py: 0.5, borderRadius: '4px', bgcolor: alpha('#00E5FF', 0.1), border: '1px solid', borderColor: alpha('#00E5FF', 0.2), mb: 4 }}>
              <VerifiedUserRounded sx={{ fontSize: 14, color: '#00E5FF' }} />
              <Typography variant="caption" sx={{ color: '#00E5FF', fontWeight: 900, letterSpacing: '1px' }}>SYSTÈME AU NORME MG</Typography>
            </Box>

            <Typography variant="h3" sx={{ color: '#FFFFFF', fontWeight: 900, mb: 0, maxWidth: 600 }}>
              Le pilotage financier <br />
            </Typography>

            <Typography variant="h4" sx={{ color: '#FFFFFF', fontWeight: 900, mb: 4, maxWidth: 600 }}>
              <span style={{ color: '#00E5FF' }}>sans compromis.</span>
            </Typography>

            <Grid container spacing={4} sx={{ mt: 4 }}>
              {[
                { icon: <SettingsSuggestRounded />, title: "Révision Automatique", desc: "Contrôle de cohérence et dossier de révision digitalisé." },
                { icon: <AccountBalanceWalletRounded />, title: "Fiscalité Native", desc: "TVA, IR et Annexes générées en temps réel." },
                { icon: <RuleRounded />, title: "Pré-audit Expert", desc: "Détection des anomalies comptables avant clôture." }
              ].map((item, index) => (
                <Grid item xs={12} sm={4} key={index}>
                  <Box sx={{ p: 3, borderLeft: '1px solid', borderColor: alpha('#00E5FF', 0.3) }}>
                    <Box sx={{ color: '#00E5FF', mb: 2 }}>{item.icon}</Box>
                    <Typography variant="subtitle2" sx={{ color: '#FFFFFF', fontWeight: 800, mb: 1 }}>{item.title}</Typography>
                    <Typography variant="caption" sx={{ color: '#64748B', lineHeight: 1.5, display: 'block' }}>{item.desc}</Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Grid>

      </Grid>
    </ThemeProvider>
  );
}