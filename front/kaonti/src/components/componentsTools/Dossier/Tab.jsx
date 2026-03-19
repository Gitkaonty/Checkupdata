import { Box, Divider, Grid, Stack, Typography } from "@mui/material";
import { CompactAccordion } from "./Global";
import BadgeIcon from '@mui/icons-material/BadgeOutlined';
import { FormikAutocomplete, FormikAutocompleteMultiple, FormikCheckbox, FormikRadioGroup, FormikTextField, FormikSelect } from "../Global/Input/Field";
import GavelIcon from '@mui/icons-material/GavelOutlined';
import ContactMailIcon from '@mui/icons-material/ContactMailOutlined';

import { FaTools } from "react-icons/fa";
import { FaIndustry } from "react-icons/fa6";
import { GiMineWagon } from "react-icons/gi";
import { FaHotel } from "react-icons/fa6";
import { MdOutlineTravelExplore } from "react-icons/md";
import { FaTruck } from "react-icons/fa6";
import { VscLinkExternal } from "react-icons/vsc"

const listeFormeJuridique = [
    { id: 'SAPP', libelle: 'SAPP - Société anonyme à participation publique' },
    { id: 'SA', libelle: 'SA - Société anonyme' },
    { id: 'SAS', libelle: 'SAS - Société par action simplifiée' },
    { id: 'SARL', libelle: 'SARL - Société à responsabilité limitée' },
    { id: 'SARLU', libelle: 'SARLU - Société à responsabilité limitée unipersonnel' },
    { id: 'SCS', libelle: 'SCS - Société en commandité simple' },
    { id: 'SNC', libelle: 'SNC - Société en nom collectif' },
    { id: 'SP', libelle: 'SP - Société en participation' },
];

const listeActivite = [
    { id: 'ART', libelle: 'Artisanale', icon: <FaTools style={{ color: 'green' }} /> },
    { id: 'IND', libelle: 'Industrielle', icon: <FaIndustry style={{ color: 'green' }} /> },
    { id: 'MIN', libelle: 'Minière', icon: <GiMineWagon style={{ color: 'green' }} /> },
    { id: 'HOT', libelle: 'Hôtelière', icon: <FaHotel style={{ color: 'green' }} /> },
    { id: 'TOU', libelle: 'Touristique', icon: <MdOutlineTravelExplore style={{ color: 'green' }} /> },
    { id: 'TRA', libelle: 'Transport', icon: <FaTruck style={{ color: 'green' }} /> },
    { id: 'AUT', libelle: 'Autres', icon: <VscLinkExternal style={{ color: 'green' }} /> },
];


