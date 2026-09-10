// Cloudflare Pages Function cho GET /api/surveys và POST /api/surveys

export async function onRequestGet(context) {
  if (context.env && context.env.SURVEYS_KV) {
    try {
      const data = await context.env.SURVEYS_KV.get('surveys');
      const surveys = data ? JSON.parse(data) : [];
      return new Response(JSON.stringify({ success: true, surveys }), {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*'
        }
      });
    } catch (e) {
      console.error('Lỗi KV:', e);
    }
  }

  return new Response(JSON.stringify({ success: true, surveys: [] }), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

export async function onRequestPost(context) {
  try {
    const payload = await context.request.json();
    const incomingSurveys = Array.isArray(payload) ? payload : (payload.surveys || []);

    let existingSurveys = [];
    if (context.env && context.env.SURVEYS_KV) {
      const data = await context.env.SURVEYS_KV.get('surveys');
      if (data) existingSurveys = JSON.parse(data);
    }

    const existingMap = new Map(existingSurveys.map(item => [item.id, item]));
    let syncedCount = 0;

    incomingSurveys.forEach(item => {
      if (!item.id) return;
      const updatedItem = { ...item, status: 'SYNCED' };
      if (!existingMap.has(item.id) || existingMap.get(item.id).status !== 'SYNCED') {
        existingMap.set(item.id, updatedItem);
        syncedCount++;
      }
    });

    const mergedSurveys = Array.from(existingMap.values());
    mergedSurveys.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    if (context.env && context.env.SURVEYS_KV) {
      await context.env.SURVEYS_KV.put('surveys', JSON.stringify(mergedSurveys));
    }

    return new Response(JSON.stringify({ success: true, syncedCount, surveys: mergedSurveys }), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
