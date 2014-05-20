#!/usr/bin/env node

/*global require: true */
/*global process: true */

(function () {
	'use strict';

	var program = require('commander'),
		svn_graphs = require('./index.js'),
		path = process.cwd();

	program
		.usage('[options] <working directory>')
		.version('0.0.5')
		.option('-j, --json', 'output JSON instead of creating an image')
		.option('-i, --image [filename]', 'specify image file name')
		.parse(process.argv);

	if (program.args.length > 0)
		path = program.args[0];

	svn_graphs.SVNConnect(path)
		.then(svn_graphs.GetProcessedLog.bind(svn_graphs))
		.then(function (data) {
			svn_graphs.GetPunchcardFromProcessedLog.bind(svn_graphs)(data).then(function (data) {
				if (program.json)
					console.log(data);
				else
					svn_graphs.RenderPunchcard.bind(svn_graphs)(data, program.image);
			});
		}, function (error) {
			console.log('Cannot load SVN log');
			console.log('Error: ', error.message);
			return;
		});

}());