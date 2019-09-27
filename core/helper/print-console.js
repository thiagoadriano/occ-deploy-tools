const chalk = require('chalk');

let errorStyle = chalk.red.bold;
let warnStyle = chalk.yellow;
let infoStyle = chalk.blue;
let stepStyle = chalk.green.bold.italic;
let errorObjStyle = chalk.red.italic;
let logFileGrabStyle = chalk.rgb(123, 45, 67).bold;

let step = 0;

function printError(msg = '', error = null) {
 console.error(errorStyle(`${msg}
${error ? errorObjStyle(error) : ''}
 `));
}

function printInfo(msg = '', data = null) {
 if (!data) {
  console.log(infoStyle(`${msg}`));
 } else {
  console.log(`${infoStyle(msg)} ${logFileGrabStyle(data)}`);
 }
}

function printWarn(msg = '') {
 console.warn(warnStyle(`${msg}`));
}

function printStep(msg = '') {
 ++step;
 console.log(`
  ${stepStyle(`Passo ${step}`)}
${infoStyle(msg)}`);
}

function printInfoAmb(amb = '', msg = '') {
 console.log(`
  ${stepStyle(`Ambiente ${amb}`)}
${infoStyle('Baixando o arquivo: ')} ${logFileGrabStyle(msg)}
`);
}

function printErrorAmb(amb = '', msg = '') {
 console.error(`
  ${errorStyle(`Ambiente ${amb}`)}
${errorStyle('Erro ao baixar o arquivo: ')} ${errorStyle(msg)}
`);
}

module.exports = {printWarn, printStep, printError, printInfo, printInfoAmb, printErrorAmb};
