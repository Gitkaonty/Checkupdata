// import { useState, useEffect } from 'react';
// import {
//     Typography, Stack, Paper, RadioGroup, FormControlLabel, Radio, FormControl,
//     InputLabel, Select, MenuItem, TextField, Box, Tab,
//     FormHelperText, Autocomplete
// } from '@mui/material';
// import Button from '@mui/material/Button';
// import Tooltip from '@mui/material/Tooltip';
// import { init } from '../../../../../init';
// import axios from '../../../../../config/axios';
// import toast from 'react-hot-toast';
// import { DataGrid, frFR } from '@mui/x-data-grid';
// import { styled } from '@mui/material/styles';
// import Dialog from '@mui/material/Dialog';
// import DialogTitle from '@mui/material/DialogTitle';
// import DialogContent from '@mui/material/DialogContent';
// import DialogActions from '@mui/material/DialogActions';
// import IconButton from '@mui/material/IconButton';
// import CloseIcon from '@mui/icons-material/Close';
// import { TabContext, TabList, TabPanel } from '@mui/lab';
// import { IoMdTrash } from "react-icons/io";
// import { TbPlaylistAdd } from "react-icons/tb";
// import { FaRegPenToSquare } from "react-icons/fa6";
// import ParamPCModele_column from './ParamPCModele_column';
// import { useFormik, Field, Formik, Form, ErrorMessage } from 'formik';
// import * as Yup from "yup";
// import useAuth from '../../../../hooks/useAuth';
// import { jwtDecode } from 'jwt-decode';
// import QuickFilter from '../../../componentsTools/DatagridToolsStyle';
// import { DataGridStyle } from '../../../componentsTools/DatagridToolsStyle';
// import PopupConfirmDelete from '../../../componentsTools/popupConfirmDelete';
// import PopupImportModelePlanComptable from '../../administration/import/PopupImportModelePlanComptable';
// import { format } from 'date-fns';
// import { DetailsInformation } from '../../../componentsTools/DetailsInformation';
// import usePermission from '../../../../hooks/usePermission';
// import useAxiosPrivate from '../../../../../config/axiosPrivate';

// const BootstrapDialog = styled(Dialog)(({ theme }) => ({
//     '& .MuiDialogContent-root': {
//         padding: theme.spacing(2),
//     },
//     '& .MuiDialogActions-root': {
//         padding: theme.spacing(1),
//     },
// }));

// //header pour le tableau liste de modèle
// const columnHeaderModel = ParamPCModele_column.columnHeaderModel;

// //header pour le tableau détail - sera initialisé dans le composant

// //header pour le tableau ajouter compte de charge et/ou compte de TVA dans le popup
// const columnHeaderAddNewRowModelDetail = ParamPCModele_column.columnHeaderAddNewRowModelDetail;

// export default function ParamPlanComptableModele() {
//     const { canAdd, canModify, canDelete, canView } = usePermission();
//     const axiosPrivate = useAxiosPrivate();

//     let initial = init[0];
//     const { auth } = useAuth();

//     let [listeModele, setListeModele] = useState([]);
//     const [openNewModel, setOpenNewModel] = useState(false);
//     const [modeleLibre, setModeleLibre] = useState(true);
//     const [listDossier, setListeDossier] = useState([]);
//     const [openImportDialog, setOpenImportDialog] = useState(false);

//     const [openDialogDeleteModel, setOpenDialogDeleteModel] = useState(false);
//     const [modelSelectedRow, setModelSelectedRow] = useState(null);
//     const [selectedModelName, setSelectedModelName] = useState(null);
//     const [modelId, setModelId] = useState(null);

//     const [detailModel, setDetailModel] = useState([]);
//     const [detailModelSelectedRow, setDetailModelSelectedRow] = useState([]);
//     const [detailModelSelectedRowListChgAssoc, setDetailModelSelectedRowListChgAssoc] = useState([]);
//     const [detailModelSelectedRowListTvaAssoc, setDetailModelSelectedRowListTvaAssoc] = useState([]);
//     const [openDialogAddModelDetail, setOpenDialogAddModelDetail] = useState(false);

//     const [listCptChg, setListCptChg] = useState([]);
//     const [listCptTva, setListCptTva] = useState([]);

//     const [tabValueAjoutNewRowModelDetail, setTabValueAjoutNewRowModelDetail] = useState("1");

//     const [openDialogAddNewCptModelDetail, setOpenDialogAddNewCptModelDetail] = useState(false);
//     const [pcHorsCollectif, setPcHorsCollectif] = useState([]);
//     const [selectedCptAssocChg, setSelectedCptAssocChg] = useState({ idCpt: 0, compte: '', libelle: '' });
//     const [selectedCptChgOnList, setSelectedCptChgOnList] = useState(0);
//     let [openDialogDeleteCptChgFromAddNewCpt, setOpenDialogDeleteCptChgFromAddNewCpt] = useState(false);

//     const [openDialogAddNewCptTvaModelDetail, setOpenDialogAddNewCptTvaModelDetail] = useState(false);
//     const [pcOnlyCptTva, setPcOnlyCptTva] = useState([]);
//     const [selectedCptAssocTva, setSelectedCptAssocTva] = useState({ idCpt: 0, compte: '', libelle: '' });
//     const [selectedCptTvaOnList, setSelectedCptTvaOnList] = useState(0);
//     const [openDialogDeleteCptTvaFromAddNewCpt, setOpenDialogDeleteCptTvaFromAddNewCpt] = useState(false);
//     const [formulaireTier, setFormulaireTier] = useState('sans-nif');
//     const [typeCptGeneral, setTypeCptGeneral] = useState(true);
//     const [pcAllselectedRow, setPcAllselectedRow] = useState([]);
//     const [openDialogDeleteItemsPc, setOpenDialogDeleteItemsPc] = useState(false);
//     const [listeCptCollectif, setListeCptCollectif] = useState([]);
//     const [disableLocalites, setDisableLocalites] = useState(false);
//     const [disableTypeTiers, setDisableTypeTiers] = useState(true);



//     const [provinces, setProvinces] = useState([]);
//     const [regions, setRegions] = useState([]);
//     const [districts, setDistricts] = useState([]);
//     const [communes, setCommunes] = useState([]);

//     const [selectedProvince, setSelectedProvince] = useState('');
//     const [selectedRegion, setSelectedRegion] = useState('');
//     const [selectedDistrict, setSelectedDistrict] = useState('');
//     const [selectedCommune, setSelectedCommune] = useState('');
//     const [rowCptInfos, setRowCptInfos] = useState([]);
//     const [openInfos, setOpenInfos] = useState(false);


//     //paramètres de connexion------------------------------------
//     const decoded = auth?.accessToken
//         ? jwtDecode(auth.accessToken)
//         : undefined
//     const compteId = decoded.UserInfo.compteId || 0;
//     const userId = decoded.UserInfo.userId || 0;

//     //Récupération de la liste des modèles de plan comptable
//     const GetListePlanComptableModele = () => {
//         axios.post(`/paramPlanComptableModele/model`, { compteId, userId }).then((response) => {
//             const resData = response.data;
//             setListeModele(resData.modelList);
//         })
//     }

//     useEffect(() => {
//         if (canView) {
//             GetListePlanComptableModele();
//         }
//     }, [compteId]);

//     //AJOUT D'UN NOUVEAU MODELE DE PLAN COMPTABLE
//     const saveModelePcValue = (e) => {
//         formNewModel.setFieldValue('model', e);

//         if (e === 'modeleLibre') {
//             setModeleLibre(true);
//         } else {
//             setModeleLibre(false);
//         }
//     }

//     //Récupérer la liste des dossiers associés au comptes de l'utilisateur
//     const GetListeDossier = () => {
//         axios.post(`/paramPlanComptableModele/dossier`, { compteId, userId }).then((response) => {
//             const resData = response.data;
//             setListeDossier(resData.dossierList);
//         })
//     }

//     const handleClickOpenNewModel = () => {
//         GetListeDossier();
//         setOpenNewModel(true);
//     };
//     const handleCloseNewModel = () => {
//         setOpenNewModel(false);
//     };

//     const formNewModel = useFormik({
//         initialValues: {
//             compteId: compteId,
//             model: '',
//             id_dossier: 0,
//             model_name: null,
//         },
//         validationSchema: Yup.object({
//             model: Yup.string().required("Choisir un modèle"),
//             id_dossier: Yup.mixed()
//                 .when('model', {
//                     is: (value) => value !== 'modeleLibre',
//                     then: () => Yup.number().moreThan(0, 'Sélectionner un dossier dans la liste'),
//                     otherwise: () => Yup.number().notRequired(),
//                 }),

//             model_name: Yup.string().required("Veuillez taper un nom pour le modèle")
//                 .min(1, 'Veuillez ajouter au moin un caractère pour le nom du modèle')
//         }),
//         onSubmit: (values) => {
//             axiosPrivate.post(`/paramPlanComptableModele/createModel`, values).then((response) => {
//                 const resData = response.data;
//                 GetListePlanComptableModele();
//                 handleCloseNewModel();
//                 toast.success(resData);
//             })
//         }
//     });

//     //Suppression d'un modèle de plan comptable
//     const deleteModelPC = (value) => {
//         if (value === true) {

//             if (modelId !== null) {
//                 const rowId = modelSelectedRow.id;
//                 if (modelSelectedRow.pardefault) {
//                     toast.error("Vous ne pouvez pas supprimer un modèle plan comptable natif de kaonty.");
//                 } else {
//                     axiosPrivate.post(`/paramPlanComptableModele/deleteModel`, { rowId }).then((response) => {
//                         const resData = response.data;
//                         GetListePlanComptableModele();
//                         setOpenDialogDeleteModel(false);
//                         toast.success(resData);
//                     })
//                 }

//             } else {
//                 toast.error("Veuillez sélectionner un seul modèle de plan comptable dans le tableau liste modèle.");
//             }

//         } else {
//             setOpenDialogDeleteModel(false);
//         }
//     }

//     const handleClickOpenDialogDeleteModel = () => {
//         setOpenDialogDeleteModel(true);
//     }

//     //Récupération de l'ID de la ligne sélectionner dans le tableau de la liste de modèle
//     const listModelPCSelectedRow = (selectedRow) => {
//         if (selectedRow.length === 1) {
//             const itemId = selectedRow[0];
//             const itemInfos = listeModele.find(row => row.id === itemId);

//             if (itemInfos) {
//                 setModelSelectedRow(itemInfos);
//                 setSelectedModelName(itemInfos.nom);
//                 setModelId(itemId);
//             } else {
//                 setModelSelectedRow([]);
//                 setSelectedModelName('');
//                 setModelId(null);
//             }

//             if (itemId !== null) {
//                 showModelDetail(itemId);
//             } else {
//                 showModelDetail([]);
//             }
//         } else {
//             setModelSelectedRow([]);
//             setSelectedModelName('');
//             setModelId(null);
//             showModelDetail([]);
//         }
//     }

//     //Affichage détails du modèle
//     const showModelDetail = (rowId) => {
//         axios.post(`/paramPlanComptableModele/detailModel`, { rowId }).then((response) => {
//             const resData = response.data;
//             setDetailModel(resData.modelDetail);
//         })
//     }

//     //Ajouter un compte dans la liste du plan comptable

//     const handleCloseDialogDetailModelAdd = () => {
//         setOpenDialogAddModelDetail(false);
//     }

//     const handleOpenDialogDetailModelAdd = (setFieldValue, resetForm) => () => {
//         if (modelId !== null) {
//             resetForm();
//             setListCptChg([]);
//             setListCptTva([]);

//             // Option A: reset local selections and dependent lists on open
//             setSelectedProvince('');
//             setSelectedRegion('');
//             setSelectedDistrict('');
//             setSelectedCommune('');
//             setRegions([]);
//             setDistricts([]);
//             setCommunes([]);
//             setFieldValue("action", "new");
//             setFieldValue("idCompte", Number(compteId));


//             setFieldValue("action", "new");
//             setFieldValue("idCompte", Number(compteId));
//             setFieldValue("idModele", modelId);

//             setFormulaireTier('sans-nif');
//             recupererListeCptCollectif();
//             setTypeCptGeneral(true);
//             setDisableTypeTiers(true); // Désactiver Type Tiers par défaut (nature = General)

//             setFieldValue('typeTier', 'general');
//             setFormulaireTier('general');
//             setDisableLocalites(true);

//             // Garder le champ 'Type du tier' actif
//             setFieldValue('typeTier', 'general');
//             setFormulaireTier('general');


//             setOpenDialogAddModelDetail(true);
//         } else {
//             toast.error("Veuillez sélectionner un seul modèle de plan comptable.");
//         }
//     }

//     //gestion tableau ajout compte de TVA associé au nouveau compte à créer
//     const recupererListeCptCollectif = () => {
//         const result = detailModel?.filter(item => item.nature === 'Collectif');
//         setListeCptCollectif(result);
//     }

//     const handleOpenDialogDetailModelModify = (setFieldValue) => () => {
//         recupererListeCptCollectif();

