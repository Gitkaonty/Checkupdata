import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import { Stack, Typography } from '@mui/material';

function CircularProgressWithValueLabel({ value, msg }) {
  return (

    <Stack direction={'row'} alignContent={'center'} alignItems={'center'} spacing={2}>
      <Box position="relative" display="inline-flex">
        {/* Circular Progress */}
        <CircularProgress variant="determinate" value={value} size={50} thickness={5} />
        
        {/* Affichage du pourcentage au centre */}
        <Box
          position="absolute"
          top="50%"
          left="50%"
          display="flex"
          alignItems="center"
          justifyContent="center"
          style={{ transform: 'translate(-50%, -50%)' }}
        >
          <span>{value}%</span>  {/* Affichage du pourcentage */}
        </Box>
        
      </Box>
      <Typography variant='h6' style={{color:'#2973B2'}}>{msg}</Typography>
    </Stack>
  );
}

export default CircularProgressWithValueLabel;