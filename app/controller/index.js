const {MasterHandshakeController} = require("./master-controller/MasterHandshakeController");
const {SlaveHandshakeController} = require("./slave-controller/SlaveHandshakeController");
const {MasterCommandsController} = require("./master-controller/MasterCommandsController");
const {CommonCommandsController}= require('./CommonCommandsController')
const {replicas} = require("./master-controller/replicas");


module.exports={MasterCommandsController,SlaveHandshakeController,MasterHandshakeController,replicas,CommonCommandsController}