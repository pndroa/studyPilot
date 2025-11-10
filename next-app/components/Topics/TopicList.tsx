'use client'

import {
  List,
  ListItemButton,
  ListItemText,
  Card,
  IconButton,
  Tooltip,
  ListItem,
  ListItemSecondaryAction,
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import Link from 'next/link'
import type { Topic } from '@/types/topics'

interface TopicListProps {
  topics: Topic[]
  onDelete?: (id: string) => void
}

export default function TopicList({ topics, onDelete }: TopicListProps) {
  return (
    <Card sx={{ p: 2 }}>
      <List>
        {topics.map((topic) => (
          <ListItem
            key={topic.id}
            disablePadding
            sx={{ mb: 1, borderRadius: 2, overflow: 'hidden' }}
            secondaryAction={
              onDelete && (
                <Tooltip title='Thema löschen'>
                  <IconButton
                    edge='end'
                    onClick={(event) => {
                      event.preventDefault()
                      event.stopPropagation()
                      onDelete(topic.id)
                    }}
                  >
                    <DeleteIcon fontSize='small' />
                  </IconButton>
                </Tooltip>
              )
            }
          >
            <ListItemButton
              component={Link}
              href={`/topics/${topic.id}/chat`}
              sx={{ borderRadius: 2 }}
            >
              <ListItemText primary={topic.title} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Card>
  )
}
