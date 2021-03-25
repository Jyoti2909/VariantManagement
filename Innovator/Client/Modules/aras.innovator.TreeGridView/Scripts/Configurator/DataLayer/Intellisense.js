define(function () {
	'use strict';
	var Intellisense = (function () {
		function Intellisense(queryDefinition) {
			//TODO: performance. It can be get on load of QueryItems.
			//We can save 2 requests sometimes (if cache is not contain alias) on open cell view templates dialog.
			this._qbSelectPropertiesCacheByAlias = {};
			this._queryDefinition = queryDefinition;
		}
		Intellisense.prototype.getQbCellTemplateValuesForAlias = function (
			graphNode,
			alias,
			currentBranch
		) {
			var queryItemRefId = graphNode.queryItemRefId;
			if (!queryItemRefId) {
				return [];
			}
			if (graphNode.queryItemAlias !== alias) {
				// it is joined alias
				var graphNodeByAlias = currentBranch
					.getJoinedNodes(graphNode)
					.filter(function (obj) {
						return obj.queryItemAlias === alias;
					});
				if (graphNodeByAlias.length > 0) {
					if (graphNodeByAlias[0].queryItemRefId) {
						queryItemRefId = graphNodeByAlias[0].queryItemRefId;
					}
				}
			}
			var queryItem = this._queryDefinition.getQueryItem(queryItemRefId);
			var result = this._qbSelectPropertiesCacheByAlias[alias];
			if (result) {
				return result;
			}
			result = [];
			this._qbSelectPropertiesCacheByAlias[alias] = result;
			var availablePropertyRequest = aras.newIOMItem(
				'Method',
				'qry_GetAvailableProperties'
			);
			availablePropertyRequest.setProperty('item_type', queryItem.itemType.id);
			availablePropertyRequest.setProperty('ref_id', queryItemRefId);
			var availablePropertyItems = availablePropertyRequest.apply();
			var availablePropertiessByName = {};
			var i;
			var availablePropertyItemsCount =
				availablePropertyItems.getItemCount() || 0;
			var availablePropertyItem;
			for (i = 0; i < availablePropertyItemsCount; i++) {
				availablePropertyItem = availablePropertyItems.getItemByIndex(i);
				availablePropertiessByName[
					availablePropertyItem.getProperty('name')
				] = {
					name: availablePropertyItem.getProperty('name'),
					dataType: availablePropertyItem.getProperty('data_type')
				};
			}
			var selectPropertyRequest = aras.newIOMItem(
				'qry_QueryItemSelectProperty',
				'get'
			);
			selectPropertyRequest.setProperty('source_id', queryItem.id);
			var propertyNameProperty = 'property_name';
			selectPropertyRequest.setAttribute('select', propertyNameProperty);
			var selectPropertyItems = selectPropertyRequest.apply();
			selectPropertyItems = selectPropertyItems.getItemsByXPath(
				aras.XPathResult() + '/Item'
			);
			var selectPropertyItemsCount = selectPropertyItems.getItemCount() || 0;
			var selectPropertyItem;
			var availableProperty;
			for (i = 0; i < selectPropertyItemsCount; i++) {
				selectPropertyItem = selectPropertyItems.getItemByIndex(i);
				availableProperty =
					availablePropertiessByName[
						selectPropertyItem.getProperty(propertyNameProperty)
					];
				if (!availableProperty) {
					continue;
				}
				if (
					availableProperty.dataType &&
					availableProperty.dataType.toLowerCase() === 'item'
				) {
					result.push(availableProperty.name + '/@keyed_name');
				}
				result.push(availableProperty.name);
			}
			return result;
		};
		Intellisense.prototype.getAliasesForNode = function (
			graphNode,
			ignoreRecursion,
			branch
		) {
			var res = [];
			if (!ignoreRecursion && graphNode.isRecursiveNode) {
				graphNode = branch.getRecursiveNodeOn(graphNode);
			}
			res.push(graphNode.queryItemAlias);
			var joinedNodes = branch.getJoinedNodes(graphNode);
			for (var i = 0; i < joinedNodes.length; i++) {
				res.push(joinedNodes[i].queryItemAlias);
			}
			return res;
		};
		return Intellisense;
	})();
	return Intellisense;
});
