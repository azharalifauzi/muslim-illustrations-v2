import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  'https://ivuafhmjxtjjtgxlrjpd.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlhdCI6MTYzMDMwOTU0OSwiZXhwIjoxOTQ1ODg1NTQ5fQ.XczEyaWwXEHAGLMe23uLm0YIMUALoTjvddcIoL6RWfw'
);

export const supabaseServer = createClient(
  'https://ivuafhmjxtjjtgxlrjpd.supabase.co',
  process.env.SUPABASE_SECRET_API_KEY
);
