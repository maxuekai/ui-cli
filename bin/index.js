#!/usr/bin/env node

const program = require('commander');

program
	.command('new [module]')
	.description('generator new module')
	.action((module) => {
		console.log(`hello ${module}`);
	});

program.parse(process.argv);