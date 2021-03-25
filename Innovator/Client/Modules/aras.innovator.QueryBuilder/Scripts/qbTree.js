/* global define,dojo, treeNodeTemplate */
define([
	'dojo/_base/declare',
	'dijit/dijit',
	'dijit/tree/ObjectStoreModel',
	'QB/Scripts/qbTreeStore',
	'QB/Scripts/qbTreeEnum',
	'dijit/TooltipDialog',
	'dijit/popup',
	'QB/Scripts/ConditionsTree',
	'QB/Scripts/qbTreeNavTemplate',
	'QB/Scripts/conditionTreeNavigator',
	'QB/Scripts/ConditionTreeVisitor/textPortionsPrinter',
	'QB/Scripts/qbExecutor'
], function (
	declare,
	dijit,
	ObjectStoreModel,
	qbTreeStore,
	QbTreeEnum,
	TooltipDialog,
	popup,
	ConditionsTree,
	treeNavigatorTemplate,
	ConditionTreeNavigator,
	TextPortionsPrinter,
	qbExecutor
) {
	let isPopupCloseOverridden = false;
	function overridePopupClose() {
		if (isPopupCloseOverridden) {
			return;
		}
		var oldPopupClose = popup.close;
		popup.close = function (dlg) {
			if (dlg) {
				oldPopupClose.call(this, dlg);
			}
		};
		isPopupCloseOverridden = true;
	}

	var aras = parent.aras;
	var tooltipDialog;
	var openedForEditClass = 'opened-for-edit';
	var activeClassName = 'active';
	var filledClassName = 'filled';
	var hiddenClassName = 'hidden';
	var treeButtonClickHandlers = {};
	var treeButtonHoverHandlers = {};

	var conditionEditorArgs = {};

	let customizationConfig;

	conditionEditorArgs.joinCondition = function (event, treeItem) {
		if (!treeItem.parentId) {
			return;
		}
		var parentTreeItem = tree.getTreeElementById(treeItem.parentId);
		var queryDefinitionItem = treeItem.node.selectSingleNode(
			'ancestor::Item[@type="qry_QueryDefinition"]'
		);
		var qrXPath =
			"Relationships/Item[@type='qry_QueryReference' and (ref_id='" +
			treeItem.referenceRefId +
			"')]";
		var queryReferenceItem = queryDefinitionItem.selectSingleNode(qrXPath);
		var args = tree.createOnLoadArgs(treeItem, 'clickJoin', null, event.target);
		args.mode = 'editQueryReferenceConditions';

		args.intelliSenseItems = {
			elements: [parentTreeItem._element, treeItem._element],
			parameters: tree.getPossibleParameters(treeItem)
		};

		args.queryReferencePathArray = tree
			.getAllQueryReferencePath(treeItem)
			.concat(tree.getAllQueryReferencePath(parentTreeItem));

		args.queryReferenceItem = queryReferenceItem;
		args.closeCallback = function (resultObj) {
			var tree = this;

			var queryReferenceItem = resultObj && resultObj.queryReferenceItem;
			var newXml = resultObj && resultObj.newXml;
			if (!resultObj || !newXml || !queryReferenceItem) {
				return;
			}
			var currentFilterXml = aras.getItemProperty(
				queryReferenceItem,
				'filter_xml'
			);
			if (currentFilterXml !== newXml) {
				aras.setItemProperty(queryReferenceItem, 'filter_xml', newXml);
			}
			if (!aras.isNew(queryReferenceItem)) {
				queryReferenceItem.setAttribute('action', 'update');
			}
			tree.treeStore.dataStore.setMainItemToUpdate();
		}.bind(tree);

		return args;
	};

	conditionEditorArgs.base = function (event, treeItem) {
		if (!tree.beforeOpenPopupDialog(treeItem)) {
			return;
		}

		var args = tree.createOnLoadArgs(treeItem, 'click', null, event.target);
		args.title = 'Conditions Editor';
		args.width = 600;
		args.height = 235;
		args.resizable = false;
		args.content =
			'../Modules/aras.innovator.QueryBuilder/Views/conditionsView.html';

		return args;
	};

	conditionEditorArgs.whereUseCondition = function (event, treeItem) {
		var args = tree.createOnLoadArgs(
			treeItem,
			'clickWhereUse',
			null,
			event.target
		);
		args.queryReferencePathArray = tree.getAllQueryReferencePath(treeItem);

		//here
		args.refreshView = tree.refreshView.bind(tree);
		args.closeCallback = function (resultXml) {
			if (!resultXml) {
				return;
			}
			var currentFilterXml = aras.getItemProperty(treeItem.node, 'filter_xml');
			if (resultXml === '<condition/>') {
				if (!currentFilterXml) {
					return;
				} else {
					aras.setItemProperty(treeItem.node, 'filter_xml', null);
				}
			} else {
				if (currentFilterXml) {
					if (currentFilterXml === resultXml) {
						return;
					}
					aras.setItemProperty(treeItem.node, 'filter_xml', resultXml);
				} else {
					aras.setItemProperty(treeItem.node, 'filter_xml', resultXml);
				}
			}
			if (treeItem.node.getAttribute('isNew') !== '1') {
				treeItem.node.setAttribute('action', 'update');
			}
			self.dataStore.setMainItemToUpdate();
		};
		args.intelliSenseItems = {
			aggregateConditions: tree.getPossibleAggregateConditions.bind(tree)(
				treeItem
			),
			properties: treeItem.properties.map(function (prop) {
				return { name: prop.label, id: prop.name };
			}),
			parameters: tree.getPossibleParameters(treeItem)
		};
		return args;
	};

	var removeSelection = function () {
		var activeBtn = document.querySelector('.command-div.' + activeClassName);

		if (activeBtn) {
			document
				.querySelector('.command-div.' + activeClassName)
				.classList.remove(activeClassName);
		}

		var openedForEdit = document.querySelector(
			'.command-container.' + openedForEditClass
		);
		if (openedForEdit) {
			openedForEdit.classList.remove(openedForEditClass);
		}
	};
	var closePopup = function () {
		if (!tooltipDialog) {
			return;
		}

		if (tooltipDialog.domNode) {
			var frameNode = tooltipDialog.domNode.querySelector('iframe');
			if (
				frameNode.contentDocument &&
				frameNode.contentDocument.readyState !== 'complete'
			) {
				frameNode.contentWindow.addEventListener(
					'load',
					function () {
						if (!tooltipDialog) {
							return;
						}
						setTimeout(
							function () {
								if (!tooltipDialog) {
									return;
								}
								popup.close(tooltipDialog);
								tooltipDialog = null;
								removeSelection();
							}.bind(this),
							0
						);
					}.bind(this)
				);
				return;
			}
		}
		popup.close(tooltipDialog);
		tooltipDialog = null;
		removeSelection();
	};

	function treeModelCollectionToTreeData(treeModelCollection) {
		var treeData = new Map();
		var treeRoots = new Set();
		treeModelCollection.forEach(function (modelItem) {
			var id = modelItem.id;
			if (id === 'root') {
				treeRoots.add(id);
			}
			treeData.set(id, modelItem);
		});
		treeData.forEach(function (val, key, thisMap) {
			if (val.parentId && thisMap.has(val.parentId)) {
				var parentVal = thisMap.get(val.parentId);
				if (
					parentVal.children &&
					!parentVal.children.some(function (child) {
						return child === key;
					})
				) {
					parentVal.children.push(key);
				} else {
					parentVal.children = [key];
				}

				for (var i = 0; i < parentVal.children.length; i++) {
					if (
						self.tree &&
						!self.tree.treeStore.getTreeNodeById(parentVal.children[i])
					) {
						parentVal.children.splice(i, 1);
					}
				}
			}
		});
		return {
			dataset: treeData,
			roots: treeRoots
		};
	}

	treeButtonClickHandlers.conditions = function (event, treeItem) {
		if (tree._isReadOnly || !tree.beforeOpenPopupDialog(treeItem)) {
			return;
		}

		var args = conditionEditorArgs.base(event, treeItem);

		args.join = conditionEditorArgs.joinCondition(event, treeItem);
		args.whereUse = conditionEditorArgs.whereUseCondition(event, treeItem);
		args.closeCallback = function (resultObject) {
			if (resultObject.joinResult) {
				this.join.closeCallback(resultObject.joinResult);
			}

			if (resultObject.whereUseResult) {
				this.whereUse.closeCallback(resultObject.whereUseResult);
			}

			tree.refreshView();
		};

		tree.showPopupView(
			'conditionsView.html',
			'btnConditionsId',
			event.target,
			args
		);
	};

	treeButtonClickHandlers.properties = treeButtonClickHandlers.sortOrder = function (
		event,
		treeItem
	) {
		if (tree._isReadOnly || !tree.beforeOpenPopupDialog(treeItem)) {
			return;
		}

		var commandNode = event.target;
		var args = tree.createOnLoadArgs(treeItem, 'click', null, commandNode);
		args.closeCallback = tree.refreshView.bind(tree);

		if (commandNode.classList.contains('query-item-controls__properties')) {
			args.customizationConfig = customizationConfig;
			return tree.showPopupView(
				'propertiesView.html',
				'btnPropertiesId',
				commandNode,
				args
			);
		}

		tree.showPopupView('orderView.html', 'btnSortOrderId', event.target, args);
	};

	treeButtonClickHandlers.recursion = function (event, treeItem) {
		var queryDefinitionItem = treeItem.node.selectSingleNode(
			'ancestor::Item[@type="qry_QueryDefinition"]'
		);
		var qItem = dataLoader.getQueryItemByRefId(
			queryDefinitionItem,
			treeItem.refId
		);
		var rootId = tree.treeStore.dataStore
			.getRootElement()
			.node.getAttribute('id');
		var needSelectId = qItem.getAttribute('id');
		needSelectId = needSelectId == rootId ? 'root' : needSelectId;
		tree.tree.select(needSelectId);
	};

	treeButtonHoverHandlers.conditions = function (event, treeItem) {
		if (!tree.beforeOpenPopupDialog(treeItem)) {
			return;
		}
		var argsWhere = tree.createOnLoadArgs(treeItem, 'hoverWhereUse');
		argsWhere.intelliSenseItems = {
			aggregateConditions: tree.getPossibleAggregateConditions.bind(tree)(
				treeItem
			),
			properties: treeItem.properties.map(function (prop) {
				return { name: prop.label, id: prop.name };
			})
		};

		var args = tree.createOnLoadArgs(treeItem, 'hover');
		args.whereUse = argsWhere;
		args.join = {};
		args.join = Object.assign(args.join, argsWhere);
		args.join.evType = 'hoverJoin';
		args.join.tree = tree;
		tree.showPopupView(
			'conditionsView.html',
			'btnConditionsId',
			event.target,
			args
		);
	};

	treeButtonHoverHandlers.properties = treeButtonHoverHandlers.sortOrder = function (
		event,
		treeItem
	) {
		if (!tree.beforeOpenPopupDialog(treeItem)) {
			return;
		}
		var args = tree.createOnLoadArgs(treeItem, 'hover');

		if (event.target.classList.contains('query-item-controls__properties')) {
			args.customizationConfig = customizationConfig;
			return tree.showPopupView(
				'propertiesView.html',
				'btnPropertiesId',
				event.target,
				args
			);
		}
		tree.showPopupView('orderView.html', 'btnSortOrderId', event.target, args);
	};

	function getTargetButtonName(nodeElement) {
		var classList = nodeElement.classList;

		var buttonName = '';

		buttonName = classList.contains('query-item-controls__conditions')
			? 'conditions'
			: buttonName;
		buttonName = classList.contains('query-item-controls__properties')
			? 'properties'
			: buttonName;
		buttonName = classList.contains('query-item-controls__sort-order')
			? 'sortOrder'
			: buttonName;
		buttonName = classList.contains('query-item-controls__recursion')
			? 'recursion'
			: buttonName;

		return buttonName;
	}

	return declare(null, {
		_isReadOnly: false,
		tree: null,
		treeStore: null,
		lastSelectedId: null,
		lastDndPosition: null,
		lastBeforeElement: null,
		_isForReuseQueryElement: null,

		// args contains store(Memory), isForReuseQueryElement and readOnly properties
		constructor: function (treeNode, args) {
			this._overridePopupClose();
			customizationConfig = args.customizationConfig;
			this._isReadOnly = !!args.readOnly;
			this._isForReuseQueryElement = args.isForReuseQueryElement;
			qbTreeStore.loadItems(args.store);
			this.treeStore = qbTreeStore;
			this.dataLoader = args.loader;
			this.systemEnums = new QbTreeEnum();
			this.treeButtonClickHandlers = treeButtonClickHandlers;
			this.treeButtonHoverHandlers = treeButtonHoverHandlers;
			this.getTargetButtonName = getTargetButtonName;

			var self = this;
			var store = this.treeStore.getMemStore();
			var storeModel = new ObjectStoreModel({
				store: store,
				query: { id: 'root' },
				mayHaveChildren: function (item) {
					return this.store.mayHaveChildren(item);
				},
				getLabel: function (item) {
					return self.getLabel(item, self);
				}
			});

			if (!args.oldNavTree) {
				treeNode.addEventListener('click', function (event) {
					var buttonName = getTargetButtonName(event.target);

					if (
						!tree.beforeOpenPopupDialog() &&
						tooltipDialog.id
							.toLocaleLowerCase()
							.indexOf(buttonName.toLocaleLowerCase()) === -1
					) {
						closePopup();
					}

					if (buttonName && treeButtonClickHandlers[buttonName]) {
						var rowId = event.target.dataset.id;
						var treeItem = tree.treeStore.getTreeNodeById(rowId);
						tree.tree.select(rowId);
						treeButtonClickHandlers[buttonName](event, treeItem);
						event.stopImmediatePropagation();
					}
				});

				const template = treeNavigatorTemplate.initTreeTemplates(this);
				this.tree = document.createElement('aras-nav');
				this.tree.templates = template(this.tree);

				this.tree.className = 'aras-nav';
				treeNode.appendChild(this.tree);

				this.tree.showWhereUseCondition = true;
				this.tree.showJoinCondition = true;
				this.tree.htmlNodes = {};

				this.tree.on(
					'contextmenu',
					function (itemId, event) {
						this.select(itemId);
					}.bind(this.tree)
				);

				this.tree.on(
					'mouseover',
					function (rowId, event) {
						var buttonName = getTargetButtonName(event.target);
						if (buttonName && treeButtonHoverHandlers[buttonName]) {
							var treeItem = tree.treeStore.getTreeNodeById(rowId);
							treeButtonHoverHandlers[buttonName](event, treeItem);
						}
					}.bind(this)
				);
			} else {
				this.tree = args.oldNavTree;
			}

			this.refreshView();

			treeNode.addEventListener('contextmenu', function (event) {
				event.preventDefault();
				event.stopPropagation();
			});
		},

		_overridePopupClose: function () {
			overridePopupClose();
		},

		selectItem: function (rowId) {
			if (!rowId) {
				this.onNodeSelected(this.treeStore.dataStore.getRootElement());
				return;
			}

			if (this.tree.selectedItem && this.tree.selectedItem.id === rowId) {
				this.onNodeSelected(this.tree.selectedItem);
				return;
			}
			var getAncestorsAndSelf = function (childRowId, chain) {
				chain = chain || [];
				var treeElement = this.treeStore.dataStore.getElementById(childRowId);
				if (treeElement) {
					chain.unshift(treeElement);
					var parentRowId = treeElement.parentId;
					if (parentRowId) {
						getAncestorsAndSelf.call(this, parentRowId, chain);
					}
				}
				return chain;
			};
			var ancestorsAndSelf = getAncestorsAndSelf.call(this, rowId);
			this.tree.set('path', ancestorsAndSelf);
			var treeItem = this.treeStore.dataStore.getElementById(rowId);
			if (!treeItem) {
				treeItem = this.treeStore.dataStore.getRootElement();
				this.onNodeSelected(treeItem);
				return;
			}

			this.onNodeSelected(treeItem);
		},

		getLabel: function (item) {
			if (item) {
				return item.getTreeLabel();
			}
			return 'label';
		},

		destroy: function () {
			this.tree.destroy();
		},
		validateProperties: function (queryDefinition, treeItem) {
			var createConditionsTree = function (filterXml, data) {
				var conditionDom = new XmlDocument();
				conditionDom.loadXML(filterXml.replace(/\r?\n|\r|\t/g, ''));
				var conditionsTree = new ConditionsTree();
				conditionsTree.fromXml(conditionDom, data);

				return conditionsTree;
			};

			var hasInvalidProperties = false;
			var conditionTreeNavigator = new ConditionTreeNavigator();
			var textPrinter = new TextPortionsPrinter(conditionTreeNavigator);
			var parentElement = this.getTreeElementById(treeItem.parentId);

			var queryReferenceItem;
			var conditionsTree;
			var filterXml;

			if (parentElement) {
				var qrXPath =
					"Relationships/Item[@type='qry_QueryReference' and (ref_id='" +
					treeItem.referenceRefId +
					"')]";
				queryReferenceItem = queryDefinition.selectSingleNode(qrXPath);
				filterXml = aras.getItemProperty(queryReferenceItem, 'filter_xml');
				conditionsTree = createConditionsTree(filterXml, [
					parentElement._element,
					treeItem._element
				]);
				conditionTreeNavigator.accept(conditionsTree.root, textPrinter);
				textPrinter.printTextPortions(function (text, isInvalid) {
					if (isInvalid) {
						hasInvalidProperties = true;
					}
				});

				if (hasInvalidProperties) {
					return true;
				}
			}

			filterXml = aras.getItemProperty(treeItem.node, 'filter_xml');

			if (filterXml) {
				conditionsTree = createConditionsTree(filterXml, [treeItem._element]);
				conditionTreeNavigator.accept(conditionsTree.root, textPrinter);

				textPrinter.printTextPortions(function (text, isInvalid) {
					if (isInvalid) {
						hasInvalidProperties = true;
					}
				});
			}

			return hasInvalidProperties;
		},
		validateComandButtons: function (treeDataset) {
			var hasInvalidProperties;
			var rootNode = this.treeStore.dataStore.getRootElement().node;
			if (!rootNode) {
				return;
			}
			var queryDefinition = rootNode.selectSingleNode(
				'ancestor::Item[@type="qry_QueryDefinition"]'
			);

			var findPropByName = function (properties, name) {
				return properties.find(function (prop) {
					return prop.name === name;
				});
			};
			treeDataset.forEach(
				function (treeItem) {
					if (!treeItem.node) {
						return;
					}

					var propertyName;
					var property;
					var message;

					if (!hasInvalidProperties) {
						hasInvalidProperties = this.validateProperties(
							queryDefinition,
							treeItem
						);
					}

					//validate if Properties contain broken references
					var findPropertiesXPath =
						"Relationships/Item[@type='qry_QueryItemSelectProperty' and not(@action='delete')]";
					var propertyNds = treeItem.node.selectNodes(findPropertiesXPath);
					var removedProperties = [];
					for (var i = 0; i < propertyNds.length; i++) {
						propertyName = aras.getItemProperty(
							propertyNds[i],
							'property_name'
						);
						property = findPropByName(treeItem.properties, propertyName);
						if (!property) {
							removedProperties.push(propertyName);
						}
					}
					if (removedProperties.length) {
						message = aras.getResource(
							'../Modules/aras.innovator.QueryBuilder/',
							'broken_references.property',
							aras.getItemProperty(treeItem.node, 'alias'),
							removedProperties.join(', ')
						);
						aras.AlertError(message);
					}

					removedProperties = [];
					property = null;
					//validate if Condition contain broken references
					var filterXml = aras.getItemProperty(treeItem.node, 'filter_xml');
					if (filterXml) {
						var conditionDom = new XmlDocument();
						conditionDom.loadXML(filterXml.replace(/\r?\n|\r|\t/g, ''));
						var conditionsTree = new ConditionsTree();
						var aggregateConditions = this.getPossibleAggregateConditions.bind(
							this
						)(treeItem);
						var conditionsDataSource = aggregateConditions.concat(
							treeItem.properties.map(function (prop) {
								return { name: prop.label, id: prop.name };
							})
						);
						conditionsTree.fromXml(conditionDom, conditionsDataSource);
						var fillNameArrayRecursively = function (
							currentBranch,
							removedNamesArg
						) {
							propertyName = currentBranch.id;
							if (propertyName) {
								property = findPropByName(treeItem.properties, propertyName);
								if (!property && currentBranch.name === 'property') {
									removedNamesArg.push(propertyName);
								}
							}
							if (currentBranch.children) {
								for (var r = 0; r < currentBranch.children.length; r++) {
									fillNameArrayRecursively(
										currentBranch.children[r],
										removedProperties
									);
								}
							}
						};
						removedProperties = [];
						fillNameArrayRecursively(conditionsTree.root, removedProperties);
					}

					if (removedProperties.length) {
						message = aras.getResource(
							'../Modules/aras.innovator.QueryBuilder/',
							'broken_references.condition',
							aras.getItemProperty(treeItem.node, 'alias'),
							removedProperties.join(', ')
						);
						aras.AlertError(message);
					}

					//validate if Orders contain broken references
					var findOrdersPropertiesXPath =
						"Relationships/Item[@type='qry_QueryItemSortProperty' and not(@action='delete')]";
					propertyNds = treeItem.node.selectNodes(findOrdersPropertiesXPath);
					removedProperties = [];
					propertyName = null;
					property = null;

					for (i = 0; i < propertyNds.length; i++) {
						propertyName = aras.getItemProperty(
							propertyNds[i],
							'property_name'
						);
						property = findPropByName(treeItem.properties, propertyName);
						if (!property) {
							removedProperties.push(propertyName);
						}
					}
					if (removedProperties.length) {
						message = aras.getResource(
							'../Modules/aras.innovator.QueryBuilder/',
							'broken_references.order',
							aras.getItemProperty(treeItem.node, 'alias'),
							removedProperties.join(', ')
						);
						aras.AlertError(message);
					}
				}.bind(this)
			);

			if (hasInvalidProperties) {
				aras.AlertWarning(
					aras.getResource(
						'../Modules/aras.innovator.QueryBuilder/',
						'invalid_item_property'
					)
				);
			}
		},

		refreshView: function () {
			var treeComponent = this.tree;

			var previouslySelected = treeComponent.selected;
			var previouslyExpanded = [];

			treeComponent.expanded.forEach(function (keyOfExpanded) {
				previouslyExpanded.push(keyOfExpanded);
			});

			var treeData = treeModelCollectionToTreeData(
				dataStore.treeModelCollection
			);

			treeComponent.data = treeData.dataset;
			treeComponent.roots = treeData.roots;
			this.validateComandButtons(treeData.dataset);

			previouslyExpanded.forEach(function (keyOfExpanded) {
				if (tree.treeStore.getTreeNodeById(keyOfExpanded)) {
					treeComponent.expanded.add(keyOfExpanded);
				}
			});

			if (
				previouslySelected &&
				tree.treeStore.getTreeNodeById(previouslySelected)
			) {
				treeComponent.select(previouslySelected);
			}

			treeComponent.render();
		},

		destroyTooltipDialog: function () {
			if (
				tooltipDialog &&
				tooltipDialog.containerNode.firstChild.contentWindow.onCloseDialog
			) {
				var returnedItem = tooltipDialog.containerNode.firstChild.contentWindow.onCloseDialog();
				if (returnedItem && returnedItem.getAttribute('isDirty') === '1') {
					returnedItem.removeAttribute('isDirty');
					self.dataStore.setMainItemToUpdate();

					var frameArguments =
						tooltipDialog.containerNode.firstChild.contentWindow.frameArguments;
					this.updateCommandIconVisibility(
						frameArguments.currentElement.node,
						frameArguments.commandNode,
						tooltipDialog.id
					);
				}
			}
			closePopup();
		},

		createTooltipDialog: function (viewName, id, evType, dimensions) {
			return new Promise(
				function (resolve, reject) {
					var destroyDialog = this.destroyTooltipDialog;
					var onMouseLeaveHandler = function () {};
					var onBlurHandler = function () {};
					var isQbTooltipDialogForView;

					switch (evType) {
						case 'click':
							onBlurHandler = function () {
								if (isQbTooltipDialogForView) {
									destroyDialog();
								}
							}.bind(this);
							break;
						case 'hover':
							onMouseLeaveHandler = destroyDialog;
							isQbTooltipDialogForView = true;
							break;
					}

					function createTooltip() {
						var tooltip = dijit.byId(tooltipDialogId);
						if (tooltip) {
							tooltip.destroy();
						}

						tooltipDialog = new TooltipDialog({
							id: tooltipDialogId,
							content: iframe,
							type: evType,
							onMouseLeave: onMouseLeaveHandler,
							onBlur: onBlurHandler
						});
						tooltipDialog.isQbTooltipDialogForView = isQbTooltipDialogForView;
						document.body.onclick = function (event) {
							if (
								tooltipDialog &&
								!event.target.closest('.dijitTooltipContainer')
							) {
								closePopup();
							}
						};
						document.body.onmouseout = function (event) {
							var target = event.target.closest(
								'.query-item-controls__control'
							);

							if (target && isQbTooltipDialogForView) {
								closePopup();
							}
						};
						resolve(tooltipDialog);
					}
					var url =
						dojo.baseUrl +
						'../../' +
						'Modules/aras.innovator.QueryBuilder/Views/' +
						viewName;
					var iframe =
						'<iframe ' +
						(dimensions
							? 'style="width: ' +
							  dimensions.width +
							  'px; height: ' +
							  dimensions.height +
							  'px;"'
							: '') +
						' class="frame-command" frameborder="0" src="' +
						url +
						'"></iframe>';
					var tooltipDialogId = id ? id : 'tooltipDialogTemp';
					var alreadyExist = dijit.byId(tooltipDialogId);

					if (alreadyExist) {
						var frameNode = alreadyExist.domNode.querySelector('iframe');
						if (frameNode.contentDocument.readyState !== 'complete') {
							frameNode.contentWindow.addEventListener(
								'load',
								function () {
									setTimeout(createTooltip.bind(this), 0);
								}.bind(this)
							);
						} else {
							setTimeout(createTooltip.bind(this), 0);
						}
					} else {
						createTooltip(alreadyExist);
					}
				}.bind(this)
			);
		},

		showPopupView: function (viewName, id, commandNode, onLoadArgs) {
			var self = this;
			var dimensions;
			if (onLoadArgs.width && onLoadArgs.height) {
				dimensions = {
					width: onLoadArgs.width,
					height: onLoadArgs.height
				};
			}
			var tooltipDialogPromise = this.createTooltipDialog(
				viewName,
				id,
				onLoadArgs.evType,
				dimensions
			);
			return tooltipDialogPromise.then(function (tooltipDialog) {
				tooltipDialog.domNode.classList.add(id + '_' + onLoadArgs.evType);

				popup.open({
					popup: tooltipDialog,
					around: commandNode
				});

				onLoadArgs.close = function (res) {
					if (onLoadArgs.closeCallback) {
						onLoadArgs.closeCallback(res);
					}
					closePopup();
				};

				if (tooltipDialog.containerNode) {
					tooltipDialog.containerNode.firstChild.contentWindow.onload = function () {
						tooltipDialog.containerNode.firstChild.contentWindow.start(
							onLoadArgs,
							tooltipDialog
						);
						if (id === 'btnSortOrderId' || id === 'btnPropertiesId') {
							var buttons = this.document.querySelector('.tooltip-buttons');

							if (onLoadArgs.evType === 'hover') {
								buttons.classList.add('hide');
							} else if (onLoadArgs.evType === 'click') {
								buttons.classList.remove('hide');
							}

							var okBtn = buttons.firstElementChild;
							var cancelBtn = buttons.lastElementChild;

							okBtn.addEventListener('click', function () {
								self.destroyTooltipDialog();
							});
							cancelBtn.addEventListener('click', function () {
								closePopup();
							});
						}
					};
				}
			});
		},

		createOnLoadArgs: function (currentElement, evType, tree, commandNode) {
			var res = {
				aras: aras,
				currentElement: currentElement,
				commandNode: commandNode,
				evType: evType,
				tree: tree
			};
			return res;
		},

		getCountCondition: function (children) {
			//Do NOT translate because PegJS does not take into account translations
			return {
				name: 'Count(' + children.name + ')',
				id: 'count(' + children.element.referencePredicate.referenceRefId + ')'
			};
		},

		getExistsCondition: function (children) {
			//Do NOT translate because PegJS does not take into account translations
			return {
				name: 'Exists(' + children.name + ')',
				id: 'exists(' + children.element.referencePredicate.referenceRefId + ')'
			};
		},

		getMaxCondition: function (children, property) {
			var label = children.element._name;
			label = /\s/.test(label) ? '[' + label + ']' : label;
			//Do NOT translate because PegJS does not take into account translations
			return {
				name: 'max(' + label + '.' + property.name + ')',
				id:
					'max(' +
					children.element.referencePredicate.referenceRefId +
					property.name +
					')',
				refId: children.element.referencePredicate.referenceRefId,
				propName: property.name
			};
		},

		getMinCondition: function (children, property) {
			var label = children.element._name;
			label = /\s/.test(label) ? '[' + label + ']' : label;
			//Do NOT translate because PegJS does not take into account translations
			return {
				name: 'min(' + label + '.' + property.name + ')',
				id:
					'min(' +
					children.element.referencePredicate.referenceRefId +
					property.name +
					')',
				refId: children.element.referencePredicate.referenceRefId,
				propName: property.name
			};
		},

		getPossibleAggregateConditions: function (currentElement) {
			var aggregateConditions = [];
			var childrenNodes = this.treeStore.dataStore.getChildren(currentElement);
			for (var i = 0; i < childrenNodes.length; i++) {
				aggregateConditions.push(this.getCountCondition(childrenNodes[i]));
				aggregateConditions.push(this.getExistsCondition(childrenNodes[i]));
				for (var j = 0; j < childrenNodes[i]._element.properties.length; j++) {
					aggregateConditions.push(
						this.getMaxCondition(
							childrenNodes[i],
							childrenNodes[i]._element.properties[j]
						)
					);
					aggregateConditions.push(
						this.getMinCondition(
							childrenNodes[i],
							childrenNodes[i]._element.properties[j]
						)
					);
				}
			}
			return aggregateConditions;
		},

		getCountConditionById: function (countId, QRefId) {
			var rootNode = tree.treeStore.dataStore.getRootElement().node;
			var rootId = rootNode.getAttribute('id');

			var queryDefinition = rootNode.selectSingleNode(
				'ancestor::Item[@type="qry_QueryDefinition"]'
			);

			var parent_ref_id = queryDefinition.selectSingleNode(
				'.//Item[@type="qry_QueryReference" and ref_id="' +
					QRefId +
					'"]/parent_ref_id'
			).text;
			var qItemId = queryDefinition
				.selectSingleNode(
					'.//Item[@type="qry_QueryItem" and ref_id="' + parent_ref_id + '"]'
				)
				.getAttribute('id');
			qItemId = qItemId === rootId ? 'root' : qItemId;
			var treeItem = tree.getTreeElementById(qItemId);

			var childrenNodes = this.treeStore.dataStore.getChildren(treeItem);
			var countCondition;

			for (var i = 0; i < childrenNodes.length; i++) {
				countCondition = this.getCountCondition(childrenNodes[i]);
				if (countCondition.id == countId) {
					return countCondition.name;
				}
			}
		},

		getExistsConditionById: function (existsId, QRefId) {
			var rootNode = tree.treeStore.dataStore.getRootElement().node;
			var rootId = rootNode.getAttribute('id');

			var queryDefinition = rootNode.selectSingleNode(
				'ancestor::Item[@type="qry_QueryDefinition"]'
			);

			var parent_ref_id = queryDefinition.selectSingleNode(
				'.//Item[@type="qry_QueryReference" and ref_id="' +
					QRefId +
					'"]/parent_ref_id'
			).text;
			var qItemId = queryDefinition
				.selectSingleNode(
					'.//Item[@type="qry_QueryItem" and ref_id="' + parent_ref_id + '"]'
				)
				.getAttribute('id');
			qItemId = qItemId === rootId ? 'root' : qItemId;
			var treeItem = tree.getTreeElementById(qItemId);

			var childrenNodes = this.treeStore.dataStore.getChildren(treeItem);
			var existsCondition;

			for (var i = 0; i < childrenNodes.length; i++) {
				existsCondition = this.getExistsCondition(childrenNodes[i]);
				if (existsCondition.id == existsId) {
					return existsCondition.name;
				}
			}
		},

		getMaxConditionById: function (countId, QRefId) {
			var rootNode = tree.treeStore.dataStore.getRootElement().node;
			var rootId = rootNode.getAttribute('id');

			var queryDefinition = rootNode.selectSingleNode(
				'ancestor::Item[@type="qry_QueryDefinition"]'
			);

			var parent_ref_id = queryDefinition.selectSingleNode(
				'.//Item[@type="qry_QueryReference" and ref_id="' +
					QRefId +
					'"]/parent_ref_id'
			).text;
			var qItemId = queryDefinition
				.selectSingleNode(
					'.//Item[@type="qry_QueryItem" and ref_id="' + parent_ref_id + '"]'
				)
				.getAttribute('id');
			qItemId = qItemId === rootId ? 'root' : qItemId;
			var treeItem = tree.getTreeElementById(qItemId);

			var childrenNodes = this.treeStore.dataStore.getChildren(treeItem);
			var maxCondition;

			for (var i = 0; i < childrenNodes.length; i++) {
				for (var j = 0; j < childrenNodes[i]._element.properties.length; j++) {
					maxCondition = this.getMaxCondition(
						childrenNodes[i],
						childrenNodes[i]._element.properties[j]
					);
					if (maxCondition.id == countId) {
						return maxCondition.name;
					}
				}
			}
		},

		getMinConditionById: function (countId, QRefId) {
			var rootNode = tree.treeStore.dataStore.getRootElement().node;
			var rootId = rootNode.getAttribute('id');

			var queryDefinition = rootNode.selectSingleNode(
				'ancestor::Item[@type="qry_QueryDefinition"]'
			);

			var parent_ref_id = queryDefinition.selectSingleNode(
				'.//Item[@type="qry_QueryReference" and ref_id="' +
					QRefId +
					'"]/parent_ref_id'
			).text;
			var qItemId = queryDefinition
				.selectSingleNode(
					'.//Item[@type="qry_QueryItem" and ref_id="' + parent_ref_id + '"]'
				)
				.getAttribute('id');
			qItemId = qItemId === rootId ? 'root' : qItemId;
			var treeItem = tree.getTreeElementById(qItemId);

			var childrenNodes = this.treeStore.dataStore.getChildren(treeItem);
			var minCondition;

			for (var i = 0; i < childrenNodes.length; i++) {
				for (var j = 0; j < childrenNodes[i]._element.properties.length; j++) {
					minCondition = this.getMinCondition(
						childrenNodes[i],
						childrenNodes[i]._element.properties[j]
					);
					if (minCondition.id == countId) {
						return minCondition.name;
					}
				}
			}
		},

		getPossibleParameters: function (currentElement) {
			var queryDefinition = currentElement.node.selectSingleNode(
				'ancestor::Item[@type="qry_QueryDefinition"]'
			);
			var parametersNodes = queryDefinition.selectNodes(
				"Relationships/Item[@type='qry_QueryParameter']"
			);

			return Array.prototype.map.call(parametersNodes, function (node) {
				return {
					name: '$' + aras.getItemProperty(node, 'name'),
					value: aras.getItemProperty(node, 'value')
				};
			});
		},

		beforeOpenPopupDialog: function (targetElement, evType) {
			if (
				popup._stack &&
				popup._stack.length > 0 &&
				popup._stack[0].widget.params.type === 'click'
			) {
				return false;
			}
			return true;
		},

		showRecursionIndicator: function (rootItem) {
			var nodes = this.tree.getNodesByItem(rootItem);
			if (nodes && nodes.length > 0) {
				var node = nodes[0];
				var alreadyExist = node.rowNode.getElementsByClassName(
					'btnRecursionRoot'
				);
				if (alreadyExist && alreadyExist.length > 0) {
					var command = alreadyExist[0];
					if (command.classList.contains(hiddenClassName)) {
						command.classList.remove(hiddenClassName);
					}
				} else {
					alreadyExist = node.rowNode.getElementsByClassName(
						'command-container'
					);
					if (alreadyExist && alreadyExist.length > 0) {
						var container = alreadyExist[0];
						this.createCommand(
							container,
							'btnRecursionRoot',
							rootItem.refId,
							null,
							null,
							true
						);
					}
				}
			}
		},

		hideRecursionIndicators: function (rootItem) {
			var alreadyExist = document.getElementsByClassName('btnRecursionRoot');
			if (alreadyExist && alreadyExist.length > 0) {
				for (var i = 0; i < alreadyExist.length; i++) {
					var command = alreadyExist[i];
					if (!command.classList.contains(hiddenClassName)) {
						command.classList.add(hiddenClassName);
					}
				}
			}
		},

		isCommandContainerFilled: function (queryItemNd, containerId) {
			var findParametersPath =
				"Relationships/Item[@type='{type}' and not(@action='delete')]";

			if (queryItemNd) {
				var items;
				switch (containerId) {
					case 'btnSortOrderId':
						items = queryItemNd.selectNodes(
							findParametersPath.replace('{type}', 'qry_QueryItemSortProperty')
						);
						break;
					case 'btnPropertiesId':
						items = queryItemNd.selectNodes(
							findParametersPath.replace(
								'{type}',
								'qry_QueryItemSelectProperty'
							)
						);
						break;
					case 'btnConditionsId':
						return !!aras.getItemProperty(queryItemNd, 'filter_xml');
					default:
						return false;
				}
				return items.length > 0;
			}
			return false;
		},

		updateCommandIconVisibility: function (
			queryItemNd,
			commandNd,
			containerId
		) {
			if (!commandNd) {
				return;
			}
			if (this.isCommandContainerFilled(queryItemNd, containerId)) {
				commandNd.classList.add(filledClassName);
			} else {
				commandNd.classList.remove(filledClassName);
			}
		},

		getTreeElementById: function (id) {
			return this.treeStore.getTreeNodeById(id);
		},

		getQueryReferencePath: function (treeElement) {
			var referencePathList = [];
			var referenceRefId;
			do {
				referenceRefId =
					treeElement.element &&
					treeElement.element.referencePredicate &&
					treeElement.element.referencePredicate.referenceRefId;
				if (!referenceRefId) {
					break;
				}
				referencePathList.push(referenceRefId);
				var parentElement = this.getTreeElementById(treeElement.parentId);
				treeElement = parentElement;
			} while (treeElement.parentId);
			return referencePathList.reverse();
		},

		getAllQueryReferencePath: function (treeElement) {
			var definitionSrc = treeElement.node.selectSingleNode(
				'ancestor::Item[@type="qry_QueryDefinition"]'
			);
			function getNextArrayOfQRefRefId(qItemRefId) {
				var qRefRefId = definitionSrc.selectNodes(
					'Relationships/Item[@type="qry_QueryReference" and (child_ref_id="' +
						qItemRefId +
						'")]/ref_id'
				);
				return Array.prototype.map.call(qRefRefId, function (node) {
					return node.text;
				});
			}

			/**
			 * @param  {Array} startQRefRefIds - Array of QRefRefId. (Vectors of further movement)
			 * @param  {Array} curentPath - Array of QRefRefId.
			 * @return {Array} Array of variants for next steps
			 */
			function getVariantsOfPaths(startQRefRefIds, curentPath) {
				curentPath = curentPath || [];
				startQRefRefIds = startQRefRefIds || [];

				var variants = [];
				for (var i = 0; i < startQRefRefIds.length; i++) {
					if (curentPath.indexOf(startQRefRefIds[i]) === -1) {
						var curentQRefNode = definitionSrc.selectSingleNode(
							'Relationships/Item[@type="qry_QueryReference" and (ref_id="' +
								startQRefRefIds[i] +
								'")]'
						);
						var parentQItemRefNode = curentQRefNode.selectSingleNode(
							'parent_ref_id'
						);
						parentQItemRefId = parentQItemRefNode && parentQItemRefNode.text;

						if (parentQItemRefId) {
							var nextParentQRefs = getNextArrayOfQRefRefId(parentQItemRefId);
							var curentPathCustom = curentPath.slice();
							curentPathCustom.push(startQRefRefIds[i]);

							var nextVariants = getVariantsOfPaths(
								nextParentQRefs,
								curentPathCustom
							);

							if (nextVariants.length === 0) {
								variants.push([startQRefRefIds[i]]);
							}

							for (
								var nextVariantsIndex = 0;
								nextVariantsIndex < nextVariants.length;
								nextVariantsIndex++
							) {
								var tmpPath = [startQRefRefIds[i]];
								tmpPath = tmpPath.concat(nextVariants[nextVariantsIndex]);
								variants.push(tmpPath);
							}
						}
					}
				}
				return variants;
			}

			var nextParentQRefs = getNextArrayOfQRefRefId(treeElement.refId);

			var listOfPathList = getVariantsOfPaths(nextParentQRefs);
			for (var i = 0; i < listOfPathList.length; i++) {
				listOfPathList[i] = listOfPathList[i].reverse();
			}

			return listOfPathList;
		},
		createUniqueAlias: function (aliasName, selectedTreeElement) {
			var aliasXPath =
				'ancestor::Item[@type="qry_QueryDefinition"]//Item[@type="qry_QueryItem" and not(@action="delete")]//alias/text()';
			var aliseNodes = selectedTreeElement.node.selectNodes(aliasXPath);

			var alises = Array.prototype.map.call(aliseNodes, function (aliasNode) {
				return aliasNode.text;
			});

			var newAlias = aliasName;
			for (var i = 0; i <= alises.length; i++) {
				if (alises.indexOf(newAlias) === -1) {
					break;
				}

				newAlias = aliasName + '_' + (i + 1);
			}

			return newAlias;
		},
		reuseQueryElementDefinition: function (selectedTreeElement) {
			var i;
			var parents = [];
			var treeElement = selectedTreeElement;
			while (treeElement.parentId) {
				treeElement = this.getTreeElementById(treeElement.parentId);
				parents.push(treeElement);
			}

			if (parents.length === 0) {
				return;
			}

			var refId = aras.getItemProperty(selectedTreeElement.node, 'ref_id');

			var mainQueryDefinition = selectedTreeElement.node.selectSingleNode(
				'ancestor::Item[@type="qry_QueryDefinition"]'
			);

			var parentRefIdXPath =
				'.//Item[@type="qry_QueryReference" and child_ref_id="' +
				refId +
				'"]/parent_ref_id';
			var parentRefId = mainQueryDefinition.selectSingleNode(parentRefIdXPath);

			var parentElement = parents.filter(function (element) {
				return (
					aras.getItemProperty(element.node, 'ref_id') === parentRefId.text
				);
			});

			if (parentElement.length !== 1) {
				return;
			}
			parentElement = parentElement[0];

			var reuseDialog = new window.ArasModules.Dialog('html', {
				title: aras.getResource(
					'../Modules/aras.innovator.QueryBuilder/',
					'action.reuse'
				),
				dialogWidth: 500,
				dialogHeight: 500
			});

			reuseDialog.contentNode.classList.add('qb-reuse-dialog');

			var mainTreeElementTypeId = aras.getItemProperty(
				selectedTreeElement.element.node,
				'item_type'
			);

			function isNeedShowindTreeElement(item) {
				if (item.parentId == parentElement.id) {
					return false;
				}

				if (selectedTreeElement.element.id === item.node.id) {
					return false;
				}
				var elementRefId = aras.getItemProperty(item.node, 'ref_id');
				if (elementRefId === parentElement._element.refId) {
					return false;
				}

				var treeElement = item;
				while (treeElement.parentId) {
					treeElement = self.tree.getTreeElementById(treeElement.parentId);
					if (treeElement.id == selectedTreeElement.id) {
						return false;
					}
				}

				var elementTypeId = aras.getItemProperty(item.node, 'item_type');
				return mainTreeElementTypeId === elementTypeId;
			}

			var treeData = treeModelCollectionToTreeData(
				dataStore.treeModelCollection
			);

			var listOfDissabled = [];
			var listOfExpanded = [];

			treeData.dataset.forEach(function (keyOfExpanded) {
				if (isNeedShowindTreeElement(keyOfExpanded) === false) {
					listOfDissabled.push(keyOfExpanded.id);
				}
				listOfExpanded.push(keyOfExpanded.id);
			});
			const reuseTree = document.createElement('aras-nav');
			const template = treeNavigatorTemplate.initTreeTemplates(
				this,
				listOfDissabled
			);
			reuseTree.templates = template(reuseTree);

			reuseTree.className = 'tree-conntainer';
			reuseDialog.contentNode.appendChild(reuseTree);

			var selectBlock = document.createElement('div');
			selectBlock.classList.add('select-block');
			reuseDialog.contentNode.appendChild(selectBlock);

			var addSelectedItem = document.createElement('button');
			addSelectedItem.classList.add('aras-btn');
			addSelectedItem.textContent = aras.getResource(
				'../Modules/aras.innovator.QueryBuilder/',
				'action.add.reuse_button'
			);
			selectBlock.appendChild(addSelectedItem);

			reuseTree._toggleItemExpansion = function () {};

			reuseTree.data = treeData.dataset;
			reuseTree.roots = treeData.roots;

			listOfExpanded.forEach(function (id) {
				reuseTree.expanded.add(id);
			});

			reuseTree.render().then(reuseDialog.show.bind(reuseDialog));

			addSelectedItem.addEventListener('click', function () {
				if (listOfDissabled.indexOf(reuseTree.selectedItemKey) === -1) {
					createReuseElement(reuseTree.selectedItemKey);
					reuseDialog.close();
				}
			});

			reuseTree.on('click', function (treeElemId) {
				if (listOfDissabled.indexOf(treeElemId) > -1) {
					addSelectedItem.setAttribute('disabled', true);
				} else {
					addSelectedItem.removeAttribute('disabled');
				}
			});

			var createReuseElement = function (selectedElementId) {
				if (!selectedElementId) {
					return;
				}
				var secondSelectedTreeElemen = tree.getTreeElementById(
					selectedElementId
				);
				var mainQueryDefinition = this.mainQueryDefinition;

				var selectRefId = this.selectedTreeElement.refId;
				var oldFilterXmlXPath =
					'.//Item[@type="qry_QueryReference" and child_ref_id="' +
					selectRefId +
					'"]/filter_xml';
				var oldFilterXml = mainQueryDefinition.selectSingleNode(
					oldFilterXmlXPath
				);
				if (!oldFilterXml) {
					return;
				}
				var referencePredicate = this.selectedTreeElement.element
					.referencePredicate;
				referencePredicate.xml = oldFilterXml.text;

				tree.removeItem(this.selectedTreeElement);
				self.tree.createChildQueryItem(
					this.parentElement,
					null,
					null,
					referencePredicate,
					self.dataLoader.createRecursionItem,
					secondSelectedTreeElemen
				);
			}.bind({
				selectedTreeElement: selectedTreeElement,
				parentElement: parentElement,
				mainQueryDefinition: mainQueryDefinition
			});
		},

		getAvailableProperties: function (queryItem) {
			var requestItem = aras.newIOMItem();
			requestItem.loadAML(queryItem.node.xml);
			var responseItem = requestItem.apply('qry_GetAvailableProperties');
			var properties = [];
			for (var i = 0; i < responseItem.getItemCount(); i++) {
				var availableProperty = responseItem.getItemByIndex(i);
				properties.push({
					name: availableProperty.getProperty('name'),
					label: availableProperty.getProperty('label'),
					dataType: availableProperty.getProperty('data_type')
				});
			}
			return properties;
		},

		createChildQueryItem: function (
			parentElement,
			alias,
			dataTypeNd,
			referencePredicate,
			createItemHandler,
			sourceElement
		) {
			var qryItem;
			var itemRefId;
			if (!sourceElement) {
				qryItem = aras.newIOMItem('qry_QueryItem', 'add');
				qryItem.setProperty('alias', alias);
				qryItem.setProperty('item_type', dataTypeNd.text);
				qryItem.setPropertyAttribute(
					'item_type',
					'keyed_name',
					dataTypeNd.getAttribute('keyed_name')
				);
				itemRefId = aras.IomInnovator.getNewID();
				qryItem.setProperty('ref_id', itemRefId);
			} else {
				itemRefId = sourceElement.refId;
				qryItem = aras.newIOMItem();
				qryItem.dom = sourceElement.node.ownerDocument;
				qryItem.node = sourceElement.node;
			}

			var properties = self.tree.getAvailableProperties(qryItem);
			var conditionDom = new XmlDocument();
			if (!referencePredicate.xml) {
				var parentCondition = self.dataLoader.getPropertyByCriteria(
					'name',
					referencePredicate.source,
					parentElement.properties
				);
				var childCondition = self.dataLoader.getPropertyByCriteria(
					'name',
					referencePredicate.related,
					properties
				);
				conditionDom.loadXML(
					'<condition>' +
						'<eq>' +
						'<property query_items_xpath="parent::Item" name="' +
						parentCondition.name +
						'"/>' +
						'<property name="' +
						childCondition.name +
						'"/>' +
						'</eq>' +
						'</condition>'
				);
			} else {
				conditionDom.loadXML(referencePredicate.xml);
			}

			var qryReferenceRefId = aras.IomInnovator.getNewID();
			var qryReference = aras.newIOMItem('qry_QueryReference', 'add');
			qryReference.setProperty('child_ref_id', itemRefId);
			qryReference.setProperty('parent_ref_id', parentElement.refId);
			qryReference.setProperty('filter_xml', conditionDom.xml);
			qryReference.setProperty('ref_id', qryReferenceRefId);
			referencePredicate.referenceRefId = qryReferenceRefId;

			var qryDefinition = aras.newIOMItem();
			qryDefinition.dom = self.item.ownerDocument;
			qryDefinition.node = self.item;
			if (!sourceElement) {
				qryDefinition.addRelationship(qryItem);
			}
			qryDefinition.addRelationship(qryReference);

			self.dataStore.setMainItemToUpdate();

			self.dataLoader.setIsReferencingItemFromServer(qryDefinition);
			var treeElement = createItemHandler.bind(self.dataLoader)(
				qryItem.node,
				parentElement,
				self.dataStore,
				properties,
				referencePredicate,
				sourceElement
			);
			self.tree.treeStore.loadItems(self.dataStore);
			self.tree.refreshView();
			self.tree.tree.expand(treeElement.id, true);
			return treeElement;
		},

		changeItemName: function (selectedTreeElement) {
			if (selectedTreeElement) {
				var args = this.createOnLoadArgs(
					selectedTreeElement,
					'click',
					self.tree
				);
				var rowNode = self.tree.tree.htmlNodes[selectedTreeElement.id];
				if (rowNode) {
					attachToNode = rowNode.querySelector('.query-item__name');
					this.showPopupView(
						'changeNameView.html',
						'dlgChangeNameId',
						attachToNode,
						args
					);
				}
			}
		},

		removeItem: function (selectedTreeElement) {
			var parentNode = dataStore.getElementById(selectedTreeElement.parentId);
			tree.removeItemRecursive(selectedTreeElement);
			tree.refreshView();
		},

		removeItemRecursive: function (selectedTreeElement) {
			var children = dataStore.getChildren(selectedTreeElement);
			var i;
			for (i = 0; i < children.length; i++) {
				tree.removeItemRecursive(children[i]);
			}

			var relationshipsNd = self.item.selectSingleNode('Relationships');
			var relationshipsXPath;
			if (!selectedTreeElement.isRecursion) {
				relationshipsXPath =
					"Item[@type='qry_QueryReference' and (child_ref_id='" +
					selectedTreeElement.refId +
					"' or parent_ref_id='" +
					selectedTreeElement.refId +
					"')]";
			} else {
				relationshipsXPath =
					"Item[@type='qry_QueryReference' and (ref_id='" +
					selectedTreeElement.referenceRefId +
					"')]";
			}
			var referenceNds = relationshipsNd.selectNodes(relationshipsXPath);
			for (i = 0; i < referenceNds.length; i++) {
				if (referenceNds[i].getAttribute('isNew') !== '1') {
					referenceNds[i].setAttribute('action', 'delete');
				} else {
					relationshipsNd.removeChild(referenceNds[i]);
				}
			}
			dataStore.removeElementType(selectedTreeElement);
		},

		startExecuteAction: function (selectedTreeElement) {
			var definitionSrc = selectedTreeElement.node.selectSingleNode(
				'ancestor::Item[@type="qry_QueryDefinition"]'
			);
			var definitionCopy = definitionSrc.cloneNode(true);

			function getConditonByXml(xmlStr) {
				var conditionDoc = new XmlDocument();
				conditionDoc.loadXML(xmlStr);
				return conditionDoc.selectSingleNode('/*[1]/*[1]');
			}

			var refId = selectedTreeElement.refId;
			var qitemXpath =
				'Relationships/Item[@type="qry_QueryItem" and string(ref_id)="' +
				refId +
				'"]';
			var qItem = definitionCopy.selectSingleNode(qitemXpath);

			var oldFilterXmlNode = qItem.selectSingleNode('filter_xml');
			if (oldFilterXmlNode) {
				//To not show the query item condition in Start Execution dialog
				qItem.removeChild(oldFilterXmlNode);
			}

			var treeQueryReferencePath = this.getQueryReferencePath(
				selectedTreeElement
			);

			// HACK: There are should be deep clone of `selectedTreeElement` variable.
			var selectedTreeElementCopy = {
				node: qItem,
				properties: selectedTreeElement.properties,
				refId: selectedTreeElement.refId,
				getType: function () {}
			};
			var conditionArgs = conditionEditorArgs.base({}, selectedTreeElementCopy);
			conditionArgs.whereUse = conditionEditorArgs.whereUseCondition(
				{},
				selectedTreeElementCopy
			);
			conditionArgs.isStartExecution = true;
			var aras = window.aras;
			var dialogCheckParameters = {
				queryDefinition: definitionCopy,
				conditionArgs: conditionArgs,
				title: aras.getResource(
					'../Modules/aras.innovator.QueryBuilder/',
					'execution.title_checking_dialog'
				),
				executeBtnName: aras.getResource(
					'../Modules/aras.innovator.QueryBuilder/',
					'execution.submit_btn'
				),
				exitBtnName: aras.getResource(
					'../Modules/aras.innovator.QueryBuilder/',
					'execution.exit'
				),
				resultAsFileCheckBoxLabel: aras.getResource(
					'../Modules/aras.innovator.QueryBuilder/',
					'execution.resultAsFile'
				),
				dialogWidth: 500,
				dialogHeight: 425,
				resizable: false,
				content:
					aras.getBaseURL() +
					'/Modules/aras.innovator.QueryBuilder/Views/enterParametersForExecuteForm.html'
			};

			return ArasModules.Dialog.show(
				'iframe',
				dialogCheckParameters
			).promise.then(
				function (returnObject) {
					if (returnObject && returnObject.isNeedExecutAction) {
						var oldOffset = this.qItem.selectSingleNode('offset_fetch_xml');
						var configurationNode = new XmlDocument();
						if (!oldOffset || oldOffset.getAttribute('is_null')) {
							configurationNode.loadXML(
								'<configuration><option><offset>0</offset><fetch>100</fetch></option></configuration>'
							);
						} else {
							configurationNode.loadXML(oldOffset.text);
						}

						if (oldOffset) {
							this.qItem.removeChild(oldOffset);
						}
						configurationNode = configurationNode.documentElement;
						var fetchNodes = ArasModules.xml.selectNodes(
							configurationNode,
							'//fetch'
						);
						fetchNodes.map(function (fetchNode) {
							fetchNode.text = returnObject.maxCount;
						});
						var template =
							'<offset_fetch_xml><![CDATA[' +
							configurationNode.xml +
							']]></offset_fetch_xml>';
						configurationNode = new XmlDocument();
						configurationNode.loadXML(template);
						configurationNode = configurationNode.documentElement;
						this.qItem.appendChild(configurationNode);
						if (oldFilterXmlNode) {
							this.qItem.appendChild(oldFilterXmlNode);
						}

						var xmlDoc = new XmlDocument();
						var startQueryReferencePathNode = xmlDoc.createElement(
							'start_query_reference_path'
						);
						startQueryReferencePathNode.text =
							'/' + this.treeQueryReferencePath.join('/');

						var rootQRefNode = this.queryDefinition.selectSingleNode(
							'.//Item[@type="qry_QueryReference" and (not(./parent_ref_id) or ./parent_ref_id/@is_null)]'
						);
						rootQRefNode.appendChild(startQueryReferencePathNode);

						var rootChildRefId = rootQRefNode.selectSingleNode('child_ref_id');
						rootChildRefId.text = this.selectedTreeElement.refId;
						var conditionXml = returnObject.conditionXml;

						if (conditionXml && conditionXml !== '<condition/>') {
							var newCondition = this.getConditonByXml(conditionXml);
							var condition = rootQRefNode.ownerDocument.createElement(
								'condition'
							);
							condition.appendChild(newCondition);
							aras.setItemProperty(
								rootQRefNode,
								'filter_xml',
								condition.xml,
								false
							);
						}

						if (returnObject.outputFormat != null) {
							let outputFormatParameters = {
								type: returnObject.outputFormat,
								key_properties: returnObject.key_properties
							};

							aras.setItemProperty(
								this.queryDefinition,
								'output_format_info',
								JSON.stringify(outputFormatParameters),
								false
							);

							if (outputFormatParameters.type === 'flat') {
								const qbFlatIdProp = aras.newIOMItem();
								qbFlatIdProp.loadAML(
									'<Item type="qry_QueryItemSelectProperty"><property_name>QB_flat_id</property_name></Item>'
								);
								const qbFlatParentIdsProp = aras.newIOMItem();
								qbFlatParentIdsProp.loadAML(
									'<Item type="qry_QueryItemSelectProperty"><property_name>QB_flat_parent_ids</property_name></Item>'
								);

								this.queryDefinition
									.selectNodes('/Relationships/Item[@type="qry_QueryItem"]')
									.forEach((queryItemNode) => {
										const iomItem = aras.newIOMItem();
										iomItem.loadAML(queryItemNode.xml);
										iomItem.addRelationship(qbFlatIdProp);
										iomItem.addRelationship(qbFlatParentIdsProp);
										queryItemNode.parentNode.replaceChild(
											iomItem.node,
											queryItemNode
										);
									});
							}
						}

						const dataPromise = qbExecutor.execute(this.queryDefinition);
						if (returnObject.resultAsFile) {
							const fileName = this.queryDefinition.selectSingleNode('name')
								.text;
							return dataPromise.then(function (data) {
								var blob = new Blob([data], { type: 'application/xml' });
								ArasModules.vault.saveBlob(blob, `${fileName}.xml`);
							});
						}

						var dialogParameters = {
							title: aras.getResource(
								'../Modules/aras.innovator.QueryBuilder/',
								'execution.title_query_result_dialog'
							),
							formId: '0FABE3D5DB6D4F41A0B3F337C46229D7', // qry_ExecuteResult
							aras: this.aras,
							parentWindow: window,
							isEditMode: false,
							dataPromise: dataPromise,
							dialogWidth: 700,
							dialogHeight: 600,
							resizable: false,
							content: aras.getBaseURL() + '/scripts/ShowFormAsADialog.html'
						};
						return ArasModules.Dialog.show(
							'iframe',
							dialogParameters
						).promise.then(function () {
							setTimeout(function () {
								reload();
							}, 0);
						});
					}
				}.bind({
					queryDefinition: definitionCopy,
					selectedTreeElement: selectedTreeElement,
					aras: aras,
					getConditonByXml: getConditonByXml,
					treeQueryReferencePath: treeQueryReferencePath,
					qItem: qItem
				})
			);
		},

		//Events
		onNodeSelected: function (treeElement) {
			tree.hideRecursionIndicators();
			if (treeElement.isRecursion) {
				tree.showRecursionIndicator(
					dataStore.getElementById(treeElement.element.sourceElementId)
				);
			}
		}
	});
});
