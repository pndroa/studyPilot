import { Theme } from '@mui/material/styles'

export const getChartTheme = (theme: Theme) => ({
  gridColor:
    theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
  axisColor: theme.palette.text.secondary,
  tooltip: {
    background:
      theme.palette.mode === 'dark'
        ? theme.palette.background.paper
        : '#ffffff',
    border:
      theme.palette.mode === 'dark'
        ? '1px solid rgba(255,255,255,0.2)'
        : '1px solid rgba(0,0,0,0.1)',
    labelColor: theme.palette.text.primary,
    textColor: theme.palette.text.primary,
    cursorFill:
      theme.palette.mode === 'dark'
        ? 'rgba(255,255,255,0.05)'
        : 'rgba(0,0,0,0.05)',
  },
  primaryColor: theme.palette.primary.main,
  activeColor:
    theme.palette.mode === 'dark'
      ? theme.palette.primary.light
      : theme.palette.primary.dark,
})
