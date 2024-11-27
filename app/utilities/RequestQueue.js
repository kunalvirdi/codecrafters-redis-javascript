class RequestQueue {
    requests=[]
    waitingForResponse=false
    constructor(connection) {
        this.connection=connection
    }
    addRequest(request){
        this.requests.push(request);
        this.sendNextRequest()
    }
    sendNextRequest(){
        if(this.requests.length>0 && !this.waitingForResponse){
            const request=this.requests.shift()
            this.connection.write(request);
            this.waitingForResponse=true;
        }
    }
}

module.exports={RequestQueue}