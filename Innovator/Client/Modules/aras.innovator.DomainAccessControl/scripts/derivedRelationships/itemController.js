(function (externalParent) {
	function ItemController() {}

	ItemController.prototype = {
		constructor: ItemController,
		set dRFItem(item) {
			this._dRFItem = item;
		},
		get dRFItem() {
			return this._dRFItem;
		},
		setViewModeOnRelationships: function setViewModeOnRelationships() {
			const relationships = window.relationships;
			const relationshipsIFrame =
				relationships && document.getElementById(relationships.currTabID);

			if (
				relationshipsIFrame &&
				relationshipsIFrame.contentWindow &&
				relationshipsIFrame.contentWindow.grid
			) {
				window.relationships.setViewMode();
				return;
			}
			// HACK: repeat the function till window.relationships is created
			setTimeout(setViewModeOnRelationships, 0);
		},
		onBeforeAction: function (isSave) {
			const dRFItem = this.dRFItem;

			const uiItems = [].map.call(
				dRFItem.selectNodes(
					'Relationships/Item[@type="dr_UI_RelationshipFamily"]'
				),
				function (drUIRelationshipFamilyNode) {
					return drUIRelationshipFamilyNode.parentNode.removeChild(
						drUIRelationshipFamilyNode
					);
				}
			);

			if (!isSave) {
				return;
			}
			uiItems.forEach(function (drUIRelationshipFamilyNode) {
				if (drUIRelationshipFamilyNode.getAttribute('isDirty') === '1') {
					if (drUIRelationshipFamilyNode.getAttribute('action') === 'delete') {
						return;
					}

					const id = drUIRelationshipFamilyNode.getAttribute('id');
					let drRelationshipNode = dRFItem.selectSingleNode(
						'Relationships/Item/dr_relationship_id/Item[@id="' + id + '"]'
					);

					if (!drRelationshipNode) {
						const drFamilyNode = dRFItem.selectSingleNode(
							'Relationships/Item[dr_relationship_id="' + id + '"]'
						);

						drRelationshipNode =
							aras.itemsCache.getItem(id) ||
							aras.getItemById('dr_Relationship', id);
						aras.setItemProperty(
							drRelationshipNode,
							'name',
							aras.getItemProperty(drUIRelationshipFamilyNode, 'name')
						);
						aras.setItemProperty(
							drRelationshipNode,
							'destination_itemtype_id',
							aras.getItemProperty(
								drUIRelationshipFamilyNode,
								'destination_itemtype_id'
							)
						);
						aras.setItemProperty(
							drRelationshipNode,
							'description',
							aras.getItemProperty(drUIRelationshipFamilyNode, 'description')
						);
						drRelationshipNode.setAttribute('action', 'merge');
						aras.setItemProperty(
							drFamilyNode,
							'dr_relationship_id',
							drRelationshipNode
						);
					}
					aras.setItemProperty(drRelationshipNode, 'implementation_query', '');
					drUIRelationshipFamilyNode.removeAttribute('isDirty');
				}
			});
		},
		onAfterAction: function () {
			const dRFItem = this._dRFItem;
			const drFamilyNodes = dRFItem.selectNodes(
				'Relationships/Item[@type="dr_FamilyElement"]'
			);
			const idList = [].map.call(drFamilyNodes, function (drFamilyNode) {
				return aras.getItemProperty(drFamilyNode, 'dr_relationship_id');
			});

			if (!idList) {
				return;
			}
			const drRelationshipFamilyItem = aras.newIOMItem();

			drRelationshipFamilyItem.node = dRFItem;
			drRelationshipFamilyItem.dom = dRFItem.ownerDocument;

			[].forEach.call(idList, function (id) {
				const drRelationshipItem =
					aras.itemsCache.getItem(id) ||
					aras.getItemById('dr_Relationship', id) ||
					dRFItem.selectSingleNode(
						'Relationships/Item/dr_relationship_id/Item[@id="' + id + '"]'
					);
				if (drRelationshipItem) {
					const drRelationshipId = drRelationshipItem.getAttribute('id');
					const name = aras.getItemProperty(drRelationshipItem, 'name');
					const rootItemType = aras.getItemTypeForClient(
						aras.getItemProperty(drRelationshipItem, 'departure_itemtype_id'),
						'id'
					);
					const destinationItemType = aras.getItemTypeForClient(
						aras.getItemProperty(drRelationshipItem, 'destination_itemtype_id'),
						'id'
					);
					const drUIRelationshipFamilyItem = aras.newIOMItem(
						'dr_UI_RelationshipFamily'
					);

					drRelationshipFamilyItem.addRelationship(drUIRelationshipFamilyItem);
					drUIRelationshipFamilyItem.setID(drRelationshipId);
					drUIRelationshipFamilyItem.setProperty('name', name);
					drUIRelationshipFamilyItem.setPropertyItem(
						'departure_itemtype_id',
						rootItemType
					);
					drUIRelationshipFamilyItem.setPropertyItem(
						'destination_itemtype_id',
						destinationItemType
					);
					drUIRelationshipFamilyItem.setProperty(
						'description',
						aras.getItemProperty(drRelationshipItem, 'description')
					);
				}
			});
		},
		validate: function () {
			const dRFItem = this._dRFItem;
			const drUIRelationshipFamilyNodes = dRFItem.selectNodes(
				'Relationships/Item[@type="dr_UI_RelationshipFamily" and not(@action="delete")]'
			);

			const unMapped = [].reduce.call(
				drUIRelationshipFamilyNodes,
				function (arr, drUIRelationshipFamilyNode) {
					const drFamilyElementNode =
						dRFItem.selectSingleNode(
							'Relationships/Item[dr_relationship_id="' +
								drUIRelationshipFamilyNode.getAttribute('id') +
								'"]'
						) ||
						dRFItem.selectSingleNode(
							'Relationships/Item/dr_relationship_id/Item[@id="' +
								drUIRelationshipFamilyNode.getAttribute('id') +
								'"]'
						).parentNode.parentNode;
					const drFamilyElementQueryItemNode = drFamilyElementNode.selectSingleNode(
						'Relationships/Item[not(@action="delete")]'
					);

					if (!drFamilyElementQueryItemNode) {
						arr.push(aras.getItemProperty(drUIRelationshipFamilyNode, 'name'));
					}
					return arr;
				},
				[]
			);

			return {
				isValid: unMapped.length === 0,
				unMapped: unMapped
			};
		}
	};
	externalParent.ItemController = ItemController;
})(window);
