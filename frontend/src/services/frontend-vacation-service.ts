import { apiService } from './api.service';

export interface VacationRequestDto {
  userId: string;
  startDate: Date;
  endDate: Date;
  halfDayStart?: boolean;
  halfDayEnd?: boolean;
  type?: string;
  note?: string;
}

export interface VacationRequest {
  id: string;
  userId: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  startDate: string;
  endDate: string;
  halfDayStart: boolean;
  halfDayEnd: boolean;
  type: string;
  status: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
  approvals?: VacationApproval[];
}

export interface VacationApproval {
  id: string;
  vacationId: string;
  approvedBy: string;
  approver?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  status: string;
  note?: string;
  createdAt: string;
}

export interface VacationSettingDto {
  userId: string;
  year: number;
  totalDays: number;
  carriedDays?: number;
}

export interface VacationSetting {
  id: string;
  userId: string;
  year: number;
  totalDays: number;
  carriedDays: number;
  createdAt: string;
  updatedAt: string;
}

export interface VacationStats {
  total: number;
  used: number;
  remaining: number;
}

class VacationService {
  // Vacation Requests
  public async createVacationRequest(request: VacationRequestDto): Promise<VacationRequest> {
    return apiService.post<VacationRequest>('/vacations/requests', request);
  }

  public async getAllVacationRequests(): Promise<VacationRequest[]> {
    return apiService.get<VacationRequest[]>('/vacations/requests');
  }

  public async getVacationRequestById(id: string): Promise<VacationRequest> {
    return apiService.get<VacationRequest>(`/vacations/requests/${id}`);
  }

  public async getVacationRequestsByUser(userId: string): Promise<VacationRequest[]> {
    return apiService.get<VacationRequest[]>(`/vacations/requests/user/${userId}`);
  }

  public async getVacationRequestsByDepartment(departmentId: string): Promise<VacationRequest[]> {
    return apiService.get<VacationRequest[]>(`/vacations/requests/department/${departmentId}`);
  }

  public async getVacationRequestsByDateRange(startDate: Date, endDate: Date): Promise<VacationRequest[]> {
    return apiService.get<VacationRequest[]>('/vacations/requests/date-range', {
      params: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
    });
  }

  public async updateVacationRequest(id: string, request: Partial<VacationRequestDto>): Promise<VacationRequest> {
    return apiService.put<VacationRequest>(`/vacations/requests/${id}`, request);
  }

  public async approveVacationRequest(id: string, approverId: string, note?: string): Promise<VacationRequest> {
    return apiService.post<VacationRequest>(`/vacations/requests/${id}/approve`, {
      approverId,
      note,
    });
  }

  public async rejectVacationRequest(id: string, approverId: string, note?: string): Promise<VacationRequest> {
    return apiService.post<VacationRequest>(`/vacations/requests/${id}/reject`, {
      approverId,
      note,
    });
  }

  public async deleteVacationRequest(id: string): Promise<void> {
    return apiService.delete<void>(`/vacations/requests/${id}`);
  }

  // Vacation Settings
  public async createVacationSetting(setting: VacationSettingDto): Promise<VacationSetting> {
    return apiService.post<VacationSetting>('/vacations/settings', setting);
  }

  public async getVacationSettingByUserAndYear(userId: string, year: number): Promise<VacationSetting> {
    return apiService.get<VacationSetting>(`/vacations/settings/${userId}/${year}`);
  }

  public async updateVacationSetting(id: string, setting: Partial<VacationSettingDto>): Promise<VacationSetting> {
    return apiService.put<VacationSetting>(`/vacations/settings/${id}`, setting);
  }

  // Statistics
  public async getVacationStats(userId: string, year: number): Promise<VacationStats> {
    return apiService.get<VacationStats>(`/vacations/stats/${userId}/${year}`);
  }
}

export const vacationService = new VacationService();
