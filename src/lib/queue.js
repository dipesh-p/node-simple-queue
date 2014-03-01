mongoose = require('mongoose');	
mongoose.set('debug', true);
function InitQueue(queue_config,db_config){
	console.log("Queue : "+queue_config.queue_name + "-- Started");
	if(db_config==undefined){
		mongoose.connect('mongodb://127.0.0.1/node-queue');
	}
	var path=require('path');
	require(path.resolve('.','node_modules/node-queue/lib/worker.js'));

	var that =this;
	var queue_name=queue_config.queueName;
	var no_of_workers=queue_config.workers;
	var workers=[];
	for (var i=0;i<no_of_workers;i++){
		var child=require('child_process').fork('node_modules/node-queue/lib/worker_process.js');
		workers.push(child);
		Worker.addNewWorker(child.pid,'F');
	}
	setTimeout(checkForJob, 5000);
	function checkForJob(){
		console.log("Check For Job");
		
		var jobs=[];
		jobs.push({__CLASS_NAME__:'TestClass',__DATA__:{job:'Job1'}});
		jobs.push({__CLASS_NAME__:'TestClass',__DATA__:{job:'Job2'}});
		jobs.push({__CLASS_NAME__:'TestClass',__DATA__:{job:'Job3'}});
		jobs.push({__CLASS_NAME__:'TestClass',__DATA__:{job:'Job4'}});
		jobs.push({__CLASS_NAME__:'TestClass',__DATA__:{job:'Job5'}});

		var async = require('async');

		async.whilst(function(){
			return jobs.length>0;
		},function(next){
			var job=jobs.pop();
			GetWorkerForJob(job,function(err,success){
				if(err){
					console.log(err);
					jobs.push(job);
					next();
				}else{
					next();
				}
			})
		},function(err){
			//setTimeout(checkForJob,10000);	
		});
		
		
	}

	function GetWorkerForJob(job,callback){
		console.log("Get worker for job");
		console.log(job);
		var async = require('async');
		var workerfound=false;
		async.until(function(){
			return workerfound==true;
		},
		function(next){
			Worker.getFreeWorker(function(err,data){
				if(err){
					setTimeout(next,5000);
				}else{
					if(data.length>0){
						Worker.MarkBusy(data[0].PID,function(err,success){
							for(var key in workers){
								if(workers[key].pid==data[0].PID){
									workers[key].send(job);
								}
							}	
							workerfound=true;
							next();
						});
					
					}else{
						setTimeout(next, 5000);
					}
				}
			});
		},
		function(err){
			if(err) callback(err);
			else
				callback(null,true);
		});
			
	}
}

process.on('message',function(msg){
	InitQueue(msg.QueueConfig,msg.DBConfig);
});

exports.Queue=InitQueue;