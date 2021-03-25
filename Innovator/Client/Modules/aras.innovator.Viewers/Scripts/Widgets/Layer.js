require(['dojo/_base/declare'], function (declare) {
	return dojo.setObject(
		'VC.Widgets.Layer',
		declare(null, {
			title: null,
			value: null,
			checked: null,

			domNode: null,
			checkboxDomNode: null,
			titleDomNode: null,

			onChange: function () {},

			constructor: function (title, value, checked) {
				this.title = title;
				this.value = value;
				this.checked = checked;

				this.constructLayer();
			},

			changeCheckboxState: function () {
				if (this.checked) {
					this.uncheck();
				} else {
					this.check();
				}
			},

			check: function () {
				this.checkboxDomNode.setAttribute('checked', 'checked');
				this.checked = true;
			},

			uncheck: function () {
				this.checkboxDomNode.removeAttribute('checked');
				this.checked = false;
			},

			onToggleLayer: function () {
				this.changeCheckboxState();
				this.onChange();
			},

			constructLayer: function () {
				this.checkboxDomNode = document.createElement(
					VC.Utils.Constants.htmlTags.div
				);
				this.titleDomNode = document.createElement('span');
				this.domNode = document.createElement(VC.Utils.Constants.htmlTags.div);

				VC.Utils.addClass(this.checkboxDomNode, 'Checkbox');
				VC.Utils.addClass(this.titleDomNode, 'Text');
				VC.Utils.addClass(this.domNode, 'Layer');

				this.titleDomNode.innerHTML = this.title;
				this.domNode.appendChild(this.checkboxDomNode);
				this.domNode.appendChild(this.titleDomNode);

				this.checkboxDomNode.onclick = dojo.hitch(this, this.onToggleLayer);

				if (this.checked) {
					this.checkboxDomNode.setAttribute('checked', 'checked');
				}
			}
		})
	);
});
