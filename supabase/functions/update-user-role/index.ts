import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

Deno.serve(async (req) => {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error: userError } = await supabase.auth.getUser(token)
  if (userError || !user) {
    return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401 })
  }

  const callerRole = user.user_metadata?.role
  if (callerRole !== 'admin') {
    return new Response(JSON.stringify({ error: 'Forbidden: admin only' }), { status: 403 })
  }

  const { userId, role, metadata_id } = await req.json()
  if (!userId || !role) {
    return new Response(JSON.stringify({ error: 'userId and role are required' }), { status: 400 })
  }

  const { error } = await supabase.auth.admin.updateUserById(userId, {
    user_metadata: { role, metadata_id: metadata_id ?? null }
  })

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 })
  }
  return new Response(JSON.stringify({ success: true }), { status: 200 })
})
