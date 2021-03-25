define(['dojo/_base/declare'], function (declare) {
	return declare('ES.WrappedToolbar', null, {
		constructor: function (control) {
			this._control = control || {};
			this._items = [];
		},

		/**
		 * Initializing toolbar data based on _items array
		 *
		 */
		initializeData: function () {
			var tmpData = new Map();

			this._items.forEach(
				function (item) {
					tmpData.set(item.id, item);
				}.bind(this)
			);

			this._control.data = tmpData;
		},

		/**
		 * Adds event to internal control
		 *
		 * @param {string} event Name of the event
		 * @param {function} callback Callback function
		 */
		on: function (event, callback) {
			this._control.on(event, callback);
		},

		/**
		 * Calls internal render method
		 *
		 */
		render: function () {
			this._control.render();
		},

		/**
		 * Adds new toolbar item
		 *
		 * @param {string} image Path to image
		 * @param {string} type Type of toolbar item
		 * @param {string} id ID of toolbar item
		 * @param {string} tooltipTemplate Tooltip text
		 */
		addItem: function (image, type, id, tooltipTemplate) {
			this._items.push({
				image: image || '',
				type: type || '',
				id: id || '',
				tooltip_template: tooltipTemplate || ''
			});
		},

		/**
		 * Returns toolbar item
		 *
		 * @param {string} itemID ID of toolbar item
		 * @returns {Object}
		 */
		getItem: function (itemID) {
			return this._control.data.get(itemID);
		},

		/**
		 * Sets/removes disabled state to/from toolbar item
		 *
		 * @param {string} itemID ID of toolbar item
		 * @param {boolean} isDisabled Should be toolbar item disabled or not
		 */
		setItemDisabled: function (itemID, isDisabled) {
			this._control.data.set(
				itemID,
				Object.assign({}, this.getItem(itemID), { disabled: isDisabled })
			);
		}
	});
});
