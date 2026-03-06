import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Typography, Stack, Box, Tab, Button, TextField, Tooltip, IconButton } from '@mui/material';
import Checkbox from '@mui/material/Checkbox';
import { CheckCircle, Close } from '@mui/icons-material';
import { TabContext, TabList, TabPanel } from '@mui/lab';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import { DataGrid, GridRowModes } from '@mui/x-data-grid';
import { init } from '../../../../../init';
import axios, { URL as API_BASE_URL } from '../../../../../config/axios';
import PopupTestSelectedFile from '../../../componentsTools/popupTestSelectedFile';
import { InfoFileStyle } from '../../../componentsTools/InfosFileStyle';
import PopupConfirmDelete from '../../../componentsTools/popupConfirmDelete';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import useAuth from '../../../../hooks/useAuth';
import { jwtDecode } from 'jwt-decode';

import { TbPlaylistAdd } from 'react-icons/tb';
import { FaRegPenToSquare, FaFilePdf, FaFileExcel } from 'react-icons/fa6';
import { TfiSave } from 'react-icons/tfi';
import { VscClose } from 'react-icons/vsc';
import { IoMdTrash } from 'react-icons/io';
import usePermission from '../../../../hooks/usePermission';
import { DataGridStyle } from '../../../componentsTools/DatagridToolsStyle';

// Comparator to keep total row at the bottom regardless of sort
const keepTotalBottomComparator = (v1, v2, cellParams1, cellParams2) => {
  const r1 = cellParams1?.row;
  const r2 = cellParams2?.row;
  const isTot1 = !!r1?.isTotal;
  const isTot2 = !!r2?.isTotal;
  if (isTot1 && !isTot2) return 1; // total after normal rows
  if (!isTot1 && isTot2) return -1;
  // fallback compare (string or number)
  if (typeof v1 === 'number' && typeof v2 === 'number') return v1 - v2;
  const s1 = v1 == null ? '' : String(v1);
  const s2 = v2 == null ? '' : String(v2);
  return s1.localeCompare(s2);
};

