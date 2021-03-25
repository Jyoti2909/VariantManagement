define('Controls/Common/RenderUtils', [], function () {
	var staticXmlDocument = document.implementation.createDocument('', '', null);

	return {
		HTML: {
			wrapInTag: function (sourceString, tagName, tagAttributes) {
				if (tagName) {
					var attributeString = '';

					if (tagAttributes) {
						for (var attributeName in tagAttributes) {
							attributeString +=
								' ' + attributeName + '="' + tagAttributes[attributeName] + '"';
						}
					}

					return (
						'<' +
						tagName +
						attributeString +
						'>' +
						sourceString +
						'</' +
						tagName +
						'>'
					);
				} else {
					return sourceString;
				}
			},

			wrapInCDATASection: function (value, ownerDocument) {
				return (
					value &&
					(ownerDocument || staticXmlDocument).createCDATASection(value)
				);
			}
		}
	};
});
