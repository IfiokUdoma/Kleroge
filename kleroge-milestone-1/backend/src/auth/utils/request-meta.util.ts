import { Request } from 'express';
import { RequestMeta } from '../auth.service';

export function extractRequestMeta(req: Request): RequestMeta {
  return {
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  };
}
