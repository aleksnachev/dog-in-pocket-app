// AI сървър за „Кучето в джоба“ (Cloudflare Worker).
// Приема въпрос + обобщен профил + откъси от ПРОВЕРЕНАТА база на приложението
// и връща отговор, базиран САМО на тези откъси. Не поставя диагнози и не дава дози.
//
// Променливи (wrangler secrets / vars):
//   ANTHROPIC_API_KEY  – секрет (wrangler secret put ANTHROPIC_API_KEY)
//   ACCESS_CODES       – секрет: кодове за достъп, разделени със запетая (напр. по един на купувач)
//   MODEL              – по избор; по подразбиране claude-opus-5-5
//   DAILY_LIMIT        – по избор; въпроси на код на ден (по подразбиране 30)
//   ALLOWED_ORIGIN     – по избор; домейнът на приложението за CORS (по подразбиране *)
// KV binding (по избор): USAGE – за дневния лимит.
import Anthropic from '@anthropic-ai/sdk';

const SYSTEM = `Ти си помощникът в приложението „Кучето в джоба“ за собственици на кучета в България. Отговаряш на български, кратко, топло и ясно.

ПРАВИЛА (задължителни):
1. Използвай САМО информацията от блока <context>. Не добавяй факти, числа, дози или препоръки, които ги няма там. Ако контекстът не отговаря на въпроса, кажи честно, че нямаш проверена информация по темата, и препоръчай ветеринар.
2. Не поставяй диагнози. Не препоръчвай лекарства, дози или домашно предизвикване на повръщане.
3. Ако въпросът описва възможна спешност (отравяне, затруднено дишане, гърч, колапс, подут корем с напъване за повръщане, силно кървене, не може да уринира, топлинен удар, травма) или в контекста темата е със спешност „now“ – постави urgent=true и започни отговора с ясен съвет да се свърже веднага с ветеринар.
4. Съобрази отговора с профила на кучето (<profile>): възраст/етап, тегло, алергии, заболявания. Ако профилът има заболяване или специална диета, напомни храненето да се съгласува с ветеринаря.
5. В citations върни id-тата на откъсите от контекста, които си използвал (напр. "food:apple", "sos:vomiting").
6. Отговорът да е до около 120 думи, без markdown заглавия; може кратки изречения на нови редове.`;

const SCHEMA = {
  type: 'object',
  properties: {
    answer: { type: 'string' },
    citations: { type: 'array', items: { type: 'string' } },
    urgent: { type: 'boolean' },
  },
  required: ['answer', 'citations', 'urgent'],
  additionalProperties: false,
};

const json = (body, status, env) => new Response(JSON.stringify(body), {
  status,
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || '*', 'Access-Control-Allow-Headers': 'Content-Type, X-Access-Code', 'Access-Control-Allow-Methods': 'POST, OPTIONS' },
});

async function checkLimit(env, code) {
  if (!env.USAGE) return true;
  const key = `${new Date().toISOString().slice(0, 10)}:${code}`;
  const used = Number(await env.USAGE.get(key)) || 0;
  if (used >= (Number(env.DAILY_LIMIT) || 30)) return false;
  await env.USAGE.put(key, String(used + 1), { expirationTtl: 60 * 60 * 26 });
  return true;
}

export function buildRequest(env, body) {
  const ctx = (Array.isArray(body.context) ? body.context : []).slice(0, 8).map((c) => ({
    id: String(c.id || '').slice(0, 60), title: String(c.title || '').slice(0, 120), text: String(c.text || '').slice(0, 2500),
  }));
  const user = `<profile>${JSON.stringify(body.profile || {})}</profile>\n<context>${JSON.stringify(ctx)}</context>\n<question>${String(body.question || '').slice(0, 600)}</question>`;
  return {
    model: env.MODEL || 'claude-opus-5-5',
    max_tokens: 2000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    cache_control: { type: 'ephemeral' },
    system: SYSTEM,
    output_config: { effort: 'low', format: { type: 'json_schema', schema: SCHEMA } },
    messages: [{ role: 'user', content: user }],
  };
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return json({}, 204, env);
    if (request.method !== 'POST') return json({ error: 'method' }, 405, env);
    const code = request.headers.get('X-Access-Code') || '';
    const codes = String(env.ACCESS_CODES || '').split(',').map((s) => s.trim()).filter(Boolean);
    if (!codes.includes(code)) return json({ error: 'unauthorized' }, 401, env);
    if (!(await checkLimit(env, code))) return json({ error: 'limit' }, 429, env);

    let body;
    try { body = await request.json(); } catch { return json({ error: 'bad json' }, 400, env); }
    if (!body?.question) return json({ error: 'no question' }, 400, env);

    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
    try {
      const res = await client.beta.messages.create(buildRequest(env, body));
      if (res.stop_reason === 'refusal') return json({ answer: 'Не мога да отговоря на този въпрос. Ако се притеснявате за кучето, свържете се с ветеринар.', citations: [], sources: [], urgent: false }, 200, env);
      const text = res.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
      const out = JSON.parse(text);
      const allowed = new Set((body.context || []).map((c) => c.id));
      const citations = (out.citations || []).filter((id) => allowed.has(id));
      // източници от използваните откъси – клиентът ги показва като връзки
      const sources = [...new Set((body.context || []).filter((c) => citations.includes(c.id)).flatMap((c) => c.src || []))];
      return json({ answer: out.answer, citations, sources, urgent: Boolean(out.urgent) }, 200, env);
    } catch (err) {
      if (err instanceof Anthropic.RateLimitError) return json({ error: 'busy' }, 503, env);
      if (err instanceof Anthropic.APIError) return json({ error: 'upstream', status: err.status }, 502, env);
      return json({ error: 'server' }, 500, env);
    }
  },
};
