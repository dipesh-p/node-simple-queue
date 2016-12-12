node-simple-queue
==========

A simple queue for NodeJS, with usage similar to Resque in RoR

### Install pm2 globally
```node
 npm install pm2 -g
```

### Installing module in Node Applicaiton

```node
 npm install node-simple-queue
```

### Introduction

Application sometimes require to do some job later. Node Simple Queue is a really simple way to manage a job that application needs to do in background.

### Folder Structure from parent directory

```
├─ config/
│   ├── environments
│   │   ├── development.js
│   │   ├── dev.js
│   │   ├── production.js
│   │   ├── staging.js
│   ├── job_handlers
│   │   ├── TestClass.js
```

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
$> NODE_ENV=environments/development pm2 start node_modules/node-simple-queue/bin/node-simple-queue -i 2 -- -a QUEUE=Queue1,Queue2,Queue3 [options]

```
**Options available are as follows:**
QUEUE - Name of the queue.
DB_CONFIG - Its the name of configuration in your configuration JSON, if this parameter is passed, then you need to have **NODE_ENV.js** file in **config** folder.
PID - Path where process ids need to be stored, it is optional.
JOB_TIMEOUT - It is the time after which if job is running then, it will stop that job and mark it for error, it is in milliseconds Default: 60000.

* **To Start worker without priority :** 

```NODE_ENV=environments/development pm2 start node_modules/node-simple-queue/bin/node-simple-queue -i 2 -- -a QUEUE=Queue1,Queue2,Queue3 DB_CONFIG=db_config JOB_TIMEOUT=120000```

- Description: 
	- Create development.js file inside config/environments folder. 
```node
		module.exports = {
		    "db_config": {
		        "username": "",
        		"name": "",
		        "host": "127.0.0.1",
		        "port": "27017",
		        "db_name": "node-queue"
		    }
		}
```
	- It will create 2 instance of node-simple-queue for Queue1,Queue2,Queue3,DB_CONFIG,JOB_TIMEOUT passed as arguments
	- -i 2 : Start 2 instances of application in cluster mode


* **To Start worker with priority :** 

```pm2 start node_modules/node-simple-queue/bin/node-simple-queue -i 2 -- -a QUEUE=Queue1:153,Queue2:5,Queue3:67 DB_CONFIG=db_config JOB_TIMEOUT=120000```

- Description:
	- node-simple-queue process job based on queue priority.


* **To Start worker with priority of some queue :** 

```pm2 start node_modules/node-simple-queue/bin/node-simple-queue -i 2 -- -a QUEUE=Queue1,Queue2:10,Queue3 DB_CONFIG=db_config JOB_TIMEOUT=120000```

- Description:
	- It will assign same priority to Queue1 and Queue3 and take jobs of Queue2 first, Queue1 second and Queue3 third

* **Error occur if worker parameter not passed properly :** 

```pm2 start node_modules/node-simple-queue/bin/node-simple-queue -i 2 -- -a DB_CONFIG=db_config JOB_TIMEOUT=120000```

- Description:
	- If Queue name is not defined then it will not start worker

* **To stop worker :** 

	- Syantax : ```pm2 stop [worker id]```
	- Command : ```pm2 stop 5```


* **To restart worker :** 

	- Syantax : ```pm2 restart [worker id]```
	- Command : ```pm2 restart 5```


* **To scale(increase) worker :** 

	- Syantax : ```pm2 scale [appname] No. of worker```
	- Command : ```pm2 scale myAppp 10```
	- Description : It will create 10 worker of myApp


	- Command : ```pm2 scale myAppp +3```
	- Description : It will add 3 worker of myApp 

* **To delete all worker :** 

	- Syantax : ```pm2 delete [worker id]```
	- Command : ```pm2 delete 5```
	- Description : It will delete worker of id 5

	- Command : ```pm2 delete all```
	- Description : It will delete alll worker

* **For Pm2 help :** 

	- Command : ```pm2 -h```
	- Description : It will show all the command and option list of pm2


That's all you have to do for starting the Workers
