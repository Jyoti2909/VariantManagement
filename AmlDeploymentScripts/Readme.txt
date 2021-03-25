This folder contains AML scripts used by automated deployment procedure.
Contents of the folder:
	1-BeforeAmlPackagesImport - folder with AML scripts that should be applied before AML packages import.
	2-AfterAmlPackagesImport  - folder with AML scripts that should be applied after AML packages import.

GENERAL NOTES:
Usual reasons to use these scripts are the following:
	- Modify metadata that prevents to successfully import AML packages (for example: default values, constraints, etc.);
	- Resolve circular dependencies in the AML-packages by fixing AML packages defintions in DB;
	- Modify any data (not metadata) that is not in AML packages.

DEVELOPMENT NOTES:
Both 1-BeforeAmlPackagesImport and 2-AfterAmlPackagesImport folders contain AML templates for server-side methods and SQL scripts.
Scripts inside these folders applied in alphabetical order so consider to use 4 digits prefix for each script file (e.g. 0010_script_name.xml).
It is recommended to increase number in the prefix by tens in order to have possibility to insert new scripts between already existing ones when required.

In the beginning of release development it is required to delete scripts inherited from the previous release.