import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Stack
} from '@mui/material';
import { ErrorOutline, DeleteForeverOutlined } from '@mui/icons-material';

const ConfirmDeleteDialog = ({ 
  open, 
  onClose, 
  onConfirm, 
  title = "Confirmer la suppression", 
  message = "Êtes-vous sûr de vouloir supprimer cet élément ? Cette action est irréversible.",
  loading = false 
}) => {
  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      PaperProps={{
        sx: { borderRadius: '16px', width: 400, p: 1 }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box sx={{ 
            bgcolor: '#FEE2E2', 
            color: '#EF4444', 
            p: 1, 
            borderRadius: '10px', 
            display: 'flex' 
          }}>
            <ErrorOutline />
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
          sx={{ 
            color: '#64748B', 
            textTransform: 'none', 
            fontWeight: 700 
          }}
        >
          Annuler
        </Button>
        <Button 
          onClick={onConfirm}
          variant="contained"
          disabled={loading}
          startIcon={<DeleteForeverOutlined />}
          sx={{ 
            bgcolor: '#EF4444', 
            textTransform: 'none', 
            borderRadius: '8px', 
            px: 3, 
            fontWeight: 800,
            '&:hover': { bgcolor: '#B91C1C' }
          }}
        >
          {loading ? 'Suppression...' : 'Supprimer définitivement'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDeleteDialog;