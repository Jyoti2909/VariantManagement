/*
makeItCaseInsensetive.js
makeItCaseInsensetive(types) duplicates all functions in current type with the same ones with another names.
The first character in new methods names are replaced with character with inverted case.
*/

(function () {
	function invertFirstLetterCase(name) {
		var firstCharacter = name.charAt(0);
		var isUpperCase = firstCharacter === firstCharacter.toUpperCase();
		firstCharacter = isUpperCase
			? firstCharacter.toLowerCase()
			: firstCharacter.toUpperCase();
		return firstCharacter + name.slice(1);
	}

	window.makeItCaseInsensetive = function () {
		for (var i = 0; i < arguments.length; i++) {
			var type = arguments[i];
			var memberName;
			var j;

			var methods = [];
			// protype methods
			for (memberName in type.prototype) {
				if (typeof type.prototype[memberName] === 'function') {
					methods.push(memberName);
				}
			}

			for (j = 0; j < methods.length; j++) {
				memberName = methods[j];
				type.prototype[invertFirstLetterCase(memberName)] =
					type.prototype[memberName];
			}

			methods = [];
			// type methods
			for (memberName in type) {
				if (typeof type[memberName] === 'function') {
					methods.push(memberName);
				}
			}

			for (j = 0; j < methods.length; j++) {
				memberName = methods[j];
				type[invertFirstLetterCase(memberName)] = type[memberName];
			}
		}
	};
})();
