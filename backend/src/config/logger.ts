import winston from 'winston';
import path from 'path';

const logLevel = process.env.LOG_LEVEL || 'debug';
const logFile = process.env.LOG_FILE || 'logs/app.log';

const logger = winston.createLogger({
  level: logLevel,
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'ialign-backend' },
  transports: [
    new winston.transports.File({
      filename: path.join(process.cwd(), logFile),
      level: 'error',
    }),
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs/combined.log'),
    }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    })
  );
}

export default logger;
