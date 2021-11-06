const APPROACHING_OVER_RATIO = 0.8;

const approachingOver = (current, limit) => {
  const currentRatio = (current / limit).toPrecision(2);
  console.log('currentRatio', currentRatio, current, limit);
  return currentRatio >= APPROACHING_OVER_RATIO || false
}

exports.approachingOver = approachingOver;