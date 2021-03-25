define([
	'dojo/_base/declare',
	'dojo/_base/lang',
	'dijit/_WidgetBase',
	'dijit/_TemplatedMixin',
	'ES/Scripts/Classes/Utils',
	'ES/Scripts/Controls/ResultItem',
	'dojo/text!./../../Views/Templates/ResultPanel.html'
], function (
	declare,
	lang,
	_WidgetBase,
	_TemplatedMixin,
	Utils,
	ResultItem,
	resultPanelTemplate
) {
	return declare([_WidgetBase, _TemplatedMixin], {
		arasObj: null,

		items: [],
		widgets: [],

		templateString: '',
		baseClass: 'resultItem',

		_modifiedInfoTextResource: '',
		_propertiesTextResource: '',
		_currentTextResource: '',
		_notCurrentTextResource: '',
		_showDetailsTextResource: '',
		_hideDetailsTextResource: '',
		_nothingFoundTextResource: '',

		_messageTemplateString: '<div class="es-message info">{0}</div>',

		constructor: function (args) {
			this._arasObj = args.arasObj;
			this._utils = new Utils({
				arasObj: this._arasObj
			});

			this._modifiedInfoTextResource = this._utils.getResourceValueByKey(
				'results.modified_info'
			);
			this._propertiesTextResource = this._utils.getResourceValueByKey(
				'results.properties'
			);
			this._currentTextResource = this._utils.getResourceValueByKey(
				'results.current'
			);
			this._notCurrentTextResource = this._utils.getResourceValueByKey(
				'results.not_current'
			);
			this._showDetailsTextResource = this._utils.getResourceValueByKey(
				'results.show_details'
			);
			this._hideDetailsTextResource = this._utils.getResourceValueByKey(
				'results.hide_details'
			);
			this._nothingFoundTextResource = this._utils.getResourceValueByKey(
				'message.nothing_found'
			);
			this._moreTextResource = this._utils.getResourceValueByKey(
				'results.more'
			);
			this._lessTextResource = this._utils.getResourceValueByKey(
				'results.less'
			);

			this.templateString = resultPanelTemplate;
		},

		postCreate: function () {
			this.domNode.innerHTML = lang.replace(this._messageTemplateString, [
				this._utils.getResourceValueByKey('message.blank_search')
			]);
			this.domNode.addEventListener('click', this.repositionContent.bind(this));
		},

		update: function () {
			var self = this;

			//Destroy old widgets
			this.widgets.forEach(function (widget) {
				widget.destroy();
			});
			this.widgets = [];

			//Create new widgets
			var docFragment = document.createDocumentFragment();

			this.domNode.innerHTML =
				this.items.length > 0
					? ''
					: lang.replace(this._messageTemplateString, [
							this._nothingFoundTextResource
					  ]);

			this.items.forEach(function (item) {
				var widget = new ResultItem({
					arasObj: self._arasObj,
					item: item,
					modifiedInfoTextResource: self._modifiedInfoTextResource,
					propertiesTextResource: self._propertiesTextResource,
					currentTextResource: self._currentTextResource,
					notCurrentTextResource: self._notCurrentTextResource,
					showDetailsTextResource: self._showDetailsTextResource,
					hideDetailsTextResource: self._hideDetailsTextResource,
					moreTextResource: self._moreTextResource,
					lessTextResource: self._lessTextResource
				});
				docFragment.appendChild(widget.domNode);

				self.widgets.push(widget);
			});

			this.domNode.appendChild(docFragment);

			if (!this._utils.isNullOrUndefined(this.domNode.parentElement)) {
				this.domNode.parentElement.scrollTop = 0;
			}

			this.repositionContent();
		},

		repositionContent: function () {
			if (!this._utils.isNullOrUndefined(this.domNode.parentElement)) {
				if (
					this.domNode.parentElement.scrollHeight >
					this.domNode.parentElement.clientHeight
				) {
					this.domNode.style.paddingLeft =
						this._utils.getBrowserScrollWidth() + 'px';
				} else {
					this.domNode.style.paddingLeft = '0';
				}
			}
		}
	});
});
