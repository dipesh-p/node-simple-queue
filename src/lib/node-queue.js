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

exports.NodeQueueWeb=function(req,res, db_config){
	db = new DB('MongoDB');
	var action = req.query.page;
	switch(action){
		case 'first':
			jobs_overview(req, res);
			break;
		case 'jobs':
			jobs_list(req, res);
			break;
		case 'workers':
			workers_list(req, res);
			break;
		default:
			render_html(req, res);
			break;
	}

};

function render_html(req, res){
	var fs = require('fs');
	fs.readFile(__dirname + '/views/node_queue_web/node_queue.txt', 'utf8', function (err,data) {
		res.send(data);
	});
}

function jobs_overview(req, res){
	console.log("TEST DATA");
	db = new DB('MongoDB');
	var group = {
	   key: {QUEUE:1, STATUS: 1},
	   cond: {},
	   reduce: function(curr,result) { result.count++;},
	   initial: {count: 0}
	};
	db.Job.collection.group(group.key, group.cond, group.initial, group.reduce, true, true, function(err, results) {
		if(err){
			res.send({status: 'failure'});
		} else {
			res.send({status: 'success', data: results});
		}
	});
}


function jobs_list(req, res){
	var queue_id = req.query.queue_id;
	var status = req.query.status;

	db.Job.find({QUEUE: queue_id, STATUS: status}, function(err, jobs){
		console.log(jobs);
		if(err)
			res.send({status: 'failure'});
		else
			res.send({status: 'success', data: jobs});
	})
}

function workers_list(req, res){
	db.Worker.find({}, function(err, workers){
		if(err)
			res.send({status: 'failure'});
		else
			res.send({status: 'success', data: workers});
	})
}

exports.NodeWorker=NodeWorker;
exports.NodeQueue=NodeQueue;