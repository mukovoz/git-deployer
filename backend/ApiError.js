export default class ApiError extends Error {

    code = 400;
    message;

    constructor(message, code = 400) {
        super(message);
        this.code = code;
        this.message = message;
    }
}