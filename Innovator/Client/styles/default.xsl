<?xml version="1.0" encoding="UTF-8"?>

<xsl:stylesheet version="1.0"
xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
xmlns="http://www.w3.org/1999/xhtml"
xmlns:dt="urn:schemas-microsoft-com:datatypes"
xmlns:d2="uuid:C2F41010-65B3-11d1-A29F-00AA00C14882">
	<xsl:output method="html" indent="yes" encoding="utf-8"/>
	<xsl:param name="expandNodes" select="boolean('false')"></xsl:param>

<xsl:template match="/">
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
<style>BODY{font:x-small 'Verdana';margin-right:1.5em}
.c{cursor:pointer}
.b{color:red;font-family:'Courier New';font-weight:bold;text-decoration:none}
.e{margin-left:1em;text-indent:-1em;margin-right:1em}
.k{margin-left:1em;text-indent:-1em;margin-right:1em}
.t{color:#990000}
.xt{color:#990099}
.ns{color:red}
.dt{color:green}
.m{color:blue}
.tx{font-weight:bold}
.db{text-indent:0px;margin-left:1em;margin-top:0px;margin-bottom:0px;padding-left:.3em;border-left:1px solid #CCCCCC;font:small Courier}
.di{font:small Courier}
.d{color:blue}
.pi{color:blue}
.cb{text-indent:0px;margin-left:1em;margin-top:0px;margin-bottom:0px;padding-left:.3em;font:small Courier;color:#888888}
.ci{font:small Courier;color:#888888}
PRE{margin:0px;display:inline}</style>
<xsl:comment>
	<script>
function f(e) {
	if (e.className == "ci" &amp;&amp; e.childNodes[0].innerHTML.indexOf("\n") &gt; 0) {
		fix(e,"cb");
	}
	else if (e.className == "di" &amp;&amp; e.childNodes[0].innerHTML.indexOf("\n") &gt; 0) {
		fix(e,"db");
	}
	e.id = "";
}

function fix(e,cl) {
	e.className = cl;
	e.style.display = "block";
	var j = e.parentElement.childNodes[0];
	j.className = "c";
	var k = j.childNodes[0];
	k.style.visibility = "visible";
	k.href = "#";
}

function ch(e) {
	var mark = e.childNodes[0].childNodes[0];
	if(!mark)
		return;
	if (mark.innerHTML == "+") {
		mark.innerHTML = "-";
		for (var i=1; i &lt; e.childNodes.length; i++)
			e.childNodes[i].style.display="block";
	}
	else if (mark.innerHTML == "-") {
		mark.innerHTML="+";
		for (var i = 1; i &lt; e.childNodes.length; i++)
			e.childNodes[i].style.display="none";
	}
}

function ch2(e) {
	var mark = e.childNodes[0].childNodes[0];
	var contents = e.childNodes[1];
	if (mark.innerHTML == "+") {
		mark.innerHTML = "-";
		if (contents.className=="db" || contents.className=="cb")
			contents.style.display="block";
		else contents.style.display="inline";
	}
	else if (mark.innerHTML == "-") {
		mark.innerHTML = "+";
		contents.style.display = "none";
	}
}

function cl(event) {
	var e = window.event ? window.event.srcElement : event.target;
	if(!e)
		return;
	if (e.className != "c") {
		e = e.parentElement;
		if (e.className != "c")
			return;
	}
	e = e.parentElement;
	if (e.className == "e") ch(e);
	if (e.className == "k") ch2(e);
}

function ex(){}
function h(){window.status=" ";}
document.onclick = cl;
	</script>
</xsl:comment>
</head>

<body><xsl:apply-templates /></body>
</html>
</xsl:template>

<xsl:template match="processing-instruction()">
<DIV class="e">
	<SPAN class="b">&#160;</SPAN>
	<SPAN class="m">&lt;?</SPAN>
	<SPAN class="pi"><xsl:value-of select="name()" />&#160;<xsl:value-of select="." /></SPAN>
	<SPAN class="m">?&gt;</SPAN>
</DIV>
</xsl:template>

<xsl:template match="@*" xml:space="preserve">
	<SPAN><xsl:attribute name="class"><xsl:if test="starts-with(name(),&#39;xsl:&#39;)">x</xsl:if>t</xsl:attribute><xsl:value-of select="name()" /></SPAN>
	<SPAN class="m">=&quot;</SPAN>
	<B><xsl:value-of select="." /></B>
	<SPAN class="m">&quot;</SPAN>
</xsl:template>

<xsl:template match="text()">
<DIV class="e">
	<SPAN class="b">&#160;</SPAN>
	<SPAN class="tx"><xsl:value-of select="." /></SPAN>
</DIV>
</xsl:template>

<xsl:template match="comment()">
<DIV class="k">
	<SPAN><A class="b" onclick="return false" onfocus="h()" STYLE="visibility:hidden">-</A><SPAN class="m">&lt;!--</SPAN></SPAN>
	<SPAN id="clean" class="ci"><PRE><xsl:value-of select="." /></PRE></SPAN>
	<SPAN class="b">&#160;</SPAN>
	<SPAN class="m">--&gt;</SPAN>
	<SCRIPT>f(clean);</SCRIPT>
</DIV>
</xsl:template>

<xsl:template match="*">
<DIV class="e">
	<DIV STYLE="margin-left:1em;text-indent:-2em">
	<SPAN class="b">&#160;</SPAN>
	<SPAN class="m">&lt;</SPAN>
	<SPAN><xsl:attribute name="class"><xsl:if test="starts-with(name(),&#39;xsl:&#39;)">x</xsl:if>t</xsl:attribute><xsl:value-of select="name()" /></SPAN>
	<xsl:apply-templates select="@*" />
	<SPAN class="m">/&gt;</SPAN>
	</DIV>
</DIV>
</xsl:template>

<xsl:template match="*[comment() | processing-instruction()]">
<DIV class="e">
	<DIV class="c"><A href="#" onclick="return false" onfocus="h()" class="b">-</A><SPAN class="m">&lt;</SPAN><SPAN><xsl:attribute name="class"><xsl:if test="starts-with(name(),&#39;xsl:&#39;)">x</xsl:if>t</xsl:attribute><xsl:value-of select="name()" /></SPAN><xsl:apply-templates select="@*" /><SPAN class="m">&gt;</SPAN></DIV>
	<DIV><xsl:apply-templates /><DIV><SPAN class="b">&#160;</SPAN><SPAN class="m">&lt;/</SPAN><SPAN><xsl:attribute name="class"><xsl:if test="starts-with(name(),&#39;xsl:&#39;)">x</xsl:if>t</xsl:attribute><xsl:value-of select="name()" /></SPAN><SPAN class="m">&gt;</SPAN></DIV></DIV>
</DIV>
</xsl:template>

<xsl:template match="*[text() and not(comment()|processing-instruction())]">
<DIV class="e">
	<DIV STYLE="margin-left:1em;text-indent:-2em">
		<SPAN class="b">&#160;</SPAN>
		<SPAN class="m">&lt;</SPAN>
		<SPAN><xsl:attribute name="class"><xsl:if test="starts-with(name(),&#39;xsl:&#39;)">x</xsl:if>t</xsl:attribute><xsl:value-of select="name()" /></SPAN>
		<xsl:apply-templates select="@*" />
		<SPAN class="m">&gt;</SPAN>
		<SPAN class="tx"><xsl:value-of select="." /></SPAN>
		<SPAN class="m">&lt;/</SPAN>
		<SPAN><xsl:attribute name="class"><xsl:if test="starts-with(name(),&#39;xsl:&#39;)">x</xsl:if>t</xsl:attribute><xsl:value-of select="name()" /></SPAN>
		<SPAN class="m">&gt;</SPAN>
	</DIV>
</DIV>
</xsl:template>

<xsl:template match="*[*]">
<DIV class="e">
	<DIV class="c" STYLE="margin-left:1em;text-indent:-2em;"><A href="#" onclick="return false" onfocus="h()" class="b"><xsl:if test="$expandNodes">-</xsl:if><xsl:if test="not($expandNodes)">+</xsl:if></A><SPAN class="m">&lt;</SPAN><SPAN><xsl:attribute name="class"><xsl:if test="starts-with(name(),&#39;xsl:&#39;)">x</xsl:if>t</xsl:attribute><xsl:value-of select="name()" /></SPAN><xsl:apply-templates select="@*" /><SPAN class="m">&gt;</SPAN></DIV>
	<DIV><xsl:if test="not($expandNodes)"><xsl:attribute name="style">display:none;</xsl:attribute></xsl:if><xsl:apply-templates /><DIV><SPAN class="b">&#160;</SPAN><SPAN class="m">&lt;/</SPAN><SPAN><xsl:attribute name="class"><xsl:if test="starts-with(name(),&#39;xsl:&#39;)">x</xsl:if>t</xsl:attribute><xsl:value-of select="name()" /></SPAN><SPAN class="m">&gt;</SPAN></DIV></DIV>
</DIV>
</xsl:template>

</xsl:stylesheet>