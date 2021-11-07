# Rate Limiter Service

## Description

### Approach

I figured there are two main pieces to a rate limiter service: the limiter implementation itself and the service aspect of the project.

Working off the assumption that the *service* piece is more important than any specific impmlementation, my first instinct when hearing "rate limiter" was to reach for Redis. I ended up using the Redis-backed `redis-rate-limiter` [module](https://github.com/Tabcorp/redis-rate-limiter) which uses a *fixed-window* rate limiting algorithm (though not the only one in existence, seemed appropriate for a MVP)

As a MVP, the `express`-backed node server exposes a single `GET` endpoint `/check`. At the moment, the app is configured to use the incoming IP as a key to keep track of activity / rate. `redis-rate-limiter` library provides a flexible way to configure this as per the challenge's requirements: anything provided in the `request` can be used as a key. The rate is hardcoded in a format consumable by `moment` (eg: `10/minute` or `5/second` - more on this later)

The service responds with a JSON object containing the information about the particular key and its rate/limit data, including a boolean indicating if the ratio of visits to limit is over 80%.

### Why Redis

Even before looking into existing javascript/node rate limiters I figured Redis would be a good option owing to its stability, IO performance and handy baked-in TTL features.

### Configuration & Multiple Limiters

At the moment the maximum rate value is hardcoded and the app only exposes one route as a proof of concept. This is only useful if there's only one source for which the rate limiter would be used. Assuming multiple services, I'd change the app like so:

* Store rates for each individual user of the API in a config file of some sort
* Refactor the route to accept a slug

In other words, if a service `morningbrewTV` sends a request to `/check/:slug`, the app would use a separate, configured instance of `redis-rate-limiter` to handle the responde. Example `config.js`:

```
{
  mbTV: {
    //redis: redisClient, --> reusing the same DB
    key: function (x) { return req.params.slug + ':' + x.headers['Authorization']; }, // now tracking unique slug + auth token
    rate: '10/hour' // 10 videos per hour
  }
}
```

**This way, every requesting entity would have their own rate limiting "strategy" (possibly more than one) which lives in the same Redis DB as others.**

This approach lets the requesting entities decide what to do with the data (serve code 429?) and only concerns itself with mediating between entities and Redis, which is doing the majority of heavy lifting.

### Performance & Security

Realistically, Redis is only limited by memory size and reads/writes should happen in constant time. With that said, the service should not be accessible externally as it would be possible to flood it with random data (eventually)

Another approach could be setting up an environment `API_KEY` that's shared between apps.