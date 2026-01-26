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

const PopupModifDA = ({ choix, confirmationState, data, deviseParDefaut }) => {
    const [formDataFinal, setFormDataFinal] = useState({
        state: false,
        id: -1,
        rubriques_poste: '',
        libelle: '',
        num_compte: '',
        date_acquisition: '',
        taux: 0,
        valeur_acquisition: 0,
        augmentation: 0,
        diminution: 0,
        amort_anterieur: 0,
        dotation_exercice: 0,
        amort_cumule: 0,
        valeur_nette: 0
    });

    const validationSchema = Yup.object({
        rubriques_poste: Yup.string().required("Veuillez sélectionner un rubrique"),
        libelle: Yup.string().required("Veuillez entrer un libellé"),
        num_compte: Yup.string().required("Veuillez entrer un numéro de compte"),
        date_acquisition: Yup.string()
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
            }).required("La date d'acquisition est obligatoire"),
        taux: Yup.number().min(0, "Veuillez entrer un taux supérieur ou égal à 0").required("Veuillez entrer le taux d'amortissement"),
        valeur_acquisition: Yup.number().positive("Veuillez entrer la valeur d'acquisition").required("Veuillez entrer la valeur d'acquisition"),
    })

    const formData = useFormik({
        initialValues: {
            state: true,
            id: -1,
            rubriques_poste: '',
            libelle: '',
            num_compte: '',
            date_acquisition: '',
            taux: 0,
            valeur_acquisition: 0,
            augmentation: 0,
            diminution: 0,
            amort_anterieur: 0,
            dotation_exercice: 0,
            amort_cumule: 0,
            valeur_nette: 0
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
                    rubriques_poste: values.rubriques_poste,
                    libelle: values.libelle,
                    num_compte: values.num_compte,
                    date_acquisition: values.date_acquisition,
                    taux: values.taux,
                    valeur_acquisition: values.valeur_acquisition,
                    augmentation: values.augmentation,
                    diminution: values.diminution,
                    amort_anterieur: values.amort_anterieur,
                    dotation_exercice: values.dotation_exercice,
                    amort_cumule: values.amort_cumule,
                    valeur_nette: values.valeur_nette
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
                rubriques_poste: data.rubriques_poste,
                libelle: data.libelle,
                num_compte: data.num_compte,
                date_acquisition: data.date_acquisition,
                taux: data.taux,
                valeur_acquisition: data.valeur_acquisition,
                augmentation: data.augmentation,
                diminution: data.diminution,
                amort_anterieur: data.amort_anterieur,
                dotation_exercice: data.dotation_exercice,
                amort_cumule: data.amort_cumule,
                valeur_nette: data.valeur_nette
            });
        }
    }, [data]);

    // Fonction pour calculer amort cumulés
    const updateAmortCumule = () => {
        const { amort_anterieur, dotation_exercice } = formData.values;
        const amort_cumule = amort_anterieur + dotation_exercice;
        formData.setFieldValue('amort_cumule', amort_cumule);
    };

    const updateValeurNette = () => {
        const { valeur_acquisition, augmentation, diminution, amort_cumule } = formData.values;
        const valeur_nette = valeur_acquisition + augmentation - diminution - amort_cumule;
        formData.setFieldValue('valeur_nette', valeur_nette);
    };

    useEffect(() => {
        updateAmortCumule();
        updateValeurNette();
    }, [
        formData.values.valeur_acquisition,
        formData.values.augmentation,
        formData.values.diminution,
        formData.values.amort_anterieur,
        formData.values.dotation_exercice,
        formData.values.amort_cumule,
    ]);

    return (
        <form onSubmit={formData.handleSubmit}>
            <BootstrapDialog
                onClose={handleCloseDeleteModel}
                aria-labelledby="customized-dialog-title"
                open={true}
                fullWidth={true}
                maxWidth="md"
            >
                <DialogTitle sx={{ ml: 1, p: 2 }} id="customized-dialog-title" style={{ fontWeight: 'bold', width: '800px', height: '50px', backgroundColor: 'transparent' }}>
                    <Typography variant={'h6'} style={{ fontZise: 12 }}>
                        {choix} d'une ligne pour le formulaire DA
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
                        <FormControl
                            size="small"
                            variant='standard'
                            fullWidth
                            style={{ marginBottom: '10px', width: '25%' }}
                            error={Boolean(formData.touched.rubriques_poste && formData.errors.rubriques_poste)}
                        >
                            <InputLabel style={{ color: '#1976d2', fontSize: '13px' }}>Rubrique</InputLabel>
                            <Select
                                label="Rubrique"
                                name="rubriques_poste"
                                value={formData.values.rubriques_poste}
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
                                <MenuItem key="GOODWILL" value="GOODWILL">GoodWill</MenuItem>
                                <MenuItem key="IMMO_CORP" value="IMMO_CORP">Immobilisations corporelles</MenuItem>
                                <MenuItem key="IMMO_INCORP" value="IMMO_INCORP">Immobilisations incorporelles</MenuItem>
                                <MenuItem key="IMMO_ENCOURS" value="IMMO_ENCOURS">Immobilisations en cours</MenuItem>
                                <MenuItem key="IMMO_FIN" value="IMMO_FIN">Immobilisations financière</MenuItem>
                            </Select>

                            <FormHelperText style={{ color: 'red', width: '300px' }}>
                                {formData.errors.rubriques_poste && formData.touched.rubriques_poste && formData.errors.rubriques_poste}
                            </FormHelperText>
                        </FormControl>

                        <Stack flexDirection={'row'} justifyContent={'space-between'}>
                            <FormControl size="small" fullWidth style={{ marginBottom: '10px', width: '24%' }}>
                                <TextField
                                    size="small"
                                    label="Designation"
                                    name="libelle"
                                    value={formData.values.libelle}
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
                                    error={Boolean(formData.touched.libelle && formData.errors.libelle)}
                                    helperText={formData.touched.libelle && formData.errors.libelle}
                                />
                            </FormControl>

                            <FormControl size="small" fullWidth style={{ marginBottom: '10px', width: '24%' }}>
                                <TextField
                                    size="small"
                                    label="N° de compte"
                                    name="num_compte"
                                    value={formData.values.num_compte}
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
                                    error={Boolean(formData.touched.num_compte && formData.errors.num_compte)}
                                    helperText={formData.touched.num_compte && formData.errors.num_compte}
                                />
                            </FormControl>

                            <FormControl size="small" fullWidth style={{ marginBottom: '10px', width: '24%' }}>
                                <TextField
                                    size="small"
                                    label="Date acquis."
                                    name="date_acquisition"
                                    type="date"
                                    value={formData.values.date_acquisition}
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
                                    error={Boolean(formData.touched.date_acquisition && formData.errors.date_acquisition)}
                                    helperText={formData.touched.date_acquisition && formData.errors.date_acquisition}
                                />
                            </FormControl>

                            <FormControl size="small" fullWidth style={{ marginBottom: '10px', width: '10%' }}>
                                <TextField
                                    size="small"
                                    label="Taux"
                                    name="taux"
                                    type="number"
                                    value={formData.values.taux}
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
                                    error={Boolean(formData.touched.taux && formData.errors.taux)}
                                    helperText={formData.touched.taux && formData.errors.taux}
                                />
                            </FormControl>
                        </Stack>

                        <Divider />
                        <Typography fontWeight="bold">Valeur acquis</Typography>

                        <FormControl size="small" fullWidth style={{ marginBottom: '10px', width: '24%' }}>
                            <TextField
                                size="small"
                                label="Valeur acquis."
                                name="valeur_acquisition"
                                value={formData.values.valeur_acquisition}
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
                                error={Boolean(formData.touched.valeur_acquisition && formData.errors.valeur_acquisition)}
                                helperText={formData.touched.valeur_acquisition && formData.errors.valeur_acquisition}
                            />
                        </FormControl>

                        <Divider />
                        <Typography fontWeight="bold">Montants</Typography>

                        <Stack direction={'row'} spacing={1}>
                            <FormControl size="small" fullWidth style={{ marginBottom: '10px', width: '25%' }}>
                                <TextField
                                    size="small"
                                    label="Augmentation"
                                    name="augmentation"
                                    value={formData.values.augmentation}
                                    onChange={formData.handleChange}
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
                                />
                            </FormControl>

                            <FormControl size="small" fullWidth style={{ marginBottom: '10px', width: '25%' }}>
                                <TextField
                                    size="small"
                                    label="Diminution"
                                    name="diminution"
                                    value={formData.values.diminution}
                                    onChange={formData.handleChange}
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
                                />
                            </FormControl>

                            <FormControl size="small" fullWidth style={{ marginBottom: '10px', width: '25%' }}>
                                <TextField
                                    size="small"
                                    label="Amort. antérieur"
                                    name="amort_anterieur"
                                    value={formData.values.amort_anterieur}
                                    onChange={formData.handleChange}
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
                                />
                            </FormControl>

                            <FormControl size="small" fullWidth style={{ marginBottom: '10px', width: '25%' }}>
                                <TextField
                                    size="small"
                                    label="Dot. exercice"
                                    name="dotation_exercice"
                                    value={formData.values.dotation_exercice}
                                    onChange={formData.handleChange}
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
                                />
                            </FormControl>
                        </Stack>

                        <Divider />
                        <Typography fontWeight="bold">Montants (calcul auto)</Typography>

                        <Stack direction={'row'} spacing={1}>

                            <FormControl size="small" fullWidth style={{ marginBottom: '10px', width: '25%' }}>
                                <TextField
                                    disabled
                                    size="small"
                                    label="Amort. cumulés"
                                    name="amort_cumule"
                                    value={formData.values.amort_cumule}
                                    onChange={formData.handleChange}
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
                                    variant='standard' />
                            </FormControl>

                            <FormControl size="small" fullWidth style={{ marginBottom: '10px', width: '25%' }}>
                                <TextField
                                    disabled
                                    size="small"
                                    label="Valeur nette"
                                    name="valeur_nette"
                                    value={formData.values.valeur_nette}
                                    onChange={formData.handleChange}
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

export default PopupModifDA;
