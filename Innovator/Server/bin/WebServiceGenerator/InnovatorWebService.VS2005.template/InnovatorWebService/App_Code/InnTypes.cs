using System;
using System.Globalization;

namespace Aras.Tools.WebServices
{
    public enum StdAction
    {
        Get,
        Add,
        Edit,
        Update,
        Delete,
        Lock,
        Unlock
    }

    public static class InnAction
    {
        public static string StdAction(StdAction action)
        {
            return action.ToString().ToLower(CultureInfo.InvariantCulture);
        }
    }

    /// <summary>
    /// Nullable int class wrapper
    /// </summary>
    public class NullableInt
    {
        private int value;

        /// <summary>
        /// Value
        /// </summary>
        public int Value
        {
            get { return this.value; }
            set { this.value = value; }
        }

        /// <summary>
        /// Initialize new instance of NullableInt type
        /// </summary>
        public NullableInt()
        {}

        /// <summary>
        /// Overloads NullableInt operator
        /// </summary>
        /// <param name="value">int</param>
        /// <returns>NullableInt</returns>
        public static explicit operator NullableInt(int value)
        {
            NullableInt n = new NullableInt();
            n.Value = value;
            return n;
        }
    }

    /// <summary>
    /// Nullable float class wrapper
    /// </summary>
    public class NullableFloat
    {
        private float value;

        /// <summary>
        /// Value
        /// </summary>
        public float Value
        {
            get { return this.value; }
            set { this.value = value; }
        }

        /// <summary>
        /// Initialize new instance of NullableInt type
        /// </summary>
        public NullableFloat()
        { }

        /// <summary>
        /// Overloads NullableFloat operator
        /// </summary>
        /// <param name="value">float</param>
        /// <returns>NullableFloat</returns>
        public static explicit operator NullableFloat(float value)
        {
            NullableFloat n = new NullableFloat();
            n.Value = value;
            return n;
        }
    }

    /// <summary>
    /// Nullable decimal class wrapper
    /// </summary>
    public class NullableDecimal
    {
        private decimal value;

        /// <summary>
        /// Value
        /// </summary>
        public decimal Value
        {
            get { return this.value; }
            set { this.value = value; }
        }

        /// <summary>
        /// Initialize new instance of NullableInt type
        /// </summary>
        public NullableDecimal()
        { }

        /// <summary>
        /// Overloads NullableDecimal operator
        /// </summary>
        /// <param name="value">decimal</param>
        /// <returns>NullableDecimal</returns>
        public static explicit operator NullableDecimal(decimal value)
        {
            NullableDecimal n = new NullableDecimal();
            n.Value = value;
            return n;
        }
    }

    /// <summary>
    /// Nullable bool class wrapper
    /// </summary>
    public class NullableBool
    {
        private bool value;

        /// <summary>
        /// Value
        /// </summary>
        public bool Value
        {
            get { return this.value; }
            set { this.value = value; }
        }

        /// <summary>
        /// Initialize new instance of NullableInt type
        /// </summary>
        public NullableBool()
        { }

        /// <summary>
        /// Overloads NullableBool operator
        /// </summary>
        /// <param name="value">bool</param>
        /// <returns>NullableBool</returns>
        public static explicit operator NullableBool(bool value)
        {
            NullableBool n = new NullableBool();
            n.Value = value;
            return n;
        }
    }

    /// <summary>
    /// Nullable DateTime class wrapper
    /// </summary>
    public class NullableDateTime
    {
        private DateTime value;

        /// <summary>
        /// Value
        /// </summary>
        public DateTime Value
        {
            get { return this.value; }
            set { this.value = value; }
        }

        /// <summary>
        /// Initialize new instance of NullableInt type
        /// </summary>
        public NullableDateTime()
        { }

        /// <summary>
        /// Overloads NullableDateTime operator
        /// </summary>
        /// <param name="value">DateTime</param>
        /// <returns>NullableDateTime</returns>
        public static explicit operator NullableDateTime(DateTime value)
        {
            NullableDateTime n = new NullableDateTime();
            n.Value = value;
            return n;
        }
    }
}