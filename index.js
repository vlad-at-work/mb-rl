const express = require('express');
const rateLimiter = require('redis-rate-limiter');
const redis = require('redis');
const redisClient = redis.createClient(6379, 'localhost', { enable_offline_queue: false });

const utils = require('./utils/misc');

const app = express();

const limit = rateLimiter.create({
  redis: redisClient,
  key: 'ip',
  rate: '10/minute'
});

app.get('/check', (req, res) => {
  limit(req, function(err, rate) {
    if (err) {
      console.warn('Rate limiting not available');
    } else {
      const responsePayload = {
        approachingOver: utils.approachingOver(rate.current, rate.limit),
        current: rate.current,
        over: rate.over,
      };
      if (responsePayload.approachingOver && !responsePayload.over) {
        console.error('--> approaching the limit!');
      }
      if (responsePayload.over) {
        console.error('too many requesets!');
        res.status(429, 'too many requests');
      }
    }
  });
  res.send(200, 'OK');
});

app.listen(process.env.PORT || 3000, () => console.log("starting!"));