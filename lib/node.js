'use strict';

var inherits = require('util').inherits;

module.exports = function(app) {
	var ParentNode = app.lib.node.BaseNode,
		Executor = require('./executor')(app);

	function Node(params) {
		ParentNode.call(this, params);
		this.options = params.options;
	}

	inherits(Node, ParentNode);

	Node.prototype._createExecutor = function(project) {
		return new Executor({
			type: this.type,
			project: project,
			options: this.options
		});
	};

	return Node;
};
