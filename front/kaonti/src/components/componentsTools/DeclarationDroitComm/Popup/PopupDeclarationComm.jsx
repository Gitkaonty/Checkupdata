import { Typography, Stack, TextField, FormControl, Divider } from '@mui/material';
import Button from '@mui/material/Button';
import { styled } from '@mui/material/styles';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import MenuItem from '@mui/material/MenuItem';

import { init } from '../../../../../init';
import toast from 'react-hot-toast';
import InputAdornment from '@mui/material/InputAdornment';
import { useFormik } from 'formik';
import * as Yup from "yup";
import FormatedInput from '../../FormatedInput';

import { inputAutoFill } from '../../../inputStyle/inputAutoFill';
import useAxiosPrivate from '../../../../../config/axiosPrivate';

let initial = init[0];

const getTextTitle = (text) => {
    if (text === 'SVT') {
        return 'Sommes versées à des tiers';
    } else if (text === 'ADR') {
        return 'Achats de marchandises destinées à la revente';
    } else if (text === 'AC') {
        return 'Achats non destinés à la vente';
    } else if (text === 'AI') {
        return 'Achats immobilisés';
    } else if (text === 'DEB') {
        return 'Debours';
    } else if (text === 'MV') {
        return 'Marchandises vendues';
    } else if (text === 'PSV') {
        return 'Prestations de services vendues';
    } else if (text === 'PL') {
        return 'Produits locaux';
    }
}

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
    '& .MuiDialogContent-root': {
        padding: theme.spacing(2),
    },
    '& .MuiDialogActions-root': {
        padding: theme.spacing(1),
    },
    '& .MuiPaper-root': {
        minHeight: '80%',
        maxHeight: '90vh',
    },
}));

