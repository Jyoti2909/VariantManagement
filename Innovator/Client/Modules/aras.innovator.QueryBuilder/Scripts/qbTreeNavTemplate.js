define([
	'QB/Scripts/ConditionsTree',
	'QB/Scripts/conditionTreeNavigator',
	'QB/Scripts/ConditionTreeVisitor/textPortionsPrinter'
], function (ConditionsTree, ConditionTreeNavigator, TextPortionsPrinter) {
	return {
		initTreeTemplates: function (tree, listOfDissabled) {
			listOfDissabled = listOfDissabled || [];
			var parentNodeClass = 'aras-nav__parent';
			var iconPaddingClass = 'icon-padding';
			var parentExpandedNodeClass =
				'aras-nav__parent aras-nav__parent_expanded';
			var selectedChildNodeClass = 'aras-nav__child_selected';
			var selectedParentNodeClass = 'aras-nav__parent_selected';
			var elementNodeClass = 'aras-nav-element';
			var whereUseConditionClass = 'query-item__where-use-condition';
			var joinConditionClass = 'query-item__join-condition';

			var controlsContainerClass = 'query-item-controls';

			var controlClass = 'query-item-controls__control';
			var activeControlClass = 'query-item-controls__control_active';

			var conditionsControlClass = 'query-item-controls__conditions';
			var propertiesControlClass = 'query-item-controls__properties';
			var recursionSourceControlClass = 'query-item-controls__recursion-source';
			var recursionControlClass = 'query-item-controls__recursion';
			var dissabledTreeElement = 'dissabled-tree-element';
			var iconWithUpArrowClass = 'icon-with-up-arrow';
			var imgContainerClass = 'img-container';

			var maxLengthOfConditions = 50;

			var getDissableClass = function (treeItem) {
				if (treeItem && listOfDissabled.indexOf(treeItem.id) > -1) {
					return ' ' + dissabledTreeElement;
				}
				return '';
			};

			var getSelectClass = function (navInstance, props, isChild) {
				if (navInstance.selectedItemKey === props.nodeKey) {
					return (
						' ' + (isChild ? selectedChildNodeClass : selectedParentNodeClass)
					);
				}
				return '';
			};

			return function (navInstance) {
				var infernoFlags = ArasModules.utils.infernoFlags;
				var templates = NavTemplates(navInstance);
				templates.node = function (props) {
					var lifecycle = {
						onComponentDidMount: function (node) {
							tree.tree.htmlNodes[props.value.id] = node;
						}
					};
					return props.value && dataStore.getChildren(props.value).length > 0
						? Inferno.createComponentVNode(
								infernoFlags.componentFunction,
								templates.parentNode,
								props,
								null,
								lifecycle
						  )
						: Inferno.createComponentVNode(
								infernoFlags.componentFunction,
								templates.childNode,
								props,
								null,
								lifecycle
						  );
				};
				templates.parentNode = function (props) {
					var treeItem = props.value;
					var children = treeItem.children || [];

					var ulOfChildren = Inferno.createVNode(
						Inferno.getFlagsForElementVnode('ul'),
						'ul',
						null,
						children.map(function (childKey) {
							return Inferno.createComponentVNode(
								infernoFlags.componentFunction,
								templates.node,
								{
									nodeKey: childKey,
									value: navInstance.data.get(childKey)
								}
							);
						}),
						infernoFlags.hasNonKeyedChildren
					);

					var defaultClasses = elementNodeClass + getDissableClass(treeItem);

					var rowNode = Inferno.createVNode(
						Inferno.getFlagsForElementVnode('div'),
						'div',
						defaultClasses,
						[
							Inferno.createVNode(
								Inferno.getFlagsForElementVnode('div'),
								'div',
								'aras-nav__icon',
								Inferno.createVNode(
									Inferno.getFlagsForElementVnode('span'),
									'span'
								),
								infernoFlags.hasVNodeChildren
							), // arrow
							Inferno.createComponentVNode(
								infernoFlags.componentFunction,
								templates.icon,
								{ treeItem: treeItem }
							), // icon
							Inferno.createComponentVNode(
								infernoFlags.componentFunction,
								templates.joinConditionLabel,
								{ treeItem: treeItem }
							), //joinCondition
							Inferno.createVNode(
								Inferno.getFlagsForElementVnode('span'),
								'span',
								'query-item__name',
								Inferno.createTextVNode(treeItem.element.name),
								infernoFlags.hasVNodeChildren
							), // name
							Inferno.createComponentVNode(
								infernoFlags.componentFunction,
								templates.whereUseConditionLabel,
								{ treeItem: treeItem }
							), //whereUseConditionLabel
							Inferno.createComponentVNode(
								infernoFlags.componentFunction,
								templates.controlsContainer,
								{ treeItem: treeItem }
							) //controlsContainer
						],
						infernoFlags.hasNonKeyedChildren
					);

					var isExpanded = navInstance.expandedItemsKeys.has(props.nodeKey);
					var classNames =
						(isExpanded ? parentExpandedNodeClass : parentNodeClass) +
						getSelectClass(navInstance, props);

					return Inferno.createVNode(
						Inferno.getFlagsForElementVnode('li'),
						'li',
						classNames,
						[rowNode, ulOfChildren],
						infernoFlags.hasNonKeyedChildren,
						{ 'data-key': props.nodeKey }
					);
				};

				templates.childNode = function (props) {
					var treeItem = props.value;
					var defaultClasses =
						elementNodeClass +
						getDissableClass(treeItem) +
						getSelectClass(navInstance, props, true);

					var rowNode = Inferno.createVNode(
						Inferno.getFlagsForElementVnode('div'),
						'div',
						defaultClasses,
						[
							Inferno.createComponentVNode(
								infernoFlags.componentFunction,
								templates.icon,
								{ treeItem: treeItem }
							), // icon
							Inferno.createComponentVNode(
								infernoFlags.componentFunction,
								templates.joinConditionLabel,
								{ treeItem: treeItem }
							), //joinCondition
							Inferno.createVNode(
								Inferno.getFlagsForElementVnode('span'),
								'span',
								'query-item__name',
								Inferno.createTextVNode(treeItem.element.name),
								infernoFlags.hasVNodeChildren
							), // name
							Inferno.createComponentVNode(
								infernoFlags.componentFunction,
								templates.whereUseConditionLabel,
								{ treeItem: treeItem }
							), //whereUseConditionLabel
							Inferno.createComponentVNode(
								infernoFlags.componentFunction,
								templates.controlsContainer,
								{ treeItem: treeItem }
							) //controlsContainer
						],
						infernoFlags.hasNonKeyedChildren
					);

					var classNames = parentNodeClass + ' ' + iconPaddingClass;

					return Inferno.createVNode(
						Inferno.getFlagsForElementVnode('li'),
						'li',
						classNames,
						rowNode,
						infernoFlags.hasVNodeChildren,
						{ 'data-key': props.nodeKey }
					);
				};

				var getConditionLabelVNode = function (conditionsTree, conditionClass) {
					var conditionTreeNavigator = new ConditionTreeNavigator();
					var textPrinter = new TextPortionsPrinter(conditionTreeNavigator);
					conditionTreeNavigator.accept(conditionsTree.root, textPrinter);
					var totalTextLength = 0;
					var conditionItems = [];
					textPrinter.printTextPortions(function (text, isInvalid) {
						if (totalTextLength > maxLengthOfConditions) {
							return;
						}
						var newTotalTextLength = totalTextLength + text.length;
						if (newTotalTextLength > maxLengthOfConditions) {
							text =
								text.substr(0, maxLengthOfConditions - totalTextLength) + '...';
						}
						totalTextLength += text.length;
						var conditionClass = isInvalid
							? 'query-item_error'
							: conditionClass;
						var newItem = Inferno.createVNode(
							Inferno.getFlagsForElementVnode('span'),
							'span',
							conditionClass,
							Inferno.createTextVNode(text),
							infernoFlags.hasVNodeChildren
						);
						conditionItems.push(newItem);
					});
					return Inferno.createVNode(
						Inferno.getFlagsForElementVnode('span'),
						'span',
						conditionClass,
						conditionItems,
						infernoFlags.hasNonKeyedChildren
					);
				};

				templates.joinConditionLabel = function (props) {
					if (tree.tree.showJoinCondition !== true) {
						return Inferno.createTextVNode('');
					}

					var treeItem = props.treeItem;
					if (treeItem.id === 'root') {
						return null;
					}

					var queryDefinitionItem = treeItem.node.selectSingleNode(
						'ancestor::Item[@type="qry_QueryDefinition"]'
					);
					var parentElement = tree.getTreeElementById(treeItem.parentId);
					var qrXPath =
						"Relationships/Item[@type='qry_QueryReference' and (ref_id='" +
						treeItem.referenceRefId +
						"')]";
					var queryReferenceItem = queryDefinitionItem.selectSingleNode(
						qrXPath
					);
					var filterXml = aras.getItemProperty(
						queryReferenceItem,
						'filter_xml'
					);
					var conditionDom = new XmlDocument();
					conditionDom.loadXML(filterXml.replace(/\r?\n|\r|\t/g, ''));
					var conditionsTree = new ConditionsTree();
					conditionsTree.fromXml(conditionDom, [
						parentElement._element,
						treeItem._element
					]);
					var result = getConditionLabelVNode(
						conditionsTree,
						joinConditionClass
					);
					return result;
				};

				templates.whereUseConditionLabel = function (props) {
					if (tree.tree.showWhereUseCondition !== true) {
						return Inferno.createTextVNode('');
					}

					var treeItem = props.treeItem;

					var filterXml = aras.getItemProperty(treeItem.node, 'filter_xml');
					if (!filterXml) {
						return Inferno.createTextVNode('');
					}

					var conditionDom = new XmlDocument();
					conditionDom.loadXML(filterXml.replace(/\r?\n|\r|\t/g, ''));
					var conditionsTree = new ConditionsTree();
					conditionsTree.fromXml(conditionDom, [treeItem._element]);
					var result = getConditionLabelVNode(
						conditionsTree,
						whereUseConditionClass
					);
					return result;
				};

				var hasInvalidProperties = function (treeItem) {
					if (!treeItem.node) {
						return false;
					}
					var queryDefinitionItem = treeItem.node.selectSingleNode(
						'ancestor::Item[@type="qry_QueryDefinition"]'
					);
					return tree.validateProperties(queryDefinitionItem, treeItem);
				};

				templates.icon = function (props) {
					var treeItem = props.treeItem;
					var showWarning = hasInvalidProperties(treeItem);
					var iconPath = showWarning
						? '../images/RedWarning.svg'
						: tree.treeStore.getIcon(treeItem) ||
						  '../images/DefaultItemType.svg';

					if (iconPath.toLowerCase().startsWith('vault:///?fileid=')) {
						var fileId = iconPath.replace(/vault:\/\/\/\?fileid=/i, '');
						iconPath = aras.IomInnovator.getFileUrl(
							fileId,
							parent.aras.Enums.UrlType.SecurityToken
						);
					} else {
						iconPath = dojo.baseUrl + '../' + iconPath;
					}

					var className = imgContainerClass;
					className += treeItem.isReferencing ? ' ' + iconWithUpArrowClass : '';

					var imgNode = Inferno.createVNode(
						Inferno.getFlagsForElementVnode('img'),
						'img',
						null,
						null,
						infernoFlags.hasInvalidChildren,
						{
							src: iconPath
						}
					);

					return Inferno.createVNode(
						Inferno.getFlagsForElementVnode('div'),
						'div',
						className,
						imgNode,
						infernoFlags.hasVNodeChildren
					);
				};

				templates.controlsContainer = function (props) {
					var treeItem = props.treeItem;
					if (
						tree._isForReuseQueryElement ||
						treeItem.getType() ===
							tree.systemEnums.TreeModelType.EmptyRootItemType
					) {
						return Inferno.createTextVNode('');
					}

					var recursionClass = activeControlClass;

					if (treeItem.isRecursion) {
						recursionClass = activeControlClass + ' ' + recursionControlClass;
					} else {
						var queryDefinitionItem = treeItem.node.selectSingleNode(
							'ancestor::Item[@type="qry_QueryDefinition"]'
						);
						var isHaveRecursionXPath =
							"Relationships/Item[@type='qry_QueryReference' and not(@action='delete') and child_ref_id= '" +
							treeItem.refId +
							"']";
						var nodes = queryDefinitionItem.selectNodes(isHaveRecursionXPath);

						if (nodes.length > 1) {
							recursionClass =
								activeControlClass + ' ' + recursionSourceControlClass;
						}
					}

					return Inferno.createVNode(
						Inferno.getFlagsForElementVnode('div'),
						'div',
						controlsContainerClass,
						createControlButtons({ treeItem: treeItem }).concat(
							Inferno.createVNode(
								Inferno.getFlagsForElementVnode('div'),
								'div',
								controlClass + ' ' + recursionClass,
								null,
								infernoFlags.hasInvalidChildren,
								{ 'data-id': treeItem.id }
							)
						),
						infernoFlags.hasNonKeyedChildren
					);
				};
				var createControlButtons = function (props) {
					var treeItem = props.treeItem;
					var buttonClasses = {
						sortOrderButton:
							'query-item-controls__control query-item-controls__sort-order' +
							(tree._isReadOnly ? '' : '') +
							(tree.isCommandContainerFilled(treeItem.node, 'btnSortOrderId')
								? ' query-item-controls__control_active'
								: ''),
						conditionsButton:
							controlClass +
							' ' +
							conditionsControlClass +
							(tree.isCommandContainerFilled(treeItem.node, 'btnConditionsId')
								? ' ' + activeControlClass
								: ''),
						propertiesButton:
							controlClass +
							' ' +
							propertiesControlClass +
							(tree.isCommandContainerFilled(treeItem.node, 'btnPropertiesId')
								? ' ' + activeControlClass
								: '')
					};
					return Object.keys(buttonClasses).map(function (button) {
						return Inferno.createVNode(
							Inferno.getFlagsForElementVnode('div'),
							'div',
							buttonClasses[button],
							null,
							infernoFlags.hasInvalidChildren,
							{ 'data-id': treeItem.id }
						);
					});
				};

				return templates;
			};
		}
	};
});
