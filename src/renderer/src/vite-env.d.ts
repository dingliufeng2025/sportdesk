/// <reference types="vite/client" />

import type { SportDeskApi } from '../../preload/index'

declare global {
  interface Window {
    sportdesk: SportDeskApi
  }
}

export {}
