(function(window) {
	'use strict';

	function VmUsageConditionTableEditorPageController(parameters) {
		this._aras = parameters.aras;
		this._utils = parameters.utils;
		this._usageConditionSourceItemType = parameters.usageConditionSourceItemType;
		this._usageConditionItemType = parameters.usageConditionItemType;
		this._usageConditionVariabilityItemRelationshipItemType = parameters.usageConditionVariabilityItemRelationshipItemType;
		this._itemViewController = parameters.itemViewController;

		this._featuresByVariabilityItemId = new Map();
		this._usageConditionInfoByItsSourceItemId = new Map();

		this._init(
			parameters.usageConditionTableEditorGridAssetColumnLabel,
			parameters.itemFieldFormatter,
			parameters.variabilityItemFieldTitleElement,
			parameters.variabilityItemFieldContainerElement,
			parameters.splitterElement,
			parameters.usageConditionTableEditorElement,
			parameters.usageConditionTableEditorGridToolbarElement,
			parameters.usageConditionTableEditorGridContainerElement,
			parameters.assetItemType
		);
	}

	VmUsageConditionTableEditorPageController.prototype = {
		constructor: VmUsageConditionTableEditorPageController,

		_aras: null,

		_utils: null,

		_usageConditionSourceItemType: null,

		_usageConditionItemType: null,

		_usageConditionVariabilityItemRelationshipItemType: null,

		_usageConditionTableEditorGridPage: null,

		_usageConditionInfoByItsSourceItemId: null,

		_variabilityItemNode: null,

		_featuresByVariabilityItemId: null,

		_itemViewController: null,

		_isDoneCommandExecuting: false,

		_vmSampleModuleSolutionBasedRelativePath: '../Modules/aras.innovator.VariantManagementSample',

		_init: function(
			usageConditionTableEditorGridAssetColumnLabel,
			itemFieldFormatter,
			variabilityItemFieldTitleElement,
			variabilityItemFieldContainerElement,
			splitterElement,
			usageConditionTableEditorElement,
			usageConditionTableEditorGridToolbarElement,
			usageConditionTableEditorGridContainerElement,
			assetItemType
		) {
			this._loadTitle(variabilityItemFieldTitleElement, 'usage_condition_table_editor_page.selection.title');

			if (typeof usageConditionTableEditorGridAssetColumnLabel !== 'string') {
				usageConditionTableEditorGridAssetColumnLabel = this._getUsageConditionSourceRelationshipRelatedItemTypeLabel();
			}

			this._initUsageConditionTableEditorGrid(
				usageConditionTableEditorElement,
				usageConditionTableEditorGridToolbarElement,
				usageConditionTableEditorGridContainerElement,
				usageConditionTableEditorGridAssetColumnLabel,
				assetItemType);

			const defaultVariabilityItem = this._itemViewController.getDefaultVariabilityItem();
			const defaultVariabilityItemNode = defaultVariabilityItem ? defaultVariabilityItem.node : null;
			this._variabilityItemNode = defaultVariabilityItemNode;

			this._initVariabilityItemField(itemFieldFormatter, variabilityItemFieldContainerElement, defaultVariabilityItemNode);

			this._initSplitter(splitterElement);

			this._itemViewController.subscribeAfterRootItemCommand('onSaveCommand', this.populateUsageConditionTableEditorGrid.bind(this));
			this._itemViewController.subscribeAfterRootItemCommand('onRefresh', this.populateUsageConditionTableEditorGrid.bind(this));

			const parentWindow = window.parent;
			parentWindow.registerCommandEventHandler(parentWindow, function() { this._isDoneCommandExecuting = true; }.bind(this), 'before', 'done');
			parentWindow.registerCommandEventHandler(parentWindow, function() { this._isDoneCommandExecuting = false; }.bind(this), 'after', 'done');
			parentWindow.registerCommandEventHandler(parentWindow, this._onUnlockItemHandler.bind(this), 'after', 'unlock');
		},

		populateUsageConditionTableEditorGrid: function() {
			this._populateUsageConditionTableEditorGrid(this._variabilityItemNode);
		},

		_initSplitter: function(splitterElement) {
			window.ArasModules.splitter(splitterElement);
		},

		_loadTitle: function(titleElement, titleResource) {
			titleElement.textContent = this._aras.getResource(
				this._vmSampleModuleSolutionBasedRelativePath,
				titleResource);
		},

		_getUsageConditionSourceRelationshipRelatedItemTypeLabel: function() {
			let itemTypeItem = this._aras.newIOMItem('ItemType', 'get');
			itemTypeItem.setAttribute('select', 'label');

			const relationshipTypeItem = this._aras.newIOMItem('RelationshipType');
			relationshipTypeItem.setProperty('name', this._usageConditionSourceItemType);

			itemTypeItem.setPropertyItem('id', relationshipTypeItem);
			itemTypeItem.setPropertyCondition('id', 'in');
			itemTypeItem.setPropertyAttribute('id', 'by', 'related_id');

			itemTypeItem = itemTypeItem.apply();

			if (itemTypeItem.isError()) {
				this._aras.AlertError(itemTypeItem);
				return '';
			}

			return itemTypeItem.getProperty('label');
		},

		_initUsageConditionTableEditorGrid: function(
			usageConditionTableEditorElement,
			usageConditionTableEditorGridToolbarElement,
			usageConditionTableEditorGridContainerElement,
			assetColumnLabel,
			assetItemType
		) {
			const cuiPublicApiExtension = {
				usageConditionTableEditorPage: {
					reloadGrid: this.populateUsageConditionTableEditorGrid.bind(this)
				}
			};

			this._usageConditionTableEditorGridPage = new window.VmUsageConditionTableEditorGridPage({
				editorElement: usageConditionTableEditorElement,
				gridToolbarElement: usageConditionTableEditorGridToolbarElement,
				gridContainerElement: usageConditionTableEditorGridContainerElement,
				aras: this._aras,
				utils: this._utils,
				assetColumnLabel: assetColumnLabel,
				assetItemType: assetItemType,
				cuiPublicApiExtension: cuiPublicApiExtension
			});

			this._usageConditionTableEditorGridPage.isGridEditable = function() {
				return window.parent.isEditMode;
			};

			this._usageConditionTableEditorGridPage.on('assetChange', this._onAssetChangeHandler.bind(this));
			this._usageConditionTableEditorGridPage.on('usageConditionChange', this._onUsageConditionChangeHandler.bind(this));
		},

		_initVariabilityItemField: function(itemFieldFormatter, variabilityItemFieldContainerElement, variabilityItemNode) {
			// init soap module for itemProperty component
			ArasModules.soap(null, {async: true, method: 'ApplyItem', url: this._aras.getServerURL(), headers: this._aras.getHttpHeadersForSoapMessage('ApplyItem')});

			const changeItemConfirmationMessage = this._aras.getResource(
				this._vmSampleModuleSolutionBasedRelativePath,
				'usage_condition_table_editor_page.selection.variability_item_field.change_item_confirmation_message');

			const itemFieldHelper = new window.VmItemFieldHelper({
				aras: this._aras,
				initialItemNode: variabilityItemNode,
				changeItemConfirmationMessage: changeItemConfirmationMessage,
				onChangeItemHandler: this._onChangeVariabilityItemHandler.bind(this)
			});

			const itemFieldSettings = {
				itemtype: 'vm_VariabilityItem',
				fieldItemClassName: 'vm-usage-condition-table-editor-selection__variability-item-field',
				metadata: itemFieldHelper.getItemFieldHandlers()
			};

			window.Inferno.render(itemFieldFormatter(itemFieldSettings), variabilityItemFieldContainerElement);
		},

		_onChangeVariabilityItemHandler: function(variabilityItemNode) {
			this._variabilityItemNode = variabilityItemNode;

			const features = this._getFeaturesArrayBasedOnVariabilityItem(variabilityItemNode);

			this._usageConditionTableEditorGridPage.populateHeader(features);
		},

		_populateUsageConditionTableEditorGrid: function(variabilityItemNode) {
			this._usageConditionInfoByItsSourceItemId.clear();
			const features = this._getFeaturesArrayBasedOnVariabilityItem(variabilityItemNode);

			const usageConditionSourceItems = this._getUsageConditionSourceItems();
			if (usageConditionSourceItems.isError() && usageConditionSourceItems.getErrorCode() !== '0') {
				this._aras.AlertError(usageConditionSourceItems);
			}

			const assets = this._getAssetsArray(usageConditionSourceItems);

			this._usageConditionTableEditorGridPage.populate(assets, features);
		},

		_getRelationshipItemById: function(item, relationshipItemType, relationshipId, relationshipAction) {
			const foundRelationshipItem = item.getItemsByXPath('Relationships/Item[@id="' + relationshipId + '"]');

			let relationshipItem;

			if (foundRelationshipItem.getItemCount() === 0) {
				relationshipItem = item.createRelationship(relationshipItemType, relationshipAction);
				relationshipItem.setID(relationshipId);
			} else {
				relationshipItem = foundRelationshipItem.getItemByIndex(0);

				if (!relationshipItem.getAction()) {
					relationshipItem.setAction(relationshipAction);
				}
			}

			return relationshipItem;
		},

		_onAssetChangeHandler: function(event) {
			const detail = event.detail;
			const usageConditionSourceItemId = detail.rowId;
			const parentItem = window.parent.thisItem;
			const usageConditionSourceItem = this._getRelationshipItemById(parentItem, this._usageConditionSourceItemType, usageConditionSourceItemId, 'merge');

			usageConditionSourceItem.setAttribute('isDirty', '1');

			usageConditionSourceItem.setProperty('related_id', detail.assetItemId);

			this._itemViewController.setIsDirty(true);
		},

		_onUsageConditionChangeHandler: function(event) {
			const detail = event.detail;
			const usageConditionSourceItemId = detail.rowId;
			const definition = detail.definition;
			const usageConditionInfo = this._usageConditionInfoByItsSourceItemId.get(usageConditionSourceItemId);
			const parentItem = window.parent.thisItem;
			const usageConditionSourceItem = this._getRelationshipItemById(parentItem, this._usageConditionSourceItemType, usageConditionSourceItemId, 'merge');

			const usageConditionItemId = usageConditionInfo.usageConditionItemId;
			const usageConditionItem = this._getRelationshipItemById(usageConditionSourceItem, this._usageConditionItemType, usageConditionItemId, 'merge');

			const usageConditionVariabilityItemRelationshipItemId = usageConditionInfo.usageConditionVariabilityItemRelationshipItemId;
			const usageConditionToVariabilityItemRelationshipItem = this._getRelationshipItemById(
				usageConditionItem,
				this._usageConditionVariabilityItemRelationshipItemType,
				usageConditionVariabilityItemRelationshipItemId,
				'merge');

			usageConditionSourceItem.setAttribute('isDirty', '1');
			usageConditionItem.setAttribute('isDirty', '1');
			usageConditionToVariabilityItemRelationshipItem.setAttribute('isDirty', '1');

			usageConditionItem.setProperty('definition', definition);
			usageConditionToVariabilityItemRelationshipItem.setProperty('related_id', this._variabilityItemNode.getAttribute('id'));

			this._itemViewController.setIsDirty(true);
		},

		_onUnlockItemHandler: function() {
			if (!this._isDoneCommandExecuting) {
				this.populateUsageConditionTableEditorGrid();
			}
		},

		_getScopeStructureItem: function(itemId) {
			const targetScopeItem = this._buildTargetScopeItem(itemId);

			const scopeItem = this._aras.newIOMItem('Method', 'cfg_GetScopeStructure');
			scopeItem.setPropertyItem('targetScope', targetScopeItem);
			return scopeItem.apply();
		},

		_buildTargetScopeItem: function(itemId) {
			const targetScopeItem = this._aras.newIOMItem('Method', 'vm_scopeBuilder');
			targetScopeItem.setID(itemId);

			return targetScopeItem;
		},

		_parseScopeItemToFeaturesArray: function(scopeItem) {
			const features = [];

			const variableItems = scopeItem.getRelationships('Variable');
			const variableCount = variableItems.getItemCount();

			for (let variableIndex = 0; variableIndex < variableCount; variableIndex++) {
				const variableItem = variableItems.getItemByIndex(variableIndex);
				const variableId = variableItem.getID();
				const variableName = variableItem.getProperty('name');

				const namedConstantIds = [];
				const namedConstantNames = [];

				const namedConstantItems = variableItem.getRelationships('NamedConstant');
				const namedConstantCount = namedConstantItems.getItemCount();

				for (let namedConstantIndex = 0; namedConstantIndex < namedConstantCount; namedConstantIndex++) {
					const namedConstantItem = namedConstantItems.getItemByIndex(namedConstantIndex);
					const namedConstantId = namedConstantItem.getID();
					const namedConstantName = namedConstantItem.getProperty('name');

					namedConstantIds.push(namedConstantId);
					namedConstantNames.push(namedConstantName);
				}

				if (namedConstantNames.length) {
					features.push({
						id: variableId,
						name: variableName,
						optionIds: namedConstantIds,
						optionNames: namedConstantNames
					});
				}
			}

			return features;
		},

		_getFeaturesArrayBasedOnVariabilityItem: function(variabilityItemNode) {
			let features = [];

			if (variabilityItemNode) {
				const variabilityItemId = variabilityItemNode.getAttribute('id');

				features = this._featuresByVariabilityItemId.get(variabilityItemId);

				if (!features) {
					const scopeItem = this._getScopeStructureItem(variabilityItemId);
					if (scopeItem.isError()) {
						this._aras.AlertError(scopeItem);
						return [];
					}

					features = this._parseScopeItemToFeaturesArray(scopeItem);

					features.sort(this._featureComparer);

					this._featuresByVariabilityItemId.set(variabilityItemId, features);
				}
			}

			return features;
		},

		_featureComparer: function(firstFeature, secondFeature) {
			if (firstFeature.name < secondFeature.name) {
				return -1;
			}

			if (firstFeature.name > secondFeature.name) {
				return 1;
			}

			return 0;
		},

		_getUsageConditionSourceItems: function() {
			const usageConditionSourceItems = this._aras.newIOMItem(this._usageConditionSourceItemType, 'get');
			usageConditionSourceItems.setProperty('source_id', window.parent.item.getAttribute('id'));
			usageConditionSourceItems.setAttribute('select', 'related_id(keyed_name)');

			const usageConditionItem = usageConditionSourceItems.createRelationship(this._usageConditionItemType, 'get');
			usageConditionItem.setAttribute('select', 'definition');

			const usageConditionVariabilityItemRelationshipItem = usageConditionItem.createRelationship(this._usageConditionVariabilityItemRelationshipItemType, 'get');
			usageConditionVariabilityItemRelationshipItem.setAttribute('select', 'id');

			return usageConditionSourceItems.apply();
		},

		_getAssetsArray: function(usageConditionSourceItems) {
			const assets = [];

			const usageConditionSourceItemCount = usageConditionSourceItems.getItemCount();
			for (let i = 0; i < usageConditionSourceItemCount; i++) {
				const usageConditionSourceItem = usageConditionSourceItems.getItemByIndex(i);

				const usages = [];
				const usageConditionInfo = {};

				const usageConditionItems = usageConditionSourceItem.getRelationships();
				const usageConditionItemCount = usageConditionItems.getItemCount();

				for (let j = 0; j < usageConditionItemCount; j++) {
					const usageConditionItem = usageConditionItems.getItemByIndex(j);
					const usageConditionItemId = usageConditionItem.getId();

					if (usageConditionItemCount === 1) {
						const relatedVariabilityItems = usageConditionItem.getRelationships(this._usageConditionVariabilityItemRelationshipItemType);
						const usageConditionVariabilityItemRelationshipItemId = relatedVariabilityItems.getItemCount() === 1 ?
							relatedVariabilityItems.getItemByIndex(0).getId() : this._aras.generateNewGUID();

						usageConditionInfo.usageConditionVariabilityItemRelationshipItemId = usageConditionVariabilityItemRelationshipItemId;
						usageConditionInfo.usageConditionItemId = usageConditionItemId;
					}

					usages.push({
						id: usageConditionItemId,
						definition: usageConditionItem.getProperty('definition')
					});
				}

				if (usages.length === 0) {
					usageConditionInfo.usageConditionItemId = this._aras.generateNewGUID();
					usageConditionInfo.usageConditionVariabilityItemRelationshipItemId = this._aras.generateNewGUID();
				}

				const assetItem = usageConditionSourceItem.getRelatedItem();
				const usageConditionSourceItemId = usageConditionSourceItem.getId();

				this._usageConditionInfoByItsSourceItemId.set(
					usageConditionSourceItemId,
					usageConditionInfo
				);

				assets.push({
					rowId: usageConditionSourceItemId,
					id: assetItem ? assetItem.getID() : null,
					itemTypeName: assetItem ? assetItem.getType() : null,
					keyedName: assetItem ? assetItem.getProperty('keyed_name') : '',
					usages: usages
				});
			}

			return assets;
		}
	};

	window.VmUsageConditionTableEditorPageController = VmUsageConditionTableEditorPageController;
}(window));
