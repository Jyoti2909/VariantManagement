define([
	'dojo/aspect',
	'TreeGridView/Scripts/Configurator/Models/TreeGrid/TreeGridRowModel',
	'./Dialogs/showRenameColumnDialog'
], function (aspect, TreeGridRowModel, showRenameColumnDialog) {
	'use strict';
	var adjustIconUrl;
	var ConfiguratorController = (function () {
		function ConfiguratorController(aras, globalItem, moduleFactory) {
			adjustIconUrl = dojoConfig.arasContext.adjustIconUrl;
			this.isCandidatesVisible = true;
			this._tooltipDialogUtils = moduleFactory.getTooltipDialogUtils(aras);
			this._arasObject = aras;
			this._item = globalItem;
			this._moduleFactory = moduleFactory;
			this.init();
			this.checkOnErrors();
		}
		Object.defineProperty(
			ConfiguratorController.prototype,
			'queryDefinitionStructureInController',
			{
				get: function () {
					return this._queryDefinitionStructure;
				},
				enumerable: true,
				configurable: true
			}
		);
		ConfiguratorController.prototype.setView = function (view) {
			this._view = view;
			this.subscribeOnEvents();
		};
		ConfiguratorController.prototype.reload = function (globalItem) {
			this._item = globalItem;
			this.init();
			this._view.reload();
			this.checkOnErrors();
		};
		ConfiguratorController.prototype.onResizeWindow = function () {
			var currentTooltipDialog = this._tooltipDialogUtils.getCurrentTooltipDialog();
			if (currentTooltipDialog && currentTooltipDialog.isActive()) {
				currentTooltipDialog.cancel();
			}
		};
		ConfiguratorController.prototype.checkOnErrors = function () {
			var validationResult = this.getValidationResult();
			if (
				validationResult.errors.length > 0 ||
				validationResult.hasTemplateErrors
			) {
				this.alertValidationResult(validationResult);
			}
		};
		ConfiguratorController.prototype.getValidationResult = function () {
			var errors = this._treeGridRepository.validateViewDefinition();

			var treeBranch = this._treeGridRepository.getTreeBranchWithValidateColumnMapping();
			var hasTemplateErrors = false;
			treeBranch.visit(function (graphNode) {
				hasTemplateErrors = hasTemplateErrors || graphNode.hasMappingErrors;
			});

			return {
				errors: errors,
				hasTemplateErrors: hasTemplateErrors
			};
		};
		ConfiguratorController.prototype.getContextMenuObject = function (
			treeGridRowModels,
			columnIndex
		) {
			var menuConfigurator = this._moduleFactory.getMenuConfigurator(
				this._treeGridRepository
			);
			return menuConfigurator.getContextMenuObject(
				treeGridRowModels,
				columnIndex,
				this.isCandidatesVisible
			);
		};
		ConfiguratorController.prototype.initCellEditorDialog = function () {
			var _this = this;
			this._cellEditor = this._moduleFactory.getCellEditorDialog(
				this._treeGridRepository,
				this._tooltipDialogUtils
			);
			aspect.after(
				this._cellEditor,
				'needReloadView',
				function () {
					_this._view.reload();
				},
				true
			);
		};
		ConfiguratorController.prototype.alertValidationResult = function (
			validationResult
		) {
			var message = '';
			if (validationResult.hasTemplateErrors) {
				message +=
					this.getResource('configurator.some_cell_templates_are_invalid') +
					'\r\n';
			}

			var errors = validationResult.errors;
			for (var i = 0; i < errors.length; i++) {
				if (!i) {
					message +=
						this.getResource('configurator.anavailable_query_items') + '\r\n';
				}
				message +=
					'{' +
					errors[i].treeRowRefId +
					'/' +
					errors[i].queryItemRefId +
					'}\r\n';
			}

			this._arasObject.AlertWarning(message);
		};
		ConfiguratorController.prototype.subscribeOnEvents = function () {
			var _this = this;
			var self = this;
			aspect.after(
				this._view,
				'onAfterInitGrid',
				function (treeGrid) {
					var columns = self._treeGridRepository.getColumns();
					var layout = self._calculateLayout(columns);
					treeGrid.setLayout_Experimental(layout);
					var treeBranch = self._treeGridRepository.setCurrentTreeBranch();
					var treeGridStore = self._createTreeGridFromData(treeBranch);
					treeGridStore.forEach(function (row) {
						return treeGrid.items_Experimental.add(row, row.parentUniqueId);
					});
					treeGrid.expandAll(true);
				},
				true
			);
			aspect.after(
				this._view,
				'onAddColumn',
				function (columnDefinition) {
					var newColumnDefinition = _this._createDefaultTemplateColumnDefinition();
					var reCalculatedColumnDefinitions = _this._treeGridRepository.insertColumn(
						columnDefinition,
						newColumnDefinition
					);
					var updatedLayout = _this._calculateLayout(
						reCalculatedColumnDefinitions
					);
					_this._view.loadGridData(updatedLayout);
				},
				true
			);
			aspect.after(
				this._view,
				'onRenameColumn',
				function (columnDefinition) {
					var columnDefinitionItem = _this._treeGridRepository.getColumnDefinitionItem(
						columnDefinition
					);
					showRenameColumnDialog({ columnDefinitionItem: columnDefinitionItem })
						.then(function (renameResult) {
							if (renameResult.isApplied) {
								// HACK: Item is changed directly.
								_this._treeGridRepository.renameColumn(
									columnDefinition,
									renameResult.changedColumnDefinitionItem.node
								);
								_this._view.reload();
							}
						})
						.catch(function (e) {
							return console.warn(e);
						});
				},
				true
			);
			aspect.after(
				this._view,
				'onRemoveColumn',
				function (columnDefinition, columnIndex) {
					if (columnIndex === 0) {
						return;
					}
					var reCalculatedColumnDefinitions = _this._treeGridRepository.removeColumn(
						columnDefinition
					);
					var updatedLayout = _this._calculateLayout(
						reCalculatedColumnDefinitions
					);
					_this._view.loadGridData(updatedLayout);
				},
				true
			);
			aspect.after(
				this._view,
				'onResizeColumn',
				function (columnDefinition, newWidth) {
					if (!columnDefinition) {
						return;
					}
					columnDefinition.width = newWidth;
					_this._treeGridRepository.updateColumn(columnDefinition);
				},
				true
			);
			aspect.after(
				this._view,
				'onMapTreeRow',
				function (graphNodeId) {
					var columnDefinition = this.grid.getTreeGridColumnModel(0);
					_this._treeGridRepository.mapTreeRow(graphNodeId, columnDefinition);
					_this._view.reload();
				},
				true
			);
			aspect.after(
				this._view,
				'onMultipleMap',
				function (graphNodeIds) {
					var columnDefinition = this.grid.getTreeGridColumnModel(0);
					_this._treeGridRepository.multipleMap(graphNodeIds, columnDefinition);
					_this._view.reload();
				},
				true
			);
			aspect.after(
				this._view,
				'onUnmapTreeRow',
				function (treeGridRowModel) {
					var rowHasCellTemplates = treeGridRowModel.hasAnyCellTemplate();
					var isUnmappingConfirm =
						!rowHasCellTemplates ||
						_this._arasObject.confirm(
							_this.getResource('configurator.unmapping_confirm')
						);
					if (isUnmappingConfirm) {
						_this._treeGridRepository.unmapTreeRow(treeGridRowModel.uniqueId);
						_this._view.reload();
					}
				},
				true
			);
			aspect.after(
				this._view,
				'onMultipleUnmap',
				function (treeGridRowModels) {
					var rowsHaveAnyCellTemplates = _this._rowsHaveAnyCellTemplate(
						treeGridRowModels
					);
					var isUnmappingConfirm =
						!rowsHaveAnyCellTemplates ||
						_this._arasObject.confirm(
							_this.getResource('configurator.unmapping_confirm')
						);
					if (isUnmappingConfirm) {
						var rowIds = treeGridRowModels.map(function (model) {
							return model.uniqueId;
						});
						_this._treeGridRepository.multipleUnmap(rowIds);
						_this._view.reload();
					}
				},
				true
			);
			aspect.after(
				this._view,
				'onInsertGroupAbove',
				function (graphNodeId, template) {
					_this._treeGridRepository.insertGroupBetweenParent(
						graphNodeId,
						template
					);
					_this._view.reload();
				},
				true
			);
			aspect.after(
				this._view,
				'onInsertGroupBelow',
				function (graphNodeId, template) {
					_this._treeGridRepository.insertGroupBelow(graphNodeId, template);
					_this._view.reload();
				},
				true
			);
			aspect.after(
				this._view,
				'onCandidateVisibilityChanged',
				function () {
					_this.isCandidatesVisible = !_this.isCandidatesVisible;
					_this._view.reload();
				},
				true
			);
			aspect.after(
				this._view,
				'onCombineNodes',
				function (graphNodeIds) {
					var columnDefinition = this.grid.getTreeGridColumnModel(0);
					_this._treeGridRepository.combineNodes(
						graphNodeIds,
						columnDefinition
					);
					_this._view.reload();
				},
				true
			);
			aspect.after(
				this._view,
				'onDecombineNodes',
				function (graphNodeId) {
					var columnDefinition = this.grid.getTreeGridColumnModel(0);
					_this._treeGridRepository.decombineNodes(
						graphNodeId,
						columnDefinition
					);
					_this._view.reload();
				},
				true
			);
			aspect.after(
				this._view,
				'onDoubleClick',
				function (treeGridRowModel, columnDefinition, targetDomNode) {
					_this._cellEditor.tryShowDialog(
						treeGridRowModel,
						columnDefinition,
						targetDomNode
					);
				},
				true
			);
			aspect.after(
				this._view,
				'onShowParameterMapping',
				function () {
					_this._showParameterMapping();
				},
				true
			);
			aspect.after(this._view, 'onShowDataTemplate', function (result, args) {
				_this._showDataTemplate(args[0], args[1]);
			});
		};
		ConfiguratorController.prototype.getRecursiveRowIdOn = function (
			recursiveNodeIdFrom
		) {
			var branch = this._treeGridRepository.getCurrentBranch();
			var graphNode = branch.getNodeById(recursiveNodeIdFrom);
			if (graphNode.isRecursiveNode) {
				var node = branch.getRecursiveNodeOn(graphNode);
				if (node) {
					return node.id;
				}
			}
		};
		ConfiguratorController.prototype.init = function () {
			var dataStructureFactory = this._moduleFactory.getDataStructureFactory(
				this._arasObject,
				this._item
			);
			this._queryDefinitionStructure = dataStructureFactory.initQueryDefinition();
			var viewDefinitionStructure = dataStructureFactory.initViewDefinition();
			this._treeGridRepository = this._moduleFactory.getTreeGridRepository(
				viewDefinitionStructure,
				this._queryDefinitionStructure,
				this._moduleFactory
			);
			this.initCellEditorDialog();
		};
		ConfiguratorController.prototype._rowsHaveAnyCellTemplate = function (
			treeGridRowModels
		) {
			var rowsHaveAnyCellTemplates = false;
			for (var i = 0; i < treeGridRowModels.length; i++) {
				if (treeGridRowModels[i].hasAnyCellTemplate()) {
					rowsHaveAnyCellTemplates = true;
					break;
				}
			}
			return rowsHaveAnyCellTemplates;
		};
		ConfiguratorController.prototype._createTreeGridFromData = function (
			branch
		) {
			var gridRows = [];
			this.visit(branch, gridRows);
			return gridRows;
			//branch.visit((graphNode: GraphNode) => {
			//	if (this.isCandidatesVisible && graphNode.isCandidate) {
			//		return;
			//	}
			//	gridRows.push(this._createTreeGridRowModel(graphNode, branch));
			//}
		};
		ConfiguratorController.prototype.visit = function (branch, gridRows) {
			var rootNode = branch.getRootNode();
			if (rootNode) {
				if (!this.isCandidatesVisible && rootNode.isCandidate) {
					this._traverseBranch(rootNode, undefined, branch, gridRows);
				} else {
					gridRows.push(
						this._createTreeGridRowModel(rootNode, undefined, branch)
					);
					this._traverseBranch(rootNode, rootNode, branch, gridRows);
				}
			}
		};
		ConfiguratorController.prototype._traverseBranch = function (
			rootNode,
			parentNonJoin,
			branch,
			gridRows
		) {
			var _this = this;
			var childNodes = branch.getChildNodes(rootNode);
			childNodes.forEach(function (node) {
				if (node.isJoined) {
					_this._traverseBranch(node, parentNonJoin, branch, gridRows);
				} else {
					if (!_this.isCandidatesVisible && node.isCandidate) {
						_this._traverseBranch(node, parentNonJoin, branch, gridRows);
					} else {
						gridRows.push(
							_this._createTreeGridRowModel(node, parentNonJoin, branch)
						);
						_this._traverseBranch(node, node, branch, gridRows);
					}
				}
			});
		};
		ConfiguratorController.prototype._hasMappingErrors = function (
			columnMappings,
			validTemplates
		) {
			var hasErrors = false;
			if (columnMappings.length > 0) {
				var self = this;
				columnMappings.forEach(function (mapping) {
					if (mapping.template) {
						var templateText =
							mapping.cellViewType === 'List'
								? mapping.getListValueTemplate()
								: mapping.getTemplateText();
						var res = self._checkOnValidTemplate(templateText, validTemplates);
						if (res) {
							hasErrors = true;
						}
					}
				});
			}
			return hasErrors;
		};
		ConfiguratorController.prototype._checkOnValidTemplate = function (
			templateText,
			validTemplates
		) {
			var hasErrors = false;
			if (templateText) {
				var arr = templateText.match(/\{(.*?)\}/g);
				if (arr) {
					for (var i = 0; i < arr.length; i++) {
						if (validTemplates.indexOf(arr[i]) < 0) {
							hasErrors = true;
							break;
						}
					}
				}
			}
			return hasErrors;
		};
		ConfiguratorController.prototype._createTreeGridRowModel = function (
			graphNode,
			parentNonJoin,
			branch
		) {
			var model = new TreeGridRowModel(null);
			var iconUrl = this._treeGridRepository.getIconUrl(graphNode);

			model.uniqueId = graphNode.id;
			model.parentUniqueId = parentNonJoin ? parentNonJoin.id : '';
			try {
				model.icon = adjustIconUrl(iconUrl);
			} catch (ex) {
				// If session is expired, server responses with error
				model.icon = '';
			}
			model.itemTypeName = this._getAliasStringForNode(graphNode);
			model.isCandidate = graphNode.isCandidate;
			model.isRecursiveNode = graphNode.isRecursiveNode;
			model.columnMappings = graphNode.treeRowRefId
				? this._treeGridRepository.getColumnMappingForTreeRow(
						graphNode.treeRowRefId
				  )
				: [];
			model.hasJoinedNodes = branch.getJoinedNodes(graphNode).length > 0;
			model.validTemplates = graphNode.validTemplates;
			var reference = this.queryDefinitionStructureInController.getReferenceByChildRefId(
				graphNode.queryItemRefId
			);
			model.isReferencingTreeGridRow =
				reference && reference.isReferencingQueryReference;
			return model;
		};
		ConfiguratorController.prototype._getAliasStringForNode = function (
			graphNode
		) {
			var aliasesSeparator = ' --- ';
			var alias = this._treeGridRepository
				.getAliasesForNode(graphNode, true)
				.join(aliasesSeparator);
			return alias;
		};
		ConfiguratorController.prototype._calculateLayout = function (
			columnDefinitions
		) {
			if (columnDefinitions.length < 1) {
				throw new Error(
					this.getResource('configurator.should_be_at_least_one_column')
				);
			}
			var treeColumn = columnDefinitions[0];
			var templateColumns = columnDefinitions.slice(1);
			var cellDefMapper = this._moduleFactory.getCellDefMappper();
			var layout = [cellDefMapper.mapTreeColumn(treeColumn)].concat(
				templateColumns.map(function (column) {
					return cellDefMapper.mapTemplateColumn(column);
				})
			);
			return layout;
		};
		ConfiguratorController.prototype._createDefaultTemplateColumnDefinition = function () {
			var columnDefinition = this._treeGridRepository.createColumn();
			columnDefinition.header = this.getResource(
				'configurator.new_column_header'
			);
			columnDefinition.width = 100;
			return columnDefinition;
		};
		ConfiguratorController.prototype.getResource = function (resourceName) {
			return this._arasObject.getResource(
				'../Modules/aras.innovator.TreeGridView',
				resourceName
			);
		};
		ConfiguratorController.prototype._showParameterMapping = function () {
			var item = parent.item;

			var qd = aras.getItemProperty(item, 'query_definition');
			var paramQuery = aras.newIOMItem('qry_QueryParameter', 'get');

			paramQuery.setProperty('source_id', qd);
			paramQuery.setAttribute('select', 'name,label,value');
			var paramQueryResult = paramQuery.apply();

			var parameterMapping = item.selectNodes(
				'Relationships/Item[@type="rb_QueryDefinitionParameterMap"]'
			);
			if (!parameterMapping.length) {
				var mappingQuery = aras.newIOMItem('rb_TreeGridViewDefinition', 'get');
				mappingQuery.setID(item.getAttribute('id'));
				mappingQuery.setAttribute('select', 'id');
				var parameterMapQuery = aras.newIOMItem(
					'rb_QueryDefinitionParameterMap',
					'get'
				);
				mappingQuery.addRelationship(parameterMapQuery);
				var mappingQueryResult = mappingQuery.apply();
				aras.mergeItemRelationships(item, mappingQueryResult.node);
			}

			var tgvParameterMap = {};
			var qdParameterMapNodes = item.selectNodes(
				'Relationships/Item[@type="rb_QueryDefinitionParameterMap"]'
			);
			for (var i = 0; i < qdParameterMapNodes.length; i++) {
				var parameterItem = qdParameterMapNodes[i];

				var name = aras.getItemProperty(parameterItem, 'qd_parameter_name');
				var dataSource = parameterItem.selectSingleNode(
					'user_input_data_source'
				);
				var dataType = aras.getItemProperty(
					parameterItem,
					'user_input_data_type'
				);
				var defaultValue = aras.getItemProperty(
					parameterItem,
					'user_input_default_value'
				);
				var pattern = aras.getItemProperty(parameterItem, 'user_input_pattern');
				var label = aras.getItemProperty(parameterItem, 'label');
				var action = parameterItem.getAttribute('action');
				var id = parameterItem.getAttribute('id');

				tgvParameterMap[name] = {
					dataSource: dataSource,
					dataType: dataType,
					defaultValue: defaultValue,
					pattern: pattern,
					action: action,
					id: id,
					label: label
				};
			}

			function cleanViewModelContainer() {
				var paramViewModelItems = item.selectNodes(
					'Relationships/Item[@type="rb_ParameterViewModel"]'
				);
				for (var i = 0; i < paramViewModelItems.length; i++) {
					var node = paramViewModelItems[i];
					node.parentNode.removeChild(node);
				}
			}

			cleanViewModelContainer();

			var relRoot = item.selectSingleNode('Relationships');

			function updateViewModelItemByTgvParameter(
				parameterName,
				viewModelItem,
				tgvParameter
			) {
				viewModelItem.setProperty('tgv_parameter_id', tgvParameter.id);
				viewModelItem.setProperty(
					'visible',
					tgvParameter.action !== 'delete' ? '1' : '0'
				);
				viewModelItem.setProperty('qd_parameter_name', parameterName);
				viewModelItem.setProperty('label', tgvParameter.label);
				viewModelItem.setProperty(
					'user_input_default_value',
					tgvParameter.defaultValue
				);
				viewModelItem.setProperty(
					'user_input_data_type',
					tgvParameter.dataType
				);
				if (tgvParameter.dataSource) {
					viewModelItem.setProperty('user_input_data_source', '');
					viewModelItem.node.replaceChild(
						tgvParameter.dataSource.cloneNode(true),
						viewModelItem.node.selectSingleNode('user_input_data_source')
					);
				}
				viewModelItem.setProperty('user_input_pattern', tgvParameter.pattern);
			}

			var parameterCount = paramQueryResult.getItemCount();
			for (i = 0; i < parameterCount; i++) {
				var paramItem = paramQueryResult.getItemByIndex(i);
				var parameterName = paramItem.getProperty('name');
				var viewModelItem = aras.newIOMItem('rb_ParameterViewModel', 'add');

				viewModelItem.setID(aras.generateNewGUID());
				var tgvParameter = tgvParameterMap[parameterName];
				if (!tgvParameter) {
					viewModelItem.setProperty('visible', 0);
					viewModelItem.setProperty('tgv_parameter_id', viewModelItem.getID());
					viewModelItem.setProperty(
						'qd_parameter_name',
						paramItem.getProperty('name')
					);
					viewModelItem.setProperty('label', paramItem.getProperty('label'));
					viewModelItem.setProperty(
						'user_input_default_value',
						paramItem.getProperty('value')
					);
				} else {
					updateViewModelItemByTgvParameter(
						parameterName,
						viewModelItem,
						tgvParameter
					);
				}

				relRoot.appendChild(viewModelItem.node.cloneNode(true));
			}

			var invalidCss = '.label {color: red; pointer-events: none},';
			invalidCss += '.qd_parameter_name {color: red; pointer-events: none},';
			invalidCss +=
				'.user_input_default_value {color: red; pointer-events: none},';
			invalidCss += '.user_input_data_type {color: red; pointer-events: none},';
			invalidCss +=
				'.user_input_data_source {color: red; pointer-events: none},';
			invalidCss += '.user_input_pattern {color: red; pointer-events: none}';

			for (i = 0; i < qdParameterMapNodes.length; i++) {
				var deletedParamName = aras.getItemProperty(
					qdParameterMapNodes[i],
					'qd_parameter_name'
				);
				var node = relRoot.selectSingleNode(
					'Item[@type="rb_ParameterViewModel" and (qd_parameter_name="' +
						deletedParamName +
						'")]'
				);
				if (!node) {
					var tgvDeletedParameter = tgvParameterMap[deletedParamName];
					var deletedViewModelItem = aras.newIOMItem(
						'rb_ParameterViewModel',
						'add'
					);
					deletedViewModelItem.setID(aras.generateNewGUID());

					updateViewModelItemByTgvParameter(
						deletedParamName,
						deletedViewModelItem,
						tgvDeletedParameter
					);

					deletedViewModelItem.setProperty('fed_css', invalidCss);
					relRoot.appendChild(deletedViewModelItem.node.cloneNode(true));
				}
			}

			var dialog = ArasModules.MaximazableDialog.show('iframe', {
				aras: aras,
				title: this.getResource('map_parameters_form_title'),
				dialogWidth: 690,
				dialogHeight: 360,
				content:
					'relationshipsGrid.html?db=' +
					aras.getDatabase() +
					'&relTypeID=' +
					aras.getRelationshipTypeId('rb_ParameterViewModel') +
					'&ITName=rb_ParameterViewModel&editMode=' +
					(window.isEditMode ? 1 : 0) +
					'&tabbar=1&toolbar=0&where=formtool&itemID=' +
					window.parent.itemID +
					'&custom_toolbar_src=../Modules/aras.innovator.TreeGridView/html/saveCancelToolbar.html'
			});

			var close = dialog.close;
			var paramViewModelItems = item.selectNodes(
				'Relationships/Item[@type="rb_ParameterViewModel"]'
			);

			dialog.close = function (result) {
				if (!result.applyChanges) {
					return close.apply(dialog, arguments);
				}
				var isInvalid = Array.prototype.some.call(
					paramViewModelItems,
					function (viewModelItem) {
						if (aras.getItemProperty(viewModelItem, 'visible') !== '1') {
							return false;
						}

						return !aras.checkItem(viewModelItem);
					}
				);

				if (!isInvalid) {
					return close.apply(dialog, arguments);
				}
			};
			dialog.promise.then(function (result) {
				var applyChanges = result && result.applyChanges;
				if (applyChanges) {
					for (var i = 0; i < paramViewModelItems.length; i++) {
						var viewModelItem = paramViewModelItems[i];
						var id = aras.getItemProperty(viewModelItem, 'tgv_parameter_id');
						var visible = aras.getItemProperty(viewModelItem, 'visible');
						var tgvParameter = item.selectSingleNode(
							'Relationships/Item[@type="rb_QueryDefinitionParameterMap" and @id="' +
								id +
								'"]'
						);
						var isVisible = visible === '1';

						if (!tgvParameter) {
							if (!isVisible) {
								continue;
							}
							var newTGVParameter = aras.newIOMItem(
								'rb_QueryDefinitionParameterMap',
								'add'
							);
							newTGVParameter.setID(aras.generateNewGUID());
							newTGVParameter.setProperty(
								'qd_parameter_name',
								aras.getItemProperty(viewModelItem, 'qd_parameter_name')
							);
							tgvParameter = newTGVParameter.node.cloneNode(true);
							relRoot.appendChild(tgvParameter);
						} else if (tgvParameter.getAttribute('isNew') !== '1') {
							var actionType = isVisible ? 'update' : 'delete';
							tgvParameter.setAttribute('action', actionType);
						} else if (!isVisible) {
							relRoot.removeChild(tgvParameter);
							continue;
						}

						aras.setItemProperty(
							tgvParameter,
							'label',
							aras.getItemProperty(viewModelItem, 'label')
						);
						aras.setItemProperty(
							tgvParameter,
							'user_input_default_value',
							aras.getItemProperty(viewModelItem, 'user_input_default_value')
						);
						aras.setItemProperty(
							tgvParameter,
							'user_input_data_type',
							aras.getItemProperty(viewModelItem, 'user_input_data_type')
						);
						aras.setItemProperty(tgvParameter, 'user_input_data_source', '');
						var dataSourceItem = viewModelItem.selectSingleNode(
							'user_input_data_source'
						);
						if (dataSourceItem) {
							tgvParameter.replaceChild(
								dataSourceItem.cloneNode(true),
								tgvParameter.selectSingleNode('user_input_data_source')
							);
						}
						aras.setItemProperty(
							tgvParameter,
							'user_input_pattern',
							aras.getItemProperty(viewModelItem, 'user_input_pattern')
						);
					}
				}

				cleanViewModelContainer();
			});

			dialog.dialogNode
				.querySelector('iframe')
				.addEventListener('load', function handler() {
					this.contentWindow.onMenuCreate = function () {
						return false;
					};
					this.removeEventListener('load', handler);
				});
		};
		ConfiguratorController.prototype._showDataTemplate = function (
			rowId,
			columnIndex
		) {
			if (
				columnIndex === null ||
				columnIndex === undefined ||
				rowId === null ||
				rowId === undefined
			) {
				//sometimes it happens that gridDoubleClick occurs with empty columnIndex.
				//note that columnIndex = 0 - possible and valid value.
				return;
			}
			var grid = this._view.grid;
			var treeGridRowModel = grid.getTreeRowModel(rowId);
			var rowIndex = grid.getRowIndex(rowId);
			var targetDomNode = grid.grid_Experimental.views.views[0].getRowNode(
				rowIndex
			);
			targetDomNode =
				targetDomNode && targetDomNode.querySelectorAll('td')[columnIndex];
			var columnModel = grid.getTreeGridColumnModel(columnIndex);
			// var self = this;
			if (treeGridRowModel.isCandidate) {
				return;
			}
			var mappings = treeGridRowModel.columnMappings;
			var columnMapping = mappings.reduceRight(function (a, c) {
				return c.sourceId === columnModel.id ? c : a;
			}, null);
			var viewModel = this._arasObject.newIOMItem('rb_ColumnMapping');
			var template = columnMapping && columnMapping.dataTemplate;
			if (template) {
				viewModel.setProperty('data_template', template);
			}
			var repository = this._treeGridRepository;
			var currentBranch = repository.getCurrentBranch();
			var graphNode = currentBranch.getNodeById(treeGridRowModel.uniqueId);
			var qbAliases = repository.getAliasesForNode(graphNode, false);
			var qbCellTemplateValuesByAlias = {};
			qbAliases.map(function (alias) {
				if (alias) {
					qbCellTemplateValuesByAlias[
						alias
					] = repository.getQbCellTemplateValuesForAlias(graphNode, alias);
				}
			});
			this._tooltipDialogUtils.showTooltipDialog(
				viewModel.node,
				{
					around: targetDomNode,
					qbCellTemplateValuesByAlias: qbCellTemplateValuesByAlias,
					fieldName: 'data_template'
				},
				{
					formType: isEditMode ? null : 'view',
					formId: '7530807BCA0E47578CF74F487B19016C',
					callbacks: {
						onClose: function () {
							if (!isEditMode) {
								return;
							}
							if (!columnMapping) {
								columnMapping = repository.createColumnMapping(
									graphNode,
									columnModel
								);
							}
							var dataTemplateValue = viewModel.getProperty('data_template');
							columnMapping.dataTemplate = dataTemplateValue;

							repository.addOrUpdateColumnMapping(columnMapping);
							this._cellEditor.needReloadView();
						}.bind(this),
						onCancel: function () {}
					}
				}
			);
		};
		return ConfiguratorController;
	})();
	return ConfiguratorController;
});
