'use strict';

var expect = require('expect.js'),
	sinon = require('sinon'),
	getExecutorConstructor = require('../lib/executor'),
	path = require('path');

describe('ssh executor', function() {

	function BaseExecutor() {
	}

	var app = {lib: {
		command: {SpawnCommand: function() {}},
		executor: {}
	}};

	describe('constructor', function() {
		var Executor, parentConstructorSpy;

		beforeEach(function() {
			app.lib.executor.BaseExecutor = sinon.spy(function(params) {
				this.project = params.project;
			});
			parentConstructorSpy = app.lib.executor.BaseExecutor;

			Executor = getExecutorConstructor(app);
		});

		after(function() {
			delete app.lib.command.BaseExecutor;
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

});
