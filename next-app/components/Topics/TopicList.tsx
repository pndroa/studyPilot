'use client'

import { List, ListItemButton, ListItemText, Card } from '@mui/material'
import Link from 'next/link'
import type { Topic } from '@/types/topics'

interface TopicListProps {
  topics: Topic[]
}

export default function TopicList({ topics }: TopicListProps) {
  return (
    <Card sx={{ p: 2 }}>
      <List>
        {topics.map((topic) => (
          <ListItemButton
            key={topic.id}
            component={Link}
            href={`/topics/${topic.id}/chat`}
            sx={{ borderRadius: 2 }}
          >
            <ListItemText primary={topic.title} />
          </ListItemButton>
        ))}
      </List>
    </Card>
  )
}
