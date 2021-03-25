echo "`nAdd firewall rule for ES cluster..."
Netsh.exe advfirewall firewall add rule name="ES cluster 8081" dir=in localip=any remoteip=any protocol=tcp localport=8081 interfacetype=any enable=yes action=allow profile=any;

echo "`nAdd firewall rule for SOLR..."
Netsh.exe advfirewall firewall add rule name="SOLR port 8983" dir=in localip=any remoteip=any protocol=tcp localport=8983 interfacetype=any enable=yes action=allow profile=any;
