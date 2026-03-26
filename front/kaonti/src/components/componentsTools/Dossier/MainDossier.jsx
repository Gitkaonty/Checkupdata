import { useState } from 'react';
import {
    Box, Typography, Stack, Button, TextField,
    GlobalStyles,
    Input,
    MenuItem,
    Select,
    Autocomplete
} from '@mui/material';
import * as Yup from "yup";
import { Formik, Form } from 'formik';
import toast from 'react-hot-toast';

import { ComptabiliteTabContent, FiscalTabContent, InfoSocieteTabContent } from './Tab';
import DatagridGlobal from './Datagrid/DatagridGlobal';

import SaveIcon from '@mui/icons-material/CheckCircleOutline';
import useAxiosPrivate from '../../../../config/axiosPrivate';
import { FormikPaveItem } from '../Global/Input/FieldFormik';

const dataGridHeight = '500px';

const NAV_DARK = '#0B1120';
const fieldOrder = [
    'nomdossier',
    'raisonsociale',
    'forme',
    'activite',
    'longueurcptstd',
    'longueurcptaux',
    'tauxir',
    'portefeuille',
    'pays',
    'motDePasse',
    'motDePasseConfirmation'
]

const formInfosNewFileValidationSchema = Yup.object({
    nomdossier: Yup.string().required("Veuillez tapez un nom pour votre dossier"),
    raisonsociale: Yup.string().required("Veuillez insérer la raison sociale de votre société"),
    forme: Yup.string().required("Veuillez sélection la forme de votre société"),
    activite: Yup.string().required("Veuillez renseigner l'activité de votre société"),
    longueurcptstd: Yup.number().moreThan(0, 'Taper une longueur de compte supérieur à 1'),
    longueurcptaux: Yup.number().moreThan(0, 'Taper une longueur de compte supérieur à 1'),
    // tauxir: Yup.number().moreThan(0, 'Taper votre taux IR'),
    portefeuille: Yup.array().min(1, "Sélectionnez au moins un portefeuille"),
    pays: Yup.string().required("Sélectionnez une pays"),

    motDePasse: Yup.string().when('avecMotDePasse', {
        is: true,
        then: (schema) =>
            schema
                .required("Le mot de passe est obligatoire")
                .min(8, "Le mot de passe doit contenir au moins 8 caractères")
                .max(30, "Le mot de passe est trop long")
                .matches(/[A-Z]/, "Doit contenir une majuscule")
                .matches(/[a-z]/, "Doit contenir une minuscule")
                .matches(/[0-9]/, "Doit contenir un chiffre")
                .matches(/[^a-zA-Z0-9]/, "Doit contenir un caractère spécial"),
        otherwise: (schema) => schema.notRequired()
    }),

    motDePasseConfirmation: Yup.string().when('avecMotDePasse', {
        is: true,
        then: (schema) =>
            schema
                .oneOf([Yup.ref('motDePasse')], "Les mots de passe ne correspondent pas")
                .required("Le mot de passe de confirmation est obligatoire"),
        otherwise: (schema) => schema.notRequired()
    }),
});

