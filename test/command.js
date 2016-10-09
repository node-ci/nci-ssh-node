'use strict';

var expect = require('expect.js'),
	sinon = require('sinon'),
	_ = require('underscore'),
	getCommandConstructor = require('../lib/command');

describe('ssh shell command', function() {

	var app = {lib: {command: {SpawnCommand: _.noop}}};
	
	var SpawnCommand = app.lib.command.SpawnCommand;

	describe('module', function() {
		it('should export function', function() {
			expect(getCommandConstructor).a(Function);
		});

		it('should export func which accepts single arg', function() {
			expect(getCommandConstructor.length).equal(1);
		});

		var Constructor;

		it('should export func which called without errors', function() {
			Constructor = getCommandConstructor(app);
		});

		it('should export func which returns command constructor', function() {
			expect(Constructor.super_).equal(app.lib.command.SpawnCommand);
		});
	});

	describe('constructor', function() {
		var Command, parentConstructorSpy;

		before(function() {
			parentConstructorSpy = sinon.spy(app.lib.command, 'SpawnCommand');
		});

		beforeEach(function() {
			parentConstructorSpy.reset();

			Command = getCommandConstructor(app);
		});

		after(function() {
			app.lib.command.SpawnCommand.restore();
		});

		it('should call parent constructor', function() {
			var command = new Command({});
			expect(parentConstructorSpy.calledOnce).equal(true);
		});

		it('should call parent constructor with params', function() {
			var params = {collectOut: true},
				command = new Command(params);

			expect(parentConstructorSpy.getCall(0).args[0]).eql(params);
		});

		it('should set shell by default to /bin/sh', function() {
			var command = new Command({});
			expect(command.shell).equal('/bin/sh');
		});

		it('should allow set another shell', function() {
			var command = new Command({shell: '/bin/bash'});
			expect(command.shell).equal('/bin/bash');
		});
	});

	describe('set params', function() {
		var Command, parentSetParamsSpy;

		beforeEach(function() {
			SpawnCommand.prototype.setParams = function(params) {
				if (params.cwd) this.cwd = params.cwd;
			};

			parentSetParamsSpy = sinon.spy(SpawnCommand.prototype, 'setParams');

			Command = getCommandConstructor(app);
		});

		after(function() {
			delete SpawnCommand.prototype.setParams;
		});

		it('should call parent set params', function() {
			var command = new Command({});
			command.setParams({});
			expect(parentSetParamsSpy.calledOnce).equal(true);
		});

		it('should call parent set params with params', function() {
			var params = {opt: '1'},
				command = new Command({});

			command.setParams(params);
			expect(parentSetParamsSpy.getCall(0).args[0]).eql(params);
		});

		it('should rename cwd to _cwd', function() {
			var command = new Command({});
			command.setParams({cwd: '/tmp'});
			expect(command).not.have.key('cwd');
			expect(command._cwd).equal('/tmp');
		});

		it('should allow set host', function() {
			var command = new Command({});
			command.setParams({host: '192.168.0.1'});
			expect(command.host).equal('192.168.0.1');
		});

		it('should allow set port', function() {
			var command = new Command({});
			command.setParams({port: 1122});
			expect(command.port).equal(1122);
		});

		it('should allow set user', function() {
			var command = new Command({});
			command.setParams({user: 'ci'});
			expect(command.user).equal('ci');
		});

		it('should allow set identity file', function() {
			var command = new Command({});
			command.setParams({identityFile: '~/.id_rsa_01'});
			expect(command.identityFile).equal('~/.id_rsa_01');
		});

		it('should allow set additional args', function() {
			var command = new Command({});
			command.setParams({args: ['-Y', '-q']});
			expect(command.args).eql(['-Y', '-q']);
		});

		it('should not allow set arbitrary option', function() {
			var command = new Command({});
			command.setParams({someOption: '123'});
			expect(command).not.have.key('someOption');
		});
	});

	describe('run method', function() {
		var Command, runSpy, parentCommnadRunResult = {};

		beforeEach(function() {
			SpawnCommand.prototype.run = sinon.spy(function() {
				return parentCommnadRunResult;
			});
			runSpy = SpawnCommand.prototype.run;

			Command = getCommandConstructor(app);
		});

		after(function() {
			delete SpawnCommand.prototype.run;
		});

		it('should return result of run method of parent command', function() {
			var command = new Command({});
			var cmd = command.run({cmd: 'beep', args: ['1', '2']});

			expect(cmd).equal(parentCommnadRunResult);
		});

		it('should pass callback to parent run method', function() {
			var command = new Command({}),
				callback = function() {};
			command.run({cmd: 'beep', args: ['1', '2']}, callback);

			expect(runSpy.getCall(0).args[1]).equal(callback);
		});

		it('should pass options (except cwd) to parent run method', function() {
			var command = new Command({});
			command.run({cmd: 'beep', args: ['1', '2'], options: {
				foo: '1',
				bar: '2',
				cwd: '/tmp'
			}});

			var params = runSpy.getCall(0).args[0];
			expect(params.options).eql({foo: '1', bar: '2'});
		});

		it('should always call ssh client', function() {
			var command = new Command({});
			command.run({cmd: 'beep', args: ['1', '2']});

			var params = runSpy.getCall(0).args[0];
			expect(params.cmd).equal('ssh');
		});

		it('should always add and force identity file to command', function() {
			var command = new Command({});
			command.identityFile = '~/.ssh/id_rsa_01';
			command.run({cmd: 'beep', args: ['1', '2']});

			var params = runSpy.getCall(0).args[0];
			expect(params.args[0]).equal('-i');
			expect(params.args[1]).equal('~/.ssh/id_rsa_01');
			expect(params.args[2]).equal('-o');
			expect(params.args[3]).equal('IdentitiesOnly=yes');
		});

		it('should always add batch mode to command', function() {
			var command = new Command({});
			command.run({cmd: 'beep', args: ['1', '2']});

			var params = runSpy.getCall(0).args[0];
			expect(params.args[4]).equal('-o');
			expect(params.args[5]).equal('BatchMode=yes');
		});

		it('should always disable pseudo-tty allocation', function() {
			var command = new Command({});
			command.run({cmd: 'beep', args: ['1', '2']});

			var params = runSpy.getCall(0).args[0];
			expect(params.args[6]).equal('-T');
		});

		it('should optionally add port to command', function() {
			var command = new Command({});
			command.port = 1122;
			command.run({cmd: 'beep', args: ['1', '2']});

			var params = runSpy.getCall(0).args[0];
			expect(params.args[7]).equal('-p');
			expect(params.args[8]).equal(1122);
		});

		it('should optionally add arbitrary args to command', function() {
			var command = new Command({});
			command.args = ['-Y', '-q'];
			command.run({cmd: 'beep', args: ['1', '2']});

			var params = runSpy.getCall(0).args[0];
			expect(params.args[7]).equal('-Y');
			expect(params.args[8]).equal('-q');
		});

		it('should always add user and host to command', function() {
			var command = new Command({});
			command.host = '192.168.0.1';
			command.user = 'nci';
			command.run({cmd: 'beep', args: ['1', '2']});

			var params = runSpy.getCall(0).args[0];
			expect(params.args[7]).equal('nci@192.168.0.1');
		});

		it('should run remote command in a shell', function() {
			var command = new Command({});
			command.run({cmd: 'beep', args: ['1', '2']});

			var params = runSpy.getCall(0).args[0],
				cmd = params.args[params.args.length - 1];
			expect(cmd).eql('/bin/sh -c \'beep "1" "2"\'');
		});

		it('should pass options cwd as cd to command', function() {
			var command = new Command({});
			command.run({cmd: 'beep', args: ['1', '2'], options: {
				cwd: '/tmp'
			}});

			var params = runSpy.getCall(0).args[0],
				cmd = params.args[params.args.length - 1];
			expect(cmd).match(new RegExp(' -c \'cd "/tmp" && '));
		});

		it('should pass _cwd as cd to command', function() {
			var command = new Command({});
			command._cwd = '/tmp';
			command.run({cmd: 'beep', args: ['1', '2']});

			var params = runSpy.getCall(0).args[0],
				cmd = params.args[params.args.length - 1];
			expect(cmd).match(new RegExp(' -c \'cd "/tmp" && '));
		});

		it('should escape duoble quotes inside args', function() {
			var command = new Command({});
			command.run({cmd: 'beep', args: ['1"2', '3']});

			var params = runSpy.getCall(0).args[0],
				cmd = params.args[params.args.length - 1];
			expect(cmd).contain('beep "1\\"2" "3"');
		});

		it('should escape single quotes inside cmd', function() {
			var command = new Command({});
			command.run({cmd: 'beep "1\'2"'});

			var params = runSpy.getCall(0).args[0],
				cmd = params.args[params.args.length - 1];
			expect(cmd).contain('beep "1\'\'2"');
		});

		it('should remove line breaks from cmd', function() {
			var command = new Command({});
			command.run({cmd: 'beep \n boop'});

			var params = runSpy.getCall(0).args[0],
				cmd = params.args[params.args.length - 1];
			expect(cmd).contain('beep  boop');
		});

		it('should work in general', function() {
			var command = new Command({});
			command.host = '192.168.0.1';
			command.user = 'nci';
			command.identityFile = '~/.ssh/id_rsa_01';
			command.run({cmd: 'beep', args: ['1', '2']});

			var params = runSpy.getCall(0).args[0];
			expect(params.cmd).equal('ssh');
			expect(params.args).eql([
				'-i', '~/.ssh/id_rsa_01',
				'-o', 'IdentitiesOnly=yes',
				'-o', 'BatchMode=yes',
				'-T',
				'nci@192.168.0.1',
				'/bin/sh -c \'beep "1" "2"\''
			]);
		});

	});

});
