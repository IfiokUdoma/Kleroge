import {
  Body,
  Controller,
  Get,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserResponseDto } from './dto/user-response.dto';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getMe(@CurrentUser() currentUser: { id: string }): Promise<UserResponseDto> {
    const user = await this.usersService.findByIdOrNull(currentUser.id);
    if (!user) {
      throw new Error('Authenticated user not found — should not happen.');
    }
    return UserResponseDto.fromEntity(user);
  }

  @Patch('me')
  async updateMe(
    @CurrentUser() currentUser: { id: string },
    @Body() dto: UpdateProfileDto,
  ): Promise<UserResponseDto> {
    const updated = await this.usersService.updateProfile(currentUser.id, dto);
    return UserResponseDto.fromEntity(updated);
  }
}
