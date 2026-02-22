import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { GlobalExceptionFilter } from "./common/filters/global-exception.filter";
import { StructuredLoggerService } from "./common/services/structured-logger.service";

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    const logger = app.get(StructuredLoggerService);

    // Enable CORS
    app.enableCors();

    // Global validation pipe
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
            transformOptions: {
                enableImplicitConversion: true,
            },
        })
    );

    // Global exception filter
    const exceptionFilter = app.get(GlobalExceptionFilter);
    app.useGlobalFilters(exceptionFilter);

    // Swagger/OpenAPI documentation
    const config = new DocumentBuilder()
        .setTitle("EquiTrack Pro API")
        .setDescription("REST API for EquiTrack Pro platform")
        .setVersion("0.1.0")
        .addBearerAuth()
        .addServer("http://localhost:3001", "Development")
        .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup("api/docs", app, document);

    const port = process.env.API_PORT || 3001;
    const host = process.env.API_HOST || "localhost";

    await app.listen(port, host);

    logger.log("✓ EquiTrack Pro API started", "Bootstrap", {
        port,
        host,
        nodeEnv: process.env.NODE_ENV,
    });
    logger.log(`✓ Swagger UI available at http://${host}:${port}/api/docs`, "Bootstrap");
}

bootstrap().catch((err) => {
    console.error("Failed to bootstrap application:", err);
    process.exit(1);
});
