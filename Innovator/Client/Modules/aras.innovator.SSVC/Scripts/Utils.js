define(function () {
	//Extensions
	if (!String.prototype.Format) {
		String.prototype.Format = function () {
			const args = arguments;
			return this.replace(/{(\d+)}/g, function (match, number) {
				return typeof args[number] !== 'undefined' ? args[number] : '';
			});
		};
	}

	return {
		setResources: function (object, dom) {
			Object.keys(object).forEach(function (key) {
				const target = dom.querySelector(key);
				if (
					(target.nodeName === 'INPUT' && target.type !== 'button') ||
					target.nodeName === 'TEXTAREA'
				) {
					target.setAttribute('placeholder', object[key]);
				} else if (target.type === 'button') {
					target.value = object[key];
				} else {
					target.textContent = object[key];
				}
			});
		},
		fillListByName: function (name, select) {
			const listValues = aras.getListValues(aras.getListId(name), false);
			Array.prototype.forEach.call(
				listValues,
				function (type) {
					this.add(
						new Option(
							aras.getItemProperty(type, 'label'),
							aras.getItemProperty(type, 'value')
						)
					);
				},
				select
			);
		},
		GetResource: function (key) {
			return aras.getResource('../Modules/aras.innovator.ssvc/', key);
		},

		GetDateTimeInNeutralFormat: function (dateTimePar) {
			function pad(x) {
				return x < 10 ? '0' + x : '' + x;
			}
			const dateTime = dateTimePar !== undefined ? dateTimePar : new Date();

			const months = dateTime.getMonth() + 1;
			const days = dateTime.getDate();
			const years = dateTime.getFullYear();
			const hours = dateTime.getHours();
			const minutes = dateTime.getMinutes();
			const seconds = dateTime.getSeconds();

			const dateTimeStr = '{0}/{1}/{2} {3}:{4}:{5}'.Format(
				pad(days),
				pad(months),
				pad(years),
				pad(hours),
				pad(minutes),
				pad(seconds)
			);
			return aras.convertToNeutral(dateTimeStr, 'date', 'dd/MM/yyyy HH:mm:ss');
		}
	};
});
