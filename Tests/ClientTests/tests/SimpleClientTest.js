describe("Check SimpleClientMethod function", function() {
	it('Check 2 + 3', function() {
		var inArgs = { a: 2, b: 3 };
		var result = SimpleClientMethod(null, inArgs);

		expect(result).to.equals(5);
	});

	it('Check 2 + (-3)', function() {
		var inArgs = { a: 2, b: -3 };
		var result = SimpleClientMethod(null, inArgs);

		expect(result).to.equals(-1);
	});
});