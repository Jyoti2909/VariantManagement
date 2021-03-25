
rh.model.subscribe(rh.consts('KEY_SEARCH_TERM'), function (searchTerm) {
	searchTerm = searchTerm || '';
	var searchBoxes = document.querySelectorAll(".wSearchField");
    for (i = searchBoxes.length-1; i > -1; i--) { 
		searchBoxes[i].value = searchTerm; 
	}
});
