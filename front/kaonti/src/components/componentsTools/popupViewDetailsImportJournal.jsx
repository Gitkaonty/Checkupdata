import { Typography, Stack } from '@mui/material';
import Button from '@mui/material/Button';
import { styled } from '@mui/material/styles';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import { init } from '../../../init';

let initial = init[0];

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
    '& .MuiDialogContent-root': {
        padding: theme.spacing(2),
    },
    '& .MuiDialogActions-root': {
        padding: theme.spacing(1),
    },
}));

const PopupViewDetailsImportJournal = ({ msg, confirmationState }) => {

    const handleClose = () => {
        confirmationState(false);
    }

    return (
        <BootstrapDialog
            onClose={handleClose}
            aria-labelledby="customized-dialog-title"
            open={true}
            maxWidth="md"
            fullWidth={true}
        >
            <DialogTitle sx={{ m: 0, p: 2 }} id="customized-dialog-title" style={{ fontWeight: 'bold', width: '600px', height: '50px', backgroundColor: 'transparent' }}>

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
            <DialogContent >

                <Stack width={"95%"} height={"500px"} spacing={0} alignItems={'flex-start'}
                    direction={"column"} style={{ marginLeft: '20px' }}>
                    <Typography sx={{ ml: 2, mb: 1, mt: 2, color: 'red' }} variant="h7" component="div" >
                        Listes des anomalies:
                    </Typography>

                    <ul>
                        {msg.map((anom, index) => (
                            <li key={index}>
                                <Typography key={index} sx={{ ml: 2, mb: 2 }} variant="h7" component="div" >
                                    {anom}
                                </Typography>
                            </li>

                        ))}
                    </ul>

                    <Typography sx={{ ml: 2, mb: 1, mt: 5, color: 'red' }} variant="h7" component="div" >
                        Attention:
                    </Typography>

                    <ul>
                        <li>
                            <Typography sx={{ ml: 2, mb: 2 }} variant="h7" component="div" >
                                Si vous continuer d'importer le journal comptable avec ces anomalies, alors :
                            </Typography>
                        </li>

                        <li>
                            <Typography sx={{ ml: 2, mb: 2 }} variant="h7" component="div" >
                                Les codes journaux manquants seront créés automatiquement et considérés comme des OD.
                            </Typography>
                        </li>

                        <li>
                            <Typography sx={{ ml: 2, mb: 2 }} variant="h7" component="div" >
                                Les numéros de compte manquants seront créés automatiquement.
                            </Typography>
                        </li>

                        <li>
                            <Typography sx={{ ml: 2, mb: 2 }} variant="h7" component="div" >
                                Les devises vides seront complétés automatiquement par MGA.
                            </Typography>
                        </li>
                    </ul>
                </Stack>

            </DialogContent>
            <DialogActions>
                <Button autoFocus
                    style={{ backgroundColor: initial.theme, color: 'white', width: "100px", textTransform: 'none', outline: 'none' }}
                    type='submit'
                    onClick={handleClose}
                >
                    Fermer
                </Button>
            </DialogActions>
        </BootstrapDialog>
    )
}

export default PopupViewDetailsImportJournal;
