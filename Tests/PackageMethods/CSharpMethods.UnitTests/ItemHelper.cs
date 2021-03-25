using Aras.IOM;
using NSubstitute;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CSharpMethods.UnitTests
{
	internal static class ItemHelper
	{
		internal static Item CreateItem(string type, string action)
		{
			IServerConnection connection = Substitute.For<IServerConnection>();
			Innovator innovator = CreateInnovator(connection);
			return innovator.newItem(type, action);
		}

		internal static Innovator CreateInnovator()
		{
			IServerConnection connection = Substitute.For<IServerConnection>();
			return IomFactory.CreateInnovator(connection);
		}

		internal static Innovator CreateInnovator(IServerConnection connection)
		{
			return IomFactory.CreateInnovator(connection);
		}
	}
}