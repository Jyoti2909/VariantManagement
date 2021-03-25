<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:aras="http://www.aras.com">

  <xsl:template name="aras:left-trim-string">
    <xsl:param name="value" />
    <xsl:param name="trim_char" select="' '"/>

    <xsl:variable name="output" select="substring-after($value,$trim_char)"/>
    <xsl:variable name="first_char" select="substring($output,1,1)"/>

    <xsl:choose>
      <xsl:when test="$first_char = $trim_char">
        <xsl:call-template name="aras:left-trim-string">
          <xsl:with-param name="value" select="$output"/>
          <xsl:with-param name="trim_char" select="$trim_char"/>
        </xsl:call-template>
      </xsl:when>
      <xsl:otherwise>
        <xsl:value-of select="$output"/>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template>

  <xsl:template name="aras:right-trim-string">
    <xsl:param name="value" />
    <xsl:param name="trim_char" select="' '"/>

    <xsl:variable name="length" select="string-length($value) - 1"/>
    <xsl:variable name="last_char" select="substring($value,$length,1)"/>

    <xsl:choose>
      <xsl:when test="$last_char = $trim_char">
        <xsl:variable name="length2" select="string-length($value) - 2"/>
        <xsl:variable name="output" select="substring($value,1,$length2)"/>
        <xsl:call-template name="aras:right-trim-string">
          <xsl:with-param name="value" select="$output"/>
          <xsl:with-param name="trim_char" select="$trim_char"/>
        </xsl:call-template>
      </xsl:when>
      <xsl:otherwise>
        <xsl:value-of select="$value"/>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template>

</xsl:stylesheet>
