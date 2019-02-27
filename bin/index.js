#!/usr/bin/env node

const package = require('../package.json');
const program = require('commander');
const mod = require('../src/commands/module');

program
	.version(package.version, '-v, --version');

program
	.command('new [module]')
	.description('generator new module')
	.action((module) => {
		mod(module);
	});

program
	.command('hello')
	.description('test command')
	.action(() => {
		console.log('hello world3')
	});

program.parse(process.argv);