import { BadRequestException, Injectable, ValidationPipe } from "@nestjs/common";
import { ValidationError } from "class-validator";

@Injectable()
export class CustomValidationPipe extends ValidationPipe {
    constructor() {
        super({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
            transformOptions: {
                enableImplicitConversion: true,
            },
        });
    }

    createExceptionFactory() {
        return (validationErrors: ValidationError[] = []) => {
            const errors: Record<string, string[]> = {};

            validationErrors.forEach((error) => {
                if (error.constraints) {
                    errors[error.property] = Object.values(error.constraints);
                }
            });

            return new BadRequestException({
                statusCode: 400,
                message: "Validation failed",
                errors,
            });
        };
    }
}
