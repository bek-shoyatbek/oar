import { Injectable } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}
  async create(createUserDto: Prisma.UserCreateInput) {
    const newUser = await this.prisma.user.create({
      data: createUserDto,
    });

    return this.exclude(newUser, 'password');
  }

  async findOneByEmail(email: string) {
    return await this.prisma.user.findFirst({
      where: {
        email,
      },
    });
  }

  async findOneByPhone(phone: string) {
    return await this.prisma.user.findFirst({
      where: {
        phone,
      },
    });
  }

  async findOneById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id,
      },
    });
    return this.exclude(user, 'password');
  }

  async update(id: string, updateUserDto: Prisma.UserUpdateInput) {
    const user = await this.prisma.user.update({
      where: {
        id,
      },
      data: {
        ...updateUserDto,
      },
    });

    return this.exclude(user, 'password');
  }

  async remove(id: string) {
    return await this.prisma.user.delete({
      where: {
        id,
      },
    });
  }
  // Exclude keys from user
  exclude(user: User, ...keys: string[]) {
    for (const key of keys) {
      delete user[key];
    }
    return user;
  }
}
