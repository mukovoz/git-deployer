import {AbstractStep} from "./AbstractStep.js";

export class AbstractNotificationStep extends AbstractStep{

    getMessage = () => {
        Object.keys(this.repository).map(k=>{
            this.step.text = this.step.text.replaceAll(`{${k}}`,this.repository[k]);
        })

        console.log(this.step.text);
        return this.step.text;
    }
}