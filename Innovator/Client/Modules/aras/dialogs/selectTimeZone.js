import Dialog from '../../core/Dialog';
import getResourceManager from '../startup/getResourceManager';
import { createButton } from '../../components/dialogCommonApi';

const selectTimeZone = (winTzNames) => {
	const resourceManager = getResourceManager('core');
	const title = resourceManager.getString('tz.select_time_zone');
	const dialog = new Dialog('html', { title });

	dialog.dialogNode.classList.add('aras-dialog_timezone-selector');
	const timeZonesSelect = HyperHTMLElement.hyper`
		<select title="${title}">
			${winTzNames.map((item) => `<option value="${item}">${item}</option>`)}
		</select>
	`;

	const acceptTimeZone = () => dialog.close(timeZonesSelect.value);
	const okButton = createButton(
		resourceManager.getString('common.ok'),
		'aras-button_primary aras-buttons-bar__button',
		acceptTimeZone
	);

	const html = HyperHTMLElement.bind(dialog.contentNode);
	html`
		<div class="aras-dialog_timezone-selector__container">
			<span class="aras-select">
				<span class="aras-select__container">
					${timeZonesSelect}
					<span class="aras-select__button"></span
				></span>
			</span>
		</div>
		<div class="aras-buttons-bar aras-buttons-bar_right">
			${okButton}
		</div>
	`;

	dialog.dialogNode.addEventListener('cancel', (event) =>
		event.preventDefault()
	);

	dialog.show();

	return dialog.promise;
};

export default selectTimeZone;
