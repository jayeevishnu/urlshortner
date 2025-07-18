const {winston , transports ,format , createLogger} = require('winston');

// const logFormat = winston.format.combine(
//   winston.format.timestamp(),
//   winston.format.errors({ stack: true }),
//   winston.format.json()
// );

// const logger = winston.createLogger({
//   level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
//   format: logFormat,
//   defaultMeta: { service: 'urlshortener-api' },
//   transports: [
    // new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    // new winston.transports.File({ filename: 'logs/combined.log' }),
//      new transports.Console(),
//   ],
// });
const logger = createLogger({
  level: 'silly',
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  transports: [
    new transports.Console()
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

module.exports = { logger }; 