'use strict';

var expect = require('expect.js'),
	sinon = require('sinon'),
	getExecutorConstructor = require('../lib/executor'),
	path = require('path'),
	_ = require('underscore'),
	proxyquire = require('proxyquire');

describe('ssh executor', function() {

	var app = {lib: {
		command: {SpawnCommand: _.noop},
		executor: {BaseExecutor: _.noop},
		scm: {}
	}};

	var makeExecutorConstructor = function(app, Command) {
		var getConstructor = proxyquire('../lib/executor', {
			'./command': function(app) {
				return Command;
			}
		});

		var Executor = getConstructor(app);

		return Executor;
	};

	var makeCommandSpy = function(app) {
		var Command = require('../lib/command')(app),
			CommandSpy = sinon.spy(Command);

		return CommandSpy;
	};

	describe('module', function() {
		it('should export function', function() {
			expect(getExecutorConstructor).a(Function);
		});

		it('should export funct which accepts single arg', function() {
			expect(getExecutorConstructor.length).equal(1);
		});

		var Constructor;

		it('should export func which called without errors', function() {
			Constructor = getExecutorConstructor(app);
		});

		it('should export func which returns executor constructor', function() {
			expect(Constructor.super_).equal(app.lib.executor.BaseExecutor);
		});
	});

	describe('constructor', function() {
		var Executor, parentConstructorSpy;

		before(function() {
			parentConstructorSpy = sinon.stub(
				app.lib.executor,
				'BaseExecutor',
				function(params) {
					this.project = params.project;
				}
			);

			Executor = getExecutorConstructor(app);
		});

		after(function() {
			delete app.lib.executor.BaseExecutor.restore();
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
		var Executor, executor = {}, params = {someParam: 'someVal'}, CommandSpy,
			createScmSpy;

		before(function() {
			app.lib.scm.createScm = function(params) {
				return 'scm';
			};
			createScmSpy = sinon.spy(app.lib.scm, 'createScm');

			CommandSpy = makeCommandSpy(app);
			Executor = makeExecutorConstructor(app, CommandSpy);

			executor._createScm = Executor.prototype._createScm;
			executor.options = {opt1: 'opt1'};
		});

		after(function() {
			delete app.lib.scm.createScm;
		});

		var result;

		it('should be called without error', function() {
			result = executor._createScm(params);
		});

		it('should call lib createScm once', function() {
			expect(createScmSpy.calledOnce).equal(true);
		});

		it('should create command', function() {
			expect(CommandSpy.calledOnce).equal(true);
		});

		it('should create command with options and params', function() {
			var args = CommandSpy.getCall(0).args;
			expect(args[0]).eql(_({}).extend(executor.options, params));
		});

		it('should call lib createScm with params and command', function() {
			var args = createScmSpy.getCall(0).args;
			expect(_(args[0]).omit('command')).eql(params);
			expect(args[0].command).a(CommandSpy);
		});

		it('should return result of create scm command', function() {
			expect(result).equal('scm');
		});
	});

	describe('_createCommand method', function() {
		var Executor, executor = {}, params = {someParam: 'someVal'}, CommandSpy;

		before(function() {
			CommandSpy = makeCommandSpy(app);
			Executor = makeExecutorConstructor(app, CommandSpy);

			executor._createCommand = Executor.prototype._createCommand;
			executor.options = {someOpt: 'someOptVal'};
		});

		var result;

		it('should be executed without error', function() {
			result = executor._createCommand(params);
		});

		it('should create command which calls spawn constructor', function() {
			expect(CommandSpy.calledOnce).equal(true);
		});

		it('should create command from options and params', function() {
			var args = CommandSpy.getCall(0).args;
			expect(args[0]).eql(_({}).extend(executor.options, params));
		});

		it('should return instance of command', function() {
			expect(result).a(CommandSpy);
		});
	});

	describe('_isCloned method', function() {
		var Executor, executor = {}, params = {someParam: 'someVal'}, CommandSpy;

		beforeEach(function() {
			CommandSpy = makeCommandSpy(app);
			Executor = makeExecutorConstructor(app, CommandSpy);

			executor._isCloned = Executor.prototype._isCloned;
			executor.options = {someOpt: 'someOptVal'};
			executor.cwd = '/var/tmp/nci/data/projects';
		});

		it('should check dir exists', function(done) {
			sinon.stub(CommandSpy.prototype, 'run')
				.onCall(0).callsArgWithAsync(1, null, '0')
				.onCall(1).callsArgWithAsync(1, null);

			executor._isCloned(function(err) {
				expect(err).not.ok();
				expect(CommandSpy.calledOnce).equal(true);

				var args = CommandSpy.getCall(0).args;
				expect(args[0]).eql(
					_({collectOut: true}).defaults(executor.options)
				);

				args = CommandSpy.prototype.run.getCall(0).args;
				expect(args[0]).eql({
					cmd: 'test -e "' + executor.cwd + '"; echo $?'
				});

				CommandSpy.prototype.run.restore();

				done();
			});
		});

		it('should create dir when doesnt`t exist', function(done) {
			sinon.stub(CommandSpy.prototype, 'run')
				.onCall(0).callsArgWithAsync(1, null, '1')
				.onCall(1).callsArgWithAsync(1, null);

			executor._isCloned(function(err) {
				expect(err).not.ok();

				expect(CommandSpy.calledTwice).equal(true);

				var args = CommandSpy.getCall(1).args;
				expect(args[0]).eql(executor.options);

				args = CommandSpy.prototype.run.getCall(1).args;
				expect(args[0]).eql({
					cmd: 'mkdir -p "' + path.dirname(executor.cwd) + '"'
				});

				CommandSpy.prototype.run.restore();

				done();
			});
		});
	});

});
