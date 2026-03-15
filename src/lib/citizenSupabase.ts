/**
 * Citizen Information & Engagement Supabase client.
 * Used ONLY for citizen authentication and fetching citizen profile data.
 * Do not write to this database from HSM — read-only for citizen identity.
 */
import { createClient } from "@supabase/supabase-js";

const CITIZEN_URL = import.meta.env.VITE_CITIZEN_SUPABASE_URL;
const CITIZEN_KEY = import.meta.env.VITE_CITIZEN_SUPABASE_KEY;

export const citizenSupabase = createClient(CITIZEN_URL, CITIZEN_KEY, {
  auth: {
    storage: localStorage,
    storageKey: "sb-citizen-auth",
    persistSession: true,
    autoRefreshToken: true,
  },
});
