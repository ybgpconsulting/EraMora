import { handleRequest } from './server/app';
import type { Env } from './server/env';
import { withSecurityHeaders } from './server/http';
import { isScannerProbePath } from './server/scanner-guard';

/**
 * Cloudflare Workers entry point. Static assets are served through the ASSETS
 * binding; every API route, /uploads media and /sitemap.xml is handled here.
 */
export default {
  fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (isScannerProbePath(url.pathname)) {
      return Promise.resolve(
        withSecurityHeaders(
          new Response('Not Found', {
            status: 404,
            headers: { 'cache-control': 'no-store' },
          }),
          url.protocol === 'https:'
        )
      );
    }
    return handleRequest(request, env);
  },
};
