import React, { useState } from 'react';
import { 
  Box, Grid, Typography, TextField, Button, IconButton, 
  InputAdornment, Link, Stack, Fade, Divider, InputLabel, FormControl 
} from '@mui/material';
import { 
  Visibility, VisibilityOff, LockOutlined, EmailOutlined, 
  CheckCircleOutline, AnalyticsOutlined, AssessmentOutlined 
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from '../../config/axios';
import useAuth from '../hooks/useAuth';
import toast from 'react-hot-toast';

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [credentials, setCredentials] = useState({ email: '', password: '' });

  const navigate = useNavigate();
  const { setAuth } = useAuth();

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/', { email: credentials.email, password: credentials.password },
        {
          headers: { 'Content-Type': 'application/json' },
          withCredentials: true
        }
      );

      const accessToken = response?.data?.accessToken;
      setAuth({ accessToken });
      toast.success('Accès autorisé : Session de révision ouverte');
      navigate("/home");
    } catch (err) {
      if (!err.response) {
        toast.error('Serveur CheckupData injoignable');
      } else if (err.response?.status === 401) {
        toast.error('Identifiants de réviseur invalides');
      } else {
        toast.error('Échec de l\'authentification');
      }
    }
  };

  return (
    <Grid container sx={{ minHeight: '100vh', bgcolor: '#0F172A' }}>
      
      {/* GAUCHE : FORMULAIRE D'AUTHENTIFICATION */}
      <Grid item xs={12} md={5} lg={4} sx={{ display: 'flex', alignItems: 'center', bgcolor: '#1E293B', borderRight: '1px solid #334155' }}>
        <Fade in timeout={800}>
          <Box sx={{ p: { xs: 4, sm: 8 }, width: '100%' }}>
            <Box sx={{ mb: 6 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <CheckCircleOutline sx={{ color: '#10B981', fontSize: 40 }} />
                <Typography variant="h4" sx={{ fontWeight: 800, color: 'white', letterSpacing: '-0.5px' }}>
                  Checkup<span style={{ color: '#10B981' }}>Data</span>
                </Typography>
              </Box>
              <Typography variant="body1" sx={{ color: '#94A3B8' }}>
                Plateforme de révision comptable et d'audit.
              </Typography>
            </Box>

            <form onSubmit={handleSubmit}>
              <Stack spacing={3}>
                <Box>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: '#E2E8F0', ml: 0.5 }}>
                    Identifiant Réviseur (Email)
                  </Typography>
                  <TextField
                    fullWidth
                    name="email"
                    placeholder="audit@checkupdata.com"
                    onChange={handleChange}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        color: 'white',
                        bgcolor: '#0F172A',
                        '& fieldset': { border: '1px solid #334155' },
                        '&:hover fieldset': { borderColor: '#10B981' },
                        '&.Mui-focused fieldset': { borderColor: '#10B981' },
                        '& input:-webkit-autofill': {
                          WebkitBoxShadow: '0 0 0 100px #0F172A inset', // Force le fond sombre
                          WebkitTextFillColor: 'white',                 // Force le texte en blanc
                          transition: 'background-color 5000s ease-in-out 0s',
                        },
                      }
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailOutlined fontSize="small" sx={{ color: '#64748B' }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>

                <Box>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: '#E2E8F0', ml: 0.5 }}>
                    Clé de sécurité
                  </Typography>
                  <TextField
                    fullWidth
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="••••••••"
                    onChange={handleChange}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        color: 'white',
                        bgcolor: '#0F172A',
                        '& fieldset': { border: '1px solid #334155' },
                        '&:hover fieldset': { borderColor: '#10B981' },
                        '&.Mui-focused fieldset': { borderColor: '#10B981' },
                        '& input:-webkit-autofill': {
                          WebkitBoxShadow: '0 0 0 100px #0F172A inset', // Force le fond sombre
                          WebkitTextFillColor: 'white',                 // Force le texte en blanc
                          transition: 'background-color 5000s ease-in-out 0s',
                        },
                      }
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockOutlined fontSize="small" sx={{ color: '#64748B' }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" sx={{ color: '#64748B' }}>
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>
              </Stack>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1.5 }}>
                <Link href="#" variant="body2" sx={{ color: '#10B981', textDecoration: 'none', fontWeight: 500 }}>
                  Accès restreint ? Contactez l'administrateur
                </Link>
              </Box>

              <Button
                fullWidth
                type="submit"
                variant="contained"
                size="large"
                sx={{ 
                  mt: 4, py: 1.8, fontWeight: 700,
                  bgcolor: '#10B981',
                  '&:hover': { bgcolor: '#059669', transform: 'translateY(-1px)' },
                  textTransform: 'none',
                  fontSize: '1rem'
                }}
              >
                Acceder à mon espace de travail
              </Button>
            </form>

            <Divider sx={{ my: 4, borderColor: '#334155', '&::before, &::after': { borderColor: '#334155' } }}>
              <Typography variant="caption" sx={{ color: '#64748B' }}>CONFORMITÉ COMPTABLE</Typography>
            </Divider>

            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: '#94A3B8' }}>
                Besoin d'une licence ? <Link href="#" sx={{ color: '#10B981', fontWeight: 700, textDecoration: 'none' }}>S'inscrire</Link>
              </Typography>
            </Box>
          </Box>
        </Fade>
      </Grid>

      {/* DROITE : MESSAGES DE RÉVISION */}
      <Grid 
        item md={7} lg={8} 
        sx={{ 
          display: { xs: 'none', md: 'flex' }, 
          alignItems: 'center', 
          justifyContent: 'center',
          position: 'relative',
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(16, 185, 129, 0.1) 100%), url(https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=1920)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          color: 'white',
          p: 8
        }}
      >
        <Fade in timeout={1500}>
          <Stack spacing={5} sx={{ maxWidth: 700 }}>
            <Box>
              <Typography variant="h2" sx={{ fontWeight: 800, mb: 3, lineHeight: 1.1 }}>
                Maîtrisez la justesse de vos <span style={{ color: '#10B981' }}>comptes.</span>
              </Typography>
              <Typography variant="h6" sx={{ color: '#94A3B8', fontWeight: 400, mb: 4 }}>
                Automatisez la vérification des soldes, le sens des écritures et appliquez les meilleures pratiques comptables en un clic.
              </Typography>
            </Box>
            
            <Grid container spacing={3}>
              {[
                { icon: <AnalyticsOutlined />, title: "Analyse des Soldes", desc: "Détection automatique des soldes anormaux." },
                { icon: <AssessmentOutlined />, title: "Revue Analytique", desc: "Comparaison N vs N-1 simplifiée." },
                { icon: <CheckCircleOutline />, title: "Bonnes Pratiques", desc: "Checklist de contrôle de fin d'exercice." }
              ].map((item, index) => (
                <Grid item xs={4} key={index}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Box sx={{ color: '#10B981', mb: 1 }}>{React.cloneElement(item.icon, { sx: { fontSize: 40 } })}</Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{item.title}</Typography>
                    <Typography variant="caption" sx={{ color: '#a1acbc' }}>{item.desc}</Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Stack>
        </Fade>
      </Grid>
    </Grid>
  );
};

export default LoginPage;