// getIPv4

var os = require("os");


function getIPv4(callback){
    var ifaces=os.networkInterfaces();
    for (var iface in ifaces){
        for (var addr in ifaces[iface]){
            var currentAddr = ifaces[iface][addr];
            if (currentAddr.family == "IPv4"){
                callback(currentAddr.address);
            }
        }
    }
}

exports.getIPv4 = getIPv4;
