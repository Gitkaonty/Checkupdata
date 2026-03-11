import { useState, useEffect } from 'react';
import {
    Typography, Stack, Button, Dialog, DialogTitle,
    DialogContent, DialogActions, IconButton, styled,
    TextField
} from '@mui/material';

import CloseIcon from '@mui/icons-material/Close';
import LogoutIcon from '@mui/icons-material/Logout';
import SaveAltIcon from '@mui/icons-material/SaveAlt';

import { init } from '../../../../../../init';
import Papa from 'papaparse';
import { DataGrid, frFR } from '@mui/x-data-grid';
import toast from 'react-hot-toast';
import { DataGridStyle } from '../../../DatagridToolsStyle';
import FormatedInput from '../../../FormatedInput';
import useSSEImport from '../../../../../hooks/useSSEImport';
import ImportProgressBar from '../../../ImportProgressBar';

let initial = init[0];

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

const ImportCard = ({ icon: Icon, label, iconStyle = {}, children, sx = {}, sxTypo = {}, onClick }) => (
    <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        onClick={onClick}
        sx={{
            border: `2px dashed ${initial.theme}`,
            px: 3,
            py: 1,
            color: initial.theme,
            borderRadius: 1,
            cursor: 'pointer',
            position: 'relative',
            overflow: 'hidden',
            width: 'fit-content',
            minWidth: 200,
            '&:hover': { opacity: 0.95 },
            ...sx,
        }}
    >
        <Typography sx={{ ...sxTypo, fontSize: '15px' }}>{label}</Typography>
        <Icon sx={{ fontSize: 25, ...iconStyle }} />
        {children}
    </Stack>
);

