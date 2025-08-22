import * as express from 'express';
import { Multer } from 'multer';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number;
        email: string;
        role: string;
        sessionId?: string;
      };
      files?: {
        [fieldname: string]: Multer.File[];
      } & {
        resume: Multer.File[];
        coverLetter?: Multer.File[];
      };
    }
  }
}

export = express;
export as namespace express;
