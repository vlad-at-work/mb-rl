let app = require('./app');
const async = require('async');
const _ = require('lodash');
const supertest = require("supertest");

jest.mock('redis', () => jest.requireActual('redis-mock'));

const LIMIT_THRESHOLD = 11;
const WARNING_THRESHOLD = 8;

const testRequest = function (cb) { supertest(app).get('/check').expect(200, cb) };

beforeEach(() => {
  app = require('./app');
  jest.resetAllMocks();
  jest.resetModules();
});

describe('/check smoke tests', () => {
  it('should report current count as 1 on first request', (done) => {
    supertest(app).get('/check')
      .expect(200)
      .then((response) => {
        console.log(response.body);
        expect(response.body.current).toBe(1);
        done();
      });
  });
  it('should report approachingOver flag as false on first request', (done) => {
    supertest(app).get('/check')
      .expect(200)
      .then((response) => {
        console.log(response.body);
        expect(response.body.approachingOver).toBe(false);
        done();
      });
  });
  it('should report over limit flag as false on first request', (done) => {
    supertest(app).get('/check')
      .expect(200)
      .then((response) => {
        console.log(response.body);
        expect(response.body.over).toBe(false);
        done();
      });
  });
});

describe('/check limiter tests', () => {
  it('should report incremented value on multiple requests', (done) => {
    const EXPECTED_COUNT = 3;

    async.series([
      testRequest,
      testRequest,
      testRequest
    ], (err, results) => {
      if (err) console.error(err);

      const lastResponse = _.last(results).body;
      expect(
        lastResponse.current
      ).toBe(EXPECTED_COUNT);

      done();
    });

  });
  it('should report a warning when approaching the rate limit', (done) => {
    const functionList = [...Array(WARNING_THRESHOLD)].fill(testRequest);

    async.series(functionList, (err, results) => {
      if (err) console.error(err);

      const lastResponse = _.last(results).body;
      expect(lastResponse.approachingOver).toBe(true);

      done();
    });

  });
  it('should report limit reached when over the limit', (done) => {
    const functionList = [...Array(LIMIT_THRESHOLD)].fill(testRequest);

    async.series(functionList, (err, results) => {
      if (err) console.error(err);

      const lastResponse = _.last(results).body;
      expect(lastResponse.over).toBe(true);

      done();
    });

  });
})