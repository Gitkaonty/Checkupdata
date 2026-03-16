import { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Typography, Stack, FormControl, InputLabel, Select, MenuItem, Tooltip, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Button, RadioGroup, FormControlLabel, Radio, tooltipClasses } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { GoAlert } from "react-icons/go";
import { DataGrid } from '@mui/x-data-grid';
import { TabContext, TabList, TabPanel } from '@mui/lab';
import { Tab } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import axios from '../../../../../config/axios';
import toast from 'react-hot-toast';
import useAuth from '../../../../hooks/useAuth';
import { jwtDecode } from 'jwt-decode';
import PopupTestSelectedFile from '../../../componentsTools/popupTestSelectedFile';
import { InfoFileStyle } from '../../../componentsTools/InfosFileStyle';
import { init } from '../../../../../init';
import { TbPlaylistAdd } from "react-icons/tb";
import { FaRegPenToSquare } from "react-icons/fa6";
import { IoMdTrash } from "react-icons/io";
import { TbFileImport } from "react-icons/tb";
import { useCallback } from 'react';
import DetailsImmoDialog from './DetailsImmoDialog';
import { GoLink } from "react-icons/go";
import PopupActionConfirmWithCheckbox from '../../../componentsTools/popupActionConfirmWithCheckbox';
import PopupConfirmDelete from '../../../componentsTools/popupConfirmDelete';
import PopupImportImmobilisations from '../import/PopupImportImmobilisations';
import { DataGridStyle } from '../../../componentsTools/DatagridToolsStyle';
import { styled } from "@mui/material/styles";
import CancelIcon from '@mui/icons-material/Cancel';

const WhiteTooltip = styled(({ className, ...props }) => (
  <Tooltip {...props} arrow classes={{ popper: className }} />
))(() => ({
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: "#fff",
    color: "#000",
    fontSize: 14,
    boxShadow: "0px 6px 24px rgba(0,0,0,0.15)",
    borderRadius: 10,
    maxWidth: "none"
  },
  [`& .${tooltipClasses.arrow}`]: {
    color: "#fff",
  },
}));

