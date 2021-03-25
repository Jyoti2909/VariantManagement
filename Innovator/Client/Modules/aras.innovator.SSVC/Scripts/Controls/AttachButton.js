define(['dojo/_base/declare', 'SSVC/Scripts/Controls/AttachControl'], function (
	declare,
	AttachControl
) {
	return declare([AttachControl], {
		domNode: null,

		onClick: function () {},

		constructor: function (title, cssClass) {
			this.domNode = document.createElement('span');
			this.domNode.setAttribute('class', cssClass);
			this.domNode.innerHTML = title;
			this.domNode.onclick = dojo.hitch(this, this._onClick);
		},

		_onClick: function () {
			this.onClick();
		}
	});
});
