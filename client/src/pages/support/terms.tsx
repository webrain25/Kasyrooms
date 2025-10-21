import Header from "@/components/header";
import Footer from "@/components/footer";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-4">Terms of Service</h1>
        <p className="text-muted">Our terms and conditions.</p>
      </div>
      <Footer />
    </div>
  );
}
