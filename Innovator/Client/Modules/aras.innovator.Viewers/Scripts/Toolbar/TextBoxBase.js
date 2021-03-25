var TextBoxBase = function () {
	this.textFormat = null; //must contain {0} marker
	this.onChange = function () {};

	Object.defineProperties(this, {
		textbox: {
			configurable: true,
			get: function () {
				throw new Error('textbox proterty should be overrided in descendant');
			}
		},
		value: {
			configurable: true,
			get: function () {
				throw new Error('value property should be overrided in descendant');
			},
			set: function (value) {
				throw new Error('value property should be overrided in descendant');
			}
		}
	});

	this.assignStateTo = function (targetTextBox) {
		if (targetTextBox) {
			targetTextBox.value = this.value;
		}
	};
};

TextBoxBase.prototype.bindEvents = function () {
	this.textbox.addEventListener(
		'keydown',
		dojo.hitch(this, function (e) {
			this._onTextChange(e);
		})
	);
	this.textbox.addEventListener(
		'focus',
		dojo.hitch(this, this._onTextBoxFocus)
	);
	this.textbox.addEventListener('blur', dojo.hitch(this, this._onTextBoxBlur));
};

TextBoxBase.prototype._onTextChange = function (e) {};

TextBoxBase.prototype._onTextBoxFocus = function (e) {};

TextBoxBase.prototype._onTextBoxBlur = function (e) {};

TextBoxBase.prototype.setLabelBefore = function (value) {};

TextBoxBase.prototype.setLabelAfter = function (value) {};

dojo.setObject('VC.Toolbar.TextBoxBase', TextBoxBase);
