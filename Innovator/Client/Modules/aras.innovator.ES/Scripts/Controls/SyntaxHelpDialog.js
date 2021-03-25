define([
	'dojo',
	'dojo/_base/declare',
	'dojo/_base/lang',
	'dijit/_WidgetBase',
	'dijit/_TemplatedMixin',
	'dijit/TooltipDialog',
	'dijit/popup',
	'ES/Scripts/Classes/Utils',
	'dojo/text!./../../Views/Templates/SyntaxHelp.html'
], function (
	dojo,
	declare,
	lang,
	_WidgetBase,
	_TemplatedMixin,
	TooltipDialog,
	popup,
	Utils,
	SyntaxHelpTemplate
) {
	return declare([_WidgetBase, _TemplatedMixin], {
		_tooltipDialog: null,
		_popupDialog: null,

		templateString: '',

		constructor: function (args) {
			this._arasObj = args.arasObj;
			this._utils = new Utils({
				arasObj: this._arasObj
			});

			var syntaxHelpResourceKeys = [
				'syntax.title',
				'syntax.and_description',
				'syntax.or_description',
				'syntax.not_description',
				'syntax.not_sub_description',
				'syntax.plus_description',
				'syntax.plus_sub_description',
				'syntax.minus_description',
				'syntax.minus_sub_description',
				'syntax.parenthesis_description',
				'syntax.multiply_description',
				'syntax.question_description',
				'syntax.tilda_description',
				'syntax.tilda_sub_description',
				'syntax.proximity_description',
				'syntax.proximity_sub_description',
				'syntax.boosting_description',
				'syntax.boosting_sub_description',
				'syntax.phrase_description'
			];

			var syntaxHelpResourceValues = this._utils.getResourceValueByKey(
				syntaxHelpResourceKeys
			);

			this.templateString = lang.replace(
				SyntaxHelpTemplate,
				syntaxHelpResourceValues
			);
		},

		postCreate: function () {
			this._tooltipDialog = new TooltipDialog({
				content: this.domNode,
				class: 'syntaxHelpTooltip noConnector',
				baseClass: 'fullWindow'
			});
		},

		/**
		 * Show dialog
		 */
		show: function () {
			popup.open({
				popup: this._tooltipDialog,
				x: 0,
				y: 0,
				onCancel: function () {
					this.hide();
				}.bind(this)
			});

			this._popupDialog = popup.getTopPopup();
		},

		/**
		 * Hide dialog
		 */
		hide: function () {
			this._popupDialog.widget.destroyRecursive();
		},

		/*------------------------------------------------------------------------------------------------------------*/
		//Event handlers

		_onSyntaxHelpCloseClickEventHandler: function () {
			this.hide();
		}
	});
});
