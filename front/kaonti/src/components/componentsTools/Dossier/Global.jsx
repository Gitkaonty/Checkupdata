import { Accordion, AccordionDetails, AccordionSummary, Stack, Typography } from "@mui/material";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import React from "react";

const CompactAccordion = ({ icon, title, children }) => (
    <Accordion
        elevation={0}
        sx={{
            borderRadius: '10px !important',
            border: '1px solid #E2E8F0',
            '&:before': { display: 'none' },
        }}
    >
        <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ fontSize: 20 }} />}>
            <Stack direction="row" spacing={1.5} alignItems="flex-end" alignContent='flex-end'>
                {React.cloneElement(icon, { sx: { color: '#64748B', fontSize: 20 } })}
                <Typography sx={{ fontWeight: 700, color: '#475569', fontSize: '13.5px' }}>
                    {title}
                </Typography>
            </Stack>
        </AccordionSummary>

        {children && <AccordionDetails sx={{ pt: 1.5, mt: -2 }}>{children}</AccordionDetails>}
    </Accordion>
);

export { CompactAccordion }