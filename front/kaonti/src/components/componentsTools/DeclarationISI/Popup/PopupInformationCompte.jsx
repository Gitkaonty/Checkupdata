import React, { useEffect, useRef } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Stack, Typography, Divider } from '@mui/material';
import { format } from 'date-fns';
import { init } from '../../../../../init';

let initial = init[0];

const PopupInformationCompte = ({ row, confirmOpen }) => {
    const scroll = 'paper';
    const open = true;

    const handleClose = () => {
        confirmOpen(false);
    };

    const descriptionElementRef = useRef(null);
    useEffect(() => {
        if (open) {
            const { current: descriptionElement } = descriptionElementRef;
            if (descriptionElement !== null) descriptionElement.focus();
        }
    }, [open]);

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            scroll={scroll}
            aria-labelledby="scroll-dialog-title"
            aria-describedby="scroll-dialog-description"
            PaperProps={{
                sx: {
                    width: 600,
                    maxWidth: '700px',
                }
            }}
            fullWidth
        >
            <DialogTitle id="scroll-dialog-title" sx={{ fontWeight: 'bold', fontSize: 18 }}>
                {row.compte} - {row.cin}
            </DialogTitle>

            <DialogContent dividers={scroll === 'paper'} sx={{ maxHeight: '70vh', px: 3 }}>
                <DialogContentText
                    id="scroll-dialog-description"
                    ref={descriptionElementRef}
                    tabIndex={-1}
                >
                    <Stack spacing={1.5}>
                        {/* Informations principales */}
                        {row.compte && <Typography variant='body1'><strong>Compte :</strong> {row.compte}</Typography>}
                        {row.libelle && <Typography variant='body1'><strong>Libellé :</strong> {row.libelle}</Typography>}
                        {row.nature && <Typography variant='body1'><strong>Nature :</strong> {row.nature}</Typography>}
                        {row.baseaux && <Typography variant='body1'><strong>Base auxiliaire :</strong> {row.baseaux}</Typography>}

                        {/* Type de tier */}
                        {row.typetier && (
                            <>
                                <Divider sx={{ my: 1, borderColor: 'grey.400' }} />
                                <Typography variant='body1'><strong>Type de tier :</strong> {row.typetier}</Typography>

                                {row.typetier === 'sans-nif' && (
                                    <Stack spacing={0.5} sx={{ ml: 3 }}>
                                        {row.cin && <Typography variant='body2'><strong>CIN :</strong> {row.cin}</Typography>}
                                        {row.datecin && <Typography variant='body2'><strong>Date CIN :</strong> {format(row.datecin, "dd/MM/yyyy")}</Typography>}
                                        {row.autrepieceid && <Typography variant='body2'><strong>Autres pièces :</strong> {row.autrepieceid}</Typography>}
                                        {row.refpieceid && <Typography variant='body2'><strong>Réf pièce :</strong> {row.refpieceid}</Typography>}
                                        {row.adressesansnif && <Typography variant='body2'><strong>Adresse :</strong> {row.adressesansnif}</Typography>}
                                        {row.motcle && <Typography variant='body2'><strong>Mot clé :</strong> {row.motcle}</Typography>}
                                    </Stack>
                                )}
                            </>
                        )}

                        {/* Localisation */}
                        {(row.province || row.region || row.district || row.commune) && (
                            <>
                                <Divider sx={{ my: 1, borderColor: 'grey.400' }} />
                                {row.province && <Typography variant='body1'><strong>Province :</strong> {row.province}</Typography>}
                                {row.region && <Typography variant='body1'><strong>Région :</strong> {row.region}</Typography>}
                                {row.district && <Typography variant='body1'><strong>District :</strong> {row.district}</Typography>}
                                {row.commune && <Typography variant='body1'><strong>Commune :</strong> {row.commune}</Typography>}
                            </>
                        )}
                    </Stack>
                </DialogContentText>
            </DialogContent>

            <DialogActions>
                <Button
                    onClick={handleClose}
                    variant='outlined'
                    style={{
                        backgroundColor: "transparent",
                        color: initial.theme,
                        width: "100px",
                        textTransform: 'none',
                        outline: 'none',
                    }}
                >
                    Fermer
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default PopupInformationCompte;