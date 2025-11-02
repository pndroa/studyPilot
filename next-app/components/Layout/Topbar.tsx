import { AppBar, Toolbar, Typography, Box, Avatar } from '@mui/material'

export default function Topbar() {
  return (
    <AppBar position='static' color='transparent' elevation={0}>
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Typography variant='h6'>Willkommen zurück 👋</Typography>
        <Box display='flex' alignItems='center' gap={2}>
          <Typography variant='body2'>Student</Typography>
          <Avatar sx={{ bgcolor: '#1976d2' }}>S</Avatar>
        </Box>
      </Toolbar>
    </AppBar>
  )
}
