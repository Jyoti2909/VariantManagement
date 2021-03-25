describe('ShowIdentities method tests', function() {
	const innovator = new Aras.IOM.Innovator('server_connection');
	const identitiesList = 'identitiesList';
	const identitiesNames = ['name 1', 'name 2', 'name 3'];

	let oldAras;
	// applyProcessors array contains fake AML responses
	let applyProcessors = [];

	// Create mock on aras object
	const mockAras = {
		// Stub
		AlertError: function(errorItem) {},

		// Stub
		AlertWarning: function(warningMessage) {},

		newIOMItem: function(name, action) {
			const item = innovator.newItem(name);
			item.setAttribute('action', action);

			sinon.stub(item, 'apply').callsFake(function () {
				for (let i = 0, count = applyProcessors.length; i < count; i++) {
					const processorResult = applyProcessors[i](item);
					if (processorResult) {
						return processorResult;
					}
				}
				assert(false, 'No apply processor is found.');
			});

			return item;
		},

		getIdentityList: function(e) {
			return identitiesList;
		}
	};

	before(function() {
		oldAras = window.aras;
		window.aras = mockAras;
	});

	after(function() {
		window.aras = oldAras;
	});

	// Before each test we prepopulate fake AML responses for positive cases
	beforeEach(function() {
		applyProcessors = [];
		applyProcessors.push(function(item) {
			if (item.getType() === 'Identity' &&
				item.getAction() === 'get' &&
				item.getAttribute('idlist') === identitiesList &&
				item.getAttribute('select') === 'name') {

				let result;
				for (let i = 0, count = identitiesNames.length; i < count; i++) {
					let tempItem = innovator.newItem('Identity');
					tempItem.setProperty('name', identitiesNames[i]);
					if (result) {
						result.appendItem(tempItem);
					} else {
						result = tempItem;
					}
				}
				return result;
			}
		});
	});

	afterEach(function() {
	});

	it('Positive case: Identities are returned.', function() {
		// Create spy on AlertError and AlertWarning methods
		// to check whether the functions were called.
		const spyAlertError = sinon.spy(aras, 'AlertError');
		const spyAlertWarning = sinon.spy(aras, 'AlertWarning');

		ShowIdentities();

		// In our case by analyzing AlertError & AlertWarning
		// calls we may understand the flow of the method.
		const expectedList = identitiesNames.join(', ');
		assert(spyAlertWarning
			.withArgs(expectedList)
			.calledOnce);
		assert(spyAlertError.callCount === 0);

		// We have wrapped AlertError and AlertWarning methods
		// and after testing we have to release them
		spyAlertError.restore();
		spyAlertWarning.restore();
	});

	it('Negative case: Error during apply.', function() {
		const expectedErrorItem = {
			isError: function() {
				return true;
			}
		};
		// In negative case we add additional fake AML response
		// with higher priority (first in array) which returns error
		applyProcessors.unshift(function(item) {
			if (item.getType() === 'Identity' &&
				item.getAction() === 'get' &&
				item.getAttribute('idlist') === identitiesList &&
				item.getAttribute('select') === 'name') {

				return expectedErrorItem;
			}
		});

		// Create spy on AlertError and AlertWarning methods
		// to check whether the functions were called.
		const spyAlertError = sinon.spy(aras, 'AlertError');
		const spyAlertWarning = sinon.spy(aras, 'AlertWarning');

		ShowIdentities();

		assert(spyAlertError
			.withArgs(expectedErrorItem)
			.calledOnce);
		assert(spyAlertWarning.callCount === 0);

		// We have wrapped AlertError and AlertWarning methods
		// and after testing we have to release them
		spyAlertError.restore();
		spyAlertWarning.restore();
	});
})