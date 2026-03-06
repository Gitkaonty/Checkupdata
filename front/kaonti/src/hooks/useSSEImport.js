import { useState, useRef, useCallback } from 'react';
import useAuth from './useAuth';
import { URL } from '../../config/axios';

// Utiliser la même URL de base que axios
const API_BASE_URL = URL;

/**
 * Hook personnalisé pour gérer les imports avec Server-Sent Events (SSE)
 * Permet de recevoir la progression en temps réel depuis le backend
 */
const useSSEImport = () => {
    const [isImporting, setIsImporting] = useState(false);
    const [progress, setProgress] = useState(0);
    const [message, setMessage] = useState('');
    const [currentLine, setCurrentLine] = useState(0);
    const [totalLines, setTotalLines] = useState(0);
    const eventSourceRef = useRef(null);
    const { auth } = useAuth();

    /**
     * Démarre l'import avec SSE
     * @param {string} url - URL de l'endpoint SSE (chemin relatif)
     * @param {object} data - Données à envoyer
     * @param {function} onComplete - Callback appelé quand l'import est terminé avec succès
     * @param {function} onError - Callback appelé en cas d'erreur
     */
    const startImport = useCallback((url, data, onComplete, onError) => {
        // Fermer toute connexion SSE existante
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
        }

        setIsImporting(true);
        setProgress(0);
        setMessage('Connexion au serveur...');
        setCurrentLine(0);
        setTotalLines(0);

        // Créer une requête POST avec fetch pour envoyer les données
        // puis établir une connexion SSE
        const token = auth?.accessToken;
        const fullUrl = `${API_BASE_URL}${url}`;
        
        fetch(fullUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        }).then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Lire le stream de réponse
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            const processStream = ({ done, value }) => {
                if (done) {
                    setIsImporting(false);
                    return;
                }

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n\n');
                buffer = lines.pop() || '';

                lines.forEach(line => {
                    if (line.startsWith('data: ')) {
                        try {
                            const eventData = JSON.parse(line.substring(6));
                            
                            switch (eventData.type) {
                                case 'progress':
                                    setProgress(eventData.progress);
                                    setMessage(eventData.message);
                                    setCurrentLine(eventData.current || 0);
                                    setTotalLines(eventData.total || 0);
                                    break;

                                case 'complete':
                                    setProgress(100);
                                    setMessage(eventData.message);
                                    // `total/current` = nb de lignes envoyées / traitées
                                    // `nbrligne` = nb de lignes réellement importées (retourné par nos endpoints)
                                    setCurrentLine(eventData.nbrligne ?? eventData.total ?? eventData.current ?? 0);
                                    setTotalLines(eventData.total ?? eventData.current ?? 0);
                                    setIsImporting(false);
                                    if (onComplete) {
                                        onComplete(eventData);
                                    }
                                    break;

                                case 'error':
                                    setIsImporting(false);
                                    setProgress(0);
                                    if (onError) {
                                        onError(eventData.message || eventData.error);
                                    }
                                    break;

                                default:
                                    break;
                            }
                        } catch (error) {
                            console.error('Erreur parsing SSE:', error);
                        }
                    }
                });

                return reader.read().then(processStream);
            };

            return reader.read().then(processStream);
        }).catch(error => {
            console.error('Erreur SSE:', error);
            setIsImporting(false);
            setProgress(0);
            if (onError) {
                onError(error.message || 'Erreur de connexion au serveur');
            }
        });
    }, [auth]);

    /**
     * Annule l'import en cours
     */
    const cancelImport = useCallback(() => {
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
        }
        setIsImporting(false);
        setProgress(0);
        setMessage('');
        setCurrentLine(0);
        setTotalLines(0);
    }, []);

    return {
        isImporting,
        progress,
        message,
        currentLine,
        totalLines,
        startImport,
        cancelImport
    };
};

export default useSSEImport;
