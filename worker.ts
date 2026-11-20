import { handleRequest } from './server/app';
import type { Env } from './server/env';

/**
 * Cloudflare Workers entry point. Static assets are served through the ASSETS
 * binding; every API route, /uploads media and /sitemap.xml is handled here.
 */
export default {
  fetch(request: Request, env: Env): Promise<Response> {
    return handleRequest(request, env);
  },
};
