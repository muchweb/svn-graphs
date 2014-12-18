'use strict'

Q        = require 'q'
SVNSpawn = require 'svn-spawn'
moment   = require 'moment'

module.exports.SVNGraphs = class

	constructor: ->
		@svn_client = null
		@processed_log = null
		@path = ''

	@SVNConnect: (@path) ->
		deferred = Q.defer()
		setImmediate =>
			@svn_client = new SVNSpawn
				cwd: path
				# username: 'username', // optional if public repo or is already saved
				# password: 'password', // optional if public repo or is already saved
			deferred.resolve @svn_client
		deferred.promise

	@SavePunchcardImage: (path) ->
		@GetPunchcardDataFromProcessedLog().then (data) ->
			exports.SVNGraphs.RenderPunchcard.call this, data, path

	@GetProcessedLog: ->
		deferred = Q.defer()
		setImmediate =>
			deferred.resolve @processed_log	if @processed_log isnt null
			@svn_client.getLog (err, data) =>
				@processed_log = data[0].map (item) ->
					item.moment = moment(item.date)
					item
				deferred.resolve @processed_log
		deferred.promise

	@GetPunchcardDataFromProcessedLog: ->
		deferred = Q.defer()
		setImmediate =>
			@GetProcessedLog().then (data) ->
				punch_card = {}
				max = 0
				j = 0

				while j < data.length
					day_of_week = data[j].moment.format('dddd')
					hour = data[j].moment.format('ha')
					punch_card[day_of_week] = {}	if typeof punch_card[day_of_week] is 'undefined'
					punch_card[day_of_week][hour] = 0	if typeof punch_card[day_of_week][hour] is 'undefined'
					punch_card[day_of_week][hour]++
					max = punch_card[day_of_week][hour]	if punch_card[day_of_week][hour] > max
					j++

				deferred.resolve
					days: punch_card
					max: max

		deferred.promise

	RenderPunchcard: (data, image_name) ->
		image_name = 'punchcard.png'	if typeof image_name is 'undefined'
		deferred = Q.defer()

		# Drawing days of week

		# Drawing times

		# Drawing circles
		setImmediate =>
			console.log 'Rendering punchcard image...'
			Canvas = require 'canvas'
			fs     = require 'fs'
			days = [
				'Monday'
				'Tuesday'
				'Wednesday'
				'Thursday'
				'Friday'
				'Saturday'
				'Sunday'
			]
			times = [
				'12am'
				'1am'
				'2am'
				'3am'
				'4am'
				'5am'
				'6am'
				'7am'
				'8am'
				'9am'
				'10am'
				'11am'
				'12pm'
				'1pm'
				'2pm'
				'3pm'
				'4pm'
				'5pm'
				'6pm'
				'7pm'
				'8pm'
				'9pm'
				'10pm'
				'11pm'
			]
			graph_width = 800
			graph_height = 300
			graph_padding = 12
			canvas = new Canvas graph_width, graph_height
			ctx = canvas.getContext('2d')
			i = undefined
			j = undefined
			ctx.font = '12px'
			text_width = ctx.measureText('Wednesday')
			ctx.textBaseline = 'middle'
			step_x = (graph_width - (graph_padding * 2) - text_width.width) / 23
			step_y = (graph_height - (graph_padding * 2)) / 7
			ctx.textAlign = 'left'
			i = 0
			while i < days.length
				ctx.fillText days[i], graph_padding, graph_padding + (i * step_y)
				i++
			ctx.textAlign = 'center'
			j = 0
			while j < times.length
				ctx.fillText times[j], graph_padding + text_width.width + (j * step_x), graph_padding + (7 * step_y)
				j++
			i = 0
			while i < days.length
				j = 0
				while j < times.length
					if typeof data.days isnt 'undefined' and typeof data.days[days[i]] isnt 'undefined' and typeof data.days[days[i]][times[j]] isnt 'undefined'
						ctx.beginPath()
						ctx.arc graph_padding + text_width.width + (j * step_x), graph_padding + (i * step_y), Math.round(data.days[days[i]][times[j]] / data.max * 15), 0, 2 * Math.PI, false
						ctx.fillStyle = 'black'
						ctx.fill()
					j++
				i++
			console.log 'Writing to ' + image_name + '...'
			out = fs.createWriteStream(image_name)
			stream = canvas.pngStream()
			stream.on 'data', (chunk) ->
				out.write chunk

			stream.on 'end', ->
				console.log 'Image saved.'
				deferred.resolve 'Image saved.'

		deferred.promise
