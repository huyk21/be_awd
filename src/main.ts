import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import * as bodyParser from 'body-parser';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.use(
    '/api/webhook',
    bodyParser.raw({ type: '*/*' }), // Parses all content types as raw Buffer
  );

  // Ensure global JSON body parser does not override the webhook-specific raw parser
  app.use(bodyParser.json()); // Apply JSON parser for other routes

  app.enableCors({
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Allow specific HTTP methods
    origin: 'http://localhost:5173', // Allow requests from this origin
    allowedHeaders: ['Content-Type', 'ngrok-skip-browser-warning', 'User-Agent','Authorization'], // Specify allowed headers
    credentials: true, // Allow credentials (if needed)
  });

  await app.listen(3000); // Ensure this matches your backend's port
  console.log('Backend is running on http://localhost:3000');
}
bootstrap();
