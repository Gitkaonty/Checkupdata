import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Stack,
  TextField,
  IconButton
} from '@mui/material';
import { ChatBubbleOutline, Close } from '@mui/icons-material';

const CommentDialog = ({ 
  open, 
  onClose, 
  onSave, 
  initialValue = "", 
  title = "Ajouter un commentaire", 
  placeholder = "Saisissez votre note ici...",
  loading = false 
}) => {
  const [comment, setComment] = useState(initialValue);

  // Réinitialiser le champ quand le dialogue s'ouvre
  useEffect(() => {
    if (open) setComment(initialValue);
  }, [open, initialValue]);

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      PaperProps={{
        sx: { borderRadius: '16px', width: 450, p: 1 }
      }}
    >
      <DialogTitle sx={{ pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box sx={{ bgcolor: '#F1F5F9', color: '#64748B', p: 1, borderRadius: '10px', display: 'flex' }}>
            <ChatBubbleOutline fontSize="small" />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 900, color: '#1E293B', fontSize: '1.1rem' }}>
            {title}
          </Typography>
        </Stack>
        <IconButton onClick={onClose} size="small" sx={{ color: '#94A3B8' }}>
          <Close fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mt: 1 }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', display: 'block', mb: 1, textTransform: 'uppercase', fontSize: '0.65rem' }}>
            Votre Message
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            placeholder={placeholder}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            variant="outlined"
            autoFocus
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
                bgcolor: '#F8FAFC',
                fontSize: '0.9rem',
                '& fieldset': { borderColor: '#E2E8F0' },
                '&:hover fieldset': { borderColor: '#CBD5E1' },
                '&.Mui-focused fieldset': { borderColor: '#6366F1', borderWidth: '1px' },
              }
            }}
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button 
          onClick={onClose} 
          sx={{ color: '#64748B', textTransform: 'none', fontWeight: 700 }}
        >
          Annuler
        </Button>
        <Button 
          onClick={() => onSave(comment)}
          variant="contained"
          disabled={loading || (!comment.trim() && !initialValue)}
          sx={{ 
            bgcolor: '#0F172A', 
            textTransform: 'none', 
            borderRadius: '8px', 
            px: 4, 
            fontWeight: 800,
            '&:hover': { bgcolor: '#1E293B' }
          }}
        >
          {loading ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CommentDialog;