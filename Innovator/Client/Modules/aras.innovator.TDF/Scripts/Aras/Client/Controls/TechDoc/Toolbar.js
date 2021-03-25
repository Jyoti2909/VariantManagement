define([
	'dojo/_base/declare',
	'dojo/_base/connect',
	'Aras/Client/Controls/Public/ToolBar',
	'dojo/aspect'
], function (declare, connect, ArasToolBar, aspect) {
	return declare('Aras.Client.Controls.TechDoc.Toolbar', ArasToolBar, {
		viewmodel: null,
		aras: null,
		_toolbarInitXml: null,
		_toolbarActions: null,
		_cacheOfStyledElements: {},
		_toggledClassForButton: 'dijitToggleButtonChecked',
		_btnNodeHash: null,
		_btnShown: null,
		_btnToggled: null,
		_customHandlers: null,
		_additionalData: null,

		constructor: function (args) {
			var fileref = document.createElement('link');
			var initToolbarObj = args.toolbarObj;

			fileref.setAttribute('rel', 'stylesheet');
			fileref.setAttribute('type', 'text/css');
			fileref.setAttribute(
				'href',
				args.styleSheet ||
					'Scripts/Aras/Client/Controls/TechDoc/themes/Toolbar.css'
			);
			document.getElementsByTagName('head')[0].appendChild(fileref);

			fileref = document.createElement('link');
			fileref.setAttribute('rel', 'stylesheet');
			fileref.setAttribute('type', 'text/css');
			fileref.setAttribute('href', '../../styles/formElements.css');
			document.getElementsByTagName('head')[0].appendChild(fileref);

			this.viewmodel = args.structuredDocument;
			this.aras = this.viewmodel._aras;
			this._additionalData = args.additionalData || {};
			document.toolbar = this;

			if (initToolbarObj) {
				this._toolbarInitXml = initToolbarObj.GetInitXml();
				this._toolbarActions = this.viewmodel.ActionsHelper().viewActions;
				this._handlerCode = initToolbarObj.GetHandelCode()(
					this.viewmodel,
					this
				);
				this.separators = initToolbarObj.GetSeparatorIds();
				this.toolbarId = initToolbarObj.GetToolbarId();
				this._customHandlers = args.customHandlers || {};

				this._btnShown = {};
				this._btnToggled = {};

				connect.connect(this, 'onClick', this, this.clickToolbar);
				connect.connect(this, 'onChange', this, this.changeToolbar);
			}
		},

		startup: function () {
			this.inherited(arguments);
			this.initToolbar();
		},

		initToolbar: function () {
			try {
				this.LoadToolbarFromStr(this._toolbarInitXml);
				this.showLabels(false);
				this.showToolbar(this.toolbarId);
			} catch (e) {
				this.aras.AlertError(e);
			}

			aspect.after(
				this.viewmodel,
				'onSelectionChanged',
				function (sender, selectedItems) {
					if (!this.viewmodel.isInvalidating()) {
						this.updateToolbarHandler(sender, selectedItems);
					}
				}.bind(this),
				true
			);
			aspect.after(
				this.viewmodel,
				'OnInvalidate',
				this.updateToolbarHandler.bind(this),
				true
			);

			if (this._handlerCode.onInited) {
				this._handlerCode.onInited();
			}

			if (this._customHandlers.onInited) {
				this._customHandlers.onInited();
			}

			this.updateToolbarHandler(
				this.viewmodel,
				this.viewmodel.GetSelectedItems()
			);
		},

		getAdditionalData: function (parameterName) {
			return this._additionalData[parameterName];
		},

		changeToolbar: function (selection) {
			if (this._handlerCode.onSelect) {
				this._handlerCode.onSelect(selection, this.viewmodel.IsEditable());
			}

			if (this._customHandlers.onSelect) {
				this._customHandlers.onSelect(selection, this.viewmodel.IsEditable());
			}
		},

		clickToolbar: function (button) {
			if (this._handlerCode || this._customHandlers.onClick) {
				if (this._handlerCode.onClick) {
					this._handlerCode.onClick(
						button.getId(),
						this.viewmodel.IsEditable()
					);
				}

				if (this._customHandlers.onClick) {
					this._customHandlers.onClick(
						button.getId(),
						this.viewmodel.IsEditable()
					);
				}
			} else {
				this.aras.AlertError(
					this.aras.getResource(
						'../Modules/aras.innovator.TDF',
						'helper.no_handler'
					)
				);
				return;
			}
		},

		MarkButtonsAsToggle: function (/*Array*/ nameList) {
			var toggleList = this._btnToggled;
			var name;
			var i;

			for (i = 0; i < nameList.length; i++) {
				name = nameList[i];
				toggleList[name] = true;
			}
		},

		ShowButton: function (/*String*/ name) {
			var sepId = this.separators[name];

			if (sepId) {
				this._btnShown[sepId] = false;
			}
			this._btnShown[name] = false;
		},

		SetToggled: function (/*String || Array*/ name) {
			this._btnShown[name] = true;
		},

		_GetButtonsHash: function () {
			if (!this._btnNodeHash) {
				var btnList = this['getItemIdsAsArr_Experimental']();
				var btnName;
				var btnElement;
				var i;

				this._btnNodeHash = {};

				for (i = 0; i < btnList.length; i++) {
					btnName = btnList[i];
					btnElement = this.getElement(btnName);

					if (btnElement) {
						this._btnNodeHash[btnName] =
							btnElement['_item_Experimental'].domNode;
					}
				}
			}

			return this._btnNodeHash;
		},

		_DrawButtons: function () {
			var nodeHash = this._GetButtonsHash();
			var shown = this._btnShown;
			var toggledClass = this._toggledClassForButton;
			var isVisible;
			var btnName;
			var node;

			for (btnName in nodeHash) {
				isVisible = this.isButtonVisible(btnName);

				if (shown[btnName] === undefined) {
					if (isVisible) {
						this.hideItem(btnName);
					}
				} else {
					if (!isVisible) {
						this.showItem(btnName);
					}

					if (this._btnToggled[btnName]) {
						node = nodeHash[btnName];

						if (shown[btnName]) {
							node.classList.add(toggledClass);
						} else {
							node.classList.remove(toggledClass);
						}
					}
				}
			}
		},

		updateToolbarHandler: function (sender, selectedItems) {
			this._btnShown = {};

			if (this._handlerCode.onShow) {
				this._handlerCode.onShow(sender);
			}

			if (this._handlerCode.onStyled) {
				this._handlerCode.onStyled(sender);
			}

			this._DrawButtons();
		}
	});
});
