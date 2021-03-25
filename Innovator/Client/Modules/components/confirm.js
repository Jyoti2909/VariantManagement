import Dialog from '../core/Dialog';
import { createButton } from './dialogCommonApi';
import SvgManager from '../core/SvgManager';
import getResource from '../core/resources';

const images = {
	warning: '../images/Warning.svg'
};

SvgManager.enqueue(Object.values(images));

function confirmModule(message = '', options = {}) {
	const {
		additionalButton = [],
		cancelButtonModifier = 'aras-button_secondary-light',
		cancelButtonText = getResource('common.cancel'),
		okButtonModifier = 'aras-button_primary',
		okButtonText = getResource('common.ok'),
		title = getResource('common.confirm_title'),
		image = images.warning,
		buttonsOrdering = []
	} = options;
	const cssClassName = 'aras-dialog-confirm';
	const confirmDialog = new Dialog('html', {
		classList: cssClassName,
		title
	});
	const imageNode = SvgManager.createHyperHTMLNode(image, {
		class: `${cssClassName}__img`
	});
	const buttonsMap = new Map([
		...additionalButton.map((button) => [button.actionName, button]),
		[
			'ok',
			{
				actionName: 'ok',
				buttonModifier: okButtonModifier,
				text: okButtonText,
				options: { autofocus: true }
			}
		],
		[
			'cancel',
			{
				actionName: 'cancel',
				buttonModifier: cancelButtonModifier,
				text: cancelButtonText
			}
		]
	]);
	const orderedNames = buttonsOrdering.length
		? buttonsOrdering
		: [...buttonsMap.keys()];
	const buttonNodes = orderedNames.map((actionName) => {
		const button = buttonsMap.get(actionName);
		const { buttonModifier, text, options } = button;

		return createButton(
			text,
			buttonModifier || 'aras-button_secondary',
			() => confirmDialog.close(actionName),
			options
		);
	});
	const html = HyperHTMLElement.hyper(confirmDialog.contentNode);

	html`
		<div class="${cssClassName + '__container'}">
			${imageNode}
			<span class="${cssClassName + '__text'}">${message}</span>
		</div>
		<div class="${cssClassName + '__container'}">
			${buttonNodes}
		</div>
	`;

	confirmDialog.show();
	return confirmDialog.promise;
}

export default confirmModule;
