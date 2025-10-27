import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { UnauthorizedError, ForbiddenError } from './errorHandler';
import User from '../models/User';

export interface AuthRequest extends Request {
  user?: User;
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate('jwt', { session: false }, (_err: Error, user: User) => {
    if (_err) {
      return next(_err);
    }

    if (!user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    (req as AuthRequest).user = user;
    next();
  })(req, res, next);
};

export const authorize = (...roles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const user = (req as AuthRequest).user;

    if (!user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    if (roles.length && !roles.includes(user.role)) {
      return next(
        new ForbiddenError('You do not have permission to access this resource')
      );
    }

    next();
  };
};

export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate('jwt', { session: false }, (_err: Error, user: User) => {
    if (user) {
      (req as AuthRequest).user = user;
    }
    next();
  })(req, res, next);
};

// SSE authentication middleware - accepts token from query params or headers
export const authenticateSSE = (req: Request, res: Response, next: NextFunction) => {
  // Check if token is in query params (for SSE/EventSource which can't set headers)
  const tokenFromQuery = req.query.token as string;

  if (tokenFromQuery) {
    // Temporarily set Authorization header for passport
    req.headers.authorization = `Bearer ${tokenFromQuery}`;
  }

  // Use standard passport authentication
  passport.authenticate('jwt', { session: false }, (_err: Error, user: User) => {
    if (_err) {
      return next(_err);
    }

    if (!user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    (req as AuthRequest).user = user;
    next();
  })(req, res, next);
};
