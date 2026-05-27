import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CardsService } from './cards.service';
import { CardsController } from './cards.controller';
import { Card } from './entities/card.entity';
import { Day } from '../days/entities/day.entity';
import { DaysModule } from '../days/days.module';

@Module({
  imports: [TypeOrmModule.forFeature([Card, Day]), DaysModule],
  providers: [CardsService],
  controllers: [CardsController],
})
export class CardsModule {}
