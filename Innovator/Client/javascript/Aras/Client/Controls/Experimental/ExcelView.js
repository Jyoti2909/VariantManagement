define([
	'dojo/_base/declare',
	'dojox/grid/_View',
	'./ExcelContentBuilder'
], function (declare, _View, ExcelContentBuilder) {
	return declare('Aras.Client.Controls.Experimental.ExcelView', _View, {
		// override _contentBuilderClass
		_contentBuilderClass: ExcelContentBuilder,

		getCellNode: function (inRowIndex, inCellIndex) {
			var row = this.getRowNode(inRowIndex);
			if (row) {
				return this.content.getCellNode(row, inCellIndex);
			}
		}
	});
});
