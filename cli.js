#!/usr/bin/env node

/*global require: true */
/*global process: true */

(function () {
	'use strict';

	var program = require('commander'),
		SVNGraphs = require('lib/SVNGraphs.js').SVNGraphs,
		path = process.cwd(),
		package_json = require('./package.json'),
		svn_graphs = new SVNGraphs();

	program
		.usage('[options] <working directory>')
		.version(package_json.version)
		.option('-j, --json', 'output JSON instead of creating an image')
		.option('-i, --image [filename]', 'specify image file name')
		.parse(process.argv);

	if (program.args.length > 0)
		path = program.args[0];

	if (program.json)
		svn_graphs.SVNConnect(path)
			.then(svn_graphs.GetPunchcardDataFromProcessedLog.bind(svn_graphs))
			.then(function (data) {
				console.log(data);
			});
	else
		svn_graphs.SVNConnect(path)
			.then(svn_graphs.SavePunchcardImage.bind(svn_graphs, program.image));

		// .then(svn_graphs.GetProcessedLog.bind(svn_graphs))
		// .then(function (data) {
		// 	svn_graphs.GetPunchcardDataFromProcessedLog.call(svn_graphs, data).then(function (data) {
		// 		if (program.json)
		// 			console.log(data);
		// 		else
		// 			svn_graphs.RenderPunchcard.call(svn_graphs, data, program.image);
		// 	});
		// }, function (error) {
		// 	console.log('Cannot load SVN log');
		// 	console.log('Error: ', error.message);
		// 	return;
		// });

}());
