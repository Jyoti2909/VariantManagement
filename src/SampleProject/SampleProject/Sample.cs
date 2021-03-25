using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SampleProject
{
	public static class Sample
	{
		internal static string GetSampleString
		{
			get { return "Hello World"; }
		}

		public static void Greet()
		{
			Console.WriteLine(GetSampleString);
		}
	}
}
