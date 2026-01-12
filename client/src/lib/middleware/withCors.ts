// @/lib/middlewares/withCors.ts
import type { NextApiHandler, NextApiRequest, NextApiResponse } from "next";

interface CorsOptions {
  origin?: string | string[] | boolean;
  methods?: string[];
  allowedHeaders?: string[];
  credentials?: boolean;
}

export function withCors(options: CorsOptions = {}) {
  const {
    origin = process.env.NODE_ENV === 'production' ? false : '*',
    methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders = ['Content-Type', 'Authorization'],
    credentials = true
  } = options;

  return function(handler: NextApiHandler): NextApiHandler {
    return async (req: NextApiRequest, res: NextApiResponse) => {
      // Set CORS headers
      if (origin) {
        if (typeof origin === 'string') {
          res.setHeader('Access-Control-Allow-Origin', origin);
        } else if (Array.isArray(origin)) {
          const requestOrigin = req.headers.origin;
          if (requestOrigin && origin.includes(requestOrigin)) {
            res.setHeader('Access-Control-Allow-Origin', requestOrigin);
          }
        } else if (origin === true) {
          res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
        }
      }

      res.setHeader('Access-Control-Allow-Methods', methods.join(', '));
      res.setHeader('Access-Control-Allow-Headers', allowedHeaders.join(', '));
      
      if (credentials) {
        res.setHeader('Access-Control-Allow-Credentials', 'true');
      }

      // Handle preflight requests
      if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
      }

      return handler(req, res);
    };
  };
}