dojo.setObject(
	'VC.SVG.MeasureLabel',
	dojo.declare('MeasureLabel', VC.SVG.ActiveLabelElement, {
		_updateText: function () {
			var xOffset = 9;
			var yOffset = 23;

			this.inherited(arguments);

			if (this.Text !== null) {
				this.Text.Node.setAttribute('x', this.InnerRect.X + xOffset);
				this.Text.Node.setAttribute('y', this.InnerRect.Y + yOffset);
			}

			if (this.TextArea.style.left !== null) {
				var rect = this.InnerRect.Node.getBoundingClientRect();
				this.TextArea.style.left = rect.left - 7 + 'px';
				this.TextArea.style.top = rect.top + 5 + 'px';
			}
		},
		_showInnerElement: function () {
			this.TextArea.style.display = 'none';
		},

		GetOuterXml: function () {
			var properties = [];

			var resultXml = this.getXml();
			var tailXml = this.InnerTriangle.getXml();
			var rectXml = this.InnerRect.getXml();

			var textNode = new VC.SVG.Text();

			for (var i = 0; i < this.TextArea.attributes.length; i++) {
				textNode.Node.setAttribute(
					this.TextArea.attributes[i].name,
					this.TextArea.attributes[i].value
				);
			}

			textNode.Node.style.visibility = 'visible';
			textNode.Node.style.display = 'block';
			textNode.Node.setAttribute(
				'x',
				+this.InnerRect.Node.getAttribute('rx') + this.InnerRect.X - 6
			);
			textNode.Node.setAttribute(
				'y',
				this.InnerRect.Y +
					this.InnerRect.OY -
					(+this.TextArea.style.fontSize.replace('pt', '') / 2 + 1)
			);
			textNode.Background = 'black';
			textNode.LineColor = 'transparent';

			textNode.Node.textContent = this.TextArea.value;

			var textXml = textNode.getXml();

			resultXml.appendChild(tailXml);
			resultXml.appendChild(rectXml);
			resultXml.appendChild(textXml);

			resultXml.setAttribute('complextype', 'label');

			return resultXml;
		},

		SetText: function (callElement, text) {
			callElement._updateTextAreaWidth(callElement, text);
			callElement.TextArea.value = text;
			callElement.Text.Node.textContent = text;
			callElement.OnTextAreaKeyUp(callElement);
		},

		OnTextAreaKeyUp: function (callElement) {
			var newWidth = callElement.Radius * 2;
			callElement.OX = newWidth;
			callElement.Refresh();
		},

		OnMouseDblClick: function (callElement) {},

		OnTextAreaMouseDown: function (callElement) {},

		OnTextAreaFocus: function (callElement) {},

		OnTopMouseDown: function () {},

		Focus: function () {},

		OnScale: function () {},

		ScaleX: function (factor) {
			this.inherited(arguments);

			if (this.OnScale) {
				this.OnScale(this.X, this.Y);
			}
		},

		ScaleY: function (factor) {
			this.inherited(arguments);

			if (this.OnScale) {
				this.OnScale(this.X, this.Y);
			}
		},

		Move: function () {},

		Delete: function () {
			if (this.TextArea.parentNode) {
				this.TextArea.parentNode.removeChild(this.TextArea);
			}
			this.Node.parentNode.removeChild(this.Node);
		}
	})
);
