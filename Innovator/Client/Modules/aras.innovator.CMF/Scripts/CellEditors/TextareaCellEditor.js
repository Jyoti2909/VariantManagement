define([
	'dojo/_base/declare',
	'dijit/TooltipDialog',
	'dojo/on',
	'dojo/keys',
	'./CellEditorBase',
	//we load Textarea and set domReady to prevent slow loading in method show and prevent sometimes: not selecting and not focusing.
	'dijit/form/Textarea',
	'dojo/domReady!'
], function (declare, TooltipDialog, on, keys, CellEditorBase) {
	var dojoEditor;

	return declare(CellEditorBase, {
		show: function (cell, onCellEditorClosed, isViewMode) {
			if (this.tooltipDialog) {
				//in IE 11 if to open popup and its scroller appears
				//(not enough space to show it, then scroller will not be hidden until user will close the page, not the tooltip)
				//it's a workaround to get rid of this for large by Y editors
				this.tooltipDialog.destroy();
			}
			this.tooltipDialog = new TooltipDialog({ id: 'textareaCellEditor' });

			var maxLength = cell.column.maxLength || '';
			var value;
			if (isViewMode && cell.column.label) {
				value =
					cell.column.label + ': <i>' + cell.element.textContent + '</i> ';
			} else {
				value = cell.element.textContent;
			}

			window.textareaCellEditorNamespace = {};

			if (isViewMode) {
				this.tooltipDialog.set(
					'content',
					'<span><pre>' + value + '</pre></span>'
				);
			} else {
				this.tooltipDialog.set(
					'content',
					"<input data-dojo-type='dijit/form/Textarea' " +
						(maxLength && "maxLength='" + maxLength + "'") +
						" data-dojo-id='textareaCellEditorNamespace.editor' style='width:400px;" +
						(cell.element.isEmpty ? " background-color: #EEE;'" : "'" + '>')
				);
			}

			this.inherited(arguments); //popup.open

			if (!isViewMode) {
				//fix editor width
				dojoEditor = textareaCellEditorNamespace.editor.domNode;
				var editorNode = this.tooltipDialog.domNode;
				var appLayout = document.getElementById('appLayout');
				var cellRect = cell.element.getClientRects();
				var width;
				var isRightToleft = editorNode.classList.contains(
					'dijitTooltipABRight'
				);
				var editorParentStyle = editorNode.parentNode.style;

				width = isRightToleft
					? cellRect[0].width / 2 + cellRect[0].left
					: appLayout.clientWidth - (cellRect[0].width / 2 + cellRect[0].left);
				editorParentStyle.width = width + 'px';
				editorParentStyle.maxWidth = '400px';
				editorParentStyle.minWidth = '150px';
				dojoEditor.style.width = '100%';

				//disable browser's menu, e.g., on RMB click.
				dojoEditor.parentElement.parentElement.parentElement.addEventListener(
					'contextmenu',
					function (menuEvent) {
						menuEvent.preventDefault();
						menuEvent.stopPropagation();
					},
					false
				);

				dojoEditor.value = value;
				dojoEditor.focus();
				dojoEditor.select();
			} else {
				return;
			}

			var handler = on(dojoEditor, 'keydown', function (event) {
				switch (event.keyCode) {
					case keys.ENTER:
						if (event.shiftKey) {
							//do nothing, it's multiline string
						} else {
							onCellEditorClosed();
						}

						break;
					case keys.ESCAPE:
						onCellEditorClosed(true);
						break;
					case keys.TAB:
						onCellEditorClosed(false, true);
						break;
				}
			});
			this.handlers.push(handler);
		},

		getValue: function () {
			return dojoEditor.value;
		}
	});
});
