const net=require('net')
const {RequestQueue} = require("./utilities/RequestQueue");
const {serialize} = require("./parsers/resp-parser");

const requestQueue=new RequestQueue();
const socket=net.createConnection({host: "localhost", port: 6379},()=>{

    socket.on("data",data=>{
        console.log([data.toString()])
        requestQueue.waitingForResponse=false;
        requestQueue.sendNextRequest()
    })
    requestQueue.addRequest(socket,serialize("XADD stream_key 0-2 temperature 95".split(" ")));
})