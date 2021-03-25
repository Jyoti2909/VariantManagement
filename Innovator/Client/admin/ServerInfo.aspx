<%@ Import Namespace="System.Xml" %>
<%@ Import Namespace="Aras.Client.Core" %>
<%@ Import Namespace="System.IO" %>

<script language="c#" runat="server">

	public void Page_Load(object sender, EventArgs e)
	{
		Response.ContentType = "text/xml";
		Response.Charset = "utf-8";
		Response.Expires = 0;
		Response.Write(ClientInfo());
	}

	private static string ClientInfo()
	{
		XmlDocument resultDom = new XmlDocument { InnerXml = "<ServerInfo/>" };
		XmlElement resultNd = resultDom.DocumentElement;

		try
		{
			ClientConfig icc = ClientConfig.GetServerConfig();
			string configPath = icc.ConfigFilePath;
			resultNd.SetAttribute("configfile_path", configPath);
			resultNd.SetAttribute("info_date", DateTime.UtcNow.ToString());
		}
		catch (XmlException e)
		{
			resultNd.SetAttribute("error", e.Message);
		}

		resultNd.SetAttribute("info_date", DateTime.UtcNow.ToString());

		XmlElement tmp1 = (XmlElement)resultNd.AppendChild(resultDom.CreateElement("directory"));
		PushDirectoryInfo(resultDom, tmp1, "../.", true, false);
		PushDirectoryInfo(resultDom, tmp1, "../cbin", true, true);
		PushDirectoryInfo(resultDom, tmp1, "../customer", true, true);
		PushDirectoryInfo(resultDom, tmp1, "../javascript", true, true);
		PushDirectoryInfo(resultDom, tmp1, "../developer", true, true);
		PushDirectoryInfo(resultDom, tmp1, "../scripts", true, true);
		PushDirectoryInfo(resultDom, tmp1, "../styles", true, true);
		PushDirectoryInfo(resultDom, tmp1, "../xml", true, true);
		PushDirectoryInfo(resultDom, tmp1, "../bin", true, true);
		return resultDom.OuterXml;
	}

	private static void PushDirectoryInfo(XmlDocument dom, XmlNode node, String subfolder, bool subp, bool dosub)
	{
		string folder;
		string name = null;

		if (subp)
		{
			folder = System.Web.HttpContext.Current.Server.MapPath(subfolder);
			name = subfolder.Replace("../", "");

		}
		else
		{
			folder = subfolder;
			name = folder.Substring(System.Web.HttpContext.Current.Server.MapPath("../.").Length + 1);
		}

		if (!Directory.Exists(folder))
		{
			return;
		}
		XmlElement tmp1 = (XmlElement)node.AppendChild(dom.CreateElement("directory"));
		tmp1.SetAttribute("name", name);
		tmp1.SetAttribute("pathname", folder);
		tmp1 = (XmlElement)node.AppendChild(dom.CreateElement("folder"));
		tmp1.SetAttribute("name", name);
		tmp1.SetAttribute("pathname", folder);
		foreach (string file_name in System.IO.Directory.GetFiles(folder))
		{
			FileInfo fi = new FileInfo(file_name);
			XmlElement tmp2 = (XmlElement)node.AppendChild(dom.CreateElement("file"));
			tmp2.SetAttribute("Name", fi.Name);
			tmp2.SetAttribute("CreationTime", fi.CreationTimeUtc.ToString());
			tmp2.SetAttribute("LastWriteTime", fi.LastWriteTimeUtc.ToString());
			tmp2.SetAttribute("Length", fi.Length.ToString());
			tmp2.SetAttribute("md5sum", file_md5sum(fi));
		}

		if (dosub)
		{
			foreach (string child in System.IO.Directory.GetDirectories(folder))
			{
				PushDirectoryInfo(dom, node, child, false, true);
			}
		}
	}

	private static string file_md5sum(System.IO.FileInfo file)
	{
		using (var md5 = new MD5())
		{
			FileStream fs = file.OpenRead();
			byte[] hash = md5.ComputeHash(fs);
			fs.Close();
			StringBuilder sb = new StringBuilder(32);
			for (int j = 0; j <= 15; j++)
			{
				sb.AppendFormat("{0:X2}", hash[j]);
			}
			return sb.ToString();
		}
	}

	private static string MapPathToClientFolder(string path)
	{
		return Path.Combine(AppDomain.CurrentDomain.BaseDirectory, path);
	}

	private sealed class MD5 : IDisposable
	{
		public void Dispose()
		{
			//Nothing to do here because we use managed code only
		}
		private const int BufShiftBits = 6;
		private const int BufSize = 0x40; // 2 ** 6
		private const int BufSizeModuloMask = BufSize - 1;
		// context
		private UInt32 State0;
		private UInt32 State1;
		private UInt32 State2;
		private UInt32 State3;
		private static byte[] Padding = new byte[BufSize];
		private byte[] Buffer;
		private UInt64 Count;   // count the bytes, not the bits
		private int BytesInBuffer { get { return (int)Count & BufSizeModuloMask; } }
		private enum SS
		{
			S11 = 7,
			S12 = 12,
			S13 = 17,
			S14 = 22,
			S21 = 5,
			S22 = 9,
			S23 = 14,
			S24 = 20,
			S31 = 4,
			S32 = 11,
			S33 = 16,
			S34 = 23,
			S41 = 6,
			S42 = 10,
			S43 = 15,
			S44 = 21
		};

		public MD5()
			: base()
		{
			Initialize();
		}

		static MD5()
		{
			Padding[0] = 0x80;
		}

		public byte[] ComputeHash(byte[] input, int index, int count)
		{
			Initialize();
			Update(input, index, count);
			return Final();
		}

		public byte[] ComputeHash(byte[] input)
		{
			return ComputeHash(
							input,
							input.GetLowerBound(0),
							input.GetUpperBound(0) - input.GetLowerBound(0) + 1
						);
		}

		private const int ReadBufSize = 1024 * 8;

		public byte[] ComputeHash(Stream stream)
		{
			byte[] buf = new byte[ReadBufSize];
			int nRead;

			Initialize();
			while ((nRead = stream.Read(buf, 0, ReadBufSize)) > 0)
			{
				Update(buf, 0, nRead);
			}
			return Final();
		}

		private void Initialize()
		{
			State0 = 0x67452301;
			State1 = 0xefcdab89;
			State2 = 0x98badcfe;
			State3 = 0x10325476;

			Count = 0;
			if (Buffer == null)
				Buffer = new byte[BufSize];
		}

		private void Update(byte[] input)
		{
			Update(input,
					input.GetLowerBound(0),
					input.GetUpperBound(0) - input.GetLowerBound(0) + 1
				);
		}

		private void Update(byte[] input, int inputIndex, int inputCount)
		{
			// Compute  bytesInBuffer
			int bytesInBuffer = BytesInBuffer;
			int bytesFreeInBuffer = BufSize - bytesInBuffer;
			//Update number of bytes
			Count += (ulong)inputCount;
			// (1) if data in the buffer, try to append it and do one transformation 
			if (bytesInBuffer > 0)
			{
				/* if inputCount < bytesFreeInBuffer
				 *		they will be appended in step (3)
				 *		step (2) will not be executed
				 */
				if (inputCount >= bytesFreeInBuffer)
				{
					// append
					Array.Copy(input, inputIndex, Buffer, bytesInBuffer, bytesFreeInBuffer);
					inputIndex += bytesFreeInBuffer;
					inputCount -= bytesFreeInBuffer;

					Transform(Buffer, 0);
					bytesInBuffer = 0;
				}
			}
			// (2) 
			for (int i = inputCount >> BufShiftBits; --i >= 0; )
			{
				Transform(input, inputIndex);
				inputIndex += BufSize;
				inputCount -= BufSize;
			}
			// (3) buffer remaining output
			if (inputCount > 0)
			{
				Array.Copy(input, inputIndex, Buffer, bytesInBuffer, inputCount);
			}
		}

		private byte[] Final()
		{
			int bytesInBuffer = BytesInBuffer; // before we update Count
			byte[] bits = new byte[8];

			/* Save number of bits */
			UInt64 count = Count << 3; // # bits

			Encode((UInt32)(count), bits, 0);
			Encode((UInt32)(count >> 32), bits, 4);

			// Pad out to 56 mod 64.
			int padLen = (bytesInBuffer < 56) ? (56 - bytesInBuffer) : (120 - bytesInBuffer);
			Update(Padding, 0, padLen);

			//  Append length (before padding)
			Update(bits, 0, 8);

			// Store state in digest
			byte[] digest = new byte[16];

			Encode(State0, digest, 0);
			Encode(State1, digest, 4);
			Encode(State2, digest, 8);
			Encode(State3, digest, 12);

			return digest;
		}

		private UInt32 F(UInt32 x, UInt32 y, UInt32 z)
		{
			return (((x) & (y)) | ((~x) & (z)));
		}

		private UInt32 G(UInt32 x, UInt32 y, UInt32 z)
		{
			return (((x) & (z)) | ((y) & (~z)));
		}

		private UInt32 H(UInt32 x, UInt32 y, UInt32 z)
		{
			return ((x) ^ (y) ^ (z));
		}

		private UInt32 I(UInt32 x, UInt32 y, UInt32 z)
		{
			return ((y) ^ ((x) | (~z)));
		}

		private void FF(ref UInt32 a, UInt32 b, UInt32 c,
							UInt32 d, UInt32 x, SS s, UInt32 ac
						)
		{
			unchecked
			{
				a += F(b, c, d) + x + ac;
				a = BitRotate.RotateLeft(a, (int)s);
				a += b;
			}
		}

		private void GG(ref UInt32 a, UInt32 b, UInt32 c,
							UInt32 d, UInt32 x, SS s, UInt32 ac
						)
		{
			unchecked
			{
				a += G(b, c, d) + x + ac;
				a = BitRotate.RotateLeft(a, (int)s);
				a += b;
			}
		}

		private void HH(ref UInt32 a, UInt32 b, UInt32 c,
							UInt32 d, UInt32 x, SS s, UInt32 ac
						)
		{
			unchecked
			{
				a += H(b, c, d) + x + ac;
				a = BitRotate.RotateLeft(a, (int)s);
				a += b;
			}
		}

		private void II(ref UInt32 a, UInt32 b, UInt32 c,
							UInt32 d, UInt32 x, SS s, UInt32 ac
						)
		{
			unchecked
			{
				a += I(b, c, d) + x + ac;
				a = BitRotate.RotateLeft(a, (int)s);
				a += b;
			}
		}

		private void Transform(byte[] input, int index)
		{
			UInt32 a = State0;
			UInt32 b = State1;
			UInt32 c = State2;
			UInt32 d = State3;
			UInt32[] x = new UInt32[16];

			Decode(x, input, index, 16);

			/* Round 1 */
			FF(ref a, b, c, d, x[0], SS.S11, 0xd76aa478); /* 1 */
			FF(ref d, a, b, c, x[1], SS.S12, 0xe8c7b756); /* 2 */
			FF(ref c, d, a, b, x[2], SS.S13, 0x242070db); /* 3 */
			FF(ref b, c, d, a, x[3], SS.S14, 0xc1bdceee); /* 4 */
			FF(ref a, b, c, d, x[4], SS.S11, 0xf57c0faf); /* 5 */
			FF(ref d, a, b, c, x[5], SS.S12, 0x4787c62a); /* 6 */
			FF(ref c, d, a, b, x[6], SS.S13, 0xa8304613); /* 7 */
			FF(ref b, c, d, a, x[7], SS.S14, 0xfd469501); /* 8 */
			FF(ref a, b, c, d, x[8], SS.S11, 0x698098d8); /* 9 */
			FF(ref d, a, b, c, x[9], SS.S12, 0x8b44f7af); /* 10 */
			FF(ref c, d, a, b, x[10], SS.S13, 0xffff5bb1); /* 11 */
			FF(ref b, c, d, a, x[11], SS.S14, 0x895cd7be); /* 12 */
			FF(ref a, b, c, d, x[12], SS.S11, 0x6b901122); /* 13 */
			FF(ref d, a, b, c, x[13], SS.S12, 0xfd987193); /* 14 */
			FF(ref c, d, a, b, x[14], SS.S13, 0xa679438e); /* 15 */
			FF(ref b, c, d, a, x[15], SS.S14, 0x49b40821); /* 16 */

			/* Round 2 */
			GG(ref a, b, c, d, x[1], SS.S21, 0xf61e2562); /* 17 */
			GG(ref d, a, b, c, x[6], SS.S22, 0xc040b340); /* 18 */
			GG(ref c, d, a, b, x[11], SS.S23, 0x265e5a51); /* 19 */
			GG(ref b, c, d, a, x[0], SS.S24, 0xe9b6c7aa); /* 20 */
			GG(ref a, b, c, d, x[5], SS.S21, 0xd62f105d); /* 21 */
			GG(ref d, a, b, c, x[10], SS.S22, 0x2441453); /* 22 */
			GG(ref c, d, a, b, x[15], SS.S23, 0xd8a1e681); /* 23 */
			GG(ref b, c, d, a, x[4], SS.S24, 0xe7d3fbc8); /* 24 */
			GG(ref a, b, c, d, x[9], SS.S21, 0x21e1cde6); /* 25 */
			GG(ref d, a, b, c, x[14], SS.S22, 0xc33707d6); /* 26 */
			GG(ref c, d, a, b, x[3], SS.S23, 0xf4d50d87); /* 27 */
			GG(ref b, c, d, a, x[8], SS.S24, 0x455a14ed); /* 28 */
			GG(ref a, b, c, d, x[13], SS.S21, 0xa9e3e905); /* 29 */
			GG(ref d, a, b, c, x[2], SS.S22, 0xfcefa3f8); /* 30 */
			GG(ref c, d, a, b, x[7], SS.S23, 0x676f02d9); /* 31 */
			GG(ref b, c, d, a, x[12], SS.S24, 0x8d2a4c8a); /* 32 */

			/* Round 3 */
			HH(ref a, b, c, d, x[5], SS.S31, 0xfffa3942); /* 33 */
			HH(ref d, a, b, c, x[8], SS.S32, 0x8771f681); /* 34 */
			HH(ref c, d, a, b, x[11], SS.S33, 0x6d9d6122); /* 35 */
			HH(ref b, c, d, a, x[14], SS.S34, 0xfde5380c); /* 36 */
			HH(ref a, b, c, d, x[1], SS.S31, 0xa4beea44); /* 37 */
			HH(ref d, a, b, c, x[4], SS.S32, 0x4bdecfa9); /* 38 */
			HH(ref c, d, a, b, x[7], SS.S33, 0xf6bb4b60); /* 39 */
			HH(ref b, c, d, a, x[10], SS.S34, 0xbebfbc70); /* 40 */
			HH(ref a, b, c, d, x[13], SS.S31, 0x289b7ec6); /* 41 */
			HH(ref d, a, b, c, x[0], SS.S32, 0xeaa127fa); /* 42 */
			HH(ref c, d, a, b, x[3], SS.S33, 0xd4ef3085); /* 43 */
			HH(ref b, c, d, a, x[6], SS.S34, 0x4881d05); /* 44 */
			HH(ref a, b, c, d, x[9], SS.S31, 0xd9d4d039); /* 45 */
			HH(ref d, a, b, c, x[12], SS.S32, 0xe6db99e5); /* 46 */
			HH(ref c, d, a, b, x[15], SS.S33, 0x1fa27cf8); /* 47 */
			HH(ref b, c, d, a, x[2], SS.S34, 0xc4ac5665); /* 48 */

			/* Round 4 */
			II(ref a, b, c, d, x[0], SS.S41, 0xf4292244); /* 49 */
			II(ref d, a, b, c, x[7], SS.S42, 0x432aff97); /* 50 */
			II(ref c, d, a, b, x[14], SS.S43, 0xab9423a7); /* 51 */
			II(ref b, c, d, a, x[5], SS.S44, 0xfc93a039); /* 52 */
			II(ref a, b, c, d, x[12], SS.S41, 0x655b59c3); /* 53 */
			II(ref d, a, b, c, x[3], SS.S42, 0x8f0ccc92); /* 54 */
			II(ref c, d, a, b, x[10], SS.S43, 0xffeff47d); /* 55 */
			II(ref b, c, d, a, x[1], SS.S44, 0x85845dd1); /* 56 */
			II(ref a, b, c, d, x[8], SS.S41, 0x6fa87e4f); /* 57 */
			II(ref d, a, b, c, x[15], SS.S42, 0xfe2ce6e0); /* 58 */
			II(ref c, d, a, b, x[6], SS.S43, 0xa3014314); /* 59 */
			II(ref b, c, d, a, x[13], SS.S44, 0x4e0811a1); /* 60 */
			II(ref a, b, c, d, x[4], SS.S41, 0xf7537e82); /* 61 */
			II(ref d, a, b, c, x[11], SS.S42, 0xbd3af235); /* 62 */
			II(ref c, d, a, b, x[2], SS.S43, 0x2ad7d2bb); /* 63 */
			II(ref b, c, d, a, x[9], SS.S44, 0xeb86d391); /* 64 */

			unchecked
			{
				State0 += a;
				State1 += b;
				State2 += c;
				State3 += d;
			}
		}

		private void Decode(UInt32[] output, byte[] input, int inputIndex, uint count)
		{
			for (int i = -1; ++i < count; )
			{
				output[i] =
						(UInt32)input[inputIndex++]
					| ((UInt32)input[inputIndex++] << 8)
					| ((UInt32)input[inputIndex++] << 16)
					| ((UInt32)input[inputIndex++] << 24);
			}
		}

		private void Encode(UInt32 input, byte[] output, int outputIndex)
		{
			output[outputIndex++] = (byte)(input & 0xff);
			output[outputIndex++] = (byte)((input >> 8) & 0xff);
			output[outputIndex++] = (byte)((input >> 16) & 0xff);
			output[outputIndex++] = (byte)((input >> 24) & 0xff);
		}
	}

	private static class BitRotate
	{
		public static UInt32 RotateLeft(UInt32 x, int nBits)
		{
			nBits &= 0x1f;

			return (x << nBits) | (x >> (32 - nBits));
		}
	}
	
</script>
