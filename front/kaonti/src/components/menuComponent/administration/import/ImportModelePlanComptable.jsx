import { React, useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Typography, Stack, Paper, Box, Tab, Badge, Button, Divider, TextField, FormHelperText } from '@mui/material';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Radio from '@mui/material/Radio';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import SaveAltIcon from '@mui/icons-material/SaveAlt';
import LogoutIcon from '@mui/icons-material/Logout';
import TableImportBalanceModel from '../../../../model/TableImportBalanceModel';
import TableImportModelePlanComptableModel from '../../../../model/TableImportModelePlanComptableModel';
import { init } from '../../../../../init';
import useAuth from '../../../../hooks/useAuth';
import { jwtDecode } from 'jwt-decode';
import axios from '../../../../../config/axios';
import toast from 'react-hot-toast';
import { InfoFileStyle } from '../../../componentsTools/InfosFileStyle';
import { TabContext, TabList, TabPanel } from '@mui/lab';
import { format } from 'date-fns';
import { useFormik } from 'formik';
import * as Yup from "yup";
import Papa from 'papaparse';
import { DataGrid, frFR, GridFooter, GridFooterContainer, GridRowEditStopReasons, GridRowModes } from '@mui/x-data-grid';
import QuickFilter from '../../../componentsTools/DatagridToolsStyle';
import { DataGridStyle } from '../../../componentsTools/DatagridToolsStyle';
import PopupViewDetailsImportModelePc from '../../../componentsTools/popupViewDetailsImportModelePc';
import PopupActionConfirm from '../../../componentsTools/popupActionConfirm';
import CircularProgress from '@mui/material/CircularProgress';
import PopupInformation from '../../../componentsTools/popupInformation';
import VirtualTableModifiableImportJnl from '../../../componentsTools/DeclarationEbilan/virtualTableModifiableImportJnl';

