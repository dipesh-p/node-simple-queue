"use strict"
var DB=require('./db.js').DB;
var db={};
var path=require('path');	
function NodeWorker(db_config){
	try{
		db =new DB('MongoDB',db_config);
		this.startWorkers=function(queue,no_of_workers,JOB_TIMEOUT){
			// workers[queue]=[];
			db.Worker.RemoveWorker(queue);
			for (var i=0;i<no_of_workers;i++){
				var child=require('child_process').fork(__dirname+'/worker_process.js');
				// workers[queue].push(child);
				workers[i]=child;
				db.Worker.addNewWorker(child.pid,'F',queue);
				child.on('exit', function(code,signal) {
					// console.log(code);
					// console.log("Child Exit");
					// console.log(signal);
					if(code!=0){
						console.log("Child Exit");
						var sub_child=restartWorker(queue,child.pid,db_config,i,JOB_TIMEOUT);
						workers[i]=sub_child;
					}
				});
				child.on('error',function(){});
				child.on('close',function(){});

				child.send({queue:queue,db_config:db_config,JOB_TIMEOUT:JOB_TIMEOUT});
			}	
		}
	}catch(e){
		this.error=e;
		throw(e);
	}
}
function restartWorker(queue,pid,db_config,num,JOB_TIMEOUT){
	var new_child=require('child_process').fork(__dirname+'/worker_process.js');
	new_child.on('exit',function(code,signal){
		workers[num]=restartWorker(queue,new_child.pid,db_config,num,JOB_TIMEOUT);
	});
	new_child.send({queue:queue,db_config:db_config,JOB_TIMEOUT:JOB_TIMEOUT});
	db.Worker.ReplaceWorker(pid,new_child.pid,function(err,res){

	});
	return new_child;
}
// process.on('message',function(config){
// 	// var NodeWorker=require(lib+'/node-queue.js').NodeWorker;
// 	console.log("ESSMDMD");
// 	var node_worker=new NodeWorker(config.db_config);
// 	node_worker.startWorkers(config.queue,parseInt(config.no_workers));
// });
exports.NodeWorker=NodeWorker;