VC.Utils.Page.LoadWidgets(['Moveable']);

require([
	'dojo/_base/declare',
	'dijit/_WidgetBase',
	'dijit/_TemplatedMixin',
	'dijit/_WidgetsInTemplateMixin',
	'dojo/text!../styles/dialog_constructor.xslt'
], function (
	declare,
	_WidgetBase,
	_TemplatedMixin,
	_WidgetsInTemplateMixin,
	xslt
) {
	return dojo.setObject(
		'VC.Widgets.Dialog',
		declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
			id: null,
			dialogContainer: null,
			titleBar: null,
			titleBarImage: null,
			titleBarText: null,
			closeIcon: null,
			paneContent: null,
			isOpened: false,
			owner: document.getElementsByClassName('Wrap')[0],
			isInitHandlers: false,
			templateString: '',
			widgetsInTemplate: true,

			currentNumber: null,
			onOpen: function () {},
			onClose: function () {},
			onCrossClick: function () {},
			onMoveEnd: function () {},

			constructor: function () {
				this.id = 'jsdialog' + VC.Utils.getTimestampString();

				if (this.dialogName === null) {
					throw new Error('Dialog name is undefined');
				}

				var xml = VC.Utils.getLocalizedXML('dialog_data');
				this.templateString = VC.Utils.convertXsltToHtml(
					xml,
					xslt,
					this.dialogName
				);

				Object.defineProperty(this, 'headerTitle', {
					get: function () {
						return this.titleBarText.innerHTML;
					},
					set: function (value) {
						this.titleBarText.innerHTML = value;
					}
				});

				Object.defineProperty(this, 'domNode', {
					get: function () {
						return this.dialogContainer;
					},
					set: function (value) {
						this.dialogContainer = value;
					}
				});

				Object.defineProperty(this, 'position', {
					get: function () {
						var x = 0;
						var y = 0;

						if (this.domNode.style.left && this.domNode.style.left !== '') {
							x = this.domNode.style.left.replace('px', '');
						}

						if (this.domNode.style.top && this.domNode.style.top !== '') {
							y = this.domNode.style.top.replace('px', '');
						}

						return { x: x, y: y };
					},
					set: function (position) {
						dojo.style(this.domNode, 'left', position.x + 'px');
						dojo.style(this.domNode, 'top', position.y + 'px');
					}
				});

				Object.defineProperty(this, 'height', {
					get: function () {
						return this.dialogContainer.clientHeight;
					}
				});

				Object.defineProperty(this, 'width', {
					get: function () {
						return this.dialogContainer.clientWidth;
					}
				});
			},

			postCreate: function () {
				var moveable = new VC.Widgets.Moveable(
					this.owner,
					this.dialogContainer,
					this.titleBar
				);
				moveable.onMoveEnd = dojo.hitch(this, this._onMoveEnd);

				this.placeAt(this.owner);
			},

			reposition: function () {
				var clientWidth = this.owner.clientWidth;
				var clientHeight = this.owner.clientHeight;

				if (this.dialogContainer.offsetTop + this.height > clientHeight) {
					var y = clientHeight - this.height - 20;
					if (y < 0) {
						y = 0;
					}
					this.dialogContainer.style.top = y + 'px';
				}
				if (this.dialogContainer.offsetLeft + this.width > clientWidth) {
					var x = clientWidth - this.width - 20;
					if (x < 0) {
						x = 0;
					}
					this.dialogContainer.style.left = x + 'px';
				}
			},

			show: function () {
				this.dialogContainer.style.display = 'block';

				var position = VC.Utils.PositionDialogManager.getDialogPosition();
				var clientWidth = this.owner.clientWidth;
				var leftPosition = clientWidth - this.width - 20;

				currentNumber = position;

				var topPosition =
					position * this.dialogContainer.style.height +
					VC.Widgets.Moveable.topLimiter;
				if (this.position.y < topPosition) {
					this.dialogContainer.style.top = topPosition + 'px';
				}

				if (this.position.x > leftPosition || this.position.x === 0) {
					this.dialogContainer.style.left = leftPosition + 'px';
				}

				this._improveTitleBar();
				this.isOpened = true;
				this.onOpen();
				this.dialogContainer.focus();
			},

			hide: function () {
				this.dialogContainer.style.display = 'none';
				this.isOpened = false;
				this.onClose();
			},

			disable: function () {
				this.dialogContainer.style.opacity = '0.2';
				this.dialogContainer.style.pointerEvents = 'none';
			},

			enable: function () {
				this.dialogContainer.style.opacity = '1';
				this.dialogContainer.style.pointerEvents = 'auto';
			},

			replaceDialogTemplate: function (dialogTemplate) {
				// IR-046153 "SSVCV, EDGE: Edge can't open Compare, Measure, Layers pallets"
				// The variable title is undefined in Edge
				// var titleRegex = new RegExp("<span data-dojo-attach-point=\"titleBarText\" class=\"DialogTitleBarText\">(.*?)<\/span>"),
				//		title = titleRegex.exec(this.templateString)[1];
				dialogTemplate = dialogTemplate.replace(/{%(\w+)%}/g, function (
					match,
					resourseName
				) {
					return VC.Utils.GetResource(resourseName);
				});

				var xmlDocument = VC.Utils.createXMLDocument();
				var titleNode = null;
				var title = '';

				xmlDocument.loadXML(this.templateString);
				titleNode = xmlDocument.selectSingleNode(
					"//span[@class='DialogTitleBarText']"
				);
				if (titleNode) {
					title = titleNode.text;
				}

				this.templateString = dialogTemplate.Format(title);
			},

			_onCrossClick: function () {
				this.onCrossClick();
				this.hide();
			},

			_onMoveEnd: function () {
				this.onMoveEnd();
			},

			_improveTitleBar: function () {
				var textPadding =
					(this.width -
						this.titleBarImage.offsetWidth -
						this.titleBarText.offsetWidth -
						this.closeIcon.offsetWidth) /
					2.0;

				if (textPadding < 15) {
					this.titleBarImage.visible(false);
				} else {
					this.titleBarText.style.left =
						this.titleBarImage.offsetWidth + textPadding + 'px';
				}
			}
		})
	);
});
