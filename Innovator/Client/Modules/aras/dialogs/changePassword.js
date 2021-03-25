import Dialog from '../../core/Dialog';
import getResource from '../../core/resources';
import { jsonToXml } from '../../core/XmlToJson';
import alertModule from '../../components/alert';
import { createButton } from '../../components/dialogCommonApi';

export default (type, options = {}) => {
	const data = {
		changePassword: {
			title: getResource('common.change_pwd'),
			oldLabel: getResource('common.old_pwd'),
			newLabel: getResource('common.new_pwd'),
			confirmLabel: getResource('common.confirm_pwd'),
			confirmationError: getResource('common.check_pwd_confirmation'),
			emptyError: getResource('common.pwd_empty'),
			checkEmpty: true,
			validationCallback: (oldHash, newHash) => {
				const requestData = `
					<old_password>${oldHash}</old_password>
					<new_password>${newHash}</new_password>
				`;

				return sendRequest(requestData, { method: 'ChangeUserPassword' });
			}
		},
		changeESignature: {
			title: getResource('mainmenu.change_sign'),
			oldLabel: getResource('mainmenu.old_sign'),
			newLabel: getResource('mainmenu.new_sign'),
			confirmLabel: getResource('mainmenu.confirm_sign'),
			confirmationError: getResource('mainmenu.check_sign_confirmation'),
			validationCallback: (oldHash, newHash) => {
				const requestData = jsonToXml({
					Item: {
						'@attrs': {
							type: 'Method',
							action: 'UpdateUserESignature'
						},
						oldHash: oldHash,
						newHash: newHash
					}
				});

				return sendRequest(requestData);
			}
		},
		passwordExpired: {
			title: getResource('common.pwd_expired'),
			varsToCheckPwdPolicy: options.varsToCheckPwdPolicy,
			codeToCheckPwdPolicy: options.codeToCheckPwdPolicy
		}
	};
	data.passwordExpired = {
		...data.changePassword,
		...data.passwordExpired
	};

	if (type === 'changePassword') {
		const methodName = 'User_pwd_checkPolicy';
		const methodNode = aras.MetadataCache.GetClientMethodNd(methodName, 'name');
		const codeToCheckPwdPolicy = aras.getItemProperty(
			methodNode,
			'method_code'
		);
		data.changePassword = {
			...data.changePassword,
			codeToCheckPwdPolicy
		};
	}
	const dialogParameters = data[type];
	const title = dialogParameters.title;
	const classList = 'aras-dialog-change-password';
	const dialog = new Dialog('html', { title, classList });
	const dialogState = {
		oldValue: {
			autofocus: true,
			autocomplete: 'new-password',
			label: dialogParameters.oldLabel,
			value: '',
			focus: false
		},
		newValue: {
			label: dialogParameters.newLabel,
			value: '',
			focus: false
		},
		confirmValue: {
			label: dialogParameters.confirmLabel,
			value: '',
			focus: false
		}
	};
	const render = () => {
		const nodes = Object.entries(dialogState).map(([key, item]) => {
			const onconnected = item.focus ? (e) => e.target.focus() : null;
			return HyperHTMLElement.hyper`
				<label class="aras-dialog-change-password__label">
					${item.label}
					<input
						type="password"
						class="aras-input"
						name="${key}"
						autofocus="${item.autofocus}"
						autocomplete="${item.autocomplete}"
						value="${item.value}"
						onconnected="${onconnected}"
						onInput="${(event) => {
							dialogState[key] = {
								...item,
								value: event.target.value
							};
						}}"
					/>
				</label>
			`;
		});

		const okButtonClassList = 'aras-button_primary aras-buttons-bar__button';
		const okButtonHandler = async () => {
			const validateObject = await validate(dialogState, dialogParameters);
			if (!validateObject.valid) {
				await alertModule(validateObject.errorMessage, { type: 'error' });
				const state =
					validateObject.type === 'passwordPolicyError'
						? {
								value: '',
								focus: true
						  }
						: { focus: true };
				updateDialogState('newValue', state);
				return;
			}

			const hash = await setHash(dialogState, dialogParameters);
			if (hash !== null) {
				dialog.close(hash);
				return;
			}

			updateDialogState('oldValue', { focus: true });
		};
		const okButton = createButton(
			getResource('common.ok'),
			okButtonClassList,
			okButtonHandler
		);
		const cancelButtonClassList = 'aras-button_secondary-light';
		const cancelButton = createButton(
			getResource('common.cancel'),
			cancelButtonClassList,
			() => dialog.close()
		);

		HyperHTMLElement.hyper(dialog.contentNode)`
			${nodes}
			<div class="aras-buttons-bar aras-buttons-bar_right">
				${okButton}${cancelButton}
			</div>
		`;
	};
	const updateDialogState = (key, state) => {
		Object.entries(dialogState).forEach(([currentKey, item]) => {
			dialogState[currentKey] = {
				...item,
				focus: false
			};
		});
		dialogState[key] = {
			...dialogState[key],
			...state
		};

		render();
	};

	render();
	dialog.show();

	return dialog.promise;
};

const validate = async (dialogState, dialogParameters) => {
	if (dialogParameters.checkEmpty && dialogState.newValue.value === '') {
		return {
			valid: false,
			errorType: 'emptyError',
			errorMessage: dialogParameters.emptyError
		};
	}

	if (dialogState.newValue.value !== dialogState.confirmValue.value) {
		return {
			valid: false,
			errorType: 'confirmationError',
			errorMessage: dialogParameters.confirmationError
		};
	}

	const codeToCheckPwdPolicy = dialogParameters.codeToCheckPwdPolicy;
	if (codeToCheckPwdPolicy) {
		const checkPlainPwdPolicy = new Function(
			'plainPwd',
			'variablesXML',
			codeToCheckPwdPolicy
		);
		const message = checkPlainPwdPolicy(
			dialogState.newValue.value,
			dialogParameters.varsToCheckPwdPolicy
		);
		if (message) {
			const error = getResource(
				'changemd5dialog.new_pwd_is_not_set_msg',
				message
			);
			return {
				valid: false,
				errorType: 'passwordPolicyError',
				errorMessage: error
			};
		}
	}

	return { valid: true };
};

const calculateHash = async (value) => {
	if (aras.getVariable('fips_mode') === 'true') {
		// eslint-disable-next-line new-cap
		return ArasModules.cryptohash.SHA256(value);
	}

	return aras.calcMD5(value);
};

const setHash = async (dialogState, dialogParameters) => {
	const hash = await calculateHash(dialogState.newValue.value);
	const validationCallback = dialogParameters.validationCallback;
	if (!validationCallback) {
		return hash;
	}

	const oldValue = dialogState.oldValue.value;
	const oldHash = oldValue ? await calculateHash(oldValue) : '';
	const isValid = await validationCallback(oldHash, hash);
	return isValid ? hash : null;
};

const sendRequest = async (requestData, options = {}) => {
	try {
		await ArasModules.soap(requestData, {
			...options,
			async: true,
			url: aras.getServerURL()
		});

		return true;
	} catch (error) {
		const item = aras.newIOMItem();
		item.loadAML(error.responseText);
		await alertModule(item.getErrorString(), { type: 'error' });

		return false;
	}
};
