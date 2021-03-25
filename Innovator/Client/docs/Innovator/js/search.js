const getBaseUrl = () => {
	const currentUrl = location.href;
	const fixedDocsPath = '/docs/Innovator/';

	const baseUrl = currentUrl.substring(
		0,
		currentUrl.indexOf(fixedDocsPath) + fixedDocsPath.length
	);

	return baseUrl;
};

const getSearchIndex = async () => {
	const pathToSearchIndex = getBaseUrl() + 'searchIndex.json';
	try {
		const fetchResult = await fetch(pathToSearchIndex);
		const parsedFetchResult = await fetchResult.json();

		return parsedFetchResult;
	} catch (error) {
		console.log(error);
		return;
	}
};

const insertSearchComponentInHeader = (searchDomElement) => {
	const headerControlsContainer = document.querySelector(
		'header nav.slidingNav ul.nav-site'
	);
	headerControlsContainer.insertBefore(
		searchDomElement,
		headerControlsContainer.firstChild
	);
};

const createSearchComponentLayout = () => {
	const searchComponentRootNode = document.createElement('li');
	searchComponentRootNode.classList.add('aras-docs-search-wrapper');

	const input = document.createElement('input');
	input.placeholder = 'Search';
	input.classList.add('aras-docs-search__input');

	searchComponentRootNode.appendChild(input);

	return searchComponentRootNode;
};

const searchEventHandlers = {
	navigateToSelectedPage: (event, document) => {
		const targetUrl = getBaseUrl() + document.routeRelativeToDocs;

		window.location.assign(targetUrl);
	}
};

const createSearchComponent = async () => {
	const searchIndex = await getSearchIndex();
	if (!searchIndex) {
		return;
	}
	const documents = searchIndex.documents;
	const lunrIndex = lunr.Index.load(searchIndex.index);

	const searchComponentNode = createSearchComponentLayout();
	insertSearchComponentInHeader(searchComponentNode);

	const input = searchComponentNode.querySelector('input');
	const searchComponent = autocomplete(
		input,
		{
			hint: false,
			autoselect: true,
			cssClasses: {
				root: 'aras-docs-search'
			}
		},
		[
			{
				source: (input, callback) => {
					const numberOfResultsToBeShown = 8;

					const terms = input
						.split(' ')
						.map((each) => each.trim().toLowerCase())
						.filter((each) => each.length > 0);
					const results = lunrIndex
						.query((query) => {
							query.term(terms);
							query.term(terms, { wildcard: lunr.Query.wildcard.TRAILING });
						})
						.slice(0, numberOfResultsToBeShown)
						.map((result) =>
							documents.find(
								(document) => document.id.toString() === result.ref
							)
						)
						.filter((doc) => {
							return doc.language === window.document.documentElement.lang;
						});

					callback(results);
				},
				templates: {
					suggestion: function (document) {
						return autocomplete.escapeHighlightedString(
							document.pageTitle === document.sectionTitle
								? document.sectionTitle
								: `${document.pageTitle} - ${document.sectionTitle}`
						);
					},
					empty: () => {
						return 'No results';
					}
				}
			}
		]
	);

	searchComponent.on(
		'autocomplete:selected',
		searchEventHandlers.navigateToSelectedPage
	);

	input.addEventListener('focus', () => {
		input.classList.add('aras-docs-search__input_expanded');
	});
	input.addEventListener('blur', () => {
		input.classList.remove('aras-docs-search__input_expanded');
	});

	return searchComponentNode;
};

window.addEventListener('load', createSearchComponent);
