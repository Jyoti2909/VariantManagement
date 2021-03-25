define([
	'dojo/_base/declare',
	'./InputGroups/EffSInputGroupFactory',
	'Modules/aras.innovator.core.Controls/Scripts/Controls/RuleEditor/RuleEditorControl'
], function (declare, EffSInputGroupFactory, TemplatedEditor) {
	return declare('EffectivityExpressionEditor', [TemplatedEditor], {
		aras: null,
		_isCalendarShown: null,

		constructor: function (initialArguments) {
			this.inherited(arguments);

			initialArguments = initialArguments || {};
			this.aras = initialArguments.aras;
			if (initialArguments.connectId) {
				this._groupFactory = new EffSInputGroupFactory(this);
			}
		},

		_showIntelliSenseMenu: function (
			targetGroup,
			menuItems,
			intellisenseContext
		) {
			if (
				intellisenseContext &&
				intellisenseContext.groupContext &&
				intellisenseContext.groupContext.expectedLexemType == 'DateTime'
			) {
				if (!this._isCalendarShown) {
					this._showCalendar(intellisenseContext);
				}
				return true;
			}

			return this.inherited(arguments);
		},

		_setDateTimeValue: function (context, newDate) {
			if (newDate) {
				this._onIntelliSenseItemClick(context.group, newDate, context);
			}
		},

		_showCalendar: function (context) {
			const focusedElement = document.activeElement;
			if (focusedElement) {
				focusedElement.blur();
			}
			this._isCalendarShown = true;
			var topWnd = this.aras.getMostTopWindowWithAras(window);
			var dateDialog = (topWnd.main || topWnd).ArasModules.Dialog.show(
				'iframe',
				{
					date: context.oldDate,
					format: this.aras.getDotNetDatePattern('short_date'),
					type: 'Date',
					aras: this.aras
				}
			);

			dateDialog.contentNode.focus();

			var position = this.aras.uiGetElementCoordinates(
				context.groupContext.domNode
			);
			// 'uiGetElementCoordinates' method returns offsets from the upper left corner of the screen.
			// Offset includes tabs, logo etc. 'screenTop' and 'barsHeight' should be excluded from final offset calculation.
			// 'dateDialog.move' set position not from upper left corner of screen. It set position in context of 'tabs_content-iframe'.
			// Date picker should be shown below the input group. Need to reduce value on height of input group.
			// '50' -  the offset found by experimenting with UI (based on knowledge that Menu and toolbar takes 53px).
			// That offset allows to show date picker below input field
			var topPostion =
				position.top - position.screenTop - position.barsHeight - 50;
			dateDialog.move(position.left, topPostion);

			//dateDialog.move(position.offsetLeft, position.offsetTop);
			dateDialog.promise.then(
				function (newDate) {
					this._setDateTimeValue(context, newDate);
					this._isCalendarShown = false;
				}.bind(this)
			);
		}
	});
});
