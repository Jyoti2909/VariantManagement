<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  version="1.0">
  
  <xsl:output cdata-section-elements="cdata"/>
  
  <xsl:template match="/">
    <Item type="Tag Document" action="add">
      <name/>
      <description/>      
      <Relationships>
        <xsl:apply-templates select="*">
          <xsl:with-param name="type" select="'Has Tag'"/>
        </xsl:apply-templates>
      </Relationships>
    </Item>
  </xsl:template>
  
  <xsl:template match="node()">
    <xsl:param name="type"/>
    <Item action="add">
      <xsl:attribute name="type"><xsl:value-of select="$type"/></xsl:attribute>
      <related_id>
        <Item type="Tag" action="add">
          <name><xsl:value-of select="name()"/></name>
          <!--
          <xsl:choose>
            <xsl:when test="name()='xsl:template' and @match!='/'">
              <cdata>got here</cdata>
            </xsl:when>
            <xsl:otherwise>
            -->
          <Relationships>
            <xsl:call-template name="attributes"><xsl:with-param name="attrs" select="@*"/></xsl:call-template>
            <xsl:apply-templates select="*">
              <xsl:with-param name="type" select="'Nested Tag'"/>
            </xsl:apply-templates>
          </Relationships>
          <!--
            </xsl:otherwise>
          </xsl:choose>
          -->
        </Item>
      </related_id>
    </Item>
  </xsl:template>
  
  <xsl:template name="attributes">
    <xsl:param name="attrs"/>
    <xsl:for-each select="$attrs">
      <Item type="Attribute" action="add">
        <name><xsl:value-of select="name()"/></name>
        <value><xsl:value-of select="."/></value>
      </Item>
    </xsl:for-each>
  </xsl:template>

</xsl:stylesheet>