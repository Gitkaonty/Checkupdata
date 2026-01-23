import { React, useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Typography, Stack, Paper, Box, Tab, Badge, Button, Divider } from '@mui/material';
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
import PopupViewDetailsImportBalance from '../../../componentsTools/popupViewDetailsImportBalance';
import PopupActionConfirm from '../../../componentsTools/popupActionConfirm';
import ImportProgressBar from '../../../componentsTools/ImportProgressBar';
import PopupTestSelectedFile from '../../../componentsTools/popupTestSelectedFile';
import VirtualTableModifiableImportJnl from '../../../componentsTools/DeclarationEbilan/virtualTableModifiableImportJnl';
import useSSEImport from '../../../../hooks/useSSEImport';

export default function ImportBalance() {
    //Valeur du listbox choix exercice ou situation-----------------------------------------------------
    const [valSelect, setValSelect] = useState('');

    let initial = init[0];
    const [fileInfos, setFileInfos] = useState('');
    const [fileId, setFileId] = useState(0);
    const { id } = useParams();
    const [noFile, setNoFile] = useState(false);

    //récupération infos de connexion
    const { auth } = useAuth();
    const decoded = auth?.accessToken ? jwtDecode(auth.accessToken) : undefined;
    const compteId = decoded.UserInfo.compteId || null;
    const userId = decoded.UserInfo.userId || null;
    const navigate = useNavigate();

    // Hook SSE pour la progression en temps réel
    const { isImporting, progress: sseProgress, message: sseMessage, currentLine, totalLines, startImport } = useSSEImport();

    // Synchroniser les valeurs SSE avec l'affichage
    useEffect(() => {
        if (isImporting) {
            setProgressValue(sseProgress);
            const displayMessage = currentLine > 0 && totalLines > 0 
                ? `${sseMessage} (${currentLine}/${totalLines} lignes)`
                : sseMessage;
            setTraitementBalanceMsg(displayMessage);
        }
    }, [isImporting, sseProgress, sseMessage, currentLine, totalLines]);

    const [selectedExerciceId, setSelectedExerciceId] = useState(0);
    const [selectedPeriodeId, setSelectedPeriodeId] = useState(0);
    const [selectedPeriodeChoiceId, setSelectedPeriodeChoiceId] = useState(0);
    const [listeExercice, setListeExercice] = useState([]);
    const [listeSituation, setListeSituation] = useState([]);

    const [openDetailsAnomalie, setOpenDetailsAnomalie] = useState(false);
    const [nbrAnomalie, setNbrAnomalie] = useState(0);
    const [couleurBoutonAnomalie, setCouleurBoutonAnomalie] = useState('white');

    const [planComptable, setPlanComptable] = useState([]);
    const [balanceData, setBalanceData] = useState([]);
    const [msgAnomalie, setMsgAnomalie] = useState([]);
    const [traitementBalanceWaiting, setTraitementBalanceWaiting] = useState(false);
    const [traitementBalanceMsg, setTraitementBalanceMsg] = useState('');
    const [progressValue, setProgressValue] = useState(0);
    const [compteToCreate, setCompteToCreate] = useState([]);
    const [balanceDesequilibre, setBalanceDesequilibre] = useState(false);
    const [openDialogConfirmImport, setOpenDialogConfirmImport] = useState(false);

    const [totalMvtDebit, setTotalMvtDebit] = useState("0,00");
    const [totalMvtCredit, setTotalMvtCredit] = useState("0,00");
    const [totalSoldeDebit, setTotalSoldeDebit] = useState("0,00");
    const [totalSoldeCredit, setTotalSoldeCredit] = useState("0,00");

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
        GetListeExercice(idFile);
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

    //Récupérer la liste des exercices
    const GetListeExercice = (id) => {
        axios.get(`/paramExercice/listeExercice/${id}`).then((response) => {
            const resData = response.data;
            if (resData.state) {

                setListeExercice(resData.list);

                const exerciceNId = resData.list?.filter((item) => item.libelle_rang === "N");
                setListeSituation(exerciceNId);

                setSelectedExerciceId(exerciceNId[0].id);
                setSelectedPeriodeChoiceId(0);
                setSelectedPeriodeId(exerciceNId[0].id);

            } else {
                setListeExercice([]);
                toast.error("une erreur est survenue lors de la récupération de la liste des exercices");
            }
        })
    }

    //Récupérer la liste des exercices
    const GetListeSituation = (id) => {
        axios.get(`/paramExercice/listeSituation/${id}`).then((response) => {
            const resData = response.data;
            if (resData.state) {
                const list = resData.list;
                setListeSituation(resData.list);
                if (list.length > 0) {
                    setSelectedPeriodeId(list[0].id);
                }
            } else {
                setListeSituation([]);
                toast.error("une erreur est survenue lors de la récupération de la liste des exercices");
            }
        })
    }

    //Choix exercice
    const handleChangeExercice = (exercice_id) => {
        setSelectedExerciceId(exercice_id);
        setSelectedPeriodeChoiceId("0");
        setListeSituation(listeExercice?.filter((item) => item.id === exercice_id));
        setSelectedPeriodeId(exercice_id);
    }

    //Choix période
    const handleChangePeriode = (choix) => {
        setSelectedPeriodeChoiceId(choix);

        if (choix === 0) {
            setListeSituation(listeExercice?.filter((item) => item.id === selectedExerciceId));
            setSelectedPeriodeId(selectedExerciceId);
        } else if (choix === 1) {
            GetListeSituation(selectedExerciceId);
        }
    }

    //Récupération du plan comptable
    const recupPlanComptable = () => {
        axios.post(`/paramPlanComptable/pc`, { fileId }).then((response) => {
            const resData = response.data;
            if (resData.state) {
                setPlanComptable(resData.liste);
            } else {
                toast.error(resData.msg);
            }
        });
    }

    useEffect(() => {
        recupPlanComptable();
    }, [fileId]);

    //afficher ou non les détails des anomalies de l'import
    const handleOpenAnomalieDetails = () => {
        setOpenDetailsAnomalie(true);
    }

    const handleCloseAnomalieDetails = (value) => {
        setOpenDetailsAnomalie(value);
    }

    //entête du tableau balance
    // const columnHeaderbalanceData = [
    //     {
    //         field: 'compte', 
    //         headerName: "Compte", 
    //         type: 'string', 
    //         sortable : true, 
    //         width: 150, 
    //         headerAlign: 'left',
    //         align: 'left',
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
    //         headerClassName: 'MuiDataGrid-ColumnHeader'
    //     },
    //     {
    //         field: 'mvtdebit', 
    //         headerName: "mouvement débit", 
    //         type: 'number', 
    //         sortable : true, 
    //         width: 175, 
    //         headerAlign: 'right', 
    //         align: 'right',
    //         headerClassName: 'MuiDataGrid-ColumnHeader',
    //         renderCell: (params) => {
    //             const montant = new Intl.NumberFormat('fr-FR',
    //                 {
    //                     minimumFractionDigits: 2,
    //                     maximumFractionDigits: 2,
    //                 }
    //             ).format(params.row.mvtdebit.replace(',','.')) ;
    //             return (
    //                 <div>
    //                     {montant}
    //                 </div>
    //             )
    //         }
    //     },
    //     {
    //         field: 'mvtcredit', 
    //         headerName: "mouvement crédit", 
    //         type: 'number', 
    //         sortable : true, 
    //         width: 175, 
    //         headerAlign: 'right', 
    //         align: 'right',
    //         headerClassName: 'MuiDataGrid-ColumnHeader',
    //         renderCell: (params) => {
    //             const montant = new Intl.NumberFormat('fr-FR',
    //                 {
    //                     minimumFractionDigits: 2,
    //                     maximumFractionDigits: 2,
    //                 }
    //             ).format(params.row.mvtcredit.replace(',','.')) ;
    //             return (
    //                 <div>
    //                     {montant}
    //                 </div>
    //             )
    //         }
    //     },
    //     {
    //         field: 'soldedebit', 
    //         headerName: "solde crédit", 
    //         type: 'number', 
    //         sortable : true, 
    //         width: 175, 
    //         headerAlign: 'right', 
    //         align: 'right',
    //         headerClassName: 'MuiDataGrid-ColumnHeader',
    //         renderCell: (params) => {
    //             const montant = new Intl.NumberFormat('fr-FR',
    //                 {
    //                     minimumFractionDigits: 2,
    //                     maximumFractionDigits: 2,
    //                 }
    //             ).format(params.row.soldedebit.replace(',','.')) ;
    //             return (
    //                 <div>
    //                     {montant}
    //                 </div>
    //             )
    //         }
    //     },
    //     {
    //         field: 'soldecredit', 
    //         headerName: "solde crédit", 
    //         type: 'number', 
    //         sortable : true, 
    //         width: 175, 
    //         headerAlign: 'right', 
    //         align: 'right',
    //         headerClassName: 'MuiDataGrid-ColumnHeader',
    //         renderCell: (params) => {
    //             const montant = new Intl.NumberFormat('fr-FR',
    //                 {
    //                     minimumFractionDigits: 2,
    //                     maximumFractionDigits: 2,
    //                 }
    //             ).format(params.row.soldecredit.replace(',','.')) ;
    //             return (
    //                 <div>
    //                     {montant}
    //                 </div>
    //             )
    //         },
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
            id: 'mvtdebit',
            label: 'Mouvement débit',
            minWidth: 175,
            align: 'right',
            format: (value) => value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            isnumber: true
        },
        {
            id: 'mvtcredit',
            label: 'Mouvement crédit',
            minWidth: 175,
            align: 'right',
            format: (value) => value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            isnumber: true
        },

        {
            id: 'soldedebit',
            label: 'Solde débit',
            minWidth: 175,
            align: 'right',
            format: (value) => value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            isnumber: true
        },
        {
            id: 'soldecredit',
            label: 'Solde crédit',
            minWidth: 175,
            align: 'right',
            format: (value) => value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            isnumber: true
        },
    ];

    // const CustomFooter = () => {
    //     const styleTextLeft = (width) => ({
    //         marginLeft:5, 
    //         color:'white', 
    //         width: width, 
    //         fontWeight:'bold',
    //         marginRight:5,
    //         textAlign:'left',
    //         flexShrink: 0,
    //     });

    //     const style = (width) => ({
    //         marginLeft:5, 
    //         color:'white', 
    //         width: width, 
    //         fontWeight:'bold',
    //         marginRight:5,
    //         textAlign:'right',
    //         flexShrink: 0,
    //         fontSize: '15px'
    //     });

    //     const style2 = {
    //         height:"25px", 
    //         border: '1px solid white',
    //         flexShrink: 0,
    //     };

    //     return (

    //         <Stack alignItems={'end'}>
    //             <Stack direction={'row'} 
    //             backgroundColor={initial.theme} 
    //             height={"35px"} 
    //             style={{marginTop: 0}}
    //             alignItems={'center'}
    //             alignContent={'center'}
    //             justifyItems={'center'}
    //             width={"100%"}
    //             spacing={0}
    //             >
    //                 <Typography style={styleTextLeft(40)}></Typography>
    //                 <Divider orientation="vertical" style={style2}/>
    //                 <Typography style={styleTextLeft(137)}>Total</Typography>
    //                 <Divider orientation="vertical" style={style2}/>
    //                 <Typography style={style(337)}></Typography>
    //                 <Divider orientation="vertical" style={style2}/>
    //                 <Typography style={style(161)}>{totalMvtDebit}</Typography>
    //                 <Divider orientation="vertical" style={style2}/>
    //                 <Typography style={style(164)}>{totalMvtCredit}</Typography>
    //                 <Divider orientation="vertical" style={style2}/>
    //                 <Typography style={style(164)}>{totalSoldeDebit}</Typography>
    //                 <Divider orientation="vertical" style={style2}/>
    //                 <Typography style={style(164)}>{totalSoldeCredit}</Typography>
    //                 <Divider orientation="vertical" style={style2}/>
    //             </Stack>
    //             <GridFooterContainer >
    //                 <GridFooter sx={{ border: 'none' }}>

    //                 </GridFooter>
    //             </GridFooterContainer>
    //         </Stack> 
    //     );
    //   };

    //Formulaire pour l'import du journal
    const formikImport = useFormik({
        initialValues: {
            idCompte: compteId,
            idDossier: fileId,
            idExercice: selectedPeriodeId,
            balanceData: [],
        },
        validationSchema: Yup.object({

        }),
        onSubmit: (values) => {
            handleOpenDialogConfirmImport();
        },
    });

    //download modele d'import
    const handleDownloadModel = () => {
        const fileUrl = '/modeleImport/modeleImportBalance.csv';
        const link = document.createElement('a');
        link.href = fileUrl;
        link.download = 'ModeleImportBalance';
        link.click();
    }

    //Test d'existance du compte par rapport aux données dans paramétrage
    const existance = (param, liste) => {
        const missingCode = liste.filter(item => !param.includes(item));
        return missingCode;
    };

    //validation des entêtes si c'est bon ou pas
    const validateHeaders = (headers) => {
        const expectedHeaders = ["compte", "libelle", "mvtdebit", "mvtcredit", "soldedebit", "soldecredit"];

        // Comparer les en-têtes du CSV aux en-têtes attendus
        const missingHeaders = expectedHeaders.filter(header => !headers.includes(header));
        if (missingHeaders.length > 0) {
            toast.error(`Les en-têtes du modèle d'import suivants sont manquants : ${missingHeaders.join(', ')}`);
            return false;
        }
        return true;
    }

    //Controle solde débit et solde crédit
    const controleSolde = (array) => {
        let result = false;

        const totalDebit = array.reduce((acc, item) => {
            const soldedebitValue = parseFloat(item["soldedebit"].replace(',', '.')) || 0; // Convertir en nombre
            return acc + soldedebitValue;
        }, 0);

        const totalCredit = array.reduce((acc, item) => {
            const soldecreditValue = parseFloat(item["soldecredit"].replace(',', '.')) || 0; // Convertir en nombre
            return acc + soldecreditValue;
        }, 0);

        if (totalDebit === totalCredit) {
            result = true;
        }

        return result;
    };

    //Calcul solde débit et solde crédit
    const calculTotal = (array) => {

        const totalMvtDebit0 = array.reduce((acc, item) => {
            const Value = parseFloat(item["mvtdebit"].replace(',', '.')) || 0; // Convertir en nombre
            return acc + Value;
        }, 0);

        const totalMvtCredit0 = array.reduce((acc, item) => {
            const Value = parseFloat(item["mvtcredit"].replace(',', '.')) || 0; // Convertir en nombre
            return acc + Value;
        }, 0);

        const totalSoldeDebit0 = array.reduce((acc, item) => {
            const Value = parseFloat(item["soldedebit"].replace(',', '.')) || 0; // Convertir en nombre
            return acc + Value;
        }, 0);

        const totalSoldeCredit0 = array.reduce((acc, item) => {
            const Value = parseFloat(item["soldecredit"].replace(',', '.')) || 0; // Convertir en nombre
            return acc + Value;
        }, 0);

        const totalMvtDebit = new Intl.NumberFormat('fr-FR',
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }
        ).format(totalMvtDebit0);

        const totalMvtCredit = new Intl.NumberFormat('fr-FR',
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }
        ).format(totalMvtCredit0);

        const totalSoldeDebit = new Intl.NumberFormat('fr-FR',
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }
        ).format(totalSoldeDebit0);

        const totalSoldeCredit = new Intl.NumberFormat('fr-FR',
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }
        ).format(totalSoldeCredit0);

        setTotalMvtDebit(totalMvtDebit);
        setTotalMvtCredit(totalMvtCredit);
        setTotalSoldeDebit(totalSoldeDebit);
        setTotalSoldeCredit(totalSoldeCredit);
    };


    const handleFileSelect = (event) => {
        const file = event.target.files[0];

        if (file) {
            // Utilise PapaParse pour parser le fichier CSV

            Papa.parse(file, {
                complete: (result) => {
                    const headers = result.meta.fields;

                    if (validateHeaders(headers)) {
                        setTraitementBalanceMsg('Traitement des données de la balance en cours...');
                        setTraitementBalanceWaiting(true);
                        setProgressValue(0);

                        //réinitialiser les compteurs d'anomalies
                        const couleurAnom = "#EB5B00";
                        let nbrAnom = 0;
                        let msg = [];
                        setMsgAnomalie('');
                        setCouleurBoutonAnomalie('white');
                        setNbrAnomalie(0);
                        setBalanceDesequilibre(false);

                        const listeUniqueCompteInitial = [...new Set(result.data.map(item => item.compte))];
                        const listeUniqueCompte = listeUniqueCompteInitial.filter(item => item !== '');

                        const ListeCompteParams = [...new Set(planComptable.map(item => item.compte))];

                        const compteNotInParams = existance(ListeCompteParams, listeUniqueCompte);

                        if (compteNotInParams.length > 0) {
                            msg.push(`Les numéros de compte suivants n'existent pas encore dans votre dossier : ${compteNotInParams.join(', ')}`);

                            nbrAnom = nbrAnom + 1;
                            setNbrAnomalie(nbrAnom);
                            setCouleurBoutonAnomalie(couleurAnom);
                        }
                        calculTotal(result.data);
                        const verifSolde = controleSolde(result.data);
                        if (!verifSolde) {
                            msg.push(`Le total solde débit est différent du total solde crédit. La balance est déséquilibrée et vous ne pouvez pas poursuivre l'import.`);

                            nbrAnom = nbrAnom + 1;
                            setNbrAnomalie(nbrAnom);
                            setCouleurBoutonAnomalie(couleurAnom);
                            setBalanceDesequilibre(true);
                        }

                        setMsgAnomalie(msg);

                        const DataWithId = result.data.map((row, index) => ({ ...row, id: index }));

                        const reader = new FileReader();

                        setBalanceData(DataWithId);
                        formikImport.setFieldValue('balanceData', DataWithId);

                        const cptToCreate = DataWithId.filter(item => compteNotInParams.includes(item.compte));
                        setCompteToCreate(cptToCreate);

                        event.target.value = null;
                        setProgressValue(100);
                        setTimeout(() => {
                            setTraitementBalanceWaiting(false);
                            setProgressValue(0);
                        }, 800);

                        handleOpenAnomalieDetails();
                    }
                },
                header: true, // Si tu veux que la première ligne soit utilisée comme clé d'objet (si le CSV a des en-têtes)
                skipEmptyLines: true, // Ignore les lignes vides
                encoding: "UTF-8"
            });
        }
    }

    //import de la balance
    const handleOpenDialogConfirmImport = () => {
        formikImport.setFieldValue("idCompte", compteId);
        formikImport.setFieldValue("idDossier", fileId);
        formikImport.setFieldValue("idExercice", selectedPeriodeId);

        setOpenDialogConfirmImport(true);
    }

    const handleCloseDialogConfirmImport = () => {
        setOpenDialogConfirmImport(false);
    }

    //création des comptes qui n'existe pas encore avant import journal
    const createCompteNotExisting = async () => {
        const response = await axios.post(`/administration/importBalance/createNotExistingCompte`, { compteId, fileId, compteToCreate });
        const resData = response.data;
        return resData.list;
    }

    const handleImportBalance = async (value) => {
        if (value) {
            const UpdatedPlanComptable = await createCompteNotExisting();

            if (UpdatedPlanComptable.length === 0) {
                toast.error("Un problème est survenue lors de la création des comptes manquants.");
            }

            if (UpdatedPlanComptable.length > 0) {
                setTraitementBalanceMsg('Import de la balance en cours...');
                setTraitementBalanceWaiting(true);
                setProgressValue(0);

                // Utiliser SSE pour la progression en temps réel
                startImport(
                    '/administration/importBalance/importBalanceWithProgress',
                    { compteId, userId, fileId, selectedPeriodeId, balanceData },
                    (eventData) => {
                        // Succès
                        setTimeout(() => {
                            setTraitementBalanceMsg('');
                            setTraitementBalanceWaiting(false);
                            setProgressValue(0);
                            toast.success(eventData.message);
                            setBalanceData([]);
                            setNbrAnomalie(0);
                            setMsgAnomalie([]);
                        }, 800);
                    },
                    (error) => {
                        // Erreur
                        setTraitementBalanceMsg('');
                        setTraitementBalanceWaiting(false);
                        setProgressValue(0);
                        toast.error(error || "Erreur lors de l'import");
                    }
                );
            }

            handleCloseDialogConfirmImport();
        } else {
            handleCloseDialogConfirmImport();
        }
    }

    return (
        <Box>
            {noFile ? <PopupTestSelectedFile confirmationState={sendToHome} /> : null}
            {openDetailsAnomalie ? <PopupViewDetailsImportBalance msg={msgAnomalie} confirmationState={handleCloseAnomalieDetails} /> : null}
            {openDialogConfirmImport ? <PopupActionConfirm msg={"Voulez-vous vraiment importer la balance en cours? Attention, les anciennes données de la balance seront écrasées par les nouvelles."} confirmationState={handleImportBalance} /> : null}

            <TabContext value={"1"} >
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
                <TabPanel value="1" style={{ height: '85%' }}>
                    <form onSubmit={formikImport.handleSubmit}>
                        <Stack width={"100%"} height={"100%"} spacing={0} direction={'column'}>
                            <Typography variant='h6' sx={{ color: "black" }} align='left'>Administration - Import Balance</Typography>

                            <Stack width={"100%"} height={"80px"} spacing={4} alignItems={"left"} alignContent={"center"} direction={"row"} style={{ marginLeft: "0px", marginTop: "20px" }}>
                                <FormControl variant="standard" sx={{ m: 1, minWidth: 250 }}>
                                    <InputLabel id="demo-simple-select-standard-label">Exercice:</InputLabel>
                                    <Select
                                        labelId="demo-simple-select-standard-label"
                                        id="demo-simple-select-standard"
                                        value={selectedExerciceId}
                                        label={"valSelect"}
                                        onChange={(e) => handleChangeExercice(e.target.value)}
                                        sx={{ width: "300px", display: "flex", justifyContent: "left", alignItems: "flex-start", alignContent: "flex-start", textAlign: "left" }}
                                    >
                                        {listeExercice.map((option) => (
                                            <MenuItem key={option.id} value={option.id}>{option.libelle_rang}: {format(option.date_debut, "dd/MM/yyyy")} - {format(option.date_fin, "dd/MM/yyyy")}</MenuItem>
                                        ))
                                        }
                                    </Select>
                                </FormControl>

                                <FormControl variant="standard" sx={{ m: 1, minWidth: 150 }}>
                                    <InputLabel id="demo-simple-select-standard-label">Période</InputLabel>
                                    <Select
                                        disabled
                                        labelId="demo-simple-select-standard-label"
                                        id="demo-simple-select-standard"
                                        value={selectedPeriodeChoiceId}
                                        label={"valSelect"}
                                        onChange={(e) => handleChangePeriode(e.target.value)}
                                        sx={{ width: "150px", display: "flex", justifyContent: "left", alignItems: "flex-start", alignContent: "flex-start", textAlign: "left" }}
                                    >
                                        <MenuItem value={0}>Toutes</MenuItem>
                                        <MenuItem value={1}>Situations</MenuItem>
                                    </Select>
                                </FormControl>

                                <FormControl variant="standard" sx={{ m: 1, minWidth: 250 }}>
                                    <InputLabel id="demo-simple-select-standard-label">Du</InputLabel>
                                    <Select
                                        labelId="demo-simple-select-standard-label"
                                        id="demo-simple-select-standard"
                                        value={selectedPeriodeId}
                                        label={"valSelect"}
                                        onChange={(e) => handleChangeDateIntervalle(e.target.value)}
                                        sx={{ width: "300px", display: "flex", justifyContent: "left", alignItems: "flex-start", alignContent: "flex-start", textAlign: "left" }}
                                    >
                                        {listeSituation?.map((option) => (
                                            <MenuItem key={option.id} value={option.id}>{option.libelle_rang}: {format(option.date_debut, "dd/MM/yyyy")} - {format(option.date_fin, "dd/MM/yyyy")}</MenuItem>
                                        ))
                                        }
                                    </Select>
                                </FormControl>
                            </Stack>

                            <Stack width={"100%"} height={"100px"} spacing={2} alignItems={"center"} alignContent={"center"} direction={"row"} style={{ marginLeft: "0px", marginTop: "0px" }}>

                                <Stack spacing={1} width={"380px"} height={"50px"} direction={"row"}
                                    style={{ border: '2px dashed rgba(5,96,116,0.60)', marginLeft: "0px", paddingLeft: "20px" }}
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

                                <Stack spacing={1} width={"350px"} height={"50px"} direction={"row"}
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

                                    <Typography variant='h7' sx={{ color: "black", fontWeight: "bold" }} align='left'>
                                        Importer depuis le fichier
                                    </Typography>

                                    <List style={{ marginLeft: "10px" }}>
                                        <ListItem style={{ width: "100px", justifyContent: "center" }}>
                                            <ListItemButton 
                                                disabled={!listeExercice || listeExercice.length === 0 || !selectedExerciceId || selectedExerciceId === 0}
                                                onClick={() => document.getElementById('fileInput').click()}
                                            >
                                                <ListItemIcon > <SaveAltIcon style={{ width: "40px", height: "30px", color: 'rgba(5,96,116,0.60)' }} /> </ListItemIcon>
                                            </ListItemButton>
                                        </ListItem>
                                    </List>
                                </Stack>

                                <Badge badgeContent={nbrAnomalie} color="warning">
                                    <Button
                                        disabled={!listeExercice || listeExercice.length === 0 || !selectedExerciceId || selectedExerciceId === 0}
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
                                    disabled={!listeExercice || listeExercice.length === 0 || !selectedExerciceId || selectedExerciceId === 0 || balanceDesequilibre}
                                    type='submit'
                                    variant="contained"
                                    style={{
                                        height: "50px",
                                        textTransform: 'none',
                                        outline: 'none',
                                        backgroundColor: initial.theme,
                                        color: "white"
                                    }}
                                >
                                    Importer
                                </Button>
                            </Stack>

                            <ImportProgressBar 
                                isVisible={traitementBalanceWaiting}
                                message={traitementBalanceMsg}
                                variant="determinate"
                                progress={progressValue}
                            />

                            <Stack width={"85%"} height={'50vh'}>
                                <VirtualTableModifiableImportJnl columns={columns} rows={balanceData} state={true} />
                                {/* <DataGrid
                                disableMultipleSelection = {DataGridStyle.disableMultipleSelection}
                                disableColumnSelector = {DataGridStyle.disableColumnSelector}
                                disableDensitySelector = {DataGridStyle.disableDensitySelector}
                                localeText={frFR.components.MuiDataGrid.defaultProps.localeText}
                                disableRowSelectionOnClick
                                disableSelectionOnClick={true}
                                //slots={{toolbar : QuickFilter}}
                                slots={{toolbar : QuickFilter, footer: CustomFooter}}
                                sx={ DataGridStyle.sx}
                                rowHeight= {DataGridStyle.rowHeight}
                                columnHeaderHeight= {DataGridStyle.columnHeaderHeight}
                                rows={balanceData}
                                columns={columnHeaderbalanceData}
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

                </TabPanel>
            </TabContext>

        </Box>
    )
}
