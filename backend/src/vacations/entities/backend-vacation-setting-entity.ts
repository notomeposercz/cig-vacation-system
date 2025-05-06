import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('vacation_settings')
export class VacationSetting {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, user => user.vacationSettings)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  year: number;

  @Column({ name: 'total_days' })
  totalDays: number;

  @Column({ name: 'carried_days', default: 0 })
  carriedDays: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
