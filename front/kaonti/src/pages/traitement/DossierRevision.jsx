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
import ConfirmActionDialog from '../../components/ConfirmActionDialog';
import ConfirmDeleteDialog from '../../components/ConfirmDeleteDialog';
import CommentDialog from '../../components/commetDialog';

const GestionRevisionCycles = () => {
  const axiosPrivate = useAxiosPrivate();
  const { auth } = useAuth();
  const decoded = auth?.accessToken ? jwtDecode(auth.accessToken) : undefined;
  const compteName = decoded?.UserInfo?.compte || 'Espace Client';

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
    navy: '#0f172a',
    cyan: '#06b6d4',
    slate: '#64748b',
    border: '#e2e8f0',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#f43f5e',
    bg: '#f8fafc',
    radius: '10px'
  };

  const getIds = useCallback(() => {
    const id_compte = parseInt(sessionStorage.getItem('compteId')) || 1;
    const id_dossier = parseInt(sessionStorage.getItem('fileId')) || 1;
    return { id_compte, id_dossier };
  }, []);

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
    const id_compte = parseInt(sessionStorage.getItem('compteId')) || 1;
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

    const id_compte = parseInt(sessionStorage.getItem('compteId')) || 1;
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

    const id_compte = parseInt(sessionStorage.getItem('compteId')) || 1;
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

      const id_compte = parseInt(sessionStorage.getItem('compteId')) || 1;
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

      const id_compte = parseInt(sessionStorage.getItem('compteId')) || 1;
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

      const id_compte = parseInt(sessionStorage.getItem('compteId')) || 1;
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
      const compteId = parseInt(sessionStorage.getItem('compteId')) || 0;
      const fileId = parseInt(sessionStorage.getItem('fileId')) || 0;

      if (!compteId || !fileId) {
        if (mounted) {
          setPlanComptable([]);
        }
        return;
      }

      try {
        setLoadingPlanComptable(true);
        const res = await axiosPrivate.get(`/paramPlanComptable/PcIdLibelle/${compteId}/${fileId}`);
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

      const id_compte = parseInt(sessionStorage.getItem('compteId')) || 1;
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

      const id_compte = parseInt(sessionStorage.getItem('compteId')) || 1;
      const id_dossier = parseInt(sessionStorage.getItem('fileId')) || 1;

      // Si pas de comptes associés sélectionnés, on ne charge rien
      if (!compteAssocieSaved || compteAssocieSaved.length === 0) {
        setEcrituresJournal([]);
        return;
      }

      try {
        setLoadingEcritures(true);

        // Construire la liste des préfixes de comptes
        const comptesQuery = compteAssocieSaved.join(',');

        const res = await axiosPrivate.get(
          `/administration/dossierRevision/ecritures/${id_compte}/${id_dossier}/${selectedExerciceId}/${selectedPeriodeId}?comptes=${comptesQuery}`
        );

        const ecritures = res?.data?.ecritures || [];

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
    const id_compte = parseInt(sessionStorage.getItem('compteId')) || 1;
    const id_dossier = parseInt(sessionStorage.getItem('fileId')) || 1;
    const id_exercice = parseInt(selectedExerciceId) || 0;
    const id_periode = parseInt(selectedPeriodeId) || 0;

    if (!id_exercice || !id_periode || activeCycle === "etat d'avancement") {
      console.warn('Exercice, période ou cycle non sélectionné');
      return;
    }

    const payloadValue = compteAssocieSelection.length ? compteAssocieSelection.join(';') : null;
    if (payloadValue !== null && String(payloadValue).length > 1000) {
      console.warn('compte_associe trop long (max 1000 caractères)');
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

      const raw = res?.data?.compte_associe;
      const parsed = raw
        ? String(raw)
          .split(';')
          .map(s => s.trim())
          .filter(Boolean)
        : [];

      setCompteAssocieSaved(parsed);
    } catch (e) {
      console.error('Erreur sauvegarde compte_associe:', e);
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

  const historiqueNotes = useMemo(() => {
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
  }, [
    loadingCommentaires,
    commentairesSynthese,
    editingCommentaire,
    editCommentaireText,
    savingEdit,
    deletingId,
    K_THEME.border,
    K_THEME.cyan,
    K_THEME.slate,
    K_THEME.navy,
  ]);
  // --- RENDU SYNTHÈSE (STYLE ÉPURÉ) ---
  const RenderSynthese = () => (

    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Paper variant="outlined" sx={{ borderRadius: '12px', bgcolor: '#FFF', border: '1px solid #E2E8F0' }}>
            <Box sx={{ p: 2, borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" sx={{ fontWeight: 900, color: '#64748B', textTransform: 'uppercase' }}>
                Indicateurs de complétude
              </Typography>
              <Chip label="En cours" size="small" sx={{ fontWeight: 800, bgcolor: '#EFF6FF', color: '#2563EB', height: 20, fontSize: '0.6rem' }} />
            </Box>
            <Box sx={{ p: 3 }}>
              <Stack spacing={3}>
                <Box>
                  <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                    <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#1E293B' }}>Questionnaires validés</Typography>
                    <Typography sx={{ fontSize: '0.8rem', fontWeight: 800, color: '#10B981' }}>
                      {itemsLoading ? '...' : `${questionnaireStats.done} / ${questionnaireStats.total}`}
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={itemsLoading ? 0 : questionnaireStats.percent}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      bgcolor: '#F1F5F9',
                      '& .MuiLinearProgress-bar': { bgcolor: '#10B981' }
                    }}
                  />
                </Box>
                <Box>
                  <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                    <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#1E293B' }}>Justificatifs de revue analytique</Typography>
                    <Typography sx={{ fontSize: '0.8rem', fontWeight: 800, color: '#6366F1' }}>
                      {loadingEcritures ? '...' : `${revueAnalytiqueStats.verified} / ${revueAnalytiqueStats.total}`}
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={loadingEcritures ? 0 : revueAnalytiqueStats.percent}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      bgcolor: '#F1F5F9',
                      '& .MuiLinearProgress-bar': { bgcolor: '#6366F1' }
                    }}
                  />
                </Box>
              </Stack>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={5}>
          <Paper
            variant="outlined"
            sx={{ borderRadius: '12px', bgcolor: '#FFF', position: 'relative' }}
          >
            <Box
              sx={{
                p: 2,
                borderBottom: '1px solid #F1F5F9',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <Typography
                variant="caption"
                sx={{ fontWeight: 900, color: '#64748B', textTransform: 'uppercase' }}
              >
                Notes & Observations
              </Typography>

              <Tooltip title="Ajouter un commentaire">
                <span>
                  <IconButton
                    size="small"
                    onClick={handleOpenNewSyntheseCommentDialog}
                    disabled={savingNouveauCommentaire}
                    sx={{ bgcolor: '#F1F5F9' }}
                  >
                    <Comment fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            </Box>

            {/* Historique des notes (vraies données) */}
            <Box sx={{ px: 2, pb: 2, maxHeight: 300, overflowY: 'auto' }}>
              <br />
              {/* <Typography sx={{ color: K_THEME.navy, fontWeight: 900, fontSize: '0.75rem', mb: 2 }}>
                HISTORIQUE DES NOTES
              </Typography> */}
              {historiqueNotes}
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
        flex: 2,
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
              <ToggleButton value="NA" sx={{ fontSize: '0.6rem', fontWeight: 800, px: 1.5, '&.Mui-selected': { bgcolor: '#F1F5F9', color: '#64748B' } }}>N/A</ToggleButton>
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
      <Box sx={{ p: 3, flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Paper variant="outlined" sx={{ flex: 1, minHeight: 0, borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <DataGrid rows={rows} columns={columns} density="compact" disableSelectionOnClick sx={{ ...dataGridStyle, flex: 1, minHeight: 0 }} />
        </Paper>
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
      <Box sx={{ p: 3, flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Paper variant="outlined" sx={{ flex: 1, minHeight: 0, borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <DataGrid
            rows={rows}
            columns={columns}
            loading={loadingEcritures}
            density="compact"
            disableSelectionOnClick
            sx={{ ...dataGridStyle, flex: 1, minHeight: 0 }}
            localeText={{
              noRowsLabel:
                compteAssocieSaved.length === 0
                  ? 'Aucun compte associé défini. Veuillez saisir des comptes.'
                  : 'Aucune écriture trouvée pour les comptes associés.'
            }}
          />
        </Paper>
      </Box>
    );
  };

  return (
    <Box sx={{
      height: 'calc(100vh - 120px)',
      width: 'calc(100vw - 130px)',
      bgcolor: '#F8FAFC',
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

      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
        <Chip
          label={compteName}
          sx={{
            borderRadius: '4px', // Rectangulaire comme demandé
            bgcolor: '#F1F5F9',
            color: '#475569',
            fontWeight: 700,
            fontSize: '0.95rem',
            border: '1px solid #E2E8F0',
            height: 24,
          }}
        />
        <Breadcrumbs
          separator={<NavigateNext fontSize="small" />}
          sx={{ mb: 2, '& .MuiTypography-root': { fontSize: '0.85rem', fontWeight: 600 } }}
        >
          <Link underline="hover" color="inherit" href="/dashboard"
            sx={{ display: 'flex', alignItems: 'center' }}
          >
            <DashboardOutlined sx={{ mr: 0.5, fontSize: 20 }} /> Dashboard
          </Link>
          <Typography color="text.primary" sx={{ fontWeight: 600, color: '#64748B' }}>Dossiers de révision</Typography>
        </Breadcrumbs>
      </Stack>
      {/* BARRE HAUTE (Exercice, Période & Label Cycle) */}
      <Stack direction="row" justifyContent="space-between" alignItems="flex-end">
        <Stack direction="row" spacing={1} alignItems="center">

          {/* BLOC EXERCICE */}
          <Box>
            <ExercicePeriodeSelector
              selectedExerciceId={selectedExerciceId}
              selectedPeriodeId={selectedPeriodeId}
              onExerciceChange={handleChangeExercice}
              onPeriodeChange={handleChangePeriode}
              disabled={loading}
              size="small"
            />
          </Box>
          <Stack
            direction="row"
            alignItems="center"
            sx={{
              mb: 3,
              p: 0.5,
              bgcolor: '#FFFFFF',
              borderRadius: '10px',
              border: '1px solid #E2E8F0',
              width: 'fit-content',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              ml: -2,
              position: 'relative',
              top: -10
            }}
          >
            <Box sx={{ px: 2, py: 0.5 }}>

              {/* 🔹 LABEL */}
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 800,
                  color: '#94A3B8',
                  display: 'block',
                  mb: 0,
                  textTransform: 'uppercase',
                  fontSize: '0.55rem',
                  letterSpacing: '0.02rem'
                }}
              >
                Compte associé
              </Typography>

              {/* 🔹 INPUT + BUTTON */}
              <Stack direction="row" alignItems="center" spacing={1}>

                <TextField
                  size="small"
                  placeholder="Ex: 401;407;53..."
                  variant="standard"
                  value={compteAssocieInput}
                  onChange={(e) => {
                    const text = e.target.value;
                    setCompteAssocieInput(text);

                    const cleaned = text
                      .replace(/,/g, ';')
                      .split(';')
                      .map(s => s.trim())
                      .filter(s => s !== '');

                    setCompteAssocieSelection(cleaned);
                  }}
                  disabled={
                    activeCycle === "etat d'avancement" ||
                    !selectedExerciceId ||
                    !selectedPeriodeId
                  }
                  sx={{
                    minWidth: 260,
                    fontSize: '0.8rem',
                    '& .MuiInputBase-root': {
                      height: 24
                    }
                  }}
                />

                <Button
                  variant="contained"
                  size="small"
                  onClick={handleSaveCompteAssocie}
                  disabled={
                    savingCompteAssocie ||
                    activeCycle === "etat d'avancement" ||
                    !selectedExerciceId ||
                    !selectedPeriodeId ||
                    compteAssocieSelection.join(';') === compteAssocieSaved.join(';')
                  }
                  sx={{
                    bgcolor: K_THEME.navy,
                    color: '#fff',
                    fontSize: '0.65rem',
                    fontWeight: 900,
                    height: 24,
                    minWidth: 70
                  }}
                >
                  {savingCompteAssocie ? '...' : 'Valider'}
                </Button>

              </Stack>
            </Box>
          </Stack>


        </Stack>
        <Typography sx={{ color: K_THEME.cyan, fontWeight: 900, fontSize: '0.7rem' }}>KAONTI / REVISION / {activeCycle.toUpperCase()}</Typography>
        {/* <Chip
              label={activeCycle.toUpperCase()}
              sx={{
                bgcolor: '#0F172A', color: '#00B8D4',
                fontWeight: 900, borderRadius: '6px',
                fontSize: '0.75rem', textTransform: 'uppercase'
              }}
            /> */}
      </Stack>

      <Divider sx={{ my: 1, bgcolor: K_THEME.navy, height: 2 }} />

      <Box sx={{ display: 'flex', gap: 3, flexGrow: 1, overflow: 'hidden' }}>
        <Box
          sx={{
            width: 260,
            maxHeight: 'calc(100vh - 340px)',
            overflowY: 'auto',
            pr: 0.5
          }}
        >
          <List sx={{ p: 0 }}>
            {menuCycles.map((cycleName) => {
              const isAvancement = cycleName === "ETAT D'AVANCEMENT";
              const isActive = activeCycle === cycleName.toLowerCase();
              return (
                <ListItemButton
                  key={cycleName}
                  selected={isActive}
                  onClick={() => { setActiveCycle(cycleName.toLowerCase()); setActiveTab(0); }}
                  sx={{
                    borderRadius: K_THEME.radius, mb: 0.1,
                    ...(isAvancement ? {
                      position: 'sticky',
                      top: 0,
                      zIndex: 2,
                      background: 'radial-gradient(circle at 10% 20%, #2f4566 0%, #010810 100%)',
                      '& .MuiTypography-root': { color: '#fff' },
                      '& .MuiListItemIcon-root': { color: K_THEME.cyan },
                      '&:hover': { background: 'radial-gradient(circle at 10% 20%, #3d5a85 0%, #010810 100%)' }
                    } : {
                      '&.Mui-selected': { bgcolor: alpha(K_THEME.cyan, 0.05), borderLeft: `4px solid ${K_THEME.navy}` }
                    })
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 32, color: isActive ? K_THEME.cyan : K_THEME.slate }}>
                    {React.cloneElement(isAvancement ? <PieChart /> : <FiberManualRecord />, { sx: { fontSize: '1.2rem' } })}
                  </ListItemIcon>
                  <ListItemText primary={cycleName} primaryTypographyProps={{ fontSize: '0.75rem', fontWeight: 600 }} />
                </ListItemButton>
              );
            })}
          </List>
        </Box>

        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>

          <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* ONGLETS DES RUBRIQUES */}
            <Box sx={{ bgcolor: '#FFF', borderBottom: '1px solid #E2E8F0', px: 2 }}>
              <Tabs value={tabValue} onChange={(e, val) => setTabValue(val)} sx={{ minHeight: 48 }}>
                {/* <Tabs sx={{ minHeight: 48 }}>  */}
                <Tab icon={<AnalyticsOutlined sx={{ fontSize: 18 }} />} iconPosition="start" label="Synthèse" sx={tabStyle} />
                <Tab icon={<AssignmentOutlined sx={{ fontSize: 18 }} />} iconPosition="start" label="Questionnaire" sx={tabStyle} />
                <Tab icon={<HistoryOutlined sx={{ fontSize: 18 }} />} iconPosition="start" label="Revue Analytique" sx={tabStyle} />
              </Tabs>
            </Box>

            <Box sx={{ flexGrow: 1, overflowY: 'auto', bgcolor: '#F8FAFC' }}>
              {tabValue === 0 && <RenderSynthese />}
              {tabValue === 1 && <RenderQuestionnaire />}
              {tabValue === 2 && <RenderRevue />}
            </Box>
          </Box>
        </Box>

      </Box>

    </Box>
  );
};

const tabStyle = {
  textTransform: 'none',
  fontWeight: 800,
  fontSize: '0.75rem',
  minHeight: 48,
  minWidth: 140,
  color: '#64748B',
  '&.Mui-selected': { color: '#0F172A' }
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