const MainDossier = ({
    compteId,
    confirmationState,
    refresh,
    listePortefeuille,
    listPays,
    listModel,
    listProvinces,
    listeDevise,
    listRegions,
    listDistricts,
    listCommunes,
    listeDossier,

    setListRegions,
    setListDistricts,
    setListCommunes,

    listeAssocie,
    listeFiliale,
    listeDomBank,
    listeConsolidation,

    setListeAssocie,
    setListeFiliale,
    setListeDomBank,
    setListeConsolidation,

    getListeRegions,
    getListeDistricts,
    getListeCommunes,
    row,
    type
}) => {
    const [activeTab, setActiveTab] = useState('Infos société');
    const axiosPrivate = useAxiosPrivate();

    const updateAccountsLengthInJournals = async (newLongueurStd, newLongueurAux, autoCompletion) => {
        const payload = {
            fileId: Number(fileId),
            compteId: Number(compteId),
            newLongueurStd: newLongueurStd,
            newLongueurAux: newLongueurAux,
            autoCompletion: autoCompletion
        }
        const response = await axios.post('/paramCrm/updateAccountsLengthInJournals', payload);
        if (response?.data?.state) {
        } else {
            toast.error("Erreur lors de la modification de longueur de compte dans le journal")
        }
    }

    const updateAccountsLengthInPlanComptable = async (newLongueurStd, newLongueurAux, autoCompletion) => {
        const payload = {
            fileId: Number(fileId),
            compteId: Number(compteId),
            newLongueurStd: newLongueurStd,
            newLongueurAux: newLongueurAux,
            autoCompletion: autoCompletion
        }
        const response = await axios.post('/paramCrm/updateAccountsLengthInPlanComptable', payload);
        if (response?.data?.state) {

        } else {
            toast.error('Erreur lors de la modification de la longueur de compte dans le journal');
        }
    }

    const handleSubmitForm = async (values) => {
        const portefeuilleIds = values.portefeuille.map(val => Number(val.id));
        const payload = {
            ...values,
            idCompte: compteId,
            idDossier: values.itemId,
            portefeuille: portefeuilleIds
        };

        if (type === 'modification') {
            const oldLongueurStd = row?.longcomptestd || 6;
            const oldLongueurAux = row?.longcompteaux || 6;
            const oldAutoCompletion = row?.autocompletion;

            const newLongueurStd = parseInt(values.longueurcptstd);
            const newLongueurAux = parseInt(values.longueurcptaux);
            const newAutoCompletion = values.autocompletion;

            const response = await axiosPrivate.post(`/paramCrm/modifying`, payload);
            const resData = response.data;

            if (resData.state) {
                toast.success(resData.msg);
                if (oldLongueurStd !== newLongueurStd || oldLongueurAux !== newLongueurAux || oldAutoCompletion !== newAutoCompletion) {
                    await updateAccountsLengthInJournals(newLongueurStd, newLongueurAux, values.autocompletion);
                    await updateAccountsLengthInPlanComptable(newLongueurStd, newLongueurAux, values.autocompletion);
                }
            } else {
                toast.error(resData.msg);
            }

        } else {
            await axiosPrivate.post(`/home/newFile`, payload).then((response) => {
                const resData = response.data;
                if (resData.state) {
                    toast.success(resData.msg);
                    confirmationState(false);
                    refresh();
                } else {
                    toast.error(resData.msg);
                }
            })
        }
    };

    const InfosNewFileInitialValues = {
        action: type === 'ajout' ? 'new' : 'edit',
        centrefisc: row?.centrefisc || 'DGE',
        itemId: row?.itemId || 0,
        idCompte: row?.idCompte || 0,
        nomdossier: row?.nomdossier || '',
        raisonsociale: row?.raisonsociale || '',
        denomination: row?.denomination || '',
        nif: row?.nif || '',
        stat: row?.stat || '',
        rcs: row?.rcs || '',
        responsable: row?.responsable || '',
        expertcomptable: row?.expertcomptable || '',
        cac: row?.cac || '',
        forme: row?.forme || '',
        activite: row?.activite || '',
        detailsactivite: row?.detailsactivite || '',
        adresse: row?.adresse || '',
        email: row?.email || '',
        telephone: row?.telephone || '',
        province: row?.province || '',
        region: row?.region || '',
        district: row?.district || '',
        commune: row?.commune || '',
        plancomptable: row?.plancomptable || 0,
        longueurcptstd: row?.longueurcptstd || 6,
        longueurcptaux: row?.longueurcptaux || 6,
        pourcentageca: row?.pourcentageca || 0,
        montantmin: row?.montantmin || 0,
        autocompletion: row?.autocompletion ?? true,
        avecanalytique: row?.avecanalytique ?? false,
        tauxir: row?.tauxir || 0,
        assujettitva: row?.assujettitva ?? false,
        montantcapital: row?.montantcapital || 0,
        nbrpart: row?.nbrpart || 0,
        valeurpart: row?.valeurpart || 0,
        listeAssocies: [],
        listeFiliales: [],
        listeDomBank: [],
        listeConsolidation: [],
        immo_amort_base_jours: row?.immo_amort_base_jours || '365',
        portefeuille: row?.portefeuille || [],
        typecomptabilite: row?.typecomptabilite || 'Français',
        devisepardefaut: row?.devisepardefaut || 'MGA',
        consolidation: row?.consolidation ?? false,
        pays: row?.pays || '',
        avecMotDePasse: row?.avecMotDePasse ?? false,
        motDePasse: row?.motDePasse || '',
        motDePasseConfirmation: row?.motDePasseConfirmation || '',
        compteisi: row?.compteisi || '',
    };

    return (
        <Formik
            initialValues={InfosNewFileInitialValues}
            enableReinitialize={true}
            validationSchema={formInfosNewFileValidationSchema}
            onSubmit={handleSubmitForm}
            validateOnMount={true}
        >
            {({ values, handleChange, handleSubmit, handleBlur, setFieldValue, isValid, setTouched, errors, resetForm }) => {
                const consolidation = values.consolidation;
                const tabs = [
                    'Infos société',
                    'Comptabilité',
                    'Fiscales',
                    'Associés',
                    'Filiales',
                    'Domiciliations bancaires',
                    ...(consolidation ? ['Consolidation'] : []),
                ];
                return (
                    <Form >
                        <Stack sx={{ bgcolor: '#F8FAFC', height: '100%', width: '100%', display: 'flex', flexDirection: 'column', marginBottom: type === 'modification' ? 0 : 5 }}>
                            <GlobalStyles styles={{ body: { margin: 0, padding: 0, overflowX: 'hidden', fontFamily: '"Inter", sans-serif' } }} />
                            <Box sx={{ paddingLeft: 4, paddingRight: 4, width: '100%', boxSizing: 'border-box' }}>
                                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                                    <Typography variant="h5" sx={{ fontWeight: 900, color: '#1E293B', letterSpacing: '-0.02em' }}>
                                        Paramétrages: CRM
                                    </Typography>
                                    <Button
                                        // type='submit'
                                        onClick={() => {
                                            if (!isValid) {
                                                const touchedFields = Object.keys(errors).reduce((acc, field) => {
                                                    acc[field] = true;
                                                    return acc;
                                                }, {});

                                                setTouched(touchedFields);

                                                const firstErrorField = fieldOrder.find(
                                                    field => errors[field]
                                                );

                                                console.log('firstErrorField : ', firstErrorField);

                                                if (firstErrorField) {
                                                    toast.error(errors[firstErrorField]);
                                                }

                                                return;
                                            }

                                            handleSubmit();
                                        }}
                                        variant="contained"
                                        disableElevation
                                        startIcon={<SaveIcon />}
                                        sx={{ bgcolor: NAV_DARK, borderRadius: '8px', px: 4, fontWeight: 700, textTransform: 'none', height: '40px' }}
                                    >
                                        Enregistrer
                                    </Button>
                                </Stack>

                                <Stack direction="row" spacing={4} sx={{ mb: 3, borderBottom: '1px solid #E2E8F0' }}>
                                    {tabs.map((tab) => (
                                        <Box key={tab} onClick={() => setActiveTab(tab)} sx={{ pb: 1.5, position: 'relative', cursor: 'pointer' }}>
                                            <Typography sx={{ fontSize: '13px', fontWeight: activeTab === tab ? 700 : 500, color: activeTab === tab ? '#3B82F6' : '#94A3B8' }}>
                                                {tab}
                                            </Typography>
                                            {activeTab === tab && <Box sx={{ position: 'absolute', bottom: -1, left: 0, width: '100%', height: '3px', bgcolor: '#3B82F6', borderRadius: '10px' }} />}
                                        </Box>
                                    ))}
                                </Stack>

                                <Box>
                                    {activeTab === 'Infos société' && <InfoSocieteTabContent values={values} handleChange={handleChange} handleBlur={handleBlur} setFieldValue={setFieldValue} listePortefeuille={listePortefeuille} listPays={listPays} listProvinces={listProvinces} listRegions={listRegions} listDistricts={listDistricts} listCommunes={listCommunes} getListeRegions={getListeRegions} getListeDistricts={getListeDistricts} getListeCommunes={getListeCommunes} type={type} setListRegions={setListRegions} setListDistricts={setListDistricts} setListCommunes={setListCommunes} />}
                                    {activeTab === 'Comptabilité' && <ComptabiliteTabContent values={values} handleChange={handleChange} handleBlur={handleBlur} setFieldValue={setFieldValue} listModel={listModel} type={type} listeDevise={listeDevise} />}
                                    {activeTab === 'Fiscales' && <FiscalTabContent values={values} handleChange={handleChange} handleBlur={handleBlur} setFieldValue={setFieldValue} />}
                                    {activeTab === 'Associés' && <AssociatesTabContent values={values} handleChange={handleChange} handleBlur={handleBlur} setFieldValue={setFieldValue} listAssocie={listeAssocie} setListAssocie={setListeAssocie} axiosPrivate={axiosPrivate} type={type} />}
                                    {activeTab === 'Filiales' && <FilialeTabContent values={values} handleChange={handleChange} handleBlur={handleBlur} setFieldValue={setFieldValue} listFiliale={listeFiliale} setListFiliale={setListeFiliale} axiosPrivate={axiosPrivate} type={type} />}
                                    {activeTab === 'Domiciliations bancaires' && <DomBankTabContent values={values} handleChange={handleChange} handleBlur={handleBlur} setFieldValue={setFieldValue} listDomB={listeDomBank} setListDomB={setListeDomBank} listPays={listPays} axiosPrivate={axiosPrivate} type={type} />}
                                    {activeTab === 'Consolidation' && consolidation && <ConsolidationTabContent values={values} handleChange={handleChange} handleBlur={handleBlur} setFieldValue={setFieldValue} listConsolidation={listeConsolidation} setListConsolidation={setListeConsolidation} listeDossier={listeDossier} axiosPrivate={axiosPrivate} type={type} />}
                                </Box>
                            </Box>
                        </Stack>
                    </Form>
                )
            }}
        </Formik>
    );
};

