/* global require, dojo */
require(['CMF/Scripts/PublicApi/CmfStyle'], function (CmfStyle) {
	var aras = parent.aras;
	var tmpFlyweightItem;
	var currentLifeCycleIdCached;
	var cachedLifeCycleInfo;
	var calculateBindingSettingValue = function (
		lifeCycleValue,
		elementTypeValue
	) {
		if (!lifeCycleValue) {
			return elementTypeValue;
		}
		if (
			elementTypeValue &&
			elementTypeValue.indexOf('Hard') === 0 &&
			lifeCycleValue.indexOf('Force') !== 0
		) {
			return elementTypeValue;
		}
		return lifeCycleValue.replace('Force', '');
	};
	var getClearBindingSettingValue = function (value) {
		return (value && value.replace('Hard', '')) || '';
	};
	var getItemTypeStartState = function (typeId, classification) {
		var itemType = aras.newIOMItem('ItemType', 'get');
		itemType.setID(typeId);
		itemType.setAttribute('select', 'id');
		var itemTypeLifeCycle = aras.newIOMItem('ItemType Life Cycle', 'get');
		itemTypeLifeCycle.setAttribute('select', 'related_id, class_path');
		var lifeCycleMap = aras.newIOMItem('Life Cycle Map', 'get');
		lifeCycleMap.setAttribute('select', 'start_state');
		itemTypeLifeCycle.setPropertyItem('related_id', lifeCycleMap);
		itemType.addRelationship(itemTypeLifeCycle);
		var queryResult = itemType.apply();
		if (queryResult.isError()) {
			return null;
		}
		var query =
			"//Item[@type='ItemType']/Relationships/Item[@type='ItemType Life Cycle' and class_path='" +
			classification +
			"']/related_id/Item[@type='Life Cycle Map']/start_state";
		var startStateNode = queryResult.node.selectSingleNode(query);
		if (!startStateNode) {
			return null;
		}
		return startStateNode.text;
	};
	var getCurrentLifeCycleInfo = function () {
		var currentState = aras.getItemProperty(parent.item, 'current_state');
		if (!currentState) {
			var classification = aras.getItemProperty(parent.item, 'classification');
			currentState = getItemTypeStartState(
				parent.item.getAttribute('typeId'),
				classification
			);
		}
		if (!currentState) {
			return null;
		}
		if (currentState === currentLifeCycleIdCached) {
			return cachedLifeCycleInfo;
		}
		var documentLifeCycleQuery = aras.newIOMItem(
			'cmf_DocumentLifeCycleState',
			'get'
		);
		documentLifeCycleQuery.setProperty('life_cycle_state_id', currentState);

		var documentLifeCycle = documentLifeCycleQuery.apply();
		if (documentLifeCycle.isError()) {
			return null;
		}
		cachedLifeCycleInfo = documentLifeCycle;
		currentLifeCycleIdCached = currentState;
		return documentLifeCycle;
	};
	var isBindingBehaviourFloat = function (resolutionMode) {
		return getClearBindingSettingValue(resolutionMode) === 'Current';
	};
	var utils = {
		getResource: function () {
			var args = Array.prototype.slice.call(arguments, 0);
			args.unshift('../Modules/aras.innovator.CMF/');
			return aras.getResource.apply(aras, args);
		},

		isBindingsBehavFloat: isBindingBehaviourFloat,

		createBoundItem: function () {
			//this function to see all the places where boundItem is created and a comment below:
			var boundItem = aras.newObject();
			boundItem.propertyNames = aras.newObject();
			return boundItem;
		},

		getClearBindingSettingValue: getClearBindingSettingValue,

		getStatementForFloatBehavior: function (boundItemsConfigIds) {
			//this function is to see simular places in code and reduce duplicated code.
			var result = '<config_id condition="in">';
			result += "'" + boundItemsConfigIds.join("','") + "'";
			result += '</config_id>';
			result += '<is_current>1</is_current>';
			return result;
		},

		fillBindings: function (
			treeItem,
			boundItemId,
			isFillPropsFromItem,
			isUpdateDocument,
			isToValidateExistence,
			tableItems
		) {
			//Comments to parameters
			//1) isUpdateDocument set to true if need to get and set to treeItem boundItemId where isCurrent=true.
			//if false - we can't assume that item with boundItemId has isCurrent=true (E.g., at the moment of Select Part,
			//another user do version of the Part), so we will not update passed boundItemId
			//2) boundItemId: we should pass id, but not an item, because the item do not contain all the props in memory,
			//e.g., config_id (in case when we pass from Search Dialog)
			var i;
			var boundProperties = aras.newObject();
			var boundPropertyName;
			var currentBind;
			var aml;
			var itemToGet;
			var itemDb;
			var boundTableItem;
			var tableItem;
			var boundTableItemValue;
			var statement;
			var currentLifeCycleInfo = getCurrentLifeCycleInfo();
			var lifeCycleStateTrackingMode = currentLifeCycleInfo
				? currentLifeCycleInfo.GetProperty('tracking_mode')
				: null;
			var lifeCycleResolutionMode = currentLifeCycleInfo
				? currentLifeCycleInfo.GetProperty('resolution_mode')
				: null;
			var elementResolutionMode;
			var isBindingBehavFloat;

			for (i = 0; i < tableItems.length; i++) {
				tableItem = tableItems[i];
				currentBind =
					treeItem.documentElementType.binding.binds[tableItem.propertyId];
				if (currentBind) {
					boundProperties[currentBind.itemPropertyName] = {
						tableItem: tableItem
					};
				}
			}
			elementResolutionMode = !isUpdateDocument
				? calculateBindingSettingValue(
						lifeCycleResolutionMode,
						treeItem.documentElementType.binding.resolutionMode
				  )
				: treeItem.resolutionMode;
			isBindingBehavFloat = isBindingBehaviourFloat(elementResolutionMode);

			aml = '<AML>';
			aml +=
				"<Item typeId='" +
				treeItem.documentElementType.binding.elemReferenceType +
				"' action='get' select='";
			for (boundPropertyName in boundProperties) {
				aml += boundPropertyName + ', ';
			}
			aml += "id, config_id'";
			if (!isUpdateDocument || !isBindingBehavFloat) {
				aml += " id='" + boundItemId + "'";
			}
			aml += '>';
			if (isUpdateDocument && isBindingBehavFloat) {
				statement = this.getStatementForFloatBehavior([
					treeItem.boundItemConfigId
				]);
				aml += statement;
			}
			aml += '</Item>';
			aml += '</AML>';

			itemToGet = aras.newIOMItem();
			itemToGet.loadAML(aml);
			itemDb = itemToGet.apply();
			if (itemDb.isError()) {
				if (isToValidateExistence) {
					aras.AlertWarning(this.getResource('new_item_selected'));
					return false;
				}
				aras.AlertError(itemDb);
				return false;
			}

			treeItem.boundItem = this.createBoundItem();
			treeItem.boundItemId = treeItem.boundItem.idAccordingToBehav = itemDb.getID();
			treeItem.boundItemConfigId = itemDb.getProperty('config_id');
			if (!isUpdateDocument) {
				treeItem.trackingMode = calculateBindingSettingValue(
					lifeCycleStateTrackingMode,
					treeItem.documentElementType.binding.trackingMode
				);
				treeItem.resolutionMode = elementResolutionMode;
			}

			for (boundPropertyName in boundProperties) {
				boundTableItem = boundProperties[boundPropertyName].tableItem;
				boundTableItemValue = itemDb.getProperty(boundPropertyName);

				//if bound Item's property of type Item (it linked to another property),
				//it will retain Id of bound item and name of this item in keyed_name attribute. For other property there won't be keyed_name attribute.
				boundTableItemValue =
					itemDb.getPropertyAttribute(boundPropertyName, 'keyed_name') ||
					boundTableItemValue;

				if (isFillPropsFromItem && boundTableItem.discoverOnly !== '1') {
					boundTableItem.value = boundTableItemValue;
				}
				treeItem.boundItem.propertyNames[boundPropertyName] = aras.newObject();
				treeItem.boundItem.propertyNames[
					boundPropertyName
				].value = boundTableItemValue;
				if (itemDb.getPropertyAttribute(boundPropertyName, 'is_null') === '0') {
					treeItem.boundItem.propertyNames[
						boundPropertyName
					].isMissedReference = true;
				}
			}
			return true;
		},

		getStyleString: function (style) {
			var res = '';
			if (!style) {
				return res;
			}

			if (style.backgroundColor) {
				res += 'background-color:' + style.backgroundColor + ';';
			}
			if (style.textColor) {
				res += 'color:' + style.textColor + ';';
			}
			if (style.fontFamily) {
				res += 'font-family:' + style.fontFamily + ';';
			}
			if (style.fontSize) {
				res += 'font-size:' + style.fontSize + 'px;';
			}
			if (style.fontStyle) {
				res += 'font-style:' + style.fontStyle + ';';
			}
			if (style.fontWeight) {
				res += 'font-weight:' + style.fontWeight + ';';
			}
			if (style.textDecoration) {
				res += 'text-decoration:' + style.textDecoration + ';';
			}
			if (style.textAlign) {
				res += 'text-align:' + style.textAlign + ';';
			}

			return res;
		},

		getCmfStyleAml: function (cmfStyle) {
			var res = '';
			if (!cmfStyle) {
				return res;
			}

			res += "<Item type='cmf_Style'>";
			if (cmfStyle.backgroundColor) {
				res +=
					'<background_color>' +
					cmfStyle.backgroundColor +
					'</background_color>';
			}
			if (cmfStyle.textColor) {
				res += '<text_color>' + cmfStyle.textColor + '</text_color>';
			}
			if (cmfStyle.fontFamily) {
				res += '<font_family>' + cmfStyle.fontFamily + '</font_family>';
			}
			if (cmfStyle.fontSize) {
				res += '<font_size>' + cmfStyle.fontSize + '</font_size>';
			}
			if (cmfStyle.fontStyle) {
				res += '<font_style>' + cmfStyle.fontStyle + '</font_style>';
			}
			if (cmfStyle.fontWeight) {
				res += '<font_weight>' + cmfStyle.fontWeight + '</font_weight>';
			}
			if (cmfStyle.textDecoration) {
				res +=
					'<text_decoration>' + cmfStyle.textDecoration + '</text_decoration>';
			}
			if (cmfStyle.textAlign) {
				res += '<text_align>' + cmfStyle.textAlign + '</text_align>';
			}
			res += '</Item>';

			return res;
		},

		getCmfStyleFromAml: function (aml) {
			if (!tmpFlyweightItem) {
				tmpFlyweightItem = aras.newIOMItem();
			}
			tmpFlyweightItem.loadAML(aml);
			return this.getCmfStyleFromAmlNode(tmpFlyweightItem.node);
		},

		getCmfStyleFromAmlNode: function (styleAmlNode) {
			var res = new CmfStyle();
			res.backgroundColor = aras.getItemProperty(
				styleAmlNode,
				'background_color'
			);
			res.textColor = aras.getItemProperty(styleAmlNode, 'text_color');
			res.fontFamily = aras.getItemProperty(styleAmlNode, 'font_family');
			res.fontStyle = aras.getItemProperty(styleAmlNode, 'font_style');
			res.fontSize = aras.getItemProperty(styleAmlNode, 'font_size');
			res.fontWeight = aras.getItemProperty(styleAmlNode, 'font_weight');
			res.textDecoration = aras.getItemProperty(
				styleAmlNode,
				'text_decoration'
			);
			res.textAlign = aras.getItemProperty(styleAmlNode, 'text_align');

			return res;
		}
	};
	dojo.setObject('CMF.Utils', utils);
});
