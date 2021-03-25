require([
	'dojo/_base/declare',
	'dojo/dom-style',
	'dojo/_base/array',
	'dijit/Tree'
], function (declare, domStyle, array, Tree) {
	return dojo.setObject(
		'VC.Widgets.BasicTreeNode',
		declare(dijit._TreeNode, {
			_setLabelAttr: { node: 'labelNode', type: 'innerHTML' },

			_setIndentAttr: function (indent) {
				var newIndent = 0;
				for (var key in this.tree.model._items) {
					if (
						this.item.userdata &&
						this.item.userdata.itName &&
						this.tree.model._items[key].id == this.item.userdata.itName &&
						this.tree.model._items[key].openIcon != '../cbin/'
					) {
						newIndent = 8;
						break;
					}
				}
				var pixels =
					Math.max(indent, 0) * this.tree._nodePixelIndent + newIndent + 'px';

				domStyle.set(this.domNode, 'backgroundPosition', pixels + ' 0px');
				domStyle.set(
					this.rowNode,
					this.isLeftToRight() ? 'paddingLeft' : 'paddingRight',
					pixels
				);

				array.forEach(this.getChildren(), function (child) {
					child.set('indent', indent + 1);
				});

				this._set('indent', indent);
			}
		})
	);
});
