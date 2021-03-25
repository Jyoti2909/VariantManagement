VC.Utils.Page.LoadWidgets(['Moveable']);

require([
	'dojo/_base/declare',
	'dijit/_WidgetBase',
	'dijit/_TemplatedMixin',
	'dijit/_WidgetsInTemplateMixin',
	'dojo/text!../Views/PasswordDialog.html'
], function (
	declare,
	_WidgetBase,
	_TemplatedMixin,
	_WidgetsInTemplateMixin,
	dialogTemplate
) {
	var passwordTries = 0;
	var tryingPassword = false;

	var onPasswordChange = function (password) {};

	var inputKeyPressHandler = function (e) {
		if (e.which === VC.Utils.Enums.AffectedKey.ENTER) {
			this.passwordDialogOk.click();
		}
	};

	var buttonOkClickHandler = function () {
		if (!this.finishedPassword) {
			tryingPassword = true;
			this.hide();
			onPasswordChange(this.passwordInput.value);
		} else {
			this.hide();
		}
	};

	var buttonCancelClickHandler = function () {
		this.hide();
	};

	return dojo.setObject(
		'VC.Widgets.PasswordDialog',
		declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
			widgetsInTemplate: true,
			templateString: '',
			owner: document.getElementsByClassName('Wrap')[0],
			finishedPassword: false,
			tryingCount: 3,

			constructor: function () {
				this.templateString = dialogTemplate;
			},

			postCreate: function () {
				var moveable = new VC.Widgets.Moveable(
					this.owner,
					this.passwordDialog,
					this.passwordDialogTitle
				);
				this.placeAt(this.owner);

				this.passwordInput.addEventListener(
					'keypress',
					dojo.hitch(this, inputKeyPressHandler)
				);
				this.passwordButtonOk.addEventListener(
					'click',
					dojo.hitch(this, buttonOkClickHandler)
				);
				this.passwordButtonCancel.addEventListener(
					'click',
					dojo.hitch(this, buttonCancelClickHandler)
				);
				this.passwordButtonClose.addEventListener(
					'click',
					dojo.hitch(this, buttonCancelClickHandler)
				);
			},

			getPassword: function (passwordCallback) {
				onPasswordChange = passwordCallback;
				tryingPassword = false;
				this.finishedPassword = passwordTries >= this.tryingCount;
				this.passwordError.textContent = '';

				if (passwordTries === 0) {
					this.show();
				} else if (this.finishedPassword) {
					VC.Utils.AlertWarning(
						VC.Utils.GetResource('encrypted_attempts_exceeded')
					);
				} else {
					this.passwordInput.value = '';
					this.passwordError.textContent = VC.Utils.GetResource(
						'incorrect_password'
					);
					this.show();
				}

				++passwordTries;
			},

			show: function () {
				this.passwordDialog.style.display = 'block';
			},

			hide: function () {
				if (!tryingPassword) {
					VC.Utils.AlertWarning(
						VC.Utils.GetResource('encrypted_user_cancelled')
					);
				}

				this.passwordDialog.style.display = 'none';
			}
		})
	);
});
