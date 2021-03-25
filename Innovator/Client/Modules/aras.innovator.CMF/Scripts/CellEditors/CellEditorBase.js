define(['dojo/_base/declare', 'dijit/TooltipDialog', 'dijit/popup'], function (
	declare,
	TooltipDialog,
	popup
) {
	return declare(null, {
		_tooltipElement: null,

		_tooltipDialog: null,

		handlers: [],

		isHidden: false,

		// flag: do i need to close the editor on blur
		hideOnBlur: true,

		show: function (cell, onOkClicked, isViewMode) {
			var toOpen = {
				popup: this.tooltipDialog,
				around: isViewMode ? cell.element : cell.element.firstChild
			};

			popup.open(toOpen);
		},

		hide: function () {
			this.handlers.map(function (handler) {
				handler.remove();
			});
			this.handlers.length = 0;

			if (this.tooltipDialog) {
				popup.close(this.tooltipDialog);
			}
		}
	});
});
