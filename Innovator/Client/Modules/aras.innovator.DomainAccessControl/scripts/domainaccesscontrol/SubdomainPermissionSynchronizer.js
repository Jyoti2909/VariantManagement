define([
	'DomainAccessControl/scripts/domainaccesscontrol/SubdomainPermissionConditionVisitor'
], function (SubdomainPermissionConditionVisitor) {
	'use strict';
	const SubdomainPermissionSynchronizer = {};

	const createConditionXml = function (
		destinationLCSId,
		departurePermissionId
	) {
		if (destinationLCSId === '') {
			return (
				'<condition>' +
				'<eq>' +
				'<property name="permission_id" query_items_xpath="parent::Item" />' +
				'<constant>' +
				departurePermissionId +
				'</constant>' +
				'</eq>' +
				'</condition>'
			);
		}
		return (
			'<condition>' +
			'<and>' +
			'<eq>' +
			'<property name="permission_id" query_items_xpath="parent::Item" />' +
			'<constant>' +
			departurePermissionId +
			'</constant>' +
			'</eq>' +
			'<eq>' +
			'<property name="current_state" />' +
			'<constant>' +
			destinationLCSId +
			'</constant>' +
			'</eq>' +
			'</and>' +
			'</condition>'
		);
	};

	const getExistedItemById = function (policyItem, id) {
		let subdomainPermission;
		if (!id) {
			return;
		}
		const uiSubdomainPermissionItems = policyItem.getRelationships(
			'dac_SubdomainPermission'
		);
		for (let i = 0; i < uiSubdomainPermissionItems.getItemCount(); i++) {
			const permission = uiSubdomainPermissionItems.getItemByIndex(i);
			if (permission.getAttribute('id') === id) {
				subdomainPermission = permission;
				return subdomainPermission;
			}
		}
		return subdomainPermission;
	};

	const createSubdomainPermissionItem = function (policyItem, uiItem) {
		let subdomainPermissionItem = getExistedItemById(
			policyItem,
			uiItem.getProperty('real_item_id')
		);
		if (subdomainPermissionItem) {
			if (uiItem.getAction() === 'delete') {
				subdomainPermissionItem.setAction(uiItem.getAction());
				policyItem.removeRelationship(uiItem);
				return;
			}
			subdomainPermissionItem.setAction(uiItem.getAction());
		} else {
			subdomainPermissionItem = aras.newIOMItem(
				'dac_SubdomainPermission',
				'add'
			);
			subdomainPermissionItem.setNewID();
			policyItem.addRelationship(subdomainPermissionItem);
		}
		subdomainPermissionItem.setProperty(
			'subdomain_permission_id',
			uiItem.getProperty('subdomain_permission_id')
		);
		const subdomainPermissionName = uiItem.getPropertyAttribute(
			'subdomain_permission_id',
			'keyed_name'
		);
		subdomainPermissionItem.setPropertyAttribute(
			'subdomain_permission_id',
			'keyed_name',
			subdomainPermissionName
		);
		subdomainPermissionItem.setProperty(
			'sort_order',
			uiItem.getProperty('priority')
		);

		const destinationLCSId = uiItem.getProperty('destination_lcs_id', '');
		const departurePermissionId = uiItem.getProperty('departure_permission_id');
		const conditionXml = createConditionXml(
			destinationLCSId,
			departurePermissionId
		);

		subdomainPermissionItem.setProperty('condition_xml', conditionXml);

		policyItem.removeRelationship(uiItem);
	};

	const isUIItemAlreadyExists = function (
		policyItem,
		uiSubdomainPermissionItemId
	) {
		const uiSubdomainPermissionItems = policyItem.getRelationships(
			'dac_UI_SubdomainPermission'
		);
		for (let i = 0; i < uiSubdomainPermissionItems.getItemCount(); i++) {
			const uiSubdomainPermissionItem = uiSubdomainPermissionItems.getItemByIndex(
				i
			);
			if (
				uiSubdomainPermissionItem.getProperty('real_item_id') ===
				uiSubdomainPermissionItemId
			) {
				return true;
			}
		}
		return false;
	};

	const createUISubdomainPermissionItem = function (policyItem, realItem) {
		if (!isUIItemAlreadyExists(policyItem, realItem.getID())) {
			const uiSubdomainPermissionItem = aras.newIOMItem(
				'dac_UI_SubdomainPermission'
			);
			uiSubdomainPermissionItem.setNewID();
			uiSubdomainPermissionItem.setProperty('real_item_id', realItem.getID());
			uiSubdomainPermissionItem.setProperty(
				'subdomain_permission_id',
				realItem.getProperty('subdomain_permission_id')
			);
			const subdomainPermissionName = realItem.getPropertyAttribute(
				'subdomain_permission_id',
				'keyed_name'
			);
			uiSubdomainPermissionItem.setPropertyAttribute(
				'subdomain_permission_id',
				'keyed_name',
				subdomainPermissionName
			);
			uiSubdomainPermissionItem.setProperty(
				'priority',
				realItem.getProperty('sort_order')
			);
			uiSubdomainPermissionItem.setAction(realItem.getAction());

			const conditionXmlString = realItem.getProperty('condition_xml');
			const conditionXml = aras.createXMLDocument();
			conditionXml.loadXML(conditionXmlString);
			const visitor = new SubdomainPermissionConditionVisitor();
			visitor.accept(conditionXml.firstChild);

			const departurePermissionId = visitor.result['permission_id'];
			const destinationLCSId = visitor.result['current_state'];

			if (departurePermissionId) {
				const departurePermissionItem = aras.getItemById(
					'Permission',
					departurePermissionId
				);
				uiSubdomainPermissionItem.setProperty(
					'departure_permission_id',
					departurePermissionId
				);
				if (departurePermissionItem) {
					const departurePermissionItemName = aras.getItemProperty(
						departurePermissionItem,
						'keyed_name'
					);
					uiSubdomainPermissionItem.setPropertyAttribute(
						'departure_permission_id',
						'keyed_name',
						departurePermissionItemName
					);
				}
			}
			if (destinationLCSId) {
				const destinationLCSItem = aras.getItemById(
					'Life Cycle State',
					destinationLCSId
				);
				uiSubdomainPermissionItem.setProperty(
					'destination_lcs_id',
					destinationLCSId
				);
				if (destinationLCSItem) {
					const destinationLCSItemName = aras.getItemProperty(
						destinationLCSItem,
						'keyed_name'
					);
					uiSubdomainPermissionItem.setPropertyAttribute(
						'destination_lcs_id',
						'keyed_name',
						destinationLCSItemName
					);
				}
			}
			policyItem.addRelationship(uiSubdomainPermissionItem);
		}
	};

	SubdomainPermissionSynchronizer.beforeSave = function () {
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
		const handler = function (uiSubdomainPermissionItem) {
			return !aras.checkItem(uiSubdomainPermissionItem);
		};
		for (let i = 0; i < subdomainPolicies.getItemCount(); i++) {
			const subdomainPolicy = subdomainPolicies.getItemByIndex(i);
			aras.getItemRelationshipsEx(
				subdomainPolicy.node,
				'dac_UI_SubdomainPermission',
				undefined,
				undefined,
				undefined,
				false
			);
			const uiSubdomainPermissionItems = subdomainPolicy.getRelationships(
				'dac_UI_SubdomainPermission'
			);
			const isInvalid = [].some.call(
				uiSubdomainPermissionItems.nodeList,
				handler
			);

			if (isInvalid) {
				return false;
			}
			for (let j = 0; j < uiSubdomainPermissionItems.getItemCount(); j++) {
				const uiSubdomainPermissionItem = uiSubdomainPermissionItems.getItemByIndex(
					j
				);
				createSubdomainPermissionItem(
					subdomainPolicy,
					uiSubdomainPermissionItem
				);
			}
		}
		return true;
	};

	SubdomainPermissionSynchronizer.beforeOpen = function (
		derivedRelationshipId
	) {
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
		let subdomainPolicyIndex = -1;
		if (subdomainPolicies.nodeList.length) {
			subdomainPolicyIndex = Array.prototype.findIndex.call(
				subdomainPolicies.nodeList,
				function (policy) {
					if (
						aras.getItemProperty(policy, 'dr_relationship_id') ===
						derivedRelationshipId
					) {
						return true;
					}
				}
			);
		}
		if (subdomainPolicyIndex === -1) {
			return;
		}
		const subdomainPolicy = subdomainPolicies.getItemByIndex(
			subdomainPolicyIndex
		);
		aras.getItemRelationshipsEx(
			subdomainPolicy.node,
			'dac_SubdomainPermission',
			undefined,
			undefined,
			undefined,
			false
		);
		const subdomainPermissionItems = subdomainPolicy.getRelationships(
			'dac_SubdomainPermission'
		);
		for (let j = 0; j < subdomainPermissionItems.getItemCount(); j++) {
			createUISubdomainPermissionItem(
				subdomainPolicy,
				subdomainPermissionItems.getItemByIndex(j)
			);
		}
	};

	return SubdomainPermissionSynchronizer;
});
