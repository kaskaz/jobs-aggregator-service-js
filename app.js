const Koa = require('koa');
const KoaJson = require('koa-json');
const KoaRouter = require('koa-router');
const schedule = require('node-schedule');
const axios = require('axios');

const app = new Koa();
const json = new KoaJson({ pretty: false, param: 'json-pretty'});
const router = new KoaRouter();

router.get('/', async ctx => ctx.body = { message: 'Hello World' });

app.use(json)
   .use(router.routes())
   .use(router.allowedMethods());

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
      .then(res => console.log(JSON.stringify(res.data)))
      .catch(err => console.error('Failed to call reed.co.uk', err));
});

app.listen(3000, () => console.log('Server started...'));
