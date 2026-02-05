import React, { useState } from 'react';
import { Dialog, DialogContent, Box, Typography, Button, FormControl, FormLabel, RadioGroup, FormControlLabel, Radio } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import IconButton from '@mui/material/IconButton';
import { TbFileTypePdf, TbFileTypeXml, TbFileTypeCsv } from 'react-icons/tb';
import toast from 'react-hot-toast';
import HistoriqueDeclaration from '../Historique/HistoriqueDeclaration';
import axios from '../../../../../config/axios';
// Tous les exports (XML, PDF, EXCEL) sont désormais gérés par le backend


export default function ExportTvaDialog({
  open,
  onClose,
  onExportXML,
  refreshKey,
  annexesData,
  exerciceId,
  valSelectMois,
  valSelectAnnee,
  compteId,
  setRefreshKey,
}) {
  const [selectedOption, setSelectedOption] = useState('xml');

  const exportOptions = {
    xml: { label: 'Exporter', icon: <TbFileTypeXml /> },
    pdf: { label: 'Exporter', icon: <TbFileTypePdf /> },
    csv: { label: 'Exporter', icon: <TbFileTypeCsv /> },
  };

  const handleExportExcel = async () => {
    try {
      const mois = Number(valSelectMois);
      const annee = Number(valSelectAnnee);
      const dernierJour = new Date(annee, mois, 0).getDate();
      const debutStr = `01-${String(mois).padStart(2, '0')}-${annee}`;
      const finStr = `${String(dernierJour).padStart(2, '0')}-${String(mois).padStart(2, '0')}-${annee}`;

      const idDossier = sessionStorage.getItem('fileId');
      const resp = await fetch(`${axios}/declaration/tva/export-excel-tableau/${compteId}/${idDossier}/${exerciceId}/${mois}/${annee}`, {
        method: 'GET',
        headers: { 'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
      });
      if (!resp.ok) throw new Error('Erreur export Excel TVA');
      const blob = await resp.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `annexes_tva_${String(mois).padStart(2, '0')}-${annee}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      const fileId = sessionStorage.getItem('fileId');
      const f = '${axios}/historique/declaration';
      if (compteId && fileId) {
        const designation = `TVA EXCEL - du ${debutStr} au ${finStr} - Mois ${mois}/${annee}`;
        fetch(f, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idCompte: compteId, idDossier: fileId, declaration: 'TVA', designation, date_export: new Date().toISOString() })
        }).then(() => {
          toast.success("Export Excel TVA enregistré dans l'historique.");
          if (typeof setRefreshKey === 'function') setRefreshKey(Date.now());
        }).catch(err => console.error('Erreur historique Excel TVA:', err));
      }
    } catch (e) {
      toast.error("Erreur lors de l'export Excel TVA.");
    }
  };

  const handleExportXml = async () => {
    try {
      const mois = Number(valSelectMois);
      const annee = Number(valSelectAnnee);
      const dernierJour = new Date(annee, mois, 0).getDate();
      const debutStr = `01-${String(mois).padStart(2, '0')}-${annee}`;
      const finStr = `${String(dernierJour).padStart(2, '0')}-${String(mois).padStart(2, '0')}-${annee}`;
      const nif = (sessionStorage.getItem('ncc') || '').toString().trim();
      const idDossier = sessionStorage.getItem('fileId');
      if (!nif) {
        // On laisse le backend résoudre automatiquement via idDossier si possible
      }

      const resp = await fetch(`${axios}/declaration/tva/export-xml/${compteId}/${idDossier}/${exerciceId}/${mois}/${annee}`, {
        method: 'GET',
        headers: { 'Accept': 'application/xml' }
      });
      if (!resp.ok) throw new Error('Erreur export XML TVA');
      const blob = await resp.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tva_${String(mois).padStart(2, '0')}-${annee}.xml`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      const fileId = sessionStorage.getItem('fileId');
      if (compteId && fileId) {
        const designation = `TVA XML - du ${debutStr} au ${finStr} - Mois ${mois}/${annee}`;
        fetch('${axios}/historique/declaration', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idCompte: compteId, idDossier: fileId, declaration: 'TVA', designation, date_export: new Date().toISOString() })
        }).then(() => {
          toast.success("Export XML TVA enregistré dans l'historique.");
          if (typeof setRefreshKey === 'function') setRefreshKey(Date.now());
        }).catch(err => console.error('Erreur historique XML TVA:', err));
      }
    } catch (e) {
      toast.error("Erreur lors de l'export XML TVA.");
    }
  };

  const { label, icon } = exportOptions[selectedOption] || { label: 'Exporter', icon: null };

  const handleExportPdf = () => {
    try {
      const mois = typeof valSelectMois === 'number' ? valSelectMois : Number(valSelectMois);
      const annee = typeof valSelectAnnee === 'number' ? valSelectAnnee : Number(valSelectAnnee);
      const dernierJour = new Date(annee, mois, 0).getDate();
      const header = {
        exercice: exerciceId,
        mois,
        annee,
        periodeDebut: { jour: 1, mois, annee },
        periodeFin: { jour: dernierJour, mois, annee },
      };
      const idDossier = sessionStorage.getItem('fileId');
      fetch(`${axios}/declaration/tva/export-pdf-tableau/${compteId}/${idDossier}/${exerciceId}/${mois}/${annee}`, {
        method: 'GET',
        headers: { 'Accept': 'application/pdf' }
      })
        .then(response => {
          if (!response.ok) throw new Error('Erreur lors de la génération du PDF TVA');
          return response.blob();
        })
        .then(blob => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'export_tva.pdf';
          document.body.appendChild(a);
          a.click();
          a.remove();
          window.URL.revokeObjectURL(url);

          const fileId = sessionStorage.getItem('fileId');
          if (compteId && fileId) {
            const debutStr = `01-${String(mois).padStart(2, '0')}-${annee}`;
            const finStr = `${String(dernierJour).padStart(2, '0')}-${String(mois).padStart(2, '0')}-${annee}`;
            const designation = `TVA PDF - du ${debutStr} au ${finStr} - Mois ${mois}/${annee}`;
            fetch('${axios}/historique/declaration', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                idCompte: compteId,
                idDossier: fileId,
                declaration: 'TVA',
                designation,
                date_export: new Date().toISOString()
              })
            })
              .then(() => {
                toast.success("Export PDF TVA enregistré dans l'historique.");
                if (typeof setRefreshKey === 'function') setRefreshKey(Date.now());
              })
              .catch(histErr => console.error('Erreur historique PDF TVA:', histErr));
          }
        })
        .catch(() => {
          toast.error('Erreur lors de la génération du PDF TVA.');
        });
    } catch (e) {
      toast.error('Erreur lors de la génération du PDF TVA.');
    }
  };

  const handleExport = () => {
    if (selectedOption === 'xml') {
      return handleExportXml();
    } else if (selectedOption === 'pdf') {
      return handleExportPdf();
    } else if (selectedOption === 'csv') {
      return handleExportExcel();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{ sx: { height: '80vh' } }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 1.5,
          borderBottom: '1px solid #ccc',
        }}
      >
        <Typography variant="h6">Exporter Annexes TVA</Typography>
        <IconButton onClick={onClose} sx={{ color: 'red' }} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Content */}
      <DialogContent sx={{ overflow: 'visible' }}>
        <Box mb={0}>
          <FormControl component="fieldset">
            <FormLabel component="legend">Choisissez le type d'export</FormLabel>
            <RadioGroup
              row
              aria-label="export-tva"
              name="export-tva-radio-group"
              sx={{ gap: 1 }}
              value={selectedOption}
              onChange={(e) => setSelectedOption(e.target.value)}
            >
              <FormControlLabel value="xml" control={<Radio size="small" />} label="XML" />
              <FormControlLabel value="pdf" control={<Radio size="small" />} label="PDF" />
              <FormControlLabel value="csv" control={<Radio size="small" />} label="EXCEL" />
            </RadioGroup>
            {/* Bouton export dynamique (Annexes) */}
            <Box display="flex" flexDirection="column" alignItems="left" justifyContent="center" height={50} mb={2}>
              <Button
                variant="contained"
                color="success"
                onClick={handleExport}
                sx={{ width: 160, fontWeight: 100, fontSize: 12 }}
                startIcon={icon}
              >
                {label}
              </Button>
            </Box>
          </FormControl>
        </Box>

        {/* Historique unifié (TVA) -> Réserver un espace fixe pour éviter le changement de taille */}
        <Box mt={2} sx={{ height: '40vh' }}>
          {selectedOption === 'xml' ? (
            <HistoriqueDeclaration defaultType="TVA" hideTypeFilter height="100%" />
          ) : (
            <Box sx={{ height: '100%' }} />
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
}
