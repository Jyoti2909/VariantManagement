define([
	'DomainAccessControl/scripts/domainaccesscontrol/DerivedRelationshipList'
], function (DerivedRelationshipList) {
	'use strict';
	const prepareDataForNav = function (item) {
		const relationshipFamilyId = aras.getItemProperty(
			item,
			'dr_relationshipfamily_id'
		);
		const relationshipFamily =
			aras.itemsCache.getItem(relationshipFamilyId) ||
			aras.getItemById('dr_RelationshipFamily', relationshipFamilyId);
		const familyElements =
			aras.getItemRelationshipsEx(
				relationshipFamily,
				'dr_FamilyElement',
				null,
				null,
				'',
				false
			) || [];
		const rows = new Map();
		const roots = new Set();
		Array.prototype.forEach.call(familyElements, function (element) {
			const derivedRelationshipId = aras.getItemProperty(
				element,
				'dr_relationship_id'
			);
			const derivedRelationship =
				aras.itemsCache.getItem(derivedRelationshipId) ||
				aras.getItemById('dr_Relationship', derivedRelationshipId);
			if (derivedRelationship) {
				const destinationItemTypeId = aras.getItemProperty(
					derivedRelationship,
					'destination_itemtype_id'
				);
				const derivedRelationshipName =
					aras.getItemProperty(derivedRelationship, 'label') ||
					aras.getItemProperty(derivedRelationship, 'name');
				const derivedRelationshipId = aras.getItemProperty(
					derivedRelationship,
					'id'
				);
				const destinationItemType = aras.getItemTypeForClient(
					destinationItemTypeId,
					'id'
				);
				let icon = '../images/DefaultItemType.svg';
				if (destinationItemType) {
					icon =
						destinationItemType.getProperty('large_icon') ||
						destinationItemType.getProperty('small_icon') ||
						'../images/DefaultItemType.svg';
				}
				const rowObj = {
					label: derivedRelationshipName,
					icon: icon
				};
				roots.add(derivedRelationshipId);
				rows.set(derivedRelationshipId, rowObj);
			}
		});
		return {
			rows: rows,
			roots: roots
		};
	};

	const loadData = function (list, data) {
		if (data) {
			list.data = data.rows;
			list.roots = data.roots;
		}
	};

	function DerivedRelationshipListController() {
		const thisItem = DomainDefinitionEditor.getThisItem();
		this.list = new DerivedRelationshipList();
		const node = document.querySelector('.destination-tree');
		node.appendChild(this.list);
		const self = this;
		this.list.on(
			'click',
			function (menuItemId, e) {
				self.list.select(menuItemId);
				self.onSelect(menuItemId);
			},
			'row'
		);
		const convertedData = prepareDataForNav(thisItem.node);
		loadData(this.list, convertedData);
	}

	DerivedRelationshipListController.prototype.getFirstRowId = function () {
		const itemsArray = [];
		this.list.dataStore.items.forEach(function (el, index) {
			itemsArray.push(index);
		});
		return itemsArray[0];
	};

	DerivedRelationshipListController.prototype.onSelect = function () {};

	return DerivedRelationshipListController;
});
