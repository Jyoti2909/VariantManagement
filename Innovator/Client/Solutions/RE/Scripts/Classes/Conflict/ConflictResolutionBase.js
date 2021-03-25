define([
	'dojo/_base/declare'
],

function(declare, Tooltip) {
	return declare('Aras.Client.Controls.RE.ConflictResolution', null, {
		aras: null,
		_item: null,

		constructor: function(args) {
			this.aras = args.aras;
			this._item = args.item;
		},

		initConflictResolver: function() {
			let topWindow = this.aras.getMostTopWindowWithAras();
			topWindow.addEventListener('RequirementConflict', this._onRequirementConflict.bind(this));
			topWindow.registerCommandEventHandler(topWindow, this._onBeforeSaveCommand.bind(this), 'before', 'save');
		},

		setNewItem: function(newItem) {
			this._item = newItem;
		},

		_onBeforeSaveCommand: function() {
			this.removeConflicts();
		},

		removeConflicts: function() {
			const conflictsNode = this._item.selectSingleNode('conflicts');
			if (conflictsNode) {
				this._item.removeChild(conflictsNode);
			}
		},

		_onRequirementConflict: function(evnt, isStandalone) {
			let conflictDetails = new XmlDocument();
			conflictDetails.loadXML('<conflicts>' + evnt.conflictResult.getFaultDetails() + '</conflicts>');
			this._setConflictToItem(conflictDetails);
		},

		_setConflictToItem: function(conflictDetails) {
			let oldConflict = this._item.selectSingleNode('conflicts');
			if (oldConflict != null) {
				this._item.removeChild(oldConflict);
			}

			this._item.appendChild(conflictDetails.firstChild);
		},

		_getConflictItemByConfigId: function(configId) {
			return configId && this._item.selectSingleNode('conflicts/Item/latest_item/Item[config_id="' + configId + '"]');
		},

		getMessage: function(resourceName, params) {
			return this.aras.getResource.apply(this.aras, ['../Solutions/RE', resourceName].concat(params || []));
		},

		confirm: function(message, options) {
			let topWnd = this.aras.getMostTopWindowWithAras();
			let confirmDialog = new topWnd.ArasModules.Dialog('html', {
				title: options.title
			});

			let cssClassName = 'aras-dialog-confirm';
			confirmDialog.dialogNode.classList.add(cssClassName);

			let messageContainer = document.createElement('div');
			messageContainer.classList.add(cssClassName + '__container');
			confirmDialog.contentNode.appendChild(messageContainer);

			let image = document.createElement('img');
			image.classList.add(cssClassName + '__img');
			image.src = this.aras.getBaseURL('/Solutions/RE/Images/Unresolved.svg');
			messageContainer.appendChild(image);

			let messageNode = document.createElement('span');
			messageNode.classList.add(cssClassName + '__text');
			messageNode.textContent = message;

			messageContainer.appendChild(messageNode);

			let btnContainer = document.createElement('div');
			btnContainer.classList.add(cssClassName + '__container');

			let buttonOk = document.createElement('button');
			buttonOk.autofocus = true;
			buttonOk.classList.add('aras-btn');
			buttonOk.textContent = options.buttonOkText || this.aras.getResource('', 'common.ok');
			buttonOk.addEventListener('click', confirmDialog.close.bind(confirmDialog, 'ok'));
			btnContainer.appendChild(buttonOk);

			if (options.isStandalone) {
				let buttonCancel = document.createElement('button');
				buttonCancel.classList.add('aras-btn', 'btn_cancel');
				buttonCancel.textContent = options.buttonCancelText;
				buttonCancel.addEventListener('click', confirmDialog.close.bind(confirmDialog, 'cancel'));
				btnContainer.appendChild(buttonCancel);
			}

			confirmDialog.contentNode.appendChild(btnContainer);

			confirmDialog.show();
			return confirmDialog.promise;
		}
	});
});
