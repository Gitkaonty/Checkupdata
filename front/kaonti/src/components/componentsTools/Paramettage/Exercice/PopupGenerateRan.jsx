import { Typography, Stack, Button, Dialog, DialogContent, DialogActions, IconButton, DialogTitle, FormControlLabel } from '@mui/material';
import { styled } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import { init } from '../../../../../init';
import Checkbox from '@mui/material/Checkbox';
import { useState } from 'react';
import axios from '../../../../../config/axios';

const initial = init[0];

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
    '& .MuiDialogContent-root': {
        padding: theme.spacing(3),
    },
    '& .MuiDialogActions-root': {
        padding: theme.spacing(2),
    },
    '& .MuiPaper-root': {
        minHeight: '15vh',
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
    },
}));

const PopupGenerateRan = ({ handleClose, id_compte, id_dossier, selectedExerciceRow }) => {
    const id_exercice = selectedExerciceRow[0];
    const [isDetailled, setIsDetailled] = useState(false);

    const handleSubmit = async () => {
        await axios.post('/administration/traitementSaisie/genererRan', {
            id_compte,
            id_dossier,
            id_exercice,
            isDetailled
        }).then((response) => {
            console.log('response?.data : ', response?.data);
        })
        handleClose();
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
                <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', fontSize: 17 }}>
                    Génération des écritures A-nouveaux
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
                <Stack alignItems="left" spacing={4} textAlign="center" sx={{ marginTop: '0px', paddingX: 1, fontSize: '17px' }}>
                    Voulez-vous vraiment générer les écritures a-nouveaux ? <br />Attention toutes les lettrages associées aux lignes supprimées seront supprimées également.
                </Stack>
            </DialogContent>

            <DialogActions>
                <Stack
                    direction={'row'}
                    justifyContent={'space-between'}
                    alignContent={'center'}
                    width={'100%'}
                >
                    <FormControlLabel
                        style={{
                            marginTop: '0px',
                            marginBottom: '0px'
                        }}
                        control={
                            <Checkbox
                                checked={isDetailled}
                                onChange={(e) => setIsDetailled(e.target.checked)}
                                color="primary"
                            />
                        }
                        label="A-nouveaux détaillées"
                    />
                    <Stack
                        direction={'row'}
                        spacing={0.5}
                    >
                        <Button
                            autoFocus
                            style={{ backgroundColor: initial.theme, color: 'white', width: "100px", textTransform: 'none', outline: 'none' }}
                            onClick={handleClose}
                        >
                            Annuler
                        </Button>
                        <Button
                            autoFocus
                            style={{ backgroundColor: initial.theme, color: 'white', width: "100px", textTransform: 'none', outline: 'none' }}
                            type='submit'
                            onClick={handleSubmit}
                        >
                            Générer
                        </Button>
                    </Stack>
                </Stack>

            </DialogActions>
        </BootstrapDialog>
    )
}

export default PopupGenerateRan