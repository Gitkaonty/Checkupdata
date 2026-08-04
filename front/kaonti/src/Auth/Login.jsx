import React, { useState } from 'react';
import {
  Box, Grid, Typography, TextField, Button, IconButton,
  InputAdornment, Link, Stack, Fade, Divider
} from '@mui/material';
import {
  Visibility, VisibilityOff, LockOutlined, EmailOutlined, ShieldOutlined,
  CheckCircleOutline, AnalyticsOutlined, AssessmentOutlined
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from '../../config/axios';
import useAuth from '../hooks/useAuth';
import toast from 'react-hot-toast';

/* ── Design tokens alignés sur le dashboard « cockpit comptable » ── */
const T = {
  ink: '#0E2733',
  canvas: '#F4F6F5',
  surface: '#FFFFFF',
  line: '#E2E6EA',
  text: '#16202B',
  muted: '#6A7785',
  faint: '#9AA6B2',
  accent: '#0E7C86', // pétrole
  pos: '#1F8A70',
  warn: '#B5791A',
  neg: '#BE3A2F',
  accW: '#E2F0F1',
};
const MONO = 'ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace';
const NUM = { fontVariantNumeric: 'tabular-nums', fontFeatureSettings: '"tnum"' };

/* Champ de saisie « fiche de travail » clair */
const fieldSx = {
  '& .MuiOutlinedInput-root': {
    color: T.text,
    bgcolor: T.surface,
    borderRadius: '10px',
    fontSize: '.95rem',
    '& fieldset': { borderColor: T.line },
    '&:hover fieldset': { borderColor: T.accent },
    '&.Mui-focused fieldset': { borderColor: T.accent, borderWidth: '1.5px' },
    '& input:-webkit-autofill': {
      WebkitBoxShadow: `0 0 0 100px ${T.surface} inset`,
      WebkitTextFillColor: T.text,
      transition: 'background-color 5000s ease-in-out 0s',
    },
  },
};

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
    <Grid container sx={{ minHeight: '100vh', bgcolor: T.canvas }}>

      {/* ══ GAUCHE : FICHE D'ACCÈS RÉVISEUR ══ */}
      <Grid item xs={12} md={5} lg={4}
        sx={{ display: 'flex', alignItems: 'center', bgcolor: T.canvas }}>
        <Fade in timeout={700}>
          <Box sx={{ p: { xs: 4, sm: 7 }, width: '100%', maxWidth: 460, mx: 'auto' }}>

            {/* Logo */}
            <Box sx={{ mb: 4 }}>
              <img
                src="/7.png"
                alt="CheckupData"
                style={{ height: 120, width: 'auto', maxWidth: '100%', objectFit: 'contain', marginLeft: -8 }}
              />
            </Box>

            {/* En-tête façon SectionHead : eyebrow + titre + description */}
            <Box sx={{ mb: 4 }}>
              <Typography sx={{
                fontFamily: MONO, fontSize: '.72rem', fontWeight: 600,
                letterSpacing: '.14em', color: T.accent, mb: 1,
              }}>
                ACCÈS SÉCURISÉ · POSTE DE RÉVISION
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: T.ink, lineHeight: 1.15, mb: 1 }}>
                Ouvrir une session
              </Typography>
              <Typography variant="body2" sx={{ color: T.muted }}>
                Authentifiez-vous pour accéder à vos dossiers de révision et lancer les contrôles automatisés.
              </Typography>
            </Box>

            <form onSubmit={handleSubmit}>
              <Stack spacing={2.5}>
                <Box>
                  <Typography variant="body2" sx={{ mb: .8, fontWeight: 700, color: T.text }}>
                    Identifiant réviseur
                  </Typography>
                  <TextField
                    fullWidth name="email" placeholder="audit@checkupdata.com"
                    onChange={handleChange} sx={fieldSx}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailOutlined fontSize="small" sx={{ color: T.faint }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>

                <Box>
                  <Typography variant="body2" sx={{ mb: .8, fontWeight: 700, color: T.text }}>
                    Clé de sécurité
                  </Typography>
                  <TextField
                    fullWidth type={showPassword ? 'text' : 'password'} name="password"
                    placeholder="••••••••" onChange={handleChange} sx={fieldSx}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockOutlined fontSize="small" sx={{ color: T.faint }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" sx={{ color: T.faint }}>
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>
              </Stack>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1.2 }}>
                <Link href="#" variant="body2" sx={{ color: T.accent, textDecoration: 'none', fontWeight: 600 }}>
                  Accès restreint ? Contactez l'administrateur
                </Link>
              </Box>

              <Button
                fullWidth type="submit" variant="contained" size="large"
                disableElevation
                sx={{
                  mt: 3.5, py: 1.5, fontWeight: 700, borderRadius: '10px',
                  bgcolor: T.accent, color: '#fff',
                  boxShadow: '0 8px 20px -10px rgba(14,124,134,.7)',
                  '&:hover': { bgcolor: '#0B646C' },
                  textTransform: 'none', fontSize: '.98rem',
                }}
              >
                Accéder à mon espace de travail
              </Button>
            </form>

            <Divider sx={{ my: 3.5, borderColor: T.line }}>
              <Typography sx={{ fontFamily: MONO, fontSize: '.68rem', letterSpacing: '.12em', color: T.faint }}>
                CONFORMITÉ COMPTABLE
              </Typography>
            </Divider>

            <Stack direction="row" spacing={1} alignItems="center" justifyContent="center" sx={{ mb: 2 }}>
              <ShieldOutlined sx={{ fontSize: 16, color: T.pos }} />
              <Typography variant="caption" sx={{ color: T.muted }}>
                Connexion chiffrée · Traçabilité des sessions de révision
              </Typography>
            </Stack>

            <Typography variant="body2" sx={{ color: T.muted, textAlign: 'center' }}>
              Besoin d'une licence ?{' '}
              <Link href="#" sx={{ color: T.accent, fontWeight: 700, textDecoration: 'none' }}>S'inscrire</Link>
            </Typography>
          </Box>
        </Fade>
      </Grid>

      {/* ══ DROITE : APERÇU DU DOSSIER DE RÉVISION ══ */}
      <Grid item md={7} lg={8}
        sx={{
          display: { xs: 'none', md: 'flex' },
          alignItems: 'center', justifyContent: 'center',
          position: 'relative', overflow: 'hidden',
          p: 8, color: '#fff',
          background: `radial-gradient(1200px 600px at 80% -10%, rgba(14,124,134,.35), transparent 60%), ${T.ink}`,
        }}
      >
        {/* trame ledger subtile */}
        <Box sx={{
          position: 'absolute', inset: 0, opacity: .05,
          backgroundImage: 'repeating-linear-gradient(to bottom, #fff 0, #fff 1px, transparent 1px, transparent 34px)',
        }} />

        <Fade in timeout={1200}>
          <Stack spacing={5} sx={{ maxWidth: 700, position: 'relative', zIndex: 1 }}>
            <Box>
              <Typography variant="h2" sx={{ fontWeight: 800, mb: 3, lineHeight: 1.1 }}>
                Maîtrisez la justesse de vos <span style={{ color: '#5FD0D6' }}>comptes.</span>
              </Typography>
              <Typography variant="h6" sx={{ color: 'rgba(255,255,255,.62)', fontWeight: 400, mb: 4 }}>
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
                    <Box sx={{ color: '#5FD0D6', mb: 1 }}>{React.cloneElement(item.icon, { sx: { fontSize: 40 } })}</Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{item.title}</Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,.55)' }}>{item.desc}</Typography>
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
