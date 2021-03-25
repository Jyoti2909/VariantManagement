define(function () {
	'use strict';
	var ValidationModule = (function () {
		function ValidationModule(viewDefinition, queryDefinition, intellisense) {
			this._viewDefinition = viewDefinition;
			this._queryDefinition = queryDefinition;
			this._intellisense = intellisense;
		}
		ValidationModule.prototype.validateColumnMappings = function (branch) {
			var _this = this;
			branch.visit(function (graphNode) {
				if (!graphNode.isCandidate) {
					var columnMappings = graphNode.treeRowRefId
						? _this.getColumnMappingForTreeRow(graphNode.treeRowRefId)
						: [];
					var validTemplates = _this.getAllValidMappingTemplates(
						graphNode,
						branch
					);
					graphNode.hasMappingErrors = _this._hasMappingErrors(
						columnMappings,
						validTemplates
					);
					graphNode.validTemplates = validTemplates;
				}
			});
		};
		ValidationModule.prototype.validateViewDefinition = function () {
			var errors = [];
			var rootRows = this._viewDefinition.getRootTreeRows();
			for (var i = 0; i < rootRows.length; i++) {
				this._validateOnExistingQueryItem(rootRows[i], errors);
				this._traversalViewDefinition(rootRows[i], errors);
			}
			return errors;
		};
		ValidationModule.prototype._traversalViewDefinition = function (
			rootRow,
			errors
		) {
			var childNodes = this._viewDefinition.getChildrenTreeRow(rootRow);
			for (var i = 0; i < childNodes.length; i++) {
				this._validateOnExistingQueryItem(childNodes[i], errors);
				this._traversalViewDefinition(childNodes[i], errors);
			}
		};
		ValidationModule.prototype._validateOnExistingQueryItem = function (
			treeRow,
			errors
		) {
			if (treeRow.queryItemRefId) {
				var existQueryItem = this._queryDefinition.getQueryItem(
					treeRow.queryItemRefId
				);
				if (!existQueryItem && treeRow.refId) {
					errors.push({
						treeRowRefId: treeRow.refId,
						queryItemRefId: treeRow.queryItemRefId
					});
				}
			}
		};
		ValidationModule.prototype._hasMappingErrors = function (
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
						var templateIcon = mapping.getTemplateIcon();
						var textRes = self._checkOnValidTemplate(
							templateText,
							validTemplates
						);
						var iconRes = self._checkOnValidTemplate(
							templateIcon,
							validTemplates
						);
						if (textRes || iconRes) {
							hasErrors = true;
						}
					}
				});
			}
			return hasErrors;
		};
		ValidationModule.prototype._checkOnValidTemplate = function (
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
		ValidationModule.prototype.getAllValidMappingTemplates = function (
			graphNode,
			branch
		) {
			var self = this;
			var allCombinations = [];
			if (graphNode) {
				var queryAliases = this._intellisense.getAliasesForNode(
					graphNode,
					false,
					branch
				);
				var qbCellTemplateValuesByAlias = {};
				var propertiesByAlias = [];
				queryAliases.forEach(function (alias) {
					var propertiesPerAlias = self._intellisense.getQbCellTemplateValuesForAlias(
						graphNode,
						alias,
						branch
					);
					propertiesByAlias = propertiesByAlias.concat(propertiesPerAlias);
					var combinationsPerAlias = propertiesPerAlias.map(function (
						property
					) {
						return '{' + alias + '.' + property + '}';
					});
					allCombinations = allCombinations.concat(combinationsPerAlias);
				});
				var onlyProperties = this.removeDublicateProperties(propertiesByAlias);
				var combinationsForProperties = [];
				onlyProperties.forEach(function (property) {
					combinationsForProperties.push('{' + property + '}');
				});
				allCombinations = allCombinations.concat(combinationsForProperties);
			}
			return allCombinations;
		};
		ValidationModule.prototype.removeDublicateProperties = function (
			propertiesByAlias
		) {
			var exists = {};
			var res = [];
			for (var i = 0; i < propertiesByAlias.length; i++) {
				var property = propertiesByAlias[i];
				if (!exists[property]) {
					exists[property] = true;
					res.push(property);
				} else {
					var index = res.indexOf(property);
					if (index > -1) {
						res.splice(index, 1);
					}
				}
			}
			return res;
		};
		ValidationModule.prototype.getColumnMappingForTreeRow = function (
			rowRefId
		) {
			return this._viewDefinition.getColumnsMappingForTreeRow(rowRefId);
		};
		return ValidationModule;
	})();
	return ValidationModule;
});
