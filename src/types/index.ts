export const SUBSCRIPTION_PRICE = 12.99
export const CURRENCY = 'USD'
export const APP_NAME = 'Tunely'
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export interface Artist {
  id: string
  username: string
  artistName: string
  email: string
  subscribed: boolean
  stripeCustomerId?: string
  createdAt: string
  updatedAt: string
}

export interface Session {
  id: string
  artistId: string
  active: boolean
  startTime: string
  endTime?: string
  earnings: number
}

export interface QueueItem {
  id: string
  sessionId: string
  songTitle: string
  tipAmount: number
  customerName?: string
  completed: boolean
  createdAt: string
}

export interface PaymentIntent {
  id: string
  amount: number
  currency: string
  status: string
}