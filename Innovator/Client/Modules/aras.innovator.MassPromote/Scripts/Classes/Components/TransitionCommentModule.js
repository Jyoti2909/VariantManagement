define(['dojo/_base/declare'], function (declare) {
	return declare('MassPromote.TransitionComment', null, {
		_control: null,
		_controlEnabled: true,

		constructor: function (mediator) {
			this._mediator = mediator;
			this._control = document.getElementById('transitionCommentTextArea');
			this._setLabels();
		},

		update: function (lifeCycleInfo, targetState) {
			if (!this._controlEnabled) {
				return;
			}

			let isVisible = false;
			if (lifeCycleInfo && targetState) {
				const allTransitions = lifeCycleInfo.getTransitionsByStateId(
					targetState.id
				);
				isVisible = allTransitions.some(function (el) {
					return el.getComment;
				});
			}

			this._setVisibility(isVisible);
		},

		_setVisibility: function (isVisible) {
			document
				.getElementById('transitionComment')
				.classList.toggle('aras-hide', !isVisible);
		},

		getComment: function () {
			return this._control.value;
		},

		freeze: function () {
			this._controlEnabled = false;
			this._control.disabled = true;
			this._control.readOnly = true;
		},

		_setLabels: function () {
			const moduleElement = document.getElementById('transitionComment');
			const headerLabel = moduleElement.getElementsByClassName(
				'mpo-settings-module-header'
			)[0];
			headerLabel.textContent = this._mediator.getResource('comment');
			this._control.setAttribute(
				'placeholder',
				this._mediator.getResource('type_comment_here')
			);
		}
	});
});
