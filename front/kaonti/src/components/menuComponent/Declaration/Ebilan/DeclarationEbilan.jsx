import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Typography, Stack, IconButton, Card, CardActionArea, CardContent, Divider } from '@mui/material';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import { useState } from 'react';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import ButtonGroup from '@mui/material/ButtonGroup';
import Button from '@mui/material/Button';
import { GoAlert } from "react-icons/go";
import { PiArticleThin } from "react-icons/pi";
import Badge from '@mui/material-next/Badge';
import { TbRefresh } from "react-icons/tb";
import Tooltip from '@mui/material/Tooltip';
import { IoMdTrash } from "react-icons/io";
import { TbPlaylistAdd } from "react-icons/tb";

import { init } from '../../../../../init';
import useAuth from '../../../../hooks/useAuth';
import { jwtDecode } from 'jwt-decode';
import axios from '../../../../../config/axios';
import toast from 'react-hot-toast';
import PopupTestSelectedFile from '../../../componentsTools/popupTestSelectedFile';
import { InfoFileStyle } from '../../../componentsTools/InfosFileStyle';
import { format } from 'date-fns';

import VirtualTableEbilan from '../../../componentsTools/DeclarationEbilan/virtualTableEbilan';
import VirtualTableDRFEbilan from '../../../componentsTools/DeclarationEbilan/virtualTableDRFEbilan';
import VirtualTableEVCPEbilan from '../../../componentsTools/DeclarationEbilan/virtualTableEVCPEbilan';
import VirtualTableSADEbilan from '../../../componentsTools/DeclarationEbilan/virtualTableSADEbilan';
import VirtualTableSDREbilan from '../../../componentsTools/DeclarationEbilan/virtualTableSDREbilan';
import VirtualTableModifiableEbilan from '../../../componentsTools/DeclarationEbilan/virtualTableModifiableEbilan';
import VirtualTableModifiableGroupableEbilanDA from '../../../componentsTools/DeclarationEbilan/virtualTableModifiableGroupableEbilanDA';
import VirtualTableModifiableGroupableEbilanDP from '../../../componentsTools/DeclarationEbilan/virtualTableModifiableGroupableEbilanDP';
import VirtualTableModifiableGroupableEbilanEIAFNC from '../../../componentsTools/DeclarationEbilan/virtualTableModifiableGroupableEbilanEIAFNC';

import PopupActionConfirm from '../../../componentsTools/popupActionConfirm';
import PopupConfirmDelete from '../../../componentsTools/popupConfirmDelete';
import PopupDetailAnomalie from '../../../componentsTools/popupDetailAnomalie';
import PopupModifBHIAPC from '../../../componentsTools/FormulaireModifTableauEbilan/popupModifBHIAPC';
import PopupModifMP from '../../../componentsTools/FormulaireModifTableauEbilan/popupModifMP';
import PopupModifDA from '../../../componentsTools/FormulaireModifTableauEbilan/popupModifDA';
import PopupModifDP from '../../../componentsTools/FormulaireModifTableauEbilan/popupModifDP';
import PopupModifEIAFNC from '../../../componentsTools/FormulaireModifTableauEbilan/popupModifEIAFNC';
import PopupModifSE from '../../../componentsTools/FormulaireModifTableauEbilan/popupModifSE';
import PopupModifNE from '../../../componentsTools/FormulaireModifTableauEbilan/popupModifNE';

import PopupImportToCsv from '../../../componentsTools/DeclarationEbilan/PopupImportEbilan/PopupImportToCsv';

import { BsCreditCard2FrontFill } from "react-icons/bs";
import { useTheme } from '@mui/material/styles';
import { FaLocationDot } from "react-icons/fa6";

import { URL } from '../../../../../config/axios';
import { CiLock } from "react-icons/ci";
import { CiUnlock } from "react-icons/ci";

import { getPopupTitle } from '../../../componentsTools/DeclarationEbilan/PopupImportEbilan/PopupFunctions/PopupConfig';

import ExportEbilanButton from '../../../componentsTools/DeclarationEbilan/ButtonEbilanExport/ExportEbilanButton/ExportEblianButton';
import ExportEbilanButtonAll from '../../../componentsTools/DeclarationEbilan/ButtonEbilanExport/ExportEbilanButton/ExportEbilanButtonAll';

import ImportEbilanButton from '../../../componentsTools/DeclarationEbilan/ButtonEbilanExport/ImportEbilanButton/ImportEbilanButton';
import usePermission from '../../../../hooks/usePermission';

import useAxiosPrivate from '../../../../../config/axiosPrivate';

const associeColumn = [
    {
        id: 'nom',
        label: 'Associés / actionnaires',
        minWidth: 500,
        align: 'left',
        //format: (value) => value.toLocaleString('en-US'),
    },
    {
        id: 'nbrpart',
        label: 'Nbr part.',
        minWidth: 150,
        align: 'right',
    },
    {
        id: 'adresse',
        label: 'Adresse',
        minWidth: 800,
        align: 'left',
    },
];

//données domiciliations bancaires
const domBankColumn = [
    {
        id: 'banque',
        label: 'Nom de la banque',
        minWidth: 400,
        align: 'left',
    },
    {
        id: 'numcompte',
        label: 'N° de compte',
        minWidth: 350,
        align: 'left',
    },
    {
        id: 'devise',
        label: 'Devise',
        minWidth: 100,
        align: 'left',
    },
    {
        id: 'tablepays.nompays',
        label: 'Pays',
        minWidth: 350,
        align: 'left',
    },
];

//colonne bilan
const BilanActifColumn = [
    {
        id: 'libelle',
        label: 'Actif',
        minWidth: 500,
        align: 'left',
        //format: (value) => value.toLocaleString('en-US'),
        isNumber: false
    },
    {
        id: 'note',
        label: 'Note',
        minWidth: 100,
        align: 'left',
        isNumber: false
    },
    {
        id: 'montantbrut',
        label: 'Montant brut',
        minWidth: 200,
        align: 'right',
        format: (value) => value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        isNumber: true
    },
    {
        id: 'montantamort',
        label: 'Amort. / perte val.',
        minWidth: 200,
        align: 'right',
        format: (value) => value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        isNumber: true
    },
    {
        id: 'montantnet',
        label: 'Montant net N',
        minWidth: 200,
        align: 'right',
        format: (value) => value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        isNumber: true
    },
    {
        id: 'montantnetn1',
        label: 'Montant net N-1',
        minWidth: 200,
        align: 'right',
        format: (value) => value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        isNumber: true
    },
];

const BilanPassifColumn = [
    {
        id: 'libelle',
        label: 'Capitaux propres et passifs',
        minWidth: 700,
        align: 'left',
        //format: (value) => value.toLocaleString('en-US'),
        isNumber: false
    },
    {
        id: 'note',
        label: 'Note',
        minWidth: 100,
        align: 'left',
        isNumber: false
    },
    {
        id: 'montantnet',
        label: 'Montant net N',
        minWidth: 200,
        align: 'right',
        format: (value) => value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        isNumber: true
    },
    {
        id: 'montantnetn1',
        label: 'Montant net N-1',
        minWidth: 200,
        align: 'right',
        format: (value) => value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        isNumber: true
    },
];

const crnColumn = [
    {
        id: 'libelle',
        label: 'Rubriques',
        minWidth: 700,
        align: 'left',
        //format: (value) => value.toLocaleString('en-US'),
        isNumber: false
    },
    {
        id: 'note',
        label: 'Note',
        minWidth: 100,
        align: 'left',
        isNumber: false
    },
    {
        id: 'senscalcul',
        label: 'Sens',
        minWidth: 80,
        align: 'center',
        isNumber: false
    },
    {
        id: 'montantnet',
        label: 'Montant net N',
        minWidth: 200,
        align: 'right',
        format: (value) => value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        isNumber: true
    },
    {
        id: 'montantnetn1',
        label: 'Montant net N-1',
        minWidth: 200,
        align: 'right',
        format: (value) => value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        isNumber: true
    },
];

const tftdColumn = [
    {
        id: 'libelle',
        label: 'Rubriques',
        minWidth: 700,
        align: 'left',
        //format: (value) => value.toLocaleString('en-US'),
        isNumber: false
    },
    {
        id: 'note',
        label: 'Note',
        minWidth: 100,
        align: 'left',
        isNumber: false
    },
    {
        id: 'senscalcul',
        label: 'Sens',
        minWidth: 80,
        align: 'center',
        isNumber: false
    },
    {
        id: 'montantnet',
        label: 'Montant net N',
        minWidth: 200,
        align: 'right',
        format: (value) => value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        isNumber: true
    },
    {
        id: 'montantnetn1',
        label: 'Montant net N-1',
        minWidth: 200,
        align: 'right',
        format: (value) => value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        isNumber: true
    },
];

const evcpColumn = [
    {
        id: 'rubriquesmatrix.libelle',
        label: 'Rubriques',
        minWidth: 300,
        align: 'left',
        //format: (value) => value.toLocaleString('en-US'),
        isNumber: false
    },
    {
        id: 'note',
        label: 'Note',
        minWidth: 100,
        align: 'left',
        isNumber: false
    },
    {
        id: 'capitalsocial',
        label: 'Capital social A6',
        minWidth: 200,
        align: 'right',
        format: (value) => value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        isNumber: true
    },
    {
        id: 'primereserve',
        label: 'Capital prime & res. B6',
        minWidth: 200,
        align: 'right',
        format: (value) => value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        isNumber: true
    },
    {
        id: 'ecartdevaluation',
        label: "Ecart d'évaluation C6",
        minWidth: 200,
        align: 'right',
        format: (value) => value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        isNumber: true
    },
    {
        id: 'resultat',
        label: "Résultat D6",
        minWidth: 200,
        align: 'right',
        format: (value) => value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        isNumber: true
    },
    {
        id: 'report_anouveau',
        label: "Report à nouveau E6",
        minWidth: 200,
        align: 'right',
        format: (value) => value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        isNumber: true
    },
    {
        id: 'total_varcap',
        label: "Total A6+B6+C6+D6+E6",
        minWidth: 200,
        align: 'right',
        format: (value) => value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        isNumber: true
    },
];

const drfColumn = [
    {
        id: 'rubriquesmatrix.libelle',
        label: 'Rubriques',
        minWidth: 700,
        align: 'left',
        //format: (value) => value.toLocaleString('en-US'),
        isNumber: false
    },
    {
        id: 'note',
        label: 'Note',
        minWidth: 100,
        align: 'left',
        isNumber: false
    },
    {
        id: 'signe',
        label: 'Signe',
        minWidth: 75,
        align: 'center',
        isNumber: false
    },
    {
        id: 'montant_brut',
        label: 'Montant',
        minWidth: 200,
        align: 'right',
        format: (value) => value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        isNumber: true
    },
];

const bhiapcColumn = [
    {
        id: 'nif',
        label: 'Nif',
        minWidth: 130,
        align: 'left',
        isnumber: false
    },
    {
        id: 'raison_sociale',
        label: 'Raison sociale',
        minWidth: 350,
        align: 'left',
        isnumber: false
    },
    {
        id: 'adresse',
        label: 'Adresse',
        minWidth: 300,
        align: 'left',
        isnumber: false
    },
    {
        id: 'montant_charge',
        label: 'Montant charge',
        minWidth: 200,
        align: 'right',
        format: (value) => {
            const v = Math.abs(value) < 1e-8 ? 0 : value;
            return v.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        },
        isnumber: true
    },
    {
        id: 'montant_beneficiaire',
        label: 'Montant bénéf.',
        minWidth: 200,
        align: 'right',
        format: (value) => {
            const v = Math.abs(value) < 1e-8 ? 0 : value;
            return v.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        },
        isnumber: true
    },
];

const mpColumn = [
    {
        id: 'marche',
        label: 'Marché',
        minWidth: 100,
        align: 'left',
        isnumber: false
    },
    {
        id: 'ref_marche',
        label: 'Référence du marché',
        minWidth: 500,
        align: 'left',
        isnumber: false
    },
    {
        id: 'date',
        label: 'Date du marché',
        minWidth: 150,
        align: 'center',
        format: (value) => {
            if (value) {
                const date = new Date(value);
                return date.toLocaleDateString('fr-FR');  // Format date en dd/mm/yyyy
            }
            return '';
        },
        isnumber: false
    },
    {
        id: 'date_paiement',
        label: 'Date paiement',
        minWidth: 150,
        align: 'center',
        format: (value) => {

            return new Date(value).toLocaleDateString('fr-FR');  // Format date en dd/mm/yyyy

        },
        isnumber: false
    },
    {
        id: 'montant_marche_ht',
        label: 'Montant marché HT',
        minWidth: 200,
        align: 'right',
        format: (value) => value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        isnumber: true
    },
    {
        id: 'montant_paye',
        label: 'Montant payé',
        minWidth: 200,
        align: 'right',
        format: (value) => value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        isnumber: true
    },
    {
        id: 'tmp',
        label: 'TMP',
        minWidth: 200,
        align: 'right',
        format: (value) => value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        isnumber: true
    },
];

const daColumn = [
    {
        id: 'rubriques_poste',
        label: 'Groupe',
        minWidth: 275,
        align: 'left',
        withSubTotal: false,
        sousgroupLabel: false,
        isnumber: false
    },
    {
        id: 'libelle',
        label: 'Designation',
        minWidth: 400,
        align: 'left',
        withSubTotal: false,
        sousgroupLabel: true,
        isnumber: false
    },
    {
        id: 'num_compte',
        label: 'N° compte',
        minWidth: 130,
        align: 'left',
        withSubTotal: false,
        sousgroupLabel: true,
        isnumber: false
    },
    {
        id: 'date_acquisition',
        label: 'Date acquis.',
        minWidth: 125,
        align: 'center',
        format: (value) => {
            if (value) {
                const date = new Date(value);
                return date.toLocaleDateString('fr-FR');  // Format date en dd/mm/yyyy
            }
            return '';
        },
        withSubTotal: false,
        sousgroupLabel: true,
        isnumber: false
    },
    {
        id: 'taux',
        label: 'Taux',
        minWidth: 60,
        align: 'center',
        withSubTotal: false,
        sousgroupLabel: true,
        isnumber: false
    },
    {
        id: 'valeur_acquisition',
        label: 'Valeur acquis. (A)',
        minWidth: 170,
        align: 'right',
        format: (value) => value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        withSubTotal: true,
        sousgroupLabel: true,
        isnumber: true,
    },
    {
        id: 'augmentation',
        label: 'Augmentation (B)',
        minWidth: 170,
        align: 'right',
        format: (value) => value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        withSubTotal: true,
        sousgroupLabel: true,
        isnumber: true,
    },
    {
        id: 'diminution',
        label: 'Diminution (C)',
        minWidth: 170,
        align: 'right',
        format: (value) => value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        withSubTotal: true,
        sousgroupLabel: true,
        isnumber: true,
    },
    {
        id: 'amort_anterieur',
        // label: "Amort. cumulés en début d'exercice (D)",
        label: "Amort. antérieur (D)",
        minWidth: 170,
        align: 'right',
        format: (value) => value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        withSubTotal: true,
        sousgroupLabel: true,
        isnumber: true,
    },
    {
        id: 'dotation_exercice',
        label: "Dot. exercice (E)",
        minWidth: 170,
        align: 'right',
        format: (value) => value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        withSubTotal: true,
        sousgroupLabel: true,
        isnumber: true,
    },
    {
        id: 'amort_cumule',
        label: "Amort. cumulés (F) = (D)+(E)",
        minWidth: 170,
        align: 'right',
        format: (value) => value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        withSubTotal: true,
        sousgroupLabel: true,
        isnumber: true,
    },
    {
        id: 'valeur_nette',
        label: "Valeur nette = (A)+(B)-(C)-(F)",
        minWidth: 170,
        align: 'right',
        format: (value) => value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        withSubTotal: true,
        sousgroupLabel: true,
        isnumber: true
    },
];

const dpColumn = [
    {
        id: 'nature_prov',
        label: 'Nature',
        minWidth: 300,
        align: 'left',
        withSubTotal: false,
        sousgroupLabel: false,
        isnumber: false
    },
    {
        id: 'libelle',
        label: 'Provisions',
        minWidth: 500,
        align: 'left',
        withSubTotal: false,
        sousgroupLabel: true,
        isnumber: false
    },
    {
        id: 'montant_debut_ex',
        label: 'Montant début exercice (A)',
        minWidth: 170,
        align: 'right',
        format: (value) => value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        withSubTotal: true,
        sousgroupLabel: true,
        isnumber: true
    },
    {
        id: 'augm_dot_ex',
        label: "Augmentation dot. de l'exercice (B)",
        minWidth: 170,
        align: 'right',
        format: (value) => value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        withSubTotal: true,
        sousgroupLabel: true,
        isnumber: true
    },
    {
        id: 'dim_repr_ex',
        label: "Diminution reprise de l'exercice (C)",
        minWidth: 170,
        align: 'right',
        format: (value) => value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        withSubTotal: true,
        sousgroupLabel: true,
        isnumber: true
    },
    {
        id: 'montant_fin',
        label: "Montant fin exercice (D) = (A)+(B)-(C)",
        minWidth: 170,
        align: 'right',
        format: (value) => value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        withSubTotal: true,
        sousgroupLabel: true,
        isnumber: true
    },
];

const eiafncColumn = [
    {
        id: 'rubriques_poste',
        label: 'Nature',
        minWidth: 300,
        align: 'left',
        withSubTotal: false,
        sousgroupLabel: false,
        isnumber: false
    },
    {
        id: 'num_compte',
        label: 'N° compte',
        minWidth: 150,
        align: 'left',
        withSubTotal: false,
        sousgroupLabel: true,
        isnumber: false
    },
    {
        id: 'libelle',
        label: 'Libellé',
        minWidth: 450,
        align: 'left',
        withSubTotal: false,
        sousgroupLabel: true,
        isnumber: false
    },
    {
        id: 'valeur_acquisition',
        label: "valeur brut début de l'exercice (A)",
        minWidth: 170,
        align: 'right',
        format: (value) => value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        withSubTotal: true,
        sousgroupLabel: true,
        isnumber: true
    },
    {
        id: 'augmentation',
        label: "Augmentation de l'exercice (B)",
        minWidth: 170,
        align: 'right',
        format: (value) => value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        withSubTotal: true,
        sousgroupLabel: true,
        isnumber: true
    },
    {
        id: 'diminution',
        label: "Diminution de l'exercice (C)",
        minWidth: 170,
        align: 'right',
        format: (value) => value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        withSubTotal: true,
        sousgroupLabel: true,
        isnumber: true
    },
    {
        id: 'valeur_brute',
        label: "val. brut clôture (D) = (A)+(B)-(C)",
        minWidth: 170,
        align: 'right',
        format: (value) => value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        withSubTotal: true,
        sousgroupLabel: true,
        isnumber: true
    },
];

const sadColumn = [
    {
        id: 'libelle',
        label: 'Constitution / Imputation',
        minWidth: 200,
        align: 'left',
        withSubTotal: false,
        sousgroupLabel: true,
        isNumber: false
    },
    {
        id: 'n6',
        label: "N-6",
        minWidth: 170,
        align: 'right',
        format: (value) => value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        withSubTotal: true,
        sousgroupLabel: true,
        isNumber: true
    },
    {
        id: 'n5',
        label: "N-5",
        minWidth: 170,
        align: 'right',
        format: (value) => value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        withSubTotal: true,
        sousgroupLabel: true,
        isNumber: true
    },
    {
        id: 'n4',
        label: "N-4",
        minWidth: 170,
        align: 'right',
        format: (value) => value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        withSubTotal: true,
        sousgroupLabel: true,
        isNumber: true
    },
    {
        id: 'n3',
        label: "N-3",
        minWidth: 170,
        align: 'right',
        format: (value) => value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        withSubTotal: true,
        sousgroupLabel: true,
        isNumber: true
    },
    {
        id: 'n2',
        label: "N-2",
        minWidth: 170,
        align: 'right',
        format: (value) => value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        withSubTotal: true,
        sousgroupLabel: true,
        isNumber: true
    },
    {
        id: 'n1',
        label: "N-1",
        minWidth: 170,
        align: 'right',
        format: (value) => value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        withSubTotal: true,
        sousgroupLabel: true,
        isNumber: true
    },
    {
        id: 'n',
        label: "N",
        minWidth: 170,
        align: 'right',
        format: (value) => value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        withSubTotal: true,
        sousgroupLabel: true,
        isNumber: true
    },
    {
        id: 'total_imputation',
        label: "Total imputation",
        minWidth: 170,
        align: 'right',
        format: (value) => value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        withSubTotal: true,
        sousgroupLabel: true,
        isNumber: true
    },
];

