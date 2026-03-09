import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Typography, Stack, Button, Box } from '@mui/material';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import TableRevisionDPOverviewModel from '../model/TableRevisionDPOverviewModel';
import Tab from '@mui/material/Tab';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import axios from '../../config/axios';
import { InfoFileStyle } from './componentsTools/InfosFileStyle';
import PopupTestSelectedFile from './componentsTools/popupTestSelectedFile';
import toast, { Toaster } from 'react-hot-toast';
import { format } from 'date-fns';
import useAuth from '../hooks/useAuth';
import { jwtDecode } from 'jwt-decode';

import usePermission from '../hooks/usePermission';

const headCells = [
    {
        id: 'anomalie',
        numeric: false,
        disablePadding: false,
        label: 'Anomalie',
        width: '400px'
    },
    {
        id: 'liasse',
        numeric: false,
        disablePadding: false,
        label: 'Liasse',
        width: '50px'
    },
    {
        id: 'commentaire',
        numeric: false,
        disablePadding: false,
        label: 'Commentaire',
        width: '200px'
    },
    {
        id: 'valide',
        numeric: false,
        disablePadding: false,
        label: 'Validé',
        width: '60px'
    }
];

function createData(id, anomalie, liasse, commentaire, valide) {
    return { id, anomalie, liasse, commentaire, valide };
}

const ebilanTabList = [
    { value: '4', label: 'BILAN' },
    { value: '5', label: 'CRN' },
    { value: '6', label: 'CRF' },
    { value: '7', label: 'TFTD' },
    { value: '8', label: 'TFTI' },
    { value: '9', label: 'EVCP' },
    { value: '10', label: 'DRF' },
    { value: '11', label: 'BHIAPC' },
    { value: '12', label: 'MP' },
    { value: '13', label: 'DA' },
    { value: '14', label: 'DP' },
    { value: '15', label: 'EIAFNC' },
    { value: '16', label: 'SAD' },
    { value: '17', label: 'SDR' },
    { value: '18', label: 'SE' },
    // 19 = note (exclu)
];

const buildOverviewRows = () => {
    return ebilanTabList.map(t => ({
        tableau: t.label,
        status: 'Non validée',
        nbrAnomalies: 0,
        anomaliesValidee: false,
        tabValue: t.value,
    }));
};

