define([
	'dojo/_base/declare',
	'TechDoc/Aras/Client/Controls/TechDoc/UI/Rendering/XmlSchemaNodeRenderer'
], function (declare, XmlSchemaNodeRenderer) {
	return declare(
		'Aras.Client.Controls.TechDoc.UI.Rendering.XmlSchemaTextRenderer',
		XmlSchemaNodeRenderer,
		{
			RenderHtml: function (/*WrappedObject*/ schemaElement) {
				return (
					'<span id="' +
					schemaElement.Id() +
					'" data-placeholder="' +
					this.ResourceString('nullText') +
					'" class="' +
					this.GetClassList(schemaElement).join(' ') +
					'" contentEditable="true">' +
					this.RenderInnerContent(schemaElement) +
					'</span>'
				);
			},

			RenderInnerContent: function (/*WrappedObject*/ schemaElement) {
				var textContent = schemaElement.Text();
				var textHighlightning = schemaElement.getTextHighlightning();
				var highlightRanges = textHighlightning.getRangesByBounds(
					0,
					textContent.length
				);
				var encodeHtml = dojox.html.entities.encode;
				var renderedText = '';

				if (highlightRanges.length) {
					var emphTextPosition = 0;
					var i;

					for (i = 0; i < highlightRanges.length; i++) {
						currentRange = highlightRanges[i];
						startPosition = Math.max(0, currentRange.start);
						endPosition = Math.min(textContent.length, currentRange.end);

						renderedText += encodeHtml(
							textContent.substring(emphTextPosition, startPosition)
						);
						renderedText += this.wrapInTag(
							encodeHtml(textContent.substring(startPosition, endPosition)),
							'hlr',
							{ rangeId: currentRange.id }
						);

						emphTextPosition = endPosition;
					}

					renderedText += encodeHtml(
						textContent.substring(endPosition, textContent.length)
					);
				} else {
					renderedText = encodeHtml(textContent);
				}

				return renderedText;
			},

			RenderModel: function (/*WrappedObject*/ schemaElement) {
				return [];
			}
		}
	);
});
