const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, printf } = format;

let configs = require('./../constants/configs');

let loggerDeploy = createLogger({
  level: 'info',
  transports: [
    new transports.File({
      filename: `${configs.FOLDERS.LOGS}/${configs.EXEC_DATE_TIME.DATE}/report-deploy-${configs.EXEC_DATE_TIME.TIME}.log`
    })
  ]
});

let loggerGrabInstance = function(amb) {
  return createLogger({
    transports: [
      new transports.File({
        level: 'info',
        filename: `${configs.FOLDERS.LOGS}/${configs.EXEC_DATE_TIME.DATE}/report-grab-${amb}-${configs.EXEC_DATE_TIME.TIME}.log`
      }),
      new transports.File({
        level: 'error',
        filename: `${configs.FOLDERS.LOGS}/${configs.EXEC_DATE_TIME.DATE}/report-grab-${amb}-error-${configs.EXEC_DATE_TIME.TIME}.log`
      })
    ]
  });
};

module.exports = {loggerDeploy, loggerGrabInstance};
