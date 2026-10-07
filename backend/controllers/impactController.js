import db from '../dataStore.js';

const VALID_TASKS = [
  'send_money',
  'cash_out',
  'money_lock',
  'bill_reminder',
  'transaction_understanding',
  'balance_check',
  'voice_navigation',
];

const clamp = (value, min, max) => {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return null;
  }

  return Math.min(max, Math.max(min, number));
};

/**
 * Record a customer-impact event.
 *
 * IMPORTANT:
 * This stores only product-usage telemetry and survey responses.
 * No raw voice/audio is stored here.
 */
export const recordImpactEvent = (req, res, next) => {
  try {
    const userId = req.user?.id || 'usr_imran_001';

    const {
      eventType,
      task,
      sessionId,
      durationMs,
      success,
      confidence,
      easeRating,
      satisfactionRating,
      errorType,
      source,
      metadata = {},
    } = req.body || {};

    if (!eventType) {
      return res.status(400).json({
        success: false,
        error: 'EVENT_TYPE_REQUIRED',
        message: 'ইভেন্টের ধরন প্রয়োজন।',
      });
    }

    if (task && !VALID_TASKS.includes(task)) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_TASK',
        message: 'অজানা customer impact task।',
      });
    }

    const event = {
      id: `impact_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      userId,
      eventType,
      task: task || null,
      sessionId: sessionId || null,

      durationMs:
        durationMs !== undefined
          ? Math.max(0, Number(durationMs) || 0)
          : null,

      success:
        typeof success === 'boolean'
          ? success
          : null,

      confidence:
        confidence !== undefined
          ? clamp(confidence, 1, 5)
          : null,

      easeRating:
        easeRating !== undefined
          ? clamp(easeRating, 1, 5)
          : null,

      satisfactionRating:
        satisfactionRating !== undefined
          ? clamp(satisfactionRating, 1, 5)
          : null,

      errorType: errorType || null,

      source:
        source === 'voice' || source === 'text'
          ? source
          : 'unknown',

      metadata:
        metadata && typeof metadata === 'object'
          ? metadata
          : {},

      timestamp: new Date().toISOString(),

      // Privacy-by-design:
      // Never store raw audio, PIN, OTP, password or financial secrets.
      privacyCompliant: true,
    };

    db.insert('impact_events', event);

    return res.status(201).json({
      success: true,
      message: 'Customer impact event সংরক্ষণ করা হয়েছে।',
      eventId: event.id,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Aggregate customer-impact metrics.
 *
 * These numbers are calculated from actual recorded interactions.
 * No synthetic performance number is inserted here.
 */
export const getImpactMetrics = (req, res, next) => {
  try {
    const userId = req.query.userId || req.user?.id || 'usr_imran_001';

    const events = db
      .getAll('impact_events')
      .filter((event) => event.userId === userId);

    const taskEvents = events.filter(
      (event) => event.eventType === 'task_completed'
    );

    const taskStarted = events.filter(
      (event) => event.eventType === 'task_started'
    );

    const feedbackEvents = events.filter(
      (event) => event.eventType === 'task_feedback'
    );

    const successfulTasks = taskEvents.filter(
      (event) => event.success === true
    );

    const failedTasks = taskEvents.filter(
      (event) => event.success === false
    );

    const completionRate =
      taskStarted.length > 0
        ? Number(
            (
              (successfulTasks.length / taskStarted.length) *
              100
            ).toFixed(1)
          )
        : null;

    const durations = successfulTasks
      .map((event) => Number(event.durationMs))
      .filter((value) => Number.isFinite(value) && value > 0);

    const averageCompletionTimeMs =
      durations.length > 0
        ? Math.round(
            durations.reduce((sum, value) => sum + value, 0) /
              durations.length
          )
        : null;

    const confidenceRatings = feedbackEvents
      .map((event) => Number(event.confidence))
      .filter((value) => Number.isFinite(value));

    const easeRatings = feedbackEvents
      .map((event) => Number(event.easeRating))
      .filter((value) => Number.isFinite(value));

    const satisfactionRatings = feedbackEvents
      .map((event) => Number(event.satisfactionRating))
      .filter((value) => Number.isFinite(value));

    const average = (values) =>
      values.length > 0
        ? Number(
            (
              values.reduce((sum, value) => sum + value, 0) /
              values.length
            ).toFixed(2)
          )
        : null;

    const taskBreakdown = {};

    for (const task of VALID_TASKS) {
      const started = taskStarted.filter(
        (event) => event.task === task
      ).length;

      const completed = successfulTasks.filter(
        (event) => event.task === task
      ).length;

      const failed = failedTasks.filter(
        (event) => event.task === task
      ).length;

      taskBreakdown[task] = {
        started,
        completed,
        failed,
        completionRate:
          started > 0
            ? Number(((completed / started) * 100).toFixed(1))
            : null,
      };
    }

    const errorEvents = events.filter(
      (event) =>
        event.eventType === 'task_error' ||
        event.eventType === 'task_abandoned'
    );

    const voiceEvents = events.filter(
      (event) => event.source === 'voice'
    );

    const textEvents = events.filter(
      (event) => event.source === 'text'
    );

    return res.json({
      success: true,

      measurementStatus: {
        hasUserData: events.length > 0,
        note:
          'Metrics are calculated from recorded prototype interactions; no synthetic performance values are inserted.',
      },

      sampleSize: {
        totalEvents: events.length,
        tasksStarted: taskStarted.length,
        tasksCompleted: successfulTasks.length,
        feedbackResponses: feedbackEvents.length,
      },

      outcomeMetrics: {
        taskCompletionRate: completionRate,
        averageCompletionTimeMs,
        averageCompletionTimeSeconds:
          averageCompletionTimeMs !== null
            ? Number((averageCompletionTimeMs / 1000).toFixed(1))
            : null,

        averageConfidence: average(confidenceRatings),
        averageEase: average(easeRatings),
        averageSatisfaction: average(satisfactionRatings),

        errorEvents: errorEvents.length,
      },

      interactionChannels: {
        voice: voiceEvents.length,
        text: textEvents.length,
      },

      taskBreakdown,

      collectedAt: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
};