const InfoSocieteTabContent = ({ values, setFieldValue, listePortefeuille, listPays, listProvinces, listRegions, listDistricts, listCommunes, getListeRegions, getListeDistricts, getListeCommunes }) => (
    <Stack spacing={1.5}>
        <CompactAccordion
            icon={<BadgeIcon />}
            title="Coordonnées générales"
        >
            <Grid container spacing={1.5}>
                <FormikTextField name="nomdossier" label="Nom du dossier *" width="350px" />
                <FormikTextField name='raisonsociale' label="Raison sociale *" width="450px" />
                <FormikAutocomplete
                    name='pays'
                    label="Pays"
                    type="select"
                    width="350px"
                    options={listPays.map(item => ({
                        value: item.code,
                        label: item.nompays
                    }))}
                    values={values}
                    setFieldValue={setFieldValue}
                />
                {/* <FormikTextField name='pays' label="Pays" type="select" width="180px" /> */}
            </Grid>
            <Grid container spacing={1.5} sx={{ mt: 1 }}>
                <FormikTextField name='denomination' label="Dénomination" width="350px" />
                <FormikTextField name='nif' label="Numéro NIF" width="180px" />
                <FormikTextField name='stat' label="Numéro Statistique" width="180px" />
                <FormikTextField name='rcs' label="Numéro RCS" width="180px" />
            </Grid>
            <Grid container spacing={1.5} sx={{ mt: 1 }}>
                <FormikTextField name='responsable' label="Résponsable" width="350px" />
                <FormikTextField name='expertcomptable' label="Expert comptable" width="350px" />
                <FormikTextField name='cac' label="Commissaires aux comptes" width="350px" />
            </Grid>
            <Grid container spacing={1.5} sx={{ mt: 1 }}>
                <FormikAutocompleteMultiple name='portefeuille' label="Portefeuille" type='select' width="600px" values={values} setFieldValue={setFieldValue} options={listePortefeuille} />
            </Grid>
        </CompactAccordion>

        <CompactAccordion icon={<GavelIcon />} title="Juridique" >
            <Grid container spacing={1.5}>
                <FormikAutocomplete
                    name='forme'
                    label="Forme"
                    type="select"
                    width="440px"
                    options={listeFormeJuridique.map(item => ({
                        value: item.id,
                        label: item.libelle
                    }))}
                    values={values}
                    setFieldValue={setFieldValue}
                />
                <FormikAutocomplete
                    name='activite'
                    label="Activité"
                    type="select"
                    width="250px"
                    options={listeActivite.map(item => ({
                        value: item.id,
                        label: item.libelle,
                        icon: item.icon
                    }))}
                    values={values}
                    setFieldValue={setFieldValue}
                />
                <FormikTextField name='detailsactivite' label="Détails activité" width="380px" />
            </Grid>
        </CompactAccordion>
        <CompactAccordion icon={<ContactMailIcon />} title="Contact" >
            <Grid container spacing={1.5}>
                <FormikTextField name='adresse' label="Adresse" width="250px" />
                <FormikTextField name='email' label="Email" width="350px" />
                <FormikTextField name='telephone' label="Téléphone" width="180px" />
            </Grid>
            <Grid container spacing={1.5} sx={{ mt: 1 }}>
                <FormikAutocomplete
                    name='province'
                    label="Province"
                    type="select"
                    width="300px"
                    options={listProvinces.map(item => ({
                        value: item.name,
                        label: item.name
                    }))}
                    values={values}
                    setFieldValue={(name, value) => {
                        setFieldValue(name, value);
                        setFieldValue('region', '');
                        setFieldValue('district', '');
                        setFieldValue('commune', '');
                        getListeRegions(value);
                    }}
                />
                <FormikAutocomplete
                    name='region'
                    label="Region"
                    type="select"
                    width="300px"
                    options={listRegions.map(item => ({
                        value: item.name,
                        label: item.name
                    }))}
                    values={values}
                    setFieldValue={(name, value) => {
                        const province = values.province;
                        setFieldValue(name, value);
                        setFieldValue('district', '');
                        setFieldValue('commune', '');
                        getListeDistricts(province, value);
                    }}
                />
                <FormikAutocomplete
                    name='district'
                    label="District"
                    type="select"
                    width="300px"
                    options={listDistricts.map(item => ({
                        value: item.name,
                        label: item.name
                    }))}
                    values={values}
                    setFieldValue={(name, value) => {
                        const province = values.province;
                        const region = values.region;
                        setFieldValue(name, value);
                        setFieldValue('commune', '');
                        getListeCommunes(province, region, value);
                    }}
                />
                <FormikAutocomplete
                    name='commune'
                    label="Commune"
                    type="select"
                    width="300px"
                    options={listCommunes.map(item => ({
                        value: item.name,
                        label: item.name
                    }))}
                    values={values}
                    setFieldValue={setFieldValue}
                />
            </Grid>
        </CompactAccordion>
        <CompactAccordion icon={<ContactMailIcon />} title="Sécurité" >
            <Grid item sx={{ display: 'flex', alignItems: 'flex-end', pb: 0.5 }}>
                <FormikCheckbox name="avecMotDePasse" label="Avec mot de passe" />
            </Grid>
            <Grid container spacing={1.5}>
                <FormikTextField name='motDePasse' label="Mot de passe *" width="250px" disabled={!values.avecMotDePasse} />
                <FormikTextField name='motDePasseConfirmation' label="Confirmation du mot de passe *" width="250px" disabled={!values.avecMotDePasse} />
            </Grid>
        </CompactAccordion>
    </Stack>
);

