'use client'

import { Box, Typography, Button, TextField, Stack } from '@mui/material'
import AddCircleIcon from '@mui/icons-material/AddCircle'
import TopicList from '@/components/Topics/TopicList'
import { useState } from 'react'
import { mockTopics } from '@/utils/mockData'

export default function TopicsPage() {
  const [topics, setTopics] = useState(mockTopics)
  const [newTopicTitle, setNewTopicTitle] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleAddTopic = () => {
    const title = newTopicTitle.trim()
    if (!title) {
      setError('Bitte einen Namen eingeben.')
      return
    }
    const newTopic = {
      id: `topic-${Date.now()}`,
      title,
    }
    setTopics((prev) => [...prev, newTopic])
    setNewTopicTitle('')
    setError(null)
  }

  const handleDeleteTopic = (id: string) => {
    setTopics((prev) => prev.filter((topic) => topic.id !== id))
  }

  return (
    <Box>
      <Typography variant='h4' fontWeight='bold' mb={2}>
        Deine Themen
      </Typography>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={2}>
        <TextField
          label='Neues Thema'
          placeholder='z.B. Mathe Klausur'
          fullWidth
          value={newTopicTitle}
          onChange={(event) => setNewTopicTitle(event.target.value)}
          error={Boolean(error)}
          helperText={error ?? ' '}
        />
        <Button
          variant='contained'
          onClick={handleAddTopic}
          startIcon={<AddCircleIcon />}
          size='small'
          sx={{
            height: '3.5rem',
          }}
        >
          Thema erstellen
        </Button>
      </Stack>

      <TopicList topics={topics} onDelete={handleDeleteTopic} />
    </Box>
  )
}
