"use strict"
var db=require('./db.js');
var path=require('path');

function NodeQueue(db_config){
	try{
		db.ConnectToDB(db_config);
		require('job.js');
		this.enqueueJob=function(queue_name,job,params){
			Job.enqueueJob(queue_name,job,params,function(err,res){

			});
		}
	}catch(e){
		this.error=e;
		throw(e);
	}
}

function NodeWorker(db_config){
	try{

		db.ConnectToDB(db_config);
		this.startWorkers=function(queue,no_of_workers){
			// workers[queue]=[];
			for (var i=0;i<no_of_workers;i++){
				var child=require('child_process').fork(__dirname+'/worker_process.js');
				// workers[queue].push(child);
				Worker.addNewWorker(child.pid,'F');
				child.on('exit', function(code) {
					restartWorker(queue,child.pid);
				});
				child.send({queue:queue,db_config:db_config});
			}	
		}
	}catch(e){
		this.error=e;
		throw(e);
	}
}
function restartWorker(queue,pid){
	var new_child=require('child_process').fork(__dirname+'/worker_process.js');
	new_child.on('exit',function(code){
		restartWorker(queue,new_child.pid);
	});
	new_child.send({queue:queue,db_config:db_config});
	Worker.ReplaceWorker(pid,new_child.pid,function(err,res){

	});
}
exports.NodeWorker=NodeWorker;
exports.NodeQueue=NodeQueue;