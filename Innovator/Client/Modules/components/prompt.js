import Dialog from '../core/Dialog';
import { createButton } from './dialogCommonApi';
import getResource from '../core/resources';

const { wire, bind } = HyperHTMLElement;
function promptModule(
	label = getResource('common.prompt_label'),
	options = {}
) {
	const {
		cancelButtonModifier = 'aras-button_secondary-light',
		okButtonModifier = 'aras-button_primary aras-buttons-bar__button',
		okButtonText = getResource('common.ok'),
		title = getResource('common.prompt_title'),
		defaultValue = null,
		required = false,
		pattern = null,
		dialogClassModifier
	} = options;
	const cssClassName = 'aras-dialog-prompt';
	const promptDialog = new Dialog('html', {
		classList: cssClassName,
		title
	});
	if (dialogClassModifier) {
		promptDialog.dialogNode.classList.add(dialogClassModifier);
	}
	const okBtn = createButton(okButtonText, okButtonModifier, () =>
		promptDialog.close(input.value)
	);
	const cancelBtn = createButton(
		getResource('common.cancel'),
		cancelButtonModifier,
		() => promptDialog.close(null)
	);
	const checkValidity = () => {
		if (required || pattern) {
			okBtn.disabled = !input.validity.valid;
		}
	};
	const onKeyPress = (event) => {
		if (event.code === 'Enter' && input.validity.valid) {
			promptDialog.close(input.value);
		}
	};
	const onInput = required || pattern ? checkValidity : null;
	const labelClass = `${cssClassName}__label`;
	const inputClass = `${cssClassName}__input aras-input`;
	const input = wire()`<input 
		class="${inputClass}" 
		pattern="${pattern}" 
		value="${defaultValue}"
		onInput="${onInput}" 
		onKeyPress="${onKeyPress}" 
		required="${required}" 
		autofocus>`;
	bind(promptDialog.contentNode)`
		<label class="${labelClass}">${label}${input}</label>
		<div class="aras-buttons-bar aras-buttons-bar_right">
			${okBtn}${cancelBtn}
		</div>
	`;
	checkValidity();

	promptDialog.show();
	return promptDialog.promise;
}

export default promptModule;
