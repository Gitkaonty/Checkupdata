import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Typography, Stack, FormControl, InputLabel, Select, MenuItem, Tooltip, Button, ButtonGroup, IconButton } from '@mui/material';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import { InfoFileStyle } from '../../../componentsTools/InfosFileStyle';
import useAuth from '../../../../hooks/useAuth';
import { jwtDecode } from 'jwt-decode';
import axios from '../../../../../config/axios';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import PopupTestSelectedFile from '../../../componentsTools/popupTestSelectedFile';

import { Datagridbase } from '../../../componentsTools/DatagridTableMappingBase';
import { Datagriddetail } from '../../../componentsTools/DatagridTableMappingDetail';
import { DatagridBHIAPCdetail } from '../../../componentsTools/DatagridTableBHIAPCMappingDetail';

import { init } from '../../../../../init';
import PopupActionConfirm from '../../../componentsTools/popupActionConfirm';
import { GrUpdate } from "react-icons/gr";
import { LuArchiveRestore } from "react-icons/lu";
import { VscRepoFetch } from "react-icons/vsc";

import DatagridTableDpMappingDetail from '../../../componentsTools/MappingCompte/DatagridTableDpMappingDetail';
import DatagridTableDpComMappingDetail from '../../../componentsTools/MappingCompte/Dcom/DatagridDcomMappingDetail';
import usePermission from '../../../../hooks/usePermission';

