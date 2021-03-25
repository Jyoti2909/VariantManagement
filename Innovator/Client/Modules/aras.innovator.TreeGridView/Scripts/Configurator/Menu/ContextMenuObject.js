define(function () {
	'use strict';
	var ContextMenuObject = (function () {
		function ContextMenuObject() {
			this.canCombineNodes = false;
			this.canExecuteAddColumn = false;
			this.canExecuteRenameColumn = false;
			this.canExecuteRemoveColumn = false;
			this.canExecuteHideUnmapped = false;
			this.canExecuteShowUnmapped = false;
			this.canExecuteMap = false;
			this.canShowMap = false;
			this.canExecuteUnmap = false;
			this.canShowUnmap = false;
			this.canExecuteCombine = false;
			this.canExecuteSeparate = false;
			this.canExecuteMultipleMap = false;
			this.canExecuteMultipleUnmap = false;
			this.canShowMultipleMap = false;
			this.canShowMultipleUnmap = false;
		}
		return ContextMenuObject;
	})();
	return ContextMenuObject;
});
