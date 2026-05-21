import { User, PublicUser, Address } from '../models/user';
import { isValidEmail } from '../utils/validators';

const users = new Map<string, User>();

let userIdCounter = 1;

function generateUserId(): string {
  return `usr_${String(userIdCounter++).padStart(6, '0')}`;
}

export interface CreateUserInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface UpdateUserInput {
  firstName?: string;
  lastName?: string;
  phone?: string;
  addresses?: Address[];
}

function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    addresses: user.addresses,
    isEmailVerified: user.isEmailVerified,
    createdAt: user.createdAt,
  };
}

export function validateEmail(email: string): boolean {
  return isValidEmail(email);
}

export function hashPassword(password: string): string {
  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }
  return `hashed_${Buffer.from(password).toString('base64')}`;
}

export function generateAuthToken(userId: string): string {
  const payload = { sub: userId, iat: Date.now() };
  return `token_${Buffer.from(JSON.stringify(payload)).toString('base64')}`;
}

export function createUser(input: CreateUserInput): PublicUser {
  if (!validateEmail(input.email)) {
    throw new Error('Invalid email address');
  }

  const existingUser = Array.from(users.values()).find(
    u => u.email.toLowerCase() === input.email.toLowerCase(),
  );
  if (existingUser) {
    throw new Error('Email already in use');
  }

  if (input.password.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }

  const id = generateUserId();
  const now = new Date();

  const user: User = {
    id,
    email: input.email.toLowerCase(),
    passwordHash: hashPassword(input.password),
    firstName: input.firstName,
    lastName: input.lastName,
    phone: input.phone,
    addresses: [],
    isActive: true,
    isEmailVerified: false,
    createdAt: now,
    updatedAt: now,
  };

  users.set(id, user);
  return toPublicUser(user);
}

export function getUserById(id: string): PublicUser {
  const user = users.get(id);
  if (!user) {
    throw new Error(`User not found: ${id}`);
  }
  if (!user.isActive) {
    throw new Error('User account is deactivated');
  }
  return toPublicUser(user);
}

export function updateUser(id: string, input: UpdateUserInput): PublicUser {
  const user = users.get(id);
  if (!user) {
    throw new Error(`User not found: ${id}`);
  }
  if (!user.isActive) {
    throw new Error('User account is deactivated');
  }

  if (input.firstName !== undefined) {
    if (input.firstName.trim() === '') {
      throw new Error('First name cannot be empty');
    }
    user.firstName = input.firstName.trim();
  }

  if (input.lastName !== undefined) {
    if (input.lastName.trim() === '') {
      throw new Error('Last name cannot be empty');
    }
    user.lastName = input.lastName.trim();
  }

  if (input.phone !== undefined) {
    user.phone = input.phone;
  }

  if (input.addresses !== undefined) {
    const defaultAddresses = input.addresses.filter(a => a.isDefault);
    if (defaultAddresses.length > 1) {
      throw new Error('Only one address can be set as default');
    }
    user.addresses = input.addresses;
  }

  user.updatedAt = new Date();
  return toPublicUser(user);
}

export function getUserByEmail(email: string): User | undefined {
  return Array.from(users.values()).find(
    u => u.email === email.toLowerCase(),
  );
}

export function deactivateUser(id: string): void {
  const user = users.get(id);
  if (!user) {
    throw new Error(`User not found: ${id}`);
  }
  user.isActive = false;
  user.updatedAt = new Date();
}

export function _resetStore(): void {
  users.clear();
  userIdCounter = 1;
}
