/* global define, arasDocumentationHelper*/
define(['dojo/_base/declare'], function (declare) {
	return declare('Aras.Modules.CMF.Public.MappingModel', null, {
		constructor: function () {
			var sourceId;
			var relatedId;
			var action;
			var parentId;
			var sortOrder;
			var properties = {
				sourceId: {
					get: function () {
						/// <summary>
						/// Document Element Id
						/// </summary>
						/// <returns>string</returns>
						/// <example>
						///  <code lang="javascript">
						///    var mappingModel = inArgs.factory.createMappingModel();
						///    mappingModel.sourceId = 'Some Document Element Id';
						///  </code>
						/// </example>
						return sourceId;
					},
					set: function (value) {
						sourceId = value;
					}
				},
				relatedId: {
					get: function () {
						/// <summary>
						/// Business Object Element Id
						/// </summary>
						/// <returns>string</returns>
						/// <example>
						///  <code lang="javascript">
						///    var mappingModel = inArgs.factory.createMappingModel();
						///    mappingModel.relatedId = 'Some Business Object Element Id (for example Part Id)';
						///  </code>
						/// </example>
						return relatedId;
					},
					set: function (value) {
						relatedId = value;
					}
				},
				action: {
					get: function () {
						/// <summary>
						/// Action for binding (can be Bind, Unbind, Ignore)
						/// </summary>
						/// <returns>string</returns>
						/// <example>
						///  <code lang="javascript">
						///    var mappingModel = inArgs.factory.createMappingModel();
						///    mappingModel.action = 'Bind';
						///  </code>
						/// </example>
						return action;
					},
					set: function (value) {
						action = value;
					}
				},
				parentSourceId: {
					get: function () {
						/// <summary>
						/// Parent Document Element Id
						/// </summary>
						/// <returns>string</returns>
						/// <example>
						///  <code lang="javascript">
						///    var mappingModel = inArgs.factory.createMappingModel();
						///    mappingModel.parentSourceId = 'Parent Document Element Id';
						///  </code>
						/// </example>
						return parentId;
					},
					set: function (value) {
						parentId = value;
					}
				},
				sortOrder: {
					get: function () {
						/// <summary>
						/// Sort order of Business Object Element
						/// </summary>
						/// <returns>string</returns>
						/// <example>
						///  <code lang="javascript">
						///    var mappingModel = inArgs.factory.createMappingModel();
						///    mappingModel.sortOrder = 1;
						///  </code>
						/// </example>
						return sortOrder;
					},
					set: function (value) {
						sortOrder = value;
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
		} //don't use "," after the last property all over the file, e.g, here because documentation will not be built
	});
});
