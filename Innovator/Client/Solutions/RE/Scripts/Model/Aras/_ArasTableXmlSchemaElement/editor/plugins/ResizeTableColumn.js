define([
	'dojo',
	'dijit',
	'TechDoc/Aras/Client/Controls/TechDoc/ViewModel/Aras/_ArasTableXmlSchemaElement/editor/plugins/ResizeTableColumn',
],
function(dojo, dijit, TechDocResizeTableColumn) {
	/* eslint-disable-next-line max-len */
	var ResizeTableColumn = dojo.declare('Aras.Client.Controls.Requirement.ViewModel.Aras._ArasTableXmlSchemaElement.editor.plugins.ResizeTableColumn', [TechDocResizeTableColumn], {
		setEditor: function(editor) {
			// summary:
			//		Handle the drag&drop events
			// editor:
			//		The editor which this plugin belongs to
			// tags:
			//		protected
			var ruleDiv = this.ruleDiv;
			var viewmodel = editor.viewmodel;
			var isEditable = this.isEditable;

			this.editor = editor;
			this.editor.customUndo = false;
			this.onEditorLoaded();

			// The content of the editor is loaded asynchronously, so the function
			// should be called when it is loaded.
			if (isEditable) {
				editor.onLoadDeferred.addCallback(dojo.hitch(this, function() {
					this.connect(editor.editNode, 'onmousemove', function(evt) {
						var editorCoords = dojo.position(editor.iframe, true);
						var ex = editorCoords.x;

						if (!this.isDragging) {
							// If it is just a movement, put the div at the edge of the
							// target cell so that when the cursor hover on it, it will
							// change to the col-resize style.
							var obj = evt.target;

							//  Only for cells that have table
							if (obj.tagName && obj.tagName.toLowerCase() == 'td') {
								var table = getTable(obj);

								if (table) {
									var tableWrappedObject = viewmodel.GetElementById(table.id);
									var isNearRightBorder;

									if (tableWrappedObject && (!tableWrappedObject.is('ArasTableXmlSchemaElement'))) {
										moveSpliterDivOut();
										return;
									}

									isNearRightBorder = (evt.clientX > ex + obj.offsetLeft + obj.offsetWidth - 5);
									if (isBoundary(obj, 'first') && !isNearRightBorder) {
										moveSpliterDivOut();
										return;
									}

									//   Show spliter near column borders outclude first and last border
									var nextCell = nextSibling(obj);
									var actualCell = (nextCell && isNearRightBorder) ? nextCell : obj;
									var actualCellCoord = dojo.position(actualCell);
									var pos = ex + actualCellCoord.x - 2;

									dojo.style(ruleDiv, {
										position: 'absolute',
										cursor: 'col-resize',
										display: 'block',
										width: '4px',
										backgroundColor: 'transparent',
										top: editorCoords.y + actualCellCoord.y + 'px',
										left: pos + 'px',
										height: actualCellCoord.h + 'px'
									});
									this.activeCell = actualCell;
								}
							} else {
								moveSpliterDivOut();
							}
						} else {
							// Begin to drag&drop splitter
							//  editorCoords - coordinates of edotor frame in window
							//  activeCellEndX  - coordinates of rght border of active cell
							//  siblingCellX  - coordinates of previous cell in editor frame
							var activeCell = this.activeCell;
							var activeCellEndX = activeCell.offsetLeft + activeCell.offsetWidth;
							var sibling = prevSibling(activeCell);
							var siblingCellX = (sibling) ? sibling.offsetLeft : 4;
							var cursorX = evt.clientX;

							// The leading and trailing columns can only be sized to the extent of the containing div.
							if (cursorX > siblingCellX && cursorX < activeCellEndX) {
								dojo.style(ruleDiv, {left: cursorX + editorCoords.x + 'px'});
							}
						}
					});

					this.connect(ruleDiv, 'onmousedown', function(evt) {
						var editorCoords = dojo.position(editor.iframe, true);
						var tableCoords = dojo.position(getTable(this.activeCell));

						this.isDragging = true;
						dojo.style(editor.editNode, {cursor: 'col-resize'});
						dojo.style(ruleDiv, {
							width: '1px',
							left: evt.clientX + 'px',
							top: editorCoords.y + tableCoords.y + 'px',
							height: tableCoords.h + 'px',
							backgroundColor: '#777'
						});
						this.startPositionInPX = evt.clientX;
					});

					this.connect(ruleDiv, 'onmouseup', function(evt) {
						var activeCell = this.activeCell;
						var table = getTable(activeCell);

						this.isDragging = false;
						dojo.style(editor.editNode, {cursor: 'auto'});
						moveSpliterDivOut();
						this.activeCell = null;

						if (table) {
							var tableWrappedObject = viewmodel.GetElementById(table.id);
							var colWidthList = tableWrappedObject.ColsWidth();
							var cellWrappedObject = viewmodel.GetElementById(activeCell.id);
							var index = cellWrappedObject.Parent.ChildItems().index(cellWrappedObject);
							var deltapx = evt.clientX - this.startPositionInPX;

							if (deltapx < 3 && deltapx > -3) {
								return;
							}

							/*
							offsetwidth == (col width %) => newWidth = (col width %) * (offsetwidth - delta) / offsetwidth
							*/

							var widthInPx = activeCell.offsetWidth;
							var widthInPercent = colWidthList[index];
							var newWidthPerccent = widthInPercent * (widthInPx - deltapx) / widthInPx | 0;

							if (newWidthPerccent) {
								var newLeftCellWidthPercect = colWidthList[index - 1] - (newWidthPerccent - widthInPercent);

								colWidthList[index - 1] = newLeftCellWidthPercect;
								colWidthList[index] = newWidthPerccent;
								tableWrappedObject.ColsWidth(colWidthList);
							}
						}
					});
				}));

				editor.onLoadDeferred.then(dojo.hitch(this, function() {
					var tablePlugin = this.editor._tablePluginHandler;

					if (tablePlugin) {
						// this plugin inherits from dojox.editor.TablePlugins
						// there (in "initialize" method) several handlers attached to editorNode
						// we need to remove "mouseup" handler (first in "_myListeners" array),
						// because it duplicates existing editor listener, which attached in RichText.onLoad
						var mouseUpListener = tablePlugin._myListeners.shift();
						mouseUpListener.remove();
					}
				}));
			}

			function moveSpliterDivOut() {
				dojo.style(ruleDiv, {display: 'none', top: '-10000px'});
			}

			function isBoundary(n, b) {
				// summary:
				//		Check if the current cell is in the first column or
				//		in the last column.
				// n:
				//		The node of a table cell
				// b:
				//		Indicate if the cell node is compared with the first coluln
				//		or the last column
				var nodes = dojo.query('> td', n.parentNode);

				switch (b) {
					case 'first':
						return nodes[0] == n;
					case 'last':
						return nodes[nodes.length - 1] == n;
					default:
						return false;
				}
			}

			function prevSibling(/*DomNode*/ node) {
				// summary:
				//		Get the previous cell in row
				// node:
				//		The table cell
				node = node.previousSibling;

				while (node) {
					if (node.tagName && node.tagName.toLowerCase() == 'td') {
						break;
					}
					node = node.previousSibling;
				}

				return node;
			}

			function nextSibling(/*DomNode*/ node) {
				// summary:
				//		Get the next cell in row
				// node:
				//		The table cell
				node = node.nextSibling;

				while (node) {
					if (node.tagName && node.tagName.toLowerCase() == 'td') {
						break;
					}
					node = node.nextSibling;
				}

				return node;
			}

			function getTable(/*DomNode*/ t) {
				// summary:
				//		Get the table that this cell belongs to.
				// t:
				//		The table cell
				while ((t = t.parentNode) && t.tagName.toLowerCase() != 'table') { }
				return (t.id) ? t : null;
			}
		}
	});

	dojo.subscribe(dijit._scopeName + '.Editor.getPlugin', null, function(o) {
		// make first character lower case
		if (o.args && o.args.command) {
			var cmd = o.args.command.charAt(0).toLowerCase() + o.args.command.substring(1, o.args.command.length);

			if (cmd == 'resizeTableColumn') {
				o.plugin = new ResizeTableColumn({viewmodel: o.editor.viewmodel});
			}
		}
	});

	return ResizeTableColumn;
});
