define(function () {
	'use strict';
	var ConfiguratorCellDefMappper = (function () {
		function ConfiguratorCellDefMappper() {
			this.EMPTY_MARKUP = '';
		}
		ConfiguratorCellDefMappper.prototype.mapTreeColumn = function (column) {
			return {
				columnDefinition: column,
				field: '_item',
				width: column.width + 'px',
				name: column.header,
				formatter: this._templateTreeFormatter
			};
		};
		ConfiguratorCellDefMappper.prototype.mapTemplateColumn = function (column) {
			return {
				columnDefinition: column,
				field: column.name,
				width: column.width + 'px',
				name: column.header,
				cellClasses: 'template-cell',
				get: this._getTemplate,
				formatter: this._templateColumnFormatter
			};
		};
		ConfiguratorCellDefMappper.prototype._getTemplate = function (
			rowIndex,
			item
		) {
			var _this = this;
			if (typeof item === 'string') {
				return item;
			}
			var store = this.grid.store;
			var isCandidate = store.getValue(item, 'isCandidate', true);
			if (isCandidate) {
				return '';
			}
			var validTemplates = store.getValues(item, 'validTemplates');
			function getTemplateMarkup(templateText) {
				if (templateText) {
					var arr = templateText.match(/\{(.*?)\}/g);
					if (arr) {
						for (var i = 0; i < arr.length; i++) {
							var spanClass =
								validTemplates.indexOf(arr[i]) < 0
									? 'template-error'
									: 'template-normal';
							templateText = templateText.replace(
								arr[i],
								'<span class="' + spanClass + '">' + arr[i] + '</span>'
							);
						}
					}
				}
				return templateText;
			}
			var markup = store
				.getValues(item, 'columnMappings')
				.filter(function (mapping) {
					return (
						mapping &&
						mapping.sourceId === _this.columnDefinition.id &&
						mapping.template
					);
				})
				.map(function (mapping) {
					var template =
						mapping.cellViewType === 'List'
							? mapping.getListValueTemplate()
							: mapping.getTemplateText();
					return getTemplateMarkup(template);
				})
				.reduceRight(function (a, c) {
					return c;
				}, '');
			return markup;
		};
		ConfiguratorCellDefMappper.prototype._templateTreeFormatter = function (
			item,
			rowIndex,
			columnIndex,
			cell
		) {
			var _this = this;
			if (typeof item === 'string') {
				return item;
			}
			var store = cell.grid.store;
			var isCandidate = store.getValue(item, 'isCandidate', true);
			var isRecursiveNode = store.getValue(item, 'isRecursiveNode', false);
			var itemTypeName = store.getValue(item, 'itemTypeName', '');
			var recursiveIconDiv = isRecursiveNode
				? '<div class="recursion-from tree-cell-flex"></div>'
				: '<div class="recursion-on tree-cell-flex"></div>';
			if (isCandidate) {
				var candidateContent =
					'<span class="tree-cell-item-type tree-cell-item-type_candidate" > ' +
					itemTypeName +
					' </span> ' +
					recursiveIconDiv;
				return '<div class="tree-cell-wrapper">' + candidateContent + '</div>';
			}
			var nameMarkup =
				'<span class="tree-cell-item-type tree-cell-flex">' +
				itemTypeName +
				'</span>';
			var mappings = store.getValues(item, 'columnMappings');
			// TODO: avoid dublicate of code _getTemplate method
			var validTemplates = store.getValues(item, 'validTemplates');
			function getTemplateMarkup(templateText) {
				if (templateText) {
					var arr = templateText.match(/\{(.*?)\}/g);
					if (arr) {
						for (var i = 0; i < arr.length; i++) {
							var spanClass =
								validTemplates.indexOf(arr[i]) < 0
									? 'template-error'
									: 'template-normal';
							templateText = templateText.replace(
								arr[i],
								'<span class="' + spanClass + '">' + arr[i] + '</span>'
							);
						}
					}
				}
				return templateText;
			}
			var templateMarkup = mappings
				.filter(function (mapping) {
					return (
						mapping &&
						mapping.sourceId === cell.columnDefinition.id &&
						mapping.template
					);
				})
				.map(function (mapping) {
					var template =
						mapping.cellViewType === 'List'
							? mapping.getListValueTemplate()
							: mapping.getTemplateText();
					if (template === null) {
						return _this.EMPTY_MARKUP;
					} else {
						template = getTemplateMarkup(template);
						return '<code class="tree-cell-template">' + template + '</code>';
					}
				})
				.join();
			var markup =
				'<div class="tree-cell-wrapper">' +
				nameMarkup +
				' ' +
				templateMarkup +
				' ' +
				recursiveIconDiv +
				'</div>';
			return markup;
		};
		ConfiguratorCellDefMappper.prototype._templateColumnFormatter = function (
			item,
			rowIndex,
			columnIndex,
			cell
		) {
			if (!item) {
				return item;
			}
			var template = typeof item === 'string' ? item : item['text_template'];
			var markup = '<code class="template-cell">' + template + '</code>';
			return markup;
		};
		return ConfiguratorCellDefMappper;
	})();
	return ConfiguratorCellDefMappper;
});
