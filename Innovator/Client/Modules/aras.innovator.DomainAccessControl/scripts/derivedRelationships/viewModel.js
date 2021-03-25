(function (externalParent) {
	function ViewModel() {
		const applyEditHandler = function (event) {
			const treeGrid = this._treeGrid;
			const selectedRow = treeGrid.rows.get(event.detail.rowId);
			const queryReferences = this._queryDefinitionData.queryReferences;
			const currentQueryReference = queryReferences.find(function (
				queryReference
			) {
				return (
					aras.getItemProperty(queryReference, 'ref_id') ===
					selectedRow.queryReferenceRefId
				);
			});
			const value = event.detail.value;
			const refIds = queryReferences.reduce(function (result, queryReference) {
				if (
					aras.getItemProperty(currentQueryReference, 'child_ref_id') ===
					aras.getItemProperty(queryReference, 'child_ref_id')
				) {
					result.push(aras.getItemProperty(queryReference, 'ref_id'));
				}
				return result;
			}, []);

			if (value) {
				this._relationshipFamilyModel.map(value, refIds);
			} else {
				this._relationshipFamilyModel.unMap(selectedRow.queryReferenceRefId);
			}
			treeGrid.rows._store.forEach(function (row, key) {
				if (row.itemTypeId === selectedRow.itemTypeId) {
					if (~refIds.indexOf(row.queryReferenceRefId)) {
						row.name = selectedRow.name;
					} else if (row.name === selectedRow.name) {
						row.name = '';
					}
				}
				treeGrid.rows.set(key, row);
			});
		}.bind(this);
		this._treeGrid = new TreeGrid(document.querySelector('.dr-grid'), {
			editable: true
		});
		this._treeGrid.actions._addHandlers([
			{
				target: this._treeGrid.dom,
				action: 'applyEdit',
				handler: applyEditHandler
			}
		]);
	}
	ViewModel.prototype = {
		constructor: ViewModel,
		set queryDefinitionModel(value) {
			this._queryDefinitionModel = value;
		},
		set relationshipFamilyModel(value) {
			this._relationshipFamilyModel = value;
		},
		get queryDefinitionModel() {
			return this._queryDefinitionModel;
		},
		get relationshipFamilyModel() {
			return this._relationshipFamilyModel;
		},
		render: function () {
			return this._queryDefinitionModel
				.getData()
				.then(
					function (queryDefinitionData) {
						if (!queryDefinitionData) {
							return;
						}

						this._queryDefinitionData = queryDefinitionData;
						this._render(this._getTreeData(queryDefinitionData));
					}.bind(this)
				)
				.catch(function (err) {
					console.error(err);
				});
		},
		_getTreeData: function (queryDefinitionData) {
			const queryItems = queryDefinitionData.queryItems;
			const queryReferences = queryDefinitionData.queryReferences;
			const rootQueryReferences = queryReferences.filter(function (
				queryReference
			) {
				return !aras.getItemProperty(queryReference, 'parent_ref_id');
			});
			const referencingIds = queryReferences.reduce(function (
				arr,
				queryReference
			) {
				if (queryReference.getAttribute('is_referencing_item') === '1') {
					arr.push(aras.getItemProperty(queryReference, 'ref_id'));
				}
				return arr;
			},
			[]);
			let key = 0;
			const roots = [];
			const rows = new Map();
			const usedElements = {};

			const createTreeStructure = function (queryReference, parentKey) {
				const refId = aras.getItemProperty(queryReference, 'ref_id');
				const childRefId = aras.getItemProperty(queryReference, 'child_ref_id');
				const queryItem = queryItems.find(function (queryItem) {
					return aras.getItemProperty(queryItem, 'ref_id') === childRefId;
				});
				const references = queryReferences.filter(function (queryReference) {
					return (
						aras.getItemProperty(queryReference, 'parent_ref_id') === childRefId
					);
				});
				const familyElementQueryItem = this._relationshipFamilyModel.relationshipFamilyItemNode.selectSingleNode(
					"Relationships/Item/Relationships/Item[parent_query_reference_ref_id = '" +
						refId +
						'\' and not(@action="delete")]'
				);
				const id =
					!!familyElementQueryItem &&
					aras.getItemProperty(
						familyElementQueryItem.parentNode.parentNode,
						'dr_relationship_id'
					);
				const itemTypeId = aras.getItemProperty(queryItem, 'item_type');
				let idPopulatedOnlyForMapped;

				if (id) {
					const drUIRelationshipFamilyNode = this._relationshipFamilyModel.relationshipFamilyItemNode.selectSingleNode(
						'Relationships/Item[@id="' + id + '"]'
					);
					if (
						aras.getItemProperty(
							drUIRelationshipFamilyNode,
							'destination_itemtype_id'
						) !== itemTypeId
					) {
						this._relationshipFamilyModel.unMap(refId);
					} else {
						idPopulatedOnlyForMapped = id;
					}
				}

				const row = {
					queryReferenceRefId: refId,
					alias: aras.getItemProperty(queryItem, 'alias'),
					itemTypeId: itemTypeId,
					isReferencingItem:
						referencingIds.indexOf(
							aras.getItemProperty(queryReference, 'ref_id')
						) !== -1,
					icon: this._queryDefinitionModel.getIcon(queryReference, queryItem),
					name: idPopulatedOnlyForMapped || ''
				};

				++key;
				const rowId = key.toString();
				rows.set(rowId, row);

				if (!parentKey) {
					roots.push(rowId);
				} else {
					const parentRow = rows.get(parentKey);

					parentRow.children = parentRow.children || [];
					parentRow.children.push(rowId);
				}

				parentKey = rowId;

				if (usedElements[childRefId]) {
					return;
				}

				usedElements[childRefId] = parentKey;
				references.forEach(function (queryReference) {
					createTreeStructure(queryReference, parentKey);
				});
			}.bind(this);

			rootQueryReferences.forEach(createTreeStructure);

			return {
				roots: roots,
				rows: rows
			};
		},
		_render: function (data) {
			const resourcePath = '../Modules/aras.innovator.DomainAccessControl/';
			const treeGrid = this._treeGrid;
			const head = new Map();

			head.set('alias', {
				label: aras.getResource(resourcePath, 'destination_path'),
				width: 335
			});
			head.set('name', {
				label: aras.getResource(resourcePath, 'derived_relationship'),
				width: 335
			});
			treeGrid.settings.expanded = new Set();
			treeGrid.head = head;
			treeGrid.rows = data.rows;
			treeGrid.roots = data.roots;
			treeGrid.settings.treeHeadView = 'alias';

			treeGrid.rows._store.forEach(function (row, key) {
				treeGrid.expand(key);
			});
			treeGrid.checkEditAvailability = function (headId, rowId) {
				return (
					headId === 'name' &&
					treeGrid.roots.indexOf(rowId) === -1 &&
					aras.isLocked(
						this._relationshipFamilyModel.relationshipFamilyItemNode
					)
				);
			}.bind(this);
			treeGrid.getCellType = function (headId, rowId) {
				if (headId === 'alias') {
					return 'getIcon';
				}
				if (~this.roots.indexOf(rowId)) {
					return 'hideCell';
				}
				return 'select';
			};
			treeGrid.getCellMetadata = function (headId, rowId) {
				const row = treeGrid.rows.get(rowId);

				return [].reduce.call(
					this._relationshipFamilyModel.relationshipFamilyItemNode.selectNodes(
						'Relationships/Item[@type="dr_UI_RelationshipFamily"]'
					),
					function (result, node) {
						if (
							row.itemTypeId ===
							aras.getItemProperty(node, 'destination_itemtype_id')
						) {
							result.options.push({
								label: aras.getItemProperty(node, 'name'),
								value: aras.getItemProperty(node, 'id')
							});
						}
						return result;
					},
					{
						options: []
					}
				);
			}.bind(this);
		}
	};
	externalParent.ViewModel = ViewModel;
})(window);
