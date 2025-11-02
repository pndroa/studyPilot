'use client'

import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
} from '@mui/material'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Themen', href: '/topics' },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <Box
      width={240}
      bgcolor='#fff'
      boxShadow={2}
      display='flex'
      flexDirection='column'
      p={2}
      height='100vh'
      position='sticky'
      top={0}
    >
      <Typography variant='h6' fontWeight='bold' mb={2}>
        StudyPilot
      </Typography>

      <List disablePadding>
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href)

          return (
            <ListItem key={item.href} disablePadding>
              <ListItemButton
                component={Link}
                href={item.href}
                selected={isActive}
                sx={{
                  borderRadius: 2,
                  '&.Mui-selected': {
                    bgcolor: 'primary.main',
                    color: 'white',
                    '&:hover': { bgcolor: 'primary.dark' },
                  },
                }}
              >
                <ListItemText primary={item.label} />
              </ListItemButton>
            </ListItem>
          )
        })}
      </List>
    </Box>
  )
}
