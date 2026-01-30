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

const PopupModifEIAFNC = ({ choix, confirmationState, data, deviseParDefaut }) => {
    const [formDataFinal, setFormDataFinal] = useState({
        state: false,
        id: -1,
        rubriques_poste: '',
        num_compte: '',
        libelle: '',
        valeur_acquisition: 0,
        augmentation: 0,
        diminution: 0,
        valeur_brute: 0,
    });

    const validationSchema = Yup.object({
        rubriques_poste: Yup.string().required("Veuillez choisir la nature de l'immobilisation"),
        num_compte: Yup.string().required("Veillez entrer le numéro de compte"),
        libelle: Yup.string().required("Veillez entre un libellé pour l'immobilisation"),
        valeur_acquisition: Yup.number().positive("Veuillez entrer un montant valide").required("Veuillez entrer un montant valide"),
    })

    const formData = useFormik({
        initialValues: {
            state: true,
            id: -1,
            rubriques_poste: '',
            num_compte: '',
            libelle: '',
            valeur_acquisition: 0,
            augmentation: 0,
            diminution: 0,
            valeur_brute: 0,
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
                    num_compte: values.num_compte,
                    libelle: values.libelle,
                    valeur_acquisition: values.valeur_acquisition,
                    augmentation: values.augmentation,
                    diminution: values.diminution,
                    valeur_brute: values.valeur_brute,
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
                rubriques_poste: data.rubriques_poste,
                num_compte: data.num_compte,
                libelle: data.libelle,
                valeur_acquisition: data.valeur_acquisition,
                augmentation: data.augmentation,
                diminution: data.diminution,
                valeur_brute: data.valeur_brute,
            });
        }
    }, [data]);

    // Fonction pour calculer la `valeur_brute`
    const updateValeurBrute = () => {
        const { valeur_acquisition, augmentation, diminution } = formData.values;
        const valeur_brute = valeur_acquisition + augmentation - diminution;
        formData.setFieldValue('valeur_brute', valeur_brute); // Mettre à jour la valeur de `valeur_brute`
    };

    // Appeler `updateValeurBrute` chaque fois que l'une des valeurs change
    useEffect(() => {
        updateValeurBrute();
    }, [formData.values.valeur_acquisition, formData.values.augmentation, formData.values.diminution]);

    // Fonction pour gérer la modification des données dans le formulaire
    // const handleChange = (e) => {
    //     const { name, value } = e.target;

    //     setFormData({
    //     ...formData,
    //     [name]: value,
    //     });
    // };

    // const handleSubmit = (e) => {
    //     e.preventDefault();

    //     setFormData(prevFormData => {
    //         const newFormData = { ...prevFormData, state: true };
    //         confirmationState(newFormData); // Passer les nouvelles données immédiatement
    //         return newFormData;
    //     });
    // };

    return (
        <form onSubmit={formData.handleSubmit}>
            <BootstrapDialog
                onClose={handleCloseDeleteModel}
                aria-labelledby="customized-dialog-title"
                open={true}
                fullWidth={true}
                maxWidth="md"
            >
                <DialogTitle sx={{ ml: 1, p: 2 }} id="customized-dialog-title" style={{ fontWeight: 'bold', width: '550px', height: '50px', backgroundColor: 'transparent' }}>
                    <Typography variant={'h6'} style={{ fontZise: 12 }}>
                        {choix} d'une ligne pour le formulaire EIAFNC
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
                            style={{ marginBottom: '10px' }}
                            error={Boolean(formData.touched.rubriques_poste && formData.errors.rubriques_poste)}
                        >
                            <InputLabel style={{ color: '#1976d2', fontSize: '13px' }}>Nature des immobilisations</InputLabel>
                            <Select
                                label="Nature des immobilisations"
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
                                        padding: '1px',
                                    }
                                }}
                                style={{ marginBottom: '0px', width: '30%' }}
                            >
                                {/* Remplacer ces options par celles dont tu as besoin */}
                                <MenuItem key="AUTREACTIF" value="AUTREACTIF">Autres actifs financiers non courant</MenuItem>
                                <MenuItem key="IMMOCORP" value="IMMOCORP">Immobilisation corporelle</MenuItem>
                                <MenuItem key="IMMOINCORP" value="IMMOINCORP">Immobilisation incorporelle</MenuItem>
                                <MenuItem key="IMMOENCOUR" value="IMMOENCOUR">Immobilisation en cours</MenuItem>
                                <MenuItem key="IMMOFIN" value="IMMOFIN">Immobilisation financière</MenuItem>
                                <MenuItem key="PART" value="PART">Participation</MenuItem>
                            </Select>

                            <FormHelperText style={{ width: '350px' }}>
                                {formData.errors.rubriques_poste && formData.touched.rubriques_poste && formData.errors.rubriques_poste}
                            </FormHelperText>
                        </FormControl>

                        <Stack flexDirection={'row'} justifyContent={'space-between'}>
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

                            <FormControl size="small" fullWidth style={{ marginBottom: '10px', width: '75%' }}>
                                <TextField
                                    size="small"
                                    label="Libellé"
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
                        </Stack>

                        <Divider />
                        <Typography fontWeight="bold">Montants</Typography>

                        <Stack direction={'row'} spacing={1}>
                            <FormControl size="small" fullWidth style={{ marginBottom: '10px', width: '24%' }}>
                                <TextField
                                    size="small"
                                    label="Val. acquisition"
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
                                    error={Boolean(formData.touched.valeur_acquisition && formData.errors.valeur_acquisition)}
                                    helperText={formData.touched.valeur_acquisition && formData.errors.valeur_acquisition}
                                />
                            </FormControl>

                            <FormControl size="small" fullWidth style={{ marginBottom: '10px', width: '24%' }}>
                                <TextField
                                    size="small"
                                    label="Augmentation"
                                    name="augmentation"
                                    value={formData.values.augmentation}
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
                                />
                            </FormControl>


                            <FormControl size="small" fullWidth style={{ marginBottom: '10px', width: '24%' }}>
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
                                />
                            </FormControl>

                            <FormControl size="small" fullWidth style={{ marginBottom: '10px', width: '24%' }}>
                                <TextField
                                    disabled
                                    size="small"
                                    label="Valeur brute"
                                    name="valeur_brute"
                                    value={formData.values.valeur_brute}
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

export default PopupModifEIAFNC;
