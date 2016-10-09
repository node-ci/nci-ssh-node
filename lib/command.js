'use strict';

var _ = require('underscore'),
	inherits = require('util').inherits;

module.exports = function(app) {
	var ParentCommand = app.lib.command.SpawnCommand;

	// ssh shell command
	function Command(params) {
		ParentCommand.call(this, params);
		this.shell = params.shell || '/bin/sh';
		this.shellCmdArg = params.shellCmdArg || '-c';
	}

	inherits(Command, ParentCommand);

	Command.prototype._escapeCmd = function(cmd) {
		return (
			cmd
				.replace(/'/g, '\'\'')
				.replace(/\r?\n/g, '')
		);
	};

	Command.prototype._escapeArg = function(arg) {
		return arg.replace(/"/g, '\\"');
	};

	Command.prototype.run = function(params, callback) {
		var self = this;

		var args = [
			'-i', this.identityFile,
			// force to use identity file
			'-o', 'IdentitiesOnly=yes',
			// passphrase/password querying will be disabled
			// (useful in scripts and other batch jobs)
			'-o', 'BatchMode=yes',
			// disable pseudo-tty allocation
			'-T'
		];

		if (this.port) {
			args.push('-p', this.port);
		}

		if (this.args) {
			args = args.concat(this.args);
		}

		args.push(this.user + '@' + this.host);

		var remoteCmd = this.shell + ' ' + this.shellCmdArg + ' ';
		// start shell command argument
		remoteCmd += '\'';

		var cwd = params.options && params.options.cwd || this._cwd;
		if (cwd) {
			remoteCmd += 'cd "' + cwd + '" && ';
		}

		remoteCmd += self._escapeCmd(params.cmd);

		remoteCmd +=  ' ' + _(params.args).map(function(arg) {
			return '"' + self._escapeArg(arg) + '"';
		}).join(' ');

		// end shell command argument
		remoteCmd += '\'';

		args.push(remoteCmd);

		return ParentCommand.prototype.run.call(this, {
			cmd: 'ssh',
			args: args,
			options: _(params.options).omit('cwd')
		}, callback);
	};

	Command.prototype.setParams = function(params) {
		ParentCommand.prototype.setParams.call(this, params);

		// transforms cwd to _cwds coz cwd will be passed as options.cwd at
		// spawn command - leads to ENOENT
		if (this.cwd) {
			this._cwd = this.cwd;
			delete this.cwd;
		}

		if (params.host) this.host = params.host;
		if (params.port) this.port = params.port;
		if (params.user) this.user = params.user;
		if (params.identityFile) this.identityFile = params.identityFile;
		// additional arguments
		if (params.args) this.args = params.args;
	};

	return Command;
};
