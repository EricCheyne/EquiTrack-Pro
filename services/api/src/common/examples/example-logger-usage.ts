/**
 * Example Controller using Structured Logger and Request ID
 * This demonstrates how to inject and use the StructuredLoggerService
 */

import { Controller, Get, Post, Body, UseInterceptors } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { StructuredLoggerService } from "@/common/services/structured-logger.service";
import { HttpLoggingInterceptor } from "@/common/interceptors/http-logging.interceptor";

@ApiTags("Example")
@Controller("example")
@UseInterceptors(HttpLoggingInterceptor)
export class ExampleController {
    constructor(private readonly logger: StructuredLoggerService) {
        this.logger.setContext("ExampleController");
    }

    @Get()
    @ApiOperation({ summary: "Example GET endpoint" })
    getExample() {
        this.logger.log("Getting example data", undefined, {
            action: "getExample",
            timestamp: Date.now(),
        });

        return { message: "Example response" };
    }

    @Post()
    @ApiOperation({ summary: "Example POST endpoint" })
    postExample(@Body() data: any) {
        this.logger.log("Creating example", undefined, {
            action: "postExample",
            dataKeys: Object.keys(data),
        });

        try {
            // Process data
            this.logger.debug("Processing example data", undefined, {
                action: "postExample",
                status: "processing",
            });

            return { success: true, data };
        } catch (error) {
            this.logger.error(
                "Failed to create example",
                error instanceof Error ? error : String(error),
                undefined,
                { action: "postExample" }
            );
            throw error;
        }
    }
}
