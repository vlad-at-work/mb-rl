const express = require('express');
const rateLimiter = require('redis-rate-limiter');
const redis = require('redis');
const utils = require('./utils/misc');

const app = express();

let limit;
const redisClient = redis.createClient(16519, 'ec2-54-166-176-119.compute-1.amazonaws.com', { enable_offline_queue: false, reconnect_attempts: 10 });
redisClient.auth('p1f546bcc4f65e4ba0b4af2d2f670f8c04960b077e30e9ef12984ca83458a4676', () => { 
  console.log('connected redis')
});

limit = rateLimiter.create({
  redis: redisClient,
  key: 'ip', // function(x) { return x.headers['user-agent']; },
  rate: '10/minute'
});

app.get('/check', (req, res) => {
  limit(req, function(err, rate) {
    if (err) {
      console.log(err);
      res.send(500);
    } else {
      res.json({
        demoIp: req.connection.remoteAddress,
        approachingOver: utils.approachingOver(rate.current, rate.limit),
        current: rate.current,
        over: rate.over
      });
    };
  });
});

app.get('/flushall', (req, res) => {
  res.send(redisClient.flushall());
})

app.listen(process.env.PORT || 3000, () => { console.log('started')})