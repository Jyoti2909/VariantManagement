define([
	'Vendors/peg-0.10.0.min',
	'dojo/text!QB/Scripts/ConditionEditor/conditionsTreeGrammar.pegjs'
], function (pegjs, grammar) {
	'use strict';
	return pegjs.generate(grammar);
});
