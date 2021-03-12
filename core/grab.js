const path = require('path'),
      CREDENTIALS = require('./constants/credentials'),
      configs = require('./constants/configs'),
      {loggerGrabInstance} = require('./helper/logger'),
      {printInfo, printInfoAmb, printErrorAmb, printWarn} = require('./helper/print-console');

let finishAMB = { };
let callBack = null;
let logger = {};
let AMBS_EXEC = ['TEST', 'STAGE', 'PROD'];

function logStream(key, data) {
  printInfoAmb(key, data.toString());
  logger[key].info(data.toString());
}

function logError(key, data) {
  printErrorAmb(key, data);
  logger[key].error(data.toString());
}

function logClose(key, code) {
  if (code) {
    printWarn(`Foi finalizado o grab com erro no ambiente ${key} com code ${code}`);
  } else {
    printInfo(`Finalizado grab no ambiente ${key}`);
    finishAMB[key] = true;
    execCallBack();
  }
}

function execCallBack() {
  let listAmb = Object.entries(finishAMB);
  let isNotFinish = listAmb.some(x => !x[1]);

  if(!isNotFinish && callBack) {
    printInfo('Grab concluído!');
    callBack();
  }
}

function execGrab(grabIn) {
  for(let key of grabIn) {
    let { exec } = require('child_process');
    let args = ['--node', CREDENTIALS[key].URL, '--applicationKey', CREDENTIALS[key].KEY, '-g'];
    let comand = exec(`dcu ${args.join(' ')}`, { cwd: path.normalize(configs.FOLDERS[key]) });

    comand.stdout.on('data', logStream.bind(null, key));
    comand.stderr.on('data', logError.bind(null, key));
    comand.on('close', logClose.bind(null, key));
  }
}

function generateValuesEnviroments(listAmbs) {
  for(let amb of listAmbs) {
    finishAMB[amb] = false;
    logger[amb] = loggerGrabInstance(amb);
  }
}

function Main(cb) {
  callBack = cb;

  if (configs.ENV.AMB === 'PROD') {
    AMBS_EXEC = ['STAGE', 'PROD'];
  } else if(configs.ENV.AMB === 'STAGE') {
    AMBS_EXEC = ['TEST', 'STAGE'];
  } 

  generateValuesEnviroments(AMBS_EXEC);
  execGrab(AMBS_EXEC);
}

module.exports = Main;