//         setFieldValue("action", "modify");
//         setFieldValue("itemId", detailModelSelectedRow.id);
//         setFieldValue("idCompte", Number(compteId));
//         setFieldValue("idModele", modelId);
//         setFieldValue("compte", detailModelSelectedRow.compte);
//         setFieldValue("libelle", detailModelSelectedRow.libelle);
//         setFieldValue("nature", detailModelSelectedRow.nature);
//         // En modification: si General/Collectif, la base = le compte lui-même (id);
//         // sinon (Aux), on garde la base existante (baseaux_id)
//         if (detailModelSelectedRow.nature === 'General' || detailModelSelectedRow.nature === 'Collectif') {
//             setFieldValue("baseCptCollectif", detailModelSelectedRow.id);
//         } else {
//             // Use the base account ID so it matches the Select's MenuItem values (which use item.id)
//             setFieldValue("baseCptCollectif", detailModelSelectedRow.baseaux_id);
//         }
//         const isGen = detailModelSelectedRow.nature === 'General' || detailModelSelectedRow.nature === 'Collectif';
//         const isEtr = detailModelSelectedRow.typetier === 'etranger';

//         if (isGen) {
//             // En modification: General/Collectif => type du tier forcé à 'general' et localités grisées
//             setFieldValue("typeTier", 'general');
//             setFormulaireTier('general');
//             setDisableLocalites(true);
//         } else {
//             // Sinon, on garde le type du tier de la ligne et on grise les localités si 'etranger'
//             setFieldValue("typeTier", detailModelSelectedRow.typetier);
//             setFormulaireTier(detailModelSelectedRow.typetier);
//             setDisableLocalites(isEtr);
//         }

//         setFieldValue("nif", detailModelSelectedRow.nif);
//         setFieldValue("stat", detailModelSelectedRow.statistique);
//         setFieldValue("adresse", detailModelSelectedRow.adresse);
//         setFieldValue("motcle", detailModelSelectedRow.motcle);
//         setFieldValue("cin", detailModelSelectedRow.cin);
//         setFieldValue("dateCin", detailModelSelectedRow.datecin ? format(detailModelSelectedRow?.datecin, 'yyyy-MM-dd') : null);
//         setFieldValue("autrePieceID", detailModelSelectedRow.autrepieceid);
//         setFieldValue("refPieceID", detailModelSelectedRow.refpieceid);
//         setFieldValue("adresseSansNIF", detailModelSelectedRow.adressesansnif);
//         setFieldValue("nifRepresentant", detailModelSelectedRow.nifrepresentant);
//         setFieldValue("adresseEtranger", detailModelSelectedRow.adresseetranger);
//         setFieldValue("pays", detailModelSelectedRow.pays);

//         setFieldValue("listeCptChg", listCptChg);
//         setFieldValue("listeCptTva", listCptTva);

//         setFieldValue("province", detailModelSelectedRow.province);
//         setFieldValue("region", detailModelSelectedRow.region);
//         setFieldValue("district", detailModelSelectedRow.district);
//         setFieldValue("commune", detailModelSelectedRow.commune);


//         //Activer ou non la listbox base compte auxiliaire et Type Tiers
//         if (detailModelSelectedRow.nature === 'General' || detailModelSelectedRow.nature === 'Collectif') {
//             setTypeCptGeneral(true);
//             setDisableTypeTiers(true); // Désactiver Type Tiers pour General/Collectif
//         } else {
//             setTypeCptGeneral(false);
//             setDisableTypeTiers(false); // Activer Type Tiers pour Auxiliaire
//         }

//         setOpenDialogAddModelDetail(true);
//     }

//     //Choix TAB value pour dialog ajout de nouvelle ligne du tableau détail modèle plan comptable
//     const handleChangeTabValueAjoutNewRowModelDetail = (event, newValue) => {
//         setTabValueAjoutNewRowModelDetail(newValue);
//     };
//     // Normalise: supprime espaces/points/tirets, trim, majuscules
//     const normalizeCompte = (v) =>
//         (v || '')
//             .toString()
//             .toUpperCase()
//             .replace(/[\s\.\-]/g, '')
//             .trim();

//     const formAddCptModelInitialValues = {
//         action: 'new',
//         itemId: 0,
//         idCompte: 0,
//         idModele: 0,
//         compte: '',
//         libelle: '',
//         nature: 'General',
//         baseCptCollectif: 0,
//         typeTier: 'sans-nif',
//         nif: '',
//         stat: '',
//         adresse: '',
//         motcle: '',
//         cin: '',
//         dateCin: '',
//         autrePieceID: '',
//         refPieceID: '',
//         adresseSansNIF: '',
//         nifRepresentant: '',
//         adresseEtranger: '',
//         pays: '',
//         province: '',
//         region: '',
//         district: '',
//         commune: '',
//         listeCptChg: [],
//         listeCptTva: [],
//     };

//     const formAddCptModelValidationSchema = Yup.object({
//         compte: Yup.string()
//             .required("Veuillez tapez un numéro de compte")
//             .test('unique-compte', 'Ce compte existe déjà', function (value) {
//                 const list = Array.isArray(detailModel) ? detailModel : [];
//                 const v = normalizeCompte(value);

//                 const action = this.parent?.action;   // 'new' | 'modify'
//                 const itemId = Number(this.parent?.itemId);

//                 if (!v) return false;

//                 // En modification: autoriser si la valeur n'a pas changé
//                 if (action === 'modify') {
//                     const current = list.find(r => Number(r.id) === itemId)?.compte;
//                     if (normalizeCompte(current) === v) return true;
//                 }

//                 // En création (ou compte modifié): bloquer si existe déjà
//                 const exists = list.some(r => Number(r.id) !== itemId && normalizeCompte(r.compte) === v);
//                 return !exists;
//             }),
//         libelle: Yup.string().required("Veuillez insérer un libellé pour le numéro de compte"),
//         nature: Yup.string().required("Veuillez séléctionner dans la liste la nature du compte"),
//         baseCptCollectif: Yup.number()
//             .when('nature', {
//                 is: (value) => value === 'Aux',
//                 then: () => Yup.number().typeError("Veuillez entrer un nombre")
//                     .moreThan(0, "Veuillez ajouter la base du compte collectif")
//                     .required("Ce champ est requis"),
//                 otherwise: () => Yup.number().notRequired(),
//             }),
//         nif: Yup.string()
//             .when('typeTier', {
//                 is: (value) => value === 'avec-nif',
//                 then: () => Yup.string().required("Veuillez ajouter le numéro NIF du tier").min(10, 'Veuillez bien formater le numéro NIF'),
//                 otherwise: () => Yup.string().notRequired(),
//             }),
//         dateCin: Yup.string()
//             .when('typeTier', {
//                 is: (value) => value === 'sans-nif',
//                 then: () => Yup.string()
//                     .matches(
//                         /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/, // = format du back pour la datapicker yyyy-MM-dd
//                         'La date doit être au format jj/mm/aaaa'
//                     )
//                     .test('is-valid-date', 'La date doit être valide', (value) => {
//                         if (!value) return false;

//                         const [year, month, day] = value.split('-').map(Number);

//                         // Vérifie les mois
//                         if (month < 1 || month > 12) return false;

//                         // Vérifie les jours en fonction du mois
//                         const daysInMonth = new Date(year, month, 0).getDate();
//                         return day >= 1 && day <= daysInMonth;
//                     }).required('La date est requise'),
//                 otherwise: () => Yup.string().notRequired(),
//             }),
//         nifRepresentant: Yup.string()
//             .when('typeTier', {
//                 is: (value) => value === 'etranger',
//                 then: () => Yup.string().required("Veuillez ajouter le numéro NIF du tier").min(10, 'Veuillez bien formater le numéro NIF'),
//                 otherwise: () => Yup.string().notRequired(),
//             }),
//         province: Yup.string()
//             .when(['nature', 'typeTier'], {
//                 is: (nature, typeTier) => nature === 'General' || nature === 'Collectif' || typeTier === 'etranger',
//                 then: () => Yup.string().notRequired(),
//                 otherwise: () => Yup.string().required("Veuillez sélectionner une province"),
//             }),
//         region: Yup.string()
//             .when(['nature', 'typeTier'], {
//                 is: (nature, typeTier) => nature === 'General' || nature === 'Collectif' || typeTier === 'etranger',
//                 then: () => Yup.string().notRequired(),
//                 otherwise: () => Yup.string().required("Veuillez sélectionner une région"),
//             }),
//         district: Yup.string()
//             .when(['nature', 'typeTier'], {
//                 is: (nature, typeTier) => nature === 'General' || nature === 'Collectif' || typeTier === 'etranger',
//                 then: () => Yup.string().notRequired(),
//                 otherwise: () => Yup.string().required("Veuillez sélectionner un district"),
//             }),
//         commune: Yup.string()
//             .when(['nature', 'typeTier'], {
//                 is: (nature, typeTier) => nature === 'General' || nature === 'Collectif' || typeTier === 'etranger',
//                 then: () => Yup.string().notRequired(),
//                 otherwise: () => Yup.string().required("Veuillez sélectionner une commune"),
//             }),
//     });

//     const formAddCptModelhandleSubmit = (values) => {
//         if (modelSelectedRow.pardefault) {
//             toast.error("Vous ne pouvez pas modifier les comptes associés au modèle de plan comptable natif de kaonty.");
//         } else {
//             axiosPrivate.post(`/paramPlanComptableModele/AddCptTodetailModel`, values).then((response) => {
//                 const resData = response.data;
//                 if (resData.state === true) {
//                     showModelDetail(modelId);
//                     toast.success(resData.msg);
//                 } else {
//                     toast.error(resData.msg);
//                 }
//                 setOpenDialogAddModelDetail(false);
//             })
//         }
//     }

//     const getProvinces = async () => {
//         try {
//             const response = await axios.get('/paramPlanComptable/getProvinces');
//             return response.data;
//         } catch (error) {
//             console.error('Erreur fetchProvinces:', error);
//             return [];
//         }
//     }

//     const getRegions = async (province) => {
//         if (!province) return [];
//         try {
//             const response = await axios.get(`/paramPlanComptable/getRegions/${province}`);
//             return response.data;
//         } catch (error) {
//             console.error('Erreur fetchRegions:', error);
//             return [];
//         }
//     }

//     const getDistricts = async (province, region) => {
//         if (!province || !region) return [];
//         try {
//             const response = await axios.get(`/paramPlanComptable/getDistricts/${province}/${region}`);
//             return response.data;
//         } catch (error) {
//             console.error('Erreur fetchDistricts:', error);
//             return [];
//         }
//     }

//     const getCommunes = async (province, region, district) => {
//         if (!province || !region || !district) return [];
//         try {
//             const response = await axios.get(`/paramPlanComptable/getCommunes/${province}/${region}/${district}`);
//             return response.data;
//         } catch (error) {
//             console.error('Erreur fetchCommunes:', error);
//             return [];
//         }
//     }
//     // Charger les provinces
//     useEffect(() => {
//         getProvinces().then(setProvinces);
//     }, []);

//     // Charger les régions quand la province change, mais ne pas réinitialiser si on a déjà une région sélectionnée
//     useEffect(() => {
//         if (selectedProvince) {
//             getRegions(selectedProvince).then((data) => setRegions(data));

//             // Ne réinitialise que si on est en création (pas de selectedRegion)
//             if (!selectedRegion) setSelectedRegion('');
//             if (!selectedDistrict) setDistricts([]);
//             if (!selectedDistrict) setSelectedDistrict('');
//             if (!selectedCommune) setCommunes([]);
//             if (!selectedCommune) setSelectedCommune('');
//         } else {
//             setRegions([]);
//             setSelectedRegion('');
//             setDistricts([]);
//             setSelectedDistrict('');
//             setCommunes([]);
//             setSelectedCommune('');
//         }
//     }, [selectedProvince]);

//     // Charger les districts quand la région change, idem
//     useEffect(() => {
//         if (selectedProvince && selectedRegion) {
//             getDistricts(selectedProvince, selectedRegion).then((data) => setDistricts(data));

//             if (!selectedDistrict) setSelectedDistrict('');
//             if (!selectedCommune) setCommunes([]);
//             if (!selectedCommune) setSelectedCommune('');
//         } else {
//             setDistricts([]);
//             setSelectedDistrict('');
//             setCommunes([]);
//             setSelectedCommune('');
//         }
//     }, [selectedProvince, selectedRegion]);

//     // Charger les communes quand le district change
//     useEffect(() => {
//         if (selectedProvince && selectedRegion && selectedDistrict) {
//             getCommunes(selectedProvince, selectedRegion, selectedDistrict).then((data) => setCommunes(data));
//         } else {
//             setCommunes([]);
//             setSelectedCommune('');
//         }
//     }, [selectedProvince, selectedRegion, selectedDistrict]);

//     // Remplissage automatique pour les localites
//     useEffect(() => {
//         if (detailModelSelectedRow) {
//             setSelectedProvince(detailModelSelectedRow.province);
//             setSelectedRegion(detailModelSelectedRow.region);
//             setSelectedDistrict(detailModelSelectedRow.district);
//             setSelectedCommune(detailModelSelectedRow.commune);
//         }
//     }, [detailModelSelectedRow])

