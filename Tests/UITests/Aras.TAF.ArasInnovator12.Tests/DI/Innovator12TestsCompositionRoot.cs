using Aras.TAF.ArasInnovatorBase.Domain.Enums;
using Aras.TAF.ArasInnovatorBase.Domain.Interfaces;
using Ninject.Modules;
using System.Collections.Generic;
using System.Linq;

namespace Aras.TAF.ArasInnovator12.Tests.DI
{
	/// <summary>
	/// Allows to configure content of global IoC-container (composition root for IoC-container)
	/// </summary>
	public class Innovator12TestsCompositionRoot : Services.DI.CompositionRoot
	{
		protected Dictionary<InnovatorVersion, INinjectModule> InnovatorVersionForTestsModulesMap { get; set; }

		/// <summary>
		/// Initializes a new instance of the <see cref="Innovator12TestsCompositionRoot"/> class
		/// </summary>
		/// <param name="settings">IoC settings</param>
		public Innovator12TestsCompositionRoot(IIocSettings settings) : base(settings)
		{
			InnovatorVersionForTestsModulesMap =
				new Dictionary<InnovatorVersion, INinjectModule>
				{
					[InnovatorVersion.I12] = new Innovator12TestsDefaultConfiguration(),
					[InnovatorVersion.I12Sp1] = new Innovator12Sp1TestsDefaultConfiguration(),
					[InnovatorVersion.I12Sp2] = new Innovator12Sp2TestsDefaultConfiguration(),
					[InnovatorVersion.I12Sp3] = new Innovator12Sp3TestsDefaultConfiguration(),
					[InnovatorVersion.I12Sp4] = new Innovator12Sp4TestsDefaultConfiguration(),
					[InnovatorVersion.I12Sp5] = new Innovator12Sp5TestsDefaultConfiguration(),
					[InnovatorVersion.I12Sp6] = new Innovator12Sp6TestsDefaultConfiguration(),
					[InnovatorVersion.I12Sp7] = new Innovator12Sp7TestsDefaultConfiguration(),
					[InnovatorVersion.I12Sp8] = new Innovator12Sp8TestsDefaultConfiguration(),
					[InnovatorVersion.I12Sp9] = new Innovator12Sp9TestsDefaultConfiguration(),
					[InnovatorVersion.I12Sp10] = new Innovator12Sp10TestsDefaultConfiguration(),
					[InnovatorVersion.I12Sp11] = new Innovator12Sp11TestsDefaultConfiguration(),
					[InnovatorVersion.I12Sp12] = new Innovator12Sp12TestsDefaultConfiguration()
				};
		}

		/// <inheritdoc />
		public override INinjectModule[] GetModules()
		{
			var defaultModules = base.GetModules().ToList();
			defaultModules.Add(InnovatorVersionForTestsModulesMap[Settings.InnovatorVersion]);

			return defaultModules.ToArray();
		}
	}
}