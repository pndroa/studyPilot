'use client'

import { Box } from '@mui/material'
import Sidebar from '@/components/Layout/Sidebar'
import Topbar from '@/components/Layout/Topbar'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Box display='flex' minHeight='100vh'>
      <Sidebar />
      <Box flexGrow={1} p={3}>
        <Topbar />
        {children}
      </Box>
    </Box>
  )
}
