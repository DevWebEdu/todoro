import {
  Body, Controller, Delete, Param, Patch, Post, Put, Req, UseGuards,
} from '@nestjs/common';
import { CardsService } from './cards.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';
import { IncrementStatDto } from './dto/increment-stat.dto';

@UseGuards(JwtAuthGuard)
@Controller('cards')
export class CardsController {
  constructor(private cards: CardsService) {}

  @Post()
  create(@Req() req: { user: { id: number } }, @Body() dto: CreateCardDto) {
    return this.cards.create(req.user.id, dto);
  }

  @Put(':id')
  update(
    @Req() req: { user: { id: number } },
    @Param('id') id: string,
    @Body() dto: UpdateCardDto,
  ) {
    return this.cards.update(req.user.id, id, dto);
  }

  @Delete(':id')
  remove(@Req() req: { user: { id: number } }, @Param('id') id: string) {
    return this.cards.remove(req.user.id, id);
  }

  @Patch(':id/stat')
  incrementStat(
    @Req() req: { user: { id: number } },
    @Param('id') id: string,
    @Body() dto: IncrementStatDto,
  ) {
    return this.cards.incrementStat(req.user.id, id, dto);
  }
}
