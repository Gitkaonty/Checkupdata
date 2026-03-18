import { Accordion, AccordionDetails, AccordionSummary, Stack, Typography } from "@mui/material";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import React from "react";

const CompactAccordion = ({ icon, title, children }) => (
    <Accordion
        elevation={0}
        sx={{
            borderRadius: '10px !important',
            border: '1px solid #E2E8F0',
            '&:before': { display: 'none' }
        }}
    >
        <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ fontSize: 18 }} />}>
            <Stack direction="row" spacing={1.5} alignItems="center">
                {React.cloneElement(icon, { sx: { color: '#64748B', fontSize: 18 } })}
                <Typography sx={{ fontWeight: 700, color: '#475569', fontSize: '13.5px' }}>
                    {title}
                </Typography>
            </Stack>
        </AccordionSummary>

        {children && <AccordionDetails sx={{ pt: 1.5, mt: -2 }}>{children}</AccordionDetails>}
    </Accordion>
);

const ComptabiliteTabContent = () => (
    <Box sx={{ bgcolor: '#fff', borderRadius: '12px', border: '1px solid #E2E8F0', p: 4 }}>
        <Grid container spacing={1.5}>
            <Grid item xs={12}><Typography sx={{ fontWeight: 800, color: '#1E293B', fontSize: '14px', mb: 2 }}>Général</Typography></Grid>
            <FormikSelect name='plancomptable' label="Plan comptable" type="select" width="280px" options={[{ value: 0, label: 'test' }]} defaultValue={0} />
            <Grid item sx={{ ml: 2, display: 'flex', alignItems: 'flex-end', pb: 0 }}>
                <Stack direction="row" spacing={1}>
                    <FormikCheckbox name="consolidation" label="Consolidation" />
                    <FormikCheckbox name="avecanalytique" label="Avec analytique" />
                </Stack>
            </Grid>
            <Grid item xs={12} sx={{ mt: 2, mb: -5 }}>
                <Stack direction="row" spacing={4}>

                    <Box>
                        <Typography sx={{ fontSize: '10px', fontWeight: 800, color: '#94A3B8', mb: 0.5, textTransform: 'uppercase' }}>
                            Dévise par défaut
                        </Typography>
                        <FormikRadioGroup
                            name="devisepardefaut"
                            row
                            options={[
                                { value: 'MGA', label: 'MGA' },
                                { value: 'Autres', label: 'Autres' }
                            ]}
                        />
                    </Box>

                    <Box>
                        <Typography sx={{ fontSize: '10px', fontWeight: 800, color: '#94A3B8', mb: 0.5, textTransform: 'uppercase' }}>
                            Système de tenue
                        </Typography>
                        <FormikRadioGroup
                            name="typecomptabilite"
                            row
                            options={[
                                { value: 'Français', label: 'Français' },
                                { value: 'Autres', label: 'Autres' }
                            ]}
                        />
                    </Box>

                </Stack>
            </Grid>
            <Grid item xs={12}><Divider sx={{ borderStyle: 'dashed', my: 1.5, opacity: 0.4 }} /></Grid>
            <FormikTextField type='number' name='longueurcptstd' label="Compte standard" width="140px" inputProps={{ min: 1, max: 50 }} />
            <FormikTextField type='number' name='longueurcptaux' label="Compte auxiliaire" width="140px" inputProps={{ min: 1, max: 50 }} />
        </Grid>
    </Box>
);

export { CompactAccordion }