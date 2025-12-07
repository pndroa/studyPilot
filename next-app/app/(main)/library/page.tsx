'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import Grid from '@mui/material/GridLegacy'
import SearchIcon from '@mui/icons-material/Search'
import RefreshIcon from '@mui/icons-material/Refresh'
import type {
  DocumentAnalysisResponse,
  DocumentSummary,
} from '@/types/analysis'
import DocumentList from '@/components/Library/DocumentList'
import DocumentDetails from '@/components/Library/DocumentDetails'

type MimeFilter = 'all' | 'pdf' | 'txt'

export default function LibraryPage() {
  const [documents, setDocuments] = useState<DocumentSummary[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedDoc, setSelectedDoc] =
    useState<DocumentAnalysisResponse | null>(null)
  const [search, setSearch] = useState('')
  const [mimeFilter, setMimeFilter] = useState<MimeFilter>('all')
  const [isLoadingList, setIsLoadingList] = useState(false)
  const [isLoadingDoc, setIsLoadingDoc] = useState(false)
  const [listError, setListError] = useState<string | null>(null)
  const [detailError, setDetailError] = useState<string | null>(null)

  const filteredDocuments = useMemo(() => {
    const term = search.trim().toLowerCase()
    return documents.filter((doc) => {
      const matchesSearch =
        !term ||
        doc.fileName.toLowerCase().includes(term) ||
        doc.documentId.toLowerCase().includes(term)
      const matchesType =
        mimeFilter === 'all'
          ? true
          : mimeFilter === 'pdf'
          ? doc.mimeType.includes('pdf')
          : doc.mimeType.includes('text') || doc.mimeType.includes('txt')
      return matchesSearch && matchesType
    })
  }, [documents, search, mimeFilter])

  const fetchDocumentDetails = useCallback(async (documentId: string) => {
    setSelectedId(documentId)
    setIsLoadingDoc(true)
    setDetailError(null)
    try {
      const res = await fetch(
        `/api/documents/${encodeURIComponent(documentId)}`
      )
      const data = await res.json()
      if (!res.ok) {
        throw new Error(
          data?.message || 'Details konnten nicht geladen werden.'
        )
      }
      setSelectedDoc(data as DocumentAnalysisResponse)
    } catch (error) {
      console.error(error)
      setDetailError(
        error instanceof Error
          ? error.message
          : 'Dokument konnte nicht geladen werden.'
      )
    } finally {
      setIsLoadingDoc(false)
    }
  }, [])

  const fetchDocuments = useCallback(
    async (preferredId?: string | null) => {
      setIsLoadingList(true)
      setListError(null)
      setDetailError(null)
      try {
        const res = await fetch('/api/documents')
        const data = await res.json()
        if (!res.ok) {
          throw new Error(
            data?.message || 'Dokumente konnten nicht geladen werden.'
          )
        }
        const nextDocs = (data.documents ?? []) as DocumentSummary[]
        setDocuments(nextDocs)
        const targetId =
          (preferredId &&
            nextDocs.find((doc) => doc.documentId === preferredId)
              ?.documentId) ||
          nextDocs[0]?.documentId
        if (targetId) {
          void fetchDocumentDetails(targetId)
        } else {
          setSelectedDoc(null)
          setSelectedId(null)
        }
      } catch (error) {
        console.error(error)
        setListError(
          error instanceof Error
            ? error.message
            : 'Dokumentenliste konnte nicht geladen werden.'
        )
      } finally {
        setIsLoadingList(false)
      }
    },
    [fetchDocumentDetails]
  )

  useEffect(() => {
    void fetchDocuments(null)
  }, [fetchDocuments])

  useEffect(() => {
    if (
      selectedId &&
      !filteredDocuments.find((doc) => doc.documentId === selectedId)
    ) {
      setSelectedId(null)
      setSelectedDoc(null)
    }
  }, [filteredDocuments, selectedId])

  return (
    <Box>
      <Typography variant='h4' fontWeight='bold' mb={1}>
        Dokumentenbibliothek
      </Typography>
      <Typography variant='body1' color='text.secondary' mb={3}>
        Wiederverwende bereits analysierte Dokumente, ohne sie erneut
        hochzuladen. Suche, filtere und lade die vorhandenen Embeddings direkt
        in deine Sessions.
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={5}>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Stack spacing={2}>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={1.5}
                  alignItems={{ xs: 'flex-start', sm: 'center' }}
                >
                  <TextField
                    fullWidth
                    label='Suchen'
                    placeholder='Dateiname oder ID'
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position='start'>
                          <SearchIcon fontSize='small' />
                        </InputAdornment>
                      ),
                    }}
                  />
                  <TextField
                    select
                    label='Typ'
                    value={mimeFilter}
                    onChange={(e) =>
                      setMimeFilter(e.target.value as MimeFilter)
                    }
                    sx={{ minWidth: 140 }}
                  >
                    <MenuItem value='all'>Alle</MenuItem>
                    <MenuItem value='pdf'>PDF</MenuItem>
                    <MenuItem value='txt'>Text</MenuItem>
                  </TextField>
                  <Button
                    startIcon={<RefreshIcon />}
                    variant='outlined'
                    onClick={() => fetchDocuments(selectedId)}
                    sx={{
                      width: 36,
                      height: 36,
                      minWidth: 36,
                      paddingLeft: 3.25,
                    }}
                  />
                </Stack>
                {listError ? <Alert severity='error'>{listError}</Alert> : null}
                <DocumentList
                  documents={filteredDocuments}
                  selectedId={selectedId}
                  isLoading={isLoadingList}
                  onSelect={fetchDocumentDetails}
                  emptyHint={
                    documents.length === 0
                      ? 'Noch keine Dokumente gespeichert.'
                      : 'Keine Treffer fuer diesen Filter.'
                  }
                />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={7}>
          {detailError ? (
            <Alert severity='error' sx={{ mb: 2 }}>
              {detailError}
            </Alert>
          ) : null}
          <DocumentDetails document={selectedDoc} isLoading={isLoadingDoc} />
        </Grid>
      </Grid>
    </Box>
  )
}
