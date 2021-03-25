define(['dojo/_base/declare', 'dijit/TooltipDialog', 'dijit/popup'], function (
	declare,
	TooltipDialog,
	popup
) {
	return declare('Aras.Client.Controls.TechDoc.Helper.CharacterHelper', null, {
		_tooltip: null,
		_popupapi: null,

		constructor: function (args) {
			this._viewmodel = args.viewmodel;
			this._popupapi = popup;
		},

		_getTooltipMarkup: function () {
			var chars = ['©', '®', '±', '∞', '≤', '≥', 'Ω', '°', '½'];
			var result = '';
			var charSymbol;
			var i;

			for (i = 0; i < chars.length; i++) {
				charSymbol = chars[i];

				result +=
					'<button data-dojo-type="dijit/form/Button" type="button">' +
					charSymbol +
					'<script type="dojo/method" data-dojo-event="onClick" data-dojo-args="evt">' +
					'var dialog = dijit.popup.getTopPopup();' +
					'if (dialog && dialog.onExecute) dialog.onExecute("' +
					charSymbol +
					'");' +
					'</script>' +
					'</button>';
			}

			return result;
		},

		_initTooltip: function (id, content) {
			var self = this;
			var tooltip = new TooltipDialog({
				id: id,
				content: content,
				onMouseLeave: function () {
					self._popupapi.close(tooltip);
				}
			});

			this._tooltip = tooltip;
		},

		_isInit: function () {
			return !!this._tooltip;
		},

		ShowCharacterTable: function (btnNode) {
			var self = this;

			if (!this._isInit()) {
				this._initTooltip('charsTable', this._getTooltipMarkup());
			}

			function pasteSymbol(char) {
				var viewmodel = self._viewmodel;
				var _cursor = viewmodel.Cursor();
				var isCollapsed = _cursor.collapsed;
				var startItem = _cursor.start;
				var ancesstorItem = _cursor.commonAncestor;

				viewmodel.SuspendInvalidation();

				if (ancesstorItem && ancesstorItem.is('ArasTextXmlSchemaElement')) {
					ancesstorItem.InsertText(char);
				} else if (ancesstorItem || startItem) {
					if (!isCollapsed) {
						_cursor.DeleteContents();
					}

					if (_cursor.collapsed) {
						var selectedItem = _cursor.commonAncestor;

						if (selectedItem && selectedItem.is('XmlSchemaText')) {
							var insertPosition = _cursor.startOffset;
							var stringBeforeEditing = selectedItem.Text();
							var stringAfterEditing = [
								stringBeforeEditing.slice(0, insertPosition),
								char,
								stringBeforeEditing.slice(insertPosition)
							].join('');
							selectedItem.Text(stringAfterEditing);

							_cursor.Set(
								selectedItem,
								insertPosition + 1,
								selectedItem,
								insertPosition + 1
							);
						}
					}
				}

				viewmodel.ResumeInvalidation();
			}

			this._popupapi.open({
				popup: this._tooltip,
				around: btnNode,
				orient: ['below-centered', 'above-centered'],
				onExecute: pasteSymbol
			});
		}
	});
});
