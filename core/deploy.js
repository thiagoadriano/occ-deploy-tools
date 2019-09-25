const fs = require('fs'),
      path = require('path'),
      { exec } = require('child_process'),
      CREDENTIALS = require('./constants/credentials'),
      configs = require('./constants/configs'),
      util = require('./helper/util'),
      { loggerDeploy } = require('./helper/logger');

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
  let fileRelativePath = path.normalize(file.replace(configs.ENV.DEPLOY_TO, ''));
  let args = ['--node', credentialUse.URL,  '--applicationKey', credentialUse.KEY, '--transfer', `"${fileRelativePath}"`];
  let command = exec(`dcu ${args.join(' ')}`, {cwd: configs.ENV.DEPLOY_TO});

  setStatus(file, STATUS.STARTED);

  command.stdout.on('data', logStream.bind(null, fileRelativePath));
  command.stderr.on('data', logError.bind(null, fileRelativePath));
  command.on('close', logClose.bind(null, fileRelativePath));
}

function logStream(file, data) {
  console.log(`Fluxo de envio: 
  ${data.toString()}`);
  loggerDeploy.info(`
    Fluxo de envio:
    ${data.toString()}
  `);

  if (data.includes('encontrado na interface de administração do Commerce Cloud de destino') && data.includes('A operação demorou')) {
    setStatus(file, STATUS.SENT);
  } 
  
  else if (data.includes('Enviando')) {
    setStatus(file, STATUS.IN_PROGRESS);
  } 
    
}

function logError(file, data) {
  console.error(`Erro ao enviar o arquivo: ${file} 
  ${data.toString()}`);
  loggerDeploy.error(`
  Erro ao enviar o arquivo ${file}
  ${data.toString()}
  `);
  if (!data.includes('Invalid operation on a non-internationalized Widget')) {
    setStatus(file, STATUS.ERROR, data);
  }
}

function logClose(file, code) {
  console.log(`
  Processo finalizado para o arquivo ${file} com código ${code}
  `);
  loggerDeploy.info(`
  Processo finalizado para o arquivo ${file} com código ${code}
  `);

  totalFiles++;

  if (code === 0) {
    setStatus(file, STATUS.FINISH);
  } else {
    setStatus(file, STATUS.ERROR);
  }

  populateDeployInfoFile();
}

function callbackPathFile(filePath) {
  reportFiles.push({
    file: filePath.replace(configs.ENV.DEPLOY_TO, ''),
    status: STATUS.NOT_STARTED,
    msg: ''
  });

  deployFile(filePath);
}

function setStatus(file, status, dataFail) {
  let queryFile = file.replace(configs.ENV.DEPLOY_TO, '');
  
  for (let report of reportFiles) {
    if (report.file === queryFile && report.status !== STATUS.ERROR) {
      report.status = status;

      if (dataFail) report.msg = dataFail;
    }
  }
}

function populateDeployInfoFile() {
  if (totalFiles === reportFiles.length) {
    console.log('Preparando arquivo do resultado de deploy...');
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

      console.log('Deploy Concluído!');
    } catch (err) {
      console.log(`Erro em atualizar o log de deploy: ${err}`);
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

  console.log('Iniciando processo de deploy...');
  for(let item of itensInDir) {
    if (!item.includes('.ccc')) {
      util.getFile(item, configs.ENV.DEPLOY_TO, callbackPathFile);
    }
  }
}

module.exports = Main;



