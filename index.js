const express = require('express');
const rateLimiter = require('redis-rate-limiter');
const redis = require('redis');
const redisClient = redis.createClient(6379, 'localhost', { enable_offline_queue: false });

const utils = require('./utils/misc');

const app = express();

const limit = rateLimiter.create({
  redis: redisClient,
  key: 'ip', // function(x) { return x.headers['user-agent']; },
  rate: '10/minute'
});

app.get('/check', (req, res) => {
  limit(req, function(err, rate) {
    if (err) {
      res.send(500);
    } else {
      res.json({
        approachingOver: utils.approachingOver(rate.current, rate.limit),
        current: rate.current,
        over: rate.over,
      });
    };
  });
});

app.listen(process.env.PORT || 3000, () => console.log('\n\tStarted!'));