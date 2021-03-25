define([
	'dojo/_base/declare',
	'TechDoc/Aras/Client/Controls/TechDoc/UI/Search/SearchEngine',
	'TechDoc/Aras/Client/Controls/TechDoc/ViewModel/DocumentationEnums'
], function (declare, SearchEngineBase, Enums) {
	return declare([SearchEngineBase], {
		constructor: function (initialParameters) {
			initialParameters = initialParameters || {};
		},

		_initializeSearchContext: function (searchValue) {
			var escapedValue = searchValue.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
			var searchContext = this.inherited(arguments);

			searchContext.regExp = new RegExp(escapedValue, 'gi');
		},

		_scanSource: function (sourceViewModel) {
			var foundMatches = [];

			if (sourceViewModel) {
				var allSchemaElements = sourceViewModel.getAllElements();
				var textSchemaElements = allSchemaElements.filter(function (
					schemaElement
				) {
					var isSearchableElement =
						schemaElement.is('ArasTextXmlSchemaElement') ||
						schemaElement.is('XmlSchemaText') ||
						schemaElement.is('ArasItemPropertyXmlSchemaElement');

					if (isSearchableElement) {
						var actualSchemaElement = schemaElement.is('XmlSchemaText')
							? schemaElement.Parent
							: schemaElement;

						return !actualSchemaElement || !actualSchemaElement.isHidden();
					}
				});
				var searchRegExp = this._searchContext.regExp;
				var currentElement;
				var textContent;
				var currentMatch;
				var i;

				for (i = 0; i < textSchemaElements.length; i++) {
					currentElement = textSchemaElements[i];

					if (currentElement.is('ArasItemPropertyXmlSchemaElement')) {
						textContent = currentElement.getPropertyLocalValue();
					} else if (currentElement.is('ArasTextXmlSchemaElement')) {
						textContent = currentElement.GetTextAsString();
					} else {
						textContent = currentElement.Text();
					}

					while ((currentMatch = searchRegExp.exec(textContent)) !== null) {
						foundMatches.push({
							schemaElement: currentElement,
							firstIndex: currentMatch.index,
							lastIndex: searchRegExp.lastIndex
						});
					}
				}
			}

			return foundMatches;
		}
	});
});
