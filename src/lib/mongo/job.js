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
mongoose.model('Jobs', JobSchema);
GLOBAL.Job = mongoose.models.Jobs;

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