echo "`nAdd firewall rule for ZOO..."
Netsh.exe advfirewall firewall add rule name="ZOO port 2181" dir=in localip=any remoteip=any protocol=tcp localport=2181 interfacetype=any enable=yes action=allow profile=any;

echo "`nAdd firewall rule for ES FileProcessor service..."
Netsh.exe advfirewall firewall add rule name="ES FileProcessor service 8082" dir=in localip=any remoteip=any protocol=tcp localport=8082 interfacetype=any enable=yes action=allow profile=any;

echo "`nAdd firewall rule for ES FileProcessor service java..."
Netsh.exe advfirewall firewall add rule name="ES FileProcessor service java 8083" dir=in localip=any remoteip=any protocol=tcp localport=8083 interfacetype=any enable=yes action=allow profile=any;
