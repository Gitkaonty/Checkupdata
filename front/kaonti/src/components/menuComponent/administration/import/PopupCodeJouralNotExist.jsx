import { Typography, Stack, Button, Dialog, DialogContent, DialogActions, IconButton, DialogTitle } from '@mui/material';
import { styled } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import { init } from '../../../../../init';

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

const PopupCodeJouralNotExist = ({ handleClose }) => {
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
                    L'importation a été interrompue
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
                    Le code journal : "À nouveau" n'existe pas encore dans le paramétrage des codes journaux. Veuillez en créer un pour continuer.
                </Stack>
            </DialogContent>

            <DialogActions>
                <Button
                    autoFocus
                    style={{ backgroundColor: initial.theme, color: 'white', width: "100px", textTransform: 'none', outline: 'none' }}
                    type='submit'
                    onClick={handleClose}
                >
                    Quitter
                </Button>

            </DialogActions>
        </BootstrapDialog>
    )
}

export default PopupCodeJouralNotExist