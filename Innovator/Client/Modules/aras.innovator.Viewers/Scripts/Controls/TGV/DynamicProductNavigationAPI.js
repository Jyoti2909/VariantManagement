define(['dojo/_base/declare'], function (declare) {
	return declare([], {
		constructor: function (mainPageExtension) {
			this.getRootItemTypeName = function () {
				return mainPageExtension.getRootItemTypeName();
			};

			this.addModel = function (itemIds) {
				mainPageExtension.addModel(itemIds);
			};

			this.removeModel = function (gridData) {
				if (gridData.focus && gridData.focus.length) {
					const selectedRowDataAsStr = gridData.focus[0].cell.data;
					const selectedRowData = JSON.parse(selectedRowDataAsStr);
					mainPageExtension.removeModel(selectedRowData.id);
				}
			};
		}
	});
});
