import Dialog from '../../core/Dialog';
import getResourceManager from '../startup/getResourceManager';
import SvgManager from '../../core/SvgManager';

const images = {
	warning: '../images/Warning.svg'
};

SvgManager.enqueue(Object.values(images));

const notCertifiedBrowser = () => {
	const resourceManager = getResourceManager('core');
	const title = resourceManager.getString('common.warning');
	const dialog = new Dialog('html', { title });

	dialog.dialogNode.classList.add(
		'aras-dialog-alert',
		'aras-dialog_not-certified-browser'
	);

	const onContinueClick = () => {
		const rememberChoice = dialog.contentNode.querySelector(
			'input[type="checkbox"]'
		).checked;
		dialog.close(rememberChoice);
	};
	const imageNode = SvgManager.createHyperHTMLNode(images.warning, {
		class: 'aras-dialog-alert__img'
	});
	HyperHTMLElement.bind(dialog.contentNode)`
		<div class="aras-dialog-alert__container">
			${imageNode}
			<span class="aras-dialog-alert__text">${resourceManager.getFormatedString(
				'system_requirements.certification_browser_notification',
				aras.Browser.getBrowserName()
			)}</span>
		</div>
		<div class="aras-dialog-alert__container aras-dialog_not-certified-browser__controls_container">
			<label class="aras-checkbox">
				<input class="aras-checkbox__input" type="checkbox">
				<span class="aras-checkbox__check-button"></span>
				${resourceManager.getString(
					'system_requirements.certification_browser_decision_label'
				)}
			</label>
			<button autofocus="" onclick="${onContinueClick}" class="aras-button aras-button_primary">
				<span class="aras-button__text">${resourceManager.getString(
					'common.continue'
				)}</span>
			</button>
		</div>
	`;

	dialog.dialogNode.addEventListener('cancel', (event) => {
		event.preventDefault();
	});

	dialog.show();

	return dialog.promise;
};

export default notCertifiedBrowser;
