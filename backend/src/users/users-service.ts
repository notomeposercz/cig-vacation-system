import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { VacationsService } from '../vacations/vacations.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private vacationsService: VacationsService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = new User();
    user.email = createUserDto.email;
    user.firstName = createUserDto.firstName;
    user.lastName = createUserDto.lastName;
    user.departmentId = createUserDto.departmentId;
    user.role = createUserDto.role || UserRole.EMPLOYEE;
    
    // Hashování hesla
    const saltRounds = 10;
    user.passwordHash = await bcrypt.hash(createUserDto.password, saltRounds);
    
    return this.usersRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find({
      relations: ['department'],
    });
  }

  async findById(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['department'],
    });
    
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    
    return user;
  }

  async findByEmail(email: string): Promise<User> {
    return this.usersRepository.findOne({
      where: { email },
      relations: ['department'],
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);
    
    if (updateUserDto.email) user.email = updateUserDto.email;
    if (updateUserDto.firstName) user.firstName = updateUserDto.firstName;
    if (updateUserDto.lastName) user.lastName = updateUserDto.lastName;
    if (updateUserDto.departmentId) user.departmentId = updateUserDto.departmentId;
    if (updateUserDto.role) user.role = updateUserDto.role;
    
    if (updateUserDto.password) {
      const saltRounds = 10;
      user.passwordHash = await bcrypt.hash(updateUserDto.password, saltRounds);
    }
    
    return this.usersRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findById(id);
    await this.usersRepository.remove(user);
  }

  async getUserWithVacationStats(id: string, year: number): Promise<User> {
    const user = await this.findById(id);
    const stats = await this.vacationsService.calculateVacationStats(id, year);
    
    user.vacationStats = stats;
    return user;
  }

  async getUsersWithVacationStats(year: number): Promise<User[]> {
    const users = await this.findAll();
    
    for (const user of users) {
      user.vacationStats = await this.vacationsService.calculateVacationStats(user.id, year);
    }
    
    return users;
  }
}
