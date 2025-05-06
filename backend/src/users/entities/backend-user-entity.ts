import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Department } from '../../departments/entities/department.entity';
import { VacationRequest } from '../../vacations/entities/vacation-request.entity';
import { VacationSetting } from '../../vacations/entities/vacation-setting.entity';
import { Exclude } from 'class-transformer';

export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  EMPLOYEE = 'employee',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ name: 'password_hash' })
  @Exclude({ toPlainOnly: true })
  passwordHash: string;

  @Column({ name: 'first_name' })
  firstName: string;

  @Column({ name: 'last_name' })
  lastName: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.EMPLOYEE,
  })
  role: UserRole;

  @Column({ name: 'department_id', nullable: true })
  departmentId: string;

  @ManyToOne(() => Department, department => department.users)
  @JoinColumn({ name: 'department_id' })
  department: Department;

  @OneToMany(() => VacationRequest, vacationRequest => vacationRequest.user)
  vacationRequests: VacationRequest[];

  @OneToMany(() => VacationSetting, vacationSetting => vacationSetting.user)
  vacationSettings: VacationSetting[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Vypočítané vlastnosti, které nejsou v databázi
  vacationStats: {
    total: number;
    used: number;
    remaining: number;
  };
}