const sdrColumn = [
    {
        id: 'libelle',
        label: 'Constitution / Imputation',
        minWidth: 350,
        align: 'left',
        withSubTotal: false,
        sousgroupLabel: true,
        isNumber: false
    },
    {
        id: 'n6',
        label: "N-6",
        minWidth: 150,
        align: 'right',
        format: (value) => value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        withSubTotal: true,
        sousgroupLabel: true,
        isNumber: true
    },
    {
        id: 'n5',
        label: "N-5",
        minWidth: 150,
        align: 'right',
        format: (value) => value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        withSubTotal: true,
        sousgroupLabel: true,
        isNumber: true
    },
    {
        id: 'n4',
        label: "N-4",
        minWidth: 150,
        align: 'right',
        format: (value) => value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        withSubTotal: true,
        sousgroupLabel: true,
        isNumber: true
    },
    {
        id: 'n3',
        label: "N-3",
        minWidth: 150,
        align: 'right',
        format: (value) => value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        withSubTotal: true,
        sousgroupLabel: true,
        isNumber: true
    },
    {
        id: 'n2',
        label: "N-2",
        minWidth: 150,
        align: 'right',
        format: (value) => value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        withSubTotal: true,
        sousgroupLabel: true,
        isNumber: true
    },
    {
        id: 'n1',
        label: "N-1",
        minWidth: 150,
        align: 'right',
        format: (value) => value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        withSubTotal: true,
        sousgroupLabel: true,
        isNumber: true
    },
    {
        id: 'exercice',
        label: "Exercice",
        minWidth: 150,
        align: 'right',
        format: (value) => value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        withSubTotal: true,
        sousgroupLabel: true,
        isNumber: true
    },
    {
        id: 'total',
        label: "Total",
        minWidth: 150,
        align: 'right',
        format: (value) => value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        withSubTotal: true,
        sousgroupLabel: true,
        isNumber: true
    },
    {
        id: 'solde_imputable',
        label: "Solde imp. sur ex. ultérieur",
        minWidth: 150,
        align: 'right',
        format: (value) => value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        withSubTotal: true,
        sousgroupLabel: true,
        isNumber: true
    },
    {
        id: 'solde_non_imputable',
        label: "Solde non imp. sur ex. ultérieur",
        minWidth: 150,
        align: 'right',
        format: (value) => value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        withSubTotal: true,
        sousgroupLabel: true,
        isNumber: true
    },
];

const seColumn = [
    {
        id: 'liste_emprunteur',
        label: 'Emprunteurs',
        minWidth: 150,
        align: 'left',
        withSubTotal: false,
        sousgroupLabel: true,
        isnumber: false
    },
    {
        id: 'date_contrat',
        label: 'Date contrat',
        minWidth: 120,
        align: 'center',
        format: (value) => {
            if (value) {
                const date = new Date(value);
                return date.toLocaleDateString('fr-FR');  // Format date en dd/mm/yyyy
            }
            return '';
        },
        withSubTotal: false,
        sousgroupLabel: true,
        isnumber: false
    },
    {
        id: 'duree_contrat',
        label: 'Durée contrat',
        minWidth: 100,
        align: 'left',
        withSubTotal: false,
        sousgroupLabel: true,
        isnumber: false
    },
    {
        id: 'montant_emprunt',
        label: "Montant emprunts (capital)",
        minWidth: 150,
        align: 'right',
        format: (value) => value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        withSubTotal: true,
        sousgroupLabel: true,
        isnumber: true
    },
    {
        id: 'montant_interet',
        label: "Montant intérêts",
        minWidth: 150,
        align: 'right',
        format: (value) => value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        withSubTotal: true,
        sousgroupLabel: true,
        isnumber: true
    },
    {
        id: 'montant_total',
        label: "Montant total",
        minWidth: 150,
        align: 'right',
        format: (value) => value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        withSubTotal: true,
        sousgroupLabel: true,
        isnumber: true
    },
    {
        id: 'date_disposition',
        label: 'Date mise à disp.',
        minWidth: 120,
        align: 'center',
        format: (value) => {
            if (value) {
                const date = new Date(value);
                return date.toLocaleDateString('fr-FR');  // Format date en dd/mm/yyyy
            }
            return '';
        },
        withSubTotal: false,
        sousgroupLabel: true,
        isnumber: false
    },
    {
        id: 'date_remboursement',
        label: 'Date de remboursement',
        minWidth: 120,
        align: 'center',
        format: (value) => {
            if (value) {
                const date = new Date(value);
                return date.toLocaleDateString('fr-FR');  // Format date en dd/mm/yyyy
            }
            return '';
        },
        withSubTotal: false,
        sousgroupLabel: true,
        isnumber: false
    },
    {
        id: 'montant_rembourse_capital',
        label: "Montant remb. de la période (capital)",
        minWidth: 150,
        align: 'right',
        format: (value) => value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        withSubTotal: true,
        sousgroupLabel: true,
        isnumber: true
    },
    {
        id: 'montant_rembourse_interet',
        label: "Montant remb. de la période (intérêts)",
        minWidth: 150,
        align: 'right',
        format: (value) => value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        withSubTotal: true,
        sousgroupLabel: true,
        isnumber: true
    },
    {
        id: 'solde_non_rembourse',
        label: "Solde non remb. fin d'exercice",
        minWidth: 150,
        align: 'right',
        format: (value) => value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        withSubTotal: true,
        sousgroupLabel: true,
        isnumber: true
    },
];

const neColumn = [
    {
        id: 'tableau',
        label: 'Tableau',
        minWidth: 150,
        align: 'left',
        withSubTotal: false,
        sousgroupLabel: true,
        isnumber: false
    },
    {
        id: 'ref_note',
        label: 'Note',
        minWidth: 150,
        align: 'left',
        withSubTotal: false,
        sousgroupLabel: true,
        isnumber: false
    },
    {
        id: 'commentaires',
        label: 'Commentaires',
        minWidth: 1000,
        align: 'left',
        withSubTotal: false,
        sousgroupLabel: true,
        isnumber: false
    },
];

