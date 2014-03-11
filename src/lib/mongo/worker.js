var Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId;

var WorkerSchema = new Schema({
    PID  	: {type: String} 
  , STATUS 	: {type: String}
  , QUEUE 	: {type: String}
});
mongoose.model('Worker', WorkerSchema);
GLOBAL.Worker = mongoose.models.Worker;

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