// svg with dojo
require(['dojox/xml/parser'], function (parser) {
	return dojo.setObject(
		'VC.SVG.Shape',
		(function () {
			dojo.declare('SVG.ShapePrototype', null, {
				axis: null,
				Node: null,
				X: null,
				Y: null,
				OX: null,
				OY: null,
				Name: null,
				ID: null,
				Type: null,
				LineColor: null,
				LineWidth: null,
				LineDash: null,
				Background: null,
				FontSize: '',
				TextContent: '',
				FontStyle: '',
				FontFamily: '',
				Visible: 'block',
				Transparent: null,
				Display: null,
				Class: null,
				Cursor: null
			});

			SVG.ShapePrototype.prototype = {
				get X() {
					return +this.Node.getAttribute(this.axis.x);
				},
				set X(val) {
					this.Node.setAttribute(this.axis.x, val);
				},

				get Y() {
					return +this.Node.getAttribute(this.axis.y);
				},
				set Y(val) {
					this.Node.setAttribute(this.axis.y, val);
				},

				get OX() {
					return +this.Node.getAttribute(this.axis.ox);
				},
				set OX(val) {
					if (isNaN(val) || val === undefined || val === null) {
						console.log('OX is NaN');
					}

					this.Node.setAttribute(this.axis.ox, val);
				},

				get OY() {
					return +this.Node.getAttribute(this.axis.oy);
				},
				set OY(val) {
					if (isNaN(val) || val === undefined || val === null) {
						console.log('OX is NaN');
					}

					this.Node.setAttribute(this.axis.oy, val);
				},

				get Name() {
					return this.Node.getAttribute('name');
				},
				set Name(val) {
					this.Node.setAttribute('name', val);
					this.Node.Name = val;
				},

				get ID() {
					return this.Node.id;
				},
				set ID(val) {
					this.Node.id = val;
				},

				get Type() {
					return this.Node.tagName;
				},

				get LineColor() {
					return this.Node.getAttribute('stroke');
				},
				set LineColor(val) {
					this.Node.setAttribute('stroke', val);
				},

				get LineWidth() {
					return this.Node.getAttribute('stroke-width');
				},
				set LineWidth(val) {
					this.Node.setAttribute('stroke-width', val);
				},

				get LineDash() {
					return this.Node.getAttribute('stroke-dasharray');
				},
				set LineDash(val) {
					this.Node.setAttribute('stroke-dasharray', val);
				},

				get Background() {
					return this.Node.getAttribute('fill');
				},
				set Background(val) {
					this.Node.setAttribute('fill', val);
				},

				get FontSize() {
					if (this.Node === undefined) {
						return '';
					}
					return this.Node.style.fontSize.replace('pt', '');
				},
				set FontSize(val) {
					this.Node.style.fontSize = val + 'pt';
				},

				get FontStyle() {
					if (this.Node === undefined) {
						return '';
					}
					return this.Node.style.fontStyle;
				},
				set FontStyle(val) {
					this.Node.setAttribute('font-style', val);
				},

				get FontFamily() {
					if (this.Node === undefined) {
						return '';
					}
					return this.Node.style.fontFamily;
				},
				set FontFamily(val) {
					this.Node.setAttribute('font-family', val);
				},

				get TextContent() {
					if (this.Node === undefined) {
						return '';
					}
					return this.Node.textContent;
				},
				set TextContent(val) {
					this.Node.textContent = val;
				},

				get Visible() {
					if (this.Node.style.visibility === 'hidden') {
						return false;
					}
					return true;
				},
				set Visible(val) {
					if (val === false) {
						this.Node.style.visibility = 'hidden';
					} else {
						this.Node.style.visibility = '';
					}
				},

				get Display() {
					if (this.Node.style.display === 'none') {
						return false;
					}
					return true;
				},
				set Display(val) {
					if (val) {
						this.Node.style.display = 'block';
					} else {
						this.Node.style.display = 'none';
					}
				},

				get Transparent() {
					if (this.Class.indexOf('Transparent') >= 0) {
						return true;
					}
					return false;
				},
				set Transparent(val) {
					if (val === true) {
						this.Class = 'Transparent';
					} else {
						var classAttribute = this.Class;
						if (!classAttribute) {
							classAttribute = '';
						}
						if (classAttribute.indexOf('Transparent') >= 0) {
							classAttribute = classAttribute.replace('Transparent', '');
							this.Node.setAttributeNS(
								null,
								'class',
								dojo.trim(classAttribute)
							);
						}
					}
				},

				get Class() {
					return this.Node.getAttribute('class');
				},
				set Class(val) {
					if (val === '') {
						this.Node.setAttributeNS(null, 'class', '');
					}
					var classAttribute = this.Node.getAttributeNS(null, 'class');
					if (!classAttribute) {
						classAttribute = '';
					}
					if (classAttribute.indexOf(val) === -1) {
						classAttribute += ' ' + val;
						this.Node.setAttributeNS(null, 'class', dojo.trim(classAttribute));
					}
				},

				get Cursor() {
					if (this.Node === undefined) {
						return '';
					}
					return this.Node.style.cursor;
				},
				set Cursor(val) {
					this.Node.style.cursor = val;
				}
			};

			return dojo.declare('SVG.Shape', SVG.ShapePrototype, {
				namespaceURI: 'http://www.w3.org/2000/svg',
				axis: { x: 'x', y: 'y', ox: 'width', oy: 'height' },
				Childs: null,
				NodeType: null,
				// The constructor
				constructor: function () {
					this.Childs = [];
					this.Node = document.createElementNS(
						this.namespaceURI,
						this.NodeType
					);
					this.Node.setAttribute('version', '1.1');
					this.ID = this.NodeType + '_' + VC.SVG.Shape.MakeName(6);
					this.Background = 'transparent';
				},

				addChild: function (child) {
					if (this.Childs.IsExist(child, 'ID')) {
						console.log(
							'SVG.Shape: addChild - child with current ID is already existed'
						);
						return;
					}
					this.Node.appendChild(child.Node);
					this.Childs.push(child);
				},

				removeChild: function (child) {
					if (!this.Childs.IsExist(child, 'ID')) {
						return;
					}
					this.Node.removeChild(child.Node);
					var index = this.Childs.GetIndex(child, 'ID');
					if (index != -1) {
						this.Childs.splice(index, 1);
					}
				},

				update: function (x, y, ox, oy) {
					if (x) {
						this.X = x;
					}
					if (y) {
						this.Y = y;
					}
					if (ox) {
						this.OX = ox;
					}
					if (oy) {
						this.OY = oy;
					}
				},

				setAttribute: function (name, value) {
					this.Node.setAttribute(name, value);
				},

				setPadding: function (top, left, bottom, right) {
					this.X += left;
					this.Y += top;
					this.OX -= bottom;
					this.OY -= right;
				},

				GetOuterXml: function () {
					return this.getXml();
				},

				getXml: function () {
					var attrXml = '';
					for (var i = 0; i < this.Node.attributes.length; i++) {
						attrXml += "{0}='{1}' ".Format(
							this.Node.attributes[i].name,
							this.Node.attributes[i].value
						);
					}

					var textValue = this.Node.textContent;
					if (VC.Utils.isNotNullOrUndefined(textValue)) {
						textValue = '<![CDATA[{0}]]>'.Format(textValue);
					}
					this.InnerXml = '<{0} {1}>{2}</{0}>'.Format(
						this.Type,
						attrXml.trim(),
						textValue
					);
					return parser.parse(this.InnerXml).childNodes[0];
				},

				applyXml: function (xmlNode) {
					if (xmlNode === null && xmlNode.tagName !== this.Type) {
						throw new Error(
							VC.Utils.GetResource('err_xml_not_valid_for_element')
						);
					}

					for (var i = 0; i < xmlNode.attributes.length; i++) {
						this.setAttribute(
							xmlNode.attributes[i].name,
							xmlNode.attributes[i].value
						);
					}
				},

				clearCSS: function () {
					this.Class = '';
				}
			});
		})()
	);
});