//     //Action pour disable ou enable base compte collectif dans le formulaire nouveau compte pour le modèle
//     const handleChangeListBoxNature = (setFieldValue) => (e) => {
//         const value = e.target.value;
//         setFieldValue('nature', value)
//         if (value === 'General' || value === 'Collectif') {
//             setTypeCptGeneral(true);
//             setDisableTypeTiers(true); // Désactiver le champ Type Tiers
//             // En MODIFICATION, forcer la base à l'ID du compte
//             if (detailModelSelectedRow && detailModelSelectedRow.id) {
//                 setFieldValue('baseCptCollectif', detailModelSelectedRow.id);
//             }
//             // Si Nature = General OU Collectif, mettre Type du Tier = general et griser les localités
//             setFieldValue('typeTier', 'general');
//             setFormulaireTier('general');
//             setDisableLocalites(true);
//             // Réinitialiser les localités
//             setFieldValue('province', '');
//             setFieldValue('region', '');
//             setFieldValue('district', '');
//             setFieldValue('commune', '');
//             setSelectedProvince('');
//             setSelectedRegion('');
//             setSelectedDistrict('');
//             setSelectedCommune('');
//         } else {
//             setTypeCptGeneral(false);
//             setDisableTypeTiers(false); // Activer le champ Type Tiers
//             setDisableLocalites(false);
//             // En MODIFICATION, si retour à Aux, reprendre la base existante
//             if (detailModelSelectedRow && detailModelSelectedRow.baseaux_id) {
//                 setFieldValue('baseCptCollectif', detailModelSelectedRow.baseaux_id);
//             }
//         }
//     }

//     //Action pour sauvegarder le choix base compte auxiliaire
//     const handleChangeListBoxBaseCompteAux = (setFieldValue) => (e) => {
//         const value = e.target.value;
//         setFieldValue('baseCptCollectif', value)
//     }

//     //gestion tableau ajout compte de charge associé au nouveau compte à créer
//     const handleOpenDialogAddNewCptModelDetail = () => {
//         const result = detailModel?.filter((item) => item.nature === 'General');
//         setPcHorsCollectif(result);
//         setOpenDialogAddNewCptModelDetail(true);
//     }

//     const handleCloseDialogAddNewCptModelDetail = () => {
//         setOpenDialogAddNewCptModelDetail(false);
//     }

//     const saveCptChg = (cpt_id) => {
//         const libelle = detailModel?.find((item) => item.id === cpt_id);
//         setSelectedCptAssocChg({ idCpt: cpt_id, compte: libelle.compte, libelle: libelle.libelle });
//     }

//     const AddCptToTableCptChg = (setFieldValue) => () => {
//         let interm = [...listCptChg];
//         interm.push({ id: listCptChg.length + 1, idCpt: selectedCptAssocChg.idCpt, compte: selectedCptAssocChg.compte, libelle: selectedCptAssocChg.libelle });
//         setListCptChg(interm);

//         const newRow = { id: listCptChg.length + 1, idCpt: selectedCptAssocChg.idCpt, compte: selectedCptAssocChg.compte, libelle: selectedCptAssocChg.libelle };

//         setFieldValue('listeCptChg', interm);
//         handleCloseDialogAddNewCptModelDetail();
//     }

//     const deleteCptFromTableCptChg = (setFieldValue, index, confirmDeleteCptChg) => {
//         const rowId = index[0];

//         if (rowId > 0) {
//             if (confirmDeleteCptChg) {
//                 const newListChg = listCptChg.filter((i) => i.id !== rowId);
//                 setFieldValue('listeCptChg', newListChg);
//                 setListCptChg(newListChg);
//                 toast.success('Le compte a été supprimé avec succès.');
//             }
//         } else {
//             toast.error('Veuillez sélectionner un compte.');
//         }
//     }

//     const deleteCptChgPC = (setFieldValue) => (newState) => {
//         deleteCptFromTableCptChg(setFieldValue, selectedCptChgOnList, newState);
//         handleCloseDialogConfirmDeleteCptChgFromDialogAddNewCpte();
//     }

//     const handleOpenDialogConfirmDeleteCptChgFromDialogAddNewCpte = () => {
//         setOpenDialogDeleteCptChgFromAddNewCpt(true);
//     }

//     const handleCloseDialogConfirmDeleteCptChgFromDialogAddNewCpte = () => {
//         setOpenDialogDeleteCptChgFromAddNewCpt(false);
//     }

//     //gestion tableau ajout compte de TVA associé au nouveau compte à créer
//     const handleOpenDialogAddNewCptTvaModelDetail = () => {
//         //const prefixes = ['4456', '4457'];
//         //const result = detailModel?.filter((item) => prefixes.some((prefix) => item.compte.startsWith(prefix)) && item.nature === 'General');
//         const result = detailModel?.filter(item => item.compte.startsWith('4456') || item.compte.startsWith('4457'));
//         setPcOnlyCptTva(result);
//         setOpenDialogAddNewCptTvaModelDetail(true);
//     }

//     const handleCloseDialogAddNewCptTvaModelDetail = () => {
//         setOpenDialogAddNewCptTvaModelDetail(false);
//     }

//     const saveCptTva = (cpt_id) => {
//         const libelle = detailModel?.find((item) => item.id === cpt_id);
//         setSelectedCptAssocTva({ idCpt: cpt_id, compte: libelle.compte, libelle: libelle.libelle });
//     }

//     const AddCptToTableCptTva = (setFieldValue) => () => {
//         let interm = [...listCptTva];
//         interm.push({ id: listCptTva.length + 1, idCpt: selectedCptAssocTva.idCpt, compte: selectedCptAssocTva.compte, libelle: selectedCptAssocTva.libelle });
//         setListCptTva(interm);

//         //const newRow = {id: listCptTva.length+1, idCpt: selectedCptAssocChg.idCpt, compte: selectedCptAssocTva.compte, libelle: selectedCptAssocTva.libelle};
//         setFieldValue('listeCptTva', interm);
//         handleCloseDialogAddNewCptTvaModelDetail();
//     }

//     const deleteCptFromTableCptTva = (setFieldValue, index, confirmDeleteCptTva) => {
//         const rowId = index[0];

//         if (rowId > 0) {
//             if (confirmDeleteCptTva) {
//                 const newListTva = listCptTva.filter((i) => i.id !== rowId);

//                 setFieldValue('listeCptTva', newListTva);
//                 setListCptTva(newListTva);
//                 toast.success('Le compte a été supprimé avec succès.');
//             }
//         } else {
//             toast.error('Veuillez sélectionner un compte.');
//         }
//     }

//     const deleteCptTvaPC = (setFieldValue) => (newState) => {
//         deleteCptFromTableCptTva(setFieldValue, selectedCptTvaOnList, newState);
//         handleCloseDialogConfirmDeleteCptTvaFromDialogAddNewCpte();
//     }

//     const handleOpenDialogConfirmDeleteCptTvaFromDialogAddNewCpte = () => {
//         setOpenDialogDeleteCptTvaFromAddNewCpt(true);
//     }

//     const handleCloseDialogConfirmDeleteCptTvaFromDialogAddNewCpte = () => {
//         setOpenDialogDeleteCptTvaFromAddNewCpt(false);
//     }

//     //Gestion formulaire de remplissage infos tiers dans la création d'un nouveau compte pour le modèle sélectionné
//     const handleOnChangeListBoxTypeTier = (setFieldValue) => (e) => {
//         const value = e.target.value;
//         setFieldValue('typeTier', value);
//         setFormulaireTier(value);

//         // Griser et vider les localités seulement pour 'etranger' ou 'general'
//         if (value === 'etranger' || value === 'general') {
//             setDisableLocalites(true);
//             setFieldValue('province', '');
//             setFieldValue('region', '');
//             setFieldValue('district', '');
//             setFieldValue('commune', '');
//             setSelectedProvince('');
//             setSelectedRegion('');
//             setSelectedDistrict('');
//             setSelectedCommune('');
//         } else {
//             setDisableLocalites(false);
//         }
//     }

//     //Récupération de l'ID de la ligne sélectionner dans le tableau détail du modèle sélectionné
//     const listDetailModelPCSelectedRow = (selectedRow) => {
//         const itemId = selectedRow[0];
//         setPcAllselectedRow(selectedRow);

//         const itemInfos = detailModel.find(row => row.id === itemId);
//         if (itemInfos) {
//             setDetailModelSelectedRow(itemInfos);

//             //récupérer la liste des comptes de charges et compte de TVA associées à la ligne sélectionnée
//             axios.get(`/paramPlanComptableModele/keepListCptChgTvaAssoc/${itemId}`).then((response) => {
//                 const resData = response.data;
//                 if (resData.state) {
//                     setListCptChg(resData.detailChg);
//                     setListCptTva(resData.detailTva);
//                 } else {
//                     toast.error(resData.msg);
//                 }
//             })
//         }
//     }
//     const showCptInfos = (state) => {
//         setOpenInfos(state);
//     }

//     const handleShowCptInfos = (row) => {
//         const itemId = row.id;
//         axios.get(`/paramPlanComptableModele/keepListCptChgTvaAssoc/${itemId}`).then((response) => {
//             const resData = response.data;
//             if (resData.state) {
//                 setListCptChg(resData.detailChg);
//                 setListCptTva(resData.detailTva);
//                 setRowCptInfos(row);
//                 setOpenInfos(true);
//             } else {
//                 toast.error(resData.msg);
//             }
//         })
//     }


//     //Suppression des comptes sélectionnés dans le tableau du plan comptable
//     const handleOpenDialogDetailModelDelete = () => {
//         setOpenDialogDeleteItemsPc(true);
//     }

//     const deleteItemsPC = (value) => {
//         if (value === true) {
//             if (pcAllselectedRow.length >= 1) {
//                 const listId = pcAllselectedRow;
//                 if (modelSelectedRow.pardefault) {
//                     toast.error("Vous ne pouvez pas supprimer des comptes associés au modèle de plan comptable natif de kaonty.");
//                 } else {
//                     axiosPrivate.post(`/paramPlanComptableModele/deleteItemPc`, { listId, modelId, compteId }).then((response) => {
//                         const resData = response.data;
//                         showModelDetail(modelId);
//                         setOpenDialogDeleteItemsPc(false);
//                         if (resData.state) {
//                             toast.success(resData.msg);
//                         } else {
//                             toast.error(resData.msg);
//                         }

//                         if (resData.stateUndeletableCpt) {
//                             toast.error(resData.msgUndeletableCpt);
//                         }
//                     });
//                 }

//             } else {
//                 toast.error("Veuillez sélectionner au moins une ligne dans le tableau plan comptable.");
//             }
//         } else {
//             setOpenDialogDeleteItemsPc(false);
//         }
//     }

//     return (
//         <Box
//             sx={{
//                 paddingX: 3,
//                 paddingY: 2
//             }}
//         >
//             {openInfos ? <DetailsInformation row={rowCptInfos} confirmOpen={showCptInfos} listCptChg={listCptChg} listCptTva={listCptTva} /> : null}

//             <Stack width={"100%"} height={"100%"} spacing={2} alignItems={"flex-start"} justifyContent={"stretch"}>
//                 <Typography variant='h6' sx={{ color: "black" }} align='left'>Paramétrages : Plan comptable - modèle</Typography>

//                 <Stack width={"100%"} height={"30px"} spacing={0} alignItems={"center"} alignContent={"center"}
//                     direction={"row"} style={{ marginLeft: "0px", marginTop: "10px", justifyContent: "right" }}>
//                     <Typography variant='h7' sx={{ color: "black", fontWeight: "bold" }} align='left'>Modèle</Typography>
//                     <Stack width={"100%"} height={"30px"} spacing={0.5} alignItems={"center"} alignContent={"center"}
//                         direction={"row"} justifyContent={"right"}>
//                         <Tooltip title="Importer un modèle">
//                             <span>
//                                 <Button
//                                     onClick={() => setOpenImportDialog(true)}
//                                     variant="contained"
//                                     style={{
//                                         height: '35px',
//                                         borderRadius: '5px',
//                                         backgroundColor: initial.theme,
//                                         color: 'white',
//                                         textTransform: 'none',
//                                         outline: 'none',
//                                         marginLeft: '8px'
//                                     }}
//                                 >
//                                     Importer
//                                 </Button>
//                             </span>
//                         </Tooltip>

//                         <Tooltip title="Ajouter un nouveau modèle">
//                             <IconButton
//                                 disabled={!canAdd}
//                                 onClick={handleClickOpenNewModel}
//                                 variant="contained"
//                                 style={{
//                                     width: "35px", height: '35px',
//                                     borderRadius: "5px", borderColor: "transparent",
//                                     backgroundColor: initial.theme,
//                                     textTransform: 'none', outline: 'none'
//                                 }}
//                             >
//                                 <TbPlaylistAdd style={{ width: '25px', height: '25px', color: 'white' }} />
//                             </IconButton>
//                         </Tooltip>

//                         <Tooltip title="Supprimer le modèle sélectionné">
//                             <span>
//                                 <IconButton
//                                     disabled={!canDelete}
//                                     onClick={handleClickOpenDialogDeleteModel}
//                                     variant="contained"
//                                     style={{
//                                         width: "35px", height: '35px',
//                                         borderRadius: "5px", borderColor: "transparent",
//                                         backgroundColor: initial.button_delete_color,
//                                         textTransform: 'none', outline: 'none'
//                                     }}
//                                 >
//                                     <IoMdTrash style={{ width: '40px', height: '40px', color: 'white' }} />
//                                 </IconButton>
//                             </span>
//                         </Tooltip>

//                     </Stack>
//                 </Stack>

