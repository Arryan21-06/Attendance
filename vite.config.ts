import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'AttendTrack',
        short_name: 'AttendTrack',
        description: 'DTU Attendance Tracker',
        theme_color: '#DCEBF7',
        background_color: '#DCEBF7',
        display: 'standalone',
        // Using minimal icon config for now
        icons: []
      }
    })
  ],
})
