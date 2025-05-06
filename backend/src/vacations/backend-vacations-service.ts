import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { VacationRequest, VacationStatus } from './entities/vacation-request.entity';
import { VacationSetting } from './entities/vacation-setting.entity';
import { VacationApproval } from './entities/vacation-approval.entity';
import { CreateVacationRequestDto } from './dto/create-vacation-request.dto';
import { UpdateVacationRequestDto } from './dto/update-vacation-request.dto';
import { CreateVacationSettingDto } from './dto/create-vacation-setting.dto';

@Injectable()
export class VacationsService {
  constructor(
    @InjectRepository(VacationRequest)
    private vacationRequestRepository: Repository<VacationRequest>,
    @InjectRepository(VacationSetting)
    private vacationSettingRepository: Repository<VacationSetting>,
    @InjectRepository(VacationApproval)
    private vacationApprovalRepository: Repository<VacationApproval>,
  ) {}

  // Vacation Requests
  async createVacationRequest(createVacationRequestDto: CreateVacationRequestDto): Promise<VacationRequest> {
    const vacationRequest = this.vacationRequestRepository.create(createVacationRequestDto);
    
    // Kontrola dostupnosti dovolené
    const year = new Date(vacationRequest.startDate).getFullYear();
    const stats = await this.calculateVacationStats(vacationRequest.userId, year);
    
    const requestDuration = vacationRequest.calculateDuration();
    
    if (requestDuration > stats.remaining) {
      throw new BadRequestException('Nedostatek dostupných dnů dovolené');
    }
    
    return this.vacationRequestRepository.save(vacationRequest);
  }

  async findAllVacationRequests(): Promise<VacationRequest[]> {
    return this.vacationRequestRepository.find({
      relations: ['user', 'approvals', 'approvals.approver'],
      order: {
        startDate: 'DESC',
      },
    });
  }

  async findVacationRequestById(id: string): Promise<VacationRequest> {
    const vacationRequest = await this.vacationRequestRepository.findOne({
      where: { id },
      relations: ['user', 'approvals', 'approvals.approver'],
    });
    
    if (!vacationRequest) {
      throw new NotFoundException(`Vacation request with ID ${id} not found`);
    }
    
    return vacationRequest;
  }

  async findVacationRequestsByUser(userId: string): Promise<VacationRequest[]> {
    return this.vacationRequestRepository.find({
      where: { userId },
      relations: ['approvals', 'approvals.approver'],
      order: {
        startDate: 'DESC',
      },
    });
  }

  async findVacationRequestsByDepartment(departmentId: string): Promise<VacationRequest[]> {
    return this.vacationRequestRepository
      .createQueryBuilder('vr')
      .innerJoin('vr.user', 'user')
      .where('user.departmentId = :departmentId', { departmentId })
      .orderBy('vr.startDate', 'DESC')
      .getMany();
  }

  async findVacationRequestsByDateRange(startDate: Date, endDate: Date): Promise<VacationRequest[]> {
    return this.vacationRequestRepository.find({
      where: [
        { startDate: Between(startDate, endDate) },
        { endDate: Between(startDate, endDate) },
      ],
      relations: ['user'],
      order: {
        startDate: 'ASC',
      },
    });
  }

  async updateVacationRequest(id: string, updateVacationRequestDto: UpdateVacationRequestDto): Promise<VacationRequest> {
    const vacationRequest = await this.findVacationRequestById(id);
    
    // Aktualizace polí
    Object.assign(vacationRequest, updateVacationRequestDto);
    
    return this.vacationRequestRepository.save(vacationRequest);
  }

  async approveVacationRequest(id: string, approverId: string, note?: string): Promise<VacationRequest> {
    const vacationRequest = await this.findVacationRequestById(id);
    
    // Vytvoření schválení
    const approval = this.vacationApprovalRepository.create({
      vacationId: id,
      approvedBy: approverId,
      status: VacationStatus.APPROVED,
      note,
    });
    
    await this.vacationApprovalRepository.save(approval);
    
    // Aktualizace stavu žádosti
    vacationRequest.status = VacationStatus.APPROVED;
    
    return this.vacationRequestRepository.save(vacationRequest);
  }

