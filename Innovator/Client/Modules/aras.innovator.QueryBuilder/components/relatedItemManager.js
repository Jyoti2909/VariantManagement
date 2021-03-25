(function (externalParent) {
	var dataParser = {
		parseDom: function (dom, type) {
			return Array.prototype.map.call(
				dom.selectNodes('//Result/Item'),
				function (item) {
					var itemType;
					var relatedItemType;
					var dataSource;

					if (type === 'property') {
						dataSource = item.selectSingleNode('data_source');
						itemType = aras.getItemTypeForClient(dataSource.text, 'id').node;
					} else if (type === 'relationship') {
						dataSource = item.selectSingleNode('relationship_id');
						itemType = aras.getItemTypeForClient(
							item.getAttribute('typeId'),
							'id'
						).node;
						relatedItemType = item.selectSingleNode('related_id/Item');
					} else {
						itemType = aras.getItemTypeForClient(
							item.selectSingleNode('source_id/Item').getAttribute('id'),
							'id'
						).node;
					}

					var icon =
						aras.getScriptsURL() +
						(aras.getItemProperty(itemType, 'large_icon') ||
							'../images/DefaultItemType.svg');
					var name = aras.getItemProperty(item, 'name');
					var label = aras.getItemProperty(item, 'label') || name;
					var result = {
						item: item,
						dataSource: dataSource,
						name: name,
						label: label,
						icon: icon
					};

					if (
						aras.getItemProperty(
							relatedItemType || itemType,
							'implementation_type'
						) === 'polymorphic' &&
						type !== 'whereused'
					) {
						itemType = relatedItemType
							? aras.getItemTypeForClient(
									relatedItemType.getAttribute('id'),
									'id'
							  ).node
							: itemType;
						this.parsePolyItem(itemType, result);
					}

					return result;
				}.bind(this)
			);
		},
		parsePolyItem: function (itemType, result) {
			var polySources = itemType.selectNodes(
				'Relationships/Item[@type="Morphae"]'
			);

			result.children = [];
			Array.prototype.forEach.call(polySources, function (polySourceItem) {
				var relatedItem = polySourceItem.selectSingleNode('related_id/Item');
				var name = aras.getItemProperty(relatedItem, 'name');
				var icon = aras.getItemProperty(
					aras.getItemTypeForClient(name, 'name').node,
					'open_icon'
				);

				result.children.push({
					label:
						result.label +
						' [' +
						(aras.getItemProperty(relatedItem, 'label') || name) +
						']',
					icon:
						aras.getScriptsURL() + (icon || '../images/DefaultItemType.svg'),
					item: polySourceItem,
					dataSource:
						result.item.getAttribute('type') === 'RelationshipType'
							? result.dataSource
							: relatedItem.selectSingleNode('id'),
					name: result.name
				});
			});
			result.label += ' [*]';
		}
	};
	var relatedItemHelper = {
		init: function (dom) {
			var dialog = this._showDialog(this._type);
			this._buildTree(dataParser.parseDom(dom, this._type));
			this.makeAdded(this._type, dialog);
		},
		addHandler: function (type, dialog) {
			var isChecked;
			var grid = this._grid;
			var qbTree = this._qbTree;
			var selectedRows = grid.settings.selectedRows;
			var selectedTreeElement = qbTree.tree.data.get(qbTree.tree.selected);
			var actions = {
				property: function (data, treeElement) {
					treeElement = treeElement || selectedTreeElement;

					var propName = data.name;
					var propDataSource = data.dataSource;
					var createItemHandler =
						propName !== 'related_id'
							? qbTree.dataLoader.createPropertyItem
							: qbTree.dataLoader.createRelatedItem;
					var referencePredicate = {
						source: propName,
						related: 'id'
					};
					var source = aras.getItemTypeForClient(propDataSource.text, 'id')
						.node;
					var alias = qbTree.createUniqueAlias(
						aras.getItemProperty(source, 'name'),
						treeElement
					);

					qbTree.createChildQueryItem(
						treeElement,
						alias,
						propDataSource,
						referencePredicate,
						createItemHandler
					);
				},
				relationship: function (data) {
					var node = data.item;
					var referencePredicate = {
						source: 'id',
						related: 'source_id'
					};
					var alias = data.name;
					var relationshipDataSource = data.dataSource;
					var treeElement;

					alias = qbTree.createUniqueAlias(alias, selectedTreeElement);
					treeElement = qbTree.createChildQueryItem(
						selectedTreeElement,
						alias,
						relationshipDataSource,
						referencePredicate,
						qbTree.dataLoader.createRelationshipItem
					);

					if (node.getAttribute('checkboxChecked') === '1') {
						if (node.getAttribute('type') === 'Morphae') {
							return actions.property(
								{
									name: 'related_id',
									dataSource: node.selectSingleNode('related_id/Item/id')
								},
								treeElement
							);
						}

						var propItem = aras.newIOMItem('Property', 'get');
						propItem.setAttribute('select', 'id, name, label, data_source');
						propItem.setProperty('source_id', relationshipDataSource.text);
						propItem.setProperty('name', 'related_id');
						propItem.setPropertyCondition('data_source', 'is not null');
						propItem = propItem.apply();

						if (propItem.getItemCount() > 0) {
							actions.property(
								{
									dataSource: propItem.node.selectSingleNode('data_source'),
									name: 'related_id'
								},
								treeElement
							);
						}
					}
				},
				whereused: function (data) {
					var node = data.item;
					var alias = qbTree.createUniqueAlias(
						node.selectSingleNode('item_type_name_space_prop_name').text,
						selectedTreeElement
					);
					var whereUsedDataSource = node.selectSingleNode('source_id/Item/id');
					var referencePredicate = {
						source: 'id',
						related: node.selectSingleNode('name').text
					};

					qbTree.createChildQueryItem(
						selectedTreeElement,
						alias,
						whereUsedDataSource,
						referencePredicate,
						qbTree.dataLoader.createWhereUsedItem
					);
				}
			};

			if (!selectedRows.length) {
				return aras.AlertError(
					aras.getResource(
						'../Modules/aras.innovator.QueryBuilder/',
						'error_nothing_selected'
					)
				);
			}

			if (type === 'relationship') {
				isChecked = document.querySelector('input[type="checkbox"]').checked;
			}

			selectedRows.forEach(function (rowKey) {
				var row = grid.rows.get(rowKey);
				var item = row.item;

				item.removeAttribute('checkboxChecked');

				if (isChecked) {
					item.setAttribute('checkboxChecked', '1');
				}
				actions[type]({
					item: item,
					dataSource: row.dataSource,
					name: row.name
				});
			});

			dialog.close();
		},
		searchHandler: function (event) {
			var value = event.target.value;

			var grid = this._grid;
			var initialRows = grid.settings.initialRows;
			var rows = new Map();
			var roots = [];

			initialRows.forEach(function (row, key) {
				if (row.label.toLowerCase().indexOf(value.toLowerCase()) !== -1) {
					var parentKey = row.parentKey;
					var children = row.children;
					var rootKey;

					if (parentKey) {
						rows.set(parentKey, initialRows.get(parentKey));
					} else if (children) {
						children.forEach(function (childKey) {
							rows.set(childKey, initialRows.get(childKey));
						});
					}

					rootKey = parentKey || key;

					if (roots.indexOf(rootKey) === -1) {
						roots.push(rootKey);
					}
					rows.set(key, row);
				}
			});
			grid.rows = !value ? initialRows : rows;
			grid.roots = !value ? grid.settings.initialRoots : roots;
			grid.render();
		}
	};

	function RelatedItemManager(qbTree, type) {
		this._grid = null;
		this._type = type;
		this._qbTree = qbTree;
	}

	RelatedItemManager.prototype = {
		constructor: RelatedItemManager,
		_buildTree: function (data) {
			var key = 0;
			var rows = new Map();
			var head = new Map();
			var roots = [];
			var grid = new TreeGrid(document.getElementById('grid'));

			Grid.formatters.iconText = function (headId, rowId, value, grid) {
				var formatter = {
					children: [
						{
							tag: 'span',
							children: [value]
						}
					]
				};
				var icon = grid.rows.get(rowId, 'icon');

				formatter.children.unshift({
					tag: 'img',
					className: 'aras-grid-row-icon',
					attrs: {
						src: icon
					}
				});

				return formatter;
			};

			grid.getCellType = function () {
				return 'iconText';
			};
			data.forEach(function (rowItem) {
				const rowId = (++key).toString();
				const row = {
					icon: rowItem.icon,
					label: rowItem.label,
					item: rowItem.item,
					dataSource: rowItem.dataSource,
					name: rowItem.name
				};

				if (rowItem.children) {
					row.children = rowItem.children.map(function (child) {
						const childId = (++key).toString();

						child.parentKey = rowId;
						rows.set(childId, child);
						return childId;
					});
				}

				roots.push(rowId);
				rows.set(rowId, row);
			});
			head.set('label', {
				width: 330,
				resize: false
			});
			grid.head = head;
			grid.rows = grid.settings.initialRows = rows;
			grid.roots = grid.settings.initialRoots = roots;
			this._grid = grid;
		},
		_showDialog: function (type) {
			var dialogData = {
				property: function () {
					var searchItems = document.createElement('div');
					var label = document.createElement('p');
					var input = document.createElement('input');

					searchItems.classList.add('search-items');
					label.classList.add('search-items__label');
					input.classList.add('search-items__input');

					label.textContent = aras.getResource(
						'../Modules/aras.innovator.QueryBuilder/',
						'property_search_label'
					);

					searchItems.appendChild(label);
					searchItems.appendChild(input);

					return {
						title: aras.getResource(
							'../Modules/aras.innovator.QueryBuilder/',
							'action.add.property.in.dialog'
						),
						content: searchItems
					};
				},
				relationship: function () {
					var label = document.createElement('label');
					var input = document.createElement('input');
					var span = document.createElement('span');
					var labelTitle = document.createElement('span');

					label.classList.add('aras-form-boolean');

					input.type = 'checkbox';
					input.checked = true;
					labelTitle.textContent = aras.getResource(
						'../Modules/aras.innovator.QueryBuilder/',
						'action.add.include_related'
					);

					label.appendChild(input);
					label.appendChild(span);
					label.appendChild(labelTitle);

					return {
						title: aras.getResource(
							'../Modules/aras.innovator.QueryBuilder/',
							'action.add.relationship.in.dialog'
						),
						content: label
					};
				},
				whereused: function () {
					var searchItems = document.createElement('div');
					var label = document.createElement('p');
					var input = document.createElement('input');

					searchItems.classList.add('search-items');
					label.classList.add('search-items__label');
					input.classList.add('search-items__input');

					label.textContent = aras.getResource(
						'../Modules/aras.innovator.QueryBuilder/',
						'referencing_item_search_label'
					);

					searchItems.appendChild(label);
					searchItems.appendChild(input);

					return {
						title: aras.getResource(
							'../Modules/aras.innovator.QueryBuilder/',
							'action.add.whereused.in.dialog'
						),
						content: searchItems
					};
				}
			};
			var data = dialogData[type]();
			var dialog = new ArasModules.Dialog('html', {
				title: data.title
			});
			var grid = document.createElement('div');
			var button = document.createElement('button');

			grid.id = 'grid';
			grid.classList.add('qb-relatedItems-dialog__grid');

			button.id = 'qbAddRelated';
			button.classList.add('aras-btn');
			button.textContent = aras.getResource(
				'../Modules/aras.innovator.QueryBuilder/',
				'action.add.reuse_button'
			);

			if (data.content) {
				dialog.contentNode.appendChild(data.content);
			}

			dialog.dialogNode.classList.add('qb-relatedItems-dialog');
			dialog.contentNode.appendChild(grid);
			dialog.contentNode.appendChild(button);
			dialog.show();

			return dialog;
		},
		makeSearchable: function () {
			var input = document.querySelector('.search-items > input');
			input.addEventListener(
				'input',
				relatedItemHelper.searchHandler.bind(this)
			);
		},
		makeAdded: function (type, dialog) {
			const button = document.getElementById('qbAddRelated');
			button.addEventListener(
				'click',
				relatedItemHelper.addHandler.bind(this, type, dialog)
			);
		},
		addProperties: function () {
			var qbTree = this._qbTree;
			var selectedTreeElement = qbTree.tree.data.get(qbTree.tree.selected);
			var qryProps = aras.newIOMItem('Property', 'get');
			qryProps.setAttribute('select', 'id, name, label, data_source');
			qryProps.setProperty('data_type', 'item');
			qryProps.setPropertyCondition('data_source', 'is not null');

			var itemCond = aras.newIOMItem('ItemType', 'get');
			itemCond.setAttribute('select', 'id');
			itemCond.setProperty('id', selectedTreeElement.itemTypeId);
			qryProps.setPropertyItem('source_id', itemCond);
			qryProps = qryProps.apply();

			relatedItemHelper.init.call(this, qryProps.dom);
			this.makeSearchable();
		},
		addRelationships: function () {
			var qbTree = this._qbTree;
			var selectedTreeElement = qbTree.tree.data.get(qbTree.tree.selected);
			var qryRels = aras.newIOMItem('RelationshipType', 'get');
			qryRels.setAttribute(
				'select',
				'id, name, label, relationship_id, related_id'
			);

			var itemCond = aras.newIOMItem('ItemType', 'get');
			itemCond.setAttribute('select', 'id');
			itemCond.setProperty('id', selectedTreeElement.itemTypeId);

			qryRels.setPropertyItem('source_id', itemCond);
			qryRels = qryRels.apply();
			relatedItemHelper.init.call(this, qryRels.dom);
		},
		addWhereUsed: function () {
			var qbTree = this._qbTree;
			var selectedTreeElement = qbTree.tree.data.get(qbTree.tree.selected);
			var morphaeQuery = aras.newIOMItem('Morphae', 'get');
			var itemTypeSelected = aras.getItemTypeForClient(
				selectedTreeElement.itemTypeId,
				'id'
			).node;
			morphaeQuery.setAttribute('select', 'source_id');
			morphaeQuery.setProperty(
				'related_id',
				itemTypeSelected.getAttribute('id')
			);
			morphaeQuery = morphaeQuery.apply();

			var arr =
				morphaeQuery.nodeList || (morphaeQuery.node ? [morphaeQuery.node] : []);
			arr = Array.prototype.map.call(arr, function (item) {
				return item.selectSingleNode('source_id').text;
			});
			arr.push(itemTypeSelected.getAttribute('id'));
			var qryWhereUsed = aras.newIOMItem('Property', 'get');
			qryWhereUsed.setAttribute(
				'select',
				'id, name, label, source_id(id, name, label)'
			);
			qryWhereUsed.setAttribute('orderBy', 'source_id');
			qryWhereUsed.setProperty('data_type', 'item');
			qryWhereUsed.setAttribute(
				'where',
				"Property.name != 'id' and Property.name != 'config_id' and Property.name != 'source_id'"
			);
			qryWhereUsed.setPropertyCondition('data_source', 'in');
			qryWhereUsed.setProperty('data_source', arr);
			qryWhereUsed = qryWhereUsed.apply();

			for (var i = 0; i < qryWhereUsed.getItemCount(); i++) {
				var whereUsedItem = qryWhereUsed.getItemByIndex(i);
				var itemType = whereUsedItem.getItemsByXPath('source_id/Item');
				var itemTypeLabel = itemType.getProperty('label');
				var propertyLabel = whereUsedItem.getProperty('label');
				var itemTypeName = itemType.getProperty('name');
				var propertyName = whereUsedItem.getProperty('name');
				var newLabel =
					(itemTypeLabel || itemTypeName) +
					' (' +
					(propertyLabel || propertyName) +
					')';
				whereUsedItem.setProperty('label', newLabel);
				whereUsedItem.setProperty(
					'item_type_name_space_prop_name',
					itemTypeName + ' ' + propertyName
				);
			}
			relatedItemHelper.init.call(this, qryWhereUsed.dom);
			this.makeSearchable();
		}
	};
	externalParent.RelatedItemManager = RelatedItemManager;
})(window);
