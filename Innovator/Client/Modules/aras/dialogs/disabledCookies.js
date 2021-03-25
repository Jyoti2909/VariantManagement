import Dialog from '../../core/Dialog';
import getResourceManager from '../startup/getResourceManager';
import SvgManager from '../../core/SvgManager';

const images = {
	error: '../images/Error.svg'
};

SvgManager.enqueue(Object.values(images));

const disabledCookies = () => {
	const resourceManager = getResourceManager('core');
	const title = resourceManager.getString(
		'system_requirements.failed_initialize_innovator'
	);
	const dialog = new Dialog('html', { title });

	dialog.dialogNode.classList.add(
		'aras-dialog-alert',
		'aras-dialog_disabled-cookies'
	);

	const message = resourceManager.getString(
		'login.cookies_are_disabled_msg_html'
	);
	const imageNode = SvgManager.createHyperHTMLNode(images.error, {
		class: 'aras-dialog-alert__img'
	});
	HyperHTMLElement.bind(dialog.contentNode)`
		<div class="aras-dialog-alert__container">
			${imageNode}
			<span class="aras-dialog-alert__text">${message}</span>
		</div>
	`;

	dialog.dialogNode.addEventListener('cancel', (event) => {
		event.preventDefault();
	});

	dialog.show();

	return dialog.promise;
};

export default disabledCookies;
