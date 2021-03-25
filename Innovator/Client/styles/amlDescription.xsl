<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
	xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

	<xsl:output encoding="utf-8" method="xml" indent="no" omit-xml-declaration="yes" />

	<xsl:param name="expandNodes" select="boolean('true')"></xsl:param>

	<xsl:template match="/">
		<div class="aml-description">
			<xsl:apply-templates />
		</div>
	</xsl:template>

	<xsl:template match="processing-instruction()">
		<div class="aml-description__tag-block">
			<span class="aml-description__plus-or-minus">&#160;</span>
			<span class="aml-description__special-character">&lt;?<xsl:value-of select="name()" />&#160;<xsl:value-of select="." />?&gt;</span>
		</div>
	</xsl:template>

	<xsl:template match="@*" xml:space="preserve">
		<span><xsl:attribute name="class"><xsl:if test="starts-with(name(),&#39;xsl:&#39;)">x</xsl:if>aml-description__tag-name</xsl:attribute><xsl:value-of select="name()" /></span>
		<span class="aml-description__special-character">=&quot;</span>
		<b><xsl:value-of select="." /></b>
		<span class="aml-description__special-character">&quot;</span>
	</xsl:template>

	<xsl:template match="text()">
		<div class="aml-description__tag-block">
			<span class="aml-description__plus-or-minus">&#160;</span>
			<b><xsl:value-of select="." /></b>
		</div>
	</xsl:template>

	<xsl:template match="comment()">
		<div class="aml-description__tag-block aml-description__tag-block_comment">
			<span><a class="aml-description__plus-or-minus">-</a><span class="aml-description__special-character">&lt;!--</span></span>
			<span class="aml-description__pre"><xsl:value-of select="." /></span>
			<span class="aml-description__plus-or-minus">&#160;</span>
			<span class="aml-description__special-character">--&gt;</span>
		</div>
	</xsl:template>

	<xsl:template match="*">
		<div class="aml-description__tag-block">
			<span class="aml-description__plus-or-minus">&#160;</span>
			<span class="aml-description__special-character">&lt;</span>
			<span><xsl:attribute name="class"><xsl:if test="starts-with(name(),&#39;xsl:&#39;)">x</xsl:if>aml-description__tag-name</xsl:attribute><xsl:value-of select="name()" /></span>
			<xsl:apply-templates select="@*" />
			<span class="aml-description__special-character">/&gt;</span>
		</div>
	</xsl:template>

	<xsl:template match="*[comment() | processing-instruction()]">
		<div class="aml-description__tag-block">
			<div class="aml-description__clicable-row"><a class="aml-description__plus-or-minus">-</a><span class="aml-description__special-character">&lt;</span><span><xsl:attribute name="class"><xsl:if test="starts-with(name(),&#39;xsl:&#39;)">x</xsl:if>aml-description__tag-name</xsl:attribute><xsl:value-of select="name()" /></span><xsl:apply-templates select="@*" /><span class="aml-description__special-character">&gt;</span></div>
			<div><xsl:apply-templates /><div><span class="aml-description__plus-or-minus">&#160;</span><span class="aml-description__special-character">&lt;/</span><span><xsl:attribute name="class"><xsl:if test="starts-with(name(),&#39;xsl:&#39;)">x</xsl:if>aml-description__tag-name</xsl:attribute><xsl:value-of select="name()" /></span><span class="aml-description__special-character">&gt;</span></div></div>
		</div>
	</xsl:template>

	<xsl:template match="*[text() and not(comment()|processing-instruction())]">
		<div class="aml-description__tag-block">
			<span class="aml-description__plus-or-minus">&#160;</span>
			<span class="aml-description__special-character">&lt;</span>
			<span><xsl:attribute name="class"><xsl:if test="starts-with(name(),&#39;xsl:&#39;)">x</xsl:if>aml-description__tag-name</xsl:attribute><xsl:value-of select="name()" /></span>
			<xsl:apply-templates select="@*" />
			<span class="aml-description__special-character">&gt;</span>
			<b><xsl:value-of select="." /></b>
			<span class="aml-description__special-character">&lt;/</span>
			<span><xsl:attribute name="class"><xsl:if test="starts-with(name(),&#39;xsl:&#39;)">x</xsl:if>aml-description__tag-name</xsl:attribute><xsl:value-of select="name()" /></span>
			<span class="aml-description__special-character">&gt;</span>
		</div>
	</xsl:template>

	<xsl:template match="*[*]">
		<div class="aml-description__tag-block">
			<div class="aml-description__clicable-row"><a class="aml-description__plus-or-minus"><xsl:if test="$expandNodes">-</xsl:if><xsl:if test="not($expandNodes)">+</xsl:if></a><span class="aml-description__special-character">&lt;</span><span><xsl:attribute name="class"><xsl:if test="starts-with(name(),&#39;xsl:&#39;)">x</xsl:if>aml-description__tag-name</xsl:attribute><xsl:value-of select="name()" /></span><xsl:apply-templates select="@*" /><span class="aml-description__special-character">&gt;</span></div>
			<div><xsl:if test="not($expandNodes)"><xsl:attribute name="style">display:none;</xsl:attribute></xsl:if><xsl:apply-templates /><div><span class="aml-description__plus-or-minus">&#160;</span><span class="aml-description__special-character">&lt;/</span><span><xsl:attribute name="class"><xsl:if test="starts-with(name(),&#39;xsl:&#39;)">x</xsl:if>aml-description__tag-name</xsl:attribute><xsl:value-of select="name()" /></span><span class="aml-description__special-character">&gt;</span></div></div>
		</div>
	</xsl:template>
</xsl:stylesheet>