const AssociatesTabContent = ({ values, setFieldValue, listAssocie, setListAssocie, axiosPrivate, type }) => {
    const [rowErrors, setRowErrors] = useState({});
    const [rowModesModel, setRowModesModel] = useState({});

    const validateRow = (row) => {
        const errors = {};

        if (!row.type || row.type.trim() === '') {
            errors.type = 'Type obligatoire';
        }

        if (!row.nom || row.nom.trim() === '') {
            errors.nom = 'Nom obligatoire';
        }

        if (!row.adresse || row.adresse.trim() === '') {
            errors.adresse = 'Adresse obligatoire';
        }

        if (!row.dateentree) {
            errors.dateentree = 'Date d\'entrée obligatoire';
        }

        if (!row.datesortie) {
            errors.datesortie = 'Date de sortie obligatoire';
        }

        return errors;
    };

    const TypesOptions = [
        { value: 'PP', label: 'Personne physique' },
        { value: 'PM', label: 'Personne morale' },
    ];

    const associeColumnHeader = [
        {
            field: 'type',
            headerName: 'TYPE',
            type: 'singleSelect',
            valueOptions: TypesOptions.map((type) => type.value),
            sortable: true,
            flex: 1,
            headerAlign: 'left',
            headerClassName: 'HeaderbackColor',
            editable: true,
            valueFormatter: (params) => {
                const selectedType = TypesOptions.find((option) => option.value === params.value);
                return selectedType ? selectedType.label : params.value;
            },
            renderEditCell: (params) => (
                <Select
                    value={params.value || ''}
                    fullWidth
                    variant="standard"
                    disableUnderline
                    sx={{
                        backgroundColor: 'white',

                        '& .MuiSelect-select': {
                            padding: '4px 8px',
                            fontSize: '13px',
                            color: '#94A3B8',
                            paddingLeft: '10px',
                        },

                        '&:before, &:after': {
                            borderBottom: 'none !important',
                        },
                    }}
                    onChange={(e) => {
                        params.api.setEditCellValue({
                            id: params.id,
                            field: params.field,
                            value: e.target.value,
                        });
                    }}
                >
                    {TypesOptions.map((opt) => (
                        <MenuItem key={opt.value} value={opt.value}>
                            {opt.label}
                        </MenuItem>
                    ))}
                </Select>
            ),
            cellClassName: (params) => {
                return rowErrors[params.id]?.type ? 'cell-error' : '';
            },
        },
        {
            field: 'nom',
            headerName: 'NOM',
            type: 'text',
            sortable: true,
            flex: 1,
            headerAlign: 'left',
            headerClassName: 'HeaderbackColor',
            disableClickEventBubbling: true,
            editable: true,
            renderCell: (params) => {
                return <div>{params.value}</div>;
            },
            renderEditCell: (params) => (
                <TextField
                    variant="standard"
                    defaultValue={params.value}
                    fullWidth
                    InputProps={{
                        disableUnderline: true,
                    }}
                    sx={{
                        backgroundColor: 'white',
                        border: 'none',
                        outline: 'none',
                        '& .MuiInputBase-input': {
                            padding: '4px 8px',
                            fontSize: '13px',
                            color: '#94A3B8',
                            paddingLeft: '10px'
                        },
                    }}
                    onChange={(e) => {
                        params.api.setEditCellValue({
                            id: params.id,
                            field: params.field,
                            value: e.target.value,
                        });
                    }}
                />
            ),
            cellClassName: (params) => {
                return rowErrors[params.id]?.nom ? 'cell-error' : '';
            },
        },
        {
            field: 'adresse',
            headerName: 'ADRESSE',
            type: 'text',
            sortable: true,
            flex: 1,
            headerAlign: 'left',
            headerClassName: 'HeaderbackColor',
            editable: true,
            renderEditCell: (params) => (
                <TextField
                    variant="standard"
                    defaultValue={params.value}
                    fullWidth
                    InputProps={{
                        disableUnderline: true,
                    }}
                    sx={{
                        backgroundColor: 'white',
                        border: 'none',
                        outline: 'none',
                        '& .MuiInputBase-input': {
                            padding: '4px 8px',
                            fontSize: '13px',
                            color: '#94A3B8',
                            paddingLeft: '10px'
                        },
                    }}
                    onChange={(e) => {
                        params.api.setEditCellValue({
                            id: params.id,
                            field: params.field,
                            value: e.target.value,
                        });
                    }}
                />
            ),
            cellClassName: (params) => {
                return rowErrors[params.id]?.adresse ? 'cell-error' : '';
            },
        },
        {
            field: 'dateentree',
            headerName: 'DATE ENTREE',
            type: 'date',
            sortable: true,
            flex: 1,
            headerAlign: 'left',
            align: 'left',
            headerClassName: 'HeaderbackColor',
            editable: true,
            valueGetter: (params) => {
                if (!params.value) return null;
                return new Date(params.value);
            },
            renderCell: (params) => {
                if (!params.value) return '';
                const date = new Date(params.value);
                return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
            },
            renderEditCell: (params) => {
                const { id, field, value, api } = params;

                const handleChange = (e) => {
                    api.setEditCellValue({ id, field, value: e.target.value });
                };

                const handleKeyDown = (e) => {
                    e.preventDefault();
                };

                return (
                    <Input
                        type="date"
                        value={
                            value instanceof Date
                                ? value.toISOString().substring(0, 10)
                                : value
                                    ? value.substring(0, 10)
                                    : ''
                        }
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                        disableUnderline
                        fullWidth
                        sx={{
                            height: '100%',
                            backgroundColor: 'white',
                            '&.MuiInputBase-root': {
                                fontSize: '13px',
                                color: '#94A3B8',
                            },
                            '& .MuiInputBase-input': {
                                padding: '4px 8px',
                                fontSize: '13px',
                                color: '#94A3B8',
                                paddingLeft: '8px',
                            },
                            '& input::-webkit-calendar-picker-indicator': {
                                filter: 'brightness(0) saturate(100%) invert(21%) sepia(31%) saturate(684%) hue-rotate(165deg) brightness(93%) contrast(90%)',
                                cursor: 'pointer',
                            },
                        }}
                    />
                );
            },
            cellClassName: (params) => {
                return rowErrors[params.id]?.dateentree ? 'cell-error' : '';
            },
        },
        {
            field: 'datesortie',
            headerName: 'DATE SORTIE',
            type: 'date',
            align: 'left',
            sortable: true,
            flex: 1,
            headerAlign: 'left',
            headerClassName: 'HeaderbackColor',
            editable: true,
            valueGetter: (params) => {
                if (!params.value) return null;
                return new Date(params.value);
            },
            renderCell: (params) => {
                if (!params.value) return '';
                const date = new Date(params.value);
                return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
            },
            renderEditCell: (params) => {
                const { id, field, value, api } = params;

                const handleChange = (e) => {
                    api.setEditCellValue({ id, field, value: e.target.value });
                };

                const handleKeyDown = (e) => {
                    e.preventDefault();
                };

                return (
                    <Input
                        type="date"
                        value={
                            value instanceof Date
                                ? value.toISOString().substring(0, 10)
                                : value
                                    ? value.substring(0, 10)
                                    : ''
                        }
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                        disableUnderline
                        fullWidth
                        sx={{
                            height: '100%',
                            backgroundColor: 'white',
                            '&.MuiInputBase-root': {
                                fontSize: '13px',
                                color: '#94A3B8',
                            },
                            '& .MuiInputBase-input': {
                                padding: '4px 8px',
                                fontSize: '13px',
                                color: '#94A3B8',
                                paddingLeft: '8px',
                            },
                            '& input::-webkit-calendar-picker-indicator': {
                                filter: 'brightness(0) saturate(100%) invert(21%) sepia(31%) saturate(684%) hue-rotate(165deg) brightness(93%) contrast(90%)',
                                cursor: 'pointer',
                            },
                        }}
                    />
                );
            },
            cellClassName: (params) => {
                return rowErrors[params.id]?.datesortie ? 'cell-error' : '';
            },
        },
        {
            field: 'nbrpart',
            headerName: 'NOMBRE PARTS',
            type: 'number',
            sortable: true,
            flex: 0.35,
            headerAlign: 'right',
            headerClassName: 'HeaderbackColor',
            editable: true,
            renderEditCell: (params) => (
                <TextField
                    variant="standard"
                    defaultValue={params.value}
                    fullWidth
                    inputProps={{
                        min: 0,
                    }}
                    InputProps={{
                        disableUnderline: true,
                    }}
                    type="number"
                    sx={{
                        backgroundColor: 'white',
                        border: 'none',
                        outline: 'none',
                        '& .MuiInputBase-input': {
                            padding: '4px 0px',
                            fontSize: '13px',
                            color: '#94A3B8',
                            textAlign: 'right'
                        },
                    }}
                    onChange={(e) => {
                        params.api.setEditCellValue({
                            id: params.id,
                            field: params.field,
                            value: e.target.value,
                        });
                    }}
                />
            ),
        },
        {
            field: 'enactivite',
            headerName: 'EN ACTIVITE',
            type: 'boolean',
            sortable: true,
            flex: 0.3,
            headerAlign: 'center',
            headerClassName: 'HeaderbackColor',
            editable: true,
        }
    ];

    const createNewRow = () => ({
        id: null,
        type: '',
        nom: '',
        adresse: '',
        dateentree: null,
        datesortie: null,
        nbrpart: 0,
        enactivite: false,
    });

    const saveRowAssocie = (value) => {
        const payload = { ...value, idAssocie: value.id, idCompte: values.idCompte, idDossier: values.itemId };
        axiosPrivate.post(`/paramCrm/associe`, payload).then((response) => {
            const resData = response.data;
            if (resData.state) {
                toast.success(resData.msg);
            } else {
                toast.error(resData.msg);
            }
        });
    }

    const deleteRowAssocie = (id) => {
        let state = true;
        axiosPrivate.post(`/paramCrm/associeDelete`, { idToDelete: Number(id) }).then((response) => {
            const resData = response.data;
            if (resData.state) {
                toast.success(resData.msg);
            } else {
                setOpenDialogDeleteAssocieRow(false);
                toast.error(resData.msg);
                state = false;
            }
        });
        return state;
    }

    return (
        <Stack spacing={2}>
            <Stack direction="row" spacing={2}>
                <FormikPaveItem name="montantcapital" label="CAPITALE" /* unit="€" */ values={values} setFieldValue={setFieldValue} isCurrency />
                <FormikPaveItem name="nbrpart" label="NOMBRE DE PARTS" values={values} setFieldValue={setFieldValue} />
                <FormikPaveItem name="valeurpart" label="VALEUR D'UNE PART" /* unit="€" */ disabled values={values} setFieldValue={setFieldValue} isCurrency />
            </Stack>
            <DatagridGlobal
                setFieldValue={setFieldValue}
                list={listAssocie}
                setList={setListAssocie}
                columnHeader={associeColumnHeader}
                name={'listeAssocies'}
                newRow={createNewRow}
                datagridHeight={dataGridHeight}
                onSaveRow={type === 'modification' ? saveRowAssocie : undefined}
                onDeleteRow={type === 'modification' ? deleteRowAssocie : undefined}
                validateRow={validateRow}
                setRowErrors={setRowErrors}
                rowErrors={rowErrors}
                withColumnActions={true}
                withAddButton={true}
                verifyCanUpdate={null}
                rowModesModel={rowModesModel}
                setRowModesModel={setRowModesModel}
            />
        </Stack>
    )
};

