const { scan, map } = require('rxjs/operators');

/**
 * Creates an RxJS operator for moving average computation
 * Maintains a sliding window of the last `windowSize` numeric values
 * @param {Object} config - { windowSize: number, field: string }
 */
function movingAverage(config = {}) {
  const windowSize = Math.max(1, parseInt(config.windowSize, 10) || 5);
  const targetField = config.field || 'value';

  return (source$) =>
    source$.pipe(
      scan(
        (acc, item) => {
          const val = typeof item[targetField] === 'number' ? item[targetField] : item.value;
          const buffer = [...acc.buffer, val];
          if (buffer.length > windowSize) {
            buffer.shift();
          }

          const sum = buffer.reduce((a, b) => a + b, 0);
          const avg = parseFloat((sum / buffer.length).toFixed(2));
          const min = parseFloat(Math.min(...buffer).toFixed(2));
          const max = parseFloat(Math.max(...buffer).toFixed(2));

          return {
            buffer,
            currentAvg: avg,
            min,
            max,
            item
          };
        },
        { buffer: [], currentAvg: 0, min: 0, max: 0, item: null }
      ),
      map(({ buffer, currentAvg, min, max, item }) => {
        return {
          ...item,
          movingAverage: currentAvg,
          windowSize: buffer.length,
          maxWindowSize: windowSize,
          stats: {
            min,
            max,
            sampleCount: buffer.length
          },
          _computedBy: 'movingAverage',
          _displayValue: `${currentAvg} (window: ${buffer.length}/${windowSize})`
        };
      })
    );
}

module.exports = { movingAverage };
