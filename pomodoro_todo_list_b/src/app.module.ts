import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { DaysModule } from './days/days.module';
import { CardsModule } from './cards/cards.module';
import { UploadsModule } from './uploads/uploads.module';
import { User } from './users/entities/user.entity';
import { Day } from './days/entities/day.entity';
import { Card } from './cards/entities/card.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (cfg: ConfigService) => ({
        type: 'postgres',
        host:     cfg.get('DB_HOST', 'localhost'),
        port:     cfg.get<number>('DB_PORT', 5432),
        username: cfg.get('DB_USER', 'postgres'),
        password: cfg.get('DB_PASS', ''),
        database: cfg.get('DB_NAME', 'pomodoro_db'),
        entities: [User, Day, Card],
        synchronize: true,
        ssl: false,
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    UsersModule,
    DaysModule,
    CardsModule,
    UploadsModule,
  ],
})
export class AppModule {}
