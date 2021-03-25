/* global define */
define(['dojo/_base/declare'], function (declare) {
	return declare('AdminEnum', [], {
		constructor: function () {},

		TreeModelType: {
			ContentType: 1,
			ElementFolder: 2,
			ElementBindingType: 4,
			PropertyType: 5,
			ElementType: 10,

			ViewFolder: 20,
			BaseView: 21,

			ColumnFolder: 30,
			TabularViewColumn: 31,

			TreeFolder: 40,
			TabularViewTree: 41,

			HeaderRowsFolder: 50,
			TabularViewHeaderRows: 51,

			ExportFolder: 60,
			ExportToExcelElement: 61
		}
	});
});
