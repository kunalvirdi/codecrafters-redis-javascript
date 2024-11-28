const {logger} = require("../utilities/Logger");

// Parser for serializing and deserializing the incoming requests and outgoing responses

// Read about resp (Redis Serialization Protocol) here->https://redis.io/docs/latest/develop/reference/protocol-spec/

// For now deserialize only supports for arrays, and bulk string will add other  data types also.
const deserialize=(encodedData,data=[])=>{
    if(encodedData.includes('+') && encodedData.toLowerCase().includes("ERR") ) return encodedData.split('\r\n')[0]
    const padding = 4;
    switch (encodedData[0]) {
        case '*':
            deserialize(encodedData.slice(padding), data)
            break;
        case '$':
            const encodedDataArray = encodedData.split("\r\n")
            for (let i = 1; i < encodedDataArray.length; i += 2) {
                data.push(encodedDataArray[i])
            }
            break
    }
    return data
}


const serialize=(data,returnedArray=false,isError=false)=>{
    //body:[]
    if(Number(data)!==data && !data) return "$0\r\n"
    if(Array.isArray(data) && data.flat().length===0) return "*0\r\n"
    if(isError) return `-ERR ${data}\r\n`

    if(!Array.isArray(data) && Number(data)!==data){
        data=data.split(' ')
    }
    // lines from 28-36 kept redundant for some reasons!
    if(!returnedArray && data.length===1){
        let response=[`$${data[0].length}`,...data].join("\r\n");
        response+='\r\n'
        return response
    }else if(!isNaN(data)){
        let response=[]
        response=`:${data}\r\n`
        return response
    }

    let response=[]
    //Recursive serializer code that can serialize arrays of arrays and more!
    function Serialize(body,returnedArray){
        if(!returnedArray && body.length===1){
            response.push([`$${body[0].length}`,...body].join("\r\n"));
            return response
        }else if(!isNaN(body)){
            response=`:${body}\r\n`
            return response
        }
        response.push(`*${body.length}`)
        for(let item of body){
            if(Array.isArray(item)){
                response.push(`*${item.length}`)
                for(let item2 of item){
                    if(Array.isArray(item2)){
                        Serialize(item2,true)
                    }else{
                        Serialize([item2],false)
                    }
                }
            }else{
                if(Number(item)===item){
                    response.push(`:${item}`)
                    continue;
                }
                if(item.includes("ERR")){
                    response.push(`${item}`)
                    continue
                }
                response.push(`$${item.length}`)
                response.push(item)
            }

        }
        return response
    }
    response=Serialize(data,true)
    response=response.join("\r\n");
    response+='\r\n'
    logger.info(`Data to be send -> ${response.split('\r\n')}`)
    return response

}

const defaultResponse='+OK\r\n'
const nullBulkString='$-1\r\n'

module.exports = {serialize,deserialize,defaultResponse,nullBulkString}