/* global define */
define(['dojo/_base/declare'], function (declare) {
	return declare('qbTreeEnum', [], {
		constructor: function () {},

		TreeModelType: {
			RootItemType: 1,
			PropertyItem: 2,
			RelationshipItem: 4,
			RelatedItem: 8,
			RecursionItem: 16,
			WhereUsedItem: 32,
			EmptyRootItemType: 64,
			CustomJoinItem: 128
		}
	});
});