// Add days to a DATEONLY string (YYYY-MM-DD) in UTC to avoid timezone shifts
const addDaysDateOnly = (dateStr, days) => {
  if (!dateStr) return '';
  const s = String(dateStr).substring(0, 10);
  const [y, m, d] = s.split('-').map(Number);
  if (!y || !m || !d) return s;
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  const yyyy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(dt.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

// Format helpers (display only)
const formatFrDate = (s) => {
  if (!s) return '';
  const d = String(s).substring(0, 10);
  const [y, m, dd] = d.split('-');
  if (!y || !m || !dd) return d;
  return `${dd}/${m}/${y}`;
};

const formatMoneyFr = (n) => {
  const num = Number(n);
  if (!isFinite(num)) return n ?? '';
  try {
    return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
  } catch {
    return String(num.toFixed?.(2) ?? num);
  }
};

function RapprochementsBancaires() {
  const { canAdd, canModify, canDelete, canView } = usePermission();
  let initial = init[0];
  const [fileInfos, setFileInfos] = useState('');
  const [fileId, setFileId] = useState(0);
  const { id } = useParams();
  const [noFile, setNoFile] = useState(false);

  const [selectedExerciceId, setSelectedExerciceId] = useState(0);
  const [selectedPeriodeChoiceId, setSelectedPeriodeChoiceId] = useState(0);
  const [selectedPeriodeId, setSelectedPeriodeId] = useState(0);
  const [listeExercice, setListeExercice] = useState([]);
  const [listeSituation, setListeSituation] = useState([]);

  const [pc512Rows, setPc512Rows] = useState([]);
  const [pcSelected, setPcSelected] = useState(null);

  const [rapproRows, setRapproRows] = useState([]);
  const [pcSelectionModel, setPcSelectionModel] = useState([]);
  const [rapproSelectionModel, setRapproSelectionModel] = useState([]);
  const [rowModesModel, setRowModesModel] = useState({}); // DataGrid row editing
  const [editingRowId, setEditingRowId] = useState(null);
  const [ecrituresRows, setEcrituresRows] = useState([]);
  const [ecrituresSelectionModel, setEcrituresSelectionModel] = useState([]);
  const [ecrituresTotals, setEcrituresTotals] = useState({ debit: 0, credit: 0 });
  // stocke les valeurs de date_fin en cours d'édition (non encore sauvegardées)
  const [pendingDateFin, setPendingDateFin] = useState({}); // { [rowId]: 'YYYY-MM-DD' }
  // stocke les valeurs de solde_bancaire en cours d'édition (non encore sauvegardées)
  const [pendingSoldeBancaire, setPendingSoldeBancaire] = useState({}); // { [rowId]: number }

  // Composition de la sélection des écritures (rapprochées vs non rapprochées)
  const selectedEcrituresInfo = useMemo(() => {
    const ids = Array.isArray(ecrituresSelectionModel) ? ecrituresSelectionModel : [];
    const rows = (Array.isArray(ecrituresRows) ? ecrituresRows : [])
      .filter(r => r && r.id !== 'TOTAL_ROW' && ids.includes(r.id));
    const hasR = rows.some(r => !!r.rapprocher);
    const hasNR = rows.some(r => !r.rapprocher);
    return { hasR, hasNR, count: rows.length };
  }, [ecrituresSelectionModel, ecrituresRows]);

  const { auth } = useAuth();
  const decoded = auth?.accessToken ? jwtDecode(auth.accessToken) : undefined;
  const compteId = decoded?.UserInfo?.compteId || null;
  const navigate = useNavigate();

  const [disableCancelBouton, setDisableCancelBouton] = useState(false);
  const [disableDeleteBouton, setDisableDeleteBouton] = useState(false);
  const [disableSaveBouton, setDisableSaveBouton] = useState(false);
  // delete dialog state
  const [openDialogDeleteRappro, setOpenDialogDeleteRappro] = useState(false);
  const [idToDelete, setIdToDelete] = useState(null);

  // Toolbar intégrée au DataGrid de droite (au-dessus du header)
  const RapproToolbar = () => (
    <Stack direction={"row"} spacing={0.5} alignItems={"center"} justifyContent={"flex-end"} sx={{ px: 0.5, py: 0.5 }}>
      <Tooltip title="Ajouter une ligne">
        <span>
          <IconButton
            onClick={() => handleAdd(false)}
            disabled={!pcSelected || !!editingRowId}
            style={{
              width: "35px", height: '35px', borderRadius: "2px", backgroundColor: initial.theme, textTransform: 'none',
              outline: 'none',
            }}
          >
            <TbPlaylistAdd style={{ width: '25px', height: '25px', color: 'white' }} />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title="Modifier la ligne sélectionnée">
        <span>
          <IconButton
            onClick={handleEdit}
            disabled={rapproSelectionModel.length === 0 || !!editingRowId}
            style={{
              width: "35px", height: '35px', borderRadius: "2px", backgroundColor: initial.theme, textTransform: 'none',
              outline: 'none',
            }}
          >
            <FaRegPenToSquare style={{ width: '25px', height: '25px', color: 'white' }} />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title="Sauvegarder les modifications">
        <span>
          <IconButton
            onClick={handleSave}
            disabled={!editingRowId}
            style={{
              width: "35px", height: '35px', borderRadius: "2px", backgroundColor: initial.theme, textTransform: 'none',
              outline: 'none',
            }}
          >
            <TfiSave style={{ width: '25px', height: '25px', color: 'white' }} />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title="Annuler les modifications">
        <span>
          <IconButton
            onClick={handleCancel}
            disabled={!editingRowId}
            style={{
              width: "35px", height: '35px', borderRadius: "2px", backgroundColor: initial.button_delete_color, textTransform: 'none',
              outline: 'none',
            }}
          >
            <VscClose style={{ width: '25px', height: '25px', color: 'white' }} />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title="Supprimer la ligne sélectionnée">
        <span>
          <IconButton
            onClick={handleDelete}
            disabled={rapproSelectionModel.length === 0 || !!editingRowId}
            style={{
              width: "35px", height: '35px', borderRadius: "2px", backgroundColor: initial.button_delete_color,
              textTransform: 'none',
              outline: 'none',
            }}
          >
            <IoMdTrash style={{ width: '25px', height: '25px', color: 'white' }} />
          </IconButton>
        </span>
      </Tooltip>
    </Stack>
  );

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

  const sendToHome = (value) => {
    setNoFile(!value);
    navigate('/tab/home');
  }

  const handleChangeExercice = (exercice_id) => {
    setSelectedExerciceId(exercice_id);
    setSelectedPeriodeChoiceId("0");
    setListeSituation(listeExercice?.filter((item) => item.id === exercice_id));
    setSelectedPeriodeId(exercice_id);
  }

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
        //toast.error("une erreur est survenue lors de la récupération de la liste des exercices");
        return
      }
    })
  }

  const loadPc512 = async (fid) => {
    try {
      if (fid && compteId) {
        const { data: pcs } = await axios.get('/administration/traitementSaisie/rapprochements/pcs', { params: { fileId: fid, compteId }, timeout: 60000 });
        if (pcs?.state) {
          const list = Array.isArray(pcs.list) ? pcs.list : (pcs.list ? [pcs.list] : []);
          try { console.log('[RAPPRO][PCS][FILTERED]', { fileId: fid, compteId, count: list.length, list }); } catch { }
          // Affichage strict: si vide, on montre vide
          setPc512Rows(list);
          if (list.length === 0) {
            toast('Aucun compte 512 trouvé pour ce dossier', { icon: 'ℹ️' });
          }
          return;
        }
      }
      // Si paramètres manquants ou réponse non state, on vide
      setPc512Rows([]);
    } catch (e) {
      setPc512Rows([]);
      try { console.error('[RAPPRO][PCS][ERROR]', e?.response?.status, e?.response?.data || e); } catch { }
      toast.error('Erreur serveur lors du chargement du plan comptable');
    }
  };

  const getSelectedRappro = () => rapproRows.find(r => r.id === rapproSelectionModel[0]);

  const markEcritures = async (mark) => {
    try {
      const sel = getSelectedRappro();
      if (!sel || !sel.date_fin) { toast.error('Sélectionner une ligne de rapprochement avec date fin'); return; }
      const ids = Array.isArray(ecrituresSelectionModel) ? ecrituresSelectionModel : [];
      if (ids.length === 0) { toast('Sélectionner des écritures', { icon: 'ℹ️' }); return; }
      const dateRapprochement = String(sel.date_fin).substring(0, 10);
      await axios.post('/administration/traitementSaisie/rapprochements/ecritures/mark', {
        ids, fileId, compteId, exerciceId: selectedExerciceId, rapprocher: !!mark, dateRapprochement
      });
      toast.success(mark ? 'Écritures rapprochées' : 'Rapprochement annulé');
      // Recompute soldes first (uses date_fin selection) then reload ecritures
      await recomputeAndUpdateSoldes();
      await loadEcritures();
    } catch (e) {
      toast.error(e?.response?.data?.msg || 'Action rapprochement échouée');
    }
  };

  const recomputeAndUpdateSoldes = async () => {
    try {
      const sel = getSelectedRappro();
      if (!sel || !pcSelected) return;
      const params = {
        fileId,
        compteId,
        exerciceId: selectedExerciceId,
        pcId: pcSelected.id,
        rapproId: sel.id,
        endDate: String(sel.date_fin).substring(0, 10),
        soldeBancaire: sel.solde_bancaire ?? null,
      };
      try { console.debug('[RAPPRO][FRONT][SOLDES][REQUEST]', params); } catch { }
      const { data } = await axios.get('/administration/traitementSaisie/rapprochements/soldes', { params });
      try { console.debug('[RAPPRO][FRONT][SOLDES][RESPONSE]', data); } catch { }
      if (data?.state) {
        const updated = {
          ...sel,
          solde_comptable: Number(data.solde_comptable) || 0,
          solde_non_rapproche: Number(data.solde_non_rapproche) || 0,
        };
        setRapproRows(prev => prev.map(r => r.id === sel.id ? updated : r));
      }
    } catch (e) {
      // ignore toast flood here
    }
  };

  const loadEcritures = async () => {
    try {
      if (!pcSelected || !fileId || !compteId || !selectedExerciceId) { setEcrituresRows([]); return; }
      const selectedR = rapproRows.find(r => r.id === rapproSelectionModel[0]);
      if (!selectedR || !selectedR.date_fin) { setEcrituresRows([]); return; }
      const norm = (s) => (s ? String(s).substring(0, 10) : null);
      const endDate = pendingDateFin[selectedR.id] ? norm(pendingDateFin[selectedR.id]) : norm(selectedR.date_fin);
      const params = { fileId, compteId, exerciceId: selectedExerciceId, pcId: pcSelected.id, compte: pcSelected.compte, endDate };
      const { data } = await axios.get('/administration/traitementSaisie/rapprochements/ecritures', { params, timeout: 60000 });
      const list = Array.isArray(data?.list) ? data.list : (data?.list ? [data.list] : []);
      const rowsAll = list.map(it => ({
        id: it.id,
        dateecriture: it.dateecriture,
        code_journal: it.code_journal,
        compte_ecriture: it.compte_ecriture,
        libelle: it.libelle,
        debit: Number(it.debit) || 0,
        credit: Number(it.credit) || 0,
        piece: it.piece,
        rapprocher: !!it.rapprocher,
        date_rapprochement: norm(it.date_rapprochement),
      }));
      // Filtre strict: afficher non rapprochées OU rapprochées dont la date_rapprochement == date_fin sélectionnée (normalisée)
      const dsel = endDate;
      const rows = rowsAll.filter(r => !r.rapprocher || (r.rapprocher && r.date_rapprochement === dsel));
      // Append totals row for alignment (sum of all displayed rows)
      const totDebitAll = rows.reduce((s, r) => s + (Number(r.debit) || 0), 0);
      const totCreditAll = rows.reduce((s, r) => s + (Number(r.credit) || 0), 0);
      // Summary totals will be computed from selection via effect; default to 0 here
      setEcrituresTotals({ debit: 0, credit: 0 });
      const totalRow = {
        id: 'TOTAL_ROW',
        dateecriture: 'Total',
        code_journal: '',
        compte_ecriture: '',
        libelle: '',
        piece: '',
        debit: totDebitAll,
        credit: totCreditAll,
        rapprocher: null,
        date_rapprochement: null,
        isTotal: true,
      };
      setEcrituresRows([...rows, totalRow]);
    } catch (e) {
      setEcrituresRows([]);
      setEcrituresTotals({ debit: 0, credit: 0 });
      toast.error(e?.response?.data?.msg || 'Erreur lors du chargement des écritures');
    }
  };

  const computeEcart = (rc) => {
    const sc = Number(rc?.solde_comptable) || 0;
    const sb = Number(rc?.solde_bancaire) || 0;
    const snr = Number(rc?.solde_non_rapproche) || 0;
    const raw = sc - sb - snr;
    // Tolérance aux très petites erreurs de flottant (ex: -2.7e-7)
    const epsilon = 0.005; // 0,5 centime
    if (!Number.isFinite(raw)) return 0;
    return Math.abs(raw) < epsilon ? 0 : raw;
  };

  const loadRapprochements = async (pcRow) => {
    if (!pcRow || !fileId || !compteId || !selectedExerciceId) { setRapproRows([]); return; }
    try {
      const params = { fileId, compteId, exerciceId: selectedExerciceId, pcId: pcRow.id };
      const { data } = await axios.get('/administration/traitementSaisie/rapprochements', { params, timeout: 60000 });
      const list = Array.isArray(data?.list) ? data.list : (data?.list ? [data.list] : []);
      const rows = list.map(it => ({
        id: it.id,
        pc_id: pcRow.id,
        date_debut: it.date_debut,
        date_fin: it.date_fin,
        solde_comptable: Number(it.solde_comptable) || 0,
        solde_bancaire: Number(it.solde_bancaire) || 0,
        solde_non_rapproche: Number(it.solde_non_rapproche) || 0,
        ecart: Number(it.ecart != null ? it.ecart : computeEcart(it))
      }));
      setRapproRows(rows);
      return rows;
    } catch (e) {
      setRapproRows([]);
      toast.error(e?.response?.data?.msg || "Erreur lors du chargement des rapprochements");
      return [];
    }
  };

  const handleAdd = async (forceExoStart = false) => {
    // coerce non-boolean (e.g., click event) to false
    const force = typeof forceExoStart === 'boolean' ? forceExoStart : false;
    if (!pcSelected) return toast.error('Sélectionner un compte 512');
    // Date début par défaut
    let defaultDateDebut = '';
    try { console.debug('[RAPPRO][ADD][START]', { forceExoStart: force, rowsCount: rapproRows.length, selectedId: rapproSelectionModel[0], pendingDateFin }); } catch { }
    if (!force && rapproRows.length > 0) {
      // Continuité stricte: prioriser la date_fin de la ligne sélectionnée (même non sauvegardée)
      const selectedId = rapproSelectionModel[0];
      const selectedRow = rapproRows.find(r => r.id === selectedId);
      const selEnd = pendingDateFin[selectedId] || (selectedRow?.date_fin ? String(selectedRow.date_fin).substring(0, 10) : null);
      // Sinon, chercher la dernière date_fin parmi toutes les lignes existantes ou en cours d'édition
      const ends = rapproRows
        .map(r => {
          const rid = r.id;
          const pend = pendingDateFin[rid];
          return pend ? String(pend).substring(0, 10) : (r?.date_fin ? String(r.date_fin).substring(0, 10) : null);
        })
        .filter(Boolean);
      if (ends.length > 0) {
        const base = selEnd || ends.reduce((a, b) => (a > b ? a : b));
        const lastEnd = base;
        try { console.debug('[RAPPRO][ADD][COMPUTE]', { selEnd, ends, base, lastEnd }); } catch { }
        defaultDateDebut = addDaysDateOnly(lastEnd, 1);
      } else {
        // Pas de date_fin encore saisie: laisser vide et informer l'utilisateur
        defaultDateDebut = '';
        toast('Renseignez la date fin de la ligne précédente avant d\'ajouter la suivante', { icon: 'ℹ️' });
      }
    } else {
      // Utiliser début d'exercice uniquement pour la toute première ligne ou si explicitement forcé
      if (force || rapproRows.length === 0) {
        const exo = (listeExercice || []).find(e => e.id === selectedExerciceId);
        if (exo?.date_debut) defaultDateDebut = String(exo.date_debut).substring(0, 10);
      } else {
        // ne pas écraser la continuité par le début d'exo
        defaultDateDebut = defaultDateDebut || '';
      }
    }
    try { console.debug('[RAPPRO][ADD][RESULT]', { defaultDateDebut }); } catch { }
    const idTemp = `new-${Date.now()}`;
    const newRow = {
      id: idTemp,
      pc_id: pcSelected.id,
      date_debut: defaultDateDebut,
      date_fin: '',
      solde_comptable: 0,
      solde_bancaire: 0,
      solde_non_rapproche: 0,
      isNew: true,
    };
    setRapproRows(prev => [...prev, newRow]);
    setRowModesModel(prev => ({ ...prev, [idTemp]: { mode: GridRowModes.Edit } }));
    // sélectionner immédiatement la nouvelle ligne pour que les calculs s'appliquent dessus
    setRapproSelectionModel([idTemp]);
    setEditingRowId(idTemp);
    // Pré-remplir immédiatement les soldes et écritures liées à la nouvelle ligne
    try {
      await recomputeAndUpdateSoldes();
      await loadEcritures();
    } catch { }
  };

  const handleEdit = () => {
    const id = rapproSelectionModel[0];
    if (!id) return toast.error('Sélectionner une ligne');
    setRowModesModel(prev => ({ ...prev, [id]: { mode: GridRowModes.Edit } }));

    setEditingRowId(id);
  };

  const handleDelete = () => {
    const idSel = rapproSelectionModel[0];
    if (!idSel) return toast.error('Sélectionner une ligne');
    setIdToDelete(idSel);
    setOpenDialogDeleteRappro(true);
  };

  const handleConfirmDelete = async (value) => {
    if (!value) { setOpenDialogDeleteRappro(false); return; }
    const idSel = idToDelete;
    try {
      // Récupérer la ligne à supprimer et vérifier contrainte: on ne supprime que la dernière ligne (la plus récente)
      const rowToDelete = rapproRows.find(r => r.id === idSel);
      if (!rowToDelete) return toast.error('Ligne introuvable');
      const finDel = rowToDelete?.date_fin ? String(rowToDelete.date_fin).substring(0, 10) : null;
      const hasLater = rapproRows.some(r => {
        const f = r?.date_fin ? String(r.date_fin).substring(0, 10) : null;
        return r.id !== idSel && f && finDel && f > finDel;
      });
      if (hasLater) {
        return toast.error('Suppression refusée: supprimez d\'abord les lignes suivantes (ordre chronologique)');
      }

      // Supprimer la ligne
      const params = { fileId, compteId, exerciceId: selectedExerciceId };
      await axios.delete(`/administration/traitementSaisie/rapprochements/${idSel}`, { params });
      toast.success('Supprimé');

      // Décocher les écritures rapprochées par cette ligne (date_rapprochement == date_fin supprimée)
      if (pcSelected && finDel) {
        try {
          const listParams = { fileId, compteId, exerciceId: selectedExerciceId, pcId: pcSelected.id, endDate: finDel };
          const { data } = await axios.get('/administration/traitementSaisie/rapprochements/ecritures', { params: listParams, timeout: 60000 });
          const list = Array.isArray(data?.list) ? data.list : (data?.list ? [data.list] : []);
          const idsToUnmark = list.filter(it => !!it.rapprocher && String(it.date_rapprochement).substring(0, 10) === finDel).map(it => it.id);
          if (idsToUnmark.length > 0) {
            await axios.post('/administration/traitementSaisie/rapprochements/ecritures/mark', {
              ids: idsToUnmark,
              fileId,
              compteId,
              exerciceId: selectedExerciceId,
              rapprocher: false,
              dateRapprochement: finDel,
            });
          }
        } catch (e) {
          toast.error('Décoche des écritures partielle');
        }
      }

      // Recharger données et écritures
      await loadRapprochements(pcSelected);
      await recomputeAndUpdateSoldes();
      await loadEcritures();
      setOpenDialogDeleteRappro(false);
      setIdToDelete(null);
    } catch (e) {
      toast.error('Suppression échouée');
      setOpenDialogDeleteRappro(false);
      setIdToDelete(null);
    }
  };
  const handleSave = async () => {
    if (!editingRowId) return toast.error('Aucune ligne en édition');
    // Passer la ligne en mode view pour déclencher processRowUpdate si nécessaire
    setRowModesModel(prev => ({ ...prev, [editingRowId]: { mode: GridRowModes.View } }));
    // attendre un tick puis recharger les données et écritures pour refléter immédiatement les changements
    setTimeout(async () => {
      setEditingRowId(null);
      // nettoyer cache de date_fin en édition pour la ligne sauvegardée
      setPendingDateFin(prev => {
        const cp = { ...prev };
        delete cp[editingRowId];
        return cp;
      });
      if (pcSelected) {
        const rows = await loadRapprochements(pcSelected);
        // rétablir la sélection si possible
        if (Array.isArray(rows) && rows.length > 0) {
          const stillExists = rows.find(r => r.id === editingRowId);
          if (stillExists) setRapproSelectionModel([stillExists.id]);
        }
      }
      await recomputeAndUpdateSoldes();
      await loadEcritures();
    }, 0);
  };

  const handleCancel = () => {
    if (!editingRowId) return;
    const row = rapproRows.find(r => r.id === editingRowId);
    const isNew = row?.isNew;
    setRowModesModel(prev => ({ ...prev, [editingRowId]: { mode: GridRowModes.View, ignoreModifications: true } }));

    if (isNew) {
      setRapproRows(prev => prev.filter(r => r.id !== editingRowId));
    }
    // nettoyer la valeur en cache si annulé
    setPendingDateFin(prev => {
      const cp = { ...prev };
      delete cp[editingRowId];
      return cp;
    });
    setPendingSoldeBancaire(prev => {
      const cp = { ...prev };
      delete cp[editingRowId];
      return cp;
    });
    setEditingRowId(null);
  };

  const pcColumns = useMemo(() => ([
    { field: 'compte', headerName: 'Compte', width: 140 },
    { field: 'libelle', headerName: 'Libellé', flex: 1 },
  ]), []);

  const rapproColumns = useMemo(() => ([
    {
      field: 'date_debut', headerName: 'Date début', width: 100, editable: false,
      valueGetter: (p) => p.row.date_debut ? String(p.row.date_debut).substring(0, 10) : '',
      renderCell: (params) => formatFrDate(params.value),
      getCellClassName: () => 'nonClickable',
    },
    {
      field: 'date_fin', headerName: 'Date fin', width: 150, editable: true,
      valueGetter: (p) => p.row.date_fin ? String(p.row.date_fin).substring(0, 10) : '',
      renderCell: (params) => formatFrDate(params.value),
      renderEditCell: (params) => (
        <TextField
          type="date"
          size="small"
          fullWidth
          value={params.value ? String(params.value).substring(0, 10) : ''}
          onChange={(e) => {
            const val = e.target.value;
            params.api.setEditCellValue({ id: params.id, field: params.field, value: val }, e);
            setPendingDateFin(prev => ({ ...prev, [params.id]: val }));
            setRapproRows(prev => prev.map(r => r.id === params.id ? { ...r, date_fin: val } : r));
          }}
          InputLabelProps={{ shrink: true }}
        />
      )
    },
    {
      field: 'solde_comptable', headerName: 'Solde comptable', width: 160, flex: 1, editable: false, type: 'number', headerAlign: 'right', align: 'right',
      renderCell: (p) => formatMoneyFr(p.value),
      getCellClassName: () => 'nonClickable',
    },
    {
      field: 'solde_bancaire', headerName: 'Solde bancaire', width: 160, flex: 1, editable: true, type: 'number', headerAlign: 'right', align: 'right',
      renderCell: (p) => (
        <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="flex-end" sx={{ width: '100%' }}>
          <Box component="span" sx={{ textAlign: 'right', flexGrow: 1 }}>{formatMoneyFr(p.value)}</Box>
          <Tooltip title="Modifier">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setRowModesModel(prev => ({ ...prev, [p.id]: { mode: GridRowModes.Edit } }));
                setEditingRowId(p.id);
              }}
              sx={{ color: 'error.main' }}
              style={{
                textTransform: 'none',
                outline: 'none',
              }}
            >
              <FaRegPenToSquare style={{
                width: 16, height: 16, textTransform: 'none',
                outline: 'none',
              }} />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
      renderEditCell: (params) => (
        <TextField
          type="number"
          size="small"
          inputProps={{ step: 'any' }}
          value={params.value ?? ''}
          onChange={(e) => {
            const raw = e.target.value;
            params.api.setEditCellValue({ id: params.id, field: params.field, value: raw }, e);
            const normalized = typeof raw === 'string' ? raw.replace(/\s+/g, '').replace(',', '.') : raw;
            const num = Number(normalized);
            if (Number.isFinite(num)) {
              setPendingSoldeBancaire(prev => ({ ...prev, [params.id]: num }));
              setRapproRows(prev => prev.map(r => r.id === params.id ? { ...r, solde_bancaire: num } : r));
            }
          }}
        />
      )
    },
    {
      field: 'solde_non_rapproche', headerName: 'Solde lignes non rapprochées', width: 220, flex: 1, editable: false, type: 'number', headerAlign: 'right', align: 'right',
      renderCell: (p) => formatMoneyFr(p.value),
      getCellClassName: () => 'nonClickable',
    },
    {
      field: 'ecart', headerName: 'Écart', width: 130, flex: 1, headerAlign: 'right', align: 'right',
      valueGetter: (p) => computeEcart(p.row),
      getCellClassName: () => 'nonClickable',
      renderCell: (p) => {
        const raw = Number(p?.value);
        const val = Number.isFinite(raw) ? raw : 0;
        const isZero = Math.abs(val) < 0.005; // même tolérance que computeEcart
        const bg = isZero ? 'success.light' : 'error.light';
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', px: 1, py: 0.25, borderRadius: '999px', bgcolor: bg, color: 'white', fontWeight: 600, width: '100%', boxSizing: 'border-box' }}>
            {formatMoneyFr(val)}
          </Box>
        );
      }
    },
    {
      field: 'export', headerName: 'Export', width: 70, sortable: false, filterable: false,
      renderCell: (params) => {
        const row = params?.row || {};
        const isNew = !row.id || String(row.id).startsWith('new-');
        const disabled = isNew;
        const buildUrl = (type) => {
          const query = new URLSearchParams({
            fileId: fileId || '',
            compteId: compteId || '',
            exerciceId: selectedExerciceId || '',
            pcId: row.pc_id || '',
            rapproId: row.id || '',
          }).toString();
          return `${API_BASE_URL}/administration/traitementSaisie/rapprochements/export/${type}?${query}`;
        };
        return (
          <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="center" sx={{ width: '100%' }}>
            <Tooltip title="Exporter en PDF">
              <span>
                <IconButton
                  size="small"
                  disabled={disabled}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (disabled) return;
                    window.open(buildUrl('pdf'), '_blank');
                  }}
                  style={{
                    textTransform: 'none',
                    outline: 'none',
                  }}
                >
                  <FaFilePdf style={{ width: 18, height: 18, color: '#d32f2f' }} />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Exporter en Excel">
              <span>
                <IconButton
                  size="small"
                  disabled={disabled}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (disabled) return;
                    window.open(buildUrl('excel'), '_blank');
                  }}
                  style={{
                    textTransform: 'none',
                    outline: 'none',
                  }}
                >
                  <FaFileExcel style={{ width: 18, height: 18, color: '#2e7d32' }} />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
        );
      }
    },
  ]), []);

  const processRowUpdate = async (newRow, oldRow) => {
    try {
      const payload = {
        fileId,
        compteId,
        exerciceId: selectedExerciceId,
        pcId: pcSelected?.id || newRow.pc_id,
        date_debut: newRow.date_debut,
        date_fin: newRow.date_fin,
        solde_comptable: Number(newRow.solde_comptable) || 0,
        solde_bancaire: Number(newRow.solde_bancaire) || 0,
        solde_non_rapproche: Number(newRow.solde_non_rapproche) || 0,
      };
      if (newRow.isNew) {
        const { data } = await axios.post('/administration/traitementSaisie/rapprochements', payload);
        toast.success('Ajouté');
        const persistedId = data?.id || data?.insertId || null;
        const updated = { ...newRow, id: persistedId || newRow.id, isNew: false };
        setRapproRows(prev => prev.map(r => (r.id === newRow.id ? updated : r)));
        // sélectionner la ligne et rafraîchir immédiatement les données dépendantes
        setRapproSelectionModel([updated.id]);
        await recomputeAndUpdateSoldes();
        await loadEcritures();
        return updated;
      } else {
        await axios.put(`/administration/traitementSaisie/rapprochements/${newRow.id}`, payload);
        toast.success('Modifié');
        // s'assurer que l'état reflète la dernière version (au cas où des champs dérivés existent)
        setRapproRows(prev => prev.map(r => (r.id === newRow.id ? { ...r, ...newRow } : r)));
        setRapproSelectionModel([newRow.id]);
        await recomputeAndUpdateSoldes();
        await loadEcritures();
        return newRow;
      }
    } catch (e) {
      toast.error(e?.response?.data?.msg || 'Enregistrement échoué');
      return oldRow;
    }
  };

  const handleRowModesModelChange = (newModel) => {
    setRowModesModel(newModel);
  };


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

  const handleChangeDateIntervalle = (id) => {
    setSelectedPeriodeId(id);
  }

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

  useEffect(() => {
    if (fileId) loadPc512(fileId);
  }, [fileId]);

  useEffect(() => {
    (async () => {
      if (!pcSelected) return;
      // reset selection models on PC change
      setRapproSelectionModel([]);
      setEcrituresRows([]);
      // clear any editing state so actions (Ajouter) are enabled for the new compte
      setEditingRowId(null);
      setRowModesModel({});
      const rows = await loadRapprochements(pcSelected);
      if (Array.isArray(rows) && rows.length === 0) {
        // aucune ligne: ouvrir une ligne d'insertion inline
        handleAdd(true);
      }
    })();
  }, [pcSelected, fileId, compteId, selectedExerciceId]);

  // Charger les écritures selon sélection (pc + période fin sélectionnée ou fin d'exercice)
  useEffect(() => {
    loadEcritures();
  }, [pcSelected, selectedExerciceId, rapproSelectionModel, rapproRows]);

  // Recompute soldes when the selected rapprochement changes (to update solde_non_rapproche etc.)
  useEffect(() => {
    recomputeAndUpdateSoldes();
  }, [rapproSelectionModel]);

  // Totaux Ecritures: somme des lignes sélectionnées uniquement
  useEffect(() => {
    // Si aucun rapprochement sélectionné, ou aucune écriture sélectionnée -> 0
    if (!rapproSelectionModel || rapproSelectionModel.length === 0) {
      setEcrituresTotals({ debit: 0, credit: 0 });
      return;
    }
    const ids = Array.isArray(ecrituresSelectionModel) ? ecrituresSelectionModel : [];
    if (ids.length === 0) {
      setEcrituresTotals({ debit: 0, credit: 0 });
      return;
    }
    // Construire un set pour lookup rapide et éviter TOTAL_ROW
    const selSet = new Set(ids);
    const rowsMap = Array.isArray(ecrituresRows) ? ecrituresRows : [];
    let debit = 0, credit = 0;
    for (const r of rowsMap) {
      if (!r || r.id === 'TOTAL_ROW') continue;
      if (selSet.has(r.id)) {
        debit += Number(r.debit) || 0;
        credit += Number(r.credit) || 0;
      }
    }
    setEcrituresTotals({ debit, credit });
  }, [ecrituresSelectionModel, ecrituresRows, rapproSelectionModel]);

  // Réinitialiser sélections quand l'exercice change
  useEffect(() => {
    if (!fileId || !selectedExerciceId) return;
    // reset selections
    setPcSelected(null);
    setPcSelectionModel([]);
    setRapproRows([]);
    // reset totals when exercice changes
    setEcrituresTotals({ debit: 0, credit: 0 });
  }, [selectedExerciceId]);


  return (
    <Box>
      {noFile ? <PopupTestSelectedFile confirmationState={sendToHome} /> : null}
      {openDialogDeleteRappro ? (
        <PopupConfirmDelete
          msg={"Voulez-vous vraiment supprimer cette ligne de rapprochement ?"}
          confirmationState={handleConfirmDelete}
        />
      ) : null}
      <TabContext value={"1"}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <TabList aria-label="lab API tabs example">
            <Tab
              style={{ textTransform: 'none', outline: 'none', border: 'none', margin: -5 }}
              label={InfoFileStyle(fileInfos?.dossier)} value="1"
            />
          </TabList>
        </Box>
        <TabPanel value="1" style={{ height: '100%' }}>
          <Stack width={"100%"} height={"100%"} spacing={3}>
            <Typography variant='h6' sx={{ color: "black" }} align='left'>Administration - Rapprochements bancaires</Typography>

            <Stack width={"100%"} spacing={4} alignItems={"center"} justifyContent="space-between" direction={"row"}>
              <Stack direction={"row"}>
                <FormControl variant="standard" sx={{ m: 1, minWidth: 250 }}>
                  <InputLabel>Exercice:</InputLabel>
                  <Select
                    value={selectedExerciceId}
                    onChange={(e) => handleChangeExercice(e.target.value)}
                    sx={{ width: "300px", display: "flex", justifyContent: "left", alignItems: "flex-start", alignContent: "flex-start", textAlign: "left" }}
                    MenuProps={{ disableScrollLock: true }}
                  >
                    {listeExercice.map((option) => {
                      const d1 = option?.date_debut ? String(option.date_debut).substring(0, 10) : '';
                      const d2 = option?.date_fin ? String(option.date_fin).substring(0, 10) : '';
                      const toFr = (s) => s ? `${s.substring(8, 10)}/${s.substring(5, 7)}/${s.substring(0, 4)}` : '';
                      return (
                        <MenuItem key={option.id} value={option.id}>{option.libelle_rang}: {toFr(d1)} - {toFr(d2)}</MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>

                <FormControl variant="standard" sx={{ m: 1, minWidth: 150 }}>
                  <InputLabel>Période</InputLabel>
                  <Select
                    disabled
                    value={selectedPeriodeChoiceId}
                    onChange={(e) => handleChangePeriode(e.target.value)}
                    sx={{ width: "150px", display: "flex", justifyContent: "left", alignItems: "flex-start", alignContent: "flex-start", textAlign: "left" }}
                    MenuProps={{ disableScrollLock: true }}
                  >
                    <MenuItem value={0}>Toutes</MenuItem>
                    <MenuItem value={1}>Situations</MenuItem>
                  </Select>
                </FormControl>

                <FormControl variant="standard" sx={{ m: 1, minWidth: 250 }}>
                  <InputLabel>Du</InputLabel>
                  <Select
                    value={selectedPeriodeId}
                    onChange={(e) => handleChangeDateIntervalle(e.target.value)}
                    sx={{ width: "300px", display: "flex", justifyContent: "left", alignItems: "flex-start", alignContent: "flex-start", textAlign: "left" }}
                    MenuProps={{ disableScrollLock: true }}
                  >
                    {listeSituation?.map((option) => {
                      const d1 = option?.date_debut ? String(option.date_debut).substring(0, 10) : '';
                      const d2 = option?.date_fin ? String(option.date_fin).substring(0, 10) : '';
                      const toFr = (s) => s ? `${s.substring(8, 10)}/${s.substring(5, 7)}/${s.substring(0, 4)}` : '';
                      return (
                        <MenuItem key={option.id} value={option.id}>{option.libelle_rang}: {toFr(d1)} - {toFr(d2)}</MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>
              </Stack>
            </Stack>

            <Stack direction="row" spacing={2} alignItems="stretch" sx={{ width: '100%', height: '60vh' }}>

              {/* --- COLONNE GAUCHE : LISTE DES COMPTES --- */}
              <Box sx={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column' }}>

                {/* HEADER ALIGNÉ */}
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  sx={{ mb: 0, minHeight: 48 }}
                >
                  <Typography variant="subtitle1">Liste des comptes</Typography>
                </Stack>

                <DataGrid
                  disableMultipleSelection={DataGridStyle.disableMultipleSelection}
                  disableColumnSelector={DataGridStyle.disableColumnSelector}
                  disableDensitySelector={DataGridStyle.disableDensitySelector}
                  disableRowSelectionOnClick
                  disableSelectionOnClick={true}
                  rows={pc512Rows}
                  columns={pcColumns}
                  disableColumnMenu
                  density="compact"
                  pageSizeOptions={[10, 25, 50]}
                  checkboxSelection
                  sx={{
                    ...DataGridStyle.sx,
                    flex: 1,
                    '& .MuiDataGrid-columnHeaders': { backgroundColor: initial.theme, color: '#fff' },
                    '& .nonClickable': { pointerEvents: 'none', color: 'text.disabled' },
                    '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': {
                      outline: 'none',
                      border: 'none',
                    }
                  }}
                  onRowClick={(params) => {
                    const idRow = params.id;
                    setPcSelectionModel([idRow]);
                    const row = pc512Rows.find(r => r.id === idRow);
                    setPcSelected(row || null);
                  }}
                  onRowSelectionModelChange={(m) => {
                    const single = Array.isArray(m) && m.length > 0 ? [m[m.length - 1]] : [];
                    setPcSelectionModel(single);
                    const idRow = single[0];
                    const row = pc512Rows.find(r => r.id === idRow);
                    setPcSelected(row || null);
                  }}
                  rowSelectionModel={pcSelectionModel}
                />

              </Box>

              {/* --- COLONNE DROITE : RAPPROCHEMENTS --- */}
              <Box sx={{ flex: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>

                {/* HEADER ALIGNÉ */}
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  sx={{ mb: 0, minHeight: 48 }}
                >
                  <Typography variant="subtitle1">Rapprochements</Typography>
                  <RapproToolbar />
                </Stack>

                <DataGrid
                  disableMultipleSelection={DataGridStyle.disableMultipleSelection}
                  disableColumnSelector={DataGridStyle.disableColumnSelector}
                  disableDensitySelector={DataGridStyle.disableDensitySelector}
                  disableRowSelectionOnClick
                  disableSelectionOnClick={true}
                  rows={rapproRows.map(r => {
                    const sb = (pendingSoldeBancaire[r.id] != null ? Number(pendingSoldeBancaire[r.id]) : r.solde_bancaire);
                    const df = (pendingDateFin[r.id] != null ? pendingDateFin[r.id] : r.date_fin);
                    const rr = { ...r, solde_bancaire: sb, date_fin: df };
                    return { ...rr, ecart: computeEcart(rr) };
                  })}
                  columns={rapproColumns}
                  disableColumnMenu
                  density="compact"
                  pageSizeOptions={[10, 25, 50]}
                  checkboxSelection
                  sx={{
                    ...DataGridStyle.sx,
                    flex: 1,
                    '& .MuiDataGrid-columnHeaders': { backgroundColor: initial.theme, color: '#fff' },
                    '& .MuiDataGrid-cell.nonClickable, & .nonClickable': {
                      pointerEvents: 'none',
                      backgroundColor: '#f0f0f0',
                      color: '#9e9e9e',
                    },
                    '& .MuiDataGrid-cell.nonClickable:hover, & .nonClickable:hover': {
                      backgroundColor: '#e6e6e6',
                    },
                    '& .MuiDataGrid-row.Mui-selected .MuiDataGrid-cell.nonClickable, & .MuiDataGrid-row.Mui-selected .nonClickable': {
                      backgroundColor: '#f0f0f0',
                      color: '#9e9e9e',
                    },
                    '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': {
                      outline: 'none',
                      border: 'none',
                    }
                  }}
                  onRowSelectionModelChange={(m) => {
                    const single = Array.isArray(m) && m.length > 0 ? [m[m.length - 1]] : [];
                    setRapproSelectionModel(single);
                  }}
                  rowSelectionModel={rapproSelectionModel}
                  editMode="row"
                  rowModesModel={rowModesModel}
                  onRowModesModelChange={handleRowModesModelChange}
                  isCellEditable={(params) => params.field === 'date_fin' || params.field === 'solde_bancaire'}
                  processRowUpdate={processRowUpdate}
                  experimentalFeatures={{ newEditingApi: true }}
                />

              </Box>

            </Stack>


            <Box sx={{ mt: 10 }}>
              <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>Ecritures</Typography>
              <DataGrid
                disableMultipleSelection={DataGridStyle.disableMultipleSelection}
                disableColumnSelector={DataGridStyle.disableColumnSelector}
                disableDensitySelector={DataGridStyle.disableDensitySelector}
                disableRowSelectionOnClick
                disableSelectionOnClick={true}
                rows={ecrituresRows}
                columns={[
                  { field: 'dateecriture', headerName: 'Date écriture', width: 140, valueGetter: (p) => p.row.dateecriture ? String(p.row.dateecriture).substring(0, 10) : '', renderCell: (p) => formatFrDate(p.value), sortComparator: keepTotalBottomComparator },
                  { field: 'code_journal', headerName: 'Code journal', width: 140, sortComparator: keepTotalBottomComparator },
                  { field: 'compte_ecriture', headerName: 'Compte', width: 140, sortComparator: keepTotalBottomComparator },
                  { field: 'libelle', headerName: 'Libellé', flex: 1, renderCell: (p) => p.row.isTotal ? <strong>{p.value}</strong> : p.value, sortComparator: keepTotalBottomComparator },
                  { field: 'piece', headerName: 'Pièce', width: 140, sortComparator: keepTotalBottomComparator },
                  { field: 'debit', headerName: 'Débit', width: 120, type: 'number', headerAlign: 'right', align: 'right', renderCell: (p) => p.row.isTotal ? <strong>{formatMoneyFr(p.value)}</strong> : formatMoneyFr(p.value), sortComparator: keepTotalBottomComparator },
                  { field: 'credit', headerName: 'Crédit', width: 120, type: 'number', headerAlign: 'right', align: 'right', renderCell: (p) => p.row.isTotal ? <strong>{formatMoneyFr(p.value)}</strong> : formatMoneyFr(p.value), sortComparator: keepTotalBottomComparator },
                  {
                    field: 'rapprocher', headerName: 'Rapproché', width: 120, sortable: true, sortComparator: keepTotalBottomComparator,
                    renderCell: (p) => (
                      p.row.isTotal ? null : (
                        <Checkbox
                          checked={!!p.row.rapprocher}
                          disabled
                          icon={<Close sx={{ color: 'error.main' }} />}
                          checkedIcon={<CheckCircle sx={{ color: 'success.main' }} />}
                        />
                      )
                    )
                  },
                  { field: 'date_rapprochement', headerName: 'Date rappro.', width: 140, valueGetter: (p) => p.row.date_rapprochement ? String(p.row.date_rapprochement).substring(0, 10) : '', renderCell: (p) => formatFrDate(p.value), sortComparator: keepTotalBottomComparator },
                ]}
                disableColumnMenu
                density="compact"
                pageSizeOptions={[10, 25, 50]}
                autoHeight
                sx={{
                  ...DataGridStyle.sx,
                  flex: 1,
                  '& .MuiDataGrid-columnHeaders': { backgroundColor: initial.theme, color: '#fff' },
                  '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': {
                    outline: 'none',
                    border: 'none',
                  }
                }}
                checkboxSelection
                isRowSelectable={(params) => !params.row?.isTotal}
                rowSelectionModel={ecrituresSelectionModel}
                onRowSelectionModelChange={(m) => setEcrituresSelectionModel(m)}
                slots={{
                  toolbar: () => (
                    <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" sx={{ px: 1, py: 0.5 }}>
                      <Stack direction="row" spacing={3} alignItems="center">
                        <Typography variant="body2">Débit: <strong>{formatMoneyFr(ecrituresTotals.debit)}</strong></Typography>
                        <Typography variant="body2">Crédit: <strong>{formatMoneyFr(ecrituresTotals.credit)}</strong></Typography>
                        <Typography variant="body2">Solde: <strong>{formatMoneyFr((Number(ecrituresTotals.debit) || 0) - (Number(ecrituresTotals.credit) || 0))}</strong></Typography>
                      </Stack>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => markEcritures(true)}
                          disabled={
                            rapproSelectionModel.length === 0 ||
                            selectedEcrituresInfo.count === 0 ||
                            selectedEcrituresInfo.hasR ||
                            (selectedEcrituresInfo.hasR && selectedEcrituresInfo.hasNR)
                          }
                          style={{
                            textTransform: 'none',
                            outline: 'none',
                          }}
                          sx={{ backgroundColor: 'success.main', '&:hover': { backgroundColor: 'success.dark' }, textTransform: 'none' }}
                        >
                          Rapprocher
                        </Button>
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => markEcritures(false)}
                          disabled={
                            rapproSelectionModel.length === 0 ||
                            selectedEcrituresInfo.count === 0 ||
                            selectedEcrituresInfo.hasNR ||
                            (selectedEcrituresInfo.hasR && selectedEcrituresInfo.hasNR)
                          }
                          style={{
                            textTransform: 'none',
                            outline: 'none',
                          }}
                          sx={{ backgroundColor: 'error.main', '&:hover': { backgroundColor: 'error.dark' }, textTransform: 'none' }}
                        >
                          Annuler rapprochement
                        </Button>
                      </Stack>
                    </Stack>
                  )
                }}
              />
            </Box>
          </Stack>
        </TabPanel>
      </TabContext>
    </Box>
  )
}

export default RapprochementsBancaires;