export default function ParamMappingComponent() {
    const { canAdd, canModify, canDelete, canView } = usePermission();

    let tabEbilanParamMapping = "", tabParamMapping = "";
    if (typeof window !== 'undefined') {
        tabEbilanParamMapping = localStorage.getItem('valueEbilanParamMapping');
        tabParamMapping = localStorage.getItem('valueParamMapping');
    }
    let initial = init[0];
    const [valueEbilanParamMapping, setValueEbilanParamMapping] = useState(tabEbilanParamMapping || "1");
    const [valueParamMapping, setValueParamMapping] = useState(tabParamMapping || "1");

    const [fileInfos, setFileInfos] = useState('');
    const [fileId, setFileId] = useState(0);
    const { id } = useParams();
    const [noFile, setNoFile] = useState(false);
    const [selectedExerciceId, setSelectedExerciceId] = useState(0);
    const [selectedPeriodeId, setSelectedPeriodeId] = useState(0);
    const [selectedPeriodeChoiceId, setSelectedPeriodeChoiceId] = useState(0);
    const [listeExercice, setListeExercice] = useState([]);
    const [listeSituation, setListeSituation] = useState([]);
    const [showBilan, setShowBilan] = useState(1);
    const [buttonActifVariant, setButtonActifVariant] = useState('contained');
    const [buttonPassifVariant, setButtonPassifVariant] = useState('outlined');
    const [showBrut, setShowBrut] = useState('BRUT');
    const [buttonActifVariant2, setButtonActifVariant2] = useState('contained');
    const [buttonPassifVariant2, setButtonPassifVariant2] = useState('outlined');

    const [bilanData, setBilanData] = useState([]);
    const [bilanSelectedRubriqueId, setBilanSelectedRubriqueId] = useState(0);
    const [bilanRubriqueData, setBilanRubriqueData] = useState([]);
    const [showRestaurePopupBilan, setShowRestaurePopupBilan] = useState(false);
    const [showUpdatePopupBilan, setShowUpdatePopupBilan] = useState(false);

    const [crnData, setCrnData] = useState([]);
    const [crnSelectedRubriqueId, setCrnSelectedRubriqueId] = useState(0);
    const [crnRubriqueData, setCrnRubriqueData] = useState([]);
    const [showRestaurePopupCrn, setShowRestaurePopupCrn] = useState(false);
    const [showUpdatePopupCrn, setShowUpdatePopupCrn] = useState(false);

    const [crfData, setCrfData] = useState([]);
    const [crfSelectedRubriqueId, setCrfSelectedRubriqueId] = useState(0);
    const [crfRubriqueData, setCrfRubriqueData] = useState([]);
    const [showRestaurePopupCrf, setShowRestaurePopupCrf] = useState(false);
    const [showUpdatePopupCrf, setShowUpdatePopupCrf] = useState(false);

    const [tftdData, setTftdData] = useState([]);
    const [tftdSelectedRubriqueId, setTftdSelectedRubriqueId] = useState(0);
    const [tftdRubriqueData, setTftdRubriqueData] = useState([]);
    const [showRestaurePopupTftd, setShowRestaurePopupTftd] = useState(false);
    const [showUpdatePopupTftd, setShowUpdatePopupTftd] = useState(false);

    const [tftiData, setTftiData] = useState([]);
    const [tftiSelectedRubriqueId, setTftiSelectedRubriqueId] = useState(0);
    const [tftiRubriqueData, setTftiRubriqueData] = useState([]);
    const [showRestaurePopupTfti, setShowRestaurePopupTfti] = useState(false);
    const [showUpdatePopupTfti, setShowUpdatePopupTfti] = useState(false);

    const [dpData, setDpData] = useState([]);
    const [dpSelectedRubriqueId, setDpSelectedRubriqueId] = useState(0);
    const [dpRubriqueData, setDpRubriqueData] = useState([]);
    const [showRestaurePopupDp, setShowRestaurePopupDp] = useState(false);
    const [showUpdatePopupDp, setShowUpdatePopupDp] = useState(false);

    const [bhiapcData, setBhiapcData] = useState([]);
    const [bhiapcSelectedRubriqueId, setBhiapcSelectedRubriqueId] = useState(0);
    const [bhiapcRubriqueData, setBhiapcRubriqueData] = useState([]);
    const [showRestaurePopupBhiapc, setShowRestaurePopupBhiapc] = useState(false);
    const [showUpdatePopupBhiapc, setShowUpdatePopupBhiapc] = useState(false);

    const [dComData, setDComData] = useState([]);
    const [dComSelectedRubriqueId, setDComSelectedRubriqueId] = useState(0);
    const [dComRubriqueData, setDComRubriqueData] = useState([]);

    const phrase1_1 = "Voulez-vous vraiment restaurer les paramétrages de calcul par les paramétrages par défaut pour le formulaire du ";
    const phrase1_2 = "? les autres paramétrages manuels seront désactivés.";

    const phrase2_1 = "Voulez-vous vraiment mettre à jour les paramétrages de calcul par défaut pour le formulaire du ";
    const phrase2_2 = "? les paramétrages manuels ne seront pas supprimés.";

    const msgRestaurePopupBilan = `${phrase1_1} bilan ${phrase1_2}`;
    const msgUpdatePopupBilan = `${phrase2_1} bilan ${phrase2_2}`;

    const msgRestaurePopupCrn = `${phrase1_1} CRN ${phrase1_2}`;
    const msgUpdatePopupCrn = `${phrase2_1} CRN ${phrase2_2}`;

    const msgRestaurePopupCrf = `${phrase1_1} CRF ${phrase1_2}`;
    const msgUpdatePopupCrf = `${phrase2_1} CRF ${phrase2_2}`;

    const msgRestaurePopupTftd = `${phrase1_1} TFTD ${phrase1_2}`;
    const msgUpdatePopupTftd = `${phrase2_1} TFTD ${phrase2_2}`;

    const msgRestaurePopupTfti = `${phrase1_1} TFTI ${phrase1_2}`;
    const msgUpdatePopupTfti = `${phrase2_1} TFTI ${phrase2_2}`;

    const msgRestaurePopupDp = `${phrase1_1} DP ${phrase1_2}`;
    const msgUpdatePopupDp = `${phrase2_1} DP ${phrase2_2}`;

    const msgRestaurePopupBhiapc = `${phrase1_1} BHIAPC ${phrase1_2}`;
    const msgUpdatePopupBhiapc = `${phrase2_1} BHIAPC ${phrase2_2}`;

    //récupération infos de connexion
    const { auth } = useAuth();
    const decoded = auth?.accessToken ? jwtDecode(auth.accessToken) : undefined;
    const compteId = decoded.UserInfo.compteId || null;
    const userId = decoded.UserInfo.userId || null;
    const navigate = useNavigate();

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

                recupRubrique(compteId, id, exerciceNId[0].id, "BILAN", 1);
                recupRubrique(compteId, id, exerciceNId[0].id, "CRN", 0);
                recupRubrique(compteId, id, exerciceNId[0].id, "CRF", 0);
                recupRubrique(compteId, id, exerciceNId[0].id, "TFTI", 0);
                recupRubrique(compteId, id, exerciceNId[0].id, "TFTD", 0);
                recupRubrique(compteId, id, exerciceNId[0].id, "DP", 0);

                recupRubrique(compteId, id, exerciceNId[0].id, "BHIAPC", 0);
                updateSelectedRowIdBHIAPC(1, compteId, id, exerciceNId[0].id);
            } else {
                setListeExercice([]);
                //toast.error("une erreur est survenue lors de la récupération de la liste des exercices");
                return
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
                    recupRubrique(compteId, fileId, list[0].id, "BILAN", showBilan);
                    recupRubrique(compteId, fileId, list[0].id, "CRN", 0);
                    recupRubrique(compteId, fileId, list[0].id, "CRF", 0);
                    recupRubrique(compteId, fileId, list[0].id, "TFTI", 0);
                    recupRubrique(compteId, fileId, list[0].id, "TFTD", 0);
                    recupRubrique(compteId, fileId, list[0].id, "DP", 0);

                    updateSelectedRowIdBHIAPC(1, compteId, fileId, list[0].id);
                }
            } else {
                setListeSituation([]);
                //toast.error("une erreur est survenue lors de la récupération de la liste des exercices");
                return
            }
        })
    }

    //Choix TAB value-------------------------------------------------------------------------------------
    const handleChangeTabEbilan = (event, newValue) => {
        setValueEbilanParamMapping(newValue);
        localStorage.setItem('valueEbilanParamMapping', newValue);
    };

    const handleChangeTab = (event, newValue) => {
        setValueParamMapping(newValue);
        localStorage.setItem('valueParamMapping', newValue);
    }

    //Choix exercice
    const handleChangeExercice = (exercice_id) => {
        setSelectedExerciceId(exercice_id);
        setSelectedPeriodeChoiceId("0");
        setListeSituation(listeExercice?.filter((item) => item.id === exercice_id));
        setSelectedPeriodeId(exercice_id);
        recupRubrique(compteId, fileId, exercice_id, "BILAN", showBilan);
        recupRubrique(compteId, fileId, exercice_id, "CRN", 0);
        recupRubrique(compteId, fileId, exercice_id, "CRF", 0);
        recupRubrique(compteId, fileId, exercice_id, "TFTD", 0);
        recupRubrique(compteId, fileId, exercice_id, "TFTI", 0);
        recupRubrique(compteId, fileId, exercice_id, "DP", 0);

        updateSelectedRowIdBHIAPC(1, compteId, fileId, exercice_id);
    }

    //Choix période
    const handleChangePeriode = (choix) => {
        setSelectedPeriodeChoiceId(choix);

        if (choix === 0) {
            setListeSituation(listeExercice?.filter((item) => item.id === selectedExerciceId));
            setSelectedPeriodeId(selectedExerciceId);
            recupRubrique(compteId, fileId, selectedExerciceId, "BILAN", showBilan);
            recupRubrique(compteId, fileId, selectedExerciceId, "CRN", 0);
            recupRubrique(compteId, fileId, selectedExerciceId, "CRF", 0);
            recupRubrique(compteId, fileId, selectedExerciceId, "TFTD", 0);
            recupRubrique(compteId, fileId, selectedExerciceId, "TFTI", 0);
            recupRubrique(compteId, fileId, selectedExerciceId, "DP", 0);

            updateSelectedRowIdBHIAPC(1, compteId, fileId, selectedExerciceId);
        } else if (choix === 1) {
            GetListeSituation(selectedExerciceId);
        }
    }

    //Choix date intervalle
    const handleChangeDateIntervalle = (id) => {
        setSelectedPeriodeId(id);
        recupRubrique(compteId, fileId, id, "BILAN", showBilan);
        recupRubrique(compteId, fileId, id, "CRN", 0);
        recupRubrique(compteId, fileId, id, "CRF", 0);
        recupRubrique(compteId, fileId, id, "TFTD", 0);
        recupRubrique(compteId, fileId, id, "TFTI", 0);
        recupRubrique(compteId, fileId, id, "DP", 0);

        updateSelectedRowIdBHIAPC(1, compteId, fileId, id);
    }

    //choix affichage tableau bilan (Actif ou passif = actif à l'ouverture)
    const choixAffichageBilan = (choix) => {
        setShowBilan(choix);

        if (choix === 1) {
            setButtonActifVariant('contained');
            setButtonPassifVariant('outlined');
            recupRubrique(compteId, fileId, selectedExerciceId, "BILAN", 1);
        } else {
            setButtonActifVariant('outlined');
            setButtonPassifVariant('contained');
            recupRubrique(compteId, fileId, selectedExerciceId, "BILAN", 2);
        }
    }

    //choix affichage brut ou amortissement
    const choixAffichageDetailCalcul = (choix) => {
        setShowBrut(choix);
        const rubriqueId = bilanSelectedRubriqueId;
        const exerciceId = selectedPeriodeId;
        const tableau = 'BILAN';

        if (choix === 'BRUT') {
            setButtonActifVariant2('contained');
            setButtonPassifVariant2('outlined');

            const choixPoste = 'BRUT';

            axios.post(`/paramMappingCompte/listeCompteRubrique`, { compteId, fileId, exerciceId, tableau, choixPoste, rubriqueId }).then((response) => {
                const resData = response.data;
                if (resData.state) {
                    setBilanRubriqueData(resData.liste);
                } else {
                    toast.error(resData.msg);
                }
            });
        } else {
            setButtonActifVariant2('outlined');
            setButtonPassifVariant2('contained');

            const choixPoste = 'AMORT';

            axios.post(`/paramMappingCompte/listeCompteRubrique`, { compteId, fileId, exerciceId, tableau, choixPoste, rubriqueId }).then((response) => {
                const resData = response.data;
                if (resData.state) {
                    setBilanRubriqueData(resData.liste);
                } else {
                    toast.error(resData.msg);
                }
            });
        }
    }

    //action de choix rubrique ID sous l'onglet Bilan
    const updateSelectedRowId = (value) => {
        setBilanSelectedRubriqueId(value);

        const rubriqueId = value;
        const exerciceId = selectedPeriodeId;
        const tableau = 'BILAN';
        const choixPoste = showBrut;
        axios.post(`/paramMappingCompte/listeCompteRubrique`, { compteId, fileId, exerciceId, tableau, choixPoste, rubriqueId }).then((response) => {
            const resData = response.data;
            if (resData.state) {
                setBilanRubriqueData(resData.liste);
            } else {
                toast.error(resData.msg);
            }
        });
    }

    //action de choix rubrique ID sous l'onglet CRN
    const updateSelectedRowIdCRN = (value) => {
        setCrnSelectedRubriqueId(value);

        const rubriqueId = value;
        const exerciceId = selectedPeriodeId;
        const tableau = 'CRN';
        const choixPoste = 'BRUT';
        axios.post(`/paramMappingCompte/listeCompteRubrique`, { compteId, fileId, exerciceId, tableau, choixPoste, rubriqueId }).then((response) => {
            const resData = response.data;
            if (resData.state) {
                setCrnRubriqueData(resData.liste);
            } else {
                toast.error(resData.msg);
            }
        });
    }

    //action de choix rubrique ID sous l'onglet CRF
    const updateSelectedRowIdCRF = (value) => {
        setCrfSelectedRubriqueId(value);

        const rubriqueId = value;
        const exerciceId = selectedPeriodeId;
        const tableau = 'CRF';
        const choixPoste = 'BRUT';
        axios.post(`/paramMappingCompte/listeCompteRubrique`, { compteId, fileId, exerciceId, tableau, choixPoste, rubriqueId }).then((response) => {
            const resData = response.data;
            if (resData.state) {
                setCrfRubriqueData(resData.liste);
            } else {
                toast.error(resData.msg);
            }
        });
    }

    //action de choix rubrique ID sous l'onglet TFTD
    const updateSelectedRowIdTFTD = (value) => {
        setTftdSelectedRubriqueId(value);

        const rubriqueId = value;
        const exerciceId = selectedPeriodeId;
        const tableau = 'TFTD';
        const choixPoste = 'BRUT';
        axios.post(`/paramMappingCompte/listeCompteRubrique`, { compteId, fileId, exerciceId, tableau, choixPoste, rubriqueId }).then((response) => {
            const resData = response.data;
            if (resData.state) {
                setTftdRubriqueData(resData.liste);
            } else {
                toast.error(resData.msg);
            }
        });
    }

    //action de choix rubrique ID sous l'onglet TFTI
    const updateSelectedRowIdTFTI = (value) => {
        setTftiSelectedRubriqueId(value);

        const rubriqueId = value;
        const exerciceId = selectedPeriodeId;
        const tableau = 'TFTI';
        const choixPoste = 'BRUT';
        axios.post(`/paramMappingCompte/listeCompteRubrique`, { compteId, fileId, exerciceId, tableau, choixPoste, rubriqueId }).then((response) => {
            const resData = response.data;
            if (resData.state) {
                setTftiRubriqueData(resData.liste);
            } else {
                toast.error(resData.msg);
            }
        });
    }

    //action de choix rubrique ID sous l'onglet DP
    const updateSelectedRowIdDP = (value) => {
        setDpSelectedRubriqueId(value);

        const rubriqueId = value;
        const exerciceId = selectedPeriodeId;
        const tableau = 'DP';
        const choixPoste = 'BRUT';
        axios.post(`/paramMappingCompte/listeCompteRubrique`, { compteId, fileId, exerciceId, tableau, choixPoste, rubriqueId }).then((response) => {
            const resData = response.data;
            if (resData.state) {
                setDpRubriqueData(resData.liste);
            } else {
                toast.error(resData.msg);
            }
        });
    }

    //action de choix rubrique ID sous l'onglet BHIAPC
    const updateSelectedRowIdBHIAPC = (value, compteId, fileId, exercice_Id) => {
        setBhiapcSelectedRubriqueId(value);

        const rubriqueId = value;
        const exerciceId = exercice_Id;
        const tableau = 'BHIAPC';
        const choixPoste = 'BRUT';
        axios.post(`/paramMappingCompte/listeCompteRubrique`, { compteId, fileId, exerciceId, tableau, choixPoste, rubriqueId }).then((response) => {
            const resData = response.data;
            if (resData.state) {
                setBhiapcRubriqueData(resData.liste);
            } else {
                toast.error(resData.msg);
            }
        });
    }

    //action de choix rubrique ID sous l'onglet DCom
    const updateSelectedRowIdDCom = (value) => {
        setDComSelectedRubriqueId(value);

        const rubriqueId = value;
        const exerciceId = selectedPeriodeId;
        const tableau = 'DCOM';
        const choixPoste = 'BRUT';
        axios.post(`/paramMappingCompte/listeCompteRubrique`, { compteId, fileId, exerciceId, tableau, choixPoste, rubriqueId }).then((response) => {
            const resData = response.data;
            if (resData.state) {
                setDComRubriqueData(resData.liste);
            } else {
                toast.error(resData.msg);
            }
        });
    }

    //récupération des rubriques
    const recupRubrique = (compteId, fileId, exerciceId, tableau, onglet) => {
        axios.post(`/paramMappingCompte/listeRubrique`, { compteId, fileId, exerciceId, tableau, onglet }).then((response) => {
            const resData = response.data;
            if (resData.state) {
                if (tableau === 'BILAN') {
                    setBilanData(resData.liste);
                } else if (tableau === 'CRN') {
                    setCrnData(resData.liste);
                } else if (tableau === 'CRF') {
                    setCrfData(resData.liste);
                } else if (tableau === 'TFTD') {
                    setTftdData(resData.liste);
                } else if (tableau === 'TFTI') {
                    setTftiData(resData.liste);
                } else if (tableau === 'DP') {
                    setDpData(resData.liste);
                }
            } else {
                toast.error(resData.msg);
            }
        });
    }

    //récupération des rubriques pour Dcom
    const getListeRubriqueDCom = () => {
        axios.get(`/paramMappingCompte/getListeRubriqueDCom/${Number(compteId)}/${Number(fileId)}/${Number(selectedExerciceId)}`)
            .then((response) => {
                const resData = response?.data;
                if (resData?.state) {
                    setDComData(resData?.liste)
                } else {
                    // toast.error(resData?.msg);
                }
            })
    }

    //restauration des paramétrages par défaut
    //BILAN-----------------------------------------------------------------
    const handleRestaureDefaultParameterBilan = () => {
        setShowRestaurePopupBilan(true);
    }

    //CRN-----------------------------------------------
    const handleRestaureDefaultParameterCRN = () => {
        setShowRestaurePopupCrn(true);
    }

    //CRF-----------------------------------------------
    const handleRestaureDefaultParameterCRF = () => {
        setShowRestaurePopupCrf(true);
    }

    //TFTD-----------------------------------------------
    const handleRestaureDefaultParameterTFTD = () => {
        setShowRestaurePopupTftd(true);
    }

    //TFTI-----------------------------------------------
    const handleRestaureDefaultParameterTFTI = () => {
        setShowRestaurePopupTfti(true);
    }

    //DP-----------------------------------------------
    const handleRestaureDefaultParameterDP = () => {
        setShowRestaurePopupDp(true);
    }

    //BHIAPC-----------------------------------------------
    const handleRestaureDefaultParameterBHIAPC = () => {
        setShowRestaurePopupBhiapc(true);
    }

    const restaureDefaultParameter = (tableau) => {
        const exerciceId = selectedExerciceId;
        axios.post(`/paramMappingCompte/restaureDefaultParameter`, { compteId, fileId, exerciceId, tableau }).then((response) => {
            const resData = response.data;
            if (resData.state) {
                toast.success(resData.msg);
            } else {
                toast.error(resData.msg);
            }
        });
    }

    //restaurer paramétrage par défaut BILAN
    const restaureDefaultParameterBilan = (value) => {
        if (value) {
            restaureDefaultParameter('BILAN');
            setShowRestaurePopupBilan(false);
        } else {
            setShowRestaurePopupBilan(false);
        }
    }

    //restaurer paramétrage par défaut CRN
    const restaureDefaultParameterCrn = (value) => {
        if (value) {
            restaureDefaultParameter('CRN');
            setShowRestaurePopupCrn(false);
        } else {
            setShowRestaurePopupCrn(false);
        }
    }

    //restaurer paramétrage par défaut CRF
    const restaureDefaultParameterCrf = (value) => {
        if (value) {
            restaureDefaultParameter('CRF');
            setShowRestaurePopupCrf(false);
        } else {
            setShowRestaurePopupCrf(false);
        }
    }

    //restaurer paramétrage par défaut TFTD
    const restaureDefaultParameterTftd = (value) => {
        if (value) {
            restaureDefaultParameter('TFTD');
            setShowRestaurePopupTftd(false);
        } else {
            setShowRestaurePopupTftd(false);
        }
    }

    //restaurer paramétrage par défaut TFTI
    const restaureDefaultParameterTfti = (value) => {
        if (value) {
            restaureDefaultParameter('TFTI');
            setShowRestaurePopupTfti(false);
        } else {
            setShowRestaurePopupTfti(false);
        }
    }

    //restaurer paramétrage par défaut DP
    const restaureDefaultParameterDp = (value) => {
        if (value) {
            restaureDefaultParameter('DP');
            setShowRestaurePopupDp(false);
        } else {
            setShowRestaurePopupDp(false);
        }
    }

    //restaurer paramétrage par défaut BHIAPC
    const restaureDefaultParameterBhiapc = (value) => {
        if (value) {
            restaureDefaultParameter('BHIAPC');
            setShowRestaurePopupBhiapc(false);
        } else {
            setShowRestaurePopupBhiapc(false);
        }
    }

    //mettre à jour des paramétrages par défaut pour le formulaire Bilan
    const handleUpdateDefaultParameterBilan = () => {
        setShowUpdatePopupBilan(true);
    }

    //mettre à jour des paramétrages par défaut pour le formulaire CRN
    const handleUpdateDefaultParameterCRN = () => {
        setShowUpdatePopupCrn(true);
    }

    //mettre à jour des paramétrages par défaut pour le formulaire CRF
    const handleUpdateDefaultParameterCRF = () => {
        setShowUpdatePopupCrf(true);
    }

    //mettre à jour des paramétrages par défaut pour le formulaire TFTD
    const handleUpdateDefaultParameterTFTD = () => {
        setShowUpdatePopupTftd(true);
    }

    //mettre à jour des paramétrages par défaut pour le formulaire TFTI
    const handleUpdateDefaultParameterTFTI = () => {
        setShowUpdatePopupTfti(true);
    }

    //mettre à jour des paramétrages par défaut pour le formulaire DP
    const handleUpdateDefaultParameterDP = () => {
        setShowUpdatePopupDp(true);
    }

    //mettre à jour des paramétrages par défaut pour le formulaire BHIAPC
    const handleUpdateDefaultParameterBHIAPC = () => {
        setShowUpdatePopupBhiapc(true);
    }

    const updateDefaultParameter = (tableau) => {
        const exerciceId = selectedExerciceId;
        axios.post(`/paramMappingCompte/updateDefaultParameter`, { compteId, fileId, exerciceId, tableau }).then((response) => {
            const resData = response.data;
            if (resData.state) {
                choixAffichageDetailCalcul(showBrut);
                if (tableau === 'BHIAPC') {
                    updateSelectedRowIdBHIAPC(1, compteId, fileId, selectedExerciceId);
                }

                toast.success(resData.msg);
            } else {
                toast.error(resData.msg);
            }
        });

        setShowRestaurePopupBilan(false);
        setShowRestaurePopupCrn(false);
        setShowRestaurePopupCrf(false);
        setShowRestaurePopupTftd(false);
        setShowRestaurePopupTfti(false);
        setShowRestaurePopupDp(false);
        setShowUpdatePopupBhiapc(false);

    }

    //mettre à jour les paramétrages par défaut BILAN
    const updateDefaultParameterBilan = (value) => {
        if (value) {
            updateDefaultParameter('BILAN');
            setShowUpdatePopupBilan(false);
        } else {
            setShowUpdatePopupBilan(false);
        }
    }

    //mettre à jour les paramétrages par défaut CRN
    const updateDefaultParameterCrn = (value) => {
        if (value) {
            updateDefaultParameter('CRN');
            setShowUpdatePopupCrn(false);
        } else {
            setShowUpdatePopupCrn(false);
        }
    }

    //mettre à jour les paramétrages par défaut CRF
    const updateDefaultParameterCrf = (value) => {
        if (value) {
            updateDefaultParameter('CRF');
            setShowUpdatePopupCrf(false);
        } else {
            setShowUpdatePopupCrf(false);
        }
    }

    //mettre à jour les paramétrages par défaut TFTD
    const updateDefaultParameterTftd = (value) => {
        if (value) {
            updateDefaultParameter('TFTD');
            setShowUpdatePopupTftd(false);
        } else {
            setShowUpdatePopupTftd(false);
        }
    }

    //mettre à jour les paramétrages par défaut TFTI
    const updateDefaultParameterTfti = (value) => {
        if (value) {
            updateDefaultParameter('TFTI');
            setShowUpdatePopupTfti(false);
        } else {
            setShowUpdatePopupTfti(false);
        }
    }

    //mettre à jour les paramétrages par défaut DP
    const updateDefaultParameterDp = (value) => {
        if (value) {
            updateDefaultParameter('DP');
            setShowUpdatePopupDp(false);
        } else {
            setShowUpdatePopupDp(false);
        }
    }

    //mettre à jour les paramétrages par défaut BHIAPC
    const updateDefaultParameterBhiapc = (value) => {
        if (value) {
            updateDefaultParameter('BHIAPC');
            setShowUpdatePopupBhiapc(false);
        } else {
            setShowUpdatePopupBhiapc(false);
        }
    }

    useEffect(() => {
        getListeRubriqueDCom();
    }, [compteId, fileId, selectedExerciceId])

    return (
        <>
            {noFile ? <PopupTestSelectedFile confirmationState={sendToHome} /> : null}

            {showRestaurePopupBilan ? <PopupActionConfirm msg={msgRestaurePopupBilan} confirmationState={restaureDefaultParameterBilan} /> : null}
            {showUpdatePopupBilan ? <PopupActionConfirm msg={msgUpdatePopupBilan} confirmationState={updateDefaultParameterBilan} /> : null}

            {showRestaurePopupCrn ? <PopupActionConfirm msg={msgRestaurePopupCrn} confirmationState={restaureDefaultParameterCrn} /> : null}
            {showUpdatePopupCrn ? <PopupActionConfirm msg={msgUpdatePopupCrn} confirmationState={updateDefaultParameterCrn} /> : null}

            {showRestaurePopupCrf ? <PopupActionConfirm msg={msgRestaurePopupCrf} confirmationState={restaureDefaultParameterCrf} /> : null}
            {showUpdatePopupCrf ? <PopupActionConfirm msg={msgUpdatePopupCrf} confirmationState={updateDefaultParameterCrf} /> : null}

            {showRestaurePopupTftd ? <PopupActionConfirm msg={msgRestaurePopupTftd} confirmationState={restaureDefaultParameterTftd} /> : null}
            {showUpdatePopupTftd ? <PopupActionConfirm msg={msgUpdatePopupTftd} confirmationState={updateDefaultParameterTftd} /> : null}

            {showRestaurePopupTfti ? <PopupActionConfirm msg={msgRestaurePopupTfti} confirmationState={restaureDefaultParameterTfti} /> : null}
            {showUpdatePopupTfti ? <PopupActionConfirm msg={msgUpdatePopupTfti} confirmationState={updateDefaultParameterTfti} /> : null}

            {showRestaurePopupDp ? <PopupActionConfirm msg={msgRestaurePopupDp} confirmationState={restaureDefaultParameterDp} /> : null}
            {showUpdatePopupDp ? <PopupActionConfirm msg={msgUpdatePopupDp} confirmationState={updateDefaultParameterDp} /> : null}

            {showRestaurePopupBhiapc ? <PopupActionConfirm msg={msgRestaurePopupBhiapc} confirmationState={restaureDefaultParameterBhiapc} /> : null}
            {showUpdatePopupBhiapc ? <PopupActionConfirm msg={msgUpdatePopupBhiapc} confirmationState={updateDefaultParameterBhiapc} /> : null}

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
                    <TabPanel value="1" style={{ height: '85%' }}>
                        <Stack width={"100%"} height={"95%"} spacing={1} alignItems={"flex-start"} justifyContent={"stretch"}>
                            <Typography variant='h6' sx={{ color: "black" }} align='left'>Paramétrages: Mapping des comptes</Typography>

                            <Stack width={"100%"} height={"80px"} spacing={4} alignItems={"left"} alignContent={"center"} direction={"row"} style={{ marginLeft: "0px", marginTop: "20px" }}>
                                <Stack
                                    direction={"row"}
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
                                                <MenuItem
                                                    key={option.id}
                                                    value={option.id}
                                                >{option.libelle_rang}: {format(option.date_debut, "dd/MM/yyyy")} - {format(option.date_fin, "dd/MM/yyyy")}</MenuItem>
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
                            </Stack>

                            <Box sx={{ width: '100%', height: '100%', typography: 'body1' }}>
                                <TabContext value={valueParamMapping} style={{ height: '100%' }}>
                                    <Box >
                                        <TabList onChange={handleChangeTab} aria-label="lab API tabs example" variant='scrollable'>
                                            <Tab style={{ textTransform: 'none', outline: 'none', border: 'none', }} label="Ebilan" value="1" />
                                            <Tab style={{ textTransform: 'none', outline: 'none', border: 'none', }} label="D. Com" value="2" />
                                        </TabList>
                                    </Box>

                                    <TabPanel value="1" style={{ height: '100%', }}>
                                        <TabContext value={valueEbilanParamMapping} style={{ height: '100%' }}>
                                            <Box >
                                                <TabList onChange={handleChangeTabEbilan} aria-label="lab API tabs example" variant='scrollable'>
                                                    <Tab style={{ textTransform: 'none', outline: 'none', border: 'none', }} label="Bilan" value="1" />
                                                    <Tab style={{ textTransform: 'none', outline: 'none', border: 'none', }} label="Crn" value="2" />
                                                    <Tab style={{ textTransform: 'none', outline: 'none', border: 'none', }} label="Crf" value="3" />
                                                    <Tab style={{ textTransform: 'none', outline: 'none', border: 'none', }} label="Tftd" value="4" />
                                                    <Tab style={{ textTransform: 'none', outline: 'none', border: 'none', }} label="Tfti" value="5" />
                                                    <Tab style={{ textTransform: 'none', outline: 'none', border: 'none', }} label="Bhiapc" value="6" />
                                                    <Tab style={{ textTransform: 'none', outline: 'none', border: 'none', }} label="Dp" value="7" />
                                                </TabList>
                                            </Box>

                                            <TabPanel value="1" style={{ height: '100%', }}>
                                                <Stack width={"100%"} height={"100%"} spacing={1} alignItems={"center"} alignContent={"center"}
                                                    justifyContent={"stretch"}
                                                >

                                                    <Stack width={"100%"} height={"35px"} spacing={0.5} alignItems={"right"} alignContent={"right"}
                                                        direction={"row"} justifyContent={"right"}
                                                    >
                                                        <Tooltip title="Simuler les paramétrages des comptes">
                                                            <IconButton
                                                                variant="contained"
                                                                style={{
                                                                    width: "35px", height: '35px',
                                                                    borderRadius: "2px", borderColor: "transparent",
                                                                    backgroundColor: initial.theme,
                                                                    textTransform: 'none', outline: 'none'
                                                                }}
                                                            >
                                                                <VscRepoFetch style={{ width: '25px', height: '25px', color: 'white' }} />
                                                                {/* <Typography style={{color: 'white'}}>Simuler</Typography> */}
                                                            </IconButton>
                                                        </Tooltip>

                                                        <Tooltip title="Restaurer les paramétrages par défaut">
                                                            <IconButton
                                                                onClick={handleRestaureDefaultParameterBilan}
                                                                variant="contained"
                                                                style={{
                                                                    width: "35px", height: '35px',
                                                                    borderRadius: "2px", borderColor: "transparent",
                                                                    backgroundColor: "rgba(9, 77, 31, 0.8)",
                                                                    textTransform: 'none', outline: 'none'
                                                                }}
                                                            >
                                                                <LuArchiveRestore style={{ width: '25px', height: '25px', color: 'white' }} />
                                                                {/* <Typography style={{color: 'white'}}>Restaurer</Typography> */}
                                                            </IconButton>
                                                        </Tooltip>

                                                        <Tooltip title="mettre à jour les paramétrages par défaut">
                                                            <IconButton
                                                                onClick={handleUpdateDefaultParameterBilan}
                                                                variant="contained"
                                                                style={{
                                                                    width: "35px", height: '35px',
                                                                    borderRadius: "2px", borderColor: "transparent",
                                                                    backgroundColor: "rgba(9, 77, 31, 0.8)",
                                                                    textTransform: 'none', outline: 'none'
                                                                }}
                                                            >
                                                                <GrUpdate style={{ width: '25px', height: '25px', color: 'white' }} />
                                                                {/* <Typography style={{color: 'white'}}>Mettre à jour</Typography> */}
                                                            </IconButton>
                                                        </Tooltip>

                                                    </Stack>

                                                    <Stack width={"100%"} height={"30px"} spacing={2} alignItems={"left"} alignContent={"left"}
                                                        direction={"row"} justifyContent={"left"}
                                                    >
                                                        <Stack width={"50%"} height={"30px"} spacing={2} alignItems={"left"} alignContent={"left"}
                                                            direction={"row"} justifyContent={"left"}
                                                        >
                                                            <ButtonGroup
                                                                disableElevation
                                                                variant="contained"
                                                                aria-label="Disabled button group"
                                                            >
                                                                <Button onClick={() => choixAffichageBilan(1)} variant={buttonActifVariant} style={{ borderRadius: "0", textTransform: 'none', outline: 'none', width: 80 }}>Actif</Button>
                                                                <Button onClick={() => choixAffichageBilan(2)} variant={buttonPassifVariant} style={{ borderRadius: "0", textTransform: 'none', outline: 'none', width: 80 }}>Passif</Button>
                                                            </ButtonGroup>
                                                        </Stack>

                                                        <Stack width={"50%"} height={"30px"} spacing={3} alignItems={"left"} alignContent={"left"}
                                                            direction={"row"} justifyContent={"left"}
                                                        >
                                                            <ButtonGroup
                                                                disableElevation
                                                                variant="contained"
                                                                aria-label="Disabled button group"
                                                            >
                                                                <Button onClick={() => choixAffichageDetailCalcul('BRUT')} variant={buttonActifVariant2} style={{ borderRadius: "0", textTransform: 'none', outline: 'none', width: 80 }}>Brut</Button>
                                                                <Button onClick={() => choixAffichageDetailCalcul('AMORT')} variant={buttonPassifVariant2} style={{ borderRadius: "0", textTransform: 'none', outline: 'none', width: 80 }}>Amort</Button>
                                                            </ButtonGroup>
                                                        </Stack>
                                                    </Stack>

                                                    <Stack width={"100%"} height={"75%"} spacing={2} alignItems={"start"} alignContent={"start"}
                                                        direction={"row"} style={{ marginLeft: "0px", marginTop: "5px" }}
                                                    >
                                                        <Stack width={"50%"} height={"100%"} spacing={1} alignItems={"flex-start"}
                                                            alignContent={"flex-start"} justifyContent={"stretch"} direction={"column"}
                                                            style={{ border: '2px solid rgba(5,96,116,0.60)' }} paddingLeft={"10px"} paddingRight={"10px"} paddingBottom={"10px"} paddingTop={"22px"}>
                                                            <Typography variant='h7' sx={{ color: "rgba(5,96,116,0.60)", fontSize: 16.9 }} align='left'>Liste des rubriques</Typography>
                                                            <Stack
                                                                width="100%"
                                                                height="700px"
                                                                style={{
                                                                    marginLeft: "0px",
                                                                    marginTop: "20px",
                                                                }}
                                                            >
                                                                <Datagridbase row_id={updateSelectedRowId} tableRow={canView ? bilanData : []} />
                                                            </Stack>
                                                        </Stack>

                                                        <Stack width={"50%"} height={"100%"} spacing={3} alignItems={"flex-start"}
                                                            alignContent={"flex-start"} justifyContent={"stretch"} marginLeft={"0px"}
                                                            style={{ border: '2px solid rgba(5,96,116,0.60)' }} padding={"10px"}
                                                        >
                                                            <Datagriddetail
                                                                canView={canView}
                                                                canAdd={canAdd}
                                                                canDelete={canDelete}
                                                                canModify={canModify}
                                                                compteId={compteId}
                                                                fileId={fileId}
                                                                exerciceId={selectedPeriodeId}
                                                                etatId={"BILAN"}
                                                                rubriqueId={bilanSelectedRubriqueId}
                                                                nature={showBrut}
                                                                bilanRubriqueData={bilanRubriqueData}
                                                            />
                                                        </Stack>
                                                    </Stack>
                                                </Stack>
                                            </TabPanel>

                                            <TabPanel value="2" style={{ height: '100%' }}>
                                                <Stack width={"100%"} height={"100%"} spacing={1} alignItems={"center"} alignContent={"center"}
                                                    justifyContent={"stretch"}
                                                >
                                                    <Stack width={"100%"} height={"35px"} spacing={0.5} alignItems={"right"} alignContent={"right"}
                                                        direction={"row"} justifyContent={"right"}
                                                    >
                                                        <Tooltip title="Simuler les paramétrages des comptes">
                                                            <IconButton
                                                                variant="contained"
                                                                style={{
                                                                    width: "35px", height: '35px',
                                                                    borderRadius: "2px", borderColor: "transparent",
                                                                    backgroundColor: initial.theme,
                                                                    textTransform: 'none', outline: 'none'
                                                                }}
                                                            >
                                                                <VscRepoFetch style={{ width: '25px', height: '25px', color: 'white' }} />
                                                                {/* <Typography style={{color: 'white'}}>Simuler</Typography> */}
                                                            </IconButton>
                                                        </Tooltip>

                                                        <Tooltip title="Restaurer les paramétrages par défaut">
                                                            <IconButton
                                                                onClick={handleRestaureDefaultParameterCRN}
                                                                variant="contained"
                                                                style={{
                                                                    width: "35px", height: '35px',
                                                                    borderRadius: "2px", borderColor: "transparent",
                                                                    backgroundColor: "rgba(9, 77, 31, 0.8)",
                                                                    textTransform: 'none', outline: 'none'
                                                                }}
                                                            >
                                                                <LuArchiveRestore style={{ width: '25px', height: '25px', color: 'white' }} />
                                                            </IconButton>
                                                        </Tooltip>

                                                        <Tooltip title="mettre à jour les paramétrages par défaut">
                                                            <IconButton
                                                                onClick={handleUpdateDefaultParameterCRN}
                                                                variant="contained"
                                                                style={{
                                                                    width: "35px", height: '35px',
                                                                    borderRadius: "2px", borderColor: "transparent",
                                                                    backgroundColor: "rgba(9, 77, 31, 0.8)",
                                                                    textTransform: 'none', outline: 'none'
                                                                }}
                                                            >
                                                                <GrUpdate style={{ width: '25px', height: '25px', color: 'white' }} />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </Stack>

                                                    <Stack width={"100%"} height={"75%"} spacing={2} alignItems={"start"} alignContent={"start"}
                                                        direction={"row"} style={{ marginLeft: "0px", marginTop: "5px" }}
                                                    >
                                                        <Stack width={"50%"} height={"100%"} spacing={1} alignItems={"flex-start"}
                                                            alignContent={"flex-start"} justifyContent={"stretch"} direction={"column"}
                                                            style={{ border: '2px solid rgba(5,96,116,0.60)' }} paddingLeft={"10px"} paddingRight={"10px"} paddingBottom={"10px"} paddingTop={"22px"}>
                                                            <Typography variant='h7' sx={{ color: "rgba(5,96,116,0.60)", fontSize: 16.9 }} align='left'>Liste des rubriques</Typography>
                                                            <Stack
                                                                width="100%"
                                                                height="700px"
                                                                style={{
                                                                    marginLeft: "0px",
                                                                    marginTop: "20px",
                                                                }}
                                                            >
                                                                <Datagridbase row_id={updateSelectedRowIdCRN} tableRow={canView ? crnData : []} />
                                                            </Stack>
                                                        </Stack>

                                                        <Stack width={"50%"} height={"100%"} spacing={3} alignItems={"flex-start"}
                                                            alignContent={"flex-start"} justifyContent={"stretch"} marginLeft={"0px"}
                                                            style={{ border: '2px solid rgba(5,96,116,0.60)' }} padding={"10px"}
                                                        >
                                                            <Datagriddetail
                                                                canView={canView}
                                                                canAdd={canAdd}
                                                                canDelete={canDelete}
                                                                canModify={canModify}
                                                                compteId={compteId}
                                                                fileId={fileId}
                                                                exerciceId={selectedPeriodeId}
                                                                etatId={"CRN"}
                                                                rubriqueId={crnSelectedRubriqueId}
                                                                nature={'BRUT'}
                                                                bilanRubriqueData={crnRubriqueData}
                                                            />
                                                        </Stack>
                                                    </Stack>
                                                </Stack>
                                            </TabPanel>

                                            <TabPanel value="3" style={{ height: '100%' }}>

                                                <Stack width={"100%"} height={"100%"} spacing={1} alignItems={"center"} alignContent={"center"}
                                                    justifyContent={"stretch"}
                                                >
                                                    <Stack width={"100%"} height={"35px"} spacing={0.5} alignItems={"right"} alignContent={"right"}
                                                        direction={"row"} justifyContent={"right"}
                                                    >
                                                        <Tooltip title="Simuler les paramétrages des comptes">
                                                            <IconButton
                                                                variant="contained"
                                                                style={{
                                                                    width: "35px", height: '35px',
                                                                    borderRadius: "2px", borderColor: "transparent",
                                                                    backgroundColor: initial.theme,
                                                                    textTransform: 'none', outline: 'none'
                                                                }}
                                                            >
                                                                <VscRepoFetch style={{ width: '25px', height: '25px', color: 'white' }} />
                                                                {/* <Typography style={{color: 'white'}}>Simuler</Typography> */}
                                                            </IconButton>
                                                        </Tooltip>

                                                        <Tooltip title="Restaurer les paramétrages par défaut">
                                                            <IconButton
                                                                onClick={handleRestaureDefaultParameterCRF}
                                                                variant="contained"
                                                                style={{
                                                                    width: "35px", height: '35px',
                                                                    borderRadius: "2px", borderColor: "transparent",
                                                                    backgroundColor: "rgba(9, 77, 31, 0.8)",
                                                                    textTransform: 'none', outline: 'none'
                                                                }}
                                                            >
                                                                <LuArchiveRestore style={{ width: '25px', height: '25px', color: 'white' }} />
                                                            </IconButton>
                                                        </Tooltip>

                                                        <Tooltip title="mettre à jour les paramétrages par défaut">
                                                            <IconButton
                                                                onClick={handleUpdateDefaultParameterCRF}
                                                                variant="contained"
                                                                style={{
                                                                    width: "35px", height: '35px',
                                                                    borderRadius: "2px", borderColor: "transparent",
                                                                    backgroundColor: "rgba(9, 77, 31, 0.8)",
                                                                    textTransform: 'none', outline: 'none'
                                                                }}
                                                            >
                                                                <GrUpdate style={{ width: '25px', height: '25px', color: 'white' }} />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </Stack>

                                                    <Stack width={"100%"} height={"75%"} spacing={2} alignItems={"start"} alignContent={"start"}
                                                        direction={"row"} style={{ marginLeft: "0px", marginTop: "5px" }}
                                                    >
                                                        <Stack width={"50%"} height={"100%"} spacing={1} alignItems={"flex-start"}
                                                            alignContent={"flex-start"} justifyContent={"stretch"} direction={"column"}
                                                            style={{ border: '2px solid rgba(5,96,116,0.60)' }} paddingLeft={"10px"} paddingRight={"10px"} paddingBottom={"10px"} paddingTop={"22px"}>
                                                            <Typography variant='h7' sx={{ color: "rgba(5,96,116,0.60)", fontSize: 16.9 }} align='left'>Liste des rubriques</Typography>
                                                            <Stack
                                                                width="100%"
                                                                height="700px"
                                                                style={{
                                                                    marginLeft: "0px",
                                                                    marginTop: "20px",
                                                                }}
                                                            >
                                                                <Datagridbase row_id={updateSelectedRowIdCRF} tableRow={canView ? crfData : []} />
                                                            </Stack>
                                                        </Stack>

                                                        <Stack width={"50%"} height={"100%"} spacing={3} alignItems={"flex-start"}
                                                            alignContent={"flex-start"} justifyContent={"stretch"} marginLeft={"0px"}
                                                            style={{ border: '2px solid rgba(5,96,116,0.60)' }} padding={"10px"}
                                                        >
                                                            <Datagriddetail
                                                                canView={canView}
                                                                canAdd={canAdd}
                                                                canDelete={canDelete}
                                                                canModify={canModify}
                                                                compteId={compteId}
                                                                fileId={fileId}
                                                                exerciceId={selectedPeriodeId}
                                                                etatId={"CRF"}
                                                                rubriqueId={crfSelectedRubriqueId}
                                                                nature={'BRUT'}
                                                                bilanRubriqueData={crfRubriqueData}
                                                            />
                                                        </Stack>
                                                    </Stack>
                                                </Stack>
                                            </TabPanel>

                                            <TabPanel value="4" style={{ height: '100%' }}>

                                                <Stack width={"100%"} height={"100%"} spacing={1} alignItems={"center"} alignContent={"center"}
                                                    justifyContent={"stretch"}
                                                >
                                                    <Stack width={"100%"} height={"35px"} spacing={0.5} alignItems={"right"} alignContent={"right"}
                                                        direction={"row"} justifyContent={"right"}
                                                    >
                                                        <Tooltip title="Simuler les paramétrages des comptes">
                                                            <IconButton
                                                                variant="contained"
                                                                style={{
                                                                    width: "35px", height: '35px',
                                                                    borderRadius: "2px", borderColor: "transparent",
                                                                    backgroundColor: initial.theme,
                                                                    textTransform: 'none', outline: 'none'
                                                                }}
                                                            >
                                                                <VscRepoFetch style={{ width: '25px', height: '25px', color: 'white' }} />
                                                                {/* <Typography style={{color: 'white'}}>Simuler</Typography> */}
                                                            </IconButton>
                                                        </Tooltip>

                                                        <Tooltip title="Restaurer les paramétrages par défaut">
                                                            <IconButton
                                                                onClick={handleRestaureDefaultParameterTFTD}
                                                                variant="contained"
                                                                style={{
                                                                    width: "35px", height: '35px',
                                                                    borderRadius: "2px", borderColor: "transparent",
                                                                    backgroundColor: "rgba(9, 77, 31, 0.8)",
                                                                    textTransform: 'none', outline: 'none'
                                                                }}
                                                            >
                                                                <LuArchiveRestore style={{ width: '25px', height: '25px', color: 'white' }} />
                                                            </IconButton>
                                                        </Tooltip>

                                                        <Tooltip title="mettre à jour les paramétrages par défaut">
                                                            <IconButton
                                                                onClick={handleUpdateDefaultParameterTFTD}
                                                                variant="contained"
                                                                style={{
                                                                    width: "35px", height: '35px',
                                                                    borderRadius: "2px", borderColor: "transparent",
                                                                    backgroundColor: "rgba(9, 77, 31, 0.8)",
                                                                    textTransform: 'none', outline: 'none'
                                                                }}
                                                            >
                                                                <GrUpdate style={{ width: '25px', height: '25px', color: 'white' }} />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </Stack>

                                                    <Stack width={"100%"} height={"75%"} spacing={2} alignItems={"start"} alignContent={"start"}
                                                        direction={"row"} style={{ marginLeft: "0px", marginTop: "5px" }}
                                                    >
                                                        <Stack width={"50%"} height={"100%"} spacing={1} alignItems={"flex-start"}
                                                            alignContent={"flex-start"} justifyContent={"stretch"} direction={"column"}
                                                            style={{ border: '2px solid rgba(5,96,116,0.60)' }} paddingLeft={"10px"} paddingRight={"10px"} paddingBottom={"10px"} paddingTop={"22px"}>
                                                            <Typography variant='h7' sx={{ color: "rgba(5,96,116,0.60)", fontSize: 16.9 }} align='left'>Liste des rubriques</Typography>
                                                            <Stack
                                                                width="100%"
                                                                height="700px"
                                                                style={{
                                                                    marginLeft: "0px",
                                                                    marginTop: "20px",
                                                                }}
                                                            >
                                                                <Datagridbase row_id={updateSelectedRowIdTFTD} tableRow={canView ? tftdData : []} />
                                                            </Stack>
                                                        </Stack>

                                                        <Stack width={"50%"} height={"100%"} spacing={3} alignItems={"flex-start"}
                                                            alignContent={"flex-start"} justifyContent={"stretch"} marginLeft={"0px"}
                                                            style={{ border: '2px solid rgba(5,96,116,0.60)' }} padding={"10px"}
                                                        >
                                                            <Datagriddetail
                                                                canView={canView}
                                                                canAdd={canAdd}
                                                                canDelete={canDelete}
                                                                canModify={canModify}
                                                                compteId={compteId}
                                                                fileId={fileId}
                                                                exerciceId={selectedPeriodeId}
                                                                etatId={"TFTD"}
                                                                rubriqueId={tftdSelectedRubriqueId}
                                                                nature={'BRUT'}
                                                                bilanRubriqueData={tftdRubriqueData}
                                                            />
                                                        </Stack>
                                                    </Stack>
                                                </Stack>
                                            </TabPanel>

                                            <TabPanel value="5" style={{ height: '100%' }}>

                                                <Stack width={"100%"} height={"100%"} spacing={1} alignItems={"center"} alignContent={"center"}
                                                    justifyContent={"stretch"}
                                                >
                                                    <Stack width={"100%"} height={"35px"} spacing={0.5} alignItems={"right"} alignContent={"right"}
                                                        direction={"row"} justifyContent={"right"}
                                                    >
                                                        <Tooltip title="Simuler les paramétrages des comptes">
                                                            <IconButton
                                                                variant="contained"
                                                                style={{
                                                                    width: "35px", height: '35px',
                                                                    borderRadius: "2px", borderColor: "transparent",
                                                                    backgroundColor: initial.theme,
                                                                    textTransform: 'none', outline: 'none'
                                                                }}
                                                            >
                                                                <VscRepoFetch style={{ width: '25px', height: '25px', color: 'white' }} />
                                                                {/* <Typography style={{color: 'white'}}>Simuler</Typography> */}
                                                            </IconButton>
                                                        </Tooltip>

                                                        <Tooltip title="Restaurer les paramétrages par défaut">
                                                            <IconButton
                                                                onClick={handleRestaureDefaultParameterTFTI}
                                                                variant="contained"
                                                                style={{
                                                                    width: "35px", height: '35px',
                                                                    borderRadius: "2px", borderColor: "transparent",
                                                                    backgroundColor: "rgba(9, 77, 31, 0.8)",
                                                                    textTransform: 'none', outline: 'none'
                                                                }}
                                                            >
                                                                <LuArchiveRestore style={{ width: '25px', height: '25px', color: 'white' }} />
                                                            </IconButton>
                                                        </Tooltip>

                                                        <Tooltip title="mettre à jour les paramétrages par défaut">
                                                            <IconButton
                                                                onClick={handleUpdateDefaultParameterTFTI}
                                                                variant="contained"
                                                                style={{
                                                                    width: "35px", height: '35px',
                                                                    borderRadius: "2px", borderColor: "transparent",
                                                                    backgroundColor: "rgba(9, 77, 31, 0.8)",
                                                                    textTransform: 'none', outline: 'none'
                                                                }}
                                                            >
                                                                <GrUpdate style={{ width: '25px', height: '25px', color: 'white' }} />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </Stack>

                                                    <Stack width={"100%"} height={"75%"} spacing={2} alignItems={"start"} alignContent={"start"}
                                                        direction={"row"} style={{ marginLeft: "0px", marginTop: "5px" }}
                                                    >
                                                        <Stack width={"50%"} height={"100%"} spacing={1} alignItems={"flex-start"}
                                                            alignContent={"flex-start"} justifyContent={"stretch"} direction={"column"}
                                                            style={{ border: '2px solid rgba(5,96,116,0.60)' }} paddingLeft={"10px"} paddingRight={"10px"} paddingBottom={"10px"} paddingTop={"22px"}>
                                                            <Typography variant='h7' sx={{ color: "rgba(5,96,116,0.60)", fontSize: 16.9 }} align='left'>Liste des rubriques</Typography>
                                                            <Stack
                                                                width="100%"
                                                                height="700px"
                                                                style={{
                                                                    marginLeft: "0px",
                                                                    marginTop: "20px",
                                                                }}
                                                            >
                                                                <Datagridbase row_id={updateSelectedRowIdTFTI} tableRow={canView ? tftiData : []} />
                                                            </Stack>
                                                        </Stack>

                                                        <Stack width={"50%"} height={"100%"} spacing={3} alignItems={"flex-start"}
                                                            alignContent={"flex-start"} justifyContent={"stretch"} marginLeft={"0px"}
                                                            style={{ border: '2px solid rgba(5,96,116,0.60)' }} padding={"10px"}
                                                        >
                                                            <Datagriddetail
                                                                canView={canView}
                                                                canAdd={canAdd}
                                                                canDelete={canDelete}
                                                                canModify={canModify}
                                                                compteId={compteId}
                                                                fileId={fileId}
                                                                exerciceId={selectedPeriodeId}
                                                                etatId={"TFTI"}
                                                                rubriqueId={tftiSelectedRubriqueId}
                                                                nature={'BRUT'}
                                                                bilanRubriqueData={tftiRubriqueData}
                                                            />
                                                        </Stack>
                                                    </Stack>
                                                </Stack>
                                            </TabPanel>

                                            <TabPanel value="6" style={{ height: '100%' }}>

                                                <Stack width={"100%"} height={"100%"} spacing={1} alignItems={"center"} alignContent={"center"}
                                                    justifyContent={"stretch"}
                                                >
                                                    <Stack width={"100%"} height={"35px"} spacing={0.5} alignItems={"right"} alignContent={"right"}
                                                        direction={"row"} justifyContent={"right"}
                                                    >

                                                        <Tooltip title="Restaurer les paramétrages par défaut">
                                                            <IconButton
                                                                onClick={handleRestaureDefaultParameterBHIAPC}
                                                                variant="contained"
                                                                style={{
                                                                    width: "35px", height: '35px',
                                                                    borderRadius: "2px", borderColor: "transparent",
                                                                    backgroundColor: "rgba(9, 77, 31, 0.8)",
                                                                    textTransform: 'none', outline: 'none'
                                                                }}
                                                            >
                                                                <LuArchiveRestore style={{ width: '25px', height: '25px', color: 'white' }} />
                                                            </IconButton>
                                                        </Tooltip>

                                                        <Tooltip title="mettre à jour les paramétrages par défaut">
                                                            <IconButton
                                                                onClick={handleUpdateDefaultParameterBHIAPC}
                                                                variant="contained"
                                                                style={{
                                                                    width: "35px", height: '35px',
                                                                    borderRadius: "2px", borderColor: "transparent",
                                                                    backgroundColor: "rgba(9, 77, 31, 0.8)",
                                                                    textTransform: 'none', outline: 'none'
                                                                }}
                                                            >
                                                                <GrUpdate style={{ width: '25px', height: '25px', color: 'white' }} />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </Stack>

                                                    <Stack width={"100%"} height={"75%"} spacing={2} alignItems={"start"} alignContent={"start"}
                                                        direction={"row"} style={{ marginLeft: "0px", marginTop: "5px" }}
                                                    >
                                                        <Stack width={"100%"} height={"100%"} spacing={3} alignItems={"flex-start"}
                                                            alignContent={"flex-start"} justifyContent={"stretch"} marginLeft={"0px"}
                                                            style={{ border: '2px solid rgba(5,96,116,0.60)' }} padding={"10px"}
                                                        >
                                                            <DatagridBHIAPCdetail
                                                                canView={canView}
                                                                canAdd={canAdd}
                                                                canDelete={canDelete}
                                                                canModify={canModify}
                                                                compteId={compteId}
                                                                fileId={fileId}
                                                                exerciceId={selectedPeriodeId}
                                                                etatId={"BHIAPC"}
                                                                rubriqueId={bhiapcSelectedRubriqueId}
                                                                nature={'BRUT'}
                                                                bilanRubriqueData={canView ? bhiapcRubriqueData : []}
                                                            />
                                                        </Stack>
                                                    </Stack>
                                                </Stack>
                                            </TabPanel>

                                            <TabPanel value="7" style={{ height: '100%' }}>

                                                <Stack width={"100%"} height={"100%"} spacing={1} alignItems={"center"} alignContent={"center"}
                                                    justifyContent={"stretch"}
                                                >
                                                    <Stack width={"100%"} height={"35px"} spacing={0.5} alignItems={"right"} alignContent={"right"}
                                                        direction={"row"} justifyContent={"right"}
                                                    >
                                                        <Tooltip title="Simuler les paramétrages des comptes">
                                                            <IconButton
                                                                variant="contained"
                                                                style={{
                                                                    width: "35px", height: '35px',
                                                                    borderRadius: "2px", borderColor: "transparent",
                                                                    backgroundColor: initial.theme,
                                                                    textTransform: 'none', outline: 'none'
                                                                }}
                                                            >
                                                                <VscRepoFetch style={{ width: '25px', height: '25px', color: 'white' }} />
                                                                {/* <Typography style={{color: 'white'}}>Simuler</Typography> */}
                                                            </IconButton>
                                                        </Tooltip>

                                                        <Tooltip title="Restaurer les paramétrages par défaut">
                                                            <IconButton
                                                                onClick={handleRestaureDefaultParameterDP}
                                                                variant="contained"
                                                                style={{
                                                                    width: "35px", height: '35px',
                                                                    borderRadius: "2px", borderColor: "transparent",
                                                                    backgroundColor: "rgba(9, 77, 31, 0.8)",
                                                                    textTransform: 'none', outline: 'none'
                                                                }}
                                                            >
                                                                <LuArchiveRestore style={{ width: '25px', height: '25px', color: 'white' }} />
                                                            </IconButton>
                                                        </Tooltip>

                                                        <Tooltip title="mettre à jour les paramétrages par défaut">
                                                            <IconButton
                                                                onClick={handleUpdateDefaultParameterDP}
                                                                variant="contained"
                                                                style={{
                                                                    width: "35px", height: '35px',
                                                                    borderRadius: "2px", borderColor: "transparent",
                                                                    backgroundColor: "rgba(9, 77, 31, 0.8)",
                                                                    textTransform: 'none', outline: 'none'
                                                                }}
                                                            >
                                                                <GrUpdate style={{ width: '25px', height: '25px', color: 'white' }} />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </Stack>

                                                    <Stack width={"100%"} height={"75%"} spacing={2} alignItems={"start"} alignContent={"start"}
                                                        direction={"row"} style={{ marginLeft: "0px", marginTop: "5px" }}
                                                    >
                                                        <Stack
                                                            width={"50%"}
                                                            height={"100%"}
                                                            alignItems={"flex-start"}
                                                            alignContent={"flex-start"}
                                                            justifyContent={"stretch"}
                                                            direction={"column"}
                                                            style={{
                                                                border: '2px solid rgba(5,96,116,0.60)'
                                                            }}
                                                            paddingLeft={"10px"}
                                                            paddingRight={"10px"}
                                                            paddingBottom={"10px"}
                                                            paddingTop={"22px"}
                                                        >
                                                            <Typography variant='h7' sx={{ color: "rgba(5,96,116,0.60)", fontSize: 16.9 }} align='left'>Liste des rubriques</Typography>

                                                            <Stack
                                                                width="100%"
                                                                height="700px"
                                                                style={{
                                                                    marginLeft: "0px",
                                                                    marginTop: "20px",
                                                                }}
                                                            >
                                                                <Datagridbase row_id={updateSelectedRowIdDP} tableRow={canView ? dpData : []} />
                                                            </Stack>
                                                        </Stack>

                                                        <Stack width={"50%"} height={"100%"} spacing={3} alignItems={"flex-start"}
                                                            alignContent={"flex-start"} justifyContent={"stretch"} marginLeft={"0px"}
                                                            style={{ border: '2px solid rgba(5,96,116,0.60)' }} padding={"10px"}
                                                        >
                                                            <DatagridTableDpMappingDetail
                                                                canView={canView}
                                                                canAdd={canAdd}
                                                                canDelete={canDelete}
                                                                canModify={canModify}
                                                                compteId={compteId}
                                                                fileId={fileId}
                                                                exerciceId={selectedPeriodeId}
                                                                etatId={"DP"}
                                                                rubriqueId={dpSelectedRubriqueId}
                                                                nature={'BRUT'}
                                                                bilanRubriqueData={dpRubriqueData}
                                                            />
                                                        </Stack>
                                                    </Stack>
                                                </Stack>
                                            </TabPanel>

                                        </TabContext>
                                    </TabPanel>

                                    <TabPanel value="2" style={{ height: '100%' }}>
                                        <Stack width={"100%"} height={"75%"} spacing={2} alignItems={"start"} alignContent={"start"}
                                            direction={"row"} style={{ marginLeft: "0px", marginTop: "5px" }}
                                        >
                                            <Stack
                                                width={"50%"}
                                                height={"100%"}
                                                alignItems={"flex-start"}
                                                alignContent={"flex-start"}
                                                justifyContent={"stretch"}
                                                direction={"column"}
                                                style={{
                                                    border: '2px solid rgba(5,96,116,0.60)'
                                                }}
                                                paddingLeft={"10px"}
                                                paddingRight={"10px"}
                                                paddingBottom={"10px"}
                                                paddingTop={"22px"}
                                            >
                                                <Typography variant='h7' sx={{ color: "rgba(5,96,116,0.60)", fontSize: 16.9 }} align='left'>Liste des rubriques</Typography>

                                                <Stack
                                                    width="100%"
                                                    height="700px"
                                                    style={{
                                                        marginLeft: "0px",
                                                        marginTop: "20px",
                                                    }}
                                                >
                                                    <Datagridbase row_id={updateSelectedRowIdDCom} tableRow={canView ? dComData : []} />
                                                </Stack>
                                            </Stack>

                                            <Stack width={"50%"} height={"100%"} spacing={3} alignItems={"flex-start"}
                                                alignContent={"flex-start"} justifyContent={"stretch"} marginLeft={"0px"}
                                                style={{ border: '2px solid rgba(5,96,116,0.60)' }} padding={"10px"}
                                            >
                                                {/* <DatagridTableDpMappingDetail compteId={compteId} fileId={fileId} exerciceId={selectedPeriodeId} etatId={"DCOM"} rubriqueId={dComSelectedRubriqueId} nature={'BRUT'} bilanRubriqueData={dpRubriqueData} /> */}
                                                <DatagridTableDpComMappingDetail
                                                    canView={canView}
                                                    canAdd={canAdd}
                                                    canDelete={canDelete}
                                                    canModify={canModify}
                                                    compteId={compteId}
                                                    fileId={fileId}
                                                    exerciceId={selectedPeriodeId}
                                                    etatId={"DCOM"}
                                                    rubriqueId={dComSelectedRubriqueId}
                                                    nature={'BRUT'}
                                                    dComRubriqueData={dComRubriqueData}
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
        </>
    )
}