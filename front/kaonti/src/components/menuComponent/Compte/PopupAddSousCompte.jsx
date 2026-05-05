import { useEffect, useState } from 'react';
import { Typography, Stack, TextField, FormHelperText, Chip, Box, Divider, Checkbox, Accordion, AccordionSummary, AccordionDetails, Tab } from '@mui/material';
import { FormControl, FormControlLabel, FormLabel } from "@mui/material";
import { TabContext, TabList, TabPanel } from '@mui/lab';
import Button from '@mui/material/Button';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Drawer from '@mui/material/Drawer';

import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import toast from 'react-hot-toast';

import { useFormik } from 'formik';
import * as Yup from "yup";

import axios from '../../../../config/axios';

import roleMapping from '../../../../config/rolesMappin';
import { inputAutoFill } from '../../inputStyle/inputAutoFill';
import TabDossier from './TabDossier';
import TabPortefeuille from './TabPortefeuille';

const PopupAddSousCompte = ({ selectedRowCompteIds, confirmationState, isRefreshedSousCompte, setIsRefreshedSousCompte, rowSelectedData, listeRoles, listePortefeuille, listeDossier, selectedRow, setSelectedRow, listeCompteDossier, setListeCompteDossier, actionSousCompte, listeComptePortefeuille, setListeComptePortefeuille, userId }) => {
    const editSousCompte = actionSousCompte === 'Ajout';

    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
    const [perimetreTab, setPerimetreTab] = useState('1');
    const [userPermissions, setUserPermissions] = useState({});
    const [listPermissions, setListPermissions] = useState([]);

    const handleClose = () => {
        confirmationState(false);
        setIsRefreshedSousCompte(!isRefreshedSousCompte);
    }

    const getValidationSchema = (action) =>
        Yup.object({
            username: Yup.string()
                .required("Le nom est obligatoire")
                .min(2, "Le nom doit contenir au moins 2 caractères")
                .max(50, "Le nom est trop long"),
            email_add: Yup.string()
                .email("L'email est invalide")
                .required("L'email est obligatoire"),
            password: Yup.string().when([], {
                is: () => action === 'Ajout',
                then: schema =>
                    schema
                        .required("Le mot de passe est obligatoire")
                        .min(8, "Le mot de passe doit contenir au moins 8 caractères")
                        .max(30, "Le mot de passe est trop long")
                        .matches(/[A-Z]/, "Doit contenir une majuscule")
                        .matches(/[a-z]/, "Doit contenir une minuscule")
                        .matches(/[0-9]/, "Doit contenir un chiffre")
                        .matches(/[^a-zA-Z0-9]/, "Doit contenir un caractère spécial"),
                otherwise: schema => schema.notRequired()
            }),
            passwordConfirmation: Yup.string().when([], {
                is: () => action === 'Ajout',
                then: schema =>
                    schema
                        .oneOf([Yup.ref('password'), null], "Les mots de passe ne correspondent pas")
                        .required("Le mot de passe de confirmation est obligatoire"),
                otherwise: schema => schema.notRequired()
            }),
            roles: Yup.string().required("Sélectionnez un rôle"),
        });

    const formData = useFormik({
        validateOnChange: true,
        validateOnBlur: true,
        initialValues: {
            username: !editSousCompte ? selectedRow?.username : '',
            email_add: !editSousCompte ? selectedRow?.email : '',
            password: '',
            passwordConfirmation: '',
            roles: !editSousCompte ? selectedRow?.role_id : '',
            compte_id: selectedRowCompteIds,
        },
        validationSchema: getValidationSchema(actionSousCompte),
        context: {
            hasPortefeuille: listePortefeuille?.length > 0,
            action: actionSousCompte
        },
        onSubmit: (values) => {
            const formattedRoles = {
                [values.roles]: roleMapping[values.roles]
            };

            const dossierIds = listeCompteDossier.map(val => val.id_dossier);
            const portefeuillesIds = listeComptePortefeuille.map(val => val.id_portefeuille);

            const permissionList = Object.entries(userPermissions).map(([id, allowed]) => ({
                permissionId: Number(id),
                allowed: !!allowed
            }));

            axios.post('/sous-compte/addSousCompte', {
                username: values.username,
                email: values.email_add,
                password: values.password,
                role_id: Number(values.roles),
                compte_id: values.compte_id,
                roles: formattedRoles,
                action: actionSousCompte,
                user_id: selectedRow?.id,
                dossier: dossierIds,
                portefeuille: portefeuillesIds,
                permissions: permissionList,
            })
                .then((response) => {
                    if (response?.data?.state) {
                        setSelectedRow(response?.data?.compte);
                        handleClose();
                        toast.success(response?.data?.message);
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
        },
    })

    const handleClickShowPassword = () => {
        setShowPassword((show) => !show);
    }

    const handleMouseDownPassword = (event) => {
        event.preventDefault();
    };

    const handleMouseUpPassword = (event) => {
        event.preventDefault();
    };

    const handleClickShowPasswordConfirmation = () => {
        setShowPasswordConfirmation((show) => !show);
    }

    const handleMouseDownPasswordConfirmation = (event) => {
        event.preventDefault();
    };

    const handleMouseUpPasswordConfirmation = (event) => {
        event.preventDefault();
    };

    const fetchUserPermissions = () => {
        if (!selectedRow?.id || editSousCompte) return;
        axios.post(`/sous-compte/getUserPermissions`, { sousCompteId: [selectedRow.id] })
            .then((response) => {
                if (response?.data?.state) {
                    const perms = response.data.list[0]?.userpermissions || [];
                    const permMap = {};
                    perms.forEach(p => {
                        permMap[p.permission.id] = p.allowed;
                    });
                    setUserPermissions(permMap);
                    setListPermissions(response.data.listPermissions || []);
                }
            })
            .catch((err) => {
                console.error(err);
            });
    };

    const handlePermissionChange = (permissionId, allowed) => {
        setUserPermissions(prev => ({
            ...prev,
            [permissionId]: allowed
        }));
    };

    useEffect(() => {
        if (editSousCompte) {
            setListeCompteDossier([]);
            setListeComptePortefeuille([]);
        } else {
            setListeCompteDossier(listeCompteDossier);
            setListeComptePortefeuille(listeComptePortefeuille);
        }
    }, [editSousCompte])

    useEffect(() => {
        fetchUserPermissions();
    }, [selectedRow?.id])

    const inputSx = {
        ...inputAutoFill,
        '& .MuiOutlinedInput-root': { height: 32 },
        '& .MuiOutlinedInput-input': { padding: '4px 6px', fontSize: 13 },
    };

    return (
        <Drawer
            anchor="right"
            open={true}
            onClose={handleClose}
            PaperProps={{
                sx: { width: 480, display: 'flex', flexDirection: 'column' }
            }}
        >
            <Stack direction="row" alignItems="center" justifyContent="space-between"
                sx={{ px: 3, py: 2, borderBottom: '1px solid #E2E8F0', bgcolor: '#F8FAFC' }}
            >
                <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: 16, color: '#1E293B' }}>
                    {editSousCompte ? 'Ajout d\'un nouveau sous-compte' : 'Modification d\'un sous-compte'}
                </Typography>
                <IconButton onClick={handleClose} size="small" sx={{ color: '#94A3B8' }}>
                    <CloseIcon />
                </IconButton>
            </Stack>

            <form onSubmit={formData.handleSubmit} style={{ flex: 1, overflow: 'auto' }}>
                <Stack spacing={0}>

                    {/* ── Section Infos ── */}
                    <Accordion defaultExpanded disableGutters elevation={0}
                        sx={{ '&:before': { display: 'none' }, borderBottom: '1px solid #F1F5F9' }}
                    >
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}
                            sx={{ px: 3, py: 1, minHeight: 40, '&.Mui-expanded': { minHeight: 40 } }}
                        >
                            <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Infos</Typography>
                        </AccordionSummary>
                        <AccordionDetails sx={{ px: 3, pb: 2 }}>
                            <Stack spacing={2}>
                                <Stack spacing={1}>
                                    <label style={{ fontSize: 12, color: '#94A3B8' }}>Nom du compte</label>
                                    <TextField size="small" name="nom-sous-compte" fullWidth variant="outlined" disabled value={rowSelectedData?.nom} sx={inputSx} />
                                </Stack>
                                <Stack spacing={1}>
                                    <label style={{ fontSize: 12, color: '#94A3B8' }}>Nom d'utilisateur</label>
                                    <TextField size="small" name="username" fullWidth variant="outlined" required
                                        value={formData.values.username} onChange={formData.handleChange} onBlur={formData.handleBlur}
                                        error={Boolean(formData.touched.username && formData.errors.username)}
                                        helperText={formData.touched.username && formData.errors.username} sx={inputSx} />
                                </Stack>
                                <input type="text" name="fake_email" autoComplete="username" style={{ display: "none" }} />
                                <Stack spacing={1}>
                                    <label style={{ fontSize: 12, color: '#94A3B8' }}>Email</label>
                                    <TextField size="small" name="email_add" fullWidth variant="outlined" required
                                        value={formData.values.email_add ?? ""} onChange={formData.handleChange} onBlur={formData.handleBlur}
                                        error={Boolean(formData.touched.email_add && formData.errors.email_add)}
                                        helperText={formData.touched.email_add && formData.errors.email_add}
                                        autoComplete="new-email" sx={inputSx} />
                                </Stack>
                                <input type="password" name="fake_password" autoComplete="new-password" style={{ display: "none" }} />
                                <Stack spacing={1}>
                                    <label style={{ fontSize: 12, color: '#94A3B8' }}>Mot de passe</label>
                                    <TextField size="small" name="password" fullWidth variant="outlined"
                                        type={showPassword ? 'text' : 'password'} required
                                        value={formData.values.password || ""} onChange={formData.handleChange} onBlur={formData.handleBlur}
                                        error={Boolean(formData.touched.password && formData.errors.password)}
                                        helperText={formData.touched.password && formData.errors.password}
                                        autoComplete="new-password"
                                        InputProps={{
                                            style: { pointerEvents: !editSousCompte ? 'none' : 'auto' },
                                            readOnly: !editSousCompte,
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <IconButton aria-label={showPassword ? 'hide password' : 'show password'}
                                                        onClick={handleClickShowPassword} onMouseDown={handleMouseDownPassword} onMouseUp={handleMouseUpPassword}>
                                                        {showPassword ? <VisibilityOff /> : <Visibility />}
                                                    </IconButton>
                                                </InputAdornment>
                                            ),
                                        }} sx={inputSx} />
                                </Stack>
                                <Stack spacing={1}>
                                    <label style={{ fontSize: 12, color: '#94A3B8' }}>Confirmation du mot de passe</label>
                                    <TextField size="small" name="passwordConfirmation" fullWidth variant="outlined"
                                        type={showPasswordConfirmation ? 'text' : 'password'} required
                                        value={formData.values.passwordConfirmation || ""} onChange={formData.handleChange} onBlur={formData.handleBlur}
                                        error={Boolean(formData.touched.passwordConfirmation && formData.errors.passwordConfirmation)}
                                        helperText={formData.touched.passwordConfirmation && formData.errors.passwordConfirmation}
                                        InputProps={{
                                            style: { pointerEvents: !editSousCompte ? 'none' : 'auto' },
                                            readOnly: !editSousCompte,
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <IconButton aria-label={showPasswordConfirmation ? 'hide password' : 'show password'}
                                                        onClick={handleClickShowPasswordConfirmation} onMouseDown={handleMouseDownPasswordConfirmation} onMouseUp={handleMouseUpPasswordConfirmation}>
                                                        {showPasswordConfirmation ? <VisibilityOff /> : <Visibility />}
                                                    </IconButton>
                                                </InputAdornment>
                                            ),
                                        }} sx={inputSx} />
                                </Stack>
                            </Stack>
                        </AccordionDetails>
                    </Accordion>

                    {/* ── Section Rôle ── */}
                    <Accordion defaultExpanded disableGutters elevation={0}
                        sx={{ '&:before': { display: 'none' }, borderBottom: '1px solid #F1F5F9' }}
                    >
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}
                            sx={{ px: 3, py: 1, minHeight: 40, '&.Mui-expanded': { minHeight: 40 } }}
                        >
                            <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Rôle</Typography>
                        </AccordionSummary>
                        <AccordionDetails sx={{ px: 3, pb: 2 }}>
                            <FormControl component="fieldset" size="small" fullWidth
                                error={Boolean(formData.touched.roles && formData.errors.roles)}
                            >
                                <FormLabel component="legend" sx={{ fontSize: 12, color: '#94A3B8', mb: 1 }}>
                                    Rôle de l'utilisateur
                                </FormLabel>
                                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap"
                                    onBlur={() => formData.setFieldTouched("roles", true)}
                                >
                                    {listeRoles.map((role) => {
                                        const isSelected = String(formData.values.roles || '') === String(role.id);
                                        return (
                                            <Chip key={role.id} label={role.nom} size="small" clickable
                                                onClick={() => { formData.setFieldValue("roles", String(role.id)); formData.setFieldTouched("roles", true); }}
                                                variant={isSelected ? 'filled' : 'outlined'}
                                                color={isSelected ? 'primary' : 'default'}
                                                sx={{ fontSize: 12, height: 26, '& .MuiChip-label': { px: 1 } }}
                                            />
                                        );
                                    })}
                                </Stack>
                                {formData.touched.roles && formData.errors.roles && (
                                    <FormHelperText sx={{ ml: 0, fontSize: "12px" }}>{formData.errors.roles}</FormHelperText>
                                )}
                            </FormControl>
                        </AccordionDetails>
                    </Accordion>

                    {/* ── Section Permissions ── */}
                    {!editSousCompte && listPermissions.length > 0 && (
                        <Accordion disableGutters elevation={0}
                            sx={{ '&:before': { display: 'none' }, borderBottom: '1px solid #F1F5F9' }}
                        >
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}
                                sx={{ px: 3, py: 1, minHeight: 40, '&.Mui-expanded': { minHeight: 40 } }}
                            >
                                <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Permissions</Typography>
                            </AccordionSummary>
                            <AccordionDetails sx={{ px: 3, pb: 2 }}>
                                <Stack spacing={0.5}>
                                    {listPermissions.map((perm) => (
                                        <FormControlLabel key={perm.id}
                                            control={
                                                <Checkbox
                                                    size="small"
                                                    checked={!!userPermissions[perm.id]}
                                                    onChange={(e) => handlePermissionChange(perm.id, e.target.checked)}
                                                />
                                            }
                                            label={<Typography sx={{ fontSize: 13, color: '#475569' }}>{perm.nom}</Typography>}
                                            sx={{ m: 0 }}
                                        />
                                    ))}
                                </Stack>
                            </AccordionDetails>
                        </Accordion>
                    )}

                    {/* ── Section Périmètre ── */}
                    <Accordion disableGutters elevation={0}
                        sx={{ '&:before': { display: 'none' }, borderBottom: '1px solid #F1F5F9' }}
                    >
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}
                            sx={{ px: 3, py: 1, minHeight: 40, '&.Mui-expanded': { minHeight: 40 } }}
                        >
                            <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Périmètre</Typography>
                        </AccordionSummary>
                        <AccordionDetails sx={{ px: 3, pb: 2 }}>
                            <TabContext value={perimetreTab}>
                                <TabList onChange={(e, v) => setPerimetreTab(v)}
                                    sx={{ minHeight: 36, '& .MuiTab-root': { textTransform: 'none', minHeight: 36, fontSize: 12, fontWeight: 600, color: '#94A3B8' }, '& .Mui-selected': { color: '#1E293B' } }}
                                >
                                    <Tab label="Portefeuille" value="1" />
                                    <Tab label="Dossier" value="2" />
                                </TabList>
                                <TabPanel value="1" sx={{ p: 0, mt: 1 }}>
                                    <TabPortefeuille
                                        listeComptePortefeuille={listeComptePortefeuille}
                                        listePortefeuille={listePortefeuille}
                                        setListeComptePortefeuille={setListeComptePortefeuille}
                                    />
                                </TabPanel>
                                <TabPanel value="2" sx={{ p: 0, mt: 1 }}>
                                    <TabDossier
                                        listeCompteDossier={listeCompteDossier}
                                        listeDossier={listeDossier}
                                        setListeCompteDossier={setListeCompteDossier}
                                    />
                                </TabPanel>
                            </TabContext>
                        </AccordionDetails>
                    </Accordion>

                </Stack>
            </form>

            {/* ── Footer Actions ── */}
            <Stack direction="row" justifyContent="flex-end" spacing={1.5}
                sx={{ px: 3, py: 2, borderTop: '1px solid #E2E8F0', bgcolor: '#F8FAFC' }}
            >
                <Button variant="outlined" onClick={handleClose}
                    sx={{ textTransform: 'none', borderRadius: '8px', px: 3, color: '#64748B', borderColor: '#CBD5E1',
                        '&:hover': { borderColor: '#94A3B8', bgcolor: '#F8FAFC' } }}
                >
                    Annuler
                </Button>
                <Button type="submit" onClick={formData.handleSubmit} variant="contained"
                    sx={{ textTransform: 'none', borderRadius: '8px', px: 3, bgcolor: '#000000', color: '#FFFFFF', fontWeight: 700,
                        '&:hover': { bgcolor: '#222' } }}
                >
                    {editSousCompte ? 'Ajouter' : 'Modifier'}
                </Button>
            </Stack>
        </Drawer>
    )
}

export default PopupAddSousCompte