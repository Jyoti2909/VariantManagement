define(['dojo/_base/declare'], function (declare) {
	return declare(null, {
		constructor: function (parser, options) {
			this._parser = parser;
			this._options = options;
			this.lang = ace.require('ace/lib/lang');
			this.Range = ace.require('ace/range').Range;
		},
		getCompletions: function (editor, session, pos, prefix, callback) {
			var value = editor.getValue();
			var index = session.doc.positionToIndex(editor.getCursorPosition());
			value = value.substring(0, index) + '\0';
			try {
				this._parser.parse(value);
			} catch (e) {
				var self = this;
				var completes = this._options.grammarCompleters;
				if (!completes) {
					return;
				}
				var completer = {
					insertMatch: function (editor, data) {
						var pos = editor.getCursorPosition();
						var tokenRange = new self.Range(
							pos.row,
							e.location.start.column - 1,
							pos.row,
							pos.column
						);
						editor.session.replace(tokenRange, data.originalValue);
					}
				};
				var visitedExpectations = {};
				e.expected.forEach(function (exp) {
					var expectationName = exp.description;
					var completesList = completes[expectationName];
					if (!completesList || visitedExpectations[expectationName]) {
						//note: expactations with same name may occurs more than once
						return;
					}
					visitedExpectations[expectationName] = true;
					callback(
						null,
						completesList.map(function (complete) {
							var docHTML;
							if (complete.type && complete.description) {
								docHTML =
									'<b>Type: ' +
									self.lang.escapeHTML(complete.type) +
									'</b><hr></hr>' +
									self.lang.escapeHTML(complete.description);
							} else if (complete.type && !complete.description) {
								docHTML =
									'<b>Type: ' + self.lang.escapeHTML(complete.type) + '</b>';
							}
							return {
								caption: complete.label,
								value: complete.filterableValue || complete.value,
								originalValue: complete.value,
								meta: complete.meta || exp.description,
								completer: completer,
								docHTML: docHTML
							};
						})
					);
				});
			}
		}
	});
});
