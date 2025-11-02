'use client'

import { Box } from '@mui/material'
import Sidebar from '@/components/Layout/Sidebar'
import Topbar from '@/components/Layout/Topbar'
import { motion } from 'framer-motion'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Box display='flex' minHeight='100vh' overflow='hidden'>
      <Sidebar />
      <Box
        flexGrow={1}
        display='flex'
        flexDirection='column'
        sx={{
          position: 'relative',
          overflow: 'auto',
        }}
      >
        <Topbar />
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          style={{ flexGrow: 1, padding: '1.5rem' }}
        >
          {children}
        </motion.div>
      </Box>
    </Box>
  )
}
