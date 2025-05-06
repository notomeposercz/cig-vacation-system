import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { VacationApproval } from './vacation-approval.entity';

export enum VacationType {
  VACATION = 'vacation',
  SICK_LEAVE = 'sick_leave',
  OTHER = 'other',
}

export enum VacationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('vacation_requests')
export class VacationRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, user => user.vacationRequests)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'start_date', type: 'date' })
  startDate: Date;

  @Column({ name: 'end_date', type: 'date' })
  endDate: Date;

  @Column({ name: 'half_day_start', default: false })
  halfDayStart: boolean;

  @Column({ name: 'half_day_end', default: false })
  halfDayEnd: boolean;

  @Column({
    type: 'enum',
    enum: VacationType,
    default: VacationType.VACATION,
  })
  type: VacationType;

  @Column({
    type: 'enum',
    enum: VacationStatus,
    default: VacationStatus.PENDING,
  })
  status: VacationStatus;

  @Column({ nullable: true })
  note: string;

  @OneToMany(() => VacationApproval, approval => approval.vacation)
  approvals: VacationApproval[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Pomocná metoda pro výpočet dnů dovolené
  calculateDuration(): number {
    const start = new Date(this.startDate);
    const end = new Date(this.endDate);
    let days = this.countWorkingDays(start, end);
    
    if (this.halfDayStart) days -= 0.5;
    if (this.halfDayEnd) days -= 0.5;
    
    return days;
  }
  
  private countWorkingDays(start: Date, end: Date): number {
    let count = 0;
    const current = new Date(start);
    
    while (current <= end) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) count++; // Pracovní dny (po-pá)
      current.setDate(current.getDate() + 1);
    }
    
    return count;
  }
}
