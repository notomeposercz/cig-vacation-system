import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { VacationRequest, VacationStatus } from './vacation-request.entity';

@Entity('vacation_approvals')
export class VacationApproval {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'vacation_id' })
  vacationId: string;

  @ManyToOne(() => VacationRequest, vacation => vacation.approvals)
  @JoinColumn({ name: 'vacation_id' })
  vacation: VacationRequest;

  @Column({ name: 'approved_by' })
  approvedBy: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'approved_by' })
  approver: User;

  @Column({
    type: 'enum',
    enum: VacationStatus,
  })
  status: VacationStatus;

  @Column({ nullable: true })
  note: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
