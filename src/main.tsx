import React from 'react'
import ReactDOM from 'react-dom/client'
import { CssBaseline, ThemeProvider } from '@mui/material'
import { RouterProvider } from 'react-router-dom'
import { createAppTheme } from './theme'
import { router } from './router'
import { getAppSettings, subscribeToAppSettings } from './utils/settings'

function AppBootstrap() {
  const [settings, setSettings] = React.useState(() => getAppSettings())

  React.useEffect(() => {
    const unsubscribe = subscribeToAppSettings((next) => {
      setSettings(next)
    })

    return () => {
      unsubscribe()
    }
  }, [])

  React.useEffect(() => {
    document.body.classList.toggle('app-monochrome', settings.monochromeMode)
  }, [settings.monochromeMode])

  const theme = React.useMemo(() => createAppTheme(settings.darkMode ? 'dark' : 'light'), [settings.darkMode])

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <RouterProvider router={router} />
    </ThemeProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <AppBootstrap />
  </React.StrictMode>,
)



