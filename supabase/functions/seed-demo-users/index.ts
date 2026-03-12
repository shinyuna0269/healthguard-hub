import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const DEMO_USERS = [
  { email: 'resident@demo.com', password: 'demo123456', full_name: 'LeBron James', role: 'Citizen_User' },
  { email: 'bhw@demo.com', password: 'demo123456', full_name: 'Uncle Drew', role: 'BHW_User' },
  { email: 'bsi@demo.com', password: 'demo123456', full_name: 'Michael Jordan', role: 'BSI_User' },
  { email: 'clerk@demo.com', password: 'demo123456', full_name: 'Mama Coco', role: 'Clerk_User' },
  { email: 'captain@demo.com', password: 'demo123456', full_name: 'Mr. Long Bomb', role: 'Captain_User' },
  { email: 'lgu@demo.com', password: 'demo123456', full_name: 'QC LGU Admin', role: 'LGUAdmin_User' },
  { email: 'admin@demo.com', password: 'demo123456', full_name: 'Rasc Binuya', role: 'SysAdmin_User' },
]

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const results = []

    for (const user of DEMO_USERS) {
      // Check if user exists
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
      const existing = existingUsers?.users?.find(u => u.email === user.email)
      
      let userId: string

      if (existing) {
        userId = existing.id
        results.push({ email: user.email, status: 'already exists', userId })
      } else {
        const { data, error } = await supabaseAdmin.auth.admin.createUser({
          email: user.email,
          password: user.password,
          email_confirm: true,
          user_metadata: { full_name: user.full_name },
        })
        if (error) {
          results.push({ email: user.email, status: 'error', error: error.message })
          continue
        }
        userId = data.user.id
        results.push({ email: user.email, status: 'created', userId })
      }

      // Upsert role
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .upsert({ user_id: userId, role: user.role }, { onConflict: 'user_id,role' })
      
      if (roleError) {
        results.push({ email: user.email, roleError: roleError.message })
      }

      // Update profile name
      await supabaseAdmin
        .from('profiles')
        .update({ full_name: user.full_name })
        .eq('user_id', userId)
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
