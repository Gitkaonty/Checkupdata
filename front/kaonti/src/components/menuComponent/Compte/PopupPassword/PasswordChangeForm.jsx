import { useState } from 'react'
import { Button, IconButton, InputAdornment, Stack, TextField, Typography } from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';

const PasswordChangeForm = ({ formData }) => {
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);

    const handleClickShowPassword = () => setShowPassword(s => !s);
    const handleClickShowPasswordConfirmation = () => setShowPasswordConfirmation(s => !s);

    return (
        <form onSubmit={formData.handleSubmit}>
            <Stack direction="column" spacing={2.5} sx={{ width: '100%' }}>
                <Stack direction="row" alignItems="center" spacing={1.5}>
                    <EditOutlinedIcon sx={{ fontSize: 20, color: '#94A3B8' }} />
                    <Typography sx={{ fontSize: 13, color: '#64748B' }}>
                        Entrez votre nouveau mot de passe
                    </Typography>
                </Stack>
                <TextField
                    size="small" label="Nouveau mot de passe" name="password" fullWidth variant='outlined'
                    type={showPassword ? 'text' : 'password'} required
                    value={formData.values.password} onChange={formData.handleChange} onBlur={formData.handleBlur}
                    error={Boolean(formData.touched.password && formData.errors.password)}
                    helperText={formData.touched.password && formData.errors.password}
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position="end">
                                <IconButton onClick={handleClickShowPassword} size="small">
                                    {showPassword ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
                                </IconButton>
                            </InputAdornment>
                        ),
                    }}
                    sx={{ '& .MuiOutlinedInput-root': { height: 38 }, '& .MuiOutlinedInput-input': { fontSize: 13 }, '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E2E8F0' } }}
                />
                <TextField
                    size="small" label="Confirmation" name="passwordConfirmation" fullWidth variant='outlined'
                    type={showPasswordConfirmation ? 'text' : 'password'} required
                    value={formData.values.passwordConfirmation} onChange={formData.handleChange} onBlur={formData.handleBlur}
                    error={Boolean(formData.touched.passwordConfirmation && formData.errors.passwordConfirmation)}
                    helperText={formData.touched.passwordConfirmation && formData.errors.passwordConfirmation}
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position="end">
                                <IconButton onClick={handleClickShowPasswordConfirmation} size="small">
                                    {showPasswordConfirmation ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
                                </IconButton>
                            </InputAdornment>
                        ),
                    }}
                    sx={{ '& .MuiOutlinedInput-root': { height: 38 }, '& .MuiOutlinedInput-input': { fontSize: 13 }, '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E2E8F0' } }}
                />
                <Button type="submit" variant="contained" fullWidth
                    sx={{ textTransform: 'none', borderRadius: '8px', py: 1, bgcolor: '#1E293B', color: '#FFF', fontWeight: 600, '&:hover': { bgcolor: '#334155' } }}>
                    Enregistrer
                </Button>
            </Stack>
        </form>
    )
}

export default PasswordChangeForm
