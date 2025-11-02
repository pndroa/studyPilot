'use client'

import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
  Avatar,
} from '@mui/material'
import { useContext } from 'react'
import { ColorModeContext } from '@/app/layout'
import { Brightness4, Brightness7 } from '@mui/icons-material'
import { useTheme } from '@mui/material/styles'

export default function Topbar() {
  const theme = useTheme()
  const colorMode = useContext(ColorModeContext)

  return (
    <AppBar position='static' color='transparent' elevation={0}>
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Typography variant='h6'>Willkommen zurück 👋</Typography>

        <Box display='flex' alignItems='center' gap={2}>
          <IconButton onClick={colorMode.toggleColorMode} color='inherit'>
            {theme.palette.mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
          </IconButton>

          <Avatar sx={{ bgcolor: 'primary.main' }}>S</Avatar>
        </Box>
      </Toolbar>
    </AppBar>
  )
}
