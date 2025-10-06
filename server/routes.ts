import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all models with optional filters
  app.get("/api/models", async (req, res) => {
    try {
      const filters: { isOnline?: boolean; isVip?: boolean; isNew?: boolean; sortBy?: 'rating' | 'viewers' } = {};
      
      if (req.query.online === "true") filters.isOnline = true;
      if (req.query.vip === "true") filters.isVip = true;
      if (req.query.new === "true") filters.isNew = true;
      if (req.query.sortBy === "rating" || req.query.sortBy === "viewers") {
        filters.sortBy = req.query.sortBy;
      }
      
      const models = await storage.getModels(filters);
      res.json(models);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch models" });
    }
  });

  // Get a specific model
  app.get("/api/models/:id", async (req, res) => {
    try {
      const model = await storage.getModel(req.params.id);
      if (!model) {
        return res.status(404).json({ error: "Model not found" });
      }
      res.json(model);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch model" });
    }
  });

  // Get online models count
  app.get("/api/stats/online-count", async (req, res) => {
    try {
      const onlineModels = await storage.getModels({ isOnline: true });
      res.json({ count: onlineModels.length });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch online count" });
    }
  });

  // Update model online status (for demonstration)
  app.patch("/api/models/:id/status", async (req, res) => {
    try {
      const { isOnline } = req.body;
      const model = await storage.updateModelOnlineStatus(req.params.id, isOnline);
      if (!model) {
        return res.status(404).json({ error: "Model not found" });
      }
      res.json(model);
    } catch (error) {
      res.status(500).json({ error: "Failed to update model status" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
