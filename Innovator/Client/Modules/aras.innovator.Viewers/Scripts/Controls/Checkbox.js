require([
	'dojo/_base/fx',
	'dijit/_WidgetBase',
	'dijit/_TemplatedMixin',
	'dijit/_WidgetsInTemplateMixin'
], dojo.hitch(this, function (
	baseFx,
	_WidgetBase,
	_TemplatedMixin,
	_WidgetsInTemplateMixin
) {
	return dojo.setObject(
		'VC.Widgets.Checkbox',
		dojo.declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
			label: null,
			isChecked: false,

			onChange: function () {},

			templateString:
				'<div class="CheckboxContainer">' +
				'<div data-dojo-attach-point="Checkbox" class="Checkbox"></div>' +
				'<span data-dojo-attach-point="Text" class="Text"></span>' +
				'</div>',
			widgetsInTemplate: true,

			constructor: function () {
				this.id = 'CheckBox' + VC.Utils.getTimestampString();
			},

			postCreate: function () {
				this.Text.innerHTML = this.label;
				this.Checkbox.onclick = dojo.hitch(this, this.onToggleCheckbox);
			},

			onToggleCheckbox: function () {
				this.changeCheckboxState();
				this.onChange();
			},

			changeCheckboxState: function () {
				if (this.isChecked) {
					this.uncheck();
				} else {
					this.check();
				}
			},

			check: function () {
				this.Checkbox.setAttribute('checked', 'checked');
				this.isChecked = true;
			},

			uncheck: function () {
				this.Checkbox.removeAttribute('checked');
				this.isChecked = false;
			}
		})
	);
}));
