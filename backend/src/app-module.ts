import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import configuration from './config/configuration';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { VacationsModule } from './vacations/vacations.module';
import { DepartmentsModule } from './departments/departments.module';
import { User } from './users/entities/user.entity';
import { Department } from './departments/entities/department.entity';
import { VacationRequest } from './vacations/entities/vacation-request.entity';
import { VacationSetting } from './vacations/entities/vacation-setting.entity';
import { VacationApproval } from './vacations/entities/vacation-approval.entity';
import { RefreshToken } from './auth/entities/refresh-token.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('database.host'),
        port: configService.get('database.port'),
        username: configService.get('database.username'),
        password: configService.get('database.password'),
        database: configService.get('database.database'),
        entities: [User, Department, VacationRequest, VacationSetting, VacationApproval, RefreshToken],
        synchronize: false, // nastavte na false v produkčním prostředí
      }),
    }),
    AuthModule,
    UsersModule,
    VacationsModule,
    DepartmentsModule,
  ],
})
export class AppModule {}
