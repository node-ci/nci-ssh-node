'use strict';

var Steppy = require('twostep').Steppy,
	_ = require('underscore'),
	inherits = require('util').inherits,
	path = require('path');

module.exports = function(app) {
	var ParentExecutor = app.lib.executor.BaseExecutor,
		Command = require('./command')(app);

	function Executor(params) {
		ParentExecutor.call(this, params);

		this.options = params.options;
		this.cwd = path.join(
			this.options.baseDir || '/var/tmp/nci/data/projects',
			this.project.name,
			'workspace'
		);
	}

	inherits(Executor, ParentExecutor);

	Executor.prototype._createScm = function(params) {
		return app.lib.scm.createScm(_({
			command: new Command(_({}).extend(this.options, params))
		}).extend(params));
	};

	Executor.prototype._createCommand = function(params) {
		return new Command(
			_({}).extend(this.options, params)
		);
	};

	Executor.prototype._isCloned = function(callback) {
		var self = this;

		Steppy(
			function() {
				new Command(
					_({collectOut: true}).defaults(self.options)
				).run({
					cmd: 'test -e "' + self.cwd + '"; echo $?'
				}, this.slot());
			},
			function(err, output) {
				var cwdExists = output && output[0] === '0';

				this.pass(cwdExists);

				// ensure that parent dir for target repo exist
				if (cwdExists) {
					this.pass(null);
				} else {
					new Command(self.options).run({
						cmd: 'mkdir -p "' + path.dirname(self.cwd) + '"'
					}, this.slot());
				}
			},
			function(err, cwdExists, mkdirResult) {
				callback(err, cwdExists);
			}
		);
	};

	return Executor;
};
