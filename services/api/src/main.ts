import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app.module";

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

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
    await app.listen(port);

    console.log(`✓ EquiTrack Pro API running on http://localhost:${port}`);
    console.log(`✓ Swagger UI available at http://localhost:${port}/api/docs`);
}

bootstrap().catch((err) => {
    console.error("Failed to bootstrap application:", err);
    process.exit(1);
});
