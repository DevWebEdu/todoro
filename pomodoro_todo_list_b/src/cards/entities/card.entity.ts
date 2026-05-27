import {
  Entity, PrimaryColumn, Column,
  ManyToOne, JoinColumn, CreateDateColumn,
} from 'typeorm';
import { Day } from '../../days/entities/day.entity';

@Entity('cards')
export class Card {
  @PrimaryColumn({ length: 20 })
  id: string;

  @Column()
  dayId: number;

  @Column({ default: '' })
  title: string;

  @Column({ type: 'json', nullable: true })
  description: unknown;

  @Column({
    type: 'enum',
    enum: ['pending', 'doing', 'done'],
    default: 'pending',
  })
  status: 'pending' | 'doing' | 'done';

  @Column({ default: 0 })
  pomodoroCount: number;

  @Column({ default: 0 })
  shortBreakCount: number;

  @Column({ default: 0 })
  longBreakCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Day, (day) => day.cards, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'dayId' })
  day: Day;
}
