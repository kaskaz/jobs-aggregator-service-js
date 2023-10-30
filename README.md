# Jobs Aggregator Service in JavaScript

## Requirements
Besides Node and NPM for development and runtime, it also requires to rename the file _.env-sample_ to _.env_ and fill the missing values.

Here is a list of values to provide:

  * **DATABASE_URI** - This service is using _MongoDB Change Streams_ which requires a database working as a [Replica Set or Sharded Cluster](https://www.mongodb.com/docs/manual/changeStreams/#availability). You can start the database provided in the [infrastructure repository](https://github.com/kaskaz/jobs-aggregator-infrastructure) an use the default  URI value.

  * **JOBS_PROVIDER_REEDCOUK_API_KEY** - For provider _reed.uk.co_ register [here](https://www.reed.co.uk/developers/jobseeker) to get an API key.


## How to run

* Develop mode
> npm run dev

* Using Docker
> docker build -t ja-service-js .

> docker run -p 3000:3000 -d --name ja-service-js ja-service-js