export default function RevisionAnomalieEbilanComponent() {
    const { canAdd, canModify, canDelete, canView } = usePermission();

    // Alignement sur les pages existantes: dossier depuis route ou sessionStorage
    const { id } = useParams();
    const navigate = useNavigate();
    const { auth } = useAuth();
    const decoded = auth?.accessToken ? jwtDecode(auth.accessToken) : undefined;
    const compteId = decoded?.UserInfo?.compteId || null;
    const [fileId, setFileId] = useState(0);
    const [fileInfos, setFileInfos] = useState('');
    const [noFile, setNoFile] = useState(false);
    const [listeExercice, setListeExercice] = useState([]);
    const [selectedPeriodeId, setSelectedPeriodeId] = useState(0);

    const [listeSituation, setListeSituation] = useState([]);
    const [selectedPeriodeChoiceId, setSelectedPeriodeChoiceId] = useState(0);
    const [selectedExerciceId, setSelectedExerciceId] = useState(0);

    const [listeAnnee, setListeAnnee] = useState([])
    const [overviewRows, setOverviewRows] = useState(canView ? buildOverviewRows() : []);

    // Helper: années entre 2 dates (sécurisé)
    const getAnneesEntreDeuxDates = (dateDebut, dateFin) => {
        try {
            const start = new Date(dateDebut);
            const end = new Date(dateFin);
            if (isNaN(start) || isNaN(end)) return [];
            const years = [];
            for (let y = start.getFullYear(); y <= end.getFullYear(); y++) years.push(y);
            return years;
        } catch {
            return [];
        }
    };

    const handleToggleStatus = async ({ row, index, valide }) => {
        try {
            const exId = Number(selectedExerciceId);
            const dossierId = Number(fileId);
            const cId = Number(compteId);
            if (!row?.tableau || !cId || !dossierId || !exId) return;
            await axios.put('/declaration/ebilan/etat/valide', {
                id_compte: cId,
                id_dossier: dossierId,
                id_exercice: exId,
                code: row.tableau,
                valide: !!valide,
            });
            // Rafraîchir l'overview depuis le backend pour refléter etats.valide
            const res = await axios.get(`/declaration/ebilan/overview/${cId}/${dossierId}/${exId}`);
            const list = Array.isArray(res.data?.list) ? res.data.list : [];
            const mapByLabel = new Map(list.map(x => [String(x.tableau).toUpperCase(), x]));
            const merged = ebilanTabList.map(t => {
                const found = mapByLabel.get(String(t.label).toUpperCase());
                return {
                    tableau: t.label,
                    status: found?.status || 'Non validée',
                    nbrAnomalies: Number(found?.nbrAnomalies || 0),
                    anomaliesValidee: !!found?.anomaliesValidee,
                    tabValue: t.value,
                    nom: found?.nom || found?.etat || found?.etatName,
                    details: overviewRows[index]?.details || [],
                };
            });
            setOverviewRows(merged);
            toast.success('Statut mis à jour');
        } catch (e) {
            toast.error('Echec mise à jour du statut');
        }
    };


    const handleChangeDateIntervalle = (value) => {
        setSelectedPeriodeId(value);
        // Mettre à jour selectedExerciceId si nécessaire
        const selectedSituation = listeSituation?.find(item => item.id === value);
        if (selectedSituation) {
            setSelectedExerciceId(selectedSituation.id);
            GetDateDebutFinExercice(selectedSituation.id);
        }
    };
    const handleChangeExercice = (exercice_id) => {
        setSelectedExerciceId(exercice_id);
        setSelectedPeriodeChoiceId("0");
        setListeSituation(listeExercice?.filter((item) => item.id === exercice_id));
        setSelectedPeriodeId(exercice_id);
        // Charger les années pour l'exercice sélectionné
        GetDateDebutFinExercice(exercice_id);
    }

    useEffect(() => {
        const idFromRoute = id || null;
        const idFromSession = sessionStorage.getItem('fileId');
        const idFile = idFromRoute || idFromSession || 0;
        if (idFromRoute) sessionStorage.setItem('fileId', idFromRoute);
        setFileId(idFile);
        if (idFile) {
            GetInfosIdDossier(idFile);
            GetListeExercice(idFile);
        }
    }, [id]);

    // Charger l'overview (statuts/nombre anomalies) en fonction des ids
    useEffect(() => {
        if (canView) {
            const exId = Number(selectedExerciceId);
            const dossierId = Number(fileId);
            const cId = Number(compteId);
            if (!dossierId || !exId || !cId) { setOverviewRows(buildOverviewRows()); return; }

            const fetchOverview = async () => {
                try {
                    const res = await axios.get(`/declaration/ebilan/overview/${cId}/${dossierId}/${exId}`);
                    const list = Array.isArray(res.data?.list) ? res.data.list : [];
                    // Fusionner avec la liste statique pour garder l'ordre et les libellés
                    const mapByLabel = new Map(list.map(x => [String(x.tableau).toUpperCase(), x]));
                    const merged = ebilanTabList.map(t => {
                        const found = mapByLabel.get(String(t.label).toUpperCase());
                        return {
                            tableau: t.label,
                            status: found?.status || 'Non validée',
                            nbrAnomalies: Number(found?.nbrAnomalies || 0),
                            anomaliesValidee: !!found?.anomaliesValidee,
                            tabValue: t.value,
                            nom: found?.nom || found?.etat || found?.etatName,
                            details: [],
                        };
                    });
                    setOverviewRows(merged);
                } catch (e) {
                    // Fallback silencieux
                    setOverviewRows(buildOverviewRows());
                }
            };
            fetchOverview();
        }
    }, [compteId, fileId, selectedExerciceId]);

    const handleExpandRow = async (row, index) => {
        try {
            const exId = Number(selectedExerciceId);
            const dossierId = Number(fileId);
            const cId = Number(compteId);
            if (!row?.tableau || !cId || !dossierId || !exId) return;
            const res = await axios.get(`/declaration/ebilan/controles/${cId}/${dossierId}/${exId}/${row.tableau}`);
            const list = Array.isArray(res.data?.list) ? res.data.list : [];
            const count = Number(res.data?.count || 0);
            setOverviewRows(prev => {
                const copy = [...prev];
                const current = { ...(copy[index] || {}) };
                current.details = list; // keep full objects: {id, control_id, anomalie, comments, valide}
                current.nbrAnomalies = count;
                copy[index] = current;
                return copy;
            });
        } catch (e) {
            // ignore
        }
    };

    const handleSaveComment = async ({ tableau, rowIndex, detailIndex, id, comments, valide }) => {
        try {
            const exId = Number(selectedExerciceId);
            const dossierId = Number(fileId);
            const cId = Number(compteId);
            if (!id || !cId || !dossierId || !exId) return;
            await axios.put(`/declaration/ebilan/savemodifAnom/${id}`, {
                id_compte: cId,
                id_dossier: dossierId,
                id_exercice: exId,
                valide: !!valide,
                comments: comments || '',
                etat_id: tableau
            });
            // Update local state to reflect saved values
            setOverviewRows(prev => {
                const copy = [...prev];
                const r = { ...(copy[rowIndex] || {}) };
                const dets = Array.isArray(r.details) ? [...r.details] : [];
                const item = { ...(dets[detailIndex] || {}) };
                item.comments = comments || '';
                item.valide = !!valide;
                dets[detailIndex] = item;
                r.details = dets;
                copy[rowIndex] = r;
                return copy;
            });
        } catch (e) {
            // optionally toast error
        }
    };

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
        }).catch(() => setNoFile(true));
    };

    const GetListeExercice = (id) => {
        axios.get(`/paramExercice/listeExercice/${id}/${Number(compteId)}`).then((response) => {
            const resData = response.data;
            if (resData.state) {

                setListeExercice(resData.list);

                const exerciceNId = resData.list?.filter((item) => item.libelle_rang === "N");
                setListeSituation(exerciceNId);

                // Vérifier que exerciceNId contient au moins un élément
                if (exerciceNId && exerciceNId.length > 0) {
                    setSelectedExerciceId(exerciceNId[0].id);
                    setSelectedPeriodeChoiceId(0);
                    setSelectedPeriodeId(exerciceNId[0].id);
                    // Charger les années pour l'exercice initial
                    GetDateDebutFinExercice(exerciceNId[0].id);
                } else {
                    // Si aucun exercice "N" trouvé, prendre le premier exercice disponible
                    if (resData.list && resData.list.length > 0) {
                        setSelectedExerciceId(resData.list[0].id);
                        setSelectedPeriodeChoiceId(0);
                        setSelectedPeriodeId(resData.list[0].id);
                        setListeSituation([resData.list[0]]);
                        // Charger les années pour l'exercice initial
                        GetDateDebutFinExercice(resData.list[0].id);
                    }
                }

            } else {
                setListeExercice([]);
                //toast.error("une erreur est survenue lors de la récupération de la liste des exercices");
                return
            }
        }).catch((error) => {
            console.error('[ERROR] Erreur lors de la récupération des exercices:', error);
            setListeExercice([]);
            toast.error("Erreur de connexion lors de la récupération des exercices. Vérifiez votre connexion réseau.");
        })
    }
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
    const handleChangePeriode = (choix) => {
        setSelectedPeriodeChoiceId(choix);

        if (choix === 0) {
            setListeSituation(listeExercice?.filter((item) => item.id === selectedExerciceId));
            setSelectedPeriodeId(selectedExerciceId);
        } else if (choix === 1) {
            GetListeSituation(selectedExerciceId);
        }
    }
    //Récupération des années à partir de l'exercice sélectionné
    const GetDateDebutFinExercice = (id) => {
        axios.get(`/paramExercice/listeExerciceById/${id}`).then((response) => {
            const resData = response.data;
            console.log("resData : ", resData);
            console.log("response.data.state : ", response.data.state);
            if (resData.state) {
                const annee = getAnneesEntreDeuxDates(resData.list.date_debut, resData.list.date_fin);
                console.log("Date début :", resData.list.date_debut);
                console.log("Date fin :", resData.list.date_fin);
                console.log("Annee :", annee);
                setListeAnnee(annee);
            }
        }).catch((error) => {
            console.error('[ERROR] Erreur lors de la récupération des dates d\'exercice:', error);
            toast.error("Erreur lors de la récupération des dates d'exercice");
            setListeAnnee([]);
        })
    }

    const sendToHome = (value) => {
        setNoFile(!value);
        navigate('/tab/home');
    };
    return (
        <Box>
            <Toaster position="top-right" toastOptions={{ duration: 2500 }} />
            <TabContext value={"1"}>
                {noFile ? <PopupTestSelectedFile confirmationState={sendToHome} /> : null}
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <TabList aria-label="tabs">
                        <Tab
                            style={{ textTransform: 'none', outline: 'none', border: 'none', margin: -5 }}
                            label={InfoFileStyle(fileInfos?.dossier)} value="1"
                        />
                    </TabList>
                </Box>
                <TabPanel value="1">
                    <Stack width={'100%'} spacing={2}>
                        <Typography variant='h6' sx={{ color: 'black' }} align='left'>Révision anomalies Ebilan</Typography>

                        <Stack width={'100%'} spacing={2} direction={'row'} alignItems={'center'}>
                            <FormControl variant="standard" sx={{ m: 1, minWidth: 280 }} disabled={!fileId}>
                                <InputLabel id="select-exercice-label">Exercice</InputLabel>
                                <Select
                                    labelId="select-exercice-label"
                                    value={selectedExerciceId}
                                    onChange={(e) => handleChangeExercice(e.target.value)}
                                    sx={{ width: 340 }}
                                >
                                    <MenuItem value=""><em>None</em></MenuItem>
                                    {listeExercice.map((ex) => (
                                        <MenuItem key={ex.id} value={ex.id}>
                                            {ex.libelle_rang}: {format(new Date(ex.date_debut), 'dd/MM/yyyy')} - {format(new Date(ex.date_fin), 'dd/MM/yyyy')}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <FormControl variant="standard" sx={{ minWidth: 150 }}>
                                <InputLabel>Période</InputLabel>
                                <Select
                                    disabled
                                    value={selectedPeriodeChoiceId}
                                    onChange={(e) => handleChangePeriode(e.target.value)}
                                >
                                    <MenuItem value={0}>Toutes</MenuItem>
                                    <MenuItem value={1}>Situations</MenuItem>
                                </Select>
                            </FormControl>
                            <FormControl variant="standard" sx={{ minWidth: 250 }}>
                                <InputLabel>Du</InputLabel>
                                <Select
                                    value={selectedPeriodeId}
                                    onChange={(e) => handleChangeDateIntervalle(e.target.value)}
                                >
                                    {listeSituation?.map((option) => (
                                        <MenuItem key={option.id} value={option.id}>
                                            {option.libelle_rang}: {format(option.date_debut, "dd/MM/yyyy")} - {format(option.date_fin, "dd/MM/yyyy")}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Stack>

                        <TableRevisionDPOverviewModel
                            rows={overviewRows}
                            onExpand={handleExpandRow}
                            onSaveComment={handleSaveComment}
                            onToggleStatus={handleToggleStatus}
                            onRowAction={(row) => {
                                try {
                                    if (row?.tabValue) {
                                        localStorage.setItem('tabEbilan', String(row.tabValue));
                                    }
                                } catch { }
                                if (fileId) navigate(`/tab/declaration/declarationEbilan/${fileId}`);
                            }}
                            canModify={canModify}
                        />
                    </Stack>
                </TabPanel>
            </TabContext>
        </Box>
    )
}