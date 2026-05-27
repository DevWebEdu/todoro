import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private repo: Repository<User>) {}

  findByEmail(email: string): Promise<User | null> {
    return this.repo.findOne({ where: { email } });
  }

  findById(id: number): Promise<User | null> {
    return this.repo.findOne({ where: { id } });
  }

  async create(name: string, email: string, password: string): Promise<User> {
    const exists = await this.findByEmail(email);
    if (exists) throw new ConflictException('El email ya está registrado');
    const hashed = await bcrypt.hash(password, 10);
    return this.repo.save(this.repo.create({ name, email, password: hashed }));
  }
}
