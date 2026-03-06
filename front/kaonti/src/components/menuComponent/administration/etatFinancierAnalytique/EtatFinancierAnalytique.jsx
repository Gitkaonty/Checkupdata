import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Typography, Stack, IconButton, Checkbox, Autocomplete, TextField } from '@mui/material';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import { useState } from 'react';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import ButtonGroup from '@mui/material/ButtonGroup';
import Button from '@mui/material/Button';
import { TbRefresh } from "react-icons/tb";
import Tooltip from '@mui/material/Tooltip';

import { init } from '../../../../../init';
import useAuth from '../../../../hooks/useAuth';
import PopupTestSelectedFile from '../../../componentsTools/popupTestSelectedFile';
import { InfoFileStyle } from '../../../componentsTools/InfosFileStyle';
import { jwtDecode } from 'jwt-decode';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

import PopupActionConfirm from '../../../componentsTools/popupActionConfirm';

import { useTheme } from '@mui/material/styles';

import axios, { URL } from '../../../../../config/axios';
import { CiLock } from "react-icons/ci";
import { CiUnlock } from "react-icons/ci";

import ExportEtatFinancierAnalytiqueButton from '../../../componentsTools/EtatFinancierAnalytique/ExportEtatFinancierAnalytiqueButton/ExportEtatFinancierAnalytiqueButton';
import ExportEtatFinancierAnalytiqueButtonAll from '../../../componentsTools/EtatFinancierAnalytique/ExportEtatFinancierAnalytiqueButton/ExportEtatFinancierAnalytiqueButtonAll';

import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import VirtualTableEbilanEtatFinaciereAnalytique from '../../../componentsTools/EtatFinancierAnalytique/virtualTableEbilanEtatFinancierAnalytique';
import VirtualTableEvcpEtatFinancierAnalytique from '../../../componentsTools/EtatFinancierAnalytique/virtualTableEvcpEtatFinancierAnalytique';

import usePermission from '../../../../hooks/usePermission';

const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" />;

//colonne bilan
const BilanActifColumn = [
    {
        id: 'libelle',
        label: 'Actif',
        minWidth: 500,
        align: 'left',
        //format: (value) => value.toLocaleString('en-US'),
        isNumber: false
    },
    {
        id: 'montantbrut',
        label: 'Montant brut',
        minWidth: 200,
        align: 'right',
        format: (value) => value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        isNumber: true
    },
    {
        id: 'montantamort',
        label: 'Amort. / perte val.',
        minWidth: 200,
        align: 'right',
        format: (value) => value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        isNumber: true
    },
    {
        id: 'montantnet',
        label: 'Montant net N',
        minWidth: 200,
        align: 'right',
        format: (value) => value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        isNumber: true
    },
    {
        id: 'montantnetn1',
        label: 'Montant net N-1',
        minWidth: 200,
        align: 'right',
        format: (value) => value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        isNumber: true
    },
    {
        id: 'variation',
        label: 'Variation',
        minWidth: 100,
        align: 'center',
        isNumber: false
    },
];

const BilanPassifColumn = [
    {
        id: 'libelle',
        label: 'Capitaux propres et passifs',
        minWidth: 700,
        align: 'left',
        //format: (value) => value.toLocaleString('en-US'),
        isNumber: false
    },
    {
        id: 'montantnet',
        label: 'Montant net N',
        minWidth: 200,
        align: 'right',
        format: (value) => value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        isNumber: true
    },
    {
        id: 'montantnetn1',
        label: 'Montant net N-1',
        minWidth: 200,
        align: 'right',
        format: (value) => value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        isNumber: true
    },
];

const crnColumn = [
    {
        id: 'libelle',
        label: 'Rubriques',
        minWidth: 700,
        align: 'left',
        //format: (value) => value.toLocaleString('en-US'),
        isNumber: false
    },
    {
        id: 'montantnet',
        label: 'Montant net N',
        minWidth: 200,
        align: 'right',
        format: (value) => value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        isNumber: true
    },
    {
        id: 'montantnetn1',
        label: 'Montant net N-1',
        minWidth: 200,
        align: 'right',
        format: (value) => value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        isNumber: true
    },
];

const tftdColumn = [
    {
        id: 'libelle',
        label: 'Rubriques',
        minWidth: 700,
        align: 'left',
        //format: (value) => value.toLocaleString('en-US'),
        isNumber: false
    },
    {
        id: 'montantnet',
        label: 'Montant net N',
        minWidth: 200,
        align: 'right',
        format: (value) => value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        isNumber: true
    },
    {
        id: 'montantnetn1',
        label: 'Montant net N-1',
        minWidth: 200,
        align: 'right',
        format: (value) => value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        isNumber: true
    },
];

const evcpColumn = [
    {
        id: 'libelle',
        label: 'Rubriques',
        minWidth: 300,
        align: 'left',
        //format: (value) => value.toLocaleString('en-US'),
        isNumber: false
    },
    {
        id: 'note',
        label: 'Note',
        minWidth: 100,
        align: 'left',
        isNumber: false
    },
    {
        id: 'capitalsocial',
        label: 'Capital social A6',
        minWidth: 200,
        align: 'right',
        format: (value) => value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        isNumber: true
    },
    {
        id: 'primereserve',
        label: 'Capital prime & res. B6',
        minWidth: 200,
        align: 'right',
        format: (value) => value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        isNumber: true
    },
    {
        id: 'ecartdevaluation',
        label: "Ecart d'évaluation C6",
        minWidth: 200,
        align: 'right',
        format: (value) => value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        isNumber: true
    },
    {
        id: 'resultat',
        label: "Résultat D6",
        minWidth: 200,
        align: 'right',
        format: (value) => value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        isNumber: true
    },
    {
        id: 'report_anouveau',
        label: "Report à nouveau E6",
        minWidth: 200,
        align: 'right',
        format: (value) => value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        isNumber: true
    },
    {
        id: 'total_varcap',
        label: "Total A6+B6+C6+D6+E6",
        minWidth: 200,
        align: 'right',
        format: (value) => value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        isNumber: true
    },
];

