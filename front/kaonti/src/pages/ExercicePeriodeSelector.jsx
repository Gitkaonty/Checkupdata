import { useState, useEffect, useCallback, useMemo } from 'react';
import { Select, MenuItem, Stack, Typography, Box, Divider } from '@mui/material';
import axios from '../../config/axios';
import useAuth from '../hooks/useAuth';
import { jwtDecode } from 'jwt-decode';

const ExercicePeriodeSelector = ({
    selectedExerciceId,
    selectedPeriodeId,
    onExerciceChange,
    onPeriodeChange,
    dossierId,
    disabled = false,
    showPeriodeOnly = false,
    size = "small",
    sx = {},
    exerciceSx = {},
    periodeSx = {}
}) => {
    const [listeExercice, setListeExercice] = useState([]);
    const [listePeriodes, setListePeriodes] = useState([]);
    const [loading, setLoading] = useState(false);

    // Récupérer les IDs depuis JWT token (priorité) et sessionStorage (fallback)
    const { auth } = useAuth();
    const getIds = () => {
        const decodedCompteId = auth?.accessToken ? jwtDecode(auth.accessToken)?.UserInfo?.compteId : null;
        return {
            id_compte: parseInt(decodedCompteId) || parseInt(sessionStorage.getItem('compteId')) || 1,
            id_dossier: parseInt(sessionStorage.getItem('fileId')) || 1
        };
    };

    // Formatter les dates
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    // Récupérer les exercices
    const fetchExercices = useCallback(async () => {
        try {
            setLoading(true);
            const idDossier = dossierId ? Number(dossierId) : getIds().id_dossier;
            if (!idDossier) {
                setListeExercice([]);
                return;
            }

            const response = await axios.get(`/paramExercice/listeExercice/${idDossier}`);
            const resData = response.data;
            if (resData.state) {
                setListeExercice(resData.list || []);
            }
        } catch (error) {
            console.error('Error fetching exercices:', error);
            setListeExercice([]);
        } finally {
            setLoading(false);
        }
    }, [dossierId]);

    // Récupérer les périodes pour un exercice
    const fetchPeriodes = useCallback(async (exerciceId) => {
        if (!exerciceId) {
            setListePeriodes([]);
            return;
        }
        try {
            const response = await axios.get(`/paramExercice/listePeriodes/${exerciceId}`);
            if (response.data.state) {
                setListePeriodes(response.data.list || []);
            } else {
                setListePeriodes([]);
            }
        } catch (error) {
            console.error('Error fetching periodes:', error);
            setListePeriodes([]);
        }
    }, []);

    // Effet pour charger les exercices au montage
    useEffect(() => {
        fetchExercices();
    }, [fetchExercices]);

    // Effet pour charger les périodes quand l'exercice change
    useEffect(() => {
        if (selectedExerciceId && selectedExerciceId > 0) {
            fetchPeriodes(selectedExerciceId);
        } else {
            setListePeriodes([]);
        }
    }, [selectedExerciceId, fetchPeriodes]);

    // Gérer le changement d'exercice
    const handleExerciceChange = (exerciceId) => {
        onExerciceChange(exerciceId);
        // Réinitialiser la période quand l'exercice change
        if (onPeriodeChange) {
            onPeriodeChange('');
        }
    };

    // Récupérer les dates de l'exercice courant
    const currentExerciceDates = useMemo(() => {
        const exercice = listeExercice.find(e => e.id === selectedExerciceId);
        if (exercice) {
            return {
                date_debut: exercice.date_debut,
                date_fin: exercice.date_fin,
                libelle_rang: exercice.libelle_rang
            };
        }
        return null;
    }, [listeExercice, selectedExerciceId]);

    return (
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
                ml: -2 
            }}
        >
            <Box sx={{ px: 2, py: 0.5 }}>
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
                    Exercice
                </Typography>
                {!showPeriodeOnly && (
                    <Select
                        size={size}
                        value={selectedExerciceId || ''}
                        onChange={(e) => handleExerciceChange(e.target.value)}
                        disabled={disabled || loading}
                        variant="standard"
                        disableUnderline
                        displayEmpty
                        sx={{
                            height: 24,
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            color: '#1E293B',
                            minWidth: 100,
                            '& .MuiSelect-select': { py: 0 }
                        }}
                    >
                        <MenuItem value="" disabled>
                            <em>Sélectionner un exercice...</em>
                        </MenuItem>
                        {listeExercice.map((exercice) => (
                            <MenuItem
                                key={exercice.id}
                                value={exercice.id}
                                sx={{
                                    fontSize: '0.8rem',
                                    minHeight: 28,
                                    py: 0.5
                                }}
                            >
                                {exercice.libelle_rang} - {formatDate(exercice.date_debut)} au {formatDate(exercice.date_fin)}
                            </MenuItem>
                        ))}
                    </Select>
                )}
            </Box>

            <Divider orientation="vertical" flexItem sx={{ height: 28, alignSelf: 'center', borderColor: '#E2E8F0' }} />
            <Box sx={{ px: 2, py: 0.5 }}>
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
                    Période
                </Typography>
                {listePeriodes.length > 0 && (
                    <Select

                        value={selectedPeriodeId || ''}
                        onChange={(e) => onPeriodeChange(e.target.value)}
                        disabled={disabled || loading || (!selectedExerciceId && !showPeriodeOnly)}
                        displayEmpty
                        size="small"
                        variant="standard"
                        disableUnderline
                        sx={{
                            height: 24,
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            color: '#1E293B',
                            minWidth: 140,
                            '& .MuiSelect-select': { py: 0 }
                        }}
                    >
                        <MenuItem value="">
                            <em>Sélectionner une période...</em>
                        </MenuItem>
                        {/* {!showPeriodeOnly && (
                        <MenuItem value="exercice">
                            <em>Tout l'exercice</em>
                        </MenuItem>
                    )} */}
                        {listePeriodes.map((periode) => (
                            <MenuItem
                                key={periode.id}
                                value={periode.id}
                                sx={{
                                    fontSize: '0.8rem',
                                    minHeight: 28,
                                    py: 0.5
                                }}
                            >
                                {periode.libelle} {formatDate(periode.date_debut)} au {formatDate(periode.date_fin)}
                            </MenuItem>
                        ))}
                    </Select>
                )}
            </Box>

            {/* {currentExerciceDates && !showPeriodeOnly && (
                <Typography variant="caption" sx={{ color: 'gray', ml: 1 }}>
                    Exercice: {formatDate(currentExerciceDates.date_debut)} au {formatDate(currentExerciceDates.date_fin)}
                </Typography>
            )} */}
        </Stack>
    );
};

export default ExercicePeriodeSelector;
