import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Typography, Stack, Box, Badge, Button, TextField, FormHelperText } from '@mui/material';
import FormControl from '@mui/material/FormControl';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import SaveAltIcon from '@mui/icons-material/SaveAlt';
import LogoutIcon from '@mui/icons-material/Logout';
import { init } from '../../../../../init';
import useAuth from '../../../../hooks/useAuth';
import useSSEImport from '../../../../hooks/useSSEImport';
import { jwtDecode } from 'jwt-decode';
import axios from '../../../../../config/axios';
import toast from 'react-hot-toast';
import { useFormik } from 'formik';
import * as Yup from "yup";
import Papa from 'papaparse';
import PopupViewDetailsImportModelePc from '../../../componentsTools/popupViewDetailsImportModelePc';
import ImportProgressBar from '../../../componentsTools/ImportProgressBar';
import PopupInformation from '../../../componentsTools/popupInformation';
import VirtualTableModifiableImportJnl from '../../../componentsTools/DeclarationEbilan/virtualTableModifiableImportJnl';
import VirtualTableImportModelPC from '../../../componentsTools/Paramettage/VirtualTableImportModelPC';

export default function PopupImportModelePlanComptable({ onSuccess }) {
    let initial = init[0];
    const [nbrAnomalie, setNbrAnomalie] = useState(0);
    const [openDetailsAnomalie, setOpenDetailsAnomalie] = useState(false);
    const [couleurBoutonAnomalie, setCouleurBoutonAnomalie] = useState('white');
    const [modelePc, setModelePc] = useState([]);

    const [msgAnomalie, setMsgAnomalie] = useState([]);
    const [traitementModelePcWaiting, setTraitementModelePcWaiting] = useState(false);
    const [traitementModelePcMsg, setTraitementModelePcMsg] = useState('');
    const [progressValue, setProgressValue] = useState(0);

    // Hook SSE pour la progression en temps réel
    const {
        isImporting,
        progress: sseProgress,
        message: sseMessage,
        currentLine,
        totalLines,
        startImport
    } = useSSEImport();
    const [anomaliePersiste, setAnomaliePersiste] = useState(false);
    const [nameExist, setNameExist] = useState(false);

    const columns = [
        { id: 'compte', label: 'Compte', minWidth: 150, align: 'left', isnumber: false },
        { id: 'libelle', label: 'Libellé', minWidth: 350, align: 'left', isnumber: false },
        { id: 'comptecorrespondance', label: 'Compte corr.', minWidth: 150, align: 'left', isnumber: false },
        { id: 'libelleautre', label: 'Libellé corr.', minWidth: 350, align: 'left', isnumber: false },
        { id: 'nature', label: 'Nature', minWidth: 150, align: 'left', isnumber: false },
        { id: 'baseaux', label: 'Centr./base aux.', minWidth: 160, align: 'left', isnumber: false },
        { id: 'typetier', label: 'Type de tier', minWidth: 150, align: 'left', isnumber: false },
        { id: 'nif', label: 'Nif', minWidth: 150, align: 'left', isnumber: false },
        { id: 'statistique', label: 'N° Statistique', minWidth: 175, align: 'left', isnumber: false },
        { id: 'adresse', label: 'Adresse de la société', minWidth: 300, align: 'left', isnumber: false },
        { id: 'cin', label: 'Cin', minWidth: 175, align: 'left', isnumber: false },
        { id: 'datecin', label: 'Date cin', minWidth: 120, align: 'center', isnumber: false },
        { id: 'autrepieceidentite', label: 'Autre pièce ident.', minWidth: 175, align: 'left', isnumber: false },
        { id: 'refpieceidentite', label: 'Réf autre pièce ident.', minWidth: 200, align: 'left', isnumber: false },
        { id: 'adressesansnif', label: 'Adresse du sans nif', minWidth: 300, align: 'left', isnumber: false },
        { id: 'nifrepresentant', label: 'Nif représentant', minWidth: 175, align: 'left', isnumber: false },
        { id: 'adresserepresentant', label: 'Adresse représentant', minWidth: 300, align: 'left', isnumber: false },
        { id: 'pays', label: 'Pays', minWidth: 200, align: 'left', isnumber: false },
        { id: 'province', label: 'Province', minWidth: 200, align: 'left', isnumber: false },
        { id: 'region', label: 'Région', minWidth: 200, align: 'left', isnumber: false },
        { id: 'district', label: 'District', minWidth: 200, align: 'left', isnumber: false },
        { id: 'commune', label: 'Commune', minWidth: 200, align: 'left', isnumber: false },
    ];

    const { auth } = useAuth();
    const decoded = auth?.accessToken ? jwtDecode(auth.accessToken) : undefined;
    const compteId = decoded.UserInfo.compteId || null;
    const userId = decoded.UserInfo.userId || null;

    // Synchroniser les valeurs SSE avec l'affichage
    useEffect(() => {
        if (isImporting) {
            setProgressValue(sseProgress);
            const displayMessage = currentLine > 0 && totalLines > 0
                ? `${sseMessage} (${currentLine}/${totalLines} lignes)`
                : sseMessage;
            setTraitementModelePcMsg(displayMessage);
        }
    }, [isImporting, sseProgress, sseMessage, currentLine, totalLines]);

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

    const handleDownloadModel = () => {
        const fileUrl = '../../../../../public/modeleImport/modeleImportModelePc.csv';
        const link = document.createElement('a');
        link.href = fileUrl;
        link.download = 'ModeleImportModelePc';
        link.click();
    }

    const validateHeaders = (headers) => {
        const expectedHeaders = [
            "compte", "comptecorrespondance", "libelleautre", "libelle", "nature", "baseaux", "typetier", "nif", "statistique", "adresse", "cin", "datecin",
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

    const validationData = (data) => {
        const couleurAnom = "#EB5B00";
        let nbrAnom = 0;
        let msg = [];

        const missingCompte = data.filter(item => item.compte && item.compte.trim() === '');
        if (missingCompte.length > 0) {
            msg.push(`Certaines lignes du tableau ne contiennent pas de n° de compte.`);

            nbrAnom = nbrAnom + 1;
            setNbrAnomalie(nbrAnom);
            setCouleurBoutonAnomalie(couleurAnom);
        }

        const missingNature = data.filter(item => item.nature && item.nature.trim() === '');
        if (missingNature.length > 0) {
            msg.push(`Certaines lignes du tableau ne sont pas associées à une nature.`);
            nbrAnom = nbrAnom + 1;
            setNbrAnomalie(nbrAnom);
            setCouleurBoutonAnomalie(couleurAnom);
        }

        const expectedNatureValue = ["General", "Aux", "Collectif"];
        const fakeNatureValueData = data.filter(item => !expectedNatureValue.includes(item.nature));
        if (fakeNatureValueData.length > 0) {
            msg.push(`Certaines natures des lignes du tableau sont érronées. Veuillez bien valider cette colonne en respectant leurs valeurs appropriées : General, Aux, Collectif.`);
            nbrAnom = nbrAnom + 1;
            setNbrAnomalie(nbrAnom);
            setCouleurBoutonAnomalie(couleurAnom);
        }

        const missingBaseAux = data.filter(item => item.baseaux && item.baseaux.trim() === '');
        if (missingBaseAux.length > 0) {
            msg.push(`Tout les champs de la colonne baseaux sont obligatoires. Veuillez remplir ces champs, par leur compte associé dans la colonne compte si sa nature est de type autre que Aux. Dans le cas contraire, veuillez bien ajouter le compte associé à partir de la liste des comptes dans la colonne compte.`);
            nbrAnom = nbrAnom + 1;
            setNbrAnomalie(nbrAnom);
            setCouleurBoutonAnomalie(couleurAnom);
        }

        const colonneBaseAux = [...new Set(data.map(item => item.baseaux))];
        const colonneCompte = [...new Set(data.map(item => item.compte))];

        const matchingElements = colonneBaseAux.filter(item => !colonneCompte.includes(item));

        if (matchingElements.length > 0) {
            msg.push(`Les comptes associés à la colonne baseaux suivants n'existent pas dans la colonne compte : ${matchingElements.join(', ')}`);
            nbrAnom = nbrAnom + 1;
            setNbrAnomalie(nbrAnom);
            setCouleurBoutonAnomalie(couleurAnom);
        }

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

        const missingTypeTier = data.filter(item => item.typetier && item.typetier.trim() === '');
        if (missingTypeTier.length > 0) {
            msg.push(`Tout les champs de la colonne typetier doivent être remplis.`);
            nbrAnom = nbrAnom + 1;
            setNbrAnomalie(nbrAnom);
            setCouleurBoutonAnomalie(couleurAnom);
        }

        const expectedTypeTierValue = ["general", "sans-nif", "avec-nif", "etranger"];
        const DataTypeTierValue = [...new Set(data.map(item => item.typetier))];

        const fakeTypeTierValueData = DataTypeTierValue.filter(item => !expectedTypeTierValue.includes(item));
        if (fakeTypeTierValueData.length > 0) {
            msg.push(`Certains type de tier du tableau sont érronées. Veuillez remplir cette colonne par les mots clés suivants : general, sans-nif, avec-nif, etranger.`);
            nbrAnom = nbrAnom + 1;
            setNbrAnomalie(nbrAnom);
            setCouleurBoutonAnomalie(couleurAnom);
        }

        const listeTiersAvecNif = data.filter(item => item.typetier === 'avec-nif');
        const missingNif = listeTiersAvecNif.filter(item => item.typetier && item.typetier.trim() === '');
        if (missingNif.length > 0) {
            msg.push(`Certains tiers de type avec-nif n'ont pas de numéro nif renseigné dans la colonne nif.`);
            nbrAnom = nbrAnom + 1;
            setNbrAnomalie(nbrAnom);
            setCouleurBoutonAnomalie(couleurAnom);
        }

        msg.push(`NB: tous les champs pays vide seront remplis par le mot Madagascar automatiquement.`);
        setMsgAnomalie(msg);
    };

    const handleFileSelect = (event) => {
        const file = event.target.files[0];

        if (file) {
            Papa.parse(file, {
                complete: (result) => {
                    const headers = result.meta.fields;

                    if (validateHeaders(headers)) {
                        setTraitementModelePcMsg('Traitement des données du modèle de plan comptable en cours...');
                        setTraitementModelePcWaiting(true);
                        setProgressValue(0);

                        const couleurAnom = "#EB5B00";
                        let nbrAnom = 0;
                        let msg = [];
                        setMsgAnomalie('');
                        setCouleurBoutonAnomalie('white');
                        setNbrAnomalie(0);

                        const getValue = (row, keys) => {
                            for (const k of keys) {
                                if (row[k] !== undefined && row[k] !== null) return row[k];
                            }
                            return '';
                        };

                        const DataWithId = result.data.map((row, index) => ({
                            ...row,
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
                        setProgressValue(100);
                        setTimeout(() => {
                            setTraitementModelePcWaiting(false);
                            setProgressValue(0);
                        }, 800);

                        handleOpenAnomalieDetails();
                    }
                },
                header: true,
                skipEmptyLines: true,
                encoding: "UTF-8"
            });
        }
    }

    const handleOpenAnomalieDetails = () => {
        setOpenDetailsAnomalie(true);
    }

    const handleCloseAnomalieDetails = (value) => {
        setOpenDetailsAnomalie(value);
    }

    const handleCloseInformation = (value) => {
        setAnomaliePersiste(false);
    }

    const testIfNewNameModeleExist = async () => {
        const modeleName = formikImport.values.nomModele;
        const response = await axios.post(`/administration/ImportModelePc/testNewNameModelePc`, { compteId, modeleName });
        const resData = response.data;
        return resData.state;
    }

    const handleCloseInformationNameExist = (value) => {
        setNameExist(false);
    }

    const handleImportModelePc = async () => {
        if (nbrAnomalie > 0) {
            setAnomaliePersiste(true);
        } else {
            const testName = await testIfNewNameModeleExist();

            if (testName) {
                setNameExist(true);
            } else {
                setTraitementModelePcWaiting(true);
                setProgressValue(0);
                setTraitementModelePcMsg('Démarrage de l\'import...');

                // Utiliser SSE pour la progression en temps réel
                startImport(
                    '/administration/ImportModelePc/importModelePcWithProgress',
                    formikImport.values,
                    (eventData) => {
                        // Succès
                        setTimeout(() => {
                            setTraitementModelePcMsg('');
                            setTraitementModelePcWaiting(false);
                            setProgressValue(0);
                            toast.success(eventData.message);
                            setModelePc([]);
                            setNbrAnomalie(0);
                            setMsgAnomalie([]);
                            if (onSuccess) {
                                onSuccess();
                            }
                        }, 1500);
                    },
                    (error) => {
                        // Erreur
                        setTraitementModelePcMsg('');
                        setTraitementModelePcWaiting(false);
                        setProgressValue(0);
                        toast.error(error || "Erreur lors de l'import");
                    }
                );
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

                    <ImportProgressBar
                        isVisible={traitementModelePcWaiting || isImporting}
                        message={traitementModelePcMsg}
                        variant="determinate"
                        progress={progressValue}
                    />

                    <Stack width={"100%"} height={'70vh'}>
                        <VirtualTableImportModelPC tableHeader={columns} tableRow={modelePc} />
                    </Stack>
                </Stack>
            </form>

        </Box>
    )
}
