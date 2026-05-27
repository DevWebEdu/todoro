import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DaysService } from './days.service';
import { DaysController } from './days.controller';
import { Day } from './entities/day.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Day])],
  providers: [DaysService],
  controllers: [DaysController],
  exports: [DaysService],
})
export class DaysModule {}
