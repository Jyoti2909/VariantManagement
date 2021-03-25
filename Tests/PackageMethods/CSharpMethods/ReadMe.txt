Examples
See example of unit test creating in ..\PackageMethods\MethodConverter\SampleMethod.xml, PackageMethods\CSharpMethods.UnitTests\SampleUnitTest.cs files.(PackageMethods\CSharpMethods,PackageMethods\CSharpMethods.UnitTests projects)

How to create a unit test for new method
Step 1. Add Xml server method to project
	
	1) Open "PackageMethods/CSharpMethods" project through Visual Studio;
	2) Add xml server method file as link (not like copy of file) to "MethodLinks" folder;
	3) Build "PackageMethods/CSharpMethods" project;
	   -> Cs files will be generated in "CompiledMethods" folder;
	   -> "PackageMethods/CSharpMethods.csproj" will be modified. Visual Studio will ask you to reload the project. Reload it. You should commit this change into git;


Step 2. Write unit test

	1) Open "PackageMethods\CSharpMethods.UnitTests" project;
	2) Create or open unitTest cs file;
	3) [Optional] Link to your generated c# class like that 
	   "using SampleMethod = CSharpMethods.Methods.SampleMethod.ItemMethod;"
	4) write test


How to write Innovator server-side method code in Visual Studio
There are 2 strategy to develop server-side method code
	- [default, no intellisence in Visual Studio] write c# code in xml file and generate c# class (MethodXmlIsPrimary strategy)
	- [not default, intellisence in Visual Studio] write c# code in generated c# class and build PackageMethods/CSharpMethods to overwrite xml file (MethodCSIsPrimary strategy)
You can change strategy in "ServerMethodsCompilerEngine" project by change property "Strategy" (ServerMethodsCompilerEngine project\Properties\Embeded.resx).


General Description
Project "ServerMethodCompiler" contains links to xml server methods. 
When the project is building it creates c# class for Innovator server-side c# code contained in the linked xml;

To test your c# code you can split your code to:
	- method code (the calling code)
	- businessLogic code (testing code)
	- dataAccessLayer code (untesting code)

You can see example of code splitting in "PackageMethods/CSharpMethods" project (\MethodLinks\SampleMethod.xml)
Example of testing this method you can see in "PackageMethods\CSharpMethods.UnitTests" project (SampleUnitTest.cs)

Known Limitations and Notes
	1) Innovator cs server-side methods are only supported (not VB!!!);
	2) If c# class for server-side method(xml) is already exist it will be overwritten. If you changed generated c# code then backup file will appear in "CompilationBackup" folder.
	3) If you want to use strategy "MethodCSIsPrimary" the xml file should exist.
	4) If strategy is "MethodCSIsPrimary" and you modify generated c# code then xml of Innovator server-side c# code will be overwritten. Xml file backup will be create in "CompilationBackup" folder.
	5) Very first build of "PackageMethods/CSharpMethods" project in Visual Studio will cause "Reload" Visual Studio prompt. You have to reload it.