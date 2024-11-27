
(async function (){
    const {logger}=require('./utilities/Logger')
    const fs=require('fs/promises')
    const {existsSync}=require('fs')
    const {parseFile} = require('./parsers/rdb-file-parser');
    const {readCommandLineArgs}= require('./utilities/utility')
    const {startMasterServer}=require('./RDB Instances/master')
    const{startSlaveServer}=require('./RDB Instances/slave')

    //Get argument from command line, information like -> Path of DBFile for data persistence (--dir,--DBFileName), server is master node or replica note (--replica of flag), port of instance (--port flag)
    let {dir,dbFile,port,replicaOf}=readCommandLineArgs()
    try {
        let data=null
        const path = (dir!==null && dbFile!==null)?dir + '/' + dbFile:null;
        const isRDBFileExists = path?existsSync(path):false;
        //Parsing the data of RDB File and store it into RAM!
        if (isRDBFileExists) {
            console.time('RDB File Read Time')
            const fileBuffer = await fs.readFile(path);
            data = parseFile(fileBuffer) // it supports extracting only key value pair from rdb file, further modifications will be made soon.
            console.timeEnd('RDB File Read Time')
        }else{
            logger.info('RDB file not exists')
        }
        //if --replicaof flag got, it means it is a slave instance else master instance
        if(replicaOf){
            const [replicaHost,replicaPort]=replicaOf.split(" ")
            startSlaveServer(port,replicaHost,replicaPort)
        }else{
            startMasterServer(port,data,dir,dbFile)
        }
    }catch (err){
        logger.error(err)
    }
})()




