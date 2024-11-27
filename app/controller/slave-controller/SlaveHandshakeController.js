const {serialize} = require("../../parsers/resp-parser");

class SlaveHandshakeController{
    replOffset=0 // Maintaining the offset of bytes it consumed from master
    constructor(slaveNode) {
        this.slaveNode=slaveNode
        this.state=new Map()
    }

    handleSetCommandPropagation(data,offset){
        this.replOffset+=offset
        const isPxExists=data[2]?.toLowerCase()==='px'
        if(!isPxExists){
            this.state.set(data[0],[data[1],null])
        }else{
            this.state.set(data[0],[data[1],new Date().getTime()+parseInt(data[3])])
        }
    }
    handlePingCommand(offset){
        this.replOffset+=offset
    }
    handleREPLCONFGetAckCommand(offset){
        let prevOffset=this.replOffset
        this.replOffset+=offset
        return this.slaveNode.write(serialize(['REPLCONF','ACK',prevOffset.toString()]))
    }
    sendPINGCommandToMaster(){
        return serialize(['ping'],true)
    }
    sendREPLCONFCommandToMaster(data){
        data=['REPLCONF',...data]
        return serialize(data)
    }
    sendPSYNCCommandToMaster(data){
        data=['PSYNC',...data]
        return serialize(data)
    }
}

module.exports={SlaveHandshakeController}