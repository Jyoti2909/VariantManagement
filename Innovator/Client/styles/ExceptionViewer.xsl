<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="html" indent="yes" encoding="ASCII"></xsl:output>
  
  <xsl:template match="/">
    <html>
      <head>
      <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
      <style type="text/css">
      .function0{
        background-color:cccccc;
      }
      .function1{
        background-color:eeeeee;
      }
      
      .h1 {
        font-size:150%;
      }

      .h2 {
        font-size:120%;
      }
      
      pre {
        float:left;
      }
      </style>
      </head>
      
      <body>
      <xsl:apply-templates select="Exception" />
      </body>
    </html>
  </xsl:template>
  
  <xsl:template match="Exception">
    <table cellpadding="0" cellspacing="0" width="100%">
      <tr><td colspan="2" class="h1">Exception&#160;<input type="button" value="Copy exception description" onclick="window.clipboardData.setData('Text', dialogArguments.xmlDesc);" /></td></tr>
      <tr><td class="h2">Number</td><td width="100%">&#160;<xsl:value-of select="number"/></td></tr>
      <tr><td class="h2">Message</td><td valign="top"><pre><xsl:value-of select="message"/></pre></td></tr>
      <xsl:apply-templates select="call_stack"></xsl:apply-templates>
    </table>
  </xsl:template>

  <xsl:template match="call_stack">
    <tr><td valign="top">Call stack</td><td>
      <table style="display:block;" id="CallStackInfo" width="100%" cellpadding="0" cellspacing="0">
      <xsl:apply-templates select="function">
        <xsl:sort select="@order"/>
      </xsl:apply-templates>
      </table>
    </td></tr>
  </xsl:template>
  
  <xsl:template match="function">
    <tr><td>
      <table border="1" width="100%" cellpadding="0" cellspacing="0">
        <xsl:attribute name="class">function<xsl:value-of select="@order mod 2" /></xsl:attribute>
        <tr><td>Function&#160;name</td><td width="100%"><xsl:value-of select="@name"/></td></tr>
        <xsl:apply-templates select="call_arguments" />
        <tr><td>Function&#160;body</td><td><pre><xsl:value-of select="body"/></pre></td></tr>
      </table>
    </td></tr>
  </xsl:template>
  
  <xsl:template match="call_arguments">
    <tr><td>Call&#160;arguments</td><td>
      <table border="1" style="display:block;" id="CallArgumentsInfo" width="100%" cellpadding="0" cellspacing="0">
        <xsl:apply-templates select="argument">
          <xsl:sort select="@order" />
        </xsl:apply-templates>
      </table>
    </td></tr>
  </xsl:template>
  
  
  <xsl:template match="argument">
    <tr><td><pre>arg&#160;#<xsl:value-of select="@order"/></pre></td><td width="100%"><pre><xsl:value-of select="." /></pre></td></tr>
  </xsl:template>
  
</xsl:stylesheet>
