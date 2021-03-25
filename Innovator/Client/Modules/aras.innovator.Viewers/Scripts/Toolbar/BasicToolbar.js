VC.Utils.Page.LoadModules([
	'Toolbar/BasicNumberTextBox',
	'Interfaces/IViewerToolbar'
]);

require([
	'dojo/_base/fx',
	'dojo/dom',
	'dojo/query',
	'dojo/dom-construct',
	'dojo/_base/lang',
	'dojo/dom-style',
	'dojo/on',
	'dijit/_WidgetBase',
	'dijit/_TemplatedMixin',
	'dijit/_WidgetsInTemplateMixin',
	'dojo/dom-attr',
	'dojo/text!../styles/toolbar_constructor.xslt',
	'dojo/text!../styles/commandToBasicXml_constructor.xslt',
	'dojo/_base/declare'
], function (
	baseFx,
	dom,
	query,
	domConstruct,
	lang,
	domStyle,
	on,
	_WidgetBase,
	_TemplatedMixin,
	_WidgetsInTemplateMixin,
	domAttr,
	xslt,
	commandToBasicXslt,
	declare
) {
	function bindToolbarTemplate(tbID) {
		var topWindow = aras.getMostTopWindowWithAras(window);
		var items = topWindow.cui.dataLoader.loadCommandBar(tbID, {
			locationName: tbID
		});
		var xml = '';
		if (items.dom) {
			xml = items.dom.xml;
		} else {
			xml = Array.prototype.map
				.call(items, function (item) {
					return item.xml;
				})
				.join('');
			xml = '<Result>' + xml + '</Result>';
		}
		xml = VC.Utils.convertXsltToHtml(xml, commandToBasicXslt, tbID);
		var htmlTmplate = VC.Utils.convertXsltToHtml(xml, xslt, tbID);

		return htmlTmplate;
	}

	return dojo.setObject(
		'VC.Toolbar.BasicToolbar',
		declare(
			[
				VC.Interfaces.IViewerToolbar,
				_WidgetBase,
				_TemplatedMixin,
				_WidgetsInTemplateMixin
			],
			{
				templateString: '',
				widgetsInTemplate: true,
				isOpened: null,

				_hideHandler: null,

				onPalleteButtonClick: function (btn, paletteName) {},

				constructor: function (toolbarName) {
					var tbstr = bindToolbarTemplate(toolbarName);
					if (!tbstr) {
						throw new Error(VC.Utils.StaticStr.undefinedToolbarError);
					}
					this.id = toolbarName + 'Container' + VC.Utils.getTimestampString();
					this.name = toolbarName;

					this.templateString = tbstr;
				},

				postCreate: function () {
					//need place the svgFilter in DOM, in another way the filter will not work;
					var svgFilter = document.createElement('div');
					svgFilter.innerHTML =
						'<svg xmlns="http://www.w3.org/2000/svg" version="1.1">' +
						'<def><filter id="ToolBarGrayFilter"><feColorMatrix type="saturate" values="0" /></filter></def>' +
						'</svg>';
					svgFilter.style.width = 0;
					svgFilter.style.height = 0;
					svgFilter.style.display = 'none';
					this.domNode.appendChild(svgFilter);

					this.hide();
				},

				bindButtonBehaviour: function (btnEventName, eventHandler) {
					var btnName = null;
					if (btnEventName.indexOf('Click') !== -1) {
						btnName = btnEventName.replace('Click', '');
					} else if (btnEventName.indexOf('Change') !== -1) {
						btnName = btnEventName.replace('Change', '');
					}

					if (btnName && this[btnName]) {
						var type = this[btnName].type;

						switch (type) {
							case VC.Utils.Enums.ToolbarElementType.Button:
							case VC.Utils.Enums.ToolbarElementType.PaletteButton:
								this[btnName].onClick = eventHandler;
								break;
							case VC.Utils.Enums.ToolbarElementType.NumberTextbox:
								this[btnName].onChange = eventHandler;
								break;
						}
					}
				},

				enableBtn: function (btnName) {
					var button = this[btnName];

					if (button) {
						button.Enable();
					}
				},

				disableBtn: function (btnName) {
					var button = this[btnName];

					if (button) {
						button.Disable();
					}
				},

				pressBtn: function (btnName) {
					this[btnName].SetPressedState(true);
				},

				unpressBtn: function (btnName) {
					this[btnName].SetPressedState(false);
				},

				show: function () {
					query('.ViewerToolbarContainer').addClass(
						VC.Utils.Constants.cssClasses.hiddenClass
					);
					dojo.removeClass(
						this.domNode,
						VC.Utils.Constants.cssClasses.hiddenClass
					);
					this.isOpened = true;
				},

				hide: function () {
					dojo.addClass(
						this.domNode,
						VC.Utils.Constants.cssClasses.hiddenClass
					);
					query('.MenuButtonContainer').addClass(
						VC.Utils.Constants.cssClasses.hiddenClass
					);
					this.isOpened = false;
				},

				resumeToolbarLeaving: function () {
					if (this._hideHandler) {
						this._hideHandler.resume();
					}
				},

				assignElementStatesTo: function (targetToolbar) {
					var buttonName = null;

					for (var i = 0; i < this._attachPoints.length; i++) {
						buttonName = this._attachPoints[i];

						if (targetToolbar[buttonName]) {
							this[buttonName].assignStateTo(targetToolbar[buttonName]);
						}
					}
				}
			}
		)
	);
});
