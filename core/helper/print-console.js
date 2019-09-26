const chalk = require('chalk');

let errorStyle = chalk.red.bold;
let warnStyle = chalk.yellow;
let infoStyle = chalk.blue;
let stepStyle = chalk.green.bold.italic;
let errorObjStyle = chalk.red.italic;

let step = 0;

function printError(msg = '', error = null) {
 console.error(errorStyle(`${msg}
${errorObjStyle(error)}
 `));
}

function printInfo(msg = '') {
 console.log(infoStyle(`${msg}`));
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

module.exports = {printWarn, printStep, printError, printInfo};
