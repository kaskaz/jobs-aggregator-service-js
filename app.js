const Koa = require('koa');
const KoaJson = require('koa-json');
const KoaRouter = require('koa-router');
const cors = require('@koa/cors');
const sse = require('koa-sse-stream');
const mongo = require('koa-mongo');
const schedule = require('node-schedule');
const axios = require('axios');
const { MongoClient } = require('mongodb');
const { ChangeStream } = require('mongodb');

/**
 * Constants
 */
const DATABASE_JOBS_COLLECTION = 'jobs';
const JOBS_PROVIDER_TYPE_REEDCOUK = 'reed-co-uk';

/**
 * Setup Koa dependencies
 */
const app = new Koa();
const json = new KoaJson({ pretty: false, param: 'json-pretty' });
const router = new KoaRouter();

const mapJobSource = (type) => {
   let source;

   switch (type) {
      case JOBS_PROVIDER_TYPE_REEDCOUK:
      default:
         source = 'reed.co.uk' 
         break;
   }

   return source;
}

const COMMON_AGGREGATE_PIPELINE_FIELDS = [
   { $addFields: { 
      _date: { $dateFromString: { dateString: "$date", format: "%d/%m/%Y" } },
      _expirationDate: { $dateFromString: { dateString: "$expirationDate", format: "%d/%m/%Y" } },
   } }
];

const COMMON_AGGREGATE_PIPELINE = [
   ...COMMON_AGGREGATE_PIPELINE_FIELDS,
   { $sort: { _date: -1, _id: -1 } },
   { $limit: 100 }
];

/**
 * Returns latest 100 posted jobs
 */
router.get('/rest/jobs', ctx => {
   ctx.body = ctx.db
      .collection(DATABASE_JOBS_COLLECTION)
      .aggregate(COMMON_AGGREGATE_PIPELINE)
      .map(job => {
         return {
            id: job._id,
            source: mapJobSource(job.type),
            title: job.jobTitle,
            location: job.locationName,
            company_name: job.employerName,
            posted_at: job._date,
            expires_at: job._expirationDate,
            url: job.jobUrl
         };
      });
});

/**
 * Returns latest 100 posted jobs and all next incoming jobs
 */
router.get('/stream/jobs', ctx => {
   ctx.db
      .collection(DATABASE_JOBS_COLLECTION)
      .aggregate(COMMON_AGGREGATE_PIPELINE)
      .forEach(job => {
         ctx.sse.send(JSON.stringify({
            id: job._id,
            source: mapJobSource(job.type),
            title: job.jobTitle,
            location: job.locationName,
            company_name: job.employerName,
            posted_at: job._date,
            expires_at: job._expirationDate,
            url: job.jobUrl
         }));
      });

   ctx.db
      .collection(DATABASE_JOBS_COLLECTION)
      .watch([
         { $match: { operationType: 'insert' } },
         ...COMMON_AGGREGATE_PIPELINE_FIELDS,
      ])
      .on(ChangeStream.CHANGE, doc => {
         let job = doc.fullDocument;

         ctx.sse.send(JSON.stringify({
            id: job._id,
            source: mapJobSource(job.type),
            title: job.jobTitle,
            location: job.locationName,
            company_name: job.employerName,
            posted_at: job.date,
            expires_at: job.expirationDate,
            url: job.jobUrl
         }));
      });
});

app.use(mongo({ uri: process.env.DATABASE_URI }))
   .use(json)
   .use(sse())
   .use(cors())
   .use(router.routes())
   .use(router.allowedMethods());

/**
 * Setup non Koa dependencies
 */
const mongodb = new MongoClient(process.env.DATABASE_URI);

(() => {
   mongodb.connect()
      .then(client => console.log('Connected to database'))
      .catch(reason => console.log('Could not connect to database', reason))
})();

/**
 * Schedulers
 */
schedule.scheduleJob(JOBS_PROVIDER_TYPE_REEDCOUK, '* * * * *', () => {
   console.log('Calling reed.co.uk');

   axios
      .get('https://www.reed.co.uk/api/1.0/search', {
         auth: {
            username: process.env.JOBS_PROVIDER_REEDCOUK_API_KEY,
            password: ''
         }
      })
      .then(res => {
         res.data.results.forEach(async entry => {
            await mongodb
               .db()
               .collection(DATABASE_JOBS_COLLECTION)
               .updateOne(
                  { 'jobId': entry.jobId },
                  { $set: { type: JOBS_PROVIDER_TYPE_REEDCOUK, ...entry }},
                  { upsert: true }
               )
         });
      })
      .catch(err => console.error('Failed to call reed.co.uk', err));
});

/**
 * Server initialization
 */
app.listen(
   process.env.SERVER_PORT,
   () => console.log(`Server started at port ${process.env.SERVER_PORT}`)
);
