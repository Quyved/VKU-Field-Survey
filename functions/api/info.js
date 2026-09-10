// Cloudflare Pages Function cho GET /api/info

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  return new Response(JSON.stringify({
    success: true,
    lanIp: url.hostname,
    port: url.port || (url.protocol === 'https:' ? '443' : '80'),
    url: url.origin
  }), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
