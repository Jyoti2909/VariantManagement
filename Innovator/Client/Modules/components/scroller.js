// @flow
type Sticky = {
	collapsed: boolean,
	expand: Function,
	maximized: boolean
} & HTMLElement;

const accordionMinHeight = 320;
const relationshipInitialHeight = 600;

export default class Scroller extends HyperHTMLElement {
	_mutationObserver: ?MutationObserver = null;
	_intersectionObserver: ?IntersectionObserver = null;
	_scrollerTop: number = 0;
	_currentStickedElement: ?HTMLElement = null;
	_store: WeakMap<HTMLElement, HTMLElement> = new WeakMap();
	_wrappers: Set<HTMLElement> = new Set();
	_isMaximized: boolean = false;

	created() {
		this._mutationObserver = new MutationObserver((mutations) => {
			this._mutationObserverHandler(mutations);
		});
		this._mutationObserver.observe(this, {
			childList: true,
			subtree: true,
			attributes: true,
			attributeFilter: ['active-pane-id']
		});
		this._intersectionObserver = new IntersectionObserver(
			(changes) => {
				this._intersectionObserverHandler(changes);
			},
			{
				root: this,
				// If page would be zoomed, Chrome calculates incorrect fractional pixels in sticky wrapper's width and IntersectionRatio less than 1
				threshold: [0.999, 1]
			}
		);
		this.addEventListener('accordionToggle', this._accordionToggleHandler);
		this.addEventListener('accordionMaximize', this._resizeAccordion);
		this.addEventListener('scroll', this._scrollHandler);
		window.addEventListener('resize', this._resizeHandler);
	}

	connectedCallback() {
		this.classList.add('aras-scroller');
	}

	disconnectedCallback() {
		this._mutationObserver && this._mutationObserver.disconnect();
		this._intersectionObserver && this._intersectionObserver.disconnect();
		this.removeEventListener('accordionToggle', this._accordionToggleHandler);
		this.removeEventListener('accordionMaximize', this._resizeAccordion);
		this.removeEventListener('scroll', this._scrollHandler);
		window.removeEventListener('resize', this._resizeHandler);
	}

	async _mutationObserverHandler(
		mutations: Array<MutationRecord>
	): Promise<void> {
		const relationshipIframes = await this._collectRelationshipIframes(
			mutations
		);
		const scrollables = await Promise.all(
			relationshipIframes.map((iframe) => this._loadScrollableElement(iframe))
		);
		this._connectResizeObserver(scrollables);
	}

	_loadScrollableElement(iframe: HTMLIFrameElement): Promise<HTMLElement> {
		return new Promise((resolve) => {
			const setupScrollableElement = (scrollableElement) => {
				const overflowY = this._isMaximized ? 'auto' : 'hidden';
				scrollableElement.style.overflowY = overflowY;
				this._store.set(
					((iframe.closest('.aras-scroller__sticky'): any): HTMLElement) ||
						iframe,
					scrollableElement
				);
			};

			const contentWindow = iframe.contentWindow;
			const grid = contentWindow.grid;
			if (grid) {
				const scrollableElement = grid._grid.view.scrollableElement;
				setupScrollableElement(scrollableElement);
				resolve(scrollableElement);
				return;
			}

			const observer = new MutationObserver((mutations, observer) => {
				const grid = contentWindow.grid;
				const scrollableElement = grid && grid._grid.view.scrollableElement;

				if (scrollableElement) {
					setupScrollableElement(scrollableElement);
					resolve(scrollableElement);
					observer.disconnect();
				}
			});
			observer.observe(contentWindow.document, {
				childList: true,
				subtree: true
			});
		});
	}

