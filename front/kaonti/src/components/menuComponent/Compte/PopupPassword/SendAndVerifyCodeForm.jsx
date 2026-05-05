import React, { useState, useEffect } from 'react';
import { Button, Stack, Typography, CircularProgress } from '@mui/material';
import toast from 'react-hot-toast';
import OtpInput from 'react-otp-input';
import axios from '../../../../../config/axios';
import MailOutlinedIcon from '@mui/icons-material/MailOutlined';

const SendAndVerifyCodeForm = ({ onVerified, id_compte, setOtp, otp, cooldown, setCooldown }) => {
    const [error, setError] = useState('');
    const [codeValidation, setCodeValidation] = useState('');
    const [codeSent, setCodeSent] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let timer;
        if (cooldown > 0) {
            timer = setInterval(() => setCooldown(prev => prev - 1), 1000);
        }
        return () => clearInterval(timer);
    }, [cooldown]);

    const handleSendCode = () => {
        setLoading(true);
        setOtp('');
        setError('');
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let code = '';
        for (let i = 0; i < 10; i++) code += characters[Math.floor(Math.random() * characters.length)];
        axios.post('/sous-compte/sendCodeToEmail', { code, id_compte })
            .then((response) => {
                if (response?.data?.state) {
                    toast.success(response?.data?.message);
                    setCodeValidation(code);
                    setCodeSent(true);
                    setCooldown(15);
                } else toast.error(response?.data?.message || "Erreur");
                setLoading(false);
            })
            .catch(err => {
                toast.error(err.response?.data?.message || err.message);
                setLoading(false);
            });
    };

    const handleVerify = () => {
        if (otp === codeValidation) onVerified();
        else toast.error('Code incorrect');
    };

    return (
        <Stack spacing={2.5} sx={{ width: '100%' }}>
            {!codeSent && !loading && (
                <>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                        <MailOutlinedIcon sx={{ fontSize: 20, color: '#94A3B8' }} />
                        <Typography sx={{ fontSize: 13, color: '#64748B' }}>
                            Code envoyé à votre email
                        </Typography>
                    </Stack>
                    <Button variant="contained" onClick={handleSendCode} fullWidth
                        sx={{ textTransform: 'none', borderRadius: '8px', py: 1, bgcolor: '#1E293B', color: '#FFF', fontWeight: 600, '&:hover': { bgcolor: '#334155' } }}>
                        Envoyer le code
                    </Button>
                </>
            )}
            {loading && <Stack alignItems="center" sx={{ py: 2 }}><CircularProgress size={28} sx={{ color: '#1E293B' }} /></Stack>}
            {codeSent && !loading && (
                <>
                    <Typography sx={{ fontSize: 13, color: '#64748B' }}>Entrez le code :</Typography>
                    <Stack direction="row" justifyContent="center" sx={{ my: 1 }}>
                        <OtpInput value={otp} onChange={setOtp} numInputs={10} separator={<span style={{ width: 6 }} />}
                            inputStyle={{ width: '34px', height: '42px', fontSize: '16px', fontWeight: 600, borderRadius: '8px', border: '1px solid #E2E8F0', backgroundColor: '#F8FAFC', color: '#1E293B', textAlign: 'center' }}
                            focusStyle={{ borderColor: '#1E293B', backgroundColor: '#FFF' }}
                            renderInput={(props) => <input {...props} />} />
                    </Stack>
                    {error && <Typography sx={{ color: '#EF4444', fontSize: 12 }}>{error}</Typography>}
                    <Stack direction="row" spacing={1.5}>
                        <Button variant="contained" onClick={handleVerify} fullWidth
                            sx={{ textTransform: 'none', borderRadius: '8px', py: 1, bgcolor: '#1E293B', color: '#FFF', fontWeight: 600, '&:hover': { bgcolor: '#334155' } }}>
                            Vérifier
                        </Button>
                        <Button variant="outlined" onClick={handleSendCode} disabled={loading || cooldown > 0} fullWidth
                            sx={{ textTransform: 'none', borderRadius: '8px', py: 1, borderColor: '#E2E8F0', color: '#64748B', '&:hover': { borderColor: '#94A3B8' }, '&.Mui-disabled': { color: '#CBD5E1' } }}>
                            {cooldown > 0 ? `Renvoyer (${cooldown}s)` : 'Renvoyer'}
                        </Button>
                    </Stack>
                </>
            )}
        </Stack>
    );
};

export default SendAndVerifyCodeForm;