//                 {/* POP-UP POUR LA CREATION D'UN NOUVEAU MODELE */}
//                 <form onSubmit={formNewModel.handleSubmit}>
//                     <BootstrapDialog
//                         onClose={handleCloseNewModel}
//                         aria-labelledby="customized-dialog-title"
//                         open={openNewModel}
//                     >
//                         {/* <DialogTitle sx={{ m: 0, p: 2 }} id="customized-dialog-title" style={{fontWeight:'semiBold', width:'600px',backgroundColor : initial.normal_pupup_header_color}}>
//                     Nouveau modèle de plan comptable
//                     </DialogTitle> */}
//                         <IconButton
//                             style={{ color: 'red', textTransform: 'none', outline: 'none' }}
//                             aria-label="close"
//                             onClick={handleCloseNewModel}
//                             sx={{
//                                 position: 'absolute',
//                                 right: 8,
//                                 top: 8,
//                                 color: (theme) => theme.palette.grey[500],
//                             }}
//                         >
//                             <CloseIcon />
//                         </IconButton>

//                         <Typography style={{ marginTop: 75, marginLeft: 30 }} variant='h5'>Nouveau modèle de plan comptable</Typography>

//                         <DialogContent >

//                             <Stack width={"90%"} height={"300px"} spacing={0} alignItems={'start'} alignContent={"center"}
//                                 direction={"column"} justifyContent={"left"} style={{ marginLeft: '10px' }}>
//                                 <Stack width={"100%"} spacing={0} alignItems={"center"} alignContent={"center"}
//                                     direction={"row"} justifyContent={"left"} style={{ marginLeft: '10px' }}>
//                                     <FormControl
//                                         sx={{ width: "100%" }}
//                                         required
//                                         error={formNewModel.errors.model && formNewModel.touched.model}
//                                     >
//                                         <RadioGroup
//                                             row
//                                             aria-labelledby="choixExercice"
//                                             name="choixExercice"
//                                             style={{ marginRight: "10px", marginTop: "0px" }}
//                                             value={formNewModel.values.model}
//                                         >
//                                             <FormControlLabel onChange={(e) => saveModelePcValue(e.target.value)} value="modeleLibre" control={<Radio />} label="Modèle libre" />
//                                             <FormControlLabel onChange={(e) => saveModelePcValue(e.target.value)} value="aPartirModelDossier" control={<Radio />} label="A partir d'un modèle de dossier existant" style={{ marginTop: '-15px' }} />
//                                         </RadioGroup>
//                                         <FormHelperText
//                                             style={{
//                                                 color: 'red',
//                                                 marginLeft: 0,
//                                                 fontSize: "12px",
//                                             }}
//                                         >
//                                             {formNewModel.errors.model && formNewModel.touched.model && formNewModel.errors.model}
//                                         </FormHelperText>
//                                     </FormControl>
//                                 </Stack>

//                                 <FormControl variant="standard"
//                                     sx={{ m: 1, minWidth: 250 }}
//                                     disabled={modeleLibre}
//                                     error={formNewModel.errors.id_dossier && formNewModel.touched.id_dossier}
//                                 >
//                                     <InputLabel id="demo-simple-select-standard-label">Dossier</InputLabel>
//                                     <Select
//                                         labelId="demo-simple-select-standard-label"
//                                         id="demo-simple-select-standard"
//                                         value={formNewModel.values.id_dossier}
//                                         label={"valSelectPC"}
//                                         onChange={(e) => formNewModel.setFieldValue('id_dossier', e.target.value)}
//                                         sx={{ width: "300px", display: "flex", justifyContent: "left", alignItems: "flex-start", alignContent: "flex-start", textAlign: "left" }}
//                                     >
//                                         <MenuItem key={0} value={0}><em>Aucun dossier</em></MenuItem>
//                                         {listDossier?.map((dossier) => (
//                                             <MenuItem key={dossier.id} value={dossier.id}>{dossier.dossier}</MenuItem>
//                                         ))}
//                                     </Select>

//                                     <FormHelperText
//                                         style={{
//                                             color: 'red',
//                                             marginLeft: 0,
//                                             fontSize: "12px",
//                                         }}
//                                     >
//                                         {formNewModel.errors.id_dossier && formNewModel.touched.id_dossier && formNewModel.errors.id_dossier}
//                                     </FormHelperText>
//                                 </FormControl>

//                                 <FormControl variant="standard"
//                                     sx={{ m: 1, minWidth: 250 }}
//                                     error={formNewModel.errors.model_name && formNewModel.touched.model_name}
//                                 >
//                                     <TextField
//                                         onBlur={(e) => formNewModel.setFieldValue("model_name", e.target.value)}
//                                         id="nom-modele" label="Nom du modèle"
//                                         variant="standard"
//                                         style={{ width: "400px", marginLeft: "10px" }}
//                                     />

//                                     <FormHelperText
//                                         style={{
//                                             color: 'red',
//                                             marginLeft: 0,
//                                             fontSize: "12px",
//                                         }}
//                                     >
//                                         {formNewModel.errors.model_name && formNewModel.touched.model_name && formNewModel.errors.model_name}
//                                     </FormHelperText>
//                                 </FormControl>

//                             </Stack>

//                         </DialogContent>
//                         <DialogActions>
//                             <Button
//                                 autoFocus
//                                 style={{ backgroundColor: initial.theme, color: 'white', width: "100px", textTransform: 'none', outline: 'none' }}
//                                 type='submit'
//                                 onClick={formNewModel.handleSubmit}
//                             >
//                                 Créer
//                             </Button>
//                         </DialogActions>
//                     </BootstrapDialog>

//                     <BootstrapDialog
//                         onClose={() => setOpenImportDialog(false)}
//                         aria-labelledby="import-modele-dialog-title"
//                         open={openImportDialog}
//                         maxWidth={"xl"}
//                         fullWidth
//                     >
//                         <IconButton
//                             aria-label="close"
//                             onClick={() => setOpenImportDialog(false)}
//                             sx={{ position: 'absolute', right: 8, top: 8, color: (theme) => theme.palette.grey[500] }}
//                         >
//                             <CloseIcon />
//                         </IconButton>
//                         <DialogContent dividers>
//                             <Box sx={{ width: '100%', height: '70vh' }}>
//                                 <PopupImportModelePlanComptable onSuccess={() => { GetListePlanComptableModele(); setOpenImportDialog(false); }} />
//                             </Box>
//                         </DialogContent>
//                         <DialogActions>
//                             <Button onClick={() => setOpenImportDialog(false)} style={{ textTransform: 'none' }}>Fermer</Button>
//                         </DialogActions>
//                     </BootstrapDialog>
//                 </form>

//                 {/* MODAL POUR LA SUPPRESSION D'UN MODELE */}
//                 {openDialogDeleteModel ? <PopupConfirmDelete msg={"Voulez-vous vraiment supprimer le modèle sélectionné ?"} confirmationState={deleteModelPC} /> : null}

//                 {/* TABLEAU LISTE DES MODELES DE PLAN COMPTABLES */}
//                 <Stack width={"100%"} height={"500px"} spacing={1} alignItems={"flex-start"} direction={"row"}>
//                     <DataGrid
//                         disableMultipleSelection={DataGridStyle.disableMultipleSelection}
//                         disableColumnSelector={DataGridStyle.disableColumnSelector}
//                         disableDensitySelector={DataGridStyle.disableDensitySelector}
//                         localeText={frFR.components.MuiDataGrid.defaultProps.localeText}
//                         disableRowSelectionOnClick
//                         disableSelectionOnClick={true}
//                         slots={{ toolbar: QuickFilter }}
//                         sx={DataGridStyle.sx}
//                         rowHeight={DataGridStyle.rowHeight}
//                         columnHeaderHeight={DataGridStyle.columnHeaderHeight}
//                         onRowSelectionModelChange={(ids) => {
//                             const single = Array.isArray(ids) && ids.length ? [ids[ids.length - 1]] : [];
//                             listModelPCSelectedRow(single);
//                         }}
//                         rows={listeModele}
//                         columns={columnHeaderModel}
//                         initialState={{
//                             pagination: {
//                                 paginationModel: { page: 0, pageSize: 100 },
//                             },
//                         }}
//                         pageSizeOptions={[50, 100]}
//                         pagination={DataGridStyle.pagination}
//                         checkboxSelection={DataGridStyle.checkboxSelection}
//                         columnVisibilityModel={{
//                             id: false,
//                         }}
//                         rowSelectionModel={modelId != null ? [modelId] : []}
//                     />
//                 </Stack>

//                 {/* MODAL POUR L'AJOUT/MODIFICATION D'UN NOUVEAU COMPTE POUR LE MODELE SELECTIONNE */}
//                 {/* <form onSubmit={formAddCptModelDetail.handleSubmit}> */}
//                 <Formik
//                     initialValues={formAddCptModelInitialValues}
//                     validationSchema={formAddCptModelValidationSchema}
//                     onSubmit={(values) => {
//                         formAddCptModelhandleSubmit(values);
//                         //();
//                     }}
//                 >
//                     {({ handleChange, handleSubmit, setFieldValue, setFieldTouched, resetForm }) => {
//                         // useEffect(() => {
//                         //     if (openDialogAddNewCptModelDetail) {
//                         //         resetForm();
//                         //     }
//                         // }, [openDialogAddNewCptModelDetail, resetForm]);

//                         return (
//                             <Form style={{ width: '100%' }}>
//                                 <Stack width={"100%"} height={"30px"} spacing={0} alignItems={"center"} alignContent={"center"}
//                                     direction={"row"} style={{ marginLeft: "0px", marginTop: "30px", justifyContent: "right" }}>
//                                     <Typography variant='h7' sx={{ color: "black", fontWeight: "bold", width: "300px" }} align='left'>Plan de compte</Typography>

//                                     <Stack width={"100%"} height={"30px"} spacing={0.5} alignItems={"center"} alignContent={"center"}
//                                         direction={"row"} justifyContent={"right"}>
//                                         <Tooltip title="Ajouter un nouveau compte">
//                                             <IconButton
//                                                 // disabled={statutDeleteButton}  
//                                                 onClick={handleOpenDialogDetailModelAdd(setFieldValue, resetForm)}
//                                                 variant="contained"
//                                                 style={{
//                                                     width: "35px", height: '35px',
//                                                     borderRadius: "5px", borderColor: "transparent",
//                                                     backgroundColor: initial.theme,
//                                                     textTransform: 'none', outline: 'none'
//                                                 }}
//                                             >
//                                                 <TbPlaylistAdd style={{ width: '25px', height: '25px', color: 'white' }} />
//                                             </IconButton>
//                                         </Tooltip>

//                                         <Tooltip title="Modifier le compte sélectionné">
//                                             <IconButton
//                                                 onClick={handleOpenDialogDetailModelModify(setFieldValue)}
//                                                 variant="contained"
//                                                 style={{
//                                                     width: "35px", height: '35px',
//                                                     borderRadius: "5px", borderColor: "transparent",
//                                                     backgroundColor: initial.theme,
//                                                     textTransform: 'none', outline: 'none'
//                                                 }}
//                                             >
//                                                 <FaRegPenToSquare style={{ width: '25px', height: '25px', color: 'white' }} />
//                                             </IconButton>
//                                         </Tooltip>

//                                         <Tooltip title="Supprimer le compte sélectionné">
//                                             <span>
//                                                 <IconButton
//                                                     onClick={handleOpenDialogDetailModelDelete}
//                                                     variant="contained"
//                                                     style={{
//                                                         width: "35px", height: '35px',
//                                                         borderRadius: "5px", borderColor: "transparent",
//                                                         backgroundColor: initial.button_delete_color,
//                                                         textTransform: 'none', outline: 'none'
//                                                     }}
//                                                 >
//                                                     <IoMdTrash style={{ width: '40px', height: '40px', color: 'white' }} />
//                                                 </IconButton>
//                                             </span>
//                                         </Tooltip>
//                                     </Stack>
//                                 </Stack>
//                                 <BootstrapDialog
//                                     onClose={handleCloseDialogDetailModelAdd}
//                                     aria-labelledby="customized-dialog-title"
//                                     open={openDialogAddModelDetail}
//                                     fullWidth={true}
//                                     maxWidth={"lg"}
//                                 >
//                                     {/* <DialogTitle sx={{ m: 0, p: 2 }} id="customized-dialog-title" style={{fontWeight:'normal', width:'100%', height:'55px', backgroundColor : initial.normal_pupup_header_color}}>
//                                     <Typography variant='h8'>Ajout d'un nouveau compte pour le modèle : {selectedModelName}</Typography>
//                                 </DialogTitle> */}
//                                     <IconButton
//                                         style={{ color: 'red', textTransform: 'none', outline: 'none' }}
//                                         aria-label="close"
//                                         onClick={handleCloseDialogDetailModelAdd}
//                                         sx={{
//                                             position: 'absolute',
//                                             right: 8,
//                                             top: 8,
//                                             color: (theme) => theme.palette.grey[500],
//                                         }}
//                                     >
//                                         <CloseIcon />
//                                     </IconButton>

//                                     <Typography style={{ marginTop: 75, marginLeft: 30 }} variant='h5'>Création d'un nouveau compte</Typography>

//                                     <DialogContent style={{ width: "100%" }} >

//                                         <Stack width={"100%"} height={"650px"} spacing={0} alignItems={'start'} alignContent={"center"}
//                                             direction={"column"} justifyContent={"left"} style={{ marginLeft: '0px' }}>
//                                             <Box sx={{ width: '100%', typography: 'body1' }}>
//                                                 <TabContext value={tabValueAjoutNewRowModelDetail} sx={{ width: '100%' }}>
//                                                     <Box sx={{ borderBottom: 1, borderColor: 'transparent' }}>
//                                                         <TabList onChange={handleChangeTabValueAjoutNewRowModelDetail} aria-label="lab API tabs example" variant='scrollable'>
//                                                             <Tab style={{ textTransform: 'none', outline: 'none', border: 'none' }} label="infos générales" value="1" />
//                                                             <Tab style={{ textTransform: 'none', outline: 'none', border: 'none' }} label="Compte de charges" value="2" />
//                                                             <Tab style={{ textTransform: 'none', outline: 'none', border: 'none' }} label="Compte de TVA" value="3" />
//                                                         </TabList>
//                                                     </Box>

