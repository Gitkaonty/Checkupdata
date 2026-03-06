import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Typography, Stack, Box, Tab } from '@mui/material';

import { TabContext, TabList, TabPanel } from '@mui/lab';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';

import axios from '../../../../../config/axios';
import PopupTestSelectedFile from '../../../componentsTools/popupTestSelectedFile';
import { InfoFileStyle } from '../../../componentsTools/InfosFileStyle';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import useAuth from '../../../../hooks/useAuth';
import { jwtDecode } from 'jwt-decode';

import DatagridAnnexeDeclaration from '../../../componentsTools/DeclarationISI/DatagridComponents/Datagrid/DatagridAnnexeDeclaration';
import DatagridDetailEcritureAssocie from '../../../componentsTools/DeclarationISI/DatagridComponents/Datagrid/DatagridDetailEcritureAssocie';
import DatagridDetailSelectionLigne from '../../../componentsTools/DeclarationISI/DatagridComponents/Datagrid/DatagridDetailSelectionLigne';

import PopupExportIsi from '../../../componentsTools/DeclarationISI/Popup/PopupExportIsi';
import usePermission from '../../../../hooks/usePermission';

const DATAGRID_HEIGHT = "500px"

export default function DeclarationIsi() {
    const { canAdd, canModify, canDelete, canView } = usePermission();

    const [fileInfos, setFileInfos] = useState('');
    const [fileId, setFileId] = useState(0);
    const { id } = useParams();
    const [noFile, setNoFile] = useState(false);
    let tabISI = "";
    let tabISIDetail = "";

    if (typeof window !== 'undefined') {
        tabISI = localStorage.getItem('tabISI');
        tabISIDetail = localStorage.getItem('tabISIDetail');
    }
    const [tabValue, setTabValue] = useState(tabISI || "1");
    const [tabValueDetail, setTabValueDetail] = useState(tabISIDetail || "1");

    // Liste
    const [listAnnexeDeclaration, setListAnnexeDeclaration] = useState([]);
    const [listDetailEcriture, setListDetailEcriture] = useState([]);
    const [listDetailSelection, setListDetailSelection] = useState([]);
    const [listePlanComptable, setListePlanComptable] = useState([]);
    const [listeExercice, setListeExercice] = useState([]);
    const [listeSituation, setListeSituation] = useState([]);
    const [listeAnnee, setListeAnnee] = useState([])

    const [deviseParDefaut, setDeviseParDefaut] = useState('MGA');

    const [historiqueIsi, setHistoriqueIsi] = useState([]);
    const [isHistoriqueRefreshed, setIsHistoriqueRefreshed] = useState(false);

    const [filteredList, setFilteredList] = useState(null);

    //récupération infos de connexion
    const navigate = useNavigate();

    // Actualisation automatique
    const [isAnnexeRefreshed, setIsAnnexeRefreshed] = useState(false);
    const [isListDetailEcritureRefreshed, setIsDetailEcritureRefreshed] = useState(false);
    const [isDetailSelectionRefreshed, setIsDetailSelectionRefreshed] = useState(false);

    // Popup d'exportation ISI
    const [showPopupExportIsi, setShowPopupExportIsi] = useState(false);

    const [selectedExerciceId, setSelectedExerciceId] = useState(0);
    const [selectedPeriodeId, setSelectedPeriodeId] = useState(0);
    const [selectedPeriodeChoiceId, setSelectedPeriodeChoiceId] = useState(0);

    const [compteisi, setCompteIsi] = useState(0);

    const [valSelectMois, setValSelectMois] = useState(1);
    const [valSelectAnnee, setValSelectAnnee] = useState('');

    //Valeur du listbox choix compte
    const [valSelectedCompte, setValSelectedCompte] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem("valSelectedCompteISI") || "tout";
        }
        return "tout";
    })

    //récupération des informations de connexion
    const { auth } = useAuth();
    const decoded = auth?.accessToken ? jwtDecode(auth.accessToken) : undefined;
    const compteId = decoded.UserInfo.compteId || null;

    const GetInfosIdDossier = (id) => {
        axios.get(`/home/FileInfos/${id}`).then((response) => {
            const resData = response.data;
            if (resData.state) {
                setFileInfos(resData.fileInfos[0]);
                setCompteIsi(resData?.fileInfos[0]?.compteisi);
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

    //Choix exercice
    const handleChangeExercice = (exercice_id) => {
        setSelectedExerciceId(exercice_id);
        setSelectedPeriodeChoiceId("0");
        setListeSituation(listeExercice?.filter((item) => item.id === exercice_id));
        setSelectedPeriodeId(exercice_id);
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

    //Récupération du plan comptable
    const getPc = () => {
        axios.get(`/paramPlanComptable/recupPcCompteIsi/${compteId}/${fileId}`, {
            params: {
                compteisi: compteisi
            }
        })
            .then((response) => {
                const resData = response.data;
                if (resData.state) {
                    setListePlanComptable(resData.liste);
                } else {
                    toast.error(resData.msg);
                }
            })
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

    // Changer de tab
    const handleChangeTAB = (event, newValue) => {
        setTabValue(newValue);
        localStorage.setItem('tabISI', newValue);
    };

    // Changer de tab detail
    const handleChangeTABDetail = (event, newValue) => {
        setTabValueDetail(newValue);
        localStorage.setItem('tabISIDetail', newValue);
    };

    // CHanger de mois
    const handleChangeMois = (event) => {
        setValSelectMois(event.target.value);
    };

    // Algorithme pour recupérer les années entre deux dates
    const getAnneesEntreDeuxDates = (dateDebut, dateFin) => {
        const debut = new Date(dateDebut).getFullYear();
        const fin = new Date(dateFin).getFullYear();
        const annees = [];

        for (let annee = debut; annee <= fin; annee++) {
            annees.push(annee);
        }
        return annees;
    };

    // Récupération de date d'exercice
    const GetDateDebutFinExercice = (id) => {
        axios.get(`/paramExercice/listeExerciceById/${id}`).then((response) => {
            const resData = response.data;
            if (resData.state) {
                const annee = getAnneesEntreDeuxDates(resData.list.date_debut, resData.list.date_fin);
                setListeAnnee(annee);
            }
        }).catch((error) => {
            toast.error(error)
        })
    }

    // Récupération de isi dans annexe declaration 
    const getAnnexeDeclaration = () => {
        axios.get(`/declaration/isi/getAnnexeDeclaration/${compteId}/${fileId}/${selectedExerciceId}`, {
            params: {
                mois: valSelectMois,
                annee: valSelectAnnee
            }
        }).then((response) => {
            const resData = response.data;
            if (resData.state) {
                setListAnnexeDeclaration(resData?.list);
            } else {
                toast.error(resData.message)
            }
        }).catch((error) => {
            toast.error(error.response?.data?.message || error.message);
        })
    }

    //Liste Details/Ecriture associées
    const getDetailEcritureAssocie = () => {
        axios.get(`/declaration/isi/getDetailEcritureAssocie/${compteId}/${fileId}/${selectedExerciceId}`, {
            params: {
                mois: Number(valSelectMois),
                annee: Number(valSelectAnnee),
                compteisi: compteisi
            }
        })
            .then((response) => {
                const resData = response.data;
                setListDetailEcriture(resData?.list);
            })
    }

    //Liste Details/Sélection ligne
    const getDetailSelectionLigne = () => {
        axios.get(`/declaration/isi/getDetailSelectionLigne/${compteId}/${fileId}/${selectedExerciceId}`, {
            params: {
                mois: Number(valSelectMois),
                annee: Number(valSelectAnnee)
            }
        })
            .then((response) => {
                const resData = response.data;
                setListDetailSelection(resData?.list);
            })
    }

    // Ouverture de popup d'exportation isi
    const handleOpenPopupExportIsi = () => {
        setShowPopupExportIsi(true);
    }

    // Fermerture de popup d'exportation isi
    const handleClosePopupExportIsi = () => {
        setShowPopupExportIsi(false);
    }

    // Fonction de recherche de compte sur detail/ Selection ligne
    const handleSearch = () => {
        if (!valSelectedCompte || valSelectedCompte === 'tout') {
            setFilteredList([]);
            return;
        }

        const compteSelect = listePlanComptable.find(item => item.id === Number(valSelectedCompte));
        if (!compteSelect) {
            setFilteredList([]);
            return;
        }

        const filtered = listDetailSelection.filter(item =>
            item.compte?.toString().includes(compteSelect.compte.toString())
        );

        setFilteredList(filtered);
    };

    // Fonction pour recupérer les historiques d'éxportation XML sur ISI
    const getHistoriqueIsi = () => {
        axios.get(`/declaration/isi/getHistoriqueIsi/${compteId}/${fileId}`)
            .then((response) => {
                if (response?.data?.state) {
                    setHistoriqueIsi(response?.data?.list);
                } else {
                    toast.error(response?.data?.message);
                }
            })
            .catch((err) => {
                if (err.response && err.response.data && err.response.data.message) {
                    toast.error(err.response.data.message);
                } else {
                    toast.error(err.message || "Erreur inconnue");
                }
            })
    }

    const handleRefresheHistorique = () => {
        setIsHistoriqueRefreshed(prev => !prev);
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

    // Sélection de l'année automatique
    useEffect(() => {
        if (listeAnnee.length > 0) {
            setValSelectAnnee(listeAnnee[0]);
        }
    }, [listeAnnee, selectedExerciceId]);

    // Récupération de l'année de début et fin de l'éxercice
    useEffect(() => {
        GetDateDebutFinExercice(selectedExerciceId);
    }, [selectedExerciceId])

    // Récupération des listes isi générés automatique
    useEffect(() => {
        if (valSelectAnnee && canView) {
            getAnnexeDeclaration();
        }
    }, [compteId, selectedExerciceId, fileId, valSelectAnnee, valSelectMois, isAnnexeRefreshed])

    // Liste Detail/Sélection ligne
    useEffect(() => {
        if (canView) {
            getDetailSelectionLigne();
        }
    }, [compteId, fileId, selectedExerciceId, valSelectMois, valSelectAnnee, isDetailSelectionRefreshed])

    // Liste Détail/ Ecriture associées
    useEffect(() => {
        if (canView) {
            getDetailEcritureAssocie();
        }
    }, [compteId, fileId, selectedExerciceId, valSelectMois, valSelectAnnee, isListDetailEcritureRefreshed])

    // Liste plan comptable
    useEffect(() => {
        if (canView) {
            getPc();
            getListeDevises();
        }
    }, [fileId, compteId, valSelectMois, valSelectAnnee, isDetailSelectionRefreshed])

    useEffect(() => {
        if (canView) {
            handleSearch();
        }
    }, [valSelectedCompte, listDetailSelection]);

    useEffect(() => {
        if (valSelectedCompte) {
            localStorage.setItem("valSelectedCompteISI", valSelectedCompte);
        }
    }, [valSelectedCompte]);

    useEffect(() => {
        if (canView) {
            getHistoriqueIsi();
        }
    }, [compteId, fileId, isHistoriqueRefreshed])

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
                showPopupExportIsi && canView ?
                    <PopupExportIsi
                        open={showPopupExportIsi}
                        onClose={handleClosePopupExportIsi}
                        compteId={compteId}
                        fileId={fileId}
                        selectedExerciceId={selectedExerciceId}
                        valSelectMois={valSelectMois}
                        valSelectAnnee={valSelectAnnee}
                        setHistoriqueIsi={setHistoriqueIsi}
                        historiqueIsi={historiqueIsi}
                        handleRefresheHistorique={handleRefresheHistorique}
                        canDelete={canDelete}
                    />
                    :
                    null
            }
            <Box>
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
                    <TabPanel value="1" style={{ height: '100%' }}>
                        <Stack width={"100%"} height={"100%"} spacing={1} alignItems={"flex-start"} alignContent={"flex-start"} justifyContent={"stretch"}>
                            <Typography variant='h6' sx={{ color: "black" }} align='left'>{"Déclaration - ISI"}</Typography>
                            <Stack width={"100%"} spacing={4} alignItems={"left"} alignContent={"center"} direction={"column"} style={{ marginLeft: "0px", marginTop: "20px" }}>
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

                            <Stack width={"100%"} spacing={4} direction={"row"} alignItems={"left"} justifyContent={'space-between'} alignContent={"center"} style={{ marginLeft: "0px" }}>
                                <Stack
                                    direction={"row"}
                                >
                                    <FormControl variant="standard" sx={{ minWidth: 130, m: 1 }}>
                                        <InputLabel>Mois</InputLabel>
                                        <Select
                                            value={valSelectMois}
                                            onChange={handleChangeMois}
                                            MenuProps={{
                                                disableScrollLock: true
                                            }}
                                        >
                                            <MenuItem value={1}>Janvier</MenuItem>
                                            <MenuItem value={2}>Février</MenuItem>
                                            <MenuItem value={3}>Mars</MenuItem>
                                            <MenuItem value={4}>Avril</MenuItem>
                                            <MenuItem value={5}>Mai</MenuItem>
                                            <MenuItem value={6}>Juin</MenuItem>
                                            <MenuItem value={7}>Juillet</MenuItem>
                                            <MenuItem value={8}>Août</MenuItem>
                                            <MenuItem value={9}>Septembre</MenuItem>
                                            <MenuItem value={10}>Octobre</MenuItem>
                                            <MenuItem value={11}>Novembre</MenuItem>
                                            <MenuItem value={12}>Décembre</MenuItem>
                                        </Select>
                                    </FormControl>

                                    <FormControl variant="standard" sx={{ minWidth: 130, m: 1 }} >
                                        <InputLabel>Année</InputLabel>
                                        <Select
                                            value={valSelectAnnee}
                                            onChange={(e) => setValSelectAnnee(e.target.value)}
                                            name="valSelectAnnee"
                                            MenuProps={{
                                                disableScrollLock: true
                                            }}
                                        >
                                            {listeAnnee.map((year, index) => (
                                                <MenuItem key={index} value={year}>
                                                    {year}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Stack>
                            </Stack>

                            <Box sx={{ width: '100%', typography: 'body1' }}>
                                <TabContext value={tabValue}>
                                    <Box sx={{
                                        borderBottom: 1,
                                        borderColor: 'transparent',
                                    }}>
                                        <TabList onChange={handleChangeTAB} aria-label="lab API tabs example" variant='scrollable'>
                                            <Tab disabled={!listeExercice || listeExercice.length === 0 || !selectedExerciceId || selectedExerciceId === 0} style={{ textTransform: 'none', outline: 'none', border: 'none', }} label="Annexe déclarations" value="1" />
                                            <Tab disabled={!listeExercice || listeExercice.length === 0 || !selectedExerciceId || selectedExerciceId === 0} style={{ textTransform: 'none', outline: 'none', border: 'none', }} label="Détails" value="2" />
                                        </TabList>
                                    </Box>

                                    <TabPanel value="1">
                                        <DatagridAnnexeDeclaration
                                            DATAGRID_HEIGHT={DATAGRID_HEIGHT}
                                            listAnnexeDeclaration={listAnnexeDeclaration}
                                            setIsAnnexeRefreshed={() => setIsAnnexeRefreshed(!isAnnexeRefreshed)}
                                            selectedExerciceId={selectedExerciceId}
                                            compteId={compteId}
                                            fileId={fileId}
                                            valSelectMois={valSelectMois}
                                            valSelectAnnee={valSelectAnnee}
                                            compteisi={compteisi}
                                            handleOpenPopupExportIsi={handleOpenPopupExportIsi}
                                            canView={canView}
                                            canAdd={canAdd}
                                            canDelete={canDelete}
                                            canModify={canModify}
                                            deviseParDefaut={deviseParDefaut}
                                        />
                                    </TabPanel>

                                    <TabPanel value="2">
                                        <TabContext value={tabValueDetail}>
                                            <Box sx={{
                                                borderBottom: 1,
                                                borderColor: 'transparent'
                                            }}>
                                                <TabList onChange={handleChangeTABDetail} aria-label="lab API tabs example" variant='scrollable'>
                                                    <Tab style={{ textTransform: 'none', outline: 'none', border: 'none', }} label="Sélection de ligne" value="1" />
                                                    <Tab style={{ textTransform: 'none', outline: 'none', border: 'none', }} label="Ecritures associées" value="2" />
                                                </TabList>
                                            </Box>
                                            <TabPanel value="1">
                                                <DatagridDetailSelectionLigne
                                                    DATAGRID_HEIGHT={DATAGRID_HEIGHT}
                                                    selectedExerciceId={selectedExerciceId}
                                                    compteId={compteId}
                                                    fileId={fileId}
                                                    valSelectMois={valSelectMois}
                                                    valSelectAnnee={valSelectAnnee}
                                                    compteisi={compteisi}
                                                    valSelectedCompte={valSelectedCompte}
                                                    setValSelectedCompte={setValSelectedCompte}
                                                    setIsDetailSelectionRefreshed={setIsDetailSelectionRefreshed}
                                                    setIsDetailEcritureRefreshed={setIsDetailEcritureRefreshed}
                                                    listDetailSelection={listDetailSelection}
                                                    listePlanComptable={listePlanComptable}
                                                    filteredList={filteredList}
                                                    canView={canView}
                                                    canAdd={canAdd}
                                                    canDelete={canDelete}
                                                    canModify={canModify}
                                                />
                                            </TabPanel>
                                            <TabPanel value="2">
                                                <DatagridDetailEcritureAssocie
                                                    valSelectMois={valSelectMois}
                                                    valSelectAnnee={valSelectAnnee}
                                                    DATAGRID_HEIGHT={DATAGRID_HEIGHT}
                                                    selectedExerciceId={selectedExerciceId}
                                                    compteId={compteId}
                                                    fileId={fileId}
                                                    compteisi={compteisi}
                                                    listDetailEcriture={listDetailEcriture}
                                                    setIsDetailEcritureRefreshed={setIsDetailEcritureRefreshed}
                                                    setIsDetailSelectionRefreshed={setIsDetailSelectionRefreshed}
                                                    setIsAnnexeRefreshed={setIsAnnexeRefreshed}
                                                    canView={canView}
                                                    canAdd={canAdd}
                                                    canDelete={canDelete}
                                                    canModify={canModify}
                                                />
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