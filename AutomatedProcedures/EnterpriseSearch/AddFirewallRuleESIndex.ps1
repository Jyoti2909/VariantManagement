echo "`nAdd firewall rule for ZOO..."
Netsh.exe advfirewall firewall add rule name="ZOO port 2181" dir=in localip=any remoteip=any protocol=tcp localport=2181 interfacetype=any enable=yes action=allow profile=any;

echo "`nAdd firewall rule for SOLR..."
Netsh.exe advfirewall firewall add rule name="SOLR port 8983" dir=in localip=any remoteip=any protocol=tcp localport=8983 interfacetype=any enable=yes action=allow profile=any;

echo "`nAdd firewall rule for ZOO quorum..."
Netsh.exe advfirewall firewall add rule name="ZOO quorum port 2888" dir=in localip=any remoteip=any protocol=tcp localport=2888 interfacetype=any enable=yes action=allow profile=any;
Netsh.exe advfirewall firewall add rule name="ZOO quorum port 3888" dir=in localip=any remoteip=any protocol=tcp localport=3888 interfacetype=any enable=yes action=allow profile=any;

echo "`nAdd firewall rule for ES Index service..."
Netsh.exe advfirewall firewall add rule name="ES Index service 8081" dir=in localip=any remoteip=any protocol=tcp localport=8081 interfacetype=any enable=yes action=allow profile=any;
