(function (externalParent) {
	function RelationshipFamilyModel(relationshipFamilyItemNode) {
		this._relationshipFamilyItemNode = relationshipFamilyItemNode;
	}
	RelationshipFamilyModel.prototype = {
		constructor: RelationshipFamilyModel,
		get relationshipFamilyItemNode() {
			return this._relationshipFamilyItemNode;
		},
		map: function (drUIRelationshipFamilyId, refIds) {
			const drFamilyElementQueryItemNode = this._relationshipFamilyItemNode.selectSingleNode(
				'Relationships/*/*/Item[parent_query_reference_ref_id="' +
					refIds[0] +
					'" and not(@action="delete")]'
			);

			if (drFamilyElementQueryItemNode) {
				const reusedNodes = drFamilyElementQueryItemNode.parentNode.selectNodes(
					'Item[not(@action="delete")]'
				);

				[].forEach.call(reusedNodes, function (reusedNode) {
					if (aras.isTempEx(reusedNode)) {
						reusedNode.parentNode.removeChild(reusedNode);
					} else {
						reusedNode.setAttribute('action', 'delete');
					}
				});
			}

			const drUIRelationshipFamilyNode = this._relationshipFamilyItemNode.selectSingleNode(
				'Relationships/Item[@id="' + drUIRelationshipFamilyId + '"]'
			);
			const drFamilyNode = [].find.call(
				this._relationshipFamilyItemNode.selectNodes(
					'Relationships/Item[@type="dr_FamilyElement"]'
				),
				function (drFamilyNode) {
					return (
						drUIRelationshipFamilyNode.getAttribute('id') ===
						aras.getItemProperty(drFamilyNode, 'dr_relationship_id')
					);
				}
			);
			const familyElement = aras.newIOMItem();

			familyElement.node = drFamilyNode;
			familyElement.dom = drFamilyNode.ownerDocument;

			const existingNodes = drFamilyNode.selectNodes(
				'Relationships/Item[not(@action="delete")]'
			);
			[].forEach.call(existingNodes, function (existingNode) {
				if (aras.isTempEx(existingNode)) {
					existingNode.parentNode.removeChild(existingNode);
				} else {
					existingNode.setAttribute('action', 'delete');
				}
			});
			refIds.forEach(function (reusedRefId) {
				const familyElementQueryItem = familyElement.createRelationship(
					'dr_FamilyElement qry_QueryItem',
					'add'
				);

				familyElementQueryItem.setProperty(
					'parent_query_reference_ref_id',
					reusedRefId
				);
			});
		},
		unMap: function (queryReferenceRefId) {
			const drFamilyElementQueryItemNode = this._relationshipFamilyItemNode.selectSingleNode(
				'Relationships/*/*/Item[parent_query_reference_ref_id="' +
					queryReferenceRefId +
					'" and not(@action="delete")]'
			);

			if (drFamilyElementQueryItemNode) {
				const reusedNodes = drFamilyElementQueryItemNode.parentNode.selectNodes(
					'Item[not(@action="delete")]'
				);

				[].forEach.call(reusedNodes, function (reusedNode) {
					if (aras.isTempEx(reusedNode)) {
						reusedNode.parentNode.removeChild(reusedNode);
					} else {
						reusedNode.setAttribute('action', 'delete');
					}
				});
			}
		}
	};
	externalParent.RelationshipFamilyModel = RelationshipFamilyModel;
})(window);
