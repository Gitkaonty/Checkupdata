import { React, useState } from 'react';
import { Typography, Stack, Button, Dialog, DialogTitle, DialogContent, DialogActions, Badge, Box, CircularProgress, IconButton } from '@mui/material';
import { init } from '../../../init';
import toast from 'react-hot-toast';
import Papa from 'papaparse';
import { DataGrid, frFR } from '@mui/x-data-grid';
import QuickFilter from './DatagridToolsStyle';
import { DataGridStyle } from './DatagridToolsStyle';
import PopupInformation from './popupInformation';
import SaveAltIcon from '@mui/icons-material/SaveAlt';
import DownloadIcon from '@mui/icons-material/Download';
import { VscClose } from 'react-icons/vsc';
import { IoWarningOutline } from 'react-icons/io5';
import { MdOutlineFileUpload } from 'react-icons/md';
import { FaFileImport } from 'react-icons/fa';
import useAxiosPrivate from '../../../config/axiosPrivate';

export default function PopupImportAnalitique({ open, onClose, fileId, compteId, axeId, onImportSuccess }) {
    let initial = init[0];
    const axiosPrivate = useAxiosPrivate();
    const [nbrAnomalie, setNbrAnomalie] = useState(0);
    const [openDetailsAnomalie, setOpenDetailsAnomalie] = useState(false);
    const [couleurBoutonAnomalie, setCouleurBoutonAnomalie] = useState('white');
    const [sectionsData, setSectionsData] = useState([]);
    const [msgAnomalie, setMsgAnomalie] = useState([]);
    const [traitementWaiting, setTraitementWaiting] = useState(false);
    const [traitementMsg, setTraitementMsg] = useState('');

    const columns = [
        {
            field: 'section',
            headerName: 'Section',
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
            flex: 2,
            headerAlign: 'left',
            align: 'left',
            headerClassName: 'HeaderbackColor',
        },
        {
            field: 'compte',
            headerName: 'Compte',
            type: 'string',
            sortable: true,
            flex: 1.5,
            headerAlign: 'left',
            align: 'left',
            headerClassName: 'HeaderbackColor',
        },
        {
            field: 'pourcentage',
            headerName: 'Pourcentage',
            type: 'string',
            sortable: true,
            flex: 1,
            headerAlign: 'left',
            align: 'left',
            headerClassName: 'HeaderbackColor',
            renderCell: (params) => {
                const value = params.value || 0;
                const formatted = Number(value).toLocaleString('fr-FR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                });
                return `${formatted.replace(/\u202f/g, ' ')}%`;
            },
        },
    ];

    const validateHeaders = (headers) => {
        const expectedHeaders = ["section", "intitule", "compte"];

        const normalize = (s) => (s || "")
            .toString()
            .trim()
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');

        const actual = new Set(headers.map(normalize));
        const missing = expectedHeaders.filter(h => !actual.has(normalize(h)));
        if (missing.length > 0) {
            toast.error(`Les en-têtes suivants sont manquants : ${missing.join(', ')}`);
            return false;
        }
        return true;
    }

    const validationData = (data) => {
        const couleurAnom = "#EB5B00";
        let nbrAnom = 0;
        let msg = [];

        const missingSection = data.filter(item => !item.section || item.section.trim() === '');
        if (missingSection.length > 0) {
            msg.push(`Certaines lignes ne contiennent pas de section.`);
            nbrAnom = nbrAnom + 1;
        }

        const missingIntitule = data.filter(item => {
            const intitule = item.intitule;
            return !intitule || (typeof intitule === 'string' && intitule.trim() === '');
        });
        if (missingIntitule.length > 0) {
            msg.push(`Certaines lignes ne contiennent pas d'intitulé.`);
            nbrAnom = nbrAnom + 1;
        }

        const missingCompte = data.filter(item => !item.compte || item.compte.trim() === '');
        if (missingCompte.length > 0) {
            msg.push(`Certaines lignes ne contiennent pas de compte.`);
            nbrAnom = nbrAnom + 1;
        }

        setNbrAnomalie(nbrAnom);
        setCouleurBoutonAnomalie(nbrAnom > 0 ? couleurAnom : 'white');
        setMsgAnomalie(msg);
    };

    const handleFileSelect = (event) => {
        const file = event.target.files[0];

        if (file) {
            Papa.parse(file, {
                complete: (result) => {
                    try {
                        setTraitementMsg('Traitement des données en cours...');
                        setTraitementWaiting(true);

                        const headers = result.meta.fields;

                        if (validateHeaders(headers)) {
                            setMsgAnomalie([]);
                            setCouleurBoutonAnomalie('white');
                            setNbrAnomalie(0);

                            const totalLines = result.data.length;
                            const percentagePerLine = totalLines > 0 ? 100 / totalLines : 0;

                            const DataWithId = result.data.map((row, index) => ({
                                id: index,
                                section: row.section || '',
                                intitule: row.intitule || '',
                                compte: row.compte || '',
                                pourcentage: Number(percentagePerLine.toFixed(2))
                            }));

                            validationData(DataWithId);
                            setSectionsData(DataWithId);

                            event.target.value = null;
                            setTraitementWaiting(false);
                        } else {
                            setTraitementWaiting(false);
                        }
                    } catch (error) {
                        console.error('Erreur lors de la lecture du fichier CSV:', error);
                        toast.error('Erreur lors de la lecture du fichier CSV');
                        setTraitementWaiting(false);
                    }
                },
                header: true,
                skipEmptyLines: true,
                encoding: "UTF-8",
                error: () => {
                    toast.error('Erreur lors de la lecture du fichier');
                    setTraitementWaiting(false);
                }
            });
        }
    }

    const handleDownloadModel = () => {
        const csvContent = "section,intitule,compte\n";
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', 'modele_import_analytique.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success('Modèle téléchargé avec succès');
    }

    const handleOpenAnomalieDetails = () => {
        setOpenDetailsAnomalie(true);
    }

    const handleCloseAnomalieDetails = (value) => {
        setOpenDetailsAnomalie(value);
    }

    const handleImport = () => {
        if (nbrAnomalie > 0) {
            toast.error('Veuillez corriger les anomalies avant d\'importer les données.');
            return;
        }

        setTraitementMsg('Import des sections analytiques en cours...');
        setTraitementWaiting(true);

        const dataToSend = {
            compteId: compteId,
            fileId: fileId,
            axeId: axeId,
            sectionsData: sectionsData
        };

        axiosPrivate.post('/paramCa/importSections', dataToSend)
            .then((response) => {
                const resData = response.data;
                setTraitementWaiting(false);
                if (resData.state) {
                    toast.success(resData.msg);
                    handleClose();
                    if (onImportSuccess) {
                        onImportSuccess();
                    }
                } else {
                    toast.error(resData.msg);
                    if (resData.anomalies && resData.anomalies.length > 0) {
                        setMsgAnomalie(resData.anomalies);
                        setNbrAnomalie(resData.anomalies.length);
                        setCouleurBoutonAnomalie("#EB5B00");
                        handleOpenAnomalieDetails();
                    }
                }
            })
            .catch((error) => {
                setTraitementWaiting(false);
                toast.error("Une erreur est survenue lors de l'import");
                console.error(error);
            });
    }

    const handleClose = () => {
        setSectionsData([]);
        setMsgAnomalie([]);
        setNbrAnomalie(0);
        setCouleurBoutonAnomalie('white');
        setTraitementWaiting(false);
        onClose();
    }

    return (
        <>
            {openDetailsAnomalie && (
                <PopupInformation
                    msg={msgAnomalie}
                    confirmationState={handleCloseAnomalieDetails}
                />
            )}
            <Dialog
                open={open}
                onClose={handleClose}
                maxWidth="md"
                PaperProps={{
                    sx: {
                        width: 600,
                        maxHeight: 600,
                        borderRadius: 1,
                    },
                }}
            >
                <DialogTitle sx={{ px: 2, py: 1.5 }}>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Box display="flex" alignItems="center" gap={1}>
                            <Typography sx={{ fontWeight: 700, color: 'black' }}>
                                Importation des sections analytiques :
                            </Typography>
                            {nbrAnomalie > 0 && (
                                <Button
                                    onClick={handleOpenAnomalieDetails}
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
                            justifyContent="flex-start"
                            sx={{ mt: 1.5, mb: 2, columnGap: 3 }}
                        >
                            <Button
                                onClick={handleDownloadModel}
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
                                id="import-file-input"
                                type="file"
                                onChange={handleFileSelect}
                            />
                            <label htmlFor="import-file-input" style={{ margin: 0 }}>
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

                        {traitementWaiting && (
                            <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                                <CircularProgress size={20} sx={{ mr: 2 }} />
                                <Typography variant='body2'>{traitementMsg}</Typography>
                            </Box>
                        )}

                        {sectionsData.length > 0 && (
                            <Box>
                                <Typography variant='subtitle1' sx={{ mb: 2, fontWeight: 'bold' }}>
                                    Aperçu des données ({sectionsData.length} lignes - Pourcentage par ligne: {(100 / sectionsData.length).toFixed(2)}%)
                                </Typography>
                                <Box sx={{ height: 400, width: '100%' }}>
                                    <DataGrid
                                        localeText={frFR.components.MuiDataGrid.defaultProps.localeText}
                                        slots={{ toolbar: QuickFilter }}
                                        rowHeight={DataGridStyle.rowHeight}
                                        columnHeaderHeight={DataGridStyle.columnHeaderHeight}
                                        columns={columns}
                                        rows={sectionsData}
                                        initialState={{
                                            pagination: {
                                                paginationModel: { page: 0, pageSize: 50 },
                                            },
                                        }}
                                        sx={{
                                            ...DataGridStyle.sx,
                                            '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': {
                                                outline: 'none',
                                                border: 'none',
                                            },
                                            '& .MuiDataGrid-virtualScroller': {
                                                maxHeight: '100%',
                                            },
                                            '& .MuiDataGrid-columnHeaders': {
                                                backgroundColor: initial.theme,
                                                color: 'white',
                                                fontWeight: 'bold',
                                            },
                                        }}
                                        pageSizeOptions={[50, 100]}
                                        pagination
                                        checkboxSelection={false}
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
                        // startIcon={<SaveAltIcon />}
                        onClick={handleImport}
                        disabled={sectionsData.length === 0 || nbrAnomalie > 0 || traitementWaiting}
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
        </>
    )
}
