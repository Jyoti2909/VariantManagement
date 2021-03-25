define([
	'dojo/_base/declare',
	'dojo/_base/lang',
	'dijit/_WidgetBase',
	'dijit/_TemplatedMixin',
	'ES/Scripts/Controls/SyntaxHelpDialog',
	'ES/Scripts/Classes/Utils',
	'dojo/text!./../../Views/Templates/SearchPanel.html'
], function (
	declare,
	lang,
	_WidgetBase,
	_TemplatedMixin,
	SyntaxHelpDialog,
	Utils,
	searchPanelTemplate
) {
	return declare([_WidgetBase, _TemplatedMixin], {
		_arasObj: null,
		_utils: null,

		_syntaxHelpDialog: null,

		_onSearch: null,

		templateString: '',

		constructor: function (args) {
			this._arasObj = args.arasObj;
			this._utils = new Utils({
				arasObj: this._arasObj
			});

			this._onSearch = args.onSearch;

			var runSearchHint = this._utils.getResourceValueByKey('hint.run_search');
			var searchButtonLabel = this._utils.getResourceValueByKey(
				'buttons.search'
			);

			this.templateString = lang.replace(searchPanelTemplate, [
				runSearchHint,
				searchButtonLabel
			]);
		},

		/**
		 * Get query text
		 *
		 * @returns {string}
		 */
		getQueryText: function () {
			return this._searchTextBox.value;
		},

		/**
		 * Set query text
		 *
		 * @param {string} value
		 */
		setQueryText: function (value) {
			this._searchTextBox.value = value;
		},

		/**
		 * Open syntax help dialog
		 *
		 */
		_openSyntaxHelpDialog: function () {
			this._syntaxHelpDialog = new SyntaxHelpDialog({
				arasObj: this._arasObj
			});
			this._syntaxHelpDialog.show();
		},

		/*------------------------------------------------------------------------------------------------------------*/
		//Event handlers

		_onSearchPanelSearchButtonClickEventHandler: function () {
			if (!this._utils.isNullOrUndefined(this._onSearch)) {
				this._onSearch();
			}
		},

		_onSyntaxHelpButtonClickEventHandler: function (ev) {
			this._openSyntaxHelpDialog();
			ev.stopPropagation();
		}
	});
});
