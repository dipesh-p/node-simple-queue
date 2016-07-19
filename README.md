node-simple-queue
==========

A simple queue for NodeJS, with usage similar to Resque in RoR


### Installing module in Node Applicaiton

```node
$> npm install node-simple-queue
```

### Introduction

Application sometimes require to do some job later. Node Simple Queue is a really simple way to manage a job that application needs to do in background.

To define some job you want to perform later, you need to define the job, job is a simple Javascript class that has `perform` method:

```node
TestClass.js
------------
var TestJob=function(){}
TestJob.perform=function(data,done){
	.....
	....
	done(null,true) // if your job is successful
	done(err)  // if your job fails
}
GLOBAL.TestJob=TestJob;
``` 

Next we need to put the job on the queue

```node
var NodeQueue=require('node-simple-queue').NodeQueue;
var queue=new NodeQueue();
queue.enqueueJob('Queue1','TestJob',{number:1});
```
in the above snippet of code you need to create the instance of `NodeQueue` class and then call `enqueueJob(queue,job_class_name,data)` method. Below are the 3 parameters of the function

```node
->queue 			: Name of the queue in which you need to put this job
->job_class_name	: Name of the Job Class (String)
->data				: Data that you need to pass to perform method of your job class. Data can be String or JSON Object.
```

Simple! This will be stored in MongoDB. 

Now we can start up a worker to grab some work off of the queue and do the work:

```node
$> cd <to-your-project>
$> node_modules/node-simple-queue/bin/node-worker start/stop QUEUE=Queue1 [options]
```
**Options available are as follows:**
QUEUE - Name of the queue.
DB_CONFIG - Its the name of configuration in your configuration JSON, if this parameter is passed, then you need to have **NODE_ENV.js** file in **config** folder.
WORKERS - No of worker process to start. Default:1.
PID - Path where process ids need to be stored, it is optional.
JOB_TIMEOUT - It is the time after which if job is running then, it will stop that job and mark it for error, it is in milliseconds Default: 60000.

That's all you have to do for starting the Workers to work on 'Queue1' with 4 workers