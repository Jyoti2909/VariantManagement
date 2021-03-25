using System;
using System.Runtime.Serialization;

namespace Aras.Tools.WebServices
{
    ///<summary>
    /// LogOnException
    ///</summary>
    [Serializable]
    public class LogOnException : Exception
    {
        public LogOnException()
            : base()
        { }

        public LogOnException(string message)
            : base(message)
        { }

        public LogOnException(string message, Exception innerException)
            : base(message, innerException)
        { }

        protected LogOnException(SerializationInfo info, StreamingContext context)
            : base(info, context)
        {
        }
    }

    ///<summary>
    /// CustomException
    ///</summary>
    [Serializable]
    public class CustomException : Exception
    {
        public CustomException()
            : base()
        { }

        public CustomException(string message)
            : base(message)
        { }

        public CustomException(string message, Exception innerException)
            : base(message, innerException)
        { }

        protected CustomException(SerializationInfo info, StreamingContext context)
            : base(info, context)
        {
        }
    }
}