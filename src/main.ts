import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    allowedHeaders: [
      'Content-Type',
      'x-remark',
      'x-nonce',
      'x-crypt',
      'Authorization',
      'open-key',
    ],
    credentials: true,
    exposedHeaders: [
      'Content-Type',
      'x-remark',
      'x-nonce',
      'x-crypt',
      'X-Powered-By',
    ],
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    //origin: configService.get('ORIGINS'),
    origin: '*',
  });
  await app.listen(3000);
}
bootstrap();
