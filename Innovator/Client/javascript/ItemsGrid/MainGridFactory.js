/*
 * ItemType Implementation used to expose ability to modify the main grid behaviour based on ItemType.
 *
 */

/*
This function implements inheritance mechanism in JavaScript
*/

function inherit(Child, Parent) {
	var F = function () {};
	F.prototype = Parent.prototype;
	Child.prototype = new F();
	Child.prototype.constructor = Child;
	Child.superclass = Parent.prototype;
}

var MainGridFactory = {
	Create: function MainGridFactoryCreate(itemTypeName) {
		switch (itemTypeName) {
			case 'InBasket Task':
				return new InBasketTaskGrid();
			default:
				return new ItemGrid();
		}
	}
};
