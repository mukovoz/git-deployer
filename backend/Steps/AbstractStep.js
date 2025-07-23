export class AbstractStep {
    repository;
    step;

    constructor(repository, step) {
        this.repository = repository;
        this.step = step;
    }

    run = () => {}
}