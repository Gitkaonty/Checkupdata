import React, { useState, useEffect, useCallback, useMemo, Fragment } from 'react';
import {
  Box, Typography, Stack, Chip, CircularProgress, Alert, Collapse, IconButton,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
} from '@mui/material';
import {
  CheckCircleOutline, WarningAmberOutlined, AddCircleOutline, RemoveCircleOutline,
} from '@mui/icons-material';
import useAxiosPrivate from '../../hooks/useAxiosPrivate';
import useAuth from '../../hooks/useAuth';
import { useExercicePeriode } from '../../context/ExercicePeriodeContext';
import { jwtDecode } from 'jwt-decode';

const T = {
  ink: '#0E2733', surface: '#FFFFFF', line: '#E2E6EA', ledger: '#EEF1F3',
  text: '#16202B', muted: '#6A7785', faint: '#9AA6B2',
  accent: '#0E7C86', pos: '#1F8A70', warn: '#B5791A', neg: '#BE3A2F', accW: '#E2F0F1', negW: '#F7E7E4',
};
const NUM = { fontVariantNumeric: 'tabular-nums', fontFeatureSettings: '"tnum"' };

const fmt = (v) => Number(v || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDate = (val) => {
  if (!val) return '—';
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(val)) return val;
  const d = new Date(val);
  if (isNaN(d.getTime())) return String(val);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
};

// Classe comptable d'une ligne de détail, pour la coloration
const classeOf = (cg) => {
  const c = String(cg || '').trim();
  if (/^[67]/.test(c)) return 'HT';
  if (/^445/.test(c)) return 'TVA';
  if (/^(40|41)/.test(c)) return 'TIERS';
  if (/^44/.test(c)) return 'RETENUE';
  return 'AUTRE';
};

const StatCell = ({ label, value, color = T.ink }) => (
  <Box sx={{ flex: 1, minWidth: 0, p: { xs: 2, md: 2.5 } }}>
    <Typography sx={{ fontSize: '11px', fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '.4px', mb: 0.75 }}>
      {label}
    </Typography>
    <Typography sx={{ ...NUM, fontSize: { xs: '20px', md: '24px' }, fontWeight: 800, letterSpacing: '-.4px', lineHeight: 1, color }}>
      {value}
    </Typography>
  </Box>
);

