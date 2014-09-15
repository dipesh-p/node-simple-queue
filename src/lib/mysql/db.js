var mysql = require('mysql');
function MySQLPool(db_config)
{
	if(db_config==undefined){
		this.pool_size = CONFIG.get("database.pool_size");
			
		this.config={
			host     	: CONFIG.get("database.host"),
    		port	 	: CONFIG.get("database.port"),
    		user     	: CONFIG.get("database.user"),
    		password 	: CONFIG.get("database.password"),
    		database 	: CONFIG.get("database.name")
		}
	}else{
		this.pool_size = db_config.pool_size;
		this.config=db_config
	}
	
	this.pool = [];
    for(var i=0; i < this.pool_size; ++i)
        this.pool.push(this.createConnection(this.config));
    this.last = 0;
}

MySQLPool.prototype.getConnection = function()
{
    if(this.pool.length>0){
    	var connection=this.pool.pop();
    	if(connection.state=='disconnected'){
    		connection=this.createConnection(this.config);
    	}
    	return connection;
    }
    else return this.createConnection(this.config);
}

MySQLPool.prototype.closeConnection =function(connection){
	if(this.pool.length < this.pool_size){
		this.pool.push(connection);
	}else{
		logger.info("Closing MySQL Connection");
		connection.end();
	}
}
MySQLPool.prototype.handleDisconnect=function(connection) {
	var obj=this;
	connection.on('error', function(err) {
		logger.debug("MySQL disconnected", err);
		if (!err.fatal) {
			return;
		}
		if (err.code !== 'PROTOCOL_CONNECTION_LOST') {
			// logger.error("MySQL disconnected", err);
		}
		// connection=obj.createConnection(connection.config);
	});
}
MySQLPool.prototype.createConnection=function(db_config){
	logger.info("Creating new MySQL Connection");
	var conn=mysql.createConnection(db_config);
	this.handleDisconnect(conn);
	conn.connect();
	return conn;
}

function DB(db_config){
	this.connection_pool=new MySQLPool(db_config);
}
DB.prototype._table='';
DB.prototype.query=function(query,vals,callback){
	//var options = {sql: query, nestTables: true};
	var connection =connection_pool.getConnection();
	//logger.error(query);
	connection.query(query, vals, function(err, rows) {
		connection_pool.closeConnection(connection);
		if(err) logger.log('error',err);
			callback(err,rows);
	});
}
DB.prototype.insert=function(options,callback){
	var connection =connection_pool.getConnection();
	connection.query('INSERT INTO '+this._table+' SET ?',options,function(err,result){
		connection_pool.closeConnection(connection);
		if(err) logger.log('info',err);
		callback(err,result);
	});
	
}
DB.prototype.replace=function(options,callback){
	var connection =connection_pool.getConnection();
	connection.query('REPLACE INTO '+this._table+' SET ?',options,function(err,result){
		connection_pool.closeConnection(connection);
		if(err) logger.log('error',err);
		callback(err,result);
	});
}
DB.prototype.update=function(options,condition,callback){
	var connection =connection_pool.getConnection();
	connection.query('UPDATE '+this._table+' SET ? WHERE ?',[options,condition],function(err,result){
		connection_pool.closeConnection(connection);
		if(err) logger.log('error',err);
		callback(err,result);

	});
}

function Jobs(db_config){
	UserTracking.super_.call(this);
  	this._table='jobs';
}
util.inherits(Jobs,DB);

function MySQLDB(db_config){
	function ConnectToDB(){
		if(db_config==undefined){

		}else{

		}
	}
}

/*
function MySQLDB(db_config){
	var mysql = require('mongoose');	
	mongoose.set('debug', false);
	var mongoose_obj={};

	function ConnectToDB(){
		if(db_config==undefined){
			mongoose_obj=mongoose.createConnection('mongodb://127.0.0.1/node-queue');
		}else{
			mongoose_obj=mongoose.createConnection('mongodb://'+db_config.host+':'+db_config.port+'/'+db_config.db_name);
		}
	}
	ConnectToDB();

	// JOBS Schema 
	var Schema = mongoose.Schema
	  , ObjectId = Schema.ObjectId;

	var JobSchema = new Schema({
	    CLASS_NAME 	: {type: String} 
	  , STATUS 		: {type: String}
	  , QUEUE 		: {type: String}
	  , PARAMS 		: {type:Schema.Types.Mixed}
	  , HANDLE_BY	: {type:Number}
	  , ERROR 		: {type:Schema.Types.Mixed}
	  , TIMESTAMP 	: {type:Number}
	});
	mongoose_obj.model('Jobs', JobSchema);
	var Job = mongoose_obj.models.Jobs;

	Job.enqueueJob=function(queue_name,job,params,callback){
		var job_obj = new Job();
		job_obj.CLASS_NAME=job;
		job_obj.QUEUE=queue_name;
		job_obj.PARAMS=params;
		job_obj.STATUS='Q';
		job_obj.HANDLE_BY=0;
		job_obj.TIMESTAMP=(new Date().getTime());
		job_obj.save(function(err,res){
			callback(err,res);
		});
	}

	Job.getNextJobsToDo=function(queue,pid,callback){
		if(queue=="*")
			condition={STATUS:'Q'};
		else
			condition={$and:[{STATUS:'Q'},{QUEUE:queue}]};
		Job.findOneAndUpdate(condition,{$set:{STATUS:'P',HANDLE_BY:pid}},{sort:"TIMESTAMP"},function(err,job){
			if(err) 
				callback(err);
			else if(job!=null)
				callback(null,job);
			else
				callback(null,false);
		});
	}
	this.Job=Job;


	// WORKERS SCHEMA 
	var WorkerSchema = new Schema({
		PID  	: {type: String} 
		, STATUS 	: {type: String}
		, QUEUE 	: {type: String}
	});
	mongoose_obj.model('Worker', WorkerSchema);
	var Worker = mongoose_obj.models.Worker;
	Worker.addNewWorker=function(pid,status,queue){
		var worker = new Worker();
		worker.PID=pid;
		worker.STATUS='F';
		worker.QUEUE=queue;
		worker.save(function(err,result){
		});
	}
	Worker.getFreeWorker=function(queue,callback){
		if(queue!="*")
			condition={$and:{STATUS:'F',QUEUE:queue}};
		else
			condition={STATUS:'F'};
		Worker.find(condition,function(err,data){
			if(err){ callback(err); return;}
			callback(null,data);
		});
	}
	Worker.MarkBusy=function(pid,callback){
		Worker.update({PID:pid},{$set:{STATUS:'B'}},callback);
	}

	Worker.MarkFree=function(pid,callback){
		Worker.update({PID:pid},{$set:{STATUS:'F'}},callback);	
	}
	Worker.ReplaceWorker=function(pid,new_pid,callback){
		Job.update({$and:[{HANDLE_BY:pid},{STATUS:'P'}]},{$set:{STATUS:'Q',HANDLE_BY:0}},function(err,res){});
		Worker.update({PID:pid},{$set:{PID:new_pid,STATUS:'F'}},callback);
	}
	this.Worker=Worker;
}
exports.MongoDB=MongoDB;
*/