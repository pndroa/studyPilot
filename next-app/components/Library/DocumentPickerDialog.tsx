'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
} from '@mui/material'
import Grid from '@mui/material/GridLegacy'
import SearchIcon from '@mui/icons-material/Search'
import type {
  DocumentAnalysisResponse,
  DocumentSummary,
} from '@/types/analysis'
import DocumentList from './DocumentList'
import DocumentDetails from './DocumentDetails'

type MimeFilter = 'all' | 'pdf' | 'txt'

interface DocumentPickerDialogProps {
  open: boolean
  onClose: () => void
  onSelect: (document: DocumentAnalysisResponse) => void
}

export default function DocumentPickerDialog({
  open,
  onClose,
  onSelect,
}: DocumentPickerDialogProps) {
  const [documents, setDocuments] = useState<DocumentSummary[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedDoc, setSelectedDoc] = useState<DocumentAnalysisResponse | null>(
    null
  )
  const selectedIdRef = useRef<string | null>(null)
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
      const res = await fetch(`/api/documents/${encodeURIComponent(documentId)}`)
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.message || 'Details konnten nicht geladen werden.')
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

  const fetchDocuments = useCallback(async (preferredId?: string | null) => {
    setIsLoadingList(true)
    setListError(null)
    setDetailError(null)
    try {
      const res = await fetch('/api/documents')
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.message || 'Dokumente konnten nicht geladen werden.')
      }
      const nextDocs = (data.documents ?? []) as DocumentSummary[]
      setDocuments(nextDocs)
      const targetId =
        (preferredId &&
          nextDocs.find((doc) => doc.documentId === preferredId)?.documentId) ||
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
  }, [fetchDocumentDetails])

  useEffect(() => {
    if (open) {
      void fetchDocuments(selectedIdRef.current)
    }
  }, [open, fetchDocuments])

  useEffect(() => {
    selectedIdRef.current = selectedId
  }, [selectedId])

  useEffect(() => {
    if (
      selectedId &&
      !filteredDocuments.find((doc) => doc.documentId === selectedId)
    ) {
      setSelectedId(null)
      setSelectedDoc(null)
    }
  }, [filteredDocuments, selectedId])

  const handleUseDocument = () => {
    if (selectedDoc) {
      onSelect(selectedDoc)
      onClose()
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth='lg'
      scroll='paper'
    >
      <DialogTitle>Dokument aus Bibliothek waehlen</DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2} sx={{ minHeight: 420 }}>
          <Grid item xs={12} md={5}>
            <Stack spacing={1.5} mb={2}>
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
                onChange={(e) => setMimeFilter(e.target.value as MimeFilter)}
              >
                <MenuItem value='all'>Alle</MenuItem>
                <MenuItem value='pdf'>PDF</MenuItem>
                <MenuItem value='txt'>Text</MenuItem>
              </TextField>
              {listError ? <Alert severity='error'>{listError}</Alert> : null}
            </Stack>
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
          </Grid>
          <Grid item xs={12} md={7}>
            {detailError ? <Alert severity='error' sx={{ mb: 2 }}>{detailError}</Alert> : null}
            <DocumentDetails
              document={selectedDoc}
              isLoading={isLoadingDoc}
              onUse={handleUseDocument}
              actionLabel='Als Kontext uebernehmen'
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Abbrechen</Button>
        <Button
          variant='contained'
          onClick={handleUseDocument}
          disabled={!selectedDoc}
        >
          Auswaehlen
        </Button>
      </DialogActions>
    </Dialog>
  )
}
