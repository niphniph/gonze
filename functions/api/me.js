import { onRequest as meHandler } from './auth/me.js';

export async function onRequest(context) {
  return meHandler(context);
}