const ComptabiliteTabContent = ({ listModel, values, setFieldValue, type }) => (
    <Box sx={{ bgcolor: '#fff', borderRadius: '12px', border: '1px solid #E2E8F0', p: 4 }}>
        <Grid container spacing={1.5}>
            <Grid item xs={12}><Typography sx={{ fontWeight: 800, color: '#1E293B', fontSize: '14px', mb: 2 }}>Général</Typography></Grid>
            <FormikAutocomplete
                name='plancomptable'
                label="Plan comptable"
                type="select"
                width="250px"
                options={listModel.map(item => ({
                    value: item.id,
                    label: item.nom
                }))}
                values={values}
                setFieldValue={setFieldValue}
            />
            <Grid item sx={{ ml: 2, display: 'flex', alignItems: 'flex-end', pb: 0 }}>
                <Stack direction="row" spacing={1}>
                    <FormikCheckbox name="consolidation" label="Consolidation" />
                    <FormikCheckbox name="avecanalytique" label="Avec analytique" />
                </Stack>
            </Grid>

            <Grid item xs={12}><Divider sx={{ borderStyle: 'dashed', my: 1.5, opacity: 0.4, mt: -5 }} /></Grid>
            <FormikTextField type='number' name='longueurcptstd' label="Compte standard" width="140px" inputProps={{ min: 1, max: 50 }} />
            <FormikTextField type='number' name='longueurcptaux' label="Compte auxiliaire" width="140px" inputProps={{ min: 1, max: 50 }} />

            {
                type === 'modification' && (
                    <>
                        <Grid item xs={12}><Divider sx={{ borderStyle: 'dashed', my: 1.5, opacity: 0.4, mt: -5 }} /></Grid>
                        <FormikAutocomplete
                            name='plancomptable'
                            label="Devise par défaut"
                            type="select"
                            width="250px"
                            options={listModel.map(item => ({
                                value: item.id,
                                label: item.nom
                            }))}
                            values={values}
                            setFieldValue={setFieldValue}
                        />
                    </>
                )
            }

            <Grid item xs={12}><Divider sx={{ borderStyle: 'dashed', my: 1.5, opacity: 0.4, mt: -5 }} /></Grid>
            <Grid item >
                {
                    type === 'ajout' && (
                        <>
                            <Typography sx={{ fontSize: '10px', fontWeight: 800, color: '#94A3B8', mb: 0.5, textTransform: 'uppercase' }}>Dévise par défaut</Typography>
                            <FormikRadioGroup
                                name="devisepardefaut"
                                row
                                options={[
                                    { value: 'MGA', label: 'MGA' },
                                    { value: 'Autres', label: 'Autres' }
                                ]}
                            />
                        </>
                    )
                }
            </Grid>
            <Grid item >
                <Typography sx={{ fontSize: '10px', fontWeight: 800, color: '#94A3B8', mb: 0.5, textTransform: 'uppercase' }}>Système de tenue</Typography>
                <FormikRadioGroup
                    name="typecomptabilite"
                    row
                    options={[
                        { value: 'Français', label: 'Français' },
                        { value: 'Autres', label: 'Autres' }
                    ]}
                />
            </Grid>
            <Grid item >
                <Typography sx={{ fontSize: '10px', fontWeight: 800, color: '#94A3B8', mb: 0.5, textTransform: 'uppercase' }}>Base de calcul de l'amort</Typography>
                <FormikRadioGroup
                    name="immo_amort_base_jours"
                    row
                    options={[
                        { value: '365', label: '365' },
                        { value: '360', label: '360' }
                    ]}
                />
            </Grid>
        </Grid>
    </Box>
);

const FiscalTabContent = () => (
    <Box sx={{ bgcolor: '#fff', borderRadius: '12px', border: '1px solid #E2E8F0', p: 4 }}>
        <Grid container spacing={1.5}>
            <Grid item xs={12}><Typography sx={{ fontWeight: 800, color: '#1E293B', fontSize: '14px', mb: 1 }}>Impôt sur le revenu (IR)</Typography></Grid>
            <Grid item xs={12}>
                <Typography sx={{ fontSize: '10px', fontWeight: 800, color: '#94A3B8', mb: 0.5, textTransform: 'uppercase' }}>Type de centre fiscal</Typography>
                <FormikRadioGroup
                    name="centrefisc"
                    row
                    options={[
                        { value: 'DGE', label: 'DGE' },
                        { value: 'CFISC', label: 'Centre fiscale' }
                    ]}
                />
            </Grid>
            <FormikTextField name='tauxir' type='number' inputProps={{ min: 1, max: 50 }} label="Taux IR" width="120px" />
            <Grid item xs={12}><Divider sx={{ borderStyle: 'dashed', my: 1.5, opacity: 0.4 }} /></Grid>
            <Grid item xs={12}><Typography sx={{ fontWeight: 800, color: '#1E293B', fontSize: '14px', mb: 0, mt: -3 }}>Paramétrages minimum de perception</Typography></Grid>
            <FormikTextField name='pourcentageca' type='number' inputProps={{ min: 0, max: 50 }} label="Pourcentage CA" width="150px" />
            <FormikTextField name='montantmin' label="Montant min" type='number' inputProps={{ min: 0, max: 50 }} width="150px" />
            <Grid item xs={12}><Typography sx={{ fontWeight: 800, color: '#1E293B', fontSize: '14px', mb: 0, mt: 1 }}>Impôt synthétique intermittent (ISI)</Typography></Grid>
            <FormikTextField name='compteisi' inputProps={{ min: 0, max: 50 }} label="Compte ISI" width="120px" />
            <Grid item xs={12}><Divider sx={{ borderStyle: 'dashed', my: 1.5, opacity: 0.4, mb: 0, mt: -2 }} /></Grid>
            <Grid item xs={12}><Typography sx={{ fontWeight: 800, color: '#1E293B', fontSize: '14px', mb: 1, mb: -1, mt: -0 }}>Taxe sur la valeur ajoutée (TVA)</Typography></Grid>
            <Grid item xs={12}>
                <FormikCheckbox name="assujettitva" label="Assujettie à la TVA" />
            </Grid>
        </Grid>
    </Box>
);

export { InfoSocieteTabContent, ComptabiliteTabContent, FiscalTabContent }