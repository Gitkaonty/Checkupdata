import { useState, useEffect, useMemo } from 'react';
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

import DatagirdBaseExterne from '../../../componentsTools/MappingCompteExterne/DatagirdBaseExterne';
import DatagridDetailExterne from '../../../componentsTools/MappingCompteExterne/DatagridDetailExterne';

import { init } from '../../../../../init';
import PopupActionConfirm from '../../../componentsTools/popupActionConfirm';
import { GrUpdate } from "react-icons/gr";
import { LuArchiveRestore } from "react-icons/lu";
import { VscRepoFetch } from "react-icons/vsc";
import usePermission from '../../../../hooks/usePermission';

export default function ParamMappingExterne() {
  const { canAdd, canModify, canDelete, canView } = usePermission();

  let tabEbilanParamMapping = "";
  if (typeof window !== 'undefined') {
    tabEbilanParamMapping = localStorage.getItem('valueEbilanParamMapping');
  }
  let initial = init[0];
  const [valueEbilanParamMapping, setValueEbilanParamMapping] = useState(tabEbilanParamMapping || "1");

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

  const [isRefreshed, setIsRefreshed] = useState(false);

  const [typeRubriqueBilan, setTypeRubriqueBilan] = useState("");
  const [typeRubriqueCrn, setTypeRubriqueCrn] = useState("");
  const [typeRubriqueCrf, setTypeRubriqueCrf] = useState("");
  const [typeRubriqueTftd, setTypeRubriqueTftd] = useState("");
  const [typeRubriqueTfti, setTypeRubriqueTfti] = useState("");
  const [typeRubriqueSig, setTypeRubriqueSig] = useState("");

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

  const [sigData, setSigData] = useState([]);
  const [sigSelectedRubriqueId, setSigRubriqueId] = useState(0);
  const [sigRubriqueData, setSigRubriqueData] = useState([]);

  const [isCompteRubriqueRefreshed, setIsCompteRubriqueRefreshed] = useState(false);

  const phrase1_1 = "Voulez-vous vraiment restaurer les paramétrages de calcul par les paramétrages par défaut pour le formulaire du ";
  const phrase1_2 = "? les autres paramétrages manuels seront désactivés.";

  const phrase2_1 = "Voulez-vous vraiment Mettre à jour les paramétrages de calcul par défaut pour le formulaire du ";
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

  //récupération infos de connexion
  const { auth } = useAuth();
  const decoded = auth?.accessToken ? jwtDecode(auth.accessToken) : undefined;
  const compteId = decoded.UserInfo.compteId || null;
  const navigate = useNavigate();

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

  const clearRubriqueId = () => {
    setBilanRubriqueData([]);
    setCrnRubriqueData([]);
    setCrfRubriqueData([]);
    setTftdRubriqueData([]);
    setTftiRubriqueData([]);
    setSigRubriqueData([]);

    setBilanSelectedRubriqueId(null);
    setCrnSelectedRubriqueId(null);
    setCrfSelectedRubriqueId(null);
    setTftdSelectedRubriqueId(null);
    setTftiSelectedRubriqueId(null);
    setSigRubriqueId(null);
  }

  const sendToHome = (value) => {
    setNoFile(!value);
    navigate('/tab/home');
  }

  //Récupérer la liste des exercices
  const GetListeExercice = (id) => {
    axios.get(`/paramExercice/listeExercice/${id}/${compteId}`).then((response) => {
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
    clearRubriqueId();
    setValueEbilanParamMapping(newValue);
    localStorage.setItem('valueEbilanParamMapping', newValue);
  };

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

  //Choix date intervalle
  const handleChangeDateIntervalle = (id) => {
    setSelectedPeriodeId(id);
  }

  //choix affichage tableau bilan (Actif ou passif = actif à l'ouverture)
  const choixAffichageBilan = (choix) => {
    setShowBrut('BRUT');
    setButtonActifVariant2('contained');
    setButtonPassifVariant2('outlined');

    setShowBilan(choix);
    if (choix === 1) {
      setButtonActifVariant('contained');
      setButtonPassifVariant('outlined');
    } else {
      setButtonActifVariant('outlined');
      setButtonPassifVariant('contained');
    }
  }

  const etatIdBILAN = useMemo(() => {
    return showBilan === 1 ? "BILAN_ACTIF" : "BILAN_PASSIF";
  }, [showBilan])

  //choix affichage brut ou amortissement
  const choixAffichageDetailCalcul = (choix) => {
    setShowBrut(choix);
    const rubriqueId = bilanSelectedRubriqueId;
    const exerciceId = selectedPeriodeId;
    const tableau = etatIdBILAN;

    if (choix === 'BRUT') {
      setButtonActifVariant2('contained');
      setButtonPassifVariant2('outlined');

      const choixPoste = 'BRUT';

      axios.post(`/paramRubriqueExterne/getCompteRubriqueExterne`, { compteId, fileId, exerciceId, tableau, choixPoste, rubriqueId }).then((response) => {
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

      axios.post(`/paramRubriqueExterne/getCompteRubriqueExterne`, { compteId, fileId, exerciceId, tableau, choixPoste, rubriqueId }).then((response) => {
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
  const updateSelectedRowIdACTIF = (value) => {
    setBilanSelectedRubriqueId(value);

    const bilanRubriqueExterneData = bilanData.find(val => val.id_rubrique === value);

    setTypeRubriqueBilan(bilanRubriqueExterneData?.type || "");

    const rubriqueId = value;
    const exerciceId = selectedPeriodeId;
    const tableau = 'BILAN_ACTIF';
    const choixPoste = showBrut;
    axios.post(`/paramRubriqueExterne/getCompteRubriqueExterne`, { compteId, fileId, exerciceId, tableau, choixPoste, rubriqueId }).then((response) => {
      const resData = response.data;
      if (resData.state) {
        setBilanRubriqueData(resData.liste);
      } else {
        toast.error(resData.msg);
      }
    });
  }

  const updateSelectedRowIdPASSIF = (value) => {
    setBilanSelectedRubriqueId(value);

    const bilanRubriqueExterneData = bilanData.find(val => val.id_rubrique === value);

    setTypeRubriqueBilan(bilanRubriqueExterneData?.type || "");

    const rubriqueId = value;
    const exerciceId = selectedPeriodeId;
    const tableau = 'BILAN_PASSIF';
    const choixPoste = showBrut;
    axios.post(`/paramRubriqueExterne/getCompteRubriqueExterne`, { compteId, fileId, exerciceId, tableau, choixPoste, rubriqueId }).then((response) => {
      const resData = response.data;
      if (resData.state) {
        setBilanRubriqueData(resData.liste);
      } else {
        toast.error(resData.msg);
      }
    });
  }

  const updateSelectedRowIdBILAN = showBilan === 1 ? updateSelectedRowIdACTIF : updateSelectedRowIdPASSIF;;

  //action de choix rubrique ID sous l'onglet CRN
  const updateSelectedRowIdCRN = (value) => {
    setCrnSelectedRubriqueId(value);

    const crnRubriqueData = crnData.find(val => val.id_rubrique === value);
    setTypeRubriqueCrn(crnRubriqueData?.type || "")

    const rubriqueId = value;
    const exerciceId = selectedPeriodeId;
    const tableau = 'CRN';
    const choixPoste = 'BRUT';
    axios.post(`/paramRubriqueExterne/getCompteRubriqueExterne`, { compteId, fileId, exerciceId, tableau, choixPoste, rubriqueId }).then((response) => {
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

    const crfRubriqueData = crfData.find(val => val.id_rubrique === value);
    setTypeRubriqueCrf(crfRubriqueData?.type || "");

    const rubriqueId = value;
    const exerciceId = selectedPeriodeId;
    const tableau = 'CRF';
    const choixPoste = 'BRUT';
    axios.post(`/paramRubriqueExterne/getCompteRubriqueExterne`, { compteId, fileId, exerciceId, tableau, choixPoste, rubriqueId }).then((response) => {
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

    const tftdRubriqueData = tftdData.find(val => val.id_rubrique === value);
    setTypeRubriqueTftd(tftdRubriqueData?.type || "")

    const rubriqueId = value;
    const exerciceId = selectedPeriodeId;
    const tableau = 'TFTD';
    const choixPoste = 'BRUT';
    axios.post(`/paramRubriqueExterne/getCompteRubriqueExterne`, { compteId, fileId, exerciceId, tableau, choixPoste, rubriqueId }).then((response) => {
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

    const tftiRubriqueData = tftiData.find(val => val.id_rubrique === value);
    setTypeRubriqueTfti(tftiRubriqueData?.type || "")

    const rubriqueId = value;
    const exerciceId = selectedPeriodeId;
    const tableau = 'TFTI';
    const choixPoste = 'BRUT';
    axios.post(`/paramRubriqueExterne/getCompteRubriqueExterne`, { compteId, fileId, exerciceId, tableau, choixPoste, rubriqueId }).then((response) => {
      const resData = response.data;
      if (resData.state) {
        setTftiRubriqueData(resData.liste);
      } else {
        toast.error(resData.msg);
      }
    });
  }

  const updateSelectedRowIdSIG = (value) => {
    setSigRubriqueId(value);

    const sigRubriqueData = sigData.find(val => val.id_rubrique === value);
    setTypeRubriqueSig(sigRubriqueData?.type || "")

    const rubriqueId = value;
    const exerciceId = selectedPeriodeId;
    const tableau = 'SIG';
    const choixPoste = 'BRUT';
    axios.post(`/paramRubriqueExterne/getCompteRubriqueExterne`, { compteId, fileId, exerciceId, tableau, choixPoste, rubriqueId }).then((response) => {
      const resData = response.data;
      if (resData.state) {
        setSigRubriqueData(resData.liste);
      } else {
        toast.error(resData.msg);
      }
    });
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
  const restaureDefaultParameter = (tableau) => {
    const exerciceId = selectedExerciceId;
    axios.post(`/paramRubriqueExterne/restaureDefaultParameter`,
      {
        id_compte: Number(compteId),
        id_dossier: Number(fileId),
        id_exercice: Number(exerciceId),
        id_etat: tableau
      }).then((response) => {
        const resData = response.data;
        if (resData.state) {
          toast.success(resData.msg);
          setIsCompteRubriqueRefreshed(prev => !prev);
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

  //Mettre à jour des paramétrages par défaut pour le formulaire Bilan
  const handleUpdateDefaultParameterBilan = () => {
    setShowUpdatePopupBilan(true);
  }

  //Mettre à jour des paramétrages par défaut pour le formulaire CRN
  const handleUpdateDefaultParameterCRN = () => {
    setShowUpdatePopupCrn(true);
  }

  //Mettre à jour des paramétrages par défaut pour le formulaire CRF
  const handleUpdateDefaultParameterCRF = () => {
    setShowUpdatePopupCrf(true);
  }

  //Mettre à jour des paramétrages par défaut pour le formulaire TFTD
  const handleUpdateDefaultParameterTFTD = () => {
    setShowUpdatePopupTftd(true);
  }

  //Mettre à jour des paramétrages par défaut pour le formulaire TFTI
  const handleUpdateDefaultParameterTFTI = () => {
    setShowUpdatePopupTfti(true);
  }

  const updateDefaultParameter = (tableau) => {
    const exerciceId = selectedExerciceId;
    axios.post(`/paramRubriqueExterne/updateDefaultParameter`,
      {
        id_compte: Number(compteId),
        id_dossier: Number(fileId),
        id_exercice: Number(exerciceId),
        id_etat: tableau
      }
    )
      .then((response) => {
        const resData = response.data;
        if (resData.state) {
          setIsCompteRubriqueRefreshed(prev => !prev);
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

  }

  //Mettre à jour les paramétrages par défaut BILAN
  const updateDefaultParameterBilan = (value) => {
    if (value) {
      updateDefaultParameter('BILAN');
      setShowUpdatePopupBilan(false);
    } else {
      setShowUpdatePopupBilan(false);
    }
  }

  //Mettre à jour les paramétrages par défaut CRN
  const updateDefaultParameterCrn = (value) => {
    if (value) {
      updateDefaultParameter('CRN');
      setShowUpdatePopupCrn(false);
    } else {
      setShowUpdatePopupCrn(false);
    }
  }

  //Mettre à jour les paramétrages par défaut CRF
  const updateDefaultParameterCrf = (value) => {
    if (value) {
      updateDefaultParameter('CRF');
      setShowUpdatePopupCrf(false);
    } else {
      setShowUpdatePopupCrf(false);
    }
  }

  //Mettre à jour les paramétrages par défaut TFTD
  const updateDefaultParameterTftd = (value) => {
    if (value) {
      updateDefaultParameter('TFTD');
      setShowUpdatePopupTftd(false);
    } else {
      setShowUpdatePopupTftd(false);
    }
  }

  //Mettre à jour les paramétrages par défaut TFTI
  const updateDefaultParameterTfti = (value) => {
    if (value) {
      updateDefaultParameter('TFTI');
      setShowUpdatePopupTfti(false);
    } else {
      setShowUpdatePopupTfti(false);
    }
  }

  const getRubriquesExternes = () => {
    axios.get(`/paramRubriqueExterne/getRubriquesExternes/${compteId}/${fileId}/${selectedExerciceId}`)
      .then((response) => {
        const resData = response?.data;
        if (resData?.state) {
          if (showBilan === 1) {
            setBilanData(resData?.liste?.BILAN_ACTIF);
          } else {
            setBilanData(resData?.liste?.BILAN_PASSIF);
          }
          setCrnData(resData?.liste?.CRN);
          setCrfData(resData?.liste?.CRF);
          setTftdData(resData?.liste?.TFTD);
          setTftiData(resData?.liste?.TFTI);
          setSigData(resData?.liste?.SIG);
        }
      })
  }

  //récupérer les informations du dossier sélectionné
  useEffect(() => {
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
    if (canView) {
      getRubriquesExternes();
    }
  }, [compteId, fileId, selectedExerciceId, isRefreshed, showBilan])

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
              <Typography variant='h6' sx={{ color: "black" }} align='left'>Paramétrages: Mapping des comptes - Extèrnes</Typography>

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
                <TabContext value="1" style={{ height: '100%' }}>
                  <TabPanel value="1" style={{ height: '100%', }}>
                    <TabContext value={valueEbilanParamMapping} style={{ height: '100%' }}>
                      <Box >
                        <TabList onChange={handleChangeTabEbilan} aria-label="lab API tabs example" variant='scrollable'>
                          <Tab style={{ textTransform: 'none', outline: 'none', border: 'none', }} label="Bilan" value="1" />
                          <Tab style={{ textTransform: 'none', outline: 'none', border: 'none', }} label="Crn" value="2" />
                          <Tab style={{ textTransform: 'none', outline: 'none', border: 'none', }} label="Crf" value="3" />
                          <Tab style={{ textTransform: 'none', outline: 'none', border: 'none', }} label="Tftd" value="4" />
                          <Tab style={{ textTransform: 'none', outline: 'none', border: 'none', }} label="Tfti" value="5" />
                          <Tab style={{ textTransform: 'none', outline: 'none', border: 'none', }} label="SIG" value="6" />
                        </TabList>
                      </Box>

                      {/* BILAN */}
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
                              </IconButton>
                            </Tooltip>

                            <Tooltip title="Mettre à jour les paramétrages par défaut">
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
                                <Button onClick={() => choixAffichageDetailCalcul('AMORT')} disabled={showBilan === 2} variant={buttonPassifVariant2} style={{ borderRadius: "0", textTransform: 'none', outline: 'none', width: 80 }}>Amort</Button>
                              </ButtonGroup>
                            </Stack>
                          </Stack>

                          <Stack width={"100%"} height={"75%"} spacing={2} alignItems={"start"} alignContent={"start"}
                            direction={"row"} style={{ marginLeft: "0px", marginTop: "5px" }}
                          >
                            <Stack width={"50%"} height={"100%"} spacing={3} alignItems={"flex-start"}
                              alignContent={"flex-start"} justifyContent={"stretch"} marginLeft={"0px"}
                              style={{ border: '2px solid rgba(5,96,116,0.60)' }} padding={"10px"}
                            >
                              <DatagirdBaseExterne
                                canView={canView}
                                canAdd={canAdd}
                                canDelete={canDelete}
                                canModify={canModify}
                                row_id={updateSelectedRowIdBILAN}
                                tableRow={bilanData}
                                setTableRow={setBilanData}
                                compteId={compteId}
                                fileId={fileId}
                                exerciceId={selectedExerciceId}
                                id_etat={etatIdBILAN}
                                setIsRefreshed={setIsRefreshed}
                                subtable={showBilan}
                              />
                            </Stack>

                            <Stack width={"50%"} height={"100%"} spacing={3} alignItems={"flex-start"}
                              alignContent={"flex-start"} justifyContent={"stretch"} marginLeft={"0px"}
                              style={{ border: '2px solid rgba(5,96,116,0.60)' }} padding={"10px"}
                            >
                              <DatagridDetailExterne
                                canView={canView}
                                canAdd={canAdd}
                                canDelete={canDelete}
                                canModify={canModify}
                                compteId={compteId}
                                fileId={fileId}
                                exerciceId={selectedPeriodeId}
                                id_etat={etatIdBILAN}
                                rubriqueId={bilanSelectedRubriqueId}
                                nature={showBrut}
                                rubriqueData={bilanRubriqueData}
                                typeRubrique={typeRubriqueBilan}
                                isCompteRubriqueRefreshed={isCompteRubriqueRefreshed}
                                setIsCompteRubriqueRefreshed={setIsCompteRubriqueRefreshed}
                              />
                            </Stack>
                          </Stack>
                        </Stack>
                      </TabPanel>

                      {/* CRN */}
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

                            <Tooltip title="Mettre à jour les paramétrages par défaut">
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
                            <Stack width={"50%"} height={"100%"} spacing={3} alignItems={"flex-start"}
                              alignContent={"flex-start"} justifyContent={"stretch"} marginLeft={"0px"}
                              style={{ border: '2px solid rgba(5,96,116,0.60)' }} padding={"10px"}
                            >
                              <DatagirdBaseExterne
                                canView={canView}
                                canAdd={canAdd}
                                canDelete={canDelete}
                                canModify={canModify}
                                row_id={updateSelectedRowIdCRN}
                                tableRow={crnData}
                                setTableRow={setCrnData}
                                compteId={compteId}
                                fileId={fileId}
                                exerciceId={selectedExerciceId}
                                id_etat={"CRN"}
                                setIsRefreshed={setIsRefreshed}
                                subtable={0}
                              />
                            </Stack>

                            <Stack width={"50%"} height={"100%"} spacing={3} alignItems={"flex-start"}
                              alignContent={"flex-start"} justifyContent={"stretch"} marginLeft={"0px"}
                              style={{ border: '2px solid rgba(5,96,116,0.60)' }} padding={"10px"}
                            >
                              <DatagridDetailExterne
                                canView={canView}
                                canAdd={canAdd}
                                canDelete={canDelete}
                                canModify={canModify}
                                compteId={compteId}
                                fileId={fileId}
                                exerciceId={selectedPeriodeId}
                                id_etat={"CRN"}
                                rubriqueId={crnSelectedRubriqueId}
                                nature={showBrut}
                                rubriqueData={crnRubriqueData}
                                typeRubrique={typeRubriqueCrn}
                                isCompteRubriqueRefreshed={isCompteRubriqueRefreshed}
                                setIsCompteRubriqueRefreshed={setIsCompteRubriqueRefreshed}
                              />
                            </Stack>
                          </Stack>

                        </Stack>
                      </TabPanel>

                      {/* CRF */}
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

                            <Tooltip title="Mettre à jour les paramétrages par défaut">
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
                            <Stack width={"50%"} height={"100%"} spacing={3} alignItems={"flex-start"}
                              alignContent={"flex-start"} justifyContent={"stretch"} marginLeft={"0px"}
                              style={{ border: '2px solid rgba(5,96,116,0.60)' }} padding={"10px"}
                            >
                              <DatagirdBaseExterne
                                canView={canView}
                                canAdd={canAdd}
                                canDelete={canDelete}
                                canModify={canModify}
                                row_id={updateSelectedRowIdCRF}
                                tableRow={crfData}
                                setTableRow={setCrfData}
                                compteId={compteId}
                                fileId={fileId}
                                exerciceId={selectedExerciceId}
                                id_etat={"CRF"}
                                setIsRefreshed={setIsRefreshed}
                                subtable={0}
                              />
                            </Stack>

                            <Stack width={"50%"} height={"100%"} spacing={3} alignItems={"flex-start"}
                              alignContent={"flex-start"} justifyContent={"stretch"} marginLeft={"0px"}
                              style={{ border: '2px solid rgba(5,96,116,0.60)' }} padding={"10px"}
                            >
                              <DatagridDetailExterne
                                canView={canView}
                                canAdd={canAdd}
                                canDelete={canDelete}
                                canModify={canModify}
                                compteId={compteId}
                                fileId={fileId}
                                exerciceId={selectedPeriodeId}
                                id_etat={"CRF"}
                                rubriqueId={crfSelectedRubriqueId}
                                nature={showBrut}
                                rubriqueData={crfRubriqueData}
                                typeRubrique={typeRubriqueCrf}
                                isCompteRubriqueRefreshed={isCompteRubriqueRefreshed}
                                setIsCompteRubriqueRefreshed={setIsCompteRubriqueRefreshed}
                              />
                            </Stack>
                          </Stack>
                        </Stack>
                      </TabPanel>

                      {/* TFTD */}
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

                            <Tooltip title="Mettre à jour les paramétrages par défaut">
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
                            <Stack width={"50%"} height={"100%"} spacing={3} alignItems={"flex-start"}
                              alignContent={"flex-start"} justifyContent={"stretch"} marginLeft={"0px"}
                              style={{ border: '2px solid rgba(5,96,116,0.60)' }} padding={"10px"}
                            >
                              <DatagirdBaseExterne
                                canView={canView}
                                canAdd={canAdd}
                                canDelete={canDelete}
                                canModify={canModify}
                                row_id={updateSelectedRowIdTFTD}
                                tableRow={tftdData}
                                setTableRow={setTftdData}
                                compteId={compteId}
                                fileId={fileId}
                                exerciceId={selectedExerciceId}
                                id_etat={"TFTD"}
                                setIsRefreshed={setIsRefreshed}
                                subtable={0}
                              />
                            </Stack>

                            <Stack width={"50%"} height={"100%"} spacing={3} alignItems={"flex-start"}
                              alignContent={"flex-start"} justifyContent={"stretch"} marginLeft={"0px"}
                              style={{ border: '2px solid rgba(5,96,116,0.60)' }} padding={"10px"}
                            >
                              <DatagridDetailExterne
                                canView={canView}
                                canAdd={canAdd}
                                canDelete={canDelete}
                                canModify={canModify}
                                compteId={compteId}
                                fileId={fileId}
                                exerciceId={selectedPeriodeId}
                                id_etat={"TFTD"}
                                rubriqueId={tftdSelectedRubriqueId}
                                nature={showBrut}
                                rubriqueData={tftdRubriqueData}
                                typeRubrique={typeRubriqueTftd}
                                isCompteRubriqueRefreshed={isCompteRubriqueRefreshed}
                                setIsCompteRubriqueRefreshed={setIsCompteRubriqueRefreshed}
                              />
                            </Stack>
                          </Stack>

                        </Stack>
                      </TabPanel>

                      {/* TFTI */}
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

                            <Tooltip title="Mettre à jour les paramétrages par défaut">
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
                            <Stack width={"50%"} height={"100%"} spacing={3} alignItems={"flex-start"}
                              alignContent={"flex-start"} justifyContent={"stretch"} marginLeft={"0px"}
                              style={{ border: '2px solid rgba(5,96,116,0.60)' }} padding={"10px"}
                            >
                              <DatagirdBaseExterne
                                canView={canView}
                                canAdd={canAdd}
                                canDelete={canDelete}
                                canModify={canModify}
                                row_id={updateSelectedRowIdTFTI}
                                tableRow={tftiData}
                                setTableRow={setTftiData}
                                compteId={compteId}
                                fileId={fileId}
                                exerciceId={selectedExerciceId}
                                id_etat={"TFTI"}
                                setIsRefreshed={setIsRefreshed}
                                subtable={0}
                              />
                            </Stack>

                            <Stack width={"50%"} height={"100%"} spacing={3} alignItems={"flex-start"}
                              alignContent={"flex-start"} justifyContent={"stretch"} marginLeft={"0px"}
                              style={{ border: '2px solid rgba(5,96,116,0.60)' }} padding={"10px"}
                            >
                              <DatagridDetailExterne
                                canView={canView}
                                canAdd={canAdd}
                                canDelete={canDelete}
                                canModify={canModify}
                                compteId={compteId}
                                fileId={fileId}
                                exerciceId={selectedPeriodeId}
                                id_etat={"TFTI"}
                                rubriqueId={tftiSelectedRubriqueId}
                                nature={showBrut}
                                rubriqueData={tftiRubriqueData}
                                typeRubrique={typeRubriqueTfti}
                                isCompteRubriqueRefreshed={isCompteRubriqueRefreshed}
                                setIsCompteRubriqueRefreshed={setIsCompteRubriqueRefreshed}
                              />
                            </Stack>
                          </Stack>
                        </Stack>
                      </TabPanel>

                      {/* SIG */}
                      <TabPanel value="6" style={{ height: '100%' }}>
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

                            <Tooltip title="Mettre à jour les paramétrages par défaut">
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
                            <Stack width={"50%"} height={"100%"} spacing={3} alignItems={"flex-start"}
                              alignContent={"flex-start"} justifyContent={"stretch"} marginLeft={"0px"}
                              style={{ border: '2px solid rgba(5,96,116,0.60)' }} padding={"10px"}
                            >
                              <DatagirdBaseExterne
                                canView={canView}
                                canAdd={canAdd}
                                canDelete={canDelete}
                                canModify={canModify}
                                row_id={updateSelectedRowIdSIG}
                                tableRow={sigData}
                                setTableRow={setSigData}
                                compteId={compteId}
                                fileId={fileId}
                                exerciceId={selectedExerciceId}
                                id_etat={"SIG"}
                                setIsRefreshed={setIsRefreshed} subtable={0}
                              />
                            </Stack>

                            <Stack width={"50%"} height={"100%"} spacing={3} alignItems={"flex-start"}
                              alignContent={"flex-start"} justifyContent={"stretch"} marginLeft={"0px"}
                              style={{ border: '2px solid rgba(5,96,116,0.60)' }} padding={"10px"}
                            >
                              <DatagridDetailExterne
                                canView={canView}
                                canAdd={canAdd}
                                canDelete={canDelete}
                                canModify={canModify}
                                compteId={compteId}
                                fileId={fileId}
                                exerciceId={selectedPeriodeId}
                                id_etat={"SIG"}
                                rubriqueId={sigSelectedRubriqueId}
                                nature={showBrut}
                                rubriqueData={sigRubriqueData}
                                typeRubrique={typeRubriqueSig}
                                isCompteRubriqueRefreshed={isCompteRubriqueRefreshed}
                                setIsCompteRubriqueRefreshed={setIsCompteRubriqueRefreshed}
                              />
                            </Stack>
                          </Stack>
                        </Stack>
                      </TabPanel>

                    </TabContext>
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