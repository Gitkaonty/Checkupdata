import { useState, useEffect } from 'react';
import { Typography, Stack, TextField, FormControl, InputLabel, Select, MenuItem, Divider, FormHelperText } from '@mui/material';
import Button from '@mui/material/Button';
import { styled } from '@mui/material/styles';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import { init } from '../../../../init';
import toast from 'react-hot-toast';
import axios from '../../../../config/axios';
import { useFormik } from 'formik';
import * as Yup from "yup";

let initial = init[0];

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
    '& .MuiDialogContent-root': {
        padding: theme.spacing(2),
    },
    '& .MuiDialogActions-root': {
        padding: theme.spacing(1),
    },
    '& .MuiPaper-root': {
        minHeight: '10%',
        maxHeight: '95%',
    },
}));

const PopupModifNE = ({ compteId, fileId, exerciceId, choix, confirmationState, data }) => {
    const [listeNote, setListeNote] = useState([]);
    const [formDataFinal, setFormDataFinal] = useState({
        state: false,
        id: -1,
        tableau: '',
        ref_note: '',
        commentaires: '',
    });

    const validationSchema = Yup.object({
        tableau: Yup.string().required("Veuillez choisir un tableau avant de continuer"),
        ref_note: Yup.string().required("Veuillez choisir la référence du note"),
    })

    const formData = useFormik({
        initialValues: {
            state: true,
            id: -1,
            tableau: '',
            ref_note: '',
            commentaires: '',
        },
        validationSchema,
        //validateOnChange: false,
        //validateOnBlur: true,
        onSubmit: (values) => {
            setFormDataFinal(prevFormDataFinal => {
                const newFormDataFinal = {
                    ...prevFormDataFinal,
                    state: true,
                    id: values.id,
                    tableau: values.tableau,
                    ref_note: values.ref_note,
                    commentaires: values.commentaires,
                };
                confirmationState(newFormDataFinal);
                return newFormDataFinal;
            });
        }
    });

    const handleCloseDeleteModel = () => {
        setFormDataFinal(prevFormDataFinal => {
            const newFormDataFinal = { ...prevFormDataFinal, state: false };
            confirmationState(newFormDataFinal);
            return newFormDataFinal;
        });
    }

    // Fonction pour gérer le clic sur le bouton "Modifier"
    useEffect(() => {
        if (data) {
            formData.setValues({
                state: false,
                id: data.id,
                tableau: data.tableau,
                ref_note: data.ref_note,
                commentaires: data.commentaires,
            });
        }
    }, [data]);

    useEffect(() => {
        if (formData.values.tableau === 'BILAN') {
            recupRubriqueBilan(compteId, fileId, exerciceId, formData.values.tableau);
        } else {
            recupRubrique(compteId, fileId, exerciceId, formData.values.tableau, 0);
        }

    }, [formData.values.tableau]);

    //récupération des listes des notes pour le input
    const recupRubrique = (compteId, fileId, exerciceId, tableau, onglet) => {
        axios.post(`/paramMappingCompte/listeRubrique`, { compteId, fileId, exerciceId, tableau, onglet }).then((response) => {
            const resData = response.data;
            if (resData.state) {
                setListeNote(resData.liste);
            } else {
                toast.error(resData.msg);
            }
        });
    }

    const recupRubriqueBilan = (compteId, fileId, exerciceId, tableau) => {
        let onglet = 1;
        axios.post(`/paramMappingCompte/listeRubrique`, { compteId, fileId, exerciceId, tableau, onglet }).then((response) => {
            const resData = response.data;
            if (resData.state) {
                setListeNote(resData.liste);
            } else {
                toast.error(resData.msg);
            }
        });

        onglet = 2;
        axios.post(`/paramMappingCompte/listeRubrique`, { compteId, fileId, exerciceId, tableau, onglet }).then((response) => {
            const resData = response.data;
            if (resData.state) {
                setListeNote(prevListeNote => [...prevListeNote, ...resData.liste]);
            } else {
                toast.error(resData.msg);
            }
        });
    }

    return (
        <form onSubmit={formData.handleSubmit}>
            <BootstrapDialog
                onClose={handleCloseDeleteModel}
                aria-labelledby="customized-dialog-title"
                open={true}
                fullWidth={true}
                maxWidth="md"
            >
                <DialogTitle sx={{ ml: 1, p: 2 }} id="customized-dialog-title" style={{ fontWeight: 'bold', width: '550px', height: '50px', backgroundColor: 'transparent' }}>
                    <Typography variant={'h6'} style={{ fontZise: 12 }}>
                        {choix} d'une ligne pour le formulaire NE
                    </Typography>
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
                <DialogContent>

                    <Stack
                        spacing={2}
                        alignItems={'left'}
                        direction={"column"}
                        style={{ marginLeft: '10px' }}
                    >
                        <Stack flexDirection={'row'} justifyContent={'space-between'}>
                            <FormControl
                                size="small"
                                fullWidth
                                style={{ marginBottom: '10px', width: '49%' }}
                                error={Boolean(formData.touched.tableau && formData.errors.tableau)}
                                variant='standard'
                            >
                                <InputLabel style={{ color: '#1976d2' }}>Tableau</InputLabel>
                                <Select
                                    label="Tableau"
                                    name="tableau"
                                    value={formData.values.tableau}
                                    onChange={formData.handleChange}
                                    onBlur={formData.handleBlur}
                                    fullWidth
                                    sx={{
                                        fontSize: '13px',
                                        height: '30px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        '& .MuiSelect-select': {
                                            padding: '1px',
                                        }
                                    }}
                                >
                                    <MenuItem key="BILAN" value="BILAN">Bilan</MenuItem>
                                    <MenuItem key="CRN" value="CRN">Compte de résult par nature</MenuItem>
                                    <MenuItem key="CRF" value="CRF">Compte de résult par fonction</MenuItem>
                                    <MenuItem key="TFTD" value="TFTD">Tableau flux de trésorerie Direct</MenuItem>
                                    <MenuItem key="TFTI" value="TFTI">Tableau flux de trésorerie indirect</MenuItem>
                                    <MenuItem key="EVCP" value="EVCP">Etat de variation des capitaux propres</MenuItem>
                                    <MenuItem key="DRF" value="DRF">Détermination du résultat fiscal</MenuItem>
                                    <MenuItem key="BHIAPC" value="BHIAPC">Etat des bénéf. honoraires, d'intérêts ou d'arrérage</MenuItem>
                                    <MenuItem key="MP" value="MP">Marché public</MenuItem>
                                    <MenuItem key="DA" value="DA">Détails amortissements</MenuItem>
                                    <MenuItem key="DP" value="DP">Détails provisions</MenuItem>
                                    <MenuItem key="EIAFNC" value="EIAFNC">Evolution des immobilisations</MenuItem>
                                    <MenuItem key="SAD" value="SAD">Suivi des amortissements différés</MenuItem>
                                    <MenuItem key="SDR" value="SDR">Suivi des déficits reportables</MenuItem>
                                    <MenuItem key="SE" value="SE">Suivi des emprunts</MenuItem>
                                </Select>

                                <FormHelperText
                                    style={{
                                        color: 'red',
                                        marginLeft: 0,
                                        fontSize: "12px",
                                    }}
                                >
                                    {formData.errors.tableau && formData.touched.tableau && formData.errors.tableau}
                                </FormHelperText>
                            </FormControl>

                            <FormControl
                                size="small"
                                fullWidth
                                style={{
                                    marginBottom: '10px',
                                    width: '49%'
                                }}

                                error={Boolean(formData.touched.ref_note && formData.errors.ref_note)}
                                variant='standard'
                            >
                                <InputLabel style={{ color: '#1976d2' }}>Note</InputLabel>
                                <Select
                                    label="Note"
                                    name="ref_note"
                                    value={formData.values.ref_note}
                                    onChange={formData.handleChange}
                                    onBlur={formData.handleBlur}
                                    fullWidth
                                    sx={{
                                        fontSize: '13px',
                                        height: '30px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        '& .MuiSelect-select': {
                                            padding: '1px',
                                        }
                                    }}
                                >
                                    {
                                        listeNote?.map((item) => (
                                            <MenuItem key={item.id} value={item["note"]}>{item["note"]}</MenuItem>
                                        ))
                                    }
                                </Select>
                                <FormHelperText
                                    style={{
                                        color: 'red',
                                        marginLeft: 0,
                                        fontSize: "12px",
                                    }}
                                >
                                    {formData.errors.ref_note && formData.touched.ref_note && formData.errors.ref_note}
                                </FormHelperText>
                            </FormControl>
                        </Stack>

                        <Divider />

                        <textarea
                            name='commentaires'
                            value={formData.values.commentaires}
                            onChange={formData.handleChange}
                            rows="15"   // Nombre de lignes visibles
                            cols="50"   // Largeur du champ
                            placeholder="Entrez vos commentaires ici..."
                            style={{
                                fontFamily: 'Arial, sans-serif',
                                fontSize: '16px',
                                lineHeight: '1.5',
                                padding: '10px',
                            }}
                        />
                    </Stack>

                </DialogContent>
                <DialogActions>
                    <Button autoFocus
                        variant='outlined'
                        style={{
                            backgroundColor: "transparent",
                            color: initial.theme,
                            width: "100px",
                            textTransform: 'none',
                            //outline: 'none',
                        }}
                        onClick={handleCloseDeleteModel}
                    >
                        Annuler
                    </Button>
                    <Button autoFocus
                        type="submit"
                        onClick={formData.handleSubmit}
                        style={{ backgroundColor: initial.theme, color: 'white', width: "100px", textTransform: 'none', outline: 'none' }}
                    >
                        Enregistrer
                    </Button>
                </DialogActions>
            </BootstrapDialog>
        </form>
    )
}

export default PopupModifNE;