import { React, useState, useEffect } from 'react';
import { Typography, Stack, Button, Dialog, DialogTitle, DialogContent, DialogActions, Badge, Box, IconButton } from '@mui/material';
import ImportProgressBar from '../../../componentsTools/ImportProgressBar';
import { init } from '../../../../../init';
import toast from 'react-hot-toast';
import Papa from 'papaparse';
import { DataGrid, frFR } from '@mui/x-data-grid';
import QuickFilter from '../../../componentsTools/DatagridToolsStyle';
import { DataGridStyle } from '../../../componentsTools/DatagridToolsStyle';
import PopupInformation from '../../../componentsTools/popupInformation';
import SaveAltIcon from '@mui/icons-material/SaveAlt';
import { VscClose } from 'react-icons/vsc';
import { IoWarningOutline } from 'react-icons/io5';
import { MdOutlineFileUpload } from 'react-icons/md';
import { FaFileImport } from 'react-icons/fa';
import useAxiosPrivate from '../../../../../config/axiosPrivate';
import useSSEImport from '../../../../hooks/useSSEImport';

export default function PopupImportImmobilisations({ open, onClose, fileId, compteId, exerciceId, onImportSuccess }) {
    let initial = init[0];
    const axiosPrivate = useAxiosPrivate();
    const [nbrAnomalie, setNbrAnomalie] = useState(0);
    const [openDetailsAnomalie, setOpenDetailsAnomalie] = useState(false);
    const [couleurBoutonAnomalie, setCouleurBoutonAnomalie] = useState('white');
    const [immobilisationsData, setImmobilisationsData] = useState([]);
    const [msgAnomalie, setMsgAnomalie] = useState([]);
    const [traitementWaiting, setTraitementWaiting] = useState(false);
    const [traitementMsg, setTraitementMsg] = useState('');
    const [progressValue, setProgressValue] = useState(0);

    // Hook SSE pour la progression en temps réel
    const { isImporting, progress: sseProgress, message: sseMessage, currentLine, totalLines, startImport } = useSSEImport();

    // Synchroniser les valeurs SSE avec l'affichage
    useEffect(() => {
        if (isImporting) {
            setProgressValue(sseProgress);
            const displayMessage = currentLine > 0 && totalLines > 0
                ? `${sseMessage} (${currentLine}/${totalLines} lignes)`
                : sseMessage;
            setTraitementMsg(displayMessage);
        }
    }, [isImporting, sseProgress, sseMessage, currentLine, totalLines]);

    const columns = [
        {
            field: 'numero_compte',
            headerName: 'N° Compte',
            type: 'string',
            sortable: true,
            flex: 1.5,
            headerAlign: 'left',
            align: 'left',
            headerClassName: 'HeaderbackColor',
        },
        {
            field: 'code',
            headerName: 'Code',
            type: 'string',
            sortable: true,
            flex: 1,
            headerAlign: 'left',
            align: 'left',
            headerClassName: 'HeaderbackColor',
        },
        {
            field: 'intitule',
            headerName: 'Intitulé',
            type: 'string',
            sortable: true,
            flex: 2.5,
            headerAlign: 'left',
            align: 'left',
            headerClassName: 'HeaderbackColor',
        },
        {
            field: 'fournisseur',
            headerName: 'Fournisseur',
            type: 'string',
            sortable: true,
            flex: 2,
            headerAlign: 'left',
            align: 'left',
            headerClassName: 'HeaderbackColor',
        },
        {
            field: 'date_acquisition',
            headerName: 'Date Acquisition',
            type: 'string',
            sortable: true,
            flex: 1.5,
            headerAlign: 'left',
            align: 'left',
            headerClassName: 'HeaderbackColor',
        },
        {
            field: 'montant_ht',
            headerName: 'Montant HT',
            type: 'string',
            sortable: true,
            flex: 1.5,
            headerAlign: 'right',
            align: 'right',
            headerClassName: 'HeaderbackColor',
        },
    ];

    const telechargerModele = () => {
        const headers = [
            'numero_compte',
            'code',
            'intitule',
            'fournisseur',
            'date_acquisition',
            'duree_amort',
            'type_amort',
            'montant_ht',
            'date_reprise',
            'amort_ant',
            'dotation',
            'date_sortie'
        ];

        const rows = [
            [
                '',
                '',
                '',
                '',
                'mm/jj/aaaa',
                '',
                'linéaire',
                '',
                'mm/jj/aaaa',
                '',
                '',
                'mm/jj/aaaa'
            ],
            [
                '',
                '',
                '',
                '',
                'mm/jj/aaaa',
                '',
                'dégressive',
                '',
                'mm/jj/aaaa',
                '',
                '',
                'mm/jj/aaaa'
            ]
        ];

        const csvContent =
            headers.join(';') + '\n' +
            rows.map(row => row.join(';')).join('\n');

        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', 'modele_import_immobilisations.csv');
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success('Modèle téléchargé avec succès');
    };

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            delimiter: ';',
            complete: (results) => {
                if (results.data && results.data.length > 0) {
                    const dataWithIds = results.data.map((row, index) => ({
                        ...row,
                        id: index + 1
                    }));
                    setImmobilisationsData(dataWithIds);
                    toast.success(`${results.data.length} ligne(s) chargée(s)`);
                } else {
                    toast.error('Aucune donnée trouvée dans le fichier');
                }
            },
            error: (error) => {
                toast.error('Erreur lors de la lecture du fichier: ' + error.message);
            }
        });
        event.target.value = '';
    };

    const validerDonnees = () => {
        const anomalies = [];

        immobilisationsData.forEach((row, index) => {
            const ligneNum = index + 1;

            if (!row.numero_compte || row.numero_compte.trim() === '') {
                anomalies.push(`Ligne ${ligneNum}: Le numéro de compte est obligatoire`);
            }
            if (!row.code || row.code.trim() === '') {
                anomalies.push(`Ligne ${ligneNum}: Le code est obligatoire`);
            }
            if (!row.intitule || row.intitule.trim() === '') {
                anomalies.push(`Ligne ${ligneNum}: L'intitulé est obligatoire`);
            }
            if (!row.date_acquisition || row.date_acquisition.trim() === '') {
                anomalies.push(`Ligne ${ligneNum}: La date d'acquisition est obligatoire`);
            }
            if (!row.duree_amort || row.duree_amort.trim() === '') {
                anomalies.push(`Ligne ${ligneNum}: La durée d'amortissement est obligatoire`);
            }
            if (!row.type_amort || row.type_amort.trim() === '') {
                anomalies.push(`Ligne ${ligneNum}: Le type d'amortissement est obligatoire`);
            }
            if (!row.montant_ht || row.montant_ht.trim() === '') {
                anomalies.push(`Ligne ${ligneNum}: Le montant HT est obligatoire`);
            }

            if (row.date_reprise && row.date_reprise.trim() !== '') {
                if (!row.amort_ant || row.amort_ant.trim() === '') {
                    anomalies.push(`Ligne ${ligneNum}: L'amortissement antérieur est obligatoire si date de reprise est renseignée`);
                }
            }
        });

        setMsgAnomalie(anomalies);
        setNbrAnomalie(anomalies.length);

        if (anomalies.length > 0) {
            setCouleurBoutonAnomalie('#ff6b6b');
            setOpenDetailsAnomalie(true); // Ouvrir automatiquement le popup d'anomalies
            return false;
        } else {
            setCouleurBoutonAnomalie('white');
            return true;
        }
    };

    const handleImport = () => {
        if (immobilisationsData.length === 0) {
            return toast.error('Aucune donnée à importer');
        }

        const isValid = validerDonnees();
        if (!isValid) {
            toast.error(`${nbrAnomalie} anomalie(s) détectée(s)`);
            return;
        }

        setTraitementMsg('Import des immobilisations en cours...');
        setTraitementWaiting(true);
        setProgressValue(0);

        // Utiliser SSE pour la progression en temps réel
        startImport(
            '/administration/traitementSaisie/importImmobilisationsWithProgress',
            {
                data: immobilisationsData,
                id_dossier: Number(fileId),
                id_compte: Number(compteId),
                id_exercice: Number(exerciceId)
            },
            (eventData) => {
                // Succès
                setTimeout(() => {
                    setTraitementWaiting(false);
                    setProgressValue(0);
                    toast.success(eventData.message || 'Import réussi');
                    setImmobilisationsData([]);
                    setNbrAnomalie(0);
                    setMsgAnomalie([]);
                    setCouleurBoutonAnomalie('white');
                    if (onImportSuccess) onImportSuccess();
                    onClose();
                }, 800);
            },
            (error) => {
                // Erreur
                setTraitementWaiting(false);
                setProgressValue(0);

                // Parser les anomalies si elles sont présentes dans le message d'erreur
                if (typeof error === 'string' && error.includes('anomalie(s) détectée(s)')) {
                    const lines = error.split('\n');
                    const anomaliesArray = lines.slice(1); // Ignorer la première ligne (résumé)

                    if (anomaliesArray.length > 0) {
                        setMsgAnomalie(anomaliesArray);
                        setNbrAnomalie(anomaliesArray.length);
                        setCouleurBoutonAnomalie('#ff6b6b');
                        setOpenDetailsAnomalie(true);
                    }

                    toast.error(lines[0] || error);
                } else {
                    toast.error(error || "Erreur lors de l'import");
                }
            }
        );
    };

    const handleClose = () => {
        setImmobilisationsData([]);
        setNbrAnomalie(0);
        setMsgAnomalie([]);
        setCouleurBoutonAnomalie('white');
        onClose();
    };

    return (
        <>
            <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
                <DialogTitle sx={{ px: 2, py: 1.5 }}>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Box display="flex" alignItems="center" gap={1}>
                            <Typography sx={{ fontWeight: 700, color: 'black' }}>
                                Importation des immobilisations :
                            </Typography>
                            {nbrAnomalie > 0 && (
                                <Button
                                    onClick={() => setOpenDetailsAnomalie(true)}
                                    startIcon={
                                        <Badge
                                            badgeContent={nbrAnomalie}
                                            color="error"
                                            overlap="circular"
                                        >
                                            <IoWarningOutline size={22} />
                                        </Badge>
                                    }
                                    sx={{
                                        minWidth: "auto",
                                        padding: 0.5,
                                        color: 'red',
                                        backgroundColor: 'transparent',
                                        marginTop: -0.5
                                    }}
                                />
                            )}
                        </Box>
                        <IconButton onClick={handleClose} size="medium" sx={{ color: '#e53935' }}>
                            <VscClose />
                        </IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 2 }}>
                        <Stack
                            spacing={4}
                            direction="row"
                            alignItems="center"
                            justifyContent="center"
                            sx={{ mt: 1.5, mb: 2, columnGap: 3 }}
                        >
                            <Button
                                onClick={telechargerModele}
                                sx={{
                                    width: 260,
                                    height: 40,
                                    border: '1px dashed rgba(5,96,116,0.6)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    textTransform: 'none',
                                    backgroundColor: 'transparent',
                                    color: '#164b6b',
                                    '&:hover': { backgroundColor: 'rgba(5,96,116,0.05)' },
                                }}
                                endIcon={<MdOutlineFileUpload size={22} />}
                            >
                                Télécharger le modèle d'import
                            </Button>

                            <input
                                accept=".csv"
                                style={{ display: 'none' }}
                                id="upload-csv-immobilisations"
                                type="file"
                                onChange={handleFileUpload}
                            />
                            <label htmlFor="upload-csv-immobilisations" style={{ margin: 0 }}>
                                <Button
                                    component="span"
                                    sx={{
                                        width: 260,
                                        height: 40,
                                        textTransform: 'none',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        backgroundColor: initial.theme,
                                        color: 'white',
                                        '&:hover': { backgroundColor: initial.theme, opacity: 0.9 },
                                    }}
                                    endIcon={<SaveAltIcon size={18} />}
                                >
                                    Importer depuis le fichier
                                </Button>
                            </label>
                        </Stack>

                        <ImportProgressBar
                            isVisible={traitementWaiting}
                            message={traitementMsg}
                            variant="determinate"
                            progress={progressValue}
                        />

                        {immobilisationsData.length > 0 && (
                            <Box>
                                <Typography variant='subtitle1' sx={{ mb: 2, fontWeight: 'bold' }}>
                                    Aperçu des données ({immobilisationsData.length} lignes)
                                </Typography>
                                <Box sx={{ height: 400, width: '100%' }}>
                                    <DataGrid
                                        rows={immobilisationsData}
                                        columns={columns}
                                        pageSize={10}
                                        rowsPerPageOptions={[10, 25, 50]}
                                        disableSelectionOnClick
                                        localeText={frFR.components.MuiDataGrid.defaultProps.localeText}
                                        sx={DataGridStyle}
                                        slots={{ toolbar: QuickFilter }}
                                    />
                                </Box>
                            </Box>
                        )}
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ justifyContent: 'space-between', pb: 2, px: 2 }}>
                    <Button
                        onClick={handleClose}
                        variant="outlined"
                        sx={{
                            minWidth: 110,
                            textTransform: 'none',
                        }}
                    >
                        Annuler
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleImport}
                        disabled={immobilisationsData.length === 0 || traitementWaiting}
                        sx={{
                            minWidth: 110,
                            backgroundColor: initial.theme,
                            textTransform: 'none',
                            '&:hover': { backgroundColor: initial.theme, opacity: 0.9 },
                        }}
                    >
                        Importer
                    </Button>
                </DialogActions>
            </Dialog>

            {openDetailsAnomalie && msgAnomalie.length > 0 && (
                <PopupInformation
                    msg={msgAnomalie}
                    confirmationState={() => setOpenDetailsAnomalie(false)}
                />
            )}
        </>
    );
}
