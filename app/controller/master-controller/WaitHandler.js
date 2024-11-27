const WaitHandler={
    wait:{},
    set:function(options){
        this.wait={...this.wait,...options}
    },
    get:function(){
        return this.wait;
    },
    increaseRepliesCount:function(){
        this.wait.ackRepliesReceived++;
    },
    setToDone:function(){
        this.wait.isDone=true;
    },
    getRepliesCount:function(){
        return this.wait.ackRepliesReceived
    },
    getReplicasCount:function(){
        return this.wait.replicas
    },
    setPropagation:function(length){
        this.wait.propagation=length
    }

}
module.exports={WaitHandler}