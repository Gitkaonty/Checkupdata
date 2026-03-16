import { Stack, Typography } from "@mui/material"

const CardInfoDossier = ({ icon, text, backgroundColor, nbr, nbrColor }) => {
    return (
        <Stack
            width={"25%"}
            height={"100%"}
            justifyContent="center"
            // alignItems="center"
            sx={{
                backgroundColor: backgroundColor,
                color: 'black',
                p: '40px',
                borderRadius: '10px',
            }}
        >
            <Stack
                direction={'row'}
                alignItems={'center'}
                alignContent={'center'}
                spacing={5}
            >
                <Stack>
                    {icon}
                </Stack>
                <Stack>
                    <Typography variant='h5' sx={{ color: "black", fontWeight: 'bold' }}>{text}</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', color: nbrColor }}>
                        {nbr}
                    </Typography>
                </Stack>
            </Stack>
        </Stack>
    )
}

export default CardInfoDossier