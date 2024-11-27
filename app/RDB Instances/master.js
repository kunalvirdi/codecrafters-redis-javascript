const {Server} = require('../Server');
const {MasterCommandsController} = require("../controller");
const {handleCommands}=require('../commands-handler')
const {logger} = require("../utilities/Logger");


const server=Server.getServer()

module.exports.startMasterServer=(port,data,dir,dbFile)=>{
    server.on("connection",async (connection)=>{
        const masterNode=new MasterCommandsController(connection,"master")
        masterNode.setMasterREPLIdAndOffset()
        masterNode.setData(data)
        const {role,replicaof,map}=masterNode
        logger.info(`Database Info->\nRole:${role}\nReplicaOf:${replicaof}\nData:${map}`)

        connection.on('data', async (chunk) => {
            const encodedData = chunk.toString()
            handleCommands(masterNode,encodedData,dir,dbFile)
        })
    })

    server.listen(port, ()=>{
        console.log("Master Server is Listening on port "+port);
    });
}