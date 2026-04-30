import { Stack, Typography } from "@mui/material";
import { FiTrendingDown, FiTrendingUp, FiMinus } from "react-icons/fi";

const TextCard = ({
    text,
    montant,
    montantN1,
    variation,
    evolution,
    devise,
    compact,
    exercice,
    color // La couleur du thème de la carte
}) => {

    const IconVariation = () => {
        const size = compact ? 14 : 16;
        if (evolution === 'augmentation') return <FiTrendingUp size={size} color='#0dba2a' />;
        if (evolution === 'diminution') return <FiTrendingDown size={size} color='#ba210d' />;
        return <FiMinus size={size} color='#a3b8b7' />;
    };

    const formatMontant = (num) => {
        if (num === null || num === undefined || isNaN(num)) return '-';
        return num.toLocaleString('fr-FR') + ` ${devise || ''}`;
    };

    const formatePourcentage = (value, varType) => {
        if (value === undefined || value === null) return `0.00 %`;
        const formatted = Math.abs(parseFloat(value)).toFixed(2);
        return (varType === 'diminution' ? '-' : '+') + formatted + ' %';
    };

    return (
        <Stack
            direction="column"
            spacing={0.2}
            alignItems="flex-start"
            sx={{ width: '100%',mt: -2, }}
        >
            {/* TITRE EN HAUT */}
            <Typography
                fontSize={compact ? '10px' : '11px'}
                color="#64748B"
                fontWeight={700}
                sx={{ fontSize: '14px', fontWeight: 900, color: '#1E293B' }}
            >
                {text} <span style={{ opacity: 0.7 }}>{exercice}</span>
            </Typography>

            {/* MONTANT PRINCIPAL AU MILIEU */}
            <Typography
                fontSize={compact ? '18px' : '22px'}
                color="#1E293B"
                fontWeight={800}
                sx={{ fontSize: '18px', fontWeight: 900, color: '#0F172A' }}
            >
                {formatMontant(montant)}
            </Typography>

            {/* TENDANCE EN BAS */}
            <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
                <IconVariation />
                <Typography
                    fontSize='11px'
                    color={evolution === 'augmentation' ? '#0dba2a' : evolution === 'diminution' ? '#ba210d' : '#64748B'}
                    fontWeight={700}
                >
                    {formatePourcentage(variation, evolution)}
                </Typography>
                {/* {!compact && montantN1 !== null && montantN1 !== undefined && (
                    <Typography fontSize="11px" color="#94A3B8" sx={{ ml: 0.5 }}>
                        vs {formatMontant(montantN1)}
                    </Typography>
                )} */}
                <Typography fontSize="11px" color="#000"  sx={{ ml: 0.5 }}>
                    vs {formatMontant(montantN1)}
                </Typography>
            </Stack>
        </Stack>
    );
};

export default TextCard;