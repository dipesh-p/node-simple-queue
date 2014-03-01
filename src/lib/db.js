GLOBAL.mongoose = require('mongoose');	
mongoose.set('debug', false);
require('./job.js');
require('./worker.js');
exports.ConnectToDB=function(db_config){
	if(db_config==undefined){
		mongoose.connect('mongodb://127.0.0.1/node-queue');
	}else{
		mongoose.connect('mongodb://'+db_config.host+':'+db_config.port+'/'+db_config.db_name);
	}
}