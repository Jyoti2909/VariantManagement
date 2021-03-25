define([
	'dojo/_base/declare',
	'dijit/_WidgetBase',
	'dijit/_TemplatedMixin',
	'dojo/_base/lang',
	'ES/Scripts/Classes/Utils',
	'dojo/text!./../../Views/Templates/ActiveFilterChip.html'
], function (
	declare,
	_WidgetBase,
	_TemplatedMixin,
	lang,
	Utils,
	filterChipTemplate
) {
	return declare([_WidgetBase, _TemplatedMixin], {
		_filterIndex: 0,
		_filterOptionName: '',
		_filterOptionLabel: '',
		_onRemoveFilterChip: null,

		templateString: '',

		constructor: function (args) {
			this._arasObj = args.arasObj;
			this._utils = new Utils({
				arasObj: this._arasObj
			});

			this._filterIndex = args.filterIndex;
			this._filterOptionName = args.filterOptionName;
			this._filterOptionLabel = args.filterOptionLabel;
			this._onRemoveFilterChip = args.onRemoveFilterChip;

			this.templateString = lang.replace(filterChipTemplate, [
				this._filterOptionLabel
			]);
		},

		/*------------------------------------------------------------------------------------------------------------*/
		//Event handlers

		_onRemoveFilterChipClickEventHandler: function () {
			if (!this._utils.isNullOrUndefined(this._onRemoveFilterChip)) {
				this._onRemoveFilterChip(this._filterIndex, this._filterOptionName);
			}
		}
	});
});
