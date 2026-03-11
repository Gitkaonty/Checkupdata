import Dialog from '@mui/material/Dialog';
import { styled } from '@mui/material/styles';
import { Button, DialogActions, DialogContent, DialogTitle, FormControl, FormHelperText, FormLabel, IconButton, Input, Stack, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { init } from '../../../../../init';

const initial = init[0];

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
    '& .MuiDialog-paper': {
        height: '250px',
    },
    '& .MuiDialogContent-root': {
        padding: theme.spacing(2),
    },
    '& .MuiDialogActions-root': {
        padding: theme.spacing(1),
    },
}));

const PopupAddPeriode = ({ handleClose, periodeForm, handleSubmit, open }) => {
    return (
        <form onSubmit={periodeForm.handleSubmit}>
            <BootstrapDialog
                onClose={handleClose}
                aria-labelledby="customized-dialog-title"
                open={open}
            >
                <DialogTitle sx={{ m: 0 }} id="customized-dialog-title" style={{ fontWeight: 'bold', width: '600px', backgroundColor: 'transparent' }}>
                    Création d'une période
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
                    <Stack width={"95%"} height={"100%"} spacing={0} alignItems={'center'} alignContent={"center"}
                        direction={"column"} justifyContent={"center"} style={{ marginLeft: '10px' }}>
                        <Stack style={{ width: "100%" }} direction={'row'} alignContent={'baseline'} justifyContent={'space-between'} alignItems={'baseline'} spacing={2}>
                            <FormControl
                                sx={{ width: "200px" }}
                                error={periodeForm.errors.date_debut && periodeForm.touched.date_debut}
                            >
                                <FormLabel id="datedebut-label" htmlFor="date_debut">
                                    <Typography level="title-date_debut">
                                        Date début :
                                    </Typography>

                                </FormLabel>
                                <Input
                                    type='date'
                                    name="date_debut"
                                    disabled={true}
                                    value={periodeForm.values.date_debut}
                                    onChange={periodeForm.handleChange}
                                    onBlur={periodeForm.handleBlur}
                                    required
                                    slotProps={{
                                        button: {
                                            id: "niveau",
                                            "aria-labelledby": "niveau-label",
                                        },
                                    }}
                                />
                                <FormHelperText>
                                    {periodeForm.errors.date_debut &&
                                        periodeForm.touched.date_debut &&
                                        periodeForm.errors.date_debut}
                                </FormHelperText>
                            </FormControl>

                            {/* <Typography sx={{ mt: 5 }} variant="body1" >
                                    au
                                </Typography> */}

                            <FormControl
                                sx={{ width: "200px" }}
                                error={periodeForm.errors.date_fin && periodeForm.touched.date_fin}
                            >
                                <FormLabel id="datefint-label" htmlFor="date_fin">
                                    <Typography level="title-date_fin">
                                        Date fin :
                                    </Typography>

                                </FormLabel>
                                <Input
                                    type='date'
                                    name="date_fin"
                                    value={periodeForm.values.date_fin}
                                    onChange={periodeForm.handleChange}
                                    onBlur={periodeForm.handleBlur}
                                    required
                                    slotProps={{
                                        button: {
                                            id: "niveau",
                                            "aria-labelledby": "niveau-label",
                                        },
                                    }}
                                />
                                <FormHelperText>
                                    {periodeForm.errors.date_fin &&
                                        periodeForm.touched.date_fin &&
                                        periodeForm.errors.date_fin}
                                </FormHelperText>
                            </FormControl>
                        </Stack>
                    </Stack>
                </DialogContent>

                <DialogActions>
                    <Button autoFocus
                        style={{ backgroundColor: initial.theme, color: 'white', width: "100px", textTransform: 'none', outline: 'none' }}
                        type='submit'
                        onClick={handleClose}
                    >
                        Annuler
                    </Button>
                    <Button autoFocus
                        disabled={!periodeForm.isValid}
                        onClick={handleSubmit}
                        style={{ backgroundColor: initial.theme, color: 'white', width: "100px", textTransform: 'none', outline: 'none' }}
                    >
                        Créer
                    </Button>
                </DialogActions>
            </BootstrapDialog>
        </form>
    )
}

export default PopupAddPeriode