const { scan, filter, map } = require('rxjs/operators');

/**
 * Creates an RxJS operator that detects statistical anomalies (Z-Score)
 * z = |x - mean| / stdDev
 * @param {Object} config - { zThreshold: number, windowSize: number }
 */
function anomalyDetector(config = {}) {
  const zThreshold = parseFloat(config.zThreshold) || 2.5;
  const windowSize = Math.max(5, parseInt(config.windowSize, 10) || 15);

  return (source$) =>
    source$.pipe(
      scan(
        (acc, item) => {
          const val = typeof item.movingAverage === 'number' ? item.movingAverage : item.value;
          const buffer = [...acc.buffer, val];
          if (buffer.length > windowSize) {
            buffer.shift();
          }

          if (buffer.length < 4) {
            return { buffer, isAnomaly: false, zScore: 0, mean: val, item };
          }

          const mean = buffer.reduce((a, b) => a + b, 0) / buffer.length;
          const variance =
            buffer.reduce((acc, curr) => acc + Math.pow(curr - mean, 2), 0) / buffer.length;
          const stdDev = Math.sqrt(variance);

          const zScore = stdDev > 0 ? parseFloat((Math.abs(val - mean) / stdDev).toFixed(2)) : 0;
          const isAnomaly = zScore >= zThreshold;

          return {
            buffer,
            isAnomaly,
            zScore,
            mean: parseFloat(mean.toFixed(2)),
            item
          };
        },
        { buffer: [], isAnomaly: false, zScore: 0, mean: 0, item: null }
      ),
      filter(({ isAnomaly }) => isAnomaly),
      map(({ zScore, mean, item }) => {
        return {
          ...item,
          anomaly: {
            zScore,
            mean,
            threshold: zThreshold
          },
          _displayValue: `Z-Score: ${zScore} (Mean: ${mean})`
        };
      })
    );
}

module.exports = { anomalyDetector };
