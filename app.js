const Koa = require('koa');
const KoaJson = require('koa-json');
const KoaRouter = require('koa-router');
const schedule = require('node-schedule');
const axios = require('axios');
const mongo = require('koa-mongo');
const { MongoClient } = require('mongodb');

/**
 * Setup Koa dependencies
 */
const app = new Koa();
const json = new KoaJson({ pretty: false, param: 'json-pretty' });
const router = new KoaRouter();

router.get('/', async ctx => ctx.body = { message: 'Hello World' });

app.use(mongo({ uri: process.env.DATABASE_URI }))
   .use(json)
   .use(router.routes())
   .use(router.allowedMethods());

/**
 * Setup non Koa dependencies
 */
const mongodb = new MongoClient(process.env.DATABASE_URI);

(async () => {
   await mongodb.connect();
   console.log('Connected to database');
})();

/**
 * Schedulers
 */
schedule.scheduleJob('reed-co-uk', '* * * * *', () => {
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
               .collection('jobs')
               .updateOne(
                  { 'jobId': entry.jobId },
                  { $set: { type: 'reed-co-uk', ...entry }},
                  { upsert: true }
               )
         });
      })
      .catch(err => console.error('Failed to call reed.co.uk', err));
});

/**
 * Server initialization
 */
app.listen(3000, () => console.log('Server started...'));
