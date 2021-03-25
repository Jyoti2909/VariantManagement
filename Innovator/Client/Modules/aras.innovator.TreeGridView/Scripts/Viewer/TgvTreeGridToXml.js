define(['dojo/_base/declare'], function (declare) {
	return declare('TgvTreeGridToXml', [], {
		toXml: function (tgvTreeGrid) {
			const grid = tgvTreeGrid._grid;

			const getColumnAttributesXML = function (column, index) {
				let xml = " width='" + parseInt(column.width) + "'";

				const columnOrder = grid.settings.indexHead.indexOf(index) + 2;
				xml += " order='" + columnOrder + "'";

				return xml;
			};

			const getGridHeadXML = function () {
				let xml = '<thead>';
				xml += '<th> </th>';
				xml += '<th>Level</th>';
				const cells = grid._head._store;
				cells.forEach(function (cell, index) {
					xml +=
						'<th>' +
						(' ' === cell.label ? '' : encodeHTML(cell.label)) +
						'</th>';
				});
				xml += '</thead>';
				xml += '<columns>';
				xml += "<column width='10' order='0' align='c' />";
				xml += "<column width='50' order='1' />";
				cells.forEach(function (cell, index) {
					xml +=
						'<column' + getColumnAttributesXML(cell, index) + " align='l'/>";
				});
				xml += '</columns>';
				return xml;
			};

			const encodeHTML = function (html) {
				if (typeof html == 'string') {
					return html
						.replace(/&/g, '&amp;')
						.replace(/</g, '&lt;')
						.replace(/>/g, '&gt;')
						.replace(/"/g, '&quot;')
						.replace(/'/g, '&apos;');
				}
				return html;
			};

			const getRowXml = function (rowId, level) {
				const row = grid.rows.get(rowId);
				let xml = '<tr>';

				if (row.children && grid.settings.expanded.has(rowId)) {
					xml += '<td>-</td>';
				} else if (row.children) {
					xml += '<td>+</td>';
				} else {
					xml += '<td/>';
				}

				xml += '<td>';
				for (let i = 0; i < level; i++) {
					xml += '   ';
				}
				xml += level + 1 + '</td>';

				const cells = grid._head._store;
				cells.forEach(function (cell, columnName) {
					xml += '<td';

					let tgvTreeGridRow = tgvTreeGrid._rows[rowId];
					const type =
						tgvTreeGridRow.cells[tgvTreeGrid.getCellIndex(columnName)].viewType;
					if (!!type) {
						let upperCaseVeiwType = type.toUpperCase();
						if (upperCaseVeiwType === 'DATE') {
							xml += " sort='DATE'";
						} else if (
							upperCaseVeiwType === 'FLOAT' ||
							upperCaseVeiwType === 'DECIMAL' ||
							upperCaseVeiwType === 'INTEGER'
						) {
							xml += " sort='NUMERIC'";
						}
					}
					xml += '>';
					xml += encodeHTML(row[columnName]) + '</td>';
				});

				xml += '</tr>';

				if (row.children.length > 0 && grid.settings.expanded.has(rowId)) {
					level++;
					grid.settings.indexTreeRows[rowId].forEach(function (child) {
						xml += getRowXml(child, level);
					});
				}

				return xml;
			};

			let gridXml = '<table>';

			gridXml += getGridHeadXML();

			grid.roots.forEach(function (root) {
				gridXml += getRowXml(root, 0);
			});

			gridXml += '</table>';
			return gridXml;
		}
	});
});
