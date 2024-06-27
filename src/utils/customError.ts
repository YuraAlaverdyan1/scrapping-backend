export class CustomError {
    constructor(
        public message: string,
        public statusCode: number,
        public isLogging: boolean,
        public errorData?: unknown,
    ) {
        this.message = message;
        this.statusCode = statusCode;
        this.isLogging = isLogging;
        this.errorData = errorData;
    }

    public static throwError(message: string) {
        throw new Error(message);
    }

    public static isError(data: unknown) {
        return data instanceof CustomError;
    }
}