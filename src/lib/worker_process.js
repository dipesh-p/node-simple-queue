"use strict"
var path = require('path');
var DB = require(path.resolve('.', __dirname + '/db.js')).DB;
var db = {};
var queue = "";
var JOB_TIMEOUT = 120000;
/*process.on('message', function (worker) {
 console.log('In worker process process message');
 if (typeof worker == "string" && worker == "terminate") {

 db.Worker.RemoveWorkerById(process.pid, function (err, resp) {
 console.log('\nWorker removed and ready to exit');
 process.exit(0);
 return;
 });
 } else {
 queue = worker.queue;
 try {
 if (worker.JOB_TIMEOUT) {
 JOB_TIMEOUT = worker.JOB_TIMEOUT;
 }
 db = new DB('MongoDB', worker.db_config);
 enqueueStoppedJobs();
 setTimeout(checkForJob, 2000);
 } catch (e) {
 console.log(e);
 process.exit(200);
 }
 }
 });*/


/**
 * @desc Start worker process
 * @param worker
 * @constructor
 */
function WorkerProcess(worker) {
    console.log('In worker process process message');

    queue = worker.queue;
    try {
        if (worker.JOB_TIMEOUT) {
            JOB_TIMEOUT = worker.JOB_TIMEOUT;
        }
        db = new DB('MongoDB', worker.db_config);
        enqueueStoppedJobs();
        setTimeout(checkForJob, 2000);
    } catch (e) {
        console.log(e);
        process.exit(200);
    }
};
/**
 * @desc enqueue stopped jobs
 */
function enqueueStoppedJobs() {
    db.Job.getStuckedJobs(JOB_TIMEOUT, function (err, jobs) {
        if (!err) {
            for (var key in jobs) {
                db.Job.retry(jobs[key]._id, function (error, resp) {
                });
            }
        }
    });
}

/**
 * @desc Recursion function to check for new job
 */
function checkForJob() {

    // Get jobs from db
    db.Job.getNextJobsToDo(queue, process.pid, function (err, job) {
        // If new jobs found then process else wait for the job
        if (job) {
            console.log('Found New Job : ' + JSON.stringify(job));
            console.log('Queue : ' + queue);
            try {
                db.Worker.MarkBusy(process.pid, function (err, resp) {
                });
                require(path.resolve('./job_handlers', job['CLASS_NAME'] + '.js'));
                var jobTimeout = setInterval(function () {
                    job.STATUS = 'E';
                    job.ERROR = 'JOB_TIMED_OUT';
                    console.log('Job Time Out');
                    // If job takes more time than worker then mark job as error and make worker free
                    job.save(function (err, status) {
                        db.Worker.RemoveWorkerByPID(process.pid, function () {
                            process.exit(200);
                        });
                    });
                }, JOB_TIMEOUT);
                console.log('Job Executed by worker : ' + process.pid)

                //Execute perform method of custom class
                GLOBAL[job['CLASS_NAME']].perform(job.PARAMS, function (error, success) {
                    if (success) {
                        job.remove(function (err, job) {
                        });
                    }
                    else {
                        job.STATUS = 'E';
                        job.ERROR = error;

                        console.log('Error occur while processing job : ' + error);
                        job.save(function (err, status) {
                            db.Worker.RemoveWorkerByPID(process.pid, function () {
                                process.exit(200);
                            });
                        });
                    }
                    db.Worker.MarkFree(process.pid, function (err, resp) {
                    });
                    clearInterval(jobTimeout);
                    jobTimeout = null;
                    setTimeout(checkForJob, 500);
                });
            } catch (e) {
                console.log(e);
                job.STATUS = 'E';
                job.ERROR = e.toString();
                console.log('Exception occur while processing job : ' + e.toString());

                job.save(function (err, status) {
                });
                db.Worker.MarkFree(process.pid, function (err, resp) {
                });
                setTimeout(checkForJob, 500);
            }
        } else {
            setTimeout(checkForJob, 2000);
        }
    });
}


exports.WorkerProcess = WorkerProcess;
