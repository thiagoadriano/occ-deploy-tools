const 
    fs = require('fs'),
    path = require('path'),
    configs = require('./constants/configs'),
    util = require('./helper/util');

let 
  filesToDeploy = new Set(),
  filesToBackup = new Set();
  filesCCCToDeploy = new Set();

function prepareWidgetPath(list) {
  let [, widget, instance] = list;

  let pathWidgetDeploy = path.normalize(`${configs.ENV.DEPLOY_FROM}/widget/${widget}`);
  let pathInstanceDeploy = path.normalize(`${pathWidgetDeploy}/instances/${instance}`);

  let pathWidgetBackup = path.normalize(`${configs.ENV.BACKUP_FROM}/widget/${widget}`);
  let pathInstanceBackup = path.normalize(`${pathWidgetBackup}/instances/${instance}`);

  let pathWidgetCCC = path.normalize(`${configs.ENV.DEPLOY_FROM}.ccc/widget/${widget}`);
  let pathInstanceCCC = path.normalize(`${pathWidgetCCC}/instances/${instance}`);

  if (instance) {
    util.getFile('', pathInstanceDeploy, addFileInList.bind(null, filesToDeploy, false));
    util.getFile('', pathInstanceBackup, addFileInList.bind(null, filesToBackup, false));
    util.getFile('', pathInstanceCCC, addFileInList.bind(null, filesCCCToDeploy, false));
  }

  util.getFile('', pathWidgetDeploy, addFileInList.bind(null, filesToDeploy, true));
  util.getFile('', pathWidgetBackup, addFileInList.bind(null, filesToBackup, true));
  util.getFile('', pathWidgetCCC, addFileInList.bind(null, filesCCCToDeploy, true));
}

function addFileInList(list, notInstance, filePath) {
  if (!filePath) return;
  if(notInstance && filePath.includes('instances')) return;
  list.add(filePath);
}

function prepareGeneralPath(list) {
  let pathDeploy = path.normalize(`${configs.ENV.DEPLOY_FROM}${list.join('/')}`);
  let pathBackup = path.normalize(`${configs.ENV.BACKUP_FROM}${list.join('/')}`);
  let pathCCC = path.normalize(`${configs.ENV.DEPLOY_FROM}.ccc/${list.join('/')}`);

  util.getFile('', pathDeploy, addFileInList.bind(null, filesToDeploy, false));
  util.getFile('', pathCCC, addFileInList.bind(null, filesCCCToDeploy, false));
  util.getFile('', pathBackup, addFileInList.bind(null, filesToBackup, false));
}

function execCopyFile(listFiles = [], pathFromCopy = "", pathToCopy = "") {
  for(let file of listFiles) {
    let pathCreate = file.replace(path.normalize(pathFromCopy), '');
    let pathFolder = path.normalize(`${pathToCopy}${pathCreate}`);
    let copyFile = path.normalize(`${pathToCopy}${pathCreate}`);

    pathFolder = pathFolder.replace(/\//g, '\\').split('\\');
    pathFolder.pop();
    pathFolder = path.normalize(pathFolder.join('/'));
    
    try {

      fs.mkdirSync(pathFolder, { recursive: true });
      fs.copyFileSync(file, copyFile);
      
    } catch(err) {
      console.error(`Erro ao realizar a operação: ${err}`);
      process.exit(1);
    }
  }
}

function copyFileCCC(){
  execCopyFile(filesCCCToDeploy, configs.ENV.DEPLOY_FROM, configs.ENV.DEPLOY_TO);
  fs.copyFileSync(path.normalize(`${configs.ENV.DEPLOY_FROM}/.ccc/config.json`), path.normalize(`${configs.ENV.DEPLOY_TO}/.ccc/config.json`));
}

function generatePaths(list) {
  for(let item of list) {
    if (item[0] === 'widget') {
      prepareWidgetPath(item);
    } else {
      prepareGeneralPath(item);
    }
  }
}

function Main(list = []) {
  if (list.length > 0 && list[0]) {
    console.log('Iniciando separação de arquivos...');
    generatePaths(list);

    console.log('Copiando os arquivos de rollback...');
    execCopyFile(filesToBackup, configs.ENV.BACKUP_FROM, configs.ENV.BACKUP_TO);

    console.log('Copiando os arquivos para deploy...');
    execCopyFile(filesToDeploy, configs.ENV.DEPLOY_FROM, configs.ENV.DEPLOY_TO);

    console.log('Copiando os arquivos de versionamento do occ...');
    copyFileCCC();
  }
}

module.exports = Main;
