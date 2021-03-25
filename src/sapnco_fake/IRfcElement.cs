using System;

namespace SAP.Middleware.Connector
{
  public interface IRfcElement
  {
    IRfcElement Clone();

    void SetValue(byte value);

    void SetValue(byte[] value);

    void SetValue(byte[] value, int offset, int len);

    void SetValue(char value);

    void SetValue(char[] value);

    void SetValue(short value);

    void SetValue(int value);

    void SetValue(long value);

    void SetValue(float value);

    void SetValue(double value);

    void SetValue(Decimal value);

    void SetValue(string value);

    void SetValue(object value);

    byte GetByte();

    byte[] GetByteArray();

    void GetByteArray(byte[] target, int offset);

    char GetChar();

    char[] GetCharArray();

    short GetShort();

    int GetInt();

    long GetLong();

    float GetFloat();

    double GetDouble();

    Decimal GetDecimal();

    string GetString();

    object GetObject();

    object GetValue();
  }
}
