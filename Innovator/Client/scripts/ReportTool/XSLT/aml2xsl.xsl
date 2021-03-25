<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  version="1.0">
  
  <xsl:template match="/">
    <xsl:apply-templates select="//Item[@type='Has Tag']/related_id/Item[@type='Tag']"/>
  </xsl:template>

  <xsl:template match="Item">
    <xsl:element name="{name}">
      <xsl:value-of select="value"/>
      <xsl:apply-templates select="Relationships/Item[@type='Nested Tag']/related_id/Item[@type='Tag']"/>
    </xsl:element>
  </xsl:template>

</xsl:stylesheet>