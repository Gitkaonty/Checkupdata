import { Typography, Stack, Button, Dialog, DialogContent, DialogActions, IconButton, DialogTitle, Autocomplete, TextField } from '@mui/material';
import { styled } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import { init } from '../../../../init';
import { useState } from 'react';
import axios from '../../../../config/axios';
import toast from 'react-hot-toast';

const initial = init[0];

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
    '& .MuiDialogContent-root': {
        padding: theme.spacing(3),
    },
    '& .MuiDialogActions-root': {
        padding: theme.spacing(2),
    },
    '& .MuiPaper-root': {
        minHeight: '25vh',
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
    },
}));

const PopupAddSaisieFromConsultation = ({ confirmationState, listePlanComptable, valSelectedCompte, id_compte, id_dossier, id_exercice, solde, refresh, selectedRows }) => {
    const handleClose = () => { confirmationState(false) };
    const [valSelectedCompteContrepartie, setValSelectedCompteConterpartie] = useState('');

    const addEcriture = () => {
        if (!valSelectedCompteContrepartie) {
            return toast.error("Veuillez sélectionner le compte de contre partie s\'il vous plaît");
        }
        const selectedIds = selectedRows.map(val => Number(val.id));
        axios.post('/administration/traitementSaisie/addEcriture', {
            id_compte,
            id_dossier,
            id_exercice,
            id_plan_comptable: valSelectedCompte,
            id_contre_partie: valSelectedCompteContrepartie,
            solde,
            selectedIds
        })
            .then(response => {
                response.data.state
                    ? toast.success(response.data.message)
                    : toast.error(response.data.message);
                refresh();
                handleClose();
            })
            .catch(() => {
                toast.error("Erreur serveur lors de la création de l'écriture");
            });
    }

    return (
        <BootstrapDialog
            onClose={handleClose}
            aria-labelledby="confirmation-dialog-title"
            open={true}
            maxWidth="sm"
            fullWidth
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
                    Lettrage avec écart
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
                <Stack alignItems="left" spacing={2} textAlign="left" sx={{ marginTop: '0px' }}>
                    <Autocomplete
                        value={listePlanComptable.find(item => item.id === Number(valSelectedCompteContrepartie)) || null}
                        onChange={(event, newValue) => {
                            setValSelectedCompteConterpartie(newValue?.id || null);
                        }}
                        options={listePlanComptable.filter(val => val.id !== valSelectedCompte)}
                        getOptionLabel={(option) => `${option.compte || ''} - ${option.libelle || ''}`}
                        renderInput={(params) => <TextField {...params} label="Compte de contre partie" variant="standard" />}
                        isOptionEqualToValue={(option, value) => option?.id === value?.id}
                        disableClearable={false}
                        noOptionsText="Aucun compte disponible"
                    />
                </Stack>
            </DialogContent>

            <DialogActions>
                <Button
                    autoFocus
                    style={{ backgroundColor: initial.theme, color: 'white', width: "100px", textTransform: 'none', outline: 'none' }}
                    type='submit'
                    onClick={handleClose}
                >
                    Annuler
                </Button>
                <Button
                    autoFocus
                    onClick={addEcriture}
                    style={{
                        backgroundColor: initial.theme,
                        color: 'white',
                        width: '100px',
                        textTransform: 'none',
                        outline: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                    }}
                >
                    <span>Lettrer</span>
                </Button>

            </DialogActions>
        </BootstrapDialog>
    );
};

export default PopupAddSaisieFromConsultation;
