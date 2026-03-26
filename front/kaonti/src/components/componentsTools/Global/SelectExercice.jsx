import { MenuItem, Paper, Stack, TextField } from "@mui/material"
import {
    CalendarToday
} from '@mui/icons-material';
import { format } from "date-fns";
import { useMemo } from "react";

const COLORS = {
    navy: '#0F172A',
    electric: '#0EA5E9',
    cyan: '#22D3EE',
    success: '#10B981',
    error: '#EF4444',
    border: '#E2E8F0',
    bg: '#F8FAFC'
};

const SelectExercice = ({ selectedExerciceId, handleChangeExercice, listeExercice, listePeriode, selectedPeriodeChoiceId, selectedPeriodeId, handleChangePeriod, handleChangePeriode, avecPeriode }) => {

    const exerciceMemo = useMemo(() => {
        return listeExercice.map(option => ({
            ...option,
            label: `${option.libelle_rang}: ${format(option.date_debut, "dd/MM/yyyy")} - ${format(option.date_fin, "dd/MM/yyyy")}`
        }));
    }, [listeExercice]);

    const periodeMemo = useMemo(() => {
        return listePeriode.map(option => ({
            ...option,
            label: `${format(option.date_debut, "dd/MM/yyyy")} - ${format(option.date_fin, "dd/MM/yyyy")}`
        }));
    }, [listePeriode]);

    return (
        <Stack sx={{ mt: 1.5 }} spacing={1} direction={'row'}>
            <Paper
                variant="outlined"
                sx={{
                    px: 1.5, py: 0.5, borderRadius: '8px', bgcolor: '#FFF',
                    borderColor: COLORS.border, display: 'inline-flex', alignItems: 'center'
                }}
            >
                <CalendarToday sx={{ fontSize: 18, color: COLORS.textMuted, mr: 1.5 }} />
                <TextField
                    label='Exercice'
                    select
                    size="small"
                    variant="standard"
                    InputProps={{ disableUnderline: true }}
                    sx={{
                        minWidth: 160,
                        '& .MuiSelect-select': { py: 0, fontWeight: 800, color: COLORS.navy, fontSize: '0.95rem' }
                    }}
                    value={selectedExerciceId}
                    onChange={(e) => handleChangeExercice(e.target.value)}
                >
                    {exerciceMemo.map(option => (
                        <MenuItem key={option.id} value={option.id}>{option.label}</MenuItem>
                    ))}
                </TextField>
            </Paper>
            {
                avecPeriode && (
                    <>
                        <Paper
                            variant="outlined"
                            sx={{
                                px: 1.5, py: 0.5, borderRadius: '8px', bgcolor: '#FFF',
                                borderColor: COLORS.border, display: 'inline-flex', alignItems: 'center'
                            }}
                        >
                            <CalendarToday sx={{ fontSize: 18, color: COLORS.textMuted, mr: 1.5 }} />
                            <TextField
                                label='Situation'
                                select
                                size="small"
                                variant="standard"
                                InputProps={{ disableUnderline: true }}
                                sx={{
                                    minWidth: 100,
                                    '& .MuiSelect-select': { py: 0, fontWeight: 800, color: COLORS.navy, fontSize: '0.95rem' }
                                }}
                                value={selectedPeriodeChoiceId}
                                onChange={(e) => handleChangePeriode(e.target.value)}
                            >
                                <MenuItem value={0}>Toutes</MenuItem>
                                <MenuItem value={1}>Période</MenuItem>
                            </TextField>
                        </Paper>
                        <Paper
                            variant="outlined"
                            sx={{
                                px: 1.5, py: 0.5, borderRadius: '8px', bgcolor: '#FFF',
                                borderColor: COLORS.border, display: 'inline-flex', alignItems: 'center'
                            }}
                        >
                            <CalendarToday sx={{ fontSize: 18, color: COLORS.textMuted, mr: 1.5 }} />
                            <TextField
                                label='Période'
                                select
                                size="small"
                                variant="standard"
                                InputProps={{ disableUnderline: true }}
                                sx={{
                                    minWidth: 160,
                                    '& .MuiSelect-select': { py: 0, fontWeight: 800, color: COLORS.navy, fontSize: '0.95rem' }
                                }}
                                disabled={selectedPeriodeChoiceId === 0}
                                value={selectedPeriodeId}
                                onChange={(e) => {
                                    handleChangePeriod(e.target.value)
                                }}
                            >
                                {periodeMemo.map(option => (
                                    <MenuItem key={option.id} value={option.id}>{option.label}</MenuItem>
                                ))}
                            </TextField>
                        </Paper>
                    </>
                )
            }
        </Stack>
    );
};
export default SelectExercice