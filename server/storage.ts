import { type User, type InsertUser, type Model, type InsertModel } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getModels(filters?: { isOnline?: boolean; isVip?: boolean; isNew?: boolean; sortBy?: 'rating' | 'viewers' }): Promise<Model[]>;
  getModel(id: string): Promise<Model | undefined>;
  createModel(model: InsertModel): Promise<Model>;
  updateModelOnlineStatus(id: string, isOnline: boolean): Promise<Model | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private models: Map<string, Model>;

  constructor() {
    this.users = new Map();
    this.models = new Map();
    this.initializeModels();
  }

  private initializeModels() {
    // Initialize with some sample models for the demo
    const sampleModels: InsertModel[] = [
      {
        name: "Sophia",
        age: 24,
        country: "Italy",
        languages: ["EN", "IT"],
        specialties: ["Private shows", "role play", "lingerie"],
        isOnline: true,
        isVip: true,
        isNew: false,
        rating: 49,
        viewerCount: 1234,
        profileImage: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=533"
      },
      {
        name: "Emma",
        age: 22,
        country: "France",
        languages: ["EN", "FR"],
        specialties: ["Dancing", "conversation", "fun vibes"],
        isOnline: true,
        isVip: false,
        isNew: false,
        rating: 48,
        viewerCount: 892,
        profileImage: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=533"
      },
      {
        name: "Isabella",
        age: 26,
        country: "Spain",
        languages: ["ES", "EN"],
        specialties: ["Exclusive shows", "fantasy fulfillment"],
        isOnline: true,
        isVip: true,
        isNew: false,
        rating: 50,
        viewerCount: 1456,
        profileImage: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=533"
      },
      {
        name: "Mia",
        age: 21,
        country: "USA",
        languages: ["EN"],
        specialties: ["Friendly chat", "good vibes only"],
        isOnline: true,
        isVip: false,
        isNew: false,
        rating: 47,
        viewerCount: 678,
        profileImage: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=533"
      },
      {
        name: "Olivia",
        age: 23,
        country: "UK",
        languages: ["EN"],
        specialties: ["New to the platform", "let's get acquainted"],
        isOnline: true,
        isVip: false,
        isNew: true,
        rating: 46,
        viewerCount: 445,
        profileImage: "https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=533"
      },
      {
        name: "Ava",
        age: 25,
        country: "Germany",
        languages: ["DE", "EN"],
        specialties: ["Premium experience", "exclusive content"],
        isOnline: true,
        isVip: true,
        isNew: false,
        rating: 49,
        viewerCount: 1789,
        profileImage: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=533"
      },
      {
        name: "Lily",
        age: 20,
        country: "Canada",
        languages: ["EN"],
        specialties: ["Sweet and playful", "great conversation"],
        isOnline: true,
        isVip: false,
        isNew: false,
        rating: 48,
        viewerCount: 567,
        profileImage: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=533"
      },
      {
        name: "Grace",
        age: 27,
        country: "Australia",
        languages: ["EN"],
        specialties: ["Experienced performer", "all fantasies welcome"],
        isOnline: true,
        isVip: false,
        isNew: false,
        rating: 49,
        viewerCount: 923,
        profileImage: "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=533"
      },
      {
        name: "Victoria",
        age: 29,
        country: "Sweden",
        languages: ["EN", "SE"],
        specialties: ["#1 Top rated", "professional shows"],
        isOnline: true,
        isVip: true,
        isNew: false,
        rating: 50,
        viewerCount: 2456,
        profileImage: "https://images.unsplash.com/photo-1532170579297-281918c8ae72?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=533"
      },
      {
        name: "Scarlett",
        age: 26,
        country: "Poland",
        languages: ["PL", "EN"],
        specialties: ["#2 Top rated", "exclusive performances"],
        isOnline: false,
        isVip: true,
        isNew: false,
        rating: 50,
        viewerCount: 1987,
        profileImage: "https://images.unsplash.com/photo-1506863530036-1efeddceb993?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=533"
      }
    ];

    sampleModels.forEach(model => {
      this.createModel(model);
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getModels(filters?: { isOnline?: boolean; isVip?: boolean; isNew?: boolean; sortBy?: 'rating' | 'viewers' }): Promise<Model[]> {
    let models = Array.from(this.models.values());
    
    if (filters) {
      if (filters.isOnline !== undefined) {
        models = models.filter(model => model.isOnline === filters.isOnline);
      }
      if (filters.isVip !== undefined) {
        models = models.filter(model => model.isVip === filters.isVip);
      }
      if (filters.isNew !== undefined) {
        models = models.filter(model => model.isNew === filters.isNew);
      }
    }

    // Sort based on sortBy parameter
    if (filters?.sortBy === 'rating') {
      return models.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else {
      // Default: sort by viewer count descending
      return models.sort((a, b) => (b.viewerCount || 0) - (a.viewerCount || 0));
    }
  }

  async getModel(id: string): Promise<Model | undefined> {
    return this.models.get(id);
  }

  async createModel(insertModel: InsertModel): Promise<Model> {
    const id = randomUUID();
    const model: Model = { 
      id,
      name: insertModel.name,
      age: insertModel.age,
      country: insertModel.country,
      languages: insertModel.languages,
      specialties: insertModel.specialties,
      isOnline: insertModel.isOnline ?? false,
      isVip: insertModel.isVip ?? false,
      isNew: insertModel.isNew ?? false,
      rating: insertModel.rating ?? 0,
      viewerCount: insertModel.viewerCount ?? 0,
      profileImage: insertModel.profileImage,
      createdAt: new Date()
    };
    this.models.set(id, model);
    return model;
  }

  async updateModelOnlineStatus(id: string, isOnline: boolean): Promise<Model | undefined> {
    const model = this.models.get(id);
    if (model) {
      model.isOnline = isOnline;
      this.models.set(id, model);
      return model;
    }
    return undefined;
  }
}

export const storage = new MemStorage();
