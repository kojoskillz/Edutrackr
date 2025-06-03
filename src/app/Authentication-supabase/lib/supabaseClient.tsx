// lib/supabaseClient.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://jhmmtqlwczucigkxbrtw.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpobW10cWx3Y3p1Y2lna3hicnR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4NjI3NTAsImV4cCI6MjA2NDQzODc1MH0.6ERjS-dMmD-KWLwQpQfcScPiMVkCpWI-Y1d3VH41mvw'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
