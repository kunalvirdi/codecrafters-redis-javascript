// maintained single instance of replicas
module.exports.replicas={
    slaves:[],
    push(slave){
        this.slaves.push({slave})
    },
    getSlaves(){
        return this.slaves
    }
}