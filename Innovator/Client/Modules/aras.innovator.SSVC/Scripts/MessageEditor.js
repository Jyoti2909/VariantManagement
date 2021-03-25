define([
	'dojo/_base/declare',
	'SSVC/Scripts/Mention',
	'SSVC/Scripts/Utils'
], function (declare, Mention, ssvcUtils) {
	return declare('SSVC.UI.MessageEditor', null, {
		element: null,
		textContainer: null,

		constructor: function () {
			this.element = this._createUI();
			Mention.init(this.tributeContainer);
		},

		setMessageText: function (text) {
			this.textContainer.innerHTML = text;
		},

		getMessageText: function () {
			return this.textContainer.innerHTML;
		},

		setVisibility: function (isVisible) {
			this.element.style.display = isVisible ? 'block' : 'none';
		},

		_createUI: function () {
			const controlContainer = document.createElement('div');
			controlContainer.className = 'ssvc-messageEditor ssvc-toolbar-addComment';

			const container = document.createElement('div');
			container.className = 'ssvc-toolbar-addComment-container';
			controlContainer.appendChild(container);

			const tributeContainer = document.createElement('div');
			tributeContainer.className = 'ssvc-toolbar-addComment-area';
			tributeContainer.setAttribute('contenteditable', true);
			container.appendChild(tributeContainer);
			this.tributeContainer = tributeContainer;
			this.textContainer = document.createElement('p');
			tributeContainer.appendChild(this.textContainer);

			const span = document.createElement('span');
			span.className = 'ssvc-toolbar-addComment-resize';
			container.appendChild(span);

			const button = document.createElement('input');
			button.type = 'button';
			button.className = 'btn ssvc-edit-message-saved';
			button.value = ssvcUtils.GetResource('mc_save');
			button.disabled = false;
			controlContainer.appendChild(button);

			return controlContainer;
		}
	});
});
