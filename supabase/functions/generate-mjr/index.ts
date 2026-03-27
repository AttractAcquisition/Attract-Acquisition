import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ─── CORS ─────────────────────────────────────────────────────────────────────
// 'authorization' and 'apikey' must be listed here for JWT enforcement to work.
// The Supabase client sends both; the preflight (OPTIONS) request negotiates them.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const ALLOWED_ROLES = ['admin', 'distribution', 'delivery']

// ─── Handler ──────────────────────────────────────────────────────────────────
Deno.serve(async (req) => {

  // Preflight — must return 200 with CORS headers before any JWT check
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {

    // 1. Require Authorization header ─────────────────────────────────────────
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing Authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // 2. Verify JWT via Supabase Auth ──────────────────────────────────────────
    // We create a client scoped to this user's token so getUser() validates it
    // against Supabase Auth without needing the service-role key.
    const supabaseUrl  = Deno.env.get('SUPABASE_URL')!
    const supabaseAnon = Deno.env.get('SUPABASE_ANON_KEY')!

    const userClient = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: authHeader } },
      auth:   { persistSession: false },
    })

    const { data: { user }, error: authError } = await userClient.auth.getUser()

    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // 3. Role guard ────────────────────────────────────────────────────────────
    const role = user.user_metadata?.role as string | undefined

    if (!role || !ALLOWED_ROLES.includes(role)) {
      return new Response(
        JSON.stringify({ success: false, error: `Access denied — role '${role ?? 'none'}' is not permitted to generate MJRs` }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // 4. Parse request body ────────────────────────────────────────────────────
    const body = await req.json()
    const prospect = body?.prospect

    if (!prospect?.business_name) {
      return new Response(
        JSON.stringify({ success: false, error: '`prospect` with `business_name` is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // 5. Generate MJR via Anthropic ───────────────────────────────────────────
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!anthropicKey) throw new Error('ANTHROPIC_API_KEY secret is not set in Supabase')

    const systemPrompt = `You are a senior marketing analyst for Attract Acquisition.
You generate Missed Jobs Reports (MJRs) — persuasive, data-driven HTML reports that show local service businesses exactly how many leads and how much revenue they are missing each month due to gaps in their digital presence.
Always output a single complete HTML document with inline CSS. Use a dark professional theme (#07100E background, #00C9A7 accent).
The report must include: a cover with the missed revenue headline, 5 sections (local demand, competitor landscape, pipeline gap audit, missed revenue calc, action plan), and a Sprint CTA at the end.
Return a JSON object with two keys: "html" (the full HTML string) and "preview_stats" (an object with: business_name, sector, geography, job_value_range, annual_ltv, estimated_missed, google_reviews, has_instagram, running_ads).`

    const userPrompt = `Generate a complete MJR for this prospect:
Business: ${prospect.business_name}
Vertical: ${prospect.vertical || 'Unknown'}
Suburb / City: ${prospect.suburb || 'Cape Town'}
Google Reviews: ${prospect.google_review_count ?? 'Unknown'} reviews · ${prospect.google_rating ?? '?'}★
Instagram: ${prospect.instagram_handle ? `@${prospect.instagram_handle} (${prospect.instagram_followers ?? 0} followers)` : 'None'}
Meta Ads Running: ${prospect.has_meta_ads ? 'Yes' : 'No'}
Last Instagram Post: ${prospect.instagram_last_post_date ?? 'Unknown'}
ICP Tier: ${prospect.icp_tier ?? 'Unscored'} · Score: ${prospect.icp_total_score ?? 0}/25
Analyst notes / USP: ${prospect.mjr_notes ?? 'None provided'}

Respond ONLY with valid JSON matching the schema described in the system prompt.`

    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key':         anthropicKey,
        'anthropic-version': '2023-06-01',
        'Content-Type':      'application/json',
      },
      body: JSON.stringify({
        model:      'claude-opus-4-6',
        max_tokens: 8192,
        system:     systemPrompt,
        messages:   [{ role: 'user', content: userPrompt }],
      }),
    })

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text()
      throw new Error(`Anthropic API error ${anthropicRes.status}: ${errText}`)
    }

    const anthropicData = await anthropicRes.json()
    const rawText = anthropicData.content?.[0]?.text ?? ''

    // Strip markdown code fences if Claude wrapped the JSON
    const jsonText = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim()
    const result = JSON.parse(jsonText) as { html: string; preview_stats: Record<string, unknown> }

    if (!result.html) throw new Error('Anthropic returned a response without an html field')

    return new Response(
      JSON.stringify({ success: true, html: result.html, preview_stats: result.preview_stats }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[generate-mjr]', message)
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
