const net=require('net')
const {RequestQueue} = require("./utilities/RequestQueue");
const {serialize} = require("./parsers/resp-parser");


//Test client file is for testing the reponse from server, I'll add list of all commands later on to provide you with how you can tests redis server.
const requestQueue=new RequestQueue();
const socket=net.createConnection({host: "localhost", port: 6379},()=>{

    socket.on("data",data=>{
        console.log(data.toString())
        requestQueue.waitingForResponse=false;
        requestQueue.sendNextRequest()
    })
    requestQueue.addRequest(socket,serialize("XADD stream_key 0-1 temperature 96".split(" ")));
    requestQueue.addRequest(socket,serialize("XREAD block 0 streams stream_key 0-0".split(" ")))
})