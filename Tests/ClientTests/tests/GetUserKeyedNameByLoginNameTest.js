describe('Test GetUserKeyedNameByLoginName', function() {
	var oldAras;

	var innovator = new Aras.IOM.Innovator('server_connection');

	var adminAML =
		'<AML>' +
			'<Item type="User" id="1">' +
				'<keyed_name>Innovator Admin</keyed_name>' +
			'</Item>' +
		'</AML>';

	// Create fake responses
	var responseOnGetAdmin = innovator.newItem();
	responseOnGetAdmin.loadAML(adminAML);

	var responseOnGetNonexistenUser = {
		isError: function() {
			return true;
		},
		getErrorString: function() {
			return 'No items of type User found.';
		}
	};

	// Create mock on aras object
	var mockAras = {
		IomInnovator: innovator,

		newIOMItem: function(name, action) {
			var item = this.IomInnovator.newItem(name, action);

			if (action === 'get') {
				// Create stub on apply method which imitates 
				// server work
				sinon.stub(item, 'apply').callsFake(function() {
					var loginName = item.getProperty('login_name');

					if (loginName === 'admin') {
						return responseOnGetAdmin;
					} else {
						return responseOnGetNonexistenUser;
					}
				});
			}

			return item;
		},

		// Stub
		AlertError: function(errorMessage) { }
	};

	before(function() {
		oldAras = window.aras;
		window.aras = mockAras;
	});

	after(function() {
		window.aras = oldAras;
	});

	it('Get admin keyed name', function() {
		// We made stub for item.apply() method which returns mock result 
		// on 'get' action. Mock contains keyed_name 'Innovator Admin'.

		// Expect 'Innovator Admin'. 
		var userKeyedName = GetUserKeyedNameByLoginName(null, { loginName: 'admin' });

		expect(userKeyedName).to.equal('Innovator Admin');
	});

	it('Get nonexistent user keyed name', function() {
		// Create spy on aras.AlertError method to check wether the
		// function was called.
		var spyOnAlertError = sinon.spy(aras, 'AlertError');

		// We expect mock with error message 'No items of type User found.'
		var user = GetUserKeyedNameByLoginName(null, { loginName: 'nonexistent' });

		assert(spyOnAlertError
			.withArgs('No items of type User found.')
			.calledOnce);

		// We have wrapped aras.AlertError method and after testing 
		// we have to release it
		spyOnAlertError.restore();
	});

	it('Get keyed name with empty login name', function() {
		// Create spy on aras.AlertError method to check wether the
		// function was called.
		var spyOnAlertError = sinon.spy(aras, 'AlertError');

		// We expect mock with error message 'Login can't be empty.'
		var user = GetUserKeyedNameByLoginName(null, { loginName: '' });

		assert(spyOnAlertError
			.withArgs('Login can\'t be empty.')
			.calledOnce);

		// We have wrapped aras.AlertError method and after testing 
		// we have to release it
		spyOnAlertError.restore();
	});

});