const PopupDeclarationComm = ({ confirmationState, setIsRefreshed, fileId, selectedExerciceId, compteId, type, nature, rowToModify, deviseParDefaut }) => {
    const textTitle = getTextTitle(nature);
    const disabledFormMontant = rowToModify === null ? false : true;
    const axiosPrivate = useAxiosPrivate();

    const handleClose = () => {
        confirmationState(false);
        setIsRefreshed();
    }

    //Validation formik pour SVT, ADR, AC, AI, et DEB
    const validationSchema1 = Yup.object({
        typeTier: Yup.string().required('Le type de tier est obligatoire'),

        nif: Yup.string().when('typeTier', {
            is: 'avecNif',
            then: schema => schema.required('Le NIF est obligatoire'),
            otherwise: schema => schema.notRequired(),
        }),

        num_stat: Yup.string().when('typeTier', {
            is: 'avecNif',
            then: schema => schema.required('Le numéro statistique est obligatoire'),
            otherwise: schema => schema.notRequired(),
        }),

        cin: Yup.string().when('typeTier', {
            is: 'sansNif',
            then: schema => schema.required('Le CIN est obligatoire'),
            otherwise: schema => schema.notRequired(),
        }),

        date_cin: Yup.date()
            .max(new Date(), 'La date CIN ne peut pas être dans le futur')
            .when('typeTier', {
                is: 'sansNif',
                then: schema => schema.required('La date CIN est obligatoire'),
                otherwise: schema => schema.notRequired(),
            }),

        lieu_cin: Yup.string().when('typeTier', {
            is: 'sansNif',
            then: schema => schema.required('Le lieu CIN est obligatoire'),
            otherwise: schema => schema.notRequired(),
        }),

        nif_representaires: Yup.string().when('typeTier', {
            is: 'prestataires',
            then: schema => schema.required('Le nif du représentant est obligatoire'),
            otherwise: schema => schema.notRequired(),
        }),

        nature_autres: Yup.string().when('typeTier', {
            is: 'autres',
            then: schema => schema.required('La nature est obligatoire'),
            otherwise: schema => schema.notRequired(),
        }),

        reference: Yup.string().when('typeTier', {
            is: 'autres',
            then: schema => schema.required('La référence est obligatoire'),
            otherwise: schema => schema.notRequired(),
        }),

        raison_sociale: Yup.string().required('La raison sociale est obligatoire'),

        adresse: Yup.string().required('L\'adresse est obligatoire'),

        ville: Yup.string().required('La ville est obligatoire'),

        ex_province: Yup.string().required('L\'ex-province est obligatoire'),

        pays: Yup.string().required('Le pays est obligatoire'),

        nature: Yup.string().required('La nature est obligatoire'),
    });

    // Validation formik pour MV et PSV
    const validationSchema2 = Yup.object({
        typeTier: Yup.string().required('Le type de tier est obligatoire'),

        nif: Yup.string().when('typeTier', {
            is: 'avecNif',
            then: schema => schema.required('Le NIF est obligatoire'),
            otherwise: schema => schema.notRequired(),
        }),

        num_stat: Yup.string().when('typeTier', {
            is: 'avecNif',
            then: schema => schema.required('Le numéro statistique est obligatoire'),
            otherwise: schema => schema.notRequired(),
        }),

        cin: Yup.string().when('typeTier', {
            is: 'sansNif',
            then: schema => schema.required('Le CIN est obligatoire'),
            otherwise: schema => schema.notRequired(),
        }),

        date_cin: Yup.date()
            .max(new Date(), 'La date CIN ne peut pas être dans le futur')
            .when('typeTier', {
                is: 'sansNif',
                then: schema => schema.required('La date CIN est obligatoire'),
                otherwise: schema => schema.notRequired(),
            }),

        lieu_cin: Yup.string().when('typeTier', {
            is: 'sansNif',
            then: schema => schema.required('Le lieu CIN est obligatoire'),
            otherwise: schema => schema.notRequired(),
        }),

        nif_representaires: Yup.string().when('typeTier', {
            is: 'prestataires',
            then: schema => schema.required('Le nif du représentant est obligatoire'),
            otherwise: schema => schema.notRequired(),
        }),

        nature_autres: Yup.string().when('typeTier', {
            is: 'autres',
            then: schema => schema.required('La nature est obligatoire'),
            otherwise: schema => schema.notRequired(),
        }),

        reference: Yup.string().when('typeTier', {
            is: 'autres',
            then: schema => schema.required('La référence est obligatoire'),
            otherwise: schema => schema.notRequired(),
        }),

        nom_commercial: Yup.string().required('Le nom commercial est obligatoire'),

        raison_sociale: Yup.string().required('La raison sociale est obligatoire'),

        fokontany: Yup.string().required('Le fokontany est obligatoire'),

        adresse: Yup.string().required('L\'adresse est obligatoire'),

        ville: Yup.string().required('La ville est obligatoire'),

        ex_province: Yup.string().required('L\'ex-province est obligatoire'),

        pays: Yup.string().required('Le pays est obligatoire'),

        nature: Yup.string().required('La nature est obligatoire'),

        mode_payement: Yup.string().required('Le mode de payement est obligatoire'),
    });

    // Validation formik pour PL
    const validationSchema3 = Yup.object({
        typeTier: Yup.string().required('Le type de tier est obligatoire'),

        nif: Yup.string().when('typeTier', {
            is: 'avecNif',
            then: schema => schema.required('Le NIF est obligatoire'),
            otherwise: schema => schema.notRequired(),
        }),

        num_stat: Yup.string().when('typeTier', {
            is: 'avecNif',
            then: schema => schema.required('Le numéro statistique est obligatoire'),
            otherwise: schema => schema.notRequired(),
        }),

        cin: Yup.string().when('typeTier', {
            is: 'sansNif',
            then: schema => schema.required('Le CIN est obligatoire'),
            otherwise: schema => schema.notRequired(),
        }),

        date_cin: Yup.date()
            .max(new Date(), 'La date CIN ne peut pas être dans le futur')
            .when('typeTier', {
                is: 'sansNif',
                then: schema => schema.required('La date CIN est obligatoire'),
                otherwise: schema => schema.notRequired(),
            }),

        lieu_cin: Yup.string().when('typeTier', {
            is: 'sansNif',
            then: schema => schema.required('Le lieu CIN est obligatoire'),
            otherwise: schema => schema.notRequired(),
        }),

        nif_representaires: Yup.string().when('typeTier', {
            is: 'prestataires',
            then: schema => schema.required('Le nif du représentant est obligatoire'),
            otherwise: schema => schema.notRequired(),
        }),

        nature_autres: Yup.string().when('typeTier', {
            is: 'autres',
            then: schema => schema.required('La nature est obligatoire'),
            otherwise: schema => schema.notRequired(),
        }),

        reference: Yup.string().when('typeTier', {
            is: 'autres',
            then: schema => schema.required('La référence est obligatoire'),
            otherwise: schema => schema.notRequired(),
        }),

        nom: Yup.string().required('Le nom est obligatoire'),

        prenom: Yup.string().required('Le prenom est obligatoire'),

        raison_sociale: Yup.string().required('La raison sociale est obligatoire'),

        adresse: Yup.string().required('L\'adresse est obligatoire'),

        ville: Yup.string().required('La ville est obligatoire'),

        ex_province: Yup.string().required('L\'ex-province est obligatoire'),

        pays: Yup.string().required('Le pays est obligatoire'),

        nature: Yup.string().required('La nature est obligatoire'),
    });

    const validationSchema =
        nature === 'SVT' || nature === 'ADR' || nature === 'AC' || nature === 'AI' || nature === 'DEB'
            ?
            validationSchema1
            :
            nature === 'MV' || nature === 'PSV'
                ?
                validationSchema2
                :
                validationSchema3

    // Fonction d'ajout pour les SVT, ADR, AC, AI, DEB
    const handleAddDroitComma = () => {
        const cleanFormData = { ...formData.values };

        if (!cleanFormData.date_cin || cleanFormData.date_cin === 'Invalid date') {
            cleanFormData.date_cin = null;
        }

        axiosPrivate.post('/declaration/comm/addDroitCommA', {
            formData: cleanFormData
        }).then((response) => {
            if (response.data.state) {
                toast.success('Déclaration ajoutée avec succès');
                handleClose();
            } else {
                toast.error(response.data.message);
            }
        })
    }

    // Fonction d'ajout pour les MV, PSV, PL
    const handleAddDroitCommb = () => {
        const cleanFormData = { ...formData.values };

        if (!cleanFormData.date_cin || cleanFormData.date_cin === 'Invalid date') {
            cleanFormData.date_cin = null;
        }

        axiosPrivate.post('/declaration/comm/addDroitCommB', {
            formData: cleanFormData
        }).then((response) => {
            if (response.data.state) {
                toast.success('Déclaration ajoutée avec succès');
                handleClose();
            } else {
                toast.error(response.data.message);
            }
        })
    }

    // Fonction de mise à jour pour les SVT, ADR, AC, AI, DEB
    const handleUpdateDroitComma = () => {
        const cleanFormData = { ...formData.values };
        const id = Number(rowToModify.id);

        if (!cleanFormData.date_cin || cleanFormData.date_cin === 'Invalid date') {
            cleanFormData.date_cin = null;
        }

        axiosPrivate.put(`/declaration/comm/updateDroitCommA/${id}`, {
            formData: cleanFormData
        }).then((response) => {
            if (response.data.state) {
                toast.success('Déclaration modifié avec succès');
                handleClose();
            } else {
                toast.error(response.data.message);
            }
        })
    }

    // Fonction de mise à jour pour les MV, PSV, PL
    const handleUpdateDroitCommb = () => {
        const cleanFormData = { ...formData.values };

        if (!cleanFormData.date_cin || cleanFormData.date_cin === 'Invalid date') {
            cleanFormData.date_cin = null;
        }

        axiosPrivate.put(`/declaration/comm/updateDroitCommB:${id}`, {
            formData: cleanFormData
        }).then((response) => {
            if (response.data.state) {
                toast.success('Déclaration modifié avec succès');
                handleClose();
            } else {
                toast.error(response.data.message);
            }
        })
    }

    // Affichage d'une erreur pour SVT, ADR, AC, AI, DEB
    const handleDroitCommAddError = () => {
        toast.error('Erreur lors de l\'ajout de la déclaration');
        handleClose();
    }

    // Affichage d'une erreur pour MV, PSV, PL
    const handleDroitCommEditError = () => {
        toast.error('Erreur lors de la modification de la déclaration');
        handleClose();
    }

    // Fonction d'ajout final
    const handleAddDroitComm =
        nature === 'SVT' || nature === 'ADR' || nature === 'AC' || nature === 'AI' || nature === 'DEB'
            ?
            handleAddDroitComma
            :
            nature === 'MV' || nature === 'PSV' || nature === 'PL'
                ?
                handleAddDroitCommb : handleDroitCommAddError

    // Fonction de mise à jour final
    const handleUpdateDroitComm =
        nature === 'SVT' || nature === 'ADR' || nature === 'AC' || nature === 'AI' || nature === 'DEB'
            ?
            handleUpdateDroitComma
            :
            nature === 'MV' || nature === 'PSV' || nature === 'PL'
                ?
                handleUpdateDroitCommb : handleDroitCommEditError

    // Fonction d'ajout ou de modification
    const handleSubmitData = type === 'Ajout' ? handleAddDroitComm : handleUpdateDroitComm;

    // Formik pour SVT, ADR, AC, AI, DEB
    const formData1 = useFormik({
        initialValues: {
            id_dossier: type === 'Ajout' ? Number(fileId) : Number(rowToModify.id_dossier),
            id_exercice: type === 'Ajout' ? Number(selectedExerciceId) : Number(rowToModify.id_exercice),
            id_compte: type === 'Ajout' ? Number(compteId) : Number(rowToModify.id_compte),
            id_numcpt: Number(rowToModify?.id_numcpt),
            typeTier: type === 'Ajout' ? 'avecNif' : rowToModify.typeTier,
            nif: type === 'Ajout' ? '' : rowToModify.nif,
            nif_representaires: type === 'Ajout' ? '' : rowToModify.nif_representaires,
            num_stat: type === 'Ajout' ? '' : rowToModify.num_stat,
            cin: type === 'Ajout' ? '' : rowToModify.cin,
            date_cin: type === 'Ajout' ? '' : rowToModify.date_cin,
            lieu_cin: type === 'Ajout' ? '' : rowToModify.lieu_cin,
            nature_autres: type === 'Ajout' ? '' : rowToModify.nature_autres,
            reference: type === 'Ajout' ? '' : rowToModify.reference,
            raison_sociale: type === 'Ajout' ? '' : rowToModify.raison_sociale,
            adresse: type === 'Ajout' ? '' : rowToModify.adresse,
            ville: type === 'Ajout' ? '' : rowToModify.ville,
            ex_province: type === 'Ajout' ? '' : rowToModify.ex_province,
            pays: type === 'Ajout' ? '' : rowToModify.pays,
            nature: type === 'Ajout' ? '' : rowToModify.nature,
            comptabilisees: type === 'Ajout' ? '' : rowToModify.comptabilisees,
            versees: type === 'Ajout' ? '' : rowToModify.versees,
            type: nature
        },
        validationSchema,
        onSubmit: () => {
            handleSubmitData();
        }
    })

    // Formik pour MV, PSV
    const formData2 = useFormik({
        initialValues: {
            id_dossier: type === 'Ajout' ? Number(fileId) : Number(rowToModify.id_dossier),
            id_exercice: type === 'Ajout' ? Number(selectedExerciceId) : Number(rowToModify.id_exercice),
            id_compte: type === 'Ajout' ? Number(compteId) : Number(rowToModify.id_compte),
            id_numcpt: Number(rowToModify?.id_numcpt),
            typeTier: type === 'Ajout' ? 'avecNif' : rowToModify.typeTier,
            nif: type === 'Ajout' ? '' : rowToModify.nif,
            nif_representaires: type === 'Ajout' ? '' : rowToModify.nif_representaires,
            num_stat: type === 'Ajout' ? '' : rowToModify.num_stat,
            cin: type === 'Ajout' ? '' : rowToModify.cin,
            date_cin: type === 'Ajout' ? '' : rowToModify.date_cin,
            lieu_cin: type === 'Ajout' ? '' : rowToModify.lieu_cin,
            nature_autres: type === 'Ajout' ? '' : rowToModify.nature_autres,
            reference: type === 'Ajout' ? '' : rowToModify.reference,
            raison_sociale: type === 'Ajout' ? '' : rowToModify.raison_sociale,
            fokontany: type === 'Ajout' ? '' : rowToModify.fokontany,
            adresse: type === 'Ajout' ? '' : rowToModify.adresse,
            ville: type === 'Ajout' ? '' : rowToModify.ville,
            ex_province: type === 'Ajout' ? '' : rowToModify.ex_province,
            pays: type === 'Ajout' ? '' : rowToModify.pays,
            nature: type === 'Ajout' ? '' : rowToModify.nature,
            mode_payement: type === 'Ajout' ? '' : rowToModify.mode_payement,
            montanth_tva: type === 'Ajout' ? '' : rowToModify.montanth_tva,
            tva: type === 'Ajout' ? '' : rowToModify.tva,
            type: nature
        },
        validationSchema,
        onSubmit: () => {
            handleSubmitData();
        }
    })

    // Formik pour PL
    const formData3 = useFormik({
        initialValues: {
            id_dossier: type === 'Ajout' ? Number(fileId) : Number(rowToModify.id_dossier),
            id_exercice: type === 'Ajout' ? Number(selectedExerciceId) : Number(rowToModify.id_exercice),
            id_compte: type === 'Ajout' ? Number(compteId) : Number(rowToModify.id_compte),
            id_numcpt: Number(rowToModify?.id_numcpt),
            typeTier: type === 'Ajout' ? 'avecNif' : rowToModify.typeTier,
            nif: type === 'Ajout' ? '' : rowToModify.nif,
            nif_representaires: type === 'Ajout' ? '' : rowToModify.nif_representaires,
            num_stat: type === 'Ajout' ? '' : rowToModify.num_stat,
            cin: type === 'Ajout' ? '' : rowToModify.cin,
            date_cin: type === 'Ajout' ? '' : rowToModify.date_cin,
            lieu_cin: type === 'Ajout' ? '' : rowToModify.lieu_cin,
            nature_autres: type === 'Ajout' ? '' : rowToModify.nature_autres,
            reference: type === 'Ajout' ? '' : rowToModify.reference,
            nom: type === 'Ajout' ? '' : rowToModify.nom,
            prenom: type === 'Ajout' ? '' : rowToModify.prenom,
            raison_sociale: type === 'Ajout' ? '' : rowToModify.raison_sociale,
            adresse: type === 'Ajout' ? '' : rowToModify.adresse,
            ville: type === 'Ajout' ? '' : rowToModify.ville,
            ex_province: type === 'Ajout' ? '' : rowToModify.ex_province,
            pays: type === 'Ajout' ? '' : rowToModify.pays,
            nature: type === 'Ajout' ? '' : rowToModify.nature,
            montanth_tva: type === 'Ajout' ? '' : rowToModify.montanth_tva,
            tva: type === 'Ajout' ? '' : rowToModify.tva,
            type: nature
        },
        validationSchema,
        onSubmit: () => {
            handleAddDroitComm();
        }
    })

    // Formik final
    const formData =
        nature === 'SVT' || nature === 'ADR' || nature === 'AC' || nature === 'AI' || nature === 'DEB'
            ?
            formData1
            :
            nature === 'MV' || nature === 'PSV'
                ?
                formData2
                :
                formData3

    // Modification du type
    const handleTypeTierChange = (e) => {
        const { value } = e.target;

        formData.handleChange(e);

        const resetFields = {
            avecNif: ['cin', 'lieu_cin', 'date_cin', 'nature_autre', 'reference'],
            sansNif: ['nif', 'num_stat', 'nature_autre', 'reference'],
            autres: ['nif', 'num_stat', 'cin', 'date_cin', 'lieu_cin'],
            prestataires: ['nif_representaires']
        };

        if (resetFields[value]) {
            resetFields[value].forEach((field) => formData.setFieldValue(field, ''));
        }
    };

    return (
        <form
            onSubmit={formData.handleSubmit}
        >
            <BootstrapDialog
                onClose={handleClose}
                aria-labelledby="customized-dialog-title"
                open={true}
                maxWidth="md"
                fullWidth={true}
            >
                <DialogTitle
                    id="customized-dialog-title"
                    sx={{ ml: 1, p: 2, width: '99%', height: '50px', backgroundColor: 'transparent' }}
                >
                    <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', fontSize: 16 }}>
                        {type} d'une ligne pour : {textTitle}
                    </Typography>
                </DialogTitle>

                <IconButton
                    style={{ color: 'red', textTransform: 'none', outline: 'none' }}
                    aria-label="close"
                    onClick={handleClose}
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
                    <Stack height={"450px"} spacing={2} alignItems={'left'}
                        direction={"column"} style={{ marginLeft: '10px' }}
                    >
                        <FormControl
                            size="small"
                            variant="standard"
                            fullWidth
                            style={{ width: '28%' }}
                        >
                            <InputLabel>Type de tier</InputLabel>
                            <Select
                                value={formData.values.typeTier}
                                onChange={handleTypeTierChange}
                                name="typeTier"
                                InputLabelProps={{
                                    style: {
                                        color: '#1976d2',
                                        fontSize: '13px',
                                        marginTop: '-2px',
                                    },
                                }}
                            >
                                <MenuItem value={'avecNif'}>Possedant un NIF</MenuItem>
                                <MenuItem value={'sansNif'}>Ne possendant pas de NIF</MenuItem>
                                <MenuItem value={'prestataires'}>Préstataires étrangers</MenuItem>
                                <MenuItem value={'autres'}>Autres</MenuItem>
                            </Select>
                        </FormControl>
                        {
                            formData.values.typeTier === 'avecNif' ?
                                <>
                                    <Stack flexDirection={'row'} justifyContent={'space-between'}>
                                        <FormControl size="small" fullWidth style={{ width: '49%' }}>
                                            <TextField
                                                size="small"
                                                label="Nif"
                                                name="nif"
                                                value={formData.values.nif}
                                                onChange={formData.handleChange}
                                                onBlur={formData.handleBlur}
                                                error={Boolean(formData.touched.nif && formData.errors.nif)}
                                                helperText={formData.touched.nif && formData.errors.nif}
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
                                                sx={{
                                                    ...inputAutoFill
                                                }}
                                            />
                                        </FormControl>
                                        <FormControl size="small" fullWidth style={{ width: '49%' }}>
                                            <TextField
                                                size="small"
                                                label="Numéro statistique"
                                                name="num_stat"
                                                value={formData.values.num_stat}
                                                onChange={formData.handleChange}
                                                onBlur={formData.handleBlur}
                                                error={Boolean(formData.touched.num_stat && formData.errors.num_stat)}
                                                helperText={formData.touched.num_stat && formData.errors.num_stat}
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
                                                sx={{
                                                    ...inputAutoFill
                                                }}
                                            />
                                        </FormControl>
                                    </Stack>
                                </>
                                :
                                formData.values.typeTier === 'sansNif' ?
                                    <>
                                        <Stack flexDirection={'row'} justifyContent={'space-between'} >
                                            <FormControl size="small" fullWidth style={{ marginBottom: '10px', width: '32%' }}>
                                                <TextField
                                                    size="small"
                                                    label="CIN"
                                                    name="cin"
                                                    value={formData.values.cin}
                                                    onChange={formData.handleChange}
                                                    onBlur={formData.handleBlur}
                                                    error={Boolean(formData.touched.cin && formData.errors.cin)}
                                                    helperText={formData.touched.cin && formData.errors.cin}
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
                                                    sx={{
                                                        ...inputAutoFill
                                                    }}
                                                />
                                            </FormControl>
                                            <FormControl size="small" fullWidth style={{ marginBottom: '10px', width: '32%' }}>
                                                <TextField
                                                    size="small"
                                                    label="Lieu CIN"
                                                    name="lieu_cin"
                                                    value={formData.values.lieu_cin}
                                                    onChange={formData.handleChange}
                                                    onBlur={formData.handleBlur}
                                                    error={Boolean(formData.touched.lieu_cin && formData.errors.lieu_cin)}
                                                    helperText={formData.touched.lieu_cin && formData.errors.lieu_cin}
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
                                                    sx={{
                                                        ...inputAutoFill
                                                    }}
                                                />
                                            </FormControl>
                                            <FormControl size="small" fullWidth style={{ marginBottom: '10px', width: '32%' }}>
                                                <TextField
                                                    size="small"
                                                    label="Date CIN"
                                                    name="date_cin"
                                                    type="date"
                                                    value={formData.values.date_cin || ""}
                                                    onChange={formData.handleChange}
                                                    onBlur={formData.handleBlur}
                                                    error={Boolean(formData.touched.date_cin && formData.errors.date_cin)}
                                                    helperText={formData.touched.date_cin && formData.errors.date_cin}
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
                                                            '& input::-webkit-calendar-picker-indicator': {
                                                                filter: 'brightness(0) saturate(100%) invert(21%) sepia(31%) saturate(684%) hue-rotate(165deg) brightness(93%) contrast(90%)',
                                                                cursor: 'pointer',
                                                            },
                                                        },
                                                    }}
                                                    InputLabelProps={{
                                                        shrink: true,
                                                        style: {
                                                            color: '#1976d2',
                                                            fontSize: '13px',
                                                            marginTop: '-2px',
                                                        },
                                                    }}
                                                    sx={{
                                                        ...inputAutoFill
                                                    }}
                                                />
                                            </FormControl>
                                        </Stack>
                                    </>
                                    :
                                    formData.values.typeTier === 'prestataires' ?
                                        <>
                                            <Stack flexDirection={'row'} justifyContent={'space-between'} >
                                                <FormControl size="small" fullWidth style={{ width: '50%' }}>
                                                    <TextField
                                                        size="small"
                                                        label="Nif du représentant"
                                                        name="nif_representaires"
                                                        value={formData.values.nif_representaires}
                                                        onChange={formData.handleChange}
                                                        onBlur={formData.handleBlur}
                                                        error={Boolean(formData.touched.nif_representaires && formData.errors.nif_representaires)}
                                                        helperText={formData.touched.nif_representaires && formData.errors.nif_representaires}
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
                                                        sx={{
                                                            ...inputAutoFill
                                                        }}
                                                    />
                                                </FormControl>
                                            </Stack>
                                        </>
                                        :
                                        <>
                                            <Stack flexDirection={'row'} justifyContent={'space-between'} >
                                                <FormControl size="small" fullWidth style={{ marginBottom: '10px', width: '49%' }}>
                                                    <TextField
                                                        size="small"
                                                        label="Nature"
                                                        name="nature_autres"
                                                        value={formData.values.nature_autres}
                                                        onChange={formData.handleChange}
                                                        onBlur={formData.handleBlur}
                                                        error={Boolean(formData.touched.nature_autres && formData.errors.nature_autres)}
                                                        helperText={formData.touched.nature_autres && formData.errors.nature_autres}
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
                                                        sx={{
                                                            ...inputAutoFill
                                                        }}
                                                    />
                                                </FormControl>
                                                <FormControl size="small" fullWidth style={{ marginBottom: '10px', width: '49%' }}>
                                                    <TextField
                                                        size="small"
                                                        label="Reférence"
                                                        name="reference"
                                                        value={formData.values.reference}
                                                        onChange={formData.handleChange}
                                                        onBlur={formData.handleBlur}
                                                        error={Boolean(formData.touched.reference && formData.errors.reference)}
                                                        helperText={formData.touched.reference && formData.errors.reference}
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
                                                        sx={{
                                                            ...inputAutoFill
                                                        }}
                                                    />
                                                </FormControl>
                                            </Stack>
                                        </>

                        }
                        <Divider />
                        <Typography fontWeight="bold">Nom Commercial / Raison social</Typography>
                        {
                            nature === 'PL'
                                ?
                                <>
                                    <Stack flexDirection={'row'} justifyContent={'space-between'}>
                                        <FormControl size="small" fullWidth style={{ marginBottom: '10px', width: '49%' }}>
                                            <TextField
                                                size="small"
                                                label="Nom"
                                                name="nom"
                                                value={formData.values.nom}
                                                onChange={formData.handleChange}
                                                onBlur={formData.handleBlur}
                                                error={Boolean(formData.touched.nom && formData.errors.nom)}
                                                helperText={formData.touched.nom && formData.errors.nom}
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
                                                sx={{
                                                    ...inputAutoFill
                                                }}
                                            />
                                        </FormControl>
                                        <FormControl size="small" fullWidth style={{ marginBottom: '10px', width: '49%' }}>
                                            <TextField
                                                size="small"
                                                label="Prenom"
                                                name="prenom"
                                                value={formData.values.prenom}
                                                onChange={formData.handleChange}
                                                onBlur={formData.handleBlur}
                                                error={Boolean(formData.touched.prenom && formData.errors.prenom)}
                                                helperText={formData.touched.prenom && formData.errors.prenom}
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
                                                sx={{
                                                    ...inputAutoFill
                                                }}
                                            />
                                        </FormControl>
                                    </Stack>
                                </>
                                :
                                ''
                        }

                        {
                            nature === 'MV' || nature === 'PSV' ?
                                <Stack flexDirection={'row'} justifyContent={'space-between'} >
                                    <FormControl size="small" fullWidth style={{ width: '49%' }}>
                                        <TextField
                                            size="small"
                                            label="Raison social / Nom"
                                            name="raison_sociale"
                                            value={formData.values.raison_sociale}
                                            onChange={formData.handleChange}
                                            onBlur={formData.handleBlur}
                                            error={Boolean(formData.touched.raison_sociale && formData.errors.raison_sociale)}
                                            helperText={formData.touched.raison_sociale && formData.errors.raison_sociale}
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
                                            sx={{
                                                ...inputAutoFill
                                            }}
                                        />
                                    </FormControl>
                                    <FormControl size="small" fullWidth style={{ width: '49%' }}>
                                        <TextField
                                            size="small"
                                            label="Nom Commercial"
                                            name="nom_commercial"
                                            value={formData.values.nom_commercial}
                                            onChange={formData.handleChange}
                                            onBlur={formData.handleBlur}
                                            error={Boolean(formData.touched.nom_commercial && formData.errors.nom_commercial)}
                                            helperText={formData.touched.nom_commercial && formData.errors.nom_commercial}
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
                                            sx={{
                                                ...inputAutoFill
                                            }}
                                        />
                                    </FormControl>
                                </Stack>
                                :
                                <FormControl size="small" fullWidth style={{ width: '50%' }}>
                                    <TextField
                                        size="small"
                                        label="Nom Commercial / Raison social"
                                        name="raison_sociale"
                                        value={formData.values.raison_sociale}
                                        onChange={formData.handleChange}
                                        onBlur={formData.handleBlur}
                                        error={Boolean(formData.touched.raison_sociale && formData.errors.raison_sociale)}
                                        helperText={formData.touched.raison_sociale && formData.errors.raison_sociale}
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
                                        sx={{
                                            ...inputAutoFill
                                        }}
                                    />
                                </FormControl>
                        }

                        <Divider />
                        <Typography fontWeight="bold">Adresse complèlte</Typography>
                        <Stack flexDirection={'row'} justifyContent={'space-between'}>
                            {
                                nature === 'MV' || nature === 'PSV' ?
                                    <>
                                        <FormControl size="small" fullWidth style={{ marginBottom: '10px', width: '32%' }}>
                                            <TextField
                                                size="small"
                                                label="Fokontany"
                                                name="fokontany"
                                                value={formData.values.fokontany}
                                                onChange={formData.handleChange}
                                                onBlur={formData.handleBlur}
                                                error={Boolean(formData.touched.fokontany && formData.errors.fokontany)}
                                                helperText={formData.touched.fokontany && formData.errors.fokontany}
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
                                                sx={{
                                                    ...inputAutoFill
                                                }}
                                            />
                                        </FormControl>
                                    </> : ''
                            }
                            <FormControl size="small" fullWidth style={{ marginBottom: '10px', width: nature === 'MV' || nature === 'PSV' ? '32%' : '49%' }}>
                                <TextField
                                    size="small"
                                    label="Adresse"
                                    name="adresse"
                                    value={formData.values.adresse}
                                    onChange={formData.handleChange}
                                    onBlur={formData.handleBlur}
                                    error={Boolean(formData.touched.adresse && formData.errors.adresse)}
                                    helperText={formData.touched.adresse && formData.errors.adresse}
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
                                    sx={{
                                        ...inputAutoFill
                                    }}
                                />
                            </FormControl>
                            <FormControl size="small" fullWidth style={{ marginBottom: '10px', width: nature === 'MV' || nature === 'PSV' ? '32%' : '49%' }}>
                                <TextField
                                    size="small"
                                    label="Ville"
                                    name="ville"
                                    value={formData.values.ville}
                                    onChange={formData.handleChange}
                                    onBlur={formData.handleBlur}
                                    error={Boolean(formData.touched.ville && formData.errors.ville)}
                                    helperText={formData.touched.ville && formData.errors.ville}
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
                                    sx={{
                                        ...inputAutoFill
                                    }}
                                />
                            </FormControl>
                        </Stack>
                        <Stack flexDirection={'row'} justifyContent={'space-between'} >
                            <FormControl size="small" fullWidth style={{ marginBottom: '10px', width: '49%' }}>
                                <TextField
                                    size="small"
                                    label="Ex-province"
                                    name="ex_province"
                                    value={formData.values.ex_province}
                                    onChange={formData.handleChange}
                                    onBlur={formData.handleBlur}
                                    error={Boolean(formData.touched.ex_province && formData.errors.ex_province)}
                                    helperText={formData.touched.ex_province && formData.errors.ex_province}
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
                                    sx={{
                                        ...inputAutoFill
                                    }}
                                />
                            </FormControl>
                            <FormControl size="small" fullWidth style={{ marginBottom: '10px', width: '49%' }}>
                                <TextField
                                    size="small"
                                    label="Pays"
                                    name="pays"
                                    value={formData.values.pays}
                                    onChange={formData.handleChange}
                                    onBlur={formData.handleBlur}
                                    error={Boolean(formData.touched.pays && formData.errors.pays)}
                                    helperText={formData.touched.pays && formData.errors.pays}
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
                                    sx={{
                                        ...inputAutoFill
                                    }}
                                />
                            </FormControl>
                        </Stack>

                        <Divider />
                        <Typography fontWeight="bold">
                            {
                                nature === 'SVT' ? "Nature des services rendus" :
                                    nature === 'ADR' ? "Nature des marchandises" :
                                        nature === 'AC' ? "Nature des achats consommés" :
                                            nature === 'AI' ? "Nature des achats immobiliers" :
                                                nature === 'DEB' ? 'Nature des services rendus' :
                                                    nature === 'MV' ? 'Natures des marchandises' :
                                                        nature === 'PSV' ? 'Natures des prestations' :
                                                            nature === 'PL' ? 'Natures des produits' : ''
                            }
                        </Typography>
                        <FormControl size="small" fullWidth style={{ width: '50%' }}>
                            <TextField
                                size="small"
                                label="Nature"
                                name="nature"
                                value={formData.values.nature}
                                onChange={formData.handleChange}
                                onBlur={formData.handleBlur}
                                error={Boolean(formData.touched.nature && formData.errors.nature)}
                                helperText={formData.touched.nature && formData.errors.nature}
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
                                sx={{
                                    ...inputAutoFill
                                }}
                            />
                        </FormControl>

                        <Divider />
                        {
                            nature === 'SVT' || nature === 'ADR' || nature === 'AC' || nature === 'AI' || nature === 'DEB' ?
                                <>
                                    <Typography fontWeight="bold">Montant hors tâxe des sommes</Typography>
                                    <Stack flexDirection={'row'} justifyContent={'space-between'} >
                                        <FormControl size="small" fullWidth style={{ marginBottom: '10px', width: '49%' }}>
                                            <TextField
                                                disabled={disabledFormMontant}
                                                size="small"
                                                label="Comptabilisées"
                                                name="comptabilisees"
                                                value={formData.values.comptabilisees}
                                                onChange={formData.handleChange}
                                                fullWidth
                                                variant='standard'
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
                                                            height: '30px',
                                                            textAlign: 'right',
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
                                                sx={{
                                                    ...inputAutoFill
                                                }}
                                            />
                                        </FormControl>
                                        <FormControl size="small" fullWidth style={{ marginBottom: '10px', width: '49%' }}>
                                            <TextField
                                                disabled={disabledFormMontant}
                                                size="small"
                                                label="Versees"
                                                name="versees"
                                                value={formData.values.versees}
                                                onChange={formData.handleChange}
                                                fullWidth
                                                variant='standard'
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
                                                            height: '30px',
                                                            textAlign: 'right',
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
                                                sx={{
                                                    ...inputAutoFill
                                                }}
                                            />
                                        </FormControl>
                                    </Stack>
                                </> :
                                nature === 'MV' || nature === 'PSV' ?
                                    <>
                                        <Stack flexDirection={'row'} justifyContent={'space-between'} >
                                            <FormControl size="small" fullWidth style={{ marginBottom: '10px', width: '29%' }}>
                                                <TextField
                                                    size="small"
                                                    label="Mode de payement"
                                                    name="mode_payement"
                                                    value={formData.values.mode_payement}
                                                    onChange={formData.handleChange}
                                                    onBlur={formData.handleBlur}
                                                    error={Boolean(formData.touched.mode_payement && formData.errors.mode_payement)}
                                                    helperText={formData.touched.mode_payement && formData.errors.mode_payement}
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
                                                    sx={{
                                                        ...inputAutoFill
                                                    }}
                                                />
                                            </FormControl>
                                            <FormControl size="small" fullWidth style={{ marginBottom: '10px', width: '44%' }}>
                                                <TextField
                                                    size="small"
                                                    label="Montants hors TVA"
                                                    name="montanth_tva"
                                                    value={formData.values.montanth_tva}
                                                    fullWidth
                                                    variant='standard'
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
                                                                height: '30px',
                                                                textAlign: 'right',
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
                                                    sx={{
                                                        ...inputAutoFill
                                                    }}
                                                />
                                            </FormControl>
                                            <FormControl size="small" fullWidth style={{ marginBottom: '10px', width: '24%' }}>
                                                <TextField
                                                    size="small"
                                                    label="TVA"
                                                    name="tva"
                                                    type='number'
                                                    value={formData.values.tva}
                                                    onChange={(e) => {
                                                        const value = parseFloat(e.target.value);
                                                        if (isNaN(value) || value < 0 || value > 100) return;

                                                        const roundedValue = Math.round(value * 10) / 10;
                                                        formData.setFieldValue("tva", roundedValue);
                                                    }}
                                                    variant='standard'
                                                    InputProps={{
                                                        style: {
                                                            fontSize: '13px',
                                                            padding: '2px 4px',
                                                            height: '30px',
                                                        },
                                                        inputProps: {
                                                            min: 0,
                                                            max: 100,
                                                            step: 0.1
                                                        },
                                                        endAdornment: <InputAdornment position="end" >
                                                            <span style={{ fontSize: '13px' }}>%</span>
                                                        </InputAdornment>,
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
                                                    sx={{
                                                        ...inputAutoFill
                                                    }}
                                                />
                                            </FormControl>
                                        </Stack>
                                    </> :
                                    nature === 'PL' ?
                                        <>
                                            <Stack flexDirection={'row'} justifyContent={'space-between'} >
                                                <FormControl size="small" fullWidth style={{ marginBottom: '10px', width: '49%' }}>
                                                    <TextField
                                                        size="small"
                                                        label="Montants hors TVA"
                                                        name="montanth_tva"
                                                        value={formData.values.montanth_tva}
                                                        onChange={formData.handleChange}
                                                        fullWidth
                                                        variant='standard'
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
                                                                    height: '30px',
                                                                    textAlign: 'right',
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
                                                        sx={{
                                                            ...inputAutoFill
                                                        }}
                                                    />
                                                </FormControl>
                                                <FormControl size="small" fullWidth style={{ marginBottom: '10px', width: '49%' }}>
                                                    <TextField
                                                        size="small"
                                                        label="TVA"
                                                        name="tva"
                                                        value={formData.values.tva}
                                                        onChange={formData.handleChange}
                                                        fullWidth
                                                        variant='standard'
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
                                                                    height: '30px',
                                                                    textAlign: 'right',
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
                                                        sx={{
                                                            ...inputAutoFill
                                                        }}
                                                    />
                                                </FormControl>
                                            </Stack>
                                        </> : ''
                        }

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
                            outline: 'none',
                        }}
                        onClick={handleClose}
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

export default PopupDeclarationComm