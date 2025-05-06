import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  // Vytvoření NestJS aplikace
  const app = await NestFactory.create(AppModule);
  
  // Konfigurace CORS
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });
  
  // Spuštění aplikace
  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  logger.log(`Application is running on: ${await app.getUrl()}`);
}

// Spuštění aplikace
bootstrap().catch(err => {
  console.error('Failed to start application:', err);
});
