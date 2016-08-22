'use strict';

var expect = require('expect.js'),
	sinon = require('sinon'),
	getNodeConstructor = require('../lib/node'),
	_ = require('underscore'),
	proxyquire = require('proxyquire');

describe('ssh node', function() {

	var app = {lib: {
		node: {BaseNode: _.noop}
	}};

	var makeNodeConstructor = function(app, Executor) {
		Executor = Executor || _.noop;

		var getConstructor = proxyquire('../lib/node', {
			'./executor': function(app) {
				return Executor;
			}
		});

		var Node = getConstructor(app);

		return Node;
	};

	describe('module', function() {
		it('should export function', function() {
			expect(getNodeConstructor).a(Function);
		});

		it('should export funct which accepts single arg', function() {
			expect(getNodeConstructor.length).equal(1);
		});

		var Constructor;

		it('should export func which called without errors', function() {
			Constructor = makeNodeConstructor(app);
		});

		it('should export func which returns node constructor', function() {
			expect(Constructor.super_).equal(app.lib.node.BaseNode);
		});
	});

	describe('constructor', function() {
		var Node, parentConstructorSpy;

		before(function() {
			parentConstructorSpy = sinon.stub(app.lib.node, 'BaseNode');

			Node = makeNodeConstructor(app);
		});

		after(function() {
			app.lib.node.BaseNode.restore();
		});

		it('should call parent constructor with params', function() {
			var params = {options: {}, name: 'someNode'},
				node = new Node(params);

			expect(parentConstructorSpy.calledOnce).equal(true);
			expect(parentConstructorSpy.getCall(0).args[0]).eql(params);
		});

		it('should remember options passed to constructor', function() {
			var params = {options: {opt1: 'ab'}, name: 'someNode'},
				node = new Node(params);

			expect(node.options).eql(params.options);
		});
	});

	describe('_createExecutor method', function() {
		var Node, node = {}, project = {name: 'proj1'}, ExecutorSpy;

		before(function() {
			ExecutorSpy = sinon.spy();
			Node = makeNodeConstructor(app, ExecutorSpy);

			node._createExecutor = Node.prototype._createExecutor;
			node.type = 'local';
			node.options = {someOpt: 'someOptVal'};
		});

		var result;

		it('should be executed without error', function() {
			result = node._createExecutor({project: project});
		});

		it('should create executor', function() {
			expect(ExecutorSpy.calledOnce).equal(true);
		});

		it('should create executor with options and project', function() {
			var args = ExecutorSpy.getCall(0).args;
			expect(args[0]).eql({
				type: node.type,
				project: project,
				options: node.options
			});
		});

		it('should return instance of executor', function() {
			expect(result).a(ExecutorSpy);
		});
	});
});
