import { useState, useEffect } from 'react';

import {
    Typography,
    Stack,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    styled,
    Badge,
    Tooltip
} from '@mui/material';

import CloseIcon from '@mui/icons-material/Close';
import LogoutIcon from '@mui/icons-material/Logout';
import SaveAltIcon from '@mui/icons-material/SaveAlt';
import { GoAlert } from "react-icons/go";

import { init } from '../../../../../init';

import expectedtedHeader from './PopupFunctions/ExpectedHeaderEbilan';
import { getPopupTitle, getFileUrl } from './PopupFunctions/PopupConfig';

import ImportCard from './ImportCard/ImportCard';
import ImportProgressBar from '../../ImportProgressBar';

import {
    parseCsvFile,
    processBhiapcRow,
    processMpRow,
    processSeRow,
    processDaRow,
    processEiafncRow
} from './PopupFunctions/csvHandlers';

import useSSEImport from '../../../../hooks/useSSEImport';

import VirtualTableAnomalieEbilan from './VirtualTable/VirtualTableAnomalieEbilan';
import VirtualTableAnomalieColumnsEbilan from './VirtualTable/VirtualTableAnomalieColumnsEbilan';

let initial = init[0];

const expectedBhiapcHeadersKeys = expectedtedHeader.expectedBhiapcHeadersKeys;
const expectedMpHeaderKeys = expectedtedHeader.expectedMpHeaderKeys;
const expectedSeHeaderKeys = expectedtedHeader.expectedSeHeaderKeys;
const expectedDaHeaderKeys = expectedtedHeader.expectedDaHeaderKeys;
const expectedEiafncHeaderKeys = expectedtedHeader.expectedEiafncHeaderKeys;

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
    '& .MuiDialogContent-root': {
        padding: theme.spacing(3),
    },
    '& .MuiDialogActions-root': {
        padding: theme.spacing(2),
    },
    '& .MuiPaper-root': {
        maxHeight: '800px'
    },
}));

