"use strict"
var path=require('path');
var db=require(path.resolve('.',__dirname+'/db.js'));
var queue="";
process.on('message',function(worker){
	queue=worker.queue;

	try{
		db.ConnectToDB(worker.db_config);
		setTimeout(checkForJob,2000);
	}catch(e){
		console.log(e);
		process.exit(200);
	}
});

function checkForJob(){
	Job.getNextJobsToDo(queue,process.pid,function(err,job){
		if(job){
			try{
				require(path.resolve('.',job['CLASS_NAME']+'.js'));
				GLOBAL[job['CLASS_NAME']].perform(job.PARAMS,function(error,success){
					if(success)
						job.remove(function(err,job){});	
					else{
						job.STATUS='E';
						job.ERROR=error;
						job.save(function(err,status){});
					}
					setTimeout(checkForJob,2000);					
				});	
			}catch(e){
				job.STATUS='E';
				job.ERROR=e.toString();
				job.save(function(err,status){});
				setTimeout(checkForJob,2000);
			}
		}else{
			setTimeout(checkForJob,2000);
		}
	});
}