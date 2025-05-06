import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VacationsService } from './vacations.service';
import { VacationsController } from './vacations.controller';
import { VacationRequest } from './entities/vacation-request.entity';
import { VacationSetting } from './entities/vacation-setting.entity';
import { VacationApproval } from './entities/vacation-approval.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([VacationRequest, VacationSetting, VacationApproval]),
    forwardRef(() => UsersModule),
  ],
  controllers: [VacationsController],
  providers: [VacationsService],
  exports: [VacationsService],
})
export class VacationsModule {}