export default function ImportModelePlanComptable() {

    //Valeur du listbox choix Type exercice-----------------------------------------------------
    const [valSelectType, setValSelectType] = useState('');

    let initial = init[0];
    const [fileInfos, setFileInfos] = useState('');
    const [fileId, setFileId] = useState(0);
    const { id } = useParams();
    const [noFile, setNoFile] = useState(false);
    const [nbrAnomalie, setNbrAnomalie] = useState(0);
    const [openDetailsAnomalie, setOpenDetailsAnomalie] = useState(false);
    const [couleurBoutonAnomalie, setCouleurBoutonAnomalie] = useState('white');
    const [modelePc, setModelePc] = useState([]);

    const [msgAnomalie, setMsgAnomalie] = useState([]);
    const [traitementModelePcWaiting, setTraitementModelePcWaiting] = useState(false);
    const [traitementModelePcMsg, setTraitementModelePcMsg] = useState('');
    const [openDialogConfirmImport, setOpenDialogConfirmImport] = useState(false);
    const [anomaliePersiste, setAnomaliePersiste] = useState(false);
    const [nameExist, setNameExist] = useState(false);

    // const columnHeaderModelePc = [
    //     {
    //         field: 'compte', 
    //         headerName: "Compte", 
    //         type: 'string', 
    //         sortable : true, 
    //         width: 150, 
    //         headerAlign: 'right',
    //         align: 'right',
    //         headerClassName: 'MuiDataGrid-ColumnHeader',
    //     },
    //     {
    //         field: 'libelle', 
    //         headerName: "Libellé", 
    //         type: 'string', 
    //         sortable : true, 
    //         width: 350, 
    //         headerAlign: 'left',
    //         align: 'left',
    //         headerClassName: 'MuiDataGrid-ColumnHeader',
    //     },
    //     {
    //         field: 'nature', 
    //         headerName: "Nature", 
    //         type: 'string', 
    //         sortable : true, 
    //         width: 150, 
    //         headerAlign: 'left',
    //         align: 'left',
    //         headerClassName: 'MuiDataGrid-ColumnHeader',
    //     },
    //     {
    //         field: 'baseaux', 
    //         headerName: "Base auxiliaire", 
    //         type: 'string', 
    //         sortable : true, 
    //         width: 150, 
    //         headerAlign: 'right',
    //         align: 'right',
    //         headerClassName: 'MuiDataGrid-ColumnHeader',
    //     },
    //     {
    //         field: 'typetier', 
    //         headerName: "Type de tier", 
    //         type: 'string', 
    //         sortable : true, 
    //         width: 120, 
    //         headerAlign: 'left',
    //         align: 'left',
    //         headerClassName: 'MuiDataGrid-ColumnHeader',
    //     },
    //     {
    //         field: 'nif', 
    //         headerName: "Nif", 
    //         type: 'string', 
    //         sortable : true, 
    //         width: 150, 
    //         headerAlign: 'left',
    //         align: 'left',
    //         headerClassName: 'MuiDataGrid-ColumnHeader',
    //     },
    //     {
    //         field: 'statistique', 
    //         headerName: "Statistique", 
    //         type: 'string', 
    //         sortable : true, 
    //         width: 175, 
    //         headerAlign: 'left',
    //         align: 'left',
    //         headerClassName: 'MuiDataGrid-ColumnHeader',
    //     },
    //     {
    //         field: 'adresse', 
    //         headerName: "Adresse de la société", 
    //         type: 'string', 
    //         sortable : true, 
    //         width: 300, 
    //         headerAlign: 'left',
    //         align: 'left',
    //         headerClassName: 'MuiDataGrid-ColumnHeader',
    //     },
    //     {
    //         field: 'cin', 
    //         headerName: "Cin", 
    //         type: 'string', 
    //         sortable : true, 
    //         width: 175, 
    //         headerAlign: 'left',
    //         align: 'left',
    //         headerClassName: 'MuiDataGrid-ColumnHeader',
    //     },
    //     {
    //         field: 'datecin', 
    //         headerName: "Date cin", 
    //         type: 'string', 
    //         sortable : true, 
    //         width: 120, 
    //         headerAlign: 'center',
    //         align: 'center',
    //         headerClassName: 'MuiDataGrid-ColumnHeader',
    //     },
    //     {
    //         field: 'autrepieceidentite', 
    //         headerName: "Autre pièce ident.", 
    //         type: 'string', 
    //         sortable : true, 
    //         width: 175, 
    //         headerAlign: 'left',
    //         align: 'left',
    //         headerClassName: 'MuiDataGrid-ColumnHeader',
    //     },
    //     {
    //         field: 'refpieceidentite', 
    //         headerName: "Réf autre pièce ident.", 
    //         type: 'string', 
    //         sortable : true, 
    //         width: 200, 
    //         headerAlign: 'left',
    //         align: 'left',
    //         headerClassName: 'MuiDataGrid-ColumnHeader',
    //     },
    //     {
    //         field: 'adressesansnif', 
    //         headerName: "Adresse du sans nif", 
    //         type: 'string', 
    //         sortable : true, 
    //         width: 300, 
    //         headerAlign: 'left',
    //         align: 'left',
    //         headerClassName: 'MuiDataGrid-ColumnHeader',
    //     },
    //     {
    //         field: 'nifrepresentant', 
    //         headerName: "Nif représentant", 
    //         type: 'string', 
    //         sortable : true, 
    //         width: 175, 
    //         headerAlign: 'left',
    //         align: 'left',
    //         headerClassName: 'MuiDataGrid-ColumnHeader',
    //     },
    //     {
    //         field: 'adresserepresentant', 
    //         headerName: "Adresse représentant", 
    //         type: 'string', 
    //         sortable : true, 
    //         width: 300, 
    //         headerAlign: 'left',
    //         align: 'left',
    //         headerClassName: 'MuiDataGrid-ColumnHeader',
    //     },
    //     {
    //         field: 'pays', 
    //         headerName: "Pays", 
    //         type: 'string', 
    //         sortable : true, 
    //         width: 200, 
    //         headerAlign: 'left',
    //         align: 'left',
    //         headerClassName: 'MuiDataGrid-ColumnHeader',
    //     },
    // ];

    const columns = [
        {
            id: 'compte',
            label: 'Compte',
            minWidth: 150,
            align: 'left',
            isnumber: false
        },
        {
            id: 'libelle',
            label: 'Libellé',
            minWidth: 350,
            align: 'left',
            isnumber: false
        },
        {
            id: 'nature',
            label: 'Nature',
            minWidth: 150,
            align: 'left',
            isnumber: false
        },
        {
            id: 'baseaux',
            label: 'Centr./base aux.',
            minWidth: 160,
            align: 'left',
            isnumber: false
        },
        {
            id: 'typetier',
            label: 'Type de tier',
            minWidth: 120,
            align: 'left',
            isnumber: false
        },
        {
            id: 'nif',
            label: 'Nif',
            minWidth: 150,
            align: 'left',
            isnumber: false
        },
        {
            id: 'statistique',
            label: 'N° Statistique',
            minWidth: 175,
            align: 'left',
            isnumber: false
        },
        {
            id: 'adresse',
            label: 'Adresse de la société',
            minWidth: 300,
            align: 'left',
            isnumber: false
        },
        {
            id: 'cin',
            label: 'Cin',
            minWidth: 175,
            align: 'left',
            isnumber: false
        },
        {
            id: 'datecin',
            label: 'Date cin',
            minWidth: 120,
            align: 'center',
            isnumber: false
        },
        {
            id: 'autrepieceidentite',
            label: 'Autre pièce ident.',
            minWidth: 175,
            align: 'left',
            isnumber: false
        },
        {
            id: 'refpieceidentite',
            label: 'Réf autre pièce ident.',
            minWidth: 200,
            align: 'left',
            isnumber: false
        },
        {
            id: 'adressesansnif',
            label: 'Adresse du sans nif',
            minWidth: 300,
            align: 'left',
            isnumber: false
        },
        {
            id: 'nifrepresentant',
            label: 'Nif représentant',
            minWidth: 175,
            align: 'left',
            isnumber: false
        },
        {
            id: 'adresserepresentant',
            label: 'Adresse représentant',
            minWidth: 300,
            align: 'left',
            isnumber: false
        },
        {
            id: 'pays',
            label: 'Pays',
            minWidth: 200,
            align: 'left',
            isnumber: false
        },
        {
            id: 'province',
            label: 'Province',
            minWidth: 200,
            align: 'left',
            isnumber: false
        },
        {
            id: 'region',
            label: 'Région',
            minWidth: 200,
            align: 'left',
            isnumber: false
        },
        {
            id: 'district',
            label: 'District',
            minWidth: 200,
            align: 'left',
            isnumber: false
        },
        {
            id: 'commune',
            label: 'Commune',
            minWidth: 200,
            align: 'left',
            isnumber: false
        },
    ];

    //récupération infos de connexion
    const { auth } = useAuth();
    const decoded = auth?.accessToken ? jwtDecode(auth.accessToken) : undefined;
    const compteId = decoded.UserInfo.compteId || null;
    const userId = decoded.UserInfo.userId || null;
    const navigate = useNavigate();

    //Formulaire pour l'import du journal
    const formikImport = useFormik({
        initialValues: {
            idCompte: compteId,
            nomModele: '',
            modelePcData: [],
        },
        validationSchema: Yup.object({
            nomModele: Yup.string().required("Veuillez ajouter un nom pour le modèle."),
        }),
        onSubmit: (values) => {
            handleImportModelePc();
        },
    });

    //download modele d'import
    const handleDownloadModel = () => {
        const fileUrl = '../../../../../public/modeleImport/modeleImportModelePc.csv';
        const link = document.createElement('a');
        link.href = fileUrl;
        link.download = 'ModeleImportModelePc';
        link.click();
    }

    //validation des entêtes si c'est bon ou pas (tolérant accents/casse/espaces)
    const validateHeaders = (headers) => {
        const expectedHeaders = [
            "compte", "libelle", "nature", "baseaux", "typetier", "nif", "statistique", "adresse", "cin", "datecin",
            "autrepieceidentite", "refpieceidentite", "adressesansnif", "nifrepresentant", "adresserepresentant", "pays",
            "province", "region", "district", "commune"
        ];

        const normalize = (s) => (s || "")
            .toString()
            .trim()
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');

        const actual = new Set(headers.map(normalize));
        const missing = expectedHeaders.filter(h => !actual.has(normalize(h)));
        if (missing.length > 0) {
            toast.error(`Les en-têtes du modèle d'import suivants sont manquants : ${missing.join(', ')}`);
            return false;
        }
        return true;
    }

    //validation du tableau du modèle de plan comptable
    const validationData = (data) => {
        const couleurAnom = "#EB5B00";
        let nbrAnom = 0;
        let msg = [];

        //valider si certaines lignes ne contiennent pas de compte
        const missingCompte = data.filter(item => item.compte && item.compte.trim() === '');
        if (missingCompte.length > 0) {
            msg.push(`Certaines lignes du tableau ne contiennent pas de n° de compte.`);

            nbrAnom = nbrAnom + 1;
            setNbrAnomalie(nbrAnom);
            setCouleurBoutonAnomalie(couleurAnom);
        }

        //valider si certaines lignes n'ont pas de nature
        const missingNature = data.filter(item => item.nature && item.nature.trim() === '');
        if (missingNature.length > 0) {
            msg.push(`Certaines lignes du tableau ne sont pas associées à une nature.`);
            nbrAnom = nbrAnom + 1;
            setNbrAnomalie(nbrAnom);
            setCouleurBoutonAnomalie(couleurAnom);
        }

        //valider si les natures sont érronées
        const expectedNatureValue = ["General", "Aux", "Collectif"];
        const fakeNatureValueData = data.filter(item => !expectedNatureValue.includes(item.nature));
        if (fakeNatureValueData.length > 0) {
            msg.push(`Certaines natures des lignes du tableau sont érronées. Veuillez bien valider cette colonne en respectant leurs valeurs appropriées : General, Aux, Collectif.`);
            nbrAnom = nbrAnom + 1;
            setNbrAnomalie(nbrAnom);
            setCouleurBoutonAnomalie(couleurAnom);
        }

        //valider si certaines lignes n'ont pas de base auxiliaire.
        const missingBaseAux = data.filter(item => item.baseaux && item.baseaux.trim() === '');
        if (missingBaseAux.length > 0) {
            msg.push(`Tout les champs de la colonne baseaux sont obligatoires. Veuillez remplir ces champs, par leur compte associé dans la colonne compte si sa nature est de type autre que Aux. Dans le cas contraire, veuillez bien ajouter le compte associé à partir de la liste des comptes dans la colonne compte.`);
            nbrAnom = nbrAnom + 1;
            setNbrAnomalie(nbrAnom);
            setCouleurBoutonAnomalie(couleurAnom);
        }

        //valider si les comptes dans baseaux existent bien dans la colonne compte
        const colonneBaseAux = [...new Set(data.map(item => item.baseaux))];
        const colonneCompte = [...new Set(data.map(item => item.compte))];

        const matchingElements = colonneBaseAux.filter(item => !colonneCompte.includes(item));

        if (matchingElements.length > 0) {
            msg.push(`Les comptes associés à la colonne baseaux suivants n'existent pas dans la colonne compte : ${matchingElements.join(', ')}`);
            nbrAnom = nbrAnom + 1;
            setNbrAnomalie(nbrAnom);
            setCouleurBoutonAnomalie(couleurAnom);
        }

        //valider si les comptes associés baseaux des comptes de type Auxiliaires sont bien définis comme des comptes collectifs
        const listeCompteAux = data.filter(item => item.nature === "Aux");
        const colonneBaseAuxCptAux = [...new Set(listeCompteAux.map(item => item.baseaux))];
        const listeCompteCollectif = data.filter(item => item.nature === "Collectif");
        const listeUniqueCompteCollectif = [...new Set(listeCompteCollectif.map(item => item.compte))];

        const matchingCtrlCollectif = colonneBaseAuxCptAux.filter(item => !listeUniqueCompteCollectif.includes(item));
        if (matchingCtrlCollectif.length > 0) {
            msg.push(`Les comptes bases auxiliaires suivants ne sont pas définis comme des comptes collectifs : ${matchingCtrlCollectif.join(', ')}`);
            nbrAnom = nbrAnom + 1;
            setNbrAnomalie(nbrAnom);
            setCouleurBoutonAnomalie(couleurAnom);
        }

        //valider si certaines lignes n'ont pas de typetier.
        const missingTypeTier = data.filter(item => item.typetier && item.typetier.trim() === '');
        if (missingTypeTier.length > 0) {
            msg.push(`Tout les champs de la colonne typetier doivent être remplis.`);
            nbrAnom = nbrAnom + 1;
            setNbrAnomalie(nbrAnom);
            setCouleurBoutonAnomalie(couleurAnom);
        }

        //valider si les typetier sont érronées
        const expectedTypeTierValue = ["general", "sans-nif", "avec-nif", "etranger"];
        const DataTypeTierValue = [...new Set(data.map(item => item.typetier))];

        const fakeTypeTierValueData = DataTypeTierValue.filter(item => !expectedTypeTierValue.includes(item));
        if (fakeTypeTierValueData.length > 0) {
            msg.push(`Certains type de tier du tableau sont érronées. Veuillez remplir cette colonne par les mots clés suivants : general, sans-nif, avec-nif, etranger.`);
            nbrAnom = nbrAnom + 1;
            setNbrAnomalie(nbrAnom);
            setCouleurBoutonAnomalie(couleurAnom);
        }

        //valider si les comptes de typetier = avec-nif possède bien des nif dans la colonne nif
        const listeTiersAvecNif = data.filter(item => item.typetier === 'avec-nif');
        const missingNif = listeTiersAvecNif.filter(item => item.typetier && item.typetier.trim() === '');
        if (missingNif.length > 0) {
            msg.push(`Certains tiers de type avec-nif n'ont pas de numéro nif renseigné dans la colonne nif.`);
            nbrAnom = nbrAnom + 1;
            setNbrAnomalie(nbrAnom);
            setCouleurBoutonAnomalie(couleurAnom);
        }

        //rappel pour le champ pays
        msg.push(`NB: tous les champs pays vide seront remplis par le mot Madagascar automatiquement.`);
        setMsgAnomalie(msg);
    };

    const handleFileSelect = (event) => {
        const file = event.target.files[0];

        if (file) {
            // Utilise PapaParse pour parser le fichier CSV

            Papa.parse(file, {
                complete: (result) => {
                    const headers = result.meta.fields;

                    if (validateHeaders(headers)) {
                        setTraitementModelePcMsg('Traitement des données du modèle de plan comptable en cours...');
                        setTraitementModelePcWaiting(true);

                        //réinitialiser les compteurs d'anomalies
                        const couleurAnom = "#EB5B00";
                        let nbrAnom = 0;
                        let msg = [];
                        setMsgAnomalie('');
                        setCouleurBoutonAnomalie('white');
                        setNbrAnomalie(0);

                        // Remapper vers des clés canoniques si le CSV utilise des accents/variantes
                        const getValue = (row, keys) => {
                            for (const k of keys) {
                                if (row[k] !== undefined && row[k] !== null) return row[k];
                            }
                            return '';
                        };

                        const DataWithId = result.data.map((row, index) => ({
                            ...row,
                            // géographie (support accents/casse)
                            province: row.province ?? row.Province ?? getValue(row, ['provinces', 'Provinces']),
                            region: row.region ?? row.Region ?? row['région'] ?? row['Région'],
                            district: row.district ?? row.District,
                            commune: row.commune ?? row.Commune,
                            id: index,
                        }));

                        validationData(DataWithId);
                        setModelePc(DataWithId);
                        formikImport.setFieldValue('modelePcData', DataWithId);

                        event.target.value = null;
                        setTraitementModelePcWaiting(false);

                        handleOpenAnomalieDetails();
                    }
                },
                header: true, // Si tu veux que la première ligne soit utilisée comme clé d'objet (si le CSV a des en-têtes)
                skipEmptyLines: true, // Ignore les lignes vides
                encoding: "UTF-8"
            });
        }
    }

    //afficher ou non les détails des anomalies de l'import
    const handleOpenAnomalieDetails = () => {
        setOpenDetailsAnomalie(true);
    }

    const handleCloseAnomalieDetails = (value) => {
        setOpenDetailsAnomalie(value);
    }

    //fermer le popup bloquant l'import s'il y a encore des anomalies à corriger.
    const handleCloseInformation = (value) => {
        setAnomaliePersiste(false);
    }

    //tester si le nom du modèle existe déjà
    const testIfNewNameModeleExist = async () => {
        const modeleName = formikImport.values.nomModele;
        const response = await axios.post(`/administration/ImportModelePc/testNewNameModelePc`, { compteId, modeleName });
        const resData = response.data;
        return resData.state;
    }

    //fermer le popup nom existe déjà
    const handleCloseInformationNameExist = (value) => {
        setNameExist(false);
    }

    //import du plan comptable
    const handleImportModelePc = async () => {
        if (nbrAnomalie > 0) {
            setAnomaliePersiste(true);
        } else {
            const testName = await testIfNewNameModeleExist();

            if (testName) {
                setNameExist(true);
            } else {
                setTraitementModelePcMsg('Import du modèle de plan comptable en cours...');
                setTraitementModelePcWaiting(true);

                axios.post(`/administration/ImportModelePc/ImportModelePc`, formikImport.values).then((response) => {
                    const resData = response.data;
                    if (resData.state) {
                        setTraitementModelePcMsg('');
                        setTraitementModelePcWaiting(false);
                        toast.success(resData.msg);
                        setModelePc([]);
                        setNbrAnomalie(0);
                        setMsgAnomalie([]);
                    } else {
                        setTraitementModelePcMsg('');
                        setTraitementModelePcWaiting(false);
                        toast.error(resData.msg);
                    }
                });
            }
        }
    }

    return (
        <Box sx={{
            width: 'calc(100% - 40px)',
            maxWidth: 'calc(100vw - 100px)',
            padding: '0 0 0 30px',
            boxSizing: 'border-box'
        }}>
            {openDetailsAnomalie ? <PopupViewDetailsImportModelePc msg={msgAnomalie} confirmationState={handleCloseAnomalieDetails} /> : null}
            {openDialogConfirmImport ? <PopupActionConfirm msg={"Voulez-vous vraiment importer le modèle de plan comptable en cours?"} confirmationState={handleImportModelePc} /> : null}
            {anomaliePersiste ? <PopupInformation msg={"Veuillez corriger toutes les anomalies pour pouvoir importer le modèle."} confirmationState={handleCloseInformation} /> : null}
            {nameExist ? <PopupInformation msg={"Le nom du modèle existe déjà. Veuillez spécifier un autre."} confirmationState={handleCloseInformationNameExist} /> : null}

            <form onSubmit={formikImport.handleSubmit}>
                <Stack
                    width={"100%"}
                    height={"100%"}
                    spacing={2}
                    alignItems={"flex-start"}
                    alignContent={"flex-start"}
                    justifyContent={"stretch"}
                >

                    <Typography
                        style={{
                            marginTop: "50px",
                            marginBottom: "30px"
                        }}
                        variant='h6'
                        sx={{ color: "black" }}
                        align='left'
                    >
                        Administration - Import modèle plan comptable
                    </Typography>

                    <Stack width={"100%"} height={"50px"} spacing={2} alignItems={"center"} alignContent={"center"} direction={"row"} style={{ marginLeft: "0px", marginTop: "20px" }}>
                        <FormControl variant="standard" sx={{ m: 0, minWidth: 250 }}>
                            <TextField
                                style={{ width: "400px" }}
                                id="nomModele"
                                label="Nom du modèle"
                                variant="standard"
                                onBlur={(e) => formikImport.setFieldValue('nomModele', e.target.value)}
                            />

                            <FormHelperText
                                style={{
                                    color: 'red',
                                    marginLeft: 0,
                                    fontSize: "12px",
                                }}
                            >
                                {formikImport.errors.nomModele && formikImport.touched.nomModele && formikImport.errors.nomModele}
                            </FormHelperText>
                        </FormControl>

                        <Stack spacing={1} width={"380px"} height={"50px"} direction={"row"}
                            style={{ border: '2px dashed rgba(5,96,116,0.60)', marginLeft: "30px", paddingLeft: "20px" }}
                            alignContent={"center"} justifyContent={"left"} alignItems={"center"}
                        >
                            <Typography variant='h7' sx={{ color: "black" }} align='left'>Télécharger ici le modèle d'import</Typography>

                            <List style={{ marginLeft: "10px" }}>
                                <ListItem style={{ width: "100px", justifyContent: "center" }}>
                                    <ListItemButton onClick={handleDownloadModel}>
                                        <ListItemIcon > <LogoutIcon style={{ width: "40px", height: "30px", color: 'rgba(5,96,116,0.60)', transform: "rotate(270deg)" }} /> </ListItemIcon>
                                    </ListItemButton>
                                </ListItem>
                            </List>
                        </Stack>

                        <Stack spacing={1} width={"340px"} height={"50px"} direction={"row"}
                            style={{ border: '2px dashed rgba(5,96,116,0.60)', marginLeft: "30px", paddingLeft: "20px" }}
                            alignContent={"center"} justifyContent={"left"} alignItems={"center"}
                            backgroundColor={'rgba(5,96,116,0.05)'}
                        >
                            <input
                                type="file"
                                accept={".csv"}
                                // webkitdirectory="true"
                                onChange={handleFileSelect}
                                style={{ display: 'none' }}
                                id="fileInput"
                            />

                            <Typography variant='h7' sx={{ color: "black", fontWeight: "bold" }} align='left'>Importer depuis le fichier</Typography>

                            <List style={{ marginLeft: "10px" }}>
                                <ListItem style={{ width: "100px", justifyContent: "center" }}>
                                    <ListItemButton onClick={() => document.getElementById('fileInput').click()}>
                                        <ListItemIcon > <SaveAltIcon style={{ width: "50px", height: "33px", color: 'rgba(5,96,116,0.60)' }} /> </ListItemIcon>
                                    </ListItemButton>
                                </ListItem>
                            </List>
                        </Stack>

                        <Badge badgeContent={nbrAnomalie} color="warning">
                            <Button
                                onClick={handleOpenAnomalieDetails}
                                variant="contained"
                                style={{
                                    height: "50px",
                                    textTransform: 'none',
                                    outline: 'none',
                                    backgroundColor: initial.theme,
                                    color: couleurBoutonAnomalie
                                }}
                            >
                                Anomalies
                            </Button>
                        </Badge>

                        <Button
                            type='submit'
                            variant="contained"
                            style={{
                                height: "50px",
                                textTransform: 'none',
                                outline: 'none',
                                backgroundColor: initial.theme
                            }}
                        >
                            Importer
                        </Button>
                    </Stack>

                    {traitementModelePcWaiting
                        ? <Stack spacing={2} direction={'row'} width={"100%"} alignItems={'center'} justifyContent={'center'}>
                            <CircularProgress />
                            <Typography variant='h6' style={{ color: '#2973B2' }}>{traitementModelePcMsg}</Typography>
                            {/* <CircularProgressWithValueLabel value={50} msg={"Traitement du journal en cours..."} /> */}
                        </Stack>
                        : null
                    }

                    <Stack width={"100%"} height={'70vh'}>
                        <VirtualTableModifiableImportJnl columns={columns} rows={modelePc} state={true} />
                        {/* <DataGrid
                        disableMultipleSelection = {DataGridStyle.disableMultipleSelection}
                        disableColumnSelector = {DataGridStyle.disableColumnSelector}
                        disableDensitySelector = {DataGridStyle.disableDensitySelector}
                        localeText={frFR.components.MuiDataGrid.defaultProps.localeText}
                        disableRowSelectionOnClick
                        disableSelectionOnClick={true}
                        slots={{toolbar : QuickFilter}}
                        //slots={{toolbar : QuickFilter, footer: CustomFooter}}
                        sx={ DataGridStyle.sx}
                        rowHeight= {DataGridStyle.rowHeight}
                        columnHeaderHeight= {DataGridStyle.columnHeaderHeight}
                        rows={modelePc}
                        columns={columnHeaderModelePc}
                        initialState={{
                            pagination: {
                                paginationModel: { page: 0, pageSize: 100 },
                            },
                        }}
                        pageSizeOptions={[50, 100]}
                        pagination={DataGridStyle.pagination}
                        checkboxSelection = {DataGridStyle.checkboxSelection}
                        columnVisibilityModel={{
                            id: false,
                        }}
                        // hideFooter={true}
                        
                    />  */}

                    </Stack>
                </Stack>
            </form>

        </Box>
    )
}
