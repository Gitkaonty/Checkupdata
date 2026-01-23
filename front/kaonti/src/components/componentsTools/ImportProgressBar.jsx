import { Box, LinearProgress, Typography, Stack } from '@mui/material';
import { useState, useEffect, useRef } from 'react';

export default function ImportProgressBar({ 
    isVisible = false, 
    message = 'Import en cours...', 
    progress = null,
    variant = 'indeterminate'
}) {
    const [displayProgress, setDisplayProgress] = useState(0);
    const intervalRef = useRef(null);
    const startTimeRef = useRef(null);

    useEffect(() => {
        if (isVisible && variant === 'determinate') {
            if (progress !== null && progress !== undefined) {
                if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                }
                startTimeRef.current = null;
                setDisplayProgress(Math.max(0, Math.min(100, progress)));
                return;
            }

            if (!startTimeRef.current) {
                setDisplayProgress(0);
                startTimeRef.current = Date.now();
            }

            intervalRef.current = setInterval(() => {
                const elapsed = Date.now() - startTimeRef.current;
                const estimatedDuration = 2500;
                
                let newProgress = (elapsed / estimatedDuration) * 95;
                
                if (progress === 100) {
                    newProgress = 100;
                    clearInterval(intervalRef.current);
                } else {
                    newProgress = Math.min(newProgress, 95);
                }
                
                setDisplayProgress(Math.max(0, newProgress));
            }, 50);

            return () => {
                if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                }
            };
        } else if (!isVisible) {
            setDisplayProgress(0);
            startTimeRef.current = null;
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        }
    }, [isVisible, progress, variant]);

    if (!isVisible) return null;

    return (
        <Box 
            sx={{ 
                width: '100%', 
                padding: '20px 0',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
            }}
        >
            <Stack 
                spacing={2} 
                direction="column" 
                width="100%" 
                maxWidth="600px"
                alignItems="center" 
                justifyContent="center"
            >
                <Typography 
                    variant="h6" 
                    style={{ 
                        color: '#2973B2',
                        fontWeight: 500,
                        textAlign: 'center'
                    }}
                >
                    {message}
                </Typography>
                
                <Stack 
                    direction="row" 
                    spacing={2} 
                    alignItems="center" 
                    sx={{ width: '100%' }}
                >
                    <Box sx={{ flexGrow: 1 }}>
                        <LinearProgress 
                            variant={variant}
                            value={variant === 'determinate' ? displayProgress : undefined}
                            sx={{
                                height: 8,
                                borderRadius: 5,
                                backgroundColor: 'rgba(41, 115, 178, 0.1)',
                                '& .MuiLinearProgress-bar': {
                                    borderRadius: 5,
                                    backgroundColor: '#2973B2',
                                }
                            }}
                        />
                    </Box>
                    
                    {variant === 'determinate' && (
                        <Typography 
                            variant="body1" 
                            color="text.secondary"
                            sx={{ 
                                minWidth: '50px',
                                fontWeight: 600,
                                color: '#2973B2'
                            }}
                        >
                            {`${Math.round(displayProgress)}%`}
                        </Typography>
                    )}
                </Stack>
            </Stack>
        </Box>
    );
}
