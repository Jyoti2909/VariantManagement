using System;
using System.Runtime.Serialization;

namespace DeploymentProcedure.Exceptions
{
	[Serializable]
	public class ConnectException : CommonException
	{
		public ConnectException()
		{
		}

		public ConnectException(string message) : base(message)
		{
		}

		public ConnectException(string message, Exception innerException) : base(message, innerException)
		{
		}

		protected ConnectException(SerializationInfo info, StreamingContext context) : base(info, context)
		{
		}
	}
}
