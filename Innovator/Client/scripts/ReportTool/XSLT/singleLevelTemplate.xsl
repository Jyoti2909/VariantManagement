﻿<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  version="1.0">
  <xsl:output method="xml" omit-xml-declaration="yes" standalone="yes" indent="yes"/>
  <xsl:template match="/">
    <xsl:apply-templates/>
  </xsl:template>
  <xsl:template match="Item">
    <Item type="{@type}" id="{@id}" action="get" levels="1"/>
  </xsl:template>
</xsl:stylesheet>