export default function DeclarationEbilan() {
    const { canAdd, canModify, canDelete, canView } = usePermission();
    const axiosPrivate = useAxiosPrivate();

    //Valeur du listbox choix exercice ou situation-----------------------------------------------------
    let tabEbilan = ""
    if (typeof window !== 'undefined') {
        tabEbilan = localStorage.getItem('tabEbilan');
    }
    const [value, setValue] = useState(tabEbilan || "1");

    let initial = init[0];
    const [fileInfos, setFileInfos] = useState('');
    const [associeData, setAssocieData] = useState([]);
    const [domBankData, setDomBankData] = useState([]);
    const [fileId, setFileId] = useState(0);
    const { id } = useParams();
    const [noFile, setNoFile] = useState(false);

    const [selectedExerciceId, setSelectedExerciceId] = useState(0);
    const [selectedPeriodeId, setSelectedPeriodeId] = useState(0);
    const [selectedPeriodeChoiceId, setSelectedPeriodeChoiceId] = useState(0);
    const [listeExercice, setListeExercice] = useState([]);
    const [listeSituation, setListeSituation] = useState([]);

    const [showBilan, setShowBilan] = useState('actif');
    const [buttonActifVariant, setButtonActifVariant] = useState('contained');
    const [buttonPassifVariant, setButtonPassifVariant] = useState('outlined');

    const [verrBilan, setVerrBilan] = useState(false);
    const [verrCrn, setVerrCrn] = useState(false);
    const [verrCrf, setVerrCrf] = useState(false);
    const [verrTftd, setVerrTftd] = useState(false);
    const [verrTfti, setVerrTfti] = useState(false);
    const [verrEvcp, setVerrEvcp] = useState(false);
    const [verrDrf, setVerrDrf] = useState(false);
    const [verrBhiapc, setVerrBhiapc] = useState(false);
    const [verrMp, setVerrMp] = useState(false);
    const [verrDa, setVerrDa] = useState(false);
    const [verrDp, setVerrDp] = useState(false);
    const [verrEiafnc, setVerrEiafnc] = useState(false);
    const [verrSad, setVerrSad] = useState(false);
    const [verrSdr, setVerrSdr] = useState(false);
    const [verrSe, setVerrSe] = useState(false);
    const [verrNote, setVerrNote] = useState(false);
    const [deviseParDefaut, setDeviseParDefaut] = useState('MGA');

    const [bilanActifData, setBilanActifData] = useState([]);
    const [bilanPassifData, setBilanPassifData] = useState([]);
    const [crnData, setCrnData] = useState([]);
    const [crfData, setCrfData] = useState([]);
    const [tftdData, setTftdData] = useState([]);
    const [tftiData, setTftiData] = useState([]);
    const [evcpData, setEvcpData] = useState([]);
    const [drfData, setDrfData] = useState([]);
    const [bhiapcData, setBhiapcData] = useState([]);
    const [mpData, setMpData] = useState([]);
    const [daData, setDaData] = useState([]);
    const [dpData, setDpData] = useState([]);
    const [eiafncData, setEiafncData] = useState([]);
    const [sadData, setSadData] = useState([]);
    const [sdrData, setSdrData] = useState([]);
    const [seData, setSeData] = useState([]);
    const [neData, setNeData] = useState([]);

    const [showTableRefresh, setShowTableRefresh] = useState(false);
    const [tableToRefresh, setTableToRefresh] = useState('');
    const [msgRefresh, setMsgRefresh] = useState('');

    const [showFormBHIAPC, setShowFormBHIAPC] = useState(false);
    const [rowToModifyBHIAPC, setRowToModifyBHIAPC] = useState(false);
    const [choixActionBHIAPC, setChoixActionBHIAPC] = useState('');

    const [showFormMP, setShowFormMP] = useState(false);
    const [rowToModifyMP, setRowToModifyMP] = useState(false);
    const [choixActionMP, setChoixActionMP] = useState('');

    const [showFormDA, setShowFormDA] = useState(false);
    const [rowToModifyDA, setRowToModifyDA] = useState(false);
    const [choixActionDA, setChoixActionDA] = useState('');

    const [showFormDP, setShowFormDP] = useState(false);
    const [rowToModifyDP, setRowToModifyDP] = useState(false);
    const [choixActionDP, setChoixActionDP] = useState('');

    const [showFormEIAFNC, setShowFormEIAFNC] = useState(false);
    const [rowToModifyEIAFNC, setRowToModifyEIAFNC] = useState(false);
    const [choixActionEIAFNC, setChoixActionEIAFNC] = useState('');

    const [showFormSE, setShowFormSE] = useState(false);
    const [rowToModifySE, setRowToModifySE] = useState(false);
    const [choixActionSE, setChoixActionSE] = useState('');

    const [showFormNE, setShowFormNE] = useState(false);
    const [rowToModifyNE, setRowToModifyNE] = useState(false);
    const [choixActionNE, setChoixActionNE] = useState('');

    const [confirmDeleteOneRow, setConfirmDeleteOneRow] = useState(false);
    const [infoRowToDelete, setInfoRowToDelete] = useState({ id: 0, tableau: '' });
    const [tableauToDeleteAllRow, setTableauToDeleteAllRow] = useState('');
    const [confirmDeleteAllRow, setConfirmDeleteAllRow] = useState(false);
    const [confirmShowAnomalie, setConfirmShowAnomalie] = useState(false);

    const [updateCalculEtatfinancier, setUpdateCalculEtatfinancier] = useState(false);

    const [listeAnomalie, setListeAnomalie] = useState([]);
    const [detailAnombilan, setDetailAnombilan] = useState([]);
    const [detailAnomcrn, setDetailAnomcrn] = useState([]);
    const [detailAnomcrf, setDetailAnomcrf] = useState([]);
    const [detailAnomtftd, setDetailAnomtftd] = useState([]);
    const [detailAnomtfti, setDetailAnomtfti] = useState([]);
    const [detailAnomevcp, setDetailAnomevcp] = useState([]);
    const [detailAnomdrf, setDetailAnomdrf] = useState([]);
    const [detailAnombhiapc, setDetailAnombhiapc] = useState([]);
    const [detailAnommp, setDetailAnommp] = useState([]);
    const [detailAnomda, setDetailAnomda] = useState([]);
    const [detailAnomdp, setDetailAnomdp] = useState([]);
    const [detailAnomeiafnc, setDetailAnomeiafnc] = useState([]);
    const [detailAnomsad, setDetailAnomsad] = useState([]);
    const [detailAnomsdr, setDetailAnomsdr] = useState([]);
    const [detailAnomse, setDetailAnomse] = useState([]);
    const [nbrAnomalieBILAN, setNbrAnomalieBILAN] = useState(0);
    const [nbrAnomalieCRN, setNbrAnomalieCRN] = useState(0);
    const [nbrAnomalieCRF, setNbrAnomalieCRF] = useState(0);
    const [nbrAnomalieTFTD, setNbrAnomalieTFTD] = useState(0);
    const [nbrAnomalieTFTI, setNbrAnomalieTFTI] = useState(0);
    const [nbrAnomalieEVCP, setNbrAnomalieEVCP] = useState(0);
    const [nbrAnomalieDRF, setNbrAnomalieDRF] = useState(0);
    const [nbrAnomalieBHIAPC, setNbrAnomalieBHIAPC] = useState(0);
    const [nbrAnomalieMP, setNbrAnomalieMP] = useState(0);
    const [nbrAnomalieDA, setNbrAnomalieDA] = useState(0);
    const [nbrAnomalieDP, setNbrAnomalieDP] = useState(0);
    const [nbrAnomalieEIAFNC, setNbrAnomalieEIAFNC] = useState(0);
    const [nbrAnomalieSAD, setNbrAnomalieSAD] = useState(0);
    const [nbrAnomalieSDR, setNbrAnomalieSDR] = useState(0);
    const [nbrAnomalieSE, setNbrAnomalieSE] = useState(0);

    const [isLoading, setIsLoading] = useState(false);

    const [openDialogGenerateAuto, setOpenDialogGenerateAuto] = useState(false);
    const [showPopupImportCsv, setShowPopupImportCsv] = useState(false);

    const theme = useTheme();

    //récupération infos de connexion
    const { auth } = useAuth();
    const decoded = auth?.accessToken ? jwtDecode(auth.accessToken) : undefined;
    const compteId = decoded.UserInfo.compteId || null;
    const userId = decoded.UserInfo.userId || null;
    const navigate = useNavigate();

    //Choix exercice
    const handleChangeExercice = (exercice_id) => {
        setSelectedExerciceId(exercice_id);
        setSelectedPeriodeChoiceId("0");
        setListeSituation(listeExercice?.filter((item) => item.id === exercice_id));
        setSelectedPeriodeId(exercice_id);

        recupRubriqueGlobal(compteId, fileId, exercice_id);
        infosVerrouillage(compteId, fileId, exercice_id);
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

    //Choix période
    const handleChangePeriode = (choix) => {
        setSelectedPeriodeChoiceId(choix);

        if (choix === 0) {
            setListeSituation(listeExercice?.filter((item) => item.id === selectedExerciceId));
            setSelectedPeriodeId(selectedExerciceId);

            recupRubriqueGlobal(compteId, fileId, selectedExerciceId);
            infosVerrouillage(compteId, fileId, selectedExerciceId);
        } else if (choix === 1) {
            GetListeSituation(selectedExerciceId);
        }
    }

    const handleChangeTAB = (event, newValue) => {
        setValue(newValue);
        localStorage.setItem('tabEbilan', newValue);
    };

    const handleOpenDialogConfirmRefresh = () => {
        setShowTableRefresh(true);
    }

    const handleCloseDialogConfirmRefresh = () => {
        setShowTableRefresh(false);
    }

    //Refresh tableau
    const handleRefreshTable = async (value) => {
        if (value) {
            try {
                await ActivateTableCalcul(compteId, fileId, selectedPeriodeId, tableToRefresh, true);
            } catch (error) {
                console.error("Erreur lors du rafraîchissement :", error);
            } finally {
                handleCloseDialogConfirmRefresh();
            }
        } else {
            handleCloseDialogConfirmRefresh();
        }
    }

    //===========================================================================================
    //TABLEAU BILAN
    //===========================================================================================

    //choix affichage tableau bilan (Actif ou passif = actif à l'ouverture)
    const choixAffichageBilan = (choix) => {
        setShowBilan(choix);

        if (choix === 'actif') {
            setButtonActifVariant('contained');
            setButtonPassifVariant('outlined');
        } else {
            setButtonActifVariant('outlined');
            setButtonPassifVariant('contained');
        }
    }
    //refresh table BILAN
    const refreshBILAN = () => {
        setTableToRefresh('BILAN');
        setMsgRefresh(`Voulez-vous vraiment actualiser les calculs pour le tableau du Bilan?`);
        handleOpenDialogConfirmRefresh();
    }

    //verouiller ou non le tableau de BILAN
    const lockTableBILAN = () => {
        verrouillerTableau(compteId, fileId, selectedPeriodeId, 'BILAN', verrBilan);
        setVerrBilan(!verrBilan);
    }

    //===========================================================================================
    //TABLEAU CRN
    //===========================================================================================

    //refresh table CRN
    const refreshCRN = () => {
        setTableToRefresh('CRN');
        setMsgRefresh(`Voulez-vous vraiment actualiser les calculs pour le tableau CRN?`);
        handleOpenDialogConfirmRefresh();
    }

    //verouiller ou non le tableau de CRN
    const lockTableCRN = () => {
        verrouillerTableau(compteId, fileId, selectedPeriodeId, 'CRN', verrCrn);
        setVerrCrn(!verrCrn);
    }

    //===========================================================================================
    //TABLEAU CRF
    //===========================================================================================

    //refresh table CRF
    const refreshCRF = () => {
        setTableToRefresh('CRF');
        setMsgRefresh(`Voulez-vous vraiment actualiser les calculs pour le tableau CRF?`);
        handleOpenDialogConfirmRefresh();
    }

    //verouiller ou non le tableau de CRF
    const lockTableCRF = () => {
        verrouillerTableau(compteId, fileId, selectedPeriodeId, 'CRF', verrCrf);
        setVerrCrf(!verrCrf);
    }

    //===========================================================================================
    //TABLEAU TFTD
    //===========================================================================================

    //refresh table TFTD
    const refreshTFTD = () => {
        setTableToRefresh('TFTD');
        setMsgRefresh(`Voulez-vous vraiment actualiser les calculs pour le tableau TFTD?`);
        handleOpenDialogConfirmRefresh();
    }

    //verouiller ou non le tableau de TFTD
    const lockTableTFTD = () => {
        verrouillerTableau(compteId, fileId, selectedPeriodeId, 'TFTD', verrTftd);
        setVerrTftd(!verrTftd);
    }

    //===========================================================================================
    //TABLEAU TFTI
    //===========================================================================================

    //refresh table TFTI
    const refreshTFTI = () => {
        setTableToRefresh('TFTI');
        setMsgRefresh(`Voulez-vous vraiment actualiser les calculs pour le tableau TFTI?`);
        handleOpenDialogConfirmRefresh();
    }

    //verouiller ou non le tableau de TFTI
    const lockTableTFTI = () => {
        verrouillerTableau(compteId, fileId, selectedPeriodeId, 'TFTI', verrTfti);
        setVerrTfti(!verrTfti);
    }

    //===========================================================================================
    //TABLEAU EVCP
    //===========================================================================================

    //refresh table EVCP
    const refreshEVCP = () => {
        setTableToRefresh('EVCP');
        setMsgRefresh(`Voulez-vous vraiment actualiser les calculs pour le tableau EVCP?`);
        handleOpenDialogConfirmRefresh();
    }

    //verouiller ou non le tableau EVCP
    const lockTableEVCP = () => {
        verrouillerTableau(compteId, fileId, selectedPeriodeId, 'EVCP', verrEvcp);
        setVerrEvcp(!verrEvcp);
    }

    //===========================================================================================
    //TABLEAU DRF
    //===========================================================================================

    //refresh table DRF
    const refreshDRF = () => {
        setTableToRefresh('DRF');
        setMsgRefresh(`Voulez-vous vraiment actualiser les calculs pour le tableau DRF?`);
        handleOpenDialogConfirmRefresh();
    }

    //verouiller ou non le tableau de DRF
    const lockTableDRF = () => {
        verrouillerTableau(compteId, fileId, selectedPeriodeId, 'DRF', verrDrf);
        setVerrDrf(!verrDrf);
    }

    //===========================================================================================
    //TABLEAU BHIAPC
    //===========================================================================================

    const handleOpenFormBHIAPC = () => {
        setShowFormBHIAPC(true);
    }

    const handleCloseFormBHIAPC = () => {
        setShowFormBHIAPC(false);
    }

    //supprimer une ligne de BHIAPC
    const deleteOneRowBHIAPC = (row) => {
        if (row.id > 0) {
            setInfoRowToDelete({ id: row.id, tableau: 'BHIAPC', action: row.type, nif: row.nif });
            setConfirmDeleteOneRow(true);
        } else {
            setConfirmDeleteOneRow(false);
        }
    }

    //supprimer toutes les lignes BHIAPC
    const deleteAllRowBHIAPC = () => {
        setTableauToDeleteAllRow('BHIAPC');
        setConfirmDeleteAllRow(true);
    }

    //ajouter une nouvelle ligne dans la table BHIAPC
    const handleAddNewRowBHIAPC = () => {
        setChoixActionBHIAPC('Ajout');
        setRowToModifyBHIAPC(
            {
                state: false,
                id: -1,
                nif: '',
                raisonsociale: '',
                adresse: '',
                montantcharge: '',
                montantbeneficiaire: ''
            }
        );
        handleOpenFormBHIAPC();
    }

    //modification d'une ligne de BHIAPC
    const modifyRowBHIAPC = (row) => {
        setRowToModifyBHIAPC(row);
        setChoixActionBHIAPC('Modification');
        handleOpenFormBHIAPC();
    }

    //verouiller ou non le tableau de BHIAPC
    const lockTableBHIAPC = () => {
        verrouillerTableau(compteId, fileId, selectedPeriodeId, 'BHIAPC', verrBhiapc);
        setVerrBhiapc(!verrBhiapc);
    }

    //===========================================================================================
    //TABLEAU MP
    //===========================================================================================

    //refresh table MP
    const refreshMP = () => {
        setTableToRefresh('MP');
        setMsgRefresh(`Voulez-vous vraiment actualiser les calculs pour le tableau MP?`);
        handleOpenDialogConfirmRefresh();
    }

    //ajouter une nouvelle ligne dans la table MP
    const handleOpenFormMP = () => {
        setShowFormMP(true);
    }

    const handleCloseFormMP = () => {
        setShowFormMP(false);
    }

    const handleAddNewRowMP = () => {
        setChoixActionMP('Ajout');
        setRowToModifyMP(
            {
                state: false,
                id: -1,
                marche: '',
                refmarche: '',
                date: '',
                datepaiement: '',
                montantht: 0,
                montantpaye: 0,
                montanttmp: 0,
            }
        );
        handleOpenFormMP();
    }

    //supprimer toutes les lignes MP
    const deleteAllRowMP = () => {
        setTableauToDeleteAllRow('MP');
        setConfirmDeleteAllRow(true);
    }

    //modification d'une ligne de MP
    const modifyRowMP = (row) => {
        setRowToModifyMP(row);
        setChoixActionMP('Modification');
        handleOpenFormMP();
    }

    //supprimer une ligne de MP
    const deleteOneRowMP = (row) => {
        if (row.id > 0) {
            setInfoRowToDelete({ id: row.id, tableau: 'MP' });
            setConfirmDeleteOneRow(true);
        } else {
            setConfirmDeleteOneRow(false);
        }
    }

    //verouiller ou non le tableau de MP
    const lockTableMP = () => {
        verrouillerTableau(compteId, fileId, selectedPeriodeId, 'MP', verrMp);
        setVerrMp(!verrMp);
    }

    //===========================================================================================
    //TABLEAU DA
    //===========================================================================================

    //ajouter une nouvelle ligne dans la table DA
    const handleOpenFormDA = () => {
        setShowFormDA(true);
    }

    const handleCloseFormDA = () => {
        setShowFormDA(false);
    }

    const handleAddNewRowDA = () => {
        setChoixActionDA('Ajout');
        setRowToModifyDA(
            {
                state: false,
                id: -1,
                rubriques_poste: '',
                libelle: '',
                num_compte: '',
                date_acquisition: '',
                taux: 0,
                valeur_acquisition: 0,
                augmentation: 0,
                diminution: 0,
                amort_anterieur: 0,
                dotation_exercice: 0,
                amort_cumule: 0,
                valeur_nette: 0
            }
        );
        handleOpenFormDA();
    }

    //modification d'une ligne de DA
    const modifyRowDA = (row) => {
        setRowToModifyDA(row);
        setChoixActionDA('Modification');
        handleOpenFormDA();
    }

    //supprimer une ligne de DA
    const deleteOneRowDA = (row) => {
        if (row.id > 0) {
            setInfoRowToDelete({ id: row.id, tableau: 'DA' });
            setConfirmDeleteOneRow(true);
        } else {
            setConfirmDeleteOneRow(false);
        }
    }

    //supprimer toutes les lignes DA
    const deleteAllRowDA = () => {
        setTableauToDeleteAllRow('DA');
        setConfirmDeleteAllRow(true);
    }

    //verouiller ou non le tableau de DA
    const lockTableDA = () => {
        verrouillerTableau(compteId, fileId, selectedPeriodeId, 'DA', verrDa);
        setVerrDa(!verrDa);
    }

    //===========================================================================================
    //TABLEAU DP
    //===========================================================================================

    //refresh table DP
    const refreshDP = () => {
        setTableToRefresh('DP');
        setMsgRefresh(`Voulez-vous vraiment actualiser les calculs pour le tableau DP?`);
        handleOpenDialogConfirmRefresh();
    }

    //ajouter une nouvelle ligne dans la table DP (pour les natures autres provisions seulement)
    const handleOpenFormDP = () => {
        setShowFormDP(true);
    }

    const handleCloseFormDP = () => {
        setShowFormDP(false);
    }

    const handleAddNewRowDP = () => {
        setChoixActionDP('Ajout');
        setRowToModifyDP(
            {
                state: false,
                id: -1,
                nature_prov: 'AUTRE',
                libelle: '',
                type_calcul: '',
                montant_debut_ex: 0,
                augm_dot_ex: 0,
                dim_repr_ex: 0,
                montant_fin: 0,
            }
        );
        handleOpenFormDP();
    }

    //supprimer toutes les lignes autres provisions du tableau DP
    const deleteAllRowDP = () => {
        setTableauToDeleteAllRow('DP');
        setConfirmDeleteAllRow(true);
    }

    //modification d'une ligne de DP
    const modifyRowDP = (row) => {
        setRowToModifyDP(row);
        setChoixActionDP('Modification');
        handleOpenFormDP();
    }

    //supprimer une ligne de DP
    const deleteOneRowDP = (row) => {
        if (row.id > 0) {
            setInfoRowToDelete({ id: row.id, tableau: 'DP' });
            setConfirmDeleteOneRow(true);
        } else {
            setConfirmDeleteOneRow(false);
        }
    }

    //verouiller ou non le tableau de DP
    const lockTableDP = () => {
        verrouillerTableau(compteId, fileId, selectedPeriodeId, 'DP', verrDp);
        setVerrDp(!verrDp);
    }

    //===========================================================================================
    //TABLEAU EIAFNC
    //===========================================================================================

    //ajouter une nouvelle ligne dans la table EIAFNC
    const handleOpenFormEIAFNC = () => {
        setShowFormEIAFNC(true);
    }

    const handleCloseFormEIAFNC = () => {
        setShowFormEIAFNC(false);
    }

    const handleAddNewRowEIAFNC = () => {
        setChoixActionEIAFNC('Ajout');
        setRowToModifyEIAFNC(
            {
                state: false,
                id: -1,
                rubriques_poste: '',
                num_compte: '',
                libelle: '',
                valeur_acquisition: 0,
                augmentation: 0,
                diminution: 0,
                valeur_brute: 0,
            }
        );
        handleOpenFormEIAFNC();
    }

    //supprimer toutes les lignes autres provisions du tableau EIAFNC
    const deleteAllRowEIAFNC = () => {
        setTableauToDeleteAllRow('EIAFNC');
        setConfirmDeleteAllRow(true);
    }

    //modification d'une ligne de EIAFNC
    const modifyRowEIAFNC = (row) => {
        setRowToModifyEIAFNC(row);
        setChoixActionEIAFNC('Modification');
        handleOpenFormEIAFNC();
    }

    //supprimer une ligne de EIAFNC
    const deleteOneRowEIAFNC = (row) => {
        if (row.id > 0) {
            setInfoRowToDelete({ id: row.id, tableau: 'EIAFNC' });
            setConfirmDeleteOneRow(true);
        } else {
            setConfirmDeleteOneRow(false);
        }
    }

    //verouiller ou non le tableau de EIAFNC
    const lockTableEIAFNC = () => {
        verrouillerTableau(compteId, fileId, selectedPeriodeId, 'EIAFNC', verrEiafnc);
        setVerrEiafnc(!verrEiafnc);
    }

    //===========================================================================================
    //TABLEAU SAD
    //===========================================================================================

    //refresh table SAD
    const refreshSAD = () => {
        setTableToRefresh('SAD');
        setMsgRefresh(`Voulez-vous vraiment actualiser les calculs pour le tableau SAD?`);
        handleOpenDialogConfirmRefresh();
    }

    //verouiller ou non le tableau de SAD
    const lockTableSAD = () => {
        verrouillerTableau(compteId, fileId, selectedPeriodeId, 'SAD', verrSad);
        setVerrSad(!verrSad);
    }

    //===========================================================================================
    //TABLEAU SDR
    //===========================================================================================

    //refresh table SDR
    const refreshSDR = () => {
        setTableToRefresh('SDR');
        setMsgRefresh(`Voulez-vous vraiment actualiser les calculs pour le tableau SDR?`);
        handleOpenDialogConfirmRefresh();
    }

    //verouiller ou non le tableau de SDR
    const lockTableSDR = () => {
        verrouillerTableau(compteId, fileId, selectedPeriodeId, 'SDR', verrSdr);
        setVerrSdr(!verrSdr);
    }

    //===========================================================================================
    //TABLEAU SE
    //===========================================================================================

    //ajouter une nouvelle ligne dans la table SE
    const handleOpenFormSE = () => {
        setShowFormSE(true);
    }

    const handleCloseFormSE = () => {
        setShowFormSE(false);
    }

    const handleAddNewRowSE = () => {
        setChoixActionSE('Ajout');
        setRowToModifySE(
            {
                state: false,
                id: -1,
                liste_emprunteur: '',
                date_contrat: '',
                duree_contrat: '',
                montant_emprunt: 0,
                montant_interet: 0,
                montant_total: 0,
                date_disposition: '',
                montant_rembourse_capital: 0,
                montant_rembourse_interet: 0,
                solde_non_rembourse: 0,
                date_remboursement: '',
            }
        );
        handleOpenFormSE();
    }

    //supprimer toutes les lignes autres provisions du tableau SE
    const deleteAllRowSE = () => {
        setTableauToDeleteAllRow('SE');
        setConfirmDeleteAllRow(true);
    }

    //modification d'une ligne de SE
    const modifyRowSE = (row) => {
        setRowToModifySE(row);
        setChoixActionSE('Modification');
        handleOpenFormSE();
    }

    //supprimer une ligne de SE
    const deleteOneRowSE = (row) => {
        if (row.id > 0) {
            setInfoRowToDelete({ id: row.id, tableau: 'SE' });
            setConfirmDeleteOneRow(true);
        } else {
            setConfirmDeleteOneRow(false);
        }
    }

    //verouiller ou non le tableau de SE
    const lockTableSE = () => {
        verrouillerTableau(compteId, fileId, selectedPeriodeId, 'SE', verrSe);
        setVerrSe(!verrSe);
    }

    //===========================================================================================
    //TABLEAU NE
    //===========================================================================================

    //ajouter une nouvelle ligne dans la table NE
    const handleOpenFormNE = () => {
        setShowFormNE(true);
    }

    const handleCloseFormNE = () => {
        setShowFormNE(false);
    }

    const handleAddNewRowNE = () => {
        setChoixActionNE('Ajout');
        setRowToModifyNE(
            {
                state: false,
                id: -1,
                tableau: '',
                ref_note: '',
                commentaires: '',
            }
        );
        handleOpenFormNE();
    }

    //supprimer toutes les lignes autres provisions du tableau NE
    const deleteAllRowNE = () => {
        setTableauToDeleteAllRow('NE');
        setConfirmDeleteAllRow(true);
    }

    //modification d'une ligne de NE
    const modifyRowNE = (row) => {
        setRowToModifyNE(row);
        setChoixActionNE('Modification');
        handleOpenFormNE();
    }

    //supprimer une ligne de NE
    const deleteOneRowNE = (row) => {
        if (row.id > 0) {
            setInfoRowToDelete({ id: row.id, tableau: 'NE' });
            setConfirmDeleteOneRow(true);
        } else {
            setConfirmDeleteOneRow(false);
        }
    }

    //verouiller ou non le tableau de NE
    const lockTableNE = () => {
        verrouillerTableau(compteId, fileId, selectedPeriodeId, 'NE', verrNote);
        setVerrNote(!verrNote);
    }

    //==============================================================================================
    //Affichage anomalie par tableau
    const showAnomalie = (tableau) => {
        setTableToRefresh(tableau);
        if (tableau === 'BILAN') {
            setListeAnomalie(detailAnombilan);
        } else if (tableau === 'CRN') {
            setListeAnomalie(detailAnomcrn);
        } else if (tableau === 'CRF') {
            setListeAnomalie(detailAnomcrf);
        } else if (tableau === 'TFTD') {
            setListeAnomalie(detailAnomtftd);
        } else if (tableau === 'TFTI') {
            setListeAnomalie(detailAnomtfti);
        } else if (tableau === 'EVCP') {
            setListeAnomalie(detailAnomevcp);
        } else if (tableau === 'DRF') {
            setListeAnomalie(detailAnomdrf);
        } else if (tableau === 'BHIAPC') {
            setListeAnomalie(detailAnombhiapc);
        } else if (tableau === 'MP') {
            setListeAnomalie(detailAnommp);
        } else if (tableau === 'DA') {
            setListeAnomalie(detailAnomda);
        } else if (tableau === 'DP') {
            setListeAnomalie(detailAnomdp);
        } else if (tableau === 'EIAFNC') {
            setListeAnomalie(detailAnomeiafnc);
        } else if (tableau === 'SAD') {
            setListeAnomalie(detailAnomsad);
        } else if (tableau === 'SDR') {
            setListeAnomalie(detailAnomsdr);
        } else if (tableau === 'SE') {
            setListeAnomalie(detailAnomse);
        }

        setConfirmShowAnomalie(true);
    }

    const closeDetailAnomalie = (value) => {
        if (value) {
            setConfirmShowAnomalie(false);
        }
    }

    // Api pour générer les tables auto
    const generateEbilanAuto = async (val) => {
        if (val) {
            setIsLoading(true);
            if (value === "4") {
                // BILAN
            } else if (value === "5") {
                // CRN
            } else if (value === "6") {
                // CRF
            } else if (value === "7") {
                // TFTD
            } else if (value === "8") {
                // TFTI
            } else if (value === "9") {
                // EVCP
            } else if (value === "10") {
                // DRF
            } else if (value === "11") {
                // BHIAPC
                await axios.post('/declaration/ebilan/generateBhiapcAuto', {
                    id_dossier: Number(fileId),
                    id_exercice: Number(selectedExerciceId),
                    id_compte: Number(compteId)
                })
                    .then((response) => {
                        const resData = response.data;
                        if (resData.state) {
                            toast.success(response?.data?.message);
                        } else {
                            toast.error(resData.message)
                        }
                    })
                    .catch((error) => {
                        toast.error(error.response?.data?.message || error.message);
                    })
            } else if (value === "12") {
                // MP
            } else if (value === "13") {
                // DA
            } else if (value === "14") {
                // DP
                await axios.post('/declaration/ebilan/generateDpAuto', {
                    id_dossier: Number(fileId),
                    id_exercice: Number(selectedExerciceId),
                    id_compte: Number(compteId)
                })
                    .then((response) => {
                        const resData = response.data;
                        if (resData.state) {
                            toast.success(response?.data?.message);
                        } else {
                            toast.error(resData.message)
                        }
                    })
                    .catch((error) => {
                        toast.error(error.response?.data?.message || error.message);
                    })
            } else if (value === "15") {
                // EIAFNC
            } else if (value === "16") {
                // SAD
            } else if (value === "17") {
                // SDR
            } else if (value === "18") {
                // SE
            } else if (value === "19") {
                // NE
            }
            setOpenDialogGenerateAuto(false);
            setIsLoading(false);
            recupRubriqueGlobal(compteId, fileId, selectedExerciceId);
        } else {
            setOpenDialogGenerateAuto(false);
        }
    }

    const GetInfosIdDossier = (id) => {
        axios.get(`/home/FileInfos/${id}`).then((response) => {
            const resData = response.data;

            if (resData.state) {
                setFileInfos(resData.fileInfos[0]);
                setAssocieData(resData.associe);
                setDomBankData(resData.domBank);
                setNoFile(false);
            } else {
                setFileInfos([]);
                setAssocieData([]);
                setDomBankData([]);
                setNoFile(true);
            }
        })
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

                canView ? recupRubriqueGlobal(compteId, id, exerciceNId[0].id) : null;
                infosVerrouillage(compteId, id, exerciceNId[0].id);
            } else {
                setListeExercice([]);
                //toast.error("une erreur est survenue lors de la récupération de la liste des exercices");
                return
            }
        })
    }

    //get information de vérouillage ou non des tableaus
    const infosVerrouillage = (compteId, fileId, exerciceId) => {
        axios.post(`/declaration/ebilan/infosVerrouillage`, { compteId, fileId, exerciceId }).then((response) => {
            const resData = response.data;
            if (resData.state) {
                setVerrBilan(resData.liste.find((item) => item.code === 'BILAN')?.valide);
                setVerrCrn(resData.liste.find((item) => item.code === 'CRN')?.valide);
                setVerrCrf(resData.liste.find((item) => item.code === 'CRF')?.valide);
                setVerrTftd(resData.liste.find((item) => item.code === 'TFTD')?.valide);
                setVerrTfti(resData.liste.find((item) => item.code === 'TFTI')?.valide);
                setVerrEvcp(resData.liste.find((item) => item.code === 'EVCP')?.valide);
                setVerrDrf(resData.liste.find((item) => item.code === 'DRF')?.valide);
                setVerrBhiapc(resData.liste.find((item) => item.code === 'BHIAPC')?.valide);
                setVerrMp(resData.liste.find((item) => item.code === 'MP')?.valide);
                setVerrDa(resData.liste.find((item) => item.code === 'DA')?.valide);
                setVerrDp(resData.liste.find((item) => item.code === 'DP')?.valide);
                setVerrEiafnc(resData.liste.find((item) => item.code === 'EIAFNC')?.valide);
                setVerrSad(resData.liste.find((item) => item.code === 'SAD')?.valide);
                setVerrSdr(resData.liste.find((item) => item.code === 'SDR')?.valide);
                setVerrSe(resData.liste.find((item) => item.code === 'SE')?.valide);
                setVerrNote(resData.liste.find((item) => item.code === 'NE')?.valide);
            } else {
                toast.error(resData.msg);
            }
        });
    }

    //get information de vérouillage ou non des tableaus
    const verrouillerTableau = (compteId, fileId, exerciceId, tableau, stateVerr) => {
        const verr = !stateVerr;
        axios.post(`/declaration/ebilan/verrouillerTableau`, { compteId, fileId, exerciceId, tableau, verr }).then((response) => {
            const resData = response.data;
            if (resData.state) {
                infosVerrouillage(compteId, fileId, selectedPeriodeId);
            } else {
                toast.error(resData.msg);
            }
        });
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

    //fonction standard suppresion d'une ligne d'un tableau
    const deleteOneRow = (value) => {
        if (value) {
            const exerciceId = selectedPeriodeId;
            axiosPrivate.post(`/declaration/ebilan/deleteTableOneRow`, { compteId, fileId, exerciceId, infoRowToDelete }).then((response) => {
                const resData = response.data;
                if (resData.state) {
                    const tableau = infoRowToDelete.tableau;

                    switch (tableau) {
                        case 'BHIAPC':
                            setBhiapcData(resData.liste);
                            break;
                        case 'MP':
                            setMpData(resData.liste);
                            break;
                        case 'DA': {
                            setDaData(resData.liste);
                            break;
                        }
                        case 'DP': {
                            setDpData(resData.liste);
                            break;
                        }
                        case 'EIAFNC': {
                            setEiafncData(resData.liste);
                            break;
                        }
                        case 'SE':
                            setSeData(resData.liste);
                            break;
                        case 'NE':
                            setNeData(resData.liste);
                            break;
                        default:
                            console.warn("Tableau non reconnu :", tableau);
                    }

                    toast.success(resData.msg);
                    setConfirmDeleteOneRow(false);
                } else {
                    toast.error(resData.msg);
                }
            });
        } else {
            setConfirmDeleteOneRow(false);
        }
    }

    //fonction standard suppresion d'une ligne d'un tableau
    const deleteAllRow = (value) => {
        if (value) {
            const exerciceId = selectedPeriodeId;
            axiosPrivate.post(`/declaration/ebilan/deleteTableAllRow`, { compteId, fileId, exerciceId, tableauToDeleteAllRow }).then((response) => {
                const resData = response.data;
                if (resData.state) {
                    toast.success(resData.msg);
                    recupRubriqueGlobal(compteId, fileId, exerciceId);
                    setConfirmDeleteAllRow(false);
                } else {
                    toast.error(resData.msg);
                }
            });
        } else {
            setConfirmDeleteAllRow(false);
        }
    }

    const recupRubriqueGlobal = (compteId, fileId, exerciceId) => {
        axios.post('/declaration/ebilan/getEbilan', {
            id_compte: Number(compteId),
            id_dossier: Number(fileId),
            id_exercice: Number(exerciceId)
        })
            .then((response) => {
                const resData = response?.data;
                if (resData?.state) {
                    setBilanActifData(resData?.bilanActif);
                    setBilanPassifData(resData?.bilanPassif);
                    setCrnData(resData?.crn);
                    setCrfData(resData?.crf);
                    setTftdData(resData?.tftd);
                    setTftiData(resData?.tfti);
                    setEvcpData(resData?.evcp);
                    setDrfData(resData?.drf);
                    setBhiapcData(resData?.bhiapc);
                    setMpData(resData?.mp);
                    setDaData(resData?.da);
                    setDpData(resData?.dp);
                    setEiafncData(resData?.eiafnc);
                    setSadData(resData?.sad);
                    setSdrData(resData?.sdr);
                    setSeData(resData?.se);
                    setNeData(resData?.ne);

                    setDetailAnombilan(resData.detailAnomBilan);
                    setDetailAnomcrn(resData.detailAnomCrn);
                    setDetailAnomcrf(resData.detailAnomCrf);
                    setDetailAnomtftd(resData.detailAnomTftd);
                    setDetailAnomtfti(resData.detailAnomTfti);
                    setDetailAnomevcp(resData.detailAnomEvcp);
                    setDetailAnomdrf(resData.detailAnomDrf);
                    setDetailAnombhiapc(resData.detailAnomBhiapc);
                    setDetailAnommp(resData.detailAnomMp);
                    setDetailAnomda(resData.detailAnomDa);
                    setDetailAnomdp(resData.detailAnomDp);
                    setDetailAnomeiafnc(resData.detailAnomEiafnc);
                    setDetailAnomsad(resData.detailAnomSad);
                    setDetailAnomsdr(resData.detailAnomSdr);
                    setDetailAnomse(resData.detailAnomSe);

                    setNbrAnomalieBILAN(resData.etatglobal.find((item) => item.code === 'BILAN')?.nbranomalie);
                    setNbrAnomalieCRN(resData.etatglobal.find((item) => item.code === 'CRN')?.nbranomalie);
                    setNbrAnomalieCRF(resData.etatglobal.find((item) => item.code === 'CRF')?.nbranomalie);
                    setNbrAnomalieTFTD(resData.etatglobal.find((item) => item.code === 'TFTD')?.nbranomalie);
                    setNbrAnomalieTFTI(resData.etatglobal.find((item) => item.code === 'TFTI')?.nbranomalie);
                    setNbrAnomalieEVCP(resData.etatglobal.find((item) => item.code === 'EVCP')?.nbranomalie);
                    setNbrAnomalieDRF(resData.etatglobal.find((item) => item.code === 'DRF')?.nbranomalie);
                    setNbrAnomalieBHIAPC(resData.etatglobal.find((item) => item.code === 'BHIAPC')?.nbranomalie);
                    setNbrAnomalieMP(resData.etatglobal.find((item) => item.code === 'MP')?.nbranomalie);
                    setNbrAnomalieDA(resData.etatglobal.find((item) => item.code === 'DA')?.nbranomalie);
                    setNbrAnomalieDP(resData.etatglobal.find((item) => item.code === 'DP')?.nbranomalie);
                    setNbrAnomalieEIAFNC(resData.etatglobal.find((item) => item.code === 'EIAFNC')?.nbranomalie);
                    setNbrAnomalieSAD(resData.etatglobal.find((item) => item.code === 'SAD')?.nbranomalie);
                    setNbrAnomalieSDR(resData.etatglobal.find((item) => item.code === 'SDR')?.nbranomalie);
                    setNbrAnomalieSE(resData.etatglobal.find((item) => item.code === 'SE')?.nbranomalie);

                    toast.success('Données récupérées avec succès');
                }
            });
    }

    //Actualisation d'un tableau
    const ActivateTableCalcul = async (compteId, fileId, exerciceId, tableau, refreshTotal) => {
        try {
            setIsLoading(true);
            const response = await axios.post(`/declaration/ebilan/activateCalcul`, { compteId, fileId, exerciceId, tableau, refreshTotal });
            const resData = response.data;

            if (resData.state) {
                switch (tableau) {
                    case 'BILAN':
                        setBilanActifData(resData.list1 ? resData.list1 : []);
                        setBilanPassifData(resData.list2 ? resData.list2 : []);

                        setDetailAnombilan(resData.detailAnom);
                        setNbrAnomalieBILAN(resData.etatglobal.find((item) => item.code === 'BILAN')?.nbranomalie);

                        break;
                    case 'CRN':
                        setCrnData(resData.list1);

                        setDetailAnomcrn(resData.detailAnom);
                        setNbrAnomalieCRN(resData.etatglobal.find((item) => item.code === 'CRN')?.nbranomalie);

                        break;
                    case 'CRF':
                        setCrfData(resData.list1);

                        setDetailAnomcrf(resData.detailAnom);
                        setNbrAnomalieCRF(resData.etatglobal.find((item) => item.code === 'CRF')?.nbranomalie);

                        break;
                    case 'TFTD':
                        setTftdData(resData.list1);

                        setDetailAnomtftd(resData.detailAnom);
                        setNbrAnomalieTFTD(resData.etatglobal.find((item) => item.code === 'TFTD')?.nbranomalie);

                        break;
                    case 'TFTI':
                        setTftiData(resData.list1);

                        setDetailAnomtfti(resData.detailAnom);
                        setNbrAnomalieTFTI(resData.etatglobal.find((item) => item.code === 'TFTI')?.nbranomalie);

                        break;
                    case 'EVCP':
                        setEvcpData(resData.list1);

                        setDetailAnomevcp(resData.detailAnom);
                        setNbrAnomalieEVCP(resData.etatglobal.find((item) => item.code === 'EVCP')?.nbranomalie);

                        break;
                    case 'DRF':
                        setDrfData(resData.list1);

                        setDetailAnomdrf(resData.detailAnom);
                        setNbrAnomalieDRF(resData.etatglobal.find((item) => item.code === 'DRF')?.nbranomalie);

                        break;
                    case 'SAD':
                        setSadData(resData.list1);

                        setDetailAnomsad(resData.detailAnom);
                        setNbrAnomalieSAD(resData.etatglobal.find((item) => item.code === 'SAD')?.nbranomalie);

                        break;
                    case 'SDR':
                        setSdrData(resData.list1);

                        setDetailAnomsdr(resData.detailAnom);
                        setNbrAnomalieSDR(resData.etatglobal.find((item) => item.code === 'SDR')?.nbranomalie);

                        break;
                    default:
                        console.warn("Tableau non reconnu :", tableau);
                }
                toast.success(resData.msg);
            } else {
                toast.error(resData.msg);
            }

            setIsLoading(false);
        } catch (error) {
            toast.error("Erreur lors de l'activation du calcul");
            console.error(error);
            throw error;
        }
    }

    const AddOrModifyRowBHIAPC = (formData) => {
        if (formData.state) {
            const exerciceId = selectedPeriodeId;
            const tableau = 'BHIAPC';
            axiosPrivate.post(`/declaration/ebilan/addmodifyTableau`, { compteId, fileId, exerciceId, tableau, formData }).then((response) => {
                const resData = response.data;
                if (resData.state) {
                    setBhiapcData(resData.liste);
                    toast.success(resData.msg);
                    handleCloseFormBHIAPC();
                } else {
                    toast.error(resData.msg);
                }
            });
        } else {
            handleCloseFormBHIAPC();
        }
    }

    const AddOrModifyRowMP = (formData) => {
        if (formData.state) {
            const exerciceId = selectedPeriodeId;
            const tableau = 'MP';
            axiosPrivate.post(`/declaration/ebilan/addmodifyTableau`, { compteId, fileId, exerciceId, tableau, formData }).then((response) => {
                const resData = response.data;
                if (resData.state) {
                    setMpData(resData.liste);
                    handleCloseFormMP();
                    toast.success(resData.msg);
                } else {
                    toast.error(resData.msg);
                }
            });
        } else {
            handleCloseFormMP();
        }
    }

    const AddOrModifyRowDA = (formData) => {
        if (formData.state) {
            const exerciceId = selectedPeriodeId;
            const tableau = 'DA';
            axiosPrivate.post(`/declaration/ebilan/addmodifyTableau`, { compteId, fileId, exerciceId, tableau, formData }).then((response) => {
                const resData = response.data;
                if (resData.state) {
                    setDaData(resData.liste);
                    handleCloseFormDA();
                    toast.success(resData.msg);
                } else {
                    toast.error(resData.msg);
                }
            });
        } else {
            handleCloseFormDA();
        }
    }

    const AddOrModifyRowDP = (formData) => {
        if (formData.state) {
            const exerciceId = selectedPeriodeId;
            const tableau = 'DP';
            axiosPrivate.post(`/declaration/ebilan/addmodifyTableau`, { compteId, fileId, exerciceId, tableau, formData }).then((response) => {
                const resData = response.data;
                if (resData.state) {
                    setDpData(resData.liste);
                    handleCloseFormDP();
                    toast.success(resData.msg);
                } else {
                    toast.error(resData.msg);
                }
            });
        } else {
            handleCloseFormDP();
        }
    }

    const AddOrModifyRowEIAFNC = (formData) => {
        if (formData.state) {
            const exerciceId = selectedPeriodeId;
            const tableau = 'EIAFNC';
            axiosPrivate.post(`/declaration/ebilan/addmodifyTableau`, { compteId, fileId, exerciceId, tableau, formData }).then((response) => {
                const resData = response.data;
                if (resData.state) {
                    setEiafncData(resData.liste);
                    handleCloseFormEIAFNC();
                    toast.success(resData.msg);
                } else {
                    toast.error(resData.msg);
                }
            });
        } else {
            handleCloseFormEIAFNC();
        }
    }

    const AddOrModifyRowSE = (formData) => {
        if (formData.state) {
            const exerciceId = selectedPeriodeId;
            const tableau = 'SE';
            axiosPrivate.post(`/declaration/ebilan/addmodifyTableau`, { compteId, fileId, exerciceId, tableau, formData }).then((response) => {
                const resData = response.data;
                if (resData.state) {
                    setSeData(resData.liste);
                    handleCloseFormSE();
                    toast.success(resData.msg);
                } else {
                    toast.error(resData.msg);
                }
            });
        } else {
            handleCloseFormSE();
        }
    }

    const AddOrModifyRowNE = (formData) => {
        if (formData.state) {
            const exerciceId = selectedPeriodeId;
            const tableau = 'NE';
            axiosPrivate.post(`/declaration/ebilan/addmodifyTableau`, { compteId, fileId, exerciceId, tableau, formData }).then((response) => {
                const resData = response.data;
                if (resData.state) {
                    setNeData(resData.liste);
                    handleCloseFormNE();
                    toast.success(resData.msg);
                } else {
                    toast.error(resData.msg);
                }
            });
        } else {
            handleCloseFormNE();
        }
    }

    // Générer une tableau en PDF ou Excel
    const exportFile = (type) => {
        let libelle = "";
        if (value === "4") {
            libelle = "BILAN";
        } else if (value === "5") {
            libelle = "CRN";
        } else if (value === "6") {
            libelle = "CRF";
        } else if (value === "7") {
            libelle = "TFTD";
        } else if (value === "8") {
            libelle = "TFTI";
        } else if (value === "9") {
            libelle = "EVCP";
        } else if (value === "10") {
            libelle = "DRF";
        } else if (value === "11") {
            libelle = "BHIAPC";
        } else if (value === "12") {
            libelle = "MP";
        } else if (value === "13") {
            libelle = "DA";
        } else if (value === "14") {
            libelle = "DP";
        } else if (value === "15") {
            libelle = "EIAFNC";
        } else if (value === "16") {
            libelle = "SAD";
        } else if (value === "17") {
            libelle = "SDR";
        } else if (value === "18") {
            libelle = "SE";
        } else if (value === "19") {
            libelle = "NE";
        }

        if (type === "PDF") {
            window.open(
                `${URL}/declaration/ebilan/exportToPDF/${compteId}/${fileId}/${selectedExerciceId}/${libelle}`,
                "_blank"
            );
        } else {
            const link = document.createElement('a');
            link.href = `${URL}/declaration/ebilan/exportToExcel/${compteId}/${fileId}/${selectedExerciceId}/${libelle}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    // Générer toutes les tableaux en PDF ou Excel
    const exportAllFile = (type) => {
        if (type === 'PDF') {
            window.open(
                `${URL}/declaration/ebilan/exportAllToPDF/${compteId}/${fileId}/${selectedExerciceId}`,
                "_blank"
            );
        } else if (type === 'EXCEL') {
            const link = document.createElement('a');
            link.href = `${URL}/declaration/ebilan/exportAllToExcel/${compteId}/${fileId}/${selectedExerciceId}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else if (type === 'XML') {
            const link = document.createElement('a');
            link.href = `${URL}/declaration/ebilan/exportAllToXml/${compteId}/${fileId}/${selectedExerciceId}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    // Afficher le popup d'importation
    const handleShowPopupImport = () => {
        setShowPopupImportCsv(true);
    }

    // Ne pas afficher le popup d'importation
    const handleClosePopupImport = () => {
        setShowPopupImportCsv(false);
    }

    //Afficher le modal de confirmation de génération automatique
    const handleOpenDialogConfirmGenerateAuto = () => {
        setOpenDialogGenerateAuto(true);
    }

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
        GetListeExercice(idFile);
    }, []);

    useEffect(() => {
        if (fileId && compteId && selectedExerciceId) {
            getListeDevises();
        }
    }, [fileId, compteId, selectedExerciceId])

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
                showTableRefresh ?
                    <PopupActionConfirm
                        msg={msgRefresh}
                        confirmationState={handleRefreshTable}
                        isLoading={isLoading}
                    />
                    :
                    null
            }
            {
                (confirmDeleteOneRow && canDelete)
                    ?
                    <PopupConfirmDelete
                        msg={'Voulez-vous vraiement supprimer la ligne sélectionnée?'}
                        confirmationState={deleteOneRow}
                    />
                    :
                    null
            }
            {
                (confirmDeleteAllRow && canDelete)
                    ?
                    <PopupConfirmDelete
                        msg={'Voulez-vous vraiement supprimer toutes les lignes du tableau?'}
                        confirmationState={deleteAllRow}
                    />
                    :
                    null
            }

            {
                confirmShowAnomalie
                    ?
                    <PopupDetailAnomalie
                        id_compte={Number(compteId)}
                        id_dossier={Number(fileId)}
                        id_exercice={Number(selectedExerciceId)}
                        title={tableToRefresh}
                        rows={listeAnomalie}
                        confirmationState={closeDetailAnomalie}
                        tableToRefresh={tableToRefresh}
                    />
                    :
                    null
            }
            {
                showFormBHIAPC && (canAdd || canDelete)
                    ?
                    <PopupModifBHIAPC
                        choix={choixActionBHIAPC}
                        confirmationState={AddOrModifyRowBHIAPC}
                        data={rowToModifyBHIAPC}
                        deviseParDefaut={deviseParDefaut}
                    />
                    :
                    null
            }

            {
                showFormMP && (canAdd || canDelete)
                    ?
                    <PopupModifMP
                        choix={choixActionMP}
                        confirmationState={AddOrModifyRowMP}
                        data={rowToModifyMP}
                        deviseParDefaut={deviseParDefaut}
                    />
                    :
                    null
            }
            {
                showFormDA && (canAdd || canDelete)
                    ?
                    <PopupModifDA
                        choix={choixActionDA}
                        confirmationState={AddOrModifyRowDA}
                        data={rowToModifyDA}
                        deviseParDefaut={deviseParDefaut}
                    />
                    :
                    null
            }
            {
                showFormDP && (canAdd || canDelete)
                    ?
                    <PopupModifDP
                        choix={choixActionDP}
                        confirmationState={AddOrModifyRowDP}
                        data={rowToModifyDP}
                        deviseParDefaut={deviseParDefaut}
                    />
                    :
                    null
            }
            {
                showFormEIAFNC && (canAdd || canDelete)
                    ?
                    <PopupModifEIAFNC
                        choix={choixActionEIAFNC}
                        confirmationState={AddOrModifyRowEIAFNC}
                        data={rowToModifyEIAFNC}
                        deviseParDefaut={deviseParDefaut}
                    />
                    :
                    null
            }
            {
                showFormSE && (canAdd || canDelete)
                    ?
                    <PopupModifSE
                        choix={choixActionSE}
                        confirmationState={AddOrModifyRowSE}
                        data={rowToModifySE}
                        deviseParDefaut={deviseParDefaut}
                    />
                    :
                    null
            }
            {
                showFormNE && (canAdd || canDelete)
                    ?
                    <PopupModifNE
                        compteId={compteId}
                        fileId={fileId}
                        exerciceId={selectedPeriodeId}
                        choix={choixActionNE}
                        confirmationState={AddOrModifyRowNE}
                        data={rowToModifyNE}
                    />
                    :
                    null
            }
            {
                showPopupImportCsv
                    ?
                    <PopupImportToCsv
                        type={value}
                        closePopup={handleClosePopupImport}
                        id_compte={compteId}
                        id_dossier={fileId}
                        id_exercice={selectedExerciceId}
                        refreshTable={recupRubriqueGlobal}
                    />
                    :
                    null
            }
            {
                (openDialogGenerateAuto && canDelete) ?
                    <PopupActionConfirm
                        msg={`Voulez-vous vraiment actualiser les calculs pour le tableau du ${getPopupTitle(value)} ?`}
                        confirmationState={generateEbilanAuto}
                        isLoading={isLoading}
                    />
                    :
                    null
            }
            <Box>
                <TabContext value={"1"}>
                    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                        <TabList aria-label="lab API tabs example" style={{ textTransform: 'none', outline: 'none', border: 'none', }}>
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
                            <Typography variant='h6' sx={{ color: "black" }} align='left'>Déclaration - Ebilan</Typography>

                            <Stack width={"100%"} height={"80px"} spacing={4} alignItems={"left"} alignContent={"center"} direction={"row"} style={{ marginLeft: "0px", marginTop: "20px" }}>
                                <Stack
                                    direction={'row'}
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
                                                <MenuItem key={option.id} value={option.id}>{option.libelle_rang}: {format(option.date_debut, "dd/MM/yyyy")} - {format(option.date_fin, "dd/MM/yyyy")}</MenuItem>
                                            ))
                                            }
                                        </Select>
                                    </FormControl>

                                    <FormControl variant="standard" sx={{ m: 1, minWidth: 150 }}>
                                        <InputLabel id="demo-simple-select-standard-label">Période</InputLabel>
                                        <Select
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
                                {
                                    !["1", "2", "3"].includes(value) && listeExercice && listeExercice.length > 0 && selectedExerciceId && selectedExerciceId !== 0 && (
                                        <ExportEbilanButtonAll
                                            exportAllToPdf={() => exportAllFile("PDF")}
                                            exportAllToExcel={() => exportAllFile("EXCEL")}
                                            exportAllToXML={() => exportAllFile("XML")}
                                        />
                                    )
                                }

                            </Stack>

                            <Box sx={{ width: '100%', typography: 'body1' }}>
                                <TabContext value={value}>
                                    <Box sx={{ borderBottom: 1, borderColor: 'transparent' }}>
                                        <TabList onChange={handleChangeTAB} aria-label="lab API tabs example" variant='scrollable'>
                                            <Tab disabled={!listeExercice || listeExercice.length === 0 || !selectedExerciceId || selectedExerciceId === 0} style={{ textTransform: 'none', outline: 'none', border: 'none', }} label="infos société" value="1" />
                                            <Tab disabled={!listeExercice || listeExercice.length === 0 || !selectedExerciceId || selectedExerciceId === 0} style={{ textTransform: 'none', outline: 'none', border: 'none', }} label="actionnaires" value="2" />
                                            <Tab disabled={!listeExercice || listeExercice.length === 0 || !selectedExerciceId || selectedExerciceId === 0} style={{ textTransform: 'none', outline: 'none', border: 'none', }} label="dom. bancaire" value="3" />
                                            <Tab disabled={!listeExercice || listeExercice.length === 0 || !selectedExerciceId || selectedExerciceId === 0} style={{ textTransform: 'none', outline: 'none', border: 'none', }} label="bilan" value="4" />
                                            <Tab disabled={!listeExercice || listeExercice.length === 0 || !selectedExerciceId || selectedExerciceId === 0} style={{ textTransform: 'none', outline: 'none', border: 'none', }} label="crn" value="5" />
                                            <Tab disabled={!listeExercice || listeExercice.length === 0 || !selectedExerciceId || selectedExerciceId === 0} style={{ textTransform: 'none', outline: 'none', border: 'none', }} label="crf" value="6" />
                                            <Tab disabled={!listeExercice || listeExercice.length === 0 || !selectedExerciceId || selectedExerciceId === 0} style={{ textTransform: 'none', outline: 'none', border: 'none', }} label="tftd" value="7" />
                                            <Tab disabled={!listeExercice || listeExercice.length === 0 || !selectedExerciceId || selectedExerciceId === 0} style={{ textTransform: 'none', outline: 'none', border: 'none', }} label="tfti" value="8" />
                                            <Tab disabled={!listeExercice || listeExercice.length === 0 || !selectedExerciceId || selectedExerciceId === 0} style={{ textTransform: 'none', outline: 'none', border: 'none', }} label="evcp" value="9" />
                                            <Tab disabled={!listeExercice || listeExercice.length === 0 || !selectedExerciceId || selectedExerciceId === 0} style={{ textTransform: 'none', outline: 'none', border: 'none', }} label="drf" value="10" />
                                            <Tab disabled={!listeExercice || listeExercice.length === 0 || !selectedExerciceId || selectedExerciceId === 0} style={{ textTransform: 'none', outline: 'none', border: 'none', }} label="bhiapc" value="11" />
                                            <Tab disabled={!listeExercice || listeExercice.length === 0 || !selectedExerciceId || selectedExerciceId === 0} style={{ textTransform: 'none', outline: 'none', border: 'none', }} label="mp" value="12" />
                                            <Tab disabled={!listeExercice || listeExercice.length === 0 || !selectedExerciceId || selectedExerciceId === 0} style={{ textTransform: 'none', outline: 'none', border: 'none', }} label="da" value="13" />
                                            <Tab disabled={!listeExercice || listeExercice.length === 0 || !selectedExerciceId || selectedExerciceId === 0} style={{ textTransform: 'none', outline: 'none', border: 'none', }} label="dp" value="14" />
                                            <Tab disabled={!listeExercice || listeExercice.length === 0 || !selectedExerciceId || selectedExerciceId === 0} style={{ textTransform: 'none', outline: 'none', border: 'none', }} label="eiafnc" value="15" />
                                            <Tab disabled={!listeExercice || listeExercice.length === 0 || !selectedExerciceId || selectedExerciceId === 0} style={{ textTransform: 'none', outline: 'none', border: 'none', }} label="sad" value="16" />
                                            <Tab disabled={!listeExercice || listeExercice.length === 0 || !selectedExerciceId || selectedExerciceId === 0} style={{ textTransform: 'none', outline: 'none', border: 'none', }} label="sdr" value="17" />
                                            <Tab disabled={!listeExercice || listeExercice.length === 0 || !selectedExerciceId || selectedExerciceId === 0} style={{ textTransform: 'none', outline: 'none', border: 'none', }} label="se" value="18" />
                                            <Tab disabled={!listeExercice || listeExercice.length === 0 || !selectedExerciceId || selectedExerciceId === 0} style={{ textTransform: 'none', outline: 'none', border: 'none', }} label="note" value="19" />
                                        </TabList>
                                    </Box>

                                    <TabPanel value="1">
                                        <Stack
                                            width={"100%"}
                                            height={"100%"}
                                            spacing={3}
                                            alignItems={"flex-start"}
                                            alignContent={"flex-start"}
                                            justifyContent={"stretch"}
                                        >
                                            <Stack width={"100%"} height={"20px"} spacing={1} alignItems={"center"}
                                                alignContent={"center"} direction={"row"} justifyContent={"center"}>
                                                <Typography variant='h6' sx={{ color: "black" }} align='center'>Infos société</Typography>
                                            </Stack>

                                            <Card>
                                                <CardActionArea
                                                    sx={{
                                                        width: '80vw',
                                                        height: '400px',
                                                        '&[data-active]': {
                                                            backgroundColor: 'action.selected',
                                                            '&:hover': {
                                                                backgroundColor: 'action.selectedHover',
                                                            },
                                                        },
                                                        border: 'none',
                                                        '&:focus': {
                                                            outline: 'none',
                                                        },
                                                        '&:focus-visible': {
                                                            outline: 'none',
                                                        },
                                                        '&:active': {
                                                            outline: 'none',
                                                            border: 'none',
                                                            boxShadow: 'none',
                                                        },
                                                    }}
                                                >
                                                    <CardContent sx={{ height: '100%' }}>
                                                        <Typography variant="h5" fontWeight="normal" gutterBottom>
                                                            {fileInfos.raisonsociale}
                                                        </Typography>

                                                        <Divider sx={{ mb: 2 }} />

                                                        <Stack spacing={1}>
                                                            <Box display="flex" alignItems="center" gap={1}>
                                                                <BsCreditCard2FrontFill color={theme.palette.primary.main} />
                                                                <Typography variant="body1">
                                                                    nif : {fileInfos.nif}
                                                                </Typography>
                                                            </Box>

                                                            <Box display="flex" alignItems="center" gap={1}>
                                                                <BsCreditCard2FrontFill color={theme.palette.primary.main} />
                                                                <Typography variant="body1">
                                                                    N° Statistique : {fileInfos.stat}
                                                                </Typography>
                                                            </Box>

                                                            <Box display="flex" alignItems="center" gap={1}>
                                                                <FaLocationDot color={theme.palette.primary.main} />
                                                                <Typography variant="body1">
                                                                    Adresse : {fileInfos.adresse}
                                                                </Typography>
                                                            </Box>
                                                        </Stack>
                                                    </CardContent>
                                                </CardActionArea>
                                            </Card>
                                        </Stack>
                                    </TabPanel>

                                    <TabPanel value="2">
                                        <Stack width={"100%"} height={"100%"} spacing={3} alignItems={"flex-start"}
                                            alignContent={"flex-start"} justifyContent={"stretch"} >
                                            <Stack width={"100%"} height={"20px"} spacing={1} alignItems={"center"}
                                                alignContent={"center"} direction={"row"} justifyContent={"center"}>
                                                <Typography variant='h6' sx={{ color: "black" }} align='center'>Liste des actionnaires</Typography>
                                            </Stack>

                                            <Stack
                                                width={"100%"}
                                                height={"50vh"}
                                                alignItems={"start"}
                                                style={{ overflow: "auto" }}
                                            >
                                                <VirtualTableEbilan refreshTable={setUpdateCalculEtatfinancier} columns={associeColumn} rows={associeData} noCollapsible={true} deviseParDefaut={deviseParDefaut} />
                                            </Stack>
                                            {/* <TableListeActionnaireModel rows={rows} key={"ListeActionnaire"} /> */}
                                        </Stack>
                                    </TabPanel>

                                    <TabPanel value="3">
                                        <Stack width={"100%"} height={"100%"} spacing={3} alignItems={"flex-start"}
                                            alignContent={"flex-start"} justifyContent={"stretch"} >
                                            <Stack width={"100%"} height={"20px"} spacing={1} alignItems={"center"}
                                                alignContent={"center"} direction={"row"} justifyContent={"center"}>
                                                <Typography variant='h6' sx={{ color: "black" }} align='center'>Renseignement sur les domiciliations bancaires</Typography>
                                            </Stack>
                                            <Stack
                                                width={"100%"}
                                                height={"50vh"}
                                                alignItems={"start"}
                                                style={{ overflow: "auto" }}
                                            >
                                                <VirtualTableEbilan refreshTable={setUpdateCalculEtatfinancier} columns={domBankColumn} rows={domBankData} noCollapsible={true} deviseParDefaut={deviseParDefaut} />
                                            </Stack>
                                        </Stack>
                                    </TabPanel>

                                    {/* BILAN */}
                                    <TabPanel value="4">
                                        <Stack width={"100%"} height={"100%"} spacing={2} alignItems={"flex-start"}
                                            alignContent={"flex-start"} justifyContent={"stretch"}
                                        >
                                            <Stack width={"100%"} height={"20px"} spacing={1} alignItems={"center"}
                                                alignContent={"center"} direction={"row"} justifyContent={"center"}>
                                                <Typography variant='h6' sx={{ color: "black" }} align='center'>Bilan</Typography>
                                            </Stack>

                                            <Stack width={"100%"} height={"100%"} spacing={0} alignItems={"center"} alignContent={"center"}
                                                direction={"row"} style={{ marginLeft: "0px", marginTop: "00px" }}>

                                                <Stack width={"30%"} height={"30px"} spacing={2} alignItems={"left"} alignContent={"left"}
                                                    direction={"row"} justifyContent={"left"}
                                                >
                                                    <ButtonGroup
                                                        disableElevation
                                                        variant="contained"
                                                        aria-label="Disabled button group"
                                                    >
                                                        <Button
                                                            onClick={() => choixAffichageBilan('actif')}
                                                            variant={buttonActifVariant}
                                                            style={{ borderRadius: "0", textTransform: 'none', outline: 'none', width: 75 }}
                                                        >
                                                            Actif
                                                        </Button>
                                                        <Button
                                                            onClick={() => choixAffichageBilan('passif')}
                                                            variant={buttonPassifVariant}
                                                            style={{ borderRadius: "0", textTransform: 'none', outline: 'none', width: 75 }}
                                                        >
                                                            Passif
                                                        </Button>
                                                    </ButtonGroup>
                                                </Stack>

                                                <Stack width={"70%"} height={"30px"} spacing={0.5} alignItems={"center"} alignContent={"center"}
                                                    direction={"row"} justifyContent={"right"}>
                                                    <Tooltip title="Liste des anomalies">
                                                        <IconButton
                                                            onClick={() => showAnomalie('BILAN')}
                                                            style={{
                                                                textTransform: 'none', outline: 'none'
                                                            }}
                                                        >
                                                            <Badge badgeContent={nbrAnomalieBILAN} >
                                                                <GoAlert color='#FF8A8A' style={{ width: '30px', height: '30px' }} />
                                                            </Badge>
                                                        </IconButton>
                                                    </Tooltip>

                                                    <Tooltip title="Liste des articles associés au formulaire">
                                                        <IconButton
                                                            style={{
                                                                textTransform: 'none', outline: 'none'
                                                            }}
                                                        >
                                                            <Badge badgeContent={12} color="success">
                                                                <PiArticleThin style={{ width: '30px', height: '30px' }} />
                                                            </Badge>
                                                        </IconButton>
                                                    </Tooltip>

                                                    <Tooltip title="Actualiser les calculs">
                                                        <IconButton
                                                            onClick={refreshBILAN}
                                                            variant="contained"
                                                            style={{
                                                                width: "45px", height: '45px',
                                                                borderRadius: "1px", borderColor: "transparent",
                                                                backgroundColor: initial.theme,
                                                                textTransform: 'none', outline: 'none',
                                                                display: verrBilan ? 'none' : 'inline-flex',
                                                            }}
                                                        >
                                                            <TbRefresh style={{ width: '25px', height: '25px', color: 'white' }} />
                                                        </IconButton>
                                                    </Tooltip>

                                                    <ExportEbilanButton
                                                        exportToExcel={() => exportFile("EXCEL")}
                                                        exportToPdf={() => exportFile("PDF")}
                                                        value={value}
                                                    />

                                                    <Tooltip title={verrBilan ? 'Déverrouiller le tableau' : 'Vérrouiller le tableau'}>
                                                        <IconButton
                                                            onClick={lockTableBILAN}
                                                            variant="contained"
                                                            style={{
                                                                width: "45px", height: '45px',
                                                                borderRadius: "2px", borderColor: "transparent",
                                                                backgroundColor: verrBilan ? "rgba(240, 43, 33, 1)" : "rgba(9, 77, 31, 0.8)",
                                                                textTransform: 'none', outline: 'none'
                                                            }}
                                                        >
                                                            {verrBilan
                                                                ? <CiLock style={{ width: '25px', height: '25px', color: 'white' }} />
                                                                : <CiUnlock style={{ width: '25px', height: '25px', color: 'white' }} />
                                                            }
                                                        </IconButton>
                                                    </Tooltip>
                                                </Stack>
                                            </Stack>

                                            {showBilan === 'actif'
                                                ? <Stack
                                                    width={"100%"}
                                                    alignItems={"start"}
                                                    style={{ overflow: "auto" }}
                                                >
                                                    <VirtualTableEbilan
                                                        canView={canView}
                                                        canAdd={canAdd}
                                                        canDelete={canDelete}
                                                        canModify={canModify}
                                                        refreshTable={setUpdateCalculEtatfinancier}
                                                        columns={BilanActifColumn}
                                                        rows={bilanActifData}
                                                        noCollapsible={false}
                                                        state={verrBilan}
                                                        type={"Actif"}
                                                        deviseParDefaut={deviseParDefaut}
                                                        getListe={() => recupRubriqueGlobal(compteId, fileId, selectedExerciceId)}
                                                    />
                                                </Stack>
                                                : null
                                            }
                                            {showBilan === 'passif'
                                                ? <Stack
                                                    width={"100%"}
                                                    alignItems={"start"}
                                                    style={{ overflow: "auto" }}
                                                >
                                                    <VirtualTableEbilan
                                                        canView={canView}
                                                        canAdd={canAdd}
                                                        canDelete={canDelete}
                                                        canModify={canModify}
                                                        refreshTable={setUpdateCalculEtatfinancier}
                                                        columns={BilanPassifColumn}
                                                        rows={bilanPassifData}
                                                        noCollapsible={false}
                                                        state={verrBilan}
                                                        type={"Passif"}
                                                        deviseParDefaut={deviseParDefaut}
                                                        getListe={() => recupRubriqueGlobal(compteId, fileId, selectedExerciceId)}
                                                    />
                                                </Stack>
                                                : null
                                            }
                                        </Stack>

                                    </TabPanel>

                                    {/* CRN */}
                                    <TabPanel value="5">
                                        <Stack
                                            width={"100%"}
                                            height={"100%"}
                                            spacing={0.5}
                                            alignItems={"flex-start"}
                                            alignContent={"flex-start"}
                                            justifyContent={"stretch"}
                                        >
                                            <Stack width={"100%"} height={"20px"} alignItems={"center"}
                                                alignContent={"center"} direction={"row"} justifyContent={"center"}>
                                                <Typography variant='h6' sx={{ color: "black" }} align='center'>Compte de résultat par nature</Typography>
                                            </Stack>

                                            <Stack width={"100%"} height={"50px"} alignItems={"center"} alignContent={"center"}
                                                direction={"row"} style={{ marginLeft: "0px", marginTop: "0px" }}>
                                                <Stack width={"100%"} height={"30px"} spacing={0.5} alignItems={"center"} alignContent={"center"}
                                                    direction={"row"} justifyContent={"right"}>
                                                    <Tooltip title="Liste des anomalies">
                                                        <IconButton
                                                            style={{ textTransform: 'none', outline: 'none' }}
                                                            onClick={() => showAnomalie('CRN')}
                                                        >
                                                            <Badge badgeContent={nbrAnomalieCRN} >
                                                                <GoAlert color='#FF8A8A' style={{ width: '30px', height: '30px' }} />
                                                            </Badge>
                                                        </IconButton>
                                                    </Tooltip>

                                                    <Tooltip title="Liste des articles associés au formulaire">
                                                        <IconButton style={{ textTransform: 'none', outline: 'none' }}>
                                                            <Badge badgeContent={12} color="success">
                                                                <PiArticleThin style={{ width: '30px', height: '30px' }} />
                                                            </Badge>
                                                        </IconButton>
                                                    </Tooltip>

                                                    <Tooltip title="Actualiser les calculs">
                                                        <IconButton
                                                            onClick={refreshCRN}
                                                            variant="contained"
                                                            style={{
                                                                width: "45px", height: '45px',
                                                                borderRadius: "1px", borderColor: "transparent",
                                                                backgroundColor: initial.theme,
                                                                textTransform: 'none', outline: 'none',
                                                                display: verrCrn ? 'none' : 'inline-flex',
                                                            }}
                                                        >
                                                            <TbRefresh style={{ width: '25px', height: '25px', color: 'white' }} />
                                                        </IconButton>
                                                    </Tooltip>

                                                    <ExportEbilanButton
                                                        exportToExcel={() => exportFile("EXCEL")}
                                                        exportToPdf={() => exportFile("PDF")}
                                                        value={value}
                                                    />

                                                    <Tooltip title={verrCrn ? 'Déverrouiller le tableau' : 'Vérrouiller le tableau'}>
                                                        <IconButton
                                                            onClick={lockTableCRN}
                                                            variant="contained"
                                                            style={{
                                                                width: "45px", height: '45px',
                                                                borderRadius: "2px", borderColor: "transparent",
                                                                backgroundColor: verrCrn ? "rgba(240, 43, 33, 1)" : "rgba(9, 77, 31, 0.8)",
                                                                textTransform: 'none', outline: 'none'
                                                            }}
                                                        >
                                                            {verrCrn
                                                                ? <CiLock style={{ width: '25px', height: '25px', color: 'white' }} />
                                                                : <CiUnlock style={{ width: '25px', height: '25px', color: 'white' }} />
                                                            }
                                                        </IconButton>
                                                    </Tooltip>
                                                </Stack>
                                            </Stack>

                                            <Stack
                                                width={"100%"}
                                                alignItems={"start"}
                                                style={{ overflow: "auto" }}
                                            >
                                                <VirtualTableEbilan
                                                    canView={canView}
                                                    canAdd={canAdd}
                                                    canDelete={canDelete}
                                                    canModify={canModify}
                                                    refreshTable={setUpdateCalculEtatfinancier}
                                                    columns={crnColumn}
                                                    rows={crnData}
                                                    state={verrCrn}
                                                    deviseParDefaut={deviseParDefaut}
                                                    getListe={() => recupRubriqueGlobal(compteId, fileId, selectedExerciceId)}
                                                />
                                            </Stack>

                                        </Stack>
                                    </TabPanel>

                                    {/* CRF */}
                                    <TabPanel value="6">
                                        <Stack
                                            width={"100%"}
                                            height={"100%"}
                                            spacing={0.5}
                                            alignItems={"flex-start"}
                                            alignContent={"flex-start"}
                                            justifyContent={"stretch"}
                                        >
                                            <Stack width={"100%"} height={"20px"} alignItems={"center"}
                                                alignContent={"center"} direction={"row"} justifyContent={"center"}>
                                                <Typography variant='h6' sx={{ color: "black" }} align='center'>Compte de résultat par fonction</Typography>
                                            </Stack>

                                            <Stack width={"100%"} height={"50px"} alignItems={"center"} alignContent={"center"}
                                                direction={"row"} style={{ marginLeft: "00px", marginTop: "00px" }}>
                                                <Stack width={"100%"} height={"30px"} spacing={0.5} alignItems={"center"} alignContent={"center"}
                                                    direction={"row"} justifyContent={"right"}>
                                                    <Tooltip title="Liste des anomalies">
                                                        <IconButton
                                                            style={{ textTransform: 'none', outline: 'none' }}
                                                            onClick={() => showAnomalie('CRF')}
                                                        >
                                                            <Badge badgeContent={nbrAnomalieCRF} >
                                                                <GoAlert color='#FF8A8A' style={{ width: '30px', height: '30px' }} />
                                                            </Badge>
                                                        </IconButton>
                                                    </Tooltip>

                                                    <Tooltip title="Liste des articles associés au formulaire">
                                                        <IconButton style={{ textTransform: 'none', outline: 'none' }}>
                                                            <Badge badgeContent={12} color="success">
                                                                <PiArticleThin style={{ width: '30px', height: '30px' }} />
                                                            </Badge>
                                                        </IconButton>
                                                    </Tooltip>

                                                    <Tooltip title="Actualiser les calculs">
                                                        <IconButton
                                                            onClick={refreshCRF}
                                                            variant="contained"
                                                            style={{
                                                                width: "45px", height: '45px',
                                                                borderRadius: "1px", borderColor: "transparent",
                                                                backgroundColor: initial.theme,
                                                                textTransform: 'none', outline: 'none',
                                                                display: verrCrf ? 'none' : 'inline-flex',
                                                            }}
                                                        >
                                                            <TbRefresh style={{ width: '25px', height: '25px', color: 'white' }} />
                                                        </IconButton>
                                                    </Tooltip>

                                                    <ExportEbilanButton
                                                        exportToExcel={() => exportFile("EXCEL")}
                                                        exportToPdf={() => exportFile("PDF")}
                                                        value={value}
                                                    />

                                                    <Tooltip title={verrCrf ? 'Déverrouiller le tableau' : 'Vérrouiller le tableau'}>
                                                        <IconButton
                                                            onClick={lockTableCRF}
                                                            variant="contained"
                                                            style={{
                                                                width: "45px", height: '45px',
                                                                borderRadius: "2px", borderColor: "transparent",
                                                                backgroundColor: verrCrf ? "rgba(240, 43, 33, 1)" : "rgba(9, 77, 31, 0.8)",
                                                                textTransform: 'none', outline: 'none'
                                                            }}
                                                        >
                                                            {verrCrf
                                                                ? <CiLock style={{ width: '25px', height: '25px', color: 'white' }} />
                                                                : <CiUnlock style={{ width: '25px', height: '25px', color: 'white' }} />
                                                            }
                                                        </IconButton>
                                                    </Tooltip>
                                                </Stack>
                                            </Stack>

                                            <Stack
                                                width={"100%"}
                                                alignItems={"start"}
                                                style={{ overflow: "auto" }}
                                            >
                                                <VirtualTableEbilan
                                                    canView={canView}
                                                    canAdd={canAdd}
                                                    canDelete={canDelete}
                                                    canModify={canModify}
                                                    refreshTable={setUpdateCalculEtatfinancier}
                                                    columns={crnColumn}
                                                    rows={crfData}
                                                    state={verrCrf}
                                                    deviseParDefaut={deviseParDefaut}
                                                    getListe={() => recupRubriqueGlobal(compteId, fileId, selectedExerciceId)}
                                                />
                                            </Stack>

                                        </Stack>
                                    </TabPanel>

                                    {/* TFTD */}
                                    <TabPanel value="7">
                                        <Stack
                                            width={"100%"}
                                            height={"100%"}
                                            spacing={0.5}
                                            alignItems={"flex-start"}
                                            alignContent={"flex-start"}
                                            justifyContent={"stretch"}
                                        >
                                            <Stack width={"100%"} height={"20px"} alignItems={"center"}
                                                alignContent={"center"} direction={"row"} justifyContent={"center"}>
                                                <Typography variant='h6' sx={{ color: "black" }} align='center'>Tableau de flux de trésoreries méthode directe</Typography>
                                            </Stack>

                                            <Stack width={"100%"} height={"50px"} alignItems={"center"} alignContent={"center"}
                                                direction={"row"} style={{ marginLeft: "0px", marginTop: "0px" }}>
                                                <Stack width={"100%"} height={"30px"} spacing={0.5} alignItems={"center"} alignContent={"center"}
                                                    direction={"row"} justifyContent={"right"}>
                                                    <Tooltip title="Liste des anomalies">
                                                        <IconButton
                                                            style={{ textTransform: 'none', outline: 'none' }}
                                                            onClick={() => showAnomalie('TFTD')}
                                                        >
                                                            <Badge badgeContent={nbrAnomalieTFTD} >
                                                                <GoAlert color='#FF8A8A' style={{ width: '30px', height: '30px' }} />
                                                            </Badge>
                                                        </IconButton>
                                                    </Tooltip>

                                                    <Tooltip title="Liste des articles associés au formulaire">
                                                        <IconButton style={{ textTransform: 'none', outline: 'none' }}>
                                                            <Badge badgeContent={12} color="success">
                                                                <PiArticleThin style={{ width: '30px', height: '30px' }} />
                                                            </Badge>
                                                        </IconButton>
                                                    </Tooltip>

                                                    <Tooltip title="Actualiser les calculs">
                                                        <IconButton
                                                            onClick={refreshTFTD}
                                                            variant="contained"
                                                            style={{
                                                                width: "45px", height: '45px',
                                                                borderRadius: "1px", borderColor: "transparent",
                                                                backgroundColor: initial.theme,
                                                                textTransform: 'none', outline: 'none',
                                                                display: verrTftd ? 'none' : 'inline-flex',
                                                            }}
                                                        >
                                                            <TbRefresh style={{ width: '25px', height: '25px', color: 'white' }} />
                                                        </IconButton>
                                                    </Tooltip>

                                                    <ExportEbilanButton
                                                        exportToExcel={() => exportFile("EXCEL")}
                                                        exportToPdf={() => exportFile("PDF")}
                                                        value={value}
                                                    />

                                                    <Tooltip title={verrTftd ? 'Déverrouiller le tableau' : 'Vérrouiller le tableau'}>
                                                        <IconButton
                                                            onClick={lockTableTFTD}
                                                            variant="contained"
                                                            style={{
                                                                width: "45px", height: '45px',
                                                                borderRadius: "2px", borderColor: "transparent",
                                                                backgroundColor: verrTftd ? "rgba(240, 43, 33, 1)" : "rgba(9, 77, 31, 0.8)",
                                                                textTransform: 'none', outline: 'none'
                                                            }}
                                                        >
                                                            {verrTftd
                                                                ? <CiLock style={{ width: '25px', height: '25px', color: 'white' }} />
                                                                : <CiUnlock style={{ width: '25px', height: '25px', color: 'white' }} />
                                                            }
                                                        </IconButton>
                                                    </Tooltip>
                                                </Stack>
                                            </Stack>

                                            <Stack
                                                width={"100%"}
                                                alignItems={"start"}
                                                style={{ overflow: "auto" }}
                                            >
                                                <VirtualTableEbilan
                                                    canView={canView}
                                                    canAdd={canAdd}
                                                    canDelete={canDelete}
                                                    canModify={canModify}
                                                    refreshTable={setUpdateCalculEtatfinancier}
                                                    columns={tftdColumn}
                                                    rows={tftdData}
                                                    state={verrTftd}
                                                    deviseParDefaut={deviseParDefaut}
                                                    getListe={() => recupRubriqueGlobal(compteId, fileId, selectedExerciceId)}
                                                />
                                            </Stack>

                                        </Stack>
                                    </TabPanel>

                                    {/* TFTI */}
                                    <TabPanel value="8">
                                        <Stack
                                            width={"100%"}
                                            height={"100%"}
                                            spacing={0.5}
                                            alignItems={"flex-start"}
                                            alignContent={"flex-start"}
                                            justifyContent={"stretch"}
                                        >
                                            <Stack width={"100%"} height={"20px"} alignItems={"center"}
                                                alignContent={"center"} direction={"row"} justifyContent={"center"}>
                                                <Typography variant='h6' sx={{ color: "black" }} align='center'>Tableau de flux de trésoreries méthode indirecte</Typography>
                                            </Stack>

                                            <Stack width={"100%"} height={"50px"} alignItems={"center"} alignContent={"center"}
                                                direction={"row"} style={{ marginLeft: "0px", marginTop: "0px" }}>
                                                <Stack width={"100%"} height={"30px"} spacing={0.5} alignItems={"center"} alignContent={"center"}
                                                    direction={"row"} justifyContent={"right"}>
                                                    <Tooltip title="Liste des anomalies">
                                                        <IconButton
                                                            style={{ textTransform: 'none', outline: 'none' }}
                                                            onClick={() => showAnomalie('TFTI')}
                                                        >
                                                            <Badge badgeContent={nbrAnomalieTFTI} >
                                                                <GoAlert color='#FF8A8A' style={{ width: '30px', height: '30px' }} />
                                                            </Badge>
                                                        </IconButton>
                                                    </Tooltip>

                                                    <Tooltip title="Liste des articles associés au formulaire">
                                                        <IconButton style={{ textTransform: 'none', outline: 'none' }}>
                                                            <Badge badgeContent={12} color="success">
                                                                <PiArticleThin style={{ width: '30px', height: '30px' }} />
                                                            </Badge>
                                                        </IconButton>
                                                    </Tooltip>

                                                    <Tooltip title="Actualiser les calculs">
                                                        <IconButton
                                                            onClick={refreshTFTI}
                                                            variant="contained"
                                                            style={{
                                                                width: "45px", height: '45px',
                                                                borderRadius: "1px", borderColor: "transparent",
                                                                backgroundColor: initial.theme,
                                                                textTransform: 'none', outline: 'none',
                                                                display: verrTfti ? 'none' : 'inline-flex',
                                                            }}
                                                        >
                                                            <TbRefresh style={{ width: '25px', height: '25px', color: 'white' }} />
                                                        </IconButton>
                                                    </Tooltip>

                                                    <ExportEbilanButton
                                                        exportToExcel={() => exportFile("EXCEL")}
                                                        exportToPdf={() => exportFile("PDF")}
                                                        value={value}
                                                    />

                                                    <Tooltip title={verrTfti ? 'Déverrouiller le tableau' : 'Vérrouiller le tableau'}>
                                                        <IconButton
                                                            onClick={lockTableTFTI}
                                                            variant="contained"
                                                            style={{
                                                                width: "45px", height: '45px',
                                                                borderRadius: "2px", borderColor: "transparent",
                                                                backgroundColor: verrTfti ? "rgba(240, 43, 33, 1)" : "rgba(9, 77, 31, 0.8)",
                                                                textTransform: 'none', outline: 'none'
                                                            }}
                                                        >
                                                            {verrTfti
                                                                ? <CiLock style={{ width: '25px', height: '25px', color: 'white' }} />
                                                                : <CiUnlock style={{ width: '25px', height: '25px', color: 'white' }} />
                                                            }
                                                        </IconButton>
                                                    </Tooltip>
                                                </Stack>
                                            </Stack>

                                            <Stack
                                                width={"100%"}
                                                alignItems={"start"}
                                                style={{ overflow: "auto" }}
                                            >
                                                <VirtualTableEbilan
                                                    canView={canView}
                                                    canAdd={canAdd}
                                                    canDelete={canDelete}
                                                    canModify={canModify}
                                                    refreshTable={setUpdateCalculEtatfinancier}
                                                    columns={crnColumn} rows={tftiData}
                                                    state={verrTfti}
                                                    deviseParDefaut={deviseParDefaut}
                                                    getListe={() => recupRubriqueGlobal(compteId, fileId, selectedExerciceId)}
                                                />
                                            </Stack>

                                        </Stack>

                                    </TabPanel>

                                    {/* EVCP */}
                                    <TabPanel value="9">
                                        <Stack
                                            width={"100%"}
                                            height={"100%"}
                                            spacing={0.5}
                                            alignItems={"flex-start"}
                                            alignContent={"flex-start"}
                                            justifyContent={"stretch"}
                                        >
                                            <Stack width={"100%"} height={"20px"} alignItems={"center"}
                                                alignContent={"center"} direction={"row"} justifyContent={"center"}>
                                                <Typography variant='h6' sx={{ color: "black" }} align='center'>Etat de variation des capitaux propres</Typography>
                                            </Stack>

                                            <Stack width={"100%"} height={"50px"} alignItems={"center"} alignContent={"center"}
                                                direction={"row"} style={{ marginLeft: "0px", marginTop: "0px" }}>
                                                <Stack width={"100%"} height={"30px"} spacing={0.5} alignItems={"center"} alignContent={"center"}
                                                    direction={"row"} justifyContent={"right"}>
                                                    <Tooltip title="Liste des anomalies">
                                                        <IconButton
                                                            style={{ textTransform: 'none', outline: 'none' }}
                                                            onClick={() => showAnomalie('EVCP')}
                                                        >
                                                            <Badge badgeContent={nbrAnomalieEVCP} >
                                                                <GoAlert color='#FF8A8A' style={{ width: '30px', height: '30px' }} />
                                                            </Badge>
                                                        </IconButton>
                                                    </Tooltip>

                                                    <Tooltip title="Liste des articles associés au formulaire">
                                                        <IconButton style={{ textTransform: 'none', outline: 'none' }}>
                                                            <Badge badgeContent={12} color="success">
                                                                <PiArticleThin style={{ width: '30px', height: '30px' }} />
                                                            </Badge>
                                                        </IconButton>
                                                    </Tooltip>

                                                    <Tooltip title="Actualiser les calculs">
                                                        <IconButton
                                                            onClick={refreshEVCP}
                                                            variant="contained"
                                                            style={{
                                                                width: "45px", height: '45px',
                                                                borderRadius: "1px", borderColor: "transparent",
                                                                backgroundColor: initial.theme,
                                                                textTransform: 'none', outline: 'none',
                                                                display: verrEvcp ? 'none' : 'inline-flex',
                                                            }}
                                                        >
                                                            <TbRefresh style={{ width: '25px', height: '25px', color: 'white' }} />
                                                        </IconButton>
                                                    </Tooltip>

                                                    <ExportEbilanButton
                                                        exportToExcel={() => exportFile("EXCEL")}
                                                        exportToPdf={() => exportFile("PDF")}
                                                        value={value}
                                                    />

                                                    <Tooltip title={verrEvcp ? 'Déverrouiller le tableau' : 'Vérrouiller le tableau'}>
                                                        <IconButton
                                                            onClick={lockTableEVCP}
                                                            variant="contained"
                                                            style={{
                                                                width: "45px", height: '45px',
                                                                borderRadius: "2px", borderColor: "transparent",
                                                                backgroundColor: verrEvcp ? "rgba(240, 43, 33, 1)" : "rgba(9, 77, 31, 0.8)",
                                                                textTransform: 'none', outline: 'none'
                                                            }}
                                                        >
                                                            {verrEvcp
                                                                ? <CiLock style={{ width: '25px', height: '25px', color: 'white' }} />
                                                                : <CiUnlock style={{ width: '25px', height: '25px', color: 'white' }} />
                                                            }
                                                        </IconButton>
                                                    </Tooltip>
                                                </Stack>
                                            </Stack>

                                            <Stack
                                                width={"100%"}
                                                alignItems={"start"}
                                                style={{ overflow: "auto" }}
                                            >
                                                <VirtualTableEVCPEbilan
                                                    canView={canView}
                                                    canAdd={canAdd}
                                                    canDelete={canDelete}
                                                    canModify={canModify}
                                                    refreshTable={setUpdateCalculEtatfinancier}
                                                    columns={evcpColumn}
                                                    rows={evcpData}
                                                    state={verrEvcp}
                                                    deviseParDefaut={deviseParDefaut}
                                                />
                                            </Stack>

                                        </Stack>
                                    </TabPanel>

                                    {/* DRF */}
                                    <TabPanel value="10">
                                        <Stack
                                            width={"100%"}
                                            height={"100%"}
                                            spacing={0.5}
                                            alignItems={"flex-start"}
                                            alignContent={"flex-start"}
                                            justifyContent={"stretch"}
                                        >
                                            <Stack width={"100%"} height={"20px"} alignItems={"center"}
                                                alignContent={"center"} direction={"row"} justifyContent={"center"}>
                                                <Typography variant='h6' sx={{ color: "black" }} align='center'>Détermination du résultat fiscal</Typography>
                                            </Stack>

                                            <Stack width={"100%"} height={"50px"} alignItems={"center"} alignContent={"center"}
                                                direction={"row"} style={{ marginLeft: "0px", marginTop: "0px" }}>
                                                <Stack width={"100%"} height={"30px"} spacing={0.5} alignItems={"center"} alignContent={"center"}
                                                    direction={"row"} justifyContent={"right"}>
                                                    <Tooltip title="Liste des anomalies">
                                                        <IconButton
                                                            style={{ textTransform: 'none', outline: 'none' }}
                                                            onClick={() => showAnomalie('DRF')}
                                                        >
                                                            <Badge badgeContent={nbrAnomalieDRF} >
                                                                <GoAlert color='#FF8A8A' style={{ width: '30px', height: '30px' }} />
                                                            </Badge>
                                                        </IconButton>
                                                    </Tooltip>

                                                    <Tooltip title="Liste des articles associés au formulaire">
                                                        <IconButton style={{ textTransform: 'none', outline: 'none' }}>
                                                            <Badge badgeContent={12} >
                                                                <PiArticleThin style={{ width: '30px', height: '30px' }} />
                                                            </Badge>
                                                        </IconButton>
                                                    </Tooltip>

                                                    <Tooltip title="Actualiser les calculs">
                                                        <IconButton
                                                            onClick={refreshDRF}
                                                            variant="contained"
                                                            style={{
                                                                width: "45px", height: '45px',
                                                                borderRadius: "1px", borderColor: "transparent",
                                                                backgroundColor: initial.theme,
                                                                textTransform: 'none', outline: 'none',
                                                                display: verrDrf ? 'none' : 'inline-flex',
                                                            }}
                                                        >
                                                            <TbRefresh style={{ width: '25px', height: '25px', color: 'white' }} />
                                                        </IconButton>
                                                    </Tooltip>

                                                    <ExportEbilanButton
                                                        exportToExcel={() => exportFile("EXCEL")}
                                                        exportToPdf={() => exportFile("PDF")}
                                                        value={value}
                                                    />

                                                    <Tooltip title={verrDrf ? 'Déverrouiller le tableau' : 'Vérrouiller le tableau'}>
                                                        <IconButton
                                                            onClick={lockTableDRF}
                                                            variant="contained"
                                                            style={{
                                                                width: "45px", height: '45px',
                                                                borderRadius: "2px", borderColor: "transparent",
                                                                backgroundColor: verrDrf ? "rgba(240, 43, 33, 1)" : "rgba(9, 77, 31, 0.8)",
                                                                textTransform: 'none', outline: 'none'
                                                            }}
                                                        >
                                                            {verrDrf
                                                                ? <CiLock style={{ width: '25px', height: '25px', color: 'white' }} />
                                                                : <CiUnlock style={{ width: '25px', height: '25px', color: 'white' }} />
                                                            }
                                                        </IconButton>
                                                    </Tooltip>
                                                </Stack>
                                            </Stack>

                                            <Stack
                                                width={"100%"}
                                                alignItems={"start"}
                                                style={{ overflow: "auto" }}
                                            >
                                                <VirtualTableDRFEbilan
                                                    canView={canView}
                                                    canAdd={canAdd}
                                                    canDelete={canDelete}
                                                    canModify={canModify}
                                                    refreshTable={setUpdateCalculEtatfinancier}
                                                    columns={drfColumn}
                                                    rows={drfData}
                                                    state={verrDrf}
                                                    deviseParDefaut={deviseParDefaut}
                                                />
                                            </Stack>

                                        </Stack>
                                    </TabPanel>

                                    {/* BHIAPC */}
                                    <TabPanel value="11">
                                        <Stack
                                            width={"100%"}
                                            height={"100%"}
                                            spacing={0.5}
                                            alignItems={"flex-start"}
                                            alignContent={"flex-start"}
                                            justifyContent={"stretch"}
                                        >
                                            <Stack width={"100%"} height={"20px"} alignItems={"center"}
                                                alignContent={"center"} direction={"row"} justifyContent={"center"}>
                                                <Typography variant='h6' sx={{ color: "black" }} align='center'>Etat des bénéficiaires d'honoraires,d'intérêts ou d'arrérages portés en charge</Typography>
                                            </Stack>

                                            <Stack width={"100%"} height={"50px"} alignItems={"center"} alignContent={"center"}
                                                direction={"row"} style={{ marginLeft: "0px", marginTop: "0px" }}>
                                                <Stack width={"100%"} height={"30px"} spacing={0.5} alignItems={"center"} alignContent={"center"}
                                                    direction={"row"} justifyContent={"right"}>
                                                    <Tooltip title="Liste des anomalies">
                                                        <IconButton
                                                            style={{ textTransform: 'none', outline: 'none' }}
                                                            onClick={() => showAnomalie('BHIAPC')}
                                                        >
                                                            <Badge badgeContent={nbrAnomalieBHIAPC} >
                                                                <GoAlert color='#FF8A8A' style={{ width: '30px', height: '30px' }} />
                                                            </Badge>
                                                        </IconButton>
                                                    </Tooltip>

                                                    <Tooltip title="Liste des articles associés au formulaire">
                                                        <IconButton style={{ textTransform: 'none', outline: 'none' }}>
                                                            <Badge badgeContent={12} color="success">
                                                                <PiArticleThin style={{ width: '30px', height: '30px' }} />
                                                            </Badge>
                                                        </IconButton>
                                                    </Tooltip>

                                                    <ImportEbilanButton
                                                        verouillage={verrBhiapc}
                                                        handleShowPopupImport={handleShowPopupImport}
                                                    />

                                                    <ExportEbilanButton
                                                        exportToExcel={() => exportFile("EXCEL")}
                                                        exportToPdf={() => exportFile("PDF")}
                                                        value={value}
                                                    />

                                                    <Tooltip title="Ajouter une ligne">
                                                        <IconButton
                                                            disabled={!canAdd}
                                                            onClick={handleAddNewRowBHIAPC}
                                                            variant="contained"
                                                            style={{
                                                                width: "45px", height: '45px',
                                                                borderRadius: "1px", borderColor: "transparent",
                                                                backgroundColor: initial.theme,
                                                                textTransform: 'none', outline: 'none',
                                                                display: verrBhiapc ? 'none' : 'inline-flex',
                                                            }}
                                                        >
                                                            <TbPlaylistAdd style={{ width: '25px', height: '25px', color: 'white' }} />
                                                        </IconButton>
                                                    </Tooltip>

                                                    <Tooltip title="Supprimer toutes les lignes du tableau">
                                                        <IconButton
                                                            disabled={!canDelete}
                                                            onClick={deleteAllRowBHIAPC}
                                                            variant="contained"
                                                            style={{
                                                                width: "45px", height: '45px',
                                                                borderRadius: "1px", borderColor: "transparent",
                                                                backgroundColor: initial.button_delete_color,
                                                                textTransform: 'none', outline: 'none',
                                                                display: verrBhiapc ? 'none' : 'inline-flex',
                                                            }}
                                                        >
                                                            <IoMdTrash style={{ width: '25px', height: '25px', color: 'white' }} />
                                                        </IconButton>
                                                    </Tooltip>

                                                    <Tooltip title="Actualiser les calculs">
                                                        <IconButton
                                                            // onClick={refreshBHIAPC}
                                                            onClick={handleOpenDialogConfirmGenerateAuto}
                                                            variant="contained"
                                                            style={{
                                                                width: "45px", height: '45px',
                                                                borderRadius: "1px", borderColor: "transparent",
                                                                backgroundColor: initial.theme,
                                                                textTransform: 'none', outline: 'none',
                                                                display: verrBhiapc ? 'none' : 'inline-flex',
                                                            }}
                                                        >
                                                            <TbRefresh style={{ width: '25px', height: '25px', color: 'white' }} />
                                                        </IconButton>
                                                    </Tooltip>

                                                    <Tooltip title={verrBhiapc ? 'Déverrouiller le tableau' : 'Vérrouiller le tableau'}>
                                                        <IconButton
                                                            onClick={lockTableBHIAPC}
                                                            variant="contained"
                                                            style={{
                                                                width: "45px", height: '45px',
                                                                borderRadius: "2px", borderColor: "transparent",
                                                                backgroundColor: verrBhiapc ? "rgba(240, 43, 33, 1)" : "rgba(9, 77, 31, 0.8)",
                                                                textTransform: 'none', outline: 'none'
                                                            }}
                                                        >
                                                            {verrBhiapc
                                                                ? <CiLock style={{ width: '25px', height: '25px', color: 'white' }} />
                                                                : <CiUnlock style={{ width: '25px', height: '25px', color: 'white' }} />
                                                            }
                                                        </IconButton>
                                                    </Tooltip>
                                                </Stack>
                                            </Stack>

                                            <Stack
                                                width={"100%"}
                                                alignItems={"start"}
                                                style={{ overflow: "auto" }}
                                            >
                                                <VirtualTableModifiableEbilan
                                                    canView={canView}
                                                    canAdd={canAdd}
                                                    canDelete={canDelete}
                                                    canModify={canModify}
                                                    columns={bhiapcColumn}
                                                    rows={bhiapcData}
                                                    deleteState={deleteOneRowBHIAPC}
                                                    modifyState={modifyRowBHIAPC}
                                                    state={verrBhiapc}
                                                    withFooter={true}
                                                    withAnomalie={true}
                                                    type={'BHIAPC'}
                                                    deviseParDefaut={deviseParDefaut}
                                                />
                                            </Stack>

                                        </Stack>
                                    </TabPanel>

                                    {/* MP */}
                                    <TabPanel value="12">
                                        <Stack
                                            width={"100%"}
                                            height={"100%"}
                                            spacing={0.5}
                                            alignItems={"flex-start"}
                                            alignContent={"flex-start"}
                                            justifyContent={"stretch"}
                                        >
                                            <Stack width={"100%"} height={"20px"} alignItems={"center"}
                                                alignContent={"center"} direction={"row"} justifyContent={"center"}>
                                                <Typography variant='h6' sx={{ color: "black" }} align='center'>Marché public</Typography>
                                            </Stack>

                                            <Stack width={"100%"} height={"50px"} alignItems={"center"} alignContent={"center"}
                                                direction={"row"} style={{ marginLeft: "0px", marginTop: "0px" }}>
                                                <Stack width={"100%"} height={"30px"} spacing={0.5} alignItems={"center"} alignContent={"center"}
                                                    direction={"row"} justifyContent={"right"}>
                                                    <Tooltip title="Liste des anomalies">
                                                        <IconButton
                                                            style={{ textTransform: 'none', outline: 'none' }}
                                                            onClick={() => showAnomalie('MP')}
                                                        >
                                                            <Badge badgeContent={nbrAnomalieMP} >
                                                                <GoAlert color='#FF8A8A' style={{ width: '30px', height: '30px' }} />
                                                            </Badge>
                                                        </IconButton>
                                                    </Tooltip>

                                                    <Tooltip title="Liste des articles associés au formulaire">
                                                        <IconButton style={{ textTransform: 'none', outline: 'none' }}>
                                                            <Badge badgeContent={12} color="success">
                                                                <PiArticleThin style={{ width: '30px', height: '30px' }} />
                                                            </Badge>
                                                        </IconButton>
                                                    </Tooltip>

                                                    <ImportEbilanButton
                                                        verouillage={verrMp}
                                                        handleShowPopupImport={handleShowPopupImport}
                                                    />

                                                    <ExportEbilanButton
                                                        exportToExcel={() => exportFile("EXCEL")}
                                                        exportToPdf={() => exportFile("PDF")}
                                                        value={value}
                                                    />

                                                    <Tooltip title="Ajouter une ligne">
                                                        <IconButton
                                                            disabled={!canAdd}
                                                            onClick={handleAddNewRowMP}
                                                            variant="contained"
                                                            style={{
                                                                width: "45px", height: '45px',
                                                                borderRadius: "1px", borderColor: "transparent",
                                                                backgroundColor: initial.theme,
                                                                textTransform: 'none', outline: 'none',
                                                                display: verrMp ? 'none' : 'inline-flex',
                                                            }}
                                                        >
                                                            <TbPlaylistAdd style={{ width: '25px', height: '25px', color: 'white' }} />
                                                        </IconButton>
                                                    </Tooltip>

                                                    <Tooltip title="Supprimer toutes les lignes du tableau">
                                                        <IconButton
                                                            disabled={!canDelete}
                                                            onClick={deleteAllRowMP}
                                                            variant="contained"
                                                            style={{
                                                                width: "45px", height: '45px',
                                                                borderRadius: "1px", borderColor: "transparent",
                                                                backgroundColor: initial.button_delete_color,
                                                                textTransform: 'none', outline: 'none',
                                                                display: verrMp ? 'none' : 'inline-flex',
                                                            }}
                                                        >
                                                            <IoMdTrash style={{ width: '25px', height: '25px', color: 'white' }} />
                                                        </IconButton>
                                                    </Tooltip>

                                                    <Tooltip title={verrMp ? 'Déverrouiller le tableau' : 'Vérrouiller le tableau'}>
                                                        <IconButton
                                                            onClick={lockTableMP}
                                                            variant="contained"
                                                            style={{
                                                                width: "45px", height: '45px',
                                                                borderRadius: "2px", borderColor: "transparent",
                                                                backgroundColor: verrMp ? "rgba(240, 43, 33, 1)" : "rgba(9, 77, 31, 0.8)",
                                                                textTransform: 'none', outline: 'none'
                                                            }}
                                                        >
                                                            {verrMp
                                                                ? <CiLock style={{ width: '25px', height: '25px', color: 'white' }} />
                                                                : <CiUnlock style={{ width: '25px', height: '25px', color: 'white' }} />
                                                            }
                                                        </IconButton>
                                                    </Tooltip>
                                                </Stack>
                                            </Stack>

                                            <Stack
                                                width={"100%"}
                                                alignItems={"start"}
                                                style={{ overflow: "auto" }}
                                            >
                                                <VirtualTableModifiableEbilan
                                                    canView={canView}
                                                    canAdd={canAdd}
                                                    canDelete={canDelete}
                                                    canModify={canModify}
                                                    columns={mpColumn}
                                                    rows={mpData}
                                                    deleteState={deleteOneRowMP}
                                                    modifyState={modifyRowMP}
                                                    state={verrMp}
                                                    withFooter={true}
                                                    type={'MP'}
                                                    deviseParDefaut={deviseParDefaut}
                                                />
                                            </Stack>
                                        </Stack>
                                    </TabPanel>

                                    {/* DA */}
                                    <TabPanel value="13">
                                        <Stack
                                            width={"100%"}
                                            height={"100%"}
                                            spacing={0.5}
                                            alignItems={"flex-start"}
                                            alignContent={"flex-start"}
                                            justifyContent={"stretch"}
                                        >
                                            <Stack width={"100%"} height={"20px"} alignItems={"center"}
                                                alignContent={"center"} direction={"row"} justifyContent={"center"}>
                                                <Typography variant='h6' sx={{ color: "black" }} align='center'>Détails amortissements</Typography>
                                            </Stack>

                                            <Stack width={"100%"} height={"50px"} alignItems={"center"} alignContent={"center"}
                                                direction={"row"} style={{ marginLeft: "0px", marginTop: "0px" }}>
                                                <Stack width={"100%"} height={"30px"} spacing={0.5} alignItems={"center"} alignContent={"center"}
                                                    direction={"row"} justifyContent={"right"}>
                                                    <Tooltip title="Liste des anomalies">
                                                        <IconButton
                                                            style={{ textTransform: 'none', outline: 'none' }}
                                                            onClick={() => showAnomalie('DA')}
                                                        >
                                                            <Badge badgeContent={nbrAnomalieDA} >
                                                                <GoAlert color='#FF8A8A' style={{ width: '30px', height: '30px' }} />
                                                            </Badge>
                                                        </IconButton>
                                                    </Tooltip>

                                                    <Tooltip title="Liste des articles associés au formulaire">
                                                        <IconButton style={{ textTransform: 'none', outline: 'none' }}>
                                                            <Badge badgeContent={12} color="success">
                                                                <PiArticleThin style={{ width: '30px', height: '30px' }} />
                                                            </Badge>
                                                        </IconButton>
                                                    </Tooltip>

                                                    <ImportEbilanButton
                                                        verouillage={verrDa}
                                                        handleShowPopupImport={handleShowPopupImport}
                                                    />

                                                    <ExportEbilanButton
                                                        exportToExcel={() => exportFile("EXCEL")}
                                                        exportToPdf={() => exportFile("PDF")}
                                                        value={value}
                                                    />

                                                    <Tooltip title="Ajouter une ligne">
                                                        <IconButton
                                                            disabled={!canAdd}
                                                            onClick={handleAddNewRowDA}
                                                            variant="contained"
                                                            style={{
                                                                width: "45px", height: '45px',
                                                                borderRadius: "1px", borderColor: "transparent",
                                                                backgroundColor: initial.theme,
                                                                textTransform: 'none', outline: 'none',
                                                                display: verrDa ? 'none' : 'inline-flex',
                                                            }}
                                                        >
                                                            <TbPlaylistAdd style={{ width: '25px', height: '25px', color: 'white' }} />
                                                        </IconButton>
                                                    </Tooltip>

                                                    <Tooltip title="Supprimer toutes les lignes du tableau">
                                                        <IconButton
                                                            disabled={!canDelete}
                                                            onClick={deleteAllRowDA}
                                                            variant="contained"
                                                            style={{
                                                                width: "45px", height: '45px',
                                                                borderRadius: "1px", borderColor: "transparent",
                                                                backgroundColor: initial.button_delete_color,
                                                                textTransform: 'none', outline: 'none',
                                                                display: verrDa ? 'none' : 'inline-flex',
                                                            }}
                                                        >
                                                            <IoMdTrash style={{ width: '25px', height: '25px', color: 'white' }} />
                                                        </IconButton>
                                                    </Tooltip>

                                                    <Tooltip title={verrDa ? 'Déverrouiller le tableau' : 'Vérrouiller le tableau'}>
                                                        <IconButton
                                                            onClick={lockTableDA}
                                                            variant="contained"
                                                            style={{
                                                                width: "45px", height: '45px',
                                                                borderRadius: "2px", borderColor: "transparent",
                                                                backgroundColor: verrDa ? "rgba(240, 43, 33, 1)" : "rgba(9, 77, 31, 0.8)",
                                                                textTransform: 'none', outline: 'none'
                                                            }}
                                                        >
                                                            {verrDa
                                                                ? <CiLock style={{ width: '25px', height: '25px', color: 'white' }} />
                                                                : <CiUnlock style={{ width: '25px', height: '25px', color: 'white' }} />
                                                            }
                                                        </IconButton>
                                                    </Tooltip>
                                                </Stack>
                                            </Stack>

                                            <Stack
                                                width={"100%"}
                                                alignItems={"start"}
                                                style={{ overflow: "auto" }}
                                            >
                                                <VirtualTableModifiableGroupableEbilanDA
                                                    columns={daColumn}
                                                    rows={daData}
                                                    deleteState={deleteOneRowDA}
                                                    modifyState={modifyRowDA}
                                                    state={verrDa}
                                                    deviseParDefaut={deviseParDefaut}
                                                />
                                            </Stack>

                                        </Stack>
                                    </TabPanel>

                                    {/* DP */}
                                    <TabPanel value="14">
                                        <Stack
                                            width={"100%"}
                                            height={"100%"}
                                            spacing={0.5}
                                            alignItems={"flex-start"}
                                            alignContent={"flex-start"}
                                            justifyContent={"stretch"}
                                        >
                                            <Stack width={"100%"} height={"20px"} alignItems={"center"}
                                                alignContent={"center"} direction={"row"} justifyContent={"center"}>
                                                <Typography variant='h6' sx={{ color: "black" }} align='center'>Détails provisions</Typography>
                                            </Stack>

                                            <Stack width={"100%"} height={"50px"} alignItems={"center"} alignContent={"center"}
                                                direction={"row"} style={{ marginLeft: "0px", marginTop: "0px" }}>
                                                <Stack width={"100%"} height={"30px"} spacing={0.5} alignItems={"center"} alignContent={"center"}
                                                    direction={"row"} justifyContent={"right"}>
                                                    <Tooltip title="Liste des anomalies">
                                                        <IconButton
                                                            style={{ textTransform: 'none', outline: 'none' }}
                                                            onClick={() => showAnomalie('DP')}
                                                        >
                                                            <Badge badgeContent={nbrAnomalieDP} >
                                                                <GoAlert color='#FF8A8A' style={{ width: '30px', height: '30px' }} />
                                                            </Badge>
                                                        </IconButton>
                                                    </Tooltip>

                                                    <Tooltip title="Liste des articles associés au formulaire">
                                                        <IconButton style={{ textTransform: 'none', outline: 'none' }}>
                                                            <Badge badgeContent={12} color="success">
                                                                <PiArticleThin style={{ width: '30px', height: '30px' }} />
                                                            </Badge>
                                                        </IconButton>
                                                    </Tooltip>

                                                    <ExportEbilanButton
                                                        exportToExcel={() => exportFile("EXCEL")}
                                                        exportToPdf={() => exportFile("PDF")}
                                                        value={value}
                                                    />

                                                    <Tooltip title="Ajouter une ligne">
                                                        <IconButton
                                                            disabled={!canAdd}
                                                            onClick={handleAddNewRowDP}
                                                            variant="contained"
                                                            style={{
                                                                width: "45px", height: '45px',
                                                                borderRadius: "1px", borderColor: "transparent",
                                                                backgroundColor: initial.theme,
                                                                textTransform: 'none', outline: 'none',
                                                                display: verrDp ? 'none' : 'inline-flex',
                                                            }}
                                                        >
                                                            <TbPlaylistAdd style={{ width: '25px', height: '25px', color: 'white' }} />
                                                        </IconButton>
                                                    </Tooltip>

                                                    <Tooltip title="Supprimer toutes les lignes du tableau">
                                                        <IconButton
                                                            disabled={!canDelete}
                                                            onClick={deleteAllRowDP}
                                                            variant="contained"
                                                            style={{
                                                                width: "45px", height: '45px',
                                                                borderRadius: "1px", borderColor: "transparent",
                                                                backgroundColor: initial.button_delete_color,
                                                                textTransform: 'none', outline: 'none',
                                                                display: verrDp ? 'none' : 'inline-flex',
                                                            }}
                                                        >
                                                            <IoMdTrash style={{ width: '25px', height: '25px', color: 'white' }} />
                                                        </IconButton>
                                                    </Tooltip>

                                                    <Tooltip title="Actualiser les calculs">
                                                        <IconButton
                                                            onClick={handleOpenDialogConfirmGenerateAuto}
                                                            variant="contained"
                                                            style={{
                                                                width: "45px", height: '45px',
                                                                borderRadius: "1px", borderColor: "transparent",
                                                                backgroundColor: initial.theme,
                                                                textTransform: 'none', outline: 'none',
                                                                display: verrDp ? 'none' : 'inline-flex',
                                                            }}
                                                        >
                                                            <TbRefresh style={{ width: '25px', height: '25px', color: 'white' }} />
                                                        </IconButton>
                                                    </Tooltip>

                                                    <Tooltip title={verrDp ? 'Déverrouiller le tableau' : 'Vérrouiller le tableau'}>
                                                        <IconButton
                                                            onClick={lockTableDP}
                                                            variant="contained"
                                                            style={{
                                                                width: "45px", height: '45px',
                                                                borderRadius: "2px", borderColor: "transparent",
                                                                backgroundColor: verrDp ? "rgba(240, 43, 33, 1)" : "rgba(9, 77, 31, 0.8)",
                                                                textTransform: 'none', outline: 'none'
                                                            }}
                                                        >
                                                            {verrDp
                                                                ? <CiLock style={{ width: '25px', height: '25px', color: 'white' }} />
                                                                : <CiUnlock style={{ width: '25px', height: '25px', color: 'white' }} />
                                                            }
                                                        </IconButton>
                                                    </Tooltip>
                                                </Stack>
                                            </Stack>

                                            <Stack
                                                width={"100%"}
                                                alignItems={"start"}
                                                style={{ overflow: "auto" }}
                                            >
                                                <VirtualTableModifiableGroupableEbilanDP
                                                    columns={dpColumn}
                                                    rows={dpData}
                                                    deleteState={deleteOneRowDP}
                                                    modifyState={modifyRowDP}
                                                    state={verrDp}
                                                    deviseParDefaut={deviseParDefaut}
                                                />
                                            </Stack>

                                        </Stack>
                                    </TabPanel>

                                    {/* EIAFNC */}
                                    <TabPanel value="15">
                                        <Stack
                                            width={"100%"}
                                            height={"100%"}
                                            spacing={0.5}
                                            alignItems={"flex-start"}
                                            alignContent={"flex-start"}
                                            justifyContent={"stretch"}
                                        >
                                            <Stack width={"100%"} height={"20px"} alignItems={"center"}
                                                alignContent={"center"} direction={"row"} justifyContent={"center"}>
                                                <Typography variant='h6' sx={{ color: "black" }} align='center'>Evolution des immobilisations et actifs financiers non courants</Typography>
                                            </Stack>

                                            <Stack width={"100%"} height={"50px"} alignItems={"center"} alignContent={"center"}
                                                direction={"row"} style={{ marginLeft: "0px", marginTop: "0px" }}>
                                                <Stack width={"100%"} height={"30px"} spacing={0.5} alignItems={"center"} alignContent={"center"}
                                                    direction={"row"} justifyContent={"right"}>
                                                    <Tooltip title="Liste des anomalies">
                                                        <IconButton
                                                            style={{ textTransform: 'none', outline: 'none', }}
                                                            onClick={() => showAnomalie('EIAFNC')}
                                                        >
                                                            <Badge badgeContent={nbrAnomalieEIAFNC} >
                                                                <GoAlert color='#FF8A8A' style={{ width: '30px', height: '30px' }} />
                                                            </Badge>
                                                        </IconButton>
                                                    </Tooltip>

                                                    <Tooltip title="Liste des articles associés au formulaire">
                                                        <IconButton style={{ textTransform: 'none', outline: 'none', }}>
                                                            <Badge badgeContent={12} color="success">
                                                                <PiArticleThin style={{ width: '30px', height: '30px' }} />
                                                            </Badge>
                                                        </IconButton>
                                                    </Tooltip>

                                                    <ImportEbilanButton
                                                        verouillage={verrEiafnc}
                                                        handleShowPopupImport={handleShowPopupImport}
                                                    />

                                                    <ExportEbilanButton
                                                        exportToExcel={() => exportFile("EXCEL")}
                                                        exportToPdf={() => exportFile("PDF")}
                                                        value={value}
                                                    />

                                                    <Tooltip title="Ajouter une ligne">
                                                        <IconButton
                                                            disabled={!canAdd}
                                                            onClick={handleAddNewRowEIAFNC}
                                                            variant="contained"
                                                            style={{
                                                                width: "45px", height: '45px',
                                                                borderRadius: "1px", borderColor: "transparent",
                                                                backgroundColor: initial.theme,
                                                                textTransform: 'none', outline: 'none',
                                                                display: verrEiafnc ? 'none' : 'inline-flex',
                                                            }}
                                                        >
                                                            <TbPlaylistAdd style={{ width: '25px', height: '25px', color: 'white' }} />
                                                        </IconButton>
                                                    </Tooltip>

                                                    <Tooltip title="Supprimer toutes les lignes du tableau">
                                                        <IconButton
                                                            disabled={!canDelete}
                                                            onClick={deleteAllRowEIAFNC}
                                                            variant="contained"
                                                            style={{
                                                                width: "45px", height: '45px',
                                                                borderRadius: "1px", borderColor: "transparent",
                                                                backgroundColor: initial.button_delete_color,
                                                                textTransform: 'none', outline: 'none',
                                                                display: verrEiafnc ? 'none' : 'inline-flex',
                                                            }}
                                                        >
                                                            <IoMdTrash style={{ width: '25px', height: '25px', color: 'white' }} />
                                                        </IconButton>
                                                    </Tooltip>

                                                    <Tooltip title={verrEiafnc ? 'Déverrouiller le tableau' : 'Vérrouiller le tableau'}>
                                                        <IconButton
                                                            onClick={lockTableEIAFNC}
                                                            variant="contained"
                                                            style={{
                                                                width: "45px", height: '45px',
                                                                borderRadius: "2px", borderColor: "transparent",
                                                                backgroundColor: verrEiafnc ? "rgba(240, 43, 33, 1)" : "rgba(9, 77, 31, 0.8)",
                                                                textTransform: 'none', outline: 'none'
                                                            }}
                                                        >
                                                            {verrEiafnc
                                                                ? <CiLock style={{ width: '25px', height: '25px', color: 'white' }} />
                                                                : <CiUnlock style={{ width: '25px', height: '25px', color: 'white' }} />
                                                            }
                                                        </IconButton>
                                                    </Tooltip>
                                                </Stack>
                                            </Stack>

                                            <Stack
                                                width={"100%"}
                                                alignItems={"start"}
                                                style={{ overflow: "auto" }}
                                            >
                                                <VirtualTableModifiableGroupableEbilanEIAFNC
                                                    columns={eiafncColumn}
                                                    rows={eiafncData}
                                                    deleteState={deleteOneRowEIAFNC}
                                                    modifyState={modifyRowEIAFNC}
                                                    state={verrEiafnc}
                                                    deviseParDefaut={deviseParDefaut}
                                                />
                                            </Stack>

                                        </Stack>
                                    </TabPanel>

                                    {/* SAD */}
                                    <TabPanel value="16">
                                        <Stack
                                            width={"100%"}
                                            height={"100%"}
                                            spacing={0.5}
                                            alignItems={"flex-start"}
                                            alignContent={"flex-start"}
                                            justifyContent={"stretch"}
                                        >
                                            <Stack width={"100%"} height={"20px"} alignItems={"center"}
                                                alignContent={"center"} direction={"row"} justifyContent={"center"}>
                                                <Typography variant='h6' sx={{ color: "black" }} align='center'>Suivi des amortissements différés</Typography>
                                            </Stack>

                                            <Stack width={"100%"} height={"50px"} alignItems={"center"} alignContent={"center"}
                                                direction={"row"} style={{ marginLeft: "0px", marginTop: "0px" }}>
                                                <Stack width={"100%"} height={"30px"} spacing={0.5} alignItems={"center"} alignContent={"center"}
                                                    direction={"row"} justifyContent={"right"}>
                                                    <Tooltip title="Liste des anomalies">
                                                        <IconButton
                                                            style={{ textTransform: 'none', outline: 'none', }}
                                                            onClick={() => showAnomalie('SAD')}
                                                        >
                                                            <Badge badgeContent={nbrAnomalieSAD} >
                                                                <GoAlert color='#FF8A8A' style={{ width: '30px', height: '30px' }} />
                                                            </Badge>
                                                        </IconButton>
                                                    </Tooltip>

                                                    <Tooltip title="Liste des articles associés au formulaire">
                                                        <IconButton style={{ textTransform: 'none', outline: 'none', }}>
                                                            <Badge badgeContent={12} color="success">
                                                                <PiArticleThin style={{ width: '30px', height: '30px' }} />
                                                            </Badge>
                                                        </IconButton>
                                                    </Tooltip>

                                                    <Tooltip title="Actualiser les calculs">
                                                        <IconButton
                                                            onClick={refreshSAD}
                                                            variant="contained"
                                                            style={{
                                                                width: "45px", height: '45px',
                                                                borderRadius: "1px", borderColor: "transparent",
                                                                backgroundColor: initial.theme,
                                                                textTransform: 'none', outline: 'none',
                                                                display: verrSad ? 'none' : 'inline-flex',
                                                            }}
                                                        >
                                                            <TbRefresh style={{ width: '25px', height: '25px', color: 'white' }} />
                                                        </IconButton>
                                                    </Tooltip>

                                                    <ExportEbilanButton
                                                        exportToExcel={() => exportFile("EXCEL")}
                                                        exportToPdf={() => exportFile("PDF")}
                                                        value={value}
                                                    />

                                                    <Tooltip title={verrSad ? 'Déverrouiller le tableau' : 'Vérrouiller le tableau'}>
                                                        <IconButton
                                                            onClick={lockTableSAD}
                                                            variant="contained"
                                                            style={{
                                                                width: "45px", height: '45px',
                                                                borderRadius: "2px", borderColor: "transparent",
                                                                backgroundColor: verrSad ? "rgba(240, 43, 33, 1)" : "rgba(9, 77, 31, 0.8)",
                                                                textTransform: 'none', outline: 'none'
                                                            }}
                                                        >
                                                            {verrSad
                                                                ? <CiLock style={{ width: '25px', height: '25px', color: 'white' }} />
                                                                : <CiUnlock style={{ width: '25px', height: '25px', color: 'white' }} />
                                                            }
                                                        </IconButton>
                                                    </Tooltip>
                                                </Stack>
                                            </Stack>

                                            <Stack
                                                width={"100%"}
                                                alignItems={"start"}
                                                style={{ overflow: "auto" }}
                                            >
                                                <VirtualTableSADEbilan
                                                    canView={canView}
                                                    canAdd={canAdd}
                                                    canDelete={canDelete}
                                                    canModify={canModify}
                                                    refreshTable={setUpdateCalculEtatfinancier}
                                                    columns={sadColumn}
                                                    rows={sadData}
                                                    state={verrSad}
                                                    deviseParDefaut={deviseParDefaut}
                                                />
                                            </Stack>

                                        </Stack>
                                    </TabPanel>

                                    {/* SDR */}
                                    <TabPanel value="17">
                                        <Stack
                                            width={"100%"}
                                            height={"100%"}
                                            spacing={0.5}
                                            alignItems={"flex-start"}
                                            alignContent={"flex-start"}
                                            justifyContent={"stretch"}
                                        >
                                            <Stack width={"100%"} height={"20px"} alignItems={"center"}
                                                alignContent={"center"} direction={"row"} justifyContent={"center"}>
                                                <Typography variant='h6' sx={{ color: "black" }} align='center'>Suivi des déficits reportables</Typography>
                                            </Stack>

                                            <Stack width={"100%"} height={"50px"} alignItems={"center"} alignContent={"center"}
                                                direction={"row"} style={{ marginLeft: "0px", marginTop: "0px" }}>
                                                <Stack width={"100%"} height={"30px"} spacing={0.5} alignItems={"center"} alignContent={"center"}
                                                    direction={"row"} justifyContent={"right"}>
                                                    <Tooltip title="Liste des anomalies">
                                                        <IconButton
                                                            style={{ textTransform: 'none', outline: 'none', }}
                                                            onClick={() => showAnomalie('SDR')}
                                                        >
                                                            <Badge badgeContent={nbrAnomalieSDR} >
                                                                <GoAlert color='#FF8A8A' style={{ width: '30px', height: '30px' }} />
                                                            </Badge>
                                                        </IconButton>
                                                    </Tooltip>

                                                    <Tooltip title="Liste des articles associés au formulaire">
                                                        <IconButton style={{ textTransform: 'none', outline: 'none', }}>
                                                            <Badge badgeContent={12} color="success">
                                                                <PiArticleThin style={{ width: '30px', height: '30px' }} />
                                                            </Badge>
                                                        </IconButton>
                                                    </Tooltip>

                                                    <Tooltip title="Actualiser les calculs">
                                                        <IconButton
                                                            onClick={refreshSDR}
                                                            variant="contained"
                                                            style={{
                                                                width: "45px", height: '45px',
                                                                borderRadius: "1px", borderColor: "transparent",
                                                                backgroundColor: initial.theme,
                                                                textTransform: 'none', outline: 'none',
                                                                display: verrSdr ? 'none' : 'inline-flex',
                                                            }}
                                                        >
                                                            <TbRefresh style={{ width: '25px', height: '25px', color: 'white' }} />
                                                        </IconButton>
                                                    </Tooltip>

                                                    <ExportEbilanButton
                                                        exportToExcel={() => exportFile("EXCEL")}
                                                        exportToPdf={() => exportFile("PDF")}
                                                        value={value}
                                                    />

                                                    <Tooltip title={verrSdr ? 'Déverrouiller le tableau' : 'Vérrouiller le tableau'}>
                                                        <IconButton
                                                            onClick={lockTableSDR}
                                                            variant="contained"
                                                            style={{
                                                                width: "45px", height: '45px',
                                                                borderRadius: "2px", borderColor: "transparent",
                                                                backgroundColor: verrSdr ? "rgba(240, 43, 33, 1)" : "rgba(9, 77, 31, 0.8)",
                                                                textTransform: 'none', outline: 'none'
                                                            }}
                                                        >
                                                            {verrSdr
                                                                ? <CiLock style={{ width: '25px', height: '25px', color: 'white' }} />
                                                                : <CiUnlock style={{ width: '25px', height: '25px', color: 'white' }} />
                                                            }
                                                        </IconButton>
                                                    </Tooltip>
                                                </Stack>
                                            </Stack>

                                            <Stack
                                                width={"100%"}
                                                alignItems={"start"}
                                                style={{ overflow: "auto" }}
                                            >
                                                <VirtualTableSDREbilan
                                                    canView={canView}
                                                    canAdd={canAdd}
                                                    canDelete={canDelete}
                                                    canModify={canModify}
                                                    refreshTable={setUpdateCalculEtatfinancier}
                                                    columns={sdrColumn}
                                                    rows={sdrData}
                                                    state={verrSdr}
                                                    deviseParDefaut={deviseParDefaut}
                                                />
                                            </Stack>

                                        </Stack>
                                    </TabPanel>

                                    {/* SE */}
                                    <TabPanel value="18">
                                        <Stack
                                            width={"100%"}
                                            height={"100%"}
                                            spacing={0.5}
                                            alignItems={"flex-start"}
                                            alignContent={"flex-start"}
                                            justifyContent={"stretch"}
                                        >
                                            <Stack width={"100%"} height={"20px"} alignItems={"center"}
                                                alignContent={"center"} direction={"row"} justifyContent={"center"}>
                                                <Typography variant='h6' sx={{ color: "black" }} align='center'>Suivi des emprunts</Typography>
                                            </Stack>

                                            <Stack width={"100%"} height={"50px"} alignItems={"center"} alignContent={"center"}
                                                direction={"row"} style={{ marginLeft: "0px", marginTop: "0px" }}>
                                                <Stack width={"100%"} height={"30px"} spacing={0.5} alignItems={"center"} alignContent={"center"}
                                                    direction={"row"} justifyContent={"right"}>
                                                    <Tooltip title="Liste des anomalies">
                                                        <IconButton
                                                            style={{ textTransform: 'none', outline: 'none', }}
                                                            onClick={() => showAnomalie('SE')}
                                                        >
                                                            <Badge badgeContent={nbrAnomalieSE} >
                                                                <GoAlert color='#FF8A8A' style={{ width: '30px', height: '30px' }} />
                                                            </Badge>
                                                        </IconButton>
                                                    </Tooltip>

                                                    <Tooltip title="Liste des articles associés au formulaire">
                                                        <IconButton style={{ textTransform: 'none', outline: 'none', }}>
                                                            <Badge badgeContent={12} color="success">
                                                                <PiArticleThin style={{ width: '30px', height: '30px' }} />
                                                            </Badge>
                                                        </IconButton>
                                                    </Tooltip>

                                                    <ImportEbilanButton
                                                        verouillage={verrSe}
                                                        handleShowPopupImport={handleShowPopupImport}
                                                    />

                                                    <ExportEbilanButton
                                                        exportToExcel={() => exportFile("EXCEL")}
                                                        exportToPdf={() => exportFile("PDF")}
                                                        value={value}
                                                    />

                                                    <Tooltip title="Ajouter une ligne">
                                                        <IconButton
                                                            disabled={!canAdd}
                                                            onClick={handleAddNewRowSE}
                                                            variant="contained"
                                                            style={{
                                                                width: "45px", height: '45px',
                                                                borderRadius: "1px", borderColor: "transparent",
                                                                backgroundColor: initial.theme,
                                                                textTransform: 'none', outline: 'none',
                                                                display: verrSe ? 'none' : 'inline-flex',
                                                            }}
                                                        >
                                                            <TbPlaylistAdd style={{ width: '25px', height: '25px', color: 'white' }} />
                                                        </IconButton>
                                                    </Tooltip>

                                                    <Tooltip title="Supprimer toutes les lignes du tableau">
                                                        <IconButton
                                                            disabled={!canDelete}
                                                            onClick={deleteAllRowSE}
                                                            variant="contained"
                                                            style={{
                                                                width: "45px", height: '45px',
                                                                borderRadius: "1px", borderColor: "transparent",
                                                                backgroundColor: initial.button_delete_color,
                                                                textTransform: 'none', outline: 'none',
                                                                display: verrSe ? 'none' : 'inline-flex',
                                                            }}
                                                        >
                                                            <IoMdTrash style={{ width: '25px', height: '25px', color: 'white' }} />
                                                        </IconButton>
                                                    </Tooltip>

                                                    <Tooltip title={verrSe ? 'Déverrouiller le tableau' : 'Vérrouiller le tableau'}>
                                                        <IconButton
                                                            onClick={lockTableSE}
                                                            variant="contained"
                                                            style={{
                                                                width: "45px", height: '45px',
                                                                borderRadius: "2px", borderColor: "transparent",
                                                                backgroundColor: verrSe ? "rgba(240, 43, 33, 1)" : "rgba(9, 77, 31, 0.8)",
                                                                textTransform: 'none', outline: 'none'
                                                            }}
                                                        >
                                                            {verrSe
                                                                ? <CiLock style={{ width: '25px', height: '25px', color: 'white' }} />
                                                                : <CiUnlock style={{ width: '25px', height: '25px', color: 'white' }} />
                                                            }
                                                        </IconButton>
                                                    </Tooltip>
                                                </Stack>
                                            </Stack>

                                            <Stack
                                                width={"100%"}
                                                alignItems={"start"}
                                                style={{ overflow: "auto" }}
                                            >
                                                <VirtualTableModifiableEbilan
                                                    canView={canView}
                                                    canAdd={canAdd}
                                                    canDelete={canDelete}
                                                    canModify={canModify}
                                                    columns={seColumn}
                                                    rows={seData}
                                                    deleteState={deleteOneRowSE}
                                                    modifyState={modifyRowSE}
                                                    state={verrSe}
                                                    withFooter={true}
                                                    deviseParDefaut={deviseParDefaut}
                                                />
                                            </Stack>

                                        </Stack>
                                    </TabPanel>

                                    {/* NOTE */}
                                    <TabPanel value="19">
                                        <Stack
                                            width={"100%"}
                                            height={"100%"}
                                            spacing={0.5}
                                            alignItems={"flex-start"}
                                            alignContent={"flex-start"}
                                            justifyContent={"stretch"}
                                        >
                                            <Stack width={"100%"} height={"20px"} alignItems={"center"}
                                                alignContent={"center"} direction={"row"} justifyContent={"center"}>
                                                <Typography variant='h6' sx={{ color: "black" }} align='center'>Notes explicatives</Typography>
                                            </Stack>

                                            <Stack width={"100%"} height={"50px"} alignItems={"center"} alignContent={"center"}
                                                direction={"row"} style={{ marginLeft: "0px", marginTop: "0px" }}>
                                                <Stack width={"100%"} height={"30px"} spacing={0.5} alignItems={"center"} alignContent={"center"}
                                                    direction={"row"} justifyContent={"right"}>

                                                    <ExportEbilanButton
                                                        exportToExcel={() => exportFile("EXCEL")}
                                                        exportToPdf={() => exportFile("PDF")}
                                                        value={value}
                                                    />

                                                    <Tooltip title="Ajouter une ligne">
                                                        <IconButton
                                                            disabled={!canAdd}
                                                            onClick={handleAddNewRowNE}
                                                            variant="contained"
                                                            style={{
                                                                width: "45px", height: '45px',
                                                                borderRadius: "1px", borderColor: "transparent",
                                                                backgroundColor: initial.theme,
                                                                textTransform: 'none', outline: 'none',
                                                                display: verrNote ? 'none' : 'inline-flex',
                                                            }}
                                                        >
                                                            <TbPlaylistAdd style={{ width: '25px', height: '25px', color: 'white' }} />
                                                        </IconButton>
                                                    </Tooltip>

                                                    <Tooltip title="Supprimer toutes les lignes du tableau">
                                                        <IconButton
                                                            disabled={!canDelete}
                                                            onClick={deleteAllRowNE}
                                                            variant="contained"
                                                            style={{
                                                                width: "45px", height: '45px',
                                                                borderRadius: "1px", borderColor: "transparent",
                                                                backgroundColor: initial.button_delete_color,
                                                                textTransform: 'none', outline: 'none',
                                                                display: verrNote ? 'none' : 'inline-flex',
                                                            }}
                                                        >
                                                            <IoMdTrash style={{ width: '25px', height: '25px', color: 'white' }} />
                                                        </IconButton>
                                                    </Tooltip>

                                                    <Tooltip title={verrNote ? 'Déverrouiller le tableau' : 'Vérrouiller le tableau'}>
                                                        <IconButton
                                                            onClick={lockTableNE}
                                                            variant="contained"
                                                            style={{
                                                                width: "45px", height: '45px',
                                                                borderRadius: "2px", borderColor: "transparent",
                                                                backgroundColor: verrNote ? "rgba(240, 43, 33, 1)" : "rgba(9, 77, 31, 0.8)",
                                                                textTransform: 'none', outline: 'none'
                                                            }}
                                                        >
                                                            {verrNote
                                                                ? <CiLock style={{ width: '25px', height: '25px', color: 'white' }} />
                                                                : <CiUnlock style={{ width: '25px', height: '25px', color: 'white' }} />
                                                            }
                                                        </IconButton>
                                                    </Tooltip>
                                                </Stack>
                                            </Stack>

                                            <Stack
                                                width={"100%"}
                                                height={"50vh"}
                                                alignItems={"start"}
                                                style={{ overflow: "auto" }}
                                            >
                                                <VirtualTableModifiableEbilan
                                                    canView={canView}
                                                    canAdd={canAdd}
                                                    canDelete={canDelete}
                                                    canModify={canModify}
                                                    columns={neColumn}
                                                    rows={neData}
                                                    deleteState={deleteOneRowNE}
                                                    modifyState={modifyRowNE}
                                                    state={verrNote}
                                                    withFooter={false}
                                                    deviseParDefaut={deviseParDefaut}
                                                />
                                            </Stack>

                                        </Stack>
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
