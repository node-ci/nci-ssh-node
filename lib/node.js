'use strict';

var inherits = require('util').inherits,
	_ = require('underscore');

module.exports = function(app) {
	var ParentNode = app.lib.node.BaseNode,
		Executor = require('./executor')(app);

	function Node(params) {
		ParentNode.call(this, params);
		this.options = params.options;
	}

	inherits(Node, ParentNode);

	Node.prototype._createExecutor = function(params) {
		// fallback for _createExecutor which accepts only project
		if (params && !params.project) {
			params = {project: params};
		}

		return new Executor(_({
			type: this.type,
			options: this.options
		}).defaults(params));
	};

	return Node;
};
