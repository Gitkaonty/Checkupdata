import React, { useEffect } from 'react';

import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Stack, TextField, Button, InputAdornment, MenuItem, Typography, Box, Tab, IconButton, Checkbox, FormControlLabel,
    FormControl,
    InputLabel,
    Select
} from '@mui/material';
import { TabContext, TabList, TabPanel } from '@mui/lab';

import { GoLink } from "react-icons/go";
import { IoMdTrash } from "react-icons/io";
import { init } from '../../../../../init';
import FormatedInput from '../../../componentsTools/FormatedInput';
import { FaSquarePlus } from "react-icons/fa6";

const DetailsImmoDialog = ({ open, mode = 'add', form = {}, onChange, onClose, onSubmit, loading = false, onOpenLienEcriture }) => {
    const initial = init[0];

    const handleField = (key) => (e) => onChange({ ...form, [key]: e.target.value });

    const toNum = (v) => {
        if (v === '' || v === null || v === undefined) return '';
        return Number(String(v).replace(/\s+/g, ''));
    };

    const handleNumber = (key) => (e) => onChange({ ...form, [key]: toNum(e.target.value) });

    const round2 = (n) => Math.round(Number(n) * 100) / 100;
    const isEmpty = (v) => v === '' || v === null || v === undefined;
    const numOrNull = (v) => (isEmpty(v) ? null : Number(v));
    const numOrZero = (v) => (isEmpty(v) ? 0 : Number(v));

    const handleMontantCalc = (e) => {
        const montantRaw = e.target.value;
        const montant = isEmpty(montantRaw) ? '' : toNum(montantRaw);
        const taux = numOrNull(form.taux_tva);
        const tva = numOrNull(form.montant_tva);
        const ht = numOrNull(form.montant_ht);
        const next = { ...form, montant };

        if (montant === '' || isNaN(Number(montant))) { onChange(next); return; }

        if (taux !== null) {
            const nvTva = round2(montant * taux / 100);
            const nvHt = round2(montant - nvTva);
            next.montant_tva = nvTva; next.montant_ht = nvHt;
        } else if (tva !== null) {
            const nvHt = round2(montant - tva);
            const nvTaux = montant ? round2((tva / montant) * 100) : 0;
            next.montant_ht = nvHt; next.taux_tva = nvTaux;
        } else if (ht !== null) {
            const nvTva = round2(montant - ht);
            const nvTaux = montant ? round2((nvTva / montant) * 100) : 0;
            next.montant_tva = nvTva; next.taux_tva = nvTaux;
        }
        onChange(next);
    };

    const handleTauxTvaCalc = (e) => {
        const tauxRaw = e.target.value;
        const taux = isEmpty(tauxRaw) ? '' : toNum(tauxRaw);
        const montant = numOrNull(form.montant);
        const next = { ...form, taux_tva: taux };

        if (taux === '' || montant === null || isNaN(Number(taux))) { onChange(next); return; }
        const nvTva = round2(montant * taux / 100);
        const nvHt = round2(montant - nvTva);
        next.montant_tva = nvTva; next.montant_ht = nvHt;
        onChange(next);
    };

    const handleMontantTvaCalc = (e) => {
        const tvaRaw = e.target.value;
        const tva = isEmpty(tvaRaw) ? '' : toNum(tvaRaw);
        const montant = numOrNull(form.montant);
        const next = { ...form, montant_tva: tva };

        if (tva === '' || montant === null || isNaN(Number(tva))) { onChange(next); return; }
        const nvHt = round2(montant - tva);
        const nvTaux = montant ? round2((tva / montant) * 100) : 0;
        next.montant_ht = nvHt; next.taux_tva = nvTaux;
        onChange(next);
    };

    const handleMontantHtCalc = (e) => {
        const htRaw = e.target.value;
        const ht = isEmpty(htRaw) ? '' : toNum(htRaw);
        const montant = numOrNull(form.montant);
        const next = { ...form, montant_ht: ht };

        if (ht === '' || montant === null || isNaN(Number(ht))) { onChange(next); return; }
        const nvTva = round2(montant - ht);
        const nvTaux = montant ? round2((nvTva / montant) * 100) : 0;
        next.montant_tva = nvTva; next.taux_tva = nvTaux;
        // Recompute VNC (comptable): VNC = montant_ht - total_amortissement_comp - derogatoire_comp
        const totalComp = numOrZero(next.total_amortissement_comp);
        const derogComp = numOrZero(next.derogatoire_comp);
        next.vnc = round2(numOrZero(ht) - totalComp - derogComp);
        onChange(next);
    };

    // Recompute total amortissement (comptable) and VNC when a comptable amort field changes
    const handleAmortComp = (key) => (e) => {
        const val = isEmpty(e.target.value) ? '' : toNum(e.target.value);
        const next = { ...form, [key]: val };

        const amortAnt = numOrZero(next.amort_ant_comp);
        const dotPer = numOrZero(next.dotation_periode_comp);
        const amortEx = numOrZero(next.amort_exceptionnel_comp);
        const total = round2(amortAnt + dotPer + amortEx);
        next.total_amortissement_comp = total;
        const ht = numOrZero(next.montant_ht);
        const derog = numOrZero(next.derogatoire_comp);
        next.vnc = round2(ht - total - derog);
        onChange(next);
    };

    // Recompute VNC when derogatoire comptable changes
    const handleDerogComp = (e) => {
        const val = isEmpty(e.target.value) ? '' : toNum(e.target.value);
        const next = { ...form, derogatoire_comp: val };

        const total = numOrZero(next.total_amortissement_comp);
        const ht = numOrZero(next.montant_ht);
        next.vnc = round2(ht - total - numOrZero(val));
        onChange(next);
    };

    // Recompute total amortissement (fiscal) when a fiscal amort field changes
    function handleAmortFisc(key) {
        return (e) => {
            const val = isEmpty(e.target.value) ? '' : toNum(e.target.value);
            const next = { ...form, [key]: val };
            const amortAnt = numOrZero(next.amort_ant_fisc);
            const dotPer = numOrZero(next.dotation_periode_fisc);
            const amortEx = numOrZero(next.amort_exceptionnel_fisc);
            next.total_amortissement_fisc = round2(amortAnt + dotPer + amortEx);
            onChange(next);
        }
    }

    const toIso = (fr) => {
        if (!fr) return '';
        const s = String(fr).replace(/\s+/g, '');
        const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if (!m) return fr;
        return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
    };

    const handleDate = (key) => (e) => onChange({ ...form, [key]: toIso(e.target.value) });

    const commonSx = {
        width: 200,
        mb: 0,
        '& .MuiInputBase-root': { fontSize: '13px' },
        '& .MuiInputLabel-root': { color: '#1976d2', fontSize: '13px' },
    };

    const moneyAdornment = {
        endAdornment: <InputAdornment position="end">Ar</InputAdornment>,
    };

    // Initialize numeric fields to zero when starting a new item (force reset)
    useEffect(() => {
        if (!open) return;
        if (mode !== 'add') return;
        const next = { ...form };
        const keys = [
            'montant', 'taux_tva', 'montant_tva', 'montant_ht',
            'amort_ant_comp', 'dotation_periode_comp', 'amort_exceptionnel_comp',
            'total_amortissement_comp', 'derogatoire_comp', 'vnc',
            'amort_ant_fisc', 'dotation_periode_fisc', 'amort_exceptionnel_fisc',
            'total_amortissement_fisc', 'derogatoire_fisc'
        ].forEach((k) => { next[k] = 0; });
        next.__amortTab = 'comp';
        onChange(next);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, mode]);

    // VNC display: 0 if no inputs filled; else compute
    const ht0 = numOrZero(form.montant_ht);
    const tot0 = numOrZero(form.total_amortissement_comp);
    const der0 = numOrZero(form.derogatoire_comp);
    const hasInputs = Boolean(numOrZero(form.montant) || ht0 || numOrZero(form.amort_ant_comp) || numOrZero(form.dotation_periode_comp) || numOrZero(form.amort_exceptionnel_comp) || der0);
    const vncDisplay = hasInputs ? (form.vnc ?? round2(ht0 - tot0 - der0)) : 0;

    const repriseComp = Boolean(form.reprise_immobilisation_comp ?? form.reprise_immobilisation);
    const repriseFisc = Boolean(form.reprise_immobilisation_fisc ?? form.reprise_immobilisation);
    const amortDisabledComp = !repriseComp;
    const amortDisabledFisc = !repriseFisc;

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
            <DialogTitle>{mode === 'add' ? 'Ajouter une immobilisation' : 'Modifier une immobilisation'}</DialogTitle>

            <DialogContent dividers>

                <Box display="flex" flexDirection="column" gap={8}>

                    {/* -------------------------------------------------- */}
                    {/* GROUPE 01 : INFORMATIONS GÉNÉRALES */}
                    {/* -------------------------------------------------- */}
                    <Box>
                        <Typography style={{ fontWeight: 'normal', fontSize: '16px', marginBottom: '5px', lineHeight: 1.2 }}>
                            Informations générales
                        </Typography>

                        <Box display="flex" flexWrap="wrap" gap={2} mt={2} alignItems="flex-end">
                            <TextField
                                label="Code"
                                required
                                value={form.code || ''}
                                onChange={handleField('code')}
                                variant="standard"
                                size="small"
                                sx={commonSx}
                            />
                            <TextField
                                label="Intitulé"
                                value={form.intitule || ''}
                                onChange={handleField('intitule')}
                                variant="standard"
                                size="small"
                                sx={commonSx}
                            />
                            <TextField
                                label="Fournisseur"
                                value={form.fournisseur || ''}
                                onChange={handleField('fournisseur')}
                                variant="standard"
                                size="small"
                                sx={commonSx}
                            />
                        </Box>

                        <Box display="flex" flexWrap="wrap" gap={2} mt={2}>
                            <TextField
                                label="Date acquisition"
                                placeholder="jj/mm/aaaa"
                                type="date"
                                value={form.date_acquisition ? String(form.date_acquisition).substring(0, 10) : ''}
                                onChange={handleDate('date_acquisition')}
                                InputLabelProps={{ shrink: true }}
                                variant="standard"
                                size="small"
                                sx={commonSx}
                            />
                            <TextField
                                label="Date mise en service"
                                placeholder="jj/mm/aaaa"
                                type="date"
                                value={form.date_mise_service ? String(form.date_mise_service).substring(0, 10) : ''}
                                onChange={handleDate('date_mise_service')}
                                InputLabelProps={{ shrink: true }}
                                variant="standard"
                                size="small"
                                sx={commonSx}
                            />
                        </Box>

                    </Box>

                    {/* -------------------------------------------------- */}
                    {/* GROUPE 02 : VALEUR DE L’IMMOBILISATION */}
                    <Box>
                        <Typography style={{ fontWeight: 'normal', fontSize: '16px', marginBottom: '5px' }}>
                            Valeur d'acquisition
                        </Typography>

                        <Box display="flex" flexWrap="wrap" rowGap={2} columnGap={2} mt={2} justifyContent="space-between">
                            <TextField
                                label="Montant"
                                type="text"
                                value={form.montant ?? ''}
                                onChange={handleMontantCalc}
                                variant="standard"
                                size="small"
                                sx={{ width: '23%', input: { textAlign: 'right' }, ...commonSx }}
                                InputProps={{ ...moneyAdornment, inputComponent: FormatedInput }}
                            />

                            <TextField
                                label="Taux TVA"
                                type="text"
                                value={form.taux_tva || ''}
                                onChange={handleTauxTvaCalc}
                                variant="standard"
                                size="small"
                                sx={{ width: '23%', input: { textAlign: 'right' }, ...commonSx }}
                                InputProps={{ inputComponent: FormatedInput }}
                            />

                            <TextField
                                label="Montant TVA"
                                type="text"
                                value={form.montant_tva || ''}
                                onChange={handleMontantTvaCalc}
                                variant="standard"
                                size="small"
                                sx={{ width: '23%', input: { textAlign: 'right' }, ...commonSx }}
                                InputProps={{ ...moneyAdornment, inputComponent: FormatedInput }}
                            />

                            <TextField
                                label="Montant HT"
                                type="text"
                                value={form.montant_ht || ''}
                                onChange={handleMontantHtCalc}
                                variant="standard"
                                size="small"
                                sx={{ width: '23%', input: { textAlign: 'right' }, ...commonSx }}
                                InputProps={{ ...moneyAdornment, inputComponent: FormatedInput }}
                            />
                        </Box>
                    </Box>

                    {/* -------------------------------------------------- */}
                    {/* GROUPE 03 : AMORTISSEMENT */}
                    <Box
                        sx={{
                            backgroundColor: '#edf4f8ff',
                            display: 'flex',
                            flexDirection: 'column',
                            // gap: 8,
                        }}
                    >
                        <Typography style={{ fontWeight: 'normal', fontSize: '16px', marginBottom: '5px' }}>
                            Amortissement
                        </Typography>

                        <TabContext value={form.__amortTab || 'comp'}>
                            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                                <TabList
                                    sx={{ minHeight: 28, '& .MuiTabs-flexContainer': { gap: 1 } }}
                                    TabIndicatorProps={{ sx: { height: 2 } }}
                                    onChange={(e, v) => onChange({ ...form, __amortTab: v })}
                                    aria-label="tabs amortissement"
                                >
                                    <Tab label="Comptable" value="comp" style={{ textTransform: 'none', outline: 'none', border: 'none', }} sx={{ textTransform: 'none', minHeight: 26, padding: '0px 8px', fontSize: 12, lineHeight: 1.2, '&.Mui-selected': { backgroundColor: initial.theme, color: 'white' } }} />
                                    <Tab label="Fiscal" value="fisc" style={{ textTransform: 'none', outline: 'none', border: 'none', }} sx={{ textTransform: 'none', minHeight: 26, padding: '0px 8px', fontSize: 12, lineHeight: 1.2, '&.Mui-selected': { backgroundColor: initial.theme, color: 'white' } }} />
                                </TabList>
                            </Box>

                            <TabPanel value="comp" sx={{ px: 0 }}>
                                <Box display="flex" flexWrap="wrap" gap={2} mt={2}>
                                    <TextField
                                        label="Durée amort (mois)"
                                        type="text"
                                        value={form.duree_amort_mois || ''}
                                        onChange={handleField('duree_amort_mois')}
                                        variant="standard"
                                        size="small"
                                        sx={{ width: '23%', input: { textAlign: 'right' }, ...commonSx }}
                                    />

                                    <TextField
                                        label="Type d'amortissement"
                                        select
                                        value={form.type_amort || ''}
                                        onChange={handleField('type_amort')}
                                        variant="standard"
                                        size="small"
                                        sx={{ width: '23%', ...commonSx }}
                                    >
                                        <MenuItem value="linéaire">linéaire</MenuItem>
                                        <MenuItem value="dégressive">dégressive</MenuItem>
                                        <MenuItem value="non amortissable">non amortissable</MenuItem>
                                    </TextField>
                                </Box>
                                <Box display="flex" flexWrap="wrap" gap={2} mt={2}>
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={repriseComp}
                                                onChange={(e) => {
                                                    const checked = e.target.checked;
                                                    const next = { ...form, reprise_immobilisation_comp: checked };
                                                    if (!checked) {
                                                        next.date_reprise_comp = '';
                                                    }
                                                    onChange(next);
                                                }}
                                                sx={{ p: 0.5 }}
                                            />
                                        }
                                        label="Reprise immobilisation"
                                        sx={{ alignItems: 'center', mt: 0.5, mr: 2 }}
                                    />
                                    {repriseComp ? (
                                        <TextField
                                            label="Date de reprise"
                                            placeholder="jj/mm/aaaa"
                                            value={form.date_reprise_comp ? String(form.date_reprise_comp).substring(0, 10) : ''}
                                            onChange={handleDate('date_reprise_comp')}
                                            variant="standard"
                                            InputLabelProps={{ shrink: true }}
                                            size="small"
                                            type="date"
                                            sx={commonSx}
                                        />
                                    ) : null}
                                </Box>
                                <Box display="flex" flexWrap="wrap" gap={2} mt={2}>
                                    <TextField disabled={amortDisabledComp} label="Amort ant" type="text" value={form.amort_ant_comp ?? ''} onChange={handleAmortComp('amort_ant_comp')} variant="standard" size="small" sx={{ width: '23%', input: { textAlign: 'right' }, ...commonSx }} InputProps={{ ...moneyAdornment, inputComponent: FormatedInput }} />
                                    <TextField disabled={amortDisabledComp} label="Dotation période" type="text" value={form.dotation_periode_comp ?? ''} onChange={handleAmortComp('dotation_periode_comp')} variant="standard" size="small" sx={{ width: '23%', input: { textAlign: 'right' }, ...commonSx }} InputProps={{ ...moneyAdornment, inputComponent: FormatedInput }} />
                                    <TextField disabled={amortDisabledComp} label="Amort exceptionnel" type="text" value={form.amort_exceptionnel_comp ?? ''} onChange={handleAmortComp('amort_exceptionnel_comp')} variant="standard" size="small" sx={{ width: '23%', input: { textAlign: 'right' }, ...commonSx }} InputProps={{ ...moneyAdornment, inputComponent: FormatedInput }} />
                                    <TextField disabled={amortDisabledComp} label="Dérogatoire" type="text" value={form.derogatoire_comp ?? ''} onChange={handleDerogComp} variant="standard" size="small" sx={{ width: '23%', input: { textAlign: 'right' }, ...commonSx }} InputProps={{ ...moneyAdornment, inputComponent: FormatedInput }} />
                                    <TextField label="Total amortissement" type="text" value={form.total_amortissement_comp ?? ''} onChange={handleNumber('total_amortissement_comp')} variant="standard" size="small" sx={{ width: '23%', input: { textAlign: 'right' }, ...commonSx }} InputProps={{ ...moneyAdornment, inputComponent: FormatedInput }} />

                                </Box>
                            </TabPanel>

                            <TabPanel value="fisc" sx={{ px: 0 }}>
                                <Box display="flex" flexWrap="wrap" gap={2} mt={2}>
                                    <TextField
                                        label="Durée amort (mois)"
                                        type="text"
                                        value={form.duree_amort_mois_fisc || ''}
                                        onChange={handleField('duree_amort_mois_fisc')}
                                        variant="standard"
                                        size="small"
                                        sx={{ width: '23%', input: { textAlign: 'right' }, ...commonSx }}
                                    />

                                    <TextField
                                        label="Type d'amortissement"
                                        select
                                        value={form.type_amort_fisc || ''}
                                        onChange={handleField('type_amort_fisc')}
                                        variant="standard"
                                        size="small"
                                        sx={{ width: '23%', ...commonSx }}
                                    >
                                        <MenuItem value="linéaire">linéaire</MenuItem>
                                        <MenuItem value="dégressive">dégressive</MenuItem>
                                        <MenuItem value="non amortissable">non amortissable</MenuItem>
                                    </TextField>
                                </Box>
                                <Box display="flex" flexWrap="wrap" gap={2} mt={2}>
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={repriseFisc}
                                                onChange={(e) => {
                                                    const checked = e.target.checked;
                                                    const next = { ...form, reprise_immobilisation_fisc: checked };
                                                    if (!checked) {
                                                        next.date_reprise_fisc = '';
                                                    }
                                                    onChange(next);
                                                }}
                                                sx={{ p: 0.5, ml: 1 }}
                                            />
                                        }
                                        label="Reprise immobilisation"
                                        sx={{ alignItems: 'center', mt: 0.5, mr: 2 }}
                                    />
                                    {repriseFisc ? (
                                        <TextField
                                            label="Date de reprise"
                                            placeholder="jj/mm/aaaa"
                                            value={form.date_reprise_fisc ? String(form.date_reprise_fisc).substring(0, 10) : ''}
                                            onChange={handleDate('date_reprise_fisc')}
                                            variant="standard"
                                            InputLabelProps={{ shrink: true }}
                                            size="small"
                                            type="date"
                                            sx={commonSx}
                                        />
                                    ) : null}
                                </Box>
                                <Box display="flex" flexWrap="wrap" gap={2} mt={2}>
                                    <TextField disabled={amortDisabledFisc} label="Amort ant" type="text" value={form.amort_ant_fisc ?? ''} onChange={handleAmortFisc('amort_ant_fisc')} variant="standard" size="small" sx={{ width: '23%', input: { textAlign: 'right' }, ...commonSx }} InputProps={{ ...moneyAdornment, inputComponent: FormatedInput }} />
                                    <TextField disabled={amortDisabledFisc} label="Dotation période" type="text" value={form.dotation_periode_fisc ?? ''} onChange={handleAmortFisc('dotation_periode_fisc')} variant="standard" size="small" sx={{ width: '23%', input: { textAlign: 'right' }, ...commonSx }} InputProps={{ ...moneyAdornment, inputComponent: FormatedInput }} />
                                    <TextField disabled={amortDisabledFisc} label="Amort exceptionnel" type="text" value={form.amort_exceptionnel_fisc ?? ''} onChange={handleAmortFisc('amort_exceptionnel_fisc')} variant="standard" size="small" sx={{ width: '23%', input: { textAlign: 'right' }, ...commonSx }} InputProps={{ ...moneyAdornment, inputComponent: FormatedInput }} />
                                    <TextField disabled={amortDisabledFisc} label="Dérogatoire" type="text" value={form.derogatoire_fisc ?? ''} onChange={handleNumber('derogatoire_fisc')} variant="standard" size="small" sx={{ width: '23%', input: { textAlign: 'right' }, ...commonSx }} InputProps={{ ...moneyAdornment, inputComponent: FormatedInput }} />

                                    <TextField label="Total amortissement" type="text" value={form.total_amortissement_fisc ?? ''} onChange={handleNumber('total_amortissement_fisc')} variant="standard" size="small" sx={{ width: '23%', input: { textAlign: 'right' }, ...commonSx }} InputProps={{ ...moneyAdornment, inputComponent: FormatedInput }} />

                                </Box>
                            </TabPanel>
                        </TabContext>
                    </Box>

                    {/* -------------------------------------------------- */}
                    {/* GROUPE 04 : VNC */}
                    <Box sx={{ backgroundColor: '#edf4f8ff', }}>
                        <Typography style={{ fontWeight: 'normal', fontSize: '19px', marginBottom: '10px' }}>Valeur Nette Comptable</Typography>

                        <Box display="flex" flexWrap="wrap" gap={2} mt={2}>
                            <TextField
                                label="VNC"
                                type="text"
                                value={vncDisplay}
                                disabled
                                variant="standard"
                                size="small"
                                sx={{ input: { textAlign: 'right' }, ...commonSx }}
                                InputProps={{ ...moneyAdornment, inputComponent: FormatedInput }}
                            />
                        </Box>
                    </Box>

                    {/* -------------------------------------------------- */}
                    {/*  GROUPE 05 : AUTRES */}
                    {/* -------------------------------------------------- */}
                    <Box
                        sx={{
                            mt: -3,
                            mb: 3
                        }}
                    >
                        <Stack direction={'row'} alignItems={'baseline'} justifyContent={'space-between'}>
                            <FormControl
                                size="small"
                                variant="standard"
                                fullWidth
                                style={{ width: '32%' }}
                            >
                                <InputLabel
                                    sx={{
                                        color: '#1976d2',
                                        fontSize: '13px',
                                    }}
                                >
                                    Etat
                                </InputLabel>
                                <Select
                                    value={form.etat || 'enService'}
                                    onChange={handleField('etat')}
                                    name="typeTier"
                                >
                                    <MenuItem value={'enService'}>En service</MenuItem>
                                    <MenuItem value={'horsService'}>Hors service</MenuItem>
                                    <MenuItem value={'misEnRebus'}>Mis en rébus</MenuItem>
                                    <MenuItem value={'cassee'}>Cassée</MenuItem>
                                    <MenuItem value={'miseEnVente'}>Mise en vente</MenuItem>
                                </Select>
                            </FormControl>
                            <TextField
                                style={{ width: '32%' }}
                                disabled={form.etat === 'enService'}
                                label="Date de sortie"
                                placeholder="jj/mm/aaaa"
                                value={form.date_sortie ? String(form.date_sortie).substring(0, 10) : ''}
                                onChange={handleDate('date_sortie')}
                                variant="standard"
                                InputLabelProps={{ shrink: true }}
                                size="small"
                                type="date"
                                sx={commonSx}
                            />

                            <TextField
                                style={{ width: '32%' }}
                                disabled={form.etat !== 'miseEnVente'}
                                label="Prix de vente"
                                type="text"
                                value={form.prix_vente || ''}
                                onChange={handleNumber('prix_vente')}
                                variant="standard"
                                size="small"
                                sx={{ input: { textAlign: 'right' }, ...commonSx }}
                                InputProps={{ ...moneyAdornment, inputComponent: FormatedInput }}
                            />
                        </Stack>
                    </Box>
                    <TextField
                        label="Lien écriture"
                        type="text"
                        value={''}
                        onClick={() => onOpenLienEcriture && onOpenLienEcriture()}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && onOpenLienEcriture) {
                                e.preventDefault();
                                onOpenLienEcriture();
                            }
                        }}
                        variant="standard"
                        size="small"
                        disabled
                        sx={{
                            ...commonSx,
                            cursor: 'pointer',
                            mt: -8,
                            mb: 2
                        }}
                        InputProps={{
                            readOnly: true,
                            startAdornment: form?.lien_ecriture_id ? (
                                <InputAdornment position="start">
                                    <GoLink color={initial.theme} size={18} />
                                </InputAdornment>
                            ) : null,
                            endAdornment: (
                                <InputAdornment position="end">
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.2 }}>
                                        <IconButton onClick={(e) => { e.preventDefault(); e.stopPropagation(); onOpenLienEcriture && onOpenLienEcriture(); }} size="small">
                                            <FaSquarePlus style={{ width: 20, height: 20, color: initial.theme }} />
                                        </IconButton>
                                        {form?.lien_ecriture_id ? (
                                            <IconButton
                                                size="small"
                                                variant="outlined"
                                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onChange({ ...form, lien_ecriture_id: null }); }}
                                            >
                                                <IoMdTrash style={{ width: 20, height: 20, color: 'red' }} />
                                            </IconButton>
                                        ) : null}
                                    </Box>
                                </InputAdornment>
                            ),
                        }}
                    />
                </Box >
            </DialogContent >

            <DialogActions>
                <Button autoFocus
                    onClick={onClose}
                    variant='outlined'
                    style={{
                        backgroundColor: "transparent",
                        color: initial.theme,
                        width: "100px",
                        textTransform: 'none',
                        //outline: 'none',
                    }}
                >
                    Annuler
                </Button>
                <Button autoFocus
                    variant="contained" onClick={onSubmit} disabled={loading}
                    style={{ backgroundColor: initial.theme, color: 'white', width: "100px", textTransform: 'none', outline: 'none' }}>
                    {mode === 'add' ? 'Enregistrer' : 'Enregistrer'}
                </Button>
            </DialogActions>

        </Dialog >
    );
};

export default DetailsImmoDialog;