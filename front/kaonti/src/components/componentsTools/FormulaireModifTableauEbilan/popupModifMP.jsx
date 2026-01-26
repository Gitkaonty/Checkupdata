import { useState, useEffect } from 'react';
import { Typography, Stack, TextField, FormControl, InputLabel, Select, MenuItem, Divider, FormHelperText } from '@mui/material';
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

const PopupModifMP = ({ choix, confirmationState, data, deviseParDefaut }) => {
    const [formDataFinal, setFormDataFinal] = useState({
        state: false,
        id: -1,
        marche: '',
        ref_marche: '',
        date: '',
        datepaiement: '',
        montantht: 0,
        montantpaye: 0,
        montanttmp: 0,
    });

    const validationSchema = Yup.object({
        marche: Yup.string().required("Veuillez choisir le type de marché"),
        ref_marche: Yup.string().required("Veuillez entrer la référence du marché"),
        // date: Yup.string()
        //     .matches(
        //         /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/, // = format du back pour la datapicker yyyy-MM-dd
        //         'La date doit être au format jj/mm/aaaa'
        //     )
        //     .test('is-valid-date', 'La date doit être valide', (value) => {
        //         if (!value) return false;

        //         const [year, month, day] = value.split('-').map(Number);

        //         // Vérifie les mois
        //         if (month < 1 || month > 12) return false;

        //         // Vérifie les jours en fonction du mois
        //         const daysInMonth = new Date(year, month, 0).getDate();
        //         return day >= 1 && day <= daysInMonth;
        //     }).required("La date du marché est obligatoire"),
        // datepaiement: Yup.string()
        //     .matches(
        //         /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/, // = format du back pour la datapicker yyyy-MM-dd
        //         'La date doit être au format jj/mm/aaaa'
        //     )
        //     .test('is-valid-date', 'La date doit être valide', (value) => {
        //         if (!value) return false;

        //         const [year, month, day] = value.split('-').map(Number);

        //         // Vérifie les mois
        //         if (month < 1 || month > 12) return false;

        //         // Vérifie les jours en fonction du mois
        //         const daysInMonth = new Date(year, month, 0).getDate();
        //         return day >= 1 && day <= daysInMonth;
        //     })
        //     .required("La date de paiement est obligatoire"),
        montantht: Yup.number().positive("Veuillez entrer le montant du marché.").required("Veuillez entrer le montant du marché."),
        // montantpaye: Yup.number().positive("Veuillez entrer le montant du marché.").required("Veuillez entrer le montant payé."),
        // montanttmp: Yup.number().positive("Veuillez entrer le montant du marché.").required("Veuillez entrer le montant du tmp."),
    })

    const formData = useFormik({
        initialValues: {
            state: true,
            id: -1,
            marche: '',
            ref_marche: '',
            date: '',
            datepaiement: '',
            montantht: 0,
            montantpaye: 0,
            montanttmp: 0,
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
                    marche: values.marche,
                    ref_marche: values.ref_marche,
                    date: values.date,
                    datepaiement: values.datepaiement,
                    montantht: values.montantht,
                    montantpaye: values.montantpaye,
                    montanttmp: values.montanttmp,
                };
                confirmationState(newFormDataFinal);
                return newFormDataFinal;
            });
        }
    });

    const handleCloseDeleteModel = () => {
        setFormDataFinal(prevFormDataFinal => {
            const newFormDataFinal = { ...prevFormDataFinal, state: false };
            confirmationState(newFormDataFinal);
            return newFormDataFinal;
        });
    }

    // Fonction pour gérer le clic sur le bouton "Modifier"
    useEffect(() => {
        if (data) {
            formData.setValues({
                state: false,
                id: data.id,
                marche: data.marche,
                ref_marche: data.ref_marche,
                date: data.date,
                datepaiement: data.date_paiement,
                montantht: data.montant_marche_ht,
                montantpaye: data.montant_paye,
                montanttmp: data.tmp,
            });
        }
    }, [data]);

    return (
        <form onSubmit={formData.handleSubmit}>
            <BootstrapDialog
                onClose={handleCloseDeleteModel}
                aria-labelledby="customized-dialog-title"
                open={true}
                fullWidth={true}
            >
                <DialogTitle sx={{ ml: 1, p: 2 }} id="customized-dialog-title" style={{ fontWeight: 'bold', width: '550px', height: '50px', backgroundColor: 'transparent' }}>
                    <Typography variant={'h6'} style={{ fontZise: 12 }}>
                        {choix} d'une ligne pour le formulaire MP
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
                        <Stack flexDirection={'row'} justifyContent={'space-between'}>

                            <FormControl
                                size="small"
                                variant='standard'
                                fullWidth
                                style={{
                                    width: '35%'
                                }}
                                error={Boolean(formData.touched.marche && formData.errors.marche)}
                            >
                                <InputLabel style={{ color: '#1976d2', fontSize: '13px' }}>Marché</InputLabel>
                                <Select
                                    label="Marché"
                                    name="marche"
                                    value={formData.values.marche}
                                    onChange={formData.handleChange}
                                    onBlur={formData.handleBlur}
                                    fullWidth
                                    sx={{
                                        fontSize: '13px',
                                        height: '30px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        '& .MuiSelect-select': {
                                            padding: '1px 8px',
                                        }
                                    }}
                                >
                                    <MenuItem key="MP" value="MP">Marché public</MenuItem>
                                    <MenuItem key="AUTRE" value="AUTRE">Autres marchés</MenuItem>
                                </Select>
                                {formData.touched.marche && formData.errors.marche && (
                                    <FormHelperText>{formData.errors.marche}</FormHelperText>
                                )}
                            </FormControl>

                            <FormControl
                                size="small"
                                fullWidth
                                style={{
                                    width: '62%'
                                }}
                            >
                                <TextField
                                    size="small"
                                    label="Référence du marché"
                                    name="ref_marche"
                                    value={formData.values.ref_marche}
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
                                    error={Boolean(formData.touched.ref_marche && formData.errors.ref_marche)}
                                    helperText={formData.touched.ref_marche && formData.errors.ref_marche}
                                />
                            </FormControl>

                        </Stack>

                        <Divider />
                        <Typography fontWeight="bold">Date</Typography>

                        <Stack flexDirection={'row'} justifyContent={'space-between'}>
                            <FormControl size="small" fullWidth style={{ marginBottom: '10px', width: '45%' }}>
                                <TextField
                                    size="small"
                                    label="Date"
                                    name="date"
                                    type="date"
                                    value={formData.values.date}
                                    onChange={formData.handleChange}
                                    onBlur={formData.handleBlur}
                                    fullWidth
                                    InputLabelProps={{ shrink: true }}
                                    sx={{
                                        '& input::-webkit-calendar-picker-indicator': {
                                            filter: 'brightness(0) saturate(100%) invert(21%) sepia(31%) saturate(684%) hue-rotate(165deg) brightness(93%) contrast(90%)',
                                            cursor: 'pointer',
                                        },
                                    }}
                                    variant="standard"
                                    disabled={formData.values.marche === 'AUTRE'}
                                    error={Boolean(formData.touched.date && formData.errors.date)}
                                    helperText={formData.touched.date && formData.errors.date}
                                />
                            </FormControl>


                            <FormControl size="small" fullWidth style={{ marginBottom: '10px', width: '45%' }}>
                                <TextField
                                    size="small"
                                    label="Date paiement"
                                    name="datepaiement"
                                    type="date"
                                    value={formData.values.datepaiement}
                                    onChange={formData.handleChange}
                                    onBlur={formData.handleBlur}
                                    fullWidth
                                    InputLabelProps={{ shrink: true }}
                                    sx={{
                                        '& input::-webkit-calendar-picker-indicator': {
                                            filter: 'brightness(0) saturate(100%) invert(21%) sepia(31%) saturate(684%) hue-rotate(165deg) brightness(93%) contrast(90%)',
                                            cursor: 'pointer',
                                        },
                                    }}
                                    variant="standard"
                                    disabled={formData.values.marche === 'AUTRE'}
                                    error={Boolean(formData.touched.datepaiement && formData.errors.datepaiement)}
                                    helperText={formData.touched.datepaiement && formData.errors.datepaiement}
                                />
                            </FormControl>
                        </Stack>

                        <Divider />
                        <Typography fontWeight="bold">Montant</Typography>

                        <Stack flexDirection={'row'} justifyContent={'space-between'}>
                            <FormControl size="small" fullWidth style={{ marginBottom: '10px', width: '32%' }}>
                                <TextField
                                    size="small"
                                    label="Montant marché"
                                    name="montantht"
                                    value={formData.values.montantht}
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
                                        endAdornment: <InputAdornment position="end">{deviseParDefaut}</InputAdornment>,
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
                                    error={Boolean(formData.touched.montantht && formData.errors.montantht)}
                                    helperText={formData.touched.montantht && formData.errors.montantht}
                                />
                            </FormControl>

                            <FormControl size="small" fullWidth style={{ marginBottom: '10px', width: '32%' }}>
                                <TextField
                                    size="small"
                                    label="Montant payé"
                                    name="montantpaye"
                                    value={formData.values.montantpaye}
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
                                        endAdornment: <InputAdornment position="end">{deviseParDefaut}</InputAdornment>,
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
                                    disabled={formData.values.marche === 'AUTRE'}
                                    error={Boolean(formData.touched.montantpaye && formData.errors.montantpaye)}
                                    helperText={formData.touched.montantpaye && formData.errors.montantpaye}
                                />
                            </FormControl>

                            <FormControl size="small" fullWidth style={{ marginBottom: '10px', width: '32%' }}>
                                <TextField
                                    size="small"
                                    label="Montant tmp"
                                    name="montanttmp"
                                    value={formData.values.montanttmp}
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
                                        endAdornment: <InputAdornment position="end">{deviseParDefaut}</InputAdornment>,
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
                                    disabled={formData.values.marche === 'AUTRE'}
                                    error={Boolean(formData.touched.montanttmp && formData.errors.montanttmp)}
                                    helperText={formData.touched.montanttmp && formData.errors.montanttmp}
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

export default PopupModifMP;
