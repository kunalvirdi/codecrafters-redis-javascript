const {serialize, nullBulkString, defaultResponse} = require("../parsers/resp-parser");
const {DBData}=require('./DBData')
const {BlockHandler} = require("./Blockhandler");


// Handled common commands that master and slaves both needed
class CommonCommandsController{


    setMultiCommand(isMultiCommand) {
        this.multiCommand = { ...this.multiCommand, isMultiCommand };
    }

    setExecCommand(isExecCommand) {
        this.multiCommand = { ...this.multiCommand, isExecCommand };
    }

    resetMultiCommand() {
        this.multiCommand = {
            isExecCommand: false,
            isMultiCommand: false,
            queuedCommands: []
        };
    }

    constructor(connection,role) {
        this.client = connection;
        DBData.map=new Map()
        this.role=role
        this.multiCommand={
            isExecCommand:false,
            isMultiCommand:false,
            queuedCommands:[]
        }
    }
    getClient(){
        return this.client
    }
    handlePingCommand(){
        return this.client.write("+PONG\r\n")
    }
    setData(data){
        DBData.map=data?data.keyValuePair:new Map()
    }
    handleEchoCommand(data){
        const response=serialize(data)
        return this.client.write(response)
    }
    handleGetCommand(data){
        if(this.multiCommand.isMultiCommand){
            this.multiCommand.queuedCommands.push(["get",...data])
            return this.client.write("+QUEUED\r\n")
        }
        let response=[];
        for(let key of data){
            if(DBData.map.has(key)){
                const timeout=DBData.map.get(key)[1]
                if(!timeout || new Date().getTime()<timeout){
                    response.push(DBData.map.get(key)[0].toString())
                }
            }
        }
        // console.log(MultiCommandController.multiCommand)
        if(this.multiCommand.isExecCommand){
            if(response.length===0) return "-1"
            return response[0]
        }
        if(response.length===0) return this.client.write(nullBulkString)
        response=serialize(response)
        return this.client.write(response)
    }
    handleTypeCommand(data){
        const key=data[0];
        if(!DBData.map.has(key)) return this.client.write('+none\r\n')
        const stream=DBData.map.get(key)
        if(stream instanceof Map){
            return this.client.write(`+stream\r\n`)
        }
        return this.client.write(`+${DBData.map.get(key)[2]}\r\n`)
    }
    handleAllKeysCommand(body){
        if(body[0]==='*'){
            const key=Array.from(DBData.map.keys());
            return this.client.write(serialize(key,true))
        }
        return this.client.write(nullBulkString)
    }
    handleInfoCommand(body){
        if(body[0].toLowerCase()==='replication'){
            const data=[`role:${this.role} master_replid:${this.replId} master_repl_offset:${this.replOffset}`]
            return this.client.write(serialize(data))
        }
    }
    buildResponse(key){
        const keyValue=[]
        for(let [k,value] of key){
            keyValue.push(k)
            keyValue.push(value)
        }
        return keyValue
    }
    handleXrangeCommand(body){
        const streamName=body[0]
        const startingRange=body[1]
        const endingRange=body[2]
        const stream=DBData.map.get(streamName)
        const entryKeys=Array.from(stream.keys())
        const response=[]
        for(let key of entryKeys){
            const [milliseconds,sequenceNumber]=key.split('-')
            const entries=[]
            const isWithSequenceNumber=body[1].indexOf('-')!==-1
            if(body[2]==='+'){
                if((!isWithSequenceNumber && (milliseconds>=startingRange)) || (key>=startingRange)){
                    entries.push(key)
                    entries.push(this.buildResponse(stream.get(key)))
                    response.push(entries)
                }
            }else{
                if((!isWithSequenceNumber && (milliseconds>=startingRange && milliseconds<=endingRange)) || (key>=startingRange && key<=endingRange)){
                    entries.push(key)
                    entries.push(this.buildResponse(stream.get(key)))
                    response.push(entries)
                }
            }
        }
        console.log(response)
        return this.client.write(serialize(response))
    }
    getXReadData(data,newData=false) {
        let entryIdsIndex = -1;
        for (let i = 0; i < data.length; i++) {
            if (data[i].includes('-')) {
                entryIdsIndex = i;
                break;
            }
        }
        const streamToId = new Map();
        for (let i = 0; i < data.length - entryIdsIndex; i++) {
            const streamName = data[i]
            const entryId = data[i + entryIdsIndex]
            streamToId.set(streamName, entryId)
        }
        const response = []
        let isEmpty=true;
        for (let [streamName, entryId] of streamToId) {
            const streamData = []
            const stream = DBData.map.get(streamName)
            if(!stream) break
            streamData.push(streamName)
            const entryIds = Array.from(stream.keys())
            const Response = []
            for (let key of entryIds) {
                const entries = []
                if ((newData && key >= entryId) || key>entryId) {
                    isEmpty=false
                    entries.push(key)
                    entries.push(this.buildResponse(stream.get(key)))
                    Response.push(entries)
                }
            }
            streamData.push(Response)
            response.push(streamData)
        }
        return {isEmpty,response}
    }
    handleXReadCommand(body){
        // if block is passed then it will block client to get newly added data
        if(body.includes('block')){
           const timeout=body[1];
           const command=body.slice(3)
            BlockHandler.command= command
            BlockHandler.client=this.client
            BlockHandler.isBlock=true
            // if $ is passed as option it means client will remain in waiting state to get newly added data
            BlockHandler.newData=body.includes('$')
            if(timeout!=='0' && !body.includes('$')){
                console.log("ICAN'T")
                setTimeout(()=>{
                    const {isEmpty,response}=this.getXReadData(command);
                    console.log("[DEBUG] Response that will send to client 1 after timeout",response[0])
                    if(isEmpty){return this.client.write(nullBulkString)}
                    return this.client.write(serialize(response,true))
                },timeout)
            }

        }else{
            const data=body.slice(1)
            const {isEmpty,response}=this.getXReadData(data)
            console.log(DBData.map,response[0])
            if(isEmpty) return this.client.write(nullBulkString)
            return this.client.write(serialize(response,true))
        }
    }

    handleIncrCommand(body){
        if(this.multiCommand.isMultiCommand){
            this.multiCommand.queuedCommands.push(["incr",...body])
            return this.client.write("+QUEUED\r\n")
        }
        const key=body[0]
        let response=null
        if(!DBData.map.has(body[0])){
            DBData.map.set(key,[1,null,"string"])
            response=1
        }else{
            let [val,px,type]=DBData.map.get(body[0])
            if(isNaN(parseInt(val))){
                response="-ERR value is not an integer or out of range"
            }else{
                DBData.map.set(key,[parseInt(val)+1,px,type])
                response=parseInt(val)+1
            }
        }
        if(this.multiCommand.isExecCommand) return response

        return this.client.write(response[0]==='-'?response+"\r\n":serialize(response))
    }
    handleDiscardCommand(){
        if(!this.multiCommand.isMultiCommand){
            return this.client.write("-ERR DISCARD without MULTI\r\n")
        }
        this.resetMultiCommand()
        return this.client.write(defaultResponse)
    }
}

module.exports={CommonCommandsController}