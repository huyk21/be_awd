import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from './users.schema';
import { Model } from 'mongoose';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name); // Create a logger instance

  private users = [
    {
      userId: '1',
      email: 'user1@example.com',
      passwordHash: 'hashedpassword1',
      fullName: 'User One',
      profilePictureUrl: 'https://example.com/user1.jpg',
    },
    {
      userId: '2',
      email: 'user2@example.com',
      passwordHash: 'hashedpassword2',
      fullName: 'User Two',
      profilePictureUrl: 'https://example.com/user2.jpg',
    },
  ];

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  getAllUsers() {
    this.logger.debug('Fetching all users');
    return this.users;
  }

  async getUserById(userId: string): Promise<User> {
    this.logger.debug(`Fetching user by ID: ${userId}`);
  
    const user = await this.userModel.findOne({ userId }).exec(); // Query the database
    if (!user) {
      this.logger.warn(`User with ID ${userId} not found`);
      throw new NotFoundException(`User with ID ${userId} not found.`);
    }
  
    this.logger.log(`User with ID ${userId} fetched successfully`);
    return user;
  }
  

  createUser(data: any) {
    const newUser = { userId: Date.now().toString(), ...data };
    this.logger.debug(`Creating new user with data: ${JSON.stringify(data)}`);
    this.users.push(newUser);
    this.logger.log(`User created with ID: ${newUser.userId}`);
    return newUser;
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    this.logger.debug(
      `Updating user with ID ${userId} with updates: ${JSON.stringify(updates)}`,
    );

    const updatedUser = await this.userModel.findOneAndUpdate(
      { userId }, // Find by userId
      { $set: updates }, // Apply updates
      { new: true, runValidators: true }, // Return updated document and run schema validation
    );

    if (!updatedUser) {
      this.logger.warn(`User with ID ${userId} not found for update`);
      throw new NotFoundException(`User with ID ${userId} not found.`);
    }

    this.logger.log(`User with ID ${userId} updated successfully`);
    return updatedUser;
  }

  deleteUser(userId: string) {
    this.logger.debug(`Deleting user with ID: ${userId}`);
    const index = this.users.findIndex((user) => user.userId === userId);
    if (index !== -1) {
      this.users.splice(index, 1);
      this.logger.log(`User with ID ${userId} deleted successfully`);
      return { message: 'User deleted successfully' };
    }

    this.logger.warn(`User with ID ${userId} not found for deletion`);
    return null;
  }
}
