'use strict'

const fs = require('fs-extra');
const path = require('path');
const inquirer = require('inquirer');
const chalk = require('chalk');
const shell = require('shelljs');

function generateModule(mod) {
	let cwd = process.cwd(),
		dir = path.resolve(__dirname, `../../modules/${mod}`);
	fs.copy(dir, cwd)
	  .then(() => {
	  	console.log('success');
	  	fs.exists(`${cwd}/package.json`, (exists) => {
			if(exists) {
				console.log(`running ${chalk.green('npm install')}`);
				shell.exec('npm i');
			}
		});
	  })
	  .catch(() => console.log('no this module'));
}

module.exports = (mod) => {
	if(mod) {
		generateModule(mod);
	}else {
		inquirer.prompt([{
			type: 'list',
			message: '请选择一种模板:',
			name: 'module',
			choices: fs.readdirSync(path.resolve(__dirname, '../../modules'))
		}])
		.then(answers => {
			generateModule(answers.module);
		});
	}
}