	async _collectRelationshipIframes(
		mutations: Array<MutationRecord>
	): Promise<Array<HTMLIFrameElement>> {
		const iframes = mutations.reduce((iframes, mutationRecord) => {
			if (mutationRecord.type !== 'attributes') {
				return iframes;
			}

			const switcherControl = ((mutationRecord.target: any): HTMLElement);
			const activePaneId = switcherControl.getAttribute('active-pane-id') || '';
			const closestAccordion = ((switcherControl.closest(
				'.aras-accordion'
			): any): Object);
			if (closestAccordion) {
				closestAccordion.maximized = this._isMaximized;
			}
			const relationshipIframe = ((document.getElementById(
				activePaneId
			): any): HTMLIFrameElement);
			const isInfernoGridIFrame =
				relationshipIframe instanceof HTMLIFrameElement &&
				relationshipIframe.src.includes('relationshipsInfernoGrid.html');
			if (isInfernoGridIFrame) {
				iframes.push(relationshipIframe);
			} else if (relationshipIframe) {
				relationshipIframe.height = this._isMaximized
					? '100%'
					: `${relationshipInitialHeight}`;
			}

			this._store.delete(closestAccordion);
			this._setupStickyWrapperNode(closestAccordion, isInfernoGridIFrame);

			return iframes;
		}, []);

		return await Promise.all(
			iframes.map((iframe) => {
				return new Promise((resolve) => {
					if (iframe.contentWindow.location.href === iframe.src) {
						resolve(iframe);
						return;
					}

					iframe.addEventListener('load', function loadHandler() {
						iframe.removeEventListener('load', loadHandler);
						resolve(iframe);
					});
				});
			})
		);
	}

	_adjustFrameSize(frame: HTMLIFrameElement): void {
		const _window = frame.contentWindow;
		const gridContainer = _window.document.getElementById('gridTD');
		const gridHeader = gridContainer.querySelector('.aras-grid-header');

		if (!gridHeader) {
			return;
		}
		if (this._isMaximized) {
			frame.style.height = '100%';
			return;
		}

		const topMargin = 12;
		const accordion = _window.frameElement.closest('aras-accordion');
		let accordionOffset = 0;
		if (accordion) {
			const accordionHead = accordion.shadowRoot.querySelector(
				'.aras-accordion__header'
			);
			const accordionContent = accordion.shadowRoot.querySelector(
				'.aras-accordion__content'
			);
			accordionOffset =
				accordionHead.offsetHeight +
				parseInt(window.getComputedStyle(accordionContent).paddingTop) * 2;
		}

		const scrollerHeight = _window.grid._grid.view.scroller.offsetHeight;
		const scrollableElement = _window.grid._grid.view.scrollableElement;
		const paginationOffset = _window.pagination
			? _window.pagination.offsetHeight +
			  parseInt(getComputedStyle(_window.pagination).marginTop)
			: 0;
		const gridOuterHeight = gridContainer.offsetTop + paginationOffset;
		const headerHeight = gridHeader.offsetHeight;
		const scrollbarWidth =
			scrollableElement.offsetHeight - scrollableElement.clientHeight;
		frame.style.height =
			Math.max(
				Math.min(
					headerHeight + gridOuterHeight + scrollerHeight + scrollbarWidth,
					this.clientHeight - accordionOffset - topMargin
				),
				accordionMinHeight - accordionOffset
			) + 'px';
	}

	_adjustGridContainerSize(gridContainer: ?HTMLDivElement): void {
		if (gridContainer) {
			const gridFrameWindow = gridContainer.ownerDocument.defaultView;
			const paginationOffset = gridFrameWindow.pagination
				? gridFrameWindow.pagination.offsetHeight +
				  parseInt(getComputedStyle(gridFrameWindow.pagination).marginTop)
				: 0;
			const gridOuterHeight = gridContainer.offsetTop + paginationOffset;

			gridContainer.style.maxHeight = `calc(100% - ${gridOuterHeight}px)`;
		}
	}

	_resizeGridAndFrame(gridScroller: ?HTMLDivElement): void {
		if (gridScroller) {
			const gridFrameWindow = gridScroller.ownerDocument.defaultView;
			const gridContainer = ((gridScroller.closest(
				'.aras-grid'
			): any): ?HTMLDivElement);
			const gridFrame: HTMLIFrameElement = gridFrameWindow.frameElement;

			this._adjustGridContainerSize(gridContainer);
			this._adjustFrameSize(gridFrame);
		}
	}

