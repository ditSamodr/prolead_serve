// const winston = require('winston');
// const DailyRotateFile = require('winston-daily-rotate-file');
// const { combine , timestamp , printf , json } = winston.format;

// const logFormat = printf(({ level ,message ,timestamp, ...metadata})=>{
//     return `${timestamp} [${level.toUpperCase()}]: ${message} ${Object.keys(metadata).length ? JSON.stringify(metadata) : ''}`;
// });

// const logger = winston.createLogger({
//     level: 'info', // Set the minimum log level to capture
//     format: combine(
//         timestamp(),
//         logFormat
//     ),
//     transports: [
//         // Console transport for development
//         new winston.transports.Console({
//             format: winston.format.combine(
//                 winston.format.colorize(),
//                 logFormat
//             )
//         }),
//         // File transport for production-level logging
//         new DailyRotateFile({
//             filename: 'product-actions-%DATE%.log',
//             datePattern: 'YYYY-MM-DD',
//             zippedArchive: true,
//             maxSize: '20m', // Rotate files when they reach 20MB
//             maxFiles: '14d', // Keep logs for 14 days
//             format: combine(
//                 timestamp(),
//                 json() // Use JSON format for structured logging in files
//             )
//         }),
//     ],
// })

// module.exports= logger;