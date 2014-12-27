"use strict"
var DB=require('./db.js').DB;
var db={};
var path=require('path');
// var running = require('is-running');
function NodeQueue(db_config){
	try{
		db =new DB('MongoDB',db_config);
		this.enqueueJob=function(queue_name,job,params,callback){
			db.Job.enqueueJob(queue_name,job,params,function(err,res){
				if(callback) callback(err,res);
			});
		}
	}catch(e){
		this.error=e;
		throw(e);
	}
}

function NodeQueueWeb(db_config){
	try{
		db =new DB('MongoDB',db_config);
	}catch(e){
		this.error=e;
		throw(e);
	}
}

NodeQueueWeb.prototype.route=function(req,res){
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
		case 'retryJob':
			retry_job(req,res);
			break;
		case 'removeJob':
			remove_job(req,res);
			break;	
		default:
			render_html(req, res);
			break;
	}
}
function render_html(req, res){
	var fs = require('fs');
	fs.readFile(__dirname + '/views/node_queue_web/node_queue.txt', 'utf8', function (err,data) {
		res.send(data);
	});
}

function retry_job(req,res){
	db.Job.retry(req.query.job_id,function(err,resp){
		res.send({status:'success'});
	});
}
function remove_job(req,res){
	db.Job.removeJob(req.query.job_id,function(err,resp){
		res.send({status:'success'});
	});
}


function jobs_overview(req, res){
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
		if(err)
			res.send({status: 'failure'});
		else
			res.send({status: 'success', data: jobs});
	});
}

function workers_list(req, res){
	db.Worker.find({}, function(err, workers){
		if(err)
			res.send({status: 'failure'});
		else
			res.send({status: 'success', data: workers});
	})
}

exports.NodeQueue=NodeQueue;
exports.NodeQueueWeb=NodeQueueWeb;