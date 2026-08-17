import {getStepInstance} from "./steps.js";

export function runSteps(repo) {
    let stepResponses = [];
    repo?.steps.map(step => {
        try {
            repo.result = stepResponses.join('\n');
            stepResponses.push(getStepInstance(repo, step).run())
        } catch (e) {
            stepResponses.push(e.message);
            console.error(e.message);
        }
    });
    return stepResponses;
}
