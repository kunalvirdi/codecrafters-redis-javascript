const {logger} = require("../utilities/Logger");

//RDB FILE PARSING

// RDB FILE FORMAT -> https://rdb.fnordig.de/file_format.html#:~:text=Redis

// File Format With expiry -> 52 45 44 49 53 30 30 31 31 fa 9 72 65 64 69 73 2d 76 65 72 5 37 2e 32 2e 30 fa a 72 65 64 69 73 2d 62 69 74 73 c0 40 fe 0 fb 3 3 fc 0 9c ef 12 7e 1 0 0 0 4 70 65 61 72 4 70 65 61 72 fc 0 c 28 8a c7 1 0 0 0 9 62 6c 75 65 62 65 72 72 79 9 72 61 73 70 62 65 72 72 79 fc 0 c 28 8a c7 1 0 0 0 9 70 69 6e 65 61 70 70 6c 65 5 67 72 61 70 65 ff 84 a2 5 e 6e 20 b9 5b a

// File Format without expirty in ms -> HexString: 52 45 44 49 53 30 30 31 31 fa 9 72 65 64 69 73 2d 76 65 72 5 37 2e 32 2e 30 fa a 72 65 64 69 73 2d 62 69 74 73 c0 40 fe 0 fb 3 0 0 9 70 69 6e 65 61 70 70 6c 65 6 62 61 6e 61 6e 61 0 a 73 74 72 61 77 62 65 72 72 79 9 72 61 73 70 62 65 72 72 79 0 9 72 61 73 70 62 65 72 72 79 6 6f 72 61 6e 67 65 ff 97 51 a1 2d b1 ea ce c6 a

//For now, my codebase only supports, rdb file without timeout and file with timeout in millisecond and it only parse rdb file not convert data into rdb file


const RDBContent={}


// Parsing for slave nodes
module.exports.parseFileFromMaster=(fileBuffer)=>{
    const hexString = bufferToHex(fileBuffer)
    const [replId,offset]=hexToString(hexString.split('d a')[0].trim().split(' ')).split(" ").slice(1)
    logger.info(`HexString:`+hexString);
    return {replId,offset,keyValuePair:hexToString(hexString.split('a2')[1]?.trim()?.split(" "))?.trim()}
}


// Parsing for master nodes
module.exports.parseFile=(fileBuffer)=>{
    //Converting file buffer into hex string
    const hexString = bufferToHex(fileBuffer)
    logger.info(`HexString: ${hexString}`);

    //Extract Header....
    const dbSectionsHex=hexString.split('fe')
    const headerAndMetaDataHex = dbSectionsHex[0].trim(); // hexString.split('fe')[0].trim()

    //Extract Db Details...
    let dbDetailsHex = hexString.split('fb')[1].trim().split(" ")
    const dbDetails={}
    dbDetails.dbLength=parseInt(dbDetailsHex[0],16);
    dbDetails.expiryLen=parseInt(dbDetailsHex[1],16);
    RDBContent.dbDetails=dbDetails
    if(RDBContent.dbDetails.expiryLen>0){
        const dbDetailsWithExpiry = dbDetailsHex.join(" ").split('fc').slice(1);
        RDBContent.dbDetails.keyValuePair=extractDbDetailsWithExpiry(dbDetailsWithExpiry) //With expiry in ms
    }else{
        const dbDetailsWithoutExpiry=hexString.split('ff')[0].trim().split('fb')[1].trim().split(" ").slice(3)
        RDBContent.dbDetails.keyValuePair=extractDbDetailsWithoutExpiry(dbDetailsWithoutExpiry) //without expiry
    }

    RDBContent.header=extractHeader(headerAndMetaDataHex);
    RDBContent.metaData=extractMetaData(headerAndMetaDataHex);
    return RDBContent.dbDetails
}

const bufferToHex=(fileBuffer)=>{
    const hexArray=[];
    for(let data of fileBuffer){
        hexArray.push(data.toString("16"))
    }
    return hexArray.join(" ");
}


const hexToString=(hexArray)=>{
    if(hexArray===undefined){return ""}
    let string=''
    hexArray.forEach((data)=>{
        if(data!==''){
            string+=String.fromCharCode(parseInt(data,16))
        }
    })
    return string;
}
const extractHeader=(hexString)=>{
    const headerHexArray=hexString.split('fa')[0].split(" ");
    return hexToString(headerHexArray)
}

const extractMetaData=(hexString)=>{
    const hexMetaData=hexString.split('fa').slice(1);
    const metaData=[]
    for(let subMetaData of hexMetaData){
        subMetaData=subMetaData.trim().split(" ");
        const length=parseInt(subMetaData[0],16)
        const stringSubMetaData=hexToString(subMetaData.slice(1,length+1))
        metaData.push(stringSubMetaData+hexToString(subMetaData.slice(length+2)))
    }
    return metaData;
}

const extractDbDetailsWithExpiry=(dbDetailsHex)=>{
    const keyValuePair=new Map()
    // console.log(dbDetailsHex)

    for(let keyValueExpiry of dbDetailsHex){

        keyValueExpiry=keyValueExpiry.trim().split(" ");
        let pxHex=keyValueExpiry.slice(0,8);
        const keyValue=keyValueExpiry.slice(9)
        const keyLength=parseInt(keyValue[0],16)
        const key = hexToString(keyValue.slice(1,1+keyLength))
        const valueLength=parseInt(keyValue[keyLength+1],16)
        const value=hexToString(keyValue.slice(keyLength+2,keyLength+2+valueLength))

        const px=(Number(hexArrayToMilliseconds(pxHex)))
        keyValuePair.set(key,[value,px])
    }
    return keyValuePair
}

const extractDbDetailsWithoutExpiry=(dbDetailsHex)=>{
    let isKey=true;
    let key=null,value=null
    const keyValuePair=new Map()
    for(let i=0;i<dbDetailsHex.length;){

        if(dbDetailsHex[i]==='0'){
            i++;
        }else{
            const length=parseInt(dbDetailsHex[i],16)
            const val = hexToString(dbDetailsHex.slice(i+1,i+1+length))
            // console.log(val)
            i+=length+1
            if(isKey){
                key=val;
                isKey=false
            }else{
                value=val;
                if(key && value){
                    keyValuePair.set(key,[val,null])
                    key=null
                    value=null
                }
                isKey=true
            }
        }
    }
    return keyValuePair
}

function hexArrayToMilliseconds(hexArray) {
    // Convert hex strings to decimal values and process from little-endian
    return Buffer.from(hexArray.map(h=>parseInt(h,16))).readBigUInt64LE().toString()
}