//                                                     <TabPanel value="1">
//                                                         <Stack width={"100%"} height={"100%"} spacing={2} alignItems={"flex-start"}
//                                                             alignContent={"flex-start"} justifyContent={"stretch"} >
//                                                             <Stack direction={'row'} alignContent={'end'}
//                                                                 alignItems={'end'} justifyContent={'end'} spacing={5}
//                                                                 style={{ backgroundColor: 'transparent' }}
//                                                             >
//                                                                 <Stack spacing={-0.5}>
//                                                                     <label htmlFor="nature" style={{ fontSize: 12, color: '#3FA2F6' }}>Nature</label>
//                                                                     <Field
//                                                                         as={Select}
//                                                                         labelId="nature-label"
//                                                                         name="nature"
//                                                                         onChange={handleChangeListBoxNature(setFieldValue)}
//                                                                         sx={{
//                                                                             borderRadius: 0,
//                                                                             width: 200,
//                                                                             height: 40,
//                                                                             '& .MuiOutlinedInput-notchedOutline': {
//                                                                                 borderTop: 'none', // Supprime le cadre
//                                                                                 borderLeft: 'none',
//                                                                                 borderRight: 'none',
//                                                                                 borderWidth: '0.5px'
//                                                                             },
//                                                                             '&:hover .MuiOutlinedInput-notchedOutline': {
//                                                                                 borderTop: 'none', // Supprime le cadre
//                                                                                 borderLeft: 'none',
//                                                                                 borderRight: 'none',
//                                                                                 borderWidth: '0.5px'
//                                                                             },
//                                                                             '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
//                                                                                 borderTop: 'none', // Supprime le cadre
//                                                                                 borderLeft: 'none',
//                                                                                 borderRight: 'none',
//                                                                                 borderWidth: '0.5px'
//                                                                             },
//                                                                         }}
//                                                                     >
//                                                                         <MenuItem value={"General"}>Compte général</MenuItem>
//                                                                         <MenuItem value={"Collectif"}>Compte collectif</MenuItem>
//                                                                         <MenuItem value={"Aux"}>Compte auxiliaire</MenuItem>
//                                                                     </Field>
//                                                                     <ErrorMessage name='nature' component="div" style={{ color: 'red', fontSize: 12, marginTop: -2 }} />
//                                                                 </Stack>

//                                                                 <Stack spacing={-0.5}>
//                                                                     <label htmlFor="baseCptCollectif" style={{ fontSize: 12, color: '#3FA2F6' }}>Centralisation / Base compte auxiliaire</label>
//                                                                     <Field
//                                                                         disabled={typeCptGeneral}
//                                                                         as={Select}
//                                                                         labelId="baseCptCollectif-label"
//                                                                         name="baseCptCollectif"
//                                                                         renderValue={(selected) => {
//                                                                             const opt = listeCptCollectif?.find((i) => i.id === selected);
//                                                                             if (opt) return `${opt.compte} ${opt.libelle}`;
//                                                                             // Fallback: afficher la valeur actuelle même si la liste n'est pas encore chargée
//                                                                             if (detailModelSelectedRow && (selected === detailModelSelectedRow.id || selected === detailModelSelectedRow.baseaux_id)) {
//                                                                                 const label = detailModelSelectedRow.baseaux
//                                                                                     ? `${detailModelSelectedRow.baseaux} ${detailModelSelectedRow.libelle || ''}`.trim()
//                                                                                     : `${detailModelSelectedRow.compte || ''} ${detailModelSelectedRow.libelle || ''}`.trim();
//                                                                                 return label || ' ';
//                                                                             }
//                                                                             return ' ';
//                                                                         }}
//                                                                         onChange={handleChangeListBoxBaseCompteAux(setFieldValue)}
//                                                                         sx={{
//                                                                             borderRadius: 0,
//                                                                             width: 500,
//                                                                             height: 40,
//                                                                             '& .MuiOutlinedInput-notchedOutline': {
//                                                                                 borderTop: 'none', // Supprime le cadre
//                                                                                 borderLeft: 'none',
//                                                                                 borderRight: 'none',
//                                                                                 borderWidth: '0.5px'
//                                                                             },
//                                                                             '&:hover .MuiOutlinedInput-notchedOutline': {
//                                                                                 borderTop: 'none', // Supprime le cadre
//                                                                                 borderLeft: 'none',
//                                                                                 borderRight: 'none',
//                                                                                 borderWidth: '0.5px'
//                                                                             },
//                                                                             '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
//                                                                                 borderTop: 'none', // Supprime le cadre
//                                                                                 borderLeft: 'none',
//                                                                                 borderRight: 'none',
//                                                                                 borderWidth: '0.5px'
//                                                                             },
//                                                                         }}
//                                                                     >
//                                                                         {listeCptCollectif?.map((item) => (
//                                                                             <MenuItem key={item.id} value={item.id}>{item.compte} {item.libelle}</MenuItem>
//                                                                         ))
//                                                                         }
//                                                                     </Field>
//                                                                     <ErrorMessage name='baseCptCollectif' component="div" style={{ color: 'red', fontSize: 12, marginTop: -2 }} />
//                                                                 </Stack>

//                                                                 {/* <Stack spacing={1.5}>
//                                                             <label htmlFor="baseCptCollectif" style={{fontSize:12, color: '#3FA2F6'}}>base compte collectif</label>
//                                                             <Field
//                                                             disabled={typeCptGeneral}
//                                                             name='baseCptCollectif'
//                                                             onChange={handleChange}
//                                                             type='text'
//                                                             placeholder=""
//                                                             style={{height:22, borderTop: 'none',borderLeft: 'none',borderRight: 'none', outline: 'none', fontSize:14, borderWidth:'0.5px' }}
//                                                             />
//                                                             <ErrorMessage name='baseCptCollectif' component="div" style={{ color: 'red', fontSize:12, marginTop:-2 }}/>
//                                                         </Stack> */}
//                                                             </Stack>

//                                                             <Stack direction={'row'} alignContent={'stard'}
//                                                                 alignItems={'start'} spacing={5}
//                                                                 style={{ backgroundColor: 'transparent', width: '800px' }}
//                                                             >
//                                                                 <Stack spacing={1}>
//                                                                     <label htmlFor="compte" style={{ fontSize: 12, color: '#3FA2F6' }}>compte</label>
//                                                                     <Field
//                                                                         name='compte'
//                                                                         onChange={handleChange}
//                                                                         type='text'
//                                                                         placeholder=""
//                                                                         style={{
//                                                                             height: 22, borderTop: 'none',
//                                                                             borderLeft: 'none', borderRight: 'none',
//                                                                             outline: 'none', fontSize: 14, borderWidth: '0.5px',
//                                                                             width: 200,
//                                                                         }}
//                                                                     />
//                                                                     <ErrorMessage name='compte' component="div" style={{ color: 'red', fontSize: 12, marginTop: -2 }} />
//                                                                 </Stack>

//                                                                 <Stack spacing={1}>
//                                                                     <label htmlFor="libelle" style={{ fontSize: 12, color: '#3FA2F6' }}>libellé / raison sociale</label>
//                                                                     <Field
//                                                                         name='libelle'
//                                                                         onChange={handleChange}
//                                                                         type='text'
//                                                                         placeholder=""
//                                                                         style={{ width: 500, height: 22, borderTop: 'none', borderLeft: 'none', borderRight: 'none', outline: 'none', fontSize: 14, borderWidth: '0.5px' }}
//                                                                     />
//                                                                     <ErrorMessage name='libelle' component="div" style={{ color: 'red', fontSize: 12, marginTop: -2 }} />
//                                                                 </Stack>
//                                                             </Stack>

//                                                             <Stack spacing={-0.5} style={{ marginTop: 50 }}>
//                                                                 <label htmlFor="typeTier" style={{ fontSize: 12, color: '#3FA2F6' }}>Type du tier</label>
//                                                                 <Field
//                                                                     as={Select}
//                                                                     disabled={disableTypeTiers}
//                                                                     labelId="typeTier-label"
//                                                                     name="typeTier"
//                                                                     onChange={handleOnChangeListBoxTypeTier(setFieldValue)}
//                                                                     sx={{
//                                                                         borderRadius: 0,
//                                                                         width: 200,
//                                                                         height: 40,
//                                                                         '& .MuiOutlinedInput-notchedOutline': {
//                                                                             borderTop: 'none', // Supprime le cadre
//                                                                             borderLeft: 'none',
//                                                                             borderRight: 'none',
//                                                                             borderWidth: '0.5px'
//                                                                         },
//                                                                         '&:hover .MuiOutlinedInput-notchedOutline': {
//                                                                             borderTop: 'none', // Supprime le cadre
//                                                                             borderLeft: 'none',
//                                                                             borderRight: 'none',
//                                                                             borderWidth: '0.5px'
//                                                                         },
//                                                                         '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
//                                                                             borderTop: 'none', // Supprime le cadre
//                                                                             borderLeft: 'none',
//                                                                             borderRight: 'none',
//                                                                             borderWidth: '0.5px'
//                                                                         },
//                                                                     }}
//                                                                 >
//                                                                     <MenuItem key={"sans-nif"} value={"sans-nif"}>Sans NIF</MenuItem>
//                                                                     <MenuItem key={"avec-nif"} value={"avec-nif"}>Avec NIF</MenuItem>
//                                                                     <MenuItem key={"etranger"} value={"etranger"}>Etranger</MenuItem>
//                                                                     <MenuItem key={"general"} value={"general"}>Général</MenuItem>
//                                                                 </Field>
//                                                                 <ErrorMessage name='typeTier' component="div" style={{ color: 'red', fontSize: 12, marginTop: -2 }} />
//                                                             </Stack>

//                                                             <Stack >
//                                                                 {formulaireTier === 'sans-nif'
//                                                                     ? <Stack margin={"0px"} alignContent={"start"} alignItems={"start"}>
//                                                                         <Stack direction={'row'} alignContent={'stard'}
//                                                                             alignItems={'start'} spacing={6.5}
//                                                                             style={{ backgroundColor: 'transparent', width: '800px' }}
//                                                                         >
//                                                                             <Stack spacing={1.5}>
//                                                                                 <label htmlFor="cin" style={{ fontSize: 12, color: '#3FA2F6' }}>cin</label>
//                                                                                 <Field
//                                                                                     name='cin'
//                                                                                     onChange={handleChange}
//                                                                                     type='text'
//                                                                                     placeholder=""
//                                                                                     style={{ width: 200, height: 22, borderTop: 'none', borderLeft: 'none', borderRight: 'none', outline: 'none', fontSize: 14, borderWidth: '0.5px' }}
//                                                                                 />
//                                                                                 <ErrorMessage name='cin' component="div" style={{ color: 'red', fontSize: 12, marginTop: -2 }} />
//                                                                             </Stack>

//                                                                             <Stack spacing={1.5}>
//                                                                                 <label htmlFor="dateCin" style={{ fontSize: 12, color: '#3FA2F6' }}>date cin</label>
//                                                                                 <Field
//                                                                                     name='dateCin'
//                                                                                     onChange={handleChange}
//                                                                                     type='date'
//                                                                                     placeholder=""
//                                                                                     style={{ width: 100, height: 22, borderTop: 'none', borderLeft: 'none', borderRight: 'none', outline: 'none', fontSize: 14, borderWidth: '0.5px' }}
//                                                                                 />
//                                                                                 <ErrorMessage name='dateCin' component="div" style={{ color: 'red', fontSize: 12, marginTop: -2 }} />
//                                                                             </Stack>
//                                                                         </Stack>

//                                                                         <Stack direction={'row'} alignContent={'stard'}
//                                                                             alignItems={'start'} spacing={6.5}
//                                                                             style={{ backgroundColor: 'transparent', width: '800px', marginTop: '10px' }}
//                                                                         >
//                                                                             <Stack spacing={1.5}>
//                                                                                 <label htmlFor="autrePieceID" style={{ fontSize: 12, color: '#3FA2F6' }}>Autres pièces d'identité si pas de CIN</label>
//                                                                                 <Field
//                                                                                     name='autrePieceID'
//                                                                                     onChange={handleChange}
//                                                                                     type='text'
//                                                                                     placeholder=""
//                                                                                     style={{ width: 400, height: 22, borderTop: 'none', borderLeft: 'none', borderRight: 'none', outline: 'none', fontSize: 14, borderWidth: '0.5px' }}
//                                                                                 />
//                                                                                 <ErrorMessage name='autrePieceID' component="div" style={{ color: 'red', fontSize: 12, marginTop: -2 }} />
//                                                                             </Stack>

//                                                                             <Stack spacing={1.5}>
//                                                                                 <label htmlFor="refPieceID" style={{ fontSize: 12, color: '#3FA2F6' }}>Référence pièce d'identité</label>
//                                                                                 <Field
//                                                                                     name='refPieceID'
//                                                                                     onChange={handleChange}
//                                                                                     type='text'
//                                                                                     placeholder=""
//                                                                                     style={{ width: 200, height: 22, borderTop: 'none', borderLeft: 'none', borderRight: 'none', outline: 'none', fontSize: 14, borderWidth: '0.5px' }}
//                                                                                 />
//                                                                                 <ErrorMessage name='refPieceID' component="div" style={{ color: 'red', fontSize: 12, marginTop: -2 }} />
//                                                                             </Stack>
//                                                                         </Stack>

