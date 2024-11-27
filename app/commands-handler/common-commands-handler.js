const {deserialize} = require("../parsers/resp-parser");
const { MasterHandler}=require('./master-commands-handler')
const {logger} = require("../utilities/Logger");


//Master node comes with additional functionality, like sending commands that edits the database, slave instances are read only instances!
module.exports.handleCommands=(node,encodedData,dir='',dbFile='')=>{
    const data = deserialize(encodedData)
    let cmd,body
    if(data.length>0){
        cmd = data[0].toLowerCase();
        body = data.slice(1);
    }
    logger.info(`Deserialized Data -> cmd:${cmd}, body:${body}`)
    if(node.role==='master'){
        MasterHandler.set(node,node.getClient())
        MasterHandler.handleCommands(data,cmd,body,dir,dbFile)
    }

    switch (cmd) {
        case 'ping':
            return node.handlePingCommand();
        case 'echo':
            return node.handleEchoCommand(body)
        case 'get':
            return node.handleGetCommand(body)
        case 'keys':
            return node.handleAllKeysCommand(body)
        case 'info':
            return node.handleInfoCommand(body)
        case 'type':
            return node.handleTypeCommand(body)
        case 'xrange':
            return node.handleXrangeCommand(body)
        case "xread":
            return node.handleXReadCommand(body)
        case "incr":
            return node.handleIncrCommand(body)
        case "discard":
            return node.handleDiscardCommand(body)

    }



}