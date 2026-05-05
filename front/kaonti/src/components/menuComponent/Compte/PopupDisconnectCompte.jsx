import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import CloseIcon from '@mui/icons-material/Close';

const PopupDisconnectCompte = ({ open, handleClose, handleDisconnect }) => {
    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="xs"
            fullWidth
            PaperProps={{
                sx: { width: 370 },
            }}
        >
            <DialogTitle
                id="modal-disconnect-title"
                sx={{
                    fontWeight: "bold",
                    bgcolor: '#0F172A',
                    color: 'white',
                    height: 50,
                    px: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'left',
                    position: 'relative',
                }}
            >
                Déconnexion
                <IconButton
                    style={{ color: 'red', textTransform: 'none', outline: 'none' }}
                    aria-label="close"
                    onClick={handleClose}
                    sx={{
                        position: 'absolute',
                        right: 8,
                        color: (theme) => theme.palette.grey[200],
                    }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ mt: 5 }}>
                <Stack
                    alignItems="center"
                    justifyContent="center"
                >
                    <Typography variant="body1" align="center">
                        Voulez-vous vraiment vous déconnecter ?
                    </Typography>
                </Stack>
            </DialogContent>

            <DialogActions
                sx={{
                    justifyContent: "end",
                    borderTop: 'none',
                    p: 2,
                }}
            >
                <Button
                    variant="outlined"
                    onClick={handleClose}
                    style={{
                        textTransform: "none",
                        outline: "none",
                    }}
                >
                    Non
                </Button>
                <Button
                    variant="contained"
                    color="error"
                    onClick={handleDisconnect}
                    sx={{ ml: 2 }}
                    style={{
                        textTransform: "none",
                        outline: "none",
                    }}
                >
                    Oui
                </Button>
            </DialogActions>
        </Dialog>
    );
};


export default PopupDisconnectCompte;