//                                                                         <Stack spacing={1.5} style={{ marginTop: 15 }}>
//                                                                             <label htmlFor="adresseSansNIF" style={{ fontSize: 12, color: '#3FA2F6' }}>Adresse</label>
//                                                                             <Field
//                                                                                 name='adresseSansNIF'
//                                                                                 onChange={handleChange}
//                                                                                 type='text'
//                                                                                 placeholder=""
//                                                                                 style={{ width: 200, height: 22, borderTop: 'none', borderLeft: 'none', borderRight: 'none', outline: 'none', fontSize: 14, borderWidth: '0.5px' }}
//                                                                             />
//                                                                             <ErrorMessage name='adresseSansNIF' component="div" style={{ color: 'red', fontSize: 12, marginTop: -2 }} />
//                                                                         </Stack>
//                                                                     </Stack>
//                                                                     : formulaireTier === 'avec-nif'
//                                                                         ? <Stack >
//                                                                             <Stack spacing={1.5} style={{ marginTop: 15 }}>
//                                                                                 <label htmlFor="nif" style={{ fontSize: 12, color: '#3FA2F6' }}>Nif</label>
//                                                                                 <Field
//                                                                                     name='nif'
//                                                                                     onChange={handleChange}
//                                                                                     type='text'
//                                                                                     placeholder=""
//                                                                                     style={{ width: 200, height: 22, borderTop: 'none', borderLeft: 'none', borderRight: 'none', outline: 'none', fontSize: 14, borderWidth: '0.5px' }}
//                                                                                 />
//                                                                                 <ErrorMessage name='nif' component="div" style={{ color: 'red', fontSize: 12, marginTop: -2 }} />
//                                                                             </Stack>

//                                                                             <Stack spacing={1.5} style={{ marginTop: 15 }}>
//                                                                                 <label htmlFor="stat" style={{ fontSize: 12, color: '#3FA2F6' }}>N° statistique</label>
//                                                                                 <Field
//                                                                                     name='stat'
//                                                                                     onChange={handleChange}
//                                                                                     type='text'
//                                                                                     placeholder=""
//                                                                                     style={{ width: 200, height: 22, borderTop: 'none', borderLeft: 'none', borderRight: 'none', outline: 'none', fontSize: 14, borderWidth: '0.5px' }}
//                                                                                 />
//                                                                                 <ErrorMessage name='stat' component="div" style={{ color: 'red', fontSize: 12, marginTop: -2 }} />
//                                                                             </Stack>

//                                                                             <Stack spacing={1.5} style={{ marginTop: 15 }}>
//                                                                                 <label htmlFor="adresse" style={{ fontSize: 12, color: '#3FA2F6' }}>Adresse</label>
//                                                                                 <Field
//                                                                                     name='adresse'
//                                                                                     onChange={handleChange}
//                                                                                     type='text'
//                                                                                     placeholder=""
//                                                                                     style={{ width: 200, height: 22, borderTop: 'none', borderLeft: 'none', borderRight: 'none', outline: 'none', fontSize: 14, borderWidth: '0.5px' }}
//                                                                                 />
//                                                                                 <ErrorMessage name='adresse' component="div" style={{ color: 'red', fontSize: 12, marginTop: -2 }} />
//                                                                             </Stack>
//                                                                         </Stack>
//                                                                         : formulaireTier === 'etranger'

//                                                                             ? <Stack margin={"0px"} alignContent={"start"} alignItems={"start"}>
//                                                                                 <Stack spacing={1.5} style={{ marginTop: 15 }}>
//                                                                                     <label htmlFor="nifRepresentant" style={{ fontSize: 12, color: '#3FA2F6' }}>Nif du représentant</label>
//                                                                                     <Field
//                                                                                         name='nifRepresentant'
//                                                                                         onChange={handleChange}
//                                                                                         type='text'
//                                                                                         placeholder=""
//                                                                                         style={{ width: 300, height: 22, borderTop: 'none', borderLeft: 'none', borderRight: 'none', outline: 'none', fontSize: 14, borderWidth: '0.5px' }}
//                                                                                     />
//                                                                                     <ErrorMessage name='nifRepresentant' component="div" style={{ color: 'red', fontSize: 12, marginTop: -2 }} />
//                                                                                 </Stack>

//                                                                                 <Stack spacing={1.5} style={{ marginTop: 15 }}>
//                                                                                     <label htmlFor="adresseEtranger" style={{ fontSize: 12, color: '#3FA2F6' }}>Adresse</label>
//                                                                                     <Field
//                                                                                         name='adresseEtranger'
//                                                                                         onChange={handleChange}
//                                                                                         type='text'
//                                                                                         placeholder=""
//                                                                                         style={{ width: 400, height: 22, borderTop: 'none', borderLeft: 'none', borderRight: 'none', outline: 'none', fontSize: 14, borderWidth: '0.5px' }}
//                                                                                     />
//                                                                                     <ErrorMessage name='adresseEtranger' component="div" style={{ color: 'red', fontSize: 12, marginTop: -2 }} />
//                                                                                 </Stack>

//                                                                                 <Stack spacing={1.5} style={{ marginTop: 15 }}>
//                                                                                     <label htmlFor="pays" style={{ fontSize: 12, color: '#3FA2F6' }}>Pays</label>
//                                                                                     <Field
//                                                                                         name='pays'
//                                                                                         onChange={handleChange}
//                                                                                         type='text'
//                                                                                         placeholder=""
//                                                                                         style={{ width: 250, height: 22, borderTop: 'none', borderLeft: 'none', borderRight: 'none', outline: 'none', fontSize: 14, borderWidth: '0.5px' }}
//                                                                                     />
//                                                                                     <ErrorMessage name='pays' component="div" style={{ color: 'red', fontSize: 12, marginTop: -2 }} />
//                                                                                 </Stack>
//                                                                             </Stack>
//                                                                             : null
//                                                                 }
//                                                             </Stack>

//                                                             <Stack spacing={1.5} style={{ marginTop: 15 }}>
//                                                                 <label htmlFor="motcle" style={{ fontSize: 12, color: '#3FA2F6' }}>Mot clé</label>
//                                                                 <Field
//                                                                     name='motcle'
//                                                                     onChange={handleChange}
//                                                                     type='text'
//                                                                     placeholder=""
//                                                                     style={{ width: 200, height: 22, borderTop: 'none', borderLeft: 'none', borderRight: 'none', outline: 'none', fontSize: 14, borderWidth: '0.5px' }}
//                                                                 />
//                                                                 <ErrorMessage name='motcle' component="div" style={{ color: 'red', fontSize: 12, marginTop: -2 }} />
//                                                             </Stack>

//                                                             <Stack direction={'row'} width={'100%'} spacing={2} style={{ marginTop: 25 }} >
//                                                                 <Stack spacing={-0.5} flex={0.75} minWidth={0}>
//                                                                     <Autocomplete
//                                                                         disabled={disableLocalites}
//                                                                         options={provinces}
//                                                                         value={selectedProvince || null}
//                                                                         onChange={(event, newValue) => {
//                                                                             setFieldValue("province", newValue || "");
//                                                                             setSelectedProvince(newValue || "");
//                                                                         }}
//                                                                         onBlur={(e) => { if (!disableLocalites) setFieldTouched("province", true, false); }}
//                                                                         noOptionsText="Aucune province trouvée"
//                                                                         renderInput={(params) => (
//                                                                             <TextField
//                                                                                 {...params}
//                                                                                 label="Province"
//                                                                                 variant="outlined"
//                                                                                 size="small"
//                                                                                 sx={{
//                                                                                     borderRadius: 0,
//                                                                                     '& .MuiOutlinedInput-notchedOutline': {
//                                                                                         borderTop: 'none',
//                                                                                         borderLeft: 'none',
//                                                                                         borderRight: 'none',
//                                                                                         borderWidth: '0.5px'
//                                                                                     },
//                                                                                     '&:hover .MuiOutlinedInput-notchedOutline': {
//                                                                                         borderTop: 'none',
//                                                                                         borderLeft: 'none',
//                                                                                         borderRight: 'none',
//                                                                                         borderWidth: '0.5px'
//                                                                                     },
//                                                                                     '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
//                                                                                         borderTop: 'none',
//                                                                                         borderLeft: 'none',
//                                                                                         borderRight: 'none',
//                                                                                         borderWidth: '0.5px'
//                                                                                     },
//                                                                                 }}
//                                                                             />
//                                                                         )}
//                                                                     />
//                                                                     <ErrorMessage name='province' component="div" style={{ color: 'red', fontSize: 12, marginTop: -2 }} />
//                                                                 </Stack>
//                                                                 <Stack spacing={-0.5} flex={0.9} minWidth={0}>
//                                                                     <Autocomplete
//                                                                         disabled={disableLocalites}
//                                                                         options={regions}
//                                                                         value={selectedRegion || null}
//                                                                         onChange={(event, newValue) => {
//                                                                             setFieldValue('region', newValue);
//                                                                             setSelectedRegion(newValue)
//                                                                         }}
//                                                                         onBlur={(e) => { if (!disableLocalites) setF("region", true, false); }}
//                                                                         noOptionsText="Aucune région trouvée"
//                                                                         renderInput={(params) => (
//                                                                             <TextField
//                                                                                 {...params}
//                                                                                 label="Région"
//                                                                                 variant="outlined"
//                                                                                 size="small"
//                                                                                 sx={{
//                                                                                     borderRadius: 0,
//                                                                                     '& .MuiOutlinedInput-notchedOutline': {
//                                                                                         borderTop: 'none',
//                                                                                         borderLeft: 'none',
//                                                                                         borderRight: 'none',
//                                                                                         borderWidth: '0.5px'
//                                                                                     },
//                                                                                     '&:hover .MuiOutlinedInput-notchedOutline': {
//                                                                                         borderTop: 'none',
//                                                                                         borderLeft: 'none',
//                                                                                         borderRight: 'none',
//                                                                                         borderWidth: '0.5px'
//                                                                                     },
//                                                                                     '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
//                                                                                         borderTop: 'none',
//                                                                                         borderLeft: 'none',
//                                                                                         borderRight: 'none',
//                                                                                         borderWidth: '0.5px'
//                                                                                     },
//                                                                                 }}
//                                                                             />
//                                                                         )}
//                                                                     />
//                                                                     <ErrorMessage name='region' component="div" style={{ color: 'red', fontSize: 12, marginTop: -2 }} />
//                                                                 </Stack>
//                                                                 <Stack spacing={-0.5} flex={1} minWidth={0}>
//                                                                     <Autocomplete
//                                                                         disabled={disableLocalites}
//                                                                         options={districts}
//                                                                         value={selectedDistrict || null}
//                                                                         onChange={(event, newValue) => {
//                                                                             setFieldValue('district', newValue);
//                                                                             setSelectedDistrict(newValue);
//                                                                         }}
//                                                                         onBlur={(e) => { if (!disableLocalites) setFieldTouched("district", true, false); }}
//                                                                         noOptionsText="Aucune district trouvée"
//                                                                         renderInput={(params) => (
//                                                                             <TextField
//                                                                                 {...params}
//                                                                                 label="District"
//                                                                                 variant="outlined"
//                                                                                 size="small"
//                                                                                 sx={{
//                                                                                     borderRadius: 0,
//                                                                                     '& .MuiOutlinedInput-notchedOutline': {
//                                                                                         borderTop: 'none',
//                                                                                         borderLeft: 'none',
//                                                                                         borderRight: 'none',
//                                                                                         borderWidth: '0.5px'
//                                                                                     },
//                                                                                     '&:hover .MuiOutlinedInput-notchedOutline': {
//                                                                                         borderTop: 'none',
//                                                                                         borderLeft: 'none',
//                                                                                         borderRight: 'none',
//                                                                                         borderWidth: '0.5px'
//                                                                                     },
//                                                                                     '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
//                                                                                         borderTop: 'none',
//                                                                                         borderLeft: 'none',
//                                                                                         borderRight: 'none',
//                                                                                         borderWidth: '0.5px'
//                                                                                     },
//                                                                                 }}
//                                                                             />
//                                                                         )}
//                                                                     />
//                                                                     <ErrorMessage name='district' component="div" style={{ color: 'red', fontSize: 12, marginTop: -2 }} />
//                                                                 </Stack>
//                                                                 <Stack spacing={-0.5} flex={1} minWidth={0}>
//                                                                     <Autocomplete
//                                                                         disabled={disableLocalites}
//                                                                         options={communes}
//                                                                         value={selectedCommune || null}
//                                                                         onChange={(event, newValue) => {
//                                                                             setFieldValue('commune', newValue);
//                                                                             setSelectedCommune(newValue);
//                                                                         }}
//                                                                         onBlur={(e) => { if (!disableLocalites) setFieldTouched("commune", true, false); }}
//                                                                         noOptionsText="Aucune commmune trouvée"
//                                                                         renderInput={(params) => (
//                                                                             <TextField
//                                                                                 {...params}
//                                                                                 label="Commune"
//                                                                                 variant="outlined"
//                                                                                 size="small"
//                                                                                 sx={{
//                                                                                     borderRadius: 0,
//                                                                                     '& .MuiOutlinedInput-notchedOutline': {
//                                                                                         borderTop: 'none',
//                                                                                         borderLeft: 'none',
//                                                                                         borderRight: 'none',
//                                                                                         borderWidth: '0.5px'
//                                                                                     },
//                                                                                     '&:hover .MuiOutlinedInput-notchedOutline': {
//                                                                                         borderTop: 'none',
//                                                                                         borderLeft: 'none',
//                                                                                         borderRight: 'none',
//                                                                                         borderWidth: '0.5px'
//                                                                                     },
//                                                                                     '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
//                                                                                         borderTop: 'none',
//                                                                                         borderLeft: 'none',
//                                                                                         borderRight: 'none',
//                                                                                         borderWidth: '0.5px'
//                                                                                     },
//                                                                                 }}
//                                                                             />
//                                                                         )}
//                                                                     />
//                                                                     <ErrorMessage name='commune' component="div" style={{ color: 'red', fontSize: 12, marginTop: -2 }} />
//                                                                 </Stack>
//                                                             </Stack>