const FilialeTabContent = ({ values, setFieldValue, listFiliale, setListFiliale, axiosPrivate, type }) => {
    const [rowErrors, setRowErrors] = useState({});
    const [rowModesModel, setRowModesModel] = useState({});

    const validateRow = (row) => {
        const errors = {};

        if (!row.nom || row.nom.trim() === '') {
            errors.nom = 'Nom obligatoire';
        }

        if (!row.datesortie) {
            errors.datesortie = 'Date de sortie obligatoire';
        }

        if (!row.dateentree) {
            errors.dateentree = 'Date d\'entrée obligatoire';
        }

        return errors;
    };

    const filialeColumnHeader = [
        {
            field: 'nom',
            headerName: 'NOM',
            type: 'text',
            sortable: true,
            flex: 1,
            headerAlign: 'left',
            headerClassName: 'HeaderbackColor',
            disableClickEventBubbling: true,
            editable: true,
            renderCell: (params) => {
                return <div>{params.value}</div>;
            },
            renderEditCell: (params) => (
                <TextField
                    variant="standard"
                    defaultValue={params.value}
                    fullWidth
                    InputProps={{
                        disableUnderline: true,
                    }}
                    sx={{
                        backgroundColor: 'white',
                        border: 'none',
                        outline: 'none',
                        '& .MuiInputBase-input': {
                            padding: '4px 8px',
                            fontSize: '13px',
                            color: '#94A3B8',
                            paddingLeft: '10px'
                        },
                    }}
                    onChange={(e) => {
                        params.api.setEditCellValue({
                            id: params.id,
                            field: params.field,
                            value: e.target.value,
                        });
                    }}
                />
            ),
            cellClassName: (params) => {
                return rowErrors[params.id]?.nom ? 'cell-error' : '';
            },
        },
        {
            field: 'dateentree',
            headerName: 'DATE ENTREE',
            type: 'date',
            sortable: true,
            flex: 1,
            headerAlign: 'left',
            align: 'left',
            headerClassName: 'HeaderbackColor',
            editable: true,
            valueGetter: (params) => {
                if (!params.value) return null;
                return new Date(params.value);
            },
            renderCell: (params) => {
                if (!params.value) return '';
                const date = new Date(params.value);
                return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
            },
            renderEditCell: (params) => {
                const { id, field, value, api } = params;

                const handleChange = (e) => {
                    api.setEditCellValue({ id, field, value: e.target.value });
                };

                const handleKeyDown = (e) => {
                    e.preventDefault();
                };

                return (
                    <Input
                        type="date"
                        value={
                            value instanceof Date
                                ? value.toISOString().substring(0, 10)
                                : value
                                    ? value.substring(0, 10)
                                    : ''
                        }
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                        disableUnderline
                        fullWidth
                        sx={{
                            height: '100%',
                            backgroundColor: 'white',
                            '&.MuiInputBase-root': {
                                fontSize: '13px',
                                color: '#94A3B8',
                            },
                            '& .MuiInputBase-input': {
                                padding: '4px 8px',
                                fontSize: '13px',
                                color: '#94A3B8',
                                paddingLeft: '8px',
                            },
                            '& input::-webkit-calendar-picker-indicator': {
                                filter: 'brightness(0) saturate(100%) invert(21%) sepia(31%) saturate(684%) hue-rotate(165deg) brightness(93%) contrast(90%)',
                                cursor: 'pointer',
                            },
                        }}
                    />
                );
            },
            cellClassName: (params) => {
                return rowErrors[params.id]?.dateentree ? 'cell-error' : '';
            },
        },
        {
            field: 'datesortie',
            headerName: 'DATE SORTIE',
            type: 'date',
            align: 'left',
            sortable: true,
            flex: 1,
            headerAlign: 'left',
            headerClassName: 'HeaderbackColor',
            editable: true,
            valueGetter: (params) => {
                if (!params.value) return null;
                return new Date(params.value);
            },
            renderCell: (params) => {
                if (!params.value) return '';
                const date = new Date(params.value);
                return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
            },
            renderEditCell: (params) => {
                const { id, field, value, api } = params;

                const handleChange = (e) => {
                    api.setEditCellValue({ id, field, value: e.target.value });
                };

                const handleKeyDown = (e) => {
                    e.preventDefault();
                };

                return (
                    <Input
                        type="date"
                        value={
                            value instanceof Date
                                ? value.toISOString().substring(0, 10)
                                : value
                                    ? value.substring(0, 10)
                                    : ''
                        }
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                        disableUnderline
                        fullWidth
                        sx={{
                            height: '100%',
                            backgroundColor: 'white',
                            '&.MuiInputBase-root': {
                                fontSize: '13px',
                                color: '#94A3B8',
                            },
                            '& .MuiInputBase-input': {
                                padding: '4px 8px',
                                fontSize: '13px',
                                color: '#94A3B8',
                                paddingLeft: '8px',
                            },
                            '& input::-webkit-calendar-picker-indicator': {
                                filter: 'brightness(0) saturate(100%) invert(21%) sepia(31%) saturate(684%) hue-rotate(165deg) brightness(93%) contrast(90%)',
                                cursor: 'pointer',
                            },
                        }}
                    />
                );
            },
            cellClassName: (params) => {
                return rowErrors[params.id]?.datesortie ? 'cell-error' : '';
            },
        },
        {
            field: 'nbrpart',
            headerName: 'NOMBRE PARTS',
            type: 'number',
            sortable: true,
            flex: 0.35,
            headerAlign: 'right',
            headerClassName: 'HeaderbackColor',
            editable: true,
            renderEditCell: (params) => (
                <TextField
                    variant="standard"
                    defaultValue={params.value}
                    fullWidth
                    inputProps={{
                        min: 0,
                    }}
                    InputProps={{
                        disableUnderline: true,
                    }}
                    type="number"
                    sx={{
                        backgroundColor: 'white',
                        border: 'none',
                        outline: 'none',
                        '& .MuiInputBase-input': {
                            padding: '4px 0px',
                            fontSize: '13px',
                            color: '#94A3B8',
                            textAlign: 'right'
                        },
                    }}
                    onChange={(e) => {
                        params.api.setEditCellValue({
                            id: params.id,
                            field: params.field,
                            value: e.target.value,
                        });
                    }}
                />
            ),
            cellClassName: (params) => {
                return rowErrors[params.id]?.nbrpart ? 'cell-error' : '';
            },
        },
        {
            field: 'enactivite',
            headerName: 'EN ACTIVITE',
            type: 'boolean',
            sortable: true,
            flex: 0.3,
            headerAlign: 'center',
            headerClassName: 'HeaderbackColor',
            editable: true,
        }
    ];

    const createNewRow = () => ({
        id: null,
        nom: '',
        dateentree: null,
        datesortie: null,
        nbrpart: 0,
        enactivite: false,
    });

    const saveRowFiliale = (value) => {
        const payload = {
            ...value,
            idFiliale: value.id,
            idCompte: values.idCompte,
            idDossier: values.itemId
        };

        axiosPrivate.post(`/paramCrm/filiale`, payload).then((response) => {
            const resData = response.data;
            resData.state ? toast.success(resData.msg) : toast.error(resData.msg);
        });
    };

    const deleteRowFiliale = (id) => {
        let state = true;
        axiosPrivate.post(`/paramCrm/filialeDelete`, { idToDelete: id }).then((response) => {
            const resData = response.data;
            if (resData.state) {
                toast.success(resData.msg);
            } else {
                toast.error(resData.msg);
                state = false;
            }
        });
        return state;
    }

    return (
        <DatagridGlobal
            setFieldValue={setFieldValue}
            list={listFiliale}
            setList={setListFiliale}
            columnHeader={filialeColumnHeader}
            name={'listeFiliales'}
            newRow={createNewRow}
            datagridHeight={dataGridHeight}
            onSaveRow={type === 'modification' ? saveRowFiliale : undefined}
            onDeleteRow={type === 'modification' ? deleteRowFiliale : undefined}
            validateRow={validateRow}
            setRowErrors={setRowErrors}
            withColumnActions={true}
            withAddButton={true}
            verifyCanUpdate={null}
            rowModesModel={rowModesModel}
            setRowModesModel={setRowModesModel}
        />
    )
};

