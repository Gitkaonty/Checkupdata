import { useEffect, useRef, useState } from 'react';
import { Stack, Box, TextField, Button, Typography, Checkbox, InputLabel, Input } from "@mui/material";
import axios from '../../config/axios';
import { init } from '../../init';
import InputAdornment from '@mui/material/InputAdornment';
import FormControl from '@mui/material/FormControl';
import IconButton from '@mui/material/IconButton';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import useAuth from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useTheme, useMediaQuery } from "@mui/material";
import toast from 'react-hot-toast';

const Login = () => {
  let initial = init[0];

  const navigate = useNavigate();
  const userRef = useRef();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const { setAuth } = useAuth();

  const [showPassword, setShowPassword] = useState(false);

  const handleClickShowPassword = () => setShowPassword((show) => !show);

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

  useEffect(() => {
    userRef.current.focus();
  }, []);

  return (
    <Stack
      alignItems="center"
      justifyContent="center"
      style={{
        backgroundColor: initial.theme,
        width: '100vw',
        height: '100vh',
      }}
    >

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
      >
        <Stack
          alignItems="center"
          justifyContent="center"
          width={isMobile ? '80%' : '400px'}
          maxWidth="90vw"
          bgcolor="white"
          borderRadius={2}
          boxShadow={3}
          py={4}
          px={3}
          mt={2}
        >
          <Box width="100%">
            <Stack
              direction="column"
              spacing={3}
              alignItems="center"
              justifyContent="center"
            >
              <img
                src="/Logo Kaonty_2.png"
                alt="Logo Kaonty"
                style={{
                  border: '1px solid #FFF',
                  borderRadius: '8px',
                  width: '40px',
                  height: '40px',
                  marginTop: '10px'
                }}
              />

              <Typography
                variant="h4"
                fontFamily="Bahnschrift Condensed"
                fontWeight="light"
                color="rgba(112, 112, 112, 0.96)"
                mt={-1}
              >
                Kaonty
              </Typography>

              <Typography
                variant="body1"
                fontFamily="Bahnschrift"
                fontWeight="light"
                fontSize="16px"
                color="rgba(33, 33, 33, 0.9)"
                mt={-2}
              >
                Connectez-vous à votre compte
              </Typography>

              <TextField
                ref={userRef}
                type='email'
                onChange={e => setEmail(e.target.value)}
                id="standard-basic01"
                label="Adresse mail"
                name='email'
                variant="standard"
                fullWidth
                size='small'
                required
                sx={{
                  '& .MuiInputBase-input': {
                    fontSize: 15.3,
                    py: 1,
                    pl: 0.5,
                  },
                  '& .MuiInputBase-input:-webkit-autofill': {
                    fontSize: '15.3px !important',
                    WebkitTextFillColor: '#000',
                    WebkitBoxShadow: '0 0 0 1000px #fff inset',
                    transition: 'background-color 9999s ease-in-out 0s',
                    caretColor: '#000',
                  },
                  '& .MuiInputBase-root': {
                    fontSize: 15.3,
                  },
                }}
              />

              <FormControl variant="standard" fullWidth>
                <InputLabel htmlFor="standard-adornment-password" >Mot de passe *</InputLabel>
                <Input
                  onChange={e => setPassword(e.target.value)}
                  id="standard-adornment-password"
                  type={showPassword ? 'text' : 'password'}
                  name='password'
                  sx={{
                    '& .MuiInputBase-input': {
                      fontSize: 15.3,
                      py: 1,
                      pl: 0.5,
                    },
                    '& .MuiInputBase-input:-webkit-autofill': {
                      fontSize: '15.3px !important',
                      WebkitTextFillColor: '#000',
                      WebkitBoxShadow: '0 0 0 1000px #fff inset',
                      transition: 'background-color 9999s ease-in-out 0s',
                      caretColor: '#000',
                    },
                    '& .MuiInputBase-root': {
                      fontSize: 15.3,
                    },
                  }}
                  required
                  endAdornment={
                    <InputAdornment position="end">
                      <IconButton
                        disableRipple
                        sx={{
                          backgroundColor: 'transparent',
                          '&:hover': { backgroundColor: 'transparent' },
                          '&:active': { backgroundColor: 'transparent' }
                        }}
                        aria-label="toggle password visibility"
                        onClick={handleClickShowPassword}
                        style={{
                          textTransform: 'none',
                          outline: 'none',
                        }}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  }
                />
              </FormControl>

              <Button
                type="submit"
                onClick={handleSubmit}
                variant="contained"
                fullWidth
                sx={{ mt: 1 }}
                style={{
                  textTransform: 'none',
                  outline: 'none',
                }}
              >
                Se connecter
              </Button>
            </Stack>

            <Stack direction="row" alignItems="center" justifyContent="flex-start" mt={2}>
              <Checkbox defaultChecked />
              <Typography
                variant="body2"
                fontSize="14px"
                color="rgba(0, 0, 0, 0.96)"
              >
                J'ai lu et j'accepte les conditions générales d'utilisation
              </Typography>
            </Stack>
          </Box>
        </Stack>
      </form>

      <Typography variant="caption" color="white" mt={2}>
        © Kaonty v1.0.0.0
      </Typography>
    </Stack>
  );
}

export default Login