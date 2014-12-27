function MongoDB(db_config){
	var mongoose = require('mongoose');	
	mongoose.set('debug', false);
	var mongoose_obj={};

	function ConnectToDB(){
		if(db_config==undefined){
			mongoose_obj=mongoose.createConnection('mongodb://127.0.0.1/node-queue');
		}else{
			mongoose_obj=mongoose.createConnection('mongodb://'+db_config.username+':'+db_config.password+'@'+db_config.host+':'+db_config.port+'/'+db_config.db_name);
		}
	}
	ConnectToDB();

	/* JOBS Schema */
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

	Job.retry=function(job_id,callback){
		var ObjectId = mongoose.Types.ObjectId(job_id);
		Job.update({
		    "_id": ObjectId
		},{$set:{STATUS:'Q'}},function(err,resp){
			callback(err,resp);
		});
	}
	Job.removeJob=function(job_id,callback){
		var ObjectId = mongoose.Types.ObjectId(job_id);
		Job.remove({
		    "_id": ObjectId
		},function(err,resp){
			callback(err,resp);
		});
	}


	this.Job=Job;


	/* WORKERS SCHEMA */
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
	Worker.RemoveWorker=function(queue){
		Worker.remove({QUEUE:queue},function(err,result){
			
		});
	}
	Worker.RemoveWorkerById=function(worker_id,callback){
		Worker.remove({PID:worker_id},function(err,result){
			callback(err,result);
		});
	}
	this.Worker=Worker;
}
exports.MongoDB=MongoDB;
