const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Cache-Control': 'no-store',
};
function reply(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...cors, 'Content-Type': 'application/json' },
  });
}
function validSource(value: unknown): URL | null {
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === 'epreuves.fff.fr' &&
      !url.port && !url.username && !url.password && !url.search && !url.hash &&
      /^\/competition\/(club|engagement|championnat)\/[A-Za-z0-9_/-]+$/.test(url.pathname)
      ? url : null;
  } catch { return null; }
}
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  if (req.method !== 'POST') return reply({ code: 'method_not_allowed' }, 405);
  const reference = crypto.randomUUID();
  let stage = 'configuration';
  const fail = (code: string, status = 502, upstreamStatus?: number) => {
    console.error('FFF :', JSON.stringify({ reference, stage, code, upstreamStatus }));
    return reply({ code, reference, stage, upstreamStatus }, status);
  };
  // Shared deadline includes redirects and reading the body, below the site's 20s timeout.
  const deadline = AbortSignal.timeout(18000);
  try {
    const base = Deno.env.get('SUPABASE_URL');
    const key = Deno.env.get('SUPABASE_ANON_KEY');
    if (!base || !key) return fail('configuration_missing', 500);
    const auth = req.headers.get('Authorization') || '';
    if (!auth.startsWith('Bearer ')) return fail('unauthorized', 401);
    stage = 'authentification';
    const user = await fetch(base + '/auth/v1/user', {
      headers: { Authorization: auth, apikey: key },
      signal: AbortSignal.any([deadline, AbortSignal.timeout(5000)]),
    });
    await user.body?.cancel();
    if (!user.ok) return fail('auth_service_unavailable', user.status >= 500 ? 503 : 401);
    stage = 'demande';
    const raw = await req.text();
    if (raw.length > 4000) return fail('invalid_request', 400);
    let input;
    try { input = JSON.parse(raw); } catch { return fail('invalid_json', 400); }
    const source = validSource(input?.sourceURL);
    if (!source) return fail('invalid_source', 400);
    stage = 'connexion_fff';
    let current = source;
    let upstream: Response | null = null;
    for (let redirects = 0; redirects <= 3; redirects++) {
      const response = await fetch(current.href, {
        redirect: 'manual',
        headers: { Accept: 'text/html, application/xhtml+xml', 'Accept-Language': 'fr-FR,fr;q=0.9', 'Cache-Control': 'no-cache' },
        signal: AbortSignal.any([deadline, AbortSignal.timeout(12000)]),
      });
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get('Location');
        await response.body?.cancel();
        if (redirects === 3) return fail('fff_too_many_redirects');
        let next: URL | null = null;
        try { next = location ? validSource(new URL(location, current).href) : null; } catch { /* invalid redirect */ }
        if (!next) return fail('fff_redirect_not_allowed');
        current = next;
        continue;
      }
      upstream = response;
      break;
    }
    if (!upstream) return fail('fff_unavailable');
    if (!upstream.ok) {
      await upstream.body?.cancel();
      return fail('fff_http_error', 502, upstream.status);
    }
    stage = 'lecture_fff';
    const reader = upstream.body?.getReader();
    if (!reader) return fail('fff_empty_response');
    const chunks: Uint8Array[] = [];
    let size = 0;
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        size += value.length;
        if (size > 4000000) { await reader.cancel(); return fail('fff_page_too_large'); }
        chunks.push(value);
      }
    } finally { reader.releaseLock(); }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
    const html = new TextDecoder().decode(bytes);
    if (!html.trim()) return fail('fff_empty_response');
    console.info('FFF :', JSON.stringify({ reference, stage: 'page_recue', bytes: size, table: /<table[\s>]/i.test(html) }));
    return reply({ sourceURL: source.href, html, fetchedAt: new Date().toISOString(), reference });
  } catch (error) {
    const name = error instanceof Error ? error.name : '';
    return fail(name === 'TimeoutError' || name === 'AbortError' ? 'fff_timeout' : 'fff_network_error');
  }
});
