/*global require: true */
/*global setImmediate: true */
/*global exports: true */
/*global console: true */

(function () {
	'use strict';

	var Q = require('q'),
		SVNSpawn = require('svn-spawn'),
		moment = require('moment');

	exports.SVNGraphs = function () {
		this.svn_client = null;
		this.processed_log = null;
		this.path = '';
	};

	exports.SVNGraphs.prototype.SVNConnect = function (path) {
		var deferred = Q.defer();
		setImmediate(function () {

			var svn_client = new SVNSpawn({
				cwd: path,
				// username: 'username', // optional if authentication not required or is already saved
				// password: 'password', // optional if authentication not required or is already saved
			});

			if (typeof path !== 'undefined')
				this.path = path;

			this.svn_client = svn_client;

			deferred.resolve(svn_client);

		}.bind(this));
		return deferred.promise;
	};

	exports.SVNGraphs.prototype.SavePunchcardImage = function (path) {
		return this.GetPunchcardDataFromProcessedLog()
			.then(function (data) {
				return exports.SVNGraphs.RenderPunchcard.call(this, data, path);
			});
	};

	exports.SVNGraphs.prototype.GetProcessedLog = function () {
		var deferred = Q.defer();
		setImmediate(function () {

			if (this.processed_log !== null)
				deferred.resolve(this.processed_log);

			this.svn_client.getLog(function (err, data) {
				if (err)
					return deferred.reject(err);

				this.processed_log = data[0].map(function (item) {
					item.moment = moment(item.date);
					return item;
				});

				deferred.resolve(this.processed_log);
			}.bind(this));

		}.bind(this));
		return deferred.promise;
	};

	exports.SVNGraphs.prototype.GetPunchcardDataFromProcessedLog = function () {
		var deferred = Q.defer();
		setImmediate(function () {

			this.GetProcessedLog().then(function (data) {

				var punch_card = {},
					max = 0;

				for (var j = 0; j < data.length; j++) {
					var day_of_week = data[j].moment.format('dddd'),
						hour = data[j].moment.format('ha');

					if (typeof punch_card[day_of_week] === 'undefined')
						punch_card[day_of_week] = {};

					if (typeof punch_card[day_of_week][hour] === 'undefined')
						punch_card[day_of_week][hour] = 0;

					punch_card[day_of_week][hour]++;

					if (punch_card[day_of_week][hour] > max)
						max = punch_card[day_of_week][hour];
				}

				deferred.resolve({
					days: punch_card,
					max: max,
				});
			});

		}.bind(this));
		return deferred.promise;
	};

	exports.SVNGraphs.RenderPunchcard = function (data, image_name) {
		if (typeof image_name === 'undefined')
			image_name = 'punchcard.png';

		var deferred = Q.defer();
		setImmediate(function () {

			console.log('Rendering punchcard image...');
			var Canvas = require('canvas'),
				fs = require('fs'),
				days = [
					'Monday',
					'Tuesday',
					'Wednesday',
					'Thursday',
					'Friday',
					'Saturday',
					'Sunday',
				],
				times = [
					'12am',
					'1am',
					'2am',
					'3am',
					'4am',
					'5am',
					'6am',
					'7am',
					'8am',
					'9am',
					'10am',
					'11am',
					'12pm',
					'1pm',
					'2pm',
					'3pm',
					'4pm',
					'5pm',
					'6pm',
					'7pm',
					'8pm',
					'9pm',
					'10pm',
					'11pm',
				],
				graph_width = 800,
				graph_height = 300,
				graph_padding = 12,
				canvas = new Canvas(graph_width, graph_height),
				ctx = canvas.getContext('2d'),
				i,
				j;

			ctx.font = '12px';

			var text_width = ctx.measureText('Wednesday');
			ctx.textBaseline = 'middle';

			var step_x = (graph_width - (graph_padding * 2) - text_width.width) / 23;
			var step_y = (graph_height - (graph_padding * 2)) / 7;

			// Drawing days of week
			ctx.textAlign = 'left';
			for (i = 0; i < days.length; i++)
				ctx.fillText(days[i], graph_padding, graph_padding + (i * step_y));

			// Drawing times
			ctx.textAlign = 'center';
			for (j = 0; j < times.length; j++)
				ctx.fillText(times[j], graph_padding + text_width.width + (j * step_x), graph_padding + (7 * step_y));

			// Drawing circles
			for (i = 0; i < days.length; i++)
				for (j = 0; j < times.length; j++)
					if (typeof data.days !== 'undefined' &&
						typeof data.days[days[i]] !== 'undefined' &&
						typeof data.days[days[i]][times[j]] !== 'undefined') {
						  ctx.beginPath();
						  ctx.arc(graph_padding + text_width.width + (j * step_x), graph_padding + (i * step_y), Math.round(data.days[days[i]][times[j]] / data.max * 15), 0, 2 * Math.PI, false);
						  ctx.fillStyle = 'black';
						  ctx.fill();
					}

			console.log('Writing to ' + image_name + '...');
			var out = fs.createWriteStream(image_name),
				stream = canvas.pngStream();

			stream.on('data', function(chunk){
				out.write(chunk);
			});

			stream.on('end', function(){
				console.log('Image saved.');
				deferred.resolve('Image saved.');
			});

		}.bind(this));
		return deferred.promise;
	};

}());
