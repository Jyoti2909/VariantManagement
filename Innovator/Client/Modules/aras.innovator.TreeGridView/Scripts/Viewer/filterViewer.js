(function () {
	const filterViewerHelper = {
		applyCheckedItemsHandler: function (e) {
			const grid = this._grid;
			const headId = e.detail.headId;
			const rowId = e.detail.rowId;
			const value = e.detail.value;

			const traverseChildren = function (rowId) {
				const row = grid.rows.get(rowId);
				const children = row.children;

				if (children) {
					children.forEach(function (childKey) {
						traverseChildren(childKey);
					});
				}

				row[headId] = value;
				grid.rows.set(rowId, row);
			};

			traverseChildren(rowId);
		},
		applyHandler: function (dialog) {
			const aras = window.dialogArguments.aras;
			const changeableRelationshipNode = this._changeableNode.selectSingleNode(
				'Relationships'
			);
			const sourceRelationshipNode = this._sourceNode.selectSingleNode(
				'Relationships'
			);
			const removedNodes = changeableRelationshipNode.selectNodes(
				"Item[@type='rb_TreeRowDefinition' or @type='rb_TreeRowReference']"
			);
			const inputValue = document.querySelector('input').value.trim();
			const maxChildItems = +inputValue || -1;

			const traverse = function (referenceId, combined) {
				const referenceNode = sourceRelationshipNode.selectSingleNode(
					'Item[id="' + referenceId + '"]'
				);
				const childRefId = aras.getItemProperty(referenceNode, 'child_ref_id');
				const rowDefinitionNode = sourceRelationshipNode.selectSingleNode(
					'Item[ref_id="' + childRefId + '"]'
				);
				const arr = combined || [];

				changeableRelationshipNode.appendChild(referenceNode.cloneNode(true));

				if (
					!changeableRelationshipNode.selectSingleNode(
						'Item[ref_id="' + childRefId + '"]'
					)
				) {
					changeableRelationshipNode.appendChild(
						rowDefinitionNode.cloneNode(true)
					);
				}

				arr.forEach(function (referenceId) {
					traverse(referenceId);
				});
			};
			if (
				inputValue &&
				(maxChildItems < 0 || parseInt(maxChildItems) !== maxChildItems)
			) {
				return aras.AlertError(
					aras.getResource(
						'../Modules/aras.innovator.TreeGridView',
						'expandAll_childNumber_error'
					)
				);
			}
			Array.prototype.forEach.call(removedNodes, function (node) {
				changeableRelationshipNode.removeChild(node);
			});

			this._grid.rows._store.forEach(function (row) {
				if (row.isChecked) {
					traverse(row.rowReferenceId, row.combined);
				}
			});

			dialog.close(maxChildItems);
		},
		cancelHandler: function (dialog) {
			dialog.close();
		}
	};
	function FilterViewer() {
		const dialogArguments = window.dialogArguments;
		const aras = dialogArguments.aras;
		const applyButton = document.querySelector('.aras-btn');
		const cancelButton = document.querySelector('.btn_cancel');

		document.querySelector('label').textContent = aras.getResource(
			'../Modules/aras.innovator.TreeGridView',
			'filter-viewer_field-label'
		);
		applyButton.textContent = aras.getResource(
			'../Modules/aras.innovator.TreeGridView',
			'filter-viewer_apply'
		);
		cancelButton.textContent = aras.getResource(
			'../Modules/aras.innovator.TreeGridView',
			'filter-viewer_cancel'
		);

		this._sourceNode = dialogArguments.sourceTgvdNode;
		this._changeableNode = dialogArguments.changeableTgvdNode;
		this._buildTree();
		this.makeFiltered();
	}
	FilterViewer.prototype = {
		constructor: FilterViewer,
		makeFiltered: function () {
			const dialogArguments = window.dialogArguments;
			const applyButton = document.querySelector('.aras-btn');
			const cancelButton = document.querySelector('.btn_cancel');

			applyButton.addEventListener(
				'click',
				filterViewerHelper.applyHandler.bind(this, dialogArguments.dialog)
			);
			cancelButton.addEventListener(
				'click',
				filterViewerHelper.cancelHandler.bind(this, dialogArguments.dialog)
			);
		},
		_getQueryItemsData: function () {
			const aras = window.dialogArguments.aras;
			let rowDefinitions = this._sourceNode.selectNodes(
				"Relationships/Item[@type='rb_TreeRowDefinition']"
			);
			let aml = Array.prototype.reduce.call(
				rowDefinitions,
				function (aml, rowDefinition) {
					aml +=
						'<ref_id>' +
						aras.getItemProperty(rowDefinition, 'query_item_ref_id') +
						'</ref_id>';
					return aml;
				},
				"<AML><Item type='qry_QueryItem' action='get' select='alias, ref_id, item_type'><or>"
			);

			aml = parent.ArasModules.xml
				.parseString(aras.applyAML(aml + '</or></Item></AML>'))
				.selectNodes('//Item');

			return Array.prototype.reduce.call(
				aml,
				function (data, queryItem) {
					data[aras.getItemProperty(queryItem, 'ref_id')] = {
						name: aras.getItemProperty(queryItem, 'alias'),
						itemTypeId: aras.getItemProperty(queryItem, 'item_type')
					};

					return data;
				},
				{}
			);
		},
		_buildTree: function () {
			const createHead = function () {
				const head = new Map();

				head.set('isChecked', {
					label: 'isChecked',
					width: 30,
					resize: false
				});

				head.set('name', {
					label: 'name',
					width: 480,
					resize: false
				});

				return head;
			};
			const createRows = function () {
				let key = 0;

				const rows = new Map();
				const roots = [];

				const sourceNode = this._sourceNode;
				const changeableNode = this._changeableNode;
				const data = this._getQueryItemsData();

				const rootRowReferences = sourceNode.selectNodes(
					"Relationships/Item[@type='rb_TreeRowReference' and (not(parent_ref_id) " +
						"or parent_ref_id='')]"
				);
				const usedElements = {};

				const createRow = function (rowReference, parentKey) {
					const aras = window.dialogArguments.aras;
					const referenceId = aras.getItemProperty(rowReference, 'id');
					const childRefId = aras.getItemProperty(rowReference, 'child_ref_id');
					const rowDefinition = sourceNode.selectSingleNode(
						"Relationships/Item[ref_id='" + childRefId + "']"
					);
					const queryItemRefId = aras.getItemProperty(
						rowDefinition,
						'query_item_ref_id'
					);
					const references = sourceNode.selectNodes(
						"Relationships/Item[parent_ref_id='" + childRefId + "']"
					);

					if (
						aras
							.getItemProperty(rowReference, 'reference_type')
							.toLowerCase() !== 'join'
					) {
						const row = {
							name: data[queryItemRefId].name,
							rowReferenceId: referenceId,
							parentKey: parentKey,
							className: ''
						};

						row.isChecked = !!changeableNode.selectSingleNode(
							"Relationships/Item[id='" + referenceId + "']"
						);
						row.icon = this._getRowIcon(row, data[queryItemRefId].itemTypeId);
						++key;
						const rowId = key.toString();
						rows.set(rowId, row);

						if (!parentKey) {
							row.isChecked = ' ';
							roots.push(rowId);
						} else {
							const parentRow = rows.get(parentKey);

							parentRow.children = parentRow.children || [];
							parentRow.children.push(rowId);
						}

						parentKey = rowId;
					} else {
						const parentRow = rows.get(parentKey);

						parentRow.combined = parentRow.combined || [];
						parentRow.type = 'join';
						parentRow.name += ' --- ' + data[queryItemRefId].name;
						parentRow.icon = this._getRowIcon(parentRow);
						parentRow.combined.push(referenceId);
					}

					if (usedElements[childRefId]) {
						const reusableRow = rows.get(usedElements[childRefId]);
						const reusedRow = rows.get(parentKey);

						reusableRow.className += ' aras-grid-row_reusable';
						reusedRow.className += ' aras-grid-row_reused';
						return;
					}
					usedElements[childRefId] = parentKey;
					Array.prototype.forEach.call(references, function (reference) {
						createRow(reference, parentKey);
					});
				}.bind(this);

				Array.prototype.forEach.call(rootRowReferences, function (reference) {
					createRow(reference);
				});

				return {
					rows: rows,
					roots: roots
				};
			}.bind(this);

			const grid = new TreeGrid(
				document.getElementById('filter-viewer__grid'),
				{
					editable: true
				}
			);
			const content = createRows();

			grid.settings._treeHeadView = 'name';
			grid.head = createHead();
			grid.rows = content.rows;
			grid.roots = content.roots;

			grid.rows._store.forEach(function (row, key) {
				grid.expand(key);
			});
			grid.actions._addHandlers([
				{
					target: grid.dom,
					action: 'applyCheckedItems',
					handler: filterViewerHelper.applyCheckedItemsHandler.bind(this)
				}
			]);
			grid.getCellType = function (headId, rowId) {
				if (headId === 'isChecked') {
					const row = grid.rows.get(rowId);

					if (!row.parentKey) {
						return;
					}

					return 'checked';
				}
				return 'filterViewerIcon';
			};
			grid.checkEditAvailability = function (headId, rowId) {
				const rows = grid.rows;

				if (headId === 'isChecked') {
					const row = rows.get(rowId);
					const parentRow = rows.get(row.parentKey);

					return parentRow && parentRow.isChecked;
				}
			};
			grid.getRowClasses = function (rowId) {
				return grid.rows.get(rowId).className;
			};
			grid.getEditorType = function (headId, rowId, value, type) {
				if (type === 'checked') {
					return 'nonEditable';
				}
				return type;
			};
			this._grid = grid;
		},
		_getRowIcon: function (row, itemTypeId) {
			let icon;
			const aras = window.dialogArguments.aras;
			const scriptURL = aras.getScriptsURL();
			const rowReference = this._sourceNode.selectSingleNode(
				"Relationships/Item[id='" + row.rowReferenceId + "']"
			);
			const columnMapping = this._sourceNode.selectSingleNode(
				"Relationships//Item[tree_row_ref_id='" +
					aras.getItemProperty(rowReference, 'child_ref_id') +
					"']"
			);

			icon = JSON.parse(aras.getItemProperty(columnMapping, 'template') || '{}')
				.icon;

			if (icon) {
				const vaultPrefix = 'vault:///?fileId=';

				if (/\{[\s\S]*?}/.test(icon)) {
					icon = scriptURL + '../images/IconTemplate.svg';
				} else if (icon.indexOf(vaultPrefix) !== -1) {
					icon = aras.IomInnovator.getFileUrl(
						icon.slice(vaultPrefix.length),
						aras.Enums.UrlType.SecurityToken
					);
				} else {
					icon = scriptURL + icon;
				}

				return icon;
			}
			if (row.combined) {
				return scriptURL + '../images/CombinedElement.svg';
			}

			const itemType = aras.getItemTypeForClient(itemTypeId, 'id').node;

			icon =
				aras.getItemProperty(itemType, 'open_icon') ||
				(aras.getItemProperty(itemType, 'is_relationship') === '1' &&
					'../images/RelationshipType.svg') ||
				'../images/DefaultItemType.svg';

			return scriptURL + icon;
		}
	};
	window.FilterViewer = FilterViewer;
})();
