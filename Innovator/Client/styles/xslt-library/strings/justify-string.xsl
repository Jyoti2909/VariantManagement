<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:aras="http://www.aras.com">

  <xsl:include href="duplicate-string.xsl"/>

  <xsl:template name="aras:justify-string">
    <xsl:param name="value" /> 
    <xsl:param name="width" select="10"/>
    <xsl:param name="align" select=" 'left' "/>

    <xsl:variable name="output" select="substring($value,1,$width)"/>
  
    <xsl:choose>
      <xsl:when test="$align = 'left'">
        <xsl:value-of select="$output"/>
        <xsl:call-template name="aras:duplicate-string">
          <xsl:with-param name="input" select=" ' ' "/>
          <xsl:with-param name="count" select="$width - string-length($output)"/>
        </xsl:call-template>
      </xsl:when>
      <xsl:when test="$align = 'right'">
        <xsl:call-template name="aras:duplicate-string">
          <xsl:with-param name="input" select=" ' ' "/>
          <xsl:with-param name="count" select="$width - string-length($output)"/>
        </xsl:call-template>
        <xsl:value-of select="$output"/>
      </xsl:when>
      <xsl:when test="$align = 'center'">
        <xsl:call-template name="aras:duplicate-string">
          <xsl:with-param name="input" select=" ' ' "/>
          <xsl:with-param name="count" select="floor(($width - string-length($output)) div 2)"/>
        </xsl:call-template>
        <xsl:value-of select="$output"/>
        <xsl:call-template name="aras:duplicate-string">
          <xsl:with-param name="input" select=" ' ' "/>
          <xsl:with-param name="count" select="ceiling(($width - string-length($output)) div 2)"/>
        </xsl:call-template>
      </xsl:when>
      <xsl:otherwise>INVALID ALIGN</xsl:otherwise>
    </xsl:choose>
  </xsl:template>

</xsl:stylesheet>