const PopupImportComma = ({ confirmationState, setIsRefreshed, nature, compteId, fileId, selectedExerciceId, textTitle }) => {
    const [csvFile, setCsvFile] = useState(null);
    const [csvData, setCsvData] = useState([]);

    const [traitementWaiting, setTraitementWaiting] = useState(false);
    const [traitementMsg, setTraitementMsg] = useState('');

    const { isImporting, progress, message, currentLine, totalLines, startImport } = useSSEImport();

    useEffect(() => {
        if (isImporting) {
            setTraitementWaiting(true);
            const displayMessage = currentLine > 0 && totalLines > 0
                ? `${message} (${currentLine}/${totalLines} lignes)`
                : message;
            setTraitementMsg(displayMessage);
        }
    }, [isImporting, progress, message, currentLine, totalLines]);

    const handleClose = () => {
        confirmationState(false);
        setIsRefreshed();
    };

    const handleRowUpdate = (newRow, oldRow) => {
        const { id, typeTier, ...rowWithoutId } = newRow;

        const updatedData = csvData.map((row, index) =>
            index === oldRow.id ? rowWithoutId : row
        );

        setCsvData(updatedData);
        return newRow;
    };

    const customWidths1 = {
        nif: 150,
        nif_representaires: 150,
        num_stat: 150,
        cin: 130,
        lieu_cin: 150,
        date_cin: 150,
        nature_autres: 150,
        reference: 200,
        raison_sociale: 150,
        adresse: 150,
        ville: 150,
        ex_province: 150,
        pays: 120,
        nature: 150,
        comptabilisees: 160,
        versees: 160
    };

    const customWidths2 = {
        nif: 150,
        nif_representaires: 150,
        num_stat: 150,
        cin: 130,
        lieu_cin: 150,
        date_cin: 150,
        nature_autres: 150,
        reference: 200,
        raison_sociale: 150,
        nom_commercial: 150,
        fokontany: 120,
        adresse: 150,
        ville: 150,
        ex_province: 150,
        pays: 120,
        nature: 150,
        mode_payement: 100,
        montanth_tva: 160,
        tva: 100
    };

    const customWidths3 = {
        nif: 150,
        nif_representaires: 150,
        num_stat: 150,
        cin: 130,
        lieu_cin: 150,
        date_cin: 150,
        nature_autres: 150,
        reference: 200,
        nom: 150,
        prenom: 150,
        raison_sociale: 150,
        adresse: 150,
        ville: 150,
        ex_province: 150,
        pays: 120,
        nature: 150,
        montanth_tva: 160,
        tva: 100
    };

    const customWidths =
        nature === 'SVT' || nature === 'ADR' || nature === 'AC' || nature === 'AI' || nature === 'DEB'
            ? customWidths1 : nature === 'MV' || nature === 'PSV' ? customWidths2 : customWidths3

    const expectedHeaders = Object.keys(customWidths);

    // Formatter en deux chiffres après virgules
    const cleanNumber = (val) => {
        const number = parseFloat((val || '0').toString().replace(/\s/g, '').replace(',', '.'));
        return isNaN(number) ? 0 : Math.round(number * 100) / 100;
    };

    // Formattage du date en yyyy-mm-dd
    function formatDateToISO(dateStr) {
        if (!dateStr) return null;

        const str = String(dateStr).trim();
        const parts = str.includes('/') ? str.split('/') : str.split('-');

        if (parts.length !== 3) return null;

        let day, month, year;

        if (str.includes('/')) {
            [day, month, year] = parts;
        } else {
            [year, month, day] = parts; // format ISO
        }

        const dayNum = Number(day);
        const monthNum = Number(month);
        const yearNum = Number(year);

        if (
            isNaN(dayNum) || isNaN(monthNum) || isNaN(yearNum) ||
            dayNum < 1 || dayNum > 31 ||
            monthNum < 1 || monthNum > 12 ||
            yearNum < 1000 || yearNum > 9999
        ) {
            console.warn(`Date invalide : ${str}`);
            return null;
        }

        return `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    }

    // Selection du fichier CSV et maj du tableau d'affichage des valeurs dans le fichier CSV
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setCsvFile(file);

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const actualHeaders = results.meta.fields;

                const missingHeaders = expectedHeaders.filter(h => !actualHeaders.includes(h));
                if (missingHeaders.length > 0) {
                    toast.error("Colonnes manquantes dans le fichier CSV :\n" + missingHeaders.join(', '));
                    setCsvData([]);
                    setCsvFile(null);
                    return;
                }

                const parsedData = results.data.map((row) => {
                    let typeTier = '';

                    if (row.nif && row.num_stat) {
                        typeTier = 'avecNif';
                    } else if (row.cin && row.lieu_cin && row.date_cin) {
                        typeTier = 'sansNif';
                    } else if (row.nif_representaires) {
                        typeTier = 'prestataires';
                    } else if (row.nature_autres && row.reference) {
                        typeTier = 'autres';
                    }

                    if (['SVT', 'ADR', 'AC', 'AI', 'DEB'].includes(nature)) {
                        return {
                            ...row,
                            id_dossier: Number(fileId),
                            id_exercice: Number(selectedExerciceId),
                            id_compte: Number(compteId),
                            comptabilisees: cleanNumber(row.comptabilisees),
                            versees: cleanNumber(row.versees),
                            type: nature,
                            typeTier,
                        };
                    } else if (['MV', 'PSV'].includes(nature)) {
                        return {
                            ...row,
                            id_dossier: Number(fileId),
                            id_exercice: Number(selectedExerciceId),
                            id_compte: Number(compteId),
                            montanth_tva: cleanNumber(row.montanth_tva),
                            tva: cleanNumber(row.tva),
                            type: nature,
                            typeTier,
                        };
                    } else if (['PL'].includes(nature)) {
                        return {
                            ...row,
                            id_dossier: Number(fileId),
                            id_exercice: Number(selectedExerciceId),
                            id_compte: Number(compteId),
                            montanth_tva: cleanNumber(row.montanth_tva),
                            tva: cleanNumber(row.tva),
                            type: nature,
                            typeTier,
                        };
                    }
                });

                setCsvData(parsedData);
            },
            error: (error) => {
                console.error("Erreur lors du parsing CSV :", error);
            }
        });

    };

    // Ajout dans la base de données
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!csvFile) {
            toast.error("Veuillez sélectionner un fichier CSV");
            return;
        }
        const parsedData = csvData.map(row => ({
            ...row,
            date_cin: row.date_cin ? formatDateToISO(row.date_cin) : null,
        }));

        if (['SVT', 'ADR', 'AC', 'AI', 'DEB'].includes(nature)) {
            setTraitementWaiting(true);
            setTraitementMsg('Import en cours...');
            startImport(
                '/declaration/comm/importdroitCommAWithProgress',
                { data: parsedData },
                (eventData) => {
                    setTraitementWaiting(false);
                    toast.success(eventData?.message || 'Import terminé');
                    handleClose();
                },
                (errMsg) => {
                    setTraitementWaiting(false);
                    toast.error(errMsg || "Erreur lors de l'import");
                }
            );
            return;
        }

        if (['MV', 'PSV', 'PL'].includes(nature)) {
            setTraitementWaiting(true);
            setTraitementMsg('Import en cours...');
            startImport(
                '/declaration/comm/importdroitCommBWithProgress',
                { data: parsedData },
                (eventData) => {
                    setTraitementWaiting(false);
                    toast.success(eventData?.message || 'Import terminé');
                    handleClose();
                },
                (errMsg) => {
                    setTraitementWaiting(false);
                    toast.error(errMsg || "Erreur lors de l'import");
                }
            );
            return;
        }

        toast.error('Non trouvé');
    };

    // Header pour les SVT, ADR, AC, AI, DEB
    const customHeaders1 = {
        nif: 'NIF',
        nif_representaires: 'NIF Représentaires',
        num_stat: 'Numéro Statistique',
        cin: 'CIN',
        lieu_cin: 'Lieu CIN',
        date_cin: 'Date CIN',
        nature_autres: 'Nature Autres',
        reference: 'Référence',
        raison_sociale: 'Raison Sociale',
        adresse: 'Adresse',
        ville: 'Ville',
        ex_province: 'Ex Province',
        pays: 'Pays',
        nature: 'Nature',
        comptabilisees: 'Comptabilisées',
        versees: 'Versées',
    };

    // Header pour les MV, PSV
    const customHeaders2 = {
        nif: 'NIF',
        nif_representaires: 'NIF Représentaires',
        num_stat: 'Numéro Statistique',
        cin: 'CIN',
        lieu_cin: 'Lieu CIN',
        date_cin: 'Date CIN',
        nature_autres: 'Nature Autres',
        reference: 'Référence',
        raison_sociale: 'Raison Sociale',
        nom_commercial: 'Nom commercial',
        fokontany: 'Fokontany',
        adresse: 'Adresse',
        ville: 'Ville',
        ex_province: 'Ex Province',
        pays: 'Pays',
        nature: 'Nature',
        mode_payement: 'Mode de payement',
        montanth_tva: 'Montant HT',
        tva: 'TVA'
    };

    // Header pour le PL
    const customHeaders3 = {
        nif: 'NIF',
        nif_representaires: 'NIF Représentaires',
        num_stat: 'Numéro Statistique',
        cin: 'CIN',
        lieu_cin: 'Lieu CIN',
        date_cin: 'Date CIN',
        nature_autres: 'Nature Autres',
        reference: 'Référence',
        nom: 'Nom',
        prenom: 'Prenom',
        raison_sociale: 'Nom commercial',
        adresse: 'Adresse',
        ville: 'Ville',
        ex_province: 'Ex Province',
        pays: 'Pays',
        nature: 'Nature',
        montanth_tva: 'Montant HT',
        tva: 'TVA'
    };

    // Header final
    const customHeaders =
        nature === 'SVT' || nature === 'ADR' || nature === 'AC' || nature === 'AI' || nature === 'DEB'
            ? customHeaders1 : nature === 'MV' || nature === 'PSV' ? customHeaders2 : customHeaders3

    // Alignement de texte pour les SVT, ADR, AC, AI, DEB
    const customAligns1 = {
        nif: 'left',
        nif_representaires: 'left',
        num_stat: 'left',
        cin: 'left',
        lieu_cin: 'left',
        date_cin: 'left',
        nature_autres: 'left',
        reference: 'left',
        raison_sociale: 'left',
        adresse: 'left',
        ville: 'left',
        ex_province: 'left',
        pays: 'left',
        nature: 'left',
        comptabilisees: 'right',
        versees: 'right',
    };

    // Alignement de texte pour les SVT, PSV
    const customAligns2 = {
        nif: 'left',
        nif_representaires: 'left',
        num_stat: 'left',
        cin: 'left',
        lieu_cin: 'left',
        date_cin: 'left',
        nature_autres: 'left',
        reference: 'left',
        raison_sociale: 'left',
        nom_commercial: 'left',
        fokontany: 'left',
        adresse: 'left',
        ville: 'left',
        ex_province: 'left',
        pays: 'left',
        nature: 'left',
        mode_payement: 'left',
        montanth_tva: 'right',
        tva: 'right'
    };

    // Alignement de texte pour le PL
    const customAligns3 = {
        nif: 'left',
        nif_representaires: 'left',
        num_stat: 'left',
        cin: 'left',
        lieu_cin: 'left',
        date_cin: 'left',
        nature_autres: 'left',
        reference: 'left',
        nom: 'left',
        prenom: 'left',
        raison_sociale: 'left',
        fokontany: 'left',
        adresse: 'left',
        ville: 'left',
        ex_province: 'left',
        pays: 'left',
        nature: 'left',
        montanth_tva: 'right',
        tva: 'right'
    };

    // Aligenement global
    const customAligns =
        nature === 'SVT' || nature === 'ADR' || nature === 'AC' || nature === 'AI' || nature === 'DEB'
            ? customAligns1 : nature === 'MV' || nature === 'PSV' ? customAligns2 : customAligns3

    // Colonne du Datagrid pour SVT, ADR, AC, AI, et DEB
    const columns1 = csvData.length > 0
        ? Object.keys(csvData[0])
            .filter((key) => key !== 'jour' && key !== 'typeTier')
            .map((key) => {
                const column = {
                    field: key,
                    headerName: customHeaders[key] || key,
                    editable: true,
                    width: customWidths[key] || 120,
                    headerAlign: customAligns[key] || 'left',
                    align: customAligns[key] || 'left',
                };

                if (['comptabilisees', 'versees'].includes(key)) {
                    column.renderCell = (params) => {
                        const raw = params.value;
                        const value = raw === undefined || raw === '' ? 0 : Number(raw);

                        const formatted = value.toLocaleString('fr-FR', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                        });

                        return formatted.replace(/\u202f/g, ' ');
                    };

                    column.renderEditCell = (params) => {
                        const initialValue = params.value !== undefined && params.value !== ''
                            ? Number(params.value)
                            : '';

                        return (
                            <TextField
                                size="small"
                                fullWidth
                                type="text"
                                value={initialValue ?? 0}
                                onChange={(e) => {
                                    const newValue = e.target.value;

                                    const regex = /^\d*(\.\d{0,2})?$/;

                                    if (newValue === '' || regex.test(newValue)) {
                                        params.api.setEditCellValue({
                                            id: params.id,
                                            field: params.field,
                                            value: newValue,
                                        });
                                    }
                                }}
                                style={{ marginBottom: '0px', width: '200px', textAlign: 'right' }}
                                InputProps={{
                                    inputComponent: FormatedInput,
                                    sx: {
                                        '& input': { textAlign: 'left' },
                                    },
                                }}
                            />
                        );
                    };
                }

                if (key === 'date_cin') {
                    column.renderEditCell = (params) => {

                        return (
                            <TextField
                                size="small"
                                type="date"
                                fullWidth
                                value={params.value || ''}
                                onChange={(e) => {
                                    params.api.setEditCellValue({
                                        id: params.id,
                                        field: params.field,
                                        value: e.target.value,
                                    });
                                }}
                                InputLabelProps={{ shrink: true }}
                            />
                        );
                    };
                }

                return column;
            })
        : [];

    // Colonne du Datagrid pour MV, PSV, et PL
    const columns2 = csvData.length > 0
        ? Object.keys(csvData[0])
            .filter((key) => key !== 'jour' && key !== 'typeTier')
            .map((key) => {
                const column = {
                    field: key,
                    headerName: customHeaders[key] || key,
                    editable: true,
                    width: customWidths[key] || 120,
                    headerAlign: customAligns[key] || 'left',
                    align: customAligns[key] || 'left',
                };

                if (['montanth_tva', 'tva'].includes(key)) {
                    column.renderCell = (params) => {
                        const raw = params.value;
                        const value = raw === undefined || raw === '' ? 0 : Number(raw);

                        const formatted = value.toLocaleString('fr-FR', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                        });

                        return formatted.replace(/\u202f/g, ' ');
                    };

                    column.renderEditCell = (params) => {
                        const initialValue = params.value !== undefined && params.value !== ''
                            ? Number(params.value)
                            : '';

                        return (
                            <TextField
                                size="small"
                                fullWidth
                                type="text"
                                value={initialValue ?? 0}
                                onChange={(e) => {
                                    const newValue = e.target.value;

                                    const regex = /^\d*(\.\d{0,2})?$/;

                                    if (newValue === '' || regex.test(newValue)) {
                                        params.api.setEditCellValue({
                                            id: params.id,
                                            field: params.field,
                                            value: newValue,
                                        });
                                    }
                                }}
                                style={{ marginBottom: '0px', width: '200px', textAlign: 'right' }}
                                InputProps={{
                                    inputComponent: FormatedInput,
                                    sx: {
                                        '& input': { textAlign: 'left' },
                                    },
                                }}
                            />
                        );
                    };
                }

                if (key === 'date_cin') {
                    column.renderEditCell = (params) => {

                        return (
                            <TextField
                                size="small"
                                type="date"
                                fullWidth
                                value={params.value || ''}
                                onChange={(e) => {
                                    params.api.setEditCellValue({
                                        id: params.id,
                                        field: params.field,
                                        value: e.target.value,
                                    });
                                }}
                                InputLabelProps={{ shrink: true }}
                            />
                        );
                    };
                }

                return column;
            })
        : [];

    const columns =
        nature === 'SVT' || nature === 'ADR' || nature === 'AC' || nature === 'AI' || nature === 'DEB'
            ? columns1 : nature === 'MV' || nature === 'PSV' || nature === 'PL' ? columns2 : '';

    //Télechargement du modèle
    const handleDownloadModel = () => {
        const fileUrl =
            nature === 'SVT' || nature === 'ADR' || nature === 'AC' || nature === 'AI' || nature === 'DEB' ?
                '/modeleImport/modeleImportDCommA.csv' :
                nature === 'MV' || nature === 'PSV' ?
                    '/modeleImport/modeleImportDCommB.csv' :
                    nature === 'PL' ?
                        '/modeleImport/modeleImportDCommPL.csv' : '';
        const link = document.createElement('a');
        link.href = fileUrl;
        link.download = `ModeleImportDCom${nature}`;
        link.click();
    }

    return (
        <form onSubmit={handleSubmit}>
            <BootstrapDialog
                onClose={handleClose}
                aria-labelledby="import-dialog-title"
                open={true}
                maxWidth='md'
            // fullWidth
            >
                <DialogTitle
                    id="import-dialog-title"
                    sx={{
                        pl: 3, pr: 5, py: 2,
                        fontWeight: 'bold',
                        fontSize: 18,
                        backgroundColor: 'transparent',
                    }}
                >
                    Importation CSV des {textTitle.toLowerCase()}
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

                <DialogContent>
                    <ImportProgressBar
                        isVisible={traitementWaiting || isImporting}
                        message={traitementMsg || message || 'Import en cours...'}
                        progress={progress}
                        variant="determinate"
                    />
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
                            sx={{ columnGap: 5 }}
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

                        {csvData.length > 0 && (
                            <Stack
                                width={"100%"}
                                height={"400px"}
                                style={{
                                    marginLeft: "0px",
                                    marginTop: "20px",
                                }}>
                                <DataGrid
                                    sx={{
                                        ...DataGridStyle.sx,
                                        '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': {
                                            outline: 'none',
                                            border: 'none',
                                        },
                                        '& .MuiInputBase-root': {
                                            boxShadow: 'none',
                                            border: 'none',
                                        },
                                        '& .MuiOutlinedInput-notchedOutline': {
                                            border: 'none',
                                        },
                                        '& .MuiDataGrid-columnHeaders': {
                                            backgroundColor: initial.theme,
                                            color: 'white',
                                            fontWeight: 'bold',
                                        },
                                    }}
                                    rows={csvData.map((row, index) => ({ id: index, ...row }))}
                                    columns={columns}
                                    pageSize={5}
                                    disableRowSelectionOnClick
                                    processRowUpdate={handleRowUpdate}
                                    experimentalFeatures={{ newEditingApi: true }}
                                    rowHeight={DataGridStyle.rowHeight}
                                    columnHeaderHeight={DataGridStyle.columnHeaderHeight}
                                    editMode='row'
                                    pageSizeOptions={[5, 10, 20, 30, 50, 100]}
                                    pagination={DataGridStyle.pagination}
                                    columnVisibilityModel={{
                                        id: false,
                                        id_dossier: false,
                                        id_exercice: false,
                                        id_compte: false,
                                        type: false
                                    }}
                                />
                            </Stack>
                        )}
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
                        onClick={handleClose}
                    >
                        Annuler
                    </Button>
                    <Button
                        type="submit"
                        onClick={handleSubmit}
                        style={{
                            backgroundColor: initial.theme,
                            color: 'white',
                            width: "100px",
                            textTransform: 'none',
                            outline: 'none'
                        }}
                    >
                        Enregistrer
                    </Button>
                </DialogActions>
            </BootstrapDialog>
        </form>
    );
};

export default PopupImportComma;
