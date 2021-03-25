define([
	'DomainAccessControl/scripts/domainaccesscontrol/DerivedRelationshipListController',
	'DomainAccessControl/scripts/domainaccesscontrol/RulesGrid',
	'DomainAccessControl/scripts/domainaccesscontrol/SubdomainPermissionSynchronizer',
	'dojo/aspect'
], function (
	DerivedRelationshipListController,
	RulesGrid,
	SubdomainPermissionSynchronizer,
	aspect
) {
	'use strict';
	const baseUnlock = window.onUnlockCommand;

	window.onUnlockCommand = function (saveChanges) {
		if (saveChanges) {
			if (!SubdomainPermissionSynchronizer.beforeSave()) {
				return;
			}
		}
		const baseUnlockResult = baseUnlock(saveChanges);
		const selectedDerivedRelationshipId = DomainDefinitionEditor.getCurrentlySelectedDerivedRelationship();
		if (selectedDerivedRelationshipId) {
			RulesGrid.loadRelationships(selectedDerivedRelationshipId);
		}
		return baseUnlockResult;
	};

	const baseLock = window.onLockCommand;
	window.onLockCommand = function (saveChanges) {
		const baseLockResult = baseLock(saveChanges);
		const selectedDerivedRelationshipId = DomainDefinitionEditor.getCurrentlySelectedDerivedRelationship();
		if (selectedDerivedRelationshipId) {
			RulesGrid.loadRelationships(selectedDerivedRelationshipId);
		}
		return baseLockResult;
	};

	const baseSave = window.onSaveCommand;
	window.onSaveCommand = async function (saveChanges) {
		if (!SubdomainPermissionSynchronizer.beforeSave()) {
			return;
		}
		const saveResult = await baseSave(saveChanges);
		const selectedDerivedRelationshipId = DomainDefinitionEditor.getCurrentlySelectedDerivedRelationship();
		if (selectedDerivedRelationshipId) {
			RulesGrid.loadRelationships(selectedDerivedRelationshipId);
		}

		return saveResult;
	};

	const setRootItemTypeInfo = function (item) {
		const relationshipFamilyId = item.getProperty('dr_relationshipfamily_id');
		const relationshipFamily =
			aras.itemsCache.getItem(relationshipFamilyId) ||
			aras.getItemById('dr_RelationshipFamily', relationshipFamilyId);
		if (!relationshipFamily) {
			return;
		}
		const queryDefinitionId = aras.getItemProperty(
			relationshipFamily,
			'query_definition_id'
		);
		const queryDefinition =
			aras.itemsCache.getItem(queryDefinitionId) ||
			aras.getItemById('qry_QueryDefinition', queryDefinitionId);

		if (!queryDefinition) {
			return;
		}
		if (!queryDefinition.getElementsByTagName('Item').length) {
			aras.getItemRelationshipsEx(queryDefinition, 'qry_QueryReference');
			aras.getItemRelationshipsEx(queryDefinition, 'qry_QueryItem');
		}
		const rootQueryReference = queryDefinition.selectSingleNode(
			"Relationships/Item[@type='qry_QueryReference' and string(parent_ref_id)='']"
		);
		const rootQueryItem = queryDefinition.selectSingleNode(
			"Relationships/Item[ref_id='" +
				aras.getItemProperty(rootQueryReference, 'child_ref_id') +
				"']"
		);
		const rootItemType = aras.getItemTypeForClient(
			aras.getItemProperty(rootQueryItem, 'item_type'),
			'id'
		).node;

		if (rootItemType) {
			const icon =
				aras.getItemProperty(rootItemType, 'large_icon') ||
				aras.getItemProperty(rootItemType, 'small_icon') ||
				'../images/DefaultItemType.svg';
			const name =
				aras.getItemProperty(rootItemType, 'label') ||
				aras.getItemProperty(rootItemType, 'name');
			const infoElement = document.querySelector('#root-itemtype-info');
			infoElement.innerHTML =
				'<img src="' +
				aras.EscapeSpecialChars(icon) +
				'" /><span>' +
				aras.EscapeSpecialChars(name) +
				'</span><img class="arrow" src="../images/RightArrow.svg" />';
		}
	};

	const setDerivedRelationshipInfo = function (derivedRelationshipId) {
		const derivedRelationship =
			aras.itemsCache.getItem(derivedRelationshipId) ||
			aras.getItemById('dr_Relationship', derivedRelationshipId);
		if (derivedRelationship) {
			const destinationItemTypeId = aras.getItemProperty(
				derivedRelationship,
				'destination_itemtype_id'
			);
			const derivedRelationshipName = aras.getItemProperty(
				derivedRelationship,
				'name'
			);
			const derivedRelationshipDescription = aras.getItemProperty(
				derivedRelationship,
				'description'
			);
			const destinationItemType = aras.getItemById(
				'ItemType',
				destinationItemTypeId,
				0,
				null,
				'description, large_icon, small_icon'
			);
			let icon = '../images/DefaultItemType.svg';
			if (destinationItemType) {
				icon =
					aras.getItemProperty(destinationItemType, 'large_icon') ||
					aras.getItemProperty(destinationItemType, 'small_icon') ||
					'../images/DefaultItemType.svg';
			}
			const description = derivedRelationshipDescription
				? ' - ' + derivedRelationshipDescription
				: '';

			const infoElement = document.querySelector('#derived-relationship-info');
			infoElement.innerHTML =
				'<img src="' +
				aras.EscapeSpecialChars(icon) +
				'" /><span class="name">' +
				aras.EscapeSpecialChars(derivedRelationshipName) +
				'</span><span>' +
				aras.EscapeSpecialChars(description) +
				'</span>';
		}
	};

	const DomainDefinitionEditor = {};

	DomainDefinitionEditor.init = function () {
		if (!this.listController) {
			setRootItemTypeInfo(this.getThisItem());
			this.listController = new DerivedRelationshipListController();
			const firstListItemId = this.listController.getFirstRowId();
			if (firstListItemId) {
				this.listController.list.select(firstListItemId);
				const selectedDerivedRelationshipId = DomainDefinitionEditor.getCurrentlySelectedDerivedRelationship();
				this.initGrid(selectedDerivedRelationshipId);
			}
			const self = this;
			aspect.after(
				this.listController,
				'onSelect',
				function (derivedRelationshipId) {
					self.initGrid(derivedRelationshipId);
				},
				true
			);
		}
	};

	DomainDefinitionEditor.initGrid = function (derivedRelationshipId) {
		setDerivedRelationshipInfo(derivedRelationshipId);
		RulesGrid.init(
			document.querySelector('.rules-grid'),
			derivedRelationshipId
		);
	};

	DomainDefinitionEditor.getThisItem = function () {
		return self.document.getElementById('instance').contentWindow.document
			.thisItem;
	};

	DomainDefinitionEditor.getCurrentlySelectedDerivedRelationship = function () {
		if (this.listController) {
			return this.listController.list
				? this.listController.list.selectedItemKey
				: null;
		}
	};

	window.DomainDefinitionEditor = DomainDefinitionEditor;
});
