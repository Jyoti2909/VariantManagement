define(['dojo/_base/declare'], function (declare) {
	return declare('Aras.Modules.CMF.Public.ComputeMethodResultBuilder', null, {
		constructor: function (markedToUpdate) {
			/// <summary>
			/// Instance of Class (passed as an arg) is used to build results. MarkToUpdate the properties to change and pass new values.
			/// The same properties can be marked to update in one method several times. The last value will be used,
			/// and it will not affect perfomance (only one time a property will be updated).
			/// </summary>
			this._markToUpdateStyle = function (propertyItemId, newStyle) {
				if (!markedToUpdate[propertyItemId]) {
					markedToUpdate[propertyItemId] = {};
				}

				markedToUpdate[propertyItemId].cmfStyle = newStyle;
				markedToUpdate[propertyItemId].isCmfStyleSet = true;
			};

			this._markToUpdateValue = function (propertyItemId, newValue) {
				if (!markedToUpdate[propertyItemId]) {
					markedToUpdate[propertyItemId] = {};
				}

				markedToUpdate[propertyItemId].value = newValue;
				markedToUpdate[propertyItemId].isValueSet = true;
			};

			//this variable is used to build documentation in ExtractJSApiDocs.wsf file
			if (typeof arasDocumentationHelper !== 'undefined') {
				arasDocumentationHelper.registerProperties({});
				arasDocumentationHelper.registerEvents('');
				return;
			}
		},

		markToUpdateStyle: function (propertyItemId, newStyle) {
			/// <summary>
			/// Mark to update the Property Item to change and pass a new style.
			/// </summary>
			/// <param name="propertyItemId" type="string">see the "id" property of Aras.Modules.CMF.Public.PropertyItem.</param>
			/// <param name="newStyle" type="Aras.Modules.CMF.Public.CmfStyle"></param>
			/// <example>
			///  <code lang="javascript">
			///    var cmfElements = inArgs.factory.findDescendantElements('CMF Element Type Name');
			///    if(cmfElements.length > 0) {
			///       var cmfProperty = cmfElements[0].getPropertyItem("CMF Property Type Name");
			///       var newStyle = inArgs.factory.createCmfStyle();
			///       newStyle.textColor = "#BEBEBE";
			///       inArgs.resultBuilder.markToUpdateStyle(cmfProperty.id, newStyle);
			///    }
			///  </code>
			/// </example>
			this._markToUpdateStyle(propertyItemId, newStyle);
		},

		markToUpdateValue: function (propertyItemId, newValue) {
			/// <summary>
			/// Mark to update the Property Item to change and pass a new value.
			/// </summary>
			/// <param name="propertyItemId" type="string">see the "id" property of Aras.Modules.CMF.Public.PropertyItem.</param>
			/// <param name="newValue" type="string"></param>
			/// <example>
			///  <code lang="javascript">
			///    var cmfElements = inArgs.factory.findDescendantElements('CMF Element Type Name');
			///    if(cmfElements.length > 0) {
			///       var cmfProperty = cmfElements[0].getPropertyItem("CMF Property Type Name");
			///       var newStyle = inArgs.factory.createCmfStyle();
			///       newStyle.textColor = "#BEBEBE";
			///       inArgs.resultBuilder.markToUpdateValue(cmfProperty.id, "someValue");
			///    }
			///  </code>
			/// </example>
			this._markToUpdateValue(propertyItemId, newValue);
		} //don't use "," after the last property all over the file, e.g, here because documentation will not be built
	});
});
