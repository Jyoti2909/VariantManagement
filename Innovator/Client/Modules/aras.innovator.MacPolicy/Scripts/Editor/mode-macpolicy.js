/* global ace */
ace.define(
	'ace/mode/macpolicy_highlight_rules',
	[
		'require',
		'exports',
		'module',
		'ace/lib/oop',
		'ace/mode/text_highlight_rules'
	],
	function (require, exports, module) {
		'use strict';
		const oop = require('../lib/oop');
		const TextHighlightRules = require('./text_highlight_rules')
			.TextHighlightRules;
		const MacPolicyHighlightRules = function () {
			this.$rules = {
				start: [
					{
						token: 'item.function',
						start: '[a-zA-Z0-9\\-_]{1,}([\\.][a-zA-Z0-9\\-_]{1,})*\\(',
						end: '\\)',
						next: [
							{
								token: ['item.name', 'item.property'],
								regex:
									'([a-zA-Z_]{1,}[\\.]|[\\[]{1}[a-zA-Z _]{1,}[\\]]{1}[\\.])([a-zA-Z0-9\\-_]{1,}|[\\[]{1}[a-zA-Z0-9\\- _]{1,}[\\]]?|)'
							},
							{
								token: 'string',
								start: "'",
								end: "'|$",
								next: [{ token: 'constant.char.escape', regex: /\\'/ }]
							}
						]
					},
					{
						token: ['item.name', 'item.property'],
						regex:
							'([a-zA-Z_]{1,}[\\.]|[\\[]{1}[a-zA-Z _]{1,}[\\]]{1}[\\.])([a-zA-Z0-9\\-_]{1,}|[\\[]{1}[a-zA-Z0-9\\- _]{1,}[\\]]?|)'
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
						token: 'keyword.operator',
						regex: '<|<=|=|>|>=|<>|LIKE|IS NULL'
					},
					{
						token: 'keyword',
						regex: 'AND|OR|NOT'
					}
				]
			};
			this.normalizeRules();
		};
		oop.inherits(MacPolicyHighlightRules, TextHighlightRules);
		exports.MacPolicyHighlightRules = MacPolicyHighlightRules;
	}
);

ace.define(
	'ace/mode/macpolicy',
	[
		'require',
		'exports',
		'module',
		'ace/lib/oop',
		'ace/mode/text',
		'ace/mode/macpolicy_highlight_rules',
		'ace/worker/worker_client'
	],
	function (require, exports, module) {
		'use strict';

		const oop = require('../lib/oop');
		const TextMode = require('./text').Mode;
		const MacPolicyHighlightRules = require('./macpolicy_highlight_rules')
			.MacPolicyHighlightRules;
		const WorkerClient = require('../worker/worker_client').WorkerClient;

		const Mode = function () {
			this.HighlightRules = MacPolicyHighlightRules;
			this.$behaviour = this.$defaultBehaviour;
		};
		oop.inherits(Mode, TextMode);

		(function () {
			this.lineCommentStart = '--';

			this.createWorker = function (session) {
				const worker = new WorkerClient(
					['ace'],
					'ace/mode/macpolicy_worker',
					'MacPolicyWorker'
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

			this.$id = 'ace/mode/macpolicy';
		}.call(Mode.prototype));

		exports.Mode = Mode;
	}
);
