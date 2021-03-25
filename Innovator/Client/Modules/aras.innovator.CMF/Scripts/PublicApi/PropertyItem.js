define(['dojo/_base/declare'], function (declare) {
	return declare('Aras.Modules.CMF.Public.PropertyItem', null, {
		constructor: function (tableItem, elementItem) {
			/// <summary>
			/// It's like a cell in the grid.
			/// </summary>
			var properties = {
				value: {
					get: function () {
						/// <summary>
						///	Value of the cell. Note that it has type of "string" even for integer and date. Dates in Neutral format.
						/// </summary>
						/// <returns>string</returns>
						/// <example>
						///  <code lang="javascript">
						///    var propertyValue = property.value;
						///  </code>
						/// </example>
						if (tableItem) {
							return tableItem.value;
						} else {
							return undefined;
						}
					}
				},
				id: {
					get: function () {
						/// <summary>
						/// Id of the current Property Item.
						/// </summary>
						/// <returns>string</returns>
						/// <example>
						///  <code lang="javascript">
						///    var propertyId = property.id;
						///  </code>
						/// </example>
						if (tableItem) {
							return tableItem.tableItemId;
						} else {
							return undefined;
						}
					}
				},
				type: {
					get: function () {
						/// <summary>
						/// Name of corresponding cmf_Property Item.
						/// </summary>
						/// <returns>string</returns>
						/// <example>
						///  <code lang="javascript">
						///    var propertyTypeName = property.type;
						///  </code>
						/// </example>
						if (tableItem && tableItem.property) {
							return tableItem.property.name;
						} else {
							return undefined;
						}
					}
				},
				cmfStyle: {
					get: function () {
						/// <summary>
						/// Style of the cell. Note that content style of column will not be available here.
						/// </summary>
						/// <returns>Aras.Modules.CMF.Public.CmfStyle</returns>
						/// <example>
						///  <code lang="javascript">
						///    var cmfStyleOfProperty = property.cmfStyle;
						///  </code>
						/// </example>
						if (tableItem) {
							return tableItem.cmfStyle;
						} else {
							return '';
						}
					}
				},
				isProtected: {
					get: function () {
						/// <summary>
						/// Return true if Property Item is protected for current User (no permissions to see a value of the cell)
						/// </summary>
						/// <returns>bool</returns>
						/// <example>
						///  <code lang="javascript">
						///    var isProtected = property.isProtected;
						///  </code>
						/// </example>
						return !!(tableItem && tableItem.discoverOnly === '1');
					}
				},
				isVisibleInGrid: {
					get: function () {
						/// <summary>
						/// Return true if Property Item is visible in Grid. Otherwise return false.
						/// </summary>
						/// <returns>bool</returns>
						/// <example>
						///  <code lang="javascript">
						///    var isVisibleInGrid = property.isVisibleInGrid;
						///  </code>
						/// </example>
						return !!(tableItem && tableItem.visible);
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

			this._getElement = function () {
				return elementItem;
			};
		},

		getElement: function () {
			/// <summary>
			/// Get an element of the current Property Item. A tree node which "contains" this grid cell.
			/// </summary>
			/// <returns>Aras.Modules.CMF.Public.Element</returns>
			/// <example>
			///  <code lang="javascript">
			///    var element = property.getElement();
			///  </code>
			/// </example>
			return this._getElement();
		} //don't use "," after the last property all over the file, e.g, here because documentation will not be built
	});
});
