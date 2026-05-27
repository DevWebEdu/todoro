import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, OneToMany, JoinColumn, Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Card } from '../../cards/entities/card.entity';

@Entity('days')
@Unique(['userId', 'date'])
export class Day {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 10 })
  date: string; // YYYY-MM-DD

  @Column()
  userId: number;

  @ManyToOne(() => User, (user) => user.days, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToMany(() => Card, (card) => card.day, { cascade: true })
  cards: Card[];
}
