import { app } from 'electron'

// Placeholder — full implementation in Phase 1
app.whenReady().then(() => {
  console.log('Hourly Journal starting...')
})

app.on('window-all-closed', (e) => {
  e.preventDefault()
})
