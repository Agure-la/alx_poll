import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-12">
      {/* Hero Section */}
      <section className="text-center py-16">
        <h1 className="text-4xl md:text-6xl font-bold mb-6">
          Welcome to <span className="text-primary">Polly</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Create, share, and participate in community polls. 
          Gather opinions, make decisions, and engage with your audience.
        </p>
        <div className="flex gap-4 justify-center">
          <Button size="lg" asChild>
            <Link href="/polls/create">Create Your First Poll</Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/polls">Browse Polls</Link>
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <h2 className="text-3xl font-bold text-center mb-12">
          Why Choose Polly?
        </h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">🗳️</span>
                Easy to Use
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Create polls in seconds with our intuitive interface. 
                No complex setup required.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">📊</span>
                Real-time Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Watch votes come in real-time with beautiful visualizations 
                and instant analytics.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">🔐</span>
                Secure & Private
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Your data is protected with enterprise-grade security. 
                Anonymous voting options available.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="text-center py-16 bg-gray-50 rounded-lg">
        <h2 className="text-3xl font-bold mb-4">
          Ready to Get Started?
        </h2>
        <p className="text-gray-600 mb-8 max-w-xl mx-auto">
          Join thousands of users who trust Polly for their polling needs. 
          Create your account today and start gathering valuable feedback.
        </p>
        <div className="flex gap-4 justify-center">
          <Button size="lg" asChild>
            <Link href="/auth/register">Sign Up Free</Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/auth/login">Sign In</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
