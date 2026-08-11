import React, { forwardRef, useImperativeHandle, useState, useEffect, useCallback, useMemo } from 'react';
import { Box, Typography, Stack, Chip, Button, CircularProgress } from '@mui/material';
import { VisibilityOutlined, WarningAmberOutlined, CheckCircleOutline } from '@mui/icons-material';
import useAxiosPrivate from '../../hooks/useAxiosPrivate';
import useAuth from '../../hooks/useAuth';
import { useExercicePeriode } from '../../context/ExercicePeriodeContext';
import { jwtDecode } from 'jwt-decode';

// ─── Design (aligné sur DetailsControles / controleglobal) ───
const T = {
  ink: '#0E2733', surface: '#FFFFFF', line: '#E2E6EA', ledger: '#EEF1F3',
  text: '#16202B', muted: '#6A7785', faint: '#9AA6B2',
  accent: '#0E7C86', pos: '#1F8A70', warn: '#B5791A', neg: '#BE3A2F', accW: '#E2F0F1', negW: '#F7E7E4',
};
const NUM = { fontVariantNumeric: 'tabular-nums', fontFeatureSettings: '"tnum"' };

const formatDateYYYYMMDD = (dateString) => {
  if (!dateString) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return dateString;
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

// Type de contrôle de révision auto → libellé + entrée cible dans la sidebar.
const TYPE_META = {
  ATYPIQUE:      { label: 'Recherche de montants atypiques', entryId: 'atypique' },
  SENS_SOLDE:    { label: 'Conformité du solde au sens normal des comptes', entryId: 'sensSolde' },
  SENS_ECRITURE: { label: "Sens d'enregistrement des factures d'achats et de ventes", entryId: 'sensEcriture' },
  IMMO_CHARGE:   { label: 'Conformité du seuil de capitalisation des immobilisations', entryId: 'immoCharge' },
  EXISTENCE:     { label: 'Existence du compte de capital', entryId: 'existence' },
  UTIL_CPT_TVA:  { label: 'Utilisation des comptes de TVA', entryId: 'utilCptTva' },
};
const ORDER = ['ATYPIQUE', 'SENS_SOLDE', 'SENS_ECRITURE', 'IMMO_CHARGE', 'EXISTENCE', 'UTIL_CPT_TVA'];

const StatCell = ({ label, value, unit, color = T.ink, barPct, barColor = T.accent }) => (
  <Box sx={{ flex: 1, minWidth: 0, p: { xs: 2, md: 2.5 } }}>
    <Typography sx={{ fontSize: '11px', fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '.4px', mb: 0.75 }}>
      {label}
    </Typography>
    <Typography sx={{ ...NUM, fontSize: { xs: '24px', md: '28px' }, fontWeight: 800, letterSpacing: '-.6px', lineHeight: 1, color }}>
      {value}
      {unit && <Box component="span" sx={{ fontSize: '14px', fontWeight: 600, color: T.muted, ml: '4px' }}>{unit}</Box>}
    </Typography>
    {barPct !== undefined && (
      <Box sx={{ mt: 1.25, height: 4, borderRadius: 99, bgcolor: T.ledger, overflow: 'hidden' }}>
        <Box sx={{ height: '100%', borderRadius: 99, width: `${Math.max(0, Math.min(100, barPct))}%`, bgcolor: barColor }} />
      </Box>
    )}
  </Box>
);

const RevisionRecap = forwardRef(function RevisionRecap({ id_exercice, id_periode, onOpen }, ref) {
  const axiosPrivate = useAxiosPrivate();
  const { auth } = useAuth();
  const {
    selectedExerciceId, selectedPeriodeId, selectedPeriodeDates,
    listePeriodes, currentExerciceDates,
  } = useExercicePeriode();

  const effectiveExerciceId = id_exercice ?? selectedExerciceId;
  const effectivePeriodeId = id_periode ?? selectedPeriodeId;

  const ids = useMemo(() => ({
    id_compte: parseInt(jwtDecode(auth?.accessToken)?.UserInfo?.compteId) || parseInt(sessionStorage.getItem('compteId')) || 1,
    id_dossier: parseInt(sessionStorage.getItem('fileId')) || 1,
  }), [auth]);

  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);

  const fetchStats = useCallback(async () => {
    if (!effectiveExerciceId) return;
    setLoading(true);
    try {
      const q = (effectivePeriodeId && effectivePeriodeId !== 'exercice') ? `?id_periode=${effectivePeriodeId}` : '';
      const url = `/administration/revisionControleAuto/${ids.id_compte}/${ids.id_dossier}/${effectiveExerciceId}/stats${q}`;
      const res = await axiosPrivate.get(url);
      if (res.data?.state) setStats(res.data.data);
    } catch (e) {
      console.error('Erreur récap révision:', e);
    } finally {
      setLoading(false);
    }
  }, [axiosPrivate, ids, effectiveExerciceId, effectivePeriodeId]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  // Dates pour l'export global (réplique le comportement de GlobalBalance).
  const resolveDates = useCallback(() => {
    const fromList = (effectivePeriodeId && effectivePeriodeId !== 'exercice')
      ? (listePeriodes || []).find(p => String(p.id) === String(effectivePeriodeId))
      : null;
    const src = fromList || selectedPeriodeDates || currentExerciceDates;
    if (src?.date_debut && src?.date_fin) {
      return { date_debut: formatDateYYYYMMDD(src.date_debut), date_fin: formatDateYYYYMMDD(src.date_fin) };
    }
    if (currentExerciceDates?.date_debut && currentExerciceDates?.date_fin) {
      return { date_debut: formatDateYYYYMMDD(currentExerciceDates.date_debut), date_fin: formatDateYYYYMMDD(currentExerciceDates.date_fin) };
    }
    return null;
  }, [effectivePeriodeId, listePeriodes, selectedPeriodeDates, currentExerciceDates]);

  const downloadExport = useCallback(async (format, mime, ext) => {
    if (!effectiveExerciceId) return;
    let url = `/administration/revisionControleAuto/${ids.id_compte}/${ids.id_dossier}/${effectiveExerciceId}/export/global/${format}`;
    const d = resolveDates();
    if (d) {
      const p = new URLSearchParams();
      p.append('date_debut', d.date_debut);
      p.append('date_fin', d.date_fin);
      if (effectivePeriodeId) p.append('id_periode', effectivePeriodeId);
      url += `?${p.toString()}`;
    }
    const res = await axiosPrivate.get(url, { responseType: 'blob' });
    const blob = new Blob([res.data], { type: mime });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = `Revision_Globale_${ids.id_dossier}_${effectiveExerciceId}.${ext}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(link.href);
  }, [axiosPrivate, ids, effectiveExerciceId, effectivePeriodeId, resolveDates]);

  useImperativeHandle(ref, () => ({
    exportExcel: () => downloadExport('excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'xlsx'),
    exportPdf: () => downloadExport('pdf', 'application/pdf', 'pdf'),
  }), [downloadExport]);

  const rows = useMemo(() => {
    const byType = {};
    (stats?.details || []).forEach((d) => { byType[d.type] = d; });
    const seen = new Set();
    const ordered = [];
    ORDER.forEach((t) => { if (byType[t]) { ordered.push(byType[t]); seen.add(t); } });
    (stats?.details || []).forEach((d) => { if (!seen.has(d.type)) ordered.push(d); });
    return ordered.map((d) => {
      const total = Number(d.total_groups) || 0;
      const remaining = Number(d.remaining_groups) || 0;
      const meta = TYPE_META[d.type] || { label: d.type, entryId: null };
      const progress = total === 0 ? 100 : Math.round(((total - remaining) / total) * 100);
      return { type: d.type, label: meta.label, entryId: meta.entryId, total, remaining, progress };
    });
  }, [stats]);

  const totalAnom = Number(stats?.total_anomalies) || 0;
  const restantes = Number(stats?.restantes) || 0;
  const progressGlobal = totalAnom === 0 ? 0 : Math.round(((totalAnom - restantes) / totalAnom) * 100);
  const critiques = useMemo(() => rows.filter((r) => r.remaining > 0).sort((a, b) => b.remaining - a.remaining), [rows]);

  if (loading && !stats) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', height: '100%', p: 4 }}>
        <CircularProgress size={28} sx={{ color: T.accent }} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Bandeau de synthèse */}
      <Box sx={{ border: `1px solid ${T.line}`, borderRadius: '14px', overflow: 'hidden', mb: 2.5 }}>
        <Stack direction="row" divider={<Box sx={{ width: '1px', bgcolor: T.line }} />}>
          <StatCell label="Anomalies détectées" value={totalAnom} color={totalAnom > 0 ? T.neg : T.pos} />
          <StatCell label="Restantes à traiter" value={restantes} color={restantes > 0 ? T.warn : T.pos} />
          <StatCell
            label="Traité"
            value={progressGlobal}
            unit="%"
            color={T.ink}
            barPct={progressGlobal}
            barColor={progressGlobal >= 100 ? T.pos : T.accent}
          />
        </Stack>
      </Box>

      {/* Points critiques */}
      {critiques.length > 0 && (
        <Box sx={{ mb: 2.5 }}>
          <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: 1 }}>
            <WarningAmberOutlined sx={{ fontSize: 18, color: T.warn }} />
            <Typography sx={{ fontSize: '12px', fontWeight: 700, color: T.ink, textTransform: 'uppercase', letterSpacing: '.4px' }}>
              Points critiques
            </Typography>
          </Stack>
          <Stack direction="row" flexWrap="wrap" gap={1}>
            {critiques.map((r) => (
              <Chip
                key={r.type}
                onClick={r.entryId && onOpen ? () => onOpen(r.entryId) : undefined}
                label={
                  <Box component="span" sx={{ ...NUM }}>
                    {r.label} — <b>{r.remaining}</b> restante{r.remaining > 1 ? 's' : ''}
                  </Box>
                }
                sx={{
                  bgcolor: T.negW, color: T.neg, fontWeight: 600, fontSize: '12px',
                  border: `1px solid ${T.neg}22`, cursor: r.entryId && onOpen ? 'pointer' : 'default',
                  '&:hover': r.entryId && onOpen ? { bgcolor: '#F3D9D4' } : {},
                }}
              />
            ))}
          </Stack>
        </Box>
      )}

      {/* Tableau récapitulatif */}
      <Box sx={{ border: `1px solid ${T.line}`, borderRadius: '14px', overflow: 'hidden' }}>
        {/* En-tête */}
        <Stack
          direction="row"
          alignItems="center"
          sx={{ px: 2, py: 1, bgcolor: T.ledger, borderBottom: `1px solid ${T.line}` }}
        >
          <Typography sx={{ flex: 1, fontSize: '11px', fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '.4px' }}>Contrôle</Typography>
          <Typography sx={{ width: 80, textAlign: 'right', fontSize: '11px', fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '.4px' }}>Anom.</Typography>
          <Typography sx={{ width: 80, textAlign: 'right', fontSize: '11px', fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '.4px' }}>Restantes</Typography>
          <Typography sx={{ width: 70, textAlign: 'right', fontSize: '11px', fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '.4px' }}>Traité</Typography>
          <Box sx={{ width: 130 }} />
        </Stack>

        {rows.length === 0 && (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography sx={{ fontSize: '13px', color: T.muted }}>Aucune anomalie de révision détectée.</Typography>
          </Box>
        )}

        {rows.map((r, i) => (
          <Stack
            key={r.type}
            direction="row"
            alignItems="center"
            sx={{ px: 2, py: 1.25, borderBottom: i < rows.length - 1 ? `1px solid ${T.ledger}` : 'none' }}
          >
            <Typography sx={{ flex: 1, minWidth: 0, fontSize: '13px', fontWeight: 600, color: T.ink, pr: 1 }}>
              {r.label}
            </Typography>
            <Typography sx={{ ...NUM, width: 80, textAlign: 'right', fontSize: '14px', fontWeight: 700, color: r.total > 0 ? T.neg : T.pos }}>
              {r.total}
            </Typography>
            <Typography sx={{ ...NUM, width: 80, textAlign: 'right', fontSize: '14px', fontWeight: 700, color: r.remaining > 0 ? T.warn : T.pos }}>
              {r.remaining}
            </Typography>
            <Typography sx={{ ...NUM, width: 70, textAlign: 'right', fontSize: '13px', fontWeight: 700, color: T.muted }}>
              {r.progress}%
            </Typography>
            <Box sx={{ width: 130, textAlign: 'right' }}>
              {r.entryId && onOpen ? (
                <Button
                  size="small"
                  startIcon={<VisibilityOutlined sx={{ fontSize: 16 }} />}
                  onClick={() => onOpen(r.entryId)}
                  sx={{ textTransform: 'none', fontWeight: 600, fontSize: '12px', color: T.accent, '&:hover': { bgcolor: T.accW } }}
                >
                  Voir le détail
                </Button>
              ) : (
                <Chip
                  size="small"
                  icon={r.remaining === 0 ? <CheckCircleOutline sx={{ fontSize: 15 }} /> : undefined}
                  label={r.remaining === 0 ? 'OK' : '—'}
                  sx={{ bgcolor: r.remaining === 0 ? T.accW : T.ledger, color: r.remaining === 0 ? T.pos : T.muted, fontWeight: 600, fontSize: '11px' }}
                />
              )}
            </Box>
          </Stack>
        ))}
      </Box>
    </Box>
  );
});

export default RevisionRecap;
