"use strict"
var path=require('path');
var DB=require(path.resolve('.',__dirname+'/db.js')).DB;
var db={};
var queue="";
var JOB_TIMEOUT=120000;
process.on('message',function(worker){
	if(typeof worker =="string" && worker=="terminate"){
		db.Worker.RemoveWorkerById(process.pid,function(err,resp){
			process.exit(0);
			return;
		});
	}else{
		queue=worker.queue;
		try{
			if(worker.JOB_TIMEOUT){
				JOB_TIMEOUT=worker.JOB_TIMEOUT;
			}
			db=new DB('MongoDB',worker.db_config);
			enqueueStoppedJobs();
			setTimeout(checkForJob,2000);
		}catch(e){
			console.log(e);
			process.exit(200);
		}
	}
});

function enqueueStoppedJobs(){
	db.Job.getStuckedJobs(JOB_TIMEOUT,function(err,jobs){
		if(!err){
			for(var key in jobs){
				db.Job.retry(jobs[key]._id,function(error,resp){});
			}
		}
	});
}
function checkForJob(){
	db.Job.getNextJobsToDo(queue,process.pid,function(err,job){
		if(job){
			try{
				db.Worker.MarkBusy(process.pid,function(err,resp){});
				require(path.resolve('./job_handlers',job['CLASS_NAME']+'.js'));
				var jobTimeout=setInterval(function(){
					console.log('Timedout');
					job.STATUS='E';
					job.ERROR='JOB_TIMED_OUT';
					job.save(function(err,status){
						process.exit(200);
					});
				},JOB_TIMEOUT);
				GLOBAL[job['CLASS_NAME']].perform(job.PARAMS,function(error,success){
					if(success)
						job.remove(function(err,job){});	
					else{
						job.STATUS='E';
						job.ERROR=error;
						job.save(function(err,status){});
					}
					db.Worker.MarkFree(process.pid,function(err,resp){});
					clearInterval(jobTimeout);
					jobTimeout=null;
					setTimeout(checkForJob,500);
				});	
			}catch(e){
				job.STATUS='E';
				console.log('dd');
				job.ERROR=e.toString();
				job.save(function(err,status){});
				db.Worker.MarkFree(process.pid,function(err,resp){});
				setTimeout(checkForJob,500);
			}
		}else{
			setTimeout(checkForJob,2000);
		}
	});
}