const DomBankTabContent = ({ values, setFieldValue, listDomB, setListDomB, listPays, axiosPrivate, type }) => {
    const [rowErrors, setRowErrors] = useState({});
    const [rowModesModel, setRowModesModel] = useState({});

    const validateRow = (row) => {
        const errors = {};

        if (!row.banque || row.banque.trim() === '') {
            errors.banque = 'La banque est obligatoire';
        }

        if (!row.numcompte || row.numcompte.trim() === '') {
            errors.numcompte = 'Le numéro de compte est obligatoire';
        }

        if (!row.devise || row.devise.trim() === '') {
            errors.devise = 'La devise est obligatoire';
        }

        if (!row.pays) {
            errors.pays = 'Le pays est obligatoire';
        }

        return errors;
    };

    const domBColumnHeader = [
        {
            field: 'banque',
            headerName: 'BANQUE',
            type: 'text',
            sortable: true,
            flex: 1,
            headerAlign: 'left',
            headerClassName: 'HeaderbackColor',
            disableClickEventBubbling: true,
            editable: true,
            renderCell: (params) => {
                return <div>{params.value}</div>;
            },
            renderEditCell: (params) => (
                <TextField
                    variant="standard"
                    defaultValue={params.value}
                    fullWidth
                    InputProps={{
                        disableUnderline: true,
                    }}
                    sx={{
                        backgroundColor: 'white',
                        border: 'none',
                        outline: 'none',
                        '& .MuiInputBase-input': {
                            padding: '4px 8px',
                            fontSize: '13px',
                            color: '#94A3B8',
                            paddingLeft: '10px'
                        },
                    }}
                    onChange={(e) => {
                        params.api.setEditCellValue({
                            id: params.id,
                            field: params.field,
                            value: e.target.value,
                        });
                    }}
                />
            ),
            cellClassName: (params) => {
                return rowErrors[params.id]?.banque ? 'cell-error' : '';
            },
        },
        {
            field: 'numcompte',
            headerName: 'N° COMPTE',
            type: 'text',
            sortable: true,
            flex: 1,
            headerAlign: 'left',
            headerClassName: 'HeaderbackColor',
            disableClickEventBubbling: true,
            editable: true,
            renderCell: (params) => {
                return <div>{params.value}</div>;
            },
            renderEditCell: (params) => (
                <TextField
                    variant="standard"
                    defaultValue={params.value}
                    fullWidth
                    InputProps={{
                        disableUnderline: true,
                    }}
                    sx={{
                        backgroundColor: 'white',
                        border: 'none',
                        outline: 'none',
                        '& .MuiInputBase-input': {
                            padding: '4px 8px',
                            fontSize: '13px',
                            color: '#94A3B8',
                            paddingLeft: '10px'
                        },
                    }}
                    onChange={(e) => {
                        params.api.setEditCellValue({
                            id: params.id,
                            field: params.field,
                            value: e.target.value,
                        });
                    }}
                />
            ),
            cellClassName: (params) => {
                return rowErrors[params.id]?.numcompte ? 'cell-error' : '';
            },
        },
        {
            field: 'devise',
            headerName: 'DEVISE',
            type: 'text',
            sortable: true,
            flex: 1,
            headerAlign: 'left',
            headerClassName: 'HeaderbackColor',
            disableClickEventBubbling: true,
            editable: true,
            renderCell: (params) => {
                return <div>{params.value}</div>;
            },
            renderEditCell: (params) => (
                <TextField
                    variant="standard"
                    defaultValue={params.value}
                    fullWidth
                    InputProps={{
                        disableUnderline: true,
                    }}
                    sx={{
                        backgroundColor: 'white',
                        border: 'none',
                        outline: 'none',
                        '& .MuiInputBase-input': {
                            padding: '4px 8px',
                            fontSize: '13px',
                            color: '#94A3B8',
                            paddingLeft: '10px'
                        },
                    }}
                    onChange={(e) => {
                        params.api.setEditCellValue({
                            id: params.id,
                            field: params.field,
                            value: e.target.value,
                        });
                    }}
                />
            ),
            cellClassName: (params) => {
                return rowErrors[params.id]?.devise ? 'cell-error' : '';
            },
        },
        {
            field: 'pays',
            headerName: 'PAYS',
            type: 'singleSelect',
            valueOptions: listPays.map((pays) => pays.code),
            sortable: true,
            flex: 0.8,
            headerAlign: 'left',
            headerClassName: 'HeaderbackColor',
            editable: true,
            valueFormatter: (params) => {
                const selectedType = listPays.find((option) => option.code === params.value);
                return selectedType ? selectedType.nompays : params.value;
            },
            renderEditCell: (params) => (
                <Autocomplete
                    fullWidth
                    options={listPays}
                    getOptionLabel={(option) => option.nompays}
                    value={
                        listPays.find((option) => option.nompays === params.value) || null
                    }
                    onChange={(event, newValue) => {
                        params.api.setEditCellValue({
                            id: params.id,
                            field: params.field,
                            value: newValue ? newValue.nompays : "",
                        });
                    }}
                    noOptionsText="Aucun pays trouvé"
                    renderInput={(paramsInput) => (
                        <TextField
                            {...paramsInput}
                            variant="standard"
                            sx={{
                                '& .MuiInputBase-input': {
                                    padding: '4px 8px',
                                    fontSize: '13px',
                                    color: '#94A3B8',
                                    paddingLeft: '10px'
                                },
                                "& .MuiInputBase-root": {
                                    height: 50,
                                },
                            }}
                        />
                    )}
                />
            ),
            cellClassName: (params) => {
                return rowErrors[params.id]?.pays ? 'cell-error' : '';
            },
        },
        {
            field: 'enactivite',
            headerName: 'EN ACTIVITE',
            type: 'boolean',
            sortable: true,
            flex: 0.3,
            headerAlign: 'center',
            headerClassName: 'HeaderbackColor',
            editable: true,
        }
    ];

    const saveRowDomBank = (value) => {
        const payload = { ...value, idDomBank: value.id, idCompte: values.idCompte, idDossier: values.itemId };
        axiosPrivate.post(`/paramCrm/DomBank`, payload).then((response) => {
            const resData = response.data;
            if (resData.state) {
                toast.success(resData.msg);
            } else {
                toast.error(resData.msg);
            }
        });
    }

    const deleteRowDomBank = (id) => {
        axiosPrivate.post(`/paramCrm/DomBankDelete`, { idToDelete: Number(id) }).then((response) => {
            const resData = response.data;
            if (resData.state) {
                toast.success(resData.msg);
            } else {
                toast.error(resData.msg);
            }
        });
    }

    const createNewRow = () => ({
        id: null,
        banque: '',
        numcompte: '',
        devise: '',
        pays: '',
        enactivite: false,
    });

    return (
        <DatagridGlobal
            setFieldValue={setFieldValue}
            list={listDomB}
            setList={setListDomB}
            columnHeader={domBColumnHeader}
            name={'listeDomBank'}
            newRow={createNewRow}
            datagridHeight={dataGridHeight}
            onSaveRow={type === 'modification' ? saveRowDomBank : undefined}
            onDeleteRow={type === 'modification' ? deleteRowDomBank : undefined}
            validateRow={validateRow}
            setRowErrors={setRowErrors}
            withColumnActions={true}
            withAddButton={true}
            verifyCanUpdate={null}
            rowModesModel={rowModesModel}
            setRowModesModel={setRowModesModel}
        />
    )
};

