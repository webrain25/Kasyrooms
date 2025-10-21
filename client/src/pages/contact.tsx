import Header from "@/components/header";
import Footer from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, Phone, MapPin, Clock } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function Contact() {
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">{t('contact.title')}</h1>
          <p className="text-xl text-muted-foreground">
            {t('contact.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <Card>
            <CardHeader>
              <CardTitle>{t('contact.form.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">{t('contact.form.firstName')}</Label>
                  <Input id="firstName" name="firstName" placeholder={t('contact.form.firstNamePlaceholder')} />
                </div>
                <div>
                  <Label htmlFor="lastName">{t('contact.form.lastName')}</Label>
                  <Input id="lastName" name="lastName" placeholder={t('contact.form.lastNamePlaceholder')} />
                </div>
              </div>
              <div>
                <Label htmlFor="email">{t('contact.form.email')}</Label>
                <Input id="email" name="email" type="email" placeholder={t('contact.form.emailPlaceholder')} />
              </div>
              <div>
                <Label htmlFor="subject">{t('contact.form.subject')}</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder={t('contact.form.subjectPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">{t('contact.form.subjects.general')}</SelectItem>
                    <SelectItem value="technical">{t('contact.form.subjects.technical')}</SelectItem>
                    <SelectItem value="billing">{t('contact.form.subjects.billing')}</SelectItem>
                    <SelectItem value="model">{t('contact.form.subjects.model')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="message">{t('contact.form.message')}</Label>
                <Textarea 
                  id="message" 
                  placeholder={t('contact.form.messagePlaceholder')} 
                  rows={6}
                />
              </div>
              <Button className="w-full">{t('contact.form.submit')}</Button>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start space-x-4">
                  <Mail className="w-6 h-6 text-pink-500 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">{t('contact.info.email.title')}</h3>
                    <p className="text-muted-foreground">{t('contact.info.email.description')}</p>
                    <p className="text-pink-500">support@kasyrooms.com</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start space-x-4">
                  <Phone className="w-6 h-6 text-pink-500 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">{t('contact.info.phone.title')}</h3>
                    <p className="text-muted-foreground">{t('contact.info.phone.description')}</p>
                    <p className="text-pink-500">+1 (555) 123-4567</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start space-x-4">
                  <MapPin className="w-6 h-6 text-pink-500 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">{t('contact.info.address.title')}</h3>
                    <p className="text-muted-foreground">
                      {t('contact.info.address.description')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start space-x-4">
                  <Clock className="w-6 h-6 text-pink-500 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">{t('contact.info.hours.title')}</h3>
                    <div className="space-y-1 text-muted-foreground">
                      <p>{t('contact.info.hours.weekdays')}</p>
                      <p>{t('contact.info.hours.weekend')}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}