import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import toast from 'react-hot-toast';
import useAuth from '../../../hooks/useAuth';
import { jwtDecode } from 'jwt-decode';
import axios from '../../../../config/axios';
import MainDossier from '../../componentsTools/Dossier/MainDossier';
import { Stack } from '@mui/material';

export default function AddNewFile({ confirmationState, refresh }) {
    const [listModel, setListModel] = useState([]);
    const [listPays, setListPays] = useState([]);
    const [listProvinces, setListProvinces] = useState([]);
    const [listRegions, setListRegions] = useState([]);
    const [listDistricts, setListDistricts] = useState([]);
    const [listCommunes, setListCommunes] = useState([]);
    const [listeDossier, setListeDossier] = useState([]);
    const [listePortefeuille, setListePortefeuille] = useState([]);

    const [listAssocie, setListAssocie] = useState([]);
    const [listFiliales, setListFiliales] = useState([]);
    const [listDomBank, setListDomBank] = useState([]);
    const [listConsolidation, setListConsolidation] = useState([]);

    //récupération infos compte
    const { auth } = useAuth();
    const decoded = auth?.accessToken ? jwtDecode(auth.accessToken) : undefined;
    const compteId = decoded.UserInfo.compteId || null;
    const userId = decoded.UserInfo.userId || null;

    //Récupération de la liste des modèles de plan comptable
    const GetListePlanComptableModele = () => {
        axios.post(`/paramPlanComptableModele/model`, { compteId, userId }).then((response) => {
            const resData = response.data;
            setListModel(resData.modelList);
        });
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

    const getListeDossier = () => {
        axios.get(`/home/file/${compteId}`, { params: { userId: userId } }).then((response) => {
            const resData = response.data;
            setListeDossier(resData.fileList);
        })
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
        GetListePlanComptableModele();
        getListeDossier();
    }, [compteId]);

    useEffect(() => {
        getListePays();
        getListeProvinces();
    }, []);

    useEffect(() => {
        getAllPortefeuille();
    }, [compteId]);

    return (
        <Stack
            sx={{
                paddingX: 3,
                paddingY: 2,
                height: '100%'
            }}
        >
            <MainDossier
                confirmationState={confirmationState}
                refresh={refresh}
                listePortefeuille={listePortefeuille}
                listPays={listPays}
                listModel={listModel}
                compteId={Number(compteId)}
                type={'ajout'}
                listProvinces={listProvinces}
                listRegions={listRegions}
                listDistricts={listDistricts}
                listCommunes={listCommunes}
                listeDossier={listeDossier}
                getListeRegions={getListeRegions}
                getListeDistricts={getListeDistricts}
                getListeCommunes={getListeCommunes}

                listeAssocie={listAssocie}
                listeFiliale={listFiliales}
                listeDomBank={listDomBank}
                listeConsolidation={listConsolidation}

                setListeAssocie={setListAssocie}
                setListeFiliale={setListFiliales}
                setListeDomBank={setListDomBank}
                setListeConsolidation={setListConsolidation}

                row={[]}
            />
        </Stack>
    )
}