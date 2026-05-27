import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Card } from './entities/card.entity';
import { Day } from '../days/entities/day.entity';
import { DaysService } from '../days/days.service';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';
import { IncrementStatDto } from './dto/increment-stat.dto';

@Injectable()
export class CardsService {
  constructor(
    @InjectRepository(Card) private repo: Repository<Card>,
    @InjectRepository(Day) private dayRepo: Repository<Day>,
    private days: DaysService,
  ) {}

  async create(userId: number, dto: CreateCardDto): Promise<Card> {
    const day = await this.days.findOrCreate(userId, dto.date);
    const card = this.repo.create({
      id: dto.id,
      dayId: day.id,
      title: dto.title,
      description: dto.description ?? null,
      status: (dto.status as 'pending' | 'doing' | 'done') ?? 'pending',
    });
    return this.repo.save(card);
  }

  async update(userId: number, cardId: string, dto: UpdateCardDto): Promise<Card> {
    const card = await this.findOwnedCard(userId, cardId);
    Object.assign(card, dto);
    return this.repo.save(card);
  }

  async remove(userId: number, cardId: string): Promise<void> {
    const card = await this.findOwnedCard(userId, cardId);
    await this.repo.remove(card);
  }

  async incrementStat(userId: number, cardId: string, dto: IncrementStatDto): Promise<Card> {
    const card = await this.findOwnedCard(userId, cardId);
    card[dto.stat] = (card[dto.stat] ?? 0) + 1;
    return this.repo.save(card);
  }

  private async findOwnedCard(userId: number, cardId: string): Promise<Card> {
    const card = await this.repo.findOne({
      where: { id: cardId },
      relations: ['day'],
    });
    if (!card) throw new NotFoundException('Tarjeta no encontrada');
    if (card.day.userId !== userId) throw new ForbiddenException();
    return card;
  }
}
