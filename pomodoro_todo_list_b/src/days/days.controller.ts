import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { DaysService } from './days.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('days')
export class DaysController {
  constructor(private days: DaysService) {}

  @Get()
  getAll(@Req() req: { user: { id: number } }) {
    return this.days.findAllForUser(req.user.id);
  }
}
