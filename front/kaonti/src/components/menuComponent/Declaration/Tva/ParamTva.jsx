import React, { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Typography, Stack, Paper, IconButton, FormControl, InputLabel, Select, MenuItem, Input, FormHelperText, Dialog, DialogTitle, DialogContent, DialogActions, Grid, TextField, Menu } from '@mui/material';

import Button from '@mui/material/Button';
import { IoAddSharp } from "react-icons/io5";
import { GoX } from "react-icons/go";
import { HiPencilSquare } from "react-icons/hi2";
import TableParamCodeJournalModel from '../../../../model/TableParamCodeJournalModel';
import { InfoFileStyle } from '../../../componentsTools/InfosFileStyle';
import { useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import { IoMdTrash } from "react-icons/io";
import { TbPlaylistAdd } from "react-icons/tb";
import { FaRegPenToSquare } from "react-icons/fa6";
import { VscClose } from "react-icons/vsc";
import { TfiSave } from "react-icons/tfi";
import PopupConfirmDelete from '../../../componentsTools/popupConfirmDelete';
import PopupActionConfirm from '../../../componentsTools/popupActionConfirm';
import PopupTestSelectedFile from '../../../componentsTools/popupTestSelectedFile';
import { init } from '../../../../../init';
import { DataGridStyle } from '../../../componentsTools/DatagridToolsStyle';
import { DataGrid, frFR, GridRowEditStopReasons, GridRowModes } from '@mui/x-data-grid';
import QuickFilter from '../../../componentsTools/DatagridToolsStyle';
import useAuth from '../../../../hooks/useAuth';
import { jwtDecode } from 'jwt-decode';
import axios from '../../../../../config/axios';
import toast from 'react-hot-toast';
import { useFormik } from 'formik';
import * as Yup from "yup";
import FormulaireTvaUnified from './FormulaireTvaUnified';
import Tooltip from '@mui/material/Tooltip';
import Badge from '@mui/material/Badge';
import { GoAlert } from "react-icons/go";
import PopupDetailAnomalie from '../../../componentsTools/PopupDetailsAnomaliesTva';
import AddTvaAnnexeDialog from '../../../componentsTools/tva/dialogs/AddTvaAnnexeDialog';
import { TbPlugConnected } from "react-icons/tb";
import { TbPlugConnectedX } from "react-icons/tb";
import { GrPrevious, GrNext } from 'react-icons/gr';
import RefreshIcon from '@mui/icons-material/Refresh';
import { TbRefresh } from "react-icons/tb";
import Checkbox from '@mui/material/Checkbox';
import DatagridDetailSelectionLigne from '../../../componentsTools/tva/datagrid/DatagridDetailSelectionLigne';
import DatagridDetailEcritureAssociee from '../../../componentsTools/tva/datagrid/DatagridEcritureAssociee';
import DatagridAnnexesTva from '../../../componentsTools/tva/datagrid/DatagridAnnexesTva';
import { AiTwotoneFileText } from 'react-icons/ai';
import EditTvaAnnexeDialog from '../../../componentsTools/tva/dialogs/EditTvaAnnexeDialog';
import ExportTvaDialog from './ExportTvaDialog';
import { CiLock, CiUnlock } from 'react-icons/ci';
import usePermission from '../../../../hooks/usePermission';
import useAxiosPrivate from '../../../../../config/axiosPrivate';

// ============================================================
// 🔹 Colonnes pour le tableau Annexes déclarations
// ============================================================
const annexesColumns = [
  { id: "action", label: "Action", minWidth: 120, align: "center", required: false },
  { id: "anomalies", label: "Anomalies", minWidth: 100, align: "center", required: false },
  { id: "collecte_deductible", label: "Collectée ou Déductible", minWidth: 180, align: "center", required: true },
  { id: "local_etranger", label: "Local ou Etranger", minWidth: 180, align: "center", required: true },
  { id: "nif", label: "NIF", minWidth: 100, align: "center", required: true },
  { id: "raison_sociale", label: "Raison sociale", minWidth: 160, align: "center", required: true },
  { id: "stat", label: "Stat", minWidth: 100, align: "center", required: true },
  { id: "adresse", label: "Adresse", minWidth: 100, align: "center", required: true },
  { id: "montant_ht", label: "Montant HT", minWidth: 120, align: "right", required: true },
  { id: "montant_tva", label: "Montant TVA", minWidth: 120, align: "right", required: true },
  { id: "reference_facture", label: "Référence facture", minWidth: 140, align: "center", required: true },
  { id: "date_facture", label: "Date facture", minWidth: 120, align: "center", required: true },
  { id: "nature", label: "Nature", minWidth: 120, align: "center", required: true },
  { id: "libelle_operation", label: "Libellé opération", minWidth: 160, align: "center", required: true },
  { id: "date_paiement", label: "Date de paiement", minWidth: 180, align: "center", required: true },
  { id: "code_tva", label: "Code TVA", minWidth: 120, align: "center", required: false },
  { id: "observation", label: "Observation", minWidth: 140, align: "center", required: true },
  { id: "n_dau", label: "N DAU", minWidth: 100, align: "center", required: true },
  { id: "ligne_formulaire", label: "Ligne de formulaire", minWidth: 180, align: "center", required: true },
  { id: "mois", label: "Mois", minWidth: 80, align: "center", required: true },
  { id: "annee", label: "Année", minWidth: 80, align: "center", required: true },
];

export default function ParamTVAComponent() {
  const { canAdd, canModify, canDelete, canView } = usePermission();
  const axiosPrivate = useAxiosPrivate();
  let initial = init[0];
  // ============================================================
  // 🔹 Colonnes pour le tableau Annexes déclarations
  // ============================================================
  const annexesColumns = [
    { id: "action", label: "Action", minWidth: 120, align: "center", required: false },
    { id: "anomalies", label: "Anomalies", minWidth: 100, align: "center", required: false },
    { id: "collecte_deductible", label: "Collectée ou Déductible", minWidth: 180, align: "center", required: true },
    { id: "local_etranger", label: "Local ou Etranger", minWidth: 180, align: "center", required: true },
    { id: "nif", label: "NIF", minWidth: 100, align: "center", required: true },
    { id: "raison_sociale", label: "Raison sociale", minWidth: 160, align: "center", required: true },
    { id: "stat", label: "Stat", minWidth: 100, align: "center", required: true },
    { id: "adresse", label: "Adresse", minWidth: 100, align: "center", required: true },
    { id: "montant_ht", label: "Montant HT", minWidth: 120, align: "right", required: true },
    { id: "montant_tva", label: "Montant TVA", minWidth: 120, align: "right", required: true },
    { id: "reference_facture", label: "Référence facture", minWidth: 140, align: "center", required: true },
    { id: "date_facture", label: "Date facture", minWidth: 120, align: "center", required: true },
    { id: "nature", label: "Nature", minWidth: 120, align: "center", required: true },
    { id: "libelle_operation", label: "Libellé opération", minWidth: 160, align: "center", required: true },
    { id: "date_paiement", label: "Date de paiement", minWidth: 180, align: "center", required: true },
    { id: "code_tva", label: "Code TVA", minWidth: 120, align: "center", required: false },
    { id: "observation", label: "Observation", minWidth: 140, align: "center", required: true },
    { id: "n_dau", label: "N DAU", minWidth: 100, align: "center", required: true },
    { id: "ligne_formulaire", label: "Ligne de formulaire", minWidth: 180, align: "center", required: true },
    { id: "mois", label: "Mois", minWidth: 80, align: "center", required: true },
    { id: "annee", label: "Année", minWidth: 80, align: "center", required: true },

  ];

  // ============================================================
  // 🔹 États Annexes
  // ============================================================
  const [annexesRows, setAnnexesRows] = useState([]);
  const [annexesLoading, setAnnexesLoading] = useState(false);
  const [openEditAnnexe, setOpenEditAnnexe] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  // --- Popup Export TVA
  const [openExportDialog, setOpenExportDialog] = useState(false);
  // Verrouillage formulaire TVA (style Ebilan)
  const [verrTva, setverrTva] = useState(false);
  const [anoms, setAnoms] = useState({ count: 0, list: [] });

  // --- Popup Ajout Annexe
  const [openAddAnnexe, setOpenAddAnnexe] = useState(false);

  const [addAnnexeForm, setAddAnnexeForm] = useState({
    type_tva: "",
    origine: "",
    nif: "",
    raison_sociale: "",
    stat: "",
    adresse: "",
    montant_ht: "",
    montant_tva: "",
    reference_facture: "",
    date_facture: "",
    nature: "",
    libelle_operation: "",
    date_paiement: "",
    observation: "",
    n_dau: "",
    ligne_formulaire: "",
  });

  // Popup confirmation suppression (style Ebilan)
  const [confirmDeleteAnnexe, setConfirmDeleteAnnexe] = useState(false);
  const [rowToDelete, setRowToDelete] = useState(null);
  // Popup confirmation refresh (style Ebilan)
  const [confirmRefreshTva, setConfirmRefreshTva] = useState(false);

  // ============================================================
  // 🔹 Handlers Annexes
  // ============================================================
  const handleOpenDialogAddAnnexe = () => setOpenAddAnnexe(true);
  const handleCloseDialogAddAnnexe = () => setOpenAddAnnexe(false);

  const handleChangeAddAnnexe = (e) => {
    const { name, value } = e.target;
    setAddAnnexeForm((prev) => ({ ...prev, [name]: value }));
  };

  // Ouvrir popup de confirmation pour actualiser les calculs (formulaire TVA)
  const openConfirmRefreshTva = () => {
    setConfirmRefreshTva(true);
  };

  // Callback de confirmation: si oui => lancer handleAutoCalcUnified
  const handleConfirmRefreshTva = async (val) => {
    setConfirmRefreshTva(false);
    if (val === true) {
      await recalcFormFromExisting();
    }
  };

  // Ouvrir la popup de confirmation au style Ebilan
  const openConfirmDeleteAnnexe = (row) => {
    if (!row || !row.id) {
      toast.error('Ligne invalide');
      return;
    }
    setRowToDelete(row);
    setConfirmDeleteAnnexe(true);
  };

  // Callback de la popup: si confirmé => supprimer puis rafraîchir
  const handleConfirmDeleteAnnexe = async (val) => {
    try {
      if (val === true && rowToDelete) {
        await handleDeleteAnnexe(rowToDelete);
      }
    } finally {
      setConfirmDeleteAnnexe(false);
      setRowToDelete(null);
    }
  };

  // Supprimer une annexe (ligne) via API puis rafraîchir la liste (sans autre confirm ici)
  const handleDeleteAnnexe = async (row) => {
    try {
      if (!row || !row.id) {
        toast.error('Ligne invalide');
        return;
      }
      const url = `/declaration/tva/annexes/${row.id}/${fileId}/${compteId}/${selectedExerciceId}/${valSelectMois}/${valSelectAnnee}`;
      await axios.delete(url);
      toast.success('Ligne supprimée');

      await recalcFormFromExisting();
      fetchAnnexes();
      await fetchDbAnomalies();
    } catch (e) {
      console.error('[Annexes] delete error', e);
      toast.error("Erreur lors de la suppression");
    }
  };

  // Récupérer l'état de verrouillage côté serveur (TVA)
  const infosVerrouillage = async (compteId, fileId, exerciceId) => {
    try {
      const { data } = await axios.post('/declaration/tva/infosVerrouillageDeclaration', { compteId, fileId, exerciceId, mois: valSelectMois, annee: valSelectAnnee });
      if (data?.state) {
        const tva = (data.liste || []).find((item) => String(item.code) === 'TVA');
        setverrTva(Boolean(tva?.valide));
        // Auto-create a row for the selected period if missing (valide=false)
        if (!tva && valSelectMois && valSelectAnnee) {
          try {
            const nbranomalie = Number(nbrAnomalieTVA ?? 0);
            await axios.post('/declaration/tva/verrouillerDeclaration', {
              compteId,
              fileId,
              exerciceId,
              code: 'TVA',
              nom: 'TVA',
              mois: valSelectMois,
              annee: valSelectAnnee,
              verr: false,
              nbranomalie,
            });
          } catch (e) {
            console.warn('[TVA] ensurePeriodRow failed', e);
          }
        }
      } else {
        if (data?.msg) toast.error(data.msg);
      }
    } catch (e) {
      console.error('[TVA] infosVerrouillage error', e);
    }
  };

  // Verrouiller / Déverrouiller la déclaration TVA (période)
  const lockTableTVA = async () => {
    try {
      const nbranomalie = Number(nbrAnomalieTVA ?? 0);
      await axios.post('/declaration/tva/verrouillerDeclaration', {
        compteId,
        fileId,
        exerciceId: selectedExerciceId,
        code: 'TVA',
        nom: 'TVA',
        mois: valSelectMois,
        annee: valSelectAnnee,
        verr: !verrTva,
        nbranomalie,
      });
      setverrTva((v) => !v);
    } catch (e) {
      console.error('[TVA] verrouillerTableau error', e);
      toast.error("Erreur lors du (dé)verrouillage");
    }
  };

  // --- Soumission formulaire classique
  const handleSubmitAddAnnexe = async () => {
    try {
      const payload = {
        collecte_deductible: addAnnexeForm.type_tva,
        local_etranger: addAnnexeForm.origine,
        nif: addAnnexeForm.nif,
        raison_sociale: addAnnexeForm.raison_sociale,
        stat: addAnnexeForm.stat,
        adresse: addAnnexeForm.adresse,
        montant_ht: Number(addAnnexeForm.montant_ht || 0),
        montant_tva: Number(addAnnexeForm.montant_tva || 0),
        reference_facture: addAnnexeForm.reference_facture,
        date_facture: addAnnexeForm.date_facture,
        nature: addAnnexeForm.nature,
        libelle_operation: addAnnexeForm.libelle_operation,
        date_paiement: addAnnexeForm.date_paiement,
        observation: addAnnexeForm.observation,
        n_dau: addAnnexeForm.n_dau,
        ligne_formulaire: addAnnexeForm.ligne_formulaire,
        mois: Number(valSelectMois),
        annee: Number(valSelectAnnee),
        id_compte: compteId,
        id_dossier: fileId,
        id_exercice: selectedExerciceId,
      };



      const { data } = await axios.post("/declaration/tva/annexes", payload);
      if (data?.state) {
        toast.success(data?.msg || "Annexe ajoutée");
        setOpenAddAnnexe(false);
        setAddAnnexeForm({
          type_tva: "",
          origine: "",
          nif: "",
          raison_sociale: "",
          stat: "",
          adresse: "",
          montant_ht: "",
          montant_tva: "",
          reference_facture: "",
          date_facture: "",
          nature: "",
          libelle_operation: "",
          date_paiement: "",
          observation: "",
          n_dau: "",
          ligne_formulaire: "",
        });
        fetchAnnexes();
      } else {
        toast.error(data?.msg || "Échec de l'ajout");
      }
    } catch (e) {
      console.error("Erreur ajout annexe", e);
      toast.error("Erreur serveur lors de l'ajout");
    }
  };

  const showAnomalieTVA = async () => {
    try {
      // Charger depuis la DB pour avoir les vrais IDs
      const list = await fetchDbAnomalies();
      const count = Array.isArray(list) ? list.length : 0;
      // console.log('[POPUP][OPEN] anomalies DB count:', count);
      if (count === 0) {
        toast.success('Aucune anomalie pour la période sélectionnée');
        return;
      }
    } catch (e) {
      console.warn('[POPUP] fetchDbAnomalies failed, fallback to computed list', e);
    }
    setOpenAnomaliesPopup(true);
  };

  // --- Soumission depuis Formik (popup)
  const handleSubmitAddAnnexeValues = async (values) => {
    try {
      // Compute anomalies and commentaire automatically
      const anomaliesNotes = [];
      const isEmpty = (v) => {
        const s = String(v ?? '').trim();
        if (s === '') return true;
        const low = s.toLowerCase();
        return low === 'n/a' || low === 'na' || low === 'null' || low === 'undefined' || low === '-';
      };
      if (isEmpty(values.nif)) anomaliesNotes.push('NIF vide');
      if (isEmpty(values.stat)) anomaliesNotes.push('STAT vide');
      if (isEmpty(values.raison_sociale)) anomaliesNotes.push('Raison sociale vide');
      if (isEmpty(values.adresse)) anomaliesNotes.push('Adresse vide');
      if (isEmpty(values.reference_facture)) anomaliesNotes.push('Référence facture vide');
      if (isEmpty(values.date_facture)) anomaliesNotes.push('Date facture vide');
      const computedAnomalies = anomaliesNotes.length > 0;
      const computedCommentaire = anomaliesNotes.join(', ');
      const payload = {
        collecte_deductible: values.type_tva,
        local_etranger: values.origine,
        nif: values.nif,
        raison_sociale: values.raison_sociale,
        stat: values.stat,
        adresse: values.adresse,
        montant_ht: Number(values.montant_ht || 0),
        montant_tva: Number(values.montant_tva || 0),
        reference_facture: values.reference_facture,
        date_facture: values.date_facture,
        nature: values.nature,
        libelle_operation: values.libelle_operation,
        date_paiement: values.date_paiement,
        observation: values.observation,
        n_dau: values.n_dau,
        ligne_formulaire: values.ligne_formulaire,
        anomalies: computedAnomalies,
        code_tva: values.code_tva,
        commentaire: computedCommentaire,
        mois: Number(valSelectMois),
        annee: Number(valSelectAnnee),
        id_compte: compteId,
        id_dossier: fileId,
        id_exercice: selectedExerciceId,
      };

      const { data } = await axios.post("/declaration/tva/annexes", payload);
      if (data?.state) {
        toast.success(data?.msg || "Annexe ajoutée");
        setOpenAddAnnexe(false);
        fetchAnnexes();
      } else {
        toast.error(data?.msg || "Échec de l'ajout");
      }
    } catch (e) {
      console.error("Erreur ajout annexe", e);
      toast.error("Erreur serveur lors de l'ajout");
    }
  };

  const handleOpenEditAnnexe = (row) => {
    setEditingRow(row);
    setOpenEditAnnexe(true);
  };

  const handleEditAnnexe = async (id, values) => {
    try {
      // même calcul d'anomalies/commentaire côté front pour cohérence
      const anomaliesNotes = [];
      const isEmpty = (v) => {
        const s = String(v ?? '').trim();
        if (s === '') return true;
        const low = s.toLowerCase();
        return low === 'n/a' || low === 'na' || low === 'null' || low === 'undefined' || low === '-';
      };
      if (isEmpty(values.nif)) anomaliesNotes.push('NIF vide');
      if (isEmpty(values.stat)) anomaliesNotes.push('STAT vide');
      if (isEmpty(values.raison_sociale)) anomaliesNotes.push('Raison sociale vide');
      if (isEmpty(values.adresse)) anomaliesNotes.push('Adresse vide');
      if (isEmpty(values.reference_facture)) anomaliesNotes.push('Référence facture vide');
      if (isEmpty(values.date_facture)) anomaliesNotes.push('Date facture vide');
      const computedAnomalies = anomaliesNotes.length > 0;
      const computedCommentaire = anomaliesNotes.join(', ');

      const payload = {
        collecte_deductible: values.type_tva,
        local_etranger: values.origine,
        nif: values.nif,
        raison_sociale: values.raison_sociale,
        stat: values.stat,
        adresse: values.adresse,
        montant_ht: Number(values.montant_ht || 0),
        montant_tva: Number(values.montant_tva || 0),
        reference_facture: values.reference_facture,
        date_facture: values.date_facture,
        nature: values.nature,
        libelle_operation: values.libelle_operation,
        date_paiement: values.date_paiement,
        observation: values.observation,
        n_dau: values.n_dau,
        ligne_formulaire: values.ligne_formulaire,
        anomalies: computedAnomalies,
        code_tva: values.code_tva,
        commentaire: computedCommentaire,
      };
      const { data } = await axios.put(`/declaration/tva/annexes/${id}`, payload);
      if (data?.state) {
        toast.success(data?.msg || 'Annexe modifiée');
        setOpenEditAnnexe(false);
        setEditingRow(null);
        fetchAnnexes();
      } else {
        toast.error(data?.msg || 'Échec de la modification');
      }
    } catch (e) {
      console.error('Erreur modification annexe', e);
      toast.error('Erreur serveur lors de la modification');
    }
  };

  /**
   * Récupère la liste des annexes TVA pour le contexte courant.
   * GET /declaration/tva/annexes
   */
  const fetchAnnexes = async () => {
    try {
      if (!fileId || !compteId || !selectedExerciceId || !valSelectMois || !valSelectAnnee) {
        setAnnexesRows([]);
        return;
      }

      const params = {
        id_dossier: fileId,
        id_compte: compteId,
        id_exercice: selectedExerciceId,
        mois: valSelectMois,
        annee: valSelectAnnee,
      };

      const { data } = await axios.get('/declaration/tva/annexes', {
        params,
        timeout: 60000
      });

    if (data?.state) {
      const updatedRows = Array.isArray(data.list) ? data.list : (data.list ? [data.list] : []);

      // Récupérer aussi les écritures associées pour la même période
      let assocList = [];
      try {
        const { data: assoc } = await axios.get(`/declaration/tva/ecritureassociee/${compteId}/${fileId}/${selectedExerciceId}`, {
          params: { mois: Number(valSelectMois), annee: Number(valSelectAnnee), _cb: Date.now() },
          headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
          timeout: 60000,
        });
        assocList = Array.isArray(assoc?.list) ? assoc.list : [];
      } catch (e) {
        // silencieux: on enrichira seulement avec paramTva si indisponible
      }

      // Construire un index id_ecriture -> compte tiers classe 4 (et libellé)
      const assocByEcriture = (() => {
        try {
          const map = new Map();
          const isTiers = (c) => {
            const s = (c || '').toString();
            // Tiers de classe 4, mais on EXCLUT 445* (comptes TVA)
            return s.startsWith('4') && !s.startsWith('445');
          };
          try { console.debug('[ANNEXES][TIERS] assocList count =', assocList.length, 'sample =', assocList[0]); } catch {}
          for (const it of assocList) {
            const ids = [it?.id, it?.id_ecriture, it?.id_ecriture_source, it?.id_ecriture_associe, it?.idecriture, it?.ecriture_id]
              .map(x => Number(x))
              .filter(n => Number.isFinite(n) && n > 0);
            // Backend enrichi: la ligne TVA peut contenir directement la contrepartie tiers
            const cpt = it?.tiers_compte || it?.compte || it?.compte_cetralise || it?.compte_centralise || it?.compte_centralise2;
            const lib = it?.tiers_libelle || it?.libelle || it?.libelle_compte || it?.libelle_centralise;
            if (ids.length === 0 || !cpt) continue;
            if (!isTiers(cpt)) continue;
            for (const ide of ids) {
              if (!map.has(ide)) map.set(ide, { compte: cpt, libelle: lib });
            }
          }
          try { console.debug('[ANNEXES][TIERS] assoc index size =', map.size); } catch {}
          return map;
        } catch {
          return new Map();
        }
      })();

      // Index générique: id_ecriture -> première ligne associée (peut être 445*)
      const assocByEcritureAny = (() => {
        try {
          const map = new Map();
          for (const it of assocList) {
            const ids = [it?.id, it?.id_ecriture, it?.id_ecriture_source, it?.id_ecriture_associe, it?.idecriture, it?.ecriture_id]
              .map(x => Number(x))
              .filter(n => Number.isFinite(n) && n > 0);
            const cpt = it?.compte || it?.compte_cetralise || it?.compte_centralise || it?.compte_centralise2;
            const lib = it?.libelle || it?.libelle_compte || it?.libelle_centralise;
            if (ids.length === 0) continue;
            for (const ide of ids) {
              if (!map.has(ide)) map.set(ide, { compte: cpt, libelle: lib });
            }
          }
          try { console.debug('[ANNEXES][ASSOC ANY] index size =', map.size); } catch {}
          return map;
        } catch {
          return new Map();
        }
      })();

      // Helper normalisation compte
      const norm = (v) => {
        const s = (v ?? '').toString().trim();
        const onlyDigits = s.replace(/\D+/g, '');
        return onlyDigits || s;
      };
      // Construire des index: par compte, par libellé et par id_cptcompta
      const { paramIndex, paramLabelIndex, paramIdIndex } = (() => {
        try {
          const list = Array.isArray(paramTva) ? paramTva : [];
          const byCompte = new Map();
          const byLabel = new Map();
          const byId = new Map();
          for (const p of list) {
            const c = (p["dossierplancomptable.compte"] || p.compte || p.cptcompta || '').toString().trim();
            const key = norm(c);
            const code = p["listecodetva.code"] || p.code || p.code_tva || p.codetva;
            const lib = p["listecodetva.libelle"] || p.libelle || p.codedescription;
            if (key) {
              if (!byCompte.has(key)) byCompte.set(key, { code, lib, raw: p });
            }
            const lkey = String(lib ?? '').toUpperCase().replace(/\s+/g, ' ').trim();
            if (lkey) {
              if (!byLabel.has(lkey)) byLabel.set(lkey, { code, lib, raw: p });
            }
            const idc = Number(p.id_cptcompta);
            if (Number.isFinite(idc) && idc > 0 && !byId.has(idc)) byId.set(idc, { code, lib, raw: p });
          }
          try { console.debug('[ANNEXES][ENRICH] paramIndex size =', byCompte.size, 'paramLabelIndex size =', byLabel.size, 'paramIdIndex size =', byId.size); } catch {}
          return { paramIndex: byCompte, paramLabelIndex: byLabel, paramIdIndex: byId };
        } catch {
          return { paramIndex: new Map(), paramLabelIndex: new Map(), paramIdIndex: new Map() };
        }
      })();

      // Index du plan comptable: id -> compte (pour traduire id_numcpt des annexes)
      const pcIdToCompte = (() => {
        try {
          const list = Array.isArray(pc) ? pc : [];
          const map = new Map();
          for (const p of list) {
            const idc = Number(p.id);
            const c = (p.compte || '').toString().trim();
            if (Number.isFinite(idc) && c) map.set(idc, c);
          }
          try { console.debug('[ANNEXES][ENRICH] pcIdToCompte size =', map.size); } catch {}
          return map;
        } catch {
          return new Map();
        }
      })();

      setAnnexesRows(prevRows => {
        // Créer une map des lignes existantes pour un accès rapide
        const existingRowsMap = new Map(prevRows.map(row => [row.id, row]));
        
        return updatedRows.map(row => {
          const existingRow = existingRowsMap.get(row.id);
          
          // Si la ligne existe déjà, conserver son état d'anomalie et son commentaire
          if (existingRow) {
            const enriched = { ...row };
            // Laisser Nature vide par défaut (saisie manuelle), sans écraser si déjà rempli
            {
              const nat = String(enriched.nature ?? '').trim();
              const natLower = nat.toLowerCase();
              if (nat === '' || nat === '-' || natLower === 'null' || natLower === 'undefined' || natLower === 'general' || natLower === 'général' || natLower === 'general ' || natLower === 'général ') {
                enriched.nature = '';
              }
            }
            // Enrichir code_tva si vide
            if (!enriched.code_tva) {
              let key = norm(enriched.compte || enriched.cpt || enriched.num_compte);
              if (!key && enriched.id_numcpt) {
                const acc = pcIdToCompte.get(Number(enriched.id_numcpt));
                if (acc) key = norm(acc);
              }
              const hit = key ? paramIndex.get(key) : undefined;
              if (hit?.code) {
                enriched.code_tva = hit.code;
              } else {
                const lkey = String(enriched.raison_sociale || enriched.libelle_operation || enriched.libelle || '').toUpperCase().replace(/\s+/g, ' ').trim();
                const hit2 = lkey ? paramLabelIndex.get(lkey) : undefined;
                if (hit2?.code) {
                  enriched.code_tva = hit2.code;
                } else {
                  const idnum = Number(enriched.id_numcpt);
                  const hit3 = Number.isFinite(idnum) ? paramIdIndex.get(idnum) : undefined;
                  if (hit3?.code) {
                    enriched.code_tva = hit3.code;
                  } else {
                    try { console.debug('[ANNEXES][MISS] no code for row id=', row.id, 'compte=', enriched.compte, 'id_numcpt=', enriched.id_numcpt, 'label=', enriched.raison_sociale || enriched.libelle_operation || enriched.libelle); } catch {}
                  }
                }
              }
            }
            const _isEmptyText = (v) => {
              const s = (v ?? '').toString().trim();
              return s === '' || s === '-';
            };
            {
              const keepRsBlank = enriched.raison_sociale === '';
              let hasTiers = false;
              // Si le backend fournit directement tiers_compte/tiers_libelle, on les privilégie
              const directTiersCompte = (enriched.tiers_compte || row.tiers_compte || '').toString();
              const directTiersLibelle = (enriched.tiers_libelle || row.tiers_libelle || '').toString();
              if (directTiersCompte && directTiersCompte.startsWith('4') && !directTiersCompte.startsWith('445')) {
                const pcRowDirect = Array.isArray(pc) ? pc.find(p => (p.compte || '').toString() === directTiersCompte) : null;
                if (!keepRsBlank) {
                  enriched.raison_sociale = pcRowDirect?.libelle || directTiersLibelle || enriched.raison_sociale;
                }
                if (_isEmptyText(enriched.nif)) enriched.nif = pcRowDirect?.nif || enriched.nif;
                if (_isEmptyText(enriched.stat)) enriched.stat = pcRowDirect?.statistique || pcRowDirect?.stat || enriched.stat;
                if (_isEmptyText(enriched.adresse)) enriched.adresse = pcRowDirect?.adresse || pcRowDirect?.adressesansnif || pcRowDirect?.adresseetranger || enriched.adresse;
                hasTiers = Boolean((pcRowDirect?.libelle || directTiersLibelle) && String(pcRowDirect?.libelle || directTiersLibelle).trim() !== '');
              }
              const ideCandidates = [enriched.id_ecriture, enriched.id_ecriture_associe, enriched.id_ecriture_source]
                .map(x => Number(x))
                .filter(n => Number.isFinite(n) && n > 0);
              try { console.debug('[ANNEXES][TIERS] ideCandidates existing row id=', row.id, ideCandidates); } catch {}
              let assocTiers = null;
              for (const ide of ideCandidates) {
                assocTiers = assocByEcriture.get(ide);
                if (assocTiers) break;
              }
              if (assocTiers?.compte) {
                // Chercher libellé côté plan comptable pour ce compte tiers
                const pcRow = Array.isArray(pc) ? pc.find(p => (p.compte || '').toString() === assocTiers.compte.toString()) : null;
                // Toujours remplacer par le libellé tiers si trouvé
                if (!keepRsBlank) {
                  enriched.raison_sociale = pcRow?.libelle || assocTiers.libelle || enriched.raison_sociale;
                }
                if (_isEmptyText(enriched.nif)) {
                  enriched.nif = assocTiers?.nif || pcRow?.nif || enriched.nif;
                }
                if (_isEmptyText(enriched.stat)) {
                  enriched.stat = assocTiers?.statistique || assocTiers?.stat || pcRow?.statistique || pcRow?.stat || enriched.stat;
                }
                if (_isEmptyText(enriched.adresse)) {
                  enriched.adresse = assocTiers?.adresse || assocTiers?.adressesansnif || assocTiers?.adresseetranger || pcRow?.adresse || pcRow?.adressesansnif || pcRow?.adresseetranger || enriched.adresse;
                }
                hasTiers = true;
              } else {
                // Fallback ultime: si aucune contrepartie classe 4, utiliser le libellé de la ligne associée (même 445*)
                if (!hasTiers && !keepRsBlank) {
                  let assocAny = null;
                  for (const ide of ideCandidates) {
                    assocAny = assocByEcritureAny.get(ide);
                    if (assocAny) break;
                  }
                  if (assocAny?.libelle) {
                    enriched.raison_sociale = assocAny.libelle;
                  } else {
                    try { console.debug('[ANNEXES][TIERS MISS] no assoc for row id=', row.id, 'ids=', ideCandidates); } catch {}
                  }
                }
              }
            }
            return {
              ...enriched,
              anomalies: existingRow.anomalies || row.anomalies || false,
              commentaire: existingRow.commentaire || row.commentaire || ''
            };
          }
          
          // Pour les nouvelles lignes, calculer les anomalies si nécessaire
          const isEmpty = (v) => {
            if (v === null || v === undefined) return true;
            const s = String(v).trim();
            if (s === '') return true;
            const low = s.toLowerCase();
            return low === 'n/a' || low === 'na' || low === 'null' || low === 'undefined' || low === '-' || low === '0';
          };
          
          const notesSet = new Set(
            String(row?.commentaire || '')
              .split(',')
              .map(s => s.trim())
              .filter(Boolean)
          );
          if (isEmpty(row?.nif)) notesSet.add('NIF vide');
          if (isEmpty(row?.stat)) notesSet.add('STAT vide');
          if (row?.raison_sociale !== '' && isEmpty(row?.raison_sociale)) notesSet.add('Raison sociale vide');
          if (isEmpty(row?.adresse)) notesSet.add('Adresse vide');
          if (isEmpty(row?.reference_facture)) notesSet.add('Référence facture vide');
          if (isEmpty(row?.date_facture)) notesSet.add('Date facture vide');
          if (!row?.code_tva) notesSet.add('Code TVA introuvable pour le compte');
          const notes = Array.from(notesSet);
          
          const enriched = { ...row };
          // Laisser Nature vide par défaut (saisie manuelle)
          {
            const nat = String(enriched.nature ?? '').trim();
            const natLower = nat.toLowerCase();
            if (nat === '' || nat === '-' || natLower === 'null' || natLower === 'undefined' || natLower === 'general' || natLower === 'général' || natLower === 'general ' || natLower === 'général ') {
              enriched.nature = '';
            }
          }
          // Enrichir code_tva si vide
          if (!enriched.code_tva) {
            let key = norm(enriched.compte || enriched.cpt || enriched.num_compte);
            if (!key && enriched.id_numcpt) {
              const acc = pcIdToCompte.get(Number(enriched.id_numcpt));
              if (acc) key = norm(acc);
            }
            const hit = key ? paramIndex.get(key) : undefined;
            if (hit?.code) {
              enriched.code_tva = hit.code;
            } else {
              const lkey = String(enriched.raison_sociale || enriched.libelle_operation || enriched.libelle || '').toUpperCase().replace(/\s+/g, ' ').trim();
              const hit2 = lkey ? paramLabelIndex.get(lkey) : undefined;
              if (hit2?.code) {
                enriched.code_tva = hit2.code;
              } else {
                const idnum = Number(enriched.id_numcpt);
                const hit3 = Number.isFinite(idnum) ? paramIdIndex.get(idnum) : undefined;
                if (hit3?.code) {
                  enriched.code_tva = hit3.code;
                } else {
                  try { console.debug('[ANNEXES][MISS] no code for NEW row', enriched); } catch {}
                }
              }
            }
          }
          const _isEmptyTextNew = (v) => {
            const s = (v ?? '').toString().trim();
            return s === '' || s === '-';
          };
          {
            const keepRsBlank = enriched.raison_sociale === '';
            let hasTiers = false;
            // Si le backend fournit directement tiers_compte/tiers_libelle, on les privilégie
            const directTiersCompte = (enriched.tiers_compte || row.tiers_compte || '').toString();
            const directTiersLibelle = (enriched.tiers_libelle || row.tiers_libelle || '').toString();
            if (directTiersCompte && directTiersCompte.startsWith('4') && !directTiersCompte.startsWith('445')) {
              const pcRowDirect = Array.isArray(pc) ? pc.find(p => (p.compte || '').toString() === directTiersCompte) : null;
              if (!keepRsBlank) {
                enriched.raison_sociale = pcRowDirect?.libelle || directTiersLibelle || enriched.raison_sociale;
              }
              if (_isEmptyTextNew(enriched.nif)) enriched.nif = pcRowDirect?.nif || enriched.nif;
              if (_isEmptyTextNew(enriched.stat)) enriched.stat = pcRowDirect?.statistique || pcRowDirect?.stat || enriched.stat;
              if (_isEmptyTextNew(enriched.adresse)) enriched.adresse = pcRowDirect?.adresse || pcRowDirect?.adressesansnif || pcRowDirect?.adresseetranger || enriched.adresse;
              hasTiers = Boolean((pcRowDirect?.libelle || directTiersLibelle) && String(pcRowDirect?.libelle || directTiersLibelle).trim() !== '');
            }
            const ideCandidates = [enriched.id_ecriture, enriched.id_ecriture_associe, enriched.id_ecriture_source]
              .map(x => Number(x))
              .filter(n => Number.isFinite(n) && n > 0);
            try { console.debug('[ANNEXES][TIERS] ideCandidates NEW row', ideCandidates); } catch {}
            let assocTiers = null;
            for (const ide of ideCandidates) {
              assocTiers = assocByEcriture.get(ide);
              if (assocTiers) break;
            }
            if (assocTiers?.compte) {
              const pcRow = Array.isArray(pc) ? pc.find(p => (p.compte || '').toString() === assocTiers.compte.toString()) : null;
              if (!keepRsBlank) {
                enriched.raison_sociale = pcRow?.libelle || assocTiers.libelle || enriched.raison_sociale;
              }
              if (_isEmptyTextNew(enriched.nif)) {
                enriched.nif = assocTiers?.nif || pcRow?.nif || enriched.nif;
              }
              if (_isEmptyTextNew(enriched.stat)) {
                enriched.stat = assocTiers?.statistique || assocTiers?.stat || pcRow?.statistique || pcRow?.stat || enriched.stat;
              }
              if (_isEmptyTextNew(enriched.adresse)) {
                enriched.adresse = assocTiers?.adresse || assocTiers?.adressesansnif || assocTiers?.adresseetranger || pcRow?.adresse || pcRow?.adressesansnif || pcRow?.adresseetranger || enriched.adresse;
              }
              hasTiers = true;
            } else {
              if (!hasTiers && !keepRsBlank) {
                let assocAny = null;
                for (const ide of ideCandidates) {
                  assocAny = assocByEcritureAny.get(ide);
                  if (assocAny) break;
                }
                if (assocAny?.libelle) {
                  enriched.raison_sociale = assocAny.libelle;
                }
              }
            }
          }
          if (enriched.raison_sociale === '') {
            const idx = notes.indexOf('Raison sociale vide');
            if (idx !== -1) notes.splice(idx, 1);
          }
          return {
            ...enriched,
            anomalies: notes.length > 0,
            commentaire: notes.join(', ')
          };
        });
      });
    } else {
      setAnnexesRows([]);
      if (data?.msg) {
        toast.error(data.msg);
      }
    }
  } catch (e) {
    console.error('[Annexes] fetch error', e);
    // toast.error("Erreur lors du chargement des annexes");
  }
};

  /**
   * Génère les annexes TVA automatiquement.
   */
  const handleGenerateAnnexes = async () => {
    if (!fileId || !compteId || !selectedExerciceId || !valSelectMois || !valSelectAnnee) {
      toast.error("Veuillez sélectionner un exercice, mois et année");
      return;
    }
    try {
      setAnnexesLoading(true);
      const payload = {
        id_compte: compteId,
        id_dossier: fileId,
        id_exercice: selectedExerciceId,
        mois: valSelectMois,
        annee: valSelectAnnee,
      };
      const { data } = await axiosPrivate.post("/declaration/tva/generateAnnexeDeclarationAuto", payload, { timeout: 120000 });
      if (data?.state) {
        toast.success(data?.msg || "Annexes générées avec succès");
        fetchAnnexes(); // Recharger les données
        await fetchDbAnomalies(); // Mettre à jour le compteur d'anomalies immédiatement
      } else {
        toast.error(data?.msg || "Échec de la génération des annexes");
      }
    } catch (e) {
      console.error("Erreur génération annexes", e);
      toast.error("Erreur serveur lors de la génération des annexes");
    } finally {
      setAnnexesLoading(false);
    }
  };


  // Contexte dossier et période (doivent être déclarés avant les useEffect qui les référencent)
  const { id } = useParams();
  const [fileId, setFileId] = useState(0);
  const [fileInfos, setFileInfos] = useState('');
  const [noFile, setNoFile] = useState(false);
  const [listeCodeJournaux, setListeCodeJournaux] = useState([]);
  const [listeCodeTva, setListeCodeTva] = useState([]);
  const [listeCodeTvaUnfiltered, setListeCodeTvaUnfiltered] = useState([]);

  // State for exercice and periode
  const [listeExercice, setListeExercice] = useState([]);
  const [listeSituation, setListeSituation] = useState([]);
  const [selectedPeriodeChoiceId, setSelectedPeriodeChoiceId] = useState(0);
  const [selectedPeriodeId, setSelectedPeriodeId] = useState('');
  const [selectedExerciceId, setSelectedExerciceId] = useState('');

  // --- Sélection mois/année---
  const [valSelectMois, setValSelectMois] = useState(1); // Janvier par défaut
  const [valSelectAnnee, setValSelectAnnee] = useState(new Date().getFullYear());
  const [listeAnnee, setListeAnnee] = useState([]);

  // --- Refresh trigger used by data-loading effects
  const [refreshCounter, setRefreshCounter] = useState(0);
  const handleRefresh = () => setRefreshCounter((c) => c + 1);

  // --- Déclencheur manuel pour recalcul du CA (Formulaire TVA)
  const [computeTrigger, setComputeTrigger] = useState(0);
  // Menu d'export du Formulaire (ancre)
  const [formExportAnchor, setFormExportAnchor] = useState(null);
  // Sous-menu PDF (ancre)
  const [pdfExportAnchor, setPdfExportAnchor] = useState(null);
  // Sous-menu Excel (ancre)
  const [excelExportAnchor, setExcelExportAnchor] = useState(null);

  //récupération infos de connexion
  const { auth } = useAuth();
  const decoded = auth?.accessToken ? jwtDecode(auth.accessToken) : undefined;
  const compteId = decoded?.UserInfo?.compteId ? Number(decoded.UserInfo.compteId) : null;
  const userId = decoded?.UserInfo?.userId ? Number(decoded.UserInfo.userId) : null;
  const navigate = useNavigate();

  // Appeler infosVerrouillage à chaque changement de contexte/période
  useEffect(() => {
    if (!fileId || !compteId || !selectedExerciceId || !valSelectMois || !valSelectAnnee) return;
    (async () => {
      try {
        await infosVerrouillage(compteId, fileId, selectedExerciceId);
      } catch (e) {
        console.warn('[TVA] infosVerrouillage effect failed', e);
      }
    })();
  }, [fileId, compteId, selectedExerciceId, valSelectMois, valSelectAnnee]);

  // Rafraîchir automatiquement les anomalies DB sur changement de contexte/période
  useEffect(() => {
    (async () => {
      try {
        await fetchDbAnomalies();
      } catch (e) {
        console.warn('[TVA] fetchDbAnomalies effect failed', e);
      }
    })();
  }, [fileId, compteId, selectedExerciceId, valSelectMois, valSelectAnnee]);

  // Appelle le backend pour auto-calculer le formulaire unifié (CFISC/DGE), puis rafraîchit le tableau
  const handleAutoCalcUnified = async () => {
    try {
      if (!fileId || !compteId || !selectedExerciceId) {
        toast.error('Sélection dossier/compte/exercice manquante');
        return;
      }
      // 1) Générer/mettre à jour les annexes pour le mois/année sélectionnés
      const genPayload = {
        id_compte: compteId,
        id_dossier: fileId,
        id_exercice: selectedExerciceId,
        mois: valSelectMois,
        annee: valSelectAnnee,
      };
      try {
        await axios.post('/declaration/tva/generateAnnexeDeclarationAuto', genPayload, { timeout: 120000 });
      } catch (e) {
        // On continue quand même: si aucune écriture ne correspond, l'auto-calc remettra à 0
        console.warn('[FormTVA] génération annexes échouée (continuation auto-calc)', e);
      }

      // 2) Lancer l'auto-calcul unifié (CFISC/DGE) avec la période sélectionnée
      const autoUrl = `/declaration/tva/formulaire/auto-calc/${fileId}/${compteId}/${selectedExerciceId}`;
      const payload = { mois: valSelectMois, annee: valSelectAnnee, debug: true };
      try { console.log('[FRONT][AUTO-CALC][REQUEST]', autoUrl, payload); } catch { }
      const { data: autoData } = await axios.post(autoUrl, payload, { timeout: 120000 });
      try { console.log('[FRONT][AUTO-CALC][RESPONSE]', autoData); } catch { }
      if (autoData?.state) {
        toast.success(autoData?.msg || 'Calcul automatique: succès');
        // forcer refresh de la table formulaire
        setRefreshCounter((c) => c + 1);
        await fetchDbAnomalies();
      } else {
        toast.error(autoData?.msg || 'Calcul automatique: échec');
      }
    } catch (e) {
      console.error('[FormTVA] auto-calc unified failed', e);
      toast.error('Erreur calcul automatique');
    }
  };

  // Recalcule uniquement le formulaire (sans régénérer les annexes)
  const recalcFormFromExisting = async () => {
    try {
      if (!fileId || !compteId || !selectedExerciceId) {
        toast.error('Sélection dossier/compte/exercice manquante');
        return;
      }
      const autoUrl = `/declaration/tva/formulaire/auto-calc/${fileId}/${compteId}/${selectedExerciceId}`;
      const payload = { mois: valSelectMois, annee: valSelectAnnee, debug: false, resetManual: true };
      const { data: autoData } = await axios.post(autoUrl, payload, { timeout: 120000 });
      if (autoData?.state) {
        setRefreshCounter((c) => c + 1);
        setComputeTrigger((c) => c + 1);
        await fetchDbAnomalies();
      } else {
        toast.error(autoData?.msg || 'Recalcul formulaire: échec');
      }
    } catch (e) {
      console.error('[FormTVA] recalc-from-existing failed', e);
      toast.error('Erreur recalcul formulaire');
    }
  };

  // ============================================================
  // 🔹 Journal
  // ============================================================
  const [journalRows, setJournalRows] = useState([]);
  const [journalLoading, setJournalLoading] = useState(false);
  const [filteredList, setFilteredList] = useState(null);

  // ============================================================
  // 🔹 Comptes TVA 
  const [comptesTvaOptions, setComptesTvaOptions] = useState([]);
  const [selectedCompteTva, setSelectedCompteTva] = useState('');

  // --- Navigation des comptes (flèches à côté du sélecteur)
  const currentCompteIndex = useMemo(() => {
    if (!Array.isArray(comptesTvaOptions) || comptesTvaOptions.length === 0) return -1;
    const cur = comptesTvaOptions.findIndex(o => String(o.id) === String(selectedCompteTva || ''));
    return cur;
  }, [comptesTvaOptions, selectedCompteTva]);

  /**
   * Etat désactivé pour la flèche "Précédent".
   */
  const navCompteDisabledPrev = !comptesTvaOptions?.length || (currentCompteIndex <= 0 && currentCompteIndex !== -1);
  /**
   * Etat désactivé pour la flèche "Suivant".
   */
  const navCompteDisabledNext = !comptesTvaOptions?.length || (currentCompteIndex >= (comptesTvaOptions.length - 1) && currentCompteIndex !== -1);

  /**
   * Va au compte précédent dans la liste, si possible.
   */
  const handleComptePrev = () => {
    if (!Array.isArray(comptesTvaOptions) || comptesTvaOptions.length === 0) return;
    if (currentCompteIndex === -1) {
      // si rien n'est sélectionné, aller au dernier
      setSelectedCompteTva(String(comptesTvaOptions[comptesTvaOptions.length - 1].id));
      return;
    }
    if (currentCompteIndex > 0) {
      setSelectedCompteTva(String(comptesTvaOptions[currentCompteIndex - 1].id));
    }
  };

  /**
   * Va au compte suivant dans la liste, si possible.
   */
  const handleCompteNext = () => {
    if (!Array.isArray(comptesTvaOptions) || comptesTvaOptions.length === 0) return;
    if (currentCompteIndex === -1) {
      // si rien n'est sélectionné, aller au premier
      setSelectedCompteTva(String(comptesTvaOptions[0].id));
      return;
    }
    if (currentCompteIndex < comptesTvaOptions.length - 1) {
      setSelectedCompteTva(String(comptesTvaOptions[currentCompteIndex + 1].id));
    }
  };

  const [selectedRowId, setSelectedRowId] = useState([]);
  const [rowModesModel, setRowModesModel] = useState({});
  const [disableModifyBouton, setDisableModifyBouton] = useState(true);
  const [disableCancelBouton, setDisableCancelBouton] = useState(true);
  const [disableSaveBouton, setDisableSaveBouton] = useState(true);
  const [disableDeleteBouton, setDisableDeleteBouton] = useState(true);
  const [editableRow, setEditableRow] = useState(true);
  const [openDialogDeleteRow, setOpenDialogDeleteRow] = useState(false);
  const [listeCptAssocie, setListeCptAssocie] = useState([]);
  const [pc, setPc] = useState([]);
  const [paramTva, setParamTva] = useState([]);
  const [compteValidationColor, setCompteValidationColor] = useState('transparent');
  const [codeValidationColor, setCodeValidationColor] = useState('transparent');
  const [openAnomaliesPopup, setOpenAnomaliesPopup] = useState(false);
  const [calcAnomalies, setCalcAnomalies] = useState([]);
  const [dbAnomaliesRows, setDbAnomaliesRows] = useState([]);

  // Lignes du popup construites à partir des anomalies calculées côté formulaire
  const anomaliesPopupRows = useMemo(() => {
    // Toujours refléter la DB pour éviter des confusions de période
    if (Array.isArray(dbAnomaliesRows) && dbAnomaliesRows.length > 0) {
      const rows = dbAnomaliesRows.map((r) => ({
        id: (r?.id != null ? r.id : `tmp-${Number(r?.code) || 0}-${String(r?.kind ?? '').trim().toLowerCase()}`),
        groupe: r.groupe || '-',
        anomalie: r.message || r.anomalie || '',
        valide: Boolean(r.valide) || false,
        commentaire: r.commentaire || '',
        id_dossier: r.id_dossier,
        id_compte: r.id_compte,
        id_exercice: r.id_exercice,
        mois: r.mois,
        annee: r.annee,
        code: r.code,
        kind: r.kind,
        _persisted: r?._persisted === true,
      }));
      try { console.log('[POPUP][ROWS] built from DB anomalies:', rows.length); } catch { }
      return rows;
    }
    return [];
  }, [dbAnomaliesRows]);

  // Récupère les anomalies persistées (DB) pour le contexte courant
  // const fetchDbAnomalies = async () => {
  //   try {
  //     if (!fileId || !compteId || !selectedExerciceId || !valSelectMois || !valSelectAnnee) {
  //       setDbAnomaliesRows([]);
  //       return [];
  //     }
  //     // Snapshot de la période courante pour éviter d'appliquer une réponse sur une période déjà changée
  //     const moisNow = Number(valSelectMois);
  //     const anneeNow = Number(valSelectAnnee);
  //     const params = {
  //       id_dossier: fileId,
  //       id_compte: compteId,
  //       id_exercice: selectedExerciceId,
  //       mois: moisNow,
  //       annee: anneeNow,
  //     };
  //     const { data } = await axios.get('/declaration/tva/anomalies', { params, timeout: 30000 });
  //     const list = Array.isArray(data?.list) ? data.list : (data?.list ? [data.list] : []);
  //     // N'appliquer que si la période n'a pas changé pendant l'appel
  //     if (moisNow === Number(valSelectMois) && anneeNow === Number(valSelectAnnee)) {
  //       setDbAnomaliesRows(list);
  //     }
  //     return list;
  //   } catch (e) {
  //     console.error('[POPUP] fetchDbAnomalies error', e);
  //     setDbAnomaliesRows([]);
  //     return [];
  //   }
  // };
  // Récupère les anomalies persistées (DB) pour le contexte courant
  const fetchDbAnomalies = async () => {
    try {
      if (!fileId || !compteId || !selectedExerciceId || !valSelectMois || !valSelectAnnee) {
        // Contexte incomplet: ne pas écraser l'affichage actuel pour éviter le clignotement
        return Array.isArray(dbAnomaliesRows) ? dbAnomaliesRows : [];
      }
      const moisNow = Number(valSelectMois);
      const anneeNow = Number(valSelectAnnee);
      const params = {
        id_dossier: fileId,
        id_compte: compteId,
        id_exercice: selectedExerciceId,
        mois: moisNow,
        annee: anneeNow,
      };

      try {
        // Timeout étendu
        const [dbRes, computeRes] = await Promise.allSettled([
          axios.get('/declaration/tva/anomalies', { params, timeout: 120000 }),
          axios.get('/declaration/tva/anomalies/compute', { params, timeout: 120000 }),
        ]);

        const dbData = (dbRes.status === 'fulfilled') ? dbRes.value?.data : null;
        const computeData = (computeRes.status === 'fulfilled') ? computeRes.value?.data : null;

        const dbListRaw = Array.isArray(dbData?.list) ? dbData.list : (dbData?.list ? [dbData.list] : []);
        const dbList = dbListRaw.map((it) => ({ ...it, _persisted: true }));

        const computeRaw = Array.isArray(computeData?.list) ? computeData.list : [];
        const computeList = computeRaw.map((it) => {
          const code = Number(it?.code) || 0;
          const kind = it?.kind != null ? String(it.kind).trim().toLowerCase() : null;
          return {
            ...it,
            id: `tmp-${code}-${String(kind ?? '')}`,
            id_dossier: fileId,
            id_compte: compteId,
            id_exercice: selectedExerciceId,
            mois: moisNow,
            annee: anneeNow,
            code,
            kind,
            valide: false,
            commentaire: it?.commentaire ?? null,
            _persisted: false,
          };
        });

        // Merge par clé fonctionnelle (code + kind). Si déjà en DB, on garde la version DB (avec id).
        const mergedByKey = new Map();
        for (const it of computeList) {
          const k = `${Number(it?.code) || 0}::${String(it?.kind ?? '')}`;
          mergedByKey.set(k, it);
        }
        for (const it of dbList) {
          const k = `${Number(it?.code) || 0}::${String((it?.kind ?? '')).trim().toLowerCase()}`;
          mergedByKey.set(k, it);
        }
        const merged = Array.from(mergedByKey.values());

        if (moisNow === Number(valSelectMois) && anneeNow === Number(valSelectAnnee)) {
          setDbAnomaliesRows(merged);
        }
        return merged;
      } catch (e) {
        // Fallback si timeout
        if (e?.code === 'ECONNABORTED') {
          try {
            const { data } = await axios.get('/declaration/tva/anomalies/compute', { params, timeout: 120000 });
            const raw = Array.isArray(data?.list) ? data.list : [];
            const list = raw.map((it) => {
              const code = Number(it?.code) || 0;
              const kind = it?.kind != null ? String(it.kind).trim().toLowerCase() : null;
              return {
                ...it,
                id: `tmp-${code}-${String(kind ?? '')}`,
                id_dossier: fileId,
                id_compte: compteId,
                id_exercice: selectedExerciceId,
                mois: moisNow,
                annee: anneeNow,
                code,
                kind,
                valide: false,
                commentaire: it?.commentaire ?? null,
                _persisted: false,
              };
            });
            if (moisNow === Number(valSelectMois) && anneeNow === Number(valSelectAnnee)) {
              setDbAnomaliesRows(list);
            }
            toast('Anomalies affichées via calcul à la volée (fallback).', { icon: '⚠️' });
            return list;
          } catch (e2) {
            console.error('[POPUP] anomalies compute fallback error', e2);
          }
        }
        throw e;
      }
    } catch (e) {
      console.error('[POPUP] fetchDbAnomalies error', e);
      // Erreur transitoire: conserver l'état courant pour éviter le clignotement
      return Array.isArray(dbAnomaliesRows) ? dbAnomaliesRows : [];
    }
  };

  // ============================================================
  // 🔹 Onglets (TabContext)
  // ============================================================
  const [tabValue, setTabValue] = useState('1');
  const handleTabChange = (event, newValue) => setTabValue(newValue);

  // Sous-onglets pour l'onglet Détails: "Sélection de ligne" et "Test"
  const [detailsTabValue, setDetailsTabValue] = useState('1');
  const handleDetailsTabChange = (event, newValue) => setDetailsTabValue(newValue);

  // Charger les Annexes lorsqu’on ouvre l’onglet ou qu’un filtre change
  useEffect(() => {
    if (tabValue === '2') {
      fetchAnnexes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabValue, fileId, compteId, selectedExerciceId, valSelectMois, valSelectAnnee, refreshCounter]);

  // Charger l'état de verrouillage lorsque l'onglet Formulaire (1) est actif ou que la période change
  useEffect(() => {
    if (tabValue === '1' && fileId && compteId && selectedExerciceId && valSelectMois && valSelectAnnee) {
      infosVerrouillage(compteId, fileId, selectedExerciceId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabValue, fileId, compteId, selectedExerciceId, valSelectMois, valSelectAnnee]);

  // Charger la liste des comptes TVA paramétrés (options du sélecteur) quand l'onglet Détails s'ouvre
  useEffect(() => {
    const loadComptes = async () => {
      try {
        if (tabValue !== '3' || !fileId) return;
        const pt = await axios.get(`/paramTva/listeParamTva/${fileId}`);
        const listPtRaw = pt?.data?.list || [];
        const listPt = Array.isArray(listPtRaw) ? listPtRaw : (listPtRaw ? [listPtRaw] : []);
        const uniques = new Map();
        listPt.forEach(r => {
          const idc = r.id_cptcompta;
          if (!idc) return;
          // Essayer d'afficher le numéro de compte si présent
          const label = r.compte || String(idc);
          if (!uniques.has(idc)) uniques.set(idc, { id: idc, label });
        });
        const opts = Array.from(uniques.values());
        setComptesTvaOptions(opts);
        // Optionnel: auto-sélectionner le premier
        // if (!selectedCompteTva && opts.length > 0) setSelectedCompteTva(String(opts[0].id));
      } catch (e) {
        console.error('[Détails TVA] chargement comptes TVA échoué', e);
        setComptesTvaOptions([]);
      }
    };
    loadComptes();
  }, [tabValue, fileId, refreshCounter]);

  const handleChangeMois = (event) => {
    setValSelectMois(Number(event.target.value));
  };

  useEffect(() => {
    setAnoms({ count: 0, list: [] });
  }, [valSelectMois, valSelectAnnee, fileId, compteId, selectedExerciceId]);

  // Si une période n'est pas encore définie mais que le contexte est prêt, fixer une valeur par défaut
  useEffect(() => {
    if (fileId && compteId && selectedExerciceId && !valSelectAnnee) {
      setValSelectAnnee(new Date().getFullYear());
    }
  }, [fileId, compteId, selectedExerciceId, valSelectAnnee]);

  // Recharger automatiquement les anomalies DB quand la période change
  useEffect(() => {
    (async () => {
      await fetchDbAnomalies();
    })();
  }, [valSelectMois, valSelectAnnee, fileId, compteId, selectedExerciceId]);

  //sauvegarde de la nouvelle ligne ajoutée
  const formikNewParamTva = useFormik({
    initialValues: {
      idCompte: compteId,
      idDossier: fileId,
      idCode: 0,
      compte: '',
      libelle: '',
      code: '',
      codedescription: ''
    },
    validationSchema: Yup.object({
      compte: Yup.string().required("Veuillez ajouter un compte de tva"),
      code: Yup.string().required("Veuillez ajouter un code de Tva"),
    }),

    validateOnChange: false,
    validateOnBlur: true,
  });

  // ============================================================
  // 🔹 Contexte dossier & exercices
  // ============================================================
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
    // console.log('[ParamTVA] mount -> idFile:', idFile);
    GetInfosIdDossier(idFile);
    // console.log('[ParamTVA] calling GetListeExercice with idFile:', idFile);
    GetListeExercice(idFile);
  }, []);

  /**
   * Récupère les informations du dossier sélectionné.
   */
  const GetInfosIdDossier = (id) => {
    axios.get(`/home/FileInfos/${id}`).then((response) => {
      const resData = response.data;

      if (resData.state) {
        setFileInfos(resData.fileInfos[0]);
        setNoFile(false);
        // console.log('[ParamTVA] FileInfos:', resData.fileInfos[0]);
      } else {
        setFileInfos([]);
        setNoFile(true);
        // console.warn('[ParamTVA] FileInfos not found for id', id);
      }
    })
  }

  /**
   * Charge la liste des exercices pour un dossier donné.
   */
  const GetListeExercice = (id) => {
    if (!id) {
      console.warn('[ParamTVA] GetListeExercice skipped, id dossier vide');
      return;
    }
    // console.log('[ParamTVA] GetListeExercice -> id:', id);
    axios.get(`/paramExercice/listeExercice/${id}`)
      .then((response) => {
        const resData = response.data;
        // console.log('[ParamTVA] GetListeExercice response:', resData);
        if (resData.state) {
          const list = resData.list || [];
          setListeExercice(list);
          // console.log('[ParamTVA] exercices count:', list.length);
          const exerciceN = list.filter(it => it.libelle_rang === 'N');
          if (exerciceN.length > 0) {
            setSelectedExerciceId(exerciceN[0].id);
            setSelectedPeriodeChoiceId(0);
            setSelectedPeriodeId(''); // attendre les situations
            GetDateDebutFinExercice(exerciceN[0].id);
          } else if (list.length > 0) {
            setSelectedExerciceId(list[0].id);
            setSelectedPeriodeChoiceId(0);
            setSelectedPeriodeId(''); // attendre les situations
            GetDateDebutFinExercice(list[0].id);
          }
        } else {
          setListeExercice([]);
          toast.error("Erreur lors de la récupération des exercices");
          // console.error('[ParamTVA] GetListeExercice state=false:', resData.msg);
        }
      })
      .catch(err => {
        // console.error('[ParamTVA] GetListeExercice error:', err);
        toast.error('Erreur réseau: exercices');
      });
  }

  /**
   * Charge les situations (périodes) pour un exercice.
   */
  const GetListeSituation = (exerciceId) => {
    if (!exerciceId) {
      console.warn('[ParamTVA] GetListeSituation skipped, exerciceId vide');
      return;
    }
    // console.log('[ParamTVA] GetListeSituation -> exerciceId:', exerciceId);
    axios.get(`/paramExercice/listeSituation/${exerciceId}`)
      .then((response) => {
        const resData = response.data;
        // console.log('[ParamTVA] GetListeSituation response:', resData);
        if (resData.state) {
          const raw = resData.list;
          const list = Array.isArray(raw) ? raw : (raw ? [raw] : []);
          setListeSituation(list);
          if (list.length > 0) {
            setSelectedPeriodeId(list[0].id);
          } else {
            setSelectedPeriodeId('');
          }
        } else {
          setListeSituation([]);
          toast.error('Erreur lors du chargement des périodes');
          // console.error('[ParamTVA] GetListeSituation state=false:', resData.msg);
        }
      })
      .catch(err => {
        // console.error('[ParamTVA] GetListeSituation error:', err);
        toast.error('Erreur réseau: périodes');
      });
  }

  /**
   * Récupère les dates de début/fin d'exercice.
   */
  const GetDateDebutFinExercice = (exerciceId) => {
    if (!exerciceId) {
      console.warn('[ParamTVA] GetDateDebutFinExercice skipped, exerciceId vide');
      return;
    }
    // console.log('[ParamTVA] GetDateDebutFinExercice -> exerciceId:', exerciceId);
    axios.get(`/paramExercice/listeExerciceById/${exerciceId}`)
      .then((response) => {
        const resData = response.data;
        const raw = resData?.list;
        const exo = Array.isArray(raw) ? raw[0] : raw;
        if (resData?.state && exo) {
          const dDebut = exo.date_debut || exo.datedebut;
          const dFin = exo.date_fin || exo.datefin;
          const startYear = new Date(dDebut).getFullYear();
          const endYear = new Date(dFin).getFullYear();
          const years = [];
          for (let y = startYear; y <= endYear; y++) years.push(y);
          setListeAnnee(years);
          if (years.length > 0) setValSelectAnnee(years[0]);
          // console.log('[ParamTVA] Années exercice:', years);
          if (Number(selectedPeriodeChoiceId) === 0) {
            const fallback = [{ id: exerciceId, libelle_rang: 'Exercice', date_debut: dDebut, date_fin: dFin }];
            setListeSituation(fallback);
            setSelectedPeriodeId(exerciceId);
          } else {
            GetListeSituation(exerciceId);
          }
        } else {
          // console.error('[ParamTVA] GetDateDebutFinExercice state=false or empty', resData);
          setListeAnnee([]);
        }
      })
      .catch(err => {
        // console.error('[ParamTVA] GetDateDebutFinExercice error:', err);
        toast.error('Erreur réseau: années');
      });
  }

  // Changer l'intervalle (sélection d'une situation)
  const handleChangeDateIntervalle = (periodeId) => {
    setSelectedPeriodeId(periodeId || '');
  }

  // Handlers de sélection
  const handleChangeExercice = (exoId) => {
    // console.log('[ParamTVA] handleChangeExercice ->', exoId);
    setSelectedExerciceId(exoId);
    setSelectedPeriodeChoiceId(0);
    setSelectedPeriodeId('');
    GetDateDebutFinExercice(exoId);
  }

  // Handler pour changement de période
  const handleChangePeriode = (choiceId) => {
    // console.log('[ParamTVA] handleChangePeriode ->', choiceId);
    setSelectedPeriodeChoiceId(choiceId);
    if (Number(choiceId) === 1) {
      GetListeSituation(selectedExerciceId);
    } else {
      GetDateDebutFinExercice(selectedExerciceId);
    }
  }

  // useEffect pour sélectionner l'année par défaut
  useEffect(() => {
    if (listeAnnee.length > 0 && !valSelectAnnee) {
      setValSelectAnnee(listeAnnee[0]);
    }
  }, [listeAnnee, valSelectAnnee]);

  // Handler pour retour à la page d'accueil
  const sendToHome = (value) => {
    setNoFile(!value);
    navigate('/tab/home');
  }

  //Chargement de la liste des exercices associés à l'id dossier sélectionné
  const GetListeCodeTva = () => {
    axios.get(`/paramTva/listeCodeTva`).then((response) => {
      const resData = response.data;
      if (resData.state) {
        setListeCodeTva(resData.list);
        setListeCodeTvaUnfiltered(resData.list);
      } else {
        setListeCodeTva([]);
        setListeCodeTvaUnfiltered([]);
        toast.error(resData.msg);
      }
    }).catch((error) => {
      console.error('[ParamTVA] GetListeCodeTva error:', error);
      setListeCodeTva([]);
      setListeCodeTvaUnfiltered([]);
      toast.error('Erreur lors du chargement des codes TVA');
    });
  }

  //Récupération du plan comptable
  const recupPc = () => {
    if (!fileId) {
      console.warn('[ParamTVA] recupPc skipped, fileId vide');
      return;
    }
    axios.post(`/paramPlanComptable/pc`, { fileId }).then((response) => {
      const resData = response.data;
      if (resData.state) {
        const pcToFilter = resData.liste;
        const filteredPc = pcToFilter?.filter((row) => row.compte.startsWith('445'));
        setPc(filteredPc);
      } else {
        toast.error(resData.msg);
      }
    }).catch((error) => {
      console.error('[ParamTVA] recupPc error:', error);
      setPc([]);
      toast.error('Erreur lors du chargement du plan comptable');
    });
  }

  //Récupération du tableau des paramétrages de tva effectués
  const getListeParamTva = (id = fileId) => {
    if (!id) {
      console.warn('[ParamTVA] getListeParamTva skipped, fileId vide');
      return;
    }
    axios.get(`/paramTva/listeParamTva/${id}`).then((response) => {
      const resData = response.data;
      if (resData.state) {
        setParamTva(resData.list);
      } else {
        setParamTva([]);
        toast.error(resData.msg);
      }
    }).catch((error) => {
      console.error('[ParamTVA] getListeParamTva error:', error);
      setParamTva([]);
      toast.error('Erreur lors du chargement des paramètres TVA');
    });
  }

  useEffect(() => {
    recupPc();
    GetListeCodeTva();
    getListeParamTva();
  }, [fileId]);

  // Recharger les données quand refreshCounter change (après calculs automatiques)
  useEffect(() => {
    if (refreshCounter > 0 && fileId) {
      getListeParamTva(fileId);
    }
  }, [refreshCounter, fileId]);

  // Recharger les données quand la période change
  useEffect(() => {
    if (fileId && selectedExerciceId && valSelectMois && valSelectAnnee) {
      // Recharger les données de base
      getListeParamTva(fileId);
      recupPc();
    }
  }, [fileId, selectedExerciceId, valSelectMois, valSelectAnnee]);

  const handleEditClick = (id) => () => {
    //réinitialiser les couleurs des champs
    setCodeValidationColor('transparent');
    setCompteValidationColor('transparent');

    //charger dans le formik les données de la ligne
    const selectedRowInfos = paramTva?.filter((item) => item.id === id[0]);

    const compteInit = selectedRowInfos[0];
    const compte = compteInit['dossierplancomptable.compte'];
    const libelle = compteInit['dossierplancomptable.libelle'];
    const description = compteInit['listecodetva.libelle'];

    if (compte?.startsWith('4456')) {
      const filteredCode = listeCodeTvaUnfiltered?.filter((row) => row.nature === 'DED');
      setListeCodeTva(filteredCode);
    } else if (compte?.startsWith('4457')) {
      const filteredCode = listeCodeTvaUnfiltered?.filter((row) => row.nature === 'COLL');
      setListeCodeTva(filteredCode);
    } else {
      GetListeCodeTva();
    }

    formikNewParamTva.setFieldValue("idCode", id);
    formikNewParamTva.setFieldValue("idDossier", fileId);
    formikNewParamTva.setFieldValue("idCompte", compteId);
    formikNewParamTva.setFieldValue("compte", selectedRowInfos[0].id_cptcompta);
    formikNewParamTva.setFieldValue("libelle", libelle);
    formikNewParamTva.setFieldValue("code", selectedRowInfos[0].type);
    formikNewParamTva.setFieldValue("codedescription", description);

    setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.Edit } });
    setDisableSaveBouton(false);
  };

  const handleSaveClick = (id) => () => {
    let saveBoolCompte = false;
    let saveBoolCode = false;

    setCompteValidationColor('transparent');
    setCodeValidationColor('transparent');

    if (formikNewParamTva.values.compte === '') {
      setCompteValidationColor('#F6D6D6');
      saveBoolCompte = false;
    } else {
      setCompteValidationColor('transparent');
      saveBoolCompte = true;
    }

    if (formikNewParamTva.values.code === '') {
      setCodeValidationColor('#F6D6D6');
      saveBoolCode = false;
    } else {
      setCodeValidationColor('transparent');
      saveBoolCode = true;
    }

    if (saveBoolCode && saveBoolCompte) {
      setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.View } });
      axios.post(`/paramTva/paramTvaAdd`, formikNewParamTva.values).then((response) => {
        const resData = response.data;

        if (resData.state) {
          setDisableSaveBouton(true);
          formikNewParamTva.resetForm();

          // Recharger toutes les données liées
          getListeParamTva(fileId);
          recupPc(); // Recharger le plan comptable au cas où

          // Déclencher le refresh pour les calculs automatiques
          setRefreshCounter(prev => prev + 1);

          toast.success(resData.msg);
        } else {
          toast.error(resData.msg);
        }
      }).catch((error) => {
        console.error('[ParamTVA] handleSaveClick error:', error);
        toast.error('Erreur lors de la sauvegarde');
        // Remettre en mode édition en cas d'erreur
        setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.Edit } });
      });
    } else {
      toast.error('Les champs en surbrillances sont obligatoires');
    }
  };

  const handleOpenDialogConfirmDeleteAssocieRow = () => {
    setOpenDialogDeleteRow(true);
  }

  const deleteRow = (value) => {
    if (value === true) {
      if (selectedRowId.length === 1) {
        const idToDelete = selectedRowId[0];
        axiosPrivate.post(`/paramTva/paramTvaDelete`, { fileId, compteId, idToDelete }).then((response) => {
          const resData = response.data;
          if (resData.state) {
            setOpenDialogDeleteRow(false);
            setParamTva(paramTva.filter((row) => row.id !== selectedRowId[0]));
            toast.success(resData.msg);
          } else {
            setOpenDialogDeleteRow(false);
            toast.error(resData.msg);
          }
        });
      }
      setOpenDialogDeleteRow(false);
    } else {
      setOpenDialogDeleteRow(false);
    }
  }

  const handleCancelClick = (id) => () => {
    setRowModesModel({
      ...rowModesModel,
      [id]: { mode: GridRowModes.View, ignoreModifications: true },
    });
  };

  const handleOpenDialogDeleteRow = () => {
    setOpenDialogDeleteRow(true);
  }

  //récupérer le numéro id le plus grand dans le tableau
  const getMaxID = (data) => {
    const Ids = data.map(item => item.id);
    return Math.max(...Ids);
  };

  const nbrAnomalieTVA = useMemo(() => Array.isArray(calcAnomalies) ? calcAnomalies.length : 0, [calcAnomalies]);

  return (
    <Paper sx={{ p: 2 }}>
      {noFile ? <PopupTestSelectedFile confirmationState={sendToHome} /> : null}
      {(openDialogDeleteRow && canDelete) ? <PopupConfirmDelete msg={"Voulez-vous vraiment supprimer le code journal sélectionné ?"} confirmationState={deleteRow} /> : null}
      <Stack width="100%" spacing={2}>
        <TabContext value={"1"}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <TabList aria-label="lab API tabs example">
              <Tab
                style={{
                  textTransform: 'none',
                  outline: 'none',
                  border: 'none',
                  margin: 0
                }}
                label={InfoFileStyle(fileInfos?.dossier)} value="1"
              />
            </TabList>
          </Box>
        </TabContext>

        <Typography variant='h6' sx={{ color: "black" }} align='left'>Déclaration : TVA</Typography>

        <Stack direction="row" spacing={4} alignItems="center" flexWrap="wrap" sx={{ width: '100%' }}>
          <FormControl variant="standard" sx={{ minWidth: 250 }}>
            <InputLabel>Exercice:</InputLabel>
            <Select
              value={selectedExerciceId || ''}
              onChange={(e) => handleChangeExercice(e.target.value)}
            >
              {listeExercice.map((option) => {
                const dDebut = option.date_debut || option.datedebut;
                const dFin = option.date_fin || option.datefin;
                return (
                  <MenuItem key={option.id} value={option.id}>
                    {option.libelle_rang}: {dDebut ? format(new Date(dDebut), 'dd/MM/yyyy') : ''} - {dFin ? format(new Date(dFin), 'dd/MM/yyyy') : ''}
                  </MenuItem>
                );
              })}
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
              value={selectedPeriodeId || ''}
              onChange={(e) => handleChangeDateIntervalle(e.target.value)}
            >
              {(!listeSituation || listeSituation.length === 0) && (
                <MenuItem value="" disabled>Aucune période</MenuItem>
              )}
              {listeSituation?.map((option) => {
                const dDebut = option.date_debut || option.datedebut;
                const dFin = option.date_fin || option.datefin;
                return (
                  <MenuItem key={option.id} value={option.id}>
                    {option.libelle_rang}: {dDebut ? format(new Date(dDebut), 'dd/MM/yyyy') : ''} - {dFin ? format(new Date(dFin), 'dd/MM/yyyy') : ''}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
        </Stack>

        {/* LIGNE MOIS / ANNÉE */}
        <Stack direction="row" spacing={4} mt={2} alignItems="center" flexWrap="wrap" sx={{ width: '100%', pr: 2, rowGap: 1 }}>
          <FormControl variant="standard" sx={{ minWidth: 130 }}>
            <InputLabel>Mois</InputLabel>
            <Select
              value={valSelectMois}
              onChange={handleChangeMois}
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

          <FormControl variant="standard" sx={{ minWidth: 130 }} >
            <InputLabel>Année</InputLabel>
            <Select
              value={valSelectAnnee || ''}
              onChange={(e) => setValSelectAnnee(e.target.value)}
              name="valSelectAnnee"
            >
              {listeAnnee.map((year, index) => (
                <MenuItem key={index} value={year}>
                  {year}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Box sx={{ flexGrow: 1 }} />

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {(tabValue === '2') && listeExercice && listeExercice.length > 0 && selectedExerciceId && selectedExerciceId !== 0 && (
              <Tooltip title="Exporter">
                <span>
                  <Button
                    variant="outlined"
                    style={{ textTransform: 'none', outline: 'none' }}
                    startIcon={<AiTwotoneFileText size={22} />}
                    onClick={() => setOpenExportDialog(true)}
                  >
                    Exporter
                  </Button>
                </span>
              </Tooltip>
            )}

            {tabValue === '1' && (
              <>
                <Tooltip title={fileInfos?.centrefisc === 'DGE' ? 'Exporter (Modèle DGE)' : 'Exporter (Modèle Centre fiscal)'}>
                  <span>
                    <Button
                      variant="outlined"
                      style={{ textTransform: 'none', outline: 'none' }}
                      startIcon={<AiTwotoneFileText size={22} />}
                      onClick={(e) => setFormExportAnchor(e.currentTarget)}
                    >
                      Exporter
                    </Button>
                  </span>
                </Tooltip>
                <Menu
                  anchorEl={formExportAnchor}
                  open={Boolean(formExportAnchor)}
                  onClose={() => setFormExportAnchor(null)}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                >
                  <MenuItem
                    onClick={(e) => {
                      // Ouvre un sous-menu pour choisir avec/sans détails
                      setExcelExportAnchor(e.currentTarget);
                    }}
                  >
                    {fileInfos?.centrefisc === 'DGE' ? 'Formulaire DGE Excel' : 'Formulaire CFISC Excel'}
                  </MenuItem>
                  <MenuItem
                    onClick={(e) => {
                      // Ouvre un sous-menu pour choisir avec/sans détails
                      setPdfExportAnchor(e.currentTarget);
                    }}
                  >
                    {fileInfos?.centrefisc === 'DGE' ? 'Formulaire DGE PDF' : 'Formulaire CFISC PDF'}
                  </MenuItem>
                </Menu>

                {/* Sous-menu Excel: avec / sans détails */}
                <Menu
                  anchorEl={excelExportAnchor}
                  open={Boolean(excelExportAnchor)}
                  onClose={() => setExcelExportAnchor(null)}
                  anchorOrigin={{ vertical: 'center', horizontal: 'right' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                >
                  <MenuItem
                    onClick={async () => {
                      try {
                        setExcelExportAnchor(null);
                        setFormExportAnchor(null);
                        const mois = Number(valSelectMois);
                        const annee = Number(valSelectAnnee);
                        const idDossier = fileId || sessionStorage.getItem('fileId');
                        const mode = fileInfos?.centrefisc === 'DGE' ? 'dge' : 'cfisc';
                        const url = `${axios}/declaration/tva/formulaire/export-excel/${idDossier}/${compteId}/${selectedExerciceId}?mois=${mois}&annee=${annee}&mode=${mode}`;
                        const resp = await fetch(url, { method: 'GET', headers: { 'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' } });
                        if (!resp.ok) throw new Error('Erreur export Formulaire Excel');
                        const blob = await resp.blob();
                        const link = document.createElement('a');
                        const href = window.URL.createObjectURL(blob);
                        link.href = href;
                        link.download = `formulaire_tva_${mode}_${String(mois).padStart(2, '0')}-${annee}.xlsx`;
                        document.body.appendChild(link);
                        link.click();
                        link.remove();
                        window.URL.revokeObjectURL(href);
                      } catch (e) {
                        toast.error("Erreur lors de l'export Excel (Formulaire)");
                      }
                    }}
                  >
                    Sans détails
                  </MenuItem>
                  <MenuItem
                    onClick={async () => {
                      try {
                        setExcelExportAnchor(null);
                        setFormExportAnchor(null);
                        const mois = Number(valSelectMois);
                        const annee = Number(valSelectAnnee);
                        const idDossier = fileId || sessionStorage.getItem('fileId');
                        const mode = fileInfos?.centrefisc === 'DGE' ? 'dge' : 'cfisc';
                        const url = `${axios}/declaration/tva/formulaire/export-excel/${idDossier}/${compteId}/${selectedExerciceId}?mois=${mois}&annee=${annee}&mode=${mode}&includeDetails=1`;
                        const resp = await fetch(url, { method: 'GET', headers: { 'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' } });
                        if (!resp.ok) throw new Error('Erreur export Formulaire Excel (détails)');
                        const blob = await resp.blob();
                        const link = document.createElement('a');
                        const href = window.URL.createObjectURL(blob);
                        link.href = href;
                        link.download = `formulaire_tva_${mode}_${String(mois).padStart(2, '0')}-${annee}_details.xlsx`;
                        document.body.appendChild(link);
                        link.click();
                        link.remove();
                        window.URL.revokeObjectURL(href);
                      } catch (e) {
                        toast.error("Erreur lors de l'export Excel avec détails (Formulaire)");
                      }
                    }}
                  >
                    Avec détails
                  </MenuItem>
                </Menu>

                {/* Sous-menu PDF: avec / sans détails */}
                <Menu
                  anchorEl={pdfExportAnchor}
                  open={Boolean(pdfExportAnchor)}
                  onClose={() => setPdfExportAnchor(null)}
                  anchorOrigin={{ vertical: 'center', horizontal: 'right' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                >
                  <MenuItem
                    onClick={async () => {
                      try {
                        setPdfExportAnchor(null);
                        setFormExportAnchor(null);
                        const mois = Number(valSelectMois);
                        const annee = Number(valSelectAnnee);
                        const idDossier = fileId || sessionStorage.getItem('fileId');
                        const mode = fileInfos?.centrefisc === 'DGE' ? 'dge' : 'cfisc';
                        const url = `${axios}/declaration/tva/formulaire/export-pdf/${idDossier}/${compteId}/${selectedExerciceId}?mois=${mois}&annee=${annee}&mode=${mode}`;
                        const resp = await fetch(url, { method: 'GET', headers: { 'Accept': 'application/pdf' } });
                        if (!resp.ok) throw new Error('Erreur export Formulaire PDF');
                        const blob = await resp.blob();
                        const a = document.createElement('a');
                        const href = window.URL.createObjectURL(blob);
                        a.href = href;
                        a.download = `formulaire_tva_${mode}_${String(mois).padStart(2, '0')}-${annee}.pdf`;
                        document.body.appendChild(a);
                        a.click();
                        a.remove();
                        window.URL.revokeObjectURL(href);
                      } catch (e) {
                        toast.error("Erreur lors de l'export PDF (Formulaire)");
                      }
                    }}
                  >
                    Sans détails
                  </MenuItem>
                  <MenuItem
                    onClick={async () => {
                      try {
                        setPdfExportAnchor(null);
                        setFormExportAnchor(null);
                        const mois = Number(valSelectMois);
                        const annee = Number(valSelectAnnee);
                        const idDossier = fileId || sessionStorage.getItem('fileId');
                        const mode = fileInfos?.centrefisc === 'DGE' ? 'dge' : 'cfisc';
                        const url = `${axios}/declaration/tva/formulaire/export-pdf/${idDossier}/${compteId}/${selectedExerciceId}?mois=${mois}&annee=${annee}&mode=${mode}&includeDetails=1`;
                        const resp = await fetch(url, { method: 'GET', headers: { 'Accept': 'application/pdf' } });
                        if (!resp.ok) throw new Error('Erreur export Formulaire PDF (détails)');
                        const blob = await resp.blob();
                        const a = document.createElement('a');
                        const href = window.URL.createObjectURL(blob);
                        a.href = href;
                        a.download = `formulaire_tva_${mode}_${String(mois).padStart(2, '0')}-${annee}_details.pdf`;
                        document.body.appendChild(a);
                        a.click();
                        a.remove();
                        window.URL.revokeObjectURL(href);
                      } catch (e) {
                        toast.error("Erreur lors de l'export PDF avec détails (Formulaire)");
                      }
                    }}
                  >
                    Avec détails
                  </MenuItem>
                </Menu>
              </>
            )}
            {tabValue !== '3' && (
              <Tooltip title={verrTva ? 'Déverrouiller le tableau' : 'Vérrouiller le tableau'}>
                <IconButton
                  disabled={!listeExercice || listeExercice.length === 0 || !selectedExerciceId || selectedExerciceId === 0}
                  onClick={lockTableTVA}
                  variant="contained"
                  style={{
                    width: '45px',
                    height: '45px',
                    borderRadius: '2px',
                    borderColor: 'transparent',
                    backgroundColor: verrTva ? 'rgba(240, 43, 33, 1)' : 'rgba(9, 77, 31, 0.8)',
                    textTransform: 'none',
                    outline: 'none',
                  }}
                >
                  {verrTva ? (
                    <CiLock style={{ width: '25px', height: '25px', color: 'white' }} />
                  ) : (
                    <CiUnlock style={{ width: '25px', height: '25px', color: 'white' }} />
                  )}
                </IconButton>
              </Tooltip>
            )}
          </Box>

        </Stack>
      </Stack>
      <Box sx={{ height: 20 }} />
      <TabContext value={tabValue}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <TabList onChange={handleTabChange} aria-label="Tabs TVA" variant="scrollable">
            <Tab disabled={!listeExercice || listeExercice.length === 0 || !selectedExerciceId || selectedExerciceId === 0} style={{ textTransform: 'none', outline: 'none', border: 'none', }} label="Formulaire TVA" value="1" />
            <Tab disabled={!listeExercice || listeExercice.length === 0 || !selectedExerciceId || selectedExerciceId === 0} style={{ textTransform: 'none', outline: 'none', border: 'none', }} label="Annexes déclarations" value="2" />
            <Tab disabled={!listeExercice || listeExercice.length === 0 || !selectedExerciceId || selectedExerciceId === 0} style={{ textTransform: 'none', outline: 'none', border: 'none', }} label="Détails" value="3" />
          </TabList>
        </Box>

        <TabPanel value="1">
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
            <Typography variant='subtitle1'></Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Tooltip title="Liste des anomalies (DB)">
                <IconButton
                  style={{ textTransform: 'none', outline: 'none' }}
                  onClick={showAnomalieTVA}
                >
                  {(() => {
                    const currentCount = Array.isArray(dbAnomaliesRows)
                      ? dbAnomaliesRows.filter(r => Number(r?.mois) === Number(valSelectMois) && Number(r?.annee) === Number(valSelectAnnee)).length
                      : 0;
                    return (
                      <Badge badgeContent={currentCount} color={currentCount > 0 ? 'error' : 'default'}>
                        <GoAlert color='#FF8A8A' style={{ width: '30px', height: '30px' }} />
                      </Badge>
                    );
                  })()}
                </IconButton>
              </Tooltip>
              {!verrTva && (
                <Tooltip title="Actualiser les calculs">
                  <IconButton
                    disabled={!canAdd}
                    onClick={openConfirmRefreshTva}
                    variant="contained"
                    style={{
                      width: "45px", height: '45px',
                      borderRadius: "1px", borderColor: "transparent",
                      backgroundColor: initial.theme,
                      textTransform: 'none', outline: 'none',
                      display: 'inline-flex',
                    }}
                  >
                    <TbRefresh style={{ width: '25px', height: '25px', color: 'white' }} />
                  </IconButton>
                </Tooltip>
              )}
            </Stack>
          </Stack>
          {confirmRefreshTva && (
            <PopupActionConfirm
              msg={"Voulez-vous vraiment actualiser les calculs pour le formulaire TVA ?"}
              confirmationState={handleConfirmRefreshTva}
            />
          )}
          {openAnomaliesPopup && (
            <PopupDetailAnomalie
              title="TVA"
              rows={anomaliesPopupRows}
              confirmationState={() => setOpenAnomaliesPopup(false)}
              canEdit={dbAnomaliesRows.length > 0}
              onAnomaliesChanged={() => fetchDbAnomalies()}
            />
          )}
          <FormulaireTvaUnified
            fileInfos={fileInfos}
            fileId={fileId}
            compteId={compteId}
            selectedExerciceId={selectedExerciceId}
            mois={valSelectMois}
            annee={valSelectAnnee}
            computeTrigger={computeTrigger}
            refreshCounter={refreshCounter}
            onAnomaliesChange={setDbAnomaliesRows}
            canView={canView}
          />
        </TabPanel>

        <TabPanel value="2">

          {confirmDeleteAnnexe && (
            <PopupConfirmDelete
              msg={"Voulez-vous vraiment supprimer cette ligne d'annexe TVA ?"}
              confirmationState={handleConfirmDeleteAnnexe}
            />
          )}
          {/* Tableau Annexes déclarations (VirtualTable composant dédié) */}
          <DatagridAnnexesTva
            rows={annexesRows}
            columns={annexesColumns}
            selectedRowId={selectedRowId}
            setSelectedRowId={setSelectedRowId}
            setDisableModifyBouton={setDisableModifyBouton}
            setDisableDeleteBouton={setDisableDeleteBouton}
            height={'55vh'}
            onGenerate={handleGenerateAnnexes}
            onEditRow={handleOpenEditAnnexe}
            onDeleteRow={openConfirmDeleteAnnexe}
            canView={canView}
            canAdd={canAdd}
            canDelete={canDelete}
            canModify={canModify}
          />
        </TabPanel>
        {/* Dialog Ajouter Annexe */}
        <AddTvaAnnexeDialog
          open={openAddAnnexe}
          confirmationState={setOpenAddAnnexe}
          id_compte={compteId}
          id_dossier={fileId}
          id_exercice={selectedExerciceId}
          onAddAnnexe={handleSubmitAddAnnexeValues}
        />

        {/* Dialog Modifier Annexe */}
        <EditTvaAnnexeDialog
          open={openEditAnnexe}
          confirmationState={setOpenEditAnnexe}
          row={editingRow}
          onEditAnnexe={handleEditAnnexe}
        />

        {/* Dialog Export TVA  */}
        <ExportTvaDialog
          open={openExportDialog}
          onClose={() => setOpenExportDialog(false)}
          annexesData={annexesRows}
          exerciceId={selectedExerciceId}
          valSelectMois={valSelectMois}
          valSelectAnnee={valSelectAnnee}
          compteId={compteId}
        />

        <TabPanel value="3">
          <TabContext value={detailsTabValue}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
              <TabList onChange={handleDetailsTabChange} aria-label="Tabs Détails TVA" variant="scrollable">
                <Tab style={{ textTransform: 'none', outline: 'none', border: 'none' }} label="Sélection de ligne" value="1" />
                <Tab style={{ textTransform: 'none', outline: 'none', border: 'none' }} label="Ecriture associée" value="2" />
              </TabList>
            </Box>

            <TabPanel value="1">
              <DatagridDetailSelectionLigne
                selectedExerciceId={selectedExerciceId}
                fileId={fileId}
                compteId={compteId}
                valSelectAnnee={valSelectAnnee}
                valSelectMois={valSelectMois}
                journalRows={journalRows}
                setJournalRows={setJournalRows}
                journalLoading={journalLoading}
                setJournalLoading={setJournalLoading}
                filteredList={filteredList}
                setFilteredList={setFilteredList}
                canView={canView}
                canAdd={canAdd}
                canDelete={canDelete}
                canModify={canModify}
              />
            </TabPanel>

            <TabPanel value="2">
              <DatagridDetailEcritureAssociee
                selectedExerciceId={selectedExerciceId}
                fileId={fileId}
                compteId={compteId}
                valSelectAnnee={valSelectAnnee}
                valSelectMois={valSelectMois}
                canView={canView}
                canAdd={canAdd}
                canDelete={canDelete}
                canModify={canModify}
              />
            </TabPanel>
          </TabContext>
        </TabPanel>
      </TabContext>
    </Paper>
  )
}
