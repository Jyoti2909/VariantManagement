(function () {
	var columnSelectionControl = {
		filter: {
			classes: true,
			properties: true,
			text: ''
		},
		data: {}
	};
	var selectOptions;
	var currItemType;
	let currentRelationshipsItemType;
	const relationshipIdPrefix = 'R_';
	const relationshipNamePrefix = '[R]';
	const xPropertyNameRegExp = new RegExp(
		'^(' +
			relationshipNamePrefix.replace('[', '\\[').replace(']', '\\]') +
			' )?xp-'
	);

	var toggleTreeDisplay = function (bool) {
		var tree = columnSelectionControl.node.querySelector('.tree');
		var noPropsContainer = columnSelectionControl.node.querySelector(
			'.no-properties'
		);

		if (bool) {
			tree.classList.remove('aras-hide');
			noPropsContainer.classList.add('aras-hide');
		} else {
			tree.classList.add('aras-hide');
			noPropsContainer.classList.remove('aras-hide');
		}
	};

	var manageSelectAllBlock = function () {
		var selectAllBlock = columnSelectionControl.node.querySelector(
			'.select-all'
		);

		var mixed = columnSelectionControl.grid.settings.indexRows.length;
		selectAllBlock.classList.toggle(
			'column-select-block__select-all_invisible',
			mixed === 0
		);
		columnSelectionControl.grid.settings.indexRows.forEach(function (idx) {
			const row = columnSelectionControl.grid.rows.get(idx);
			if (row && row.hidden) {
				mixed--;
			}
		});
		let value = false;
		let isMixed = false;
		if (mixed === columnSelectionControl.grid.settings.indexRows.length) {
			value = true;
		} else if (mixed > 0) {
			isMixed = true;
			value = true;
		}
		selectAllBlock.firstChild.checked = value;
		if (isMixed) {
			selectAllBlock.classList.add('mixed');
		} else {
			selectAllBlock.classList.remove('mixed');
		}
	};

	columnSelectionControl.initResources = function () {
		columnSelectionControl.resources = {
			columnsLabel: aras.getResource(
				'../Modules/aras.innovator.ExtendedClassification/',
				'toolbar_columns_label'
			),
			showAll: aras.getResource(
				'../Modules/aras.innovator.ExtendedClassification/',
				'classEditor.tree.show_all'
			),
			noPropertiesLabel: aras.getResource(
				'../Modules/aras.innovator.ExtendedClassification/',
				'classEditor.tree.no_properties'
			),
			columnsFilteredLabel: aras.getResource(
				'../Modules/aras.innovator.ExtendedClassification/',
				'classEditor.tree.filtered'
			),
			selectOptionsAllLabel: aras.getResource(
				'../Modules/aras.innovator.ExtendedClassification/',
				'classEditor.tree.select.all_and_extended'
			),
			selectOptionsStandardLabel: aras.getResource(
				'../Modules/aras.innovator.ExtendedClassification/',
				'classEditor.tree.select.standard'
			),
			selectOptionsExtendedLabel: aras.getResource(
				'../Modules/aras.innovator.ExtendedClassification/',
				'classEditor.tree.select.all_extended'
			),
			selectOptionsRelationshipLabel: aras.getResource(
				'../Modules/aras.innovator.ExtendedClassification/',
				'classEditor.tree.select.relationship'
			)
		};
	};

	columnSelectionControl.selectProperty = function (selectedType) {
		let indexRows = [];
		let xClassCanFilter = false;
		columnSelectionControl.loadedType = selectedType;
		switch (selectedType) {
			case 'All':
			case 'Extended':
			case 'Relationship':
				indexRows = columnSelectionControl.loadProperties(selectedType);
				xClassCanFilter = true;
				break;
			case 'itemType':
				indexRows = columnSelectionControl.loadProperties(selectedType);
				break;
		}
		columnSelectionControl.setVisibleFilteredPanel(false);
		xClassSearchWrapper.setClickableFilters(xClassCanFilter);
		columnSelectionControl.renderTreeData(indexRows);
		if (indexRows && indexRows.length > 0) {
			toggleTreeDisplay(true);
		} else {
			toggleTreeDisplay(false);
		}
	};

	columnSelectionControl.attachTo = function (node) {
		columnSelectionControl.node = node;
		const controlTemplate =
			'<div class="column-select-block-flex">' +
			'<div class="column-selection">' +
			'<div class="side-header">' +
			'<span>' +
			columnSelectionControl.resources.columnsLabel +
			'</span>' +
			'</div>' +
			'<div class="properties-selector-block aras-form">' +
			'<div class="properties-selector-block-upper">' +
			'<div>' +
			'<label class="aras-form-boolean select-all">' +
			'<input type="checkbox" />' +
			'<span><span/>' +
			'</label>' +
			'<div class="property-types"></div>' +
			'</div>' +
			'</div>' +
			'</div>' +
			'<div class="filtered hidden">' +
			'<span>' +
			columnSelectionControl.resources.columnsFilteredLabel +
			'</span>' +
			'<span onclick="columnSelectionControl.showAll()">' +
			columnSelectionControl.resources.showAll +
			'</span>' +
			'</div>' +
			'<div class="tree aras-hide"></div>' +
			'<div class="no-properties">' +
			columnSelectionControl.resources.noPropertiesLabel +
			'</div>' +
			'</div>' +
			'<div class="xclass-search-block hidden"></div>' +
			'</div>';
		node.innerHTML = controlTemplate;
		columnSelectionControl.grid = new Grid(node.querySelector('.tree'), {
			multiSelect: false
		});

		node
			.querySelector('.property-types')
			.addEventListener('change', function (e) {
				const option = columnSelectionControl.typeAhead.state.value;

				if (!option) {
					columnSelectionControl.renderTreeData([]);
					toggleTreeDisplay(false);
					return;
				}
				columnSelectionControl.selectProperty(option);
			});

		xClassSearchWrapper.attachTo(node.querySelector('.xclass-search-block'));
		columnSelectionControl.grid.getCellType = function () {
			return 'richCheckbox';
		};

		Grid.formatters.richCheckbox = function (headId, rowId, value, grid) {
			var hidden = grid.rows.get(rowId, 'hidden');
			var mixed = grid.rows.get(rowId, 'mixed');
			var checkbox = {
				className: 'aras-grid-row-cell_boolean',
				children: [
					{
						tag: 'label',
						className: 'aras-form-boolean' + (mixed ? ' mixed' : ''),
						children: [
							{
								tag: 'input',
								attrs: {
									type: 'checkbox',
									checked: !hidden
								}
							},
							{
								tag: 'span'
							}
						]
					},
					{
						tag: 'div',
						className: 'checkbox-title',
						children: [value]
					}
				]
			};

			return checkbox;
		};

		const selectAllCheckbox = node.querySelector('.select-all');
		selectAllCheckbox.addEventListener('change', function (event) {
			const checkbox = this.firstChild;
			if (this.classList.contains('mixed')) {
				this.classList.remove('mixed');
				checkbox.checked = true;
			}
			const value = checkbox.checked;
			columnSelectionControl.grid.settings.indexRows.forEach(function (id) {
				columnSelectionControl.grid.rows.set(id, !value, 'hidden');
			});
			columnSelectionControl.grid.render();
			columnSelectionControl.isDirty = true;
		});

		columnSelectionControl.grid.on(
			'click',
			function (rowId, event) {
				if (
					event.target.closest('.aras-form-boolean') &&
					event.target.tagName !== 'INPUT'
				) {
					columnSelectionControl.toggleRowSelection(rowId);
					columnSelectionControl.isDirty = true;
				}
			},
			'row'
		);
	};

	columnSelectionControl.toggleRowSelection = function (rowId) {
		var column = columnSelectionControl.grid.rows.get(rowId);
		var sourceColumn = columnSelectionControl.columns.find(function (col) {
			return col.propertyId === rowId;
		});

		if (!sourceColumn) {
			sourceColumn = columnSelectionControl.relationshipsColumns.find(function (
				col
			) {
				return col.propertyId === rowId;
			});
		}

		if (column && column.children) {
			if (column.mixed && !column.hidden) {
				column.hidden = false;
				column.children.forEach(function (childId) {
					var child = columnSelectionControl.grid.rows.get(childId);
					child.hidden = false;
					columnSelectionControl.grid.rows.set(childId, child);
				});
			} else if (!column.mixed && !column.hidden) {
				column.hidden = true;
				column.children.forEach(function (childId) {
					var child = columnSelectionControl.grid.rows.get(childId);
					child.hidden = true;
					columnSelectionControl.grid.rows.set(childId, child);
				});
			} else {
				column.hidden = false;
				column.children.forEach(function (childId) {
					var child = columnSelectionControl.grid.rows.get(childId);
					child.hidden = false;
					columnSelectionControl.grid.rows.set(childId, child);
				});
			}
			column.mixed = false;
			columnSelectionControl.grid.rows.set(rowId, column);
		} else {
			if (column) {
				column.hidden = !column.hidden;
				sourceColumn.hidden = column.hidden;
				columnSelectionControl.grid.rows.set(rowId, column);
			} else {
				sourceColumn.hidden = true;
			}
			manageSelectAllBlock();
		}
	};

	function getITProps(columns) {
		return columns.filter(function (column) {
			if (column.name && xPropertyNameRegExp.test(column.name)) {
				return false;
			}
			return true;
		});
	}

	function getITxProps(columns) {
		return columns.filter(function (column) {
			if (
				columnSelectionControl.itemTypeExplicitXPropsIds.indexOf(
					column.propertyId
				) > -1
			) {
				return true;
			}
		});
	}

	function getRelITxProps(columns) {
		return columns.filter(function (column) {
			if (
				columnSelectionControl.relationshipsTypeExplicitXPropsIds.indexOf(
					column.propertyId.slice(2)
				) > -1
			) {
				return true;
			}
		});
	}

	function getTreeXClassProps(xClassTrees, columns, idPrefix) {
		idPrefix = idPrefix || '';
		const props = [];
		const propertyIdToColumn = {};

		columns.forEach(function (column) {
			propertyIdToColumn[column.propertyId] = column;
		});

		const fillPropsArr = function (xProps) {
			Array.prototype.forEach.call(xProps, function (xProp) {
				const xPropId = aras.getItemProperty(xProp, 'id');
				const column = propertyIdToColumn[idPrefix + xPropId];
				if (column) {
					props.push(column);
				}
			});
		};

		if (
			aras.getItemProperty(currItemType, 'implementation_type') !==
			'polymorphic'
		) {
			if (xClassTrees) {
				Array.prototype.forEach.call(xClassTrees, function (xClassTree) {
					if (xClassTree) {
						const xClasses = xClassTree.selectNodes('Relationships/Item');
						Array.prototype.forEach.call(xClasses, function (xClass) {
							const xProps = xClass.selectNodes(
								'Relationships/Item[not(inactive="1")]/related_id/Item'
							);
							fillPropsArr(xProps);
						});
					}
				});
			}
		} else {
			const polyXProps = currItemType.selectNodes(
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
		}
		return 0;
	}

	columnSelectionControl.loadProperties = function (type, xClass) {
		function sortByOrder(a, b) {
			if (a.propSortOrder > b.propSortOrder) {
				return 1;
			} else if (a.propSortOrder < b.propSortOrder) {
				return -1;
			} else {
				return 0;
			}
		}

		const indexRows = [];
		const addPropsToRows = function (column, idx) {
			indexRows.push(column.propertyId);
		};

		let itProps;
		let itXProps;
		let xClassProps;
		let allExtendedProps;

		const addPropsRelationship = function () {
			if (
				columnSelectionControl.relationshipsColumns &&
				columnSelectionControl.relationshipsColumns.length > 0
			) {
				itProps = getITProps(columnSelectionControl.relationshipsColumns);
				itProps.sort(sortByOrder);
				itProps.forEach(addPropsToRows);
				itXProps = getRelITxProps(columnSelectionControl.relationshipsColumns);
				xClassProps = getTreeXClassProps(
					columnSelectionControl.relationshipsXClassTrees,
					columnSelectionControl.relationshipsColumns,
					relationshipIdPrefix
				);
				allExtendedProps = itXProps.concat(xClassProps);
				allExtendedProps.sort(sortByLabel);
				allExtendedProps.forEach(addPropsToRows);
			}
		};

		if (type === 'itemType') {
			itProps = getITProps(columnSelectionControl.columns);
			itProps.sort(sortByOrder);
			itProps.forEach(addPropsToRows);
			itXProps = getITxProps(columnSelectionControl.columns);
			itXProps.forEach(addPropsToRows);
		} else if (type === 'All') {
			itProps = getITProps(columnSelectionControl.columns);
			itProps.sort(sortByOrder);
			itProps.forEach(addPropsToRows);
			itXProps = getITxProps(columnSelectionControl.columns);
			xClassProps = getTreeXClassProps(
				columnSelectionControl.xClassTrees,
				columnSelectionControl.columns
			);
			allExtendedProps = itXProps.concat(xClassProps);
			allExtendedProps.sort(sortByLabel);
			allExtendedProps.forEach(addPropsToRows);
			addPropsRelationship();
		} else if (type === 'Extended') {
			xClassProps = getTreeXClassProps(
				columnSelectionControl.xClassTrees,
				columnSelectionControl.columns
			);
			xClassProps.sort(sortByLabel);
			xClassProps.forEach(addPropsToRows);
		} else if (type === 'Relationship') {
			addPropsRelationship();
		} else {
			const treesToFilter = xClass.isRelationship
				? columnSelectionControl.relationshipsXClassTrees
				: columnSelectionControl.xClassTrees;
			const xClassTree = Array.prototype.find.call(treesToFilter, function (
				xClassTree
			) {
				return xClass.xClassTreeId === aras.getItemProperty(xClassTree, 'id');
			});
			let props = Array.prototype.slice.call(
				getInheritedProperties(type, xClassTree)
			);
			props.forEach(function (xProp) {
				const propDefinition = xProp.selectSingleNode('related_id/Item');
				const id = xClass.isRelationship
					? relationshipIdPrefix + aras.getItemProperty(propDefinition, 'id')
					: aras.getItemProperty(propDefinition, 'id');
				indexRows.push(id);
			});
		}
		return indexRows;
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

	function fillSelectEl(select) {
		if (select.getElementsByTagName('aras-filter-list').length > 0) {
			return;
		}

		selectOptions = [
			{
				label: columnSelectionControl.resources.selectOptionsAllLabel,
				value: 'All',
				static: true
			},
			{
				label: columnSelectionControl.resources.selectOptionsStandardLabel,
				value: 'itemType',
				static: true
			},
			{
				label: columnSelectionControl.resources.selectOptionsExtendedLabel,
				value: 'Extended',
				static: true
			}
		];

		if (searchLocation === 'Relationships Grid') {
			selectOptions.splice(2, 0, {
				label: columnSelectionControl.resources.selectOptionsRelationshipLabel,
				value: 'Relationship',
				static: true
			});
		}

		const typeAhead = document.createElement('aras-filter-list');
		typeAhead.setState({
			list: selectOptions,
			searchableBranch: true
		});
		columnSelectionControl.typeAhead = typeAhead;
		typeAhead.format = function (template) {
			var button = template.children[2];
			button.className += ' dropdown-arrow';
			button.events = Object.assign(button.events || {}, {
				onClick: function () {
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

	columnSelectionControl.initTree = function (
		itemTypeName,
		columns,
		xClassTrees,
		relationshipsTypeName,
		relationshipsColumns,
		relationshipsXClassTrees
	) {
		columnSelectionControl.columns = columns;
		columnSelectionControl.xClassTrees = xClassTrees;
		columnSelectionControl.relationshipsColumns = relationshipsColumns;
		columnSelectionControl.relationshipsXClassTrees = relationshipsXClassTrees;
		fillSelectEl(columnSelectionControl.node.querySelector('.property-types'));

		if (itemTypeName) {
			currItemType = aras.getItemTypeForClient(itemTypeName).node;
			const explicitXProps = currItemType.selectNodes(
				'Relationships/Item[@type="ItemType_xPropertyDefinition"]/related_id/Item'
			);
			columnSelectionControl.itemTypeExplicitXPropsIds = Array.prototype.map.call(
				explicitXProps,
				function (xProp) {
					return aras.getItemProperty(xProp, 'id');
				}
			);
		}

		if (relationshipsTypeName) {
			currentRelationshipsItemType = aras.getItemTypeForClient(
				relationshipsTypeName
			).node;
			const explicitXProps = currentRelationshipsItemType.selectNodes(
				'Relationships/Item[@type="ItemType_xPropertyDefinition"]/related_id/Item'
			);
			columnSelectionControl.relationshipsTypeExplicitXPropsIds = Array.prototype.map.call(
				explicitXProps,
				function (xProp) {
					return aras.getItemProperty(xProp, 'id');
				}
			);
		}

		columnSelectionControl.initGridWithAllColumns();
		columnSelectionControl.isDirty = false;
	};

	columnSelectionControl.initGridWithAllColumns = function () {
		const head = new Map();
		const rows = new Map();
		head.set('col1', {
			label: 'Column1',
			width: '100%',
			resize: true
		});
		const addPropsToRows = function (column, idx) {
			rows.set(column.propertyId, {
				col1: column.label,
				name: column.name,
				colIndex: column.colNumber,
				hidden: column.hidden,
				propertyId: column.propertyId
			});
		};
		let props = getITProps(columnSelectionControl.columns);
		props.forEach(addPropsToRows);

		props = getITxProps(columnSelectionControl.columns);
		props.forEach(addPropsToRows);

		props = getTreeXClassProps(
			columnSelectionControl.xClassTrees,
			columnSelectionControl.columns
		);
		props.forEach(addPropsToRows);
		if (
			columnSelectionControl.relationshipsColumns &&
			columnSelectionControl.relationshipsColumns.length > 0 &&
			columnSelectionControl.xClassTrees
		) {
			props = getITProps(columnSelectionControl.relationshipsColumns);
			props.forEach(addPropsToRows);

			props = getRelITxProps(columnSelectionControl.relationshipsColumns);
			props.forEach(addPropsToRows);

			props = getTreeXClassProps(
				columnSelectionControl.relationshipsXClassTrees,
				columnSelectionControl.relationshipsColumns,
				relationshipIdPrefix
			);
			props.forEach(addPropsToRows);
		}

		columnSelectionControl.grid.head = head;
		columnSelectionControl.grid.rows = rows;
	};

	columnSelectionControl.renderTreeData = function (indexRows) {
		const uniqueSet = new Set(indexRows);
		const rows = [];
		uniqueSet.forEach(function (row) {
			rows.push(row);
		});
		columnSelectionControl.grid.settings.indexRows = rows;
		columnSelectionControl.grid.render();
		manageSelectAllBlock();
	};

	columnSelectionControl.filterByXClasses = function (xClasses) {
		const xClassProperties = [];
		xClasses.forEach(function (xClass) {
			const indexRows = columnSelectionControl.loadProperties(
				xClass.id,
				xClass
			);
			xClassProperties.push(indexRows);
		});

		const unsortedProperties = Array.prototype.concat.apply(
			[],
			xClassProperties
		);
		const propEntries = unsortedProperties.map(function (propertyId) {
			const entry = columnSelectionControl.grid.rows._store.get(propertyId);
			const label = entry.col1 || entry.name;
			return { label: label, id: entry.propertyId };
		});

		const sortedProperties = propEntries
			.sort(sortByLabel)
			.map(function (entry) {
				return entry.id;
			});

		columnSelectionControl.renderTreeData(sortedProperties);

		if (xClasses.length === 0) {
			columnSelectionControl.showAll();
		} else {
			columnSelectionControl.setVisibleFilteredPanel(true);
			let showTree = true;
			if (sortedProperties.length === 0) {
				showTree = false;
			}
			toggleTreeDisplay(showTree);
		}
	};

	columnSelectionControl.showAll = function () {
		columnSelectionControl.setVisibleFilteredPanel(false);
		xClassSearchWrapper.clearFilters();
		columnSelectionControl.selectProperty(
			columnSelectionControl.typeAhead.state.list[0].value
		);
		columnSelectionControl.typeAhead.setState({
			value: columnSelectionControl.typeAhead.state.list[0].value
		});
	};

	columnSelectionControl.setVisibleFilteredPanel = function (visible) {
		if (!columnSelectionControl.node) {
			return;
		}
		const filterNode = columnSelectionControl.node.querySelector('.filtered');
		filterNode.classList.toggle('hidden', !visible);
	};

	window.columnSelectionControl = columnSelectionControl;

	columnSelectionControl.getCheckedColumns = function () {
		const columns = [];
		columnSelectionControl.grid.rows._store.forEach(function (column) {
			columns.push(column);
		});
		return columns.filter(function (column) {
			return !column.children;
		});
	};
})();
