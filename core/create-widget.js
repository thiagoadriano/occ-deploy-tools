const fs = require('fs'),
      { spawn } = require('child_process'),
      path = require('path'),
      CREDENTIALS = require('./constants/credentials'),
      configs = require('./constants/configs'),
      { printStep, printInfo, printError } = require('./helper/print-console'),
      { loggerCriateWidget } = require('./helper/logger');

let args = [
  '/c', 'ccw', '--createWidget', 
  '--username', CREDENTIALS.LOGIN, 
  '--password', CREDENTIALS.PASSWORD,
  '--node'
];     

let steps = [
  {question: 'Enter the name of the new widget', answer: ''},
  {question: 'Is the new widget global?', answer: 'N'},
  {question: 'Does the new widget require internationalization?', answer: 'N'},
  {question: 'Is the new widget configurable?', answer: 's'},
  {question: 'Should the new widget contain example source code?', answer: 'N'},
  {question: 'Does the new widget require fragmentation?', answer: 'N'},
  {question: 'Should the new widget be sent to the instance immediately?', answer: 's'}
];

let widgetCreate = new Set();
let filesDeploy = new Set();
let stepNumber = 0;

function createWidget(file, urlAmb,  cb) {
  let splitPath = file.split('\\');
  let name = splitPath[1];
  let argsCommand = Array.from(args);
  let command = null;
  
  filesDeploy.add(file);

  if (!widgetCreate.has(name)) {
    widgetCreate.add(name);

    argsCommand.push(urlAmb);
    command = spawn(process.env.ComSpec, argsCommand, {
      cwd: configs.ENV.BACKUP_FROM
    });
    steps[stepNumber].answer = name;
  
    printStep(`Criando widget ${name}...`);

    command.stdout.on('data', sequenceCCW.bind(command, name));
    command.stderr.on('data', errorCCW.bind(null, name));
    command.once('exit', closeCCW.bind(null, name, cb));
    command.once('close', closeCCW.bind(null, name, cb));
  }
  
}

function sequenceCCW(name, data) {
  let step = steps[stepNumber];

  data = data.toString();

  if(!step) {
    this.kill('SIGINT');
  }
  else if (data.includes('já existe')) {
    printError(`Não foi possível criar o widget ${name} pois o mesmo já existe no ambiente ${configs.ENV.AMB}.`);
    loggerCriateWidget.error(`Não foi possível criar o widget ${name} pois o mesmo já existe no ambiente ${configs.ENV.AMB}.`);
    this.kill('SIGKILL');
  }
  else if (data.includes(step.question)) {
    let buffer = Buffer.from(`${step.answer}\r`);
    loggerCriateWidget.info(`Step ${step.question} com resposta ${step.answer}`);
    this.stdin.write(buffer);
    stepNumber++;
  }
  else if (steps.length === stepNumber) {
    this.stdin.end();
    this.kill('SIGQUIT');
  }
}

function errorCCW(name, error) {
  printError(`Erro ao criar o widget ${name}`, error);
  loggerCriateWidget.error(`Erro ao criar o widget ${name}: ${error}`);
}

function closeCCW(name, cb, code, signal) {
  printInfo(`Widget ${name} criado e enviado para o ambiente ${configs.ENV.AMB}!`);
  
  for (let file of filesDeploy) {
    cb(file)
  }
}

function existsWidget(filepath) {
  let splitPath = filepath.split('\\');
  let name = splitPath[1];

  try {
    fs.statSync(path.normalize(`${configs.ENV.BACKUP_FROM}/widget/${name}`));
    return true;
  } catch (e) {
    return false;
  }

}

module.exports = { existsWidget,  createWidget};
