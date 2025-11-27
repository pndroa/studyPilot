'use client'

import {
  Box,
  Button,
  Typography,
  Card,
  CardContent,
  useTheme,
  Stack,
  Chip,
  LinearProgress,
} from '@mui/material'
import ShuffleIcon from '@mui/icons-material/Shuffle'
import ReplayIcon from '@mui/icons-material/Replay'
import ThumbUpOffAltIcon from '@mui/icons-material/ThumbUpOffAlt'
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import ThumbDownOffAltIcon from '@mui/icons-material/ThumbDownOffAlt'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { FlashCardData } from '@/types/topics'

interface FlashCardProps {
  topicId: string
  cards: FlashCardData[]
  onDelete?: (id: string) => void
}

interface FlashCardProgress {
  index: number
  flipped: boolean
  order: string[]
}

const PROGRESS_KEY = (topicId: string) => `flashcards:progress:${topicId}`
const STATUS_KEY = (topicId: string) => `flashcards:status:${topicId}`
type CardStatus = 'known' | 'partial' | 'unknown'

export default function FlashCard({
  topicId,
  cards: initialCards,
  onDelete,
}: FlashCardProps) {
  const theme = useTheme()
  const [cards, setCards] = useState<FlashCardData[]>(initialCards)
  const [order, setOrder] = useState<string[]>([])
  const [current, setCurrent] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [statuses, setStatuses] = useState<Record<string, CardStatus>>({})
  const orderRef = useRef<string[]>([])
  const hydratedRef = useRef(false)
  const statusesRef = useRef<Record<string, CardStatus>>({})

  useEffect(() => {
    if (initialCards.length === 0) return
    setCards(initialCards)
    const saved = loadProgress(topicId)
    const savedStatuses = loadStatuses(topicId, initialCards)
    const normalizedOrder = normalizeOrder(saved?.order, initialCards)
    setOrder(normalizedOrder)
    setCurrent(clampIndex(saved?.index ?? 0, normalizedOrder.length))
    setFlipped(saved?.flipped ?? false)
    setStatuses(savedStatuses)
    hydratedRef.current = true
  }, [initialCards, topicId])

  useEffect(() => {
    if (cards.length === 0) return
    if (!hydratedRef.current) return

    // Falls keine Reihenfolge geladen wurde (z.B. Altbestand ohne order), setze sie jetzt
    if (order.length === 0) {
      const saved = loadProgress(topicId)
      const fallbackOrder = cards.map((card) => card.id)
      const nextIndex = clampIndex(saved?.index ?? current, fallbackOrder.length)
      setOrder(fallbackOrder)
      setCurrent(nextIndex)
      setFlipped(saved?.flipped ?? flipped)
      persistProgress(topicId, {
        index: nextIndex,
        flipped: saved?.flipped ?? flipped,
        order: fallbackOrder,
      })
      return
    }

    const boundedIndex = clampIndex(current, orderRef.current.length || order.length)
    const effectiveOrder = orderRef.current.length ? orderRef.current : order
    persistProgress(topicId, { index: boundedIndex, flipped, order: effectiveOrder })
  }, [topicId, current, flipped, cards.length, order.length])

  useEffect(() => {
    orderRef.current = order
  }, [order])

  useEffect(
    () => () => {
      if (orderRef.current.length === 0) return
      if (!hydratedRef.current) return
      const boundedIndex = clampIndex(current, orderRef.current.length)
      persistProgress(topicId, {
        index: boundedIndex,
        flipped,
        order: orderRef.current,
      })
      persistStatuses(topicId, statusesRef.current)
    },
    [topicId, current, flipped, order.length]
  )

  useEffect(() => {
    statusesRef.current = statuses
    if (!hydratedRef.current || cards.length === 0) return
    persistStatuses(topicId, statuses)
  }, [topicId, statuses, cards.length])

  const handleFlip = () => setFlipped((f) => !f)

  const handleNext = () => {
    if (order.length === 0) return
    setFlipped(false)
    setCurrent((prev) => (prev + 1) % order.length)
  }

  const handleDelete = (id: string) => {
    const updated = cards.filter((c) => c.id !== id)
    onDelete?.(id)
    const nextOrder = order.filter((cardId) => cardId !== id)
    const nextIndex = clampIndex(current, updated.length)
    setCards(updated)
    setOrder(nextOrder)
    setCurrent(nextIndex)
    setFlipped(false)
    if (statuses[id]) {
      const nextStatuses = { ...statuses }
      delete nextStatuses[id]
      setStatuses(nextStatuses)
      persistStatuses(topicId, nextStatuses)
    }
    if (updated.length === 0) {
      clearProgress(topicId)
    } else {
      persistProgress(topicId, { index: nextIndex, flipped: false, order: nextOrder })
    }
  }

  const handleShuffle = () => {
    if (order.length === 0) return
    const shuffled = shuffle(order)
    setOrder(shuffled)
    setCurrent(0)
    setFlipped(false)
    persistProgress(topicId, { index: 0, flipped: false, order: shuffled })
  }

  const handleRepeat = () => {
    const activeOrder = order.length ? order : cards.map((c) => c.id)
    setOrder(activeOrder)
    setCurrent(0)
    setFlipped(false)
    setStatuses({})
    persistStatuses(topicId, {})
    persistProgress(topicId, { index: 0, flipped: false, order: activeOrder })
  }

  const currentCard = useMemo(() => {
    if (order.length === 0) return cards[current] ?? null
    const targetId = order[clampIndex(current, order.length)]
    return cards.find((c) => c.id === targetId) ?? null
  }, [cards, order, current])

  const handleMark = (status: CardStatus) => {
    const cardId = currentCard?.id
    if (!cardId) return
    const nextStatuses = { ...statuses, [cardId]: status }
    setStatuses(nextStatuses)
    persistStatuses(topicId, nextStatuses)
    handleNext()
  }

  const statusCounts = useMemo(() => {
    const counts: Record<CardStatus, number> = {
      known: 0,
      partial: 0,
      unknown: 0,
    }
    cards.forEach((card) => {
      const status = statuses[card.id]
      if (status) counts[status] += 1
    })
    return counts
  }, [cards, statuses])

  const answeredCount = statusCounts.known + statusCounts.partial + statusCounts.unknown
  const completion = cards.length > 0 ? Math.round((answeredCount / cards.length) * 100) : 0
  const currentStatus = currentCard ? statuses[currentCard.id] : undefined

  if (cards.length === 0) {
    return (
      <Typography textAlign='center' mt={2}>
        Keine Karteikarten vorhanden.
      </Typography>
    )
  }

  return (
    <Stack spacing={2} alignItems="center">
      <Card>
        <CardContent>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            justifyContent='space-between'
            alignItems={{ xs: 'stretch', md: 'center' }}
          >
            <Box>
              <Typography variant='subtitle1' fontWeight={600}>
                Deck-Progress
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                {answeredCount}/{cards.length} Karten markiert
              </Typography>
              <LinearProgress
                variant='determinate'
                value={completion}
                sx={{ mt: 1, height: 8, borderRadius: 4 }}
              />
            </Box>
            <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
              <Chip
                label={`Kann ich: ${statusCounts.known}`}
                color='success'
                variant='outlined'
                size='small'
              />
              <Chip
                label={`Teilweise: ${statusCounts.partial}`}
                color='warning'
                variant='outlined'
                size='small'
              />
              <Chip
                label={`Kann ich nicht: ${statusCounts.unknown}`}
                color='error'
                variant='outlined'
                size='small'
              />
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Box
        sx={{
          width: '100%',
          maxWidth: 520,
          height: 250,
          perspective: '1000px',
          mx: 'auto',
          mb: 2,
          cursor: 'pointer',
        }}
        onClick={handleFlip}
      >
        <Box
          sx={{
            width: '100%',
            height: '100%',
            position: 'relative',
            transformStyle: 'preserve-3d',
            transition: 'transform 0.6s ease',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* Vorderseite */}
          <Card
            sx={{
              width: '100%',
              height: '100%',
              position: 'absolute',
              top: 0,
              left: 0,
              backfaceVisibility: 'hidden',
              bgcolor: theme.palette.background.paper,
              boxShadow:
                theme.palette.mode === 'dark'
                  ? '0 4px 12px rgba(0,0,0,0.4)'
                  : '0 4px 12px rgba(0,0,0,0.1)',
            }}
          >
            <CardContent
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                textAlign: 'center',
              }}
            >
              <Typography variant='h6'>{currentCard?.question ?? ''}</Typography>
            </CardContent>
          </Card>

          {/* Rueckseite */}
          <Card
            sx={{
              width: '100%',
              height: '100%',
              position: 'absolute',
              top: 0,
              left: 0,
              transform: 'rotateY(180deg)',
              backfaceVisibility: 'hidden',
              bgcolor: theme.palette.background.paper,
              boxShadow:
                theme.palette.mode === 'dark'
                  ? '0 4px 12px rgba(0,0,0,0.4)'
                  : '0 4px 12px rgba(0,0,0,0.1)',
            }}
          >
            <CardContent
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                textAlign: 'center',
              }}
            >
              <Typography variant='h6'>{currentCard?.answer ?? ''}</Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>

      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={1.5}
        justifyContent='center'
        alignItems={{ xs: 'stretch', md: 'center' }}
      >
        <Button
          variant={currentStatus === 'known' ? 'contained' : 'outlined'}
          color='success'
          onClick={() => handleMark('known')}
          startIcon={<ThumbUpOffAltIcon />}
          fullWidth
        >
          Kann ich
        </Button>
        <Button
          variant={currentStatus === 'partial' ? 'contained' : 'outlined'}
          color='warning'
          onClick={() => handleMark('partial')}
          startIcon={<HelpOutlineIcon />}
          fullWidth
        >
          Teilweise
        </Button>
        <Button
          variant={currentStatus === 'unknown' ? 'contained' : 'outlined'}
          color='error'
          onClick={() => handleMark('unknown')}
          startIcon={<ThumbDownOffAltIcon />}
          fullWidth
        >
          Kann ich nicht
        </Button>
      </Stack>

      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={1.5}
        justifyContent='center'
        alignItems={{ xs: 'stretch', md: 'center' }}
      >
        <Button
          variant='contained'
          onClick={handleNext}
          disabled={cards.length <= 1}
        >
          Naechste
        </Button>
        <Button variant='outlined' startIcon={<ShuffleIcon />} onClick={handleShuffle}>
          Mischen
        </Button>
        <Button variant='outlined' startIcon={<ReplayIcon />} onClick={handleRepeat}>
          Wiederholen
        </Button>
        <Button
          variant='text'
          color='error'
          onClick={() => currentCard && handleDelete(currentCard.id)}
          disabled={!currentCard}
        >
          Loeschen
        </Button>
      </Stack>
    </Stack>
  )
}

