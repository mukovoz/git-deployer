import {AbstractStep} from "./AbstractStep.js";

export class Telegram extends AbstractStep {
    constructor(repository, step) {
        super(repository, step);
    }

    run = () => {
        return 'Sending data to telegram';
    }
}