define(['dojo/_base/declare'], function (declare) {
	return declare(
		'Aras.Client.Controls.Experimental.ExternalCellWidget.FilePropertyManager',
		null,
		{
			aras: null,
			isInitialized: false,
			typeName: 'filePropertyManager',
			functionalFlags: {
				render: true,
				edit: true,
				interactive: true
			},
			resourceStrings: {},
			supportedKeys: [13, 32, 113],

			constructor: function (configuration) {
				if (configuration) {
					this.aras = configuration.aras;

					if (this.aras) {
						this.resourceStrings.selectFile = this.aras.getResource(
							'',
							'file_management.select_and_upload_file'
						);
						this.resourceStrings.manageFile = this.aras.getResource(
							'',
							'file_management.manage_file_property'
						);

						this.isInitialized = true;
					}
				}
			},

			_getLinkOrActionOrNameAttribute: function (
				layoutCell,
				rowIndex,
				attributeName
			) {
				var gridWidget = layoutCell.grid,
					item = gridWidget.getItem(rowIndex);

				return item
					? gridWidget.store.getValue(item, layoutCell.field + attributeName)
					: '';
			},

			getFileAction: function (layoutCell, rowIndex) {
				return this._getLinkOrActionOrNameAttribute(
					layoutCell,
					rowIndex,
					'action'
				);
			},

			appendWidgetHTML: function (
				containerNode,
				layoutCell,
				rowIndex,
				cellIndex,
				propertyValue
			) {
				var resultContent;

				if (this.isInitialized && containerNode) {
					var rowHeight = layoutCell.grid.rowHeight,
						parentDocument = containerNode.ownerDocument,
						widgetNode,
						iconNode,
						linkNode;

					if (!propertyValue) {
						if (this.canEditCell(layoutCell, rowIndex, cellIndex)) {
							widgetNode = parentDocument.createElement('div');
							widgetNode.setAttribute(
								'class',
								'externalExcelWidget filePropertyManager'
							);

							iconNode = parentDocument.createElement('div');
							iconNode.setAttribute('class', 'imageButton selectButton');
							iconNode.setAttribute('title', this.resourceStrings.selectFile);
							iconNode.setAttribute('widgetaction', 'selectfile');
							iconNode.text = '\u0081';

							linkNode = parentDocument.createElement('span');
							linkNode.setAttribute('class', 'textLink');
							linkNode.setAttribute('title', this.resourceStrings.selectFile);
							linkNode.setAttribute('style', 'margin-left:4px;');
							linkNode.setAttribute('widgetaction', 'selectfile');
							linkNode.text = this.resourceStrings.selectFile;

							widgetNode.appendChild(iconNode);
							widgetNode.appendChild(linkNode);
							containerNode.appendChild(widgetNode);
						} else {
							containerNode.text = '\u0081';
						}
					} else {
						const fileAction = this.getFileAction(layoutCell, rowIndex);
						const isTemp = fileAction === 'add';
						const fileIconStyle = isTemp
							? 'manageButtonUnsaved'
							: 'manageButton';
						const innerStyle = isTemp
							? ' text-decoration: none; color: #444444;'
							: '';

						widgetNode = parentDocument.createElement('div');
						widgetNode.setAttribute(
							'class',
							'externalExcelWidget filePropertyManager'
						);

						iconNode = parentDocument.createElement('div');
						iconNode.setAttribute('class', 'imageButton ' + fileIconStyle);
						iconNode.setAttribute('title', this.resourceStrings.manageFile);
						iconNode.setAttribute('widgetaction', 'managefile');
						iconNode.text = '\u0081';

						linkNode = parentDocument.createElement('span');
						linkNode.setAttribute('class', 'textLink');
						linkNode.setAttribute('title', propertyValue);
						linkNode.setAttribute('style', 'margin-left:4px;' + innerStyle);
						linkNode.setAttribute('widgetaction', 'showfile');
						linkNode.text = propertyValue;

						widgetNode.appendChild(iconNode);
						widgetNode.appendChild(linkNode);
						containerNode.appendChild(widgetNode);
					}
				}
			},

			applyValue: function (layoutCell, rowIndex, cellIndex, newFile) {
				var rowCell = this.getGridCell(layoutCell, rowIndex, cellIndex);

				if (rowCell) {
					var fileId = newFile ? newFile.getAttribute('id') : '',
						fileName = newFile
							? this.aras.getItemProperty(newFile, 'filename')
							: '';
					const fileAction = newFile ? newFile.getAttribute('action') : '';

					rowCell.setValue(fileName);

					// onApplyEdit can repopulate grid
					// in this case the property value will be set, but the property attributes will be lost
					// call onApplyEdit before setLink
					this.onApplyEdit(rowCell.getRowId(), layoutCell.field, newFile);

					const gridWidget = layoutCell.grid;
					const rowItem = gridWidget.getItem(rowIndex);
					gridWidget.store.setValue(
						rowItem,
						layoutCell.field + 'action',
						fileAction
					);
					// because onApplyEdit can repopulate grid, it's necessary to get new cell object
					rowCell = this.getGridCell(layoutCell, rowIndex, cellIndex);
					rowCell.setLink("'File'," + fileId + "'");
				}
			},

			getGridCell: function (layoutCell, rowIndex, cellIndex) {
				if (layoutCell) {
					var gridWidget = layoutCell.grid,
						storeRowId = gridWidget.store.getIdentity(
							gridWidget.getItem(rowIndex)
						),
						rowId = gridWidget.map.getRowIdByStoreRowIdAndStoreCellIndex(
							storeRowId,
							cellIndex
						);

					return gridWidget.parentContainer.cells(
						rowId,
						layoutCell.layoutIndex
					);
				}
			},

			onClick: function (e) {
				if (this.isInitialized) {
					var srcNode = e.srcElement || e.target,
						actionName;

					while (
						srcNode &&
						(!srcNode.attributes || !srcNode.attributes.widgetaction)
					) {
						srcNode = srcNode.parentNode;
					}
					actionName = srcNode ? srcNode.attributes.widgetaction.value : '';

					this.performAction(e.cell, e.rowIndex, e.cellIndex, actionName);
				}
			},

			onKeyDown: function (layoutCell, rowIndex, e) {
				if (this.supportedKeys.indexOf(e.keyCode) != -1) {
					var gridWidget = layoutCell.grid,
						rowCell = this.getGridCell(layoutCell, rowIndex, e.cellIndex);

					if (rowCell) {
						var cellValue = rowCell.getValue(),
							widgetAction;

						switch (e.keyCode) {
							case 13:
							case 32:
								widgetAction = cellValue ? 'showfile' : 'selectfile';
								break;
							case 113:
								widgetAction = cellValue ? 'managefile' : 'selectfile';
								break;
						}

						this.performAction(layoutCell, rowIndex, e.cellIndex, widgetAction);
					}
				}
			},

			performAction: function (layoutCell, rowIndex, cellIndex, actionName) {
				var gridWidget = layoutCell.grid,
					rowCell;

				switch (actionName) {
					case 'managefile':
						rowCell = this.getGridCell(layoutCell, rowIndex, cellIndex);
						fileLink = rowCell ? rowCell.getLink_Experimental() : '';

						if (fileLink) {
							var self = this,
								onChangeHandler = function (newValue) {
									self.applyValue(layoutCell, rowIndex, cellIndex, newValue);
								},
								mainWindow = this.aras.getMainWindow(),
								topWnd = this.aras.getMostTopWindowWithAras(window),
								targetWindow = topWnd === mainWindow ? mainWindow.main : topWnd,
								dialogCallbacks = {},
								dialogParams;

							fileLink = fileLink.replace(/'/g, '').split(',');
							fileId = fileLink[1];
							dialogParams = {
								aras: this.aras,
								fileId: fileId,
								editable: this.canEditCell(layoutCell, rowIndex, cellIndex),
								onchange: onChangeHandler
							};
							dialogParams.type = 'ManageFileProperty';
							targetWindow.ArasModules.Dialog.show(
								'iframe',
								dialogParams
							).promise.then(function () {
								gridWidget.focus.focusGrid();
							});
						}
						break;
					case 'selectfile':
						if (this.canEditCell(layoutCell, rowIndex, cellIndex)) {
							this.aras.vault.selectFile().then(
								function (file) {
									const selectedFile = this.aras.newItem('File', file);
									if (selectedFile) {
										this.aras.itemsCache.addItem(selectedFile);
										this.applyValue(
											layoutCell,
											rowIndex,
											cellIndex,
											selectedFile
										);
									}
								}.bind(this)
							);
						}
						break;
					case 'showfile':
						rowCell = this.getGridCell(layoutCell, rowIndex, cellIndex);
						fileLink = rowCell ? rowCell.getLink_Experimental() : '';

						if (fileLink) {
							fileLink = fileLink.replace(/'/g, '').split(',');
							fileId = fileLink[1];
							fileNode = this.aras.getItemById('File', fileId);

							if (fileNode) {
								if (this.aras.isTempEx(fileNode)) {
									this.aras.AlertError('Local file cannot be displayed.');
									return true;
								} else {
									this.aras.uiShowItemEx(fileNode, undefined);
								}
							}
						}
						break;
				}
			},

			canEditCell: function (layoutCell, rowIndex, cellIndex) {
				var gridContainer = layoutCell.grid.parentContainer,
					gridWidget = layoutCell.grid;

				if (gridContainer.isEditable() && layoutCell.editable) {
					var rowId = gridWidget.map.getRowIdByStoreRowIndexAndStoreCellIndex(
						rowIndex,
						cellIndex
					);

					return this.onCanEditCheck(rowId, layoutCell.field);
				}
				return false;
			},

			onCanEditCheck: function (rowId, columnName) {
				// Event fired when manager checks cell "editable" state
			},

			onApplyEdit: function (rowId, columnName, newValue) {
				// Event fired when new value, selected throught manager applied to grid cell
			}
		}
	);
});