function clampIndex(index: number, length: number): number {
  if (length <= 0) return 0
  return Math.min(Math.max(index, 0), length - 1)
}

function loadProgress(topicId: string): FlashCardProgress | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(PROGRESS_KEY(topicId))
    if (!raw) return null
    const parsed = JSON.parse(raw) as FlashCardProgress
    if (typeof parsed?.index !== 'number') return null
    const order = Array.isArray(parsed?.order)
      ? parsed.order.filter((id) => typeof id === 'string')
      : []
    return {
      index: parsed.index,
      flipped: Boolean(parsed.flipped),
      order,
    }
  } catch {
    return null
  }
}

function persistProgress(topicId: string, progress: FlashCardProgress) {
  try {
    localStorage.setItem(PROGRESS_KEY(topicId), JSON.stringify(progress))
  } catch {
    // ignore storage failures (e.g., private mode)
  }
}

function clearProgress(topicId: string) {
  try {
    localStorage.removeItem(PROGRESS_KEY(topicId))
  } catch {
    // ignore
  }
}

function loadStatuses(
  topicId: string,
  cards: FlashCardData[]
): Record<string, CardStatus> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(STATUS_KEY(topicId))
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, CardStatus>
    if (!parsed || typeof parsed !== 'object') return {}
    const allowed = new Set(cards.map((c) => c.id))
    return Object.fromEntries(
      Object.entries(parsed).filter(([key]) => allowed.has(key))
    )
  } catch {
    return {}
  }
}

function persistStatuses(topicId: string, statuses: Record<string, CardStatus>) {
  try {
    localStorage.setItem(STATUS_KEY(topicId), JSON.stringify(statuses))
  } catch {
    // ignore
  }
}

function normalizeOrder(saved: string[] | undefined, cards: FlashCardData[]): string[] {
  const ids = new Set(cards.map((c) => c.id))
  const base = Array.isArray(saved) ? saved.filter((id) => ids.has(id)) : []
  const missing = cards.filter((c) => !base.includes(c.id)).map((c) => c.id)
  return [...base, ...missing]
}

function shuffle(list: string[]): string[] {
  const arr = [...list]
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}
