const fs = require('fs'),
      path = require('path'),
      { exec } = require('child_process'),
      CREDENTIALS = require('./constants/credentials'),
      configs = require('./constants/configs'),
      util = require('./helper/util'),
      { loggerDeploy } = require('./helper/logger'),
      {createWidget, existsWidget} = require('./create-widget'),
      {printStep, printInfo, printError} = require('./helper/print-console');

const STATUS = {
  NOT_STARTED: 0, 0: 'NOT_STARTED',
  STARTED: 1, 1: 'STARTED',
  IN_PROGRESS: 2, 2: 'IN_PROGRESS',
  SENT: 3, 3: 'SENT',
  FINISH: 4, 4: 'FINISH',
  ERROR: 5, 5: 'ERROR' 
};

let credentialUse = {};
let reportFiles = [];
let totalFiles = 0;

function deployFile(file) {
  let args = ['--node', credentialUse.URL,  '--applicationKey', credentialUse.KEY, '--transfer', `"${file}"`];
  let command = exec(`dcu ${args.join(' ')}`, {cwd: configs.ENV.DEPLOY_TO});

  setStatus(file, STATUS.STARTED);

  command.stdout.on('data', logStream.bind(null, file));
  command.stderr.on('data', logError.bind(null, file));
  command.on('close', logClose.bind(null, file));
}

function logStream(file, data) {
  printInfo('Fluxo de envio:', data.toString());
  loggerDeploy.info(`Fluxo de envio: ${data.toString()}`);

  if (data.includes('encontrado na interface de administração do Commerce Cloud de destino') && data.includes('A operação demorou')) {
    setStatus(file, STATUS.SENT);
  }
  else if (data.includes('Enviando')) {
    setStatus(file, STATUS.IN_PROGRESS);
  }
}

function logError(file, data) {
  let pathUnix = file.replace(/\\/g, '/');
  let msgInvalid = {
    FAIL_WIDE: 'A conexão foi redefinida inesperadamente pelo servidor',
    FAIL_INTERNALIZED: 'Invalid operation on a non-internationalized Widget'
  }
  data = data.toString().replace(/\r?\n$/, '');
  
  let dataError = data;
  
  if (data.startsWith('TypeError')) {
    let position = data.indexOf('\n');
    dataError = data.substring(0,position);
  } 
  else if (data.indexOf(pathUnix) > -1) {
    let position = data.indexOf(pathUnix) + 1;
    dataError = data.substring(position + pathUnix.length);
  }
  
  printError(`Erro ao enviar o arquivo: ${file} | ${dataError}`);
  loggerDeploy.error(`Erro ao enviar o arquivo: ${file} | ${data}`);

  if (
    !data.includes(msgError.FAIL_INTERNALIZED) &&
    !data.includes(msgError.FAIL_WIDE)
  ) {
    setStatus(file, STATUS.ERROR, dataError);
  }

}

function logClose(file, code) {
  let msg = `Processo finalizado para o arquivo ${file} com código ${code}`;
  printInfo(msg);
  loggerDeploy.info(msg);

  totalFiles++;

  if (code === 0) {
    setStatus(file, STATUS.FINISH);
  } else {
    setStatus(file, STATUS.ERROR);
  }

  populateDeployInfoFile();
}

function callbackPathFile(filePath) {
  if (!filePath) return;

  let file = path.normalize(filePath.replace(configs.ENV.DEPLOY_TO, ''));

  reportFiles.push({
    file: file,
    status: STATUS.NOT_STARTED,
    msg: ''
  });

  if (file.startsWith('widget') && !existsWidget(file)) {
    createWidget(file, credentialUse.URL, deployFile);
  } else {
    deployFile(file);
  }
}

function setStatus(file, status, dataFail) {
  for (let report of reportFiles) {
    if (report.file === file && report.status !== STATUS.ERROR) {
      report.status = status;

      if (dataFail) report.msg = dataFail;
    }
  }
}

function populateDeployInfoFile() {
  if (totalFiles === reportFiles.length) {
    printStep('Preparando arquivo do resultado de deploy...');
    try {
      let fileControl = path.normalize(`${configs.FOLDERS.ROOT_FOLDER}/${configs.NAME_FILE_DEPLOY_CONTROL}`),
          readFile = fs.readFileSync(fileControl),
          contentFile = readFile.toString(),
          listDeploy = {success: [], error: []};
      
      reportFiles.forEach(report => {
        let nameFile = report.file.replace(configs.ENV.DEPLOY_TO, '');
        if (report.status === STATUS.FINISH) {
          listDeploy.success.push(nameFile);
        } else if (report.status === STATUS.ERROR) {
          listDeploy.error.push({file: nameFile, msg: report.msg });
        }
      });

      contentFile += generateLogFile(listDeploy.success, listDeploy.error);
      fs.writeFileSync(fileControl, contentFile);

      printInfo('Deploy Concluído! E levou:');
      console.timeEnd('Operação de Deploy');
    } catch (err) {
      printError('Erro em atualizar o log de deploy', err);
      process.exit(1);
    }
  }
}

function generateLogFile(listSuccess, listError) {
  return `
  ----
  ## Deploy ${configs.EXEC_DATE_TIME.DATE.replace(/_/g, '/')} ${configs.EXEC_DATE_TIME.TIME.replace(/_/g, ':')}
  Foi enviado um total de **${listSuccess.length + listError.length}** arquivos para **${configs.ENV.AMB}**.
  > Arquivos enviados com sucesso:
  * ${listSuccess.join(`
  * `)}
  > Arquivos com falha no envio:
  ${listError.reduce((amount, item) => amount += `* ${item.file} *(${item.msg})*
  `, '')}
  
  `;
}

function Main() {
  let itensInDir = fs.readdirSync(configs.ENV.DEPLOY_TO);

  credentialUse = CREDENTIALS[configs.ENV.AMB];

  printStep('Iniciando processo de deploy...');
  for(let item of itensInDir) {
    if (!item.includes('.ccc')) {
      util.getFile(item, configs.ENV.DEPLOY_TO, callbackPathFile);
    }
  }
}

module.exports = Main;



