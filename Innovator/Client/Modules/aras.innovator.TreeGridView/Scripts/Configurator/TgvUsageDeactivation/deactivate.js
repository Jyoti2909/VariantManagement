(function () {
	var deactivatorHelper = {
		removeHandler: function () {
			var removeButton = document.querySelector('button');
			var aras = window.dialogArguments.aras;
			var grid = this._grid;
			var rows = grid.rows;

			const updateMetadataCache = () => {
				const rows = [...grid.rows._store.values()];
				rows
					.reduce((items, row) => {
						if (
							row.isChecked &&
							row.itemType === 'RelationshipType' &&
							!items.has(row.relTypeSourceId)
						) {
							const itemNode = aras.getItemTypeNodeForClient(
								row.relTypeSourceId,
								'id'
							);
							items.add(itemNode);
						}
						return items;
					}, new Set())
					.forEach((node) => {
						window.parent.ClearDependenciesInMetadataCache(aras, node);
					});
			};
			var removeFromServer = function () {
				var groups = {};
				var aml = '<AML>';

				rows._store.forEach(function (row) {
					if (row.isChecked) {
						groups[row.itemType] = groups[row.itemType] || [];
						groups[row.itemType].push(row.id);
					}
				});
				aml = Object.keys(groups).reduce(function (aml, type) {
					aml +=
						'<Item type=' +
						"'" +
						type +
						"'" +
						" action='delete'" +
						' idlist=' +
						"'" +
						groups[type] +
						"'" +
						'></Item>';
					return aml;
				}, aml);

				return aras.applyAML(aml + '</AML>');
			};
			var removeFromClient = function () {
				rows._store.forEach(function (row, key) {
					if (row.isChecked) {
						var parentRow = rows.get(row.parentKey);

						if (parentRow) {
							var children = parentRow.children;
							children.splice(children.indexOf(key), 1);

							if (!children.length) {
								parentRow.className = 'aras-grid-row_not-child';
								rows.set(row.parentKey, parentRow);
							}
						}
						rows.delete(key);
					}
				});
			};

			if (!removeFromServer()) {
				return;
			}

			updateMetadataCache();
			removeFromClient();
			removeButton.setAttribute('disabled', true);
		},
		rowClickHandler: function (rowKey, event) {
			var target = event.target.closest('.aras-grid-link');

			if (target) {
				var row = this._grid.rows.get(rowKey);

				window.dialogArguments.aras.uiShowItem(row.itemType, row.id);
			}
		},
		applyCheckedItemsHandler: function (e) {
			var removeButton = document.querySelector('button');
			var grid = this._grid;
			var headId = e.detail.headId;
			var rowId = e.detail.rowId;
			var value = e.detail.value;
			var row = grid.rows.get(rowId);
			var children = row.children;

			removeButton.setAttribute('disabled', true);
			if (children) {
				children.forEach(function (childKey) {
					var childRow = grid.rows.get(childKey);
					childRow[headId] = value;
					grid.rows.set(childKey, childRow);
				});
			}

			row[headId] = value;
			grid.rows.set(rowId, row);

			grid.rows._store.forEach(function (row) {
				if (row.isChecked) {
					removeButton.removeAttribute('disabled');
				}
			});
		}
	};

	function Deactivator(elem) {
		this._viewsItems = [];
		this._method = null;
		this._grid = null;
		this._elem = elem;

		this._buildTree(this._getDataFromServer());
		this.makeDeactivated();
	}

	DeactivatorPrototype = {
		constructor: Deactivator,
		_getDataFromServer: function () {
			var dialogArguments = window.dialogArguments;
			var aras = dialogArguments.aras;
			var scriptURL = aras.getScriptsURL();
			var relationshipViewIcon = '../images/DefaultItemType.svg';
			var relationshipTypeIcon = aras.getItemProperty(
				aras.getItemTypeDictionary('RelationshipType').node,
				'open_icon'
			);
			var methodIcon = aras.getItemProperty(
				aras.getItemTypeDictionary('Method').node,
				'open_icon'
			);

			this._viewsItems = aras.newIOMItem('Relationship View', 'get');
			this._method = aras.newIOMItem('Method', 'get');

			this._viewsItems.setAttribute(
				'select',
				'source_id, related_id, parameters'
			);
			this._viewsItems.setPropertyCondition('parameters', 'like');
			this._viewsItems.setProperty(
				'parameters',
				'%tgvdId=' + aras.getItemProperty(dialogArguments.tgvNode, 'id') + '%'
			);
			this._viewsItems = this._viewsItems.apply();
			var viewItemsArr =
				this._viewsItems.nodeList ||
				(this._viewsItems.node && [this._viewsItems.node]) ||
				[];
			var data = [];
			var grouped = Array.prototype.map
				.call(viewItemsArr, function (viewItem) {
					const relTypeId = aras.getItemProperty(viewItem, 'source_id');
					const relType = aras.getRelationshipType(relTypeId);
					const relTypeSourceId = relType.getProperty('source_id');
					return {
						id: relTypeId,
						itemType: 'RelationshipType',
						relTypeSourceId,
						type: 'Relationship Type',
						name: viewItem
							.selectSingleNode('source_id')
							.getAttribute('keyed_name'),
						isChecked: false,
						icon: scriptURL + relationshipTypeIcon,
						children: [
							{
								itemType: 'Relationship View',
								id: aras.getItemProperty(viewItem, 'id'),
								relTypeSourceId,
								type: 'Relationship View',
								name: viewItem
									.selectSingleNode('related_id')
									.getAttribute('keyed_name'),
								isChecked: false,
								icon: scriptURL + relationshipViewIcon
							}
						]
					};
				})
				.reduce(function (groups, item) {
					var value = item.name;
					groups[value] = groups[value] || [];
					groups[value].push(item);

					return groups;
				}, {});

			Object.keys(grouped).forEach(function (key) {
				var items = grouped[key];

				items[0].children = items.reduce(function (arr, item) {
					return arr.concat(item.children);
				}, []);

				data.push(items[0]);
			});
			this._method.setProperty(
				'method_code',
				'%tgvdId=' + aras.getItemProperty(dialogArguments.tgvNode, 'id') + '%'
			);
			this._method.setPropertyCondition('method_code', 'like');
			this._method = this._method.apply();

			var methodsArr =
				this._method.nodeList ||
				(this._method.node && [this._method.node]) ||
				[];

			Array.prototype.forEach.call(methodsArr, function (methodNode) {
				data.push({
					itemType: 'Method',
					type: 'JavaScript Method',
					name: aras.getItemProperty(methodNode, 'name'),
					id: aras.getItemProperty(methodNode, 'id'),
					isChecked: false,
					icon: scriptURL + methodIcon
				});
			});
			return data;
		},
		_buildTree: function (data) {
			var createHead = function () {
				var head = new Map();

				head.set('name', {
					label: 'name',
					width: 330,
					resize: false
				});
				head.set('isChecked', {
					label: 'isChecked',
					width: 30,
					resize: false
				});

				return head;
			};

			var createRows = function () {
				var rows = new Map();
				var roots = [];
				var key = 0;

				data.forEach(function (row) {
					var rowKey = ++key;
					const rowId = rowKey.toString();
					rows.set(rowId, row);
					roots.push(rowId);
					row.children =
						row.children &&
						row.children.map(function (child) {
							const childRowId = (++key).toString();

							child.parentKey = rowId;
							rows.set(childRowId, child);

							return childRowId;
						});
				});

				return {
					rows: rows,
					roots: roots
				};
			};

			var grid = new TreeGrid(this._elem, {
				editable: true
			});
			var content = createRows();
			var head = createHead();
			var rows = content.rows;

			grid.actions._addHandlers([
				{
					target: grid.dom,
					action: 'applyCheckedItems',
					handler: deactivatorHelper.applyCheckedItemsHandler.bind(this)
				}
			]);
			grid.getCellType = function (headId) {
				var formatters = {
					name: 'iconLink',
					isChecked: 'checked'
				};

				return formatters[headId];
			};
			grid.checkEditAvailability = function (headId, rowId) {
				if (headId === 'isChecked') {
					var row = rows.get(rowId);
					var parentRow = rows.get(row.parentKey);

					return !(row.isChecked && parentRow && parentRow.isChecked);
				}
			};
			grid.getEditorType = function (headId, rowId, value, type) {
				if (type === 'checked') {
					return 'nonEditable';
				}
				return type;
			};
			grid.getRowClasses = function (rowId) {
				var row = this.rows.get(rowId);

				return row.className;
			};
			grid.on('click', deactivatorHelper.rowClickHandler.bind(this), 'row');

			grid.head = head;
			grid.rows = rows;
			grid.roots = content.roots;
			this._grid = grid;
		},
		makeDeactivated: function () {
			var removeButton = document.querySelector('button');

			removeButton.textContent = window.dialogArguments.aras.getResource(
				'../../Modules/aras.innovator.TreeGridView',
				'remove_btn'
			);
			removeButton.addEventListener(
				'click',
				deactivatorHelper.removeHandler.bind(this)
			);
		}
	};
	Deactivator.prototype = DeactivatorPrototype;
	window.Deactivator = Deactivator;
})();
