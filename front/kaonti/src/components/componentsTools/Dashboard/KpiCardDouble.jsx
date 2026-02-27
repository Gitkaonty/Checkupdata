import { Box, Stack, Typography } from "@mui/material";
import { FiTrendingDown, FiTrendingUp, FiMinus } from "react-icons/fi";

const KpiCardDouble = ({
    resultatChiffreAffaireN,
    resultatChiffreAffaireN1,
    variationChiffreAffaireN,
    resultatN,
    resultatN1,
    variationResultatN,
    devise,
    evolutionResultatN,
    evolutionChiffreAffaireN
}) => {

    const IconVariation = (evolution) => {
        if (evolution === 'augmentation') {
            return <FiTrendingUp size={30} color='#0dba2a' />;
        }
        if (evolution === 'diminution') {
            return <FiTrendingDown size={30} color='#ba210d' />;
        }
        return <FiMinus size={30} color='#a3b8b7' />;
    };

    const formatePourcentage = (value, evolution) => {
        if (!value) return `0.00 %`;
        const formatted = parseFloat(value).toFixed(2);
        // couleur rouge si diminution, vert si augmentation
        const sign = evolution === 'augmentation' ? '+' : evolution === 'diminution' ? '-' : '';
        return `${sign}${formatted} %`;
    };

    const getColor = (evolution) => {
        if (evolution === 'augmentation') return '#58D68D'; // vert
        if (evolution === 'diminution') return '#E74C3C'; // rouge
        return '#FFF'; // neutre
    };

    const formatMontant = (num) => {
        if (num === null || num === undefined || isNaN(num)) return '-';
        return num.toLocaleString('fr-FR') + ` ${devise}`;
    };

    return (
        <Stack
            sx={{
                width: { xs: "100%", md: "50%" },
                height: { xs: 280, md: "100%" },
                background: "linear-gradient(160deg, #1A5276 0%, #0F52BA 100%)",
                borderRadius: 4,
                color: "white",
                p: 4,
                justifyContent: "space-between",
                fontFamily: "'Inter', 'Roboto', sans-serif",
                boxShadow: "0 12px 30px rgba(0,0,0,0.18)",
            }}
        >
            {/* HEADER */}
            <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography sx={{ fontSize: 20, fontWeight: 700, letterSpacing: 0.6 }}>
                    Performance financière
                </Typography>
                <Typography sx={{ fontSize: 14, opacity: 0.7 }}>
                    Comparatif par exercice
                </Typography>
            </Stack>

            {/* Résultat net */}
            <Stack mt={4} spacing={1.5}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography sx={{ fontSize: 16, opacity: 0.9 }}>Résultat net (N)</Typography>
                    <Typography
                        sx={{
                            fontSize: 24,
                            fontWeight: 700,
                            textShadow: "0 2px 4px rgba(0,0,0,0.2)"
                        }}
                    >
                        {formatMontant(resultatN)}
                    </Typography>
                </Stack>

                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography sx={{ fontSize: 15, opacity: 0.6 }}>Résultat net (N-1)</Typography>
                    <Typography sx={{ fontSize: 16 }}>{formatMontant(resultatN1)}</Typography>
                </Stack>

                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography sx={{ fontSize: 15 }}>Évolution</Typography>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                        {IconVariation(evolutionResultatN)}
                        <Typography sx={{ fontSize: 16, fontWeight: 600, color: getColor(evolutionResultatN) }}>
                            {formatePourcentage(variationResultatN, evolutionResultatN)}
                        </Typography>
                    </Stack>
                </Stack>
            </Stack>

            {/* Divider */}
            <Box sx={{ borderBottom: "1px solid rgba(255,255,255,0.25)", my: 3 }} />

            {/* Chiffre d'affaires */}
            <Stack spacing={1.5}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography sx={{ fontSize: 16, opacity: 0.9 }}>Chiffre d'affaires (N)</Typography>
                    <Typography
                        sx={{
                            fontSize: 24,
                            fontWeight: 700,
                            textShadow: "0 2px 4px rgba(0,0,0,0.2)"
                        }}
                    >
                        {formatMontant(resultatChiffreAffaireN)}
                    </Typography>
                </Stack>

                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography sx={{ fontSize: 15, opacity: 0.6 }}>Exercice précédent (N-1)</Typography>
                    <Typography sx={{ fontSize: 16 }}>{formatMontant(resultatChiffreAffaireN1)}</Typography>
                </Stack>

                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography sx={{ fontSize: 15 }}>Évolution</Typography>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                        {IconVariation(evolutionChiffreAffaireN)}
                        <Typography sx={{ fontSize: 16, fontWeight: 600, color: getColor(evolutionChiffreAffaireN) }}>
                            {formatePourcentage(variationChiffreAffaireN, evolutionChiffreAffaireN)}
                        </Typography>
                    </Stack>
                </Stack>
            </Stack>

        </Stack>
    )
}

export default KpiCardDouble