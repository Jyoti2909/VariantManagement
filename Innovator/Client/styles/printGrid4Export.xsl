<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:msxsl="urn:schemas-microsoft-com:xslt" xmlns:regexp="http://exslt.org/regular-expressions" xmlns:aras="http://ww.aras-corp.com" xmlns:usr="urn:the-xml-files:xslt" version="1.0">
	<xsl:output method="html" omit-xml-declaration="yes" standalone="yes" indent="yes"/>
	<xsl:variable name="font" select="//table/@font"/>

	<msxsl:script language="JScript" implements-prefix="usr"><![CDATA[
		var blankImgSrc = '../imagesLegacy/1x1.gif';
		function getImgSrc(imgHTML) {
			if (imgHTML.length != 1) return '';
			imgHTML = imgHTML[0].text;
			var imgSrc = '';
			if (imgHTML.search(/<img +src="/)==0) {
				imgSrc = imgHTML.substring(imgHTML.indexOf('"')+1, imgHTML.lastIndexOf('"'));
			}
			else {
				imgSrc = imgHTML.substring(imgHTML.indexOf("'")+1, imgHTML.lastIndexOf("'"));
			}
			//<img=...>
			if (imgHTML.search(/<img\s*=/) == 0) {
				imgSrc = imgHTML.substring(imgHTML.indexOf("=")+1, imgHTML.lastIndexOf(">"));
			}
			return (imgSrc == '') ? blankImgSrc : imgSrc;
		}
	]]></msxsl:script>
	<xsl:template match="/">
		<html>
			<head>
				<meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
				<title>Exported HTML</title>
				<base>
					<xsl:attribute name="href">
						<xsl:value-of select="//table/@base_href"/>
					</xsl:attribute>
				</base>
				<style type="text/css">
					<xsl:comment>
						table {
							<xsl:if test="$font">
								font-family:<xsl:value-of select="$font"/>;
							</xsl:if>
							border-width: 1px;
							border-style: solid none none solid;
							table-layout:fixed;
						}
						th {
							background-color: #EEEEEE;
							font-size: 9pt;
							font-family: <xsl:if test="$font">
								font-family:<xsl:value-of select="$font"/>,
							</xsl:if>arial, helvetica, sans-serif;
							border-width: 0px 1px 3px 0px;
							border-style: none solid solid none;
							border-color: #000000;
						}
						td {
							background-color: #FFFFFF;
							font-size: 8pt;
							font-family: <xsl:if test="$font">
								font-family:<xsl:value-of select="$font"/>,
							</xsl:if>arial, helvetica, sans-serif;
							border-width: 1px;
							border-style: none solid solid none;
							border-color: #000000;
							mso-number-format:General; vertical-align:top;
						}
						pre {
							white-space:normal; 
							word-wrap:break-word;
						}
						br {
							mso-data-placement:same-cell;
						}
					</xsl:comment>
				</style>
			</head>
			<body topmargin="0" leftmargin="0">
				<xsl:apply-templates select="//table"/>
			</body>
		</html>
	</xsl:template>
	<xsl:template match="table">
		<xsl:variable name="first_col_title" select="./thead/th[position()=1]/text()"/>
		<xsl:variable name="lock_col_id" >
			<xsl:choose>
				<xsl:when test="not($first_col_title) or $first_col_title=''">
					<xsl:value-of select="./columns/column[position()=1]/@order"/>
				</xsl:when>
				<xsl:otherwise>
					-1
				</xsl:otherwise>
			</xsl:choose>
		</xsl:variable>
		<table id="contentTable" align="center" cellpadding="0" border="1" cellspacing="0">
			<xsl:apply-templates select="thead">
				<xsl:with-param name="hideId">
					<xsl:value-of select="$lock_col_id"/>
				</xsl:with-param>
			</xsl:apply-templates>
			<xsl:apply-templates select="tr">
				<xsl:with-param name="hideId">
					<xsl:value-of select="$lock_col_id"/>
				</xsl:with-param>
			</xsl:apply-templates>
		</table>
	</xsl:template>
	<xsl:template match="thead">
		<xsl:param name="hideId">-1</xsl:param>
		<xsl:for-each select="th">
			<xsl:sort order="ascending" data-type="number" select="position()"/>
			<xsl:if test="position() != $hideId">
				<col>
					<xsl:attribute name="id">
						<xsl:value-of select="position()"/>
					</xsl:attribute>
				</col>
			</xsl:if>
		</xsl:for-each>
		<xsl:apply-templates select="th">
			<xsl:with-param name="hideId">
				<xsl:value-of select="$hideId"/>
			</xsl:with-param>
		</xsl:apply-templates>
	</xsl:template>
	<xsl:template match="th">
		<xsl:param name="hideId">-1</xsl:param>
		<xsl:variable name="blank" select="'&#160;'"/>
		<xsl:variable name="pos" select="position()"/>
		<xsl:variable name="targetOrder" select="position()-1"/>
		<xsl:variable name="curSeqColumnPos" select="count(/table/columns/column[@order=$targetOrder]/preceding-sibling::*)+1" />
		<xsl:variable name="curTh" select="../th[position()=$curSeqColumnPos]" />
		<xsl:if test="$pos - 1 != $hideId">
			<th>
				<xsl:attribute name="id">
					<xsl:value-of select="$pos - 1"/>
				</xsl:attribute>
				<xsl:attribute name="style">
					background-color:<xsl:value-of select="$curTh/@bgColor"/>;
				</xsl:attribute>
				<xsl:attribute name="align">
					<xsl:choose>
						<xsl:when test="$curTh/@align='l'">left</xsl:when>
						<xsl:when test="$curTh/@align='r'">right</xsl:when>
						<xsl:when test="$curTh/@align='c'">center</xsl:when>
					</xsl:choose>
				</xsl:attribute>
				<xsl:value-of select="$curTh"/>
				<xsl:value-of select="$blank"/>
			</th>
		</xsl:if>
	</xsl:template>
	<xsl:template match="tr">
		<xsl:param name="hideId">-1</xsl:param>
		<tr>
			<xsl:apply-templates select="td">
				<xsl:with-param name="hideId">
					<xsl:value-of select="$hideId"/>
				</xsl:with-param>
			</xsl:apply-templates>
		</tr>
	</xsl:template>
	<xsl:template match="td">
		<xsl:param name="hideId">-1</xsl:param>
		<xsl:variable name="blank" select="'&#160;'"/>
		<xsl:if test="position()-1 != $hideId">
			<td nowrap="1">
				<xsl:attribute name="id">
					<xsl:value-of select="position()-1"/>
				</xsl:attribute>
				<xsl:variable name="targetOrder" select="position()-1"/>
				<xsl:variable name="curSeqColumnPos">
					<xsl:choose>
						<xsl:when test="count(/table/columns/*) > 0">
							<xsl:value-of select="count(/table/columns/column[@order=$targetOrder]/preceding-sibling::*)+1"/>
						</xsl:when>
						<xsl:otherwise>
							<xsl:value-of select="position()"/>
						</xsl:otherwise>
					</xsl:choose>
				</xsl:variable>
				<xsl:variable name="curTd" select="../td[position()=$curSeqColumnPos]" />
				<xsl:variable name="align">
					<xsl:value-of select="/table/columns/column[@order=$targetOrder]/@align"/>
				</xsl:variable>
				<xsl:attribute name="align">
					<xsl:choose>
						<xsl:when test="$align='l'">left</xsl:when>
						<xsl:when test="$align='r'">right</xsl:when>
						<xsl:when test="$align='c'">center</xsl:when>
					</xsl:choose>
				</xsl:attribute>
				<xsl:attribute name="style">
					background-color:<xsl:value-of select="$curTd/@bgColor"/>;
				</xsl:attribute>
				<pre>
					<xsl:choose>
						<xsl:when test="$curTd='&lt;checkbox state=&quot;0&quot;/&gt;'">No</xsl:when>
						<xsl:when test="$curTd='&lt;checkbox state=&quot;1&quot;/&gt;'">Yes</xsl:when>
						<xsl:otherwise>
							<xsl:if test="not(starts-with($curTd, '&lt;img'))">
								<xsl:value-of select="$curTd" />
							</xsl:if>
							<xsl:if test="starts-with($curTd,'&lt;img')">
								<img>
								<xsl:choose>
									<xsl:when test="function-available('regexp:match')">
										<xsl:variable name="singleQuot"  select='"&apos;"' />
										<xsl:variable name="imgRegExp" select="concat(concat('&lt;img.+?src\s*=\s*[&quot;', $singleQuot), concat(concat('](.*?)[&quot;',$singleQuot),'].+?&gt;'))" />
										<xsl:for-each select="regexp:match($curTd/text(), $imgRegExp, '')">
											<xsl:if test="position()=last()">
												<xsl:attribute name="src">
													<xsl:choose>
														<xsl:when test=".!= ''">
															<xsl:value-of select="." />
														</xsl:when>
														<xsl:otherwise>../imagesLegacy/1x1.gif</xsl:otherwise>
													</xsl:choose>
												</xsl:attribute>
											</xsl:if>
										</xsl:for-each>
									</xsl:when>
									<xsl:when test="function-available('usr:getImgSrc')">
										<xsl:attribute name="src"><xsl:value-of select="usr:getImgSrc($curTd)"/></xsl:attribute>
									</xsl:when>
									<xsl:otherwise>
										<xsl:variable name="quotedUrl" select="substring-after(substring-before($curTd, '/>'), 'src=')" />
										<xsl:attribute name="src"><xsl:value-of select="substring($quotedUrl, 2, string-length($quotedUrl) - 2)"/></xsl:attribute>
									</xsl:otherwise>
								</xsl:choose>
								</img>
							</xsl:if>
						</xsl:otherwise>
					</xsl:choose>
				</pre>
			</td>
		</xsl:if>
	</xsl:template>
</xsl:stylesheet>
