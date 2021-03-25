define([
	'dojo/_base/declare',
	'TreeGridView/Scripts/Viewer/TgvTreeGrid'
], function (declare, TgvTreeGrid) {
	return declare(TgvTreeGrid, {
		customObject: null,

		_pathManager: null,

		constructor: function () {
			this._customObject = parent.customObject;
		},

		setPathManager: function (pathManager) {
			this._pathManager = pathManager;
		},

		addRows: function () {
			if (this._customObject.isToSkipModelLoading()) {
				return;
			}
			return this.inherited(arguments);
		},

		expandAll: function () {
			if (this.isToShowOnlyHeaders) {
				return;
			}
			const promise = this.inherited(arguments);
			const self = this;
			promise.then(function () {
				self._pathManager._callSelectByPathIfRequired();
			});
			return promise;
		},

		_expandRowWithDescendants: function () {
			if (this._customObject.isToSkipModelLoading()) {
				return;
			}
			return this.inherited(arguments);
		}
	});
});
