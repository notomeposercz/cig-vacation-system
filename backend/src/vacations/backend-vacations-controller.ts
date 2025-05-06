import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Query, Request } from '@nestjs/common';
import { VacationsService } from './vacations.service';
import { CreateVacationRequestDto, UpdateVacationRequestDto, ApproveVacationRequestDto, CreateVacationSettingDto } from './dto/create-vacation-request.dto';
import { VacationRequest } from './entities/vacation-request.entity';
import { VacationSetting } from './entities/vacation-setting.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('vacations')
@UseGuards(JwtAuthGuard)
export class VacationsController {
  constructor(private readonly vacationsService: VacationsService) {}

  // Vacation Requests
  @Post('requests')
  createVacationRequest(@Body() createVacationRequestDto: CreateVacationRequestDto): Promise<VacationRequest> {
    return this.vacationsService.createVacationRequest(createVacationRequestDto);
  }

  @Get('requests')
  @UseGuards(RolesGuard)
  @Roles('admin', 'manager')
  findAllVacationRequests(): Promise<VacationRequest[]> {
    return this.vacationsService.findAllVacationRequests();
  }

  @Get('requests/user/:userId')
  findVacationRequestsByUser(@Param('userId') userId: string): Promise<VacationRequest[]> {
    return this.vacationsService.findVacationRequestsByUser(userId);
  }

  @Get('requests/department/:departmentId')
  @UseGuards(RolesGuard)
  @Roles('admin', 'manager')
  findVacationRequestsByDepartment(@Param('departmentId') departmentId: string): Promise<VacationRequest[]> {
    return this.vacationsService.findVacationRequestsByDepartment(departmentId);
  }

  @Get('requests/date-range')
  findVacationRequestsByDateRange(
    @Query('startDate') startDate: Date,
    @Query('endDate') endDate: Date,
  ): Promise<VacationRequest[]> {
    return this.vacationsService.findVacationRequestsByDateRange(startDate, endDate);
  }

  @Get('requests/:id')
  findVacationRequestById(@Param('id') id: string): Promise<VacationRequest> {
    return this.vacationsService.findVacationRequestById(id);
  }

  @Put('requests/:id')
  updateVacationRequest(
    @Param('id') id: string,
    @Body() updateVacationRequestDto: UpdateVacationRequestDto,
  ): Promise<VacationRequest> {
    return this.vacationsService.updateVacationRequest(id, updateVacationRequestDto);
  }

  @Post('requests/:id/approve')
  @UseGuards(RolesGuard)
  @Roles('admin', 'manager')
  approveVacationRequest(
    @Param('id') id: string,
    @Body() approveDto: ApproveVacationRequestDto,
  ): Promise<VacationRequest> {
    return this.vacationsService.approveVacationRequest(id, approveDto.approverId, approveDto.note);
  }

  @Post('requests/:id/reject')
  @UseGuards(RolesGuard)
  @Roles('admin', 'manager')
  rejectVacationRequest(
    @Param('id') id: string,
    @Body() approveDto: ApproveVacationRequestDto,
  ): Promise<VacationRequest> {
    return this.vacationsService.rejectVacationRequest(id, approveDto.approverId, approveDto.note);
  }

  @Delete('requests/:id')
  removeVacationRequest(@Param('id') id: string): Promise<void> {
    return this.vacationsService.removeVacationRequest(id);
  }

  // Vacation Settings
  @Post('settings')
  @UseGuards(RolesGuard)
  @Roles('admin')
  createVacationSetting(@Body() createVacationSettingDto: CreateVacationSettingDto): Promise<VacationSetting> {
    return this.vacationsService.createVacationSetting(createVacationSettingDto);
  }

  @Get('settings/:userId/:year')
  findVacationSettingByUserAndYear(
    @Param('userId') userId: string,
    @Param('year') year: number,
  ): Promise<VacationSetting> {
    return this.vacationsService.findVacationSettingByUserAndYear(userId, year);
  }

  @Put('settings/:id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  updateVacationSetting(
    @Param('id') id: string,
    @Body() updateDto: Partial<CreateVacationSettingDto>,
  ): Promise<VacationSetting> {
    return this.vacationsService.updateVacationSetting(id, updateDto);
  }

  // Statistics
  @Get('stats/:userId/:year')
  calculateVacationStats(
    @Param('userId') userId: string,
    @Param('year') year: number,
  ): Promise<{ total: number; used: number; remaining: number }> {
    return this.vacationsService.calculateVacationStats(userId, year);
  }
}
