'use client'

import { CssBaseline, ThemeProvider, createTheme } from '@mui/material'
import { createContext, useEffect, useMemo, useState, ReactNode } from 'react'
import { motion } from 'framer-motion'
import './globals.css'

export const ColorModeContext = createContext({
  toggleColorMode: () => {},
})

export default function RootLayout({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    const saved = localStorage.getItem('theme-mode') as 'light' | 'dark' | null
    if (saved) {
      setMode(saved)
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setMode('dark')
    }
  }, [])

  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prev) => {
          const next = prev === 'light' ? 'dark' : 'light'
          localStorage.setItem('theme-mode', next)
          return next
        })
      },
    }),
    []
  )

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: { main: '#1976d2' },
          ...(mode === 'dark'
            ? {
                background: {
                  default: '#121212',
                  paper: '#1e1e1e',
                },
                text: {
                  primary: '#ffffff',
                  secondary: '#aaaaaa',
                },
              }
            : {
                background: {
                  default: '#f5f5f5',
                  paper: '#ffffff',
                },
                text: {
                  primary: '#000000',
                  secondary: '#555555',
                },
              }),
        },
        shape: { borderRadius: 12 },
        typography: {
          fontFamily: `"Inter", "Roboto", "Helvetica", "Arial", sans-serif`,
        },
      }),
    [mode]
  )

  return (
    <html lang='de'>
      <body
        style={{
          backgroundColor: theme.palette.background.default,
          color: theme.palette.text.primary,
          overflowX: 'hidden',
        }}
      >
        <ColorModeContext.Provider value={colorMode}>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              style={{ minHeight: '100vh' }}
            >
              {children}
            </motion.div>
          </ThemeProvider>
        </ColorModeContext.Provider>
      </body>
    </html>
  )
}
