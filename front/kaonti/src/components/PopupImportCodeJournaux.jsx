import { useState } from 'react';
import { Typography, Stack, Button, Dialog, DialogTitle, DialogContent, DialogActions, Badge, Box, IconButton } from '@mui/material';
import Papa from 'papaparse';
import { DataGrid, frFR } from '@mui/x-data-grid';
import useAxiosPrivate from '../../config/axiosPrivate';
import toast from 'react-hot-toast';
import { VscClose } from 'react-icons/vsc';
import { IoWarningOutline } from 'react-icons/io5';
import SaveAltIcon from '@mui/icons-material/SaveAlt';

export default function PopupImportCodeJournaux({ open, onClose, fileId, compteId, onImportSuccess }) {
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
        },
        {
            field: 'libelle',
            headerName: 'Libellé',
            type: 'string',
            sortable: true,
            flex: 3,
            headerAlign: 'left',
            align: 'left',
        },
        {
            field: 'type',
            headerName: 'Type',
            type: 'string',
            sortable: true,
            flex: 1.5,
            headerAlign: 'left',
            align: 'left',
        },
        {
            field: 'compteassocie',
            headerName: 'Compte associé',
            type: 'string',
            sortable: true,
            flex: 2,
            headerAlign: 'left',
            align: 'left',
        },
    ];

    const validateHeaders = (headers) => {
        const expectedHeaders = ["code", "libelle", "type", "compteassocie"];
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
                                
                                return {
                                    id: index,
                                    code: getValue(row.code),
                                    libelle: getValue(row.libelle),
                                    type: getValue(row.type).toUpperCase(),
                                    compteassocie: getValue(row.compteassocie)
                                };
                            });

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

    const handleDownloadModel = () => {
        const csvContent = "\uFEFFcode;libelle;type;compteassocie\n";
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
            codeJournauxData: codeJournauxData
        };

        axiosPrivate.post('/paramCodeJournaux/import', dataToSend)
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
                        setOpenDetailsAnomalie(true);
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
                <Dialog open={openDetailsAnomalie} onClose={() => setOpenDetailsAnomalie(false)} maxWidth="md">
                    <DialogTitle>Anomalies détectées</DialogTitle>
                    <DialogContent>
                        <Stack spacing={1}>
                            {msgAnomalie.map((msg, idx) => (
                                <Typography key={idx} variant="body2" sx={{ color: '#D32F2F' }}>
                                    • {msg}
                                </Typography>
                            ))}
                        </Stack>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setOpenDetailsAnomalie(false)}>Fermer</Button>
                    </DialogActions>
                </Dialog>
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
                                    onClick={() => setOpenDetailsAnomalie(true)}
                                    startIcon={
                                        <Badge 
                                            badgeContent={nbrAnomalie}
                                            color="error"
                                            overlap="circular"
                                        >
                                            <IoWarningOutline size={22}/>
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
                            spacing={2}
                            direction="row"
                            alignItems="center"
                            justifyContent="flex-start"
                        >
                            <Button
                                onClick={handleDownloadModel}
                                variant="outlined"
                                sx={{ textTransform: 'none' }}
                                startIcon={<SaveAltIcon />}
                            >
                                Télécharger modèle
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
                                    variant="contained"
                                    sx={{ textTransform: 'none' }}
                                    startIcon={<SaveAltIcon />}
                                >
                                    Importer fichier
                                </Button>
                            </label>
                        </Stack>

                        {traitementWaiting && (
                            <Typography variant="body2" sx={{ color: '#666' }}>
                                {traitementMsg} {progressValue > 0 && `(${progressValue}%)`}
                            </Typography>
                        )}

                        {codeJournauxData.length > 0 && (
                            <Box>
                                <Typography variant='subtitle1' sx={{ mb: 2, fontWeight: 'bold' }}>
                                    Aperçu des données ({codeJournauxData.length} lignes)
                                </Typography>
                                <Box sx={{ height: 400, width: '100%' }}>
                                    <DataGrid
                                        localeText={frFR.components.MuiDataGrid.defaultProps.localeText}
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
                        sx={{ textTransform: 'none' }}
                    >
                        Annuler
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleImport}
                        disabled={codeJournauxData.length === 0 || nbrAnomalie > 0 || traitementWaiting}
                        sx={{ textTransform: 'none' }}
                    >
                        Importer
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    )
}
