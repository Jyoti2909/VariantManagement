import Dialog from '../../core/Dialog';
import { createButton } from '../../components/dialogCommonApi';

export default (translations, options = {}) => {
	const title = aras.getResource('', 'mldialog.ml_entry');
	const cssClass = 'aras-dialog_multilingual';
	const dialog = new Dialog('html', { title, classList: cssClass });
	const updatedLanguages = {};
	const applyButton = options.readOnly
		? ''
		: createButton(
				aras.getResource('', 'common.apply'),
				'aras-button_primary aras-buttons-bar__button',
				() => {
					const result = Object.keys(updatedLanguages).map((code) => {
						return { code, value: updatedLanguages[code] };
					});

					dialog.close(result);
				}
		  );
	const cancelButton = createButton(
		aras.getResource('', `common.${options.readOnly ? 'close' : 'cancel'}`),
		`aras-button_secondary${options.readOnly ? '' : '-light'}`,
		() => dialog.close()
	);

	HyperHTMLElement.hyper(dialog.contentNode)`
		<div 
			class="${cssClass + '__inputs-container'}"
			onconnected=${(e) => {
				const inputsContainer = e.target;
				const toggleOverflowedClass = () => {
					const clientHeight = Math.ceil(
						inputsContainer.getBoundingClientRect().height
					);
					const isOverflowed = inputsContainer.scrollHeight > clientHeight;

					inputsContainer.classList.toggle(
						`${cssClass}__inputs-container_overflowed`,
						isOverflowed
					);
				};

				toggleOverflowedClass();

				window.addEventListener('resize', toggleOverflowedClass);
				dialog.promise.then(() =>
					window.removeEventListener('resize', toggleOverflowedClass)
				);
			}}
		>
			${translations.map((translation) => {
				const languageCode = translation.code;
				const languageName = translation.name;
				const value = translation.value || '';
				const maxLength = options.maxLength || null;

				return HyperHTMLElement.hyper`
					<label 
						class="${cssClass + '__label'}"
					>${languageName + ':'}</label>
					<textarea
						class="${cssClass + '__input aras-input'}"
						value="${value}"
						rows="3"
						maxLength="${maxLength}"
						readOnly="${options.readOnly}"
						onInput=${(e) => (updatedLanguages[languageCode] = e.target.value)}
					/>
				`;
			})}
		</div>
		<div class="aras-buttons-bar aras-buttons-bar_right">
			${applyButton}
			${cancelButton}
		</div>
	`;

	dialog.show();

	return dialog.promise;
};
