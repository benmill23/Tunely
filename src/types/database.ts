export type Database = {
  public: {
    Tables: {
      artists: {
        Row: {
          id: string
          username: string
          email: string
          artist_name: string
          password_hash: string
          subscribed: boolean
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          username: string
          email: string
          artist_name: string
          password_hash: string
          subscribed?: boolean
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          email?: string
          artist_name?: string
          password_hash?: string
          subscribed?: boolean
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      sessions: {
        Row: {
          id: string
          artist_id: string
          active: boolean
          start_time: string
          end_time: string | null
          total_earnings: number
          created_at: string
        }
        Insert: {
          id?: string
          artist_id: string
          active?: boolean
          start_time?: string
          end_time?: string | null
          total_earnings?: number
          created_at?: string
        }
        Update: {
          id?: string
          artist_id?: string
          active?: boolean
          start_time?: string
          end_time?: string | null
          total_earnings?: number
          created_at?: string
        }
      }
      queue_items: {
        Row: {
          id: string
          session_id: string
          song_title: string
          tip_amount: number
          customer_name: string | null
          customer_email: string | null
          completed: boolean
          stripe_payment_intent_id: string | null
          position: number | null
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          song_title: string
          tip_amount: number
          customer_name?: string | null
          customer_email?: string | null
          completed?: boolean
          stripe_payment_intent_id?: string | null
          position?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          song_title?: string
          tip_amount?: number
          customer_name?: string | null
          customer_email?: string | null
          completed?: boolean
          stripe_payment_intent_id?: string | null
          position?: number | null
          created_at?: string
        }
      }
    }
  }
}