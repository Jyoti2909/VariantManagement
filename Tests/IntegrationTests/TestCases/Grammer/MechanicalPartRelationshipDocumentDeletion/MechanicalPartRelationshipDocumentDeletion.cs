using NUnit.Framework;

namespace IntegrationTests.Grammer
{
    [TestFixture]
    [Category("MechanicalPart")]
    public class MechanicalPartRelationshipDocumentDeletion : CustomIntegrationTestsBaseClass
    {
        private const string PathToTests = "TestCases\\Grammer\\MechanicalPartRelationshipDocumentDeletion";

        [Test]
        public void ProductEngineerCanDeleteDocumentRelationshipCreatedAnotherProductEngineer()
        {
            ExecuteTestCase(CombinePaths(PathToTests, "ProductEngineerCanDeleteDocumentRelationshipCreatedAnotherProductEngineer"));
        }

        [Test]
        public void IndustrialEngineerCanDeleteDocumentRelationshipCreatedAnotherIndustrialEngineer()
        {
            ExecuteTestCase(CombinePaths(PathToTests, "IndustrialEngineerCanDeleteDocumentRelationshipCreatedAnotherIndustrialEngineer"));
        }

        [Test]
        public void NonProductEngineerCanNotDeleteDocumentWithAssemblyClassification()
        {
            ExecuteTestCase(CombinePaths(PathToTests, "NonProductEngineerCanNotDeleteDocumentWithAssemblyClassification"));
        }

        [Test]
        public void NonProductEngineerCanNotDeleteDocumentWithComponentClassification()
        {
            ExecuteTestCase(CombinePaths(PathToTests, "NonProductEngineerCanNotDeleteDocumentWithComponentClassification"));
        }

        [Test]
        public void NonProductEngineerCanNotDeleteDocumentWithPhantomClassification()
        {
            ExecuteTestCase(CombinePaths(PathToTests, "NonProductEngineerCanNotDeleteDocumentWithPhantomClassification"));
        }

        [Test]
        public void NonIndustrialEngineerCanNotDeleteDocumentWithMBOMClassification()
        {
            ExecuteTestCase(CombinePaths(PathToTests, "NonIndustrialEngineerCanNotDeleteDocumentWithMBOMClassification"));
        }
    }
}