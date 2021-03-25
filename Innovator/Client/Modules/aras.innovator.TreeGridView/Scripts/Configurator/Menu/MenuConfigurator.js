define(['TreeGridView/Scripts/Configurator/Menu/ContextMenuObject'], function (
	ContextMenuObject
) {
	'use strict';
	var MenuConfigurator = (function () {
		function MenuConfigurator(treeGridRepository) {
			this._treeGridRepository = treeGridRepository;
		}
		MenuConfigurator.prototype.getContextMenuObject = function (
			treeGridRowModels,
			columnIndex,
			isCandidatesVisible
		) {
			var rowIds = treeGridRowModels.map(function (model) {
				return model.uniqueId;
			});
			// create and fill contextMenu object
			var contextMenuObject = new ContextMenuObject();
			contextMenuObject.canCombineNodes = this.canCombineNodes(rowIds);
			contextMenuObject.canExecuteAddColumn = this.canExecuteAddColumn();
			contextMenuObject.canExecuteCombine = this.canExecuteCombine(rowIds);
			contextMenuObject.canExecuteHideUnmapped = this.canExecuteHideUnmapped(
				isCandidatesVisible
			);
			contextMenuObject.canExecuteChangeIcon = this.canExecuteChangeIcon(
				rowIds,
				treeGridRowModels
			);
			contextMenuObject.canExecuteMap = this.canExecuteMap(rowIds);
			contextMenuObject.canExecuteMultipleMap = this.canExecuteMultipleMap(
				rowIds
			);
			contextMenuObject.canExecuteMultipleUnmap = this.canExecuteMultipleUnmap(
				rowIds
			);
			contextMenuObject.canExecuteRemoveColumn = this.canExecuteRemoveColumn(
				columnIndex
			);
			contextMenuObject.canExecuteRenameColumn = this.canExecuteRenameColumn();
			contextMenuObject.canExecuteSeparate = this.canExecuteSeparate(
				treeGridRowModels
			);
			contextMenuObject.canExecuteShowUnmapped = this.canExecuteShowUnmapped(
				isCandidatesVisible
			);
			contextMenuObject.canExecuteUnmap = this.canExecuteUnmap(rowIds);
			contextMenuObject.canShowMap = this.canShowMap(rowIds);
			contextMenuObject.canShowMultipleMap = this.canShowMultipleMap(rowIds);
			contextMenuObject.canShowMultipleUnmap = this.canShowMultipleUnmap(
				rowIds
			);
			contextMenuObject.canShowUnmap = this.canShowUnmap(rowIds);
			return contextMenuObject;
		};
		MenuConfigurator.prototype.canCombineNodes = function (graphNodeIds) {
			return this._treeGridRepository.canCombineNodes(graphNodeIds);
		};
		MenuConfigurator.prototype.canExecuteAddColumn = function () {
			return isEditMode;
		};
		MenuConfigurator.prototype.canExecuteRenameColumn = function () {
			return isEditMode;
		};
		MenuConfigurator.prototype.canExecuteRemoveColumn = function (columnIndex) {
			var isTreeColumn = columnIndex === 0;
			return isEditMode && !isTreeColumn;
		};
		MenuConfigurator.prototype.canExecuteHideUnmapped = function (
			isCandidatesVisible
		) {
			return isCandidatesVisible;
		};
		MenuConfigurator.prototype.canExecuteShowUnmapped = function (
			isCandidatesVisible
		) {
			return !isCandidatesVisible;
		};
		MenuConfigurator.prototype.canShowMap = function (rowIds) {
			if (rowIds.length > 1) {
				return false;
			}
			return this._canExecuteMapOnRows(rowIds);
		};
		MenuConfigurator.prototype.canShowMultipleMap = function (rowIds) {
			if (rowIds.length < 2) {
				return false;
			}
			return this._canExecuteMapOnRows(rowIds);
		};
		MenuConfigurator.prototype._canExecuteMapOnRows = function (rowIds) {
			var canShowMap = false;
			for (var i = 0; i < rowIds.length; i++) {
				var branch = this._treeGridRepository.getCurrentBranch();
				var graphNode = branch.getNodeById(rowIds[i]);
				if (this._treeGridRepository.isNodeCanBeMapped(graphNode)) {
					canShowMap = true;
				}
			}
			return canShowMap;
		};
		MenuConfigurator.prototype.canExecuteMap = function (rowIds) {
			if (!isEditMode) {
				return false;
			}
			if (rowIds.length > 1) {
				return false;
			}
			return this._canExecuteMapOnRows(rowIds);
		};
		MenuConfigurator.prototype.canExecuteChangeIcon = function (
			rowIds,
			treeGridRowModels
		) {
			return (
				this.canExecuteUnmap(rowIds) ||
				this.canExecuteSeparate(treeGridRowModels)
			);
		};
		MenuConfigurator.prototype.canExecuteMultipleMap = function (rowIds) {
			if (!isEditMode) {
				return false;
			}
			return this._canExecuteMapOnRows(rowIds);
		};
		MenuConfigurator.prototype.canExecuteUnmap = function (rowIds) {
			if (!isEditMode) {
				return false;
			}
			if (rowIds.length > 1) {
				return false;
			}
			return this._canExecuteUnmapOnRows(rowIds, false);
		};
		MenuConfigurator.prototype.canExecuteMultipleUnmap = function (rowIds) {
			if (!isEditMode) {
				return false;
			}
			return this._canExecuteUnmapOnRows(rowIds, false);
		};
		MenuConfigurator.prototype._canExecuteUnmapOnRows = function (
			rowIds,
			canUnmapCombining
		) {
			var canShowUnmap = false;
			for (var i = 0; i < rowIds.length; i++) {
				var branch = this._treeGridRepository.getCurrentBranch();
				var graphNode = branch.getNodeById(rowIds[i]);
				if (graphNode.isRecursiveNode) {
					if (graphNode.recursionNodeMapped) {
						canShowUnmap = true;
					}
				} else {
					if (
						this._treeGridRepository.isNodeCanBeUnMapped(
							graphNode,
							canUnmapCombining
						)
					) {
						canShowUnmap = true;
					}
				}
			}
			return canShowUnmap;
		};
		MenuConfigurator.prototype.canShowUnmap = function (rowIds) {
			if (rowIds.length > 1) {
				return false;
			}
			return this._canExecuteUnmapOnRows(rowIds, true);
		};
		MenuConfigurator.prototype.canShowMultipleUnmap = function (rowIds) {
			if (rowIds.length < 2) {
				return false;
			}
			return this._canExecuteUnmapOnRows(rowIds, true);
		};
		MenuConfigurator.prototype.canExecuteCombine = function (rowIds) {
			if (!isEditMode) {
				return false;
			}
			return this.canCombineNodes(rowIds);
		};
		MenuConfigurator.prototype._canExecuteSeparate = function (
			treeGridRowModels
		) {
			var canExecute = false;
			for (var i = 0; i < treeGridRowModels.length; i++) {
				if (treeGridRowModels[i].hasJoinedNodes) {
					return true;
				}
			}
			return canExecute;
		};
		MenuConfigurator.prototype.canExecuteSeparate = function (
			treeGridRowModels
		) {
			if (!isEditMode) {
				return false;
			}
			if (treeGridRowModels.length > 1) {
				return false;
			}
			return this._canExecuteSeparate(treeGridRowModels);
		};
		return MenuConfigurator;
	})();
	return MenuConfigurator;
});
