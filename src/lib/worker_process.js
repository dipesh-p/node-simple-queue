"use strict"
var path=require('path');
var DB=require(path.resolve('.',__dirname+'/db.js')).DB;
var db={};
var queue="";
process.on('message',function(worker){
	if(typeof worker =="string" && worker=="terminate"){
		db.Worker.RemoveWorkerById(process.pid,function(err,resp){
			process.exit(0);
			return;
		});
	}else{
		queue=worker.queue;
		try{
			db=new DB('MongoDB',worker.db_config);
			setTimeout(checkForJob,2000);
		}catch(e){
			console.log(e);
			process.exit(200);
		}
	}
});
				
function checkForJob(){
	db.Job.getNextJobsToDo(queue,process.pid,function(err,job){
		if(job){
			try{
				db.Worker.MarkBusy(process.pid,function(err,resp){});
				require(path.resolve('./job_handlers',job['CLASS_NAME']+'.js'));
				GLOBAL[job['CLASS_NAME']].perform(job.PARAMS,function(error,success){
					if(success)
						job.remove(function(err,job){});	
					else{
						job.STATUS='E';
						job.ERROR=error;
						job.save(function(err,status){});
					}
					db.Worker.MarkFree(process.pid,function(err,resp){});
					setTimeout(checkForJob,2000);					
				});	
			}catch(e){
				job.STATUS='E';
				job.ERROR=e.toString();
				job.save(function(err,status){});
				db.Worker.MarkFree(process.pid,function(err,resp){});
				setTimeout(checkForJob,2000);
			}
		}else{
			setTimeout(checkForJob,2000);
		}
	});
}