import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RefreshToken } from './entities/refresh-token.entity';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (user && await bcrypt.compare(password, user.passwordHash)) {
      const { passwordHash, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id, role: user.role };
    
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(
      { sub: user.id },
      { expiresIn: this.configService.get('jwt.refreshExpiresIn') }
    );

    // Uložení refresh tokenu do databáze
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 dnů platnost
    
    await this.refreshTokenRepository.save({
      userId: user.id,
      token: refreshToken,
      expiresAt,
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      }
    };
  }

  async refreshToken(token: string) {
    try {
      // Verifikace tokenu
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get('jwt.secret'),
      });

      // Kontrola existence tokenu v databázi
      const refreshTokenEntity = await this.refreshTokenRepository.findOne({
        where: { token, userId: payload.sub },
      });

      if (!refreshTokenEntity) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Kontrola expirace
      if (new Date() > refreshTokenEntity.expiresAt) {
        // Odstranění prošlého tokenu
        await this.refreshTokenRepository.remove(refreshTokenEntity);
        throw new UnauthorizedException('Refresh token expired');
      }

      // Získání uživatele
      const user = await this.usersService.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Generování nových tokenů
      const result = await this.login(user);
      
      // Odstranění starého tokenu
      await this.refreshTokenRepository.remove(refreshTokenEntity);
      
      return result;
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string, token: string): Promise<void> {
    const refreshToken = await this.refreshTokenRepository.findOne({
      where: { userId, token },
    });

    if (refreshToken) {
      await this.refreshTokenRepository.remove(refreshToken);
    }
  }
}
