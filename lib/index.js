'use strict';

exports.register = function(app) {
	var Node = require('./node')(app);

	app.lib.node.register('ssh', Node);
};
