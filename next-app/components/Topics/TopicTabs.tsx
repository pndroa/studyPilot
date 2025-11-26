'use client'

import { Box, Tabs, Tab } from '@mui/material'
import Link from 'next/link'
import { usePathname, useParams } from 'next/navigation'
import React from 'react'

export default function TopicTabs({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { topicId } = useParams()

  let currentTab: string = 'chat'

  if (pathname.endsWith('/quiz')) currentTab = 'quiz'
  else if (pathname.endsWith('/flashCard')) currentTab = 'flashCard'
  else if (pathname.endsWith('/summary')) currentTab = 'summary'

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
        <Tab
          label='FlashCard'
          value='flashCard'
          component={Link}
          href={`/topics/${topicId}/flashCard`}
        />
        <Tab
          label='Zusammenfassung'
          value='summary'
          component={Link}
          href={`/topics/${topicId}/summary`}
        />
      </Tabs>
      {children}
    </Box>
  )
}
