define(['dojo/_base/config', 'dojo/_base/declare'], function (config, declare) {
	return declare('TgvTreeGridFormatters', [], {
		_tgvTreeGrid: null,

		constructor: function (tgvTreeGrid) {
			this._tgvTreeGrid = tgvTreeGrid;
			var self = this;
			Grid.formatters.iconText = function (headId, rowId, value) {
				return {
					children: [
						self.getIconChild(rowId),
						{
							tag: 'span',
							children: [value]
						}
					]
				};
			};

			Grid.formatters.iconInteger = function (headId, rowId, value) {
				return {
					children: [
						self.getIconChild(rowId),
						{
							tag: 'span',
							children: [value]
						}
					]
				};
			};

			Grid.formatters.iconLink = function (headId, rowId, value, grid) {
				return (function () {
					var result = Grid.formatters.link(headId, rowId, value, grid);
					result.children.unshift(self.getIconChild(rowId));
					return result;
				})();
			};

			Grid.formatters.iconList = function (headId, rowId, value, grid) {
				return (function () {
					var result = Grid.formatters.list(headId, rowId, value, grid);
					result.children.unshift(self.getIconChild(rowId));
					return result;
				})();
			};

			Grid.formatters.list = function (headId, rowId, value) {
				return {
					children: [
						{
							tag: 'span',
							children: [
								(function () {
									var row = self._tgvTreeGrid.getRow(rowId);
									var listName =
										row.cells[self._tgvTreeGrid.getCellIndex(headId)].listName;
									if (!listName) {
										return value;
									}
									var listId = aras.getListId(listName);
									if (!listId) {
										return value;
									}
									var node = aras.MetadataCache.GetList([listId], [])
										.getResult()
										.selectSingleNode(
											'Item/Relationships/Item[@type="Value" and value="' +
												value +
												'"]/label'
										);
									if (!node) {
										return value;
									}
									return node.text;
								})()
							]
						}
					]
				};
			};

			Grid.formatters.date = function (headId, rowId, value) {
				return {
					children: [
						{
							tag: 'span',
							children: [
								(function () {
									var row = self._tgvTreeGrid.getRow(rowId);
									var cell = row.cells[self._tgvTreeGrid.getCellIndex(headId)];
									var dateFormat = cell.dateFormat;
									return config.arasContext.converter.convertFromNeutral(
										value,
										'date',
										aras.getDotNetDatePattern(dateFormat) || 'MM/dd/yyyy'
									);
								})()
							]
						}
					]
				};
			};

			Grid.formatters.iconDate = function (headId, rowId, value) {
				return (function () {
					var result = Grid.formatters.date(headId, rowId, value);
					result.children.unshift(self.getIconChild(rowId));
					return result;
				})();
			};

			Grid.formatters.decimal = function (headId, rowId, value) {
				return {
					children: [
						{
							tag: 'span',
							children: [
								(function () {
									var row = self._tgvTreeGrid.getRow(rowId);
									var cell = row.cells[self._tgvTreeGrid.getCellIndex(headId)];
									var scale = cell.scale || 0;
									var precision = cell.precision || 0;
									var result = config.arasContext.converter.convertFromNeutral(
										value,
										'decimal',
										aras.getDecimalPattern(precision, scale)
									);
									return result;
								})()
							]
						}
					]
				};
			};

			Grid.formatters.iconDecimal = function (headId, rowId, value) {
				return (function () {
					var result = Grid.formatters.decimal(headId, rowId, value);
					result.children.unshift(self.getIconChild(rowId));
					return result;
				})();
			};

			Grid.formatters.booleanTgv = function (headId, rowId, value, grid) {
				return (function () {
					var result = Grid.formatters.boolean(
						headId,
						rowId,
						!value || value === '0' ? false : true,
						grid
					);
					return result;
				})();
			};

			Grid.formatters.iconBooleanTgv = function (headId, rowId, value, grid) {
				return (function () {
					var result = Grid.formatters.booleanTgv(headId, rowId, value, grid);
					result.children.unshift(self.getIconChild(rowId));
					return result;
				})();
			};

			Grid.formatters.float = function (headId, rowId, value) {
				return {
					children: [
						{
							tag: 'span',
							children: [
								config.arasContext.converter.convertFromNeutral(value, 'float')
							]
						}
					]
				};
			};

			Grid.formatters.iconFloat = function (headId, rowId, value) {
				return (function () {
					var result = Grid.formatters.float(headId, rowId, value);
					result.children.unshift(self.getIconChild(rowId));
					return result;
				})();
			};

			Grid.formatters.color = function (headId, rowId, value) {
				return {
					attrs: {
						style: 'background-color: ' + value
					},
					children: []
				};
			};

			Grid.formatters.iconColor = function (headId, rowId, value) {
				return (function () {
					var result = Grid.formatters.color(headId, rowId, value);
					result.children.unshift(self.getIconChild(rowId));
					return result;
				})();
			};
		},

		getIconChild: function (rowId) {
			return {
				tag: 'div',
				className:
					'img-container' +
					(this._tgvTreeGrid.getRow(rowId).isRef ? ' glyph_icon' : ''),
				children: [
					{
						tag: 'img',
						className: 'aras-grid-row-icon',
						attrs: {
							src: this._getImageSrc(rowId)
						}
					}
				]
			};
		},

		_getImageSrc: function (rowId) {
			var iPathKey = this._tgvTreeGrid.getRow(rowId).iPath || ''; //iconPath key
			var iPath =
				iPathKey === ''
					? ''
					: this._tgvTreeGrid.compressionDictionariesByRowId[rowId]
							.iconPathByKey[iPathKey];
			var imagesRelPath = dojo.baseUrl + '../../cbin/';
			var src;

			if (iPath) {
				if (iPath.match(/\{[\s\S]*?}/)) {
					iPath = '../images/IconTemplate.svg';
				}
				if (iPath.indexOf('tgv=1') < 0 && iPath.indexOf('vault:///') < 0) {
					// add suffix to avoid taking svg icon(without suffix) that already resized in browser cache.
					// (bug of IE and Edge)
					iPath += iPath.indexOf('?') < 0 ? '?tgv=1' : '&tgv=1';
				}
				iPath = config.arasContext.adjustIconUrl(iPath);
				src = (/^http.*/i.test(iPath) ? '' : imagesRelPath) + iPath;
			}
			return src;
		}
	});
});
