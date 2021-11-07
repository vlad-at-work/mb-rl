const express = require('express');
const rateLimiter = require('redis-rate-limiter');
const redis = require('redis');
//rediss://:@:
const redisClient = redis.createClient(16520, 'ec2-54-166-176-119.compute-1.amazonaws.com', { enable_offline_queue: false });
redisClient.auth('p1f546bcc4f65e4ba0b4af2d2f670f8c04960b077e30e9ef12984ca83458a4676', () => { console.log('connected redis')});

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