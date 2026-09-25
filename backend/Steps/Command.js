import {AbstractStep} from "./AbstractStep.js";
import {spawnSync} from "node:child_process";

export class Command extends AbstractStep {
    constructor(repository, step) {
        super(repository, step);
    }

    /**
     * Returns stdout + stderr (git, npm etc. write progress to stderr), throws if command exits with non-zero code
     */
    run = () => {
        const result = spawnSync(this.step.command, {
            cwd: this.repository?.path,
            shell: true,
            encoding: 'utf8',
            maxBuffer: 64 * 1024 * 1024,
        });
        if (result.error)
            throw result.error;

        const output = [result.stdout, result.stderr].filter(Boolean).join('');
        if (result.status !== 0)
            throw new Error(`Exit code ${result.status ?? result.signal}\n${output}`);
        return output;
    }
}
