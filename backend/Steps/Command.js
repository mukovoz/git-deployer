import {AbstractStep} from "./AbstractStep.js";
import {execSync} from "node:child_process";

export class Command extends AbstractStep {
    constructor(repository, step) {
        super(repository, step);
    }

    run = () => {
        return execSync(`cd ${this.repository?.path} && ${this.step.command}`).toString()
    }
}