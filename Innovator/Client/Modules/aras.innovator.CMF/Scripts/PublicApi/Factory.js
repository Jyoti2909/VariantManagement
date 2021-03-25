/* global define, arasDocumentationHelper*/
define(['dojo/_base/declare', './CmfStyle', './MappingModel'], function (
	declare,
	CmfStyle,
	MappingModel
) {
	return declare('Aras.Modules.CMF.Public.Factory', null, {
		constructor: function () {
			/// <summary>
			/// "Factory Method" pattern is used to create classes.
			/// </summary>
			//this variable is used to build documentation in ExtractJSApiDocs.wsf file
			if (typeof arasDocumentationHelper !== 'undefined') {
				arasDocumentationHelper.registerProperties({});
				arasDocumentationHelper.registerEvents('');
				return;
			}

			this._findDescendantElements = function (elementType, showCandidate) {
				var res = [];
				var rootNode = this.getDocElement('root');
				if (rootNode) {
					var items = store.findDescendantDocumentElements(
						rootNode,
						elementType,
						showCandidate
					);
					for (var i = 0; i < items.length; i++) {
						res.push(new Aras.Modules.CMF.Public.Element(items[i], store));
					}
				}
				return res;
			};
		},

		createMappingModel: function () {
			/// <summary>
			/// Return a new instance of Aras.Modules.CMF.Public.MappingModel.
			/// </summary>
			/// <example>
			///  <code lang="javascript">
			///    var mappingModel = inArgs.factory.createMappingModel();
			///  </code>
			/// </example>
			/// <returns>Aras.Modules.CMF.Public.MappingModel</returns>
			return new MappingModel();
		},

		findDescendantElements: function (elementType, showCandidate) {
			/// <summary>
			/// Find descendant elements from root Node by Element Type Name
			/// </summary>
			/// <param name="elementType" type="string">Element Type Name</param>
			/// <param name="showCandidate" type="boolean">show elements with candidates</param>
			/// <returns>array of Aras.Modules.CMF.Public.Element</returns>
			/// <example>
			///  <code lang="javascript">
			///    var cmfElements = inArgs.factory.findDescendantElements('CMF Element Type Name');
			///  </code>
			/// </example>
			return this._findDescendantElements(elementType, showCandidate);
		},

		createCmfStyle: function () {
			/// <summary>
			/// Return a new instance of Aras.Modules.CMF.Public.CmfStyle.
			/// </summary>
			/// <returns>Aras.Modules.CMF.Public.CmfStyle</returns>
			/// <example>
			///  <code lang="javascript">
			///    var cmfStyle = inArgs.factory.createCmfStyle();
			///  </code>
			/// </example>
			return new CmfStyle();
		} //don't use "," after the last property all over the file, e.g, here because documentation will not be built
	});
});
