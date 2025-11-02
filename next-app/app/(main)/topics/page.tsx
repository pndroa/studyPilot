'use client'

import { Box, Typography, Button } from '@mui/material'
import TopicList from '@/components/Topics/TopicList'
import { useState } from 'react'
import { mockTopics } from '@/utils/mockData'

export default function TopicsPage() {
  const [topics, setTopics] = useState(mockTopics)

  const handleAddTopic = () => {
    const newTopic = {
      id: `topic-${Date.now()}`,
      title: `Neues Thema ${topics.length + 1}`,
    }
    setTopics([...topics, newTopic])
  }

  return (
    <Box>
      <Typography variant='h4' fontWeight='bold' mb={2}>
        Deine Themen
      </Typography>

      <Button variant='contained' onClick={handleAddTopic} sx={{ mb: 2 }}>
        + Neues Thema
      </Button>

      <TopicList topics={topics} />
    </Box>
  )
}
