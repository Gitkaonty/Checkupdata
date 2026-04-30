import { Typography, Stack, Button, Dialog, DialogContent, DialogTitle, DialogActions, IconButton, CircularProgress, Box } from '@mui/material';
import { styled } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import { IoWarningOutline } from "react-icons/io5";
import { ErrorOutline } from '@mui/icons-material';
import { WarningRounded, Close } from '@mui/icons-material';

const CHECKUP_DARK = '#1A1D21';
const CHECKUP_GREEN = '#10B981';
const CHECKUP_RED = '#EF4444';
const BORDER_COLOR = '#E2E8F0';

const PopupActionConfirm = ({ msg, confirmationState, isLoading }) => {
    const handleConfirm = () => confirmationState(true);
    const handleClose = () => { isLoading ? null : confirmationState(false) };

    return (
        <Dialog
            open={true}
            onClose={handleClose}
            PaperProps={{
                sx: {
                    borderRadius: '4px', // Style rigoureux
                    width: '400px',
                    border: `1px solid ${BORDER_COLOR}`,
                    boxShadow: 'none' // Full Flat Design
                }
            }}
        >
            <DialogTitle sx={{
                p: 1.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: `1px solid ${BORDER_COLOR}`,
                bgcolor: '#F8FAFC'
            }}>
                <Typography sx={{ fontWeight: 700, fontSize: '11px', color: CHECKUP_DARK, textTransform: 'uppercase' }}>
                    Confirmation Système
                </Typography>
                <IconButton onClick={handleClose} size="small">
                    <Close sx={{ fontSize: 16 }} />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ p: 3, textAlign: 'center' }}>
                <Stack spacing={2} alignItems="center">
                    <IoWarningOutline
                        style={{
                            color: CHECKUP_GREEN,
                            fontSize: 48
                        }}
                    />

                    <Box>
                        <Typography sx={{ fontWeight: 600, fontSize: '14px', color: CHECKUP_DARK, mb: 1 }}>
                            {msg}
                        </Typography>
                        {/* <Typography sx={{ fontSize: '12px', color: '#64748B' }}>
                                    Cette action impactera les rapports de votre base de données.
                                </Typography> */}
                    </Box>

                    <Stack direction="row" spacing={1.5} sx={{ width: '100%', mt: 1 }}>
                        <Button
                            fullWidth
                            variant="outlined"
                            disabled={isLoading}
                            onClick={handleClose}
                            sx={{
                                textTransform: 'none',
                                fontWeight: 600,
                                color: CHECKUP_DARK,
                                borderColor: BORDER_COLOR,
                                borderRadius: '4px',
                                '&:hover': { bgcolor: '#F1F5F9', borderColor: CHECKUP_DARK }
                            }}
                        >
                            Annuler
                        </Button>
                        <Button
                            fullWidth
                            variant="contained"
                            disableElevation
                            onClick={handleConfirm}
                            disabled={isLoading}
                            sx={{
                                textTransform: 'none',
                                fontWeight: 600,
                                bgcolor: CHECKUP_RED,
                                color: '#FFF',
                                borderRadius: '4px',
                                '&:hover': { bgcolor: '#DC2626' }
                            }}
                        >
                            Confirmer
                            {isLoading && <CircularProgress size={18} color="inherit" />}
                        </Button>
                    </Stack>
                </Stack>
            </DialogContent>
        </Dialog>
    );
};

export default PopupActionConfirm;