const CoherenceHtTva = ({ id_exercice, id_periode }) => {
  const axiosPrivate = useAxiosPrivate();
  const { auth } = useAuth();
  const { selectedExerciceId, selectedPeriodeId, selectedPeriodeDates } = useExercicePeriode();

  const effectiveExerciceId = id_exercice ?? selectedExerciceId;
  const effectivePeriodeId = id_periode ?? selectedPeriodeId;

  const ids = useMemo(() => ({
    id_compte: parseInt(jwtDecode(auth?.accessToken)?.UserInfo?.compteId) || parseInt(sessionStorage.getItem('compteId')) || 1,
    id_dossier: parseInt(sessionStorage.getItem('fileId')) || 1,
  }), [auth]);

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [open, setOpen] = useState({});

  const toggle = (id) => setOpen((o) => ({ ...o, [id]: !o[id] }));

  const fetchData = useCallback(async () => {
    if (!effectiveExerciceId) return;
    setLoading(true);
    try {
      let url = `/administration/coherenceHtTva/${ids.id_compte}/${ids.id_dossier}/${effectiveExerciceId}`;
      if (selectedPeriodeDates?.date_debut && selectedPeriodeDates?.date_fin) {
        url += `?date_debut=${selectedPeriodeDates.date_debut}&date_fin=${selectedPeriodeDates.date_fin}`;
      }
      const res = await axiosPrivate.get(url);
      if (res.data?.state) setData(res.data.data);
    } catch (e) {
      console.error('Erreur cohérence HT/TVA/TTC:', e);
    } finally {
      setLoading(false);
    }
  }, [axiosPrivate, ids, effectiveExerciceId, effectivePeriodeId, selectedPeriodeDates]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const lignes = data?.lignes || [];
  const rows = useMemo(
    () => lignes.map((l, i) => ({ id: l.id_ecriture ?? `row-${i}`, ...l })),
    [lignes]
  );

  if (loading && !data) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', height: '100%', p: 4 }}>
        <CircularProgress size={28} sx={{ color: T.accent }} />
      </Box>
    );
  }

  const anomalie = lignes.length > 0;

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Bandeau */}
      <Box sx={{ border: `1px solid ${T.line}`, borderRadius: '14px', overflow: 'hidden', mb: 2.5 }}>
        <Stack direction="row" divider={<Box sx={{ width: '1px', bgcolor: T.line }} />} flexWrap="wrap">
          <StatCell label="Écritures incohérentes" value={lignes.length} color={anomalie ? T.neg : T.pos} />
          <Box sx={{ flex: 2, minWidth: 0, p: { xs: 2, md: 2.5 }, display: 'flex', alignItems: 'center' }}>
            <Chip
              icon={anomalie ? <WarningAmberOutlined sx={{ fontSize: 18 }} /> : <CheckCircleOutline sx={{ fontSize: 18 }} />}
              label={anomalie ? 'Incohérences HT / TVA / TTC détectées' : 'Aucune incohérence HT / TVA / TTC'}
              sx={{
                bgcolor: anomalie ? T.negW : T.accW,
                color: anomalie ? T.neg : T.pos,
                fontWeight: 700, fontSize: '13px', height: 32,
                '& .MuiChip-icon': { color: 'inherit' },
              }}
            />
          </Box>
        </Stack>
      </Box>

      {lignes.length === 0 ? (
        <Alert severity="success" icon={<CheckCircleOutline />} sx={{ borderRadius: '12px' }}>
          Toutes les factures sont cohérentes : TTC = HT + TVA, TVA ≤ HT, HT ≤ TTC.
        </Alert>
      ) : (
        <TableContainer sx={{ border: `1px solid ${T.line}`, borderRadius: '14px', overflowX: 'auto' }}>
          <Table size="small" stickyHeader sx={{ '& td, & th': { fontSize: '0.8rem', py: 0.6, px: 1.5, borderBottom: `1px solid ${T.ledger}` } }}>
            <TableHead>
              <TableRow sx={{ '& th': { bgcolor: '#F8FAFC', color: '#64748B', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.4px' } }}>
                <TableCell sx={{ width: 40 }} />
                <TableCell>Type</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Pièce</TableCell>
                <TableCell>Compte (6/7)</TableCell>
                <TableCell>Libellé</TableCell>
                <TableCell align="right">HT</TableCell>
                <TableCell align="right">TVA</TableCell>
                <TableCell align="right">TTC</TableCell>
                <TableCell align="right">Écart</TableCell>
                <TableCell>Motif</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((l) => {
                const detail = l.detail || [];
                const compteHt = (detail.find((d) => classeOf(d.comptegen) === 'HT') || {}).comptegen || '—';
                const isOpen = !!open[l.id];
                return (
                  <Fragment key={l.id}>
                    {/* Ligne principale = la ligne classe 6/7 (HT) */}
                    <TableRow
                      hover
                      onClick={() => detail.length > 0 && toggle(l.id)}
                      sx={{ cursor: detail.length > 0 ? 'pointer' : 'default', '& > *': { borderBottom: isOpen ? 'unset' : undefined } }}
                    >
                      <TableCell sx={{ width: 40 }}>
                        {detail.length > 0 && (
                          <IconButton size="small" sx={{ p: 0.25 }} onClick={(e) => { e.stopPropagation(); toggle(l.id); }}>
                            {isOpen ? <RemoveCircleOutline fontSize="small" /> : <AddCircleOutline fontSize="small" />}
                          </IconButton>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={l.type || '—'}
                          size="small"
                          sx={{
                            bgcolor: l.type === 'Vente' ? T.accW : (l.type === 'Mixte' ? T.negW : T.ledger),
                            color: l.type === 'Vente' ? T.accent : (l.type === 'Mixte' ? T.neg : T.muted),
                            fontWeight: 700, fontSize: '10px', height: 18,
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ ...NUM, whiteSpace: 'nowrap' }}>{fmtDate(l.dateecriture)}</TableCell>
                      <TableCell>{l.piece || '—'}</TableCell>
                      <TableCell sx={{ ...NUM, whiteSpace: 'nowrap', fontWeight: 700, color: T.ink }}>{compteHt}</TableCell>
                      <TableCell sx={{ maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.libelle || '—'}</TableCell>
                      <TableCell align="right" sx={{ ...NUM, fontWeight: 700 }}>{fmt(l.ht)}</TableCell>
                      <TableCell align="right" sx={{ ...NUM }}>{fmt(l.tva)}</TableCell>
                      <TableCell align="right" sx={{ ...NUM }}>{fmt(l.ttc_reel != null ? l.ttc_reel : l.ttc)}</TableCell>
                      <TableCell align="right" sx={{ ...NUM, color: T.neg, fontWeight: 800 }}>{fmt(l.ecart)}</TableCell>
                      <TableCell>
                        <Stack direction="row" flexWrap="wrap" gap={0.5}>
                          {(l.motifs || []).map((m) => (
                            <Chip key={m} label={m} size="small" sx={{ bgcolor: T.negW, color: T.neg, fontWeight: 700, fontSize: '10px', height: 18 }} />
                          ))}
                        </Stack>
                      </TableCell>
                    </TableRow>

                    {/* Détail replié = toutes les lignes de l'écriture */}
                    <TableRow>
                      <TableCell colSpan={11} sx={{ py: 0, borderBottom: isOpen ? `1px solid ${T.ledger}` : 'none' }}>
                        <Collapse in={isOpen} timeout="auto" unmountOnExit>
                          <Box sx={{ m: 1.5, ml: 5, border: `1px solid ${T.line}`, borderRadius: '10px', overflow: 'hidden' }}>
                            <Table size="small" sx={{ '& td, & th': { fontSize: '0.75rem', py: 0.5, px: 1.5, borderBottom: `1px solid ${T.ledger}` } }}>
                              <TableHead>
                                <TableRow sx={{ '& th': { bgcolor: '#FBFCFD', color: T.muted, fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.4px' } }}>
                                  <TableCell>Compte</TableCell>
                                  <TableCell>Compte aux.</TableCell>
                                  <TableCell>Nature</TableCell>
                                  <TableCell>Libellé</TableCell>
                                  <TableCell align="right">Débit</TableCell>
                                  <TableCell align="right">Crédit</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {detail.map((d, di) => {
                                  const cl = classeOf(d.comptegen);
                                  const natColor = cl === 'HT' ? T.accent : cl === 'TVA' ? T.warn : cl === 'RETENUE' ? T.neg : T.muted;
                                  const natLabel = cl === 'HT' ? 'HT (charge/produit)' : cl === 'TVA' ? 'TVA' : cl === 'TIERS' ? 'Tiers (TTC)' : cl === 'RETENUE' ? 'Retenue / 44x' : 'Autre';
                                  return (
                                    <TableRow key={di} sx={{ bgcolor: cl === 'HT' ? '#F3FAFA' : 'transparent' }}>
                                      <TableCell sx={{ ...NUM, whiteSpace: 'nowrap', fontWeight: 700 }}>{String(d.comptegen || '').trim() || '—'}</TableCell>
                                      <TableCell sx={{ ...NUM, whiteSpace: 'nowrap', color: T.muted }}>{String(d.compteaux || '').trim() || '—'}</TableCell>
                                      <TableCell>
                                        <Chip label={natLabel} size="small" sx={{ bgcolor: 'transparent', color: natColor, border: `1px solid ${natColor}33`, fontWeight: 700, fontSize: '9px', height: 17 }} />
                                      </TableCell>
                                      <TableCell sx={{ maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.libelle || '—'}</TableCell>
                                      <TableCell align="right" sx={{ ...NUM }}>{d.debit ? fmt(d.debit) : ''}</TableCell>
                                      <TableCell align="right" sx={{ ...NUM }}>{d.credit ? fmt(d.credit) : ''}</TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </Fragment>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default CoherenceHtTva;
