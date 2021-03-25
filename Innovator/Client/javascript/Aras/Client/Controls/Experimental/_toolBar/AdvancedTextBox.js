define(['dojo/_base/declare', 'dijit/form/TextBox'], function (
	declare,
	TextBox
) {
	return declare(
		'Aras.Client.Controls.Experimental._toolBar.AdvancedTextBox',
		[TextBox],
		{
			baseClass: 'advancedTextBox',
			cssStateNodes: {
				TextBox: 'dijitTextBox'
			},
			templateString:
				'<div class="advancedTextBox">' +
				'<label data-dojo-attach-point="LabelBefore"></label>' +
				'<div data-dojo-attach-point="TextBox" class="dijit dijitReset dijitInline dijitLeft dijitTextBox" id="widget_${id}" role="presentation"\n\t>' +
				'<div class="dijitReset dijitInputField dijitInputContainer"\n\t\t>' +
				'<input class="dijitReset dijitInputInner" data-dojo-attach-point="textbox,focusNode" autocomplete="off"\n\t\t\t${!nameAttrSetting} type="${type}"\n\t/>' +
				'</div\n>' +
				'</div>\n' +
				'<label data-dojo-attach-point="LabelAfter"></label>' +
				'</div>',

			constructor: function (args) {},

			postCreate: function () {
				this.inherited(arguments);
			},

			setLabelAfter: function (value) {
				this.LabelAfter.innerHTML = value;
			},

			setLabelBefore: function (value) {
				this.LabelBefore.innerHTML = value;
			},

			set: function (attrName, value) {
				if (attrName === 'title') {
					//set title attribute not only to the TextBox but to the whole domNode including Labels
					this.domNode.setAttribute(attrName, value);
				} else {
					this.inherited(arguments);
				}
			},

			setPlaceholder: function (value) {
				this.textbox.setAttribute('placeholder', value);
			}
		}
	);
});
