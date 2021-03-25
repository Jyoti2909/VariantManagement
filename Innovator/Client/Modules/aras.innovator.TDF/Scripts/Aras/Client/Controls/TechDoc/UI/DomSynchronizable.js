define(['dojo/_base/declare'], function (declare) {
	return declare('Aras.Client.Controls.TechDoc.UI.DomSynchronizable', null, {
		updateFromDom: function (targetDomNode) {},

		_getNormalizedTextContent: function (targetNode) {
			var textContent = (targetNode && targetNode.textContent) || '';

			if (textContent) {
				textContent = this._normalizeWhitespaces(textContent);
			}

			return textContent;
		},

		_normalizeWhitespaces: function (targetString) {
			if (targetString) {
				targetString = targetString.replace(
					/[\u00A0\u2000-\u200A\u202F\u205F\u3000]/g,
					' '
				);
			}

			return targetString;
		}
	});
});
