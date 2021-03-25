import Dialog from '../../../../core/Dialog';
import { createButton } from '../../../../components/dialogCommonApi';

const dialogClass = 'aras-dialog-preferences';
const radioClass = 'aras-radio';
const radioInputClass = radioClass + '__input';
const radioBtnClass = radioClass + '__radio-button';
const { wire, bind } = HyperHTMLElement;

function getRadioButton(label, checked, value) {
	return wire()`<div class="${dialogClass}__radio">
		<label class="${radioClass}">
				<input class=${radioInputClass} type="radio" name="ZoomToRadioGroup" value="${value}" checked="${checked}" />
				<span class="${radioBtnClass}" />
				${label}
		</label>
	</div>`;
}

function preferencesModule(zoomToCursorPosition) {
	const solutionPath = '../Modules/aras.innovator.Viewers/';
	const preferencesDialog = new Dialog('html', {
		classList: dialogClass,
		title: aras.getResource(solutionPath, 'prefDialogTitle')
	});
	const okBtnClassList = 'aras-button_primary aras-buttons-bar__button';
	const okBtn = createButton(
		aras.getResource(solutionPath, 'prefDialogOkBtn'),
		okBtnClassList,
		() =>
			preferencesDialog.close(
				optionCursorPosition.querySelector('.aras-radio__input').checked
			)
	);
	const cancelBtnClassList = 'aras-button_secondary-light';
	const cancelBtn = createButton(
		aras.getResource(solutionPath, 'prefDialogCancelBtn'),
		cancelBtnClassList,
		() => preferencesDialog.close(null)
	);

	const label = aras.getResource(solutionPath, 'prefDialogListLabel');
	const optionViewportCenterLabel = aras.getResource(
		solutionPath,
		'prefDialogViewportCenterLabel'
	);
	const optionCursorPositionLabel = aras.getResource(
		solutionPath,
		'prefDialogCursorPositionLabel'
	);
	const optionViewportCenter = getRadioButton(
		optionViewportCenterLabel,
		!zoomToCursorPosition,
		'viewportCenter'
	);
	const optionCursorPosition = getRadioButton(
		optionCursorPositionLabel,
		zoomToCursorPosition,
		'cursorPosition'
	);

	bind(preferencesDialog.contentNode)`
		<label class="${dialogClass}__label">${label}</label>
		<div class="${dialogClass}__radio-buttons-area">
			${optionViewportCenter}
			${optionCursorPosition}
		</div>
		<div class="aras-buttons-bar aras-buttons-bar_right">
			${okBtn}${cancelBtn}
		</div>
	`;

	preferencesDialog.show();
	return preferencesDialog.promise;
}

export default preferencesModule;
