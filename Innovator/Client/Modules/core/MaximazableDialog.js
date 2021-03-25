import Dialog from './Dialog';

function MaximazableDialog(type, args) {
	Dialog.call(this, type, args);
	this.makeMaximazable();
	this.restoreData = {}; // dialog's attributes in normal state (before maximization)
}

const privateData = {
	maximizedClass: 'aras-dialog_maximized',
	maximizedIconClass: 'aras-icon-minimize'
};

const instanceData = {
	constructor: MaximazableDialog,
	template:
		'<div class="aras-dialog__title-bar">' +
		'<span title="Close" class="aras-dialog__close-button aras-icon-close"></span>' +
		'<span title="Maximize" class="aras-dialog__maximize-button aras-icon-maximize"></span>' +
		'<span class="aras-dialog__title"></span>' +
		'</div>' +
		'<div class="aras-dialog__content">' +
		'</div>',
	makeMaximazable: function () {
		const maximizeButton = this.dialogNode.querySelector(
			'.aras-dialog__title-bar .aras-dialog__maximize-button'
		);
		// it's important to bind with the second undefined parameter in order to preserve 'maximize' method's logic
		const onMaximizeBinded = this.maximize.bind(this, undefined);

		maximizeButton.addEventListener('click', onMaximizeBinded);
		maximizeButton.setAttribute(
			'title',
			aras.getResource('', 'dialog.maximize')
		);
		this.attachedEvents.onExpand = {
			node: maximizeButton,
			eventName: 'click',
			callback: onMaximizeBinded
		};
	},
	maximize: function (needMaximization) {
		const dialogNode = this.dialogNode;
		const maximizeButtonNode = dialogNode.querySelector(
			'.aras-dialog__title-bar .aras-dialog__maximize-button'
		);
		if (needMaximization === undefined) {
			needMaximization = !dialogNode.classList.contains(
				privateData.maximizedClass
			);
		}

		dialogNode.classList.toggle(privateData.maximizedClass, needMaximization);
		maximizeButtonNode.classList.toggle(
			privateData.maximizedIconClass,
			needMaximization
		);
		if (needMaximization) {
			this.restoreData = {
				top: dialogNode.style.top,
				left: dialogNode.style.left,
				width: dialogNode.style.width,
				height: dialogNode.style.height
			};
			maximizeButtonNode.title = aras.getResource('', 'dialog.normal');
			dialogNode.classList.remove('aras-dialog_moved');
			dialogNode.style.top = '';
			dialogNode.style.left = '';
			dialogNode.style.width = '';
			dialogNode.style.height = '';
		} else {
			maximizeButtonNode.title = aras.getResource('', 'dialog.maximize');
			dialogNode.style.top = this.restoreData.top;
			dialogNode.style.left = this.restoreData.left;
			dialogNode.style.width = this.restoreData.width;
			dialogNode.style.height = this.restoreData.height;

			if (this.restoreData.left) {
				// if dialog had nonempty 'left' style than it has been moved. Restore styles
				// in other case it would centered horizontally automatically without setting any styles
				dialogNode.classList.add('aras-dialog_moved');
			}
		}
	}
};

const staticData = {
	show: function (type, args) {
		const dialog = new MaximazableDialog(type, args);
		dialog.show();
		return dialog;
	}
};

MaximazableDialog.prototype = Object.create(Dialog.prototype);
Object.assign(MaximazableDialog.prototype, instanceData);
Object.assign(MaximazableDialog, staticData);

export default MaximazableDialog;
