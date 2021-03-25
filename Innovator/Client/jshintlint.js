const exec = require('child_process').exec;

const checklist = [
	'BrowserCode/',
	'javascript/',
	'Modules/aras.innovator.CMF/',
	'Modules/aras.innovator.core.Controls/',
	'Modules/aras.innovator.core.Core/',
	'Modules/aras.innovator.core.EffectivityServices/',
	'Modules/aras.innovator.core.Form/',
	'Modules/aras.innovator.core.History/',
	'Modules/aras.innovator.core.ItemWindow/',
	'Modules/aras.innovator.core.License/',
	'Modules/aras.innovator.core.MainWindow/',
	'Modules/aras.innovator.CUI/',
	'Modules/aras.innovator.DomainAccessControl/',
	'Modules/aras.innovator.ES/',
	'Modules/aras.innovator.ExtendedClassification/',
	'Modules/aras.innovator.Izenda/',
	'Modules/aras.innovator.MassPromote/',
	'Modules/aras.innovator.Printing/',
	'Modules/aras.innovator.QueryBuilder/',
	'Modules/aras.innovator.solutions/',
	'Modules/aras.innovator.SSVC/',
	'Modules/aras.innovator.TDF/',
	'Modules/aras.innovator.TreeGridView/',
	'Modules/aras.innovator.Viewers/',
	'Modules/formPreview/',
	'scripts/ReportTool/',
	'Solutions/PLM/',
	'tests/AML-packages/'
];

console.log('jshint:start');
exec(`npm run jshint ${checklist.join(' ')}`, (err, stdout, stderr) => {
	if (err) {
		console.log('jshint:error', stdout, stderr);
		process.exit(1);
	}
	console.log('jshint:finish');
});
