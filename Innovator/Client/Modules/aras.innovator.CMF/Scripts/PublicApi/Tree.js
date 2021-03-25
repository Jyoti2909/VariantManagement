/* global define, arasDocumentationHelper*/
define(['dojo/_base/declare', './Element'], function (declare, Element) {
	return declare('Aras.Modules.CMF.Public.Tree', null, {
		constructor: function (rootOfTree, store) {
			/// <summary>
			/// Class for search elements in the CMF Document.
			/// (CMF document has a tree architecture.)
			/// </summary>
			this._findElementWithBinding = function (
				elementType,
				boundItemId,
				showCandidate
			) {
				if (rootOfTree && boundItemId) {
					var descendantDocElements = store.findDescendantDocumentElements(
						rootOfTree,
						elementType,
						showCandidate
					);
					for (var i = 0; i < descendantDocElements.length; i++) {
						if (descendantDocElements[i].boundItemId === boundItemId) {
							return new Element(descendantDocElements[i], store);
						}
					}
				}
				return undefined;
			};

			//this variable is used to build documentation in ExtractJSApiDocs.wsf file
			if (typeof arasDocumentationHelper !== 'undefined') {
				arasDocumentationHelper.registerProperties();
				arasDocumentationHelper.registerEvents('');
				return;
			}
		},

		findElementWithBinding: function (elementType, boundItemId) {
			/// <summary>
			/// Function finds element with type of "elementType" which has a reference on Business Object Item with id "boundItemId"
			/// </summary>
			/// <returns>Aras.Modules.CMF.Public.Element</returns>
			/// <example>
			///  <code lang="javascript">
			///    var cmfElement = inArgs.tree.findElementWithBinding("CMF Element Type Name", "Business Object Item Id");
			///  </code>
			/// </example>
			return this._findElementWithBinding(elementType, boundItemId);
		} //don't use "," after the last property all over the file, e.g, here because documentation will not be built
	});
});
