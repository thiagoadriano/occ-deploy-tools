let configs = {
  FOLDERS_SYSTEM: {},
  EXEC_DATE_TIME: {},
  FOLDERS: {},
  ENV: {}
};

const ROOT_BASE = 'c:/OCC_TESTE_DEPLOY/';

// used in search folders by call files
configs.FOLDERS.ROOT_FOLDER = ROOT_BASE;
configs.FOLDERS.GMUD = `${ROOT_BASE}GMUD/`;
configs.FOLDERS.GRAB = `${ROOT_BASE}grab/`;
configs.FOLDERS.LOGS = `${ROOT_BASE}logs/`;

// configuration folders use system
configs.FOLDERS.TEST = `${configs.FOLDERS.GRAB}test/`;
configs.FOLDERS.PROD = `${configs.FOLDERS.GRAB}prod/`;
configs.FOLDERS.STAGE = `${configs.FOLDERS.GRAB}stage/`;

// used in names and locales by moment execution
configs.EXEC_DATE_TIME.NOW =  '';
configs.EXEC_DATE_TIME.VIEWER =  '';
configs.EXEC_DATE_TIME.DATE =  '';
configs.EXEC_DATE_TIME.TIME =  '';

// used environments for flux process
configs.ENV.AMB = '';
configs.ENV.DEPLOY_TO = '';
configs.ENV.BACKUP_TO = '';
configs.ENV.DEPLOY_FROM = '';
configs.ENV.BACKUP_FROM = '';
configs.ENV.USE_LOGS_IN_FILE = false;

// name file with information to deploy
configs.NAME_FILE_PROPERTIES = 'files-to-deploy.md';

// name file with information to deploy
configs.NAME_FILE_DEPLOY_CONTROL = 'control-deploy.md';

module.exports = configs;
