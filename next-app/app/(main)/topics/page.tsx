'use client'

import { useEffect, useState } from 'react'
import { Box, Typography, Button, TextField, Stack } from '@mui/material'
import AddCircleIcon from '@mui/icons-material/AddCircle'
import TopicList from '@/components/Topics/TopicList'
import type { Topic } from '@/types/topics'
import { mockTopics } from '@/utils/mockData'

const STORAGE_KEY = 'topics:list'
const RELATED_KEYS = (topicId: string) => [
  `chat:${topicId}`,
  `documents:${topicId}`,
  `quizzes:${topicId}`,
  `flashcards:${topicId}`,
]

export default function TopicsPage() {
  const [topics, setTopics] = useState<Topic[]>([])
  const [newTopicTitle, setNewTopicTitle] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const stored = loadTopics()
    setTopics(stored.length ? stored : mockTopics)
  }, [])

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
    const next = [...topics, newTopic]
    setTopics(next)
    persistTopics(next)
    setNewTopicTitle('')
    setError(null)
  }

  const handleDeleteTopic = (id: string) => {
    const next = topics.filter((topic) => topic.id !== id)
    setTopics(next)
    persistTopics(next)
    clearTopicData(id)
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

function loadTopics(): Topic[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function persistTopics(list: Topic[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  } catch {
    // ignore
  }
}

function clearTopicData(topicId: string) {
  if (typeof window === 'undefined') return
  RELATED_KEYS(topicId).forEach((key) => {
    try {
      localStorage.removeItem(key)
    } catch {
      // ignore
    }
  })
}
