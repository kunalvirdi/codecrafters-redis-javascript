const {serialize, defaultResponse} = require('../../parsers/resp-parser')
const {logger} = require("../../utilities/Logger");
const {replicas} = require("./replicas");
const {MasterHandshakeController} = require("./MasterHandshakeController");
const {WaitHandler} = require("./WaitHandler");
const {CommonCommandsController} = require("../CommonCommandsController");
const {validateStreamId, generateStreamId}= require('../../utilities/utility')
const {DBData}=require('../DBData')
const {BlockHandler} = require("../Blockhandler");

class MasterCommandsController extends CommonCommandsController{
    constructor(connection,role) {
        super(connection,role)
    }

    getREPLIdAndOffset(){
        return [this.replId,this.replOffset]
    }
    setMasterREPLIdAndOffset(){
        if(this.role==='master'){
            super.replId='8371b4fb1155b71f4a04d3e1bc3e18c4a990aeeb'
            super.replOffset=0
        }else{
            logger.error('Not a master node.[Cannot access this command]')
        }
    }

    handleSETCommand(data){
        // if the multi command received then it'll add all the requests in queueCommands list
        if(this.multiCommand.isMultiCommand){
            this.multiCommand.queuedCommands.push(["set",...data])
            return this.client.write("+QUEUED\r\n")
        }

        // if px command exists, it means that expires within that timeout
        // Database format is like key->[value,expiryTimeout,type of data of that key]
        const isPxExists=data[2]?.toLowerCase()==='px'
        if(!isPxExists){
            DBData.map.set(data[0],[data[1],null,"string"])
        }else{
            const expiryTime=new Date().getTime()+parseInt(data[3])
            DBData.map.set(data[0],[data[1],expiryTime,"string"])
        }
        // if exec command received it will execute all the commands and return a array
        if(this.multiCommand.isExecCommand) return "OK"
        return this.client.write(defaultResponse)
    }


    handleConfigCommand(data){
        return this.client.write(serialize(data))
    }

    // If gets wait command, it will block client until the mentioned replicas update it's state or timeout happen
    handleWaitCommand(body){
        const wait={
            replicas:parseInt(body[0]),
            ackRepliesReceived:0,
            isDone:false
        }
        this.timeout=setTimeout(()=>{
            this.waitHandler()
        },parseInt(body[1]))

        WaitHandler.set(wait)
        const slaves=replicas.getSlaves()

        if(WaitHandler.get()?.propagation){
            for(let slave of slaves){
                const slaveNode=slave.slave;
                slaveNode.write(MasterHandshakeController.sendREPLCONFAckCommandToSlave())
            }
        }else{
            clearTimeout(this.timeout)
            return this.client.write(serialize(slaves.length || 0))
        }
    }
    //if replicas replied to server before timeout, it will resume client interaction
    waitHandler(){
        clearTimeout(this.timeout)
        const slaves=replicas.getSlaves()
        for(let slave of slaves){
            const slaveNode=slave.slave
            if(this.client===slaveNode) return
        }
        return this.client.write(serialize(WaitHandler.getRepliesCount()))
    }

    //REPLC CONF Command handler
    handleREPLConfCommand(offset){
        if(this.replOffset!==offset){
            this.replOffset=offset;
            WaitHandler.increaseRepliesCount()
            WaitHandler.setToDone()
            if(WaitHandler.getRepliesCount()>=WaitHandler.getReplicasCount()) this.waitHandler()
            logger.info('Update offset of master node to:'+this.replOffset)
        }else{
            logger.info("Offset remain same:"+this.replOffset)
            this.waitHandler()
        }
    }

    // XADD Command for redis streams
    handleXADDCommand(data){
        const streamName=data[0];
        const stream=DBData.map.has(streamName)?DBData.map.get(streamName):new Map();
        let streamId=data[1];
        let response=true;
        //validating stream Id, send error to client if errors in id valdiating

        response=validateStreamId(stream,streamName,streamId)
        if(response===true){
            //Stream Id generation!
            const {updatedStreamId,isBulkString}=generateStreamId(stream,streamId)
            streamId=updatedStreamId
            for(let i=2;i<data.length;i+=2){
                const key=data[i]
                const value=data[i+1]
                let streamMap;
                streamMap=stream.has(streamId)?stream.get(streamId):new Map()
                streamMap.set(key,value)
                stream.set(streamId,streamMap);
                DBData.map.set(streamName,stream)
            }
            //If client is blocked to read new Data then this block will executed
            if(BlockHandler.isBlock && BlockHandler.command.includes(streamName)){
                console.log(DBData.map)
                const {isEmpty,response}=this.getXReadData(!BlockHandler.command.includes('$')?BlockHandler.command:data.slice(0,2),BlockHandler.newData)
                console.log(response)
                BlockHandler.client.write(serialize(response,true))
                BlockHandler.isBlock=false
                BlockHandler.newData=false
            }
            return !isBulkString?this.client.write(`+${streamId}\r\n`):this.client.write(serialize([streamId]))

        }else{
            return this.client.write(response)
        }
    }

    handleMultiCommand(){
        this.setMultiCommand(true)
        return this.client.write(defaultResponse)
    }
    async handleExecCommand(body) {
        if (!this.multiCommand.isMultiCommand) {
            return this.client.write("-ERR EXEC without MULTI\r\n");
        }

        if (this.multiCommand.queuedCommands.length === 0) {
            this.resetMultiCommand(); // Reset state
            return this.client.write("*0\r\n");
        }

        this.setMultiCommand(false); // End MULTI state
        this.setExecCommand(true);

        const responseArray = [];
        for (let command of this.multiCommand.queuedCommands) {
            const cmd = command[0];
            const body = command.slice(1);
            switch (cmd) {
                case "set":
                    responseArray.push(await this.handleSETCommand(body));
                    break;
                case "get":
                    responseArray.push(await this.handleGetCommand(body));
                    break;
                case "incr":
                    responseArray.push(await this.handleIncrCommand(body));
                    break;
            }
        }

        this.multiCommand.queuedCommands = [];
        this.setExecCommand(false);
        this.resetMultiCommand(); // Ensure state is reset after execution
        return this.client.write(serialize(responseArray));
    }

}


module.exports={MasterCommandsController}