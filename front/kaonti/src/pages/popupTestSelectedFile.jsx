import React from 'react';
import { Typography, Stack } from '@mui/material';
import Button from '@mui/material/Button';
import { styled } from '@mui/material/styles';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';

import { CiWarning } from "react-icons/ci";
import { IoIosWarning } from "react-icons/io";



const BootstrapDialog = styled(Dialog)(({ theme }) => ({
    '& .MuiDialogContent-root': {
        padding: theme.spacing(2),
    },
    '& .MuiDialogActions-root': {
        padding: theme.spacing(1),
    },
}));

const PopupTestSelectedFile = ({ confirmationState }) => {

    const confirmation = () => {
        confirmationState(true);
    }

    const handleCloseDeleteModel = () => {
        confirmationState(true);
    }

    return (
        <BootstrapDialog
            onClose={handleCloseDeleteModel}
            aria-labelledby="customized-dialog-title"
            open={true}
        >
            <DialogTitle sx={{ m: 0, p: 2 }} id="customized-dialog-title" style={{ fontWeight: 'bold', width: '600px', height: '50px', backgroundColor: 'transparent' }}>

            </DialogTitle>

            <IconButton
                style={{ color: 'red', textTransform: 'none', outline: 'none' }}
                aria-label="close"
                onClick={handleCloseDeleteModel}
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
                <Stack width={"90%"} height={"40px"} spacing={0} alignItems={'center'} alignContent={"center"}
                    direction={"column"} justifyContent={"center"} style={{ marginLeft: '10px' }}>
                    <Typography sx={{ ml: 0, flex: 0 }} variant="h7" component="div" >
                        Veuillez sélectionner un dossier.
                    </Typography>
                </Stack>

            </DialogContent>
            <DialogActions>
                <Button autoFocus onClick={confirmation}
                    style={{ backgroundColor: '#0000', color: 'white', width: "100px", textTransform: 'none', outline: 'none' }}
                >
                    OK
                </Button>
            </DialogActions>
        </BootstrapDialog>
    )
}

export default PopupTestSelectedFile;
