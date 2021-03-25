import ClassStructure from './ClassStructure';

window.ClassStructure = ClassStructure;

const webComponentName = 'aras-class-structure';

if (!customElements.get(webComponentName)) {
	customElements.define(webComponentName, ClassStructure);
}
