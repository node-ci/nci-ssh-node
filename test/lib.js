'use strict';

var expect = require('expect.js'),
	sinon = require('sinon'),
	libModule = require('../lib'),
	_ = require('underscore'),
	proxyquire = require('proxyquire');

describe('lib', function() {

	var app = {lib: {node: {
		register: _.noop
	}}};

	var makeLibModule = function(app, Node) {
		return proxyquire('../lib', {
			'./node': function(app) {
				return Node;
			}
		});
	};

	describe('module', function() {
		it('should export register function', function() {
			expect(libModule.register).a(Function);
		});

		it('should export funct which accepts single arg', function() {
			expect(libModule.register.length).equal(1);
		});
	});

	describe('register function', function() {
		var register, registerSpy, createNodeSpy, Node = _.noop;

		before(function() {
			createNodeSpy = sinon.spy(function() {
				return Node;
			});

			register = proxyquire('../lib', {
				'./node': createNodeSpy
			}).register;

			registerSpy = sinon.spy(app.lib.node, 'register');
		});

		after(function() {
			app.lib.node.register.restore();
		});

		it('should be executed without errors', function() {
			register(app);
		});

		it('should call create node', function() {
			expect(createNodeSpy.calledOnce).equal(true);
		});

		it('should call create node with app', function() {
			expect(createNodeSpy.getCall(0).args).eql([app]);
		});

		it('should call node register', function() {
			expect(registerSpy.calledOnce).equal(true);
		});

		it('should call node register with type and costructor', function() {
			expect(registerSpy.getCall(0).args).eql(['ssh', Node]);
		});
	});
});
