import { Typography, Stack, TextField, FormControl, Divider } from '@mui/material';
import Button from '@mui/material/Button';
import { styled } from '@mui/material/styles';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';

import { init } from '../../../../../init';
import toast from 'react-hot-toast';
import InputAdornment from '@mui/material/InputAdornment';
import { useFormik } from 'formik';
import FormatedInput from '../../FormatedInput';
import useAxiosPrivate from '../../../../../config/axiosPrivate';

let initial = init[0];

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
    '& .MuiDialogContent-root': {
        padding: theme.spacing(2),
    },
    '& .MuiDialogActions-root': {
        padding: theme.spacing(1),
    },
    '& .MuiPaper-root': {
        minHeight: '420px',
    },
}));

const PopupPlpEdit = ({ confirmationState, rowToModify, setIsRefreshed, deviseParDefaut }) => {
    const axiosPrivate = useAxiosPrivate();
    const handleClose = () => {
        confirmationState(false);
        setIsRefreshed();
    }

    const handleUpdatePlp = () => {
        const id = rowToModify?.id;
        axiosPrivate.put(`/declaration/comm/updateDroitCommPlp/${id}`, {
            formData: formData.values
        }).then((response => {
            if (response?.data?.state) {
                toast.success('Déclaration modifié avec succès');
                handleClose();
            } else {
                toast.error(response.data.message);
            }
        }))
    }

    const formData = useFormik({
        initialValues: {
            commercant_quantite: rowToModify.commercant_quantite || 0,
            commercant_valeur: rowToModify.commercant_valeur || 0,
            producteur_quantite: rowToModify.producteur_quantite || 0,
            producteur_valeur: rowToModify.producteur_valeur || 0,
        },
        onSubmit: (values) => {
            handleUpdatePlp();
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
                maxWidth='sm'
                fullWidth={true}
            >
                <DialogTitle
                    id="customized-dialog-title"
                    sx={{ ml: 1, p: 2, width: '550px', height: '50px', backgroundColor: 'transparent' }}
                >
                    <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', fontSize: 16 }}>
                        Modification d'une ligne pour le formulaire PLP
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
                    <Stack height={"200px"} spacing={2} alignItems={'left'}
                        direction={"column"} style={{ marginLeft: '10px' }}
                    >
                        <Stack flexDirection={'row'} justifyContent={'space-between'} alignItems={'center'}>
                            <FormControl size="small" fullWidth style={{ width: '29%' }}>
                                <TextField
                                    size="small"
                                    label="Code CN du produit"
                                    disabled
                                    value={rowToModify.code_cn}
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
                                />
                            </FormControl>
                            <FormControl size="small" fullWidth style={{ width: '69%' }}>
                                <TextField
                                    label="Nature du produit"
                                    value={rowToModify.nature_produit}
                                    fullWidth
                                    disabled
                                    variant="standard"
                                    size="small"
                                    InputLabelProps={{
                                        style: { color: '#1976d2', fontSize: '13px', marginTop: '-2px' }
                                    }}
                                    inputProps={{
                                        min: 0,
                                        step: 1,
                                    }}
                                />
                            </FormControl>
                        </Stack>
                        <Divider />

                        <Typography fontWeight="bold">Commerçants, collecteurs, et producteurs identifiés</Typography>
                        <Stack flexDirection={'row'} justifyContent={'space-between'} alignItems={'center'}>
                            <FormControl size="small" fullWidth style={{ width: '69%' }}>
                                <TextField
                                    size="small"
                                    label="Valeur"
                                    name="commercant_valeur"
                                    value={formData.values.commercant_valeur}
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
                                />
                            </FormControl>
                            <FormControl size="small" fullWidth style={{ width: '29%' }}>
                                <TextField
                                    name="commercant_quantite"
                                    label="Quantité"
                                    type="number"
                                    value={formData.values.commercant_quantite}
                                    onChange={formData.handleChange}
                                    fullWidth
                                    variant="standard"
                                    size="small"
                                    InputLabelProps={{
                                        style: { color: '#1976d2', fontSize: '13px', marginTop: '-2px' }
                                    }}
                                    inputProps={{
                                        min: 0,
                                        step: 1,
                                    }}
                                />
                            </FormControl>
                        </Stack>

                        <Divider />
                        <Typography fontWeight="bold">Producteurs non identifiés</Typography>
                        <Stack flexDirection={'row'} justifyContent={'space-between'} alignItems={'center'}>
                            <FormControl size="small" fullWidth style={{ width: '69%' }}>
                                <TextField
                                    size="small"
                                    label="Valeur"
                                    name="producteur_valeur"
                                    value={formData.values.producteur_valeur}
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
                                />
                            </FormControl>
                            <FormControl size="small" fullWidth style={{ width: '29%' }}>
                                <TextField
                                    name="producteur_quantite"
                                    label="Quantité"
                                    type="number"
                                    value={formData.values.producteur_quantite}
                                    onChange={formData.handleChange}
                                    fullWidth
                                    variant="standard"
                                    size="small"
                                    InputLabelProps={{
                                        style: { color: '#1976d2', fontSize: '13px', marginTop: '-2px' }
                                    }}
                                    inputProps={{
                                        min: 0,
                                        step: 1,
                                    }}
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

export default PopupPlpEdit