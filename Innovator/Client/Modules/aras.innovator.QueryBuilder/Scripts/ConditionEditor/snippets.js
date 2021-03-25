define(['dojo/_base/declare'], function (declare) {
	var snippets = {
		and: '(${CURRENTLINE_TEXT_RANGE:${SELECTED_TEXT}}) AND (${0})',
		or: '(${CURRENTLINE_TEXT_RANGE:${SELECTED_TEXT}}) OR (${0})',
		not: 'NOT(${0:${CURRENTLINE_TEXT_RANGE:${SELECTED_TEXT}}})'
	};
	return declare(null, {
		constructor: function (snippetManager) {
			if (!snippetManager) {
				return;
			}
			snippetManager.variables.CURRENTLINE_TEXT_RANGE = function (
				editor,
				varname
			) {
				if (!editor.session.getTextRange()) {
					var currentRow = editor.getCursorPosition().row;
					var range = editor.selection.getLineRange(currentRow, true);
					editor.selection.setRange(range);

					return editor.session.getLine(currentRow);
				}
			};
		},
		getSnippets: function () {
			return snippets;
		}
	});
});
