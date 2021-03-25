window.isLimitToSelectOnlySingleProperty = true;
window.isToHideParametersButton = true;

const baseOnloadHandler = window.onloadHandler;

window.onloadHandler = function () {
	const getExistingDr = function (attrDefinition, drId) {
		let drRelationship = attrDefinition.selectSingleNode(
			"dr_relationship_id/Item[@type='dr_Relationship' and @id='" + drId + "']"
		);
		if (drRelationship === null) {
			drRelationship = aras.getItemById('dr_Relationship', drId);
		}

		return drRelationship;
	};

	function createQueryDefinition(appliedToId) {
		const queryDefinition = aras.newIOMItem('qry_QueryDefinition');
		queryDefinition.setID(aras.IomInnovator.getNewID());
		const itemTypeName = aras.getItemTypeName(appliedToId);
		const rootQryItem = aras.newIOMItem('qry_QueryItem', 'add');
		const rootQryReference = aras.newIOMItem('qry_QueryReference', 'add');
		const itemRefId = aras.IomInnovator.getNewID();
		rootQryItem.setProperty('ref_id', itemRefId);
		rootQryItem.setProperty('item_type', appliedToId);
		rootQryItem.setProperty('alias', itemTypeName);
		rootQryItem.setPropertyAttribute('item_type', 'keyed_name', itemTypeName);
		rootQryReference.setProperty('child_ref_id', itemRefId);
		queryDefinition.addRelationship(rootQryItem);
		queryDefinition.addRelationship(rootQryReference);
		document.itemTypeName = itemTypeName;
		window.item = queryDefinition.node;
	}

	function processButtons() {
		const okButton = document.getElementById('ok');
		if (okButton) {
			const innerOkSpan = okButton.getElementsByClassName(
				'aras-button__text'
			)[0];
			innerOkSpan.textContent = window.aras.getResource('', 'common.ok');

			okButton.addEventListener('click', function onOkClick() {
				args.dialog.close(window.item);
				okButton.removeEventListener('click', onOkClick);
			});
		}

		const cancelButton = document.getElementById('cancel');
		if (cancelButton) {
			const innerCancelSpan = cancelButton.getElementsByClassName(
				'aras-button__text'
			)[0];
			innerCancelSpan.textContent = window.aras.getResource(
				'',
				'common.cancel'
			);

			cancelButton.addEventListener('click', function onCancelClick() {
				args.dialog.close();
				cancelButton.removeEventListener('click', onCancelClick);
			});
		}
	}

	function addSelectedProperty(queryDefinition, targetProperty) {
		if (!targetProperty) {
			return;
		}

		let leafQueryItem;
		const queryItems = queryDefinition.getRelationships('qry_QueryItem');
		const queryReferences = queryDefinition.getRelationships(
			'qry_QueryReference'
		);
		const parentRefIds = [];
		for (let i = 0; i < queryReferences.getItemCount(); i++) {
			const queryReference = queryReferences.getItemByIndex(i);
			const parentRefId = queryReference.getProperty('parent_ref_id');
			if (parentRefId) {
				parentRefIds.push(parentRefId);
			}
		}
		for (let i = 0; i < queryItems.getItemCount(); i++) {
			const queryItem = queryItems.getItemByIndex(i);
			const refId = queryItem.getProperty('ref_id');
			if (!parentRefIds.includes(refId)) {
				leafQueryItem = queryItem;
			}
		}
		const queryItemSelectProperty = aras.newIOMItem(
			'qry_QueryItemSelectProperty'
		);
		queryItemSelectProperty.setProperty('property_name', targetProperty);
		leafQueryItem.addRelationship(queryItemSelectProperty);
	}

	function setImplementationQueryAsQueryDefinition(
		drRelationship,
		targetProperty
	) {
		const implementationQuery = aras.getItemProperty(
			drRelationship,
			'implementation_query'
		);
		const itemTypeName = aras.getItemTypeName(appliedToId);
		const queryDefinition = aras.newIOMItem('qry_QueryDefinition');
		queryDefinition.loadAML(implementationQuery);
		addSelectedProperty(queryDefinition, targetProperty);
		document.itemTypeName = itemTypeName;
		window.item = queryDefinition.node;
	}

	function fillItemOnWindow(relId, appliedToId) {
		const policyAccessAttrDefinition = aras.getItemRelationship(
			parent.item,
			'ac_PolicyAccessAttrDefinition',
			relId,
			false
		);
		const drRelationshipId = aras.getItemProperty(
			policyAccessAttrDefinition,
			'dr_relationship_id'
		);
		if (!drRelationshipId) {
			createQueryDefinition(appliedToId);
			return;
		}
		const drRelationshipNode = getExistingDr(
			policyAccessAttrDefinition,
			drRelationshipId
		);
		const targetProperty = aras.getItemProperty(
			policyAccessAttrDefinition,
			'property_name'
		);
		setImplementationQueryAsQueryDefinition(drRelationshipNode, targetProperty);
	}

	function overrideGlobalQbVariables() {
		window.qbTreeModulePath =
			'MacPolicy/Scripts/MACQueryBuilderEditor/macQbTreeMenu';
		window.initializeTreeMenu = function (QbTreeMenu) {
			window.treeMenu = new QbTreeMenu(window.item);
		};
	}

	const args = window.frameElement.dialogArguments;
	const appliedToId = args.appliedToId;
	window.aras = args.aras;
	window.isEditMode = args.isEditMode;
	fillItemOnWindow(args.relId, appliedToId);
	processButtons();
	overrideGlobalQbVariables();
	baseOnloadHandler(args.propertyDataType);
};
