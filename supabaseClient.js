import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://dlmxlkijjdqcdrvmuxgw.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsbXhsa2lqamRxY2Rydm11eGd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5NzQxNzQsImV4cCI6MjA3NDU1MDE3NH0.-PifIQXlBsWOrChgOGPXYZzf6oZxDspS_K2FStdy4oo";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);