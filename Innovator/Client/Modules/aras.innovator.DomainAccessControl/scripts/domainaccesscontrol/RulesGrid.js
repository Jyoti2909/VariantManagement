define([
	'DomainAccessControl/scripts/domainaccesscontrol/SubdomainPermissionSynchronizer'
], function (SubdomainPermissionSynchronizer) {
	'use strict';
	const RulesGrid = {};
	const itemTypeName = 'dac_SubdomainPolicy';
	const toolbarButtons = [
		'related_option',
		'new',
		'emptyId_2',
		'pick_replace',
		'delete',
		'emptyId_3',
		'show_item',
		'emptyId_11',
		'copy2clipboard',
		'paste'
	];

	function checkPossibilityToAddRelationships(subdomainPolicyNode) {
		let subdomainPolicy = aras.newIOMItem();
		subdomainPolicy.loadAML(subdomainPolicyNode.xml);
		subdomainPolicy = subdomainPolicy.apply('dac_ValidateAllowedItemTypes');
		if (subdomainPolicy.isError()) {
			return false;
		}
		return true;
	}

	function getIFrameSrc(subdomainPolicy, isEditMode) {
		const tabID = aras.getRelationshipTypeId('dac_UI_SubdomainPermission');
		const itemID = aras.getItemProperty(subdomainPolicy, 'id');
		const db = aras.getDatabase();
		const isEditModeValue = isEditMode ? '1' : '0';

		const url = aras.getScriptsURL() + 'relationshipsGrid.html';
		const parameters =
			'db=' +
			db +
			'&ITName=' +
			itemTypeName +
			'&itemID=' +
			itemID +
			'&relTypeID=' +
			'444A674988214FC199BB9B61124ACFC6' +
			'&editMode=' +
			isEditModeValue +
			'&toolbar=1';

		LocationSearches[tabID] = parameters;
		return url;
	}

	function loadRelationships(derivedRelationshipId, iframe) {
		const tabID = aras.getRelationshipTypeId('dac_UI_SubdomainPermission');
		const thisItem = DomainDefinitionEditor.getThisItem();
		aras.getItemRelationshipsEx(
			thisItem.node,
			'dac_SubdomainPolicy',
			undefined,
			undefined,
			undefined,
			false
		);
		const subdomainPolicies = thisItem.getRelationships('dac_SubdomainPolicy');
		let subdomainPolicy;
		if (subdomainPolicies.nodeList.length) {
			subdomainPolicy = Array.prototype.find.call(
				subdomainPolicies.nodeList,
				function (policy) {
					if (
						aras.getItemProperty(policy, 'dr_relationship_id') ===
						derivedRelationshipId
					) {
						return policy;
					}
				}
			);
		}
		if (!subdomainPolicy) {
			subdomainPolicy = thisItem.createRelationship(
				'dac_SubdomainPolicy',
				'add'
			);
			subdomainPolicy.setNewID();
			subdomainPolicy.setProperty('dr_relationship_id', derivedRelationshipId);
			subdomainPolicy.setProperty('source_id', thisItem.getID());
			subdomainPolicy = subdomainPolicy.node;
		}
		let isEditModeValue = isEditMode;
		if (isEditModeValue) {
			isEditModeValue = checkPossibilityToAddRelationships(subdomainPolicy);
		}
		if (!isEditModeValue) {
			subdomainPolicy.setAttribute('action', 'skip');
		}
		const iframeSrc = getIFrameSrc(subdomainPolicy, isEditModeValue);
		const existingIframe = iframe.contentWindow.document.querySelector(
			'iframe'
		);
		if (existingIframe) {
			iframe.contentWindow.document.item = subdomainPolicy;
			iframe.contentWindow.itemTypeName = itemTypeName;
			iframe.contentWindow.LocationSearches = LocationSearches;
			if (iframeSrc === existingIframe.src) {
				existingIframe.src = null;
				existingIframe.src = iframeSrc;
			} else {
				existingIframe.src = iframeSrc;
				existingIframe.id = tabID;
			}
			existingIframe.onload = function () {
				existingIframe.contentWindow.toolbar
					.GetButtons(',')
					.split(',')
					.forEach(function (buttonId) {
						if (toolbarButtons.indexOf(buttonId) === -1) {
							existingIframe.contentWindow.setControlVisible(buttonId, false);
						}
					});
			};

			existingIframe.skipCuiToolbars = true;
		}
	}

	RulesGrid.init = function (node, derivedRelationshipId) {
		RulesGrid.node = node;
		RulesGrid.loadRelationships(derivedRelationshipId);
	};

	RulesGrid.loadRelationships = function (derivedRelationshipId) {
		SubdomainPermissionSynchronizer.beforeOpen(derivedRelationshipId);
		loadRelationships(
			derivedRelationshipId,
			RulesGrid.node.querySelector('#wrapper')
		);
	};

	return RulesGrid;
});
