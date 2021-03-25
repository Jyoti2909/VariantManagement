import Dialog from '../../core/Dialog';
import getResource from '../../core/resources';
import intl from '../../core/intl';
import { createButton } from '../../components/dialogCommonApi';

export default (featureLicense) => {
	const title = getResource('licensing.success_import_title');
	const classList = 'aras-dialog-activation-successful';
	const dialog = new Dialog('html', { title, classList });
	const render = () => {
		const feature = featureLicense.getProperty('feature');
		const expirationDateLabel = getResource('licensing.expiration_date');
		const expirationDate = featureLicense.getProperty('expiration_date');
		const parsedDate = intl.date.parse(expirationDate);
		const convertedDate = intl.date.format(parsedDate, 'shortDate');
		const okButtonClassList =
			'aras-button aras-button_primary aras-button_right';
		const okButton = createButton(
			getResource('common.ok'),
			okButtonClassList,
			() => dialog.close()
		);
		HyperHTMLElement.hyper(dialog.contentNode)`
			<span class="${classList}__feature">${feature}</span>
			<span class="${classList}__expiration-date">${expirationDateLabel}: ${convertedDate}</span>
			<div class="aras-buttons-bar aras-buttons-bar_right">${okButton}</div>
		`;
	};

	render();
	dialog.show();

	return dialog.promise;
};
