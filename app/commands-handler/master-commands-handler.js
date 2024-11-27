const {MasterHandshakeController}=require('../controller')
const {replicas}=require('../controller')
const {serialize} = require("../parsers/resp-parser");
const {WaitHandler} = require("../controller/master-controller/WaitHandler");



const MasterHandler={
    masterHandshakeController:null,
    masterNode:null,
    replId:null,
    replOffset:null,

    set:function(masterNode,slaveNode){
        this.masterHandshakeController=new MasterHandshakeController(slaveNode);
        this.masterNode=masterNode
        const [replId,replOffset]=masterNode.getREPLIdAndOffset()
        this.replId=replId;
        this.replOffset=replOffset
    },
    handleCommands:function(data,cmd,body,dir,dbFile){
        if(this.masterHandshakeController){
            switch (cmd){
                case 'replconf':
                    const command=data.join(' ').toLowerCase()
                    if(command.includes('ack')){
                        this.masterNode.handleREPLConfCommand(parseInt(body[1]))
                    }else{
                        return this.masterHandshakeController.defaultResponseHandler()
                    }
                    break;
                case 'psync':
                    return this.masterHandshakeController.PSYNCHandler(this.replId,this.replOffset)
                case 'config':
                    let d = []
                    if (body[1].toLowerCase() === 'dir') {
                        d.push('dir')
                        d.push(dir);
                    } else if (body[1].toLowerCase() === 'dbfilename') {
                        d.push('dbfilename')
                        d.push(dbFile);
                    }
                    return this.masterNode.handleConfigCommand(d)
                case 'set':
                    //if replicas exists all the set commands will propagates to replicas and replicas will update it's state
                    this.propagateToReplicas(data)
                    return this.masterNode.handleSETCommand(body)
                case 'wait':
                    return this.masterNode.handleWaitCommand(body)
                case 'xadd':
                    return this.masterNode.handleXADDCommand(body)
                case 'multi':
                    return this.masterNode.handleMultiCommand(body)
                case 'exec':
                    return this.masterNode.handleExecCommand(body)

            }
        }
    },
    propagateToReplicas:function(data){
        const slaves=replicas.getSlaves()
        if(this.masterHandshakeController && slaves.length>0){
            for(let slave of slaves){
                const slaveNode=slave.slave
                WaitHandler.setPropagation(data.length)
                slaveNode.write(serialize(data))
            }
        }
    }
}



module.exports={MasterHandler}