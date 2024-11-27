const args=process.argv
const getArg = (argName)=>{
    const index=args.indexOf(argName)
    if(index!==-1){
        return args[args.indexOf(argName)+1]
    }
    return null
}

const readCommandLineArgs=()=>{
    const dir=getArg("--dir") || null
    const dbFile=getArg('--dbfilename') || null;
    let port=getArg('--port')
    port=port?parseInt(port):6379
    let replicaOf=getArg('--replicaof')?getArg('--replicaof'):null
    return {dir,dbFile,port,replicaOf}
}
const validateStreamId=(stream,streamName,streamId)=>{
    const [milliseconds,sequenceNumber]=streamId.split('-')
    if(stream.size!==0 && streamId!=='0-0'){
        const lastEntry=Array.from(stream.keys()).slice(-1)[0]
        console.log(lastEntry,milliseconds,sequenceNumber)
        const lastEntryMilliseconds=parseInt(lastEntry.split('-')[0])
        if(parseInt(milliseconds)<lastEntryMilliseconds){
            return `-ERR The ID specified in XADD is equal or smaller than the target stream top item\r\n`
        }else if(parseInt(milliseconds)===lastEntryMilliseconds){
            const lastEntrySequenceNumber=parseInt(lastEntry.split('-')[1])
            if(parseInt(sequenceNumber)<=lastEntrySequenceNumber){
                return `-ERR The ID specified in XADD is equal or smaller than the target stream top item\r\n`

            }
        }
    }else{
        if(parseInt(milliseconds)<=0 && sequenceNumber<=0){
            return `-ERR The ID specified in XADD must be greater than 0-0\r\n`
        }
    }
    return true;
}

const generateStreamId=(stream,streamId)=>{
    let isBulkString=false;
    let updatedStreamId=streamId
    if(updatedStreamId==='*'){
        updatedStreamId=new Date().getTime()+'-'+0
        isBulkString=true
    }else if(streamId.split('-')[1]==='*'){
        const [milliseconds,sequenceNumber]=streamId.split('-')
        let updatedSequenceNumber=''
        if(stream.size===0){
            if(parseInt(milliseconds)===0){
                updatedSequenceNumber="1"
            }else{
                updatedSequenceNumber="0"
            }
        }else{
            const lastEntry=Array.from(stream.keys()).slice(-1)[0]
            const lastEntryMilliseconds=lastEntry.split('-')[0]
            const lastEntrySequenceNumber=parseInt(lastEntry.split('-')[1])
            if(lastEntryMilliseconds!==milliseconds){
                updatedSequenceNumber=0;
            }else{
                updatedSequenceNumber=(lastEntrySequenceNumber+1).toString();

            }
        }
        updatedStreamId=milliseconds+'-'+updatedSequenceNumber;
    }
    return {updatedStreamId,isBulkString};

}

module.exports={readCommandLineArgs,validateStreamId,generateStreamId}