SVG.Shape.Clone = function (shape) {
	if (shape === null) {
		return;
	}
	var clone = eval('new ' + shape.declaredClass + '()'); // jshint ignore:line
	clone.Node = shape.Node.cloneNode(true);
	clone.NodeType = shape.NodeType;
	clone.axis = shape.axis;
	clone.X = shape.X;
	clone.OX = shape.OX;
	clone.Y = shape.Y;
	clone.OY = shape.OY;
	return clone;
};

SVG.Shape.GetProperty = function (name) {
	try {
		var value = VC.Utils.GetResource('eopt_' + name);
		value = value.replace(/px/, '');
		return value;
	} catch (e) {
		console.error(e.message);
	}
};

SVG.Shape.MakeName = function (length) {
	var text = '';
	var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

	for (var i = 0; i < length; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
};

dojo.setObject(
	'VC.SVG.Group',
	dojo.declare('SVG.Group', VC.SVG.Shape, {
		NodeType: 'g'
	})
);

dojo.setObject(
	'VC.SVG.Rectangle',
	dojo.declare('SVG.Rectangle', VC.SVG.Shape, {
		NodeType: 'rect',
		setRadius: function (radius) {
			this.Node.setAttribute('rx', radius);
			this.Node.setAttribute('ry', radius);
		}
	})
);

dojo.setObject(
	'VC.SVG.Circle',
	dojo.declare('SVG.Circle', VC.SVG.Shape, {
		axis: { x: 'cx', y: 'cy', ox: 'r', oy: 'r' },

		NodeType: 'circle',

		update: function (x, y, ox) {
			if (x) {
				this.X = x;
			}
			if (y) {
				this.Y = y;
			}
			if (ox) {
				this.OX = ox;
			}
		},

		doesPointBelong: function (point) {
			var returnedValue = false;
			var length = Math.sqrt(
				Math.pow(this.X - point.x, 2) + Math.pow(this.Y - point.y, 2)
			);

			if (length <= this.OX) {
				returnedValue = true;
			}

			return returnedValue;
		}
	})
);

dojo.setObject(
	'VC.SVG.Text',
	dojo.declare('SVG.Text', VC.SVG.Shape, {
		axis: { x: 'x', y: 'y', ox: 'dx', oy: 'dy' },
		NodeType: 'text'
	})
);

dojo.setObject(
	'VC.SVG.Polygon',
	(function () {
		function build(arg) {
			var res = [];
			for (var i = 0, l = arg.length; i < l; i++) {
				res.push(arg[i].join(','));
			}
			return res.join(' ');
		}

		return dojo.declare('SVG.Polygon', VC.SVG.Shape, {
			pointList: null,
			NodeType: 'polygon',
			// The constructor
			constructor: function () {
				this.pointList = [];
			},

			attribute: function (key, val) {
				if (val === undefined) {
					return this.Node.getAttribute(key);
				}
				this.Node.setAttribute(key, val);
			},

			getPoint: function (i) {
				return this.pointList[i];
			},
			setPoint: function (i, x, y) {
				this.pointList[i] = [x, y];
				this.attribute('points', build(this.pointList));
			},

			getPoints: function () {
				var pointsstr = this.Node.getAttribute('points');
				var pointarr = pointsstr.split(' ');

				for (var i in pointarr) {
					var subarr = pointarr[i].split(',');
					this.pointList.push(subarr);
				}
			},

			points: function () {
				for (var i = 0, l = arguments.length; i < l; i += 2) {
					this.pointList.push([arguments[i], arguments[i + 1]]);
				}
				this.attribute('points', build(this.pointList));
			},

			update: function () {
				this.points.apply(this, arguments);
			}
		});
	})()
);

dojo.setObject(
	'VC.SVG.Polyline',
	dojo.declare('SVG.Polyline', VC.SVG.Polygon, {
		NodeType: 'polyline'
	})
);

dojo.setObject(
	'VC.SVG.Curve',
	(function () {
		function build(arg) {
			var res = [];
			for (var i = 0, l = arg.length; i < l; i++) {
				res.push(arg[i].join(','));
			}
			return res.join(' ');
		}

		return dojo.declare('SVG.Curve', VC.SVG.Shape, {
			pointList: null,
			NodeType: 'path',
			// The constructor
			constructor: function () {
				this.pointList = [];
				this.Node.setAttribute('stroke-linecap', 'round');
				this.Node.setAttribute('stroke-linejoin', 'round');
			},

			attribute: function (key, val) {
				if (val === undefined) {
					return this.Node.getAttribute(key);
				}
				this.Node.setAttribute(key, val);
			},

			getPoint: function (i) {
				return this.pointList[i];
			},

			setPoint: function (i, x, y) {
				if (i > this.pointList.length) {
					i = this.pointList.length;
				}
				this.pointList[i] = [x, y];
				this.attribute('d', this.buildCurve(this.pointList));
			},

			cleanList: function () {
				var newList = [];
				newList[0] = this.pointList[0];
				for (var i = 1, l = this.pointList.length, j = 0; i < l; i++) {
					if (
						Math.abs(newList[j][0] - this.pointList[i][0]) +
							Math.abs(newList[j][1] - this.pointList[i][1]) >
						10
					) {
						j++;
						newList[j] = [this.pointList[i][0], this.pointList[i][1]];
					}
				}
				this.pointList = newList;
				this.currentPoint = this.pointList.length;
			},

			buildCurve: function (arg) {
				if (!arg[0]) {
					return;
				}
				if (this.pointList.length % 30 === 0) {
					this.cleanList();
				}
				if (arg[0][0] === 0 && arg[1]) {
					arg[0] = arg[1];
				}
				var res = [];
				res.push('M ' + arg[0].join(' '));
				for (var i = 1, l = arg.length - 1; i < l; i++) {
					var vector = {
						x: arg[i][0] - arg[i + 1][0],
						y: arg[i][1] - arg[i + 1][1]
					};
					var normal = { x: -vector.y, y: vector.x };

					if (i % 2 === 1) {
						vector.y = -vector.y;
						vector.x = -vector.x;
					}

					var controlPoint = {
						x: vector.x / 5 + (arg[i - 1][0] + arg[i][0]) / 2,
						y: vector.y / 5 + (arg[i - 1][1] + arg[i][1]) / 2
					};
					res.push(
						'S ' +
							controlPoint.x +
							',' +
							controlPoint.y +
							' ' +
							arg[i].join(',')
					);
				}
				res.push('L ' + arg[arg.length - 1].join(' '));

				return res.join(' ');
			},

			getPoints: function () {
				var pointsstr = this.Node.getAttribute('points');
				var pointarr = pointsstr.split(' ');

				for (var i in pointarr) {
					var subarr = pointarr[i].split(',');
					this.pointList.push(subarr);
				}
			},

			points: function () {
				for (var i = 0, l = arguments.length; i < l; i += 2) {
					this.pointList.push([arguments[i], arguments[i + 1]]);
				}
				this.attribute('points', build(this.pointList));
			},

			update: function () {
				this.attribute('d', this.buildCurve(this.pointList));
			}
		});
	})()
);

dojo.setObject(
	'VC.SVG.Triangle',
	(function () {
		function build(arg) {
			var res = [];
			for (var i = 0, l = arg.length; i < l; i++) {
				res.push(arg[i].join(','));
			}
			return res.join(' ');
		}
		pointList = null;

		return dojo.declare('SVG.Triangle', VC.SVG.Polygon, {
			update: function (leftTop, middleTop, rightTop) {
				this.setPoint(0, leftTop.x, leftTop.y);
				this.setPoint(1, middleTop.x, middleTop.y);
				this.setPoint(2, rightTop.x, rightTop.y);
			}
		});
	})()
);

dojo.setObject(
	'VC.SVG.Marker',
	dojo.declare('SVG.Marker', VC.SVG.Shape, {
		axis: { x: 'refX', y: 'refY', ox: 'markerWidth', oy: 'markerHeight' },
		NodeType: 'marker',
		defs: null,
		constructor: function (id, path) {
			this.defs = document.createElementNS(this.namespaceURI, 'defs');
			this.defs.setAttribute('version', '1.1');

			var pathObj = document.createElementNS(this.namespaceURI, 'path');
			pathObj.setAttribute('d', path);
			pathObj.setAttribute('fill', 'red');
			pathObj.setAttribute('fill-opacity', '1');

			this.ID = id;
			this.Node.setAttribute('viewBox', '0 0 20 20');
			this.Node.setAttribute('markerUnits', 'strokeWidth');

			this.Node.setAttribute('orient', 'auto');

			this.Node.appendChild(pathObj);

			this.defs.appendChild(this.Node);
		}
	})
);
