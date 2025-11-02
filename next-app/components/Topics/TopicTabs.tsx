'use client'

import { Box, Tabs, Tab } from '@mui/material'
import Link from 'next/link'
import { usePathname, useParams } from 'next/navigation'
import React from 'react'

export default function TopicTabs({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { topicId } = useParams()

  const currentTab = pathname.endsWith('/quiz') ? 'quiz' : 'chat'

  return (
    <Box>
      <Tabs value={currentTab} sx={{ mb: 3 }}>
        <Tab
          label='Chat'
          value='chat'
          component={Link}
          href={`/topics/${topicId}/chat`}
        />
        <Tab
          label='Quiz'
          value='quiz'
          component={Link}
          href={`/topics/${topicId}/quiz`}
        />
      </Tabs>
      {children}
    </Box>
  )
}
