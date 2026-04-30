import { Box, Stack } from '@mui/material';
import TextCard from './TextCard';

// Petit graphique de tendance interne
// const SparklineMini = ({ data = [], color = '#3B82F6', width = 100, height = 30 }) => {
//     if (!data || data.length < 2) return null;

//     const min = Math.min(...data);
//     const max = Math.max(...data);
//     const range = max - (min * 0.9) || 1; // Un peu de marge en bas

//     const points = data.map((val, i) => ({
//         x: (i / (data.length - 1)) * width,
//         y: height - ((val - min) / range) * (height * 0.7) - (height * 0.15)
//     }));

//     // 1. Chemin de la ligne (la courbe)
//     let linePath = `M ${points[0].x} ${points[0].y}`;
//     for (let i = 1; i < points.length; i++) {
//         const prev = points[i - 1];
//         const curr = points[i];
//         const cp1x = prev.x + (curr.x - prev.x) * 0.4;
//         const cp2x = curr.x - (curr.x - prev.x) * 0.4;
//         linePath += ` C ${cp1x} ${prev.y}, ${cp2x} ${curr.y}, ${curr.x} ${curr.y}`;
//     }

//     // 2. Chemin pour le remplissage (on ferme la forme vers le bas)
//     // On part de la fin de la courbe, on descend au coin bas-droit, puis bas-gauche
//     const fillPath = `${linePath} L ${width} ${height} L 0 ${height} Z`;

//     return (
//         <svg width={width} height={height} style={{ overflow: 'visible' }}>
//             <defs>
//                 {/* Dégradé pour l'effet de fond */}
//                 <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
//                     <stop offset="0%" stopColor={color} stopOpacity="0.4" />
//                     <stop offset="100%" stopColor={color} stopOpacity="0" />
//                 </linearGradient>
//             </defs>

//             {/* La zone remplie */}
//             <path d={fillPath} fill={`url(#gradient-${color})`} stroke="none" />

//             {/* La ligne de la courbe */}
//             <path d={linePath} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
//         </svg>
//     );
// };

const KPICard = ({
    title,
    color = "#10B981",
    resultatN,
    resultatN1,
    variationN,
    variationN1,
    evolutionN,
    evolutionN1,
    devise,
    trendN,
    compact = false,
    sx = {}
}) => {
    const cardStyle = {
        position: 'relative',
        // width: '100%',
        // height: '100%',
        p: 2,
        pt: 2.5,
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '8px',
        backgroundColor: '#F8FAFC',
        // boxShadow: '0px 2px 10px rgba(0,0,0,0.06)',
        borderLeft: `3px solid ${color}`,
        overflow: 'hidden'
    };

    return (
        <Box sx={{ width: '100%', height: compact ? '120px' : '160px', ...sx }}>
            <Stack sx={cardStyle}>
                <TextCard
                    text={title}
                    montant={resultatN}
                    montantN1={resultatN1}
                    variation={variationN}
                    evolution={evolutionN}
                    exercice="N"
                    devise={devise}
                    compact={compact}
                    color={color}
                />
                {/* {trendN && (
                    <Box sx={{ position: 'absolute', bottom: 10, right: 10 }}>
                        <SparklineMini data={trendN} color={color} />
                    </Box>
                )} */}
            </Stack>
        </Box>
    );
};

export default KPICard;