<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:msxsl="urn:schemas-microsoft-com:xslt"
  xmlns:aras="http://www.aras.com"
  version="1.0">
    
  <xsl:output method="html" omit-xml-declaration="yes" standalone="yes" indent="yes"/>
  
  <xsl:template match="/">
    <html>
      <head>
      </head>
      <body topmargin="50" leftmargin="50">
        <table border="0" cellspacing="0" cellpadding="0" width="670">
          <xsl:for-each select="">
            <tr>
              <td style="font-family:helvetica; font-size:8pt; padding:2px;">Enter Value</td>
            </tr>
          </xsl:for-each>
        </table>
      </body>
    </html>
  </xsl:template>  
</xsl:stylesheet>