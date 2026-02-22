import { Controller, Get } from "@nestjs/common";
import { HealthCheckService, HttpHealthIndicator, HealthCheck } from "@nestjs/terminus";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

@ApiTags("Health")
@Controller("health")
export class HealthController {
    constructor(
        private health: HealthCheckService,
        private http: HttpHealthIndicator
    ) { }

    @Get()
    @HealthCheck()
    @ApiOperation({ summary: "Check API health status" })
    @ApiResponse({
        status: 200,
        description: "API is healthy",
        schema: {
            example: {
                status: "ok",
                checks: {},
                timestamp: new Date().toISOString(),
            },
        },
    })
    check() {
        return this.health.check([]);
    }

    @Get("ping")
    @ApiOperation({ summary: "Simple health ping" })
    @ApiResponse({
        status: 200,
        description: "Simple ping response",
        schema: {
            example: { message: "pong", timestamp: new Date().toISOString() },
        },
    })
    ping() {
        return {
            message: "pong",
            timestamp: new Date().toISOString(),
        };
    }
}
