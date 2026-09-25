import {getStepInstance} from "./steps.js";
import {createLogger} from "./logger.js";

const describeStep = (step) => typeof step === 'string' ? step : (step?.command ?? step?.type ?? 'unknown');

/**
 * @param repo
 * @param trigger - what started the deploy, used in logs only (e.g. "webhook github", "auto")
 * @returns {string[]} output of every step
 */
export function runSteps(repo, trigger = 'manual') {
    const logger = createLogger(repo);
    const steps = repo?.steps || [];
    let stepResponses = [];
    let failed = 0;
    const deployStart = Date.now();

    logger.info(`Deploy started (${trigger}), branch ${repo?.branch}, ${steps.length} step(s)`);

    steps.map((step, i) => {
        const label = `Step ${i + 1}/${steps.length} [${describeStep(step)}]`;
        const stepStart = Date.now();
        logger.info(`${label} started`);
        try {
            repo.result = stepResponses.join('\n');
            const response = getStepInstance(repo, step).run();
            stepResponses.push(response);
            logger.output(response);
            logger.success(`${label} done in ${Date.now() - stepStart}ms`);
        } catch (e) {
            failed++;
            stepResponses.push(e.message);
            logger.output(e.message);
            logger.error(`${label} failed in ${Date.now() - stepStart}ms`);
        }
    });

    const summary = `Deploy finished in ${Date.now() - deployStart}ms: ${steps.length - failed} succeeded, ${failed} failed`;
    failed ? logger.error(summary) : logger.success(summary);
    return stepResponses;
}
