const {handleCommands}=require('./common-commands-handler')
const {handleMasterCommands} =require('./master-commands-handler')
const {handleSlaveCommands}= require('./slave-commands-handler')

module.exports={handleCommands,handleMasterCommands,handleSlaveCommands}
