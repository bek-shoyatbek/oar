import { UpdateUserDto } from './dto/update-user.dto';
import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma, Users } from '@prisma/client';
import { ObjectId } from 'mongodb';

import { PrismaService } from 'src/prisma.service';
import { HashingService } from 'src/utils/hashing/hashing.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private hashingService: HashingService,
  ) {}
  async create(createUserDto: Prisma.UsersCreateInput) {
    const newUser = await this.prisma.users.create({
      data: {
        ...createUserDto,
        role: 'user',
      },
    });

    return this.exclude(newUser, 'password');
  }

  async findAll() {
    const users = await this.prisma.users.findMany();

    return users.map((user) => {
      this.exclude(user, 'password');
      this.exclude(user, 'refreshToken');
      return user;
    });
  }

  async findOne(id: string) {
    if (!ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid user id');
    }
    const user = await this.prisma.users.findUnique({
      where: {
        id,
      },
      include: {
        MyCourse: true,
      },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    this.exclude(user, 'refreshToken');

    const courses = await this.prisma.courses.findMany({
      where: {
        id: {
          in: user.MyCourse.map((myCourse) => myCourse.courseId),
        },
      },
    });

    const plans = await this.prisma.plans.findMany({
      where: {
        id: {
          in: user.MyCourse.map((myCourse) => myCourse.planId),
        },
      },
    });

    courses?.map((course) => {
      plans?.map((plan) => {
        if (course.id === plan.courseId) {
          course['plan'] = plan;
        }
      });
    });

    this.exclude(user, 'MyCourse');

    const response = {
      user: this.exclude(user, 'password'),
      courses,
    };

    return response;
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
    if (!ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid user id');
    }

    if (updateUserDto.password) {
      updateUserDto.password = await this.hashingService.hashPassword(
        updateUserDto.password as string,
      );
    }

    if (updateUserDto.role) {
      throw new BadRequestException('You can not change user role');
    }

    const user = await this.prisma.users.update({
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
