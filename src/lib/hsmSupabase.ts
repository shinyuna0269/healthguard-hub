/**
 * Health & Sanitation Management (HSM) Supabase client.
 * Used for Admin, Staff, Inspectors login and all HSM subsystem data
 * (permits, inspections, health records, vaccination, etc.).
 */
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const HSM_URL = import.meta.env.VITE_HSM_SUPABASE_URL;
const HSM_KEY = import.meta.env.VITE_HSM_SUPABASE_KEY;

export const hsmSupabase = createClient<Database>(HSM_URL, HSM_KEY, {
  auth: {
    storage: localStorage,
    storageKey: "sb-hsm-auth",
    persistSession: true,
    autoRefreshToken: true,
  },
});
