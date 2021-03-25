/* global define, arasDocumentationHelper, CMF */
define(['dojo/_base/declare', './PropertyItem'], function (
	declare,
	PropertyItem
) {
	return declare('Aras.Modules.CMF.Public.Element', null, {
		constructor: function (treeItem, store) {
			/// <summary>
			/// It's like a node in the tree.
			/// </summary>
			var properties = {
				id: {
					get: function () {
						/// <summary>
						/// Id of the current Element.
						/// </summary>
						/// <returns>string</returns>
						/// <example>
						///  <code lang="javascript">
						///    var elementId = element.id;
						///  </code>
						/// </example>
						if (treeItem) {
							return treeItem.id;
						} else {
							return undefined;
						}
					}
				},
				parentId: {
					get: function () {
						/// <summary>
						/// Id of the parent Element.
						/// </summary>
						/// <returns>string</returns>
						/// <example>
						///  <code lang="javascript">
						///    var parentId = element.parentId;
						///  </code>
						/// </example>
						if (treeItem) {
							return treeItem.parentId;
						} else {
							return undefined;
						}
					}
				},
				boundItemId: {
					get: function () {
						/// <summary>
						/// Id of the bound Item.
						/// </summary>
						/// <returns>string</returns>
						/// <example>
						///  <code lang="javascript">
						///    var boundItemId = element.boundItemId;
						///  </code>
						/// </example>
						if (treeItem) {
							return treeItem.boundItemId;
						} else {
							return undefined;
						}
					}
				},
				type: {
					get: function () {
						/// <summary>
						/// Name of corresponding cmf_ElementType Item.
						/// </summary>
						/// <returns>string</returns>
						/// <example>
						///  <code lang="javascript">
						///    var elementType = element.type;
						///  </code>
						/// </example>
						if (treeItem) {
							var docElementType = store.getDocElementType(treeItem);
							return docElementType.name;
						} else {
							return undefined;
						}
					}
				},
				sortOrder: {
					get: function () {
						/// <summary>
						/// Sort Order.
						/// </summary>
						/// <returns>string</returns>
						/// <example>
						///  <code lang="javascript">
						///    var sortOrderOfElement = element.sortOrder;
						///  </code>
						/// </example>
						if (treeItem) {
							return treeItem.sortOrder;
						} else {
							return undefined;
						}
					}
				} //don't use "," after the last property all over the file, e.g, here because documentation will not be built
			};

			//this variable is used to build documentation in ExtractJSApiDocs.wsf file
			if (typeof arasDocumentationHelper !== 'undefined') {
				arasDocumentationHelper.registerProperties(properties);
				arasDocumentationHelper.registerEvents('');
				return;
			}

			Object.defineProperties(this, properties);

			this._findAncestorElement = function (type) {
				if (treeItem) {
					var parentItem = store.findAncestorDocumentElement(treeItem, type);
					return new Aras.Modules.CMF.Public.Element(parentItem, store);
				}
				return undefined;
			};

			this._findDescendantElements = function (elementType, showCandidate) {
				var res = [];
				if (treeItem) {
					var items = store.findDescendantDocumentElements(
						treeItem,
						elementType,
						showCandidate
					);
					for (var i = 0; i < items.length; i++) {
						res.push(new Aras.Modules.CMF.Public.Element(items[i], store));
					}
				}
				return res;
			};

			this._getPropertyItem = function (propertyItemType) {
				if (treeItem) {
					var propertyElements = store.getPropertyElements(treeItem);

					var tableItems = propertyElements.filter(function (element) {
						return (
							element.property && element.property.name === propertyItemType
						);
					});
					if (tableItems.length > 0) {
						return new PropertyItem(tableItems[0], this);
					}
				}
				return undefined;
			};

			this._getPropertyItems = function () {
				if (treeItem) {
					var tableItems = store.getPropertyElements(treeItem);
					var res = tableItems.map(function (tableItem) {
						return new PropertyItem(tableItem);
					});

					return res;
				}
				return undefined;
			};
		},

		findAncestorElement: function (elementType) {
			/// <summary>
			/// Find at any level, not only a Parent at the first level.
			/// </summary>
			/// <param name="elementType" type="string">see the "type" property.</param>
			/// <returns>Aras.Modules.CMF.Public.Element</returns>
			/// <example>
			///  <code lang="javascript">
			///    var foundElement = element.findAncestorElement('CMF Element Type Name');
			///  </code>
			/// </example>
			return this._findAncestorElement(elementType);
		},

		findDescendantElements: function (elementType, showCandidate) {
			/// <summary>
			/// Find at any level, not only children at the first level.
			/// </summary>
			/// <param name="elementType" type="string">see the "type" property.</param>
			/// <param name="showCandidate" type="boolean">show elements with candidates</param>
			/// <returns>array of Aras.Modules.CMF.Public.Element</returns>
			/// <example>
			///  <code lang="javascript">
			///    var foundElements = element.findDescendantElements('CMF Element Type Name');
			///  </code>
			/// </example>
			return this._findDescendantElements(elementType, showCandidate);
		},

		getPropertyItem: function (propertyItemType) {
			/// <summary>
			/// Get a Property Item of the current Element (both visible and invisible in Grid). A grid cell of the tree node.
			/// </summary>
			/// <param name="propertyItemType" type="string">see the "type" property of Aras.Modules.CMF.Public.PropertyItem.</param>
			/// <returns>Aras.Modules.CMF.Public.PropertyItem</returns>
			/// <example>
			///  <code lang="javascript">
			///    var property = element.getPropertyItem('CMF Property Type Name');
			///  </code>
			/// </example>
			return this._getPropertyItem(propertyItemType);
		},

		getPropertyItems: function () {
			/// <summary>
			/// Get all Property Items of the current Element (both visible and invisible in Grid). Grid cells of the tree node.
			/// </summary>
			/// <returns>array of Aras.Modules.CMF.Public.PropertyItem</returns>
			/// <example>
			///  <code lang="javascript">
			///    var elementProperties = element.getPropertyItems();
			///  </code>
			/// </example>
			return this._getPropertyItems();
		} //don't use "," after the last property all over the file, e.g, here because documentation will not be built
	});
});
