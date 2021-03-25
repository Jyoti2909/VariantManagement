(function (window) {
	'use strict';

	function InformationMessageViewController(parameters) {
		this._aras = parameters.aras;

		this._init(
			parameters.informationMessage,
			parameters.informationMessageElement,
			parameters.closeButtonClickHandler,
			parameters.closeButtonElement
		);
	}

	InformationMessageViewController.prototype = {
		constructor: InformationMessageViewController,

		_aras: null,

		_effsModuleSolutionBasedRelativePath:
			'../Modules/aras.innovator.EffectivityServices',

		_init: function (
			informationMessage,
			informationMessageElement,
			closeButtonClickHandler,
			closeButtonElement
		) {
			this._toggleCloseButton(closeButtonClickHandler, closeButtonElement);
			this._loadInformationMessage(
				informationMessage,
				informationMessageElement
			);
		},

		_loadInformationMessage: function (
			informationMessage,
			informationMessageElement
		) {
			informationMessageElement.textContent = informationMessage;
		},

		_toggleCloseButton: function (closeButtonClickHandler, closeButtonElement) {
			if (!closeButtonClickHandler) {
				return;
			}

			closeButtonElement.title = this._aras.getResource(
				this._effsModuleSolutionBasedRelativePath,
				'effectivity_expression_item_grid.close_button.label'
			);
			closeButtonElement.addEventListener('click', closeButtonClickHandler);
			closeButtonElement.classList.toggle('aras-hide', false);
		}
	};

	window.InformationMessageViewController = InformationMessageViewController;
})(window);