//                                                         </Stack>
//                                                     </TabPanel>

//                                                     <TabPanel value="2">
//                                                         <Stack width={"100%"} height={"100%"} spacing={0}>

//                                                             <Stack width={"100%"} height={"20%"} spacing={0.5} alignItems={'end'} alignContent={'end'}
//                                                                 direction={"row"} justifyContent={'end'}>

//                                                                 <Tooltip title="Ajouter un nouveau compte">
//                                                                     <IconButton
//                                                                         variant="contained"
//                                                                         style={{
//                                                                             width: "35px", height: '35px',
//                                                                             borderRadius: "5px", borderColor: "transparent",
//                                                                             backgroundColor: initial.theme,
//                                                                             textTransform: 'none', outline: 'none'
//                                                                         }}
//                                                                         onClick={handleOpenDialogAddNewCptModelDetail}
//                                                                     >
//                                                                         <TbPlaylistAdd style={{ width: '25px', height: '25px', color: 'white' }} />
//                                                                     </IconButton>
//                                                                 </Tooltip>

//                                                                 <Tooltip title="Supprimer le compte sélectionné">
//                                                                     <span>
//                                                                         <IconButton
//                                                                             onClick={handleOpenDialogConfirmDeleteCptChgFromDialogAddNewCpte}
//                                                                             variant="contained"
//                                                                             style={{
//                                                                                 width: "35px", height: '35px',
//                                                                                 borderRadius: "5px", borderColor: "transparent",
//                                                                                 backgroundColor: initial.button_delete_color,
//                                                                                 textTransform: 'none', outline: 'none'
//                                                                             }}
//                                                                         >
//                                                                             <IoMdTrash style={{ width: '40px', height: '40px', color: 'white' }} />
//                                                                         </IconButton>
//                                                                     </span>
//                                                                 </Tooltip>
//                                                             </Stack>

//                                                             <Stack width={"100%"} height={"500px"}>
//                                                                 <DataGrid
//                                                                     disableMultipleSelection={DataGridStyle.disableMultipleSelection}
//                                                                     disableColumnSelector={DataGridStyle.disableColumnSelector}
//                                                                     disableDensitySelector={DataGridStyle.disableDensitySelector}
//                                                                     localeText={frFR.components.MuiDataGrid.defaultProps.localeText}
//                                                                     disableRowSelectionOnClick
//                                                                     disableSelectionOnClick={true}
//                                                                     slots={{ toolbar: QuickFilter }}
//                                                                     sx={DataGridStyle.sx}
//                                                                     rowHeight={DataGridStyle.rowHeight}
//                                                                     columnHeaderHeight={DataGridStyle.columnHeaderHeight}
//                                                                     onRowSelectionModelChange={ids => {

//                                                                         if (ids.length === 1) {
//                                                                             //setDisableButtonAddCompteCharge(false);
//                                                                             setSelectedCptChgOnList(ids);
//                                                                         } else {
//                                                                             setSelectedCptChgOnList([0]);
//                                                                         }
//                                                                     }}
//                                                                     rows={listCptChg}
//                                                                     columns={columnHeaderAddNewRowModelDetail}
//                                                                     initialState={{
//                                                                         pagination: {
//                                                                             paginationModel: { page: 0, pageSize: 100 },
//                                                                         },
//                                                                     }}
//                                                                     pageSizeOptions={[50, 100]}
//                                                                     pagination={DataGridStyle.pagination}
//                                                                     checkboxSelection={DataGridStyle.checkboxSelection}
//                                                                     columnVisibilityModel={{
//                                                                         id: false,
//                                                                     }}
//                                                                 />
//                                                             </Stack>

//                                                         </Stack>
//                                                     </TabPanel>

//                                                     <TabPanel value="3">
//                                                         <Stack width={"100%"} height={"90%"} spacing={0} alignItems={"flex-start"}>
//                                                             <Stack width={"100%"} height={"40px"} spacing={0.5} alignItems={'end'} alignContent={'end'}
//                                                                 direction={"row"} justifyContent={'end'}>
//                                                                 <Tooltip title="Ajouter un nouveau compte">
//                                                                     <IconButton
//                                                                         onClick={handleOpenDialogAddNewCptTvaModelDetail}
//                                                                         variant="contained"
//                                                                         style={{
//                                                                             width: "35px", height: '35px',
//                                                                             borderRadius: "5px", borderColor: "transparent",
//                                                                             backgroundColor: initial.theme,
//                                                                             textTransform: 'none', outline: 'none'
//                                                                         }}
//                                                                     >
//                                                                         <TbPlaylistAdd style={{ width: '25px', height: '25px', color: 'white' }} />
//                                                                     </IconButton>
//                                                                 </Tooltip>

//                                                                 <Tooltip title="Supprimer le compte sélectionné">
//                                                                     <span>
//                                                                         <IconButton
//                                                                             onClick={handleOpenDialogConfirmDeleteCptTvaFromDialogAddNewCpte}
//                                                                             variant="contained"
//                                                                             style={{
//                                                                                 width: "35px", height: '35px',
//                                                                                 borderRadius: "5px", borderColor: "transparent",
//                                                                                 backgroundColor: initial.button_delete_color,
//                                                                                 textTransform: 'none', outline: 'none'
//                                                                             }}
//                                                                         >
//                                                                             <IoMdTrash style={{ width: '40px', height: '40px', color: 'white' }} />
//                                                                         </IconButton>
//                                                                     </span>
//                                                                 </Tooltip>
//                                                             </Stack>

//                                                             <Stack width={"100%"} height={"500px"}>
//                                                                 <DataGrid
//                                                                     disableMultipleSelection={DataGridStyle.disableMultipleSelection}
//                                                                     disableColumnSelector={DataGridStyle.disableColumnSelector}
//                                                                     disableDensitySelector={DataGridStyle.disableDensitySelector}
//                                                                     localeText={frFR.components.MuiDataGrid.defaultProps.localeText}
//                                                                     disableRowSelectionOnClick
//                                                                     disableSelectionOnClick={true}
//                                                                     slots={{ toolbar: QuickFilter }}
//                                                                     sx={DataGridStyle.sx}
//                                                                     rowHeight={DataGridStyle.rowHeight}
//                                                                     columnHeaderHeight={DataGridStyle.columnHeaderHeight}
//                                                                     onRowSelectionModelChange={ids => {

//                                                                         if (ids.length === 1) {
//                                                                             //setDisableButtonAddCompteTva(false);
//                                                                             setSelectedCptTvaOnList(ids);
//                                                                         } else {
//                                                                             setSelectedCptTvaOnList([0]);
//                                                                         }
//                                                                     }}
//                                                                     rows={listCptTva}
//                                                                     columns={columnHeaderAddNewRowModelDetail}
//                                                                     initialState={{
//                                                                         pagination: {
//                                                                             paginationModel: { page: 0, pageSize: 100 },
//                                                                         },
//                                                                     }}
//                                                                     pageSizeOptions={[50, 100]}
//                                                                     pagination={DataGridStyle.pagination}
//                                                                     checkboxSelection={DataGridStyle.checkboxSelection}
//                                                                     columnVisibilityModel={{
//                                                                         id: false,
//                                                                     }}
//                                                                 />
//                                                             </Stack>
//                                                         </Stack>
//                                                     </TabPanel>

//                                                 </TabContext>
//                                             </Box>
//                                         </Stack>

//                                     </DialogContent>
//                                     <DialogActions>
//                                         <Button autoFocus
//                                             variant='outlined'
//                                             style={{
//                                                 backgroundColor: 'transparent',
//                                                 color: initial.theme,
//                                                 width: "100px",
//                                                 textTransform: 'none',
//                                                 // outline: 'none'
//                                             }}
//                                             type='submit'
//                                             onClick={handleCloseDialogDetailModelAdd}
//                                         >
//                                             Annuler
//                                         </Button>
//                                         <Button autoFocus
//                                             style={{ backgroundColor: initial.theme, color: 'white', width: "100px", textTransform: 'none', outline: 'none' }}
//                                             type='submit'
//                                             onClick={handleSubmit}
//                                         >
//                                             Enregistrer
//                                         </Button>
//                                     </DialogActions>
//                                 </BootstrapDialog>

//                                 {/* MODAL POUR AJOUTER UN COMPTE DANS LA LISTE DES COMPTES DE CHARGES RATTACHES AU COMPTE A CREER*/}
//                                 <BootstrapDialog
//                                     onClose={handleCloseDialogAddNewCptModelDetail}
//                                     aria-labelledby="customized-dialog-title"
//                                     open={openDialogAddNewCptModelDetail}
//                                 >
//                                     <DialogTitle sx={{ m: 0, p: 2 }} id="customized-dialog-title" style={{ fontWeight: 'normal', width: '600px', height: '55px', backgroundColor: initial.normal_pupup_header_color }}>
//                                         <Typography variant='h10'>Ajouter un nouveau compte</Typography>
//                                     </DialogTitle>
//                                     <IconButton
//                                         style={{ color: 'red' }}
//                                         aria-label="close"
//                                         onClick={handleCloseDialogAddNewCptModelDetail}
//                                         sx={{
//                                             position: 'absolute',
//                                             right: 8,
//                                             top: 8,
//                                             color: (theme) => theme.palette.grey[500],
//                                         }}
//                                     >
//                                         <CloseIcon />
//                                     </IconButton>
//                                     <DialogContent dividers>

//                                         <Stack width={"90%"} height={"150px"} spacing={2} alignItems={'center'} alignContent={"center"}
//                                             direction={"column"} justifyContent={"center"} style={{ marginLeft: '10px' }}>

//                                             <FormControl variant="standard" required sx={{ m: 1, minWidth: 250 }}>
//                                                 <InputLabel id="demo-simple-select-standard-label">Compte</InputLabel>
//                                                 <Select
//                                                     labelId="demo-simple-select-standard-labelchg"
//                                                     id="demo-simple-select-standardchg"
//                                                     value={selectedCptAssocChg.idCpt}
//                                                     label={"cptchg"}
//                                                     onChange={(e) => saveCptChg(e.target.value)}
//                                                     sx={{ width: "500px", display: "flex", justifyContent: "left", alignItems: "flex-start", alignContent: "flex-start", textAlign: "left" }}
//                                                 >
//                                                     <MenuItem key={0} value={''}><em>Aucune sélection</em></MenuItem>
//                                                     {pcHorsCollectif.map((cpt) => (
//                                                         <MenuItem key={cpt.id} value={cpt.id}>{cpt.compte}: {cpt.libelle}</MenuItem>
//                                                     ))}
//                                                 </Select>
//                                             </FormControl>
//                                         </Stack>

//                                     </DialogContent>
//                                     <DialogActions>
//                                         <Button autoFocus
//                                             style={{ backgroundColor: initial.theme, color: 'white', width: "100px", textTransform: 'none', outline: 'none' }}
//                                             onClick={AddCptToTableCptChg(setFieldValue)}
//                                         >
//                                             Ajouter
//                                         </Button>
//                                     </DialogActions>
//                                 </BootstrapDialog>

//                                 {/* MODAL DE CONFIRMATION DE SUPPRIMER DE COMPTE DE CHARGE RATTACHE AU COMPTE A CREER */}
//                                 {openDialogDeleteCptChgFromAddNewCpt ? <PopupConfirmDelete msg={"Voulez-vous vraiment supprimer le compte sélectionné ?"} confirmationState={deleteCptChgPC(setFieldValue)} /> : null}


//                                 {/* MODAL POUR AJOUTER UN COMPTE DANS LA LISTE DES COMPTES DE TVA RATTACHES AU COMPTE A CREER*/}
//                                 <BootstrapDialog
//                                     onClose={handleCloseDialogAddNewCptTvaModelDetail}
//                                     aria-labelledby="customized-dialog-title"
//                                     open={openDialogAddNewCptTvaModelDetail}
//                                 >
//                                     <DialogTitle sx={{ m: 0, p: 2 }} id="customized-dialog-title" style={{ fontWeight: 'normal', width: '600px', height: '55px', backgroundColor: initial.normal_pupup_header_color }}>
//                                         <Typography variant='h10'>Ajouter un nouveau compte de TVA</Typography>
//                                     </DialogTitle>
//                                     <IconButton
//                                         style={{ color: 'red' }}
//                                         aria-label="close"
//                                         onClick={handleCloseDialogAddNewCptTvaModelDetail}
//                                         sx={{
//                                             position: 'absolute',
//                                             right: 8,
//                                             top: 8,
//                                             color: (theme) => theme.palette.grey[500],
//                                         }}
//                                     >
//                                         <CloseIcon />
//                                     </IconButton>
//                                     <DialogContent dividers>

