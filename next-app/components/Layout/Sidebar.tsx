'use client'

import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
  useTheme,
  IconButton,
  Drawer,
  useMediaQuery,
  Collapse,
} from '@mui/material'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronLeft, ChevronRight, Menu } from '@mui/icons-material'
import { useState } from 'react'

const navItems = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Themen', href: '/topics' },
  { label: 'Analyse', href: '/analysis' },
  { label: 'LLM', href: '/ollama' },
]

const drawerWidth = 200

export default function Sidebar() {
  const pathname = usePathname()
  const theme = useTheme()
  const isMobile = useMediaQuery('(max-width:900px)')
  const [open, setOpen] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const toggleSidebar = () => setOpen((prev) => !prev)
  const toggleDrawer = () => setDrawerOpen((prev) => !prev)

  const sidebarContent = (
    <Box
      sx={{
        bgcolor: theme.palette.background.paper,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        borderRight: `1px solid ${theme.palette.divider}`,
        transition: 'width 0.3s ease',
        position: 'relative',
      }}
    >
      {/* Header */}
      <Box
        display='flex'
        alignItems='center'
        justifyContent={open ? 'space-between' : 'center'}
        p={2}
      >
        {open && (
          <Typography variant='h6' fontWeight='bold'>
            StudyPilot
          </Typography>
        )}
        <IconButton onClick={toggleSidebar}>
          {open ? <ChevronLeft /> : <ChevronRight />}
        </IconButton>
      </Box>

      {/* Inhalt nur rendern, wenn offen */}
      <Collapse in={open} timeout='auto' unmountOnExit>
        <List disablePadding sx={{ flexGrow: 1, mt: 1 }}>
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
                    mx: 1,
                    '&.Mui-selected': {
                      bgcolor: theme.palette.primary.main,
                      color: theme.palette.getContrastText(
                        theme.palette.primary.main
                      ),
                      '&:hover': { bgcolor: theme.palette.primary.dark },
                    },
                  }}
                >
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      noWrap: true,
                      fontWeight: isActive ? 600 : 400,
                    }}
                  />
                </ListItemButton>
              </ListItem>
            )
          })}
        </List>
      </Collapse>
    </Box>
  )

  // Mobile Drawer
  if (isMobile) {
    return (
      <>
        <IconButton
          onClick={toggleDrawer}
          sx={{
            position: 'absolute',
            top: 16,
            left: 16,
            zIndex: 1301,
            bgcolor: theme.palette.background.paper,
            boxShadow: 2,
          }}
        >
          <Menu />
        </IconButton>

        <Drawer
          anchor='left'
          open={drawerOpen}
          onClose={toggleDrawer}
          ModalProps={{ keepMounted: true }}
          sx={{
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
            },
          }}
        >
          {sidebarContent}
        </Drawer>
      </>
    )
  }

  // Desktop Sidebar
  return (
    <Box
      sx={{
        width: open ? drawerWidth : 60,
        flexShrink: 0,
        transition: 'width 0.3s ease',
        alignSelf: 'stretch',
        bgcolor: theme.palette.background.paper,
      }}
    >
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          height: '100vh',
          overflow: 'hidden',
        }}
      >
        {sidebarContent}
      </Box>
    </Box>
  )
}
