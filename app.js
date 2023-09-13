const Koa = require('koa');
const KoaJson = require('koa-json');
const KoaRouter = require('koa-router');

const app = new Koa();
const json = new KoaJson({ pretty: false, param: 'json-pretty'});
const router = new KoaRouter();

router.get('/', async ctx => ctx.body = { message: 'Hello World' });

app.use(json);
app.use(router.routes())
   .use(router.allowedMethods());

app.listen(3000, () => console.log('Server started...'));
