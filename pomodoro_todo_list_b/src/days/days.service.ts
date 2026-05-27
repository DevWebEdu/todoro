import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Day } from './entities/day.entity';

@Injectable()
export class DaysService {
  constructor(@InjectRepository(Day) private repo: Repository<Day>) {}

  async findAllForUser(userId: number): Promise<Record<string, { id: number; cards: unknown[] }>> {
    const days = await this.repo.find({
      where: { userId },
      relations: ['cards'],
      order: { date: 'DESC' },
    });
    const result: Record<string, { id: number; cards: unknown[] }> = {};
    for (const d of days) {
      result[d.date] = { id: d.id, cards: d.cards ?? [] };
    }
    return result;
  }

  async findOrCreate(userId: number, date: string): Promise<Day> {
    let day = await this.repo.findOne({ where: { userId, date } });
    if (!day) {
      day = this.repo.create({ userId, date });
      day = await this.repo.save(day);
    }
    return day;
  }
}