  async rejectVacationRequest(id: string, approverId: string, note?: string): Promise<VacationRequest> {
    const vacationRequest = await this.findVacationRequestById(id);
    
    // Vytvoření zamítnutí
    const approval = this.vacationApprovalRepository.create({
      vacationId: id,
      approvedBy: approverId,
      status: VacationStatus.REJECTED,
      note,
    });
    
    await this.vacationApprovalRepository.save(approval);
    
    // Aktualizace stavu žádosti
    vacationRequest.status = VacationStatus.REJECTED;
    
    return this.vacationRequestRepository.save(vacationRequest);
  }

  async removeVacationRequest(id: string): Promise<void> {
    const vacationRequest = await this.findVacationRequestById(id);
    
    // Odstranění souvisejících schválení
    await this.vacationApprovalRepository.delete({ vacationId: id });
    
    // Odstranění žádosti
    await this.vacationRequestRepository.remove(vacationRequest);
  }

  // Vacation Settings
  async createVacationSetting(createVacationSettingDto: CreateVacationSettingDto): Promise<VacationSetting> {
    // Kontrola, zda již existuje nastavení pro daný rok a uživatele
    const existingSetting = await this.vacationSettingRepository.findOne({
      where: {
        userId: createVacationSettingDto.userId,
        year: createVacationSettingDto.year,
      },
    });
    
    if (existingSetting) {
      throw new BadRequestException('Nastavení dovolené pro tento rok již existuje');
    }
    
    const vacationSetting = this.vacationSettingRepository.create(createVacationSettingDto);
    return this.vacationSettingRepository.save(vacationSetting);
  }

  async findVacationSettingByUserAndYear(userId: string, year: number): Promise<VacationSetting> {
    const setting = await this.vacationSettingRepository.findOne({
      where: { userId, year },
    });
    
    if (!setting) {
      throw new NotFoundException(`Nastavení dovolené pro uživatele ${userId} a rok ${year} nenalezeno`);
    }
    
    return setting;
  }

  async updateVacationSetting(id: string, updateVacationSettingDto: Partial<CreateVacationSettingDto>): Promise<VacationSetting> {
    const setting = await this.vacationSettingRepository.findOne({
      where: { id },
    });
    
    if (!setting) {
      throw new NotFoundException(`Nastavení dovolené s ID ${id} nenalezeno`);
    }
    
    // Aktualizace polí
    Object.assign(setting, updateVacationSettingDto);
    
    return this.vacationSettingRepository.save(setting);
  }

  // Statistics
  async calculateVacationStats(userId: string, year: number): Promise<{ total: number; used: number; remaining: number }> {
    // Načtení nastavení dovolené
    let setting: VacationSetting;
    try {
      setting = await this.findVacationSettingByUserAndYear(userId, year);
    } catch (error) {
      if (error instanceof NotFoundException) {
        // Pokud nastavení neexistuje, použijeme výchozí hodnoty
        return { total: 0, used: 0, remaining: 0 };
      }
      throw error;
    }
    
    // Získání schválených žádostí o dovolenou
    const startDate = new Date(year, 0, 1); // 1. leden daného roku
    const endDate = new Date(year, 11, 31); // 31. prosinec daného roku
    
    const approvedRequests = await this.vacationRequestRepository.find({
      where: {
        userId,
        status: VacationStatus.APPROVED,
        startDate: Between(startDate, endDate),
      },
    });
    
    // Výpočet využitých dnů
    let usedDays = 0;
    for (const request of approvedRequests) {
      usedDays += request.calculateDuration();
    }
    
    // Celkový počet dnů (nárokované + přenesené)
    const totalDays = setting.totalDays + setting.carriedDays;
    
    // Zbývající dny
    const remainingDays = totalDays - usedDays;
    
    return {
      total: totalDays,
      used: usedDays,
      remaining: remainingDays,
    };
  }
}
