import { useState } from 'react';
import {
    Dialog, DialogContent, IconButton,
    Stack, Typography, Box
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import MailOutlinedIcon from '@mui/icons-material/MailOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';

import { useFormik } from 'formik';
import * as Yup from "yup";
import toast from 'react-hot-toast';

import SendAndVerifyCodeForm from './PopupPassword/SendAndVerifyCodeForm';
import PasswordConfirmForm from './PopupPassword/PasswordConfirmForm';
import PasswordChangeForm from './PopupPassword/PasswordChangeForm';
import axios from '../../../../config/axios';

const stepLabels = ['Vérification', 'Code', 'Nouveau mot de passe'];
const stepIcons = [<LockOutlinedIcon sx={{ fontSize: 16 }} />, <MailOutlinedIcon sx={{ fontSize: 16 }} />, <EditOutlinedIcon sx={{ fontSize: 16 }} />];

export default function PopupPasswordChange({ open, onClose, id_compte }) {
    const [step, setStep] = useState(0);
    const [isCodeVerified, setIsCodeVerified] = useState(false);
    const [isPasswordVerified, setIsPassWordVerified] = useState(false);
    const [passwordVerification, setPasswordVerification] = useState('');
    const [otp, setOtp] = useState('');
    const [codeSent, setCodeSent] = useState(false);
    const [loading, setLoading] = useState(false);
    const [cooldown, setCooldown] = useState(0);

    const validationSchema = Yup.object({
        password: Yup.string()
            .required("Le mot de passe est obligatoire")
            .min(8, "Le mot de passe doit contenir au moins 8 caractères")
            .max(30, "Le mot de passe est trop long")
            .matches(/[A-Z]/, "Doit contenir une majuscule")
            .matches(/[a-z]/, "Doit contenir une minuscule")
            .matches(/[0-9]/, "Doit contenir un chiffre")
            .matches(/[^a-zA-Z0-9]/, "Doit contenir un caractère spécial"),
        passwordConfirmation: Yup.string()
            .oneOf([Yup.ref('password'), null], "Les mots de passe ne correspondent pas")
            .required("Le mot de passe de confirmation est obligatoire"),
    });

    // Formdata du formulaire pour le step 2
    const formData = useFormik({
        initialValues: {
            password: '',
            passwordConfirmation: '',
        },
        validationSchema,
        onSubmit: (values) => {
            axios.put(`/sous-compte/updatePassword/${id_compte}`, {
                password: values.password
            })
                .then((response) => {
                    if (response?.data?.state) {
                        toast.success(response?.data?.message);
                        handleClose();
                    } else {
                        toast.error(response?.data?.message);
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
    })

    // Férmeture du modal et les fonctions de réactualisation
    const handleClose = () => {
        setIsCodeVerified(false);
        setIsPassWordVerified(false);
        setPasswordVerification('');
        setOtp('');
        setCodeSent(false);
        setLoading(false);
        onClose();
        formData.resetForm();
        setStep(0);
        setCooldown(0);
    }

    return (
        <Dialog
            onClose={handleClose}
            open={open}
            maxWidth="xs"
            fullWidth={false}
            PaperProps={{
                sx: {
                    width: 460,
                    maxWidth: '90%',
                    borderRadius: 3,
                    overflow: 'hidden',
                }
            }}
        >
            {/* ── Header ── */}
            <Stack direction="row" alignItems="center" justifyContent="space-between"
                sx={{ px: 3, py: 2, borderBottom: '1px solid #E2E8F0', bgcolor: '#F8FAFC' }}
            >
                <Typography sx={{ fontWeight: 700, fontSize: 16, color: '#1E293B' }}>
                    {stepLabels[step]}
                </Typography>
                <IconButton onClick={handleClose} size="small" sx={{ color: '#94A3B8' }}>
                    <CloseIcon />
                </IconButton>
            </Stack>

            {/* ── Step Indicator ── */}
            <Stack direction="row" alignItems="center" justifyContent="center" spacing={0}
                sx={{ px: 3, pt: 2, pb: 1 }}
            >
                {[0, 1, 2].map((s) => {
                    const isCompleted =
                        (s === 0 && isPasswordVerified) ||
                        (s === 1 && isCodeVerified);
                    const isCurrent = step === s;
                    const disabled =
                        (s === 2 && !isCodeVerified) ||
                        (s === 1 && !isPasswordVerified) ||
                        (step === 2 && (s === 0 || s === 1));

                    return (
                        <Stack key={s} direction="row" alignItems="center">
                            <Stack
                                onClick={() => !disabled && setStep(s)}
                                alignItems="center"
                                spacing={0.5}
                                sx={{ cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.35 : 1 }}
                            >
                                <Box sx={{
                                    width: 32, height: 32, borderRadius: '50%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    bgcolor: isCompleted ? '#10B981' : isCurrent ? '#1E293B' : '#E2E8F0',
                                    color: isCompleted || isCurrent ? '#FFF' : '#94A3B8',
                                    transition: 'all 0.2s',
                                }}>
                                    {isCompleted ? <CheckCircleOutlineIcon sx={{ fontSize: 18 }} /> : stepIcons[s]}
                                </Box>
                                <Typography sx={{
                                    fontSize: 10, fontWeight: isCurrent ? 700 : 500,
                                    color: isCurrent ? '#1E293B' : isCompleted ? '#10B981' : '#94A3B8',
                                    whiteSpace: 'nowrap',
                                }}>
                                    {stepLabels[s]}
                                </Typography>
                            </Stack>
                            {s < 2 && (
                                <Box sx={{
                                    width: 40, height: 2, mx: 1.5, mt: -1.5,
                                    bgcolor: isCompleted ? '#10B981' : '#E2E8F0',
                                    borderRadius: 1,
                                }} />
                            )}
                        </Stack>
                    );
                })}
            </Stack>

            {/* ── Content ── */}
            <DialogContent sx={{ px: 3, py: 3 }}>
                {step === 0 && (
                    <PasswordConfirmForm
                        onPasswordMatch={() => setStep(1)}
                        setPasswordVerification={setPasswordVerification}
                        passwordVerification={passwordVerification}
                        id_compte={id_compte}
                        setIsPassWordVerified={setIsPassWordVerified}
                        setCodeSent={setCodeSent}
                        setIsCodeVerified={setIsCodeVerified}
                    />
                )}

                {step === 1 && isPasswordVerified && (
                    <SendAndVerifyCodeForm
                        onVerified={() => {
                            setIsCodeVerified(true);
                            setStep(2);
                        }}
                        onFailed={() => setIsCodeVerified(false)}
                        setCodeSent={setCodeSent}
                        codeSent={codeSent}
                        setLoading={setLoading}
                        loading={loading}
                        id_compte={id_compte}
                        setOtp={setOtp}
                        otp={otp}
                        setCooldown={setCooldown}
                        cooldown={cooldown}
                    />
                )}

                {step === 2 && isCodeVerified && (
                    <PasswordChangeForm
                        id_compte={id_compte}
                        formData={formData}
                    />
                )}
            </DialogContent>
        </Dialog>
    );
}
