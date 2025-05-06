import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): { message: string; status: string; timestamp: number } {
    return {
      message: 'CIG Vacation System API is running',
      status: 'online',
      timestamp: Date.now(),
    };
  }
}
