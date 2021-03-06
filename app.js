const express = require('express');
const rateLimiter = require('redis-rate-limiter');
const redis = require('redis');
const redisClient = redis.createClient(6379, 'localhost', { enable_offline_queue: false });

const utils = require('./utils/misc');

const app = express();

const limit = rateLimiter.create({
  redis: redisClient,
  key: function(x) { return x.headers['Authorization']; },
  rate: '10/minute'
});

app.get('/check/:slug', (req, res) => {
  limit(req, function(err, rate) {
    if (err) {
      console.log(err);
      res.send(500);
    } else {
      res.json({
        approachingOver: utils.approachingOver(rate.current, rate.limit),
        current: rate.current,
        over: rate.over
      });
    };
  });
});

module.exports = app;