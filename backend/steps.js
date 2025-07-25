import {Command} from "./Steps/Command.js";
import {Telegram} from "./Steps/Telegram.js";
import {Empty} from "./Steps/Empty.js";

const stepsDefinitions = {
    'command': Command,
    'telegram': Telegram,
    'empty': Empty,
}

export function getStepInstance(repository, step) {
    if (typeof step === 'string') {
        step = {
            type: "command",
            command: step,
        }
    }
    return stepsDefinitions[step.type] ? new stepsDefinitions[step.type](repository, step) : new Empty(repository, step);
}