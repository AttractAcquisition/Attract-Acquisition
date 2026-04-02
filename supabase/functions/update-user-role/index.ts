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

  // Build user_metadata patch.
  // - For 'client' role: client_id must be set so auth.tsx extractMetadataId() can read it
  //   (auth.tsx reads user_metadata.client_id for the client role, NOT user_metadata.metadata_id)
  // - For all other roles: clear client_id so stale values from a prior client role don't leak.
  //   Non-client metadata_id is derived from session.user.id in the frontend, so it is not
  //   stored in user_metadata — writing it here is only for human auditability.
  const userMetaPatch: Record<string, string | null> = {
    role,
    metadata_id: metadata_id ?? null,
    client_id: role === 'client' ? (metadata_id ?? null) : null,
  }

  const { error } = await supabase.auth.admin.updateUserById(userId, {
    user_metadata: userMetaPatch,
  })

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 })
  }
  return new Response(JSON.stringify({ success: true }), { status: 200 })
})
