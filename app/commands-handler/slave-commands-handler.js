const {deserialize} = require("../parsers/resp-parser");
const {logger} = require("../utilities/Logger");
//When master sends any data to slave, this thing will handle here!

//Slave node maintain offset, to store that how many bytes it's consume from master
module.exports.handleSlaveCommands=(slaveCommandController, encodedData)=>{

    for(let i=0;i<encodedData.length;){
        let offset=0;
        const length=2*(parseInt(encodedData[i][1]))
        let EncodedData=encodedData.slice(i,i+length+1).join('\r\n')
        offset+=EncodedData.length>0?EncodedData.length+2:0;
        let data=deserialize(EncodedData);
        let cmd,body
        if(data.length>0){
            cmd = data[0].toLowerCase();
            body = data.slice(1);
        }
        logger.info('Propagated Command->'+data)
        if(cmd==='set'){
            slaveCommandController.handleSetCommandPropagation(body,offset)
        }
        if(cmd==='ping'){
            slaveCommandController.handlePingCommand(offset)
        }
        const command=data.join(' ').toLowerCase()

        //If receiving REPLCONF GETACK * Command from master it will reply with offset of bytes it consumed, excluding the consumption of current byte
        if(command.includes('replconf')){
            if(command.includes('getack')){
                if(command.includes('*')){
                    return slaveCommandController.handleREPLCONFGetAckCommand(offset)
                }
            }
        }
        i+=length+1;
    }
}