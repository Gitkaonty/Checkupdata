import { CircularProgress, Stack, Typography } from '@mui/material';
const ProgressWithMessage = ({ text }) => {
    return (
        <Stack
            direction="row"
            alignItems="center"
            justifyContent="center"
            spacing={2}
        >
            <CircularProgress size={50} />

            <Typography
                variant="h5"
                sx={{
                    color: '#2973B2',
                    fontWeight: 500
                }}
            >
                {text}
            </Typography>
        </Stack>
    )
}

export default ProgressWithMessage