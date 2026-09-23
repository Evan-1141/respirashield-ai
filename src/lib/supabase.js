/**
 * RespiraShield AI — Supabase Client (Structure Only)
 * 
 * This file prepares the Supabase client structure.
 * NO active database connection is made.
 * 
 * To activate:
 * 1. Set NEXT_PUBLIC_SUPABASE_URL in .env.local
 * 2. Set NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local
 * 3. Uncomment the createClient call below
 *
 * Conceptual Database Schema:
 * 
 * users:
 *   - id (uuid, primary key)
 *   - name (text)
 *   - age (integer)
 *   - asthma_history (boolean)
 *   - smoking_status (text: 'never' | 'former' | 'active')
 *   - outdoor_exposure (float)
 *   - created_at (timestamptz)
 * 
 * air_quality:
 *   - id (uuid, primary key)
 *   - pm25 (float)
 *   - pm10 (float)
 *   - so2 (float)
 *   - no2 (float)
 *   - co (float)
 *   - o3 (float)
 *   - temperature (float)
 *   - humidity (float)
 *   - recorded_at (timestamptz)
 *   - device_id (text, references devices.id)
 * 
 * risk_predictions:
 *   - id (uuid, primary key)
 *   - user_id (uuid, references users.id)
 *   - air_quality_id (uuid, references air_quality.id)
 *   - risk_level (integer: 0 | 1 | 2)
 *   - prediction_score (float)
 *   - model_used (text)
 *   - created_at (timestamptz)
 * 
 * devices:
 *   - id (text, primary key)
 *   - device_name (text)
 *   - device_code (text)
 *   - status (text: 'online' | 'offline')
 *   - firmware_version (text)
 *   - last_seen (timestamptz)
 */

// import { createClient } from '@supabase/supabase-js';

// Uncomment when ready to connect:
// const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
// export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Placeholder export so imports don't break
export const supabase = null;