	_handleResize(targets: Array<Object>): void {
		targets.forEach((target) => {
			const domElement = target.target;
			const targetOwnerFrame =
				domElement.ownerDocument.defaultView.frameElement;
			const targetOwnerFrameStyle = window.getComputedStyle(targetOwnerFrame);
			if (targetOwnerFrameStyle.visibility === 'hidden') {
				return;
			}

			const [type, id] = [...domElement.dataset.scrollerMark.split('_')];
			switch (type) {
				case 'scroller':
					{
						this._resizeGridAndFrame(domElement);
						this._calculateStickyHeight(domElement);
					}
					break;
				case 'toolbar':
				case 'body':
					{
						const gridScroller = domElement.ownerDocument.querySelector(
							'[data-scroller-mark="scroller_' + id + '"]'
						);
						this._resizeGridAndFrame(gridScroller);
						this._scrollerTop = this.getBoundingClientRect().top;
						this._calculateStickyHeight(gridScroller);
					}
					break;
			}
		});
	}

	_connectResizeObserver(scrollableElements: Array<HTMLElement>): void {
		scrollableElements.forEach((gridScroller, idx) => {
			const scroller = gridScroller.firstElementChild;
			const body = gridScroller.parentElement;
			const tollbars = gridScroller.ownerDocument.getElementById(
				'topContainer'
			);
			const gridWindow = gridScroller.ownerDocument.defaultView;
			if (
				!scroller ||
				!gridWindow ||
				!(scroller instanceof gridWindow.HTMLElement) ||
				!body ||
				!(body instanceof gridWindow.HTMLElement) ||
				!tollbars ||
				scroller.dataset.scrollerMark
			) {
				return;
			}

			gridWindow.frameElement.removeAttribute('height');
			const observer = new gridWindow.ResizeObserver(
				this._handleResize.bind(this)
			);

			scroller.dataset.scrollerMark = 'scroller_' + idx;
			body.dataset.scrollerMark = 'body_' + idx;
			tollbars.dataset.scrollerMark = 'toolbar_' + idx;

			observer.observe(scroller);
			observer.observe(body);
			observer.observe(tollbars);
		});
	}

	_setupStickyWrapperNode(accordion: HTMLElement, isSticky: boolean): void {
		if (!accordion) {
			return;
		}

		let accordionWrapperNode = ((accordion.closest(
			'.aras-scroller__wrapper'
		): any): HTMLElement);
		if (!accordionWrapperNode) {
			const iframe = ((accordion.querySelector(
				'iframe'
			): any): HTMLIFrameElement);
			const src = iframe.src;

			accordionWrapperNode = document.createElement('div');
			accordionWrapperNode.classList.add('aras-scroller__wrapper');
			this._wrappers.add(accordionWrapperNode);
			if (isSticky) {
				iframe.src = 'about:blank';
			}

			accordion.parentElement &&
				accordion.parentElement.replaceChild(accordionWrapperNode, accordion);
			accordionWrapperNode.appendChild(accordion);
			iframe.src = src;
			this._intersectionObserver &&
				this._intersectionObserver.observe(accordion);
		}

		accordion.classList.toggle('aras-scroller__sticky', isSticky);

		if (this._isMaximized) {
			accordionWrapperNode.style.height = '100%';
			return;
		}
		if (!isSticky) {
			accordionWrapperNode.style.height = '';
		}
	}

	_calculateStickyHeight(gridScroller: ?HTMLDivElement): void {
		if (this._isMaximized) {
			return;
		}

		const scrollableElement = gridScroller && gridScroller.parentElement;

		if (scrollableElement) {
			const frame = scrollableElement.ownerDocument.defaultView.frameElement;
			const sticky = frame.closest('.aras-accordion') || frame;
			if (sticky.classList.contains('aras-accordion') && sticky.collapsed) {
				sticky.parentElement.style.height = '';
				return;
			}

			const height =
				sticky.offsetHeight +
				scrollableElement.scrollHeight -
				scrollableElement.clientHeight;

			sticky.parentElement.style.height = `${height}px`;
		}
	}

	_accordionToggleHandler(event: Event): void {
		if (this._isMaximized) {
			return;
		}

		const target: HTMLElement = (event.target: any);
		const iframe = ((target.querySelector(
			'.aras-switcher-pane_active iframe[src*="relationshipsInfernoGrid.html"]'
		): any): HTMLIFrameElement);
		if (!iframe) {
			return;
		}

		const gridScroller = iframe.contentWindow.document.querySelector(
			'.aras-grid-scroller'
		);
		this._calculateStickyHeight(gridScroller);
	}

