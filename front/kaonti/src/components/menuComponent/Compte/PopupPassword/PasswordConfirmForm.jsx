import { useState } from 'react';
import { Stack, Typography, TextField, Button } from '@mui/material';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';

import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';

import toast from 'react-hot-toast';
import axios from '../../../../../config/axios';

const PasswordConfirmForm = ({ onPasswordMatch, passwordVerification, setPasswordVerification, id_compte, setIsPassWordVerified, setCodeSent, setIsCodeVerified }) => {
    const [showPassword, setShowPassword] = useState(false);

    const handleClickShowPassword = () => setShowPassword((show) => !show);

    const handleMouseDownPassword = (event) => {
        event.preventDefault();
    };

    const handleMouseUpPassword = (event) => {
        event.preventDefault();
    };

    const verifyPassword = () => {
        axios.post(`/sous-compte/matchPassword/${id_compte}`, {
            password: passwordVerification
        })
            .then((response) => {
                if (response?.data?.state) {
                    setIsPassWordVerified(true);
                    onPasswordMatch();
                } else {
                    toast.error(response?.data?.message);
                    setIsPassWordVerified(false);
                    setCodeSent(false);
                    setIsCodeVerified(false);
                }
            })
            .catch((err) => {
                if (err.response && err.response.data && err.response.data.message) {
                    toast.error(err.response.data.message);
                } else {
                    toast.error(err.message || "Erreur inconnue");
                }
            })
    }

    return (
        <Stack spacing={2.5} sx={{ width: '100%' }}>
            <Stack direction="row" alignItems="center" spacing={1.5}>
                <LockOutlinedIcon sx={{ fontSize: 20, color: '#94A3B8' }} />
                <Typography sx={{ fontSize: 13, color: '#64748B' }}>
                    Veuillez entrer votre mot de passe actuel pour continuer
                </Typography>
            </Stack>
            <TextField
                type={showPassword ? 'text' : 'password'}
                label="Mot de passe actuel"
                variant="outlined"
                size="small"
                value={passwordVerification}
                onChange={(e) => setPasswordVerification(e.target.value)}
                fullWidth
                required
                InputProps={{
                    endAdornment: (
                        <InputAdornment position="end">
                            <IconButton
                                aria-label={showPassword ? 'hide password' : 'show password'}
                                onClick={handleClickShowPassword}
                                onMouseDown={handleMouseDownPassword}
                                onMouseUp={handleMouseUpPassword}
                                size="small"
                            >
                                {showPassword ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
                            </IconButton>
                        </InputAdornment>
                    ),
                }}
                sx={{
                    '& .MuiOutlinedInput-root': { height: 38 },
                    '& .MuiOutlinedInput-input': { fontSize: 13 },
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E2E8F0' },
                }}
            />
            <Button
                variant="contained"
                onClick={verifyPassword}
                fullWidth
                sx={{
                    textTransform: 'none', borderRadius: '8px', py: 1,
                    bgcolor: '#1E293B', color: '#FFF', fontWeight: 600,
                    '&:hover': { bgcolor: '#334155' },
                }}
            >
                Vérifier
            </Button>
        </Stack>
    );
};

export default PasswordConfirmForm;