const ConsolidationTabContent = ({ values, setFieldValue, listConsolidation, setListConsolidation, listeDossier, axiosPrivate, type }) => {
    const [editableConsolidation, setEditableConsolidation] = useState(false);
    const [rowErrors, setRowErrors] = useState({});
    const [rowModesModel, setRowModesModel] = useState({});

    const validateRow = (row) => {
        const errors = {};

        if (!row.id_dossier_autre) {
            errors.id_dossier_autre = 'Le dossier est obligatoire';
        }

        return errors;
    };

    const selectedDossierIds = listConsolidation
        .map(val => Number(val.id_dossier_autre))
        .filter(Boolean);

    const getAvailableDossier = (currentId) => {
        return listeDossier.filter(d =>
            !selectedDossierIds.includes(d.id) || d.id === currentId
        );
    };

    const consolidationColumnHeader = [
        {
            field: 'id_dossier_autre',
            headerName: 'Dossier',
            type: 'singleSelect',
            valueOptions: listeDossier.map((dossier) => dossier.id),
            sortable: true,
            flex: 1,
            headerAlign: 'left',
            headerClassName: 'HeaderbackColor',
            editable: true,
            valueFormatter: (params) => {
                const selectedType = listeDossier.find((option) => option.id === params.value);
                return selectedType ? selectedType.dossier : params.value;
            },
            renderEditCell: (params) => {
                const options = getAvailableDossier(params.value);
                return (
                    <Autocomplete
                        fullWidth
                        options={options}
                        getOptionLabel={(option) => option.dossier}
                        isOptionEqualToValue={(option, value) => option.id === value.id}
                        value={
                            options.find((option) => option.id === params.value) || null
                        }
                        onChange={(event, newValue) => {
                            params.api.setEditCellValue({
                                id: params.id,
                                field: params.field,
                                value: newValue ? newValue.id : "",
                            });
                        }}
                        noOptionsText="Aucun pays trouvé"
                        renderInput={(paramsInput) => (
                            <TextField
                                {...paramsInput}
                                variant="standard"
                                sx={{
                                    '& .MuiInputBase-input': {
                                        padding: '4px 8px',
                                        fontSize: '13px',
                                        color: '#94A3B8',
                                        paddingLeft: '10px'
                                    },
                                    "& .MuiInputBase-root": {
                                        height: 50,
                                    },
                                }}
                            />
                        )}
                    />
                )
            },
            renderCell: (params) => {
                const dossier = listeDossier.find(
                    val => val.id === Number(params.value)
                );

                return <div>{dossier?.dossier || ''}</div>;
            },
            cellClassName: (params) => {
                return rowErrors[params.id]?.id_dossier_autre ? 'cell-error' : '';
            },
        },
    ];

    const createNewRow = () => ({
        id: null,
        idDossier: null,
        id_dossier_autre: null
    });

    const saveRowConsolidation = (value) => {
        const payload = { ...value, idConsolidation: value.id, idCompte: values.idCompte, idDossier: values.itemId, idDossierAutre: value.id_dossier_autre };
        axiosPrivate.post('/param/consolidation/addOrUpdateConsolidationDossier', payload)
            .then((response) => {
                if (response?.data?.state) {
                    toast.success(response?.data?.msg);
                } else {
                    toast.error(response?.data?.msg);
                }
            })
    }

    const deleteRowConsolidation = (id) => {
        axiosPrivate.delete(`/param/consolidation/deleteConsolidation/${Number(id)}`)
            .then((response) => {
                const resData = response?.data;
                if (resData?.state) {
                    toast.success(resData?.message);
                } else {
                    toast.error(resData.msg);
                }
            })
    }

    return (
        <DatagridGlobal
            setFieldValue={setFieldValue}
            list={listConsolidation}
            setList={setListConsolidation}
            columnHeader={consolidationColumnHeader}
            name={'listeConsolidation'}
            newRow={createNewRow}
            datagridHeight={dataGridHeight}
            onSaveRow={type === 'modification' ? saveRowConsolidation : undefined}
            onDeleteRow={type === 'modification' ? deleteRowConsolidation : undefined}
            validateRow={validateRow}
            setRowErrors={setRowErrors}
            withColumnActions={true}
            withAddButton={true}
            verifyCanUpdate={null}
            rowModesModel={rowModesModel}
            setRowModesModel={setRowModesModel}
        />
    )
};

export default MainDossier;