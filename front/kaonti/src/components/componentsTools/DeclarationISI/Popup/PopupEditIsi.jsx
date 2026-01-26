import { Typography, Stack, TextField, Divider } from '@mui/material';
import { FormControl } from "@mui/material";
import Button from '@mui/material/Button';
import { styled } from '@mui/material/styles';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

import CloseIcon from '@mui/icons-material/Close';
import FormatedInput from '../../FormatedInput';

import { init } from '../../../../../init';
import toast from 'react-hot-toast';
import axios from '../../../../../config/axios';
import { useFormik } from 'formik';
import * as Yup from "yup";

let initial = init[0];

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
    '& .MuiDialogContent-root': {
        padding: theme.spacing(2),
    },
    '& .MuiDialogActions-root': {
        padding: theme.spacing(1),
    },
    '& .MuiPaper-root': {
        minHeight: '50%',
    },
}));

const PopupEditIsi = ({ confirmationState, objectAnnexeDIsi, setRowToModify }) => {

    const handleClose = () => {
        confirmationState(false);
    }

    const formatDate = (date) => {
        if (!date) return '';
        return new Date(date).toISOString().split('T')[0];
    };

    const validationSchema = Yup.object({
        nom: Yup.string()
            .required("Le nom est obligatoire")
            .min(2, "Le nom doit contenir au moins 2 caractères")
            .max(50, "Le nom est trop long"),

        cin: Yup.string()
            .required("Le CIN est obligatoire"),

        nature_transaction: Yup.string()
            .required("La nature de la transaction est obligatoire"),

        detail_transaction: Yup.string()
            .required("Le détail de la transaction est obligatoire")
            .max(255, "Trop long"),

        date_transaction: Yup.date()
            .required("La date de transaction est obligatoire")
            .typeError("Date invalide"),

        province: Yup.string().required("La province est obligatoire"),
        region: Yup.string().required("La région est obligatoire"),
        district: Yup.string().required("Le district est obligatoire"),
        commune: Yup.string().required("La commune est obligatoire"),
        fokontany: Yup.string().required("Le fokontany est obligatoire"),
    });

    const formData = useFormik({
        initialValues: {
            nom: objectAnnexeDIsi?.nom || '',
            cin: objectAnnexeDIsi?.cin || '',
            nature_transaction: objectAnnexeDIsi?.nature_transaction || '',
            detail_transaction: objectAnnexeDIsi?.detail_transaction || '',
            date_transaction: formatDate(objectAnnexeDIsi?.date_transaction),
            montant_transaction: objectAnnexeDIsi?.montant_transaction || 0,
            montant_isi: objectAnnexeDIsi?.montant_isi || 0,
            province: objectAnnexeDIsi?.province || '',
            region: objectAnnexeDIsi?.region || '',
            district: objectAnnexeDIsi?.district || '',
            commune: objectAnnexeDIsi?.commune || '',
            fokontany: objectAnnexeDIsi?.fokontany || '',
            validite: objectAnnexeDIsi?.validite || ''
        },
        validationSchema,
        onSubmit: (values) => {
            const id = objectAnnexeDIsi?.id;
            const payload = {
                ...values,
                anomalie: values.montant_transaction > 0 ? false : true
            };
            axios.put(`/declaration/isi/updateIsi/${id}`, payload)
                .then((response) => {
                    const resData = response.data;
                    if (resData.state) {
                        toast.success(response?.data?.message);
                        handleClose();
                    } else {
                        toast.error(resData.message)
                    }
                })
                .catch((error) => {
                    toast.error(error.response?.data?.message || error.message);
                })
            setRowToModify();
        }
    })

    return (
        <form
            onSubmit={formData.handleSubmit}
        >
            <BootstrapDialog
                onClose={handleClose}
                aria-labelledby="customized-dialog-title"
                open={true}
                PaperProps={{
                    sx: {
                        width: 1000,
                        maxWidth: '1000px',
                    }
                }}
                fullWidth={true}
            >

                <DialogTitle
                    id="customized-dialog-title"
                    sx={{
                        ml: 1,
                        p: 2,
                        height: '50px',
                        backgroundColor: 'transparent',
                        boxSizing: 'border-box'
                    }}
                >
                    <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', fontSize: 16 }}>
                        Modification d'une annexe déclaration ISI
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
                    <Stack
                        spacing={2}
                        alignItems={'left'}
                        direction={"column"}
                        style={{ marginLeft: '10px', marginRight: '10px' }}
                    >

                        <Typography fontWeight="bold">Information personnelle</Typography>

                        <Stack
                            direction={'row'}
                            spacing={1}
                        >
                            <FormControl size="small" fullWidth style={{ width: '50%' }}>
                                <TextField
                                    size="small"
                                    name="nom"
                                    label="Nom et prenom"
                                    fullWidth
                                    variant='standard'
                                    required
                                    value={formData.values.nom}
                                    onChange={formData.handleChange}
                                    onBlur={formData.handleBlur}
                                    error={Boolean(formData.touched.nom && formData.errors.nom)}
                                    helperText={formData.touched.nom && formData.errors.nom}
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
                                            fontSize: '13px',
                                            marginTop: '-2px',
                                        },
                                    }}
                                />
                            </FormControl>

                            <FormControl size="small" fullWidth style={{ width: '50%' }}>
                                <TextField
                                    size="small"
                                    label="CIN"
                                    name="cin"
                                    fullWidth
                                    variant='standard'
                                    required
                                    value={formData.values.cin}
                                    onChange={(e) => {
                                        let value = e.target.value.replace(/\s+/g, "");

                                        value = value.replace(/[^a-zA-Z0-9]/g, "");

                                        const formatted = value.replace(/(.{3})/g, "$1 ").trim();

                                        e.target.value = formatted;
                                        formData.handleChange(e);
                                    }}
                                    onBlur={formData.handleBlur}
                                    error={Boolean(formData.touched.cin && formData.errors.cin)}
                                    helperText={formData.touched.cin && formData.errors.cin}
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
                                            fontSize: '13px',
                                            marginTop: '-2px',
                                        },
                                    }}
                                />
                            </FormControl>
                        </Stack>

                        <Divider />
                        <Typography fontWeight="bold">Transaction</Typography>

                        <Stack
                            direction={'row'}
                            spacing={1}
                        >
                            <FormControl size="small" fullWidth style={{ width: '33.33%' }}>
                                <TextField
                                    size="small"
                                    label="Nature du transaction"
                                    name="nature_transaction"
                                    fullWidth
                                    variant='standard'
                                    required
                                    value={formData.values.nature_transaction}
                                    onChange={formData.handleChange}
                                    onBlur={formData.handleBlur}
                                    error={Boolean(formData.touched.nature_transaction && formData.errors.nature_transaction)}
                                    helperText={formData.touched.nature_transaction && formData.errors.nature_transaction}
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
                                            fontSize: '13px',
                                            marginTop: '-2px',
                                        },
                                    }}
                                />
                            </FormControl>

                            <FormControl size="small" fullWidth style={{ width: '46.66%' }}>
                                <TextField
                                    size="small"
                                    label="Detail du transaction"
                                    name="detail_transaction"
                                    fullWidth
                                    variant='standard'
                                    required
                                    value={formData.values.detail_transaction}
                                    onChange={formData.handleChange}
                                    onBlur={formData.handleBlur}
                                    error={Boolean(formData.touched.detail_transaction && formData.errors.detail_transaction)}
                                    helperText={formData.touched.detail_transaction && formData.errors.detail_transaction}
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
                                            fontSize: '13px',
                                            marginTop: '-2px',
                                        },
                                    }}
                                />
                            </FormControl>

                            <FormControl size="small" fullWidth style={{ marginBottom: '10px', width: '20%' }}>
                                <TextField
                                    size="small"
                                    label="Date de la transaction"
                                    name="date_transaction"
                                    type="date"
                                    value={formData.values.date_transaction}
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
                                    error={Boolean(formData.touched.date_transaction && formData.errors.date_transaction)}
                                    helperText={formData.touched.date_transaction && formData.errors.date_transaction}
                                />
                            </FormControl>
                        </Stack>

                        <Stack
                            direction={'row'}
                            spacing={1}
                        >
                            <FormControl size="small" fullWidth style={{ marginBottom: '10px', width: '50%' }}>
                                <TextField
                                    size="small"
                                    label="Montant de la transaction"
                                    name="montant_transaction"
                                    value={formData.values.montant_transaction}
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
                                    disabled
                                />
                            </FormControl>

                            <FormControl size="small" fullWidth style={{ marginBottom: '10px', width: '50%' }}>
                                <TextField
                                    size="small"
                                    label="Montant ISI"
                                    name="montant_isi"
                                    value={formData.values.montant_isi}
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
                                    disabled
                                />
                            </FormControl>
                        </Stack>

                        <Divider />
                        <Typography fontWeight="bold">Localisation</Typography>

                        <Stack
                            direction={'row'}
                            spacing={1}
                        >

                            <FormControl size="small" fullWidth style={{ width: '33.33%' }}>
                                <TextField
                                    size="small"
                                    label="Province"
                                    name="province"
                                    fullWidth
                                    variant='standard'
                                    required
                                    value={formData.values.province}
                                    onChange={formData.handleChange}
                                    onBlur={formData.handleBlur}
                                    error={Boolean(formData.touched.province && formData.errors.province)}
                                    helperText={formData.touched.province && formData.errors.province}
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
                                            fontSize: '13px',
                                            marginTop: '-2px',
                                        },
                                    }}
                                />
                            </FormControl>

                            <FormControl size="small" fullWidth style={{ width: '33.33%' }}>
                                <TextField
                                    size="small"
                                    label="Region"
                                    name="region"
                                    fullWidth
                                    variant='standard'
                                    required
                                    value={formData.values.region}
                                    onChange={formData.handleChange}
                                    onBlur={formData.handleBlur}
                                    error={Boolean(formData.touched.region && formData.errors.region)}
                                    helperText={formData.touched.region && formData.errors.region}
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
                                            fontSize: '13px',
                                            marginTop: '-2px',
                                        },
                                    }}
                                />
                            </FormControl>

                            <FormControl size="small" fullWidth style={{ width: '33.33%' }}>
                                <TextField
                                    size="small"
                                    label="District"
                                    name="district"
                                    fullWidth
                                    variant='standard'
                                    required
                                    value={formData.values.district}
                                    onChange={formData.handleChange}
                                    onBlur={formData.handleBlur}
                                    error={Boolean(formData.touched.district && formData.errors.district)}
                                    helperText={formData.touched.district && formData.errors.district}
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
                                            fontSize: '13px',
                                            marginTop: '-2px',
                                        },
                                    }}
                                />
                            </FormControl>
                        </Stack>

                        <Stack
                            direction={'row'}
                            spacing={1}
                        >
                            <FormControl size="small" fullWidth style={{ width: '50%' }}>
                                <TextField
                                    size="small"
                                    label="Commune"
                                    name="commune"
                                    fullWidth
                                    variant='standard'
                                    required
                                    value={formData.values.commune}
                                    onChange={formData.handleChange}
                                    onBlur={formData.handleBlur}
                                    error={Boolean(formData.touched.commune && formData.errors.commune)}
                                    helperText={formData.touched.commune && formData.errors.commune}
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
                                            fontSize: '13px',
                                            marginTop: '-2px',
                                        },
                                    }}
                                />
                            </FormControl>

                            <FormControl size="small" fullWidth style={{ width: '50%' }}>
                                <TextField
                                    size="small"
                                    label="Fokontany"
                                    name="fokontany"
                                    fullWidth
                                    variant='standard'
                                    required
                                    value={formData.values.fokontany}
                                    onChange={formData.handleChange}
                                    onBlur={formData.handleBlur}
                                    error={Boolean(formData.touched.fokontany && formData.errors.fokontany)}
                                    helperText={formData.touched.fokontany && formData.errors.fokontany}
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
                                            fontSize: '13px',
                                            marginTop: '-2px',
                                        },
                                    }}
                                />
                            </FormControl>
                        </Stack>


                        <Divider />
                        <Typography fontWeight="bold">Validité</Typography>

                        <Stack
                            direction={'row'}
                            spacing={1}
                        >
                            <FormControl size="small" fullWidth style={{ width: '33.33%' }}>
                                <TextField
                                    size="small"
                                    label="Validité"
                                    name="validite"
                                    fullWidth
                                    variant='standard'
                                    value={formData.values.validite}
                                    onChange={formData.handleChange}
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
                                            fontSize: '13px',
                                            marginTop: '-2px',
                                        },
                                    }}
                                />
                            </FormControl>
                        </Stack>
                    </Stack>
                </DialogContent>

                <DialogActions>
                    <Button
                        autoFocus
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
                        Modifier
                    </Button>
                </DialogActions>
            </BootstrapDialog>
        </form>
    )
}

export default PopupEditIsi