function formatDate(dateValue) {
  if (!dateValue) return '';

  const date = new Date(dateValue);

  if (isNaN(date)) return '';

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

const keepTotalBottomComparator = (v1, v2, cellParams1, cellParams2) => {
  const r1 = cellParams1?.row;
  const r2 = cellParams2?.row;
  const isTot1 = !!r1?.isTotal;
  const isTot2 = !!r2?.isTotal;
  if (isTot1 && !isTot2) return 1;
  if (!isTot1 && isTot2) return -1;
  if (typeof v1 === 'number' && typeof v2 === 'number') return v1 - v2;
  const s1 = v1 == null ? '' : String(v1);
  const s2 = v2 == null ? '' : String(v2);
  return s1.localeCompare(s2);
};

// Example rule: add '8' after first digit and drop last digit
// 20100 -> 28100
// 2120000 -> 2812000
const deriveCompteAmort = (compte) => {
  if (!compte) return '';
  const s = String(compte);
  if (s.length < 3) return s; // need at least 3 to drop last
  return s[0] + '8' + s.substring(1, s.length - 1);
};

const normalizeNoAccent = (s) => String(s || '')
  .normalize('NFD')
  .replace(/\p{Diacritic}/gu, '')
  .toLowerCase();

const formatMoneyFr = (n) => {
  const num = Number(n);
  if (!isFinite(num)) return n ?? '';
  try {
    return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
  } catch {
    return String(num.toFixed?.(2) ?? num);
  }
};

const Immobilisations = () => {
  const { id } = useParams(); // id dossier
  const initial = init[0];
  const navigate = useNavigate();
  const { auth } = useAuth();
  const compteId = auth?.accessToken ? (jwtDecode(auth.accessToken)?.UserInfo?.compteId || null) : null;

  const [filtrageCompte, setFiltrageCompte] = useState('0');

  const [openConfirmGenerateEcritures, setOpenConfirmGenerateEcritures] = useState(false);
  const [openConfirmCancelEcritures, setOpenConfirmCancelEcritures] = useState(false);
  const [openConfirmDelete, setOpenConfirmDelete] = useState(false);
  const [openImportDialog, setOpenImportDialog] = useState(false);

  const [loadingEcritures, setLoadingEcritures] = useState(false);

  const [fileInfos, setFileInfos] = useState('');
  const [noFile, setNoFile] = useState(false);

  const [selectedExerciceId, setSelectedExerciceId] = useState(0);
  const [selectedPeriodeChoiceId, setSelectedPeriodeChoiceId] = useState(0);
  const [selectedPeriodeId, setSelectedPeriodeId] = useState(0);
  const [listeExercice, setListeExercice] = useState([]);
  const [listeSituation, setListeSituation] = useState([]);

  const [rows, setRows] = useState([]);
  const [selectionModel, setSelectionModel] = useState([]);
  const [loading, setLoading] = useState(false);
  const [journalLinkData, setJournalLinkData] = useState({});
  const journalLinkDataRef = useRef(journalLinkData);
  const [preselectedJournal, setPreselectedJournal] = useState(null);

  const [detailsRows, setDetailsRows] = useState([]);
  const [detailsSelectionModel, setDetailsSelectionModel] = useState([]);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [detailsDialogMode, setDetailsDialogMode] = useState('add');
  const [detailsForm, setDetailsForm] = useState({});
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [lienDialogOpen, setLienDialogOpen] = useState(false);
  const [journalRows, setJournalRows] = useState([]);
  const [journalLoading, setJournalLoading] = useState(false);
  const [journalSelection, setJournalSelection] = useState([]);

  const [ligneRowsComp, setLigneRowsComp] = useState([]);
  const [ligneRowsFisc, setLigneRowsFisc] = useState([]);
  const [ligneLoading, setLigneLoading] = useState(false);
  const [ligneTab, setLigneTab] = useState('comp');
  const [isCompDegTab, setIsCompDegTab] = useState(false);
  const [isFiscDegTab, setIsFiscDegTab] = useState(false);

  // Helper to extract a safe message from Axios/unknown errors
  const getErrMsg = (e) => {
    try {
      return (
        e?.response?.data?.msg ||
        e?.response?.data?.message ||
        e?.message ||
        'Erreur inattendue'
      );
    } catch {
      return 'Erreur inattendue';
    }
  };

  const fetchJournalLink = useCallback(async (id) => {
    if (journalLinkDataRef.current[id]) return;

    try {
      const res = await axios.post('/administration/traitementSaisie/getJournalsAvecImmo', { id });
      if (res.data?.length > 0) {
        setJournalLinkData(prev => ({
          ...prev,
          [id]: res.data[0]
        }));
      }
    } catch (e) {
      console.error("Erreur chargement lien écriture", e);
    }
  }, []);

  const getLienEcriture = async () => {
    setJournalRows([]);
    // Preselect previously linked entry if any
    const preSel = detailsForm?.lien_ecriture_id ? [detailsForm.lien_ecriture_id] : [];
    setJournalSelection(preSel);

    const fid = Number(id) || 0; const exoId = Number(selectedExerciceId) || 0;
    const selectedPcId = Array.isArray(selectedPcIds) && selectedPcIds.length > 0 ? selectedPcIds[0] : null;
    // Backend attend id_numcpt = id de dossierplancomptables (FK), pas le numéro de compte
    const idNumcpt = Number(detailsForm?.pc_id ?? selectedPcId ?? 0);
    if (!idNumcpt) {
      // toast("Aucun PC sélectionné (id_numcpt manquant)", { icon: 'ℹ️' });
      setJournalLoading(false);
      // setLienDialogOpen(true);
      return;
    }
    // setPreselectedJournal(null);

    const { data } = await axios.get('/paramTva/journals/byCompte', {
      params: { id_numcpt: idNumcpt, id_dossier: fid, id_exercice: exoId }, timeout: 60000,
    });

    let list = Array.isArray(data?.list) ? data.list : [];

    if (detailsForm?.lien_ecriture_id) {
      const journalAlready = list.find(j => j.id === detailsForm.lien_ecriture_id);
      if (journalAlready) setPreselectedJournal(journalAlready);
    }

    // Fallback: si vide, charger via selectionLigne et filtrer par compte
    if (!list.length) {
      try {
        const sel = await axios.get(`/declaration/tva/selectionLigne/${compteId}/${fid}/${exoId}`, { timeout: 60000 });
        const allRows = Array.isArray(sel?.data?.list) ? sel.data.list : [];
        list = allRows.filter(r => Number(r?.id_numcpt || 0) === idNumcpt);
      } catch { }
    }

    const filteredList = list.filter(journal => {
      const libre = !journal.id_immob;
      const dejaSelectionne = Number(journal.id) === Number(detailsForm?.lien_ecriture_id);
      const preselected = Number(preselectedJournal?.id) === Number(journal.id);
      return libre || dejaSelectionne || preselected;
    });

    setJournalRows(filteredList);
  }

  // Popup secondaire: sélection du lien écriture
  const handleOpenLienEcriture = async () => {
    try {
      setJournalLoading(true);
      if (detailsForm?.lien_ecriture_id) {
        setJournalSelection([detailsForm.lien_ecriture_id]);
      }

    } catch (e) {
      setJournalRows([]);
      toast.error(`Impossible de charger le journal pour ce compte: ${getErrMsg(e)}`);
    } finally {
      setJournalLoading(false);
      setLienDialogOpen(true);
    }
  };

  const handleConfirmLienEcriture = () => {
    const selectedId = Array.isArray(journalSelection) && journalSelection.length > 0 ? journalSelection[journalSelection.length - 1] : null;
    if (!selectedId) { toast('Sélectionnez une ligne de journal', { icon: 'ℹ️' }); return; }
    setDetailsForm((prev) => ({ ...prev, lien_ecriture_id: selectedId }));
    setLienDialogOpen(false);
  };

  // helper to get selected PC ids (top grid)
  const selectedPcIds = useMemo(() => (Array.isArray(selectionModel) ? selectionModel : []), [selectionModel]);

  const hasCompData = useMemo(() => {
    return Array.isArray(ligneRowsComp) && ligneRowsComp.length > 0;
  }, [ligneRowsComp]);
  const hasFiscData = useMemo(() => {
    return Array.isArray(ligneRowsFisc) && ligneRowsFisc.length > 0;
  }, [ligneRowsFisc]);

  // Fetch details_immo from backend and filter by selected PCs
  const fetchDetails = useCallback(async () => {
    if (!id || !compteId || !selectedExerciceId) {
      setDetailsRows([]);
      return;
    }
    const onePcId = Array.isArray(selectedPcIds) && selectedPcIds.length > 0 ? Number(selectedPcIds[0]) : null;
    const { data } = await axios.get('/administration/traitementSaisie/immobilisations/details', {
      params: { fileId: id, compteId: compteId, exerciceId: selectedExerciceId, pcId: onePcId || undefined }, timeout: 60000,
    });

    const list = Array.isArray(data?.list) ? data.list : [];
    const sel = selectedPcIds;
    // const filtered = sel && sel.length > 0 ? list.filter(d => sel.includes(d.pc_id)) : list;
    const filtered = list; // Temporaire : afficher toutes les immobilisations sans filtrage
    setDetailsRows(filtered);
  }, [id, compteId, selectedExerciceId, selectedPcIds]);

  const rowsFiltered = useMemo(() => {
    if (!Array.isArray(rows) || rows.length === 0) return [];

    return rows.filter((row) => {
      switch (filtrageCompte) {
        case "0":
          return true;
        case "1":
          return row.mvtdebit !== 0 || row.mvtcredit !== 0;
        default:
          return true;
      }
    });
  }, [rows, filtrageCompte]);


  const rowsWithTotal = useMemo(() => {
    if (!rowsFiltered || rowsFiltered.length === 0) return [];

    const totalSolde = rowsFiltered.reduce((s, r) => s + (Number(r.solde) || 0), 0);
    const totalAmortAnt = rowsFiltered.reduce((s, r) => s + (Number(r.amort_ant) || 0), 0);
    const totalDotation = rowsFiltered.reduce((s, r) => s + (Number(r.dotation) || 0), 0);
    const totalValeurNette = rowsFiltered.reduce((s, r) => s + (Number(r.valeur_nette) || 0), 0);
    const totalVncImmo = rowsFiltered.reduce((s, r) => s + (Number(r.vnc_immo) || 0), 0);

    const totalRow = {
      id: 'total-row',
      isTotal: true,
      compte: 'Total',
      libelle: '',
      compte_amort: '',
      solde: totalSolde,
      amort_ant: totalAmortAnt,
      dotation: totalDotation,
      valeur_nette: totalValeurNette,
      vnc_immo: totalVncImmo,
    };

    return [...rowsFiltered, totalRow];
  }, [rowsFiltered]);

  const detailRowsWithTotal = useMemo(() => {
    if (!detailsRows || detailsRows.length === 0) return [];
    const detailRowsFiltered = detailsRows.filter(val => val.id_exercice === Number(selectedExerciceId));

    const totalDureeAmort = detailRowsFiltered.reduce((s, r) => s + (Number(r.duree_amort_mois) || 0), 0);
    const totalMontant = detailRowsFiltered.reduce((s, r) => s + (Number(r.montant) || 0), 0);
    const totalTauxTva = detailRowsFiltered.reduce((s, r) => s + (Number(r.taux_tva) || 0), 0);
    const totalMontantTva = detailRowsFiltered.reduce((s, r) => s + (Number(r.montant_tva) || 0), 0);
    const totalAmortAvantReprise = detailRowsFiltered.reduce((s, r) => s + (Number(r.amort_avant_reprise) || 0), 0);
    const totalMontanntHt = detailRowsFiltered.reduce((s, r) => s + (Number(r.montant_ht) || 0), 0);
    const totalAmortAnt = detailRowsFiltered.reduce((s, r) => s + (Number(r.amort_ant_comp) || 0), 0);
    const totalDotationPeriode = detailRowsFiltered.reduce((s, r) => s + (Number(r.dotation_periode_comp) || 0), 0);
    const totalAmortExc = detailRowsFiltered.reduce((s, r) => s + (Number(r.amort_exceptionnel_comp) || 0), 0);
    const totalTotalAmort = detailRowsFiltered.reduce((s, r) => s + (Number(r.total_amortissement_comp) || 0), 0);
    const totalDerog = detailRowsFiltered.reduce((s, r) => s + (Number(r.derogatoire_comp) || 0), 0);
    const totalVnc = detailRowsFiltered.reduce((s, r) => s + (Number(r.vnc) || 0), 0);
    const totalPrixVente = detailRowsFiltered.reduce((s, r) => s + (Number(r.prix_vente) || 0), 0);

    const totalRow = {
      id: 'total-row',
      isTotal: true,
      code: 'Total',
      reprise_immobilisation_comp: '',
      intitule: '',
      lien_ecriture_id: '',
      fournisseur: '',
      date_acquisition: '',
      date_mise_service: '',
      etat: '',
      duree_amort_mois: totalDureeAmort,
      type_amort: '',
      montant: totalMontant,
      taux_tva: totalTauxTva,
      montant_tva: totalMontantTva,
      amort_avant_reprise: totalAmortAvantReprise,
      montant_ht: totalMontanntHt,
      amort_ant_comp: totalAmortAnt,
      dotation_periode_comp: totalDotationPeriode,
      amort_exceptionnel_comp: totalAmortExc,
      total_amortissement_comp: totalTotalAmort,
      compte_amortissement: '',
      derogatoire_comp: totalDerog,
      vnc: totalVnc,
      date_sortie: '',
      prix_vente: totalPrixVente
    }
    return [...detailsRows, totalRow];
  }, [detailsRows])



  const columns = useMemo(() => ([
    { field: 'compte', headerName: 'N° de compte', width: 140, sortComparator: keepTotalBottomComparator },
    { field: 'libelle', headerName: 'Libellé', flex: 1, sortComparator: keepTotalBottomComparator },
    {
      field: 'compte_amort',
      headerName: 'Compte amort',
      width: 160,
      sortComparator: keepTotalBottomComparator,
      headerAlign: 'right',
      align: 'right',
      renderCell: (params) => {
        // Ne pas afficher d’icône dans la ligne Total
        if (params.row?.isTotal) {
          return (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
              <Typography variant="body2">{params.value || ''}</Typography>
            </Box>
          );
        }

        const hasCompte = !!params.value;

        return (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', width: '100%', gap: 0.5 }}>
            <Typography variant="body2">{params.value || ''}</Typography>

            {hasCompte ? (
              <CheckCircleIcon sx={{ color: 'green', fontSize: 16 }} />
            ) : (
              <GoAlert style={{ color: 'red', fontSize: 16 }} />
            )}
          </Box>
        );
      },
    },
    {
      field: 'solde', headerName: 'Solde', width: 120, type: 'number', headerAlign: 'right', align: 'right',
      renderCell: (p) => formatMoneyFr(p.value),
      sortComparator: keepTotalBottomComparator,
    },
    {
      field: 'amort_ant', headerName: 'Amort Ant', width: 120, type: 'number', headerAlign: 'right', align: 'right',
      renderCell: (p) => formatMoneyFr(p.value),
      sortComparator: keepTotalBottomComparator,
    },
    {
      field: 'dotation', headerName: 'Dotation', width: 120, type: 'number', headerAlign: 'right', align: 'right',
      renderCell: (p) => formatMoneyFr(p.value),
      sortComparator: keepTotalBottomComparator,
    },
    {
      field: 'valeur_nette', headerName: 'Valeur nette', width: 140, type: 'number', headerAlign: 'right', align: 'right',
      renderCell: (p) => formatMoneyFr(p.value),
      sortComparator: keepTotalBottomComparator,
    },
    {
      field: 'vnc_immo', headerName: 'VNC immo', width: 140, type: 'number', headerAlign: 'right', align: 'right',
      renderCell: (p) => formatMoneyFr(p.value),
      sortComparator: keepTotalBottomComparator,
    },
  ]), []);

  const detailColumns = useMemo(() => ([
    { field: 'code', headerName: 'Code', width: 140 },
    { field: 'intitule', headerName: 'Intitulé', width: 220 },
    { field: 'compte_amortissement', headerName: 'Compte amort', width: 140 },
    {
      field: 'reprise_immobilisation_comp', headerName: 'Sans reprise', width: 100, align: 'center',
      renderCell: (p) => {
        const dateReprise = p.row.date_reprise_comp;
        if (p.row.isTotal) {
          return null;
        }

        const avecReprise = p.value;

        return avecReprise
          ? (
            <Tooltip
              title={`Date reprise : ${formatDate(dateReprise)}`}
              slotProps={{
                tooltip: {
                  sx: {
                    backgroundColor: "#fff",
                    color: "#000",
                    fontSize: 14,
                    boxShadow: "0px 6px 24px rgba(0,0,0,0.15)",
                    borderRadius: 2,
                    maxWidth: "none"
                  }
                }
              }}
            >
              <CancelIcon sx={{ color: '#D6A57A' }} />
            </Tooltip>
          )
          : <CheckCircleIcon sx={{ color: 'green' }} />;
      }
    },
    {
      field: 'lien_ecriture_id',
      headerName: 'Lien écriture',
      width: 100,
      align: 'center',
      headerAlign: 'center',
      sortable: false,
      renderCell: (p) => {
        const id = p.row.lien_ecriture_id;
        if (!id) return null;

        const data = journalLinkDataRef.current[id];

        return (
          <WhiteTooltip
            placement="top"
            onOpen={() => fetchJournalLink(id)}
            title={
              data ? (
                <div style={{ minWidth: 400 }}>

                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span>
                      <strong>Date :</strong> {
                        data.dateecriture
                          ? new Date(data.dateecriture).toLocaleDateString('fr-FR')
                          : ''
                      }
                    </span>
                    <span><strong>Journal :</strong> {data.code}</span>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span><strong>Compte :</strong> {data.compteaux}</span>
                    <span><strong>Pièce :</strong> {data.piece}</span>
                  </div>

                  <div style={{
                    display: "flex",
                    gap: 6,
                    marginBottom: 8
                  }}>
                    <strong>Libellé :</strong>
                    <span style={{ opacity: 0.85 }}>{data.libelle}</span>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span><strong>Débit :</strong> {formatMoneyFr(data.debit)}</span>
                    <span><strong>Crédit :</strong> {formatMoneyFr(data.credit)}</span>
                  </div>

                </div>
              ) : "Chargement..."
            }
          >
            <span>
              <GoLink color={initial.theme} size={22} />
            </span>
          </WhiteTooltip>
        );
      }
    },
    { field: 'fournisseur', headerName: 'Fournisseur', width: 160 },
    {
      field: 'date_acquisition', headerName: "Date d'acquisition", align: 'left', width: 150, valueGetter: (p) => {
        const s = p?.row?.date_acquisition;
        return s ? formatDate(s) : '';
      }
    },
    {
      field: 'date_mise_service', headerName: 'Date mise en service', align: 'left', width: 160, valueGetter: (p) => {
        const s = p?.row?.date_mise_service;
        return s ? formatDate(s) : '';
      }
    },
    {
      field: 'etat', headerName: 'Etat', align: 'left', width: 120,
      valueGetter: (params) => {
        const value = params?.row?.etat;
        return ETAT_LABELS[value] || value;
      }
    },
    {
      field: 'type_amort', headerName: "Type d'amortissement", width: 170,
      valueGetter: (p) => {
        return p?.value.toUpperCase();
      }
    },
    { field: 'duree_amort_mois', headerName: 'Durée amort (mois)', align: 'right', width: 140, renderCell: (p) => formatMoneyFr(p.value) },
    { field: 'montant', headerName: 'Montant TTC', width: 140, type: 'number', headerAlign: 'right', align: 'right', renderCell: (p) => formatMoneyFr(p.value) },
    { field: 'taux_tva', headerName: 'Taux TVA', width: 110, type: 'number', headerAlign: 'right', align: 'right', renderCell: (p) => formatMoneyFr(p.value) },
    { field: 'montant_tva', headerName: 'Montant TVA', width: 140, type: 'number', headerAlign: 'right', align: 'right', renderCell: (p) => formatMoneyFr(p.value) },
    { field: 'amort_avant_reprise', headerName: 'Amort avant rep.', width: 140, type: 'number', headerAlign: 'right', align: 'right', renderCell: (p) => formatMoneyFr(p.value) },
    { field: 'montant_ht', headerName: 'Montant HT', width: 140, type: 'number', headerAlign: 'right', align: 'right', renderCell: (p) => formatMoneyFr(p.value) },
    { field: 'amort_ant_comp', headerName: 'Amort ant', width: 120, type: 'number', headerAlign: 'right', align: 'right', renderCell: (p) => formatMoneyFr(p.value) },
    { field: 'dotation_periode_comp', headerName: 'Dotation période', width: 150, type: 'number', headerAlign: 'right', align: 'right', renderCell: (p) => formatMoneyFr(p.value) },
    { field: 'amort_exceptionnel_comp', headerName: 'Amort exceptionnel', width: 170, type: 'number', headerAlign: 'right', align: 'right', renderCell: (p) => formatMoneyFr(p.value) },
    { field: 'derogatoire_comp', headerName: 'Dérogatoire', width: 130, type: 'number', headerAlign: 'right', align: 'right', renderCell: (p) => formatMoneyFr(p.value) },
    { field: 'total_amortissement_comp', headerName: 'Total amortissement', width: 170, type: 'number', headerAlign: 'right', align: 'right', renderCell: (p) => formatMoneyFr(p.value) },
    { field: 'vnc', headerName: 'VNC', width: 140, type: 'number', headerAlign: 'right', align: 'right', renderCell: (p) => formatMoneyFr(p.value) },
    { field: 'prix_vente', headerName: 'Prix de vente', width: 140, type: 'number', headerAlign: 'right', align: 'right', renderCell: (p) => formatMoneyFr(p.value) },
    {
      field: 'date_sortie', headerName: 'Date de sortie', align: 'center', width: 140, valueGetter: (p) => {
        const s = p?.row?.date_sortie;
        return s ? formatDate(s) : '';
      }
    },
  ]), [fetchJournalLink, initial.theme]);

  const ligneCompColumns = useMemo(() => ([
    { field: 'date_mise_service', headerName: 'Date mise en service', width: 170, align: 'center', headerAlign: 'center', valueGetter: (p) => { const s = p?.row?.date_mise_service ? String(p.row.date_mise_service).substring(0, 10) : ''; return s ? `${s.substring(8, 10)}/${s.substring(5, 7)}/${s.substring(0, 4)}` : ''; } },
    { field: 'date_fin_exercice', headerName: "Date fin de l'exercice", width: 180, align: 'center', headerAlign: 'center', valueGetter: (p) => { const s = p?.row?.date_fin_exercice ? String(p.row.date_fin_exercice).substring(0, 10) : ''; return s ? `${s.substring(8, 10)}/${s.substring(5, 7)}/${s.substring(0, 4)}` : ''; } },
    { field: 'annee_nombre', headerName: 'Année Nombre', width: 130, type: 'number', headerAlign: 'right', align: 'right' },
    { field: 'montant_immo_ht', headerName: 'Montant HT', width: 160, type: 'number', headerAlign: 'right', align: 'right', renderCell: (p) => formatMoneyFr(p.value) },
    { field: 'amort_ant_comp', headerName: 'Amort Ant', width: 130, type: 'number', headerAlign: 'right', align: 'right', renderCell: (p) => formatMoneyFr(p.value) },
    { field: 'dot_derogatoire', headerName: 'Dot dérogatoire', width: 160, type: 'number', headerAlign: 'right', align: 'right', renderCell: (p) => formatMoneyFr(p.value) },
    { field: 'dotation_periode_comp', headerName: 'Dotation compta.', width: 140, type: 'number', headerAlign: 'right', align: 'right', renderCell: (p) => formatMoneyFr(p.value) },
    { field: 'cumul_amort_comp', headerName: 'Cumul amort', width: 140, type: 'number', headerAlign: 'right', align: 'right', renderCell: (p) => formatMoneyFr(p.value) },
    { field: 'vnc', headerName: 'VNC', width: 140, type: 'number', headerAlign: 'right', align: 'right', renderCell: (p) => formatMoneyFr(p.value) },
  ]), []);

  const ligneFiscColumns = useMemo(() => ([
    { field: 'date_mise_service', headerName: 'Date mise en service', width: 170, align: 'center', headerAlign: 'center', valueGetter: (p) => { const s = p?.row?.date_mise_service ? String(p.row.date_mise_service).substring(0, 10) : ''; return s ? `${s.substring(8, 10)}/${s.substring(5, 7)}/${s.substring(0, 4)}` : ''; } },
    { field: 'date_fin_exercice', headerName: "Date fin de l'exercice", width: 180, align: 'center', headerAlign: 'center', valueGetter: (p) => { const s = p?.row?.date_fin_exercice ? String(p.row.date_fin_exercice).substring(0, 10) : ''; return s ? `${s.substring(8, 10)}/${s.substring(5, 7)}/${s.substring(0, 4)}` : ''; } },
    { field: 'annee_nombre', headerName: 'Année Nombre', width: 130, type: 'number', headerAlign: 'right', align: 'right' },
    { field: 'montant_immo_ht', headerName: 'Montant HT', width: 160, type: 'number', headerAlign: 'right', align: 'right', renderCell: (p) => formatMoneyFr(p.value) },
    { field: 'amort_ant_fisc', headerName: 'Amort Ant', width: 130, type: 'number', headerAlign: 'right', align: 'right', renderCell: (p) => formatMoneyFr(p.value) },
    { field: 'dot_derogatoire', headerName: 'Dot dérogatoire', width: 160, type: 'number', headerAlign: 'right', align: 'right', renderCell: (p) => formatMoneyFr(p.value) },
    { field: 'dotation_periode_fisc', headerName: 'Dotation fiscale', width: 140, type: 'number', headerAlign: 'right', align: 'right', renderCell: (p) => formatMoneyFr(p.value) },
    { field: 'cumul_amort_fisc', headerName: 'Cumul amort', width: 140, type: 'number', headerAlign: 'right', align: 'right', renderCell: (p) => formatMoneyFr(p.value) },
    { field: 'vnc', headerName: 'VNC', width: 140, type: 'number', headerAlign: 'right', align: 'right', renderCell: (p) => formatMoneyFr(p.value) },
  ]), []);

  const journalColumns = useMemo(() => ([
    {
      field: 'dateecriture', headerName: 'Date écriture', width: 120, valueGetter: (p) => {
        const s = p?.row?.dateecriture ? String(p.row.dateecriture).substring(0, 10) : '';
        return s ? `${s.substring(8, 10)}/${s.substring(5, 7)}/${s.substring(0, 4)}` : '';
      }
    },
    { field: 'journal', headerName: 'Jnl', width: 50, valueGetter: (p) => p?.row?.journal ?? p?.row?.id_journal ?? '' },
    { field: 'piece', headerName: 'Pièce', width: 150 },
    { field: 'libelle', headerName: 'Libellé', width: 160 },
    { field: 'debit', headerName: 'Débit', width: 120, type: 'number', headerAlign: 'right', align: 'right', renderCell: (p) => formatMoneyFr(p.value) },
    { field: 'credit', headerName: 'Crédit', width: 120, type: 'number', headerAlign: 'right', align: 'right', renderCell: (p) => formatMoneyFr(p.value) },
    { field: 'lettrage', headerName: 'Lettrage', width: 120, valueGetter: (p) => p?.row?.lettrage ?? '' },
  ]), []);

  const ETAT_LABELS = {
    enService: 'En service',
    horsService: 'Hors service',
    misEnRebus: 'Mis au rébus',
    cassee: 'Cassée',
    miseEnVente: 'Mise en vente',
  };

  const handleDetailsAdd = () => {
    setPreselectedJournal(null);
    if (!selectedPcIds || selectedPcIds.length !== 1) { toast('Sélectionnez un seul compte immo dans le tableau du haut', { icon: 'ℹ️' }); return; }
    const pcId = selectedPcIds[0];
    const pcRow = rows.find(r => r.id === pcId);
    // Bloquer si le compte d'amortissement n'existe pas côté plan comptable
    if (!pcRow?.compte_amort) {
      toast.error("Veuillez créer un compte d'amortissement de l'immobilisation");
      return;
    }
    setDetailsDialogMode('add');
    setDetailsForm({
      pc_id: pcId,
      pc_id_amort: pcRow?.id_amort,
      code: '',
      intitule: pcRow?.libelle || '',
      compte_id: pcRow?.compte || '',
      fournisseur: '',
      date_acquisition: '',
      date_mise_service: '',
      duree_amort_mois: '',
      type_amort: '',
      montant: Number(pcRow?.solde) || 0,
      taux_tva: '', montant_tva: '', montant_ht: '',
      amort_avant_reprise: '',
      // amortissement comptable par défaut: tout à 0
      amort_ant_comp: 0,
      dotation_periode_comp: 0,
      amort_exceptionnel_comp: 0,
      derogatoire_comp: 0,
      total_amortissement_comp: 0,
      // amortissement fiscal initialisé à 0
      amort_ant_fisc: 0,
      dotation_periode_fisc: 0,
      amort_exceptionnel_fisc: 0,
      derogatoire_fisc: 0,
      total_amortissement_fisc: 0,
      // champs fiscaux durée/type
      duree_amort_mois_fisc: '',
      type_amort_fisc: '',
      __amortTab: 'comp',
      compte_amortissement: deriveCompteAmort(pcRow?.compte),
      vnc: Number(pcRow?.vnc_immo ?? pcRow?.valeur_nette) || 0,
      date_sortie: '', prix_vente: '',
      etat: 'enService'
    });
    setDetailsDialogOpen(true);
  };

  const handleDetailsEdit = () => {
    setPreselectedJournal(null);
    const idSel = Array.isArray(detailsSelectionModel) && detailsSelectionModel.length > 0 ? detailsSelectionModel[detailsSelectionModel.length - 1] : null;
    if (!idSel) { toast('Sélectionnez une ligne détail', { icon: 'ℹ️' }); return; }
    const row = detailsRows.find(r => r.id === idSel);
    if (!row) return;
    setDetailsDialogMode('edit');
    // Compat: si l'enregistrement existant n'a pas encore les suffixes, mapper les anciens champs vers _comp
    const mapped = { ...row };
    if (mapped.amort_ant_comp === undefined && mapped.amort_ant !== undefined) mapped.amort_ant_comp = mapped.amort_ant;
    if (mapped.dotation_periode_comp === undefined && mapped.dotation_periode !== undefined) mapped.dotation_periode_comp = mapped.dotation_periode;
    if (mapped.amort_exceptionnel_comp === undefined && mapped.amort_exceptionnel !== undefined) mapped.amort_exceptionnel_comp = mapped.amort_exceptionnel;
    if (mapped.derogatoire_comp === undefined && mapped.derogatoire !== undefined) mapped.derogatoire_comp = mapped.derogatoire;
    if (mapped.total_amortissement_comp === undefined && mapped.total_amortissement !== undefined) mapped.total_amortissement_comp = mapped.total_amortissement;
    if (!mapped.__amortTab) mapped.__amortTab = 'comp';
    setDetailsForm(mapped);
    setDetailsDialogOpen(true);
  };

  const handleDetailsDelete = () => {
    const idSel = Array.isArray(detailsSelectionModel) && detailsSelectionModel.length > 0 ? detailsSelectionModel[detailsSelectionModel.length - 1] : null;
    if (!idSel) { toast('Sélectionnez une ligne détail', { icon: 'ℹ️' }); return; }
    setOpenConfirmDelete(true);
  };

  const confirmDetailsDelete = async (confirmed) => {
    setOpenConfirmDelete(false);
    if (!confirmed) return;

    const idSel = Array.isArray(detailsSelectionModel) && detailsSelectionModel.length > 0 ? detailsSelectionModel[detailsSelectionModel.length - 1] : null;
    if (!idSel) return;

    try {
      const fid = Number(id) || 0; const exoId = Number(selectedExerciceId) || 0;
      const onePcId = Array.isArray(selectedPcIds) && selectedPcIds.length > 0 ? Number(selectedPcIds[0]) : null;
      const url = `/administration/traitementSaisie/immobilisations/details/${idSel}`;
      const params = { fileId: fid, compteId: onePcId ?? compteId, exerciceId: exoId };

      await axios.delete(url, { params });

      toast.success('Détail supprimé');
      // Vider la sélection pour éviter les erreurs 404 sur les lignes d'amortissement
      setDetailsSelectionModel([]);
      await fetchDetails();
    } catch (e) {
      console.error('[DELETE] Erreur:', e);
      toast.error(`Suppression échouée: ${getErrMsg(e)}`);
    }
  };

  const submitDetailsForm = async () => {
    try {
      const fid = Number(id) || 0; const exoId = Number(selectedExerciceId) || 0; if (!fid || !compteId || !exoId) return;
      setDetailsLoading(true);
      // Sanitize payload to avoid '' for integer/date columns
      const numericKeys = [
        'duree_amort_mois', 'montant', 'taux_tva', 'montant_tva', 'montant_ht',
        // anciens champs (compat si encore présents)
        'amort_ant', 'dotation_periode', 'amort_exceptionnel', 'total_amortissement', 'derogatoire',
        // nouveaux champs suffixés comptables
        'amort_ant_comp', 'dotation_periode_comp', 'amort_exceptionnel_comp', 'derogatoire_comp', 'total_amortissement_comp',
        // nouveaux champs suffixés fiscaux
        'amort_ant_fisc', 'dotation_periode_fisc', 'amort_exceptionnel_fisc', 'derogatoire_fisc', 'total_amortissement_fisc',
        // durée amort fiscale
        'duree_amort_mois_fisc',
        'vnc', 'prix_vente'
      ];

      const dateKeys = ['date_acquisition', 'date_mise_service', 'date_sortie'];
      const cleaned = { ...detailsForm };
      numericKeys.forEach(k => {
        const v = cleaned[k];
        if (v === '' || v === undefined || v === null) cleaned[k] = null; else cleaned[k] = Number(v);
      });
      dateKeys.forEach(k => { const v = cleaned[k]; if (!v || v === '') cleaned[k] = null; });
      cleaned.pc_id = Number(cleaned.pc_id || 0);
      cleaned.pc_id_amort = Number(cleaned.pc_id_amort || 0);
      cleaned.lien_ecriture_id = cleaned.lien_ecriture_id ? Number(cleaned.lien_ecriture_id) : null;

      const effectiveCompteId = compteId;

      // await handleSaveLignes(ligneRowsComp, ligneRowsFisc);

      if (detailsDialogMode === 'add') {
        const payload = { fileId: fid, compteId: effectiveCompteId, exerciceId: exoId, pcId: Number(cleaned.pc_id || 0), ligneTab, isCompDegTab, isFiscDegTab, ...cleaned };
        // return console.log('payload : ', payload);
        await axios.post('/administration/traitementSaisie/immobilisations/details', payload);
        toast.success('Détail ajouté');
        await fetchDetails();
      } else {
        const payload = { fileId: fid, compteId: effectiveCompteId, exerciceId: exoId, pcId: Number(cleaned.pc_id || 0), ligneTab, isCompDegTab, isFiscDegTab, ...cleaned };
        // return console.log('payload : ', payload);
        await axios.put(`/administration/traitementSaisie/immobilisations/details/${detailsForm.id}`, payload);
        toast.success('Détail modifié');
        await fetchDetails();
      }
      setDetailsDialogOpen(false);
      // await fetchDetails();
    } catch (e) {
      const status = e?.response?.status;
      const msg = e?.response?.data?.msg || e?.response?.data?.message || '';
      if (status === 400 && /amort/i.test(String(msg))) {
        toast.error("Veuillez ajouter un compte d'amort");
        // ne pas fermer le dialog, l'utilisateur peut corriger
      } else {
        toast.error(`${getErrMsg(e)}`);
      }
    } finally { setDetailsLoading(false); }
  };

  const GetInfosIdDossier = (idDossier) => {
    axios.get(`/home/FileInfos/${idDossier}`).then((response) => {
      const resData = response.data;
      if (resData.state) {
        setFileInfos(resData.fileInfos[0]);
        setNoFile(false);
      } else {
        setFileInfos([]);
        setNoFile(true);
      }
    });
  };

  const sendToHome = (value) => {
    setNoFile(!value);
    navigate('/tab/home');
  };

  const handleChangeExercice = (exercice_id) => {
    setSelectedExerciceId(exercice_id);
    setSelectedPeriodeChoiceId(0);
    setListeSituation(listeExercice?.filter((item) => item.id === exercice_id));
    setSelectedPeriodeId(exercice_id);
  };

  const handleChangePeriode = (choix) => {
    setSelectedPeriodeChoiceId(choix);
    if (choix === 0) {
      setListeSituation(listeExercice?.filter((item) => item.id === selectedExerciceId));
      setSelectedPeriodeId(selectedExerciceId);
    } else if (choix === 1) {
      setListeSituation(listeExercice);
    }
  };

  const handleChangeDateIntervalle = (idPeriode) => {
    setSelectedPeriodeId(idPeriode);
  };

  const GetListeExercice = (idDossier) => {
    axios.get(`/paramExercice/listeExercice/${idDossier}/${compteId}`).then((response) => {
      const resData = response.data;
      if (resData.state) {
        setListeExercice(resData.list);
        const exerciceNId = resData.list?.filter((item) => item.libelle_rang === 'N');
        setListeSituation(exerciceNId);
        setSelectedExerciceId(exerciceNId[0].id);
        setSelectedPeriodeChoiceId(0);
        setSelectedPeriodeId(exerciceNId[0].id);
      } else {
        setListeExercice([]);
        toast.error('une erreur est survenue lors de la récupération de la liste des exercices');
      }
    });
  };

  const handleOpenConfirmGenerateEcritures = () => {
    if (!selectedExerciceId) {
      toast('Sélectionnez un exercice', { icon: 'ℹ️' });
      return;
    }
    setOpenConfirmGenerateEcritures(true);
  };

  const handleOpenConfirmCancelEcritures = () => {
    if (!selectedExerciceId) {
      toast('Sélectionnez un exercice', { icon: 'ℹ️' });
      return;
    }
    setOpenConfirmCancelEcritures(true);
  };

  let idExerciceSelectionne = selectedExerciceId;
  if (detailsSelectionModel.length !== 0) {
    const lignesListeImmo = detailRowsWithTotal.find(val => val.id === Number(detailsSelectionModel[0]));
    idExerciceSelectionne = lignesListeImmo?.id_exercice;
  }

  useEffect(() => {
    const idFile = Number(id) || 0;
    if (!idFile) {
      setNoFile(true);
      return;
    }
    GetInfosIdDossier(idFile);
    GetListeExercice(idFile);
  }, [id]);

  useEffect(() => {
    const loadImmobilisations = async () => {
      try {
        const fid = Number(id) || 0;
        const exoId = Number(selectedExerciceId) || 0;
        if (!fid || !compteId || !exoId) { setRows([]); return; }
        setLoading(true);
        const { data } = await axios.get('/administration/traitementSaisie/immobilisations/pcs', {
          params: { fileId: fid, compteId, exerciceId: exoId },
          timeout: 60000,
        });
        if (data?.state) {
          const list = Array.isArray(data.list) ? data.list : (data.list ? [data.list] : []);
          const mapByCompte = list.reduce((acc, row) => {
            const key = row.compte ?? row.id;
            if (key && !acc[key]) acc[key] = row;
            return acc;
          }, {});
          const uniqueList = Object.values(mapByCompte);
          setRows(uniqueList);
        } else {
          setRows([]);
          toast.error(data?.msg || 'Aucun compte immobilisation trouvé');
        }
      } catch (e) {
        setRows([]);
        try { console.error('[IMMO][PCS][ERROR]', e?.response?.status, e?.response?.data || e); } catch { }
        toast.error("Erreur serveur lors du chargement des comptes d'immobilisations");
      } finally {
        setLoading(false);
      }
    };
    loadImmobilisations();
  }, [id, compteId, selectedExerciceId]);

  useEffect(() => {
    // Ajuster l'onglet par défaut selon les données disponibles
    if (ligneTab === 'comp' && !hasCompData && hasFiscData) setLigneTab('fisc');
    else if (ligneTab === 'fisc' && !hasFiscData && hasCompData) setLigneTab('comp');
  }, [hasCompData, hasFiscData]);

  // Load lines for selected immobilisation detail
  useEffect(() => {
    const loadLignes = async () => {
      try {
        const fid = Number(id) || 0; const exoId = Number(selectedExerciceId) || 0;
        const selectedDetailId = Array.isArray(detailsSelectionModel) && detailsSelectionModel.length > 0 ? Number(detailsSelectionModel[detailsSelectionModel.length - 1]) : 0;
        if (!fid || !compteId || !exoId || !selectedDetailId) { setLigneRowsComp([]); setLigneRowsFisc([]); return; }

        setLigneLoading(true);
        // Auto-détection du mode à partir de la ligne sélectionnée dans le 2e tableau
        const detailRow = detailsRows.find(r => Number(r.id) === Number(selectedDetailId)) || {};
        let autoMode = 'comp';
        const fiscHints = [
          Number(detailRow?.duree_amort_mois_fisc) || 0,
          Number(detailRow?.amort_ant_fisc) || 0,
          Number(detailRow?.dotation_periode_fisc) || 0,
          Number(detailRow?.amort_exceptionnel_fisc) || 0,
          Number(detailRow?.derogatoire_fisc) || 0,
          Number(detailRow?.total_amortissement_fisc) || 0,
        ];
        if (detailRow.__amortTab === 'fisc') autoMode = 'fisc';
        else if (detailRow.__amortTab === 'comp') autoMode = 'comp';
        else if ((detailRow?.type_amort_fisc && String(detailRow.type_amort_fisc).length > 0)) autoMode = 'fisc';
        else if (fiscHints.some(v => v > 0)) autoMode = 'fisc';
        else autoMode = 'comp';

        // Toujours récupérer les deux prévisualisations (linéaire + dégressif), puis choisir par onglet
        const isCompDeg = normalizeNoAccent(detailRow?.type_amort).includes('degr');
        const isFiscDeg = normalizeNoAccent(detailRow?.type_amort_fisc).includes('degr');

        const [linRes, degRes] = await Promise.all([
          axios.get('/administration/traitementSaisie/immobilisations/details/lineaire/preview', { params: { fileId: fid, compteId: compteId, exerciceId: exoId, detailId: selectedDetailId, mode: autoMode, view: 'both', ligneTab }, timeout: 60000 }),
          axios.get('/administration/traitementSaisie/immobilisations/details/degresif/preview', { params: { fileId: fid, compteId: compteId, exerciceId: exoId, detailId: selectedDetailId, mode: autoMode, view: 'both', ligneTab }, timeout: 60000 }),
        ]);

        const lin = linRes?.data?.previewLin || {};
        const deg = degRes?.data?.previewDeg || {};

        // Sélectionner la source par onglet (préférer dégressif si disponible)
        const degComp = Array.isArray(deg.list_comp) ? deg.list_comp : [];
        const degFisc = Array.isArray(deg.list_fisc) ? deg.list_fisc : [];
        const linComp = Array.isArray(lin.list_comp) ? lin.list_comp : [];
        const linFisc = Array.isArray(lin.list_fisc) ? lin.list_fisc : [];

        const compUsesDeg = (isCompDeg && degComp.length > 0);
        const fiscUsesDeg = (isFiscDeg && degFisc.length > 0);

        const rawComp = compUsesDeg ? degComp : linComp;
        const rawFisc = fiscUsesDeg ? degFisc : linFisc;
        const meta = compUsesDeg ? (deg.meta || lin.meta || {}) : (lin.meta || deg.meta || {});

        const montantHt = Number(meta?.montant_ht) || 0;
        const repriseComp = meta?.reprise_comp || meta?.reprise;
        const repriseFisc = meta?.reprise_fisc;
        const montantImmoHtComp = repriseComp ? Math.max(0, montantHt - (Number(repriseComp?.amort_ant) || 0)) : montantHt;
        const montantImmoHtFisc = repriseFisc ? Math.max(0, montantHt - (Number(repriseFisc?.amort_ant) || 0)) : montantHt;

        // Normalize possible backend schemas to frontend fields
        const normComp = rawComp.map((r) => ({
          rang: r.rang,
          date_mise_service: r.date_mise_service ?? r.date_debut ?? r.debut ?? null,
          date_fin_exercice: r.date_fin_exercice ?? r.date_fin ?? r.fin ?? null,
          nb_jours: r.nb_jours ?? r.nbJours ?? null,
          annee_nombre: r.annee_nombre ?? r.anneeNombre ?? null,
          montant_immo_ht: r.montant_immo_ht ?? montantImmoHtComp,
          amort_ant_comp: r.amort_ant_comp ?? r.dot_ant ?? 0,
          dotation_periode_comp: r.dotation_periode_comp ?? r.dotation_annuelle ?? 0,
          cumul_amort_comp: r.cumul_amort_comp ?? r.cumul_amort ?? 0,
          vnc: r.vnc ?? r.vnc_comp ?? null,
          // keep fiscal zeros for comp view rows
          amort_ant_fisc: 0,
          dotation_periode_fisc: 0,
          cumul_amort_fisc: 0,
          dot_derogatoire: r.dot_derogatoire ?? 0,
        }));

        const normFisc = rawFisc.map((r) => ({
          rang: r.rang,
          date_mise_service: r.date_mise_service ?? r.date_debut ?? r.debut ?? null,
          date_fin_exercice: r.date_fin_exercice ?? r.date_fin ?? r.fin ?? null,
          nb_jours: r.nb_jours ?? r.nbJours ?? null,
          annee_nombre: r.annee_nombre ?? r.anneeNombre ?? null,
          montant_immo_ht: r.montant_immo_ht ?? montantImmoHtFisc,
          // keep comp zeros for fisc view rows
          amort_ant_comp: 0,
          dotation_periode_comp: 0,
          cumul_amort_comp: 0,
          vnc: r.vnc ?? Math.max(0, (meta.montant_ht ?? 0) - (r.cumul_amort_fisc ?? r.cumul_amort ?? 0)),
          amort_ant_fisc: r.amort_ant_fisc ?? r.dot_ant ?? 0,
          dotation_periode_fisc: r.dotation_periode_fisc ?? r.dotation_annuelle ?? 0,
          cumul_amort_fisc: r.cumul_amort_fisc ?? r.cumul_amort ?? 0,
          dot_derogatoire: r.dot_derogatoire ?? 0,
        }));

        // await handleSaveLignes(normComp, normFisc);

        setLigneRowsComp(normComp);
        setLigneRowsFisc(normFisc);
        setIsCompDegTab(!!compUsesDeg);
        setIsFiscDegTab(!!fiscUsesDeg);

      } catch (e) {
        setLigneRowsComp([]);
        setLigneRowsFisc([]);
        toast.error(`Erreur lors du chargement des lignes d'amortissement: ${getErrMsg(e)}`);
      } finally { setLigneLoading(false); }
    };
    loadLignes();
  }, [id, compteId, selectedExerciceId, selectedPcIds, detailsSelectionModel, detailsRows]);

  useEffect(() => {
    journalLinkDataRef.current = journalLinkData;
  }, [journalLinkData]);

  useEffect(() => { fetchDetails(); }, [fetchDetails]);
  useEffect(() => { getLienEcriture(); }, [detailsForm]);

  return (
    <Box>
      {noFile ? <PopupTestSelectedFile confirmationState={sendToHome} /> : null}
      {openConfirmDelete && (
        <PopupConfirmDelete
          msg="Voulez-vous vraiment supprimer cette immobilisation ?"
          confirmationState={confirmDetailsDelete}
        />
      )}
      {openConfirmGenerateEcritures && (
        <PopupActionConfirmWithCheckbox
          msg={"Voulez-vous vraiment générer l'écriture comptable des immobilisations pour l'exercice sélectionné ?"}
          isLoading={loadingEcritures}
          confirmationState={async (val, detailedByMonth) => {
            if (!val) {
              if (!loadingEcritures) setOpenConfirmGenerateEcritures(false);
              return;
            }
            try {
              const fid = Number(id) || 0;
              const exoId = Number(selectedExerciceId) || 0;
              if (!fid || !compteId || !exoId) {
                toast('Sélectionnez un exercice', { icon: 'ℹ️' });
                return;
              }

              setLoadingEcritures(true);
              const { data } = await axios.post(
                '/administration/traitementSaisie/immobilisations/ecritures/generate',
                { fileId: fid, compteId, exerciceId: exoId, detailedByMonth: detailedByMonth === 'oui' },
                { timeout: 60000 }
              );
              if (data?.state) {
                toast.success(`${data?.msg || 'Écritures générées'} (${Number(data?.created_lignes) || 0} lignes)`);
                setOpenConfirmGenerateEcritures(false);
              } else {
                toast.error(data?.msg || 'Erreur lors de la génération');
              }
            } catch (e) {
              toast.error(`Erreur lors de la génération: ${getErrMsg(e)}`);
            } finally {
              setLoadingEcritures(false);
            }
          }}
        />
      )}
      {openConfirmCancelEcritures && (
        <PopupConfirmDelete
          msg="Voulez-vous vraiment supprimer les écritures comptables des immobilisations pour l'exercice sélectionné ?"
          confirmationState={async (confirmed) => {
            setOpenConfirmCancelEcritures(false);
            if (!confirmed) return;

            try {
              const fid = Number(id) || 0;
              const exoId = Number(selectedExerciceId) || 0;
              if (!fid || !compteId || !exoId) {
                toast('Sélectionnez un exercice', { icon: 'ℹ️' });
                return;
              }

              setLoadingEcritures(true);
              const { data } = await axios.post(
                '/administration/traitementSaisie/immobilisations/ecritures/cancel',
                { fileId: fid, compteId, exerciceId: exoId },
                { timeout: 60000 }
              );
              if (data?.state) {
                toast.success(`${data?.msg || 'Écritures supprimées'} (${Number(data?.deleted_lignes) || 0} lignes)`);
              } else {
                toast.error(data?.msg || 'Erreur lors de la suppression');
              }
            } catch (e) {
              toast.error(`Erreur lors de la suppression: ${getErrMsg(e)}`);
            } finally {
              setLoadingEcritures(false);
            }
          }}
        />
      )}
      {openImportDialog && (
        <PopupImportImmobilisations
          open={openImportDialog}
          onClose={() => setOpenImportDialog(false)}
          fileId={id}
          compteId={compteId}
          exerciceId={selectedExerciceId}
          onImportSuccess={async () => {
            const fid = Number(id) || 0;
            const exoId = Number(selectedExerciceId) || 0;
            if (fid && compteId && exoId) {
              try {
                // Recharger les comptes d'immobilisations
                const { data } = await axios.get('/administration/traitementSaisie/immobilisations/pcs', {
                  params: { fileId: fid, compteId, exerciceId: exoId },
                  timeout: 60000,
                });
                if (data?.state) {
                  const list = Array.isArray(data.list) ? data.list : (data.list ? [data.list] : []);
                  const mapByCompte = list.reduce((acc, row) => {
                    const key = row.compte ?? row.id;
                    if (key && !acc[key]) acc[key] = row;
                    return acc;
                  }, {});
                  const uniqueList = Object.values(mapByCompte);
                  setRows(uniqueList);

                  // Sélectionner automatiquement le premier compte pour afficher les détails
                  if (uniqueList.length > 0) {
                    const firstRow = uniqueList[0];
                    setSelectionModel([firstRow.id]);

                    // Attendre un peu pour que la sélection soit prise en compte
                    await new Promise(resolve => setTimeout(resolve, 500));

                    // Forcer le rechargement des détails avec le bon pcId
                    const { data: detailsData } = await axios.get('/administration/traitementSaisie/immobilisations/details', {
                      params: { fileId: fid, compteId: firstRow.id, exerciceId: exoId, pcId: firstRow.id },
                      timeout: 60000,
                    });
                    const detailsList = Array.isArray(detailsData?.list) ? detailsData.list : [];
                    setDetailsRows(detailsList);
                  }
                }

                // Recharger les détails
                await fetchDetails();
              } catch (e) {
                console.error('Erreur rechargement après import:', e);
              }
            }
          }}
        />
      )}
      <TabContext value={'1'}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <TabList aria-label="immobilisations tabs">
            <Tab
              style={{ textTransform: 'none', outline: 'none', border: 'none', margin: -5 }}
              label={InfoFileStyle(fileInfos?.dossier)} value="1"
            />
          </TabList>
        </Box>
        <TabPanel value="1" style={{ height: '100%' }}>
          <Stack width={'100%'} height={'100%'} spacing={3}>
            <Typography variant='h6' sx={{ color: 'black' }} align='left'>Administration - Immobilisations</Typography>

            <Stack width={'100%'} spacing={4} alignItems={'center'} justifyContent="space-between" direction={'row'}>
              <Stack direction={'row'}>
                <FormControl variant="standard" sx={{ m: 1, minWidth: 250 }}>
                  <InputLabel>Exercice:</InputLabel>
                  <Select
                    value={selectedExerciceId}
                    onChange={(e) => handleChangeExercice(e.target.value)}
                    sx={{ width: '300px', display: 'flex', justifyContent: 'left', alignItems: 'flex-start', alignContent: 'flex-start', textAlign: 'left' }}
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
                    sx={{ width: '150px', display: 'flex', justifyContent: 'left', alignItems: 'flex-start', alignContent: 'flex-start', textAlign: 'left' }}
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
                    sx={{ width: '300px', display: 'flex', justifyContent: 'left', alignItems: 'flex-start', alignContent: 'flex-start', textAlign: 'left' }}
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

              <Stack direction="row" spacing={1} alignItems="center" justifyContent="flex-end" sx={{ pr: 1 }}>
                <Button
                  onClick={() => setOpenImportDialog(true)}
                  variant="contained"
                  startIcon={<TbFileImport />}
                  sx={{
                    backgroundColor: '#28a745', textTransform: 'none', whiteSpace: 'nowrap',
                    '&:hover': {
                      backgroundColor: '#28a745',
                    },
                  }}
                  style={{
                    textTransform: 'none',
                    outline: 'none',
                  }}
                >
                  Importer
                </Button>
                <Button
                  onClick={handleOpenConfirmGenerateEcritures}
                  variant="contained"
                  sx={{
                    backgroundColor: initial.theme, textTransform: 'none', whiteSpace: 'nowrap',
                    '&:hover': {
                      backgroundColor: initial.theme,
                    },
                  }}
                  style={{
                    textTransform: 'none',
                    outline: 'none',
                  }}
                >
                  Générer écritures
                </Button>
                <Button
                  onClick={handleOpenConfirmCancelEcritures}
                  variant="contained"
                  sx={{
                    backgroundColor: initial.button_delete_color, textTransform: 'none', whiteSpace: 'nowrap',
                    '&:hover': {
                      backgroundColor: initial.button_delete_color,
                    },
                  }}
                  style={{
                    textTransform: 'none',
                    outline: 'none',
                  }}
                >
                  Supprimer écritures
                </Button>
              </Stack>
            </Stack>

            <RadioGroup
              row
              aria-labelledby="filtrageCompte"
              name="filtrageCompte"
              onChange={(e) => {
                setFiltrageCompte(e.target.value);
                toast.success(`Filtre appliqué : ${rowsFiltered.length} lignes trouvées`);
              }}
              value={filtrageCompte}
            >
              <FormControlLabel value="0" control={<Radio disabled={false} />} label="Tous" style={{ marginLeft: "5px" }} />
              <FormControlLabel value="1" control={<Radio disabled={false} />} label="Comptes peuplés" style={{ marginLeft: "5px" }} />
            </RadioGroup>

            <Box sx={{ flex: 1 }}>
              <DataGrid
                rows={rowsWithTotal}
                columns={columns}
                getRowId={(r) => r.id}
                disableRowSelectionOnClick
                disableColumnMenu
                checkboxSelection
                rowSelectionModel={selectionModel}
                onRowSelectionModelChange={(m) => {
                  const arr = Array.isArray(m) ? m : [];
                  setSelectionModel(arr.slice(-1));
                }}
                density="compact"
                pageSizeOptions={[10, 25, 50]}
                autoHeight
                loading={loading}
                sx={{
                  '& .MuiDataGrid-columnHeaders': {
                    backgroundColor: initial.theme,
                    color: 'white',
                    fontWeight: 'bold',
                  },
                  '& .total-row': {
                    fontWeight: 'bold',
                    color: 'white',
                    backgroundColor: initial.theme,
                  },
                  // garder la même couleur pour la ligne Total même au survol / sélection
                  '& .MuiDataGrid-row.total-row:hover, & .MuiDataGrid-row.total-row.Mui-hovered': {
                    backgroundColor: `${initial.theme} !important`,
                  },
                  '& .MuiDataGrid-row.Mui-selected.total-row, & .MuiDataGrid-row.Mui-selected.total-row:hover': {
                    backgroundColor: `${initial.theme} !important`,
                  },
                  '& .MuiDataGrid-cell:focus': {
                    outline: 'none !important',
                  },
                  '& .MuiDataGrid-cell:focus-within': {
                    outline: 'none !important',
                  },
                  '& .MuiDataGrid-columnHeader:focus': {
                    outline: 'none !important',
                  },
                  '& .MuiDataGrid-columnHeader:focus-within': {
                    outline: 'none !important',
                  },
                  '& .MuiDataGrid-row.total-row .MuiDataGrid-checkboxInput': {
                    display: 'none',
                  },
                }}
                getRowClassName={(params) => (params.row?.isTotal ? 'total-row' : '')}
              />
              {selectedPcIds.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                    <Typography variant="subtitle1">Listes des immobilisations</Typography>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <Tooltip title="Ajouter">
                        <span>
                          <IconButton
                            onClick={handleDetailsAdd}
                            // disabled={selectedExerciceId !== idExerciceSelectionne}
                            style={{
                              width: 35, height: 35, borderRadius: 2, backgroundColor: initial.theme,
                              textTransform: 'none',
                              outline: 'none',
                            }}
                          >
                            <TbPlaylistAdd style={{ width: 22, height: 22, color: 'white' }} />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Modifier">
                        <span>
                          <IconButton
                            onClick={handleDetailsEdit}
                            disabled={detailsSelectionModel.length === 0 || selectedExerciceId !== idExerciceSelectionne}
                            style={{
                              width: 35, height: 35, borderRadius: 2, backgroundColor: initial.theme,
                              textTransform: 'none',
                              outline: 'none',
                            }}
                          >
                            <FaRegPenToSquare style={{ width: 20, height: 20, color: 'white' }} />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Supprimer">
                        <span>
                          <IconButton onClick={handleDetailsDelete} disabled={detailsSelectionModel.length === 0 || selectedExerciceId !== idExerciceSelectionne} style={{
                            width: 35, height: 35, borderRadius: 2, backgroundColor: initial.button_delete_color, textTransform: 'none',
                            outline: 'none',
                          }}>
                            <IoMdTrash style={{ width: 20, height: 20, color: 'white' }} />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Stack>
                  </Stack>
                  <DataGrid
                    disableMultipleSelection={DataGridStyle.disableMultipleSelection}
                    disableColumnSelector={DataGridStyle.disableColumnSelector}
                    disableDensitySelector={DataGridStyle.disableDensitySelector}
                    disableRowSelectionOnClick
                    disableSelectionOnClick={true}
                    rows={detailRowsWithTotal}
                    columns={detailColumns}
                    getRowId={(r) => r.id}
                    // disableColumnMenu
                    // disableRowSelectionOnClick={false}
                    checkboxSelection
                    // pinnedColumns={{ left: ['checkboxSelection'] }}
                    experimentalFeatures={{ newEditingApi: true }}
                    rowSelectionModel={detailsSelectionModel}
                    onRowSelectionModelChange={async (m) => {
                      const arr = Array.isArray(m) ? m : [];
                      const selected = arr.slice(-1);

                      setDetailsSelectionModel(selected);
                      // try {
                      //   await fetchDetails();
                      // } catch (err) {
                      //   console.error('Erreur lors du refresh:', err);
                      // }
                    }}
                    isCellEditable={() => false}
                    density="compact"
                    autoHeight
                    sx={{
                      ...DataGridStyle.sx,
                      '& .MuiDataGrid-columnHeaders': {
                        backgroundColor: initial.theme,
                        color: 'white',
                        fontWeight: 'bold',
                      },
                      '& .total-row': {
                        fontWeight: 'bold',
                        color: 'white',
                        backgroundColor: initial.theme,
                      },
                      '& .MuiDataGrid-row.total-row .MuiDataGrid-cell': {
                        backgroundColor: `${initial.theme} !important`,
                      },
                      '& .MuiDataGrid-row.highlight-separator': {
                        borderBottom: '1px solid red',
                      },
                      '& .MuiDataGrid-virtualScroller': {
                        maxHeight: '700px',
                      },
                      '& .MuiDataGrid-row.total-row .MuiDataGrid-checkboxInput': {
                        display: 'none',
                      },
                      '& .disabled-row': {
                        color: '#545252'
                      },
                      '& .MuiDataGrid-cell:focus-within': {
                        outline: 'none !important',
                      },
                    }}
                    getRowClassName={(params) => {
                      if (params.row?.isTotal) return 'total-row';
                      if (params.row.id_exercice !== selectedExerciceId) return 'disabled-row';
                      return '';
                    }}
                  />
                  {Array.isArray(detailsSelectionModel) && detailsSelectionModel.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle1">Plan d'amortissement</Typography>
                      <TabContext value={ligneTab}>
                        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                          <TabList onChange={(_, v) => setLigneTab(v)} aria-label="tabs amort">
                            <Tab label="Comptable" value="comp" style={{ textTransform: 'none', outline: 'none', border: 'none', }} />
                            <Tab label="Fiscal" value="fisc" style={{ textTransform: 'none', outline: 'none', border: 'none', }} />
                          </TabList>
                        </Box>

                        <TabPanel value="comp" sx={{ px: 0 }}>
                          <DataGrid
                            rows={Array.isArray(ligneRowsComp) ? ligneRowsComp : []}
                            getRowId={(r) => r.rang || r.id}
                            columns={ligneCompColumns}
                            loading={ligneLoading}
                            disableColumnMenu
                            disableRowSelectionOnClick
                            density="compact"
                            sx={{
                              ...DataGridStyle.sx,
                              '& .MuiDataGrid-columnHeaders': {
                                backgroundColor: initial.theme,
                                color: 'white',
                                fontWeight: 'bold',
                              },
                              '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': {
                                outline: 'none',
                                border: 'none',
                              },
                              '& .highlight-separator': {
                                borderBottom: '1px solid red'
                              },
                              '& .MuiDataGrid-row.highlight-separator': {
                                borderBottom: '1px solid red',
                              },
                              '& .MuiDataGrid-virtualScroller': {
                                maxHeight: '700px',
                              },
                            }}
                          />
                        </TabPanel>

                        <TabPanel value="fisc" sx={{ px: 0 }}>
                          <DataGrid
                            rows={Array.isArray(ligneRowsFisc) ? ligneRowsFisc : []}
                            getRowId={(r) => r.rang || r.id}
                            columns={ligneFiscColumns}
                            loading={ligneLoading}
                            disableColumnMenu
                            disableRowSelectionOnClick
                            density="compact"
                            sx={{
                              ...DataGridStyle.sx,
                              '& .MuiDataGrid-columnHeaders': {
                                backgroundColor: initial.theme,
                                color: 'white',
                                fontWeight: 'bold',
                              },
                              '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': {
                                outline: 'none',
                                border: 'none',
                              },
                              '& .highlight-separator': {
                                borderBottom: '1px solid red'
                              },
                              '& .MuiDataGrid-row.highlight-separator': {
                                borderBottom: '1px solid red',
                              },
                              '& .MuiDataGrid-virtualScroller': {
                                maxHeight: '700px',
                              },
                            }}
                          />
                        </TabPanel>
                      </TabContext>
                    </Box>
                  )}
                  <DetailsImmoDialog
                    open={detailsDialogOpen}
                    mode={detailsDialogMode}
                    form={detailsForm}
                    onChange={(f) => setDetailsForm(f)}
                    onClose={() => {
                      setDetailsDialogOpen(false);
                      // setPreselectedJournal(null);
                    }}
                    onSubmit={submitDetailsForm}
                    loading={detailsLoading}
                    onOpenLienEcriture={handleOpenLienEcriture}
                    setDetailsForm={setDetailsForm}
                  />

                  <Dialog open={lienDialogOpen} onClose={() => setLienDialogOpen(false)} maxWidth="md">
                    <DialogTitle>Choisir une écriture du journal</DialogTitle>
                    <DialogContent dividers>
                      <DataGrid
                        rows={journalRows}
                        getRowId={(r) => r.id}
                        columns={journalColumns}
                        loading={journalLoading}
                        checkboxSelection
                        disableColumnMenu
                        disableRowSelectionOnClick
                        rowSelectionModel={journalSelection}
                        onRowSelectionModelChange={(m) => {
                          const arr = Array.isArray(m) ? m : [];
                          setJournalSelection(arr.slice(-1));
                        }}
                        autoHeight
                        density="compact"
                        sx={{
                          ...DataGridStyle.sx,
                          '& .MuiDataGrid-columnHeaders': {
                            backgroundColor: initial.theme,
                            color: '#fff',
                            fontWeight: 'bold',
                          },
                          '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': {
                            outline: 'none',
                            border: 'none',
                          },
                          '& .highlight-separator': {
                            borderBottom: '1px solid red'
                          },
                          '& .MuiDataGrid-row.highlight-separator': {
                            borderBottom: '1px solid red',
                          },
                          '& .MuiDataGrid-virtualScroller': {
                            maxHeight: '700px',
                          },
                        }}
                      />
                    </DialogContent>
                    <DialogActions>
                      <Button autoFocus
                        variant="outlined"
                        style={{
                          backgroundColor: "transparent",
                          color: initial.theme,
                          width: "100px",
                          textTransform: 'none',
                          outline: 'none',
                        }}
                        onClick={() => setLienDialogOpen(false)}>
                        Annuler
                      </Button>

                      <Button autoFocus
                        variant="contained"
                        onClick={handleConfirmLienEcriture}
                        disabled={journalSelection.length === 0}
                        style={{
                          backgroundColor: initial.theme,
                          color: 'white',
                          width: "100px",
                          textTransform: 'none',
                          outline: 'none',
                        }}
                      >
                        Valider
                      </Button>
                    </DialogActions>
                  </Dialog>
                </Box>
              )}
            </Box>
          </Stack>
        </TabPanel>
      </TabContext>
    </Box>
  );
};

export default Immobilisations;