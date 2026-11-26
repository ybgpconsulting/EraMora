import type { SessionPayload } from './db';
import { getDb } from './db';
import type { Env } from './env';

export class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}

export interface RequestContext {
  req: Request;
  env: Env;
  url: URL;
  params: Record<string, string>;
  query: Record<string, string>;
  body: any;
  rawBody: string;
  session: SessionPayload | null;
  ip: string;
  header(name: string): string | undefined;
}

type MaybePromise<T> = T | Promise<T>;
export type Handler = (req: RequestContext, res: HttpResponse) => MaybePromise<unknown>;
export type Middleware = (req: RequestContext, res: HttpResponse) => MaybePromise<boolean | void>;
export type RouteStep = Middleware | Handler;

interface CookieOptions {
  httpOnly?: boolean;
  sameSite?: 'lax' | 'strict' | 'none';
  secure?: boolean;
  maxAge?: number;
  path?: string;
}

/** Minimal response accumulator with status/json/send/cookie helpers. */
export class HttpResponse {
  statusCode = 200;
  headers = new Headers();
  body: BodyInit | null = null;

  status(code: number): this {
    this.statusCode = code;
    return this;
  }

  header(name: string, value: string): this {
    this.headers.set(name, value);
    return this;
  }

  setHeader(name: string, value: string): this {
    return this.header(name, value);
  }

  json(payload: unknown): this {
    this.headers.set('content-type', 'application/json; charset=utf-8');
    this.body = JSON.stringify(payload);
    return this;
  }

  send(payload: string | ArrayBuffer | Uint8Array): this {
    this.body = payload as BodyInit;
    return this;
  }

  cookie(name: string, value: string, options: CookieOptions = {}): this {
    let cookie = `${name}=${encodeURIComponent(value)}; Path=${options.path || '/'}`;
    if (options.maxAge !== undefined) {
      cookie += `; Max-Age=${Math.max(0, Math.floor(options.maxAge / 1000))}`;
    }
    if (options.httpOnly) cookie += '; HttpOnly';
    if (options.secure) cookie += '; Secure';
    if (options.sameSite) cookie += `; SameSite=${options.sameSite}`;
    this.headers.append('set-cookie', cookie);
    return this;
  }

  clearCookie(name: string, secure = false): this {
    const cookie = `${name}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${secure ? '; Secure' : ''}`;
    this.headers.append('set-cookie', cookie);
    return this;
  }

  toResponse(): Response {
    const body = this.statusCode === 204 || this.statusCode === 304 ? null : this.body;
    return new Response(body, { status: this.statusCode, headers: this.headers });
  }
}

interface Route {
  method: string;
  regex: RegExp;
  keys: string[];
  steps: RouteStep[];
}

export interface RouteMatch {
  params: Record<string, string>;
  steps: RouteStep[];
}

export class Router {
  private routes: Route[] = [];

  add(method: string, path: string, ...steps: RouteStep[]): this {
    const keys: string[] = [];
    const pattern = path
      .split('/')
      .map((segment) => {
        if (segment.startsWith(':')) {
          keys.push(segment.slice(1));
          return '([^/]+)';
        }
        return segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      })
      .join('/');
    this.routes.push({
      method: method.toUpperCase(),
      regex: new RegExp(`^${pattern}/?$`),
      keys,
      steps,
    });
    return this;
  }

  get(path: string, ...steps: RouteStep[]): this {
    return this.add('GET', path, ...steps);
  }

  post(path: string, ...steps: RouteStep[]): this {
    return this.add('POST', path, ...steps);
  }

  put(path: string, ...steps: RouteStep[]): this {
    return this.add('PUT', path, ...steps);
  }

  patch(path: string, ...steps: RouteStep[]): this {
    return this.add('PATCH', path, ...steps);
  }

  delete(path: string, ...steps: RouteStep[]): this {
    return this.add('DELETE', path, ...steps);
  }

  match(method: string, pathname: string): RouteMatch | null {
    for (const route of this.routes) {
      if (route.method !== method.toUpperCase()) continue;
      const result = route.regex.exec(pathname);
      if (!result) continue;
      const params: Record<string, string> = {};
      route.keys.forEach((key, index) => {
        params[key] = decodeURIComponent(result[index + 1] || '');
      });
      return { params, steps: route.steps };
    }
    return null;
  }
}

let rateLimitCleanupCount = 0;

/** D1-backed fixed-window limiter shared across Worker isolates. */
export function rateLimit(maxRequests: number, windowMs: number): Middleware {
  return async (req, res) => {
    const now = Date.now();
    const fingerprint = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(`${req.ip}:${req.req.method}:${req.url.pathname}`)
    );
    const key = Array.from(new Uint8Array(fingerprint), (byte) => byte.toString(16).padStart(2, '0')).join('');
    const entry = await req.env.DB.prepare(
      `INSERT INTO rate_limits (key, count, reset_at) VALUES (?, 1, ?)
       ON CONFLICT(key) DO UPDATE SET
         count = CASE WHEN rate_limits.reset_at <= ? THEN 1 ELSE rate_limits.count + 1 END,
         reset_at = CASE WHEN rate_limits.reset_at <= ? THEN excluded.reset_at ELSE rate_limits.reset_at END
       RETURNING count, reset_at`
    )
      .bind(key, now + windowMs, now, now)
      .first<{ count: number; reset_at: number }>();
    if (!entry) throw new Error('Rate limit could not be recorded.');

    rateLimitCleanupCount += 1;
    if (rateLimitCleanupCount >= 100) {
      rateLimitCleanupCount = 0;
      await req.env.DB.prepare('DELETE FROM rate_limits WHERE reset_at <= ?').bind(now).run();
    }

    if (entry.count > maxRequests) {
      res.status(429).json({ error: 'Too many requests. Please wait a moment and try again.' });
      return false;
    }

    return true;
  };
}

export const requireAdmin: Middleware = (req, res) => {
  if (!req.session || req.session.role !== 'admin') {
    res.status(403).json({ error: 'Administrator access required.' });
    return false;
  }
  const user = getDb().users.find((candidate) => candidate.id === req.session?.userId);
  if (!user || user.role !== 'admin') {
    res.status(403).json({ error: 'Administrator access required.' });
    return false;
  }
  return true;
};

export function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  const map: Record<string, string> = {};
  if (!cookieHeader) return map;
  for (const part of cookieHeader.split(';')) {
    const index = part.indexOf('=');
    if (index > 0) {
      const key = part.slice(0, index).trim();
      const value = decodeURIComponent(part.slice(index + 1).trim());
      map[key] = value;
    }
  }
  return map;
}

/** Adds conservative security headers to every response the Worker returns. */
export function isSameOriginMutation(request: Request, url: URL): boolean {
  if (request.method === 'GET' || request.method === 'HEAD' || request.method === 'OPTIONS') return true;
  if (request.headers.get('sec-fetch-site')?.toLowerCase() === 'cross-site') return false;

  const origin = request.headers.get('origin');
  if (!origin) return true;

  try {
    return new URL(origin).origin === url.origin;
  } catch {
    return false;
  }
}

export function withSecurityHeaders(response: Response, secure = false): Response {
  const headers = new Headers(response.headers);
  headers.set('x-content-type-options', 'nosniff');
  headers.set('referrer-policy', 'strict-origin-when-cross-origin');
  headers.set('x-frame-options', 'DENY');
  headers.set('x-permitted-cross-domain-policies', 'none');
  headers.set('permissions-policy', 'camera=(), microphone=(), geolocation=()');
  if (secure) headers.set('strict-transport-security', 'max-age=31536000');
  return new Response(response.body, { status: response.status, headers });
}
