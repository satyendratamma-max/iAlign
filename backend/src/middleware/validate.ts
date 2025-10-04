import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { ValidationError } from './errorHandler';

export const validate = (req: Request, _res: Response, next: NextFunction) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorMessages = errors
      .array()
      .map((error) => `${error.type}: ${error.msg}`)
      .join(', ');

    return next(new ValidationError(errorMessages));
  }

  next();
};
