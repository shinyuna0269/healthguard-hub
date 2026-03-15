// HSM Supabase client — used for all staff auth and HSM data (permits, inspections, etc.)
// Import like this: import { supabase } from "@/integrations/supabase/client";
import { hsmSupabase } from "@/lib/hsmSupabase";
import type { Database } from "./types";

export const supabase = hsmSupabase;
export type { Database };
