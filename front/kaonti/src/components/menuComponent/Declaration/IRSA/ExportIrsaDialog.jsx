import React, { useState } from 'react';
import { Dialog, DialogContent, Box, Typography, Button, FormControl, FormLabel, RadioGroup, FormControlLabel, Radio } from '@mui/material';
import HistoriqueDeclaration from '../Historique/HistoriqueDeclaration';
import CloseIcon from '@mui/icons-material/Close';
import IconButton from '@mui/material/IconButton';
import { TbFileTypePdf } from "react-icons/tb";
import { TbFileTypeXml } from "react-icons/tb";
import { TbFileTypeCsv } from "react-icons/tb";
import toast from 'react-hot-toast';
import axios from '../../../../../config/axios';

export default function ExportIrsaDialog({
  open,
  onClose,
  onExport,
  refreshKey,
  irsaData,
  exerciceId,
  valSelectMois,
  valSelectAnnee,
  compteId,
  setRefreshKey
}) {
  const [selectedHisto, setSelectedHisto] = useState('histo_xml');

  // Définition dynamique des labels + icônes
  const exportOptions = {
    histo_xml: { label: 'Exporter', icon: <TbFileTypeXml /> },
    histo_pdf: { label: 'Exporter', icon: <TbFileTypePdf /> },
    histo_csv: { label: 'Exporter', icon: <TbFileTypeCsv /> },
  };

  // --- Fonction export XML / PDF / Excel
  const handleExport = () => {
    if (selectedHisto === 'histo_xml') {
      handleExportXml();
    } else if (selectedHisto === 'histo_pdf') {
      handleExportPdf();
    } else if (selectedHisto === 'histo_csv') {
      handleExportExcel();
    }
  };
  const handleExportXml = async () => {
    try {
      const mois = Number(valSelectMois);
      const annee = Number(valSelectAnnee);
      const dernierJour = new Date(annee, mois, 0).getDate();
      const debutStr = `01-${String(mois).padStart(2, '0')}-${annee}`;
      const finStr = `${String(dernierJour).padStart(2, '0')}-${String(mois).padStart(2, '0')}-${annee}`;

      const idDossier = sessionStorage.getItem('fileId');
      const resp = await fetch(`${axios}/irsa/irsa/export-xml/${compteId}/${idDossier}/${exerciceId}/${mois}/${annee}`, {
        method: 'GET',
        headers: { 'Accept': 'application/xml' }
      });
      if (!resp.ok) {
        const errorText = await resp.text();
        console.error('Erreur export XML IRSA backend:', errorText);
        throw new Error('Erreur export XML IRSA');
      }
      const blob = await resp.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `irsa_${String(mois).padStart(2, '0')}-${annee}.xml`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      const fileId = sessionStorage.getItem('fileId');
      if (compteId && fileId) {
        const designation = `IRSA XML - du ${debutStr} au ${finStr} - Mois ${mois}/${annee}`;
        fetch('${axios}/historique/declaration', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            idCompte: compteId,
            idDossier: fileId,
            declaration: 'IRSA',
            designation,
            date_export: new Date().toISOString()
          })
        }).then(() => {
          toast.success("Export XML IRSA enregistré dans l'historique.");
          if (typeof setRefreshKey === 'function') setRefreshKey(Date.now());
        }).catch(err => console.error('Erreur historique XML IRSA:', err));
      }
    } catch (e) {
      toast.error("Erreur lors de l'export XML IRSA.");
    }
  };

  const { label, icon } = exportOptions[selectedHisto] || { label: 'Exporter', icon: null };

  const handleExportPdf = async () => {
    try {
      const mois = Number(valSelectMois);
      const annee = Number(valSelectAnnee);
      const dernierJour = new Date(annee, mois, 0).getDate();
      const debutStr = `01-${String(mois).padStart(2, '0')}-${annee}`;
      const finStr = `${String(dernierJour).padStart(2, '0')}-${String(mois).padStart(2, '0')}-${annee}`;

      const idDossier = sessionStorage.getItem('fileId');
      console.log('IRSA PDF Export - Paramètres:', { compteId, idDossier, exerciceId, mois, annee });
      
      const resp = await fetch(`${axios}/irsa/irsa/export-pdf-tableau/${compteId}/${idDossier}/${exerciceId}/${mois}/${annee}`, {
        method: 'POST',
        headers: { 'Accept': 'application/pdf' }
      });
      
      if (!resp.ok) {
        const errorText = await resp.text();
        console.error('Erreur backend PDF:', errorText);
        throw new Error(`Erreur export PDF IRSA: ${errorText}`);
      }
      
      const blob = await resp.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `irsa_${String(mois).padStart(2, '0')}-${annee}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      const fileId = sessionStorage.getItem('fileId');
      if (compteId && fileId) {
        const designation = `IRSA PDF - du ${debutStr} au ${finStr} - Mois ${mois}/${annee}`;
        fetch('${axios}/historique/declaration', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            idCompte: compteId,
            idDossier: fileId,
            declaration: 'IRSA',
            designation,
            date_export: new Date().toISOString()
          })
        })
          .then(() => {
            toast.success("Export PDF IRSA enregistré dans l'historique.");
            if (typeof setRefreshKey === 'function') setRefreshKey(Date.now());
          })
          .catch(histErr => console.error('Erreur historique PDF:', histErr));
      }
    } catch (e) {
      toast.error("Erreur lors de l'export PDF IRSA.");
    }
  };

  const handleExportExcel = async () => {
    try {
      const mois = Number(valSelectMois);
      const annee = Number(valSelectAnnee);
      const dernierJour = new Date(annee, mois, 0).getDate();
      const debutStr = `01-${String(mois).padStart(2, '0')}-${annee}`;
      const finStr = `${String(dernierJour).padStart(2, '0')}-${String(mois).padStart(2, '0')}-${annee}`;

      const idDossier = sessionStorage.getItem('fileId');
      console.log('IRSA Excel Export - Paramètres:', { compteId, idDossier, exerciceId, mois, annee });
      const resp = await fetch(`${axios}/irsa/irsa/export-excel-tableau/${compteId}/${idDossier}/${exerciceId}/${mois}/${annee}`, {
        method: 'GET',
        headers: { 'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
      });
      if (!resp.ok) {
        const errorText = await resp.text();
        console.error('Erreur backend:', errorText);
        throw new Error(`Erreur export Excel IRSA: ${errorText}`);
      }
      const blob = await resp.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `irsa_${String(mois).padStart(2, '0')}-${annee}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      const fileId = sessionStorage.getItem('fileId');
      const f = '${axios}/historique/declaration';
      if (compteId && fileId) {
        const designation = `IRSA EXCEL - du ${debutStr} au ${finStr} - Mois ${mois}/${annee}`;
        fetch(f, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            idCompte: compteId,
            idDossier: fileId,
            declaration: 'IRSA',
            designation,
            date_export: new Date().toISOString()
          })
        }).then(() => {
          toast.success("Export Excel IRSA enregistré dans l'historique.");
          if (typeof setRefreshKey === 'function') setRefreshKey(Date.now());
        }).catch(err => console.error('Erreur historique Excel IRSA:', err));
      }
    } catch (e) {
      toast.error("Erreur lors de l'export Excel IRSA.");
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
        <Typography variant="h6">Exporter IRSA</Typography>
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
              aria-label="historique"
              name="historique-radio-group"
              sx={{ gap: 1 }}
              value={selectedHisto}
              onChange={e => setSelectedHisto(e.target.value)}
            >
              <FormControlLabel value="histo_xml" control={<Radio size="small" />} label="XML" />
              <FormControlLabel value="histo_pdf" control={<Radio size="small" />} label="PDF" />
              <FormControlLabel value="histo_csv" control={<Radio size="small" />} label="EXCEL" />
            </RadioGroup>

            {/* Bouton export dynamique */}
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

        {/* Historique unifié (IRSA) -> Réserver un espace fixe pour éviter le "jump" de taille */}
        <Box mt={2} sx={{ height: '40vh' }}>
          {selectedHisto === 'histo_xml' ? (
            <HistoriqueDeclaration defaultType="IRSA" hideTypeFilter height="100%" />
          ) : (
            <Box sx={{ height: '100%' }} />
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
}