	_intersectionObserverHandler(
		changes: Array<IntersectionObserverEntry>
	): void {
		changes.forEach((change) => {
			const sticky = change.target;

			if (change.isIntersecting) {
				this._currentStickedElement = sticky;
				return;
			}
			if (this._currentStickedElement === sticky) {
				this._currentStickedElement = null;
			}
		});
	}

	_scrollHandler(): void {
		if (this._currentStickedElement) {
			const wrapper = this._currentStickedElement.parentElement;
			const scrollableElement = this._store.get(this._currentStickedElement);

			if (!wrapper || !scrollableElement) {
				return;
			}
			scrollableElement.scrollTop =
				this._scrollerTop - wrapper.getBoundingClientRect().top;
		}
	}

	_resizeHandler = () => {
		if (this._isMaximized) {
			return;
		}

		const activeIframes = ((this.querySelectorAll(
			'.aras-switcher-pane_active iframe[src*="relationshipsInfernoGrid.html"]'
		): any): Array<HTMLIFrameElement>);
		activeIframes.forEach((activeIframe) =>
			this._adjustFrameSize(activeIframe)
		);
	};

	_resizeAccordion(event: mixed): void {
		if (!(event instanceof CustomEvent)) {
			return;
		}
		const accordion = ((event.target: any): HTMLElement);
		const currentWrapper = ((accordion.closest(
			'.aras-scroller__wrapper'
		): any): HTMLElement);
		const details = (event.detail: any);

		this._isMaximized = details.maximized === 'true';
		currentWrapper.classList.toggle(
			'aras-scroller__wrapper_maximized',
			this._isMaximized
		);

		this._wrappers.forEach((wrapper) => {
			const hidden = this._isMaximized && currentWrapper !== wrapper;
			wrapper.classList.toggle('aras-scroller__wrapper_hidden', hidden);
		});

		const itemForm = currentWrapper.querySelector('aras-form');
		if (itemForm) {
			this._resizeItemForm(itemForm);
		} else {
			const relationshipSwitcher = currentWrapper.querySelector(
				'.aras-switcher'
			);
			const activePaneId = relationshipSwitcher?.getAttribute('active-pane-id');
			const relationshipIframe = ((document.getElementById(
				activePaneId || ''
			): any): HTMLIFrameElement);
			if (relationshipIframe) {
				this._resizeRelationship(relationshipIframe);
			}
		}
		if (this._isMaximized) {
			this._maximizeAccordion(currentWrapper);
			return;
		}

		this._restoreAccordion(currentWrapper);
	}

	_maximizeAccordion(wrapper: HTMLElement): void {
		const stickyElement = ((wrapper.firstElementChild: any): Sticky);
		const isCollapsed =
			stickyElement.classList.contains('aras-accordion') &&
			stickyElement.collapsed;
		isCollapsed && stickyElement.expand();
		wrapper.style.height = '100%';

		const scrollableElement = this._store.get(stickyElement);
		scrollableElement && (scrollableElement.style.overflowY = 'auto');
	}

	_restoreAccordion(wrapper: HTMLElement): void {
		const stickyElement = ((wrapper.firstElementChild: any): Sticky);
		const scrollableElement = this._store.get(stickyElement);
		if (scrollableElement) {
			scrollableElement.style.overflowY = 'hidden';
			const gridScroller = ((scrollableElement.firstElementChild: any): HTMLDivElement);
			this._resizeGridAndFrame(gridScroller);
			this._calculateStickyHeight(gridScroller);
			return;
		}

		wrapper.style.height = '';
	}

	_resizeItemForm(form: HTMLElement): void {
		form.style.height = this._isMaximized ? '100%' : `${window.formHeight}px`;
	}

	_resizeRelationship(iframe: HTMLIFrameElement): void {
		const isInfernoGridIFrame = iframe.src.includes(
			'relationshipsInfernoGrid.html'
		);
		if (isInfernoGridIFrame) {
			this._adjustFrameSize(iframe);
		} else {
			iframe.height = this._isMaximized
				? '100%'
				: `${relationshipInitialHeight}`;
		}
	}
}
