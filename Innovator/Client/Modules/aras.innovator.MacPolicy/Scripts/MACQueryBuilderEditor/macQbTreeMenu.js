define(['dojo/_base/declare', 'QB/Scripts/qbTreeMenu'], function (
	declare,
	QbTreeMenu
) {
	let queryDefinition;

	const isLeaf = function (treeElement) {
		if (!treeElement.children) {
			return true;
		}

		const refId = treeElement.node.selectSingleNode('ref_id').text;
		const outgoingReferences = queryDefinition.selectNodes(
			`Relationships/Item[@type='qry_QueryReference' and not(@action='delete')]/parent_ref_id[text() = '${refId}']`
		).length;
		return outgoingReferences === 0;
	};

	return declare(QbTreeMenu, {
		constructor: function (qdItem) {
			queryDefinition = qdItem;
		},

		getReuseMenuItem: function (selectedTreeElement) {},

		getAddMenuItem: function (selectedTreeElement) {
			if (isLeaf(selectedTreeElement)) {
				return this.inherited(arguments);
			}
		}
	});
});
