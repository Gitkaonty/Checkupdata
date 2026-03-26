import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Stack } from '@mui/material';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import { InfoFileStyle } from '../../../componentsTools/InfosFileStyle';
import useAuth from '../../../../hooks/useAuth';
import { jwtDecode } from 'jwt-decode';
import axios from '../../../../../config/axios';
import PopupTestSelectedFile from '../../../componentsTools/popupTestSelectedFile';
import toast from 'react-hot-toast';
import MainDossier from '../../../componentsTools/Dossier/MainDossier';

export default function ParamCRM() {
    const navigate = useNavigate();
    //récupération information du dossier sélectionné
    const { id } = useParams();
    const [fileId, setFileId] = useState(0);
    const [fileInfos, setFileInfos] = useState('');
    const [noFile, setNoFile] = useState(false);

    const [listModel, setListModel] = useState([]);
    const [listAssocie, setListAssocie] = useState([]);
    const [listFiliales, setListFiliales] = useState([]);
    const [listDomBank, setListDomBank] = useState([]);
    const [listConsolidation, setListConsolidation] = useState([]);

    const [listPays, setListPays] = useState([]);
    const [listProvinces, setListProvinces] = useState([]);
    const [listRegions, setListRegions] = useState([]);
    const [listDistricts, setListDistricts] = useState([]);
    const [listCommunes, setListCommunes] = useState([]);
    const [listeDossier, setListeDossier] = useState([]);
    const [listePortefeuille, setListePortefeuille] = useState([]);
    const [listeDevise, setListeDevises] = useState([]);
    const [rows, setRows] = useState({});

    //récupération des informations de connexion
    const { auth } = useAuth();
    const decoded = auth?.accessToken ? jwtDecode(auth.accessToken) : undefined;
    const compteId = decoded.UserInfo.compteId || null;
    const userId = decoded.UserInfo.userId || null;

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

    const getInfosAssocie = (id) => {
        axios.get(`/paramCrm/listeAssocie/${id}`).then((response) => {
            const resData = response.data;
            if (resData.state) {
                setListAssocie(resData.liste);
            } else {
                setListAssocie([]);
            }
        });
    }

    const getInfosFiliale = (id) => {
        axios.get(`/paramCrm/listeFiliale/${id}`).then((response) => {
            const resData = response.data;

            if (resData.state) {
                setListFiliales(resData.liste);
            } else {
                setListFiliales([]);
            }
        });
    }

    const getInfosDomBank = (id) => {
        axios.get(`/paramCrm/listeDomBank/${id}`).then((response) => {
            const resData = response.data;

            if (resData.state) {
                setListDomBank(resData.liste);
            } else {
                setListDomBank([]);
            }
        });
    }

    //récupérer la liste des pays 
    const getListePays = async () => {
        await axios.get(`/paramCrm/getListePays/`).then((response) => {
            const resData = response.data;

            if (resData.state) {
                setListPays(resData.list);
            } else {
                setListPays([]);
            }
        });
    }

    // Récupération de la liste des devises
    const getDevises = async () => {
        await axios.get(`/devises/devise/compte/${compteId}/${id}`).then((reponse => {
            const resData = reponse.data;
            setListeDevises(resData);
        }))
    }

    const sendToHome = (value) => {
        setNoFile(!value);
        navigate('/tab/home');
    }

    //Récupération de la liste des modèles de plan comptable
    const GetListePlanComptableModele = () => {
        axios.post(`/paramPlanComptableModele/model`, { compteId, userId }).then((response) => {
            const resData = response.data;
            setListModel(resData.modelList);
        });
    }

    const getListeDossier = () => {
        axios.get(`/home/file/${compteId}`, { params: { userId: userId } }).then((response) => {
            const resData = response.data;
            setListeDossier(resData.fileList);
        })
    }

    const getListeConsolidationDossier = () => {
        axios.get(`/param/consolidation/getListeConsolidationDossier/${compteId}/${id}`).then((response) => {
            const resData = response.data;
            setListConsolidation(resData.list);
        })
    }

    //Récupération des données géographiques depuis l'API existante
    const getListeProvinces = () => {
        axios.get('/paramPlanComptable/getProvinces').then((response) => {
            const provinces = response.data.map(name => ({ id: name, name: name }));
            setListProvinces(provinces);
        }).catch((error) => {
            console.error('Erreur lors du chargement des provinces:', error);
        });
    }

    const getListeRegions = (province) => {
        if (!province) {
            setListRegions([]);
            return;
        }
        axios.get(`/paramPlanComptable/getRegions/${province}`).then((response) => {
            const regions = response.data.map(name => ({ id: name, name: name }));
            setListRegions(regions);
            return regions;
        }).catch((error) => {
            console.error('Erreur lors du chargement des régions:', error);
        });
    }

    const getListeDistricts = (province, region) => {
        if (!province || !region) {
            setListDistricts([]);
            return;
        }
        axios.get(`/paramPlanComptable/getDistricts/${province}/${region}`).then((response) => {
            const districts = response.data.map(name => ({ id: name, name: name }));
            setListDistricts(districts);
            return districts;
        }).catch((error) => {
            console.error('Erreur lors du chargement des districts:', error);
        });
    }

    const getListeCommunes = (province, region, district) => {
        if (!province || !region || !district) {
            setListCommunes([]);
            return;
        }
        axios.get(`/paramPlanComptable/getCommunes/${province}/${region}/${district}`).then((response) => {
            const communes = response.data.map(name => ({ id: name, name: name }));
            setListCommunes(communes);
            return communes;
        }).catch((error) => {
            console.error('Erreur lors du chargement des communes:', error);
        });
    }

    // Charger la liste des portefeuille
    const getAllPortefeuille = () => {
        axios.get(`/param/portefeuille/getAllPortefeuille/${compteId}`)
            .then(response => {
                const resData = response?.data;
                if (resData?.state) {
                    setListePortefeuille(resData?.list)
                } else {
                    toast.error(resData?.message);
                }
            })
    };

    useEffect(() => {
        getAllPortefeuille();
        getDevises();
        getListeDossier();
        getListeConsolidationDossier();
    }, [compteId, id]);

    useEffect(() => {
        if (!listePortefeuille || listePortefeuille.length === 0) return;
        const id = fileId;
        axios.get(`/paramCrm/infoscrm/${id}/${Number(compteId)}`).then((response) => {
            const resData = response.data;
            if (resData.state) {
                const crmData = resData.list;
                const associesData = resData.associes;
                const filialesData = resData.filiales;
                const domBancairesData = resData.domBancaires;

                const mappedPortefeuille = crmData.id_portefeuille.map(id => {
                    return listePortefeuille.find(p => p.id === Number(id));
                }).filter(Boolean);

                const deviseParDefaut = listeDevise.find(val => val.par_defaut === true);

                setRows({
                    ...crmData,
                    itemId: crmData.id,
                    idCompte: Number(compteId),
                    nomdossier: crmData.dossier,
                    forme: crmData.formejuridique,
                    plancomptable: crmData.id_plancomptable,
                    longueurcptstd: crmData.longcomptestd,
                    longueurcptaux: crmData.longcompteaux,
                    immo_amort_base_jours: String(crmData.immo_amort_base_jours ?? 365),
                    montantcapital: crmData.capital,
                    avecMotDePasse: crmData.avecmotdepasse,
                    motDePasse: crmData.motdepasse,
                    motDePasseConfirmation: crmData.motdepasse,
                    listeAssocies: associesData ?? [],
                    listeFiliales: filialesData ?? [],
                    listeDomBank: domBancairesData ?? [],

                    portefeuille: mappedPortefeuille,
                    devisepardefaut: deviseParDefaut?.id || 0,
                });
            }
        })

    }, [id, listePortefeuille]);

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
        getInfosAssocie(idFile);
        getInfosFiliale(idFile);
        getInfosDomBank(idFile);
    }, []);

    useEffect(() => {
        getListePays();
        getListeProvinces();
    }, [])

    useEffect(() => {
        GetListePlanComptableModele();
    }, [compteId]);

    return (
        <Box>
            {noFile ? <PopupTestSelectedFile confirmationState={sendToHome} /> : null}

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

            </TabContext>

            <Stack
                sx={{ mb: 4.5, mt: 2 }}
            >
                <MainDossier
                    confirmationState={null}
                    refresh={null}
                    listePortefeuille={listePortefeuille}
                    listPays={listPays}
                    listeDevise={listeDevise}
                    listModel={listModel}
                    compteId={Number(compteId)}
                    type={'modification'}
                    listProvinces={listProvinces}
                    listRegions={listRegions}
                    listDistricts={listDistricts}
                    listCommunes={listCommunes}
                    listeDossier={listeDossier}
                    getListeRegions={getListeRegions}
                    getListeDistricts={getListeDistricts}
                    getListeCommunes={getListeCommunes}
                    row={rows}

                    listeAssocie={listAssocie}
                    listeFiliale={listFiliales}
                    listeDomBank={listDomBank}
                    listeConsolidation={listConsolidation}

                    setListRegions={setListRegions}
                    setListDistricts={setListDistricts}
                    setListCommunes={setListCommunes}

                    setListeAssocie={setListAssocie}
                    setListeFiliale={setListFiliales}
                    setListeDomBank={setListDomBank}
                    setListeConsolidation={setListConsolidation}
                />
            </Stack>
        </Box>
    )
}