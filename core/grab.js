const path = require('path'),
      fs = require('fs'),
      CREDENTIALS = require('./constants/credentials'),
      configs = require('./constants/configs');

let finishAMB = { };
let callBack = null;
let AMBS_EXEC = ['TEST', 'STAGE', 'PROD'];

function logStream(key, data) {
  console.log(`------------------------------------------------------- LOG STREAM ${key} ------------------------------------------------------
      Baixado do ambiente ${key}: 
      ${data.toString()}------------------------------------------------------------------------------------------------------------------------------`); 
}

function logError(key, data) {
  console.error(`=======================================================
  Erro no ambiente ${key}: 
  ${data.toString()}
=======================================================
`);
}

function logClose(key, code) {
  if (code) {
    console.log(`
=======================================================
    Erro no processamento no ambiente ${key} com code ${code}
=======================================================
    `); 
  } else {
  console.log(`
=======================================================
  Finalizado grab no ambiente ${key} 
=======================================================
`); 

    finishAMB[key] = true;
    execCallBack();
  }
}

function prepareLog(args, key) {
  let pathLog = path.normalize(`${consfigs.FOLDERS.LOGS}${configs.EXEC_DATE_TIME.DATE}`);
  try {
    fs.readdirSync(pathLog);
  } catch(e) {
    fs.mkdirSync(pathLog);
  }

  let log = path.normalize(`${pathLog}/log-${configs.EXEC_DATE_TIME.TIME}-ambiente-${key.toUpperCase()}.log`);
  args.push('>>', log);
  console.log(`Iniciado o Grab com log sendo gravado em: ${log}`);
}

function execCallBack() {
  let listAmb = Object.entries(finishAMB);
  let isNotFinish = listAmb.some(x => !x[1]);

  if(!isNotFinish && callBack) {
    callBack();
  }
}

function execGrab(grabIn, longInFile) {
  for(let key of grabIn) {
    let { exec } = require('child_process');
    let args = ['--node', CREDENTIALS[key].URL, '--applicationKey', CREDENTIALS[key].KEY, '-g'];

    if(longInFile) {
      prepareLog(args, key);
    }
    
    let comand = exec(`dcu ${args.join(' ')}`, { cwd: path.normalize(configs.FOLDERS[key]) });

    comand.stdout.on('data', logStream.bind(null, key));
    comand.stderr.on('data', logError.bind(null, key));
    comand.on('close', logClose.bind(null, key));
  }
}

function generateCheckSuccess(listAmbs) {
  for(let amb in listAmbs) {
    finishAMB[ listAmbs[amb] ] = false;
  }
}

function Main(cb) {
  callBack = cb;

  if (configs.ENV.AMB === 'PROD') {
    AMBS_EXEC = ['STAGE', 'PROD'];
  } else if(configs.ENV.AMB === 'STAGE') {
    AMBS_EXEC = ['TEST', 'STAGE'];
  } 

  generateCheckSuccess(AMBS_EXEC);
  execGrab(AMBS_EXEC, configs.ENV.USE_LOGS_IN_FILE);
}

module.exports = Main;



