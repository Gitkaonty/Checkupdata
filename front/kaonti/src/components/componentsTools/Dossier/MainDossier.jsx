import { useState } from 'react';
import {
    Box, Typography, Stack, Button, Grid, TextField,
    GlobalStyles, Checkbox,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, InputAdornment
} from '@mui/material';
// Icônes
import SaveIcon from '@mui/icons-material/SaveOutlined';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import * as Yup from "yup";
import { Formik, Form } from 'formik';
import toast from 'react-hot-toast';

import { FormikPaveItem } from '../Global/Input/Field';
import { ComptabiliteTabContent, FiscalTabContent, InfoSocieteTabContent } from './Tab';

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
    tauxir: Yup.number().moreThan(0, 'Taper votre taux IR'),
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

const MainDossier = ({ compteId, listePortefeuille, listPays, listModel, listProvinces, listRegions, listDistricts, listCommunes, getListeRegions, getListeDistricts, getListeCommunes, row, type }) => {
    const [activeTab, setActiveTab] = useState('Infos société');
    const tabs = ['Infos société', 'Comptabilité', 'Fiscales', 'Associés', 'Filiales', 'Domiciliations bancaires'];

    const handleSubmitForm = (values) => {
        console.log('Form submitted:', values);
    };

    const InfosNewFileInitialValues = {
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
        listeAssocies: row?.listeAssocies || [],
        listeFiliales: row?.listeFiliales || [],
        listeDomBank: row?.listeDomBank || [],
        immo_amort_base_jours: row?.immo_amort_base_jours || '365',
        portefeuille: row?.portefeuille || [],
        typecomptabilite: row?.typecomptabilite || 'Français',
        devisepardefaut: row?.devisepardefaut || 'MGA',
        consolidation: row?.consolidation ?? false,
        listeConsolidation: row?.listeConsolidation || [],
        pays: row?.pays || '',
        avecMotDePasse: row?.avecMotDePasse ?? false,
        motDePasse: row?.motDePasse || '',
        motDePasseConfirmation: row?.motDePasseConfirmation || ''
    };

    return (
        <Formik
            initialValues={InfosNewFileInitialValues}
            validationSchema={formInfosNewFileValidationSchema}
            onSubmit={handleSubmitForm}
        >
            {({ values, handleChange, handleSubmit, handleBlur, setFieldValue, isValid, setTouched, errors }) => (
                <Form>
                    <Box sx={{ bgcolor: '#F8FAFC', minHeight: '100vh', width: '100%', display: 'flex', flexDirection: 'column' }}>
                        <GlobalStyles styles={{ body: { margin: 0, padding: 0, overflowX: 'hidden', fontFamily: '"Inter", sans-serif' } }} />
                        <Box sx={{ p: 4, width: '100%', boxSizing: 'border-box' }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                                <Typography variant="h5" sx={{ fontWeight: 900, color: '#1E293B', letterSpacing: '-0.02em' }}>
                                    Paramétrages: CRM
                                </Typography>
                                <Button
                                    // type='submit'
                                    onClick={() => {
                                        console.log('mandeha : ');
                                        if (!isValid) {
                                            const touchedFields = Object.keys(errors).reduce((acc, field) => {
                                                acc[field] = true;
                                                return acc;
                                            }, {});

                                            setTouched(touchedFields);

                                            const firstErrorField = fieldOrder.find(
                                                field => errors[field]
                                            );

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
                                {activeTab === 'Infos société' && <InfoSocieteTabContent values={values} handleChange={handleChange} handleBlur={handleBlur} setFieldValue={setFieldValue} listePortefeuille={listePortefeuille} listPays={listPays} listProvinces={listProvinces} listRegions={listRegions} listDistricts={listDistricts} listCommunes={listCommunes} getListeRegions={getListeRegions} getListeDistricts={getListeDistricts} getListeCommunes={getListeCommunes} />}
                                {activeTab === 'Comptabilité' && <ComptabiliteTabContent values={values} handleChange={handleChange} handleBlur={handleBlur} setFieldValue={setFieldValue} listModel={listModel} />}
                                {activeTab === 'Fiscales' && <FiscalTabContent values={values} handleChange={handleChange} handleBlur={handleBlur} setFieldValue={setFieldValue} />}
                                {activeTab === 'Associés' && <AssociatesTabContent values={values} handleChange={handleChange} handleBlur={handleBlur} setFieldValue={setFieldValue} />}
                                {activeTab === 'Filiales' && <FilialeTabContent values={values} handleChange={handleChange} handleBlur={handleBlur} setFieldValue={setFieldValue} />}
                                {activeTab === 'Domiciliations bancaires' && <DomBankTabContent values={values} handleChange={handleChange} handleBlur={handleBlur} setFieldValue={setFieldValue} />}
                            </Box>
                        </Box>
                    </Box>
                </Form>
            )}
        </Formik>
    );
};

const AssociatesTabContent = ({ values, setFieldValue }) => (
    <Stack spacing={2}>
        <Stack direction="row" spacing={2}>
            <FormikPaveItem name="montantcapital" label="CAPITALE" /* unit="€" */ values={values} setFieldValue={setFieldValue} isCurrency />
            <FormikPaveItem name="nbrpart" label="NOMBRE DE PARTS" values={values} setFieldValue={setFieldValue} />
            <FormikPaveItem name="valeurpart" label="VALEUR D'UNE PART" /* unit="€" */ disabled values={values} setFieldValue={setFieldValue} isCurrency />
        </Stack>
        <ListModuleTable type="Associés" />
    </Stack>
);

const FilialeTabContent = () => <ListModuleTable type="Filiales" hasAddButton />;
const DomBankTabContent = () => <ListModuleTable type="Domiciliations bancaires" hasAddButton />;

const ListModuleTable = ({ type, hasAddButton = false }) => (
    <Box sx={{ bgcolor: '#fff', borderRadius: '12px', border: '1px solid #E2E8F0', p: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Stack direction="row" spacing={1}>
                {hasAddButton && <Button startIcon={<AddIcon />} variant="contained" size="small" sx={{ bgcolor: NAV_DARK, borderRadius: '6px', textTransform: 'none' }}>Ajouter</Button>}
                <TextField placeholder="Recherche..." size="small" sx={{ width: '250px', '& .MuiOutlinedInput-root': { borderRadius: '6px', height: '32px', fontSize: '12px' } }}
                    InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18 }} /></InputAdornment> }} />
            </Stack>
        </Stack>
        <TableContainer><Table size="small">
            <TableHead sx={{ bgcolor: '#F8FAFC' }}><TableRow>
                <TableCell padding="checkbox"><Checkbox size="small" /></TableCell>
                <TableCell sx={{ fontWeight: 800, color: '#64748B', fontSize: '11px' }}>NOM / TYPE</TableCell>
                <TableCell sx={{ fontWeight: 800, color: '#64748B', fontSize: '11px' }}>DÉTAILS</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, color: '#64748B', fontSize: '11px' }}>STATUT</TableCell>
            </TableRow></TableHead>
            <TableBody><TableRow><TableCell colSpan={4} sx={{ py: 6, textAlign: 'center', color: '#94A3B8', fontSize: '13px' }}>Aucun(e) {type.toLowerCase()} enregistré(e)</TableCell></TableRow></TableBody>
        </Table></TableContainer>
    </Box>
);

export default MainDossier;