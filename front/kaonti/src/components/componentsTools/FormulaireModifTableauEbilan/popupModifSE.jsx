import { useState, useEffect } from 'react';
import { Typography, Stack, TextField, FormControl, Divider } from '@mui/material';
import Button from '@mui/material/Button';
import { styled } from '@mui/material/styles';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import { init } from '../../../../init';
import InputAdornment from '@mui/material/InputAdornment';
import { useFormik } from 'formik';
import * as Yup from "yup";
import FormatedInput from '../FormatedInput';

let initial = init[0];

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
    '& .MuiDialogContent-root': {
        padding: theme.spacing(2),
    },
    '& .MuiDialogActions-root': {
        padding: theme.spacing(1),
    },
    '& .MuiPaper-root': {
        minHeight: '10%',
        maxHeight: '95%',
    },
}));

const PopupModifSE = ({ choix, confirmationState, data, deviseParDefaut }) => {
    const [formDataFinal, setFormDataFinal] = useState({
        state: false,
        id: -1,
        liste_emprunteur: '',
        date_contrat: '',
        duree_contrat: '',
        montant_emprunt: 0,
        montant_interet: 0,
        montant_total: 0,
        date_disposition: '',
        montant_rembourse_capital: 0,
        montant_rembourse_interet: 0,
        solde_non_rembourse: 0,
        date_remboursement: '',
    });

    const validationSchema = Yup.object({
        liste_emprunteur: Yup.string().required("Veuillez ajouter l'établissement emprunteur"),
        date_contrat: Yup.string()
            .matches(
                /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/, // = format du back pour la datapicker yyyy-MM-dd
                'La date doit être au format jj/mm/aaaa'
            )
            .test('is-valid-date', 'La date doit être valide', (value) => {
                if (!value) return false;

                const [year, month, day] = value.split('-').map(Number);

                // Vérifie les mois
                if (month < 1 || month > 12) return false;

                // Vérifie les jours en fonction du mois
                const daysInMonth = new Date(year, month, 0).getDate();
                return day >= 1 && day <= daysInMonth;
            }).required('La date de contrat est requise'),
        duree_contrat: Yup.string().required("Veuillez ajouter la durée du contrat"),
        montant_emprunt: Yup.number().required("Veuillez entrer un montant valide"),
        montant_interet: Yup.number().required("Veuillez entrer un montant valide"),
        montant_total: Yup.number().required("Veuillez entrer un montant valide"),
        date_disposition: Yup.string()
            .matches(
                /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/,
                'La date doit être au format jj/mm/aaaa'
            )
            .test('is-valid-date', 'La date doit être valide', (value) => {
                if (!value) return false;

                const [year, month, day] = value.split('-').map(Number);

                // Vérifie les mois
                if (month < 1 || month > 12) return false;

                // Vérifie les jours en fonction du mois
                const daysInMonth = new Date(year, month, 0).getDate();
                return day >= 1 && day <= daysInMonth;
            }).required('La date de contrat est requise'),
        montant_rembourse_capital: Yup.number().required("Veuillez entrer un montant valide"),
        montant_rembourse_interet: Yup.number().required("Veuillez entrer un montant valide"),
        solde_non_rembourse: Yup.number().required("Veuillez entrer un montant valide"),
        date_remboursement: Yup.string()
            .matches(
                /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/,
                'La date doit être au format jj/mm/aaaa'
            )
            .test('is-valid-date', 'La date doit être valide', (value) => {
                if (!value) return false;

                const [year, month, day] = value.split('-').map(Number);

                // Vérifie les mois
                if (month < 1 || month > 12) return false;

                // Vérifie les jours en fonction du mois
                const daysInMonth = new Date(year, month, 0).getDate();
                return day >= 1 && day <= daysInMonth;
            }).required('La date de contrat est requise'),
    })

    const formData = useFormik({
        initialValues: {
            state: true,
            id: -1,
            liste_emprunteur: '',
            date_contrat: '',
            duree_contrat: '',
            montant_emprunt: 0,
            montant_interet: 0,
            montant_total: 0,
            date_disposition: '',
            montant_rembourse_capital: 0,
            montant_rembourse_interet: 0,
            solde_non_rembourse: 0,
            date_remboursement: '',
        },
        validationSchema,
        //validateOnChange: false,
        //validateOnBlur: true,
        onSubmit: (values) => {
            setFormDataFinal(prevFormDataFinal => {
                const newFormDataFinal = {
                    ...prevFormDataFinal,
                    state: true,
                    id: values.id,

                    liste_emprunteur: values.liste_emprunteur,
                    date_contrat: values.date_contrat,
                    duree_contrat: values.duree_contrat,
                    montant_emprunt: values.montant_emprunt,
                    montant_interet: values.montant_interet,
                    montant_total: values.montant_total,
                    date_disposition: values.date_disposition,
                    montant_rembourse_capital: values.montant_rembourse_capital,
                    montant_rembourse_interet: values.montant_rembourse_interet,
                    solde_non_rembourse: values.solde_non_rembourse,
                    date_remboursement: values.date_remboursement,
                };
                confirmationState(newFormDataFinal);
                return newFormDataFinal;
            });
        }
    });

    const handleCloseDeleteModel = () => {
        setFormDataFinal(prevFormDataFinal => {
            const newFormDataFinal = { ...prevFormDataFinal, state: false };
            confirmationState(newFormDataFinal); // Passer les nouvelles données immédiatement
            return newFormDataFinal;
        });
    }

    // Fonction pour gérer le clic sur le bouton "Modifier"
    useEffect(() => {
        if (data) {
            formData.setValues({
                state: false,
                id: data.id,
                liste_emprunteur: data.liste_emprunteur,
                date_contrat: data.date_contrat,
                duree_contrat: data.duree_contrat,
                montant_emprunt: data.montant_emprunt,
                montant_interet: data.montant_interet,
                montant_total: data.montant_total,
                date_disposition: data.date_disposition,
                montant_rembourse_capital: data.montant_rembourse_capital,
                montant_rembourse_interet: data.montant_rembourse_interet,
                solde_non_rembourse: data.solde_non_rembourse,
                date_remboursement: data.date_remboursement,
            });
        }
    }, [data]);

    const formatNumber = (value) => {
        const numericValue = Number(value);

        // Vérifier si la valeur est valide
        if (isNaN(numericValue)) {
            return '';
        }

        // Utiliser toLocaleString pour ajouter les séparateurs de milliers et garantir 2 décimales
        return numericValue.toLocaleString('fr-FR', {
            minimumFractionDigits: 2, // Toujours afficher 2 décimales
            maximumFractionDigits: 2, // Limiter à 2 décimales
        });
    };

    return (
        <form onSubmit={formData.handleSubmit}>
            <BootstrapDialog
                onClose={handleCloseDeleteModel}
                aria-labelledby="customized-dialog-title"
                open={true}
                fullWidth={true}
                maxWidth="md"
            >
                <DialogTitle sx={{ ml: 1, p: 2 }} id="customized-dialog-title" style={{ fontWeight: 'bold', width: '500px', height: '50px', backgroundColor: 'transparent' }}>
                    <Typography variant={'h6'} style={{ fontZise: 12 }}>
                        {choix} d'une ligne pour le formulaire SE
                    </Typography>
                </DialogTitle>

                <IconButton
                    style={{ color: 'red', textTransform: 'none', outline: 'none' }}
                    aria-label="close"
                    onClick={handleCloseDeleteModel}
                    sx={{
                        position: 'absolute',
                        right: 8,
                        top: 8,
                        color: (theme) => theme.palette.grey[500],
                    }}
                >
                    <CloseIcon />
                </IconButton>
                <DialogContent>

                    <Stack
                        spacing={2}
                        alignItems={'left'}
                        direction={"column"}
                        style={{ marginLeft: '10px' }}
                    >
                        <FormControl size="small" fullWidth style={{ marginBottom: '10px', width: '500px' }}>
                            <TextField
                                size="small"
                                label="Emprunteur"
                                name="liste_emprunteur"
                                value={formData.values.liste_emprunteur}
                                onChange={formData.handleChange}
                                onBlur={formData.handleBlur}
                                type="string"
                                fullWidth
                                variant='standard'
                                InputProps={{
                                    style: {
                                        fontSize: '13px',
                                        padding: '2px 4px',
                                        height: '30px',
                                    },
                                    sx: {
                                        '& input': {
                                            height: '30px',
                                        },
                                    },
                                }}
                                InputLabelProps={{
                                    style: {
                                        color: '#1976d2',
                                        fontSize: '13px',
                                        marginTop: '-2px',
                                    },
                                }}
                                error={Boolean(formData.touched.liste_emprunteur && formData.errors.liste_emprunteur)}
                                helperText={formData.touched.liste_emprunteur && formData.errors.liste_emprunteur}
                            />
                        </FormControl>

                        <Stack flexDirection={'row'} justifyContent={'space-between'}>
                            <FormControl size="small" fullWidth style={{ marginBottom: '10px', width: '19%' }}>
                                <TextField
                                    size="small"
                                    label="Date de contrat"
                                    name="date_contrat"
                                    type="date"
                                    value={formData.values.date_contrat}
                                    onChange={formData.handleChange}
                                    onBlur={formData.handleBlur}
                                    fullWidth
                                    InputLabelProps={{ shrink: true }}
                                    sx={{
                                        '& input::-webkit-calendar-picker-indicator': {
                                            filter: 'brightness(0) saturate(100%) invert(21%) sepia(31%) saturate(684%) hue-rotate(165deg) brightness(93%) contrast(90%)',
                                            cursor: 'pointer',
                                        },
                                        '& input': {
                                            height: '24px',
                                        },
                                    }}
                                    variant="standard"
                                    error={Boolean(formData.touched.date_contrat && formData.errors.date_contrat)}
                                    helperText={formData.touched.date_contrat && formData.errors.date_contrat}
                                />
                            </FormControl>

                            <FormControl size="small" fullWidth style={{ marginBottom: '10px', width: '19%' }}>
                                <TextField
                                    size="small"
                                    label="Durée du contrat"
                                    name="duree_contrat"
                                    value={formData.values.duree_contrat}
                                    onChange={formData.handleChange}
                                    onBlur={formData.handleBlur}
                                    fullWidth
                                    variant='standard'
                                    InputProps={{
                                        style: {
                                            fontSize: '13px',
                                            padding: '2px 4px',
                                            height: '30px',
                                        },
                                        sx: {
                                            '& input': {
                                                height: '30px',
                                            },
                                        },
                                    }}
                                    InputLabelProps={{
                                        style: {
                                            color: '#1976d2',
                                            fontSize: '13px',
                                            marginTop: '-2px',
                                        },
                                    }}
                                    error={Boolean(formData.touched.duree_contrat && formData.errors.duree_contrat)}
                                    helperText={formData.touched.duree_contrat && formData.errors.duree_contrat}
                                />
                            </FormControl>

                            <FormControl size="small" fullWidth style={{ marginBottom: '10px', width: '19%' }}>

                                <TextField
                                    size="small"
                                    label="Montant emprunt"
                                    name="montant_emprunt"
                                    value={formData.values.montant_emprunt}
                                    onChange={formData.handleChange}
                                    onBlur={formData.handleBlur}
                                    fullWidth
                                    style={{
                                        textAlign: 'right',
                                        justifyContent: 'right',
                                        justifyItems: 'right'
                                    }}
                                    InputProps={{
                                        style: {
                                            fontSize: '13px',
                                            padding: '2px 4px',
                                            height: '30px',
                                        },
                                        inputComponent: FormatedInput,
                                        endAdornment: <InputAdornment position="end" >
                                            <span style={{ fontSize: '13px' }}>{deviseParDefaut}</span>
                                        </InputAdornment>,
                                        sx: {
                                            '& input': {
                                                textAlign: 'right',
                                                height: '30px',
                                            },
                                        },
                                    }}
                                    InputLabelProps={{
                                        style: {
                                            color: '#1976d2',
                                            fontSize: '13px',
                                            marginTop: '-2px',
                                        },
                                    }}
                                    variant='standard'
                                    error={Boolean(formData.touched.montant_emprunt && formData.errors.montant_emprunt)}
                                    helperText={formData.touched.montant_emprunt && formData.errors.montant_emprunt}
                                />
                            </FormControl>

                            <FormControl size="small" fullWidth style={{ marginBottom: '10px', width: '19%' }}>
                                <TextField
                                    size="small"
                                    label="Montant intérêt"
                                    name="montant_interet"
                                    value={formData.values.montant_interet}
                                    onChange={formData.handleChange}
                                    onBlur={formData.handleBlur}
                                    fullWidth
                                    style={{
                                        textAlign: 'right',
                                        justifyContent: 'right',
                                        justifyItems: 'right'
                                    }}
                                    InputProps={{
                                        style: {
                                            fontSize: '13px',
                                            padding: '2px 4px',
                                            height: '30px',
                                        },
                                        inputComponent: FormatedInput,
                                        endAdornment: <InputAdornment position="end" >
                                            <span style={{ fontSize: '13px' }}>{deviseParDefaut}</span>
                                        </InputAdornment>,
                                        sx: {
                                            '& input': {
                                                textAlign: 'right',
                                                height: '30px',
                                            },
                                        },
                                    }}
                                    InputLabelProps={{
                                        style: {
                                            color: '#1976d2',
                                            fontSize: '13px',
                                            marginTop: '-2px',
                                        },
                                    }}
                                    variant='standard'
                                    error={Boolean(formData.touched.montant_interet && formData.errors.montant_interet)}
                                    helperText={formData.touched.montant_interet && formData.errors.montant_interet}
                                />
                            </FormControl>

                            <FormControl size="small" fullWidth style={{ marginBottom: '10px', width: '19%' }}>
                                <TextField
                                    size="small"
                                    label="Montant total"
                                    name="montant_total"
                                    value={formData.values.montant_total}
                                    onChange={formData.handleChange}
                                    onBlur={formData.handleBlur}
                                    fullWidth
                                    style={{
                                        textAlign: 'right',
                                        justifyContent: 'right',
                                        justifyItems: 'right'
                                    }}
                                    InputProps={{
                                        style: {
                                            fontSize: '13px',
                                            padding: '2px 4px',
                                            height: '30px',
                                        },
                                        inputComponent: FormatedInput,
                                        endAdornment: <InputAdornment position="end" >
                                            <span style={{ fontSize: '13px' }}>{deviseParDefaut}</span>
                                        </InputAdornment>,
                                        sx: {
                                            '& input': {
                                                textAlign: 'right',
                                                height: '30px',
                                            },
                                        },
                                    }}
                                    InputLabelProps={{
                                        style: {
                                            color: '#1976d2',
                                            fontSize: '13px',
                                            marginTop: '-2px',
                                        },
                                    }}
                                    variant='standard'
                                    error={Boolean(formData.touched.montant_total && formData.errors.montant_total)}
                                    helperText={formData.touched.montant_total && formData.errors.montant_total}
                                />
                            </FormControl>
                        </Stack>

                        <Divider />

                        <Stack flexDirection={'row'} justifyContent={'space-between'}>
                            <FormControl size="small" fullWidth style={{ marginBottom: '10px', width: '24%' }}>
                                <TextField
                                    size="small"
                                    label="Date mise à disp."
                                    name="date_disposition"
                                    type="date"
                                    value={formData.values.date_disposition}
                                    onChange={formData.handleChange}
                                    onBlur={formData.handleBlur}
                                    fullWidth
                                    InputLabelProps={{ shrink: true }}
                                    sx={{
                                        '& input::-webkit-calendar-picker-indicator': {
                                            filter: 'brightness(0) saturate(100%) invert(21%) sepia(31%) saturate(684%) hue-rotate(165deg) brightness(93%) contrast(90%)',
                                            cursor: 'pointer',
                                        },
                                        '& input': {
                                            height: '24px',
                                        },
                                    }}
                                    variant="standard"
                                    error={Boolean(formData.touched.date_disposition && formData.errors.date_disposition)}
                                    helperText={formData.touched.date_disposition && formData.errors.date_disposition}
                                />
                            </FormControl>

                            <FormControl size="small" fullWidth style={{ marginBottom: '10px', width: '24%' }}>
                                <TextField
                                    size="small"
                                    label="Date de remboursement"
                                    name="date_remboursement"
                                    type="date"
                                    value={formData.values.date_remboursement}
                                    onChange={formData.handleChange}
                                    onBlur={formData.handleBlur}
                                    fullWidth
                                    InputLabelProps={{ shrink: true }}
                                    sx={{
                                        '& input::-webkit-calendar-picker-indicator': {
                                            filter: 'brightness(0) saturate(100%) invert(21%) sepia(31%) saturate(684%) hue-rotate(165deg) brightness(93%) contrast(90%)',
                                            cursor: 'pointer',
                                        },
                                        '& input': {
                                            height: '24px',
                                        },
                                    }}
                                    variant="standard"
                                    error={Boolean(formData.touched.date_remboursement && formData.errors.date_remboursement)}
                                    helperText={formData.touched.date_remboursement && formData.errors.date_remboursement}
                                />
                            </FormControl>

                            <FormControl size="small" fullWidth style={{ marginBottom: '10px', width: '24%' }}>
                                <TextField
                                    size="small"
                                    label="Mont. remboursé période (capital)"
                                    name="montant_rembourse_capital"
                                    value={formData.values.montant_rembourse_capital}
                                    onChange={formData.handleChange}
                                    onBlur={formData.handleBlur}
                                    fullWidth
                                    style={{
                                        textAlign: 'right',
                                        justifyContent: 'right',
                                        justifyItems: 'right'
                                    }}
                                    InputProps={{
                                        style: {
                                            fontSize: '13px',
                                            padding: '2px 4px',
                                            height: '30px',
                                        },
                                        inputComponent: FormatedInput,
                                        endAdornment: <InputAdornment position="end" >
                                            <span style={{ fontSize: '13px' }}>{deviseParDefaut}</span>
                                        </InputAdornment>,
                                        sx: {
                                            '& input': {
                                                textAlign: 'right',
                                                height: '30px',
                                            },
                                        },
                                    }}
                                    InputLabelProps={{
                                        style: {
                                            color: '#1976d2',
                                            fontSize: '13px',
                                            marginTop: '-2px',
                                        },
                                    }}
                                    variant='standard'
                                    error={Boolean(formData.touched.montant_rembourse_capital && formData.errors.montant_rembourse_capital)}
                                    helperText={formData.touched.montant_rembourse_capital && formData.errors.montant_rembourse_capital}
                                />
                            </FormControl>

                            <FormControl size="small" fullWidth style={{ marginBottom: '10px', width: '24%' }}>
                                <TextField
                                    size="small"
                                    label="Mont. remboursé période (capital)"
                                    name="montant_rembourse_interet"
                                    value={formData.values.montant_rembourse_interet}
                                    onChange={formData.handleChange}
                                    onBlur={formData.handleBlur}
                                    fullWidth
                                    style={{
                                        textAlign: 'right',
                                        justifyContent: 'right',
                                        justifyItems: 'right'
                                    }}
                                    InputProps={{
                                        style: {
                                            fontSize: '13px',
                                            padding: '2px 4px',
                                            height: '30px',
                                        },
                                        inputComponent: FormatedInput,
                                        endAdornment: <InputAdornment position="end" >
                                            <span style={{ fontSize: '13px' }}>{deviseParDefaut}</span>
                                        </InputAdornment>,
                                        sx: {
                                            '& input': {
                                                textAlign: 'right',
                                                height: '30px',
                                            },
                                        },
                                    }}
                                    InputLabelProps={{
                                        style: {
                                            color: '#1976d2',
                                            fontSize: '13px',
                                            marginTop: '-2px',
                                        },
                                    }}
                                    variant='standard'
                                    error={Boolean(formData.touched.montant_rembourse_interet && formData.errors.montant_rembourse_interet)}
                                    helperText={formData.touched.montant_rembourse_interet && formData.errors.montant_rembourse_interet}
                                />
                            </FormControl>

                        </Stack>

                        <Divider />

                        <Stack direction={'row'} spacing={1}>
                            <FormControl size="small" fullWidth style={{ marginBottom: '10px', width: '24%' }}>
                                <TextField
                                    size="small"
                                    label="Solde non remboursé"
                                    name="solde_non_rembourse"
                                    value={formData.values.solde_non_rembourse}
                                    onChange={formData.handleChange}
                                    onBlur={formData.handleBlur}
                                    fullWidth
                                    style={{
                                        textAlign: 'right',
                                        justifyContent: 'right',
                                        justifyItems: 'right'
                                    }}
                                    InputProps={{
                                        style: {
                                            fontSize: '13px',
                                            padding: '2px 4px',
                                            height: '30px',
                                        },
                                        inputComponent: FormatedInput,
                                        endAdornment: <InputAdornment position="end" >
                                            <span style={{ fontSize: '13px' }}>{deviseParDefaut}</span>
                                        </InputAdornment>,
                                        sx: {
                                            '& input': {
                                                textAlign: 'right',
                                                height: '30px',
                                            },
                                        },
                                    }}
                                    InputLabelProps={{
                                        style: {
                                            color: '#1976d2',
                                            fontSize: '13px',
                                            marginTop: '-2px',
                                        },
                                    }}
                                    variant='standard'
                                    error={Boolean(formData.touched.solde_non_rembourse && formData.errors.solde_non_rembourse)}
                                    helperText={formData.touched.solde_non_rembourse && formData.errors.solde_non_rembourse}
                                />
                            </FormControl>
                        </Stack>
                    </Stack>

                </DialogContent>
                <DialogActions>
                    <Button autoFocus
                        variant='outlined'
                        style={{
                            backgroundColor: "transparent",
                            color: initial.theme,
                            width: "100px",
                            textTransform: 'none',
                            //outline: 'none',
                        }}
                        onClick={handleCloseDeleteModel}
                    >
                        Annuler
                    </Button>
                    <Button autoFocus
                        type="submit"
                        onClick={formData.handleSubmit}
                        style={{ backgroundColor: initial.theme, color: 'white', width: "100px", textTransform: 'none', outline: 'none' }}
                    >
                        Enregistrer
                    </Button>
                </DialogActions>
            </BootstrapDialog>
        </form>
    )
}

export default PopupModifSE;
