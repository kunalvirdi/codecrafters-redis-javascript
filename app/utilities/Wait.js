const NumberOfAckRepliesReceived={
    numberOfAckRepliesReceived:0,
    increment:function(){
        this.numberOfAckRepliesReceived++;
    },
    get:function(){
        return this.numberOfAckRepliesReceived
    }
}
module.exports={NumberOfAckRepliesReceived}