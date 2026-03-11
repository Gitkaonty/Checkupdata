import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  Alert
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { DataGridStyle } from '../DatagridToolsStyle';

export default function CsvAnomaliesDialog({ open, onClose, anomalies = [], personnels = [] }) {

  // Debug: Tracer les anomalies reçues
  React.useEffect(() => {
    console.log('[DEBUG] CsvAnomaliesDialog - Anomalies reçues:', anomalies);
    console.log('[DEBUG] CsvAnomaliesDialog - Nombre d\'anomalies:', anomalies.length);
    console.log('[DEBUG] CsvAnomaliesDialog - Dialog ouvert:', open);
  }, [anomalies, open]);

  // Colonnes pour le tableau des anomalies
  const columns = [
    {
      field: 'ligne',
      headerName: 'Ligne',
      width: 80,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          color="primary"
          variant="outlined"
        />
      )
    },
    {
      field: 'personnelId',
      headerName: 'Matricule / Personnel',
      width: 120,
      renderCell: (params) => {
        // Récupérer l'ID ou le matricule depuis les données CSV
        const data = params.row?.data || {};
        const personnelId = data.personnel_id || data.personnelId;
        const matricule = data.matricule || data.Matricule || data.matricule_employe;
        const hasErrorList = Array.isArray(params.row?.errors) ? params.row.errors : [];
        return (
          <Typography variant="body2" color={hasErrorList.includes('personnel_introuvable') ? 'error' : 'inherit'}>
            {matricule || personnelId || 'N/A'}
          </Typography>
        );
      }
    },
    {
      field: 'nom_prenom',
      headerName: 'Nom/Prénom',
      width: 150,
      renderCell: (params) => {
        const data = params.row?.data || {};
        // Récupérer l'ID du personnel ou le matricule depuis les données CSV
        const personnelId = data.personnel_id || data.personnelId;
        const matricule = data.matricule || data.Matricule || data.matricule_employe;

        // Chercher le personnel dans la liste
        let personnel = undefined;
        if (personnelId !== undefined) {
          personnel = personnels.find(p => String(p.id) === String(personnelId));
        }
        if (!personnel && matricule) {
          const normalize = (m) => String(m ?? '').replace(/\s/g, '').toLowerCase();
          personnel = personnels.find(p => normalize(p.matricule) === normalize(matricule));
        }

        if (personnel) {
          return `${personnel.nom || ''} ${personnel.prenom || ''}`.trim();
        }

        return 'Personnel introuvable';
      }
    },
    {
      field: 'type_erreur',
      headerName: "Type d'erreur",
      width: 150,
      renderCell: (params) => {
        const errorTypes = Array.isArray(params.row?.errors) ? params.row.errors : [];
        const severity = errorTypes.includes('personnel_introuvable') ? 'error' :
          errorTypes.includes('champ_manquant') ? 'warning' :
            errorTypes.includes('valeur_negative') ? 'error' : 'info';

        return (
          <Chip
            label={errorTypes[0]?.replace('_', ' ') || 'Erreur inconnue'}
            size="small"
            color={severity}
            icon={severity === 'error' ? <ErrorIcon /> : <WarningIcon />}
          />
        );
      }
    },
    {
      field: 'description',
      headerName: 'Description',
      width: 300,
      renderCell: (params) => {
        const errors = Array.isArray(params.row?.errors) ? params.row.errors : [];
        const descriptions = [];

        if (errors.includes('personnel_introuvable')) {
          const data = params.row?.data || {};
          const matricule = data.matricule || data.Matricule || data.matricule_employe;
          const personnelId = data.personnel_id || data.personnelId;
          descriptions.push(`Personnel ${matricule || personnelId || 'inconnu'} introuvable`);
        }
        if (errors.includes('champ_manquant')) {
          descriptions.push('Champs obligatoires manquants');
        }
        if (errors.includes('valeur_invalide')) {
          descriptions.push('Valeurs numériques invalides');
        }
        if (errors.includes('valeur_negative')) {
          descriptions.push('Valeurs négatives non autorisées');
        }

        return (
          <Typography variant="body2" color="text.secondary">
            {descriptions.join(', ') || 'Erreur non spécifiée'}
          </Typography>
        );
      }
    },
    {
      field: 'donnees_brutes',
      headerName: 'Champs problématiques',
      width: 250,
      renderCell: (params) => {
        const data = params.row?.data || {};
        const errors = Array.isArray(params.row?.errors) ? params.row.errors : [];
        const problematicFields = [];

        // Extraire les champs problématiques selon le type d'erreur
        if (errors.includes('personnel_introuvable') || errors.includes('champ_manquant')) {
          const personnelId = data.personnel_id || data.personnelId;
          const matricule = data.matricule || data.Matricule || data.matricule_employe;
          if (matricule) {
            problematicFields.push(`matricule: ${matricule}`);
          } else if (personnelId) {
            problematicFields.push(`personnel_id: ${personnelId}`);
          } else {
            problematicFields.push('personnel_id: manquant');
          }
        }

        if (errors.includes('valeur_invalide') || errors.includes('valeur_negative')) {
          // Champs numériques à vérifier
          const numericFields = ['salaireBase', 'prime', 'heuresSup', 'indemnites', 'remunerationFerieDimanche', 'assurance', 'carburant', 'entretienReparation', 'loyerMensuel', 'depenseTelephone', 'autresAvantagesNature', 'avanceQuinzaineAutres', 'avancesSpeciales', 'allocationFamiliale', 'nombre_enfants_charge'];

          for (const field of numericFields) {
            const value = data[field];
            if (value !== undefined && value !== null && value !== '') {
              const numValue = parseFloat(value);
              // Afficher si c'est invalide ou négatif
              if (isNaN(numValue) || numValue < 0) {
                problematicFields.push(`${field}: ${value}`);
              }
            }
          }
        }

        return (
          <Typography variant="caption" sx={{ fontFamily: 'monospace', fontSize: '0.7rem', color: 'error.main' }}>
            {problematicFields.length > 0 ? problematicFields.join(', ') : 'Erreur non identifiée'}
          </Typography>
        );
      }
    }
  ];

  // Statistiques des anomalies
  const stats = {
    total: anomalies.length,
    personnel_introuvable: anomalies.filter(a => Array.isArray(a.errors) && a.errors.includes('personnel_introuvable')).length,
    champ_manquant: anomalies.filter(a => Array.isArray(a.errors) && a.errors.includes('champ_manquant')).length,
    valeur_invalide: anomalies.filter(a => Array.isArray(a.errors) && a.errors.includes('valeur_invalide')).length,
    valeur_negative: anomalies.filter(a => Array.isArray(a.errors) && a.errors.includes('valeur_negative')).length
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, backgroundColor: 'rgba(255,152,0,0.05)' }}>
        <WarningIcon sx={{ color: 'rgba(255,152,0,0.80)' }} />
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Anomalies détectées lors de l'import CSV
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        {anomalies.length === 0 ? (
          <Alert severity="success" icon={<CheckCircleIcon />} sx={{ mb: 2 }}>
            <Typography variant="body1">
              Aucune anomalie détectée ! Toutes les données ont été importées avec succès.
            </Typography>
          </Alert>
        ) : (
          <>
            {/* Statistiques */}
            <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Chip
                label={`Total: ${stats.total}`}
                color="primary"
                variant="outlined"
              />
              {stats.personnel_introuvable > 0 && (
                <Chip
                  label={`Personnel introuvable: ${stats.personnel_introuvable}`}
                  color="error"
                  size="small"
                />
              )}
              {stats.champ_manquant > 0 && (
                <Chip
                  label={`Champs manquants: ${stats.champ_manquant}`}
                  color="warning"
                  size="small"
                />
              )}
              {stats.valeur_invalide > 0 && (
                <Chip
                  label={`Valeurs invalides: ${stats.valeur_invalide}`}
                  color="info"
                  size="small"
                />
              )}
              {stats.valeur_negative > 0 && (
                <Chip
                  label={`Valeurs négatives: ${stats.valeur_negative}`}
                  color="error"
                  size="small"
                />
              )}
            </Box>

            {/* Tableau des anomalies */}
            <Box sx={{ height: 400, width: '100%' }}>
              <DataGrid
                rows={anomalies}
                columns={columns}
                pageSize={10}
                rowsPerPageOptions={[10, 25, 50]}
                disableSelectionOnClick
                getRowId={(row) => row.ligne}
                sx={{
                  '& .MuiDataGrid-row:hover': {
                    backgroundColor: 'rgba(255,152,0,0.05)',
                  },
                  ...DataGridStyle.sx,
                  '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': {
                    outline: 'none',
                    border: 'none',
                  },
                  '& .MuiDataGrid-virtualScroller': {
                    maxHeight: '100%',
                  },
                  '& .MuiDataGrid-columnHeaders': {
                    backgroundColor: initial.theme,
                    color: 'white',
                    fontWeight: 'bold',
                  },

                }}
              />
            </Box>

            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                💡 <strong>Conseil :</strong> Corrigez les données dans votre fichier CSV et réimportez.
                Les lignes avec des erreurs n'ont pas été ajoutées à la base de données.
              </Typography>
            </Alert>
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="contained" color="primary">
          Fermer
        </Button>
      </DialogActions>
    </Dialog>
  );
}
