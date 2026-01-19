import { useState } from "react";
import { useLocation } from "wouter";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/authContext";
import { useI18n } from "@/lib/i18n";

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { register } = useAuth();
  const { t } = useI18n();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    dateOfBirth: "", // yyyy-mm-dd
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: t("register.toast.passwordMismatch.title"),
        description: t("register.toast.passwordMismatch.desc"),
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      await register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName || undefined,
        lastName: formData.lastName || undefined,
        dateOfBirth: formData.dateOfBirth || undefined,
      });
      
      toast({
        title: t("register.toast.accountCreated.title"),
        description: t("register.toast.accountCreated.desc"),
      });
      
      setLocation("/");
    } catch (error) {
      toast({
        title: t("register.toast.failed.title"),
        description: t("register.toast.failed.desc"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{t("register.title")}</CardTitle>
            <CardDescription>
              {t("register.subtitle")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">{t("register.firstName")}</Label>
                      <Input id="firstName" name="firstName" type="text" placeholder={t("register.firstName.placeholder")} value={formData.firstName} onChange={handleChange} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">{t("register.lastName")}</Label>
                      <Input id="lastName" name="lastName" type="text" placeholder={t("register.lastName.placeholder")} value={formData.lastName} onChange={handleChange} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">{t("register.dob")}</Label>
                    <Input id="dateOfBirth" name="dateOfBirth" type="date" value={formData.dateOfBirth} onChange={handleChange} />
                  </div>
              <div className="space-y-2">
                <Label htmlFor="username">{t("username")}</Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder={t("register.username.placeholder")}
                  value={formData.username}
                  onChange={handleChange}
                  required
                />
              </div>
              {/* Payment card section removed as requested */}
              
              <div className="space-y-2">
                <Label htmlFor="email">{t("email")}</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder={t("register.email.placeholder")}
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">{t("password")}</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder={t("register.password.placeholder")}
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t("register.confirmPassword")}</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder={t("register.confirmPassword.placeholder")}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full btn-gold text-background"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    {t("register.creating")}
                  </>
                ) : (
                  <>
                    <i className="fas fa-user-plus mr-2"></i>
                    {t("register.create")}
                  </>
                )}
              </Button>
              
              <div className="text-center text-sm text-muted">
                {t("register.haveAccount")} {" "}
                <a href="/login" className="text-gold-primary hover:text-gold-accent font-semibold">
                  {t("register.signInHere")}
                </a>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
      
      <Footer />
    </div>
  );
}