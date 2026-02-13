import { React, useState } from 'react';
import { Typography, Stack, Button, Dialog, DialogTitle, DialogContent, DialogActions, Badge, Box, IconButton, Checkbox, FormControlLabel } from '@mui/material';
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

export default function PopupImportCodeJournaux({ open, onClose, fileId, compteId, onImportSuccess }) {
    let initial = init[0];
    const [ecraser, setEcraser] = useState(false);

    const axiosPrivate = useAxiosPrivate();
    const [nbrAnomalie, setNbrAnomalie] = useState(0);
    const [openDetailsAnomalie, setOpenDetailsAnomalie] = useState(false);
    const [couleurBoutonAnomalie, setCouleurBoutonAnomalie] = useState('white');
    const [codeJournauxData, setCodeJournauxData] = useState([]);
    const [msgAnomalie, setMsgAnomalie] = useState([]);
    const [traitementWaiting, setTraitementWaiting] = useState(false);
    const [traitementMsg, setTraitementMsg] = useState('');
    const [progressValue, setProgressValue] = useState(0);

    const columns = [
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
            field: 'libelle',
            headerName: 'Libellé',
            type: 'string',
            sortable: true,
            flex: 3,
            headerAlign: 'left',
            align: 'left',
            headerClassName: 'HeaderbackColor',
        },
        {
            field: 'type',
            headerName: 'Type',
            type: 'string',
            sortable: true,
            flex: 1.5,
            headerAlign: 'left',
            align: 'left',
            headerClassName: 'HeaderbackColor',
        },
        {
            field: 'compteassocie',
            headerName: 'Compte associé',
            type: 'string',
            sortable: true,
            flex: 2,
            headerAlign: 'left',
            align: 'left',
            headerClassName: 'HeaderbackColor',
        },
        {
            field: 'nif',
            headerName: 'NIF',
            type: 'string',
            sortable: true,
            flex: 2,
            headerAlign: 'left',
            align: 'left',
            headerClassName: 'HeaderbackColor',
        },
        {
            field: 'stat',
            headerName: 'STAT',
            type: 'string',
            sortable: true,
            flex: 2,
            headerAlign: 'left',
            align: 'left',
            headerClassName: 'HeaderbackColor',
        },
        {
            field: 'adresse',
            headerName: 'Adresse',
            type: 'string',
            sortable: true,
            flex: 3,
            headerAlign: 'left',
            align: 'left',
            headerClassName: 'HeaderbackColor',
        },
    ];

    const validateHeaders = (headers) => {
        const expectedHeaders = ["code", "libelle", "type", "compteassocie", "nif", "stat", "adresse"];

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

        const missingCode = data.filter(item => !item.code || item.code.trim() === '');
        if (missingCode.length > 0) {
            msg.push(`Certaines lignes ne contiennent pas de code journal.`);
            nbrAnom = nbrAnom + 1;
        }

        const missingLibelle = data.filter(item => {
            const libelle = item.libelle;
            return !libelle || (typeof libelle === 'string' && libelle.trim() === '');
        });
        if (missingLibelle.length > 0) {
            msg.push(`Certaines lignes ne contiennent pas de libellé.`);
            nbrAnom = nbrAnom + 1;
        }

        const missingType = data.filter(item => !item.type || item.type.trim() === '');
        if (missingType.length > 0) {
            msg.push(`Certaines lignes ne contiennent pas de type.`);
            nbrAnom = nbrAnom + 1;
        }

        const expectedTypeValues = ["ACHAT", "BANQUE", "CAISSE", "OD", "RAN", "VENTE"];
        const invalidTypes = data.filter(item => item.type && !expectedTypeValues.includes(item.type.toUpperCase()));
        if (invalidTypes.length > 0) {
            msg.push(`Certains types sont invalides. Types acceptés : ACHAT, BANQUE, CAISSE, OD, RAN, VENTE`);
            nbrAnom = nbrAnom + 1;
        }

        const banqueOrCaisse = data.filter(item =>
            item.type && (item.type.toUpperCase() === 'BANQUE' || item.type.toUpperCase() === 'CAISSE')
        );
        const missingCompteAssocie = banqueOrCaisse.filter(item => !item.compteassocie || item.compteassocie.trim() === '');
        if (missingCompteAssocie.length > 0) {
            msg.push(`Les codes journaux de type BANQUE ou CAISSE doivent avoir un compte associé.`);
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
                        setProgressValue(0);

                        const headers = result?.meta?.fields || [];

                        if (validateHeaders(headers)) {
                            setMsgAnomalie([]);
                            setCouleurBoutonAnomalie('white');
                            setNbrAnomalie(0);

                            const normalizedData = result.data.map(row => {
                                const cleanRow = {};
                                Object.keys(row).forEach(key => {
                                    const cleanKey = key.trim().toLowerCase();
                                    cleanRow[cleanKey] = row[key];
                                });
                                return cleanRow;
                            });

                            const DataWithId = normalizedData.map((row, index) => {
                                const getValue = (value) => {
                                    if (value === null || value === undefined) return '';
                                    return String(value).trim();
                                };

                                const mappedRow = {
                                    id: index,
                                    code: getValue(row.code),
                                    libelle: getValue(row.libelle),
                                    type: getValue(row.type).toUpperCase(),
                                    compteassocie: getValue(row.compteassocie),
                                    nif: getValue(row.nif),
                                    stat: getValue(row.stat),
                                    adresse: getValue(row.adresse)
                                };

                                // Debug: log first 3 rows to see what's being read
                                if (index < 3) {
                                    console.log(`Row ${index}:`, {
                                        original: row,
                                        mapped: mappedRow
                                    });
                                }

                                return mappedRow;
                            });

                            console.log('Headers found:', headers);
                            console.log('Total rows:', DataWithId.length);

                            validationData(DataWithId);
                            setCodeJournauxData(DataWithId);

                            event.target.value = null;
                            setProgressValue(100);
                            setTimeout(() => {
                                setTraitementWaiting(false);
                                setProgressValue(0);
                            }, 800);
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
                delimiter: ';',
                error: () => {
                    toast.error('Erreur lors de la lecture du fichier');
                    setTraitementWaiting(false);
                }
            });
        }
    }

    const handleOpenAnomalieDetails = () => {
        setOpenDetailsAnomalie(true);
    }

    const handleCloseAnomalieDetails = (value) => {
        setOpenDetailsAnomalie(value);
    }

    const handleDownloadModel = () => {
        const csvContent = "\uFEFFcode;libelle;type;compteassocie;nif;stat;adresse\n";
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', 'modele_import_code_journaux.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success('Modèle téléchargé avec succès');
    }

    const handleImport = () => {
        if (nbrAnomalie > 0) {
            toast.error('Veuillez corriger les anomalies avant d\'importer les données.');
            return;
        }

        setTraitementMsg('Import des codes journaux en cours...');
        setTraitementWaiting(true);
        setProgressValue(0);

        const dataToSend = {
            idCompte: compteId,
            idDossier: fileId,
            codeJournauxData: codeJournauxData,
            ecraser
        };

        axiosPrivate.post('/paramCodeJournaux/importCodeJournaux', dataToSend)
            .then((response) => {
                const resData = response.data;
                if (resData.state) {
                    setProgressValue(100);
                    setTimeout(() => {
                        setTraitementWaiting(false);
                        setProgressValue(0);
                        toast.success(resData.msg);
                        handleClose();
                        if (onImportSuccess) {
                            onImportSuccess();
                        }
                    }, 800);
                } else {
                    setTraitementWaiting(false);
                    setProgressValue(0);
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
                setProgressValue(0);
                toast.error("Une erreur est survenue lors de l'import");
                console.error(error);
            });
    }

    const handleClose = () => {
        setCodeJournauxData([]);
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
                                Importation des codes journaux :
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
                    <Stack flexDirection="row" alignItems="center" >
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={ecraser}
                                    onChange={(e) => setEcraser(e.target.checked)}
                                    color="primary"
                                />
                            }
                            label="Ecraser les anciennes données"
                        />
                    </Stack>
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

                        <ImportProgressBar
                            isVisible={traitementWaiting}
                            message={traitementMsg}
                            variant="determinate"
                            progress={progressValue}
                        />

                        {codeJournauxData.length > 0 && (
                            <Box>
                                <Typography variant='subtitle1' sx={{ mb: 2, fontWeight: 'bold' }}>
                                    Aperçu des données ({codeJournauxData.length} lignes)
                                </Typography>
                                <Box sx={{ height: 400, width: '100%' }}>
                                    <DataGrid
                                        localeText={frFR.components.MuiDataGrid.defaultProps.localeText}
                                        slots={{ toolbar: QuickFilter }}
                                        sx={DataGridStyle.sx}
                                        rowHeight={DataGridStyle.rowHeight}
                                        columnHeaderHeight={DataGridStyle.columnHeaderHeight}
                                        columns={columns}
                                        rows={codeJournauxData}
                                        initialState={{
                                            pagination: {
                                                paginationModel: { page: 0, pageSize: 50 },
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
                        disabled={codeJournauxData.length === 0 || nbrAnomalie > 0 || traitementWaiting}
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
