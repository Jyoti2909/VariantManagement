function Solution(name, baseUrl) {
	/// <summary>
	///	 Solution class keeps all information about solution created.
	/// </summary>
	/// <summary locid="M:J#Aras.Client.JS.Solution.#ctor">
	/// This is summary for constructor.
	/// </summary>
	/// <param locid="M:J#Aras.Client.JS.Solution.#ctor" name="name" type="string" mayBeNull="false">
	///	 Name of solution.
	/// </param>
	this.baseUrl = baseUrl;
	this.name = name;
}

Solution.prototype.getBaseURL = function SolutionGetBaseURL() {
	/// <summary locid="M:J#Aras.Client.JS.Solution.getBaseURL">
	///  Get base URL of solution.
	/// </summary>
	/// <returns type="string">Returns base URL of solution.</returns>
	//check for not undefined instead of !this.baseUrl because this.baseUrl can be relative and '',
	//e.g., when Solution is created in the folder Client (in the base url)
	if (this.baseUrl !== undefined) {
		return this.baseUrl;
	}

	const location = this._getCurrentLocationObject();
	if (location.href.toLowerCase().includes('/client/')) {
		return location.href.replace(
			/(\/Client(?:\/X-salt=[^\/]*-X)?)(\/|$)(.*)/i,
			'$1'
		);
	}

	// if there is no client then take all the sections from path before salt
	const rex = RegExp('/X-(salt=[^\\/]*)-X', 'i');
	const path = location.pathname;
	const match = rex.exec(path);

	let pathLength = match ? match.index : path.length;
	if (path.endsWith('/')) {
		pathLength -= 1;
	}

	return location.origin + path.substring(0, pathLength);
};

Solution.prototype.getServerBaseURL = function SolutionGetServerBaseURL() {
	/// <summary locid="M:J#Aras.Client.JS.Solution.getServerBaseURL">
	///  Get base server URL of solution.
	/// </summary>
	/// <returns type="string">Returns base URL of solution.</returns>
	var s = this.getBaseURL();
	return s.replace(/\/client(?:\/X-salt=[^\/]*-X)?$/i, '/Server/');
};

Solution.prototype._getCurrentLocationObject = function SolutionGetServerBaseURL() {
	return window.location;
};
/*@cc_on
@if (@register_classes == 1)
Type.registerNamespace("Aras");
Type.registerNamespace("Aras.Client");
Type.registerNamespace("Aras.Client.JS");

Aras.Client.JS.Solution = Solution;
Aras.Client.JS.Solution.registerClass("Aras.Client.JS.Solution");
@end
@*/
