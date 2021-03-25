ace.define(
	'ace/mode/conditionEditor_highlight_rules',
	[
		'require',
		'exports',
		'module',
		'ace/lib/oop',
		'ace/mode/text_highlight_rules'
	],
	function (require, exports, module) {
		'use strict';
		var oop = require('../lib/oop');
		var TextHighlightRules = require('./text_highlight_rules')
			.TextHighlightRules;
		var ConditionEditorHighlightRules = function () {
			var keywords = 'and|or|not';
			var operator = 'like|is null';
			var map = {
				keyword: keywords,
				'keyword.operator': operator
			};
			var keywordMapper = this.createKeywordMapper(map, 'identifier', true);
			this.$rules = {
				start: [
					{
						token: 'item',
						regex: /(([a-zA-Z0-9_]+|\[[0-9a-zA-Z _]+\])[\.])/
					},
					{
						token: 'string',
						start: "'",
						end: "'|$",
						next: [{ token: 'constant.char.escape', regex: /\\'/ }]
					},
					{
						token: 'constant.numeric',
						regex: '[+-]?\\d+(?:(?:\\.\\d*)?(?:[eE][+-]?\\d+)?)?\\b'
					},
					{
						token: keywordMapper,
						regex: /[a-zA-Z_$][a-zA-Z0-9\-_$]*\b/
					},
					{
						token: 'property',
						regex: /[a-zA-Z0-9_]+|\[[a-zA-Z0-9 _]+\]/
					},
					{
						token: 'keyword.operator',
						regex: '<|<=|=|>|>=|<>'
					}
				]
			};
			this.normalizeRules();
		};
		oop.inherits(ConditionEditorHighlightRules, TextHighlightRules);
		exports.ConditionEditorHighlightRules = ConditionEditorHighlightRules;
	}
);

ace.define(
	'ace/mode/conditionEditor',
	[
		'require',
		'exports',
		'module',
		'ace/lib/oop',
		'ace/mode/text',
		'ace/mode/conditionEditor_highlight_rules',
		'ace/worker/worker_client'
	],
	function (require, exports, module) {
		'use strict';

		var oop = require('../lib/oop');
		var TextMode = require('./text').Mode;
		var ConditionEditorHighlightRules = require('./conditionEditor_highlight_rules')
			.ConditionEditorHighlightRules;
		var WorkerClient = require('../worker/worker_client').WorkerClient;

		var Mode = function () {
			this.HighlightRules = ConditionEditorHighlightRules;
			this.$behaviour = this.$defaultBehaviour;
		};
		oop.inherits(Mode, TextMode);

		(function () {
			this.lineCommentStart = '--';

			this.createWorker = function (session) {
				var worker = new WorkerClient(
					['ace'],
					'ace/mode/conditionEditor_worker',
					'ConditionEditorWorker'
				);
				worker.attachToDocument(session.getDocument());

				worker.on('annotate', function (results) {
					session.setAnnotations(results.data);
				});

				worker.on('terminate', function () {
					session.clearAnnotations();
				});

				return worker;
			};

			this.$id = 'ace/mode/conditionEditor';
		}.call(Mode.prototype));

		exports.Mode = Mode;
	}
);
