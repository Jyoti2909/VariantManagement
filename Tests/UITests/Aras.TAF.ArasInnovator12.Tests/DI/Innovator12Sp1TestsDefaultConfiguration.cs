using Aras.TAF.ArasInnovator12.Tests.Tests.CoreSmoke;

namespace Aras.TAF.ArasInnovator12.Tests.DI
{
	/// <summary>
	/// Container stores the default bindings related to Innovator 12SP1 version
	/// </summary>
	public class Innovator12Sp1TestsDefaultConfiguration : Innovator12TestsDefaultConfiguration
	{
		/// <inheritdoc/>
		public override void Load()
		{
			base.Load();
			Rebind<S_1_002_LoginProcedure.S_1_002_LoginProcedureTest_I12>().To<S_1_002_LoginProcedure.S_1_002_LoginProcedureTest_I12Sp1>();
		}
	}
}
