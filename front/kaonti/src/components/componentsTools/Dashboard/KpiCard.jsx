import { Box, Stack, Typography } from "@mui/material";
import { FiTrendingDown, FiTrendingUp, FiMinus } from "react-icons/fi";

const KpiCard = ({
    title,
    montantN,
    montantN1,
    variation,
    evolution,
    bgcolor = "#5D6D7E",
    devise = "Ar",
    Icon
}) => {

    const IconVariation = () => {
        if (evolution === 'augmentation') return <FiTrendingUp size={24} color="#58D68D" />;
        if (evolution === 'diminution') return <FiTrendingDown size={24} color="#E74C3C" />;
        return <FiMinus size={24} color="#a3b8b7" />;
    };

    const formatePourcentage = (value, evolution) => {
        if (!value) return "0.00 %";
        const formatted = parseFloat(value).toFixed(2);
        return (evolution === "augmentation" ? "+" : evolution === "diminution" ? "-" : "") + formatted + " %";
    };

    const getColor = (evolution) => {
        if (evolution === "augmentation") return "#58D68D";
        if (evolution === "diminution") return "#E74C3C";
        return "#FFF";
    };

    const formatMontant = (num) => {
        if (num === null || num === undefined || isNaN(num)) return "-";
        return num.toLocaleString('fr-FR') + ` ${devise}`;
    };

    return (
        <Stack
            sx={{
                width: "100%",
                bgcolor,
                borderRadius: 3,
                p: 3,
                color: "white",
                fontFamily: "'Inter', 'Roboto', sans-serif",
                justifyContent: "space-between",
                boxSizing: "border-box",
                boxShadow: "0 10px 25px rgba(0,0,0,0.15)"
            }}
        >
            {/* HEADER */}
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography sx={{ fontSize: 18, fontWeight: 600 }}>{title}</Typography>
                <Box>{Icon}</Box>
            </Stack>

            {/* Montants */}
            <Stack spacing={1.5}>
                {/* Montant N */}
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography sx={{ fontSize: 15, opacity: 0.85 }}>Montant (N)</Typography>
                    <Typography sx={{ fontSize: 22, fontWeight: 700, textShadow: "0 2px 4px rgba(0,0,0,0.2)" }}>
                        {formatMontant(montantN)}
                    </Typography>
                </Stack>

                {/* Montant N-1 */}
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography sx={{ fontSize: 14, opacity: 0.6 }}>Exercice précédent (N-1)</Typography>
                    <Typography sx={{ fontSize: 15 }}>{formatMontant(montantN1)}</Typography>
                </Stack>

                {/* Évolution */}
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography sx={{ fontSize: 14 }}>Évolution</Typography>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                        <IconVariation />
                        <Typography sx={{ fontSize: 15, fontWeight: 600, color: getColor(evolution) }}>
                            {formatePourcentage(variation, evolution)}
                        </Typography>
                    </Stack>
                </Stack>
            </Stack>
        </Stack>
    );
};

export default KpiCard;