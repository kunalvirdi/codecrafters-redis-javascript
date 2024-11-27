const net = require('net');

module.exports.Server={
    server:null,
    getServer:()=>{
        if(!this.server){
            this.server=net.createServer();
        }
        return this.server;
    },
    connectToMaster(options,callback){
        return net.createConnection(options,callback)
    }
}