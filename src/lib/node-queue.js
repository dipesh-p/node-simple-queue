"use strict"
var DB=require('./db.js').DB;
var db={};
var path=require('path');

function NodeQueue(db_config){
	try{
		db =new DB('MongoDB',db_config);
		this.enqueueJob=function(queue_name,job,params){
			db.Job.enqueueJob(queue_name,job,params,function(err,res){
			});
		}
	}catch(e){
		this.error=e;
		throw(e);
	}
}

function NodeWorker(db_config){
	try{
		db =new DB('MongoDB',db_config);
		this.startWorkers=function(queue,no_of_workers){
			// workers[queue]=[];
			for (var i=0;i<no_of_workers;i++){
				var child=require('child_process').fork(__dirname+'/worker_process.js');
				// workers[queue].push(child);
				db.Worker.addNewWorker(child.pid,'F');
				child.on('exit', function(code) {
					restartWorker(queue,child.pid,db_config);
				});
				child.send({queue:queue,db_config:db_config});
			}	
		}
	}catch(e){
		this.error=e;
		throw(e);
	}
}
function restartWorker(queue,pid,db_config){
	var new_child=require('child_process').fork(__dirname+'/worker_process.js');
	new_child.on('exit',function(code){
		restartWorker(queue,new_child.pid,db_config);
	});
	new_child.send({queue:queue,db_config:db_config});
	db.Worker.ReplaceWorker(pid,new_child.pid,function(err,res){

	});
}
exports.NodeWorker=NodeWorker;
exports.NodeQueue=NodeQueue;