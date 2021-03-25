require(['dojo/_base/declare'], function (declare) {
	return dojo.setObject(
		'VC.Viewers.ContextMenuItem',
		declare(null, {
			constructor: function (action, element) {
				this.action = action;
				this.element = element;
			},

			setEnabled: function (enabled) {
				if (enabled) {
					VC.Utils.removeClass(this.element, 'disabled');
				} else {
					VC.Utils.addClass(this.element, 'disabled');
				}
			},

			hide: function () {
				this.element.style.display = 'none';
			},

			show: function () {
				this.element.style.display = 'block';
			},

			setText: function (text) {
				this.element.innerHTML = text;
			}
		})
	);
});
