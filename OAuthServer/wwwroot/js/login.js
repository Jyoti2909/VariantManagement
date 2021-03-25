const loginPage = {
	initialize: function() {
		this._fixupWindowedSelects();
		this._initPageSettings();
		this._initAuthenticationTypeField();
		this._initLocalAuthenticationFields();
		this._setInitialFocus();
		this._setFocusToSelectsOnMouseDown();
	},

	_initPageSettings: function() {
		const self = this;
		if (document.msCapsLockWarningOff === false) {
			document.msCapsLockWarningOff = true;
		}

		document.oncontextmenu = function() {
			return false;
		};

		document.onkeypress = function(e) {
			if (!e) {
				e = window.event;
			}

			if (e.keyCode === 13) {
				e.preventDefault();
				if (self._isLocalAuthenticationType()) {
					const username = self._getUsername();
					const password = self._getPassword();
					const element = e.srcElement || e.target;

					if (element.id === 'Username' && username && !password) {
						const passwordElement = this._getPasswordElement();
						passwordElement.focus();
					}

					if (element.id === 'Password' && !username && password) {
						const usernameElement = this._getUsernameElement();
						usernameElement.focus();
					}

					if (password !== '' && username !== '') {
						const loginButtonElement = document.getElementById('Login');
						loginButtonElement.click();
					}
				} else {
					const continueButtonElement = document.getElementById('Continue');
					continueButtonElement.click();
				}
			}
		};
	},

	_initAuthenticationTypeField: function() {
		const authenticationTypesElement = this._getAuthenticationTypeElement();
		this._handleAuthenticationTypeChange();
		authenticationTypesElement.addEventListener('change', loginPage._handleAuthenticationTypeChange);
	},

	_handleAuthenticationTypeChange: function() {
		const externalAuthenticationElement = document.getElementById('ExternalAuthentication');
		const localAuthenticationElement = document.getElementById('LocalAuthentication');
		const usernameInput = localAuthenticationElement.querySelector('input[name=Username]');
		const passwordInput = localAuthenticationElement.querySelector('input[type=password]');
		const encryptedPasswordInput = document.getElementById('EncryptedPassword');
		const isExternal = !loginPage._isLocalAuthenticationType();

		usernameInput.disabled = isExternal;
		passwordInput.disabled = isExternal;
		encryptedPasswordInput.disabled = isExternal;
		externalAuthenticationElement.hidden = !isExternal;
		localAuthenticationElement.hidden = isExternal;
	},

	_initLocalAuthenticationFields: function() {
		this._initUsernameElement();
		this._initPasswordElement();
		this._setHandlersForInvalidEvent();
		this._setHandlersForLoginForm();
	},

	_setHandlersForInvalidEvent: function () {
		const usernameElement = this._getUsernameElement();
		const passwordElement = this._getPasswordElement();
		usernameElement.addEventListener('invalid', loginPage._handleInvalidEvent);
		passwordElement.addEventListener('invalid', loginPage._handleInvalidEvent);
	},

	_setHandlersForLoginForm: function () {
		const loginFormElement = this._getLoginFormElement();
		loginFormElement.addEventListener('submit', loginPage._handleLoginFormSubmit);
	},

	_handleInvalidEvent: function (event) {
		if (loginPage._isLocalAuthenticationType()) {
			const element = event.target;
			element.classList.add('wrong');
			element.focus();
		}
	},

	_handleLoginFormSubmit: function (event) {
		if (!loginPage._validateAuthenticationCredentials()) {
			event.preventDefault();
			return false;
		}

		if (loginPage._isLocalAuthenticationType()) {
			loginPage._setEncryptedPassword();
		}
	},

	_getLoginFormElement: function () {
		return document.getElementById('LoginForm');
	},

	_getUsernameElement: function() {
		return document.getElementById('Username');
	},

	_getPasswordElement: function() {
		return document.getElementById('Password');
	},

	_getAuthenticationTypeElement: function() {
		return document.getElementById('AuthenticationType');
	},

	_getDatabaseElement: function () {
		return document.getElementById('Database');
	},

	_setEncryptedPassword: function() {
		const passwordElement = this._getPasswordElement();
		const encryptedPasswordElement = document.getElementById('EncryptedPassword');
		const publicKeyElement = document.getElementById('PublicKey');

		const crypt = new JSEncrypt();
		crypt.setPublicKey(publicKeyElement.textContent);

		// JSEncrypt contains an instability in rsa.js module
		// https://github.com/travist/jsencrypt/issues/100
		// The 'encrypt' function should return 'false' if incorrect RSA key was provided
		// or return the valid base64 string.
		// The workaround is to re-run the encryption if result is different from described above.
		let encryptedPassword;
		let attemptsCount = 0;
		do {
			attemptsCount++;

			// Notice that encrypt(value) function will be different for same values.
			// JSEncrypt is based on JSBN which in turn implements only PKCS#1 v1.5 padding type 2
			// https://github.com/travist/jsencrypt/blob/v2.1.0/lib/jsbn/rsa.js#L28-L61
			// The second type of this padding (RFC 2313 https://tools.ietf.org/html/rfc2313#section-8.1)
			// introduces random bytes that are removed after decryption because of marker bytes.
			encryptedPassword = crypt.encrypt(passwordElement.value);
		}
		while (
			encryptedPassword !== 'false' &&
			!this._isValidBase64String(encryptedPassword) &&
			attemptsCount <= 100)

		encryptedPasswordElement.value = encryptedPassword;
	},

	_isValidBase64String: function(inputStr) {
		function stringEndsWith(inputStr, search) {
			if (inputStr.endsWith) {
				return inputStr.endsWith(search);
			} else {
				return inputStr.indexOf(search, inputStr.length - search.length) > -1;
			}
		}

		return inputStr.length === 344 && stringEndsWith(inputStr, '==');
	},

	_initUsernameElement: function() {
		const usernameElement = this._getUsernameElement();
		usernameElement.onkeydown = function() {
			this.classList.remove('wrong');
		};
	},

	_initPasswordElement: function() {
		const self = this;
		const passwordElement = this._getPasswordElement();

		passwordElement.addEventListener('keypress', function(e) {
			const ctrlKey = e.ctrlKey;
			const shiftKey = e.shiftKey;
			const keyCode = e.keyCode || e.which;

			if (!ctrlKey && (((keyCode >= 65 && keyCode <= 90) && !shiftKey) || ((keyCode >= 97 && keyCode <= 122) && shiftKey))) {
				self._showTooltip(true);
			} else {
				if ((keyCode >= 65 && keyCode <= 90) || (keyCode >= 97 && keyCode <= 122)) {
					self._showTooltip(false);
				}
			}
		});

		passwordElement.addEventListener('keydown', function(e) {
			const keyCode = e.keyCode || e.which;
			if (20 === keyCode) {
				self._showTooltip(false);
			}
			passwordElement.classList.remove('wrong');
		});

		passwordElement.addEventListener('blur', function() {
			self._showTooltip(false);
		});
	},

	_showTooltip: function(show) {
		const tooltipElement = this._getPasswordElement().parentNode;

		if (tooltipElement) {
			tooltipElement.setAttribute('data-tooltip-show', show);
		}
	},

	_setInitialFocus: function() {
		if (this._isLocalAuthenticationType()) {
			const usernameElement = this._getUsernameElement();
			const passwordElement = this._getPasswordElement();

			if (this._getUsername() === '') {
				usernameElement.focus();
			} else {
				passwordElement.focus();
			}
		} else {
			const continueButtonElement = document.getElementById('Continue');
			continueButtonElement.focus();
		}
	},

	_isLocalAuthenticationType: function() {
		return this._getSelectedAuthenticationType() === 'local';
	},

	_setFocusToSelectsOnMouseDown: function () {
		// To fix IE11 issue
		// https://stackoverflow.com/questions/26802752/dropdown-width-increases-in-ie11-when-focus-is-in-textbox-with-a-placeholder
		// When the focus is outside <select> and click on the <select> dropdown then the dropdown's width is increased.
		const loginForm = this._getLoginFormElement();
		loginForm.addEventListener('mousedown', function (e) {
			if (e.target.nodeName === 'SELECT') {
				e.target.focus()
			}
		});
	},

	_getSelectedDatabase: function() {
		const databaseElement = this._getDatabaseElement();
		const selectedDatabaseElement = databaseElement.options[databaseElement.selectedIndex];
		if (selectedDatabaseElement) {
			return selectedDatabaseElement.value;
		}
		return '';
	},

	_getSelectedAuthenticationType: function() {
		const authenticationTypesElement = this._getAuthenticationTypeElement();
		const selectedAuthenticationTypeElement = authenticationTypesElement.options[authenticationTypesElement.selectedIndex];
		if (selectedAuthenticationTypeElement) {
			return selectedAuthenticationTypeElement.value;
		}
		return '';
	},

	_getUsername: function() {
		return this._getUsernameElement().value.trim();
	},

	_getPassword: function() {
		const passwordElement = this._getPasswordElement();
		return passwordElement.value;
	},

	_validateAuthenticationCredentials: function() {
		const database = this._getSelectedDatabase();
		const autenticationType = this._getSelectedAuthenticationType();
		const username = this._getUsername();
		const password = this._getPassword();
		let stat = 'ok';
		const errorElement = document.querySelector('.login-area__error');
		errorElement.classList.remove('login-area__error_visible');
		let errorType;

		if (database === '') {
			stat = this._getLocalizedMessage('login.missing_db_wrn');
			errorType = 'Database';
		} else if (autenticationType === '') {
			stat = this._getLocalizedMessage('login.missing_authentication_type_wrn');
			errorType = 'AuthenticationType';
		} else if (this._isLocalAuthenticationType() && username === '') {
			stat = this._getLocalizedMessage('login.missing_login_name_wrn');
			errorType = 'Username';
		} else if (this._isLocalAuthenticationType() && password === '') {
			stat = this._getLocalizedMessage('login.missing_pwd_wrn');
			errorType = 'Password';
		}

		if (stat === 'ok') {
			return true;
		} else {
			this._showError(stat, errorType);
			return false;
		}
	},

	_showError: function(text, type) {
		const errorElement = document.querySelector('.login-area__error');
		errorElement.classList.add('login-area__error_visible');
		errorElement.textContent = text;
		if (type) {
			const element = document.getElementById(type);
			if (element) {
				element.classList.add('wrong');
				element.focus();
			}
		}
	},

	_getLocalizedMessage: function(messageId) {
		const messageElement = document.getElementById(messageId);
		if (messageElement) {
			return messageElement.innerText;
		}
		return messageId;
	},

	_fixupWindowedSelects: function() {
		const selectElements = document.getElementsByTagName('select');

		Array.prototype.forEach.call(selectElements, this._fixupWindowedSelect.bind(this));
	},

	_fixupWindowedSelect: function (element) {
		if (!this._isBasedOnHTMLElement(element)) {
			const selectElementParent = element.parentElement;
			selectElementParent.classList.add("login-area__select_windowed-select");
			element.addEventListener = function (event, callback) {
				element.attachEvent('on' + event, callback);
			};
			element.classList = {
				add: function (className) {
					element.className += ' ' + className;
				}
			};
		};
	},

	_isBasedOnHTMLElement: function (element) {
		return element && element instanceof HTMLElement;
	}
};

window.loginPage = loginPage;
