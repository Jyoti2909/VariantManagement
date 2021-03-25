VC.Utils.Page.LoadModules(['Toolbar/TextBoxBase']);

require(['dijit/_WidgetBase', 'dijit/_TemplatedMixin'], dojo.hitch(
	this,
	function (_WidgetBase, _TemplatedMixin) {
		return dojo.setObject(
			'VC.Toolbar.BasicTextBox',
			dojo.declare([VC.Toolbar.TextBoxBase, _WidgetBase, _TemplatedMixin], {
				templateString:
					'<span>' +
					'<label data-dojo-attach-point="LabelBefore" class="RightMargin"></label>' +
					'<input type="text" data-dojo-attach-point="TextBox" class="NumberTextBox" />' +
					'<label data-dojo-attach-point="LabelAfter" class="LeftMargin"></label>' +
					'</span>',
				widgetsInTemplate: true,
				additionalData: null,

				postCreate: function () {
					Object.defineProperties(this, {
						textbox: {
							get: function () {
								return this.TextBox;
							}
						},
						value: {
							get: function () {
								return this.TextBox.value;
							},
							set: function (value) {
								this.TextBox.value = value;
							}
						}
					});

					if (this.additionalData) {
						var jsonObject = JSON.parse(this.additionalData);

						if (jsonObject.size) {
							this.textbox.setAttribute('size', jsonObject.size);
						}
					}

					this.bindEvents();
				},

				setLabelBefore: function (value) {
					this.LabelBefore.innerHTML = value;
				},

				setLabelAfter: function (value) {
					this.LabelAfter.innerHTML = value;
				}
			})
		);
	}
));
