/* global define, CMF */
define(['dojo/_base/declare'], function (declare) {
	return declare('CMF.DataModel', null, {
		constructor: function () {},

		TreeItemModel: (function () {
			function TreeItemModel() {
				this._title = '';
				this._id = '';
				this._parentId = '';
				this._rootItemId = '';
				this._maxNodesOneType = 0;
				this._documentElementType = null;
				this._visible = null;
				this._childrenIds = [];
				this._tableItemIds = [];
				this._sortOrder = null;
				this._isRemoved = false;
				this._relatedId = null;
				this._parentRelId = null;
				this._boundItemId = null;
				this._boundItemConfigId = null;
				this._trackingMode = null;
				this._resolutionMode = null;
			}
			Object.defineProperty(TreeItemModel.prototype, 'title', {
				get: function () {
					return this._title;
				},
				set: function (title) {
					this._title = title;
				}
			});

			Object.defineProperty(TreeItemModel.prototype, 'tableItemIds', {
				get: function () {
					return this._tableItemIds;
				},
				set: function (tableItemIds) {
					this._tableItemIds = tableItemIds;
				},
				enumerable: true,
				configurable: true
			});

			TreeItemModel.prototype.isVisible = function () {
				if (this._documentElementType) {
					return this._documentElementType.visible;
				}
				return false;
			};

			TreeItemModel.prototype.getIconPath = function () {
				if (this.id === 'root') {
					return aras.getItemProperty(window.parent.itemType, 'large_icon');
				} else {
					return this._documentElementType
						? this._documentElementType.iconPath
						: null;
				}
			};

			Object.defineProperty(TreeItemModel.prototype, 'childrenIds', {
				get: function () {
					return this._childrenIds;
				},
				set: function (childrenIds) {
					this._childrenIds = childrenIds;
				}
			});

			Object.defineProperty(TreeItemModel.prototype, 'id', {
				get: function () {
					return this._id;
				},
				set: function (id) {
					this._id = id;
				},
				enumerable: true,
				configurable: true
			});

			Object.defineProperty(TreeItemModel.prototype, 'visible', {
				get: function () {
					return this._visible;
				},
				set: function (visible) {
					this._visible = visible;
				}
			});

			Object.defineProperty(TreeItemModel.prototype, 'isRemoved', {
				get: function () {
					return this._isRemoved;
				},
				set: function (isRemoved) {
					this._isRemoved = isRemoved;
				}
			});

			Object.defineProperty(TreeItemModel.prototype, 'isRootOfTree', {
				get: function () {
					return this._id === 'root';
				}
			});

			Object.defineProperty(TreeItemModel.prototype, 'isRootItem', {
				get: function () {
					return this._parentId === 'root';
				}
			});

			Object.defineProperty(TreeItemModel.prototype, 'documentElementType', {
				get: function () {
					return this._documentElementType;
				},
				set: function (documentElementType) {
					this._documentElementType = documentElementType;
				}
			});

			Object.defineProperty(TreeItemModel.prototype, 'documentElementTypeId', {
				get: function () {
					return this._documentElementTypeId;
				},
				set: function (documentElementTypeId) {
					this._documentElementTypeId = documentElementTypeId;
				}
			});

			Object.defineProperty(TreeItemModel.prototype, 'parentId', {
				get: function () {
					return this._parentId;
				},
				set: function (parentId) {
					this._parentId = parentId;
				},
				enumerable: true,
				configurable: true
			});

			Object.defineProperty(TreeItemModel.prototype, 'rootItemId', {
				get: function () {
					return this._rootItemId;
				},
				set: function (rootItemId) {
					this._rootItemId = rootItemId;
				},
				enumerable: true,
				configurable: true
			});

			Object.defineProperty(TreeItemModel.prototype, 'maxNodesOneType', {
				get: function () {
					return this._maxNodesOneType;
				},
				set: function (maxNodesOneType) {
					this._maxNodesOneType = maxNodesOneType;
				},
				enumerable: true,
				configurable: true
			});

			Object.defineProperty(TreeItemModel.prototype, 'relatedId', {
				get: function () {
					return this._relatedId;
				},
				set: function (relatedId) {
					this._relatedId = relatedId;
				}
			});

			Object.defineProperty(TreeItemModel.prototype, 'parentRelId', {
				get: function () {
					return this._parentRelId;
				},
				set: function (parentRelId) {
					this._parentRelId = parentRelId;
				}
			});

			Object.defineProperty(TreeItemModel.prototype, 'boundItemId', {
				get: function () {
					return this._boundItemId;
				},
				set: function (value) {
					this._boundItemId = value;
				}
			});

			Object.defineProperty(TreeItemModel.prototype, 'boundItemConfigId', {
				get: function () {
					return this._boundItemConfigId;
				},
				set: function (value) {
					this._boundItemConfigId = value;
				}
			});

			Object.defineProperty(TreeItemModel.prototype, 'trackingMode', {
				get: function () {
					return this._trackingMode;
				},
				set: function (value) {
					this._trackingMode = value;
				}
			});

			Object.defineProperty(TreeItemModel.prototype, 'resolutionMode', {
				get: function () {
					return this._resolutionMode;
				},
				set: function (value) {
					this._resolutionMode = value;
				}
			});

			Object.defineProperty(TreeItemModel.prototype, 'boundItem', {
				get: function () {
					return this._boundItem;
				},
				set: function (value) {
					this._boundItem = value;
				}
			});

			Object.defineProperty(TreeItemModel.prototype, 'sortOrder', {
				get: function () {
					return this._sortOrder;
				},
				set: function (sortOrder) {
					this._sortOrder = sortOrder;
				}
			});

			return TreeItemModel;
		})(),

		///////////////////////////////////////////////////
		///////         TableItemModel         ////////////
		///////////////////////////////////////////////////
		TableItemModel: (function () {
			function TableItemModel(propertyId, tableItemId) {
				this.propertyId = propertyId;
				this.id = tableItemId;
			}
			Object.defineProperty(TableItemModel.prototype, 'propertyId', {
				get: function () {
					return this._propertyId;
				},
				set: function (propertyId) {
					this._propertyId = propertyId;
				},
				enumerable: true,
				configurable: true
			});
			Object.defineProperty(TableItemModel.prototype, 'propertyName', {
				get: function () {
					return this._propertyName;
				},
				set: function (propertyName) {
					this._propertyName = propertyName;
				}
			});
			Object.defineProperty(TableItemModel.prototype, 'tableItemId', {
				get: function () {
					return this.id;
				},
				set: function (tableItemId) {
					this.id = tableItemId;
				},
				enumerable: true,
				configurable: true
			});
			Object.defineProperty(TableItemModel.prototype, 'value', {
				get: function () {
					return this._value;
				},
				set: function (value) {
					this._value = value;
				},
				enumerable: true,
				configurable: true
			});
			Object.defineProperty(TableItemModel.prototype, 'treeItemId', {
				get: function () {
					return this._treeItemId;
				},
				set: function (treeItemId) {
					this._treeItemId = treeItemId;
				},
				enumerable: true,
				configurable: true
			});
			Object.defineProperty(TableItemModel.prototype, 'treeItem', {
				get: function () {
					return this._treeItem;
				},
				set: function (treeItem) {
					this._treeItem = treeItem;
				}
			});

			Object.defineProperty(TableItemModel.prototype, 'property', {
				get: function () {
					return this._property;
				},
				set: function (property) {
					this._property = property;
				}
			});

			Object.defineProperty(TableItemModel.prototype, 'bindingType', {
				get: function () {
					return this._bindingType;
				},
				set: function (bindingType) {
					this._bindingType = bindingType;
				}
			});
			// need to delete
			Object.defineProperty(TableItemModel.prototype, 'rowSpan', {
				get: function () {
					return this._rowSpan;
				},
				set: function (rowSpan) {
					this._rowSpan = rowSpan;
				},
				enumerable: true,
				configurable: true
			});

			Object.defineProperty(TableItemModel.prototype, 'isEmpty', {
				get: function () {
					return this._isEmpty;
				},
				set: function (isEmpty) {
					this._isEmpty = isEmpty;
				}
			});

			Object.defineProperty(TableItemModel.prototype, 'elementReferenceId', {
				get: function () {
					return this._elementReferenceId;
				},
				set: function (elementReferenceId) {
					this._elementReferenceId = elementReferenceId;
				}
			});

			Object.defineProperty(TableItemModel.prototype, 'visible', {
				get: function () {
					if (this._property) {
						return this._property.display;
					} else {
						return false;
					}
				}
			});

			Object.defineProperty(TableItemModel.prototype, 'hasComputedMethods', {
				get: function () {
					if (this._property) {
						return this._property.computedMethods.length > 0;
					} else {
						return false;
					}
				}
			});

			TableItemModel.prototype.getComputedMethods = function () {
				if (this._property && this._property.computedMethods.length > 0) {
					return this._property.computedMethods;
				}
				return [];
			};

			Object.defineProperty(TableItemModel.prototype, 'propertyTypeId', {
				get: function () {
					return this._propertyTypeId;
				},
				set: function (value) {
					this._propertyTypeId = value;
				}
			});

			Object.defineProperty(TableItemModel.prototype, 'isReferenced', {
				get: function () {
					return this._isReferenced;
				},
				set: function (value) {
					this._isReferenced = value;
				}
			});
			Object.defineProperty(TableItemModel.prototype, 'cmfStyle', {
				get: function () {
					return this._cmfStyle;
				},
				set: function (value) {
					this._cmfStyle = value;
					this._cmfStyleString = CMF.Utils.getStyleString(this._cmfStyle);
				}
			});
			Object.defineProperty(TableItemModel.prototype, 'cmfStyleString', {
				get: function () {
					return this._cmfStyleString;
				}
			});

			Object.defineProperty(TableItemModel.prototype, 'isStaleReference', {
				get: function () {
					return this._isStaleReference;
				},
				set: function (value) {
					this._isStaleReference = value;
				}
			});

			Object.defineProperty(TableItemModel.prototype, 'isMissedReference', {
				get: function () {
					return this._isMissedReference;
				},
				set: function (value) {
					this._isMissedReference = value;
				}
			});

			Object.defineProperty(TableItemModel.prototype, 'readOnly', {
				get: function () {
					var bindingType = undefined; // jshint ignore:line
					if (!this.bindingType) {
						if (this._property) {
							bindingType = this._property.bindingType;
						}
					} else {
						bindingType = this.bindingType;
					}

					var boundItemId = this._treeItem.boundItemId;
					return (
						bindingType &&
						boundItemId &&
						(bindingType.readOnly || this._discoverOnly === '1')
					);
				}
			});

			Object.defineProperty(TableItemModel.prototype, 'permissionId', {
				get: function () {
					return this._permissionId;
				},
				set: function (permissionId) {
					this._permissionId = permissionId;
				}
			});

			Object.defineProperty(TableItemModel.prototype, 'discoverOnly', {
				get: function () {
					return this._discoverOnly;
				},
				set: function (discoverOnly) {
					this._discoverOnly = discoverOnly;
				}
			});

			Object.defineProperty(TableItemModel.prototype, 'substitutionValue', {
				get: function () {
					return this._substitutionValue;
				},
				set: function (substitutionValue) {
					this._substitutionValue = substitutionValue;
				}
			});

			TableItemModel.prototype.hasPrivatePermission = function () {
				return this.permissionId && this.permissionId !== this.defaultPermission
					? true
					: false;
			};

			TableItemModel.prototype.getCopy = function () {
				var copyObject = new TableItemModel();
				copyObject.propertyId = this.propertyId;
				copyObject.propertyName = this.propertyName;
				copyObject.tableItemId = this.tableItemId;
				copyObject.value = this.value;
				copyObject.treeItemId = this.treeItemId;
				copyObject.treeItem = this.treeItem;
				copyObject.property = this.property;
				copyObject.bindingType = this.bindingType;
				copyObject.rowSpan = this.rowSpan;
				copyObject.isEmpty = this.isEmpty;
				copyObject.elementReferenceId = this.elementReferenceId;
				copyObject.propertyTypeId = this.propertyTypeId;
				copyObject.isReferenced = this.isReferenced;
				copyObject.cmfStyle = this.cmfStyle;
				copyObject.isStaleReference = this.isStaleReference;
				copyObject.permissionId = this.permissionId;
				copyObject.discoverOnly = this.discoverOnly;
				copyObject.substitutionValue = this.substitutionValue;
				return copyObject;
			};

			return TableItemModel;
		})(),

		///////////////////////////////////////
		////////      DocElement      /////////
		///////////////////////////////////////
		DocElementType: (function () {
			function DocElementType() {
				this._id = '';
				this._name = '';
				this._children = [];
				this._propertyIds = [];
				this._groupPropertyIds = [];
			}
			Object.defineProperty(DocElementType.prototype, 'id', {
				get: function () {
					return this._id;
				},
				set: function (id) {
					this._id = id;
				},
				enumerable: true,
				configurable: true
			});
			Object.defineProperty(DocElementType.prototype, 'name', {
				get: function () {
					return this._name;
				},
				set: function (name) {
					this._name = name;
				},
				enumerable: true,
				configurable: true
			});
			DocElementType.prototype.addChild = function (model) {
				this._children.push(model);
			};
			Object.defineProperty(DocElementType.prototype, 'children', {
				get: function () {
					return this._children;
				},
				enumerable: true,
				configurable: true
			});

			DocElementType.prototype.hasVisibleChildren = function () {
				return (
					this._children.filter(function (element) {
						return element.visible;
					}).length > 0
				);
			};

			DocElementType.prototype.getVisibleChildren = function () {
				return this._children.filter(function (element) {
					return element.visible;
				});
			};

			Object.defineProperty(DocElementType.prototype, 'propertyIds', {
				get: function () {
					return this._propertyIds;
				},
				set: function (propertyIds) {
					this._propertyIds = propertyIds;
				}
			});

			Object.defineProperty(DocElementType.prototype, 'icon', {
				get: function () {
					return this._icon;
				},
				set: function (icon) {
					this._icon = icon;
				}
			});

			Object.defineProperty(DocElementType.prototype, 'sortOrder', {
				get: function () {
					return this._sortOrder;
				},
				set: function (sortOrder) {
					this._sortOrder = sortOrder;
				}
			});

			Object.defineProperty(DocElementType.prototype, 'groupPropertyIds', {
				get: function () {
					return this._groupPropertyIds;
				},
				set: function (propertyIds) {
					this._groupPropertyIds = propertyIds;
				}
			});

			return DocElementType;
		})(),

		///////////////////////////////////////
		////////      DocElement      /////////
		///////////////////////////////////////
		GroupDocElementType: (function () {
			function GroupDocElementType() {
				this._id = '';
				this._name = '';
				this._children = [];
				this._propertyIds = [];
			}

			Object.defineProperty(GroupDocElementType.prototype, 'id', {
				get: function () {
					return this._id;
				},
				set: function (id) {
					this._id = id;
				}
			});

			Object.defineProperty(GroupDocElementType.prototype, 'children', {
				get: function () {
					return this._children;
				},
				set: function (children) {
					this._children = children;
				}
			});

			Object.defineProperty(GroupDocElementType.prototype, 'propertyIds', {
				get: function () {
					return this._propertyIds;
				},
				set: function (propertyIds) {
					this._propertyIds = propertyIds;
				}
			});

			Object.defineProperty(GroupDocElementType.prototype, 'sortOrder', {
				get: function () {
					return this._sortOrder;
				},
				set: function (sortOrder) {
					this._sortOrder = sortOrder;
				}
			});

			return GroupDocElementType;
		})(),

		AllowedPermission: (function () {
			function AllowedPermission() {
				this._id = '';
				this._name = '';
			}

			Object.defineProperty(AllowedPermission.prototype, 'id', {
				get: function () {
					return this._id;
				},
				set: function (id) {
					this._id = id;
				}
			});

			Object.defineProperty(AllowedPermission.prototype, 'name', {
				get: function () {
					return this._name;
				},
				set: function (name) {
					this._name = name;
				}
			});

			Object.defineProperty(AllowedPermission.prototype, 'related_id', {
				get: function () {
					return this._relatedId;
				},
				set: function (id) {
					this._relatedId = id;
				}
			});

			return AllowedPermission;
		})(),

		ColumnGroupElement: (function () {
			function ColumnGroupElement() {
				this._id = '';
				this._name = '';
				this._properties = [];
			}
			Object.defineProperty(ColumnGroupElement.prototype, 'id', {
				get: function () {
					return this._id;
				},
				set: function (id) {
					this._id = id;
				},
				enumerable: true,
				configurable: true
			});
			Object.defineProperty(ColumnGroupElement.prototype, 'name', {
				get: function () {
					return this._name;
				},
				set: function (name) {
					this._name = name;
				},
				enumerable: true,
				configurable: true
			});
			ColumnGroupElement.prototype.addProperty = function (model) {
				this._properties.push(model);
			};

			Object.defineProperty(ColumnGroupElement.prototype, 'properties', {
				get: function () {
					return this._properties;
				},
				enumerable: true,
				configurable: true
			});

			Object.defineProperty(ColumnGroupElement.prototype, 'columnIds', {
				get: function () {
					return this._columnIds;
				},
				set: function (columnIds) {
					this._columnIds = columnIds;
				}
			});

			Object.defineProperty(ColumnGroupElement.prototype, 'columnGroupStyle', {
				get: function () {
					return this._columnGroupStyle;
				},
				set: function (value) {
					this._columnGroupStyle = value;
				}
			});

			Object.defineProperty(ColumnGroupElement.prototype, 'level', {
				get: function () {
					return this._level;
				},
				set: function (level) {
					this._level = level;
				}
			});

			return ColumnGroupElement;
		})(),

		DocElementProperty: (function () {
			//TODO: it seems that the Model isn't full, e.g., see in createHeaders of Grid.js, editorHeader1 exists.
			function DocElementProperty() {
				this._id = '';
				this._name = '';
				this._documentElementId = '';
				this._iconPath = '';
				this._allowedPermission = [];
			}
			Object.defineProperty(DocElementProperty.prototype, 'id', {
				get: function () {
					return this._id;
				},
				set: function (id) {
					this._id = id;
				},
				enumerable: true,
				configurable: true
			});
			Object.defineProperty(DocElementProperty.prototype, 'name', {
				get: function () {
					return this._name;
				},
				set: function (name) {
					this._name = name;
				},
				enumerable: true,
				configurable: true
			});
			Object.defineProperty(DocElementProperty.prototype, 'documentElementId', {
				get: function () {
					return this._documentElementId;
				},
				set: function (documentElementId) {
					this._documentElementId = documentElementId;
				},
				enumerable: true,
				configurable: true
			});
			Object.defineProperty(DocElementProperty.prototype, 'headerStyle', {
				get: function () {
					return this._headerStyle;
				},
				set: function (value) {
					this._headerStyle = value;
				},
				enumerable: true,
				configurable: true
			});
			Object.defineProperty(DocElementProperty.prototype, 'contentStyle', {
				get: function () {
					return this._contentStyle;
				},
				set: function (value) {
					this._contentStyle = value;
				},
				enumerable: true,
				configurable: true
			});
			Object.defineProperty(DocElementProperty.prototype, 'initialWidth', {
				get: function () {
					return this._initialWidth || 110;
				},
				set: function (value) {
					this._initialWidth = value;
				}
			});
			Object.defineProperty(DocElementProperty.prototype, 'iconPath', {
				get: function () {
					return this._iconPath;
				},
				set: function (iconPath) {
					this._iconPath = iconPath;
				}
			});

			Object.defineProperty(DocElementProperty.prototype, 'allowedPermission', {
				get: function () {
					return this._allowedPermission;
				},
				set: function (allowedPermission) {
					this._allowedPermission = allowedPermission;
				}
			});

			return DocElementProperty;
		})()
	});
});
