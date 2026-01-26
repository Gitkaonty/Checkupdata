import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Typography, Stack, Box, Tab, IconButton, Button, Switch, Checkbox, Autocomplete, TextField, Tooltip } from '@mui/material';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import FormControlLabel from '@mui/material/FormControlLabel';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import useAuth from '../../../../hooks/useAuth';
import { jwtDecode } from 'jwt-decode';
import axios from '../../../../../config/axios';
import toast from 'react-hot-toast';
import PopupTestSelectedFile from '../../../componentsTools/popupTestSelectedFile';
import { InfoFileStyle } from '../../../componentsTools/InfosFileStyle';
import { TabContext, TabPanel } from '@mui/lab';
import TabList from '@mui/lab/TabList';
import { format } from 'date-fns';
import { useFormik } from 'formik';
import * as Yup from "yup";
import CircularProgress from '@mui/material/CircularProgress';
import VirtualTableModifiableExport from '../../../componentsTools/DeclarationEbilan/virtualTableModifiableExport';
import { ListItemIcon, ListItemText } from '@mui/material';
import { FaFilePdf, FaFileExcel } from 'react-icons/fa';
import { CiExport } from "react-icons/ci";
import { IoMdRefreshCircle } from "react-icons/io";

import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';

import usePermission from '../../../../hooks/usePermission';

const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" />;

