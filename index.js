#!/usr/bin/env node
const program = require('commander');
const pkg = require('./package.json');
const { Main, initFluxDeploy, initFluxRollBack } = require('./core/main');

program
    .command('deploy')
    .option('-n, --nograb', 'Deploy sem GRAB')
    .option('-p, --inProd', 'Deploy em Produção')
    .description('Efetua o deploy no ambiente de prod ou stage.')
    .action(opt => {
        Main(opt.inProd ? 'PROD' : 'STAGE');
        initFluxDeploy(opt.nograb || false);
    });

program
    .command('rollback')
    .option('-p, --inProd', 'Rollback em Produção')
    .description('Efetua o rollback no ambiente de prod ou stage.')
    .action(opt => {
        initFluxRollBack(opt.inProd ? 'PROD' : 'STAGE');
    });

program.version(pkg.version, '-v, --version', 'Mostra a versão da ferramenta');
program.parse(process.argv);
