'use strict';

var expect = require('expect.js'),
	sinon = require('sinon'),
	getCommandConstructor = require('../lib/command');

describe('ssh shell command', function() {

	function SpawnCommand() {
	}

	SpawnCommand.prototype.setParams = function() {};

	var app = {lib: {command: {SpawnCommand: SpawnCommand}}};

	describe('run method', function() {
		var Command, runSpy;

		beforeEach(function() {
			SpawnCommand.prototype.run = sinon.spy(); 
			runSpy = SpawnCommand.prototype.run;

			Command = getCommandConstructor(app);
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
			command.setParams({
				identityFile: '~/.ssh/id_rsa_01'
			});
			command.run({cmd: 'beep', args: ['1', '2']});

			var params = runSpy.getCall(0).args[0];
			expect(params.args[0]).equal('-i');
			expect(params.args[1]).equal('~/.ssh/id_rsa_01');
			expect(params.args[2]).equal('-o');
			expect(params.args[3]).equal('IdentitiesOnly=yes');
		});

		it('should always disable pseudo-tty allocation', function() {
			var command = new Command({});
			command.run({cmd: 'beep', args: ['1', '2']});

			var params = runSpy.getCall(0).args[0];
			expect(params.args[4]).equal('-T');
		});

		it('should optionally add port to command', function() {
			var command = new Command({});
			command.setParams({
				port: 1122
			});
			command.run({cmd: 'beep', args: ['1', '2']});

			var params = runSpy.getCall(0).args[0];
			expect(params.args[5]).equal('-p');
			expect(params.args[6]).equal(1122);
		});

		it('should optionally add arbitrary args to command', function() {
			var command = new Command({});
			command.setParams({
				args: ['-Y', '-q']
			});
			command.run({cmd: 'beep', args: ['1', '2']});

			var params = runSpy.getCall(0).args[0];
			expect(params.args[5]).equal('-Y');
			expect(params.args[6]).equal('-q');
		});

		it('should always add user and host to command', function() {
			var command = new Command({});
			command.setParams({
				host: '192.168.0.1',
				user: 'nci'
			});
			command.run({cmd: 'beep', args: ['1', '2']});

			var params = runSpy.getCall(0).args[0];
			expect(params.args[5]).equal('nci@192.168.0.1');
		});

		it('should run remote command in a shell', function() {
			var command = new Command({});
			command.run({cmd: 'beep', args: ['1', '2']});

			var params = runSpy.getCall(0).args[0],
				cmd = params.args[params.args.length - 1];
			expect(cmd).eql('/bin/sh -c \'beep "1" "2"\'');
		});

		it('should set /bin/sh as default shell', function() {
			var command = new Command({});
			command.run({cmd: 'beep', args: ['1', '2']});

			var params = runSpy.getCall(0).args[0],
				cmd = params.args[params.args.length - 1];
			expect(cmd).match(new RegExp('^/bin/sh '));
		});

		it('should allow to pass another shell', function() {
			var command = new Command({
				shell: '/bin/bash'
			});
			command.run({cmd: 'beep', args: ['1', '2']});

			var params = runSpy.getCall(0).args[0],
				cmd = params.args[params.args.length - 1];
			expect(cmd).match(new RegExp('^/bin/bash '));
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
			command.setParams({
				host: '192.168.0.1',
				user: 'nci',
				identityFile: '~/.ssh/id_rsa_01'
			});
			command.run({cmd: 'beep', args: ['1', '2']});

			var params = runSpy.getCall(0).args[0];
			expect(params.cmd).equal('ssh');
			expect(params.args).eql([
				'-i', '~/.ssh/id_rsa_01',
				'-o', 'IdentitiesOnly=yes',
				'-T',
				'nci@192.168.0.1',
				'/bin/sh -c \'beep "1" "2"\''
			]);
		});

	});

});
