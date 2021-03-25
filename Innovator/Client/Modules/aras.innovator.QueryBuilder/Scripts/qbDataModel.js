/* global define */
define(['dojo/_base/declare', 'QB/Scripts/qbTreeEnum'], function (
	declare,
	AdminEnum
) {
	var constants = new AdminEnum();
	return declare(null, {
		ItemTypeModel: (function () {
			function ItemTypeModel() {
				this._id = '';
				this._name = '';
				this._parentId = '';
				this._node = null;
				this._sortOrder = null;
				this._refId = '';
				this._properties = [];
			}

			Object.defineProperty(ItemTypeModel.prototype, 'name', {
				get: function () {
					return this._name;
				},
				set: function (name) {
					this._name = name;
				}
			});

			Object.defineProperty(ItemTypeModel.prototype, 'id', {
				get: function () {
					return this._id;
				},
				set: function (id) {
					this._id = id;
				}
			});

			Object.defineProperty(ItemTypeModel.prototype, 'parentId', {
				get: function () {
					return this._parentId;
				},
				set: function (parentId) {
					this._parentId = parentId;
				}
			});

			Object.defineProperty(ItemTypeModel.prototype, 'type', {
				get: function () {
					return constants.TreeModelType.ElementType;
				}
			});

			Object.defineProperty(ItemTypeModel.prototype, 'node', {
				get: function () {
					return this._node;
				},
				set: function (node) {
					this._node = node;
				}
			});

			Object.defineProperty(ItemTypeModel.prototype, 'sortOrder', {
				get: function () {
					return this._sortOrder;
				},
				set: function (sortOrder) {
					this._sortOrder = sortOrder;
				}
			});

			Object.defineProperty(ItemTypeModel.prototype, 'refId', {
				get: function () {
					return this._refId;
				},
				set: function (refId) {
					this._refId = refId;
				}
			});

			Object.defineProperty(ItemTypeModel.prototype, 'properties', {
				get: function () {
					return this._properties;
				},
				set: function (properties) {
					this._properties = properties;
				}
			});

			ItemTypeModel.prototype.updateName = function () {
				if (this._node) {
					var nameNode = this._node.getElementsByTagName('name');
					if (nameNode && nameNode.length > 0) {
						this._name = nameNode[0].text;
					}
				}
				return '';
			};

			return ItemTypeModel;
		})(),

		TreeElementModel: (function () {
			function TreeElementModel(element) {
				this._element = element ? element : null;
				this._name = '';
				this._parentId = '';
				this._warningObject = {};
			}

			Object.defineProperty(TreeElementModel.prototype, 'isReferencing', {
				get: function () {
					return this._isReferencing;
				},
				set: function (value) {
					this._isReferencing = value;
				}
			});

			Object.defineProperty(TreeElementModel.prototype, 'element', {
				get: function () {
					return this._element;
				},
				set: function (element) {
					this._element = element;
				}
			});

			Object.defineProperty(TreeElementModel.prototype, 'name', {
				get: function () {
					if (this._element) {
						return this._element.name;
					}
					return null;
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

			Object.defineProperty(TreeElementModel.prototype, 'itemTypeId', {
				get: function () {
					if (this._element) {
						return this._element.itemTypeId;
					}
					return null;
				}
			});

			Object.defineProperty(TreeElementModel.prototype, 'refId', {
				get: function () {
					if (this._element) {
						return this._element.refId;
					}
					return null;
				}
			});

			Object.defineProperty(TreeElementModel.prototype, 'properties', {
				get: function () {
					if (this._element) {
						return this._element.properties;
					}
					return null;
				}
			});

			Object.defineProperty(TreeElementModel.prototype, 'isRecursion', {
				get: function () {
					if (this._element) {
						return this.getType() === constants.TreeModelType.RecursionItem;
					}
					return false;
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
					return constants.TreeModelType.PropertyItem;
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

		RelationshipTypeModel: (function () {
			function RelationshipTypeModel() {
				this._id = '';
				this._name = '';
				this._typeId = '';
				this._sortOrder = 128;
				this._node = null;
			}

			Object.defineProperty(RelationshipTypeModel.prototype, 'name', {
				get: function () {
					return this._name;
				},
				set: function (name) {
					this._name = name;
				}
			});

			Object.defineProperty(RelationshipTypeModel.prototype, 'id', {
				get: function () {
					return this._id;
				},
				set: function (id) {
					this._id = id;
				}
			});

			Object.defineProperty(RelationshipTypeModel.prototype, 'sortOrder', {
				get: function () {
					return this._sortOrder;
				}
			});

			Object.defineProperty(RelationshipTypeModel.prototype, 'node', {
				get: function () {
					return this._node;
				},
				set: function (node) {
					this._node = node;
				}
			});

			Object.defineProperty(RelationshipTypeModel.prototype, 'type', {
				get: function () {
					return constants.TreeModelType.RelationshipItem;
				}
			});

			return RelationshipTypeModel;
		})(),

		WhereUsedTypeModel: (function () {
			function WhereUsedTypeModel() {
				this._id = '';
				this._name = '';
				this._typeId = '';
				this._sortOrder = 128;
				this._node = null;
			}

			Object.defineProperty(WhereUsedTypeModel.prototype, 'name', {
				get: function () {
					return this._name;
				},
				set: function (name) {
					this._name = name;
				}
			});

			Object.defineProperty(WhereUsedTypeModel.prototype, 'id', {
				get: function () {
					return this._id;
				},
				set: function (id) {
					this._id = id;
				}
			});

			Object.defineProperty(WhereUsedTypeModel.prototype, 'sortOrder', {
				get: function () {
					return this._sortOrder;
				}
			});

			Object.defineProperty(WhereUsedTypeModel.prototype, 'node', {
				get: function () {
					return this._node;
				},
				set: function (node) {
					this._node = node;
				}
			});

			Object.defineProperty(WhereUsedTypeModel.prototype, 'type', {
				get: function () {
					return constants.TreeModelType.WhereUsedItem;
				}
			});

			return WhereUsedTypeModel;
		})(),

		RelatedTypeModel: (function () {
			function RelatedTypeModel() {
				this._id = '';
				this._name = '';
				this._typeId = '';
				this._sortOrder = 128;
				this._node = null;
			}

			Object.defineProperty(RelatedTypeModel.prototype, 'name', {
				get: function () {
					return this._name;
				},
				set: function (name) {
					this._name = name;
				}
			});

			Object.defineProperty(RelatedTypeModel.prototype, 'id', {
				get: function () {
					return this._id;
				},
				set: function (id) {
					this._id = id;
				}
			});

			Object.defineProperty(RelatedTypeModel.prototype, 'sortOrder', {
				get: function () {
					return this._sortOrder;
				}
			});

			Object.defineProperty(RelatedTypeModel.prototype, 'node', {
				get: function () {
					return this._node;
				},
				set: function (node) {
					this._node = node;
				}
			});

			Object.defineProperty(RelatedTypeModel.prototype, 'type', {
				get: function () {
					return constants.TreeModelType.RelatedItem;
				}
			});

			return RelatedTypeModel;
		})(),

		RecursionTypeModel: (function () {
			function RecursionTypeModel() {
				this._id = '';
				this._name = '';
				this._typeId = '';
				this._sortOrder = 128;
				this._node = null;
			}

			Object.defineProperty(RecursionTypeModel.prototype, 'name', {
				get: function () {
					return this._name;
				},
				set: function (name) {
					this._name = name;
				}
			});

			Object.defineProperty(RecursionTypeModel.prototype, 'id', {
				get: function () {
					return this._id;
				},
				set: function (id) {
					this._id = id;
				}
			});

			Object.defineProperty(RecursionTypeModel.prototype, 'sortOrder', {
				get: function () {
					return this._sortOrder;
				}
			});

			Object.defineProperty(RecursionTypeModel.prototype, 'node', {
				get: function () {
					return this._node;
				},
				set: function (node) {
					this._node = node;
				}
			});

			Object.defineProperty(RecursionTypeModel.prototype, 'type', {
				get: function () {
					return constants.TreeModelType.RecursionItem;
				}
			});

			return RecursionTypeModel;
		})(),

		CustomJoinTypeModel: (function () {
			function CustomJoinTypeModel() {
				this._id = '';
				this._name = '';
				this._typeId = '';
				this._sortOrder = 128;
				this._node = null;
			}

			Object.defineProperty(CustomJoinTypeModel.prototype, 'name', {
				get: function () {
					return this._name;
				},
				set: function (name) {
					this._name = name;
				}
			});

			Object.defineProperty(CustomJoinTypeModel.prototype, 'id', {
				get: function () {
					return this._id;
				},
				set: function (id) {
					this._id = id;
				}
			});

			Object.defineProperty(CustomJoinTypeModel.prototype, 'sortOrder', {
				get: function () {
					return this._sortOrder;
				}
			});

			Object.defineProperty(CustomJoinTypeModel.prototype, 'node', {
				get: function () {
					return this._node;
				},
				set: function (node) {
					this._node = node;
				}
			});

			Object.defineProperty(CustomJoinTypeModel.prototype, 'type', {
				get: function () {
					return constants.TreeModelType.CustomJoinItem;
				}
			});

			return CustomJoinTypeModel;
		})()
	});
});