const PopupImportToCsv = ({ type, closePopup, id_compte, id_dossier, id_exercice, refreshTable }) => {

    const [csvFile, setCsvFile] = useState(null);

    const [traitementWaiting, setTraitementWaiting] = useState(false);
    const [traitementMsg, setTraitementMsg] = useState('');
    const [progressValue, setProgressValue] = useState(0);
    const [importedCount, setImportedCount] = useState(0);

    const { isImporting, progress: sseProgress, message: sseMessage, currentLine, totalLines, startImport } = useSSEImport();

    useEffect(() => {
        if (isImporting) {
            setTraitementWaiting(true);
            setProgressValue(sseProgress);
            const displayMessage = currentLine > 0 && totalLines > 0
                ? `${sseMessage} (${currentLine}/${totalLines} lignes)`
                : sseMessage;
            setTraitementMsg(displayMessage);
        } else {
            setTraitementWaiting(false);
        }
    }, [isImporting, sseProgress, sseMessage, currentLine, totalLines]);

    const [anomalieData, setAnomalieData] = useState([]);
    const [showAnomalieData, setShowAnomalieData] = useState(false);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        e.target.value = null;
        setAnomalieData([]);

        if (type === "4") {
            // BILAN
        } else if (type === "5") {
            // CRN
        } else if (type === "6") {
            // CRF
        } else if (type === "7") {
            // TFTD
        } else if (type === "8") {
            // TFTI
        } else if (type === "9") {
            // EVCP
        } else if (type === "10") {
            // DRF
        } else if (type === "11") {
            // BHIAPC
            parseCsvFile({
                file,
                type: type,
                expectedHeaders: expectedBhiapcHeadersKeys,
                processRow: (row, rowIndex, anomalies) => {
                    const data = processBhiapcRow(row, rowIndex, anomalies);
                    if (!data) return null;
                    return {
                        ...data,
                        id_compte: Number(id_compte),
                        id_dossier: Number(id_dossier),
                        id_exercice: Number(id_exercice)
                    };
                },
                startImport,
                setCsvFile,
                setShowAnomalieData,
                setAnomalieData,
                closePopup,
                setTraitementWaiting,
                setTraitementMsg,
                setProgressValue,
                setImportedCount
            });
        } else if (type === "12") {
            // MP
            parseCsvFile({
                file,
                type: type,
                expectedHeaders: expectedMpHeaderKeys,
                processRow: (row, rowIndex, anomalies) => {
                    const data = processMpRow(row, rowIndex, anomalies);
                    if (!data) return null;
                    return {
                        ...data,
                        id_compte: Number(id_compte),
                        id_dossier: Number(id_dossier),
                        id_exercice: Number(id_exercice)
                    };
                },
                startImport,
                setCsvFile,
                setShowAnomalieData,
                setAnomalieData,
                closePopup,
                setTraitementWaiting,
                setTraitementMsg,
                setProgressValue,
                setImportedCount
            });
        } else if (type === "13") {
            // DA
            parseCsvFile({
                file,
                type: type,
                expectedHeaders: expectedDaHeaderKeys,
                processRow: (row, rowIndex, anomalies) => {
                    const data = processDaRow(row, rowIndex, anomalies);
                    if (!data) return null;
                    return {
                        ...data,
                        id_compte: Number(id_compte),
                        id_dossier: Number(id_dossier),
                        id_exercice: Number(id_exercice)
                    };
                },
                startImport,
                setCsvFile,
                setShowAnomalieData,
                setAnomalieData,
                closePopup,
                setTraitementWaiting,
                setTraitementMsg,
                setProgressValue,
                setImportedCount
            });
        } else if (type === "14") {
            // DP
        } else if (type === "15") {
            parseCsvFile({
                file,
                type: type,
                expectedHeaders: expectedEiafncHeaderKeys,
                processRow: (row, rowIndex, anomalies) => {
                    const data = processEiafncRow(row, rowIndex, anomalies);
                    if (!data) return null;
                    return {
                        ...data,
                        id_compte: Number(id_compte),
                        id_dossier: Number(id_dossier),
                        id_exercice: Number(id_exercice)
                    };
                },
                startImport,
                setCsvFile,
                setShowAnomalieData,
                setAnomalieData,
                closePopup,
                setTraitementWaiting,
                setTraitementMsg,
                setProgressValue,
                setImportedCount
            });
        } else if (type === "16") {
            // SAD
        } else if (type === "17") {
            // SDR
        } else if (type === "18") {
            // SE
            parseCsvFile({
                file,
                type: type,
                expectedHeaders: expectedSeHeaderKeys,
                processRow: (row, rowIndex, anomalies) => {
                    const data = processSeRow(row, rowIndex, anomalies);
                    if (!data) return null;
                    return {
                        ...data,
                        id_compte: Number(id_compte),
                        id_dossier: Number(id_dossier),
                        id_exercice: Number(id_exercice)
                    };
                },
                startImport,
                setCsvFile,
                setShowAnomalieData,
                setAnomalieData,
                closePopup,
                setTraitementWaiting,
                setTraitementMsg,
                setProgressValue,
                setImportedCount
            });
        } else if (type === "19") {
        }
        setCsvFile(file);
        refreshTable(id_compte, id_dossier, id_exercice);
    }

    const handleDownloadModel = () => {
        const fileUrl = getFileUrl(type);
        const link = document.createElement('a');
        link.href = fileUrl;
        link.download = `ModeleImport${getPopupTitle(type)}`;
        link.click();
    }

    const toogleShowAnomalie = () => {
        setShowAnomalieData(prev => !prev);
    }

    return (
        <form>
            <BootstrapDialog
                onClose={closePopup}
                aria-labelledby="import-dialog-title"
                open={true}
                maxWidth='md'
            >
                <DialogTitle
                    id="import-dialog-title"
                    sx={{
                        pl: 3, pr: 5, py: 1,
                        fontWeight: 'bold',
                        fontSize: 18,
                        backgroundColor: 'transparent',
                    }}
                >
                    <Stack
                        direction={'row'}
                        alignItems={'center'}
                        spacing={0.5}
                    >
                        <Typography>Importation CSV des : formulaires {getPopupTitle(type)} </Typography>
                        <Tooltip title="Liste des anomalies">
                            <IconButton
                                onClick={toogleShowAnomalie}
                                style={{
                                    textTransform: 'none', outline: 'none'
                                }}
                            >
                                <Badge badgeContent={anomalieData.length} >
                                    <GoAlert color='#FF8A8A' style={{ width: '30px', height: '30px' }} />
                                </Badge>
                            </IconButton>
                        </Tooltip>
                    </Stack>
                </DialogTitle>

                <IconButton
                    style={{ color: 'red', textTransform: 'none', outline: 'none' }}
                    aria-label="close"
                    onClick={closePopup}
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
                        style={{
                            marginTop: '0px'
                        }}
                        spacing={3}
                        mt={1}
                    >
                        <Stack
                            flexDirection={'row'}
                            justifyContent={'space-between'}
                            alignItems={'baseline'}
                            sx={{ columnGap: 2.5 }}
                            style={{
                                marginTop: '-20px'
                            }}
                        >
                            <ImportCard
                                icon={LogoutIcon}
                                label="Télécharger le modèle d'import"
                                iconStyle={{
                                    transform: 'rotate(270deg)',
                                    color: initial.theme
                                }}
                                sx={{ width: 310, backgroundColor: 'transparent', }}
                                sxTypo={{
                                    color: initial.theme
                                }}
                                onClick={handleDownloadModel}
                            />

                            <Stack flexDirection={'column'}>
                                <ImportCard
                                    sx={{ width: 310, backgroundColor: initial.theme }}
                                    sxTypo={{
                                        color: 'white'
                                    }}
                                    iconStyle={{
                                        color: 'white'
                                    }}
                                    icon={SaveAltIcon}
                                    label="Importer depuis le fichier">
                                    <input
                                        type="file"
                                        accept=".csv"
                                        onChange={handleFileChange}
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: '100%',
                                            height: '100%',
                                            opacity: 0,
                                            cursor: 'pointer',
                                        }}
                                    />
                                </ImportCard>

                                {csvFile && (
                                    <Typography
                                        variant="body2"
                                        ml={1}
                                        style={{
                                            marginTop: '10px',
                                        }}
                                        sx={{
                                            alignSelf: 'flex-end',
                                        }}
                                    >
                                        Fichier sélectionné : {csvFile.name}
                                    </Typography>
                                )}
                            </Stack>
                        </Stack>

                        {
                            showAnomalieData && anomalieData.length > 0 && (
                                <Stack
                                    width={"100%"}
                                    height={"250px"}
                                    alignItems={'start'}
                                    style={{ overflow: 'auto' }}
                                >
                                    <VirtualTableAnomalieEbilan rows={anomalieData} columns={VirtualTableAnomalieColumnsEbilan} />
                                </Stack>
                            )
                        }

                        <ImportProgressBar
                            isVisible={traitementWaiting}
                            message={traitementMsg || (importedCount > 0 ? `Import en cours... (${importedCount} lignes)` : 'Import en cours...')}
                            variant="determinate"
                            progress={progressValue}
                        />
                    </Stack>
                </DialogContent>

                <DialogActions>
                    <Button
                        variant="outlined"
                        style={{
                            backgroundColor: "transparent",
                            color: initial.theme,
                            width: "100px",
                            textTransform: 'none',
                            outline: 'none',
                        }}
                        onClick={closePopup}
                    >
                        Annuler
                    </Button>
                </DialogActions>
            </BootstrapDialog>
        </form>
    )
}

export default PopupImportToCsv