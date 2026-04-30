/**
 * Middleware générique pour gérer la progression SSE (Server-Sent Events)
 * Utilisable pour tous les types d'imports
 */

/**
 * Wrapper pour exécuter une fonction d'import avec progression SSE
 * @param {Function} importFunction - Fonction d'import à exécuter (doit retourner une Promise)
 * @param {Object} options - Options de configuration
 * @param {number} options.batchSize - Taille des lots pour le traitement (défaut: 50)
 * @param {Array} options.steps - Étapes personnalisées avec leurs pourcentages
 */
const withSSEProgress = (importFunction, options = {}) => {
  return async (req, res) => {
    // Configuration SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    // CORS headers for SSE
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.flushHeaders();

    const { batchSize = 50, steps = [] } = options;

    // Fonction pour envoyer des événements SSE
    const sendProgress = (data) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    // Objet de progression partagé
    const progressTracker = {
      current: 0,
      total: 0,
      progress: 0,
      message: '',
      
      // Méthode pour mettre à jour la progression
      update: (current, total, message, progress = null) => {
        progressTracker.current = current;
        progressTracker.total = total;
        progressTracker.message = message;
        
        if (progress !== null) {
          progressTracker.progress = progress;
        } else if (total > 0) {
          progressTracker.progress = Math.floor((current / total) * 100);
        }
        
        sendProgress({
          type: 'progress',
          message: progressTracker.message,
          progress: progressTracker.progress,
          current: progressTracker.current,
          total: progressTracker.total
        });
      },
      
      // Méthode pour envoyer une étape spécifique
      step: (stepName, progress, message = null) => {
        progressTracker.progress = progress;
        progressTracker.message = message || stepName;
        
        sendProgress({
          type: 'progress',
          message: progressTracker.message,
          progress: progressTracker.progress,
          current: progressTracker.current,
          total: progressTracker.total
        });
      },
      
      // Méthode pour traiter des données par lots
      processBatch: async (data, processFn, startProgress = 10, endProgress = 80, message = 'Traitement en cours...') => {
        const total = data.length;
        const batches = [];
        
        for (let i = 0; i < total; i += batchSize) {
          batches.push(data.slice(i, i + batchSize));
        }
        
        let processed = 0;
        const results = [];
        
        for (let i = 0; i < batches.length; i++) {
          const batchResult = await processFn(batches[i], i);
          results.push(...(Array.isArray(batchResult) ? batchResult : [batchResult]));
          
          processed += batches[i].length;
          const batchProgress = startProgress + Math.floor((processed / total) * (endProgress - startProgress));
          
          progressTracker.update(processed, total, message, batchProgress);
        }
        
        return results;
      },
      
      // Méthode pour signaler la fin avec succès
      complete: (message, data = {}) => {
        sendProgress({
          type: 'complete',
          message: message,
          progress: 100,
          current: progressTracker.total,
          total: progressTracker.total,
          ...data
        });
        res.end();
      },
      
      // Méthode pour signaler une erreur
      error: (message, error = null) => {
        sendProgress({
          type: 'error',
          message: message,
          error: error?.message || error,
          progress: 0
        });
        res.end();
      }
    };

    try {
      // Exécuter la fonction d'import avec le tracker de progression
      await importFunction(req, res, progressTracker);
      
    } catch (error) {
      console.error('Erreur SSE:', error);
      progressTracker.error('Erreur lors du traitement', error);
    }
  };
};

module.exports = {
  withSSEProgress
};
