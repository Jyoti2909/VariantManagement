define([
	'dojo/_base/declare',
	'SSVC/Scripts/Controls/AttachButton',
	'SSVC/Scripts/Controls/AttachSelectFile'
], function (declare, AttachButton, AttachSelectFile) {
	return declare(null, {
		domNode: null,
		menuNode: null,
		mainButton: null,
		isVisible: true,

		onSketchButtonClick: function () {},
		onSelectFileButtonClick: function (fileUrl) {},

		constructor: function () {
			this.domNode = document.createElement('div');
			this.domNode.setAttribute('class', 'attachMenu');

			this._createMainButton('Attach', this._onMainButtonClick);
			this._createMenuNode();

			const sketchButton = new AttachButton('Sketch', 'attachOption');
			const selectFileButton = new AttachSelectFile(
				'Select Picture',
				'attachOption'
			);
			sketchButton.onClick = dojo.hitch(this, this._onSketchButtonClick);
			selectFileButton.onClick = dojo.hitch(
				this,
				this._onSelectFileButtonClick
			);

			this.addItemToMenu('sketchButton', sketchButton);
			this.addItemToMenu('selectFileButton', selectFileButton);

			this.hideOptions();
		},

		_createMenuNode: function () {
			this.menuNode = document.createElement('div');
			this.menuNode.setAttribute('class', 'attachContainer');

			this.domNode.appendChild(this.menuNode);
		},

		_createMainButton: function (title, onClick) {
			this.mainButton = new AttachButton(title, 'attach');
			this.mainButton.onClick = dojo.hitch(this, onClick);

			this.domNode.appendChild(this.mainButton.domNode);
		},

		addItemToMenu: function (name, item) {
			this[name] = item;
			this.menuNode.appendChild(item.domNode);
		},

		showOptions: function () {
			if (!this.isVisible) {
				this.isVisible = true;
				this.menuNode.style.display = 'block';
				this.mainButton.domNode.classList.add('active');
			}
		},

		hideOptions: function () {
			if (this.isVisible) {
				this.isVisible = false;
				this.menuNode.style.display = 'none';
				this.mainButton.domNode.classList.remove('active');
			}
		},

		setDisplay: function (isDisplay) {
			this.domNode.style.display = isDisplay ? 'inline-block' : 'none';
		},

		_onMainButtonClick: function () {
			if (this.isVisible) {
				this.hideOptions();
			} else {
				this.showOptions();
			}
		},

		_onSketchButtonClick: function () {
			this.onSketchButtonClick();
			this.hideOptions();
		},

		_onSelectFileButtonClick: function (fileUrl) {
			this.onSelectFileButtonClick(fileUrl);
			this.hideOptions();
		}
	});
});
