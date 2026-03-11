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

const PopupModifDP = ({ choix, confirmationState, data, deviseParDefaut }) => {
    const [formDataFinal, setFormDataFinal] = useState({
        state: false,
        id: -1,
        nature_prov: '',
        libelle: '',
        type_calcul: '',
        montant_debut_ex: 0,
        augm_dot_ex: 0,
        dim_repr_ex: 0,
        montant_fin: 0,
    });

    const validationSchema = Yup.object({
        libelle: Yup.string().required("Veuillez saisir un libellé pour la provision"),
        nature_prov: Yup.string().required("Veuillez saisir une nature de provision"),
        montant_debut_ex: Yup.number().positive("Veuillez entrer un montant valide").required("Veuillez saisir le montant de début d'exercice"),
        // augm_dot_ex: Yup.number().positive("Veuillez entrer un montant valide").required("Veuillez entrer un montant valide"),
        // dim_repr_ex: Yup.number().positive("Veuillez entrer un montant valide").required("Veuillez entrer un montant valide"),
    })

    const formData = useFormik({
        initialValues: {
            state: true,
            id: -1,
            nature_prov: 'AUTRE',
            libelle: '',
            type_calcul: '',
            montant_debut_ex: 0,
            augm_dot_ex: 0,
            dim_repr_ex: 0,
            montant_fin: 0,
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
                    nature_prov: values.nature_prov,
                    libelle: values.libelle,
                    type_calcul: values.type_calcul,
                    montant_debut_ex: values.montant_debut_ex,
                    augm_dot_ex: values.augm_dot_ex,
                    dim_repr_ex: values.dim_repr_ex,
                    montant_fin: values.montant_fin,
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

    useEffect(() => {
        if (data) {
            formData.setValues({
                state: false,
                id: data.id,
                nature_prov: data.nature_prov,
                libelle: data.libelle,
                type_calcul: data.type_calcul,
                montant_debut_ex: data.montant_debut_ex,
                augm_dot_ex: data.augm_dot_ex,
                dim_repr_ex: data.dim_repr_ex,
                montant_fin: data.montant_fin,
            });
        }
    }, [data]);

    // Fonction pour calculer montant_fin
    const updateValeurBrute = () => {
        const { montant_debut_ex, augm_dot_ex, dim_repr_ex } = formData.values;
        const montant_fin = montant_debut_ex + augm_dot_ex - dim_repr_ex;
        formData.setFieldValue('montant_fin', montant_fin);
    };

    useEffect(() => {
        updateValeurBrute();
    }, [formData.values.montant_debut_ex, formData.values.augm_dot_ex, formData.values.dim_repr_ex]);

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
                        {choix} d'une ligne pour le formulaire DP
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

                        <Stack direction={'row'} spacing={1}>

                            <FormControl
                                size="small"
                                fullWidth
                                style={{ marginBottom: '10px', width: '25%' }}
                                variant='standard'
                                error={Boolean(formData.touched.nature_prov && formData.errors.nature_prov)}
                            >
                                <InputLabel style={{ color: '#1976d2', fontSize: '13px' }}>Nature des provisions</InputLabel>
                                <Select
                                    label="Nature des provisions"
                                    name="nature_prov"
                                    value={formData.values.nature_prov}
                                    onChange={formData.handleChange}
                                    fullWidth
                                    onBlur={formData.handleBlur}
                                    sx={{
                                        fontSize: '13px',
                                        height: '30px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        '& .MuiSelect-select': {
                                            padding: '1px',
                                        }
                                    }}
                                >
                                    <MenuItem key="RISQUE" value="RISQUE">Provisions pour risques et charges</MenuItem>
                                    <MenuItem key="DEPRECIATION" value="DEPRECIATION">Provisions pour dépréciation</MenuItem>
                                    <MenuItem key="AUTRE" value="AUTRE">Autres provisions</MenuItem>
                                </Select>

                                <FormHelperText
                                    style={{
                                        color: 'red',
                                        marginLeft: 0,
                                        fontSize: "12px",
                                    }}
                                >
                                    {formData.errors.nature_prov && formData.touched.nature_prov && formData.errors.nature_prov}
                                </FormHelperText>
                            </FormControl>

                            <FormControl size="small" fullWidth style={{ marginBottom: '10px', width: '75%' }}>
                                <TextField
                                    disabled={formData.values.nature_prov === 'AUTRE' ? false : true}
                                    size="small"
                                    label="Provision"
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
                            <FormControl size="small" fullWidth style={{ marginBottom: '10px', width: '25%' }}>
                                <TextField
                                    size="small"
                                    label="Montant déb. exercice"
                                    name="montant_debut_ex"
                                    value={formData.values.montant_debut_ex}
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
                                    error={Boolean(formData.touched.montant_debut_ex && formData.errors.montant_debut_ex)}
                                    helperText={formData.touched.montant_debut_ex && formData.errors.montant_debut_ex}
                                />
                            </FormControl>

                            <FormControl size="small" fullWidth style={{ marginBottom: '10px', width: '25%' }}>
                                <TextField
                                    size="small"
                                    label="Augmentation dot. ex."
                                    name="augm_dot_ex"
                                    value={formData.values.augm_dot_ex}
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

                            <FormControl size="small" fullWidth style={{ marginBottom: '10px', width: '25%' }}>
                                <TextField
                                    size="small"
                                    label="Diminution repr. ex."
                                    name="dim_repr_ex"
                                    value={formData.values.dim_repr_ex}
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

                            <FormControl size="small" fullWidth style={{ marginBottom: '10px', width: '25%' }}>
                                <TextField
                                    disabled
                                    size="small"
                                    label="Montant fin exercice"
                                    name="montant_fin"
                                    value={formData.values.montant_fin}
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

export default PopupModifDP;
