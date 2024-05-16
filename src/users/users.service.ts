import { Injectable } from '@nestjs/common';
import { Prisma, Users } from '@prisma/client';

import { PrismaService } from 'src/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}
  async create(createUserDto: Prisma.UsersCreateInput) {
    const newUser = await this.prisma.users.create({
      data: {
        ...createUserDto,
        role: 'user',
      },
    });

    return this.exclude(newUser, 'password');
  }

  async findOneByEmail(email: string) {
    return await this.prisma.users.findFirst({
      where: {
        email,
      },
    });
  }

  async findOneByPhone(phone: string) {
    return await this.prisma.users.findFirst({
      where: {
        phone,
      },
    });
  }

  async findOneById(id: string) {
    const user = await this.prisma.users.findUnique({
      where: {
        id,
      },
    });
    return this.exclude(user, 'password');
  }

  async update(id: string, updateUserDto: Prisma.UsersUpdateInput) {
    const user = await this.prisma.users.update({
      where: {
        id,
      },
      data: {
        ...updateUserDto,
        role: 'user',
      },
    });

    return this.exclude(user, 'password');
  }

  async remove(id: string) {
    return await this.prisma.users.delete({
      where: {
        id,
      },
    });
  }
  // Exclude keys from user
  exclude(user: Users, ...keys: string[]) {
    for (const key of keys) {
      delete user[key];
    }
    return user;
  }
}
