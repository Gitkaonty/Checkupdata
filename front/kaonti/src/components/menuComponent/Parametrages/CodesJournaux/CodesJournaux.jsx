import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography, Stack, IconButton, FormControl, InputLabel, Select, MenuItem, Input, FormHelperText, Chip, Autocomplete, TextField } from '@mui/material';
import Tooltip from '@mui/material/Tooltip';
import { InfoFileStyle } from '../../../componentsTools/InfosFileStyle';
import { useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import { IoMdTrash } from "react-icons/io";
import { TbPlaylistAdd } from "react-icons/tb";
import { FaRegPenToSquare } from "react-icons/fa6";
import { VscClose } from "react-icons/vsc";
import { TfiSave } from "react-icons/tfi";
import { MdOutlineFileUpload } from "react-icons/md";
import PopupConfirmDelete from '../../../componentsTools/popupConfirmDelete';
import PopupTestSelectedFile from '../../../componentsTools/popupTestSelectedFile';
import PopupImportCodeJournaux from '../../administration/import/PopupImportCodeJournaux';
import { init } from '../../../../../init';
import { DataGridStyle } from '../../../componentsTools/DatagridToolsStyle';
import { DataGrid, frFR, GridRowEditStopReasons, GridRowModes, useGridApiRef } from '@mui/x-data-grid';
import QuickFilter from '../../../componentsTools/DatagridToolsStyle';
import useAuth from '../../../../hooks/useAuth';
import { jwtDecode } from 'jwt-decode';
import axios from '../../../../../config/axios';
import toast from 'react-hot-toast';
import { useFormik } from 'formik';
import * as Yup from "yup";
import { AiFillBank } from "react-icons/ai";
import { SiCashapp } from "react-icons/si";
import { BsArrow90DegUp } from "react-icons/bs";
import { BsArrow90DegDown } from "react-icons/bs";
import { BsRecord } from "react-icons/bs";
import { MdOutlineSyncLock } from "react-icons/md";
import usePermission from '../../../../hooks/usePermission';
import useAxiosPrivate from '../../../../../config/axiosPrivate';

export default function ParamCodeJournalComponent() {
    const apiRef = useGridApiRef();
    const { canAdd, canModify, canDelete, canView } = usePermission();
    const axiosPrivate = useAxiosPrivate();
    const initial = init[0];
    //récupération information du dossier sélectionné
    const { id } = useParams();
    const [fileId, setFileId] = useState(0);
    const [fileInfos, setFileInfos] = useState('');
    const [noFile, setNoFile] = useState(false);
    const [listeCodeJournaux, setListeCodeJournaux] = useState([]);

    const [selectedRow, setSelectedRow] = useState([]);

    const [selectedRowId, setSelectedRowId] = useState([]);
    const [rowModesModel, setRowModesModel] = useState({});
    const [disableModifyBouton, setDisableModifyBouton] = useState(true);
    const [disableCancelBouton, setDisableCancelBouton] = useState(true);
    const [disableSaveBouton, setDisableSaveBouton] = useState(true);
    const [disableDeleteBouton, setDisableDeleteBouton] = useState(true);
    const [disableAddRowBouton, setDisableAddRowBouton] = useState(false);
    const [openImportDialog, setOpenImportDialog] = useState(false);

    const [editableRow, setEditableRow] = useState(true);
    const [openDialogDeleteRow, setOpenDialogDeleteRow] = useState(false);
    const [listeCptAssocie, setListeCptAssocie] = useState([]);
    const [pc, setPc] = useState([]);
    const [codeValidationColor, setCodeValidationColor] = useState('transparent');
    const [libelleValidationColor, setLibelleValidationColor] = useState('transparent');
    const [typeValidationColor, setTypeValidationColor] = useState('transparent');
    const [compteAssocieValidationColor, setCompteAssocieValidationColor] = useState('transparent');
    const [nifValidationColor, setNifValidationColor] = useState('transparent');
    const [statValidationColor, setStatValidationColor] = useState('transparent');
    const [adresseValidationColor, setAdresseValidationColor] = useState('transparent');
    //récupération infos de connexion
    const { auth } = useAuth();
    const decoded = auth?.accessToken ? jwtDecode(auth.accessToken) : undefined;
    const compteId = decoded.UserInfo.compteId || null;
    const navigate = useNavigate();

    //sauvegarde de la nouvelle ligne ajoutée
    const formikNewCodeJournal = useFormik({
        initialValues: {
            idCompte: compteId,
            idDossier: fileId,
            idCode: 0,
            code: '',
            libelle: '',
            type: '',
            compteassocie: '',
            nif: '',
            stat: '',
            adresse: ''
        },
        validationSchema: Yup.object({
            code: Yup.string().required("Veuillez ajouter un code journal"),
            libelle: Yup.string().required("Veuillez ajouter un libellé"),
            type: Yup.string().required("Veuillez choisir un type de code journal"),
            compteassocie: Yup.string()
                .when('type', {
                    is: (value) => value === 'BANQUE' || value === 'CAISSE',
                    then: () => Yup.string().required("Veuillez choisir un compte à associer au code journal"),
                    otherwise: () => Yup.string().notRequired(),
                }),
        }),
        validateOnChange: false,
        validateOnBlur: true,
    });

    //récupérer les informations du dossier sélectionné
    useEffect(() => {
        //tester si la page est renvoyer par useNavigate
        const navigationEntries = performance.getEntriesByType('navigation');
        let idFile = 0;

        if (navigationEntries.length > 0) {
            const navigationType = navigationEntries[0].type;
            if (navigationType === 'reload') {
                const idDossier = sessionStorage.getItem("fileId");
                setFileId(idDossier);
                idFile = idDossier;
            } else {
                sessionStorage.setItem('fileId', id);
                setFileId(id);
                idFile = id;
            }
        }
        GetInfosIdDossier(idFile);
    }, []);

    const GetInfosIdDossier = (id) => {
        axios.get(`/home/FileInfos/${id}`).then((response) => {
            const resData = response.data;

            if (resData.state) {
                setFileInfos(resData.fileInfos[0]);
                setNoFile(false);
            } else {
                setFileInfos([]);
                setNoFile(true);
            }
        })
    }

    const sendToHome = (value) => {
        setNoFile(!value);
        navigate('/tab/home');
    }

    //récupération données liste code journaux
    const GetListeCodeJournaux = (id) => {
        axios.get(`/paramCodeJournaux/listeCodeJournaux/${id}`).then((response) => {
            const resData = response.data;
            if (resData.state) {
                setListeCodeJournaux(resData.list);
            } else {
                setListeCodeJournaux([]);
                toast.error(resData.msg);
            }
        })
    }

    //Récupération du plan comptable
    const showPc = () => {
        axiosPrivate.post(`/paramPlanComptable/pc`, { fileId: Number(fileId), compteId: Number(compteId) }).then((response) => {
            const resData = response.data;
            console.log('[showPc] Réponse reçue:', resData);
            if (resData.state) {
                console.log('[showPc] Plan comptable chargé, nombre de comptes:', resData.liste?.length);
                setPc(resData.liste);
            } else {
                console.error('[showPc] Erreur lors du chargement:', resData.msg);
                toast.error(resData.msg);
            }
        }).catch((error) => {
            console.error('[showPc] Erreur réseau:', error);
            toast.error('Erreur lors du chargement du plan comptable');
        });
    }

    useEffect(() => {
        if (canView && fileId && compteId) {
            showPc();
            GetListeCodeJournaux(fileId);
        }
    }, [fileId, compteId]);

    //Entete du tableau
    const type = [
        { value: 'ACHAT', label: 'ACHAT' },
        { value: 'BANQUE', label: 'BANQUE' },
        { value: 'CAISSE', label: 'CAISSE' },
        { value: 'OD', label: 'OD' },
        { value: 'RAN', label: 'RAN' },
        { value: 'VENTE', label: 'VENTE' },
    ];

    //liste compte banque et caisse
    const recupListeCptBanqueCaisse = (typeTreso) => {
        console.log('[recupListeCptBanqueCaisse] Type sélectionné:', typeTreso);
        console.log('[recupListeCptBanqueCaisse] Plan comptable (pc) length:', pc?.length);

        const listBank = pc?.filter((row) => row.compte.startsWith('512') || row.compte.startsWith('52'));
        const listCash = pc?.filter((row) => row.compte.startsWith('53'));

        console.log('[recupListeCptBanqueCaisse] Comptes BANQUE (512 ou 52) trouvés:', listBank?.length);
        console.log('[recupListeCptBanqueCaisse] Comptes CAISSE (53) trouvés:', listCash?.length);

        formikNewCodeJournal.setFieldValue("type", typeTreso);

        if (typeTreso === 'BANQUE') {
            setListeCptAssocie(listBank);
            console.log('[recupListeCptBanqueCaisse] Liste BANQUE définie:', listBank);
            setCompteAssocieValidationColor('#F6D6D6');
            // Champs manuels (vides)
            formikNewCodeJournal.setFieldValue('nif', '');
            formikNewCodeJournal.setFieldValue('stat', '');
            formikNewCodeJournal.setFieldValue('adresse', '');
        } else if (typeTreso === 'CAISSE') {
            setListeCptAssocie(listCash);
            console.log('[recupListeCptBanqueCaisse] Liste CAISSE définie:', listCash);
            setCompteAssocieValidationColor('#F6D6D6');
            // Ces champs doivent rester vides
            formikNewCodeJournal.setFieldValue('nif', '');
            formikNewCodeJournal.setFieldValue('stat', '');
            formikNewCodeJournal.setFieldValue('adresse', '');
        } else {
            // Pour les autres types
            setListeCptAssocie([]);
            setCompteAssocieValidationColor('transparent');
            formikNewCodeJournal.setFieldValue("compteassocie", '');
            formikNewCodeJournal.setFieldValue('nif', '');
            formikNewCodeJournal.setFieldValue('stat', '');
            formikNewCodeJournal.setFieldValue('adresse', '');
        }
    };


    const CodeJournauxColumnHeader = [
        {
            field: 'code',
            headerName: 'Code',
            type: 'string',
            sortable: true,
            flex: 1,
            headerAlign: 'left',
            align: 'left',
            headerClassName: 'HeaderbackColor',
            editable: editableRow,
            renderEditCell: (params) => {

                return (
                    <FormControl fullWidth style={{ height: '100%' }}>
                        <Input
                            style={{
                                height: '100%', alignItems: 'center',
                                outline: 'none',
                                backgroundColor: codeValidationColor,
                            }}
                            type="text"
                            value={formikNewCodeJournal.values.code}
                            onChange={(e) => { formikNewCodeJournal.setFieldValue('code', e.target.value) }}
                            label="code"
                            disableUnderline={true}
                        />

                        <FormHelperText
                            style={{
                                color: 'red',
                                marginLeft: 0,
                                fontSize: "12px",
                            }}
                        >
                            {formikNewCodeJournal.errors.code && formikNewCodeJournal.touched.code && formikNewCodeJournal.errors.code}
                        </FormHelperText>
                    </FormControl>
                );
            },
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
            editable: editableRow,
            renderEditCell: (params) => {
                return (
                    <FormControl fullWidth style={{ height: '100%' }}>
                        <Input
                            style={{
                                height: '100%', alignItems: 'center',
                                outline: 'none',
                                backgroundColor: libelleValidationColor
                            }}
                            type="text"
                            value={formikNewCodeJournal.values.libelle}
                            onChange={(e) => formikNewCodeJournal.setFieldValue('libelle', e.target.value)}
                            label="libelle"
                            disableUnderline={true}
                        />

                        <FormHelperText
                            style={{
                                color: 'red',
                                marginLeft: 0,
                                fontSize: "12px",
                            }}
                        >
                            {formikNewCodeJournal.errors.libelle && formikNewCodeJournal.touched.libelle && formikNewCodeJournal.errors.libelle}
                        </FormHelperText>
                    </FormControl>
                );
            },
        },
        {
            field: 'type',
            headerName: 'Type',
            type: 'singleSelect',
            valueOptions: type.map((code) => code.value),
            sortable: true,
            flex: 1.5,
            headerAlign: 'left',
            align: 'left',
            headerClassName: 'HeaderbackColor',
            editable: editableRow,
            valueFormatter: (params) => {
                const selectedType = type.find((option) => option.value === params.value);
                return selectedType ? selectedType.label : params.value;
            },

            renderEditCell: (params) => {
                return (
                    <FormControl fullWidth>
                        <InputLabel><em>Choisir...</em></InputLabel>
                        <Select
                            style={{ backgroundColor: typeValidationColor }}
                            value={formikNewCodeJournal.values.type}
                            onChange={(e) => recupListeCptBanqueCaisse(e.target.value)}
                            label="Type"
                        >
                            {type?.map((option) => (
                                <MenuItem key={option.value} value={option.value}>
                                    {option.value}
                                </MenuItem>
                            ))}
                        </Select>
                        <FormHelperText
                            style={{
                                color: 'red',
                                marginLeft: 0,
                                fontSize: "12px",
                            }}
                        >
                            {formikNewCodeJournal.errors.type && formikNewCodeJournal.touched.type && formikNewCodeJournal.errors.type}
                        </FormHelperText>
                    </FormControl>
                );
            },
            renderCell: (params) => {
                if (params.value === 'BANQUE') {
                    return (
                        <Stack width={'100%'} style={{ display: 'flex', alignContent: 'center', alignItems: 'center', justifyContent: 'center' }}>
                            {/* <div style={{
                                width: 90,             
                                height: 25,            
                                backgroundColor: '#3D5300', 
                                borderRadius: 15,        
                                display: 'flex',            
                                justifyContent: 'center',   
                                alignItems: 'center',  
                                color: 'white'     
                            }}>
                                {params.value}
                            </div> */}

                            <Chip
                                icon={<AiFillBank style={{ color: 'white', width: 18, height: 18, marginLeft: 10 }} />}
                                label={params.value}

                                style={{
                                    width: "100%",
                                    display: 'flex', // ou block, selon le rendu souhaité
                                    justifyContent: 'space-between',
                                    backgroundColor: '#3D5300',
                                    color: 'white'
                                }}
                            />
                        </Stack>
                    )
                }

                if (params.value === 'CAISSE') {
                    return (
                        <Stack width={'100%'} style={{ display: 'flex', alignContent: 'center', alignItems: 'center', justifyContent: 'center' }}>
                            {/* <div style={{
                                width: 90,             
                                height: 25,            
                                backgroundColor: '#798645', 
                                borderRadius: 15,        
                                display: 'flex',            
                                justifyContent: 'center',   
                                alignItems: 'center',
                                color: 'white'       
                            }}>
                                {params.value}
                            </div> */}

                            <Chip
                                icon={<SiCashapp style={{ color: 'white', width: 18, height: 18, marginLeft: 10 }} />}
                                label={params.value}

                                style={{
                                    width: "100%",
                                    display: 'flex', // ou block, selon le rendu souhaité
                                    justifyContent: 'space-between',
                                    backgroundColor: '#798645',
                                    color: 'white'
                                }}
                            />
                        </Stack>
                    )
                }

                if (params.value === 'ACHAT') {
                    return (
                        <Stack width={'100%'} style={{ display: 'flex', alignContent: 'center', alignItems: 'center', justifyContent: 'center' }}>
                            {/* <div style={{
                                width: 90,             
                                height: 25,            
                                backgroundColor: '#074799', 
                                borderRadius: 15,        
                                display: 'flex',            
                                justifyContent: 'center',   
                                alignItems: 'center',
                                color: 'white'       
                            }}>
                                {params.value}
                            </div> */}

                            <Chip
                                icon={<BsArrow90DegUp style={{ color: 'white', width: 18, height: 18, marginLeft: 10 }} />}
                                label={params.value}

                                style={{
                                    width: "100%",
                                    display: 'flex', // ou block, selon le rendu souhaité
                                    justifyContent: 'space-between',
                                    backgroundColor: '#074799',
                                    color: 'white'
                                }}
                            />
                        </Stack>
                    )
                }
                if (params.value === 'VENTE') {
                    return (
                        <Stack width={'100%'} style={{ display: 'flex', alignContent: 'center', alignItems: 'center', justifyContent: 'center' }}>
                            {/* <div style={{
                                width: 90,             
                                height: 25,            
                                backgroundColor: '#FFA62F', 
                                borderRadius: 15,        
                                display: 'flex',            
                                justifyContent: 'center',   
                                alignItems: 'center',
                                color: 'white'       
                            }}>
                                {params.value}
                            </div> */}

                            <Chip
                                icon={<BsArrow90DegDown style={{ color: 'white', width: 18, height: 18, marginLeft: 10 }} />}
                                label={params.value}

                                style={{
                                    width: "100%",
                                    display: 'flex', // ou block, selon le rendu souhaité
                                    justifyContent: 'space-between',
                                    backgroundColor: '#67AE6E',
                                    color: 'white'
                                }}
                            />
                        </Stack>
                    )
                }
                if (params.value === 'OD') {
                    return (
                        <Stack width={'100%'} style={{ display: 'flex', alignContent: 'center', alignItems: 'center', justifyContent: 'center' }}>
                            {/* <div style={{
                                width: 90,             
                                height: 25,            
                                backgroundColor: '#0B8494', 
                                borderRadius: 15,        
                                display: 'flex',            
                                justifyContent: 'center',   
                                alignItems: 'center',
                                color: 'white'       
                            }}>
                                {params.value}
                            </div> */}

                            <Chip
                                icon={<BsRecord style={{ color: 'white', width: 18, height: 18, marginLeft: 10 }} />}
                                label={params.value}

                                style={{
                                    width: "100%",
                                    display: 'flex', // ou block, selon le rendu souhaité
                                    justifyContent: 'space-between',
                                    backgroundColor: '#0B8494',
                                    color: 'white'
                                }}
                            />
                        </Stack>
                    )
                }
                if (params.value === 'RAN') {
                    return (
                        <Stack width={'100%'} style={{ display: 'flex', alignContent: 'center', alignItems: 'center', justifyContent: 'center' }}>
                            <Chip
                                icon={<MdOutlineSyncLock style={{ color: 'white', width: 18, height: 18, marginLeft: 10 }} />}
                                label={params.value}

                                style={{
                                    width: "100%",
                                    display: 'flex', // ou block, selon le rendu souhaité
                                    justifyContent: 'space-between',
                                    backgroundColor: '#FFA62F',
                                    color: 'white'
                                }}
                            />
                        </Stack>
                    )
                }
            }
        },
        {
            field: 'compteassocie',
            headerName: 'Compte associé',
            type: 'singleSelect',
            valueOptions: listeCptAssocie.map((cpt) => cpt.compte),
            sortable: true,
            flex: 3,
            headerAlign: 'left',
            align: 'left',
            headerClassName: 'HeaderbackColor',
            editable: true,
            valueFormatter: (params) => {
                const selectedType = listeCptAssocie.find((option) => option.compte === params.value);
                return selectedType ? `${selectedType.compte} ${selectedType.libelle}` : params.value;
            },
            renderCell: (params) => (
                <span style={{ color: (params.row.type !== 'CAISSE' && params.row.type !== 'BANQUE') ? '#999' : '#000' }}>
                    {params.value}
                </span>
            ),
            renderEditCell: (params) => {
                const listBank = pc.filter(row => row.compte.startsWith('512') || row.compte.startsWith('52'));
                const listCash = pc.filter(row => row.compte.startsWith('53'));

                const isEditable = formikNewCodeJournal.values.type === 'BANQUE' || formikNewCodeJournal.values.type === 'CAISSE';

                const usedComptes = params.api
                    .getAllRowIds()
                    .map(id => params.api.getRow(id))
                    .filter(row => row.id !== params.id)
                    .map(row => row.compteassocie)
                    .filter(Boolean);

                let availableOptions = [];
                if (formikNewCodeJournal.values.type === 'BANQUE') {
                    availableOptions = listBank.filter(option => !usedComptes.includes(option.compte));
                } else if (formikNewCodeJournal.values.type === 'CAISSE') {
                    availableOptions = listCash.filter(option => !usedComptes.includes(option.compte));
                }

                if (params.value && !availableOptions.find(opt => opt.compte === params.value)) {
                    const current = (formikNewCodeJournal.values.type === 'BANQUE' ? listBank : listCash)
                        .find(opt => opt.compte === params.value);
                    if (current) availableOptions = [...availableOptions, current];
                }

                const currentValue = availableOptions.find(opt => opt.compte === params.value) || null;

                return (
                    <Autocomplete
                        sx={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}
                        key={params.id}
                        options={availableOptions}
                        autoHighlight
                        openOnFocus
                        getOptionLabel={(option) =>
                            option ? `${option.compte} ${option.libelle}` : ''
                        }
                        isOptionEqualToValue={(option, value) =>
                            option.compte === value?.compte
                        }
                        value={currentValue}
                        onChange={(e, newValue) => {
                            const newCompte = newValue ? newValue.compte : null;
                            params.api.setEditCellValue(
                                { id: params.id, field: 'compteassocie', value: newCompte },
                                e
                            );
                            formikNewCodeJournal.setFieldValue('compteassocie', newCompte)
                        }}
                        noOptionsText="Aucun compte disponible"
                        disabled={!isEditable}
                        renderInput={(paramsInput) => (
                            <TextField
                                {...paramsInput}
                                variant="standard"
                                placeholder="Choisir un compte"
                                fullWidth
                                InputProps={{
                                    ...paramsInput.InputProps,
                                    disableUnderline: true,
                                }}
                                style={{
                                    backgroundColor: isEditable ? compteAssocieValidationColor : '#f0f0f0'
                                }}
                            />
                        )}
                    />
                );
            }
        },

        {
            field: 'nif',
            headerName: 'NIF',
            type: 'string',
            sortable: true,
            flex: 3,
            headerAlign: 'left',
            align: 'left',
            headerClassName: 'HeaderbackColor',
            editable: true,
            renderEditCell: (params) => {
                const isEditable = formikNewCodeJournal.values.type === 'BANQUE';
                return (
                    <FormControl fullWidth style={{ height: '100%' }}>
                        <Input
                            style={{
                                height: '100%', alignItems: 'center',
                                outline: 'none',
                                backgroundColor: isEditable ? nifValidationColor : '#f0f0f0',
                            }}
                            type="text"
                            value={formikNewCodeJournal.values.nif}
                            onChange={(e) => formikNewCodeJournal.setFieldValue('nif', e.target.value)}
                            label="nif"
                            disableUnderline={true}
                            disabled={!isEditable}
                        />

                        <FormHelperText
                            style={{
                                color: 'red',
                                marginLeft: 0,
                                fontSize: "12px",
                            }}
                        >
                            {formikNewCodeJournal.errors.nif && formikNewCodeJournal.touched.nif && formikNewCodeJournal.errors.nif}
                        </FormHelperText>
                    </FormControl>
                );
            },
        },
        {
            field: 'stat',
            headerName: 'STAT',
            type: 'string',
            sortable: true,
            flex: 3,
            headerAlign: 'left',
            align: 'left',
            headerClassName: 'HeaderbackColor',
            editable: true,
            renderEditCell: (params) => {
                const isEditable = formikNewCodeJournal.values.type === 'BANQUE';
                return (
                    <FormControl fullWidth style={{ height: '100%' }}>
                        <Input
                            style={{
                                height: '100%', alignItems: 'center',
                                outline: 'none',
                                backgroundColor: isEditable ? statValidationColor : '#f0f0f0', // gris si non éditable
                            }}
                            type="text"
                            value={formikNewCodeJournal.values.stat}
                            onChange={(e) => formikNewCodeJournal.setFieldValue('stat', e.target.value)}
                            label="stat"
                            disableUnderline={true}
                            disabled={!isEditable} // Désactiver complètement si non éditable
                        />

                        <FormHelperText
                            style={{
                                color: 'red',
                                marginLeft: 0,
                                fontSize: "12px",
                            }}
                        >
                            {formikNewCodeJournal.errors.libelle && formikNewCodeJournal.touched.libelle && formikNewCodeJournal.errors.libelle}
                        </FormHelperText>
                    </FormControl>
                );
            },
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
            editable: true,
            renderEditCell: (params) => {
                const isEditable = formikNewCodeJournal.values.type === 'BANQUE';
                return (
                    <FormControl fullWidth style={{ height: '100%' }}>
                        <Input
                            style={{
                                height: '100%', alignItems: 'center',
                                outline: 'none',
                                backgroundColor: isEditable ? adresseValidationColor : '#f0f0f0', // gris si non éditable
                            }}
                            type="text"
                            value={formikNewCodeJournal.values.adresse}
                            onChange={(e) => formikNewCodeJournal.setFieldValue('adresse', e.target.value)}
                            label="adresse"
                            disableUnderline={true}
                            disabled={!isEditable} // Désactiver complètement si non éditable
                        />

                        <FormHelperText
                            style={{
                                color: 'red',
                                marginLeft: 0,
                                fontSize: "12px",
                            }}
                        >
                            {formikNewCodeJournal.errors.adresse && formikNewCodeJournal.touched.adresse && formikNewCodeJournal.errors.adresse}
                        </FormHelperText>
                    </FormControl>
                );
            },
        },
    ];

    //gestion ajout + modification + suppression ligne dans le tableau liste code journaux
    const saveSelectedRow = (ids) => {
        if (ids.length === 1) {
            setSelectedRowId(ids);
            setDisableModifyBouton(false);
            setDisableSaveBouton(true);
            setDisableCancelBouton(false);
            setDisableDeleteBouton(false);
        } else {
            setSelectedRowId([]);
            setDisableModifyBouton(true);
            setDisableSaveBouton(false);
            setDisableCancelBouton(true);
            setDisableDeleteBouton(true);
        }
    }

    const handleRowEditStop = (params, event) => {
        if (params.reason === GridRowEditStopReasons.rowFocusOut) {
            event.defaultMuiPrevented = true;
        }
    };

    const handleEditClick = (id) => () => {
        //réinitialiser les couleurs des champs
        setCodeValidationColor('transparent');
        setLibelleValidationColor('transparent');
        setTypeValidationColor('transparent');
        setCompteAssocieValidationColor('transparent');
        setNifValidationColor('transparent');
        setStatValidationColor('transparent');
        setAdresseValidationColor('transparent');

        //charger dans le formik les données de la ligne
        const selectedRowInfos = listeCodeJournaux?.filter((item) => item.id === id[0]);

        const listBank = pc?.filter((row) => row.compte.startsWith('512'));
        const listCash = pc?.filter((row) => row.compte.startsWith('53'));

        if (selectedRowInfos[0].type === 'BANQUE') {
            setListeCptAssocie(listBank);
        } else if (selectedRowInfos[0].type === 'CAISSE') {
            setListeCptAssocie(listCash);
        } else {
            setListeCptAssocie([]);
        }

        formikNewCodeJournal.setFieldValue("idCode", id);
        formikNewCodeJournal.setFieldValue("idDossier", fileId);
        formikNewCodeJournal.setFieldValue("idCompte", compteId);
        formikNewCodeJournal.setFieldValue("code", selectedRowInfos[0].code);
        formikNewCodeJournal.setFieldValue("libelle", selectedRowInfos[0].libelle);
        formikNewCodeJournal.setFieldValue("type", selectedRowInfos[0].type);
        formikNewCodeJournal.setFieldValue("compteassocie", selectedRowInfos[0].compteassocie);
        // Renseigner nif/stat/adresse en fonction du type
        if (selectedRowInfos[0].type === 'BANQUE') {
            formikNewCodeJournal.setFieldValue('nif', selectedRowInfos[0].nif || '');
            formikNewCodeJournal.setFieldValue('stat', selectedRowInfos[0].stat || '');
            formikNewCodeJournal.setFieldValue('adresse', selectedRowInfos[0].adresse || '');
        } else {
            formikNewCodeJournal.setFieldValue('nif', '');
            formikNewCodeJournal.setFieldValue('stat', '');
            formikNewCodeJournal.setFieldValue('adresse', '');
        }

        setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.Edit } });
        setDisableSaveBouton(false);
        //toast.error(formikNewCodeJournal.isValid);
    };

    const handleSaveClick = (id) => () => {
        let saveBoolCode = false;
        let saveBoolLibelle = false;
        let saveBoolType = false;
        let saveBoolCompteAssocie = false;
        let saveBoolNif = false;
        let saveBoolStat = false;
        let saveBoolAdresse = false;

        setLibelleValidationColor('transparent');
        setTypeValidationColor('transparent');
        setCompteAssocieValidationColor('transparent');
        setNifValidationColor('transparent');
        setStatValidationColor('transparent');
        setAdresseValidationColor('transparent');

        if (formikNewCodeJournal.values.code === '') {
            setCodeValidationColor('#F6D6D6');
            saveBoolCode = false;
        } else {
            setCodeValidationColor('transparent');
            saveBoolCode = true;
        }

        if (formikNewCodeJournal.values.libelle === '') {
            setLibelleValidationColor('#F6D6D6');
            saveBoolLibelle = false;
        } else {
            setLibelleValidationColor('transparent');
            saveBoolLibelle = true;
        }

        if (formikNewCodeJournal.values.type === '') {
            setTypeValidationColor('#F6D6D6');
            saveBoolType = false;
        } else {
            setTypeValidationColor('transparent');
            saveBoolType = true;
        }

        if (formikNewCodeJournal.values.type === 'BANQUE' || formikNewCodeJournal.values.type === 'CAISSE') {
            if (formikNewCodeJournal.values.compteassocie === '') {
                setCompteAssocieValidationColor('#F6D6D6');
                saveBoolCompteAssocie = false;
            } else {
                setCompteAssocieValidationColor('transparent');
                saveBoolCompteAssocie = true;
            }
        } else {
            setCompteAssocieValidationColor('transparent');
            saveBoolCompteAssocie = true;
        }

        if (formikNewCodeJournal.values.type === 'BANQUE') {
            // Tous ces champs obligatoires
            if (formikNewCodeJournal.values.nif === '') {
                setNifValidationColor('#F6D6D6');
                saveBoolNif = false;
            } else {
                setNifValidationColor('transparent');
                saveBoolNif = true;
            }

            if (formikNewCodeJournal.values.stat === '') {
                setStatValidationColor('#F6D6D6');
                saveBoolStat = false;
            } else {
                setStatValidationColor('transparent');
                saveBoolStat = true;
            }

            if (formikNewCodeJournal.values.adresse === '') {
                setAdresseValidationColor('#F6D6D6');
                saveBoolAdresse = false;
            } else {
                setAdresseValidationColor('transparent');
                saveBoolAdresse = true;
            }

        } else if (formikNewCodeJournal.values.type === 'CAISSE') {
            // Juste compte associé obligatoire, les autres ignorés
            setNifValidationColor('transparent');
            setStatValidationColor('transparent');
            setAdresseValidationColor('transparent');
            saveBoolNif = true;
            saveBoolStat = true;
            saveBoolAdresse = true;
        } else {
            // Pour tous les autres types : tout est vide
            formikNewCodeJournal.setFieldValue('nif', '');
            formikNewCodeJournal.setFieldValue('stat', '');
            formikNewCodeJournal.setFieldValue('adresse', '');
            formikNewCodeJournal.setFieldValue('compteassocie', '');
            setNifValidationColor('transparent');
            setStatValidationColor('transparent');
            setAdresseValidationColor('transparent');
            saveBoolNif = true;
            saveBoolStat = true;
            saveBoolAdresse = true;
        }

        if (saveBoolCode && saveBoolLibelle && saveBoolType && saveBoolCompteAssocie && saveBoolNif && saveBoolStat && saveBoolAdresse) {
            // Vérification locale de doublon de code (hors ligne courante)
            const currentId = Array.isArray(id) ? id[0] : id;
            const newCode = String(formikNewCodeJournal.values.code || '').trim();
            const hasDuplicate = listeCodeJournaux.some(row => String(row.code).trim() === newCode && row.id !== currentId);
            if (hasDuplicate) {
                toast.error('Ce code journal existe déjà.');
                return;
            }

            setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.View } });
            axiosPrivate.post(`/paramCodeJournaux/codeJournauxAdd`, formikNewCodeJournal.values).then((response) => {
                const resData = response.data;
                if (resData.state) {
                    setDisableAddRowBouton(false);
                    setDisableSaveBouton(true);

                    formikNewCodeJournal.resetForm();
                    GetListeCodeJournaux(fileId);
                    toast.success(resData.msg);
                } else {
                    toast.error(resData.msg);
                }
            });
        } else {
            toast.error('Les champs en surbrillances sont obligatoires');
        }
    };

    const handleOpenDialogConfirmDeleteAssocieRow = () => {
        setOpenDialogDeleteRow(true);
        setDisableAddRowBouton(false);
    }

    const deleteRow = (value) => {
        if (value === true) {
            if (selectedRowId.length === 1) {
                const idToDelete = selectedRowId[0];
                if (idToDelete < 0) {
                    setOpenDialogDeleteRow(false);
                    setListeCodeJournaux(listeCodeJournaux.filter((row) => row.id !== idToDelete));
                    toast.success('Ligne supprimé avec succès')
                    return;
                }
                axiosPrivate.post(`/paramCodeJournaux/codeJournauxDelete`, { fileId, compteId, idToDelete }).then((response) => {
                    const resData = response.data;
                    if (resData.state) {
                        setDisableAddRowBouton(false);
                        setOpenDialogDeleteRow(false);
                        setListeCodeJournaux(listeCodeJournaux.filter((row) => row.id !== selectedRowId[0]));
                        toast.success(resData.msg);
                    } else {
                        setOpenDialogDeleteRow(false);
                        toast.error(resData.msg);
                    }
                });
            }
            setOpenDialogDeleteRow(false);
        } else {
            setOpenDialogDeleteRow(false);
        }
    }

    const handleCancelClick = (id) => () => {
        setRowModesModel({
            ...rowModesModel,
            [id]: { mode: GridRowModes.View, ignoreModifications: true },
        });
        setDisableAddRowBouton(false);
        setDisableSaveBouton(true);
        setDisableDeleteBouton(true);
        setDisableModifyBouton(true);
        setSelectedRow([]);
        setSelectedRowId([]);
    };

    const processRowUpdate = (newRow) => {
        const updatedRow = { ...newRow, isNew: false };
        setListeCodeJournaux(listeCodeJournaux.map((row) => (row.id === newRow.id ? updatedRow : row)));
        //setFieldValue('listeAssocies', listAssocie.map((row) => (row.id === newRow.id ? updatedRow : row)));
        return updatedRow;
    };

    const handleRowModesModelChange = (newRowModesModel) => {
        setRowModesModel(newRowModesModel);
    };

    const handleCellEditCommit = (params) => {
        if (selectedRowId.length > 1 || selectedRowId.length === 0) {
            setEditableRow(false);
            setDisableModifyBouton(true);
            setDisableSaveBouton(true);
            setDisableCancelBouton(true);
            toast.error("Sélectionnez une seule ligne pour pouvoir la modifier");
        } else {
            setDisableModifyBouton(false);
            setDisableSaveBouton(false);
            setDisableCancelBouton(false);
            if (!selectedRowId.includes(params.id)) {
                setEditableRow(false);
                toast.error("Sélectionnez une ligne pour pouvoir la modifier");
            } else {
                setEditableRow(true);
            }
        }

    };

    //Ajouter une ligne dans le tableau liste associé
    const handleOpenDialogAddNewAssocie = () => {
        setDisableModifyBouton(false);
        setDisableCancelBouton(false);
        setDisableDeleteBouton(false);

        const newId = -Date.now();

        formikNewCodeJournal.setFieldValue("idDossier", fileId);
        const newRow = {
            id: newId,
            code: '',
            libelle: '',
            type: '',
            compteassocie: '',
            nif: '',
            stat: '',
            adresse: '',
        };
        setListeCodeJournaux([...listeCodeJournaux, newRow]);
        setSelectedRowId([newRow.id]);
        setSelectedRow([newRow.id]);
        setDisableAddRowBouton(true);
    }

    //récupérer le numéro id le plus grand dans le tableau
    const getMaxID = (data) => {
        const Ids = data.map(item => item.id);
        return Math.max(...Ids);
    };

    const deselectRow = (ids) => {
        const deselected = selectedRowId.filter(id => !ids.includes(id));

        const updatedRowModes = { ...rowModesModel };
        deselected.forEach((id) => {
            updatedRowModes[id] = { mode: GridRowModes.View, ignoreModifications: true };
        });
        setRowModesModel(updatedRowModes);

        setDisableAddRowBouton(false);
        setSelectedRowId(ids);
    }

    const handleCellKeyDown = (params, event) => {
        const api = apiRef.current;

        const allCols = api.getAllColumns().filter(c => c.editable);
        const sortedRowIds = api.getSortedRowIds();
        const currentColIndex = allCols.findIndex(c => c.field === params.field);
        const currentRowIndex = sortedRowIds.indexOf(params.id);

        let nextColIndex = currentColIndex;
        let nextRowIndex = currentRowIndex;

        if (event.key === 'Tab' && !event.shiftKey) {
            event.preventDefault();
            nextColIndex = currentColIndex + 1;
            if (nextColIndex >= allCols.length) {
                nextColIndex = 0;
                nextRowIndex = currentRowIndex + 1;
            }
        } else if (event.key === 'Tab' && event.shiftKey) {
            event.preventDefault();
            nextColIndex = currentColIndex - 1;
            if (nextColIndex < 0) {
                nextColIndex = allCols.length - 1;
                nextRowIndex = currentRowIndex - 1;
            }
        } else if (event.key === 'ArrowRight') {
            event.preventDefault();
            nextColIndex = currentColIndex + 1;
            if (nextColIndex >= allCols.length) nextColIndex = allCols.length - 1;
        } else if (event.key === 'ArrowLeft') {
            event.preventDefault();
            nextColIndex = currentColIndex - 1;
            if (nextColIndex < 0) nextColIndex = 0;
        }

        const nextRowId = sortedRowIds[nextRowIndex];
        const targetCol = allCols[nextColIndex];

        if (!nextRowId || !targetCol) return;

        try {
            api.stopCellEditMode({ id: params.id, field: params.field });
        } catch (err) {
            console.warn('Erreur stopCellEditMode ignorée:', err);
        }

        setTimeout(() => {
            const cellInput = document.querySelector(
                `[data-id="${nextRowId}"] [data-field="${targetCol.field}"] input, 
             [data-id="${nextRowId}"] [data-field="${targetCol.field}"] textarea`
            );
            if (cellInput) cellInput.focus();
        }, 50);
    };

    return (
        <>
            {
                noFile
                    ?
                    <PopupTestSelectedFile
                        confirmationState={sendToHome}
                    />
                    :
                    null
            }
            {
                (openDialogDeleteRow && canDelete)
                    ?
                    <PopupConfirmDelete
                        msg={"Voulez-vous vraiment supprimer le code journal sélectionné ?"}
                        confirmationState={deleteRow}
                    />
                    :
                    null
            }
            <PopupImportCodeJournaux
                open={openImportDialog}
                onClose={() => setOpenImportDialog(false)}
                fileId={fileId}
                compteId={compteId}
                onImportSuccess={() => GetListeCodeJournaux(fileId)}
            />
            <Box>

                <TabContext value={"1"}>
                    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                        <TabList aria-label="lab API tabs example">
                            <Tab
                                style={{
                                    textTransform: 'none',
                                    outline: 'none',
                                    border: 'none',
                                    margin: -5
                                }}
                                label={InfoFileStyle(fileInfos?.dossier)} value="1"
                            />
                        </TabList>
                    </Box>
                    <TabPanel value="1">
                        <Typography variant='h6' sx={{ color: "black" }} align='left'>Paramétrages : codes journaux</Typography>

                        <Stack width={"100%"} height={"30px"} spacing={1} alignItems={"center"} alignContent={"center"}
                            direction={"column"} style={{ marginLeft: "0px", marginTop: "20px", justifyContent: "right" }}>

                            <Stack width={"100%"} height={"30px"} spacing={0.5} alignItems={"center"} alignContent={"center"}
                                direction={"row"} justifyContent={"right"}>
                                <Tooltip title="Importer des codes journaux">
                                    <IconButton
                                        disabled={!canAdd}
                                        variant="contained"
                                        onClick={() => setOpenImportDialog(true)}
                                        style={{
                                            width: "35px", height: '35px',
                                            borderRadius: "2px", borderColor: "transparent",
                                            backgroundColor: initial.theme,
                                            textTransform: 'none', outline: 'none'
                                        }}
                                    >
                                        <MdOutlineFileUpload style={{ width: '25px', height: '25px', color: 'white' }} />
                                    </IconButton>
                                </Tooltip>

                                <Tooltip title="Ajouter une ligne">
                                    <IconButton
                                        disabled={!canAdd || disableAddRowBouton}
                                        variant="contained"
                                        onClick={handleOpenDialogAddNewAssocie}
                                        style={{
                                            width: "35px", height: '35px',
                                            borderRadius: "2px", borderColor: "transparent",
                                            backgroundColor: initial.theme,
                                            textTransform: 'none', outline: 'none'
                                        }}
                                    >
                                        <TbPlaylistAdd style={{ width: '25px', height: '25px', color: 'white' }} />
                                    </IconButton>
                                </Tooltip>

                                <Tooltip title="Modifier la ligne sélectionnée">
                                    <IconButton
                                        disabled={(!canModify && selectedRowId > 0) || disableModifyBouton}
                                        variant="contained"
                                        onClick={handleEditClick(selectedRowId)}
                                        style={{
                                            width: "35px", height: '35px',
                                            borderRadius: "2px", borderColor: "transparent",
                                            backgroundColor: initial.theme,
                                            textTransform: 'none', outline: 'none'
                                        }}
                                    >
                                        <FaRegPenToSquare style={{ width: '25px', height: '25px', color: 'white' }} />
                                    </IconButton>
                                </Tooltip>

                                <Tooltip title="Sauvegarder les modifications">
                                    <span>
                                        <IconButton
                                            disabled={(!canAdd && !canModify) || !formikNewCodeJournal.isValid}
                                            variant="contained"
                                            onClick={handleSaveClick(selectedRowId)}
                                            style={{
                                                width: "35px", height: '35px',
                                                borderRadius: "2px", borderColor: "transparent",
                                                backgroundColor: initial.theme,
                                                textTransform: 'none', outline: 'none'
                                            }}
                                        >
                                            <TfiSave style={{ width: '50px', height: '50px', color: 'white' }} />
                                        </IconButton>
                                    </span>
                                </Tooltip>

                                <Tooltip title="Annuler les modifications">
                                    <span>
                                        <IconButton
                                            disabled={disableCancelBouton}
                                            variant="contained"
                                            onClick={handleCancelClick(selectedRowId)}
                                            style={{
                                                width: "35px", height: '35px',
                                                borderRadius: "2px", borderColor: "transparent",
                                                backgroundColor: initial.button_delete_color,
                                                textTransform: 'none', outline: 'none'
                                            }}
                                        >
                                            <VscClose style={{ width: '50px', height: '50px', color: 'white' }} />
                                        </IconButton>
                                    </span>
                                </Tooltip>

                                <Tooltip title="Supprimer la ligne sélectionné">
                                    <span>
                                        <IconButton
                                            disabled={!canDelete || disableDeleteBouton}
                                            onClick={handleOpenDialogConfirmDeleteAssocieRow}
                                            variant="contained"
                                            style={{
                                                width: "35px", height: '35px',
                                                borderRadius: "2px", borderColor: "transparent",
                                                backgroundColor: initial.button_delete_color,
                                                textTransform: 'none', outline: 'none'
                                            }}
                                        >
                                            <IoMdTrash style={{ width: '50px', height: '50px', color: 'white' }} />
                                        </IconButton>
                                    </span>
                                </Tooltip>
                            </Stack>

                            <Stack width={"100%"} height={'100%'} minHeight={'800px'}>
                                <DataGrid
                                    apiRef={apiRef}
                                    disableMultipleSelection={DataGridStyle.disableMultipleSelection}
                                    disableColumnSelector={DataGridStyle.disableColumnSelector}
                                    disableDensitySelector={DataGridStyle.disableDensitySelector}
                                    disableRowSelectionOnClick
                                    disableSelectionOnClick={true}
                                    localeText={frFR.components.MuiDataGrid.defaultProps.localeText}
                                    slots={{ toolbar: QuickFilter }}
                                    sx={{
                                        ...DataGridStyle.sx,
                                        '& .MuiDataGrid-main': { width: '100%' },
                                        '& .MuiDataGrid-viewport': { overflowX: 'hidden' }
                                    }}
                                    rowHeight={DataGridStyle.rowHeight}
                                    columnHeaderHeight={DataGridStyle.columnHeaderHeight}
                                    editMode='row'
                                    columns={CodeJournauxColumnHeader}
                                    rows={listeCodeJournaux}
                                    onRowClick={(e) => handleCellEditCommit(e.row)}
                                    onRowSelectionModelChange={ids => {
                                        const single = Array.isArray(ids) && ids.length ? [ids[ids.length - 1]] : [];
                                        setSelectedRow(single);
                                        saveSelectedRow(single);
                                        deselectRow(single);
                                    }}
                                    rowModesModel={rowModesModel}
                                    onRowModesModelChange={handleRowModesModelChange}
                                    onRowEditStop={handleRowEditStop}
                                    processRowUpdate={processRowUpdate}
                                    initialState={{
                                        pagination: {
                                            paginationModel: { page: 0, pageSize: 100 },
                                        },
                                    }}
                                    experimentalFeatures={{ newEditingApi: true }}
                                    pageSizeOptions={[50, 100]}
                                    pagination={DataGridStyle.pagination}
                                    checkboxSelection={DataGridStyle.checkboxSelection}
                                    columnVisibilityModel={{
                                        id: false,
                                    }}
                                    rowSelectionModel={selectedRow}
                                    onRowEditStart={(params, event) => {
                                        const rowId = params.id;
                                        const rowData = params.row;

                                        const isNewRow = rowId < 0;

                                        if (!canModify && !isNewRow) {
                                            event.defaultMuiPrevented = true;
                                            return;
                                        }

                                        event.stopPropagation();
                                        setDisableAddRowBouton(true);

                                        setLibelleValidationColor('transparent');
                                        setTypeValidationColor('transparent');
                                        setCompteAssocieValidationColor('transparent');
                                        setNifValidationColor('transparent');
                                        setStatValidationColor('transparent');
                                        setAdresseValidationColor('transparent');

                                        formikNewCodeJournal.setFieldValue("idCode", rowId);
                                        formikNewCodeJournal.setFieldValue("idDossier", fileId);
                                        formikNewCodeJournal.setFieldValue("idCompte", compteId);
                                        formikNewCodeJournal.setFieldValue("code", rowData.code);
                                        formikNewCodeJournal.setFieldValue("libelle", rowData.libelle);
                                        formikNewCodeJournal.setFieldValue("type", rowData.type);
                                        formikNewCodeJournal.setFieldValue("compteassocie", rowData.compteassocie);

                                        if (rowData.type === 'BANQUE') {
                                            formikNewCodeJournal.setFieldValue('nif', rowData.nif || '');
                                            formikNewCodeJournal.setFieldValue('stat', rowData.stat || '');
                                            formikNewCodeJournal.setFieldValue('adresse', rowData.adresse || '');
                                        } else {
                                            formikNewCodeJournal.setFieldValue('nif', '');
                                            formikNewCodeJournal.setFieldValue('stat', '');
                                            formikNewCodeJournal.setFieldValue('adresse', '');
                                        }

                                        setRowModesModel((oldModel) => ({
                                            ...oldModel,
                                            [rowId]: { mode: GridRowModes.Edit },
                                        }));

                                        setDisableSaveBouton(false);
                                    }}
                                    onCellKeyDown={handleCellKeyDown}
                                />
                            </Stack>
                        </Stack>
                    </TabPanel>
                </TabContext>
            </Box>
        </>
    )
}
