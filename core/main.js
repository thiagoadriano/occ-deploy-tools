const fs = require('fs'),
      path = require('path');

let configs = require('./constants/configs'),
    util = require('./helper/util'),
    { printInfo, printError, printStep } = require('./helper/print-console');

let date = new Date();

function initFluxDeploy(notGrab = false) {
  let copyFiles = require('./copy-files');
  let deploy = require('./deploy');
  let grabs = require('./grab');

  let fileProp = path.normalize(`${configs.FOLDERS.ROOT_FOLDER}/${configs.NAME_FILE_PROPERTIES}`);

  printStep('Checando informações no arquivo de deploy...');
  fs.readFile(fileProp, (err, data) => {
    if(err) {
      printError('Erro ao encontrar o arquivo com informações para deploy.', err);
      return;
    }
  
    let content = data.toString();
    let listContent = content.split('\r\n');

    if (!content || listContent.length < 1) {
      logInformationUseFileDeploy();
      process.exit(0);
    }
  
    listContent = listContent.map(item => {
      return item.split('|');
    });

    printInfo('Informações checadas!');
    if (notGrab) {
      copyFiles(listContent);
      deploy();
    } else {
      printStep('Iniciando Grab...');
      grabs(() => {
        copyFiles(listContent);
        deploy();
      });
    }
  });
}

function initFluxRollBack() {

}

function logInformationUseFileDeploy() {
  printInfo(`
      Execução finalizada por não ter sido informado arquivos para o deploy.
      Use o arquivo ${configs.NAME_FILE_PROPERTIES} para informar os arquivos que serão enviados ao OCC.
      Use o exemplo a seguir para enviar um widget e sua instancia:
      widget|NOME_DO_WIDGET|NOME_DA_INSTANCIA_DO_WIDGET
      
      Caso precise enviar outro arquivo como o less do template, basta apenas informar sua localização como no exemplo:
      theme|NOME_DO_TEMA|theme.less
      
      Adicione quantos arquivos precisar todos em linhas separadas.
  `);
}

function configExecutionTimer() {
  configs.EXEC_DATE_TIME.NOW = date.valueOf();
  configs.EXEC_DATE_TIME.DATE = util.generateDate(date);
  configs.EXEC_DATE_TIME.TIME = util.generateTimer(date);
  configs.EXEC_DATE_TIME.VIEWER = util.generateDateTimer(date);
}

function configEnv(amb = 'STAGE') {
  let stage = configs.FOLDERS.STAGE,
      prod = configs.FOLDERS.PROD,
      test = configs.FOLDERS.TEST;

  if (amb.toUpperCase() === 'PROD') {
    configs.ENV.AMB = 'PROD';

    configs.ENV.DEPLOY_FROM = path.normalize(stage);
    configs.ENV.BACKUP_FROM = path.normalize(prod);
  } else {
    configs.ENV.AMB = 'STAGE';

    configs.ENV.DEPLOY_FROM = path.normalize(test);
    configs.ENV.BACKUP_FROM = path.normalize(stage);    
  }
  
  configs.ENV.DEPLOY_TO = path.normalize(`${configs.FOLDERS.GMUD}/${configs.EXEC_DATE_TIME.VIEWER}-${configs.ENV.AMB}/deploy/`);
  configs.ENV.BACKUP_TO = path.normalize(`${configs.FOLDERS.GMUD}/${configs.EXEC_DATE_TIME.VIEWER}-${configs.ENV.AMB}/backup/`);
}

function createStructureDeploy() {
  let folders = Object.values(configs.FOLDERS);
  let fileProp = path.normalize(`${configs.FOLDERS.ROOT_FOLDER}/${configs.NAME_FILE_PROPERTIES}`);
  let fileControl = path.normalize(`${configs.FOLDERS.ROOT_FOLDER}/${configs.NAME_FILE_DEPLOY_CONTROL}`);

  folders.push(configs.ENV.DEPLOY_TO, configs.ENV.BACKUP_TO);

  try {
    for (let folder of folders) {
      let folderNormalize = path.normalize(folder);
      fs.mkdirSync(folderNormalize, {recursive: true});
    }
  } catch (error) {
    printError('Não foi possível criar a strutura:', error);
    process.exit(1);
  }

  try {
    fs.statSync(fileProp);
  } catch (e) {
    fs.writeFileSync(fileProp, '');
  }

  try {
    fs.statSync(fileControl);
  }  catch (e) {
    fs.writeFileSync(fileControl, '');
  }
}

function Main(amb) {
  console.time('Operação de Deploy');
  printStep('Configurando data e hora...');
  configExecutionTimer();
  printInfo('Data e hora configurado!');

  printStep('Configurando variáveis de execução...');
  configEnv(amb);
  printInfo('Variáveis de execução configuradas!');

  printStep('Configurando estrutura de diretórios...');
  createStructureDeploy();
  printInfo('Estrutura de diretório configurada!');
}

module.exports = { Main, initFluxDeploy, initFluxRollBack };

