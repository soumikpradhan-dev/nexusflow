const { combineLatest, merge } = require('rxjs');
const { map, filter } = require('rxjs/operators');

/**
 * Combines multiple upstream observable streams with logical AND or OR
 * @param {Array<Observable>} upstreamStreams - array of upstream streams
 * @param {Object} config - { gateType: 'AND' | 'OR', maxTimeDiffMs?: 3000 }
 */
function createLogicGate(upstreamStreams, config = {}) {
  const gateType = (config.gateType || 'AND').toUpperCase();
  const maxTimeDiffMs = config.maxTimeDiffMs || 5000;

  if (upstreamStreams.length === 1) {
    return upstreamStreams[0];
  }

  if (gateType === 'OR') {
    return merge(...upstreamStreams).pipe(
      map(item => ({
        ...item,
        _logicGate: { gateType: 'OR', evaluated: true },
        _displayValue: 'LOGIC OR MATCHED'
      }))
    );
  }

  // AND gate: combineLatest of all parent streams, ensuring they occurred within maxTimeDiffMs
  return combineLatest(upstreamStreams).pipe(
    filter((items) => {
      if (!items || items.length < 2) return false;
      const timestamps = items.map(it => new Date(it.timestamp || Date.now()).getTime());
      const minTime = Math.min(...timestamps);
      const maxTime = Math.max(...timestamps);
      return (maxTime - minTime) <= maxTimeDiffMs;
    }),
    map((items) => {
      const primary = items[0];
      return {
        ...primary,
        _combinedItems: items,
        _logicGate: {
          gateType: 'AND',
          upstreamCount: items.length,
          evaluated: true
        },
        _displayValue: `LOGIC AND (${items.length} conditions satisfied)`
      };
    })
  );
}

module.exports = { createLogicGate };
