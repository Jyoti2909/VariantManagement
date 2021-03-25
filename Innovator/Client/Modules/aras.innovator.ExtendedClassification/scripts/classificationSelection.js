(function () {
	var classificationSelectionControl = {
		filter: '',
		data: {}
	};

	var xClassIT;
	var xClassIcon;
	var infernoFlags = ArasModules.utils.infernoFlags;
	let toolbarApplet;

	function getImgNode(item) {
		const svgNode = ArasModules.SvgManager.createInfernoVNode(xClassIcon);
		return svgNode;
	}

	function getTree(
		item,
		xClassIds,
		branchesSelectable,
		selectOnlySingleClass,
		removedXClasses
	) {
		var relationships = item.selectNodes(
			'Relationships/Item[@type="xClass" and not(@action="delete")]'
		);
		if (relationships.length === 0) {
			return;
		}
		var treeId = aras.getItemProperty(item, 'id');
		var hierarchy = aras.getItemProperty(item, 'classification_hierarchy');
		if (!hierarchy) {
			return;
		}
		var treeStructure = JSON.parse(hierarchy);
		var edges = {};
		treeStructure.forEach(function (edge) {
			var from = edge.fromRefId ? treeId + '_' + edge.fromRefId : 'roots';
			var to = treeId + '_' + edge.toRefId;
			if (!edges[from]) {
				edges[from] = [];
			}
			edges[from].push(to);
		});
		var childToParents = {};
		var countData = { selectedCount: 0, overall: 0 };

		var rows = new Map();
		var roots = new Set(edges.roots);
		Array.prototype.forEach.call(relationships, function (xClass) {
			var id = aras.getItemProperty(xClass, 'id');
			var refId = aras.getItemProperty(xClass, 'ref_id');
			var key = treeId + '_' + refId;
			var rowObj = {
				col1:
					aras.getItemProperty(xClass, 'label') ||
					aras.getItemProperty(xClass, 'name'),
				xClassId: id,
				rootId: edges.roots[0],
				selectOnlySingleClass: selectOnlySingleClass
			};
			if (xClassIds.has(id)) {
				rowObj.selected = !removedXClasses.has(id);
				rowObj.locked = true;
			}
			if (edges[key] && edges[key].length > 0) {
				rowObj.children = edges[key];
				rowObj.selectedCount += rowObj.children.length + ')';
				rowObj.children.forEach(function (childId) {
					childToParents[childId] = key;
				});
			}

			if (childToParents[key]) {
				rowObj.parentId = childToParents[key];
			}
			if (rowObj.selected) {
				countData.selectedCount++;
				countData.overall++;
			}

			rows.set(key, rowObj);
		});

		rows.forEach(function (rowObj, key) {
			if (
				!selectOnlySingleClass ||
				(selectOnlySingleClass && countData.selectedCount === 0)
			) {
				rowObj.selectable = branchesSelectable ? true : !rowObj.children;
			}
			if (rowObj.selectable && !rowObj.selected) {
				countData.overall++;
			}
		});

		var root = rows.get(edges.roots[0]);
		root.selectedCount = countData.selectedCount;
		root.isRoot = true;
		root.branchesSelectable = branchesSelectable;
		root.overall = countData.overall;
		root.selectStatus = '(' + root.selectedCount + '/' + root.overall + ')';
		rows.set(edges.roots[0], root);

		return {
			rows: rows,
			roots: roots
		};
	}

	classificationSelectionControl.createToolbar = function (node, onClick) {
		var toolbar = new window.parent.ToolbarWrapper({
			id: 'dialogToolbar' + aras.generateNewGUID(),
			connectNode: node,
			connectId: '',
			useCompatToolbar: true
		});
		toolbar.buttonClick = onClick;
		toolbar.loadXml(
			aras.getI18NXMLResource(
				'classificationSelectionToolbar.xml',
				aras.getScriptsURL() +
					'../Modules/aras.innovator.ExtendedClassification/'
			)
		);
		toolbar.show();
		return toolbar;
	};

	classificationSelectionControl.doClassSelection = function (rowId) {
		var rows = classificationSelectionControl.initedRows;
		var column = rows.get(rowId);
		if (column.locked || !column.selectable) {
			return;
		}
		var root = rows.get(column.rootId);
		if (column.selected) {
			root.selectedCount--;
		} else {
			if (root.selectOnlySingleClass) {
				rows.forEach(function (row, id) {
					if (row.rootId === column.rootId && row.selected === true) {
						row.selected = false;
						rows.set(id, Object.assign({}, row));
						classificationSelectionControl.treeGrid.rows.set(
							id,
							Object.assign({}, row)
						);
						root.selectedCount--;
					}
				});
			}
			root.selectedCount++;
		}

		root.selectStatus = '(' + root.selectedCount + '/' + root.overall + ')';

		column.selected = !column.selected;
		rows.set(rowId, column);
		rows.set(column.rootId, Object.assign({}, root));
		classificationSelectionControl.treeGrid.render();
		return true;
	};

	classificationSelectionControl.attachTo = function (node, onApply) {
		node.classList.add('aras-field-xclasses__selection-dialog');
		classificationSelectionControl.node = node;
		var controlTemplate =
			'<div class="classification-toolbar"><div class="buttons"></div>' +
			'<div class="search-field-separator__container"><span class="search-field-separator" /></div>' +
			'<div class="search-field">' +
			'<span class="iconed"><input name="searchBox" tabindex="0" class="searchBox" type="text" placeholder="' +
			aras.getResource(
				'../Modules/aras.innovator.ExtendedClassification/',
				'xClassesControl.dialogSearchPlaceholder'
			) +
			'"></span>' +
			'</div></div>' +
			'<div class="tree aras-nav"></div>';
		node.innerHTML = controlTemplate;
		const TreeGrid = node.ownerDocument.defaultView.TreeGrid;
		classificationSelectionControl.treeGrid = new TreeGrid(
			node.querySelector('.tree')
		);

		classificationSelectionControl.treeGrid.getCellType = function () {
			return 'richCheckbox';
		};

		TreeGrid.formatters.richCheckbox = function (headId, rowId, value, grid) {
			var initedRows = classificationSelectionControl.initedRows;
			var item = initedRows.get(rowId);
			if (!item) {
				return null;
			}
			var selected = item.selected;
			var selectable = item.selectable;
			var checkbox = {
				className: 'aras-grid-row-cell_boolean',
				children: [getImgNode(item)]
			};

			const foundMarkPlace = value.indexOf(item.foundMark);
			checkbox.children.push(
				{
					tag: 'span',
					className: 'checkbox-title',
					children: [item.foundMark ? value.slice(0, foundMarkPlace) : '']
				},
				{
					tag: 'span',
					className: 'checkbox-title-highlighted',
					children: [item.foundMark || '']
				},
				{
					tag: 'span',
					className: 'checkbox-title',
					children: [
						value.slice(
							item.foundMark ? foundMarkPlace + item.foundMark.length : 0
						)
					]
				}
			);

			if (item.isRoot) {
				checkbox.children.push({
					tag: 'span',
					className: 'count-label',
					children: [item.selectStatus]
				});
			}

			if (selectable || selected) {
				checkbox.children.push({
					tag: 'span',
					className: 'dotted-spacing'
				});
				checkbox.children.push({
					tag: 'label',
					className: 'aras-form-boolean',
					children: [
						{
							tag: 'input',
							attrs: {
								type: 'checkbox',
								checked: !!selected,
								disabled: item.locked
							}
						},
						{
							tag: 'span'
						}
					]
				});
			}

			return checkbox;
		};

		classificationSelectionControl.treeGrid.on(
			'click',
			function (rowId, event) {
				if (
					event.target.closest('.aras-form-boolean') &&
					event.target.tagName !== 'INPUT'
				) {
					var res = classificationSelectionControl.doClassSelection(rowId);
					if (!res) {
						event.preventDefault();
					}
				}
			},
			'row'
		);

		var toolbarNode = node.querySelector('.classification-toolbar .buttons');

		toolbarApplet = classificationSelectionControl.createToolbar(
			toolbarNode,
			function (tbItem) {
				var actionCompletion = Promise.resolve();
				var expandFunc = function (id) {
					actionCompletion = actionCompletion.then(function () {
						return classificationSelectionControl.treeGrid.expand(id);
					});
					if (
						classificationSelectionControl.treeGrid.settings.indexTreeRows[id]
					) {
						classificationSelectionControl.treeGrid.settings.indexTreeRows[
							id
						].forEach(expandFunc);
					}
				};
				if (tbItem.getId() === 'apply') {
					onApply(classificationSelectionControl.initedRows);
				} else if (tbItem.getId() === 'expand') {
					classificationSelectionControl.treeGrid.settings.indexTreeRows.roots.forEach(
						expandFunc
					);
					classificationSelectionControl.treeGrid.render();
				} else if (tbItem.getId() === 'collapse') {
					classificationSelectionControl.treeGrid.settings.expanded.clear();
					classificationSelectionControl.treeGrid.roots =
						classificationSelectionControl.treeGrid.roots;
					classificationSelectionControl.treeGrid.render();
				}
				return actionCompletion;
			}
		);

		var searchNode = node.querySelector('.searchBox');
		searchNode.addEventListener('input', function (e) {
			classificationSelectionControl.doSearch(e.target.value);
		});
	};

	classificationSelectionControl.doSearch = function (val) {
		classificationSelectionControl.filter = val;
		var filtered;
		if (val) {
			classificationSelectionControl.treeGrid.dom.classList.add('search-mode');
			filtered = classificationSelectionControl.doFilter();
			classificationSelectionControl.treeGrid.settings.expanded.clear();
			classificationSelectionControl.renderTreeData(
				filtered.rows,
				filtered.roots
			);
			this.toggleToolbarButtons(false);
		} else if (
			classificationSelectionControl.treeGrid.dom.classList.contains(
				'search-mode'
			)
		) {
			classificationSelectionControl.treeGrid.dom.classList.remove(
				'search-mode'
			);
			filtered = classificationSelectionControl.doFilter();
			classificationSelectionControl.renderTreeData(
				classificationSelectionControl.initedRows,
				classificationSelectionControl.initedRoots
			);
			this.toggleToolbarButtons(true);
		}
	};

	classificationSelectionControl.toggleToolbarButtons = function (doEnable) {
		if (doEnable) {
			toolbarApplet.GetItem('expand').Enable();
			toolbarApplet.GetItem('collapse').Enable();
		} else {
			toolbarApplet.GetItem('expand').Disable();
			toolbarApplet.GetItem('collapse').Disable();
		}
	};

	classificationSelectionControl.doFilter = function () {
		var filteredRows = new Map();
		var filteredRoots = [];
		classificationSelectionControl.initedRows.forEach(function (row, idx) {
			const foundPosition = row.col1
				.toLowerCase()
				.indexOf(classificationSelectionControl.filter.toLowerCase());
			if (foundPosition !== -1 && row.selectable) {
				row.foundMark = row.col1.slice(
					foundPosition,
					foundPosition + classificationSelectionControl.filter.length
				);
				filteredRows.set(idx, Object.assign({}, row));
				filteredRoots.push(idx);
			}
		});
		return {
			rows: filteredRows,
			roots: filteredRoots
		};
	};

	classificationSelectionControl.init = function (
		xClassTrees,
		xClassIds,
		removedXClasses
	) {
		xClassIT = aras.getItemTypeForClient('xClass', 'name');
		xClassIcon =
			xClassIT.getProperty('large_icon') ||
			xClassIT.getProperty('small_icon') ||
			'../images/DefaultItemType.svg';
		var roots = [];
		var rows = new Map();
		Array.prototype.forEach.call(xClassTrees, function (xClassTree) {
			var branchesSelectable =
				aras.getItemProperty(xClassTree, 'select_only_leaf_class') === '0';
			var selectOnlySingleClass =
				aras.getItemProperty(xClassTree, 'select_only_single_class') === '1';
			var tree = getTree(
				xClassTree,
				xClassIds,
				branchesSelectable,
				selectOnlySingleClass,
				removedXClasses
			);
			tree.rows.forEach(function (row, id) {
				rows.set(id, row);
			});
			tree.roots.forEach(function (root) {
				roots.push(root);
			});
		});
		classificationSelectionControl.initedRows = rows;
		classificationSelectionControl.initedRoots = roots;
		classificationSelectionControl.renderTreeData(rows, roots);
	};

	classificationSelectionControl.renderTreeData = function (rows, roots) {
		var head = new Map();
		head.set('col1', {
			label: 'Column1',
			width: '100%',
			resize: true
		});
		classificationSelectionControl.treeGrid.head = head;
		classificationSelectionControl.treeGrid.rows = rows;
		classificationSelectionControl.treeGrid.roots = roots;
	};

	window.classificationSelectionControl = classificationSelectionControl;
})();
