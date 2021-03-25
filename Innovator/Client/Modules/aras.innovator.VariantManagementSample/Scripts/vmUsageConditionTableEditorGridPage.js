(function(window, expressionBuilder) {
	'use strict';

	const GRID_FIXED_COLUMN_NAMES = {
		state: 'state',
		asset: 'asset'
	};

	const GRID_ROW_ADDITIONAL_DATA = {
		assetItemTypeName: 'assetItemTypeName',
		assetItemId: 'assetItemId'
	};

	const ASSET_COLUMN_WIDTH = 128;
	const SUBHEADER_HEIGHT = 160;
	const DEFAULT_COLUMN_WIDTH = 32;
    var gridData = {};
    var sortableAssetsData = [];
    var multiSortData = [];

	function VmUsageConditionTableEditorGridPage(parameters) {
		this._editorElement = parameters.editorElement;
		this._gridContainerElement = parameters.gridContainerElement;
		this._aras = parameters.aras;
		this._utils = parameters.utils;
		this._assetColumnLabel = parameters.assetColumnLabel;
		this._assetItemType = parameters.assetItemType;

		this._optionsInfoByFeatureId = new Map();
		this._selectedOptionIdsByFeatureIdByRowId = new Map();
		this._invalidRowIds = new Set();
		this._modifiedRowIds = new Set();
		this._itemTypeNameById = new Map();
		this._multipleUsageConditionRowIds = new Set();
		this._cuiPublicApiObject = this._constructCuiApi(parameters.cuiPublicApiExtension);

		this._init(parameters.gridToolbarElement);
	}

	VmUsageConditionTableEditorGridPage.prototype = {
		constructor: VmUsageConditionTableEditorGridPage,

		_editorElement: null,

		_gridContainerElement: null,

		_aras: null,

		_utils: null,

		_assetColumnLabel: null,

		_assetItemType: null,

		_grid: null,

		_focusedBooleanCell: null,

		_optionsInfoByFeatureId: null,

		_selectedOptionIdsByFeatureIdByRowId: null,

		_itemTypeNameById: null,

		_invalidRowIds: null,

		_modifiedRowIds: null,

		_multipleUsageConditionRowIds: null,

		_cuiPublicApiObject: null,

		_warningIconPath: '../images/Warning.svg',

		_editIconPath: '../images/Edit.svg',

		_vmModuleSolutionBasedRelativePath: '../Modules/aras.innovator.VariantManagementSample',

		_init: function(gridToolbarElement) {
			const gridElement = document.createElement('div');
			gridElement.classList.add('vm-usage-condition-table-editor__grid');

			this._gridContainerElement.appendChild(gridElement);

			const warningMessage = this._aras.getResource(
				this._vmModuleSolutionBasedRelativePath,
				'usage_condition_table_editor_grid.complex_usage_condition_warning_message');

			this._tooltipAnchorElement = document.createElement('div');
			this._tooltipAnchorElement.classList.add(
				'vm-usage-condition-table-editor__tooltip-anchor',
				'vm-usage-condition-table-editor__tooltip-anchor_hidden',
				'aras-tooltip');
			this._tooltipAnchorElement.setAttribute('data-tooltip', warningMessage);
			this._tooltipAnchorElement.setAttribute('data-tooltip-pos', 'right');
			this._tooltipAnchorElement.setAttribute('data-tooltip-show', true);

			this._gridContainerElement.appendChild(this._tooltipAnchorElement);

			this._loadToolbar(gridToolbarElement);

			this._grid = new window.Grid(gridElement, {search: true, editable: true, sortable: false, freezableColumns: true});

			this._grid.settings.frozenColumns = Object.keys(GRID_FIXED_COLUMN_NAMES).length;

			this._grid.on('resizeHead', this._onResizeHeadHandler.bind(this));

            this._grid.on('mouseover', this._onMouseOverHandler.bind(this));

			this._grid.on('applyEdit', this._onApplyEditHandler.bind(this));

			this._grid.on('focusCell', this._focusCellHandler.bind(this));

			this._grid.getCellMetadata = function(headId, rowId, type) {
				if (rowId === 'searchRow') {
					const optionsInfo = this._optionsInfoByFeatureId.get(headId);
					const optionNames = optionsInfo ? optionsInfo.optionNames : [];

					return {
						subheaderHeight: SUBHEADER_HEIGHT,
						subheaders: optionNames,
						subheaderContainerClassName: 'vm-aras-grid-row-cell-subheaders__subheader-container_vertical',
                        subheaderTextClassName: 'vm-aras-grid-row-cell-subheaders__subheader-text_vertical',
                        multiSelectUtilities: {
                            singleSelectSubHeader: this.singleSelectSubHeader.bind(this),
                            getSortingKeys: this.getSortingKeys.bind(this),
                            clearMultiSortData: this.clearMultiSortData.bind(this),
                            updateMultiSelectStatus: this.updateMultiSelectStatus.bind(this)
                        },
                        optionsInfo: optionsInfo,
                        gridData: gridData,
                        populate: this.populate.bind(this),
                    };
				}

				if (headId === GRID_FIXED_COLUMN_NAMES.state) {
					if (this._invalidRowIds.has(rowId)) {
						return {
							onMouseOverHandler: function(e) {
								const iconElementBoundingClientRect = e.target.getBoundingClientRect();

								this._tooltipAnchorElement.style.left = iconElementBoundingClientRect.left + iconElementBoundingClientRect.width + 'px';
								this._tooltipAnchorElement.style.top = iconElementBoundingClientRect.top + 'px';
								this._tooltipAnchorElement.style.height = iconElementBoundingClientRect.height + 'px';

								this._tooltipAnchorElement.classList.remove('vm-usage-condition-table-editor__tooltip-anchor_hidden');
							}.bind(this),
							onMouseOutHandler: function(e) {
								this._tooltipAnchorElement.classList.add('vm-usage-condition-table-editor__tooltip-anchor_hidden');
							}.bind(this)
						};
					}

					return null;
				}

				if (headId === GRID_FIXED_COLUMN_NAMES.asset) {
					const row = this._grid.rows.get(rowId);
					const assetItemTypeName = row[GRID_ROW_ADDITIONAL_DATA.assetItemTypeName];

					return {
						iconUrl: assetItemTypeName && this._utils.getItemTypeIconUrl(assetItemTypeName),
						itemType: this._assetItemType,
						editorClickHandler: this._showChangeAssetSearchDialog.bind(this)
					};
				}

				return {
					focusedBoolean: this._focusedBooleanCell,
					isBooleanValuesSelectionAvailable: !this._invalidRowIds.has(rowId)
				};
			}.bind(this);

			this._grid.getCellType = function(headId, rowId, value, type) {
				if (headId === GRID_FIXED_COLUMN_NAMES.state) {
					return 'vm_icon';
				}

				if (headId === GRID_FIXED_COLUMN_NAMES.asset) {
					const row = this._grid.rows.get(rowId);

					if (!row[GRID_ROW_ADDITIONAL_DATA.assetItemTypeName]) {
						return 'text';
					}

					return 'vm_iconText';
				}

				return 'vm_multipleBooleanValuesSelection';
			}.bind(this);

			this._grid.getEditorType = function(headId, rowId, value, grid) {
				if (headId === GRID_FIXED_COLUMN_NAMES.asset) {
					return 'item';
				}

				return 'nonEditable';
			};

			this._grid.checkEditAvailability = function(headId, itemId, grid) {
				return this.isGridEditable();
			}.bind(this);

			this._initGridContextMenu();
		},

		isGridEditable: function() {
			return true;
		},

		on: function(type, eventListener) {
			this._grid.on(type, eventListener);
		},

		off: function(type, eventListener) {
			this._grid.off(type, eventListener);
		},

        getSortingKeys: function () {
            return multiSortData.map((i) => i.optionId);
        },

        singleSelectSubHeader: function (data) {
            multiSortData.push(data);
        },

        clearMultiSortData: function () {
            multiSortData = [];
        },

        updateMultiSelectStatus: function (optionId, subheaderText) {
            const selectedItem = multiSortData.find(i => i.optionId.includes(optionId));
            if (selectedItem) {
                multiSortData = multiSortData.map((item) => {
                    if (item.optionId.includes(optionId)) {
                        if (item.ascending) {
                            const formattedOptionId = optionId.includes("!") ? optionId.split("!")[1] : optionId;
                            item = { ...item, ascending: false, optionId: formattedOptionId };
                        } else {
                            item = { ...item, ascending: true, optionId: "!" + optionId };
                        }
                    }

                    return item;
                });
            } else {
                multiSortData.push({ optionId: "!" + optionId, subheaderText, ascending: true });
            }
        },

        populate: function (assets, features) {
            const featureIds = features.map(i => i.id);
            gridData = { features };
			this._optionsInfoByFeatureId.clear();
			this._selectedOptionIdsByFeatureIdByRowId.clear();
			this._invalidRowIds.clear();
			this._modifiedRowIds.clear();
			this._multipleUsageConditionRowIds.clear();
			this._focusedBooleanCell = {};

			this._grid.cancelEdit();

			this._populateHead(features, this._optionsInfoByFeatureId);

			const rows = new Map();
            assets = assets.map((i) => {
                return {
                    rowId: i.rowId,
                    itemTypeName: i.itemTypeName,
                    keyedName: i.keyedName,
                    usages: i.usages
                };
            });
			assets.forEach(function(asset) {
				const rowId = asset.rowId;

				const row = {
					[GRID_ROW_ADDITIONAL_DATA.assetItemId]: asset.id,
					[GRID_ROW_ADDITIONAL_DATA.assetItemTypeName]: asset.itemTypeName,
					[GRID_FIXED_COLUMN_NAMES.asset]: asset.keyedName
				};

				this._setUsageDefinitionToRow(rowId, row, asset.usages);

				rows.set(rowId, row);
			}.bind(this));

			this._grid.rows = rows;

			this._updateAssetState();

            sortableAssetsData = [];    
            assets.forEach((asset) => {
                var assetData = this._grid.rows.get(asset.rowId);
                featureIds.forEach((id) => {
                    const subHeaderData = assetData[id];
                    asset = { ...asset, ...subHeaderData };
                });
                sortableAssetsData.push(asset);
            })

            gridData = { ...gridData, sortableAssetsData };
		},

		populateHeader: function(features) {
			this._optionsInfoByFeatureId.clear();
			this._invalidRowIds.clear();

			this._populateHead(features, this._optionsInfoByFeatureId);

			this._grid.rows._store.forEach(function(row, rowId) {
				const selectedOptionIdsByFeatureId = this._selectedOptionIdsByFeatureIdByRowId.get(rowId);
				this._populateRowWithSelectedOptions(row, selectedOptionIdsByFeatureId);
			}.bind(this));

			this._updateAssetState();
		},

		_populateHead: function(features, optionsInfoByFeatureId) {
			if (!features.length) {
				this._editorElement.classList.add('vm-usage-condition-table-editor_hidden');
				return;
			}

			this._editorElement.classList.remove('vm-usage-condition-table-editor_hidden');

			const head = new Map();

			head.set(GRID_FIXED_COLUMN_NAMES.state, {
				label: '',
				width: DEFAULT_COLUMN_WIDTH,
				resizable: false,
				searchType: 'vm_subheaders'
			});

			head.set(GRID_FIXED_COLUMN_NAMES.asset, {
				label: this._assetColumnLabel,
				width: ASSET_COLUMN_WIDTH,
				searchType: 'vm_subheaders'
			});

			features.forEach(function(feature) {
				optionsInfoByFeatureId.set(feature.id, {
					optionIds: feature.optionIds,
					optionNames: feature.optionNames
				});

				const headWidth = DEFAULT_COLUMN_WIDTH * feature.optionNames.length;

				head.set(feature.id, {
					label: feature.name,
					width: headWidth,
					minWidth: headWidth,
					searchType: 'vm_subheaders'
				});
			});

			this._grid.head = head;
		},

		_initGridContextMenu: function() {
			const topWindow = this._aras.getMostTopWindowWithAras();

			topWindow.cuiContextMenu(
					new window.ArasModules.ContextMenu(),
					'vm_usageConditionTableEditorGridCtxMenu',
					this._cuiPublicApiObject
				)
				.then(function(contextMenu) {
					const gridRowContextMenuHandler = function(rowId, e) {
						e.preventDefault();

						contextMenu.show({x: e.clientX, y: e.clientY}, {usageConditionSourceItemId: rowId});
					};

					this._grid.on('contextmenu', gridRowContextMenuHandler, 'row');
				}.bind(this));
		},

		_setUsageDefinitionToRow: function(rowId, row, assetUsages) {
			if (assetUsages.length > 1) {
				this._multipleUsageConditionRowIds.add(rowId);
			}

			const selectedOptionIdsByFeatureId = this._getSelectedOptionIdsByFeatureIdFromAssetUsages(assetUsages);

			this._populateRowWithSelectedOptions(row, selectedOptionIdsByFeatureId);

			this._selectedOptionIdsByFeatureIdByRowId.set(rowId, selectedOptionIdsByFeatureId);
		},

		_populateRowWithSelectedOptions: function(row, selectedOptionIdsByFeatureId) {
			this._optionsInfoByFeatureId.forEach(function(optionsInfo, featureId) {
				const optionCellValues = {};
				const selectedOptionIds = selectedOptionIdsByFeatureId && selectedOptionIdsByFeatureId.get(featureId) || new Set();

				optionsInfo.optionIds.forEach(function(optionId) {
					optionCellValues[optionId] = selectedOptionIds.has(optionId);
				});

				row[featureId] = optionCellValues;
			});
		},

		_updateAssetState: function() {
			this._selectedOptionIdsByFeatureIdByRowId.forEach(function(selectedOptionIdsByFeatureId, rowId) {
				let isUsageConditionComplex = !selectedOptionIdsByFeatureId;

				if (!isUsageConditionComplex) {
					const usageConditionFeatureIds = Array.from(selectedOptionIdsByFeatureId.keys());

					isUsageConditionComplex = usageConditionFeatureIds.some(function(usageConditionFeatureId) {
						return !this._optionsInfoByFeatureId.has(usageConditionFeatureId);
					}.bind(this));
				}

				let iconPath;

				if (isUsageConditionComplex) {
					this._invalidRowIds.add(rowId);

					iconPath = this._warningIconPath;
				} else if (this._modifiedRowIds.has(rowId)) {
					iconPath = this._editIconPath;
				}

				this._setStateIcon(rowId, iconPath);
			}.bind(this));
		},

		_loadToolbar: function(toolbarElement) {
			const toolbar = new window.Toolbar();
			toolbarElement.appendChild(toolbar);

			const topWindow = this._aras.getMostTopWindowWithAras();
			topWindow.cuiToolbar(
					toolbar,
					'vm_usageConditionTableEditorGridToolbar',
					this._cuiPublicApiObject
				)
				.then(function() {
					const isToolbarHavingElements = toolbar.data.size > 0;
					toolbarElement.classList.toggle('vm-toolbar', isToolbarHavingElements);
				});
		},

		_onResizeHeadHandler: function(e) {
			const headId = this._grid.settings.indexHead[e.detail.index];
			const head = this._grid.head.get(headId);
			if (head && head.minWidth) {
				head.width = Math.max(head.width, head.minWidth);
				this._grid.head.set(headId, head);
			}
		},

        _onMouseOverHandler: function (e) {
            let link = e.target;
            if (!link) return;
            let text = link.textContent;
          
            const width = (this._getTextWidth(text, link));
            const iconElementBoundingClientRect = e.target.getBoundingClientRect();
            const headersClassName = link.className;
          
            if (headersClassName === "aras-grid-head-cell") {
                if (Math.ceil(iconElementBoundingClientRect.width) < width) {
                    link.title = text;
                } else {
                    link.title = "";
                }
            } else if (headersClassName === "aras-grid-head-cell-label-text") {
                if (Math.ceil(iconElementBoundingClientRect.width) < width) {
                    link.title = text;
                } else {
                    link.title = "";
                }
            } else if (headersClassName === "vm-aras-grid-row-cell-subheaders__subheader-text vm-aras-grid-row-cell-subheaders__subheader-text_vertical") {
                if (width > (SUBHEADER_HEIGHT - DEFAULT_COLUMN_WIDTH)) {
                    link.title = text;
                } else {
                    link.title = "";
                }
            } 
        },
        
        _getTextWidth: function (text, link) {       

            let font = window.getComputedStyle(link, null).getPropertyValue('font');
            let fontSize = window.getComputedStyle(link, null).getPropertyValue('font-size');
            let paddingLeft = window.getComputedStyle(link, null).getPropertyValue('padding-left');
            let paddingRight = window.getComputedStyle(link, null).getPropertyValue('padding-right');

            let newlyCreatedDOMNode = document.createElement("div");
            document.body.appendChild(newlyCreatedDOMNode);

            newlyCreatedDOMNode.style.font = font;
            newlyCreatedDOMNode.style.fontSize = fontSize;
            newlyCreatedDOMNode.style.height = 'auto';
            newlyCreatedDOMNode.style.width = 'auto';
            newlyCreatedDOMNode.style.position = 'absolute';
            newlyCreatedDOMNode.style.whiteSpace = 'no-wrap';
            newlyCreatedDOMNode.style.paddingLeft = paddingLeft;
            newlyCreatedDOMNode.style.paddingRight = paddingRight;
            newlyCreatedDOMNode.innerHTML = text;

            let width = Math.ceil(newlyCreatedDOMNode.clientWidth);

            document.body.removeChild(newlyCreatedDOMNode);
            return width;
        },

		_onApplyEditHandler: function(e) {
			const headId = e.detail.headId;
			const rowId = e.detail.rowId;
			const value = e.detail.value;

			if (this._optionsInfoByFeatureId.has(headId)) {
				this._onFeatureEditHandler(headId, rowId, value);
			} else if (headId === GRID_FIXED_COLUMN_NAMES.asset) {
				this._onAssetEditHandler(rowId, value);
			}
		},

		_onFeatureEditHandler: function(featureId, rowId, optionCellValues) {
			const selectedOptionIds = new Set();
			const optionIds = Object.keys(optionCellValues);
			optionIds.forEach(function(optionId) {
				if (optionCellValues[optionId]) {
					selectedOptionIds.add(optionId);
				}
			});

			const selectedOptionIdsByFeatureId = this._selectedOptionIdsByFeatureIdByRowId.get(rowId);
			if (selectedOptionIds.size) {
				selectedOptionIdsByFeatureId.set(featureId, selectedOptionIds);
			} else {
				selectedOptionIdsByFeatureId.delete(featureId);
			}

			this._setRowEditState(rowId);

			const definition = expressionBuilder.buildExpression(selectedOptionIdsByFeatureId, true);
			this._dispatchUsageConditionChangeEvent(rowId, definition);
		},

		_setRowEditState(rowId) {
			this._setStateIcon(rowId, this._editIconPath);
			this._modifiedRowIds.add(rowId);
		},

		_dispatchUsageConditionChangeEvent: function(rowId, definition) {
			const usageConditionChangeEventData = {
				detail: {
					rowId: rowId,
					definition: definition
				}
			};

			this._grid.dom.dispatchEvent(new CustomEvent('usageConditionChange', usageConditionChangeEventData));
		},

		_focusCellHandler: function(e) {
			const isFrozenColumnCell = e.detail && Object.values(GRID_FIXED_COLUMN_NAMES).includes(this._grid.settings.indexHead[e.detail.indexHead]);

			if (!e.detail || isFrozenColumnCell) {
				this._focusedBooleanCell = {};
			}

			if (e.detail) {
				this._gridContainerElement.classList.toggle('vm-disable-active-cell', !isFrozenColumnCell);
			}
		},

		_showChangeAssetSearchDialog: function() {
			const topWnd = this._aras.getMostTopWindowWithAras();
			const rowId = this._grid.settings.focusedCell.rowId;

			topWnd.ArasModules.MaximazableDialog.show('iframe', {
				aras: this._aras,
				itemtypeName: this._assetItemType,
				type: 'SearchDialog'
			}).promise.then(function(result) {
				if (result) {
					this._changeRowAsset(rowId, result.keyed_name, result.item);
				}
			}.bind(this));
		},

		_onAssetEditHandler: function(rowId, assetKeyedName) {
			const assetItemNode = assetKeyedName ? this._aras.getItemByKeyedName(this._assetItemType, assetKeyedName) : null;
			this._changeRowAsset(rowId, assetKeyedName, assetItemNode);
		},

		_changeRowAsset(rowId, keyedName, assetItemNode) {
			const row = this._grid.rows.get(rowId);

			let assetItemId = null;
			let assetItemTypeName;

			if (assetItemNode) {
				const itemTypeId = this._aras.getItemProperty(assetItemNode, 'itemtype') || assetItemNode.getAttribute('typeId');

				if (itemTypeId) {
					assetItemTypeName = this._getItemTypeNameById(itemTypeId);
				} else {
					assetItemTypeName = assetItemNode.getAttribute('type');
				}

				assetItemId = assetItemNode.getAttribute('id');
			}

			row[GRID_ROW_ADDITIONAL_DATA.assetItemId] = assetItemId;
			row[GRID_ROW_ADDITIONAL_DATA.assetItemTypeName] = assetItemTypeName;
			row[GRID_FIXED_COLUMN_NAMES.asset] = keyedName;

			this._grid.rows.set(rowId, row);

			this._setRowEditState(rowId);

			this._dispatchAssetChangeEvent(rowId, assetItemId);
		},

		_getItemTypeNameById: function(itemTypeId) {
			let itemTypeName = this._itemTypeNameById.get(itemTypeId);

			if (!itemTypeName) {
				itemTypeName = this._aras.getItemTypeName(itemTypeId);
				this._itemTypeNameById.set(itemTypeId, itemTypeName);
			}

			return itemTypeName;
		},

		_dispatchAssetChangeEvent: function(rowId, assetItemId) {
			const assetChangeEventData = {
				detail: {
					rowId: rowId,
					assetItemId: assetItemId
				}
			};

			this._grid.dom.dispatchEvent(new CustomEvent('assetChange', assetChangeEventData));
		},

		_setStateIcon: function(rowId, iconUrl) {
			const row = this._grid.rows.get(rowId);
			row[GRID_FIXED_COLUMN_NAMES.state] = iconUrl;
			this._grid.rows.set(rowId, row);
		},

		_getSelectedOptionIdsByFeatureIdFromAssetUsages: function(usages) {
			const selectedOptionIdsByFeatureId = new Map();

			if (usages.length === 0) {
				return selectedOptionIdsByFeatureId;
			}

			if (usages.length > 1) {
				return null;
			}

			const expressionNode = this._getExpressionNode(usages[0].definition);
			if (!expressionNode) {
				return selectedOptionIdsByFeatureId;
			}

			const isExpressionParsedSuccessfully = this._tryParseExpressionAndFillMapWithSelectedOptionIds(expressionNode.childNodes, selectedOptionIdsByFeatureId);

			return isExpressionParsedSuccessfully ? selectedOptionIdsByFeatureId : null;
		},

		_tryParseExpressionAndFillMapWithSelectedOptionIds: function(expressionRootNodes, selectedOptionIdsByFeatureId) {
			let isExpressionParsedSuccessfully = false;

			const rootNodeCount = expressionRootNodes.length;
			if (rootNodeCount === 1) {
				const rootNode = expressionRootNodes[0];
				const rootNodeName = rootNode.nodeName.toUpperCase();

				switch (rootNodeName) {
					case 'AND':
						isExpressionParsedSuccessfully = this._tryParseAndNodeChildrenAsFeatureGroups(rootNode.childNodes, selectedOptionIdsByFeatureId);
						break;
					case 'OR':
						isExpressionParsedSuccessfully = this._tryParseOrNodeAsOptionGroup(rootNode, selectedOptionIdsByFeatureId);
						break;
					case 'EQ':
						isExpressionParsedSuccessfully = this._tryParseEqNodeAsOptionGroup(rootNode, selectedOptionIdsByFeatureId);
						break;
				}
			} else if (rootNodeCount > 1) {
				isExpressionParsedSuccessfully = this._tryParseAndNodeChildrenAsFeatureGroups(expressionRootNodes, selectedOptionIdsByFeatureId);
			} else {
				isExpressionParsedSuccessfully = true;
			}

			return isExpressionParsedSuccessfully;
		},

		_parseEqNodeToFeatureOptionPair: function(node) {
			const getNodeTextContent = function(nodeXPath) {
				return node.selectSingleNode(nodeXPath).text;
			};

			return {
				featureId: getNodeTextContent('variable/@id'),
				optionId: getNodeTextContent('named-constant/@id')
			};
		},

		_tryParseEqNodeAsOptionGroup: function(node, selectedOptionIdsByFeatureId) {
			const featureOptionPair = this._parseEqNodeToFeatureOptionPair(node);

			if (selectedOptionIdsByFeatureId.has(featureOptionPair.featureId)) {
				return false;
			}

			const selectedOptionIds = new Set([featureOptionPair.optionId]);
			selectedOptionIdsByFeatureId.set(featureOptionPair.featureId, selectedOptionIds);

			return true;
		},

		_tryParseOrNodeAsOptionGroup: function(node, selectedOptionIdsByFeatureId) {
			let firstFeatureId;

			const selectedOptionIds = new Set();
			const childNodes = node.childNodes;

			for (let i = 0; i < childNodes.length; i++) {
				const childNode = childNodes[i];

				if (!this._isNodeNameEqualsToStringCaseInsensitive(childNode, 'EQ')) {
					return false;
				}

				const featureOptionPair = this._parseEqNodeToFeatureOptionPair(childNode);

				if (i === 0) {
					firstFeatureId = featureOptionPair.featureId;

					if (selectedOptionIdsByFeatureId.has(firstFeatureId)) {
						return false;
					}

					selectedOptionIdsByFeatureId.set(firstFeatureId, selectedOptionIds);
				} else if (featureOptionPair.featureId !== firstFeatureId) {
					return false;
				}

				selectedOptionIds.add(featureOptionPair.optionId);
			}

			return true;
		},

		_tryParseAndNodeChildrenAsFeatureGroups: function(andNodeChildren, selectedOptionIdsByFeatureId) {
			for (let i = 0; i < andNodeChildren.length; i++) {
				const childNode = andNodeChildren[i];
				const childNodeName = childNode.nodeName.toUpperCase();

				switch (childNodeName) {
					case 'OR':
						if (!this._tryParseOrNodeAsOptionGroup(childNode, selectedOptionIdsByFeatureId)) {
							return false;
						}
						break;
					case 'EQ':
						if (!this._tryParseEqNodeAsOptionGroup(childNode, selectedOptionIdsByFeatureId)) {
							return false;
						}
						break;
					default:
						return false;
				}
			}

			return true;
		},

		_getExpressionNode: function(expressionXml) {
			const expressionDocument = new window.XmlDocument();
			const isXmlLoadedSuccessfully = expressionDocument.loadXML(
				expressionXml.replace(/[\r\n\t]/g, '')
			);

			return isXmlLoadedSuccessfully &&
				this._isNodeNameEqualsToStringCaseInsensitive(
					expressionDocument.documentElement,
					'expression'
				) ? expressionDocument.documentElement :
					null;
		},

		_isNodeNameEqualsToStringCaseInsensitive: function(node, name) {
			return node.nodeName.toUpperCase() === name.toUpperCase();
		},

		_constructCuiApi: function(cuiApiExtension) {
			const usageConditionGridPage = this;

			const cuiApiObject = {
				grid: {
					getSelectedRowIds: function() {
						return usageConditionGridPage._grid.settings.selectedRows.slice();
					},

					getRowIds: function() {
						return [...usageConditionGridPage._grid.rows._store.keys()];
					},

					getAsset: function(rowId) {
						const row = usageConditionGridPage._grid.rows.get(rowId);

						const assetItemId = row[GRID_ROW_ADDITIONAL_DATA.assetItemId];

						if (!assetItemId) {
							return null;
						}

						const assetItemTypeName = row[GRID_ROW_ADDITIONAL_DATA.assetItemTypeName];
						const assetKeyedName = row[GRID_FIXED_COLUMN_NAMES.asset];

						return {
							id: assetItemId,
							itemTypeName: assetItemTypeName,
							keyedName: assetKeyedName
						};
					},

					setAsset: function(rowId, assetInfo) {
						let assetKeyedName = '';
						let assetItemNode = null;

						if (assetInfo) {
							const assetItem = usageConditionGridPage._aras.newIOMItem(assetInfo.itemTypeName);
							assetItem.setID(assetInfo.id);

							assetKeyedName = assetInfo.keyedName;
							assetItemNode = assetItem.node;
						}

						usageConditionGridPage._changeRowAsset(rowId, assetKeyedName, assetItemNode);
					},

					getUsageCondition: function(rowId) {
						const selectedOptionIdsByFeatureId = usageConditionGridPage._selectedOptionIdsByFeatureIdByRowId.get(rowId);

						return selectedOptionIdsByFeatureId ? expressionBuilder.buildExpression(selectedOptionIdsByFeatureId, true) : null;
					},

					setUsageCondition: function(rowId, definition) {
						if (usageConditionGridPage._multipleUsageConditionRowIds.has(rowId)) {
							throw new Error(`The row with id "${rowId}" has more than one usage condition. This operation is invalid.`);
						}

						const assetUsages = [
							{
								definition: definition
							}
						];

						const row = usageConditionGridPage._grid.rows.get(rowId);

						usageConditionGridPage._setUsageDefinitionToRow(rowId, row, assetUsages);

						usageConditionGridPage._grid.rows.set(rowId, row);

						usageConditionGridPage._setRowEditState(rowId);

						usageConditionGridPage._dispatchUsageConditionChangeEvent(rowId, definition);
					},

					on: function(eventName, callback) {
						usageConditionGridPage.on(eventName, callback);
					},

					off: function(eventName, callback) {
						usageConditionGridPage.off(eventName, callback);
					}
				}
			};

			return Object.assign({}, cuiApiExtension, cuiApiObject);
		}
	};

	window.VmUsageConditionTableEditorGridPage = VmUsageConditionTableEditorGridPage;
}(window, window.VmExpressionBuilder));
