import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import axios from '../../config/axios';

const ExercicePeriodeContext = createContext();

export const useExercicePeriode = () => {
    const context = useContext(ExercicePeriodeContext);
    if (!context) {
        throw new Error('useExercicePeriode doit être utilisé dans un ExercicePeriodeProvider');
    }
    return context;
};

export const ExercicePeriodeProvider = ({ children }) => {
    const [selectedExerciceId, setSelectedExerciceId] = useState('');
    const [selectedPeriodeId, setSelectedPeriodeId] = useState('');
    const [selectedPeriodeDates, setSelectedPeriodeDates] = useState(null);
    const [listeExercice, setListeExercice] = useState([]);
    const [listePeriodes, setListePeriodes] = useState([]);
    const [loading, setLoading] = useState(false);

    // Récupérer les IDs depuis sessionStorage
    const getIds = () => {
        return {
            id_compte: parseInt(sessionStorage.getItem('compteId')) || 1,
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
            const { id_dossier } = getIds();
            const response = await axios.get(`/paramExercice/listeExercice/${id_dossier}`);
            const resData = response.data;
            if (resData.state) {
                setListeExercice(resData.list || []);
                // Auto-sélectionner le premier exercice si aucun n'est sélectionné
                if (resData.list && resData.list.length > 0 && !selectedExerciceId) {
                    setSelectedExerciceId(resData.list[0].id);
                }
            }
        } catch (error) {
            console.error('Error fetching exercices:', error);
            setListeExercice([]);
        } finally {
            setLoading(false);
        }
    }, [selectedExerciceId]);

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

    // Gérer le changement d'exercice
    const handleChangeExercice = useCallback((exerciceId) => {
        setSelectedExerciceId(exerciceId);
        setSelectedPeriodeId('');
        setSelectedPeriodeDates(null);
        fetchPeriodes(exerciceId);
    }, [fetchPeriodes]);

    // Gérer le changement de période
    const handleChangePeriode = useCallback((periodeId) => {
        setSelectedPeriodeId(periodeId);
        setSelectedPeriodeDates(null);
        
        if (periodeId && periodeId !== 'exercice') {
            const periode = listePeriodes.find(p => p.id === periodeId);
            if (periode) {
                setSelectedPeriodeDates({
                    date_debut: periode.date_debut,
                    date_fin: periode.date_fin
                });
            }
        }
    }, [listePeriodes]);

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

    // Obtenir les paramètres pour les API
    const getApiParams = useCallback(() => {
        const params = new URLSearchParams();
        
        if (selectedPeriodeDates) {
            params.append('date_debut', selectedPeriodeDates.date_debut);
            params.append('date_fin', selectedPeriodeDates.date_fin);
        } else if (currentExerciceDates) {
            params.append('date_debut', currentExerciceDates.date_debut);
            params.append('date_fin', currentExerciceDates.date_fin);
        }
        
        if (selectedPeriodeId) {
            params.append('id_periode', selectedPeriodeId);
        }
        
        return params;
    }, [selectedPeriodeDates, currentExerciceDates, selectedPeriodeId]);

    // Effet pour charger les exercices au montage
    useEffect(() => {
        fetchExercices();
    }, [fetchExercices]);

    // Effet pour charger les périodes quand l'exercice change
    useEffect(() => {
        if (selectedExerciceId) {
            fetchPeriodes(selectedExerciceId);
        } else {
            setListePeriodes([]);
        }
    }, [selectedExerciceId, fetchPeriodes]);

    const value = {
        // États
        selectedExerciceId,
        selectedPeriodeId,
        selectedPeriodeDates,
        listeExercice,
        listePeriodes,
        loading,
        currentExerciceDates,
        
        // Actions
        handleChangeExercice,
        handleChangePeriode,
        setSelectedExerciceId,
        setSelectedPeriodeId,
        
        // Utilitaires
        formatDate,
        getApiParams,
        getIds
    };

    return (
        <ExercicePeriodeContext.Provider value={value}>
            {children}
        </ExercicePeriodeContext.Provider>
    );
};

export default ExercicePeriodeContext;
