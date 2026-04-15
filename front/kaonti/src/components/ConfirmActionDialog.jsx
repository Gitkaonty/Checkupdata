import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Stack,
  CircularProgress
} from '@mui/material';
import { HelpOutline, CheckCircleOutline } from '@mui/icons-material';

const ConfirmActionDialog = ({ 
  open, 
  onClose, 
  onConfirm, 
  title = "Confirmer l'action", 
  message = "Voulez-vous valider cette opération ?",
  confirmText = "Confirmer",
  cancelText = "Annuler",
  loading = false,
  color = "#6366F1" // Couleur par défaut : Indigo
}) => {
  return (
    <Dialog 
      open={open} 
      onClose={loading ? null : onClose} // Empêche la fermeture pendant le chargement
      PaperProps={{
        sx: { borderRadius: '16px', width: 400, p: 1 }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box sx={{ 
            bgcolor: `${color}15`, // Transparence de la couleur choisie
            color: color, 
            p: 1, 
            borderRadius: '10px', 
            display: 'flex' 
          }}>
            <HelpOutline />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 900, color: '#1E293B', fontSize: '1.1rem' }}>
            {title}
          </Typography>
        </Stack>
      </DialogTitle>

      <DialogContent>
        <Typography variant="body2" sx={{ color: '#64748B', lineHeight: 1.6 }}>
          {message}
        </Typography>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button 
          onClick={onClose} 
          disabled={loading}
          sx={{ 
            color: '#64748B', 
            textTransform: 'none', 
            fontWeight: 700 
          }}
        >
          {cancelText}
        </Button>
        <Button 
          onClick={onConfirm}
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <CheckCircleOutline />}
          sx={{ 
            bgcolor: color, 
            textTransform: 'none', 
            borderRadius: '8px', 
            px: 3, 
            fontWeight: 800,
            '&:hover': { bgcolor: color, filter: 'brightness(0.9)' }
          }}
        >
          {loading ? 'Traitement...' : confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmActionDialog;