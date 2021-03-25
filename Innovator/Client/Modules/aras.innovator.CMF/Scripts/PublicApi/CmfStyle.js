define(['dojo/_base/declare'], function (declare) {
	return declare('Aras.Modules.CMF.Public.CmfStyle', null, {
		constructor: function () {
			/// <summary>
			/// Class supports the same style properties and their values as "cmf_Style" Item Type.
			/// </summary>
			var backgroundColor;
			var textColor;
			var fontFamily;
			var fontSize;
			var fontStyle;
			var fontWeight;
			var textDecoration;
			var textAlign;

			//note that validateStyle method exists in ComputedMethodHelper.js
			//and all the properties should be typed manually in clone method here and in isStylesEqual of ComputedMethodHelper.js (for in doesn't work)
			var properties = {
				backgroundColor: {
					get: function () {
						/// <summary>
						/// Hex format and only in format: "#aBcdeF" is only supported.
						/// </summary>
						/// <example>
						///  <code lang="javascript">
						///    var style = inArgs.factory.createCmfStyle();
						///    style.backgroundColor = '#BEBEBE';
						///  </code>
						/// </example>
						/// <returns>string</returns>
						return backgroundColor;
					},
					set: function (value) {
						backgroundColor = value;
					}
				},
				textColor: {
					get: function () {
						/// <summary>
						/// Hex format and only in format: "#aBcdeF" is only supported.
						/// </summary>
						/// <example>
						///  <code lang="javascript">
						///    var style = inArgs.factory.createCmfStyle();
						///    style.textColor = '#BEBEBE';
						///  </code>
						/// </example>
						/// <returns>string</returns>
						return textColor;
					},
					set: function (value) {
						textColor = value;
					}
				},
				fontFamily: {
					get: function () {
						/// <summary>
						/// Get/Set font-family.
						/// </summary>
						/// <example>
						///  <code lang="javascript">
						///    var style = inArgs.factory.createCmfStyle();
						///    style.fontFamily = "Georgia, 'Times New Roman', Times, serif";
						///  </code>
						/// </example>
						/// <returns>string</returns>
						return fontFamily;
					},
					set: function (value) {
						fontFamily = value;
					}
				},
				fontSize: {
					get: function () {
						/// <summary>
						/// Integer values (not decimal) are only supported. In Pixels.
						/// </summary>
						/// <example>
						///  <code lang="javascript">
						///    var style = inArgs.factory.createCmfStyle();
						///    style.fontSize = 12;
						///  </code>
						/// </example>
						/// <returns>string</returns>
						return fontSize;
					},
					set: function (value) {
						fontSize = value;
					}
				},
				fontStyle: {
					get: function () {
						/// <summary>
						/// "normal" and "italic" values are only supported.
						/// </summary>
						/// <example>
						///  <code lang="javascript">
						///    var style = inArgs.factory.createCmfStyle();
						///    style.fontStyle = 'italic';
						///  </code>
						/// </example>
						/// <returns>string</returns>
						return fontStyle;
					},
					set: function (value) {
						fontStyle = value;
					}
				},
				fontWeight: {
					get: function () {
						/// <summary>
						/// "normal" and "bold" values are only supported.
						/// </summary>
						/// <example>
						///  <code lang="javascript">
						///    var style = inArgs.factory.createCmfStyle();
						///    style.fontWeight = 'bold';
						///  </code>
						/// </example>
						/// <returns>string</returns>
						return fontWeight;
					},
					set: function (value) {
						fontWeight = value;
					}
				},
				textDecoration: {
					get: function () {
						/// <summary>
						/// "none" and "underline" values are only supported.
						/// </summary>
						/// <example>
						///  <code lang="javascript">
						///    var style = inArgs.factory.createCmfStyle();
						///    style.textDecoration = 'underline';
						///  </code>
						/// </example>
						/// <returns>string</returns>
						return textDecoration;
					},
					set: function (value) {
						textDecoration = value;
					}
				},
				textAlign: {
					get: function () {
						/// <summary>
						/// "left", "right" and "center" values are only supported.
						/// </summary>
						/// <example>
						///  <code lang="javascript">
						///    var style = inArgs.factory.createCmfStyle();
						///    style.textAlign = 'right';
						///  </code>
						/// </example>
						/// <returns>string</returns>
						return textAlign;
					},
					set: function (value) {
						textAlign = value;
					}
				} //don't use "," after the last property all over the file, e.g, here because documentation will not be built
				//note that validateStyle method exists in ComputedMethodHelper.js
				//and all the properties should be typed manually in clone method here and in isStylesEqual of ComputedMethodHelper.js (for in doesn't work)
			};

			//this variable is used to build documentation in ExtractJSApiDocs.wsf file
			if (typeof arasDocumentationHelper !== 'undefined') {
				arasDocumentationHelper.registerProperties(properties);
				arasDocumentationHelper.registerEvents('');
				return;
			}

			Object.defineProperties(this, properties);
		},

		clone: function () {
			/// <summary>
			/// Create a clone of the instance.
			/// </summary>
			/// <example>
			///  <code lang="javascript">
			///    var style = inArgs.factory.createCmfStyle();
			///    style.textAlign = 'right';
			///    var copy = style.clone();
			///  </code>
			/// </example>
			/// <returns>Aras.Modules.CMF.Public.CmfStyle</returns>
			var res = new Aras.Modules.CMF.Public.CmfStyle();

			res.backgroundColor = this.backgroundColor;
			res.textColor = this.textColor;
			res.fontFamily = this.fontFamily;
			res.fontSize = this.fontSize;
			res.fontStyle = this.fontStyle;
			res.fontWeight = this.fontWeight;
			res.textDecoration = this.textDecoration;
			res.textAlign = this.textAlign;

			return res;
		} //don't use "," after the last property all over the file, e.g, here because documentation will not be built
	});
});
