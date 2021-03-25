define([
	'dojo/_base/declare',
	'dojo/_base/lang',
	'dojo/_base/connect',
	'dojo/_base/config',
	'dojox/gfx',
	'dojox/gfx/Moveable',
	'./ContextMenu',
	'dijit/_base/popup',
	'dojo/_base/event'
], function (
	declare,
	lang,
	connect,
	config,
	gfx,
	Moveable,
	ContextMenu,
	popup,
	event
) {
	lang.extend(ContextMenu, {
		onItemClick: function () {
			popup.close();
		}
	});

	var getImageData = function (wfNode, image, defaultSize) {
		var img_dx = (image.width - defaultSize) / 2,
			img_dy = (image.height - defaultSize) / 2,
			transform = wfNode.group.getTransform() || { dx: 0, dy: 0 },
			scale = (img_dx < 0 ? image.width : defaultSize) / image.width;

		return {
			x: (wfNode.x - transform.dx + (img_dx < 0 ? -img_dx : 0)) / scale,
			y: (wfNode.y - transform.dy + (img_dy < 0 ? -img_dy : 0)) / scale,
			width: image.width,
			height: image.height,
			src: config.baseUrl + '../../cbin/' + wfNode.img,
			scale: scale
		};
	};

	var createInVisibleImage = function () {
		var image = document.createElement('img');
		image.style.position = 'absolute';
		image.style.top = '-9999px';
		document.body.appendChild(image);
		return image;
	};

	var events = {
		onClickGlobal: function (e) {
			if (!e.gfxTarget) {
				this.unselectAll();
				popup.close();
			}
			this.onClick('', e);

			var val = this._values;
			if (val.startAddTr) {
				val.surface.remove(val.startAddTr.group);
				val.startAddTr.group = null;
				delete val.startAddTr;
			}
		},
		onMoveGlobal: function (e) {
			var val = this._values;

			if (val.startAddTr) {
				var node = val.nodesId[val.startAddTr.node],
					group = val.startAddTr.group,
					size = this.nodes.settings.size / 2,
					nodeCenter = { x: node.x + size, y: node.y + size },
					parentNode = this._values.surface._parent,
					cursorPosition = {
						x: e.clientX + parentNode.scrollLeft,
						y: e.clientY + parentNode.scrollTop
					},
					distanceToNode = Math.sqrt(
						Math.pow(nodeCenter.x - cursorPosition.x, 2) +
							Math.pow(nodeCenter.y - cursorPosition.y, 2)
					);

				if (
					distanceToNode >=
					Math.sqrt(2) * size + this.transitions.settings.arrowSize
				) {
					var nodeXY = this.transitions._positionTransition(
							nodeCenter.x,
							nodeCenter.y,
							cursorPosition.x,
							cursorPosition.y
						),
						lineCoors = {
							x1: nodeXY.x,
							y1: nodeXY.y,
							x2: cursorPosition.x + (nodeCenter.x > cursorPosition.x ? 2 : -2),
							y2: cursorPosition.y + (nodeCenter.y > cursorPosition.y ? 2 : -2)
						},
						arrowCoors = this.transitions._arrowHead(
							lineCoors.x1,
							lineCoors.y1,
							lineCoors.x2,
							lineCoors.y2
						);

					if (group) {
						group.children[0].setShape(lineCoors);
						group.children[1].setShape(arrowCoors);
					} else {
						group = val.surface.createGroup();
						var color = this.transitions.settings.colorSelect;
						group.createLine(lineCoors).setStroke(color);
						group.createPolyline(arrowCoors).setStroke(color).setFill(color);
						val.startAddTr.group = group;
					}
				} else if (group) {
					val.surface.remove(val.startAddTr.group);
					val.startAddTr.group = null;
				}
			}
		},
		onLeave: function (e) {
			if (this.draggingObject) {
				this.draggingObject.destroy();
				this.draggingObject = null;
			}
		},
		onContextMenu: function (e) {
			popup.close();
			var val = this._values;
			if (!val.startAddTr) {
				var id = e.gfxTarget ? e.gfxTarget.parent.id : null,
					parentElement = this._values.surface._parent,
					popupPosition = { x: e.clientX, y: e.clientY },
					locationArgument = {
						x: popupPosition.x + parentElement.scrollLeft,
						y: popupPosition.y + parentElement.scrollTop
					},
					isBreak = false;

				// select contextMenu target
				if (this.nodes.is(id)) {
					this.nodes.select(id, true);
				} else {
					this.transitions.select(id, true);
				}

				if (e.gfxTarget && e.gfxTarget.getShape().type === 'circle') {
					var shape = e.gfxTarget.getShape(),
						transform = e.gfxTarget.getTransform() || { dx: 0, dy: 0 };
					locationArgument.x = shape.cx + transform.dx;
					locationArgument.y = shape.cy + transform.dy;
					isBreak = true;
				}
				this.onMenuInit(
					id,
					{ x: popupPosition.x, y: popupPosition.y },
					isBreak
				);
				if (this._values.showMenu && this.contextMenu.getItemCount() > 0) {
					popup.open({
						popup: this.contextMenu.menu,
						x: popupPosition.x,
						y: popupPosition.y
					});
					this.contextMenu.menu.domNode.focus();
					this.contextMenu.rowId = {
						id: id,
						location: { x: locationArgument.x, y: locationArgument.y },
						isBreak: isBreak
					};
				}
			}
			event.stop(e);
		},
		onClickItem: function (e) {
			var id = e.gfxTarget.parent.id;
			var val = this._values;
			popup.close();

			if (val.startAddTr) {
				if (val.startAddTr.group) {
					val.surface.remove(val.startAddTr.group);
					val.startAddTr.group = null;
				}

				var source = val.startAddTr.node;
				delete val.startAddTr;
				if (this.nodes.is(id) && source !== id) {
					this.transitions.endAdd({ source: source, destination: id });
				}
				event.stop(e);
			} else {
				if (this.nodes.is(id)) {
					this.nodes.select(id, true);
				} else {
					this.transitions.select(id, true);
				}
				this.onClick(id, e);
			}
		},
		moveTransition: function (obj, move) {
			var tr = this._values.transitionsId[obj.shape.parent.id],
				shape = obj.shape.getShape(),
				trans = obj.shape.getTransform() || { dx: 0, dy: 0 },
				x = shape.cx + trans.dx - move.dx,
				y = shape.cy + trans.dy - move.dy,
				transitions = this.transitions,
				workflow = this.transitions.workflow,
				segment,
				segmentIndex;

			for (var i = 0; i < tr.segment.length; i += 1) {
				if (tr.segment[i].x === x && tr.segment[i].y === y) {
					segment = tr.segment[i];
					segmentIndex = i;
					break;
				}
			}
			segment.x += move.dx;
			segment.y += move.dy;

			tr.line.setShape({ path: this.transitions._getPath(tr) });
			x = tr.line.segments[tr.line.segments.length - 1];
			var x2 = tr.line.segments[tr.line.segments.length - 2];
			tr.arrow.setShape({
				points: transitions._arrowHead(
					x2.args[0],
					x2.args[1],
					x.args[0],
					x.args[1]
				)
			});

			var source = workflow._values.nodesId[tr.source],
				destination = workflow._values.nodesId[tr.destination],
				nodeSize = workflow.nodes.settings.size / 2;

			var startPosition = tr.segment[segmentIndex - 1]
				? tr.segment[segmentIndex - 1]
				: transitions._positionTransition(
						source.x + nodeSize,
						source.y + nodeSize,
						segment.x,
						segment.y
				  );
			var pathClickArea = this.transitions._getPathClickArea(
				startPosition,
				segment,
				true
			);
			if (segmentIndex === 0) {
				tr.line.clickArea.setShape({ points: pathClickArea });
			} else {
				tr.segment[segmentIndex - 1].clickArea.setShape({
					points: pathClickArea
				});
			}

			var endPosition = tr.segment[segmentIndex + 1]
				? tr.segment[segmentIndex + 1]
				: transitions._positionTransition(
						destination.x + nodeSize,
						destination.y + nodeSize,
						segment.x,
						segment.y
				  );
			startPosition = transitions._positionTransition(
				segment.x,
				segment.y,
				endPosition.x,
				endPosition.y,
				true
			);
			pathClickArea = transitions._getPathClickArea(
				startPosition,
				endPosition,
				true
			);
			tr.segment[segmentIndex].clickArea.setShape({ points: pathClickArea });
		},

		moveText: function (obj, move) {
			var tr = this._values.transitionsId[obj.shape.parent.id];
			if (tr.labelX === 0 && tr.labelY === 0) {
				var source = this._values.nodesId[tr.source];
				var pos = this.transitions._positionLabel(tr);
				var nodeSettings = this.nodes.settings;
				tr.labelX = pos.x - source.x - nodeSettings.size / 2;
				tr.labelY = pos.y - source.y - nodeSettings.sizeImage / 2;
			}
			tr.labelX += move.dx;
			tr.labelY += move.dy;
		},

		moveNode: function (obj, move) {
			if (move.dx || move.dy) {
				var workflow = this;
				var nodeId = obj.shape.id;

				workflow.draggingObject = obj;

				var node = workflow._values.nodesId[nodeId],
					canvas = workflow._values.surface,
					canvasSize = canvas.getDimensions(),
					groupBox = node.group.getBoundingBox();

				var movedToRightBorder =
						move.dx >= 0 &&
						groupBox.endX + node.group.matrix.dx >= canvasSize.width - 2,
					movedToBottomBorder =
						move.dy >= 0 &&
						groupBox.endY + node.group.matrix.dy >= canvasSize.height - 2;

				// if user moved node to the canvas border then start resize timer
				if (movedToRightBorder || movedToBottomBorder) {
					workflow.nodes.expandStepX = movedToRightBorder ? 2 : 0;
					workflow.nodes.expandStepY = movedToBottomBorder ? 2 : 0;

					if (!workflow.nodes.resizeTimer) {
						workflow.nodes.resizeTimer = setInterval(function () {
							var positionOffset = {
								dx: workflow.nodes.expandStepX,
								dy: workflow.nodes.expandStepY
							};
							node.group.applyTransform(positionOffset);

							var centerRectBox = node.group.children[0].getBoundingBox();
							node.x = parseInt(centerRectBox.x + node.group.matrix.dx);
							node.y = parseInt(centerRectBox.y + node.group.matrix.dy);

							workflow.nodes._drawTransitions(nodeId);
							workflow._resizeCanvas();
						}, 5);
					}
				} else {
					this.nodes._clearResizeTimer();

					var centerRectBox = node.group.children[0].getBoundingBox();
					node.x = parseInt(centerRectBox.x + node.group.matrix.dx);
					node.y = parseInt(centerRectBox.y + node.group.matrix.dy);

					workflow.nodes._drawTransitions(nodeId);
					workflow._resizeCanvas();
				}
			}
		},
		moveStop: function (obj) {
			this.draggingObject = null;
			this.onDrop(obj.host.shape.id || obj.shape.parent.id);

			var id = obj.host.shape.id;
			if (this.nodes.is(id)) {
				this.nodes._clearResizeTimer();
			}
		},
		onBlurContextMenu: function () {
			popup.close();
		}
	};

	var Nodes = declare(null, {
		workflow: null,
		settings: null,
		saltPrefix: 'recipient=workflow',

		constructor: function (obj) {
			this.workflow = obj;
			this.settings = {
				colorName: 'blue',
				colorState: 'silver',
				colorSelect: 'red',
				colorCurrentState: '#fdf386',
				size: 20,
				sizeImage: 20
			};
		},

		is: function (id) {
			return !!this.workflow._values.nodesId[id];
		},

		add: function (node) {
			var w = this.workflow;
			if (!w._values.nodesId[node.uniqueId]) {
				w._values.nodesId[node.uniqueId] = node;
				w._values.nodes.push(node);
			}
			node.transition = [];
			var group = w._values.surface.createGroup();
			group.id = node.uniqueId;
			node.group = group;
			var size = this.settings.size;
			var sizeS = 3;
			var centerRect = group.createRect({
				x: node.x,
				y: node.y,
				width: size,
				height: size
			});
			centerRect.setFill(node.bgColor);
			var mask, x, y, i, transform;

			if (node.isCurrentState) {
				group
					.createRect({
						type: 'currentStateRect',
						x: node.x - 2,
						y: node.y - 2,
						width: 24,
						height: 24,
						r: 4
					})
					.setFill(this.settings.colorCurrentState);
			}

			group.createRect({
				x: node.x - sizeS,
				y: node.y - sizeS,
				width: sizeS,
				height: sizeS
			});
			group.createRect({
				x: node.x + size,
				y: node.y - sizeS,
				width: sizeS,
				height: sizeS
			});
			group.createRect({
				x: node.x + size,
				y: node.y + size,
				width: sizeS,
				height: sizeS
			});
			group.createRect({
				x: node.x - sizeS,
				y: node.y + size,
				width: sizeS,
				height: sizeS
			});

			var self = this;
			node.mainImage = createInVisibleImage();
			node.mainImage.addEventListener(
				'load',
				function () {
					var data = getImageData(node, node.mainImage, size);
					data.src = node.mainImage.src;

					group.createImage(data).setTransform(data.scale);
					if (node.masks) {
						for (i = 0; i < node.masks.length; i++) {
							if (node.masks[i]) {
								self.set(node.uniqueId, 'mask', i, node.masks[i]);
							}
						}
					}
					document.body.removeChild(this);
					node.mainImage = null;
				},
				false
			);
			node.mainImage.src = this._getImageUrl(node.img);

			var text = group
				.createText({
					x: node.x,
					y: node.y + this.settings.size + 14,
					text: node.label
				})
				.setFont({ family: 'Arial', size: '9pt' })
				.setFill(node.nameColor || this.settings.colorName);
			text.id = 'name';
			text.setShape({
				x: node.x - (text.getTextWidth() - this.settings.size) / 2
			});
			text = group
				.createText({ x: node.x, y: node.y - 4, text: node.state || '' })
				.setFont({ family: 'Arial', size: '9pt' })
				.setFill(this.settings.colorState);
			text.id = 'state';
			if (node.state) {
				text.setShape({
					x: node.x - (text.getTextWidth() - this.settings.size) / 2
				});
			}

			text = group
				.createText({
					x: node.x,
					y: node.y + this.settings.size + 14 + /*9pt~12px*/ 12 + 4,
					text: node.bottomState || ''
				})
				.setFont({ family: 'Arial', size: '9pt' })
				.setFill(this.settings.colorState);
			text.id = 'bottomState';
			if (node.bottomState) {
				text.setShape({
					x: node.x - (text.getTextWidth() - this.settings.size) / 2
				});
			}

			var move = new Moveable(group);
			connect.connect(move, 'onMove', w, events.moveNode);
			connect.connect(move, 'onMoveStop', w, events.moveStop);
			group.connect('onclick', w, events.onClickItem);
			group.connect('ondblclick', w, 'onDoubleClick');

			w._resizeCanvas();
		},

		select: function (id, bool) {
			this.workflow.unselectAll();
			if (bool) {
				this.workflow._values.selectNode = id;
			}
			var node = this.workflow._values.nodesId[id],
				group = node.group;
			for (var i = 1, l = group.children.length; i < l; i += 1) {
				var child = group.children[i];
				if (child.shape.type === 'rect') {
					child.setStroke({
						style: 'solid',
						width: bool ? 1 : 0,
						cap: 'round',
						color: this.settings.colorSelect
					});
				}
			}
		},

		_clearResizeTimer: function () {
			if (this.resizeTimer) {
				clearInterval(this.resizeTimer);
				this.resizeTimer = null;
			}
		},

		_drawTransitions: function (id) {
			var values = this.workflow._values,
				node = values.nodesId[id],
				transition = node.transition,
				transitions = this.workflow.transitions,
				nodeSize = this.settings.size / 2;

			for (var i = 0; i < transition.length; i++) {
				var tr = values.transitionsId[transition[i]];
				tr.line.setShape({ path: transitions._getPath(tr) });

				var x = tr.line.segments[tr.line.segments.length - 1];
				var x2 = tr.line.segments[tr.line.segments.length - 2];
				tr.arrow.setShape({
					points: transitions._arrowHead(
						x2.args[0],
						x2.args[1],
						x.args[0],
						x.args[1]
					)
				});

				var source = values.nodesId[tr.source],
					destination = values.nodesId[tr.destination],
					startPosition,
					endPosition,
					segmentIndex,
					prevPosition,
					nextPosition;

				if (source.x == node.x) {
					// Outgoing transition
					segmentIndex = -1;
					if (tr.segment.length > 0) {
						nextPosition = tr.segment[0];
						endPosition = tr.segment[0];
					} else {
						nextPosition = destination;
						endPosition = transitions._positionTransition(
							destination.x + nodeSize,
							destination.y + nodeSize,
							source.x,
							source.y
						);
					}

					startPosition = transitions._positionTransition(
						source.x + nodeSize,
						source.y + nodeSize,
						nextPosition.x,
						nextPosition.y
					);
				} else {
					// Incoming transition
					if (tr.segment.length > 0) {
						segmentIndex = tr.segment.length - 1;
						startPosition = tr.segment[tr.segment.length - 1];
						prevPosition = tr.segment[tr.segment.length - 1];
					} else {
						segmentIndex = -1;
						startPosition = transitions._positionTransition(
							source.x + nodeSize,
							source.y + nodeSize,
							destination.x,
							destination.y
						);
						prevPosition = source;
					}

					endPosition = transitions._positionTransition(
						destination.x + nodeSize,
						destination.y + nodeSize,
						prevPosition.x,
						prevPosition.y
					);
				}

				var hasNextSegment = source.x == node.x && tr.segment.length > 0;
				var pathClickArea = transitions._getPathClickArea(
					startPosition,
					endPosition,
					hasNextSegment
				);
				if (segmentIndex >= 0) {
					tr.segment[segmentIndex].clickArea.setShape({
						points: pathClickArea
					});
				} else {
					tr.line.clickArea.setShape({ points: pathClickArea });
				}

				var pos = transitions._positionLabel(tr);
				tr.text.setShape({ x: pos.x, y: pos.y });
			}
		},

		remove: function (id) {
			var w = this.workflow,
				node = w._values.nodesId[id];
			if (w._values.selectNode === id) {
				w.unselectAll();
			}

			w._values.nodes.splice(w._values.nodes.indexOf(node), 1);
			w._values.surface.remove(node.group);
			node.group = null;
			delete w._values.nodesId[id];
		},

		_getXY: function (id) {
			var node = this.workflow._values.nodesId[id];
			return { x: node.x, y: node.y };
		},

		_normalizeUrl: function (value) {
			return config.baseUrl + '../../cbin/' + value;
		},

		_getImageUrl: function (value) {
			if (value) {
				if (value.toLowerCase().indexOf('vault:///?fileid=') == 0) {
					var fileId = value.replace(/vault:\/\/\/\?fileid=/i, '');
					return aras.IomInnovator.getFileUrl(
						fileId,
						aras.Enums.UrlType.SecurityToken
					);
				} else {
					var isSVGImage = /^.*\.svg$/i.test(value);
					return isSVGImage
						? this._normalizeUrl(value) + this._getImageSalt()
						: this._normalizeUrl(value);
				}
			}
		},

		_getImageSalt: function () {
			return '?' + this.saltPrefix;
		},

		getSelected: function () {
			return this.workflow._values.selectNode;
		},

		_getLink: function (id, onlySource, onlyDestination) {
			var array = [],
				w = this.workflow,
				node = w._values.nodesId[id];
			for (var i = 0; i < node.transition.length; i++) {
				var trId = node.transition[i];
				if (onlySource || onlyDestination) {
					var tr = w._values.transitionsId[trId],
						nodeID = onlySource ? tr.source : tr.destination;
					if (nodeID === node.uniqueId) {
						array.push(trId);
					}
				} else {
					array.push(trId);
				}
			}
			return array;
		},

		_setState: function (id, value) {
			var node = this.workflow._values.nodesId[id],
				children = node.group.children,
				transform = node.group.getTransform()
					? node.group.getTransform().dx
					: 0;

			node.state = value;
			for (var i = 0; i < children.length; i += 1) {
				var shape = children[i].getShape();
				if (shape.type === 'text' && children[i].id === 'state') {
					children[i].setShape({ text: value });
					if (value) {
						children[i].setShape({
							x:
								node.x -
								(children[i].getTextWidth() - this.settings.size) / 2 -
								transform
						});
					}
					break;
				}
			}
		},

		_setBottomState: function (id, value) {
			var node = this.workflow._values.nodesId[id],
				children = node.group.children,
				transform = node.group.getTransform()
					? node.group.getTransform().dx
					: 0;

			node.bottomState = value;
			for (var i = 0; i < children.length; i += 1) {
				var shape = children[i].getShape();
				if (shape.type === 'text' && children[i].id === 'bottomState') {
					children[i].setShape({ text: value });
					if (value) {
						children[i].setShape({
							x:
								node.x -
								(children[i].getTextWidth() - this.settings.size) / 2 -
								transform
						});
					}
					break;
				}
			}
		},

		_setImg: function (id, value) {
			var node = this.workflow._values.nodesId[id],
				children = node.group.children,
				size = this.settings.size;

			for (var i = 0; i < children.length; i += 1) {
				var shape = children[i].getShape();
				if (shape.type === 'image') {
					node.mainImage = createInVisibleImage();
					node.mainImage.addEventListener('load', function () {
						var data = getImageData(node, node.mainImage, size);
						data.src = node.mainImage.src;
						children[i].setShape(data).setTransform(data.scale);

						document.body.removeChild(this);
						node.mainImage = null;
					});
					node.mainImage.src = this._getImageUrl(value);
					break;
				}
			}
		},

		_setLabel: function (id, value) {
			var node = this.workflow._values.nodesId[id],
				children = node.group.children,
				transform = node.group.getTransform()
					? node.group.getTransform().dx
					: 0;

			node.label = value;
			for (var i = 0; i < children.length; i += 1) {
				var shape = children[i].getShape();
				if (shape.type === 'text' && children[i].id === 'name') {
					children[i].setShape({ text: value });
					if (value) {
						children[i].setShape({
							x:
								node.x -
								(children[i].getTextWidth() - this.settings.size) / 2 -
								transform
						});
					}
					break;
				}
			}
		},

		_maskPosTransform: function (idx, imgWidth, imgHeight) {
			var x = 0,
				y = 0;
			switch (idx) {
				case 1:
					x += imgWidth / 2;
					break;
				case 2:
					x += imgWidth / 2;
					y += imgHeight / 2;
					break;
				case 3:
					y += imgHeight / 2;
					break;
				case 4:
					x += imgWidth / 4;
					y += imgHeight / 4;
					break;
			}
			return { x: x, y: y };
		},

		_setMask: function (id, idx, value) {
			var node = this.workflow._values.nodesId[id];
			if (node) {
				if (
					typeof idx === 'number' &&
					idx >= 0 &&
					idx <= 4 &&
					typeof value === 'string' &&
					value
				) {
					var nodeChilds = node.group.children,
						transform = node.group.getTransform() || { dx: 0, dy: 0 },
						x = node.x - transform.dx,
						y = node.y - transform.dy,
						size = this.settings.size,
						maskExists = false,
						self = this;

					node.masks = node.masks || [];
					node.maskImages = node.maskImages || [];
					node.masks[idx] = value;
					node.maskImages[idx] = createInVisibleImage();

					var maskImage = node.maskImages[idx],
						imageSrc = this._getImageUrl(value),
						currentChild = null;
					for (var i = 0; i < nodeChilds.length; i++) {
						currentChild = nodeChilds[i];
						if (
							currentChild.getShape().type === 'image' &&
							currentChild.id === 'mask' + idx + '_' + id
						) {
							maskImage.addEventListener('load', function () {
								var offsetX = (maskImage.width - size) / 2,
									offsetY = (maskImage.height - size) / 2,
									maskTransform = self._maskPosTransform(
										idx,
										maskImage.width,
										maskImage.height
									);

								currentChild.setShape({
									x: x + maskTransform.x + (offsetX < 0 ? 0 : offsetX),
									y: y + maskTransform.y + (offsetY < 0 ? 0 : offsetY),
									width: offsetX < 0 ? maskImage.width : size,
									height: offsetY < 0 ? maskImage.height : size,
									src: imageSrc
								});
								document.body.removeChild(this);
								node.maskImages[idx] = null;
							});
							maskImage.src = imageSrc;
							maskExists = true;
							break;
						}
					}
					if (!maskExists) {
						maskImage.addEventListener('load', function () {
							var offsetX = (maskImage.width - size) / 2,
								offsetY = (maskImage.height - size) / 2,
								maskTransform = self._maskPosTransform(
									idx,
									maskImage.width,
									maskImage.height
								);

							var mask = node.group.createImage({
								x: x + maskTransform.x + (offsetX < 0 ? 0 : offsetX),
								y: y + maskTransform.y + (offsetY < 0 ? 0 : offsetY),
								width: offsetX < 0 ? maskImage.width : size,
								height: offsetY < 0 ? maskImage.height : size,
								src: imageSrc
							});
							mask.id = 'mask' + idx + '_' + id;
							document.body.removeChild(this);
							node.maskImages[idx] = null;
						});
						maskImage.src = imageSrc;
					}
				}
			}
		},

		get: function (id, name) {
			var func = '_get' + name.charAt(0).toUpperCase() + name.slice(1);
			if (this[func]) {
				var args = Array.prototype.slice.call(arguments, 2);
				args.unshift(id);
				return this[func].apply(this, args);
			} else {
				var node = this.workflow._values.nodesId[id];
				return node[name];
			}
		},

		set: function (id, name, value) {
			var func = '_set' + name.charAt(0).toUpperCase() + name.slice(1),
				args;
			if (this[func]) {
				args = Array.prototype.slice.call(arguments, 2);
				args.unshift(id);
				this[func].apply(this, args);
			} else {
				this.workflow._values.nodesId[id][name] = value;
			}
		}
	});
	var Transitions = declare(null, {
		workflow: null,
		settings: null,

		constructor: function (obj) {
			this.workflow = obj;
			this.settings = {
				color: 'gray',
				colorSelect: 'red',
				arrowSize: 10
			};
		},

		is: function (id) {
			return !!this.workflow._values.transitionsId[id];
		},

		startAdd: function (node) {
			this.workflow._values.startAddTr = { node: node };
		},

		endAdd: function (transition) {
			//It is event when end added transition with startAdd
		},

		addBreak: function (id, x, y) {
			var w = this.workflow,
				tr = w._values.transitionsId[id],
				source = w._values.nodesId[tr.source],
				destination = w._values.nodesId[tr.destination],
				added = false;

			if (!tr.segment.length) {
				tr.segment.push({ x: x, y: y });
				added = true;
			} else {
				var start = source,
					end = tr.segment[0],
					segmentLength = tr.segment.length;
				for (var i = 0; i <= segmentLength; i += 1) {
					if (i > 0) {
						start = tr.segment[i - 1];
						end = i === segmentLength ? destination : tr.segment[i];
					}
					var px = (x - end.x) / (start.x - end.x),
						py = (y - end.y) / (start.y - end.y);
					if (px > 0 && px < 1 && py > 0 && py < 1) {
						tr.segment.splice(i, 0, { x: x, y: y });
						added = true;
						break;
					}
				}
			}

			if (added) {
				var circle = tr.line.parent.createCircle({ cx: x, cy: y, r: 4 });
				if (w._values.selectTransition === id) {
					circle.setFill(this.settings.colorSelect);
				}
				var move = new Moveable(circle);
				connect.connect(move, 'onMove', w, events.moveTransition);
				connect.connect(move, 'onMoveStop', w, events.moveStop);
				tr.line.setShape({ path: this._getPath(tr) });
				var x1 = tr.line.segments[tr.line.segments.length - 1];
				var x2 = tr.line.segments[tr.line.segments.length - 2];
				tr.arrow.setShape({
					points: this._arrowHead(
						x2.args[0],
						x2.args[1],
						x1.args[0],
						x1.args[1]
					)
				});

				this._deleteClickAreas(tr);
				this._createPathClickAreas(w, tr, source, destination);
			}
		},

		removeBreak: function (id, x, y) {
			var w = this.workflow,
				tr = w._values.transitionsId[id],
				source = w._values.nodesId[tr.source],
				destination = w._values.nodesId[tr.destination],
				i;

			this._deleteClickAreas(tr);
			for (i = 0; i < tr.segment.length; i += 1) {
				if (tr.segment[i].x === x && tr.segment[i].y === y) {
					tr.segment.splice(i, 1);
					break;
				}
			}
			var group = tr.line.parent;
			for (i = 0; i < group.children.length; i += 1) {
				var shape = group.children[i].getShape();
				if (shape.type === 'circle') {
					var transform = group.children[i].getTransform() || { dx: 0, dy: 0 },
						cx = shape.cx + transform.dx,
						cy = shape.cy + transform.dy;
					if (cx === x && cy === y) {
						group.remove(group.children[i]);
					}
				}
			}
			tr.line.setShape({ path: this._getPath(tr) });

			var x1 = tr.line.segments[tr.line.segments.length - 1];
			var x2 = tr.line.segments[tr.line.segments.length - 2];
			tr.arrow.setShape({
				points: this._arrowHead(x2.args[0], x2.args[1], x1.args[0], x1.args[1])
			});

			this._createPathClickAreas(w, tr, source, destination);
		},

		add: function (tr) {
			var w = this.workflow,
				move;

			if (!w._values.transitionsId[tr.uniqueId]) {
				tr.segment = tr.segment || [];
				tr.labelX = tr.labelX || 0;
				tr.labelY = tr.labelY || 0;
				w._values.transitionsId[tr.uniqueId] = tr;
				w._values.transitions.push(tr);
			}

			var color = this.settings.color;
			var group = w._values.surface.createGroup();
			group.id = tr.uniqueId;

			tr.line = group
				.createShape({ type: 'path', path: this._getPath(tr) })
				.setStroke(color);
			var source = w._values.nodesId[tr.source],
				destination = w._values.nodesId[tr.destination];
			source.transition.push(tr.uniqueId);
			w._values.nodesId[tr.destination].transition.push(tr.uniqueId);

			this._createPathClickAreas(w, tr, source, destination);

			for (var j = 0; j < tr.segment.length; j++) {
				var segment = tr.segment[j];

				var circle = group.createCircle({ cx: segment.x, cy: segment.y, r: 4 });
				move = new Moveable(circle);
				connect.connect(move, 'onMove', w, events.moveTransition);
				connect.connect(move, 'onMoveStop', w, events.moveStop);
			}

			var x = tr.line.segments[tr.line.segments.length - 1];
			var x2 = tr.line.segments[tr.line.segments.length - 2];
			var nodeSettings = this.workflow.nodes.settings;

			var pos =
				tr.labelX === 0 && tr.labelY === 0
					? this._positionLabel(tr)
					: {
							x: source.x + nodeSettings.size / 2,
							y: source.y + nodeSettings.sizeImage / 2
					  };
			tr.arrow = group
				.createPolyline(
					this._arrowHead(x2.args[0], x2.args[1], x.args[0], x.args[1])
				)
				.setStroke(color)
				.setFill(color);
			tr.text = group
				.createText({ x: pos.x, y: pos.y, text: tr.label || '' })
				.setFont({ family: 'Arial', size: '9pt' })
				.setTransform({ dx: tr.labelX || 0, dy: tr.labelY || 0 })
				.setFill('black');
			move = new Moveable(tr.text);
			group.connect('onclick', w, events.onClickItem);
			connect.connect(move, 'onMove', w, events.moveText);
			connect.connect(move, 'onMoveStop', w, events.moveStop);
		},

		remove: function (id) {
			var w = this.workflow,
				tr = w._values.transitionsId[id],
				source = this.workflow._values.nodesId[tr.source],
				destination = this.workflow._values.nodesId[tr.destination];
			if (w._values.selectTransition === id) {
				w.unselectAll();
			}

			source.transition.splice(source.transition.indexOf(id), 1);
			destination.transition.splice(destination.transition.indexOf(id), 1);
			w._values.transitions.splice(w._values.transitions.indexOf(tr), 1);
			w._values.surface.remove(tr.line.parent);
			tr.line = null;
			tr.arrow = null;
			delete w._values.transitionsId[id];
		},

		_getPath: function (transition) {
			var source = this.workflow._values.nodesId[transition.source],
				destination = this.workflow._values.nodesId[transition.destination],
				next = transition.segment.length ? transition.segment[0] : destination,
				size = this.workflow.nodes.settings.size / 2,
				pos = this._positionTransition(
					source.x + size,
					source.y + size,
					next.x,
					next.y
				);
			var result = 'M ' + pos.x + ' ' + pos.y;
			for (var j = 0; j < transition.segment.length; j++) {
				result +=
					'L ' + transition.segment[j].x + ' ' + transition.segment[j].y;
			}

			next = transition.segment.length
				? transition.segment[transition.segment.length - 1]
				: source;
			pos = this._positionTransition(
				destination.x + size,
				destination.y + size,
				next.x,
				next.y
			);
			result += 'L ' + pos.x + ' ' + pos.y;
			return result;
		},

		_createPathClickAreas: function (
			workflow,
			transition,
			source,
			destination
		) {
			var next = transition.segment.length
					? transition.segment[0]
					: destination,
				nodeSize = workflow.nodes.settings.size / 2,
				group = transition.line.parent;

			var hasSegments = transition.segment.length > 0;
			var startPosition = this._positionTransition(
				source.x + nodeSize,
				source.y + nodeSize,
				next.x,
				next.y
			);
			var endPosition = hasSegments
				? transition.segment[0]
				: this._positionTransition(
						next.x + nodeSize,
						next.y + nodeSize,
						source.x,
						source.y
				  );

			var pathClickArea = this._getPathClickArea(
				startPosition,
				endPosition,
				true
			);
			transition.line.clickArea = group
				.createPolyline(pathClickArea)
				.setFill('transparent');

			for (var j = 0; j < transition.segment.length; j++) {
				var segment = transition.segment[j];
				next = transition.segment[j + 1];
				endPosition = next
					? next
					: this._positionTransition(
							destination.x + nodeSize,
							destination.y + nodeSize,
							segment.x,
							segment.y
					  );
				startPosition = this._positionTransition(
					segment.x,
					segment.y,
					endPosition.x,
					endPosition.y,
					true
				);
				pathClickArea = this._getPathClickArea(
					startPosition,
					endPosition,
					true
				);
				segment.clickArea = group
					.createPolyline(pathClickArea)
					.setFill('transparent');
			}
		},

		_getPathClickArea: function (startPosition, endPosition, isSegment) {
			// Size of the click area
			var dx = 3,
				dy = 3,
				xDirection = startPosition.x > endPosition.x ? -1 : 1,
				yDirection = startPosition.y < endPosition.y ? -1 : 1,
				clickArea = [];

			var end = this._positionTransition(
				endPosition.x,
				endPosition.y,
				startPosition.x,
				startPosition.y,
				isSegment
			);
			clickArea.push({
				x: startPosition.x - dx * yDirection,
				y: startPosition.y - dy * xDirection
			});
			clickArea.push({
				x: end.x - dx * yDirection,
				y: end.y - dy * xDirection
			});
			clickArea.push({
				x: end.x + dx * yDirection,
				y: end.y + dy * xDirection
			});
			clickArea.push({
				x: startPosition.x + dx * yDirection,
				y: startPosition.y + dy * xDirection
			});

			return clickArea;
		},

		_deleteClickAreas: function (transition) {
			var сlickArea = transition.line.clickArea;
			if (сlickArea) {
				сlickArea.removeShape();
				сlickArea.destroy();
			}

			for (var j = 0; j < transition.segment.length; j++) {
				сlickArea = transition.segment[j].clickArea;
				if (сlickArea) {
					сlickArea.removeShape();
					сlickArea.destroy();
				}
			}
		},

		_positionTransition: function (x1, y1, x2, y2, isSegment) {
			var size = isSegment ? 2 : this.workflow.nodes.settings.size / 2,
				lineLength = (x2 - x1 >= 0 ? -1 : 1) * Math.sqrt(2) * size,
				lineAngle =
					x2 - x1 ? Math.atan((y2 - y1) / (x2 - x1)) : Math.atan(y2 - y1),
				x,
				y;
			y = y1 - lineLength * Math.sin(lineAngle);
			x = x1 - lineLength * Math.cos(lineAngle);
			return { x: x, y: y };
		},

		_arrowHead: function (x1, y1, x2, y2) {
			var arrowHeadLength = (x2 - x1 >= 0 ? 1 : -1) * this.settings.arrowSize,
				lineAngle =
					x2 - x1 ? Math.atan((y2 - y1) / (x2 - x1)) : Math.atan(y2 - y1),
				array = [{ x: x2, y: y2 }],
				end1 = lineAngle + (15 * Math.PI) / 180,
				end2 = lineAngle - (15 * Math.PI) / 180,
				x,
				y;
			y = y2 - arrowHeadLength * Math.sin(end1);
			x = x2 - arrowHeadLength * Math.cos(end1);
			array.push({ x: x, y: y });
			y = y2 - arrowHeadLength * Math.sin(end2);
			x = x2 - arrowHeadLength * Math.cos(end2);
			array.push({ x: x, y: y });
			array.push({ x: x2, y: y2 });
			return array;
		},

		_positionLabel: function (transition) {
			var source = this.workflow._values.nodesId[transition.source],
				size = this.workflow.nodes.settings.size / 2,
				destination = this.workflow._values.nodesId[transition.destination];

			destination = transition.segment.length
				? transition.segment[0]
				: destination;

			var pathLength =
					Math.sqrt(
						(source.x - destination.x) * (source.x - destination.x) +
							(source.y - destination.y) * (source.y - destination.y)
					) * 0.3,
				lineAngle =
					destination.x - source.x
						? Math.atan((destination.y - source.y) / (destination.x - source.x))
						: Math.atan(destination.y - source.y),
				x,
				y;

			if (destination.x >= source.x) {
				x = source.x + pathLength * Math.cos(lineAngle) + size;
				y = source.y + pathLength * Math.sin(lineAngle) + size * 2;
				return { x: parseInt(x, 10), y: parseInt(y, 10) };
			} else {
				x = source.x - pathLength * Math.cos(lineAngle) + size;
				y = source.y - pathLength * Math.sin(lineAngle) + size * 2;
				return { x: parseInt(x, 10), y: parseInt(y, 10) };
			}
		},

		select: function (id, doSelection) {
			this.workflow.unselectAll();
			var tr = this.workflow._values.transitionsId[id];
			if (tr) {
				if (doSelection) {
					this.workflow._values.selectTransition = id;
				}

				var color = this.settings[doSelection ? 'colorSelect' : 'color'];
				var group = tr.line.parent;
				for (var i = 0, l = group.children.length; i < l; i += 1) {
					var child = group.children[i];
					switch (child.shape.type) {
						case 'path':
							child.setStroke(color);
							break;
						case 'polyline':
							tr.arrow.setStroke(color).setFill(color);
							tr.line.setStroke(color);
							break;
						case 'circle':
							child.setFill(doSelection ? color : '');
							break;
					}
				}
			}
		},

		_getSegments: function (id) {
			var tr = this.workflow._values.transitionsId[id];
			return tr.segment;
		},

		getSelected: function () {
			return this.workflow._values.selectTransition;
		},

		_getLabelXY: function (id) {
			var tr = this.workflow._values.transitionsId[id];
			return { x: tr.labelX, y: tr.labelY };
		},

		get: function (id, name) {
			var func = '_get' + name.charAt(0).toUpperCase() + name.slice(1);
			if (this[func]) {
				return this[func](id);
			} else {
				var tr = this.workflow._values.transitionsId[id];
				return tr[name];
			}
		},

		_setDestination: function (id, value) {
			var w = this.workflow,
				tr = w._values.transitionsId[id],
				node = w._values.nodesId[tr.destination],
				forNode = w._values.nodesId[value];
			node.transition.splice(node.transition.indexOf(id), 1);
			forNode.transition.push(id);
			tr.destination = value;
			tr.line.setShape({ path: this._getPath(tr) });
			var x1 = tr.line.segments[tr.line.segments.length - 1];
			var x2 = tr.line.segments[tr.line.segments.length - 2];
			tr.arrow.setShape({
				points: this._arrowHead(x2.args[0], x2.args[1], x1.args[0], x1.args[1])
			});
		},

		_setLabel: function (id, value) {
			var tr = this.workflow._values.transitionsId[id],
				children = tr.line.parent.children,
				pos = this._positionLabel(tr);

			tr.label = value;
			for (var i = 0; i < children.length; i += 1) {
				var shape = children[i].getShape();
				if (shape.type === 'text') {
					children[i].setShape({ x: pos.x, y: pos.y, text: value });
					break;
				}
			}
		},

		set: function (id, name, value) {
			var func = '_set' + name.charAt(0).toUpperCase() + name.slice(1);
			if (this[func]) {
				var args = Array.prototype.slice.call(arguments, 2);
				args.unshift(id);
				return this[func].apply(this, args);
			} else {
				var tr = this.workflow._values.transitionsId[id];
				tr[name] = value;
			}
		}
	});

	return declare('Aras.Client.Controls.Experimental.Workflow', null, {
		id: null,
		_values: null,
		nodes: null,
		draggingObject: null,
		transitions: null,
		contextMenu: null,

		constructor: function (id) {
			this._values = {
				nodesId: null,
				nodes: null,
				transitionsId: null,
				transitions: null,
				selectNode: null,
				selectTransition: null,
				surface: null,
				showMenu: true
			};
			this.id = id;
			this.nodes = new Nodes(this);
			this.transitions = new Transitions(this);
			this.contextMenu = new ContextMenu();
			this.contextMenu.menu.onBlur = events.onBlurContextMenu;
		},

		onDoubleClick: function () {
			//this event fires during double click on Node
		},

		onClick: function (id, event) {
			//this event fire when click on Node or Transitions
		},

		onDrop: function (id) {
			//this event fire when dropped something
		},

		onMenuInit: function (id, location, isBreak) {
			//this event fire when click right button
		},

		onMenuClick: function (id, args) {
			//this event fire when click on menu
		},

		unselectAll: function () {
			const selectedTransitionId = this._values.selectTransition;
			const selectedTransition = this._values.transitionsId[
				selectedTransitionId
			];
			if (selectedTransitionId && selectedTransition) {
				this._values.selectTransition = null;
				this.transitions.select(selectedTransitionId, false);
				return;
			}

			const selectedNodeId = this._values.selectNode;
			const selectedNode = this._values.nodesId[selectedNodeId];
			if (selectedNodeId && selectedNode) {
				this._values.selectNode = null;
				this.nodes.select(selectedNodeId, false);
			}
		},

		_render: function () {
			var _node = this._values.nodes,
				_transition = this._values.transitions,
				i;

			if (!this._values.surface) {
				this._values.surface = gfx.createSurface(this.id, 1, 1);
				this._values.surface.connect('onclick', this, events.onClickGlobal);
				this._values.surface.connect(
					'oncontextmenu',
					this,
					events.onContextMenu
				);
				this._values.surface.connect('onmousemove', this, events.onMoveGlobal);
				this._values.surface.connect('onmouseleave', this, events.onLeave);
			} else {
				this._values.surface.clear();
			}

			for (i = 0; i < _node.length; i += 1) {
				this.nodes.add(_node[i]);
			}
			for (i = 0; i < _transition.length; i += 1) {
				this.transitions.add(_transition[i]);
			}

			this._resizeCanvas();
		},

		_resizeCanvas: function () {
			var canvas = this._values.surface,
				boundingBox = canvas.getBoundingBox(),
				canvasSize = canvas.getDimensions(),
				isCanvasWider,
				isCanvasHigher,
				requiredWidth,
				requiredHeight;

			if (!boundingBox) {
				return;
			}
			isCanvasWider = boundingBox.endX > canvas._parent.offsetWidth;
			isCanvasHigher = boundingBox.endY > canvas._parent.offsetHeight;
			if (isCanvasWider) {
				requiredWidth = parseInt(boundingBox.endX);
			} else {
				// if CanvasHigher then vertical scrollbar appeared, with ~18px width
				if (isCanvasHigher) {
					requiredWidth =
						boundingBox.endX > canvas._parent.offsetWidth - 20
							? canvas._parent.offsetWidth - 4
							: canvas._parent.offsetWidth - 20;
				} else {
					requiredWidth = canvas._parent.clientWidth - 4;
				}
			}

			if (isCanvasHigher) {
				requiredHeight = parseInt(boundingBox.endY);
			} else {
				// if CanvasWider then horizontal scrollbar appeared, with ~18px width
				if (isCanvasWider) {
					requiredHeight =
						boundingBox.endY > canvas._parent.offsetHeight - 20
							? canvas._parent.offsetHeight - 4
							: canvas._parent.offsetHeight - 20;
				} else {
					requiredHeight = canvas._parent.clientHeight - 4;
				}
			}

			canvas.setDimensions(requiredWidth, requiredHeight);
			// if canvas dimensions increased, then scroll parent element
			if (canvasSize.width < requiredWidth) {
				canvas._parent.scrollLeft = requiredWidth;
			}
			if (canvasSize.height < requiredHeight) {
				canvas._parent.scrollTop = requiredHeight;
			}
		},

		load: function (xml) {
			var dom = new XmlDocument();
			dom.loadXML(xml);

			var _node = [],
				_nodeId = {},
				sourceId,
				destinationId,
				transitionIsValid,
				obj,
				node,
				i,
				j;

			node = dom.selectNodes('./Process/Node');
			for (i = 0, nodesCount = node.length; i < nodesCount; i += 1) {
				var img = node[i].getAttribute('img');
				if (img) {
					img = dom
						.selectSingleNode("./Process/img[@id='" + img + "']")
						.getAttribute('src');
				} else {
					img = node[i].getAttribute('imgSrc');
				}
				obj = {
					uniqueId: node[i].getAttribute('id'),
					label: node[i].getAttribute('name'),
					state: node[i].getAttribute('label2'),
					masks: [],
					x: parseInt(node[i].getAttribute('x'), 10),
					y: parseInt(node[i].getAttribute('y'), 10),
					img: img,
					bgColor: node[i].getAttribute('bgColor'),
					nameColor: node[i].getAttribute('nameColor'),
					bottomState: node[i].getAttribute('label1'),
					isCurrentState: node[i].getAttribute('isCurrentState')
				};
				for (j = 0; j < 5; j++) {
					var mask = node[i].getAttribute('mask' + j);
					if (mask) {
						obj.masks[j] = mask;
					}
				}
				_node.push(obj);
				_nodeId[obj.uniqueId] = obj;
			}
			this._values.nodes = _node;
			this._values.nodesId = _nodeId;

			var _transition = [],
				_transitionId = {};
			var transition = dom.selectNodes('./Process/Transition');
			for (i = 0; i < transition.length; i += 1) {
				var segment = [];
				sourceId = transition[i].getAttribute('sourceNode');
				destinationId = transition[i].getAttribute('destinationNode');
				transitionIsValid =
					this._values.nodesId[sourceId] && this._values.nodesId[destinationId];
				if (!transitionIsValid) {
					continue;
				}
				if (transition[i].childNodes.length) {
					for (j = 0; j < transition[i].childNodes.length; j += 1) {
						node = transition[i].childNodes[j];
						if (node.nodeName === 'Segment') {
							segment.push({
								x: parseInt(node.getAttribute('x'), 10),
								y: parseInt(node.getAttribute('y'), 10)
							});
						}
					}
				}
				obj = {
					uniqueId:
						transition[i].getAttribute('id') || sourceId + destinationId,
					source: sourceId,
					destination: destinationId,
					label: transition[i].getAttribute('name'),
					labelX: parseInt(transition[i].getAttribute('nameX') || 0, 10),
					labelY: parseInt(transition[i].getAttribute('nameY') || 0, 10),
					segment: segment
				};
				_transition.push(obj);
				_transitionId[obj.uniqueId] = obj;
			}
			this._values.transitions = _transition;
			this._values.transitionsId = _transitionId;

			this._render();
		},

		_setShowMenu: function (val) {
			this._values.showMenu = !!val;
		},

		_getShowMenu: function (val) {
			return this._values.showMenu;
		},

		get: function (value) {
			return this['_get' + value.charAt(0).toUpperCase() + value.slice(1)]();
		},

		set: function (value, setVal) {
			return this['_set' + value.charAt(0).toUpperCase() + value.slice(1)](
				setVal
			);
		}
	});
});