//                                         <Stack width={"90%"} height={"150px"} spacing={2} alignItems={'center'} alignContent={"center"}
//                                             direction={"column"} justifyContent={"center"} style={{ marginLeft: '10px' }}>

//                                             <FormControl variant="standard" required sx={{ m: 1, minWidth: 250 }}>
//                                                 <InputLabel id="demo-simple-select-standard-label">Compte</InputLabel>
//                                                 <Select
//                                                     labelId="demo-simple-select-standard-labelchg"
//                                                     id="demo-simple-select-standardchg"
//                                                     value={selectedCptAssocTva.idCpt}
//                                                     label={"cptchg"}
//                                                     onChange={(e) => saveCptTva(e.target.value)}
//                                                     sx={{ width: "500px", display: "flex", justifyContent: "left", alignItems: "flex-start", alignContent: "flex-start", textAlign: "left" }}
//                                                 >
//                                                     <MenuItem key={0} value={''}><em>Aucune sélection</em></MenuItem>
//                                                     {pcOnlyCptTva.map((cpt) => (
//                                                         <MenuItem key={cpt.id} value={cpt.id}>{cpt.compte}: {cpt.libelle}</MenuItem>
//                                                     ))}
//                                                 </Select>
//                                             </FormControl>
//                                         </Stack>

//                                     </DialogContent>
//                                     <DialogActions>
//                                         <Button autoFocus
//                                             style={{ backgroundColor: initial.theme, color: 'white', width: "100px", textTransform: 'none', outline: 'none' }}
//                                             onClick={AddCptToTableCptTva(setFieldValue)}
//                                         >
//                                             Ajouter
//                                         </Button>
//                                     </DialogActions>
//                                 </BootstrapDialog>

//                                 {/* MODAL DE CONFIRMATION DE SUPPRESSION DE COMPTE DE TVA RATTACHE AU COMPTE A CREER */}
//                                 {openDialogDeleteCptTvaFromAddNewCpt ? <PopupConfirmDelete msg={"Voulez-vous vraiment supprimer le compte sélectionné ?"} confirmationState={deleteCptTvaPC(setFieldValue)} /> : null}
//                             </Form>
//                         )
//                     }}
//                 </Formik>

//                 {/* MODAL DE CONFIRMATION DE SUPPRESSION D'UN COMPTE DANS LE TABLEAU DU PLAN COMPTABLE */}
//                 {openDialogDeleteItemsPc ? <PopupConfirmDelete msg={"Voulez-vous vraiment supprimer les comptes sélectionnés ?"} confirmationState={deleteItemsPC} /> : null}

//                 <Stack height={"750px"} width={'100%'}>
//                     <DataGrid
//                         disableMultipleSelection={DataGridStyle.disableMultipleSelection}
//                         disableColumnSelector={DataGridStyle.disableColumnSelector}
//                         disableDensitySelector={DataGridStyle.disableDensitySelector}
//                         localeText={frFR.components.MuiDataGrid.defaultProps.localeText}
//                         disableRowSelectionOnClick
//                         disableSelectionOnClick={true}
//                         slots={{ toolbar: QuickFilter }}
//                         sx={DataGridStyle.sx}
//                         rowHeight={DataGridStyle.rowHeight}
//                         columnHeaderHeight={DataGridStyle.columnHeaderHeight}
//                         onRowSelectionModelChange={(ids) => {
//                             const single = Array.isArray(ids) && ids.length ? [ids[ids.length - 1]] : [];
//                             listDetailModelPCSelectedRow(single);
//                         }}
//                         rows={detailModel}
//                         columns={ParamPCModele_column.columnHeaderDetail(handleShowCptInfos)}
//                         initialState={{
//                             pagination: {
//                                 paginationModel: { page: 0, pageSize: 100 },
//                             },
//                         }}
//                         experimentalFeatures={{ columnPinning: true }}
//                         pageSizeOptions={[50, 100]}
//                         pagination={DataGridStyle.pagination}
//                         checkboxSelection={DataGridStyle.checkboxSelection}
//                         columnVisibilityModel={{
//                             id: false,
//                         }}
//                         rowSelectionModel={pcAllselectedRow}
//                     />
//                 </Stack>

//             </Stack>
//         </Box>
//     )
// }


import React, { useState } from 'react';
import {
    Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, Typography, IconButton, Drawer, Stack, Checkbox,
    TextField, InputAdornment, Button, Select, MenuItem, FormControl,
    Chip, Tooltip, Divider, Grid
} from '@mui/material';
import {
    Search as SearchIcon, Close as CloseIcon, ChevronRight as ChevronRightIcon,
    CalendarToday as CalendarIcon, VisibilityOutlined as ViewIcon,
    Add as AddIcon, FileUploadOutlined as ImportIcon, EditOutlined as EditIcon,
    DeleteOutline as DeleteIcon, BusinessCenter as BusinessIcon,
    Fingerprint as FingerprintIcon, Assessment as StatIcon, LocationOn as LocationIcon
} from '@mui/icons-material';

const PlanComptableFullWidth = () => {
    const [selectedModelId, setSelectedModelId] = useState(1);
    const [activeRow, setActiveRow] = useState(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    // Données
    const modeles = [
        { id: 1, nom: 'Modèle Standard' },
        { id: 2, nom: 'Modèle Holding' },
        { id: 3, nom: 'Modèle Agricole' },
        { id: 4, nom: 'Modèle Association' }
    ];

    const comptes = [
        { id: 101, dossier: 'SYS', compte: '10100000', libelle: 'Capital Social', nature: 'Général', nif: '123456789', stat: '2026-STAT-A', adresse: 'Siège Social, Paris' },
        { id: 102, dossier: 'SYS', compte: '40110000', libelle: 'Fournisseurs d\'exploitation', nature: 'Général', nif: '987654321', stat: '2026-STAT-B', adresse: 'Agence Lyon' }
    ];

    return (
        <Box sx={{ width: '100%', bgcolor: '#F8FAFC', display: 'flex', flexDirection: 'column', overflowX: 'hidden' }}>

            {/* ZONE DE CONTENU - 100% LARGEUR */}
            <Stack direction="row" spacing={3} sx={{ p: 4, flexGrow: 1, width: '100%', boxSizing: 'border-box' }}>

                {/* SIDEBAR MODÈLES (FIXE) */}
                <Box sx={{ width: 320, flexShrink: 0 }}>
                    <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                        <Button fullWidth variant="outlined" startIcon={<ImportIcon />} sx={{ borderRadius: '8px', fontWeight: 700, fontSize: '0.75rem', color: '#475569' }}>IMPORT</Button>
                        <Button fullWidth variant="contained" startIcon={<AddIcon />} sx={{ borderRadius: '8px', fontWeight: 700, fontSize: '0.75rem', bgcolor: '#0A192F', color: '#00E5FF' }}>AJOUTER</Button>
                    </Stack>

                    <TableContainer component={Paper} elevation={0} sx={{ borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                        <Table size="small">
                            <TableHead>
                                <TableRow sx={{ bgcolor: '#0A192F' }}>
                                    <TableCell sx={headStyle}>NOM DU MODÈLE</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {modeles.map((m) => (
                                    <TableRow key={m.id} hover onClick={() => setSelectedModelId(m.id)} sx={{ cursor: 'pointer', bgcolor: selectedModelId === m.id ? 'rgba(0, 229, 255, 0.05)' : 'transparent' }}>
                                        <TableCell sx={{ py: 2 }}>
                                            <Stack direction="row" alignItems="center" spacing={1}>
                                                <Checkbox size="small" checked={selectedModelId === m.id} sx={{ p: 0, '&.Mui-checked': { color: '#00E5FF' } }} />
                                                <Typography sx={{ fontSize: '0.85rem', fontWeight: selectedModelId === m.id ? 700 : 500 }}>{m.nom}</Typography>
                                            </Stack>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>

                {/* TABLEAU PRINCIPAL (S'ÉTIRE SUR TOUT LE RESTE) */}
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                        {/* Recherche collée au 2e tableau */}
                        <TextField
                            size="small"
                            placeholder="Rechercher un compte..."
                            InputProps={{
                                startAdornment: <SearchIcon sx={{ color: '#00E5FF', mr: 1, fontSize: 18 }} />,
                                sx: { borderRadius: '10px', bgcolor: '#FFF' }
                            }}
                            sx={{ width: 450 }}
                        />
                        {/* 2e Bouton ajouter */}
                        <Button variant="contained" startIcon={<AddIcon />} sx={{ borderRadius: '10px', fontWeight: 700, bgcolor: '#0A192F', color: '#00E5FF' }}>
                            NOUVEAU COMPTE
                        </Button>
                    </Stack>

                    <TableContainer component={Paper} elevation={0} sx={{ borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden', width: '100%' }}>
                        <Table size="small" sx={{ width: '100%' }}>
                            <TableHead>
                                <TableRow sx={{ bgcolor: '#0A192F' }}>
                                    <TableCell sx={headStyle}>Dossier</TableCell>
                                    <TableCell sx={headStyle}>Compte</TableCell>
                                    <TableCell sx={headStyle}>Libellé</TableCell>
                                    <TableCell sx={headStyle}>Nature</TableCell>
                                    <TableCell sx={{ ...headStyle, textAlign: 'right' }}>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody sx={{ bgcolor: '#FFF' }}>
                                {comptes.map((row) => (
                                    <TableRow key={row.id} hover>
                                        <TableCell sx={cellStyle}>{row.dossier}</TableCell>
                                        <TableCell sx={{ ...cellStyle, fontWeight: 800, color: '#0A192F' }}>{row.compte}</TableCell>
                                        <TableCell sx={cellStyle}>{row.libelle}</TableCell>
                                        <TableCell sx={cellStyle}>
                                            <Chip label={row.nature} size="small" sx={{ fontWeight: 800, fontSize: '0.65rem' }} />
                                        </TableCell>
                                        <TableCell sx={{ textAlign: 'right' }}>
                                            <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                                                <IconButton size="small" onClick={() => { setActiveRow(row); setIsDrawerOpen(true); }} sx={{ color: '#00E5FF' }}><ViewIcon fontSize="small" /></IconButton>
                                                <IconButton size="small"><EditIcon fontSize="small" /></IconButton>
                                                <IconButton size="small" sx={{ color: '#EF4444' }}><DeleteIcon fontSize="small" /></IconButton>
                                            </Stack>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            </Stack>

            {/* DRAWER AVEC TOUS LES CODES */}
            <Drawer anchor="right" open={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} PaperProps={{ sx: { width: 550, bgcolor: '#0A192F', color: '#FFF' } }}>
                {activeRow && (
                    <Box sx={{ p: 4 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 6 }}>
                            <Box>
                                <Typography variant="overline" sx={{ color: '#00E5FF', fontWeight: 800 }}>Détails complets</Typography>
                                <Typography variant="h4" sx={{ fontWeight: 800 }}>{activeRow.compte}</Typography>
                            </Box>
                            <IconButton onClick={() => setIsDrawerOpen(false)} sx={{ color: '#FFF', bgcolor: 'rgba(255,255,255,0.05)' }}><CloseIcon /></IconButton>
                        </Stack>

                        <Stack spacing={3}>
                            <Box sx={drawerCardStyle}>
                                <Stack direction="row" spacing={2} alignItems="center">
                                    <BusinessIcon sx={{ color: '#00E5FF' }} />
                                    <Box>
                                        <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 600 }}>LIBELLÉ DU COMPTE</Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 700 }}>{activeRow.libelle}</Typography>
                                    </Box>
                                </Stack>
                            </Box>

                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <Box sx={drawerCardStyle}>
                                        <FingerprintIcon sx={{ color: '#00E5FF', mb: 1 }} />
                                        <Typography variant="caption" display="block" sx={{ color: '#94A3B8', fontWeight: 600 }}>NIF</Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{activeRow.nif}</Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={6}>
                                    <Box sx={drawerCardStyle}>
                                        <StatIcon sx={{ color: '#00E5FF', mb: 1 }} />
                                        <Typography variant="caption" display="block" sx={{ color: '#94A3B8', fontWeight: 600 }}>STAT</Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{activeRow.stat}</Typography>
                                    </Box>
                                </Grid>
                            </Grid>

                            <Box sx={drawerCardStyle}>
                                <LocationIcon sx={{ color: '#00E5FF', mb: 1 }} />
                                <Typography variant="caption" display="block" sx={{ color: '#94A3B8', fontWeight: 600 }}>ADRESSE</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 700 }}>{activeRow.adresse}</Typography>
                            </Box>

                            <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)', my: 2 }} />

                            <Button variant="contained" fullWidth startIcon={<EditIcon />} sx={{ bgcolor: '#00E5FF', color: '#0A192F', fontWeight: 800, py: 1.5, borderRadius: '12px' }}>
                                MODIFIER LES INFORMATIONS
                            </Button>
                        </Stack>
                    </Box>
                )}
            </Drawer>
        </Box>
    );
};

// Styles
const headStyle = { color: '#FFF', fontSize: '0.75rem', fontWeight: 700, py: 2, border: 'none', textTransform: 'uppercase' };
const cellStyle = { fontSize: '0.85rem', color: '#475569', py: 2 };
const drawerCardStyle = { p: 2.5, bgcolor: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' };

export default PlanComptableFullWidth;
