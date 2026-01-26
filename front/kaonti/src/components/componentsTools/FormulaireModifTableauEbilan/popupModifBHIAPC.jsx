import { useState, useEffect } from 'react';
import { Typography, Stack, TextField, FormControl } from '@mui/material';
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

const PopupModifBHIAPC = ({ choix, confirmationState, data, deviseParDefaut }) => {
    const disabledFormMontant = data.id < 0 ? false : true;
    const [formDataFinal, setFormDataFinal] = useState({
        state: false,
        id: -1,
        nif: '',
        raisonsociale: '',
        adresse: '',
        montantcharge: 0,
        montantbeneficiaire: 0
    });

    const validationSchema = Yup.object({
        nif: Yup.string().required("Veuillez entrer le nif"),
        raisonsociale: Yup.string().required("Veuillez entrer une raison sociale"),
        adresse: Yup.string().required("Veuillez entrer une adresse"),
    })

    const formData = useFormik({
        initialValues: {
            state: true,
            id: -1,
            nif: '',
            raisonsociale: '',
            adresse: '',
            montantcharge: 0,
            montantbeneficiaire: 0
        },
        validationSchema,
        onSubmit: (values) => {
            setFormDataFinal(prevFormDataFinal => {
                const newFormDataFinal = {
                    ...prevFormDataFinal,
                    state: true,
                    id: values.id,
                    nif: values.nif,
                    raisonsociale: values.raisonsociale,
                    adresse: values.adresse,
                    montantcharge: values.montantcharge,
                    montantbeneficiaire: values.montantbeneficiaire,
                    anomalie: !values.nif || !values.libelle || !values.adresse
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
                nif: data.nif,
                raisonsociale: data.raison_sociale,
                adresse: data.adresse,
                montantcharge: data.montant_charge,
                montantbeneficiaire: data.montant_beneficiaire
            });
        }
    }, [data]);

    return (
        <form onSubmit={formData.handleSubmit}>
            <BootstrapDialog
                onClose={handleCloseDeleteModel}
                aria-labelledby="customized-dialog-title"
                open={true}
            >
                <DialogTitle sx={{ ml: 1, p: 2 }} id="customized-dialog-title" style={{ fontWeight: 'bold', width: '550px', height: '50px', backgroundColor: 'transparent' }}>
                    <Typography variant={'h6'} style={{ fontZise: 12 }}>
                        {choix} d'une ligne pour le formulaire BHIAPC
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
                        <FormControl size="small" fullWidth style={{ marginBottom: '10px', width: '100%' }}>
                            <TextField
                                size="small"
                                label="Nif"
                                name="nif"
                                value={formData.values.nif}
                                onChange={formData.handleChange}
                                onBlur={formData.handleBlur}
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
                                fullWidth
                                variant='standard'
                                error={Boolean(formData.touched.nif && formData.errors.nif)}
                                helperText={formData.touched.nif && formData.errors.nif}
                            />
                        </FormControl>


                        <FormControl size="small" fullWidth style={{ marginBottom: '10px', width: '100%' }}>
                            <TextField
                                size="small"
                                label="Raison sociale"
                                name="raisonsociale"
                                value={formData.values.raisonsociale}
                                onChange={formData.handleChange}
                                onBlur={formData.handleBlur}
                                type="string"
                                fullWidth
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
                                variant='standard'
                                error={Boolean(formData.touched.raisonsociale && formData.errors.raisonsociale)}
                                helperText={formData.touched.raisonsociale && formData.errors.raisonsociale}
                            />
                        </FormControl>


                        <FormControl size="small" fullWidth style={{ marginBottom: '10px', width: '100%' }}>
                            <TextField
                                size="small"
                                label="Adresse"
                                name="adresse"
                                value={formData.values.adresse}
                                onChange={formData.handleChange}
                                onBlur={formData.handleBlur}
                                fullWidth
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
                                variant='standard'
                                error={Boolean(formData.touched.adresse && formData.errors.adresse)}
                                helperText={formData.touched.adresse && formData.errors.adresse}
                            />
                        </FormControl>

                        <Stack flexDirection={'row'} justifyContent={'space-between'}>
                            <FormControl size="small" fullWidth style={{ marginBottom: '10px', width: '47%' }}>
                                <TextField
                                    disabled={disabledFormMontant}
                                    size="small"
                                    label="Montant charge"
                                    name="montantcharge"
                                    value={formData.values.montantcharge}
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
                                    error={Boolean(formData.touched.montantcharge && formData.errors.montantcharge)}
                                    helperText={formData.touched.montantcharge && formData.errors.montantcharge}
                                />
                            </FormControl>

                            <FormControl size="small" fullWidth style={{ marginBottom: '10px', width: '47%' }}>
                                <TextField
                                    disabled={disabledFormMontant}
                                    size="small"
                                    label="Montant bénéficiaire"
                                    name="montantbeneficiaire"
                                    value={formData.values.montantbeneficiaire}
                                    onChange={formData.handleChange}
                                    onBlur={formData.handleBlur}
                                    fullWidth
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
                                    error={Boolean(formData.touched.montantbeneficiaire && formData.errors.montantbeneficiaire)}
                                    helperText={formData.touched.montantbeneficiaire && formData.errors.montantbeneficiaire}
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

export default PopupModifBHIAPC;
