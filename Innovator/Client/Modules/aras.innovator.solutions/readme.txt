Current folder should not contain any files, it exists only for information. 
SolutionsModule HttpModule performs url rewriting similar to:
  http://domain.com/Client/Modules/aras.innovator.solutions.PLM/test.js -> http://domain.com/Client/Solutions/PLM/test.js

Following problems are resolved by such redirection:
 - dojo package location can be configured once to Modules/aras.innovator.solutions.{SolutionName}/ path which will always point to the Solution/{SolutionName}/ folder (see fixDojoSettings.js for details)
 - Aras ModulesManager become capable to load classes defined in Solutions/{SolutionName}/Scripts/Classes folder (ex. ModulesManager.using(["aras.innovator.solutions.{SolutionName}/{ClassName}"]).then(...) )