import Header from "@/components/header";
import Footer from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, Star, DollarSign, Users } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function BecomeModelPage() {
  const { t } = useI18n();

  const requirements = [
    'becomeModel.requirements.0',
    'becomeModel.requirements.1',
    'becomeModel.requirements.2',
    'becomeModel.requirements.3'
  ];

  const benefits = [
    {
      icon: DollarSign,
      title: 'becomeModel.benefits.0.title',
      description: 'becomeModel.benefits.0.description'
    },
    {
      icon: Star,
      title: 'becomeModel.benefits.1.title', 
      description: 'becomeModel.benefits.1.description'
    },
    {
      icon: Users,
      title: 'becomeModel.benefits.2.title',
      description: 'becomeModel.benefits.2.description'
    },
    {
      icon: Camera,
      title: 'becomeModel.benefits.3.title',
      description: 'becomeModel.benefits.3.description'
    }
  ];

  const steps = [
    'becomeModel.steps.0',
    'becomeModel.steps.1',
    'becomeModel.steps.2',
    'becomeModel.steps.3'
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">{t('becomeModel.title')}</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t('becomeModel.subtitle')}
          </p>
        </div>

        {/* Benefits Section */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-center mb-8">{t('becomeModel.benefitsTitle')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {benefits.map((benefit, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="flex items-start space-x-4">
                    <benefit.icon className="w-8 h-8 text-pink-500 mt-1" />
                    <div>
                      <h3 className="font-semibold mb-2">{t(benefit.title)}</h3>
                      <p className="text-muted-foreground">{t(benefit.description)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Requirements Section */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-center mb-8">{t('becomeModel.requirementsTitle')}</h2>
          <Card className="max-w-2xl mx-auto">
            <CardContent className="pt-6">
              <ul className="space-y-3">
                {requirements.map((requirement, index) => (
                  <li key={index} className="flex items-center">
                    <div className="w-2 h-2 bg-pink-500 rounded-full mr-3"></div>
                    <span>{t(requirement)}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* How to Start Section */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-center mb-8">{t('becomeModel.stepsTitle')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, index) => (
              <Card key={index} className="text-center">
                <CardHeader>
                  <div className="w-12 h-12 bg-pink-500 text-white rounded-full flex items-center justify-center mx-auto mb-2 text-xl font-bold">
                    {index + 1}
                  </div>
                  <CardTitle className="text-lg">{t('becomeModel.stepTitle')} {index + 1}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{t(step)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg p-8 text-white">
          <h2 className="text-3xl font-bold mb-4">{t('becomeModel.ctaTitle')}</h2>
          <p className="text-xl mb-6">{t('becomeModel.ctaSubtitle')}</p>
          <Button size="lg" variant="secondary" className="text-black">
            {t('becomeModel.ctaButton')}
          </Button>
        </div>
      </div>
      <Footer />
    </div>
  );
}