export default function ExportBalance() {
    const { canAdd, canModify, canDelete, canView } = usePermission();
    //Valeur du listbox choix exercice ou situation-----------------------------------------------------
    let axeId = 0;
    if (typeof window !== "undefined") {
        axeId = localStorage.getItem('axeId');
    }

    const [checked, setChecked] = useState(false);
    const [unsoldedCompte, setUnsoldedCompte] = useState(false);
    const [movmentedCpt, setMovmentedCpt] = useState(false);

    const [fileInfos, setFileInfos] = useState('');
    const [fileId, setFileId] = useState(0);
    const { id } = useParams();
    const [noFile, setNoFile] = useState(false);

    const [isRefreshed, setIsRefreshed] = useState(false);

    const [selectedExerciceId, setSelectedExerciceId] = useState(0);
    const [selectedPeriodeId, setSelectedPeriodeId] = useState(0);
    const [selectedPeriodeChoiceId, setSelectedPeriodeChoiceId] = useState(0);
    const [listeExercice, setListeExercice] = useState([]);
    const [listeSituation, setListeSituation] = useState([]);

    const [axesData, setAxesData] = useState([]);
    const [sectionsData, setSectionsData] = useState([]);
    const [isCaActive, setIsCaActive] = useState(false);

    const [selectedAxeId, setSelectedAxeId] = useState(0);
    const [selectedSectionsId, setSelectedSectionsId] = useState([]);

    const [type, setType] = useState(0);

    const [balance, setBalance] = useState([]);

    const [traitementJournalWaiting, setTraitementJournalWaiting] = useState(false);
    const [traitementJournalMsg, setTraitementJournalMsg] = useState('');
    const balanceFetchTimer = useRef(null);

    //récupération infos de connexion (doit être défini avant les hooks qui l'utilisent)
    const { auth } = useAuth();
    const decoded = auth?.accessToken ? jwtDecode(auth.accessToken) : undefined;
    const compteId = decoded?.UserInfo?.compteId || null;
    const navigate = useNavigate();

    // Menu Export
    const [anchorElExport, setAnchorElExport] = useState(null);
    const openExportMenu = Boolean(anchorElExport);
    const handleOpenExportMenu = useCallback((event) => setAnchorElExport(event.currentTarget), []);
    const handleCloseExportMenu = useCallback(() => setAnchorElExport(null), []);

    const doExport = useCallback(async (type) => {
        try {
            if (!compteId || !fileId || !selectedPeriodeId) {
                toast.error('Veuillez sélectionner un exercice valide avant d\'exporter.');
                return;
            }
            setTraitementJournalMsg('Génération en cours...');
            setTraitementJournalWaiting(true);
            const url = type === 'pdf' ? '/administration/exportBalance/pdf' : '/administration/exportBalance/excel';
            const body = {
                centraliser: checked,
                unSolded: unsoldedCompte,
                movmentedCpt: movmentedCpt,
                compteId,
                fileId,
                exerciceId: selectedPeriodeId,
                data: balance
            };
            const response = await axios.post(url, body, { responseType: 'blob' });
            const blobType = type === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
            const ext = type === 'pdf' ? 'pdf' : 'xlsx';
            const blob = new Blob([response.data], { type: blobType });
            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.download = `Balance_${fileId}_${selectedPeriodeId}.${ext}`;
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (e) {
            toast.error('Erreur lors de l\'export');
        } finally {
            setTraitementJournalWaiting(false);
            setTraitementJournalMsg('');
            handleCloseExportMenu();
        }
    }, [checked, unsoldedCompte, movmentedCpt, compteId, fileId, selectedPeriodeId, handleCloseExportMenu, balance]);

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

    const columns =
        [
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
                minWidth: 400,
                align: 'left',
                isnumber: false
            },
            {
                id: 'mvmdebit',
                label: 'Mouvement débit',
                minWidth: 200,
                align: 'right',
                format: (value) => value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                isnumber: true
            },
            {
                id: 'mvmcredit',
                label: 'Mouvement crédit',
                minWidth: 200,
                align: 'right',
                format: (value) => value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                isnumber: true
            },
            {
                id: 'soldedebit',
                label: 'Solde débit',
                minWidth: 200,
                align: 'right',
                format: (value) => value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                isnumber: true
            },
            {
                id: 'soldecredit',
                label: 'Solde crédit',
                minWidth: 200,
                align: 'right',
                format: (value) => value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                isnumber: true
            }
        ]

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
        // Laisser useEffect déclencher le chargement (évite double appels)
    }

    //Choix période
    const handleChangePeriode = (choix) => {
        setSelectedPeriodeChoiceId(choix);

        if (choix === 0) {
            setListeSituation(listeExercice?.filter((item) => item.id === selectedExerciceId));
            setSelectedPeriodeId(selectedExerciceId);
            // Laisser useEffect déclencher le chargement (évite double appels)
        } else if (choix === 1) {
            GetListeSituation(selectedExerciceId);
        }
    }

    //Récupération de la balance
    const recupBalance = (centraliser, unSolded, movmentedCpt, compteId, fileId, exerciceId, type, id_axes, id_sections) => {
        const id_sectionMapped = id_sections.map(val => Number(val.id));
        if (type === 3) {
            axios.post(`/administration/exportBalance/recupBalanceAnalytiqueFromJournal`, { centraliser, unSolded, movmentedCpt, compteId, fileId, exerciceId, type, axeId: id_axes, sectionId: id_sectionMapped }).then((response) => {
                const resData = response.data;
                if (resData.state) {
                    canView ? setBalance(resData.list) : setBalance([]);
                } else {
                    if (resData?.msg && !String(resData.msg).includes('Paramètres manquants')) {
                        toast.error(resData.msg);
                    }
                }
                setTraitementJournalWaiting(false);
                setTraitementJournalMsg('');
            });
        } else {
            axios.post(`/administration/exportBalance/recupBalanceFromJournal`, { centraliser, unSolded, movmentedCpt, compteId, fileId, exerciceId, type }).then((response) => {
                const resData = response.data;
                if (resData.state) {
                    canView ? setBalance(resData.list) : setBalance([]);
                } else {
                    if (resData?.msg && !String(resData.msg).includes('Paramètres manquants')) {
                        toast.error(resData.msg);
                    }
                }
                setTraitementJournalWaiting(false);
                setTraitementJournalMsg('');
            });
        }
    }

    const actualizeBalance = async () => {
        try {
            const id_sectionMapped = selectedSectionsId.map(val => Number(val.id));

            const response = await axios.post('/administration/exportBalance/actualizeBalance', {
                id_compte: Number(compteId),
                id_exercice: Number(selectedExerciceId),
                id_dossier: Number(fileId),
                type,
                id_axe: Number(selectedAxeId),
                id_sections: id_sectionMapped
            });

            if (response?.data?.state) {
                toast.success(response?.data?.message);
                setIsRefreshed(prev => !prev);
            } else {
                toast.error(response?.data?.message || response?.data?.msg);
            }
        } catch (err) {
            toast.error("Erreur lors de l'actualisation");
            console.error(err);
        }
    };

    useEffect(() => {
        if (!compteId || !fileId || !selectedPeriodeId) return;
        if (balanceFetchTimer.current) clearTimeout(balanceFetchTimer.current);
        setTraitementJournalWaiting(true);
        setTraitementJournalMsg('Chargement de la balance...');
        balanceFetchTimer.current = setTimeout(() => {
            recupBalance(checked, unsoldedCompte, movmentedCpt, compteId, fileId, selectedPeriodeId, type, selectedAxeId, selectedSectionsId);
        }, 200);
        return () => {
            if (balanceFetchTimer.current) clearTimeout(balanceFetchTimer.current);
        };
    }, [fileId, selectedPeriodeId, checked, unsoldedCompte, movmentedCpt, type, selectedAxeId, selectedSectionsId, isRefreshed]);

    //Formulaire pour l'import du journal
    const formikImport = useFormik({
        initialValues: {
            idCompte: compteId,
            idDossier: fileId,
            idExercice: selectedPeriodeId,
            type: 'CSV',
            choixImport: '',
            journalData: [],
        },
        validationSchema: Yup.object({
            type: Yup.string().required("Veuillez choisir le type de fichier à importer"),
            choixImport: Yup.string().required("Veuillez choisir l'action à faire"),
            compteassocie: Yup.string()
        }),
        onSubmit: (values) => {

        },
    });

    //Choix centralisation des comptes
    const handleChange = (event) => {
        const isChecked = event.target.checked;
        setChecked(isChecked);
    };

    //choix compte soldé ou non 
    const handleChangeUnsoldedCompte = (event) => {
        const isChecked = event.target.checked;
        setUnsoldedCompte(isChecked);
    };

    //choix compte mouvementés seulement
    const handleChangeMovmentedCpt = (event) => {
        const isChecked = event.target.checked;
        setMovmentedCpt(isChecked);
    };

    const handleChangeType = (e) => {
        setType(e.target.value);
    }

    const handleChangeAxe = (e) => {
        setSelectedAxeId(e.target.value);
        setSelectedSectionsId([]);
        localStorage.setItem('axeId', e.target.value);
        localStorage.removeItem('sectionIds');
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
                <TabPanel value="1" style={{ height: '85%' }}>
                    <form onSubmit={formikImport.handleSubmit}>
                        <Stack width={"100%"} height={"100%"} spacing={4} alignItems={"flex-start"} alignContent={"flex-start"} justifyContent={"stretch"}>
                            <Typography variant='h6' sx={{ color: "black" }} align='left'>Administration - Export balance</Typography>

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
                                        <InputLabel id="demo-simple-select-standard-label">Type</InputLabel>
                                        <Select
                                            disabled={!canView}
                                            labelId="demo-simple-select-standard-label"
                                            id="demo-simple-select-standard"
                                            value={type}
                                            label={"valSelect"}
                                            onChange={handleChangeType}
                                            sx={{ width: "150px", display: "flex", justifyContent: "left", alignItems: "flex-start", alignContent: "flex-start", textAlign: "left" }}
                                            MenuProps={{
                                                disableScrollLock: true
                                            }}
                                        >
                                            <MenuItem value={0}>Générale</MenuItem>
                                            <MenuItem value={1}>Fournisseurs</MenuItem>
                                            <MenuItem value={2}>Clients</MenuItem>
                                            {isCaActive && (<MenuItem value={3}>Analytique</MenuItem>)}
                                        </Select>
                                    </FormControl>

                                    {
                                        type === 3 && (
                                            <>
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
                                                <FormControl variant="standard" sx={{ width: 750 }}>
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
                                            </>
                                        )
                                    }
                                </Stack>
                                {
                                    type === 3 && (
                                        <Stack
                                            direction={'row'}
                                            spacing={0.5}
                                        >
                                            <div>
                                                <Tooltip
                                                    title={`Actualiser la balance ${type === 3 ? 'analytique' : 'générale'}`}
                                                >
                                                    <Button
                                                        disabled={!canView}
                                                        variant="outlined"
                                                        onClick={actualizeBalance}
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
                                                        startIcon={<IoMdRefreshCircle size={25} />}
                                                    >
                                                        Actualiser
                                                    </Button>
                                                </Tooltip>
                                            </div>
                                        </Stack>
                                    )
                                }
                            </Stack>

                            <Stack width={"100%"} height={"60px"} spacing={0.5} alignItems={"center"} alignContent={"center"} direction={"row"} style={{ marginLeft: "0px", marginTop: "0px" }}>
                                <FormControlLabel
                                    control={<Switch checked={checked} disabled={!canView} onChange={handleChange} name="centralisation" />}
                                    label="Centraliser la balance"
                                    style={{ width: "15%" }}
                                />

                                <FormControlLabel
                                    control={<Switch checked={unsoldedCompte} disabled={!canView} onChange={handleChangeUnsoldedCompte} name="unSoldedCompte" />}
                                    label="Seulement les comptes non soldés"
                                    style={{ width: "22%" }}
                                />

                                <FormControlLabel
                                    control={<Switch checked={movmentedCpt} disabled={!canView} onChange={handleChangeMovmentedCpt} name="movmentedCpt" />}
                                    label="Seulement les comptes mouvementés"
                                    style={{ width: "56%" }}
                                />

                                <div>
                                    <IconButton
                                        disabled={!listeExercice || listeExercice.length === 0 || !selectedExerciceId || selectedExerciceId === 0}
                                        variant="contained"
                                        onClick={handleOpenExportMenu}
                                        aria-controls={openExportMenu ? 'export-menu' : undefined}
                                        aria-haspopup="true"
                                        aria-expanded={openExportMenu ? 'true' : undefined}
                                    >
                                        <CiExport style={{ width: 35, height: 35, color: "#D32F2F" }} />
                                    </IconButton>
                                </div>
                            </Stack>

                            {traitementJournalWaiting
                                ? <Stack spacing={2} direction={'row'} width={"100%"} alignItems={'center'} justifyContent={'center'}>
                                    <CircularProgress />
                                    <Typography variant='h6' style={{ color: '#2973B2' }}>{traitementJournalMsg}</Typography>
                                </Stack>
                                : null
                            }

                            <Stack width={"100%"} height={'600px'} >
                                {useMemo(() => (
                                    <VirtualTableModifiableExport columns={columns} rows={balance} />
                                ), [balance])}
                            </Stack>
                        </Stack>
                    </form>
                </TabPanel>
            </TabContext>

            {/* Hoisted Export Menu for faster open (less layout work) */}
            <Menu
                id="export-menu"
                anchorEl={anchorElExport}
                open={openExportMenu}
                onClose={handleCloseExportMenu}
                keepMounted
                disablePortal={false}
                disableScrollLock
                disableAutoFocus
                disableEnforceFocus
                disableRestoreFocus
                TransitionProps={{ timeout: 0 }}
                transitionDuration={0}
                MenuListProps={{ dense: true, disablePadding: true }}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                transformOrigin={{ vertical: 'top', horizontal: 'left' }}
            >
                <MenuItem onClick={() => doExport('pdf')}>
                    <ListItemIcon>
                        <FaFilePdf size={20} color="#D32F2F" />
                    </ListItemIcon>
                    <ListItemText primary="Exporter en PDF" />
                </MenuItem>

                <MenuItem onClick={() => doExport('excel')}>
                    <ListItemIcon>
                        <FaFileExcel size={20} color="#2E7D32" />
                    </ListItemIcon>
                    <ListItemText primary="Exporter en Excel" />
                </MenuItem>
            </Menu>
        </Box>
    )
}
