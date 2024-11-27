const {Server} = require('../Server');
const {SlaveHandshakeController,CommonCommandsController} =require('../controller')
const {handleCommands,handleSlaveCommands}=require('../commands-handler')
const {parseFileFromMaster} = require("../parsers/rdb-file-parser");
const {RequestQueue} = require("../utilities/RequestQueue");
const server=Server.getServer()

module.exports.startSlaveServer=(port,replicaHost,replicaPort)=>{

    let slaveCommandsController;
    const slaveNode=Server.connectToMaster({host:replicaHost, port:replicaPort},()=>{
        const requestQueue=new RequestQueue(slaveNode) // request queue for handshaking between client and server
       slaveCommandsController =new SlaveHandshakeController(slaveNode) //Slave command handler for master-slave handshake

        slaveNode.on('data',(chunk)=>{
            let encodedData=chunk.toString()
            if(chunk.toString().includes('FULLRESYNC')){
                let {replId,offset,keyValuePair}=parseFileFromMaster(chunk)
                encodedData=keyValuePair
                slaveCommandsController.replId=replId;
                slaveCommandsController.replOffset=parseInt(offset);
            }
            handleSlaveCommands(slaveCommandsController,encodedData.split('\r\n'))
            requestQueue.waitingForResponse=false;
            requestQueue.sendNextRequest()
        })

        //Initialising handshake ->
        // 1) Slave send ping command to Master
        // 2) Master respond with ok
        // 3) Slave sends another REPLCONF command to Master to tell about it's listening port
        // 4) Master replies with OK
        // 5) Slave tells master, it is ready for sync
        // 6) Master send ok back to slave
        // 7) slave send PSYNC command to master, to ask about ReplID and Offset
        // 8) Master then send replid and offset with fullresync flag with data that master owns,Master add slave to it's replicas
        // 9) Slave add that data to their database (Handshake process completed)
        requestQueue.addRequest(slaveCommandsController.sendPINGCommandToMaster())
        requestQueue.addRequest(slaveCommandsController.sendREPLCONFCommandToMaster(['listening-port',port.toString()]))
        requestQueue.addRequest(slaveCommandsController.sendREPLCONFCommandToMaster(['capa','psync2']))
        requestQueue.addRequest(slaveCommandsController.sendPSYNCCommandToMaster(['?','-1']))

    })
    server.on('connection',(connection)=>{
        const controller = new CommonCommandsController(connection,"slave")
        if(slaveCommandsController){
            controller.replId=slaveCommandsController.replId
            controller.replOffset=parseInt(slaveCommandsController.offset)
            controller.setData({keyValuePair:slaveCommandsController.state}) //Transferring data from master instance to slave instance
        }
        connection.on('data',(chunk)=>{
            const encodedData = chunk.toString()
            handleCommands(controller,encodedData)
        })

    })
    server.listen(port,()=>{
        console.log("Replica Port is listening on port "+port);
    })
}
