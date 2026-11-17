import { IncomingMessage, ServerResponse } from 'http';
import { Socket } from 'net';
import app from '../../server/index.js';

export interface TestResponse {
  status: number;
  headers: Record<string, any>;
  body: any;
  rawBody: string;
  cookies: Record<string, string>;
}

export function request(options: {
  method?: string;
  url: string;
  headers?: Record<string, string>;
  body?: any;
  cookies?: Record<string, string>;
}): Promise<TestResponse> {
  return new Promise((resolve) => {
    const socket = new Socket();
    Object.defineProperty(socket, 'remoteAddress', { value: '127.0.0.1' });

    const req = new IncomingMessage(socket);
    req.method = options.method || 'GET';
    req.url = options.url;

    // Normalizing headers to lowercase as done natively by Node.js HTTP parser
    const normalizedHeaders: Record<string, string> = {
      host: 'localhost',
      'content-type': 'application/json',
      'x-requested-with': 'XMLHttpRequest',
    };

    if (options.headers) {
      for (const [key, value] of Object.entries(options.headers)) {
        normalizedHeaders[key.toLowerCase()] = value;
      }
    }

    if (options.cookies) {
      const cookieStr = Object.entries(options.cookies)
        .map(([k, v]) => `${k}=${v}`)
        .join('; ');
      normalizedHeaders['cookie'] = cookieStr;
    }

    req.headers = normalizedHeaders;

    const res = new ServerResponse(req);
    let rawBody = '';

    const origWrite = res.write;
    const origEnd = res.end;

    res.write = function (chunk: any, ...args: any[]) {
      if (chunk) rawBody += chunk.toString();
      return origWrite.apply(res, [chunk, ...args]);
    } as any;

    res.end = function (chunk: any, ...args: any[]) {
      if (chunk) rawBody += chunk.toString();
      const status = res.statusCode;
      const headers = res.getHeaders();
      let parsedBody: any;
      try {
        parsedBody = JSON.parse(rawBody);
      } catch {
        parsedBody = rawBody;
      }

      const cookies: Record<string, string> = {};
      const setCookie = headers['set-cookie'];
      if (Array.isArray(setCookie)) {
        for (const c of setCookie) {
          const [pair] = c.split(';');
          const [k, v] = pair.split('=');
          if (k && v) cookies[k.trim()] = v.trim();
        }
      } else if (typeof setCookie === 'string') {
        const [pair] = setCookie.split(';');
        const [k, v] = pair.split('=');
        if (k && v) cookies[k.trim()] = v.trim();
      }

      resolve({ status, headers, body: parsedBody, rawBody, cookies });
      return origEnd.apply(res, [chunk, ...args]);
    } as any;

    if (options.body) {
      const payload = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
      req.headers['content-length'] = String(Buffer.byteLength(payload));
      app(req as any, res as any);
      req.push(payload);
      req.push(null);
    } else {
      app(req as any, res as any);
      req.push(null);
    }
  });
}
