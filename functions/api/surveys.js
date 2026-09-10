// Cloudflare Pages Function cho GET /api/surveys và POST /api/surveys
const CLOUD_SYNC_URL = 'https://api.restful-api.dev/objects/ff808181a067127101a08a5a4dda6221';

async function getCloudSurveys(context) {
  if (context.env && context.env.SURVEYS_KV) {
    try {
      const data = await context.env.SURVEYS_KV.get('surveys');
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error('Lỗi Cloudflare KV:', e);
    }
  }

  try {
    const res = await fetch(CLOUD_SYNC_URL);
    if (res.ok) {
      const json = await res.json();
      if (json.data && Array.isArray(json.data.surveys)) {
        return json.data.surveys;
      }
    }
  } catch (e) {
    console.warn('Lỗi đọc Cloud Sync:', e);
  }

  return [];
}

async function saveCloudSurveys(context, surveys) {
  if (context.env && context.env.SURVEYS_KV) {
    try {
      await context.env.SURVEYS_KV.put('surveys', JSON.stringify(surveys));
    } catch (e) {
      console.error('Lỗi lưu Cloudflare KV:', e);
    }
  }

  try {
    await fetch(CLOUD_SYNC_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'VKU Field Surveys', data: { surveys } })
    });
  } catch (e) {
    console.warn('Lỗi ghi Cloud Sync:', e);
  }
}

export async function onRequestGet(context) {
  const surveys = await getCloudSurveys(context);
  return new Response(JSON.stringify({ success: true, surveys }), {
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

    let existingSurveys = await getCloudSurveys(context);
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

    await saveCloudSurveys(context, mergedSurveys);

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