export default function EtatFinancierAnalytique() {
    const { canAdd, canModify, canDelete, canView } = usePermission();

    //Valeur du listbox choix exercice ou situation-----------------------------------------------------
    let tabFinancierAnalytique = "";
    let axeId = 0;
    if (typeof window !== "undefined") {
        tabFinancierAnalytique = localStorage.getItem('tabFinancierAnalytique');
        axeId = localStorage.getItem('axeId');
    }

    const [value, setValue] = useState(tabFinancierAnalytique || "1");

    const [axesData, setAxesData] = useState([]);
    const [sectionsData, setSectionsData] = useState([]);
    const [isCaActive, setIsCaActive] = useState(false);

    const [selectedAxeId, setSelectedAxeId] = useState(0);
    const [selectedSectionsId, setSelectedSectionsId] = useState([]);

    let initial = init[0];
    const [fileInfos, setFileInfos] = useState('');
    const [fileId, setFileId] = useState(0);
    const { id } = useParams();
    const [noFile, setNoFile] = useState(false);

    const [selectedExerciceId, setSelectedExerciceId] = useState(0);
    const [selectedPeriodeId, setSelectedPeriodeId] = useState(0);
    const [selectedPeriodeChoiceId, setSelectedPeriodeChoiceId] = useState(0);
    const [listeExercice, setListeExercice] = useState([]);
    const [listeSituation, setListeSituation] = useState([]);
    const [deviseParDefaut, setDeviseParDefaut] = useState('MGA');

    const [showBilan, setShowBilan] = useState('actif');
    const [buttonActifVariant, setButtonActifVariant] = useState('contained');
    const [buttonPassifVariant, setButtonPassifVariant] = useState('outlined');

    const [verrBilan, setVerrBilan] = useState(false);
    const [verrCrn, setVerrCrn] = useState(false);
    const [verrCrf, setVerrCrf] = useState(false);
    const [verrTftd, setVerrTftd] = useState(false);
    const [verrTfti, setVerrTfti] = useState(false);
    const [verrEvcp, setVerrEvcp] = useState(false);

    const [bilanActifData, setBilanActifData] = useState([]);
    const [bilanPassifData, setBilanPassifData] = useState([]);
    const [crnData, setCrnData] = useState([]);
    const [crfData, setCrfData] = useState([]);
    const [tftdData, setTftdData] = useState([]);
    const [tftiData, setTftiData] = useState([]);
    const [evcpData, setEvcpData] = useState([]);

    const [showTableRefresh, setShowTableRefresh] = useState(false);
    const [tableToRefresh, setTableToRefresh] = useState('');
    const [msgRefresh, setMsgRefresh] = useState('');

    const [isRefreshed, setIsRefreshed] = useState(false);

    const [isLoading, setIsLoading] = useState(false);

    const theme = useTheme();

    //récupération infos de connexion
    const { auth } = useAuth();
    const decoded = auth?.accessToken ? jwtDecode(auth.accessToken) : undefined;
    const compteId = decoded.UserInfo.compteId || null;
    const userId = decoded.UserInfo.userId || null;
    const navigate = useNavigate();

    //Choix exercice
    const handleChangeExercice = (exercice_id) => {
        setSelectedExerciceId(exercice_id);
        setSelectedPeriodeChoiceId("0");
        setListeSituation(listeExercice?.filter((item) => item.id === exercice_id));
        setSelectedPeriodeId(exercice_id);

        getVerouillageEtatFinancierAnalytique(compteId, fileId, exercice_id);
    }

    //Choix période
    const handleChangePeriode = (choix) => {
        setSelectedPeriodeChoiceId(choix);

        if (choix === 0) {
            setListeSituation(listeExercice?.filter((item) => item.id === selectedExerciceId));
            setSelectedPeriodeId(selectedExerciceId);

            getVerouillageEtatFinancierAnalytique(compteId, fileId, selectedExerciceId);
        } else if (choix === 1) {
            GetListeSituation(selectedExerciceId);
        }
    }

    const handleChangeTAB = (event, newValue) => {
        setValue(newValue);
        localStorage.setItem('tabFinancierAnalytique', newValue);
    };

    const handleOpenDialogConfirmRefresh = () => {
        setShowTableRefresh(true);
    }

    const handleCloseDialogConfirmRefresh = () => {
        setShowTableRefresh(false);
    }

    //Refresh tableau
    const handleRefreshTable = async (value) => {
        if (value) {
            setIsLoading(true);
            const id_sectionMapped = selectedSectionsId.map(val => Number(val.id));
            try {
                await axios.post('/administration/etatFinancierAnalytique/generateTableEtatFinancierAnalytique', {
                    id_compte: Number(compteId),
                    id_dossier: Number(fileId),
                    id_exercice: Number(selectedExerciceId),
                    id_etat: tableToRefresh,
                    id_axe: selectedAxeId,
                    id_sections: id_sectionMapped
                }).then((response) => {
                    const resData = response?.data;
                    if (resData.state) {
                        toast.success(resData?.message);
                        setIsRefreshed(prev => !prev);
                    } else {
                        toast.error(resData?.message)
                    }
                })
            } catch (error) {
                const errMsg = error.response?.data?.message || error.message || "Erreur inconnue";
                toast.error(errMsg);
            } finally {
                handleCloseDialogConfirmRefresh();
            }
        } else {
            handleCloseDialogConfirmRefresh();
        }
        setIsLoading(false);
    }

    // Récupération données liste des devises
    const getListeDevises = () => {
        axios.get(`/devises/devise/compte/${compteId}/${fileId}`)
            .then((response) => {
                const data = response.data;
                const defaultDevise = data.find(val => val.par_defaut === true);
                if (defaultDevise) {
                    setDeviseParDefaut(defaultDevise.code);
                }
            })
    }

    //===========================================================================================
    //TABLEAU BILAN
    //===========================================================================================

    //choix affichage tableau bilan (Actif ou passif = actif à l'ouverture)
    const choixAffichageBilan = (choix) => {
        setShowBilan(choix);

        if (choix === 'actif') {
            setButtonActifVariant('contained');
            setButtonPassifVariant('outlined');
        } else {
            setButtonActifVariant('outlined');
            setButtonPassifVariant('contained');
        }
    }
    //refresh table BILAN
    const refreshBILAN = () => {
        setTableToRefresh('BILAN');
        setMsgRefresh(`Voulez-vous vraiment actualiser les calculs pour le tableau du Bilan?`);
        handleOpenDialogConfirmRefresh();
    }

    //verouiller ou non le tableau de BILAN
    const lockTableBILAN = () => {
        lockEtatFinancierAnalytique(compteId, fileId, selectedPeriodeId, 'BILAN', verrBilan);
        setVerrBilan(!verrBilan);
    }

    //===========================================================================================
    //TABLEAU CRN
    //===========================================================================================

    //refresh table CRN
    const refreshCRN = () => {
        setTableToRefresh('CRN');
        setMsgRefresh(`Voulez-vous vraiment actualiser les calculs pour le tableau CRN?`);
        handleOpenDialogConfirmRefresh();
    }

    //verouiller ou non le tableau de CRN
    const lockTableCRN = () => {
        lockEtatFinancierAnalytique(compteId, fileId, selectedPeriodeId, 'CRN', verrCrn);
        setVerrCrn(!verrCrn);
    }

    //===========================================================================================
    //TABLEAU CRF
    //===========================================================================================

    //refresh table CRF
    const refreshCRF = () => {
        setTableToRefresh('CRF');
        setMsgRefresh(`Voulez-vous vraiment actualiser les calculs pour le tableau CRF?`);
        handleOpenDialogConfirmRefresh();
    }

    //verouiller ou non le tableau de CRF
    const lockTableCRF = () => {
        lockEtatFinancierAnalytique(compteId, fileId, selectedPeriodeId, 'CRF', verrCrf);
        setVerrCrf(!verrCrf);
    }

    //===========================================================================================
    //TABLEAU TFTD
    //===========================================================================================

    //refresh table TFTD
    const refreshTFTD = () => {
        setTableToRefresh('TFTD');
        setMsgRefresh(`Voulez-vous vraiment actualiser les calculs pour le tableau TFTD?`);
        handleOpenDialogConfirmRefresh();
    }

    //verouiller ou non le tableau de TFTD
    const lockTableTFTD = () => {
        lockEtatFinancierAnalytique(compteId, fileId, selectedPeriodeId, 'TFTD', verrTftd);
        setVerrTftd(!verrTftd);
    }

    //===========================================================================================
    //TABLEAU TFTI
    //===========================================================================================

    //refresh table TFTI
    const refreshTFTI = () => {
        setTableToRefresh('TFTI');
        setMsgRefresh(`Voulez-vous vraiment actualiser les calculs pour le tableau TFTI?`);
        handleOpenDialogConfirmRefresh();
    }

    //verouiller ou non le tableau de TFTI
    const lockTableTFTI = () => {
        lockEtatFinancierAnalytique(compteId, fileId, selectedPeriodeId, 'TFTI', verrTfti);
        setVerrTfti(!verrTfti);
    }

    //===========================================================================================
    //TABLEAU EVCP
    //===========================================================================================

    //refresh table EVCP
    const refreshEVCP = () => {
        setTableToRefresh('EVCP');
        setMsgRefresh(`Voulez-vous vraiment actualiser les calculs pour le tableau EVCP?`);
        handleOpenDialogConfirmRefresh();
    }

    //verouiller ou non le tableau EVCP
    const lockTableEVCP = () => {
        lockEtatFinancierAnalytique(compteId, fileId, selectedPeriodeId, 'EVCP', verrEvcp);
        setVerrEvcp(!verrEvcp);
    }

    const GetInfosIdDossier = (id) => {
        axios.get(`/home/FileInfos/${id}`).then((response) => {
            const resData = response.data;

            if (resData.state) {
                setFileInfos(resData.fileInfos[0]);
                setIsCaActive(resData?.fileInfos[0]?.avecanalytique);
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

                getVerouillageEtatFinancierAnalytique(compteId, id, exerciceNId[0].id);
            } else {
                setListeExercice([]);
                //toast.error("une erreur est survenue lors de la récupération de la liste des exercices");
                return
            }
        })
    }

    //get information de vérouillage ou non des tableaus
    const getVerouillageEtatFinancierAnalytique = (compteId, fileId, exerciceId) => {
        axios.post(`/administration/etatFinancierAnalytique/getVerouillageEtatFinancierAnalytique`, { compteId, fileId, exerciceId }).then((response) => {
            const resData = response.data;
            if (resData.state) {
                setVerrBilan(resData.liste.find((item) => item.code === 'BILAN')?.valide);
                setVerrCrn(resData.liste.find((item) => item.code === 'CRN')?.valide);
                setVerrCrf(resData.liste.find((item) => item.code === 'CRF')?.valide);
                setVerrTftd(resData.liste.find((item) => item.code === 'TFTD')?.valide);
                setVerrTfti(resData.liste.find((item) => item.code === 'TFTI')?.valide);
                setVerrEvcp(resData.liste.find((item) => item.code === 'EVCP')?.valide);
            } else {
                toast.error(resData.msg);
            }
        });
    }

    //get information de vérouillage ou non des tableaus
    const lockEtatFinancierAnalytique = (compteId, fileId, exerciceId, tableau, stateVerr) => {
        const verr = !stateVerr;
        axios.post(`/administration/etatFinancierAnalytique/lockEtatFinancierAnalytique`, { compteId, fileId, exerciceId, tableau, verr }).then((response) => {
            const resData = response.data;
            if (resData.state) {
                getVerouillageEtatFinancierAnalytique(compteId, fileId, selectedPeriodeId);
            } else {
                toast.error(resData.msg);
            }
        });
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
                //toast.error("une erreur est survenue lors de la récupération de la liste des exercices");
                return
            }
        })
    }

    const getEtatFinancierAnalytiqueGlobal = () => {
        const id_sectionMapped = selectedSectionsId.map(val => Number(val.id));
        axios.post(`/administration/etatFinancierAnalytique/getEtatFinancierAnalytique`, {
            id_compte: Number(compteId),
            id_dossier: Number(fileId),
            id_exercice: Number(selectedExerciceId),
            axeId: axeId,
            sectionId: id_sectionMapped
        })
            .then((response) => {
                if (response?.data?.state) {
                    const resData = response?.data;
                    setBilanActifData(resData?.liste?.BILAN_ACTIF || []);
                    setBilanPassifData(resData?.liste?.BILAN_PASSIF || []);
                    setCrnData(resData?.liste?.CRN || []);
                    setCrfData(resData?.liste?.CRF || []);
                    setTftdData(resData?.liste?.TFTD || []);
                    setTftiData(resData?.liste?.TFTI || []);
                    setEvcpData(resData?.liste?.EVCP || []);
                } else {
                    toast.error(resData.message);
                }
            })
    }

    // Générer une tableau en PDF ou Excel
    const exportFile = (type) => {
        let libelle = "";
        if (value === "1") {
            libelle = "BILAN";
        } else if (value === "2") {
            libelle = "CRN";
        } else if (value === "3") {
            libelle = "CRF";
        } else if (value === "4") {
            libelle = "TFTD";
        } else if (value === "5") {
            libelle = "TFTI";
        } else if (value === "6") {
            libelle = "EVCP"
        }

        const id_sectionMapped = selectedSectionsId.map(val => Number(val.id));

        if (type === "PDF") {
            window.open(
                `${URL}/administration/etatFinancierAnalytique/exportEtatFinancierAnalytiqueToPdf/${compteId}/${fileId}/${selectedExerciceId}/${libelle}/${axeId}/${id_sectionMapped}`,
                "_blank"
            );
        } else {
            const link = document.createElement('a');
            link.href = `${URL}/administration/etatFinancierAnalytique/exportEtatFinancierAnalytiqueToExcel/${compteId}/${fileId}/${selectedExerciceId}/${libelle}/${axeId}/${id_sectionMapped}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }
    // Générer toutes les tableaux en PDF ou Excel
    const exportAllFile = (type) => {
        const id_sectionMapped = selectedSectionsId.map(val => Number(val.id));
        if (type === 'PDF') {
            window.open(
                `${URL}/administration/etatFinancierAnalytique/exportAllEtatFinancierAnalytiqueToPdf/${compteId}/${fileId}/${selectedExerciceId}/${axeId}/${id_sectionMapped}`,
                "_blank"
            );
        } else if (type === 'EXCEL') {
            const link = document.createElement('a');
            link.href = `${URL}/administration/etatFinancierAnalytique/exportAllEtatFinancierAnalytiqueToExcel/${compteId}/${fileId}/${selectedExerciceId}/${axeId}/${id_sectionMapped}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    const handleChangeAxe = (e) => {
        setSelectedAxeId(e.target.value);
        localStorage.setItem('axeId', e.target.value);
        localStorage.removeItem('sectionIds');
        setSelectedSectionsId([]);
    }

    const handleGetAxes = () => {
        axios.get(`/paramCa/getAxes/${Number(compteId)}/${Number(fileId)}`)
            .then((response) => {
                if (response?.data?.state) {
                    setAxesData(response?.data?.data);
                    setSelectedAxeId(axeId || response?.data?.data[0]?.id)
                } else {
                    toast.error(response?.data?.message);
                }
            })
    }

    const handleGetSections = () => {
        axios.post(`/paramCa/getSectionsByAxeIds/${Number(compteId)}/${Number(fileId)}`, {
            selectedRowAxeId: Number(selectedAxeId)
        })
            .then((response) => {
                if (response?.data?.state) {
                    setSectionsData(response?.data?.data)
                } else {
                    toast.error(response?.data?.message);
                }
            })
    }

    useEffect(() => {
        handleGetAxes();
    }, [selectedExerciceId])

    useEffect(() => {
        if (selectedAxeId) {
            handleGetSections();
        }
    }, [selectedAxeId])

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

    useEffect(() => {
        if (canView && fileId && compteId && selectedExerciceId && selectedAxeId && selectedSectionsId) {
            getEtatFinancierAnalytiqueGlobal();
            getListeDevises();
        }
    }, [fileId, compteId, selectedExerciceId, selectedAxeId, selectedSectionsId, isRefreshed])

    useEffect(() => {
        if (!sectionsData.length) return;

        const raw = localStorage.getItem("sectionIds");
        if (!raw) return;

        const saved = JSON.parse(raw);

        const matched = sectionsData.filter(sec =>
            saved.some(s => s.id === sec.id)
        );

        setSelectedSectionsId(matched);
    }, [sectionsData]);

    return (
        <Box>
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
                showTableRefresh
                    ?
                    <PopupActionConfirm
                        msg={msgRefresh}
                        confirmationState={handleRefreshTable}
                        isLoading={isLoading}
                    />
                    :
                    null
            }

            <TabContext value={"1"}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <TabList aria-label="lab API tabs example" style={{ textTransform: 'none', outline: 'none', border: 'none', }}>
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
                <TabPanel value="1" style={{ height: '100%' }}>
                    <Stack width={"100%"} height={"100%"} spacing={1} alignItems={"flex-start"} alignContent={"flex-start"} justifyContent={"stretch"}>
                        <Typography variant='h6' sx={{ color: "black" }} align='left'>Administration - Etats Financiers Analytique</Typography>

                        <Stack width={"100%"} height={"80px"} spacing={4} alignItems={"left"} alignContent={"center"} direction={"row"} style={{ marginLeft: "0px", marginTop: "20px" }}>
                            <Stack
                                direction={'row'}
                            >
                                <FormControl variant="standard" sx={{ m: 1, minWidth: 250 }}>
                                    <InputLabel id="demo-simple-select-standard-label">Exercice:</InputLabel>
                                    <Select
                                        labelId="demo-simple-select-standard-label"
                                        id="demo-simple-select-standard"
                                        value={selectedExerciceId}
                                        label={"valSelect"}
                                        onChange={(e) => handleChangeExercice(e.target.value)}
                                        sx={{ width: "300px", display: "flex", justifyContent: "left", alignItems: "flex-start", alignContent: "flex-start", textAlign: "left" }}
                                        MenuProps={{
                                            disableScrollLock: true
                                        }}
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
                                        labelId="demo-simple-select-standard-label"
                                        id="demo-simple-select-standard"
                                        value={selectedPeriodeChoiceId}
                                        label={"valSelect"}
                                        onChange={(e) => handleChangePeriode(e.target.value)}
                                        sx={{ width: "150px", display: "flex", justifyContent: "left", alignItems: "flex-start", alignContent: "flex-start", textAlign: "left" }}
                                        MenuProps={{
                                            disableScrollLock: true
                                        }}
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
                                        MenuProps={{
                                            disableScrollLock: true
                                        }}
                                    >
                                        {listeSituation?.map((option) => (
                                            <MenuItem key={option.id} value={option.id}>{option.libelle_rang}: {format(option.date_debut, "dd/MM/yyyy")} - {format(option.date_fin, "dd/MM/yyyy")}</MenuItem>
                                        ))
                                        }
                                    </Select>
                                </FormControl>
                            </Stack>
                            {
                                <ExportEtatFinancierAnalytiqueButtonAll
                                    exportAllToPdf={() => exportAllFile("PDF")}
                                    exportAllToExcel={() => exportAllFile("EXCEL")}
                                />
                            }

                        </Stack>

                        <Stack
                            width={"100%"}
                            spacing={4}
                            alignContent={"center"}
                            direction={"row"}
                            style={{ marginLeft: "0px", marginTop: "0px", backgroundColor: '#F4F9F9', borderRadius: "5px" }}
                            alignItems="center"
                            justifyContent="space-between"
                            sx={{ p: 0.5 }}
                        >
                            <Stack direction="row" alignItems="center" spacing={4}>
                                <FormControl variant="standard" sx={{ minWidth: 150 }}>
                                    <InputLabel>Axe</InputLabel>
                                    <Select
                                        value={selectedAxeId}
                                        onChange={handleChangeAxe}
                                        sx={{ width: "150px", display: "flex", justifyContent: "left", alignItems: "flex-start", alignContent: "flex-start", textAlign: "left" }}
                                        MenuProps={{
                                            disableScrollLock: true
                                        }}
                                    >
                                        {
                                            axesData.map(val => {
                                                return (
                                                    <MenuItem key={val.id} value={val.id}>{val.code}</MenuItem>
                                                )
                                            })
                                        }
                                    </Select>
                                </FormControl>
                                <FormControl variant="standard" sx={{ width: 1000 }}>
                                    <Autocomplete
                                        multiple
                                        id="checkboxes-tags-demo"
                                        options={sectionsData}
                                        disableCloseOnSelect
                                        getOptionLabel={(option) => option.section}
                                        onChange={(_event, newValue) => {
                                            setSelectedSectionsId(newValue);
                                            localStorage.setItem('sectionIds', JSON.stringify(newValue));
                                        }}
                                        value={selectedSectionsId}
                                        renderOption={(props, option, { selected }) => {
                                            const { key, ...optionProps } = props;
                                            return (
                                                <li
                                                    key={key}
                                                    {...optionProps}
                                                    style={{
                                                        paddingTop: 2,
                                                        paddingBottom: 2,
                                                        paddingLeft: 4,
                                                        paddingRight: 4,
                                                        fontSize: "0.8rem",
                                                        display: "flex",
                                                        alignItems: "center"
                                                    }}
                                                >
                                                    <Checkbox
                                                        icon={icon}
                                                        checkedIcon={checkedIcon}
                                                        style={{ marginRight: 8 }}
                                                        checked={selected}
                                                    />
                                                    {option.section}
                                                </li>
                                            );
                                        }}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                variant="standard"
                                                label="Section"
                                            />
                                        )}
                                    />
                                </FormControl>
                            </Stack>
                            {/* <Stack
                                direction={'row'}
                                spacing={0.5}
                            >
                                <Button
                                    variant="outlined"
                                    onClick={getEtatFinancierAnalytiqueGlobal}
                                    disabled={!isCaActive}
                                    sx={{
                                        height: 40,
                                        textTransform: 'none',
                                        outline: 'none',
                                        '&:focus': {
                                            outline: 'none',
                                        },
                                        '&.Mui-focusVisible': {
                                            outline: 'none',
                                            boxShadow: 'none',
                                        },
                                        '&:focus-visible': {
                                            outline: 'none',
                                            boxShadow: 'none',
                                        }
                                    }}
                                >
                                    Afficher
                                </Button>
                            </Stack> */}
                        </Stack>

                        <Box sx={{ width: '100%', typography: 'body1' }}>
                            <TabContext value={value}>
                                <Box sx={{ borderBottom: 1, borderColor: 'transparent' }}>
                                    <TabList onChange={handleChangeTAB} aria-label="lab API tabs example" variant='scrollable'>
                                        <Tab disabled={!listeExercice || listeExercice.length === 0 || !selectedExerciceId || selectedExerciceId === 0} style={{ textTransform: 'none', outline: 'none', border: 'none', }} label="bilan" value="1" />
                                        <Tab disabled={!listeExercice || listeExercice.length === 0 || !selectedExerciceId || selectedExerciceId === 0} style={{ textTransform: 'none', outline: 'none', border: 'none', }} label="crn" value="2" />
                                        <Tab disabled={!listeExercice || listeExercice.length === 0 || !selectedExerciceId || selectedExerciceId === 0} style={{ textTransform: 'none', outline: 'none', border: 'none', }} label="crf" value="3" />
                                        <Tab disabled={!listeExercice || listeExercice.length === 0 || !selectedExerciceId || selectedExerciceId === 0} style={{ textTransform: 'none', outline: 'none', border: 'none', }} label="tftd" value="4" />
                                        <Tab disabled={!listeExercice || listeExercice.length === 0 || !selectedExerciceId || selectedExerciceId === 0} style={{ textTransform: 'none', outline: 'none', border: 'none', }} label="tfti" value="5" />
                                        <Tab disabled={!listeExercice || listeExercice.length === 0 || !selectedExerciceId || selectedExerciceId === 0} style={{ textTransform: 'none', outline: 'none', border: 'none', }} label="evcp" value="6" />
                                    </TabList>
                                </Box>

                                {/* BILAN */}
                                <TabPanel value="1">
                                    <Stack width={"100%"} height={"100%"} spacing={2} alignItems={"flex-start"}
                                        alignContent={"flex-start"} justifyContent={"stretch"}
                                    >
                                        <Stack width={"100%"} height={"20px"} spacing={1} alignItems={"center"}
                                            alignContent={"center"} direction={"row"} justifyContent={"center"}>
                                            <Typography variant='h6' sx={{ color: "black" }} align='center'>Bilan</Typography>
                                        </Stack>

                                        <Stack width={"100%"} height={"100%"} spacing={0} alignItems={"center"} alignContent={"center"}
                                            direction={"row"} style={{ marginLeft: "0px", marginTop: "00px" }}>

                                            <Stack width={"30%"} height={"30px"} spacing={2} alignItems={"left"} alignContent={"left"}
                                                direction={"row"} justifyContent={"left"}
                                            >
                                                <ButtonGroup
                                                    disableElevation
                                                    variant="contained"
                                                    aria-label="Disabled button group"
                                                >
                                                    <Button
                                                        onClick={() => choixAffichageBilan('actif')}
                                                        variant={buttonActifVariant}
                                                        style={{ borderRadius: "0", textTransform: 'none', outline: 'none', width: 75 }}
                                                    >
                                                        Actif
                                                    </Button>
                                                    <Button
                                                        onClick={() => choixAffichageBilan('passif')}
                                                        variant={buttonPassifVariant}
                                                        style={{ borderRadius: "0", textTransform: 'none', outline: 'none', width: 75 }}
                                                    >
                                                        Passif
                                                    </Button>
                                                </ButtonGroup>
                                            </Stack>

                                            <Stack width={"70%"} height={"30px"} spacing={0.5} alignItems={"center"} alignContent={"center"}
                                                direction={"row"} justifyContent={"right"}>
                                                {/* <Tooltip title="Actualiser les calculs">
                                                    <IconButton
                                                        onClick={refreshBILAN}
                                                        variant="contained"
                                                        style={{
                                                            width: "45px", height: '45px',
                                                            borderRadius: "1px", borderColor: "transparent",
                                                            backgroundColor: initial.theme,
                                                            textTransform: 'none', outline: 'none',
                                                            display: verrBilan ? 'none' : 'inline-flex',
                                                        }}
                                                    >
                                                        <TbRefresh
                                                            style={{ width: '25px', height: '25px', color: 'white' }}
                                                        />
                                                    </IconButton>
                                                </Tooltip> */}

                                                <ExportEtatFinancierAnalytiqueButton
                                                    exportToExcel={() => exportFile("EXCEL")}
                                                    exportToPdf={() => exportFile("PDF")}
                                                    value={value}
                                                />

                                                <Tooltip title={verrBilan ? 'Déverrouiller le tableau' : 'Vérrouiller le tableau'}>
                                                    <IconButton
                                                        onClick={lockTableBILAN}
                                                        variant="contained"
                                                        style={{
                                                            width: "45px", height: '45px',
                                                            borderRadius: "2px", borderColor: "transparent",
                                                            backgroundColor: verrBilan ? "rgba(240, 43, 33, 1)" : "rgba(9, 77, 31, 0.8)",
                                                            textTransform: 'none', outline: 'none'
                                                        }}
                                                    >
                                                        {verrBilan
                                                            ? <CiLock style={{ width: '25px', height: '25px', color: 'white' }} />
                                                            : <CiUnlock style={{ width: '25px', height: '25px', color: 'white' }} />
                                                        }
                                                    </IconButton>
                                                </Tooltip>
                                            </Stack>
                                        </Stack>

                                        {showBilan === 'actif'
                                            ? <Stack
                                                width={"100%"}
                                                alignItems={"start"}
                                                style={{ overflow: "auto" }}
                                            >
                                                <VirtualTableEbilanEtatFinaciereAnalytique
                                                    canView={canView}
                                                    canAdd={canAdd}
                                                    canDelete={canDelete}
                                                    canModify={canModify}
                                                    columns={BilanActifColumn}
                                                    rows={bilanActifData}
                                                    state={verrBilan}
                                                    setIsRefreshed={() => setIsRefreshed(prev => !prev)}
                                                    id_axe={selectedAxeId}
                                                    id_sections={selectedSectionsId.map(val => val.id)}
                                                    deviseParDefaut={deviseParDefaut}
                                                />
                                            </Stack>
                                            : null
                                        }
                                        {showBilan === 'passif'
                                            ? <Stack
                                                width={"100%"}
                                                alignItems={"start"}
                                                style={{ overflow: "auto" }}
                                            >
                                                <VirtualTableEbilanEtatFinaciereAnalytique
                                                    canView={canView}
                                                    canAdd={canAdd}
                                                    canDelete={canDelete}
                                                    canModify={canModify}
                                                    columns={BilanPassifColumn}
                                                    rows={bilanPassifData}
                                                    state={verrBilan}
                                                    setIsRefreshed={() => setIsRefreshed(prev => !prev)}
                                                    id_axe={selectedAxeId}
                                                    id_sections={selectedSectionsId.map(val => val.id)}
                                                    deviseParDefaut={deviseParDefaut}
                                                />
                                            </Stack>
                                            : null
                                        }
                                    </Stack>

                                </TabPanel>

                                {/* CRN */}
                                <TabPanel value="2">
                                    <Stack
                                        width={"100%"}
                                        height={"100%"}
                                        spacing={0.5}
                                        alignItems={"flex-start"}
                                        alignContent={"flex-start"}
                                        justifyContent={"stretch"}
                                    >
                                        <Stack width={"100%"} height={"20px"} alignItems={"center"}
                                            alignContent={"center"} direction={"row"} justifyContent={"center"}>
                                            <Typography variant='h6' sx={{ color: "black" }} align='center'>Compte de résultat par nature</Typography>
                                        </Stack>

                                        <Stack width={"100%"} height={"50px"} alignItems={"center"} alignContent={"center"}
                                            direction={"row"} style={{ marginLeft: "0px", marginTop: "0px" }}>
                                            <Stack width={"100%"} height={"30px"} spacing={0.5} alignItems={"center"} alignContent={"center"}
                                                direction={"row"} justifyContent={"right"}>

                                                {/* <Tooltip title="Actualiser les calculs">
                                                    <IconButton
                                                        onClick={refreshCRN}
                                                        variant="contained"
                                                        style={{
                                                            width: "45px", height: '45px',
                                                            borderRadius: "1px", borderColor: "transparent",
                                                            backgroundColor: initial.theme,
                                                            textTransform: 'none', outline: 'none',
                                                            display: verrCrn ? 'none' : 'inline-flex',
                                                        }}
                                                    >
                                                        <TbRefresh style={{ width: '25px', height: '25px', color: 'white' }} />
                                                    </IconButton>
                                                </Tooltip> */}

                                                <ExportEtatFinancierAnalytiqueButton
                                                    exportToExcel={() => exportFile("EXCEL")}
                                                    exportToPdf={() => exportFile("PDF")}
                                                    value={value}
                                                />

                                                <Tooltip title={verrCrn ? 'Déverrouiller le tableau' : 'Vérrouiller le tableau'}>
                                                    <IconButton
                                                        onClick={lockTableCRN}
                                                        variant="contained"
                                                        style={{
                                                            width: "45px", height: '45px',
                                                            borderRadius: "2px", borderColor: "transparent",
                                                            backgroundColor: verrCrn ? "rgba(240, 43, 33, 1)" : "rgba(9, 77, 31, 0.8)",
                                                            textTransform: 'none', outline: 'none'
                                                        }}
                                                    >
                                                        {verrCrn
                                                            ? <CiLock style={{ width: '25px', height: '25px', color: 'white' }} />
                                                            : <CiUnlock style={{ width: '25px', height: '25px', color: 'white' }} />
                                                        }
                                                    </IconButton>
                                                </Tooltip>
                                            </Stack>
                                        </Stack>

                                        <Stack
                                            width={"100%"}
                                            alignItems={"start"}
                                            style={{ overflow: "auto" }}
                                        >
                                            <VirtualTableEbilanEtatFinaciereAnalytique
                                                canView={canView}
                                                canAdd={canAdd}
                                                canDelete={canDelete}
                                                canModify={canModify}
                                                columns={crnColumn}
                                                rows={crnData}
                                                state={verrCrn}
                                                setIsRefreshed={() => setIsRefreshed(prev => !prev)}
                                                id_axe={selectedAxeId}
                                                id_sections={selectedSectionsId.map(val => val.id)}
                                                deviseParDefaut={deviseParDefaut}
                                            />
                                        </Stack>

                                    </Stack>
                                </TabPanel>

                                {/* CRF */}
                                <TabPanel value="3">
                                    <Stack
                                        width={"100%"}
                                        height={"100%"}
                                        spacing={0.5}
                                        alignItems={"flex-start"}
                                        alignContent={"flex-start"}
                                        justifyContent={"stretch"}
                                    >
                                        <Stack width={"100%"} height={"20px"} alignItems={"center"}
                                            alignContent={"center"} direction={"row"} justifyContent={"center"}>
                                            <Typography variant='h6' sx={{ color: "black" }} align='center'>Compte de résultat par fonction</Typography>
                                        </Stack>

                                        <Stack width={"100%"} height={"50px"} alignItems={"center"} alignContent={"center"}
                                            direction={"row"} style={{ marginLeft: "00px", marginTop: "00px" }}>
                                            <Stack width={"100%"} height={"30px"} spacing={0.5} alignItems={"center"} alignContent={"center"}
                                                direction={"row"} justifyContent={"right"}>

                                                {/* <Tooltip title="Actualiser les calculs">
                                                    <IconButton
                                                        onClick={refreshCRF}
                                                        variant="contained"
                                                        style={{
                                                            width: "45px", height: '45px',
                                                            borderRadius: "1px", borderColor: "transparent",
                                                            backgroundColor: initial.theme,
                                                            textTransform: 'none', outline: 'none',
                                                            display: verrCrf ? 'none' : 'inline-flex',
                                                        }}
                                                    >
                                                        <TbRefresh style={{ width: '25px', height: '25px', color: 'white' }} />
                                                    </IconButton>
                                                </Tooltip> */}

                                                <ExportEtatFinancierAnalytiqueButton
                                                    exportToExcel={() => exportFile("EXCEL")}
                                                    exportToPdf={() => exportFile("PDF")}
                                                    value={value}
                                                />

                                                <Tooltip title={verrCrf ? 'Déverrouiller le tableau' : 'Vérrouiller le tableau'}>
                                                    <IconButton
                                                        onClick={lockTableCRF}
                                                        variant="contained"
                                                        style={{
                                                            width: "45px", height: '45px',
                                                            borderRadius: "2px", borderColor: "transparent",
                                                            backgroundColor: verrCrf ? "rgba(240, 43, 33, 1)" : "rgba(9, 77, 31, 0.8)",
                                                            textTransform: 'none', outline: 'none'
                                                        }}
                                                    >
                                                        {verrCrf
                                                            ? <CiLock style={{ width: '25px', height: '25px', color: 'white' }} />
                                                            : <CiUnlock style={{ width: '25px', height: '25px', color: 'white' }} />
                                                        }
                                                    </IconButton>
                                                </Tooltip>
                                            </Stack>
                                        </Stack>

                                        <Stack
                                            width={"100%"}
                                            alignItems={"start"}
                                            style={{ overflow: "auto" }}
                                        >
                                            <VirtualTableEbilanEtatFinaciereAnalytique
                                                canView={canView}
                                                canAdd={canAdd}
                                                canDelete={canDelete}
                                                canModify={canModify}
                                                columns={crnColumn}
                                                rows={crfData}
                                                state={verrCrf}
                                                setIsRefreshed={() => setIsRefreshed(prev => !prev)}
                                                id_axe={selectedAxeId}
                                                id_sections={selectedSectionsId.map(val => val.id)}
                                                deviseParDefaut={deviseParDefaut}
                                            />
                                        </Stack>

                                    </Stack>
                                </TabPanel>

                                {/* TFTD */}
                                <TabPanel value="4">
                                    <Stack
                                        width={"100%"}
                                        height={"100%"}
                                        spacing={0.5}
                                        alignItems={"flex-start"}
                                        alignContent={"flex-start"}
                                        justifyContent={"stretch"}
                                    >
                                        <Stack width={"100%"} height={"20px"} alignItems={"center"}
                                            alignContent={"center"} direction={"row"} justifyContent={"center"}>
                                            <Typography variant='h6' sx={{ color: "black" }} align='center'>Tableau de flux de trésoreries méthode directe</Typography>
                                        </Stack>

                                        <Stack width={"100%"} height={"50px"} alignItems={"center"} alignContent={"center"}
                                            direction={"row"} style={{ marginLeft: "0px", marginTop: "0px" }}>
                                            <Stack width={"100%"} height={"30px"} spacing={0.5} alignItems={"center"} alignContent={"center"}
                                                direction={"row"} justifyContent={"right"}>

                                                {/* <Tooltip title="Actualiser les calculs">
                                                    <IconButton
                                                        onClick={refreshTFTD}
                                                        variant="contained"
                                                        style={{
                                                            width: "45px", height: '45px',
                                                            borderRadius: "1px", borderColor: "transparent",
                                                            backgroundColor: initial.theme,
                                                            textTransform: 'none', outline: 'none',
                                                            display: verrTftd ? 'none' : 'inline-flex',
                                                        }}
                                                    >
                                                        <TbRefresh style={{ width: '25px', height: '25px', color: 'white' }} />
                                                    </IconButton>
                                                </Tooltip> */}

                                                <ExportEtatFinancierAnalytiqueButton
                                                    exportToExcel={() => exportFile("EXCEL")}
                                                    exportToPdf={() => exportFile("PDF")}
                                                    value={value}
                                                />

                                                <Tooltip title={verrTftd ? 'Déverrouiller le tableau' : 'Vérrouiller le tableau'}>
                                                    <IconButton
                                                        onClick={lockTableTFTD}
                                                        variant="contained"
                                                        style={{
                                                            width: "45px", height: '45px',
                                                            borderRadius: "2px", borderColor: "transparent",
                                                            backgroundColor: verrTftd ? "rgba(240, 43, 33, 1)" : "rgba(9, 77, 31, 0.8)",
                                                            textTransform: 'none', outline: 'none'
                                                        }}
                                                    >
                                                        {verrTftd
                                                            ? <CiLock style={{ width: '25px', height: '25px', color: 'white' }} />
                                                            : <CiUnlock style={{ width: '25px', height: '25px', color: 'white' }} />
                                                        }
                                                    </IconButton>
                                                </Tooltip>
                                            </Stack>
                                        </Stack>

                                        <Stack
                                            width={"100%"}
                                            alignItems={"start"}
                                            style={{ overflow: "auto" }}
                                        >
                                            <VirtualTableEbilanEtatFinaciereAnalytique
                                                canView={canView}
                                                canAdd={canAdd}
                                                canDelete={canDelete}
                                                canModify={canModify}
                                                columns={tftdColumn}
                                                rows={tftdData}
                                                state={verrTftd}
                                                setIsRefreshed={() => setIsRefreshed(prev => !prev)}
                                                id_axe={selectedAxeId}
                                                id_sections={selectedSectionsId.map(val => val.id)}
                                                deviseParDefaut={deviseParDefaut}
                                            />
                                        </Stack>

                                    </Stack>
                                </TabPanel>

                                {/* TFTI */}
                                <TabPanel value="5">
                                    <Stack
                                        width={"100%"}
                                        height={"100%"}
                                        spacing={0.5}
                                        alignItems={"flex-start"}
                                        alignContent={"flex-start"}
                                        justifyContent={"stretch"}
                                    >
                                        <Stack width={"100%"} height={"20px"} alignItems={"center"}
                                            alignContent={"center"} direction={"row"} justifyContent={"center"}>
                                            <Typography variant='h6' sx={{ color: "black" }} align='center'>Tableau de flux de trésoreries méthode indirecte</Typography>
                                        </Stack>

                                        <Stack width={"100%"} height={"50px"} alignItems={"center"} alignContent={"center"}
                                            direction={"row"} style={{ marginLeft: "0px", marginTop: "0px" }}>
                                            <Stack width={"100%"} height={"30px"} spacing={0.5} alignItems={"center"} alignContent={"center"}
                                                direction={"row"} justifyContent={"right"}>

                                                {/* <Tooltip title="Actualiser les calculs">
                                                    <IconButton
                                                        onClick={refreshTFTI}
                                                        variant="contained"
                                                        style={{
                                                            width: "45px", height: '45px',
                                                            borderRadius: "1px", borderColor: "transparent",
                                                            backgroundColor: initial.theme,
                                                            textTransform: 'none', outline: 'none',
                                                            display: verrTfti ? 'none' : 'inline-flex',
                                                        }}
                                                    >
                                                        <TbRefresh style={{ width: '25px', height: '25px', color: 'white' }} />
                                                    </IconButton>
                                                </Tooltip> */}

                                                <ExportEtatFinancierAnalytiqueButton
                                                    exportToExcel={() => exportFile("EXCEL")}
                                                    exportToPdf={() => exportFile("PDF")}
                                                    value={value}
                                                />

                                                <Tooltip title={verrTfti ? 'Déverrouiller le tableau' : 'Vérrouiller le tableau'}>
                                                    <IconButton
                                                        onClick={lockTableTFTI}
                                                        variant="contained"
                                                        style={{
                                                            width: "45px", height: '45px',
                                                            borderRadius: "2px", borderColor: "transparent",
                                                            backgroundColor: verrTfti ? "rgba(240, 43, 33, 1)" : "rgba(9, 77, 31, 0.8)",
                                                            textTransform: 'none', outline: 'none'
                                                        }}
                                                    >
                                                        {verrTfti
                                                            ? <CiLock style={{ width: '25px', height: '25px', color: 'white' }} />
                                                            : <CiUnlock style={{ width: '25px', height: '25px', color: 'white' }} />
                                                        }
                                                    </IconButton>
                                                </Tooltip>
                                            </Stack>
                                        </Stack>

                                        <Stack
                                            width={"100%"}
                                            alignItems={"start"}
                                            style={{ overflow: "auto" }}
                                        >
                                            <VirtualTableEbilanEtatFinaciereAnalytique
                                                canView={canView}
                                                canAdd={canAdd}
                                                canDelete={canDelete}
                                                canModify={canModify}
                                                columns={crnColumn}
                                                rows={tftiData}
                                                state={verrTfti}
                                                setIsRefreshed={() => setIsRefreshed(prev => !prev)}
                                                id_axe={selectedAxeId}
                                                id_sections={selectedSectionsId.map(val => val.id)}
                                                deviseParDefaut={deviseParDefaut}
                                            />
                                        </Stack>

                                    </Stack>

                                </TabPanel>

                                {/* EVCP */}
                                <TabPanel value="6">
                                    <Stack
                                        width={"100%"}
                                        height={"100%"}
                                        spacing={0.5}
                                        alignItems={"flex-start"}
                                        alignContent={"flex-start"}
                                        justifyContent={"stretch"}
                                    >
                                        <Stack width={"100%"} height={"20px"} alignItems={"center"}
                                            alignContent={"center"} direction={"row"} justifyContent={"center"}>
                                            <Typography variant='h6' sx={{ color: "black" }} align='center'>Etat de variation des capitaux propres</Typography>
                                        </Stack>

                                        <Stack width={"100%"} height={"50px"} alignItems={"center"} alignContent={"center"}
                                            direction={"row"} style={{ marginLeft: "0px", marginTop: "0px" }}>
                                            <Stack width={"100%"} height={"30px"} spacing={0.5} alignItems={"center"} alignContent={"center"}
                                                direction={"row"} justifyContent={"right"}>

                                                <Tooltip title="Actualiser les calculs">
                                                    <IconButton
                                                        onClick={refreshEVCP}
                                                        variant="contained"
                                                        style={{
                                                            width: "45px", height: '45px',
                                                            borderRadius: "1px", borderColor: "transparent",
                                                            backgroundColor: initial.theme,
                                                            textTransform: 'none', outline: 'none',
                                                            display: verrTfti ? 'none' : 'inline-flex',
                                                        }}
                                                    >
                                                        <TbRefresh style={{ width: '25px', height: '25px', color: 'white' }} />
                                                    </IconButton>
                                                </Tooltip>

                                                <ExportEtatFinancierAnalytiqueButton
                                                    exportToExcel={() => exportFile("EXCEL")}
                                                    exportToPdf={() => exportFile("PDF")}
                                                    value={value}
                                                />

                                                <Tooltip title={verrEvcp ? 'Déverrouiller le tableau' : 'Vérrouiller le tableau'}>
                                                    <IconButton
                                                        onClick={lockTableEVCP}
                                                        variant="contained"
                                                        style={{
                                                            width: "45px", height: '45px',
                                                            borderRadius: "2px", borderColor: "transparent",
                                                            backgroundColor: verrEvcp ? "rgba(240, 43, 33, 1)" : "rgba(9, 77, 31, 0.8)",
                                                            textTransform: 'none', outline: 'none'
                                                        }}
                                                    >
                                                        {verrEvcp
                                                            ? <CiLock style={{ width: '25px', height: '25px', color: 'white' }} />
                                                            : <CiUnlock style={{ width: '25px', height: '25px', color: 'white' }} />
                                                        }
                                                    </IconButton>
                                                </Tooltip>
                                            </Stack>
                                        </Stack>

                                        <Stack
                                            width={"100%"}
                                            alignItems={"start"}
                                            style={{ overflow: "auto" }}
                                        >
                                            <VirtualTableEvcpEtatFinancierAnalytique
                                                canView={canView}
                                                canAdd={canAdd}
                                                canDelete={canDelete}
                                                canModify={canModify}
                                                columns={evcpColumn}
                                                rows={evcpData}
                                                state={verrEvcp}
                                                setIsRefreshed={() => setIsRefreshed(prev => !prev)}
                                                id_axe={selectedAxeId}
                                                id_sections={selectedSectionsId.map(val => val.id)}
                                                deviseParDefaut={deviseParDefaut}
                                            />
                                        </Stack>

                                    </Stack>
                                </TabPanel>

                            </TabContext>
                        </Box>
                    </Stack>
                </TabPanel>
            </TabContext>
        </Box>
    )
}
