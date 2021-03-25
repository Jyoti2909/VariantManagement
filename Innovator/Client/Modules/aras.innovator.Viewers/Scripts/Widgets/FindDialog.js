VC.Utils.Page.LoadModules([
	'Controls/TextBox',
	'Controls/mtButton',
	'Controls/Checkbox',
	'Widgets/Dialog'
]);

require(['dojo/_base/declare', 'dojo/_base/lang'], function (declare, lang) {
	return dojo.setObject(
		'VC.Widgets.FindDialog',
		dojo.declare([VC.Widgets.Dialog], {
			dialogName: 'find',

			postCreate: function () {
				this.inherited(arguments);

				this.textBoxFind.Text.setAttribute('tabIndex', '-1');

				this.textBoxFind.changeText = lang.hitch(this, this._findText);
				this.buttonNextMatch.onClick = lang.hitch(this, this._findNextMatch);
				this.checkboxMatchCase.onChange = lang.hitch(
					this,
					this._changeMatchCase
				);

				VC.Utils.addClass(this.paneContent, 'FindDialogContainer');

				Object.defineProperty(this, 'searchValue', {
					get: function () {
						return this.textBoxFind.Text.displayedValue;
					}
				});

				Object.defineProperty(this, 'isTextChanged', {
					get: function () {
						return this.textBoxFind.isTextChanged;
					},
					set: function (value) {
						this.textBoxFind.isTextChanged = value;
					}
				});

				Object.defineProperty(this, 'isMatchCase', {
					get: function () {
						return this.checkboxMatchCase.isChecked;
					}
				});
			},

			onFindText: function () {},
			onFindNextMatch: function () {},
			onChangeMatchCase: function () {},

			_findText: function () {
				this.onFindText(arguments);
			},

			_findNextMatch: function () {
				this.onFindNextMatch(arguments);
			},

			_changeMatchCase: function () {
				this.onChangeMatchCase(arguments);
			}
		})
	);
});
