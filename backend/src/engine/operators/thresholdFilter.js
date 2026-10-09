const { filter, map } = require('rxjs/operators');

/**
 * Creates an RxJS operator that evaluates comparator conditions against incoming stream data
 * @param {Object} config - { operator: '>', threshold: 80, field: 'movingAverage', thresholdMax?: 100 }
 */
function thresholdFilter(config = {}) {
  const operator = config.operator || '>';
  const threshold = parseFloat(config.threshold) || 80;
  const thresholdMax = parseFloat(config.thresholdMax) || (threshold + 10);
  const targetField = config.field || (config.metric ? config.metric : 'auto');

  return (source$) =>
    source$.pipe(
      filter((item) => {
        // Determine value to evaluate
        let evalVal;
        if (targetField !== 'auto' && typeof item[targetField] === 'number') {
          evalVal = item[targetField];
        } else if (typeof item.movingAverage === 'number') {
          evalVal = item.movingAverage;
        } else {
          evalVal = item.value;
        }

        if (evalVal === undefined || evalVal === null || isNaN(evalVal)) {
          return false;
        }

        switch (operator) {
          case '>':
            return evalVal > threshold;
          case '>=':
            return evalVal >= threshold;
          case '<':
            return evalVal < threshold;
          case '<=':
            return evalVal <= threshold;
          case '==':
            return Math.abs(evalVal - threshold) < 0.001;
          case '!=':
            return Math.abs(evalVal - threshold) >= 0.001;
          case 'between':
            return evalVal >= threshold && evalVal <= thresholdMax;
          default:
            return evalVal > threshold;
        }
      }),
      map((item) => {
        const evalVal = typeof item.movingAverage === 'number' ? item.movingAverage : item.value;
        return {
          ...item,
          _comparatorResult: {
            evaluatedValue: evalVal,
            operator,
            threshold,
            passed: true
          },
          _displayValue: `${evalVal} ${operator} ${threshold}`
        };
      })
    );
}

module.exports = { thresholdFilter };
