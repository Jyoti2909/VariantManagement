import Dialog from '../../core/Dialog';
import SvgManager from '../../core/SvgManager';
import getResource from '../../core/resources';

const images = {
	innovatorLogo: '../images/aras-innovator.svg',
	innovator: '../images/Innovator.svg',
	support: '../images/Support.svg'
};

SvgManager.enqueue(Object.values(images));

const about = (data) => {
	const title = getResource('aras_object.about_aras_innovator');
	const cssClass = 'aras-dialog_about';

	const dialog = new Dialog('html', { title, classList: cssClass });

	const logoImage = SvgManager.createHyperHTMLNode(images.innovatorLogo, {
		class: `${cssClass}__img-logo`
	});

	const arasSiteImage = SvgManager.createHyperHTMLNode(images.innovator, {
		class: `${cssClass}__img-innovator aras-button__icon`
	});

	const supportImage = SvgManager.createHyperHTMLNode(images.support, {
		class: `${cssClass}__img-support aras-button__icon`
	});

	HyperHTMLElement.hyper(dialog.contentNode)`
		<div class="${cssClass + '__container-logo'}">
			${logoImage}
			<div class="${cssClass + '__revision-build'}">
				<span class="${cssClass + '__revision'}">
					${data.version.revision}
				</span>
				<span class="${cssClass + '__build'}">
					Build ${data.version.build}
				</span>
			</div>
			<div class="${cssClass + '__button-links'}">
				<a
					autofocus
					class="aras-button"
					href="https://www.aras.com"
					target="_blank"
				>
					${arasSiteImage}
					<span class="aras-button__text">Aras.com</span>
				</a>
				<a
					class="aras-button"
					href="https://www.aras.com/support"
					target="_blank"
				>
					${supportImage}
					<span class="aras-button__text">Aras Support</span>
				</a>
			</div>
		</div>
		<div class="${cssClass + '__container-data'}">
			<div class="${cssClass + '__ms-build'}">
				MS Build Number: ${data.msBuildNumber}
			</div>
			<div class="${cssClass + '__copyright'}">${data.copyright}</div>
		</div>
	`;

	dialog.show();

	return dialog.promise;
};

export default about;
