import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';

import {
  Box, Typography, Stack, Paper, List, ListItemButton, ListItemText,
  Tabs, Tab, Divider, Chip, LinearProgress, Button, TextField, Drawer,
  Grid, Link, Tooltip,
  IconButton,
  ToggleButtonGroup,
  ToggleButton, Badge,
  Breadcrumbs, ListItemIcon
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import {
  AssignmentOutlined, HistoryOutlined, AnalyticsOutlined,
  AddCommentOutlined, CalendarTodayOutlined, FolderOpenOutlined,
  CheckCircleOutline, AccessTimeOutlined,
  NavigateNext, CalendarMonth, Verified, Edit, Delete,
  Comment, Close, Save, PieChart, FiberManualRecord,
  DashboardOutlined, CheckOutlined, CloseOutlined, EditOutlined, DeleteOutline
} from '@mui/icons-material';
import SaveOutlined from '@mui/icons-material/SaveOutlined';
import useAxiosPrivate from '../../hooks/useAxiosPrivate';
import useAuth from '../../hooks/useAuth';
import { jwtDecode } from 'jwt-decode';
import axios from '../../../config/axios';
import { alpha } from '@mui/material/styles';
import ExercicePeriodeSelector from '../ExercicePeriodeSelector';
import toast from 'react-hot-toast';
import ConfirmActionDialog from '../../components/ConfirmActionDialog';
import ConfirmDeleteDialog from '../../components/ConfirmDeleteDialog';
import CommentDialog from '../../components/commetDialog';

// ─── Système de design (aligné sur le tableau de bord) ───
const T = {
  ink: '#0E2733',
  canvas: '#F4F6F5',
  surface: '#FFFFFF',
  line: '#E2E6EA',
  ledger: '#EEF1F3',
  text: '#16202B',
  muted: '#6A7785',
  faint: '#9AA6B2',
  accent: '#0E7C86',
  accentDark: '#0a5d65',
  pos: '#1F8A70',
  warn: '#B5791A',
  neg: '#BE3A2F',
  accW: '#E2F0F1',
};
const MONO = 'ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace';
const NUM = { fontVariantNumeric: 'tabular-nums', fontFeatureSettings: '"tnum"' };
const CARD_SHADOW = '0 1px 2px rgba(16,39,51,.04), 0 8px 24px -16px rgba(16,39,51,.18)';
const panelSx = {
  border: `1px solid ${T.line}`,
  borderRadius: '16px',
  bgcolor: T.surface,
  boxShadow: CARD_SHADOW,
  overflow: 'hidden',
};
const fieldLabelSx = {
  fontSize: '10px',
  textTransform: 'uppercase',
  letterSpacing: '.4px',
  fontWeight: 600,
  color: T.faint,
  mb: 0.5,
  display: 'block',
};

const GestionRevisionCycles = () => {
  const axiosPrivate = useAxiosPrivate();
  const { auth } = useAuth();
  const decoded = auth?.accessToken ? jwtDecode(auth.accessToken) : undefined;
  const compteName = decoded?.UserInfo?.compte || 'Espace Client';
  const compteId = decoded?.UserInfo?.compteId || null;

  const [activeCycle, setActiveCycle] = useState("etat d'avancement");
  const [activeTab, setActiveTab] = useState(0);
  const [answers, setAnswers] = useState({});
  const [validatedRows, setValidatedRows] = useState({});
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState(null);

  const [selectedExerciceId, setSelectedExerciceId] = useState('');
  const [selectedPeriodeId, setSelectedPeriodeId] = useState('');
  const [loading, setLoading] = useState(false);

  const [revisionCycles, setRevisionCycles] = useState([]);
  const [cyclesLoading, setCyclesLoading] = useState(false);
  const [cycleItems, setCycleItems] = useState([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [revisions, setRevisions] = useState({}); // Stocke les révisions par code
  const [commentText, setCommentText] = useState('');
  const [savingComment, setSavingComment] = useState(false);
  const [commentairesSynthese, setCommentairesSynthese] = useState([]);
  const [loadingCommentaires, setLoadingCommentaires] = useState(false);
  const [nouveauCommentaire, setNouveauCommentaire] = useState('');
  const [savingNouveauCommentaire, setSavingNouveauCommentaire] = useState(false);
  const [editingCommentaire, setEditingCommentaire] = useState(null);
  const [editCommentaireText, setEditCommentaireText] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [synthese, setSynthese] = useState({ progression: 0, points: 0 });
  const [loadingSynthese, setLoadingSynthese] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [planComptable, setPlanComptable] = useState([]);
  const [loadingPlanComptable, setLoadingPlanComptable] = useState(false);
  const [compteAssocieSelection, setCompteAssocieSelection] = useState([]);
  const [compteAssocieSaved, setCompteAssocieSaved] = useState([]);
  const [compteAssocieInput, setCompteAssocieInput] = useState('');
  const [savingCompteAssocie, setSavingCompteAssocie] = useState(false);
  const [ecrituresJournal, setEcrituresJournal] = useState([]);
  const [loadingEcritures, setLoadingEcritures] = useState(false);
  const nouveauCommentaireRef = useRef('');
  const [nouveauCommentaireKey, setNouveauCommentaireKey] = useState(0);
  const [confirmValidationOpen, setConfirmValidationOpen] = useState(false);
  const [confirmValidationTargetId, setConfirmValidationTargetId] = useState(null);
  const [confirmValidationLoading, setConfirmValidationLoading] = useState(false);

  const [confirmDeleteCommentOpen, setConfirmDeleteCommentOpen] = useState(false);
  const [confirmDeleteCommentTargetId, setConfirmDeleteCommentTargetId] = useState(null);
  const [confirmDeleteCommentLoading, setConfirmDeleteCommentLoading] = useState(false);

  const [newSyntheseCommentDialogOpen, setNewSyntheseCommentDialogOpen] = useState(false);

  const K_THEME = {
    navy: T.ink,
    cyan: T.accent,
    slate: T.muted,
    border: T.line,
    success: T.pos,
    warning: T.warn,
    error: T.neg,
    bg: T.canvas,
    radius: '10px'
  };

  const getIds = useCallback(() => {
    const id_compte = parseInt(compteId) || 0;
    const id_dossier = parseInt(sessionStorage.getItem('fileId')) || 0;
    return { id_compte, id_dossier };
  }, [compteId]);

  const fetchValidationsAnalytique = useCallback(async () => {
    if (!selectedExerciceId || !selectedPeriodeId || activeCycle === "etat d'avancement" || !activeCycle) {
      setValidatedRows({});
      return;
    }

    try {
      const { id_compte, id_dossier } = getIds();
      const res = await axiosPrivate.get(
        `/administration/dossierRevision/validations-analytique/${id_compte}/${id_dossier}/${selectedExerciceId}/${selectedPeriodeId}`
      );

      const validations = res?.data?.state ? (res?.data?.validations || {}) : {};

      // Normaliser en map boolean: { [id_jnl]: true/false }
      const normalized = Object.keys(validations).reduce((acc, key) => {
        acc[key] = Boolean(validations[key]?.valider);
        return acc;
      }, {});

      setValidatedRows(normalized);
    } catch (e) {
      console.error('Erreur chargement validations analytique:', e);
      setValidatedRows({});
    }
  }, [activeCycle, axiosPrivate, getIds, selectedExerciceId, selectedPeriodeId]);

  useEffect(() => {
    fetchValidationsAnalytique();
  }, [fetchValidationsAnalytique]);

  const handleValidation = async (idJnl) => {
    if (!idJnl) return;

    try {
      const { id_compte, id_dossier } = getIds();

      await axiosPrivate.post('/administration/dossierRevision/validations-analytique/toggle', {
        id_compte,
        id_dossier,
        id_exercice: selectedExerciceId,
        id_periode: selectedPeriodeId,
        id_jnl: idJnl
      });

      setValidatedRows(prev => ({
        ...prev,
        [String(idJnl)]: !prev[String(idJnl)]
      }));
    } catch (e) {
      console.error('Erreur sauvegarde validation analytique:', e);
    }
  };

  const handleOpenConfirmValidation = (idJnl) => {
    if (!idJnl) return;
    setConfirmValidationTargetId(String(idJnl));
    setConfirmValidationOpen(true);
  };

  const handleCloseConfirmValidation = () => {
    if (confirmValidationLoading) return;
    setConfirmValidationOpen(false);
    setConfirmValidationTargetId(null);
  };

  const handleConfirmValidation = async () => {
    if (!confirmValidationTargetId) return;
    try {
      setConfirmValidationLoading(true);
      await handleValidation(confirmValidationTargetId);
      setConfirmValidationOpen(false);
      setConfirmValidationTargetId(null);
    } finally {
      setConfirmValidationLoading(false);
    }
  };

  // Sauvegarder le statut (OUI/NON/NA)
  const handleStatutChange = async (code, statut) => {
    const id_compte = parseInt(compteId) || 0;
    const id_dossier = parseInt(sessionStorage.getItem('fileId')) || 1;
    const id_exercice = parseInt(selectedExerciceId) || 0;
    const id_periode = parseInt(selectedPeriodeId) || 0;

    if (!id_exercice || !id_periode) {
      console.warn('Exercice ou période non sélectionné');
      return;
    }

    // Mettre à jour l'UI immédiatement
    setRevisions(prev => ({
      ...prev,
      [code]: { ...prev[code], statut }
    }));

    try {
      await axiosPrivate.post('/administration/dossierRevision/statut', {
        id_compte,
        id_dossier,
        id_exercice,
        id_periode,
        id_code: code,
        statut
      });
    } catch (e) {
      console.error('Erreur sauvegarde statut:', e);
    }
  };

  // Sauvegarder le commentaire
  const handleSaveComment = async (text) => {
    const commentaireRaw = String(text || '');
    const commentaire = commentaireRaw.trim();
    if (!selectedPoint) return;

    const id_compte = parseInt(compteId) || 0;
    const id_dossier = parseInt(sessionStorage.getItem('fileId')) || 1;
    const id_exercice = parseInt(selectedExerciceId) || 0;
    const id_periode = parseInt(selectedPeriodeId) || 0;

    if (!id_exercice || !id_periode) {
      console.warn('Exercice ou période non sélectionné');
      return;
    }

    // Trouver le code correspondant au questionnaire
    const item = cycleItems.find(i => i.questionnaire === selectedPoint);
    if (!item) return;

    const previousComment = String(revisions?.[item.code]?.commentaire || '').trim();
    if (!commentaire && !previousComment) {
      setDrawerOpen(false);
      setCommentText('');
      return;
    }

    setSavingComment(true);
    try {
      await axiosPrivate.post('/administration/dossierRevision/commentaire', {
        id_compte,
        id_dossier,
        id_exercice,
        id_periode,
        id_code: item.code,
        commentaire: commentaire
      });

      // Mettre à jour l'état local
      setRevisions(prev => ({
        ...prev,
        [item.code]: { ...prev[item.code], commentaire: commentaire }
      }));

      setDrawerOpen(false);
      setCommentText('');
    } catch (e) {
      console.error('Erreur sauvegarde commentaire:', e);
    } finally {
      setSavingComment(false);
    }
  };

  const openCommentDrawer = (questionnaire) => {
    const item = cycleItems.find(i => i.questionnaire === questionnaire);
    if (item) {
      setSelectedPoint(questionnaire);
      setCommentText(revisions[item.code]?.commentaire || '');
      setDrawerOpen(true);
    }
  };

  const handleCloseQuestionnaireCommentDialog = () => {
    if (savingComment) return;
    setDrawerOpen(false);
  };

  // Sauvegarder un nouveau commentaire de synthèse
  const handleSaveNouveauCommentaire = async () => {
    const texte = String(nouveauCommentaireRef.current || '').trim();
    if (!texte) return;

    const id_compte = parseInt(compteId) || 0;
    const id_dossier = parseInt(sessionStorage.getItem('fileId')) || 1;
    const id_exercice = parseInt(selectedExerciceId) || 0;
    const id_periode = parseInt(selectedPeriodeId) || 0;

    if (!id_exercice || !id_periode || activeCycle === "etat d'avancement") {
      console.warn('Exercice, période ou cycle non sélectionné');
      return;
    }

    setSavingNouveauCommentaire(true);
    try {
      const res = await axiosPrivate.post('/administration/dossierRevision/commentaires', {
        id_compte,
        id_dossier,
        id_exercice,
        id_periode,
        cycle: activeCycle.toUpperCase(),
        commentaire: texte
      });

      if (res.data.state) {
        setCommentairesSynthese(prev => [res.data.commentaire, ...prev]);

        nouveauCommentaireRef.current = '';
        setNouveauCommentaireKey((k) => k + 1);

        // (optionnel) tu peux le garder ou le supprimer plus tard
        setNouveauCommentaire('');
      }
    } catch (e) {
      console.error('Erreur sauvegarde commentaire synthèse:', e);
    } finally {
      setSavingNouveauCommentaire(false);
    }
  };

  const handleOpenNewSyntheseCommentDialog = () => {
    setNewSyntheseCommentDialogOpen(true);
  };

  const handleCloseNewSyntheseCommentDialog = () => {
    if (savingNouveauCommentaire) return;
    setNewSyntheseCommentDialogOpen(false);
  };

  const handleSaveNewSyntheseCommentFromDialog = async (text) => {
    nouveauCommentaireRef.current = text;
    await handleSaveNouveauCommentaire();
    setNewSyntheseCommentDialogOpen(false);
  };

  // Démarrer l'édition d'un commentaire
  const handleStartEdit = (comm) => {
    setEditingCommentaire(comm.id);
    setEditCommentaireText(comm.commentaire);
  };

  // Sauvegarder la modification d'un commentaire
  const handleSaveEdit = async () => {
    if (!editCommentaireText.trim() || !editingCommentaire) return;

    setSavingEdit(true);
    try {
      const res = await axiosPrivate.put(`/administration/dossierRevision/commentaires/${editingCommentaire}`, {
        commentaire: editCommentaireText
      });

      if (res.data.state) {
        // Mettre à jour le commentaire dans la liste
        setCommentairesSynthese(prev => prev.map(c =>
          c.id === editingCommentaire
            ? { ...c, commentaire: editCommentaireText, updatedAt: new Date().toISOString() }
            : c
        ));
        setEditingCommentaire(null);
        setEditCommentaireText('');
      }
    } catch (e) {
      console.error('Erreur modification commentaire:', e);
    } finally {
      setSavingEdit(false);
    }
  };

  // Annuler l'édition
  const handleCancelEdit = () => {
    setEditingCommentaire(null);
    setEditCommentaireText('');
  };

  // Supprimer un commentaire
  const handleDeleteCommentaire = async (id) => {
    setDeletingId(id);
    try {
      const res = await axiosPrivate.delete(`/administration/dossierRevision/commentaires/${id}`);

      if (res.data.state) {
        setCommentairesSynthese(prev => prev.filter(c => c.id !== id));
      }
    } catch (e) {
      console.error('Erreur suppression commentaire:', e);
    } finally {
      setDeletingId(null);
    }
  };

  const handleAskDeleteCommentaire = (id) => {
    if (!id) return;
    setConfirmDeleteCommentTargetId(id);
    setConfirmDeleteCommentOpen(true);
  };

  const handleCloseConfirmDeleteCommentaire = () => {
    if (confirmDeleteCommentLoading) return;
    setConfirmDeleteCommentOpen(false);
    setConfirmDeleteCommentTargetId(null);
  };

  const handleConfirmDeleteCommentaire = async () => {
    if (!confirmDeleteCommentTargetId) return;

    try {
      setConfirmDeleteCommentLoading(true);
      await handleDeleteCommentaire(confirmDeleteCommentTargetId);
      setConfirmDeleteCommentOpen(false);
      setConfirmDeleteCommentTargetId(null);
    } finally {
      setConfirmDeleteCommentLoading(false);
    }
  };

  const handleChangeExercice = (exerciceId) => {
    setSelectedExerciceId(exerciceId);
  };

  const handleChangePeriode = (periodeId) => {
    setSelectedPeriodeId(periodeId);
  };

  useEffect(() => {
    let mounted = true;

    const fetchCycles = async () => {
      try {
        setCyclesLoading(true);
        const res = await axiosPrivate.get('/administration/revision/cycles');
        const cycles = res?.data?.cycles;
        if (mounted) {
          setRevisionCycles(Array.isArray(cycles) ? cycles : []);
        }
      } catch (e) {
        if (mounted) {
          setRevisionCycles([]);
        }
      } finally {
        if (mounted) {
          setCyclesLoading(false);
        }
      }
    };

    fetchCycles();
    return () => {
      mounted = false;
    };
  }, [axiosPrivate]);

  useEffect(() => {
    let mounted = true;

    const fetchItems = async () => {
      if (activeCycle === "etat d'avancement" || !activeCycle) {
        setCycleItems([]);
        return;
      }
      try {
        setItemsLoading(true);
        const cycleUpper = activeCycle.toUpperCase();
        const res = await axiosPrivate.get(`/administration/revision/cycles/${encodeURIComponent(cycleUpper)}/items`);
        const items = res?.data?.items;
        if (mounted) {
          setCycleItems(Array.isArray(items) ? items : []);
        }
      } catch (e) {
        if (mounted) {
          setCycleItems([]);
        }
      } finally {
        if (mounted) {
          setItemsLoading(false);
        }
      }
    };

    fetchItems();
    return () => {
      mounted = false;
    };
  }, [activeCycle, axiosPrivate]);

  // Charger les révisions existantes quand le contexte change
  useEffect(() => {
    let mounted = true;

    const fetchRevisions = async () => {
      if (!selectedExerciceId || !selectedPeriodeId) {
        setRevisions({});
        return;
      }

      const id_compte = parseInt(compteId) || 0;
      const id_dossier = parseInt(sessionStorage.getItem('fileId')) || 1;

      try {
        const res = await axiosPrivate.get(
          `/administration/dossierRevision/${id_compte}/${id_dossier}/${selectedExerciceId}/${selectedPeriodeId}`
        );
        const revs = res?.data?.revisions || [];

        // Transformer en objet indexé par id_code
        const revsByCode = {};
        revs.forEach(r => {
          revsByCode[r.id_code] = r;
        });

        if (mounted) {
          setRevisions(revsByCode);
        }
      } catch (e) {
        if (mounted) {
          setRevisions({});
        }
      }
    };

    fetchRevisions();
    return () => {
      mounted = false;
    };
  }, [selectedExerciceId, selectedPeriodeId, axiosPrivate]);

  // Charger les commentaires de synthèse quand le cycle ou le contexte change
  useEffect(() => {
    let mounted = true;

    const fetchCommentairesSynthese = async () => {
      if (!selectedExerciceId || !selectedPeriodeId || activeCycle === "etat d'avancement" || !activeCycle) {
        setCommentairesSynthese([]);
        return;
      }

      const id_compte = parseInt(compteId) || 0;
      const id_dossier = parseInt(sessionStorage.getItem('fileId')) || 1;
      const cycle = activeCycle.toUpperCase();

      try {
        setLoadingCommentaires(true);
        const res = await axiosPrivate.get(
          `/administration/dossierRevision/commentaires/${id_compte}/${id_dossier}/${selectedExerciceId}/${selectedPeriodeId}/${cycle}`
        );
        const commentaires = res?.data?.commentaires || [];

        if (mounted) {
          setCommentairesSynthese(commentaires);
        }
      } catch (e) {
        if (mounted) {
          setCommentairesSynthese([]);
        }
      } finally {
        if (mounted) {
          setLoadingCommentaires(false);
        }
      }
    };

    fetchCommentairesSynthese();
    return () => {
      mounted = false;
    };
  }, [activeCycle, selectedExerciceId, selectedPeriodeId, axiosPrivate]);

  // Charger la synthèse (progression et points de vigilance) quand le cycle change
  useEffect(() => {
    let mounted = true;

    const fetchSynthese = async () => {
      if (!selectedExerciceId || !selectedPeriodeId || activeCycle === "etat d'avancement" || !activeCycle) {
        setSynthese({ progression: 0, points: 0 });
        return;
      }

      const id_compte = parseInt(compteId) || 0;
      const id_dossier = parseInt(sessionStorage.getItem('fileId')) || 1;
      const cycle = activeCycle.toUpperCase();

      try {
        setLoadingSynthese(true);
        const res = await axiosPrivate.get(
          `/administration/dossierRevision/synthese/${id_compte}/${id_dossier}/${selectedExerciceId}/${selectedPeriodeId}/${cycle}`
        );
        const data = res?.data?.synthese;

        if (mounted && data) {
          setSynthese({
            progression: data.progression || 0,
            points: data.points || 0
          });
        }
      } catch (e) {
        if (mounted) {
          setSynthese({ progression: 0, points: 0 });
        }
      } finally {
        if (mounted) {
          setLoadingSynthese(false);
        }
      }
    };
    fetchSynthese();
    return () => {
      mounted = false;
    };
  }, [activeCycle, selectedExerciceId, selectedPeriodeId, axiosPrivate, revisions]);

  useEffect(() => {
    let mounted = true;

    const fetchPlanComptable = async () => {
      const id_compte = parseInt(compteId) || 0;
      const fileId = parseInt(sessionStorage.getItem('fileId')) || 0;

      if (!id_compte || !fileId) {
        if (mounted) {
          setPlanComptable([]);
        }
        return;
      }

      try {
        setLoadingPlanComptable(true);
        const res = await axiosPrivate.get(`/paramPlanComptable/PcIdLibelle/${id_compte}/${fileId}`);
        const liste = res?.data?.state ? res?.data?.liste : [];

        if (mounted) {
          setPlanComptable(Array.isArray(liste) ? liste : []);
        }
      } catch (e) {
        if (mounted) {
          setPlanComptable([]);
        }
      } finally {
        if (mounted) {
          setLoadingPlanComptable(false);
        }
      }
    };

    fetchPlanComptable();
    return () => {
      mounted = false;
    };
  }, [axiosPrivate]);

  useEffect(() => {
    let mounted = true;

    const fetchCompteAssocie = async () => {
      if (!selectedExerciceId || !selectedPeriodeId || activeCycle === "etat d'avancement" || !activeCycle) {
        setCompteAssocieSelection([]);
        setCompteAssocieSaved([]);
        return;
      }

      const id_compte = parseInt(compteId) || 0;
      const id_dossier = parseInt(sessionStorage.getItem('fileId')) || 1;
      const cycle = activeCycle.toUpperCase();

      try {
        const res = await axiosPrivate.get(
          `/administration/dossierRevision/compte-associe/${id_compte}/${id_dossier}/${selectedExerciceId}/${selectedPeriodeId}/${cycle}`
        );
        const raw = res?.data?.compte_associe;
        const parsed = raw
          ? String(raw)
            .split(';')
            .map(s => s.trim())
            .filter(Boolean)
          : [];

        if (mounted) {
          setCompteAssocieSelection(parsed);
          setCompteAssocieSaved(parsed);
          setCompteAssocieInput(parsed.join(';'));
        }
      } catch (e) {
        if (mounted) {
          setCompteAssocieSelection([]);
          setCompteAssocieSaved([]);
          setCompteAssocieInput('');
        }
      }
    };

    fetchCompteAssocie();
    return () => {
      mounted = false;
    };
  }, [activeCycle, selectedExerciceId, selectedPeriodeId, axiosPrivate]);

  useEffect(() => {
    let mounted = true;

    const fetchEcrituresJournal = async () => {
      if (!selectedExerciceId || !selectedPeriodeId || activeCycle === "etat d'avancement" || !activeCycle) {
        setEcrituresJournal([]);
        return;
      }

      const id_compte = parseInt(compteId) || 0;
      const id_dossier = parseInt(sessionStorage.getItem('fileId')) || 0;
      console.log('[DEBUG] compteId from JWT:', compteId, '-> id_compte:', id_compte, '| id_dossier:', id_dossier, '| exercice:', selectedExerciceId, '| periode:', selectedPeriodeId);

      // Si pas de comptes associés sélectionnés, on ne charge rien
      if (!compteAssocieSaved || compteAssocieSaved.length === 0) {
        setEcrituresJournal([]);
        return;
      }

      try {
        setLoadingEcritures(true);

        const comptesQuery = compteAssocieSaved.join(',');
        const url = `/administration/dossierRevision/ecritures/${id_compte}/${id_dossier}/${selectedExerciceId}/${selectedPeriodeId}?comptes=${comptesQuery}`;
        console.log('[DEBUG] fetchEcrituresJournal URL:', url, '| comptes:', compteAssocieSaved);

        const res = await axiosPrivate.get(url);

        console.log('[DEBUG] fetchEcrituresJournal response:', res?.data);
        const ecritures = res?.data?.ecritures || [];
        console.log('[DEBUG] ecritures count:', ecritures.length, ecritures.slice(0, 2));

        if (mounted) {
          setEcrituresJournal(ecritures);
        }
      } catch (e) {
        if (mounted) {
          console.error('Erreur chargement écritures journal:', e);
          setEcrituresJournal([]);
        }
      } finally {
        if (mounted) {
          setLoadingEcritures(false);
        }
      }
    };

    fetchEcrituresJournal();
    return () => {
      mounted = false;
    };
  }, [activeCycle, selectedExerciceId, selectedPeriodeId, compteAssocieSaved, axiosPrivate]);

  const handleSaveCompteAssocie = async () => {
    const id_compte = parseInt(compteId) || 0;
    const id_dossier = parseInt(sessionStorage.getItem('fileId')) || 1;
    const id_exercice = parseInt(selectedExerciceId) || 0;
    const id_periode = parseInt(selectedPeriodeId) || 0;

    if (!id_exercice || !id_periode || activeCycle === "etat d'avancement") {
      console.warn('Exercice, période ou cycle non sélectionné');
      toast.error('Veuillez sélectionner un exercice et une période');
      return;
    }

    const payloadValue = compteAssocieSelection.length ? compteAssocieSelection.join(';') : null;
    if (payloadValue !== null && String(payloadValue).length > 1000) {
      console.warn('compte_associe trop long (max 1000 caractères)');
      toast.error('La liste des comptes est trop longue');
      return;
    }

    setSavingCompteAssocie(true);
    try {
      const res = await axiosPrivate.post('/administration/dossierRevision/compte-associe', {
        id_compte,
        id_dossier,
        id_exercice,
        id_periode,
        cycle: activeCycle.toUpperCase(),
        compte_associe: payloadValue
      });

      if (res.status === 200) {
        const raw = res?.data?.compte_associe;
        const parsed = raw
          ? String(raw)
            .split(';')
            .map(s => s.trim())
            .filter(Boolean)
          : [];

        setCompteAssocieSaved(parsed);
        toast.success('Comptes associés sauvegardés avec succès');
      } else {
        console.error('Erreur sauvegarde compte_associe:', res);
        toast.error('Erreur lors de la sauvegarde des comptes associés');
      }
    } catch (e) {
      console.error('Erreur sauvegarde compte_associe:', e);
      toast.error('Erreur lors de la sauvegarde des comptes associés');
    } finally {
      setSavingCompteAssocie(false);
    }
  };

  const normalizedCycles = useMemo(() => {
    return (revisionCycles || [])
      .filter(Boolean)
      .map((c) => String(c).trim())
      .filter((c) => c.length > 0);
  }, [revisionCycles]);

  const menuCycles = useMemo(() => {
    return ["ETAT D'AVANCEMENT", ...normalizedCycles];
  }, [normalizedCycles]);


  const questionnaireStats = useMemo(() => {
    const total = Array.isArray(cycleItems) ? cycleItems.length : 0;

    const done = (Array.isArray(cycleItems) ? cycleItems : []).reduce((acc, item) => {
      const code = item?.code;
      const statut = code ? revisions?.[code]?.statut : null;
      return acc + (statut === 'OUI' || statut === 'NA' ? 1 : 0);
    }, 0);

    const percent = total > 0 ? Math.round((done / total) * 100) : 0;

    return { total, done, percent };
  }, [cycleItems, revisions]);

  const revueAnalytiqueStats = useMemo(() => {
    const list = Array.isArray(ecrituresJournal) ? ecrituresJournal : [];
    const total = list.length;

    const verified = list.reduce((acc, row) => {
      const id = String(row?.id);
      return acc + (validatedRows?.[id] ? 1 : 0);
    }, 0);

    const percent = total > 0 ? Math.round((verified / total) * 100) : 0;

    return { total, verified, percent };
  }, [ecrituresJournal, validatedRows]);

  const historiqueNotes = () => {
    if (loadingCommentaires) {
      return (
        <Typography sx={{ fontSize: '0.75rem', color: K_THEME.slate, textAlign: 'center', py: 2 }}>
          Chargement...
        </Typography>
      );
    }

    if (!commentairesSynthese || commentairesSynthese.length === 0) {
      return (
        <Typography sx={{ fontSize: '0.75rem', color: K_THEME.slate, textAlign: 'center', py: 2 }}>
          Aucun commentaire pour ce cycle
        </Typography>
      );
    }

    return (
      <Stack spacing={2} sx={{ mb: 1 }}>
        {commentairesSynthese.map((comm, idx) => (
          <Box
            key={comm.id || idx}
            sx={{
              p: 1.5,
              bgcolor: '#F8FAFC',
              borderRadius: '8px',
              border: `1px solid ${K_THEME.border}`,
              position: 'relative'
            }}
          >
            <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
              <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, color: K_THEME.cyan }}>
                RÉVISEUR
              </Typography>
              <Typography sx={{ fontSize: '0.65rem', color: '#94A3B8' }}>
                {comm?.createdAt ? new Date(comm.createdAt).toLocaleDateString('fr-FR') : ''}
              </Typography>
            </Stack>

            {editingCommentaire === comm.id ? (
              <Box sx={{ pr: 8 }}>
                <TextField
                  multiline
                  rows={2}
                  fullWidth
                  value={editCommentaireText}
                  onChange={(e) => setEditCommentaireText(e.target.value)}
                  sx={{ '& .MuiOutlinedInput-root': { fontSize: '0.75rem' } }}
                />
              </Box>
            ) : (
              <Typography sx={{ fontSize: '0.75rem', color: '#475569', lineHeight: 1.4, pr: 8 }}>
                {comm.commentaire}
              </Typography>
            )}

            <Stack direction="row" sx={{ position: 'absolute', bottom: 6, right: 6 }}>
              {editingCommentaire === comm.id ? (
                <>
                  <IconButton size="small" onClick={handleCancelEdit} disabled={savingEdit} sx={{ bgcolor: '#FEF2F2' }}>
                    <CloseOutlined sx={{ fontSize: '0.9rem', color: '#EF4444' }} />
                  </IconButton>
                  <IconButton
                    size="small"
                    sx={{ bgcolor: '#e6fff5ff' }}
                    onClick={handleSaveEdit}
                    disabled={savingEdit || !editCommentaireText.trim()}
                  >
                    <CheckOutlined sx={{ fontSize: '0.9rem', color: '#10B981' }} />
                  </IconButton>
                </>
              ) : (
                <>
                  <IconButton size="small" onClick={() => handleStartEdit(comm)} disabled={deletingId === comm.id} sx={{ bgcolor: '#EEF2FF', mr: 1 }} >
                    <EditOutlined sx={{ fontSize: '0.9rem', color: '#6366F1' }} />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleAskDeleteCommentaire(comm.id)} disabled={deletingId === comm.id} sx={{ bgcolor: '#FEF2F2' }} >
                    <DeleteOutline sx={{ fontSize: '0.9rem', color: '#EF4444' }} />
                  </IconButton>
                </>
              )}
            </Stack>
          </Box>
        ))}
      </Stack>
    );
  };

  // --- RENDU SYNTHÈSE (STYLE ÉPURÉ) ---
  const RenderSynthese = () => (

    <Box sx={{ p: 3, overflowY: 'auto' }}>
      <Grid container spacing={2.5}>
        <Grid item xs={12} md={7}>
          <Paper elevation={0} sx={{ ...panelSx }}>
            <Box sx={{ px: 2.5, py: 1.5, borderBottom: `1px solid ${T.ledger}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography sx={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', color: T.muted }}>
                Indicateurs de complétude
              </Typography>
              <Box component="span" sx={{ fontSize: '10px', fontWeight: 700, color: T.accent, bgcolor: T.accW, px: 1, py: '3px', borderRadius: '5px' }}>En cours</Box>
            </Box>
            <Box sx={{ p: 3 }}>
              <Stack spacing={3}>
                <Box>
                  <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                    <Typography sx={{ fontSize: '13px', fontWeight: 600, color: T.text }}>Questionnaires validés</Typography>
                    <Typography sx={{ ...NUM, fontSize: '13px', fontWeight: 700, color: T.pos }}>
                      {itemsLoading ? '…' : `${questionnaireStats.done} / ${questionnaireStats.total}`}
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={itemsLoading ? 0 : questionnaireStats.percent}
                    sx={{ height: 6, borderRadius: 99, bgcolor: T.ledger, '& .MuiLinearProgress-bar': { bgcolor: T.pos, borderRadius: 99 } }}
                  />
                </Box>
                <Box>
                  <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                    <Typography sx={{ fontSize: '13px', fontWeight: 600, color: T.text }}>Justificatifs de revue analytique</Typography>
                    <Typography sx={{ ...NUM, fontSize: '13px', fontWeight: 700, color: T.accent }}>
                      {loadingEcritures ? '…' : `${revueAnalytiqueStats.verified} / ${revueAnalytiqueStats.total}`}
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={loadingEcritures ? 0 : revueAnalytiqueStats.percent}
                    sx={{ height: 6, borderRadius: 99, bgcolor: T.ledger, '& .MuiLinearProgress-bar': { bgcolor: T.accent, borderRadius: 99 } }}
                  />
                </Box>
              </Stack>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={5}>
          <Paper elevation={0} sx={{ ...panelSx, position: 'relative' }}>
            <Box
              sx={{ px: 2.5, py: 1.5, borderBottom: `1px solid ${T.ledger}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <Typography sx={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', color: T.muted }}>
                Notes &amp; observations
              </Typography>

              <Tooltip title="Ajouter un commentaire">
                <span>
                  <IconButton
                    size="small"
                    onClick={handleOpenNewSyntheseCommentDialog}
                    disabled={savingNouveauCommentaire}
                    sx={{ color: T.accent, bgcolor: T.accW, '&:hover': { bgcolor: '#D5E9EA' } }}
                  >
                    <Comment fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            </Box>

            {/* Historique des notes (vraies données) */}
            <Box sx={{ px: 2, py: 2, maxHeight: 300, overflowY: 'auto' }}>
              {historiqueNotes()}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );

  // --- RENDU QUESTIONNAIRE ---
  const RenderQuestionnaire = () => {
    const columns = [
      {
        field: 'questionnaire',
        headerName: 'QUESTION DE CONTRÔLE',
        flex: 1,
        renderCell: (params) =>
          <Typography sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
            {params.value}
          </Typography>
      },
      {
        field: 'statut',
        headerName: 'VALIDATION',
        width: 220,
        renderCell: (params) => {
          const code = params.row.code;
          return (
            <ToggleButtonGroup
              value={revisions[code]?.statut || ''}
              exclusive
              size="small"
              onChange={(e, v) => {
                if (v !== null) {
                  handleStatutChange(code, v);
                }
              }}
              sx={{ height: 28 }}
            >
              <ToggleButton value="OUI" sx={{ fontSize: '0.6rem', fontWeight: 800, px: 1.5, '&.Mui-selected': { bgcolor: '#ECFDF5', color: '#10B981' } }}>OUI</ToggleButton>
              <ToggleButton value="NON" sx={{ fontSize: '0.6rem', fontWeight: 800, px: 1.5, '&.Mui-selected': { bgcolor: '#FEF2F2', color: '#EF4444' } }}>NON</ToggleButton>
              <ToggleButton value="NA" sx={{ fontSize: '0.6rem', fontWeight: 800, px: 1.5, '&.Mui-selected': { bgcolor: '#FEFCE8', color: '#000000' } }}>N/A</ToggleButton>
            </ToggleButtonGroup>
          )
        }
      },
      {
        field: 'note',
        headerName: 'NOTE',
        width: 120,
        align: 'center',
        headerAlign: 'center',
        sortable: false,
        renderCell: (params) => {
          const code = params.row.code;
          const hasComment = !!revisions[code]?.commentaire;

          return (
            <IconButton
              size="small"
              onClick={() => openCommentDrawer(params.row.questionnaire)}
            >
              <Badge
                color="error"
                variant="dot"
                invisible={!hasComment}
              >
                <Comment sx={{ fontSize: '1.1rem' }} />
              </Badge>
            </IconButton>
          );
        }
      }
    ];

    const rows = cycleItems.map((item, index) => ({
      id: item.code || index,
      ...item
    }));

    return (
      // <Box sx={{ p: 3, minHeight: 0, minWidth: 0, flexDirection: 'column', overflow: 'hidden' }}>
      //   <Paper variant="outlined" sx={{  minHeight: 0, borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      //     <DataGrid
      //       rows={rows}
      //       columns={columns}
      //       density="compact"
      //       disableSelectionOnClick
      //       sx={{ ...dataGridStyle, minHeight: 0 }}
      //     />
      //   </Paper>

      // </Box>

      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflow: 'hidden',
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          p: 2      
        }}
      >
        <DataGrid
          rows={rows}
          columns={columns}
          density="compact"
          disableSelectionOnClick
          sx={{
            border: 'none',
            flex: 1,
            ...NUM,
            fontSize: '12.5px',
            '& .MuiDataGrid-columnHeaders': {
              bgcolor: T.ledger,
              borderBottom: `1px solid ${T.line}`,

              '& .MuiDataGrid-columnHeaderTitle': {
                fontSize: '11px',
                fontWeight: 700,
                color: T.muted,
                letterSpacing: '.3px',
              }
            },

            '& .MuiDataGrid-cell': {
              borderBottom: '1px solid #F1F4F6',
              color: T.text,
            },

            '& .MuiDataGrid-virtualScroller': {
              bgcolor: T.surface,
            },

            '& .MuiDataGrid-row:hover': { bgcolor: '#FAFBFB' },
          }}
        />
      </Box>
    );
  };

  // --- RENDU REVUE ANALYTIQUE ---
  const RenderRevue = () => {
    const columns = [
      {
        field: 'date',
        headerName: 'DATE',
        width: 100,
        renderCell: (params) => (
          <span style={{ fontSize: '0.7rem' }}>
            {params.value || '-'}
          </span>
        )
      },
      {
        field: 'compte',
        headerName: 'COMPTE',
        width: 100,
        renderCell: (params) =>
          <Typography sx={{ fontWeight: 800, fontSize: '0.7rem', color: '#6366F1' }}>
            {params.value}
          </Typography>
      },
      {
        field: 'libelle',
        headerName: 'LIBELLÉ',
        flex: 1,
        renderCell: (params) => (
          <span style={{ fontSize: '0.7rem' }}>
            {params.value || '-'}
          </span>
        )
      },
      {
        field: 'debit',
        headerName: 'DÉBIT',
        width: 120,
        align: 'right',
        renderCell: (params) => (
          <span style={{ fontSize: '0.7rem' }}>
            {params.value}
          </span>
        )
      },
      {
        field: 'credit',
        headerName: 'CRÉDIT',
        width: 120,
        align: 'right',
        renderCell: (params) => (
          <span style={{
            fontSize: '0.7rem',
            fontWeight: 900
          }}>
            {params.value}
          </span>
        )
      },
      {
        field: 'valide',
        headerName: 'VALIDÉ',
        width: 160,
        align: 'center',
        headerAlign: 'center',
        sortable: false,
        renderCell: (params) => {
          const id = String(params.row.id);

          return (
            <Box
              onClick={() => handleOpenConfirmValidation(id)}
              sx={{
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1,
                px: 1.5,
                py: 0.5,
                borderRadius: '20px',
                border: `1px solid ${validatedRows[id] ? K_THEME.cyan : K_THEME.border
                  }`,
                bgcolor: validatedRows[id]
                  ? alpha(K_THEME.cyan, 0.1)
                  : 'transparent'
              }}
            >
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: validatedRows[id]
                    ? K_THEME.cyan
                    : K_THEME.border
                }}
              />
              <Typography
                sx={{
                  fontSize: '0.55rem',
                  fontWeight: 900,
                  color: validatedRows[id]
                    ? K_THEME.navy
                    : K_THEME.slate
                }}
              >
                {validatedRows[id] ? 'VÉRIFIÉ' : 'À CONTRÔLER'}
              </Typography>
            </Box>
          );
        }
      }
    ];

    const rows = ecrituresJournal.map((ecriture, index) => ({
      id: ecriture.id || index,

      date: ecriture.date_ecriture || ecriture.date || '-',
      compte: ecriture.numero_compte || ecriture.compte || '-',
      libelle: ecriture.libelle || ecriture.label || '-',

      debit: ecriture.montant_debit
        ? Number(ecriture.montant_debit).toFixed(2)
        : '0.00',

      credit: ecriture.montant_credit
        ? Number(ecriture.montant_credit).toFixed(2)
        : '0.00'
    }));

    return (
      // <Box sx={{ p: 3, flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      //   <Paper variant="outlined" sx={{ flex: 1, minHeight: 0, borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      //     <DataGrid
      //       rows={rows}
      //       columns={columns}
      //       loading={loadingEcritures}
      //       density="compact"
      //       disableSelectionOnClick
      //       sx={{ ...dataGridStyle, flex: 1, minHeight: 0 }}
      //       localeText={{
      //         noRowsLabel:
      //           compteAssocieSaved.length === 0
      //             ? 'Aucun compte associé défini. Veuillez saisir des comptes.'
      //             : 'Aucune écriture trouvée pour les comptes associés.'
      //       }}
      //     />
      //   </Paper>
      // </Box>
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflow: 'hidden',
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          p: 2,
          gap: 1.5,
        }}
      >
        {/* Barre : comptes à analyser (pilote le chargement des écritures) + avancement */}
        <Stack direction="row" alignItems="flex-end" spacing={1.5} sx={{ flexShrink: 0, flexWrap: 'wrap', rowGap: 1 }}>
          <Box sx={{ flexGrow: 1, minWidth: 240 }}>
            <Typography sx={fieldLabelSx}>Comptes à analyser</Typography>
            <Stack direction="row" spacing={1}>
              <TextField
                size="small"
                fullWidth
                placeholder="Ex : 401 ; 407 ; 53…"
                value={compteAssocieInput}
                onChange={(e) => {
                  const text = e.target.value;
                  setCompteAssocieInput(text);
                  const cleaned = text.replace(/,/g, ';').split(';').map(s => s.trim()).filter(s => s !== '');
                  setCompteAssocieSelection(cleaned);
                }}
                sx={{ '& .MuiOutlinedInput-root': { height: 34, fontSize: '13px', borderRadius: '8px' }, '& .MuiOutlinedInput-notchedOutline': { borderColor: T.line } }}
              />
              <Button
                variant="contained"
                disableElevation
                onClick={handleSaveCompteAssocie}
                disabled={savingCompteAssocie || compteAssocieSelection.join(';') === compteAssocieSaved.join(';')}
                sx={{ bgcolor: T.accent, color: '#fff', fontSize: '12px', fontWeight: 600, textTransform: 'none', height: 34, minWidth: 84, borderRadius: '8px', '&:hover': { bgcolor: T.accentDark }, '&.Mui-disabled': { bgcolor: T.ledger, color: T.faint } }}
              >
                {savingCompteAssocie ? '…' : 'Charger'}
              </Button>
            </Stack>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography sx={fieldLabelSx}>Vérifiées</Typography>
            <Typography sx={{ ...NUM, fontSize: '18px', fontWeight: 800, color: T.accent, lineHeight: 1 }}>
              {revueAnalytiqueStats.verified} / {revueAnalytiqueStats.total}
            </Typography>
          </Box>
        </Stack>

        <DataGrid
          rows={rows}
          columns={columns}
          loading={loadingEcritures}
          density="compact"
          disableSelectionOnClick
          sx={{
            border: 'none',
            flex: 1,
            ...NUM,
            fontSize: '12.5px',
            '& .MuiDataGrid-columnHeaders': {
              bgcolor: T.ledger,
              borderBottom: `1px solid ${T.line}`,

              '& .MuiDataGrid-columnHeaderTitle': {
                fontSize: '11px',
                fontWeight: 700,
                color: T.muted,
                letterSpacing: '.3px',
              }
            },

            '& .MuiDataGrid-cell': {
              borderBottom: '1px solid #F1F4F6',
              color: T.text,
            },

            '& .MuiDataGrid-virtualScroller': {
              bgcolor: T.surface,
            },

            '& .MuiDataGrid-row:hover': { bgcolor: '#FAFBFB' },
          }}
          localeText={{
            noRowsLabel:
              compteAssocieSaved.length === 0
                ? 'Aucun compte associé défini. Veuillez saisir des comptes.'
                : 'Aucune écriture trouvée pour les comptes associés.'
          }}
        />
      </Box>
    );
  };

  return (
    <Box sx={{
      height: 'calc(100vh - 120px)',
      width: 'calc(100vw - 130px)',
      bgcolor: T.canvas,
      p: 3,
      display: 'flex',
      flexDirection: 'column',
      gap: 2,
      overflow: 'hidden'
    }}>

      <CommentDialog
        open={drawerOpen}
        onClose={handleCloseQuestionnaireCommentDialog}
        onSave={handleSaveComment}
        initialValue={commentText}
        title="Notes de révision"
        placeholder="Saisissez votre commentaire..."
        loading={savingComment}
      />

      <ConfirmActionDialog
        open={confirmValidationOpen}
        onClose={handleCloseConfirmValidation}
        onConfirm={handleConfirmValidation}
        title={validatedRows[String(confirmValidationTargetId)] ? 'Annuler la validation' : 'Confirmer la validation'}
        message={
          validatedRows[String(confirmValidationTargetId)]
            ? 'Voulez-vous vraiment retirer la validation de cette ligne ?'
            : 'Voulez-vous vraiment valider cette ligne ?'
        }
        confirmText={validatedRows[String(confirmValidationTargetId)] ? 'Dévalider' : 'Valider'}
        cancelText="Annuler"
        loading={confirmValidationLoading}
        color={validatedRows[String(confirmValidationTargetId)] ? K_THEME.warning : K_THEME.cyan}
      />

      <ConfirmDeleteDialog
        open={confirmDeleteCommentOpen}
        onClose={handleCloseConfirmDeleteCommentaire}
        onConfirm={handleConfirmDeleteCommentaire}
        title="Confirmer la suppression"
        message="Êtes-vous sûr de vouloir supprimer ce commentaire ? Cette action est irréversible."
        loading={confirmDeleteCommentLoading}
      />

      <CommentDialog
        open={newSyntheseCommentDialogOpen}
        onClose={handleCloseNewSyntheseCommentDialog}
        onSave={handleSaveNewSyntheseCommentFromDialog}
        initialValue=""
        title="Ajouter un commentaire"
        placeholder="Ajouter un nouveau commentaire..."
        loading={savingNouveauCommentaire}
      />

      {/* EN-TÊTE */}
      <Box sx={{ flexShrink: 0 }}>
        <Breadcrumbs
          separator={<NavigateNext sx={{ fontSize: 16, color: T.faint }} />}
          sx={{ mb: 1.5, '& .MuiTypography-root, & a': { fontSize: '12.5px', fontWeight: 600 } }}
        >
          <Link underline="hover" href="/dashboard" sx={{ display: 'flex', alignItems: 'center', color: T.muted }}>
            <DashboardOutlined sx={{ mr: 0.5, fontSize: 16 }} /> Dashboard
          </Link>
          <Typography sx={{ color: T.ink, fontWeight: 700 }}>Dossier de révision</Typography>
        </Breadcrumbs>

        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ md: 'center' }} spacing={1.5}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box sx={{ width: 38, height: 38, flex: 'none', borderRadius: '11px', display: 'grid', placeItems: 'center', color: T.accent, bgcolor: `${T.accent}14`, '& svg': { fontSize: 20 } }}>
              <FolderOpenOutlined />
            </Box>
            <Box>
              <Typography sx={{ fontSize: '18px', fontWeight: 700, color: T.ink, letterSpacing: '.2px', lineHeight: 1.2 }}>
                Dossier de révision
              </Typography>
              <Typography sx={{ fontSize: '12px', color: T.muted, mt: 0.2 }}>
                Suivi des cycles de révision &amp; justificatifs · {compteName}
              </Typography>
            </Box>
          </Stack>
          <Box
            component="span"
            sx={{ ...NUM, fontFamily: MONO, fontSize: '11px', fontWeight: 600, color: T.accent, bgcolor: T.accW, px: 1.25, py: '5px', borderRadius: '6px', alignSelf: { xs: 'flex-start', md: 'center' } }}
          >
            RÉVISION · {activeCycle.toUpperCase()}
          </Box>
        </Stack>

        {/* CONTRÔLE : exercice / période (sous le titre) */}
        <Box sx={{ mt: 2 }}>
          <ExercicePeriodeSelector
            selectedExerciceId={selectedExerciceId}
            selectedPeriodeId={selectedPeriodeId}
            onExerciceChange={handleChangeExercice}
            onPeriodeChange={handleChangePeriode}
            disabled={loading}
            size="small"
            sx={{ mb: 0, ml: 0, border: `1px solid ${T.line}`, borderRadius: '10px', boxShadow: CARD_SHADOW }}
          />
        </Box>
      </Box>

      <Stack direction={"row"} spacing={2} sx={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <Paper
          elevation={0}
          sx={{ ...panelSx, width: 264, flex: 'none', display: 'flex', flexDirection: 'column' }}
        >
          <List sx={{ p: 1, overflowY: 'auto' }}>
            {menuCycles.map((cycleName) => {
              const isAvancement = cycleName === "ETAT D'AVANCEMENT";
              const isActive = activeCycle === cycleName.toLowerCase();
              return (
                <ListItemButton
                  key={cycleName}
                  selected={isActive}
                  onClick={() => { setActiveCycle(cycleName.toLowerCase()); setActiveTab(0); }}
                  sx={{
                    borderRadius: K_THEME.radius, mb: 0.5,
                    ...(isAvancement ? {
                      position: 'sticky',
                      top: 0,
                      zIndex: 2,
                      background: 'radial-gradient(circle at 10% 20%, #16384a 0%, #0E2733 100%)',
                      '& .MuiTypography-root': { color: '#fff' },
                      '& .MuiListItemIcon-root': { color: T.accent },
                      '&:hover': { background: 'radial-gradient(circle at 10% 20%, #1e4a60 0%, #0E2733 100%)' }
                    } : {
                      '&.Mui-selected': { bgcolor: T.accW, borderLeft: `3px solid ${T.accent}` }
                    })
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 32, color: isActive ? T.accent : T.faint }}>
                    {React.cloneElement(isAvancement ? <PieChart /> : <FiberManualRecord />, { sx: { fontSize: '1.1rem' } })}
                  </ListItemIcon>
                  <ListItemText primary={cycleName} primaryTypographyProps={{ fontSize: '12.5px', fontWeight: 600, color: isActive && !isAvancement ? T.ink : undefined }} />
                </ListItemButton>
              );
            })}
          </List>
        </Paper>

        <Paper elevation={0} sx={{ ...panelSx, flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          {(!selectedExerciceId || !selectedPeriodeId || activeCycle === "etat d'avancement") ? (
            <Stack alignItems="center" justifyContent="center" spacing={1.5} sx={{ flex: 1, px: 3, textAlign: 'center' }}>
              <Box sx={{ width: 56, height: 56, borderRadius: '16px', display: 'grid', placeItems: 'center', color: T.faint, bgcolor: T.ledger }}>
                {(!selectedExerciceId || !selectedPeriodeId)
                  ? <CalendarTodayOutlined sx={{ fontSize: 26 }} />
                  : <AssignmentOutlined sx={{ fontSize: 26 }} />}
              </Box>
              <Typography sx={{ fontSize: '14px', fontWeight: 600, color: T.muted }}>
                {(!selectedExerciceId || !selectedPeriodeId)
                  ? 'Sélectionnez un exercice et une période'
                  : 'Sélectionnez un cycle à réviser'}
              </Typography>
              <Typography sx={{ fontSize: '12.5px', color: T.faint, maxWidth: 360 }}>
                {(!selectedExerciceId || !selectedPeriodeId)
                  ? "Choisissez l'exercice et la période en haut de page pour démarrer la révision."
                  : 'Choisissez un cycle dans la liste de gauche pour afficher son questionnaire et sa revue analytique.'}
              </Typography>
            </Stack>
          ) : (
            <Stack sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
              {/* SOUS-EN-TÊTE DU CYCLE : nom + progression toujours visible */}
              <Box sx={{ px: 2.5, py: 1.25, borderBottom: `1px solid ${T.ledger}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexShrink: 0, flexWrap: 'wrap', rowGap: 1 }}>
                <Typography sx={{ fontSize: '14px', fontWeight: 700, color: T.ink, textTransform: 'capitalize' }}>
                  {activeCycle}
                </Typography>
                <Stack direction="row" spacing={1}>
                  <ProgressChip label="Questionnaire" value={questionnaireStats.done} total={questionnaireStats.total} color={T.pos} />
                  <ProgressChip label="Justificatifs" value={revueAnalytiqueStats.verified} total={revueAnalytiqueStats.total} color={T.accent} />
                </Stack>
              </Box>

              {/* ONGLETS DES RUBRIQUES */}
              <Box sx={{ borderBottom: `1px solid ${T.line}`, px: 2, flexShrink: 0 }}>
                <Tabs value={tabValue} onChange={(e, val) => setTabValue(val)} sx={{ minHeight: 44, '& .MuiTabs-indicator': { backgroundColor: T.accent, height: 2.5 } }}>
                  <Tab icon={<AnalyticsOutlined sx={{ fontSize: 18 }} />} iconPosition="start" label="Synthèse" sx={tabStyle} />
                  <Tab icon={<AssignmentOutlined sx={{ fontSize: 18 }} />} iconPosition="start" label="Questionnaire" sx={tabStyle} />
                  <Tab icon={<HistoryOutlined sx={{ fontSize: 18 }} />} iconPosition="start" label="Revue analytique" sx={tabStyle} />
                </Tabs>
              </Box>

              <Stack sx={{ flex: 1, minHeight: 0, overflow: 'hidden', bgcolor: T.surface }}>
                {tabValue === 0 && RenderSynthese()}
                {tabValue === 1 && RenderQuestionnaire()}
                {tabValue === 2 && RenderRevue()}
              </Stack>
            </Stack>
          )}
        </Paper>

      </Stack>

    </Box>
  );
};

// Petit indicateur de progression (libellé + n/total + mini-barre)
const ProgressChip = ({ label, value, total, color }) => {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <Stack direction="row" alignItems="center" spacing={0.75} sx={{ px: 1.25, py: 0.5, borderRadius: '8px', bgcolor: T.ledger }}>
      <Typography sx={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.3px', color: T.faint }}>{label}</Typography>
      <Typography sx={{ ...NUM, fontSize: '12px', fontWeight: 700, color }}>{value}/{total}</Typography>
      <Box sx={{ width: 36, height: 4, borderRadius: 99, bgcolor: '#FFFFFF', overflow: 'hidden' }}>
        <Box sx={{ height: '100%', width: `${pct}%`, bgcolor: color, borderRadius: 99 }} />
      </Box>
    </Stack>
  );
};

const tabStyle = {
  textTransform: 'none',
  fontWeight: 600,
  fontSize: '13px',
  minHeight: 48,
  minWidth: 140,
  color: T.muted,
  '&.Mui-selected': { color: T.ink, fontWeight: 700 }
};

const dataGridStyle = {
  border: 'none',
  '& .MuiDataGrid-columnHeaders': {
    bgcolor: '#FCFDFF',
    borderBottom: '1px solid #E2E8F0',
    '& .MuiDataGrid-columnHeaderTitle': { fontSize: '0.65rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }
  },
  '& .MuiDataGrid-cell': { fontSize: '0.75rem', borderBottom: '1px solid #F1F5F9' },
  '& .MuiDataGrid-row:hover': { bgcolor: '#F8FAFC' }
};

export default GestionRevisionCycles;