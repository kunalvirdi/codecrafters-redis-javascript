const {defaultResponse, serialize}=require('../../parsers/resp-parser')
const {getRDBFile} = require("../../../getRDBFile");
const {replicas}=require('./replicas')
const {logger} = require("../../utilities/Logger");

// Responsible for only doing handshakes with replicas
class MasterHandshakeController{
    constructor(connection) {
        this.slaveNode=connection
    }

    defaultResponseHandler(){
        return this.slaveNode.write(defaultResponse);
    }

    PSYNCHandler(replId,replOffset){
        const fullResync=Buffer.from(`+FULLRESYNC ${replId} ${replOffset}\r\n`)
        const rdbFileContent=getRDBFile()
        const rdbBuffer = Buffer.from(rdbFileContent, "hex");
        const rdbHead = Buffer.from(`$${rdbBuffer.length}\r\n`)
        logger.info(`Slave Node added`)
        replicas.push(this.slaveNode)
        return this.slaveNode.write(Buffer.concat([fullResync,rdbHead,rdbBuffer]))

    }
    static sendREPLCONFAckCommandToSlave(){
        return serialize(['REPLCONF' ,'GETACK' ,'*'])
    }

}

module.exports={MasterHandshakeController}