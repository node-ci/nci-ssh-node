'use strict';

var expect = require('expect.js'),
	sinon = require('sinon'),
	getExecutorConstructor = require('../lib/executor'),
	path = require('path'),
	_ = require('underscore'),
	proxyquire = require('proxyquire');

describe('ssh executor', function() {

	function BaseExecutor() {
	}

	var app = {lib: {
		command: {},
		executor: {},
		scm: {}
	}};

	describe('constructor', function() {
		var Executor, parentConstructorSpy;

		beforeEach(function() {
			app.lib.executor.BaseExecutor = sinon.spy(function(params) {
				this.project = params.project;
			});
			app.lib.command.SpawnCommand = _.noop;
			parentConstructorSpy = app.lib.executor.BaseExecutor;

			Executor = getExecutorConstructor(app);
		});

		after(function() {
			delete app.lib.command.BaseExecutor;
			delete app.lib.command.SpawnCommand;
		});

		it('should call parent constructor with params', function() {
			var params = {options: {}, project: {name: 'project1'}},
				executor = new Executor(params);

			expect(parentConstructorSpy.calledOnce).equal(true);
			expect(parentConstructorSpy.getCall(0).args[0]).eql(params);
		});

		it('should remember options passed to constructor', function() {
			var params = {options: {opt1: 'ab'}, project: {name: 'project1'}},
				executor = new Executor(params);

			expect(executor.options).eql(params.options);
		});

		it('should set cwd with base dir', function() {
			var params = {options: {}, project: {name: 'project1'}},
				executor = new Executor(params);

			expect(executor.cwd).equal(path.join(
				'/var/tmp/nci/data/projects',
				params.project.name,
				'workspace'
			));
		});

		it('should allow to change base dir via option', function() {
			var params = {
				options: {baseDir: '/tmp/nci'},
				project: {name: 'project1'}
			};
			var executor = new Executor(params);

			expect(executor.cwd).equal(path.join(
				'/tmp/nci',
				params.project.name,
				'workspace'
			));
		});
	});

	describe('_createScm method', function() {
		var Executor, executor = {}, params = {someParam: 'someVal'}, result;

		before(function() {
			app.lib.scm.createScm = sinon.spy(function(params) {
				return 'scm';
			});
			app.lib.command.SpawnCommand = sinon.spy();

			Executor = getExecutorConstructor(app);
			executor._createScm = Executor.prototype._createScm;
			executor.options = {opt1: 'opt1'};

			result = executor._createScm(params);
		});

		after(function() {
			delete app.lib.scm.createScm;
			delete app.lib.command.SpawnCommand;
		});

		it('should call lib createScm once', function() {
			expect(app.lib.scm.createScm.calledOnce).equal(true);
		});

		it('should create which calls spawn command constructor', function() {
			expect(app.lib.command.SpawnCommand.calledOnce).equal(true);
		});

		it('should create command from options and params', function() {
			var args = app.lib.command.SpawnCommand.getCall(0).args;
			expect(args[0]).eql(_({}).extend(executor.options, params));
		});

		it('should call lib createScm with params and command', function() {
			var args = app.lib.scm.createScm.getCall(0).args;
			expect(_(args[0]).omit('command')).eql(params);
			expect(args[0].command).a(app.lib.command.SpawnCommand);
		});

		it('should return result of create scm command', function() {
			expect(result).equal('scm');
		});
	});

	describe('_createCommand method', function() {
		var Executor, executor = {}, params = {someParam: 'someVal'}, result;

		before(function() {
			app.lib.command.SpawnCommand = sinon.spy();

			Executor = getExecutorConstructor(app);
			executor._createCommand = Executor.prototype._createCommand;
			executor.options = {someOpt: 'someOptVal'};

			result = executor._createCommand(params);
		});

		after(function() {
			delete app.lib.command.SpawnCommand;
		});

		it('should create command which calls spawn constructor', function() {
			expect(app.lib.command.SpawnCommand.calledOnce).equal(true);
		});

		it('should create command from options and params', function() {
			var args = app.lib.command.SpawnCommand.getCall(0).args;
			expect(args[0]).eql(_({}).extend(executor.options, params));
		});

		it('should return instance of command', function() {
			expect(result).a(app.lib.command.SpawnCommand);
		});
	});

	describe('_isCloned method', function() {
		var Executor, executor = {}, params = {someParam: 'someVal'}, Command;

		beforeEach(function() {
			app.lib.command.SpawnCommand = _.noop;

			Command = sinon.spy(require('../lib/command')(app));

			sinon.spy(Command.prototype, 'run');

			var getExecutorConstructor = proxyquire('../lib/executor', {
				'./command': function(app) {
					return Command;
				}
			});
			Executor = getExecutorConstructor(app);
			executor._isCloned = Executor.prototype._isCloned;
			executor.options = {someOpt: 'someOptVal'};
			executor.cwd = '/var/tmp/nci/data/projects';
		});

		after(function() {
			delete app.lib.command.SpawnCommand;
		});

		it('should create and run check dir command', function(done) {
			executor._isCloned(function() {
				expect(Command.calledOnce).equal(true);

				var args = Command.getCall(0).args;
				expect(args[0]).eql(
					_({collectOut: true}).defaults(executor.options)
				);

				args = Command.prototype.run.getCall(0).args;
				expect(args[0]).eql({cmd: 'test -e ' + executor.cwd + '; echo $?'});

				done();
			});
		});
	});

});
