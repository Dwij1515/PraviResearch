/**
 * Municipal Infrastructure Asset Management System (IAMS)
 * Centralized Condition Scoring Service
 */

const { ConditionRating } = require('../constants/enums');

/**
 * Maps a numeric condition score (0-100) to its canonical ConditionRating enum.
 * 90–100: EXCELLENT
 * 75–89:  GOOD
 * 60–74:  FAIR (Warning/Advisory)
 * 40–59:  POOR (Repair attention)
 * 0–39:   CRITICAL (Emergency / Safety Hazard)
 *
 * @param {number} score
 * @returns {string} ConditionRating
 */
const getConditionRating = (score) => {
  const num = Number(score);
  if (isNaN(num)) {
    throw new Error(`Invalid condition score: ${score}`);
  }

  const clamped = Math.max(0, Math.min(100, Math.round(num)));

  if (clamped >= 90) return 'EXCELLENT';
  if (clamped >= 75) return 'GOOD';
  if (clamped >= 60) return 'FAIR';
  if (clamped >= 40) return 'POOR';
  return 'CRITICAL';
};

/**
 * Checks if a condition score requires warning or repair escalation.
 * @param {number} score
 * @returns {{ isNormal: boolean, isWarning: boolean, isRepairRequired: boolean, isCritical: boolean }}
 */
const evaluateConditionStatus = (score) => {
  const rating = getConditionRating(score);
  return {
    rating,
    isNormal: score >= 75,
    isWarning: score >= 60 && score < 75,
    isRepairRequired: score >= 40 && score < 60,
    isCritical: score < 40
  };
};

module.exports = {
  getConditionRating,
  evaluateConditionStatus
};
