define(['dojo/_base/declare', './StringItemPropertyEditor'], function (
	declare,
	ItemPropertyEditorBase
) {
	return declare(ItemPropertyEditorBase, {
		_isDialogShown: false,

		constructor: function (initialParameters) {
			const iconPaths =
				(initialParameters && initialParameters.iconPaths) || {};
			this._iconPaths.dialogButton =
				iconPaths.dialogButton || '../../images/InputCalendar.svg';
		},

		_buildEditControlTemplate: function (editorParameters) {
			const inputTemplate = this.inherited(arguments);
			const buttonTemplate = this.wrapInTag('', 'img', {
				class: 'aras-singular__button',
				src: this._iconPaths.dialogButton,
				controlNode: 'dialogButton'
			});

			return this.wrapInTag(inputTemplate + buttonTemplate, 'span', {
				class: 'aras-singular__container'
			});
		},

		_attachDomEventListeners: function () {
			this.inherited(arguments);

			if (this.domNode) {
				const dialogButtonNode = this.controlNodes.dialogButton;

				this._attachDomEventListener(
					dialogButtonNode,
					'mousedown',
					this._showDateDialog.bind(this)
				);
			}
		},

		_showDateDialog: function () {
			const datePattern = this._showParameters.pattern;
			const dialogParameters = {
				aras: this.aras,
				format: datePattern,
				type: 'Date'
			};
			const topWindow = this.aras.getMostTopWindowWithAras();
			let dateDialog;

			if (this.value) {
				dialogParameters.date = this.aras.convertFromNeutral(
					this.value,
					'date',
					datePattern
				);
			} else {
				dialogParameters.date = this.aras.parse2NeutralEndOfDayStr(new Date());
			}

			this._isHideForbidden = true;

			dateDialog = topWindow.ArasModules.Dialog.show(
				'iframe',
				dialogParameters
			);

			dateDialog.promise.then(
				function (selectedDate) {
					this._isHideForbidden = false;

					if (selectedDate) {
						this.setValue(selectedDate);
					}
					this.controlNodes.valueInput.focus();
				}.bind(this)
			);
		}
	});
});
