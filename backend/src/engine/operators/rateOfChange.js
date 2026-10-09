const { scan, filter, map } = require('rxjs/operators');

/**
 * Creates an RxJS operator that calculates rate of change (derivative / spike detection)
 * delta = (v_now - v_prev) / dt_seconds
 * @param {Object} config - { maxRate: number, condition: '>' | '<' }
 */
function rateOfChange(config = {}) {
  const maxRate = parseFloat(config.maxRate) || 5.0;
  const condition = config.condition || '>';

  return (source$) =>
    source$.pipe(
      scan(
        (acc, item) => {
          const now = item.timestamp ? new Date(item.timestamp).getTime() : Date.now();
          const val = typeof item.movingAverage === 'number' ? item.movingAverage : item.value;

          if (!acc.prevItem) {
            return { prevItem: item, prevTime: now, prevVal: val, rate: 0, passed: false, item };
          }

          const dt = (now - acc.prevTime) / 1000; // in seconds
          const dVal = val - acc.prevVal;
          const rate = dt > 0 ? parseFloat((dVal / dt).toFixed(2)) : 0;

          const passed = condition === '>' ? Math.abs(rate) > maxRate : Math.abs(rate) < maxRate;

          return {
            prevItem: item,
            prevTime: now,
            prevVal: val,
            rate,
            passed,
            item
          };
        },
        { prevItem: null, prevTime: 0, prevVal: 0, rate: 0, passed: false, item: null }
      ),
      filter(({ passed }) => passed),
      map(({ rate, item }) => {
        return {
          ...item,
          rateOfChange: rate,
          _displayValue: `Δ ${rate}/sec`
        };
      })
    );
}

module.exports = { rateOfChange };
