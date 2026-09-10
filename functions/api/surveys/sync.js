// Cloudflare Pages Function cho POST /api/surveys/sync
import { onRequestPost as handlePost, onRequestOptions as handleOptions } from '../surveys.js';

export async function onRequestPost(context) {
  return handlePost(context);
}

export async function onRequestOptions() {
  return handleOptions();
}
