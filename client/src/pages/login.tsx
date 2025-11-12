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

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { login } = useAuth();
  const { t } = useI18n();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
  await login(formData.username, formData.password);
      
      toast({
        title: t('loginSuccessful'),
        description: t('welcome') + "!",
      });
      
      setLocation("/");
    } catch (error) {
      toast({
        title: t('loginFailed'),
        description: t('invalidCredentials'),
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
            <CardTitle className="text-2xl">{t('welcomeBack')}</CardTitle>
            <CardDescription>
              {t('signInToAccount')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">{t('username')}</Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder={t('enterUsername')}
                  value={formData.username}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">{t('password')} <span className="opacity-60 text-xs">(per le utenze demo puoi lasciare vuoto)</span></Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder={t('enterPassword')}
                  value={formData.password}
                  onChange={handleChange}
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
                    {t('signingIn')}
                  </>
                ) : (
                  <>
                    <i className="fas fa-sign-in-alt mr-2"></i>
                    {t('signIn')}
                  </>
                )}
              </Button>
              
              <div className="text-center text-sm text-muted">
                {t('dontHaveAccount')}{" "}
                <a href="/register" className="text-gold-primary hover:text-gold-accent font-semibold">
                  {t('signUpHere')}
                </a>
              </div>
            </form>

            {/* Demo quick login */}
            <div className="mt-6">
              <div className="text-center text-sm mb-3 opacity-80">Accesso demo rapido</div>
              <div className="grid grid-cols-3 gap-2">
                <Button variant="secondary" onClick={async () => {
                  try {
                    setIsLoading(true);
                    await login('utente', '');
                    toast({ title: 'Login demo (utente)', description: 'Accesso eseguito' });
                    setLocation('/');
                  } catch {
                    toast({ title: 'Login fallito', variant: 'destructive' });
                  } finally { setIsLoading(false); }
                }}>Utente</Button>
                <Button variant="secondary" onClick={async () => {
                  try {
                    setIsLoading(true);
                    await login('modella', '');
                    toast({ title: 'Login demo (modella)', description: 'Accesso eseguito' });
                    setLocation('/dashboard/model');
                  } catch {
                    toast({ title: 'Login fallito', variant: 'destructive' });
                  } finally { setIsLoading(false); }
                }}>Modella</Button>
                <Button variant="secondary" onClick={async () => {
                  try {
                    setIsLoading(true);
                    await login('admin', '');
                    toast({ title: 'Login demo (admin)', description: 'Accesso eseguito' });
                    setLocation('/admin');
                  } catch {
                    toast({ title: 'Login fallito', variant: 'destructive' });
                  } finally { setIsLoading(false); }
                }}>Admin</Button>
              </div>
              <div className="mt-2 text-xs text-center opacity-70">Le utenze demo non richiedono password.</div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Footer />
    </div>
  );
}