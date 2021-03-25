/*jslint plusplus: true, evil: true */
/*global dojo, define*/
define([
	'dojo/_base/declare',
	'dijit/Toolbar',
	'dojo/dom-class',
	'Aras/Client/Controls/Experimental/LazyLoaderBase'
], function (declare, Toolbar, domClass, LazyLoaderBase) {
	return declare('Sidebar', [Toolbar, LazyLoaderBase], {
		args: null,
		_buttonWidgets: null,

		constructor: function (args) {
			this.args = args;
			this._buttonWidgets = {};
		},

		addChild: function (widget, insertIndex) {
			this.inherited(arguments);
			this._buttonWidgets[widget.id] = widget;
		},

		removeChild: function (widget) {
			this.inherited(arguments);

			if (widget) {
				var id = widget.id;
				widget.destroyRecursive();
				delete this._buttonWidgets[id];
			}
		},

		resize: function () {
			this.inherited(arguments);
			var keyedNameNode = this.domNode.querySelector('.sidebarKeyedName');
			if (keyedNameNode) {
				var width =
					this.domNode.offsetHeight - this.getChildren().length * 30 - 10;
				keyedNameNode.style.width = width + 'px';
			}
		},

		getButtonWidgetById: function (widgetId) {
			var result = null;
			if (widgetId === 'show_form') {
				result = this._buttonWidgets[widgetId];
			}

			for (var id in this._buttonWidgets) {
				if (id.indexOf('button_' + widgetId) !== -1) {
					result = this._buttonWidgets['button_' + widgetId];
				} else {
					var dropDown = this._buttonWidgets[id].dropDown;
					if (dropDown) {
						var childs = dropDown.getChildren();
						for (var i = 0, l = childs.length; i < l; i++) {
							if (childs[i].id.indexOf(widgetId) !== -1) {
								if (id !== 'allFilesDropDown') {
									result = this._buttonWidgets[id];
								}
								childs[i].set('checked', true);
							} else {
								childs[i].set('checked', false);
								if (
									widgetId === 'show_form' &&
									childs[i].id === 'ssvc-form-RadioButtonMenuItem'
								) {
									childs[i].set('checked', true);
								}
							}
						}
					}
				}
			}
			return result;
		},

		setWidgetSelected: function (widgetObj) {
			const sidebar = this;
			const id = widgetObj.id === 'formTab' ? 'show_form' : widgetObj.id;
			const _widget = this.getButtonWidgetById(id);
			let formIconNode;

			this.getChildren().forEach(function (widget) {
				domClass.remove(widget.domNode, 'ssv-button-active');

				if (widget.disabledButtonImage) {
					sidebar.switchSidebarButton(
						widget.id,
						widget.disabledButtonImage,
						false
					);
				}
				if (widget.id === 'show_form') {
					formIconNode = widget.domNode.querySelector('.sidebarButtonFormIcon');
					formIconNode.style.backgroundImage =
						"url('../images/ShowFormOff.svg')";
				}
			});

			if (_widget) {
				domClass.add(_widget.domNode, 'ssv-button-active');

				if (_widget.id === 'show_form') {
					formIconNode.style.backgroundImage =
						"url('../images/ShowFormOn.svg')";
				}
			}
		},

		switchSidebarButton: function (buttonId, icon, enable) {
			var btn = this.getChildren().filter(function (btn) {
				return btn.id === buttonId;
			});
			if (!(btn && btn.length)) {
				return;
			}

			if (enable) {
				// turn off some current active btn(s)
				var activeButtons = this.domNode.getElementsByClassName(
					'ssv-button-active'
				);
				for (var i = activeButtons.length - 1; i >= 0; --i) {
					// live collection
					activeButtons[i].classList.add('sidebarButtonDisabled');
					activeButtons[i].classList.remove('ssv-button-active');
				}

				btn[0].domNode.classList.remove('sidebarButtonDisabled');
				btn[0].domNode.classList.add('ssv-button-active');
			} else {
				btn[0].domNode.classList.remove('ssv-button-active');
				btn[0].domNode.classList.add('sidebarButtonDisabled');
			}

			btn[0].domNode.querySelector('.dijitIcon').style.backgroundImage =
				"url('" + icon + "')";
		}
	});
});
