VC.Utils.Page.LoadModules(['Abstractions/ANumberTextBox']);

require(['dijit/_WidgetBase', 'dijit/_TemplatedMixin'], dojo.hitch(
	this,
	function (_WidgetBase, _TemplatedMixin) {
		var borders = 2;

		return dojo.setObject(
			'VC.Widgets.NumberTextBox',
			dojo.declare(
				[VC.Abstractions.ANumberTextBox, _WidgetBase, _TemplatedMixin],
				{
					width: null,
					attributesToRootNode: null,

					templateString:
						'<span>' +
						"<label data-dojo-attach-point='LabelBefore' class='RightMargin'></label>" +
						'<input type="text" data-dojo-attach-point="TextBox" class="NumberTextBox" />' +
						"<label data-dojo-attach-point='LabelAfter' class='LeftMargin'></label>" +
						'</span>',
					widgetsInTemplate: true,

					postCreate: function () {
						this.TextBox.style.width = this.width - borders + 'px';

						if (this.attributesToRootNode) {
							var keys = Object.keys(this.attributesToRootNode);

							for (var i = 0; i < keys.length; i++) {
								this.domNode.setAttribute(
									keys[i],
									this.attributesToRootNode[keys[i]]
								);
							}
						}

						this.assignProperties();
						this.assignEvents();
					}
				}
			)
		);
	}
));
