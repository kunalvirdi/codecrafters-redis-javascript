// If block flag is passed with XREAD  command, for that it will come into picture
const BlockHandler={
    client:null,
    command:null,
    isBlock:false,
    newData:false
}
module.exports={BlockHandler}