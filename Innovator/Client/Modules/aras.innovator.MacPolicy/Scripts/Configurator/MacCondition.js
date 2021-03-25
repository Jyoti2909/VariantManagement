/* global thisItem */
define(['MacPolicy/Scripts/Configurator/MacConditionVisitors'], function (
	conditionVisitors
) {
	'use strict';
	const MacCondition = {};

	MacCondition.transformAstBeforeSave = function (ast) {
		conditionVisitors.addNamespaceToMethodNameVisitor(ast);
		conditionVisitors.identityNameToIdTranfsormVisitor(ast);
		conditionVisitors.xClassNameToIdTranfsormVisitor(ast);
	};
	MacCondition.transformAstBeforeOpen = function (ast) {
		conditionVisitors.removeNamespaceFromMethodNameVisitor(ast);
		conditionVisitors.identityIdToNameTranfsormVisitor(ast);
		conditionVisitors.xClassIdToNameTranfsormVisitor(ast);
	};
	MacCondition.validateProperties = function (conditionXml) {
		if (!conditionXml) {
			return false;
		}
		const condition = aras.createXMLDocument();
		condition.loadXML(conditionXml);
		const properties = condition.selectNodes('//property');
		for (let i = 0; i < properties.length; i++) {
			const name = properties[i].getAttribute('name');
			if (name === 'undefined' || name === '') {
				return false;
			}
		}
		return true;
	};
	function moveFilterXmlFromReferenceItemToQueryItem(
		queryDefinitionItem,
		condition
	) {
		const currentItemXpath =
			"/Item/Relationships/Item[@type='qry_QueryItem' and alias= 'CurrentItem']";
		const currentItem = queryDefinitionItem.getItemsByXPath(currentItemXpath);
		const currentItemRefId = currentItem.getProperty('ref_id');
		const queryReferenceXpath =
			"/Item/Relationships/Item[@type='qry_QueryReference' and " +
			"parent_ref_id='" +
			currentItemRefId +
			"']";
		const referenceItem = queryDefinitionItem.getItemsByXPath(
			queryReferenceXpath
		);
		modifyXPathForQueryItem(condition, '//property', 'query_items_xpath');
		referenceItem.removeProperty('filter_xml');
		currentItem.setProperty('filter_xml', condition.xml);
		return queryDefinitionItem;
	}
	function moveFilterXmlFromQueryItemToReferenceItem(queryDefinitionItem) {
		const currentItemXpath =
			"/Item/Relationships/Item[@type='qry_QueryItem' and alias= 'CurrentItem']";
		const currentItem = queryDefinitionItem.getItemsByXPath(currentItemXpath);
		const currentItemRefId = currentItem.getProperty('ref_id');
		const queryReferenceXpath =
			"/Item/Relationships/Item[@type='qry_QueryReference' and " +
			"parent_ref_id='" +
			currentItemRefId +
			"']";
		const referenceItem = queryDefinitionItem.getItemsByXPath(
			queryReferenceXpath
		);
		const condition = aras.createXMLDocument();
		condition.loadXML(currentItem.getProperty('filter_xml'));
		modifyXPathForReferenceItem(condition, '//property', 'query_items_xpath');
		currentItem.removeProperty('filter_xml');
		referenceItem.setProperty('filter_xml', condition.xml);
		return queryDefinitionItem;
	}
	function modifyXPathForReferenceItem(condition, nodeXpath, xpathAttribute) {
		const nodes = condition.selectNodes(nodeXpath);
		for (let i = 0; i < nodes.length; i++) {
			const queryItemsXpath = nodes[i].getAttribute(xpathAttribute);
			if (queryItemsXpath === null) {
				nodes[i].setAttribute(xpathAttribute, 'parent::Item');
			} else if (queryItemsXpath === 'child::Item') {
				nodes[i].removeAttribute(xpathAttribute);
			}
		}
	}
	function modifyXPathForQueryItem(condition, nodeXpath, xpathAttribute) {
		const nodes = condition.selectNodes(nodeXpath);
		for (let i = 0; i < nodes.length; i++) {
			const queryItemsXpath = nodes[i].getAttribute(xpathAttribute);
			if (queryItemsXpath === null) {
				nodes[i].setAttribute(xpathAttribute, 'child::Item');
			} else if (queryItemsXpath === 'parent::Item') {
				nodes[i].removeAttribute(xpathAttribute);
			}
		}
	}
	MacCondition.checkName = function (item) {
		const name = item.getProperty('name');
		const conditions = thisItem.getRelationships('mp_MacCondition');
		for (let i = 0; i < conditions.getItemCount(); i++) {
			const condition = conditions.getItemByIndex(i);
			if (
				condition.getProperty('name') === name &&
				condition.getId() !== item.getId()
			) {
				aras.AlertWarning(
					aras.getResource(
						'../Modules/aras.innovator.MacPolicy/',
						'condition_editor.name_is_exists',
						name
					)
				);
				return false;
			}
		}
		return true;
	};
	MacCondition.getPossibleParameters = function (item) {
		const possibleParameters = [];
		let envAttrItem = aras.newIOMItem('mp_PolicyAccessEnvAttribute', 'get');
		envAttrItem = envAttrItem.apply();
		if (envAttrItem.isError() && !envAttrItem.isEmpty()) {
			throw new Error(envAttrItem.toString());
		}
		for (let i = 0; i < envAttrItem.getItemCount(); i++) {
			const parameter = envAttrItem.getItemByIndex(i);
			possibleParameters.push({
				name: parameter.getProperty('name'),
				type: parameter.getProperty('type'),
				description: parameter.getProperty('description')
			});
		}
		return possibleParameters;
	};
	MacCondition.updateQueryParameterNodes = function (
		queryDefinitionItem,
		condition
	) {
		const currentParameterNodes = queryDefinitionItem.getRelationships(
			'qry_QueryParameter'
		);
		for (let i = 0; i < currentParameterNodes.getItemCount(); i++) {
			const item = currentParameterNodes.getItemByIndex(i);
			queryDefinitionItem.removeRelationship(item);
		}
		const possibleParameters = this.getPossibleParameters();
		const possibleParameterNames = possibleParameters.map(function (parameter) {
			return parameter.name;
		});
		const usedParameters = new Set();
		const constantNodes = condition.selectNodes('//constant');
		for (let i = 0; i < constantNodes.length; i++) {
			const reg = /^\$\w+$/g;
			const matches = reg.exec(constantNodes[i].text);
			if (matches) {
				usedParameters.add(matches[0].substring(1));
			}
		}
		usedParameters.forEach(function (usedParameter) {
			if (possibleParameterNames.indexOf(usedParameter) > -1) {
				const queryParameterItem = aras.newIOMItem();
				const queryParameterAml =
					'<Item type="qry_QueryParameter">' +
					'<name>' +
					usedParameter +
					'</name>' +
					'<value></value>' +
					'</Item>';
				queryParameterItem.loadAML(queryParameterAml);
				queryDefinitionItem.addRelationship(queryParameterItem);
			} else {
				aras.AlertWarning(
					aras.getResource(
						'../Modules/aras.innovator.MacPolicy/',
						'condition_editor.unknown_parameter',
						usedParameter
					)
				);
			}
		});
		return queryDefinitionItem;
	};
	MacCondition.getDefaultConditionXml = function () {
		return (
			'<Item type="qry_QueryDefinition">' +
			'<Relationships>' +
			'<Item type="qry_QueryItem">' +
			'<item_type>D4E6378D54A3427F89BECDC52A0034D5</item_type>' +
			'<alias>CurrentItem</alias>' +
			'<ref_id>89B61DF8C9D04FA689BF3C01E934E0D7</ref_id>' +
			'<filter_xml>&lt;condition&gt;&lt;/condition&gt;</filter_xml>' +
			'</Item>' +
			'<Item type="qry_QueryItem">' +
			'<alias>CurrentUser</alias>' +
			'<item_type>45E899CD2859442982EB22BB2DF683E5</item_type>' +
			'<ref_id>11BB8EB866DB47AC858B39845CACC733</ref_id>' +
			'</Item>' +
			'<Item type="qry_QueryReference">' +
			'<child_ref_id>89B61DF8C9D04FA689BF3C01E934E0D7</child_ref_id>' +
			'</Item>' +
			'<Item type="qry_QueryReference">' +
			'<child_ref_id>11BB8EB866DB47AC858B39845CACC733</child_ref_id>' +
			'<parent_ref_id>89B61DF8C9D04FA689BF3C01E934E0D7</parent_ref_id>' +
			'<ref_id>87D239DCABEC4BF5B6C6B1FDDEFD6A0C</ref_id>' +
			'</Item>' +
			'</Relationships>' +
			'</Item>'
		);
	};
	MacCondition.prepareToSaveOnServer = function (
		queryDefinitionItem,
		condition
	) {
		queryDefinitionItem = this.updateQueryParameterNodes(
			queryDefinitionItem,
			condition
		);
		return moveFilterXmlFromReferenceItemToQueryItem(
			queryDefinitionItem,
			condition
		);
	};
	MacCondition.prepareToUI = function (queryDefinitionItem) {
		return moveFilterXmlFromQueryItemToReferenceItem(queryDefinitionItem);
	};
	return MacCondition;
});
