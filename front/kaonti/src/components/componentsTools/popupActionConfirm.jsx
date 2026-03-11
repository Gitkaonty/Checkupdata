import { Typography, Stack, Button, Dialog, DialogContent, DialogActions, IconButton, CircularProgress } from '@mui/material';
import { styled } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import { IoIosWarning } from 'react-icons/io';
import { init } from '../../../init';

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

const PopupActionConfirm = ({ msg, confirmationState, isLoading, isDelete }) => {
    const handleConfirm = () => confirmationState(true);
    const handleClose = () => { isLoading ? null : confirmationState(false) };

    return (
        <BootstrapDialog
            onClose={handleClose}
            aria-labelledby="confirmation-dialog-title"
            open={true}
            maxWidth="xs"
            fullWidth
        >
            <IconButton
                disabled={isLoading}
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
                <Stack alignItems="center" spacing={2} textAlign="center">
                    <IoIosWarning style={{ width: 70, height: 70, color: '#FF8A8A' }} />
                    <Typography
                        fontWeight={550}
                        color="text.primary"
                        sx={{ mt: 1, fontSize: '17px' }}
                    >
                        {msg}
                    </Typography>
                </Stack>
            </DialogContent>

            <DialogActions>
                <Button
                    disabled={isLoading}
                    autoFocus
                    style={{ backgroundColor: initial.theme, color: 'white', width: "100px", textTransform: 'none', outline: 'none' }}
                    type='submit'
                    onClick={handleClose}
                >
                    Annuler
                </Button>
                <Button
                    autoFocus
                    onClick={handleConfirm}
                    disabled={isLoading}
                    style={{
                        backgroundColor: initial.theme,
                        color: 'white',
                        width: isLoading ? '130px' : '100px',
                        textTransform: 'none',
                        outline: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                    }}
                >
                    <span>{isDelete ? 'Supprimer' : 'Poursuivre'}</span>
                    {isLoading && <CircularProgress size={18} color="inherit" />}
                </Button>

            </DialogActions>
        </BootstrapDialog>
    );
};

export default PopupActionConfirm;
