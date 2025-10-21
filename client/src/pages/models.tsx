import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import Header from "@/components/header";
import Footer from "@/components/footer";
import ModelCard from "@/components/model-card";
import CategoryFilters from "@/components/category-filters";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Model } from "@shared/schema";

export default function AllModels() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [filterOnline, setFilterOnline] = useState("all");
  
  const { data: models = [], isLoading } = useQuery({
    queryKey: ["/api/models"],
    queryFn: async (): Promise<Model[]> => {
      const response = await fetch("/api/models");
      if (!response.ok) {
        throw new Error("Failed to fetch models");
      }
      return response.json();
    },
  });

  // Filter and sort models
  const filteredModels = models
    .filter(model => {
      const matchesSearch = model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          model.specialties.some(specialty => 
                            specialty.toLowerCase().includes(searchTerm.toLowerCase())
                          );
      
      const matchesOnlineFilter = filterOnline === "all" || 
                                 (filterOnline === "online" && model.isOnline) ||
                                 (filterOnline === "offline" && !model.isOnline);
      
      return matchesSearch && matchesOnlineFilter;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "rating":
          return (b.rating || 0) - (a.rating || 0);
        case "viewers":
          return (b.viewerCount || 0) - (a.viewerCount || 0);
        case "age":
          return a.age - b.age;
        default:
          return 0;
      }
    });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="aspect-[3/4] bg-muted rounded-t-card"></div>
                <CardContent className="p-4">
                  <div className="h-4 bg-muted rounded mb-2"></div>
                  <div className="h-3 bg-muted rounded w-3/4"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-4">All Models</h1>
          <p className="text-muted">Discover all our amazing models</p>
        </div>

        {/* Filters and Search (non-sticky) */}
        <div>
          <Card className="mb-8 bg-background/95 backdrop-blur border-border shadow-md">
            <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Search</label>
                <Input
                  placeholder="Search models..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Sort By</label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="rating">Rating</SelectItem>
                    <SelectItem value="viewers">Viewers</SelectItem>
                    <SelectItem value="age">Age</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Status</label>
                <Select value={filterOnline} onValueChange={setFilterOnline}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="offline">Offline</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-end">
                <Button 
                  onClick={() => {
                    setSearchTerm("");
                    setSortBy("name");
                    setFilterOnline("all");
                  }}
                  variant="outline"
                  className="w-full"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
            </CardContent>
          </Card>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-muted">
            Showing {filteredModels.length} of {models.length} models
          </p>
        </div>

        {/* Models Grid */}
        {filteredModels.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredModels.map((model) => (
              <ModelCard key={model.id} model={model} />
            ))}
          </div>
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-foreground mb-2">No models found</h3>
              <p className="text-muted mb-4">Try adjusting your search or filters</p>
              <Button 
                onClick={() => {
                  setSearchTerm("");
                  setSortBy("name");
                  setFilterOnline("all");
                }}
              >
                Clear All Filters
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
      
      <Footer />
    </div>
  );
}