/* global define */
define(['dojo/_base/declare', 'CMF/Scripts/AdminPanel/AdminEnum'], function (
	declare,
	AdminEnum
) {
	var constants = new AdminEnum();

	return declare(null, {
		ElementTypeModel: (function () {
			function ElementTypeModel() {
				this._id = '';
				this._name = '';
				this._parentId = '';
				this._node = null;
				this._sortOrder = null;
				this._dataType = null;
				this._elementBinding = null;
			}

			Object.defineProperty(ElementTypeModel.prototype, 'name', {
				get: function () {
					return this._name;
				},
				set: function (name) {
					this._name = name;
				}
			});

			Object.defineProperty(ElementTypeModel.prototype, 'id', {
				get: function () {
					return this._id;
				},
				set: function (id) {
					this._id = id;
				}
			});

			Object.defineProperty(ElementTypeModel.prototype, 'parentId', {
				get: function () {
					return this._parentId;
				},
				set: function (parentId) {
					this._parentId = parentId;
				}
			});

			Object.defineProperty(ElementTypeModel.prototype, 'type', {
				get: function () {
					return constants.TreeModelType.ElementType;
				}
			});

			Object.defineProperty(ElementTypeModel.prototype, 'node', {
				get: function () {
					return this._node;
				},
				set: function (node) {
					this._node = node;
				}
			});

			Object.defineProperty(ElementTypeModel.prototype, 'sortOrder', {
				get: function () {
					return this._sortOrder;
				},
				set: function (sortOrder) {
					this._sortOrder = sortOrder;
				}
			});

			Object.defineProperty(ElementTypeModel.prototype, 'dataType', {
				get: function () {
					return this._dataType;
				},
				set: function (dataType) {
					this._dataType = dataType;
				}
			});

			Object.defineProperty(ElementTypeModel.prototype, 'elementBinding', {
				get: function () {
					return this._elementBinding;
				},
				set: function (elementBinding) {
					this._elementBinding = elementBinding;
				}
			});

			ElementTypeModel.prototype.updateName = function () {
				if (this._node) {
					var nameNode = this._node.getElementsByTagName('name');
					if (nameNode && nameNode.length > 0) {
						this._name = nameNode[0].text;
					}
				}
				return '';
			};

			return ElementTypeModel;
		})(),

		TreeElementModel: (function () {
			function TreeElementModel(element) {
				this._element = element ? element : null;
				this._name = '';
				this._parentId = '';
				this._warningObject = {};
			}

			Object.defineProperty(TreeElementModel.prototype, 'element', {
				get: function () {
					return this._element;
				},
				set: function (element) {
					this._element = element;
				}
			});

			Object.defineProperty(TreeElementModel.prototype, 'id', {
				get: function () {
					if (this._element) {
						return this._element.id;
					}
					return null;
				}
			});

			Object.defineProperty(TreeElementModel.prototype, 'parentId', {
				get: function () {
					return this._parentId;
				},
				set: function (parentId) {
					this._parentId = parentId;
				}
			});

			Object.defineProperty(TreeElementModel.prototype, 'node', {
				get: function () {
					if (this._element) {
						return this._element.node;
					}
					return null;
				}
			});

			Object.defineProperty(TreeElementModel.prototype, 'dataType', {
				get: function () {
					if (this._element) {
						return this._element.dataType;
					}
					return null;
				}
			});

			TreeElementModel.prototype.getTreeLabel = function () {
				if (this._element) {
					if (this._element.name) {
						return this._element.name;
					}
				}
				return '';
			};

			TreeElementModel.prototype.getType = function () {
				if (this._element) {
					if (this._element.type) {
						return this._element.type;
					}
				}
				return '';
			};

			TreeElementModel.prototype.getId = function () {
				if (this._element) {
					return this._element.id;
				}
				return '';
			};

			TreeElementModel.prototype.updateName = function () {
				if (this._element && this._element.updateName) {
					this._element.updateName();
				}
			};

			TreeElementModel.prototype.addWarning = function (type, object) {
				this._warningObject[type] = object;
			};

			TreeElementModel.prototype.removeWarning = function (type) {
				delete this._warningObject[type];
			};

			TreeElementModel.prototype.getWarning = function () {
				if (this._warningObject.innerWarning) {
					return this._warningObject.innerWarning;
				}

				if (this._warningObject.lockValidation) {
					return this._warningObject.lockValidation;
				}

				if (this._warningObject.clientValidation) {
					var message = this._warningObject.clientValidation;
					if (this._warningObject.emptyLink) {
						message += this._warningObject.emptyLink;
					}
					return message;
				}

				if (this._warningObject.emptyLink) {
					return this._warningObject.emptyLink;
				}
				return null;
			};

			return TreeElementModel;
		})(),

		PropertyTypeModel: (function () {
			function PropertyTypeModel() {
				this._id = '';
				this._name = '';
				this._parentId = '';
				this._typeId = '';
				this._sortOrder = '';
				this._elementTypeId = '';
				this._dataType = '';
				this._node = null;
			}

			Object.defineProperty(PropertyTypeModel.prototype, 'name', {
				get: function () {
					return this._name;
				},
				set: function (name) {
					this._name = name;
				}
			});

			Object.defineProperty(PropertyTypeModel.prototype, 'id', {
				get: function () {
					return this._id;
				},
				set: function (id) {
					this._id = id;
				}
			});

			Object.defineProperty(PropertyTypeModel.prototype, 'parentId', {
				get: function () {
					return this._parentId;
				},
				set: function (parentId) {
					this._parentId = parentId;
				}
			});

			Object.defineProperty(PropertyTypeModel.prototype, 'sortOrder', {
				get: function () {
					return this._sortOrder;
				},
				set: function (sortOrder) {
					this._sortOrder = sortOrder;
				}
			});

			Object.defineProperty(PropertyTypeModel.prototype, 'elementTypeId', {
				get: function () {
					return this._elementTypeId;
				},
				set: function (elementTypeId) {
					this._elementTypeId = elementTypeId;
				}
			});

			Object.defineProperty(PropertyTypeModel.prototype, 'type', {
				get: function () {
					return constants.TreeModelType.PropertyType;
				}
			});

			Object.defineProperty(PropertyTypeModel.prototype, 'node', {
				get: function () {
					return this._node;
				},
				set: function (node) {
					this._node = node;
				}
			});

			Object.defineProperty(PropertyTypeModel.prototype, 'dataType', {
				get: function () {
					return this._dataType;
				},
				set: function (dataType) {
					this._dataType = dataType;
				}
			});

			PropertyTypeModel.prototype.updateName = function () {
				if (this._node) {
					var nameNode = this._node.getElementsByTagName('name');
					if (nameNode && nameNode.length > 0) {
						this._name = nameNode[0].text;
					}
				}
			};

			return PropertyTypeModel;
		})(),

		ElementBindingModel: (function () {
			function ElementBindingModel() {
				this._id = '';
				this._name = '';
				this._typeId = '';
				this._sortOrder = 128;
				this._node = null;
				this._dataType = null;
			}

			Object.defineProperty(ElementBindingModel.prototype, 'name', {
				get: function () {
					return this._name;
				},
				set: function (name) {
					this._name = name;
				}
			});

			Object.defineProperty(ElementBindingModel.prototype, 'id', {
				get: function () {
					return this._id;
				},
				set: function (id) {
					this._id = id;
				}
			});

			Object.defineProperty(ElementBindingModel.prototype, 'sortOrder', {
				get: function () {
					return this._sortOrder;
				}
			});

			Object.defineProperty(ElementBindingModel.prototype, 'node', {
				get: function () {
					return this._node;
				},
				set: function (node) {
					this._node = node;
				}
			});

			Object.defineProperty(ElementBindingModel.prototype, 'type', {
				get: function () {
					return constants.TreeModelType.ElementBindingType;
				}
			});

			Object.defineProperty(ElementBindingModel.prototype, 'dataType', {
				get: function () {
					return this._dataType;
				},
				set: function (dataType) {
					this._dataType = dataType;
				}
			});

			return ElementBindingModel;
		})(),

		BaseViewModel: (function () {
			function BaseViewModel() {
				this._id = '';
				this._name = '';
				this._typeId = '';
				this._sortOrder = 128;
				this._node = null;
				this._dataType = null;
			}

			Object.defineProperty(BaseViewModel.prototype, 'name', {
				get: function () {
					return this._name;
				},
				set: function (name) {
					this._name = name;
				}
			});

			Object.defineProperty(BaseViewModel.prototype, 'id', {
				get: function () {
					return this._id;
				},
				set: function (id) {
					this._id = id;
				}
			});

			Object.defineProperty(BaseViewModel.prototype, 'sortOrder', {
				get: function () {
					return this._sortOrder;
				},
				set: function (sortOrder) {
					this._sortOrder = sortOrder;
				}
			});

			Object.defineProperty(BaseViewModel.prototype, 'node', {
				get: function () {
					return this._node;
				},
				set: function (node) {
					this._node = node;
				}
			});

			Object.defineProperty(BaseViewModel.prototype, 'type', {
				get: function () {
					return constants.TreeModelType.BaseView;
				}
			});

			Object.defineProperty(BaseViewModel.prototype, 'dataType', {
				get: function () {
					return this._dataType;
				},
				set: function (dataType) {
					this._dataType = dataType;
				}
			});

			BaseViewModel.prototype.updateName = function () {
				if (this._node) {
					var nameNode = this._node.getElementsByTagName('name');
					if (nameNode && nameNode.length > 0) {
						this._name = nameNode[0].text;
					}
				}
			};

			return BaseViewModel;
		})(),

		TabularViewColumn: (function () {
			function TabularViewColumn() {
				this._id = '';
				this._name = '';
				this._typeId = '';
				this._sortOrder = 128;
				this._node = null;
				this._dataType = null;
				this._baseViewId = null;
			}

			Object.defineProperty(TabularViewColumn.prototype, 'name', {
				get: function () {
					return this._name;
				},
				set: function (name) {
					this._name = name;
				}
			});

			Object.defineProperty(TabularViewColumn.prototype, 'id', {
				get: function () {
					return this._id;
				},
				set: function (id) {
					this._id = id;
				}
			});

			Object.defineProperty(TabularViewColumn.prototype, 'sortOrder', {
				get: function () {
					return this._sortOrder;
				},
				set: function (sortOrder) {
					this._sortOrder = sortOrder;
				}
			});

			Object.defineProperty(TabularViewColumn.prototype, 'baseViewId', {
				get: function () {
					return this._baseViewId;
				},
				set: function (baseViewId) {
					this._baseViewId = baseViewId;
				}
			});

			Object.defineProperty(TabularViewColumn.prototype, 'node', {
				get: function () {
					return this._node;
				},
				set: function (node) {
					this._node = node;
				}
			});

			Object.defineProperty(TabularViewColumn.prototype, 'type', {
				get: function () {
					return constants.TreeModelType.TabularViewColumn;
				}
			});

			Object.defineProperty(TabularViewColumn.prototype, 'dataType', {
				get: function () {
					return this._dataType;
				},
				set: function (dataType) {
					this._dataType = dataType;
				}
			});

			return TabularViewColumn;
		})(),

		TabularViewTree: (function () {
			function TabularViewTree() {
				this._id = '';
				this._name = '';
				this._typeId = '';
				this._sortOrder = 128;
				this._node = null;
				this._dataType = null;
				this._baseViewId = null;
			}

			Object.defineProperty(TabularViewTree.prototype, 'name', {
				get: function () {
					return this._name;
				},
				set: function (name) {
					this._name = name;
				}
			});

			Object.defineProperty(TabularViewTree.prototype, 'id', {
				get: function () {
					return this._id;
				},
				set: function (id) {
					this._id = id;
				}
			});

			Object.defineProperty(TabularViewTree.prototype, 'baseViewId', {
				get: function () {
					return this._baseViewId;
				},
				set: function (baseViewId) {
					this._baseViewId = baseViewId;
				}
			});

			Object.defineProperty(TabularViewTree.prototype, 'sortOrder', {
				get: function () {
					return this._sortOrder;
				},
				set: function (sortOrder) {
					this._sortOrder = sortOrder;
				}
			});

			Object.defineProperty(TabularViewTree.prototype, 'node', {
				get: function () {
					return this._node;
				},
				set: function (node) {
					this._node = node;
				}
			});

			Object.defineProperty(TabularViewTree.prototype, 'type', {
				get: function () {
					return constants.TreeModelType.TabularViewTree;
				}
			});

			Object.defineProperty(TabularViewTree.prototype, 'dataType', {
				get: function () {
					return this._dataType;
				},
				set: function (dataType) {
					this._dataType = dataType;
				}
			});

			return TabularViewTree;
		})(),

		TabularViewHeaderRows: (function () {
			function TabularViewHeaderRows() {
				this._id = '';
				this._name = '';
				this._typeId = '';
				this._sortOrder = 128;
				this._node = null;
				this._dataType = null;
				this._baseViewId = null;
			}

			Object.defineProperty(TabularViewHeaderRows.prototype, 'name', {
				get: function () {
					return this._name;
				},
				set: function (name) {
					this._name = name;
				}
			});

			Object.defineProperty(TabularViewHeaderRows.prototype, 'id', {
				get: function () {
					return this._id;
				},
				set: function (id) {
					this._id = id;
				}
			});

			Object.defineProperty(TabularViewHeaderRows.prototype, 'baseViewId', {
				get: function () {
					return this._baseViewId;
				},
				set: function (baseViewId) {
					this._baseViewId = baseViewId;
				}
			});

			Object.defineProperty(TabularViewHeaderRows.prototype, 'sortOrder', {
				get: function () {
					return this._sortOrder;
				},
				set: function (sortOrder) {
					this._sortOrder = sortOrder;
				}
			});

			Object.defineProperty(TabularViewHeaderRows.prototype, 'node', {
				get: function () {
					return this._node;
				},
				set: function (node) {
					this._node = node;
				}
			});

			Object.defineProperty(TabularViewHeaderRows.prototype, 'type', {
				get: function () {
					return constants.TreeModelType.TabularViewHeaderRows;
				}
			});

			Object.defineProperty(TabularViewHeaderRows.prototype, 'dataType', {
				get: function () {
					return this._dataType;
				},
				set: function (dataType) {
					this._dataType = dataType;
				}
			});

			return TabularViewHeaderRows;
		})(),

		ExportSettings: (function () {
			function ExportSettings() {
				this._id = '';
				this._name = '';
				this._typeId = '';
				this._sortOrder = 128;
				this._node = null;
				this._dataType = null;
			}

			Object.defineProperty(ExportSettings.prototype, 'name', {
				get: function () {
					return this._name;
				},
				set: function (name) {
					this._name = name;
				}
			});

			Object.defineProperty(ExportSettings.prototype, 'id', {
				get: function () {
					return this._id;
				},
				set: function (id) {
					this._id = id;
				}
			});

			Object.defineProperty(ExportSettings.prototype, 'sortOrder', {
				get: function () {
					return this._sortOrder;
				},
				set: function (sortOrder) {
					this._sortOrder = sortOrder;
				}
			});

			Object.defineProperty(ExportSettings.prototype, 'node', {
				get: function () {
					return this._node;
				},
				set: function (node) {
					this._node = node;
				}
			});

			Object.defineProperty(ExportSettings.prototype, 'type', {
				get: function () {
					return constants.TreeModelType.ExportToExcelElement;
				}
			});

			Object.defineProperty(ExportSettings.prototype, 'dataType', {
				get: function () {
					return this._dataType;
				},
				set: function (dataType) {
					this._dataType = dataType;
				}
			});

			return ExportSettings;
		})()
	});
});
