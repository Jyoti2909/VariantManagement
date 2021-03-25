(function () {
	var propertySelectionControl = {
		filter: {
			classes: true,
			properties: true,
			text: ''
		},
		data: {}
	};
	var applyLabel;
	var columnsLabel;
	var propertiesLabel;
	var noPropertiesLabel;
	var selectOptions;
	var currItemType;

	var toggleTreeDisplay = function (bool) {
		var tree = propertySelectionControl.node.querySelector('.tree');
		var noPropsContainer = propertySelectionControl.node.querySelector(
			'.no-properties'
		);
		var apply = propertySelectionControl.node.querySelector('.buttons .apply');

		if (bool) {
			tree.classList.remove('aras-hide');
			noPropsContainer.classList.add('aras-hide');
			apply.removeAttribute('disabled');
		} else {
			tree.classList.add('aras-hide');
			noPropsContainer.classList.remove('aras-hide');
			apply.setAttribute('disabled', 'true');
		}
	};

	propertySelectionControl.selectProperty = function (option) {
		var selectedType = option && option.value;
		var treeId = option.xClassTreeId;
		var rows;
		propertySelectionControl.loadedType = selectedType;
		switch (selectedType) {
			case 'itemType':
				rows = propertySelectionControl.loadProperties('itemType');
				break;
			case 'itemTypeWithExtendedProps':
				rows = propertySelectionControl.loadProperties(
					'itemTypeWithExtendedProps'
				);
				break;
			case 'xClassProps':
				rows = propertySelectionControl.loadProperties('xClassProps');
				break;
			default:
				rows = propertySelectionControl.loadProperties(selectedType, treeId);
				break;
		}

		propertySelectionControl.renderTreeData(rows);
		if (rows && rows.size > 0) {
			toggleTreeDisplay(true);
		} else {
			toggleTreeDisplay(false);
		}
	};

	propertySelectionControl.attachTo = function (node, onApply) {
		applyLabel = aras.getResource(
			'../Modules/aras.innovator.ExtendedClassification/',
			'apply_button'
		);
		columnsLabel = aras.getResource(
			'../Modules/aras.innovator.ExtendedClassification/',
			'toolbar_columns_label'
		);
		propertiesLabel = aras.getResource(
			'../Modules/aras.innovator.ExtendedClassification/',
			'toolbar_properties_label'
		);
		noPropertiesLabel = aras.getResource(
			'../Modules/aras.innovator.ExtendedClassification/',
			'classEditor.tree.no_properties'
		);
		propertySelectionControl.node = node;
		var controlTemplate =
			'<div class="toolbar aras-hide side-header"><div class="border-box">' +
			'<label class="sys_f_label" id="myBookmarksLabel">' +
			columnsLabel +
			'</label>' +
			'</div></div>' +
			'<div class="properties-selector-block aras-form">' +
			'<div class="properties-selector-block-upper">' +
			'<label>' +
			propertiesLabel +
			'</label>' +
			'<div class="property-types"></div>' +
			'</div>' +
			'<div class="select-all aras-hide"></div>' +
			'</div>' +
			'<div class="tree aras-hide"></div>' +
			'<div class="no-properties">' +
			noPropertiesLabel +
			'</div>' +
			'<div class="buttons"><button disabled class="apply aras-btn">' +
			applyLabel +
			'</button></div>';
		node.innerHTML = controlTemplate;
		propertySelectionControl.grid = new Grid(node.querySelector('.tree'), {
			multiSelect: false
		});

		node
			.querySelector('.buttons .apply')
			.addEventListener('click', function (e) {
				if (e.target.getAttribute('disabled')) {
					return;
				}

				var selectedData = propertySelectionControl.grid.settings.selectedRows.map(
					function (id) {
						return propertySelectionControl.grid._rows.get(id).name;
					}
				);
				onApply(selectedData);
			});
		node
			.querySelector('.property-types')
			.addEventListener('change', function (e) {
				var option = propertySelectionControl.typeAhead._findItem(
					propertySelectionControl.typeAhead.state.value
				);
				var imgNode = propertySelectionControl.typeAhead.state.dom.querySelector(
					'.icon'
				);
				if (!option || !option.xClassTreeId) {
					imgNode.setAttribute('title', '');
					imgNode.classList.remove('selected-value-img');
				} else {
					imgNode.setAttribute(
						'title',
						propertySelectionControl.typeAhead.state._value
					);
					imgNode.classList.add('selected-value-img');
				}

				if (!option) {
					propertySelectionControl.renderTreeData(new Map());
					toggleTreeDisplay(false);
					return;
				}
				propertySelectionControl.selectProperty(option);
			});
	};

	propertySelectionControl.loadProperties = function (type, xClassTreeId) {
		var columns = propertySelectionControl.columns;
		var propertyIdToColumn = {};

		columns.forEach(function (column) {
			propertyIdToColumn[column.propertyId] = column;
		});

		function getITProps() {
			return columns.filter(function (column) {
				if (column.name && column.name.startsWith('xp-')) {
					return false;
				}
				return true;
			});
		}

		function getITxProps() {
			return columns.filter(function (column) {
				if (
					propertySelectionControl.itemTypeExplicitXPropsIds.indexOf(
						column.propertyId
					) > -1
				) {
					return true;
				}
			});
		}

		function getTreeXClassProps() {
			var props = [];

			var fillPropsArr = function (xProps) {
				Array.prototype.forEach.call(xProps, function (xProp) {
					var xPropId = aras.getItemProperty(xProp, 'id');
					var column = propertyIdToColumn[xPropId];
					column.label =
						aras.getItemProperty(xProp, 'label') ||
						aras.getItemProperty(xProp, 'name');
					props.push(column);
				});
			};

			if (
				aras.getItemProperty(currItemType, 'implementation_type') !==
				'polymorphic'
			) {
				if (propertySelectionControl.xClassTrees) {
					Array.prototype.forEach.call(
						propertySelectionControl.xClassTrees,
						function (xClassTree) {
							if (xClassTree) {
								var xClasses = xClassTree.selectNodes('Relationships/Item');
								Array.prototype.forEach.call(xClasses, function (xClass) {
									const xProps = xClass.selectNodes(
										'Relationships/Item[not(inactive="1")]/related_id/Item'
									);
									fillPropsArr(xProps);
								});
							}
						}
					);
				}
			} else {
				var polyXProps = currItemType.selectNodes(
					'Relationships/Item[@type="xItemTypeAllowedProperty"]/related_id/Item'
				);
				fillPropsArr(polyXProps);
			}
			return props;
		}

		function sortByLabel(a, b) {
			if (a.label.toLowerCase() > b.label.toLowerCase()) {
				return 1;
			} else if (a.label.toLowerCase() < b.label.toLowerCase()) {
				return -1;
			} else {
				return 0;
			}
		}
		function sortByOrder(a, b) {
			if (a.propSortOrder > b.propSortOrder) {
				return 1;
			} else if (a.propSortOrder < b.propSortOrder) {
				return -1;
			} else {
				return 0;
			}
		}

		var rows = new Map();
		var addPropFunc = function (column, idx) {
			rows.set(column.propertyId, {
				col1: column.label,
				name: column.name,
				colIndex: column.colNumber,
				hidden: column.hidden,
				propertyId: column.propertyId
			});
		};

		var itProps;
		var itXProps;
		var xClassProps;
		var allExtendedProps;
		if (type === 'itemType') {
			itProps = getITProps();
			itProps.sort(sortByOrder);
			itProps.forEach(addPropFunc);
			itXProps = getITxProps();
			itXProps.sort(sortByLabel);
			itXProps.forEach(addPropFunc);
		} else if (type === 'itemTypeWithExtendedProps') {
			itProps = getITProps();
			itProps.sort(sortByOrder);
			itProps.forEach(addPropFunc);
			itXProps = getITxProps();
			xClassProps = getTreeXClassProps();
			allExtendedProps = itXProps.concat(xClassProps);
			allExtendedProps.sort(sortByLabel);
			allExtendedProps.forEach(addPropFunc);
		} else if (type === 'xClassProps') {
			allExtendedProps = getTreeXClassProps();
			allExtendedProps.sort(sortByLabel);
			allExtendedProps.forEach(addPropFunc);
		} else {
			var xClassTree = Array.prototype.find.call(
				propertySelectionControl.xClassTrees,
				function (xClassTree) {
					return xClassTreeId === aras.getItemProperty(xClassTree, 'id');
				}
			);
			var props = Array.prototype.slice.call(
				getInheritedProperties(type, xClassTree)
			);
			var xClass = xClassTree.selectSingleNode(
				'Relationships/Item[@id="' + type + '"]'
			);
			var propIdToSort = xPropertiesUtils.getSortOrderForProperties(
				xClass,
				xClassTree,
				props
			);
			props.sort(function (a, b) {
				var idA = aras.getItemProperty(a, 'id');
				var idB = aras.getItemProperty(b, 'id');
				if (propIdToSort[idA] > propIdToSort[idB]) {
					return 1;
				} else if (propIdToSort[idA] < propIdToSort[idB]) {
					return -1;
				} else {
					return 0;
				}
			});
			Array.prototype.forEach.call(props, function (xProp) {
				var propDefinition = xProp.selectSingleNode('related_id/Item');
				var id = aras.getItemProperty(propDefinition, 'id');
				var column = propertyIdToColumn[id];
				var xPropLabel =
					aras.getItemProperty(propDefinition, 'label') ||
					aras.getItemProperty(propDefinition, 'name');
				column.name = aras.getItemProperty(propDefinition, 'name');
				column.label = xPropLabel;
				addPropFunc(column);
			});
		}
		return rows;
	};

	function getInheritedProperties(id, xClassTree) {
		var selectedClass = xClassTree.selectSingleNode(
			'Relationships/Item[@id="' + id + '"]'
		);
		var selectedRefId = aras.getItemProperty(selectedClass, 'ref_id');
		var childToParentIds = {};
		var hieararchy = JSON.parse(
			aras.getItemProperty(xClassTree, 'classification_hierarchy')
		);
		hieararchy.forEach(function (edge) {
			childToParentIds[edge.toRefId] = edge.fromRefId;
		});
		var parentChainIds = [id];
		var getParentId = function (childId) {
			var parentId = childToParentIds[childId];
			if (parentId) {
				var xClass = xClassTree.selectSingleNode(
					'Relationships/Item[ref_id="' + parentId + '"]'
				);
				parentChainIds.push(xClass.getAttribute('id'));
				getParentId(parentId);
			}
		};
		getParentId(selectedRefId);
		if (parentChainIds.length > 0) {
			var clientXPropertyDefinitions = xClassTree.selectNodes(
				"Relationships/Item[@id='" +
					parentChainIds.join("' or @id='") +
					"']/Relationships/Item[not(inactive='1')]"
			);
			return clientXPropertyDefinitions;
		}
	}

	function fillSelectEl(select, itemTypeLabel, xClassTrees) {
		selectOptions = [
			{
				label: itemTypeLabel,
				value: 'itemType',
				static: true
			},
			{
				label: aras.getResource(
					'../Modules/aras.innovator.ExtendedClassification/',
					'classEditor.tree.select.all_extended'
				),
				value: 'xClassProps',
				static: true
			},
			{
				label: aras.getResource(
					'../Modules/aras.innovator.ExtendedClassification/',
					'classEditor.tree.select.all_and_extended',
					itemTypeLabel
				),
				value: 'itemTypeWithExtendedProps',
				static: true
			}
		];
		var getOptionObject = function (refId, edges, refIdToXClass, xClassTreeId) {
			var xClass = refIdToXClass[refId];
			var rowObj = {
				label:
					aras.getItemProperty(xClass, 'label') ||
					aras.getItemProperty(xClass, 'name'),
				value: aras.getItemProperty(xClass, 'id'),
				xClassTreeId: xClassTreeId
			};

			var childs = edges[refId];
			if (childs && childs.length > 0) {
				rowObj.children = [];
				childs.forEach(function (id) {
					rowObj.children.push(
						getOptionObject(id, edges, refIdToXClass, xClassTreeId)
					);
				});
			}
			return rowObj;
		};
		if (xClassTrees) {
			Array.prototype.forEach.call(xClassTrees, function (xClassTree) {
				if (!xClassTree) {
					return;
				}
				var xClassTreeId = aras.getItemProperty(xClassTree, 'id');
				var hierarchy = JSON.parse(
					aras.getItemProperty(xClassTree, 'classification_hierarchy')
				);
				var relationships = xClassTree.selectNodes(
					'Relationships/Item[@type="xClass" and not(@action="delete")]'
				);
				var refIdToXClass = {};
				Array.prototype.forEach.call(relationships, function (xClass) {
					refIdToXClass[aras.getItemProperty(xClass, 'ref_id')] = xClass;
				});
				var edges = {};
				hierarchy.forEach(function (edge) {
					var from = edge.fromRefId || 'roots';
					var to = edge.toRefId;
					if (!edges[from]) {
						edges[from] = [];
					}
					edges[from].push(to);
				});

				edges.roots.forEach(function (toRefId) {
					selectOptions.push(
						getOptionObject(toRefId, edges, refIdToXClass, xClassTreeId)
					);
				});
			});
		}

		var typeAhead = document.createElement('aras-classification-property');
		typeAhead.setState({
			list: selectOptions,
			searchableBranch: true
		});
		propertySelectionControl.typeAhead = typeAhead;
		typeAhead.format = function (template) {
			var input = template.children[0];
			var button = template.children[2];
			template.children.unshift({
				tag: 'span',
				className: 'icon',
				attrs: {
					title: ''
				}
			});
			button.className += ' dropdown-arrow';
			var oldOnInput = input.events.oninput;
			var oldOnKeydown = input.events.onkeydown;
			input.events = Object.assign(input.events || {}, {
				oninput: function (e) {
					oldOnInput(e);
					typeAhead.state.refs.dropdown.classList.remove('delimitered');
				},
				onkeydown: function (e) {
					oldOnKeydown(e);
					if (
						(e.code === '37' || e.code === '39') &&
						typeAhead.state.list.length > 3
					) {
						typeAhead.state.refs.dropdown.classList.add('delimitered');
					}
				}
			});
			button.events = Object.assign(button.events || {}, {
				onClick: function () {
					if (typeAhead.state.list.length > 3) {
						typeAhead.state.refs.dropdown.classList.add('delimitered');
					}
					typeAhead.setState({
						shown: true,
						focus: true,
						showAll: true,
						searchableBranch: true
					});
				}
			});
			return template;
		};
		select.appendChild(typeAhead);
	}

	propertySelectionControl.initTree = function (
		itemTypeName,
		columns,
		xClassTrees
	) {
		currItemType = aras.getItemTypeForClient(itemTypeName).node;
		var itemTypeLabel =
			aras.getItemProperty(currItemType, 'label') ||
			aras.getItemProperty(currItemType, 'name');
		var selectEl = propertySelectionControl.node.querySelector(
			'.property-types'
		);
		fillSelectEl(selectEl, itemTypeLabel, xClassTrees);
		propertySelectionControl.columns = columns;
		propertySelectionControl.xClassTrees = xClassTrees;
		var explicitXProps = currItemType.selectNodes(
			'Relationships/Item[@type="ItemType_xPropertyDefinition"]/related_id/Item'
		);
		propertySelectionControl.itemTypeExplicitXPropsIds = Array.prototype.map.call(
			explicitXProps,
			function (xProp) {
				return aras.getItemProperty(xProp, 'id');
			}
		);
	};

	propertySelectionControl.renderTreeData = function (rows, roots) {
		var head = new Map();
		head.set('col1', {
			label: 'Column1',
			width: '100%',
			resize: true
		});
		propertySelectionControl.grid.head = head;
		propertySelectionControl.grid.rows = rows;
	};

	window.propertySelectionControl = propertySelectionControl;
})();
