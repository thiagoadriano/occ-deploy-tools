const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, printf } = format;

let configs = require('./../constants/configs');

let loggerDeploy = createLogger({
  level: 'info',
  transports: [
    new transports.File({ filename: `${configs.FOLDERS.LOGS}report-deploy-${configs.EXEC_DATE_TIME.VIEWER}.log`})
  ]
}); 

module.exports = {loggerDeploy};
