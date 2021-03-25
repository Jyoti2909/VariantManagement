define([
	'dojo/_base/declare',
	'ES/Scripts/Classes/Wrappers/WrappedGrid',
	'ES/Scripts/Classes/Wrappers/WrappedToolbar',
	'ES/Scripts/Classes/Utils',
	'dojo/domReady!'
], function (declare, WrappedGrid, WrappedToolbar, Utils) {
	return declare('InternalReindex', null, {
		_grid: null,

		_status: null,
		_toolbar: null,
		_gridProgressBar: null,
		_processedCount: null,
		_countToProcess: null,

		_bgActive: '#59FF7A !important',
		_bgDisabled: '#FF7A7A !important',
		_bgWaitingForResponse: '#F7F488 !important',

		_toolbarButtonsIds: {
			refresh: 'Refresh',
			start: 'Start',
			continue: 'Continue',
			stop: 'Stop'
		},

		_columns: {},

		_runningText: null,
		_stoppedText: null,
		_finishedText: null,

		_errorText: null,
		_getPageSizeText: null,
		_stopReindexConfirm: null,

		_aras: null,
		_utils: null,

		constructor: function (args) {
			this._aras = args.arasObj;

			this._status = document.getElementById('irStatus');
			this._gridProgressBar = document.getElementById('irProgressBar');
			this._processedCount = document.getElementById('irProcessed');
			this._countToProcess = document.getElementById('irToProcess');

			this._utils = new Utils({
				arasObj: this._aras
			});

			this._columns = {
				shard: {
					label: this._utils.getResourceValueByKey('grid.ir.shard'),
					dataType: 'text',
					dataAlign: 'l'
				},
				status: {
					label: this._utils.getResourceValueByKey('grid.ir.status'),
					dataType: 'text',
					dataAlign: 'l'
				},
				processing_time: {
					label: this._utils.getResourceValueByKey('grid.ir.processing_time'),
					dataType: 'text',
					dataAlign: 'c'
				},
				processed_count: {
					label: this._utils.getResourceValueByKey('grid.ir.processed_count'),
					dataType: 'text',
					dataAlign: 'c'
				},
				page_size: {
					label: this._utils.getResourceValueByKey('grid.ir.page_size'),
					dataType: 'text',
					dataAlign: 'c'
				},
				error_details: {
					label: this._utils.getResourceValueByKey('grid.ir.error_details'),
					dataType: 'image',
					dataAlign: 'c'
				}
			};

			this._runningText = this._utils.getResourceValueByKey('ir.running');
			this._stoppedText = this._utils.getResourceValueByKey('ir.stopped');
			this._finishedText = this._utils.getResourceValueByKey('ir.finished');

			this._errorText = this._utils.getResourceValueByKey('ir.reindex_error');
			this._getPageSizeText = this._utils.getResourceValueByKey(
				'dashboard.internal_reindex_get_page_size'
			);
			this._stopReindexConfirm = this._utils.getResourceValueByKey(
				'dashboard.internal_reindex_stop_reindex_confirm'
			);

			this._toolbar = new WrappedToolbar(
				document.querySelector('aras-toolbar')
			);

			[
				{
					image: '../../../../images/Refresh.svg',
					type: 'button',
					id: 'Refresh',
					tooltip_template: this._utils.getResourceValueByKey('buttons.refresh')
				},
				{
					type: 'separator',
					id: 'separator_1'
				},
				{
					image: '../../Images/Start.svg',
					type: 'button',
					id: 'Start',
					tooltip_template: this._utils.getResourceValueByKey('buttons.start')
				},
				{
					image: '../../Images/Continue.svg',
					type: 'button',
					id: 'Continue',
					tooltip_template: this._utils.getResourceValueByKey(
						'buttons.continue'
					)
				},
				{
					image: '../../Images/StopSearch.svg',
					type: 'button',
					id: 'Stop',
					tooltip_template: this._utils.getResourceValueByKey('buttons.stop')
				},
				{
					type: 'separator',
					id: 'separator_2'
				}
			].forEach(
				function (item) {
					this._toolbar.addItem(
						item.image,
						item.type,
						item.id,
						item.tooltip_template
					);
				}.bind(this)
			);

			this._toolbar.initializeData();
			this._toolbar.on('click', this._onClickToolbarButton.bind(this));
			this._toolbar.render();
		},

		/**
		 * Init grid on the page, populate multilingual strings
		 *
		 */
		init: function () {
			this._utils.processMultilingualNodes(document);

			this._grid = new WrappedGrid();
			this._grid.createControl('irGrid', this._createGridControl.bind(this));

			this._refreshGridStates();

			setInterval(
				function () {
					this._refreshGridStates();
				}.bind(this),
				30000
			);
		},

		/**
		 * Creates grid by filling it with column date and initializing
		 *
		 */
		_createGridControl: function () {
			for (var columnName in this._columns) {
				this._grid.addColumn(
					columnName,
					this._columns[columnName].label,
					this._columns[columnName].dataType,
					100,
					this._columns[columnName].dataAlign
				);
			}

			this._grid.init();
			this._grid.on('onCellClick', this._onErrorDetailsCellClick.bind(this));
		},

		/**
		 * Updates grid data
		 *
		 */
		_refreshGridStates: function () {
			this._grid.removeAllRows();

			var irItem = this._performAction('Status');

			if (irItem.isError() || irItem.getItemCount() === 0) {
				this._processedCount.innerText = '0';
				this._countToProcess.innerText = '0';
				return;
			}

			irItem = irItem.getItemsByXPath(
				'//Item[@type="Internal Reindex Status"]'
			);

			var gridCells = this._grid.getCells();

			var runActionAvailable = true;
			var continueActionAvailable = false;
			var stopActionAvailable = false;

			var processedCount = irItem.getProperty('processed_count', '0');
			var totalCount = irItem.getProperty('total_count', '0');

			this._gridProgressBar.style.width =
				(+processedCount / +totalCount) * 100 + '%';
			this._processedCount.innerText = processedCount;
			this._countToProcess.innerText = totalCount;

			var shards = irItem.getItemsByXPath(
				'./Relationships/Item[@type="Shard Status"]'
			);
			var shardsCount = shards.getItemCount();

			for (var i = 0; i < shardsCount; i++) {
				var shard = shards.getItemByIndex(i);
				var showError = false;
				this._grid.addRow(i, '', false);

				for (var column in this._columns) {
					var value = shard.getProperty(column, '');
					var columnIndex = this._grid.getColumnOrderByName(column);

					switch (column) {
						case 'error_details':
							if (value !== '' && showError) {
								var rowItem = this._grid.getItem(i);
								rowItem.tooltip = value;
								value = '../../Images/RedWarning.svg';
							} else {
								value = '';
							}
							break;

						case 'processed_count':
							value += '/' + shard.getProperty('total_count', '0');
							break;

						case 'status':
							var color = this._bgWaitingForResponse;
							switch (value) {
								case 'Stopped':
									color = this._bgDisabled;
									continueActionAvailable = true;
									break;
								case 'Error':
								case 'PluginException':
									color = this._bgDisabled;
									continueActionAvailable = true;
									showError = true;
									break;
								case 'Running':
									color = this._bgActive;
									runActionAvailable = false;
									continueActionAvailable = false;
									stopActionAvailable = true;
									break;
								case 'Finished':
									color = this._bgWaitingForResponse;
							}

							this._grid.setCellBackgroundColor(
								gridCells[columnIndex].layoutIndex,
								i,
								color
							);
					}

					this._grid.setCellValue(columnIndex, i, value);
				}
			}

			this._toolbar.setItemDisabled(
				this._toolbarButtonsIds.start,
				!runActionAvailable
			);
			this._toolbar.setItemDisabled(
				this._toolbarButtonsIds.continue,
				!continueActionAvailable
			);
			this._toolbar.setItemDisabled(
				this._toolbarButtonsIds.stop,
				!stopActionAvailable
			);

			var stateColor;

			if (continueActionAvailable) {
				stateColor = 'yellow';
				this._status.innerText = this._stoppedText;
			} else if (stopActionAvailable) {
				stateColor = 'green';
				this._status.innerText = this._runningText;
			} else {
				stateColor = 'blue';
				this._status.innerText = this._finishedText;
			}

			[this._status, this._gridProgressBar].forEach(function (el) {
				el.setAttribute('data-state-color', stateColor);
			});

			this._toolbar.render();
		},

		/**
		 * Perform internal reindex action
		 *
		 * @param {string} action Action to perform
		 * @param {number|string} [pageSize] Internal reindex page size, required for Start and Continue actions
		 * @returns {object} Internal reindex item
		 */
		_performAction: function (action, pageSize) {
			if (
				!this._aras.isPositiveInteger(pageSize) &&
				action !== 'Stop' &&
				action !== 'Status'
			) {
				throw this._utils.getResourceValueByKey(
					'message.page_size_should_be_positive'
				);
			}

			var item = this._aras.newIOMItem('Method', 'ES_InternalReindex');
			item.setProperty('action', action);
			if (!this._utils.isNullOrUndefined(pageSize)) {
				item.setProperty('page_size', pageSize);
			}
			item = item.apply();

			if (item.isError()) {
				throw item.getErrorString();
			}

			return item;
		},

		/*------------------------------------------------------------------------------------------------------------*/
		//Event handlers

		/**
		 * Handles click on toolbar button
		 *
		 * @param {string} action Action type
		 */
		_onClickToolbarButton: function (action) {
			var promptDialog = false;
			var message = '';

			switch (action) {
				case this._toolbarButtonsIds.start:
				case this._toolbarButtonsIds.continue:
					message = this._getPageSizeText;
					promptDialog = true;
					break;
				case this._toolbarButtonsIds.stop:
					message = this._stopReindexConfirm;
					break;
				case this._toolbarButtonsIds.refresh:
					this._utils.toggleSpinner(
						true,
						function () {
							try {
								this._refreshGridStates();
							} catch (ex) {
								this._aras.AlertError(ex.message);
							} finally {
								this._utils.toggleSpinner(false, undefined);
							}
						}.bind(this)
					);
					return;
			}

			if (promptDialog) {
				this._aras.prompt(message, '').then(
					function (pageSize) {
						if (!this._utils.isNullOrUndefined(pageSize)) {
							this._onOkButtonClickEventHandler.call(this, action, pageSize);
						}
					}.bind(this)
				);
			} else {
				this._utils.showConfirmDialog(message).then(
					function (result) {
						if (result) {
							this._onOkButtonClickEventHandler.call(this, action, 0);
						}
					}.bind(this)
				);
			}
		},

		/**
		 * Handles click on error image in grid cell
		 *
		 * @param {event} ev Event
		 */
		_onErrorDetailsCellClick: function (ev) {
			if (ev.cell.field === 'error_details') {
				var rowItem = ev.grid.getItem(ev.rowIndex);
				if (!this._utils.isNullOrUndefined(rowItem)) {
					var tooltipText = rowItem.tooltip;
					if (
						!this._utils.isNullOrUndefined(tooltipText) &&
						tooltipText !== ''
					) {
						this._aras.AlertError(this._errorText, tooltipText);
					}
				}
			}
		},

		/**
		 * Handles click on 'OK' button in reindex dialog
		 *
		 * @param {string} action Action type
		 * @param {string} pageSize Page Size value to use in reindex procedure
		 */
		_onOkButtonClickEventHandler: function (action, pageSize) {
			try {
				this._performAction(action, pageSize);
			} catch (ex) {
				this._aras.AlertError(ex);
			} finally {
				this._refreshGridStates();
			}
		}
	});
});
