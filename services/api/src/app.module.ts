import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { HealthModule } from "./modules/health/health.module";
import { RequestIdMiddleware } from "./common/middleware/request-id.middleware";
import { StructuredLoggerService } from "./common/services/structured-logger.service";
import { GlobalExceptionFilter } from "./common/filters/global-exception.filter";

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: [".env.local", ".env"],
        }),
        HealthModule,
    ],
    providers: [StructuredLoggerService, GlobalExceptionFilter],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(RequestIdMiddleware).forRoutes("*");
    }
}
