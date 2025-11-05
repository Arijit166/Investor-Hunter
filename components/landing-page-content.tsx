"use client"
import { AuthModal } from "@/components/ui/auth-modal"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { 
  Play, Upload, Brain, MessageSquare, Star, ArrowRight, Globe, Zap, Shield, 
  Film, BarChart3, ClipboardCheck, UserCheck, CheckSquare, Users, Video 
} from "lucide-react"
import Link from "next/link"
import { useEffect, useState, useCallback, useRef } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel"
import useEmblaCarousel from "embla-carousel-react"
import Autoplay from "embla-carousel-autoplay"
import { useSearchParams } from 'next/navigation'
import TestimonialCarousel from "@/components/TestimonialCarousel"
import { useAppSession } from "@/hooks/use-app-session"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
export function LandingPageContent() {
  const searchParams = useSearchParams()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const { session } = useAppSession()
  
  useEffect(() => {
    // Check if user was redirected from a protected route
    if (searchParams.get('redirected') === 'true') {
      setShowAuthModal(true)
    }
  }, [searchParams])
  const { toast } = useToast()
  // Use useState and useEffect to ensure client-side rendering
  const [isMounted, setIsMounted] = useState(false)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false)
  const [feedbackText, setFeedbackText] = useState('')
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)

  const [authError, setAuthError] = useState<string | null>(null);

  // Set isMounted to true on client-side
  useEffect(() => {
    setIsMounted(true)
    document.documentElement.classList.add('dark')
  }, []);

  // Separate useEffect for handling OAuth errors
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    
    if (error === 'user_not_found') {
      setAuthError('user_not_found');
      setAuthModalOpen(true);
      // Delay toast to ensure it appears after modal
      setTimeout(() => {
        toast({
          title: "Account Not Found",
          description: "No account exists with this Google account. Please sign up first.",
          variant: "destructive",
        });
      }, 100);
      window.history.replaceState({}, '', '/');
    } else if (error === 'oauth_failed') {
      setAuthError('oauth_failed');
      setAuthModalOpen(true);
      setTimeout(() => {
        toast({
          title: "Authentication Failed",
          description: "Unable to sign in with Google. Please try again.",
          variant: "destructive",
        });
      }, 100);
      window.history.replaceState({}, '', '/');
    }
  }, [toast])

  if (!isMounted) {
    return null // Return null on server-side rendering
  }
  
  const handleSubmitPitch = (e: React.MouseEvent) => {
    e.preventDefault()
    if (isAuthenticated) {
      window.location.href = '/submit'
    } else {
      setAuthModalOpen(true)
    }
  }

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Check if user is authenticated
    if (!session?.user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to submit feedback.",
        variant: "destructive",
      })
      setFeedbackModalOpen(false)
      setAuthModalOpen(true)
      return
    }

    // Validate rating
    if (rating === 0) {
      toast({
        title: "Rating Required",
        description: "Please select a rating before submitting.",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch('/api/submit-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          feedback: feedbackText,
          rating: rating,
        }),
      })

      if (response.ok) {
        toast({
          title: "Feedback Submitted!",
          description: "Thank you for your feedback. It will appear shortly.",
        })
        setFeedbackModalOpen(false)
        setFeedbackText('')
        setRating(0)
        // Refresh the page to show new feedback
        window.location.reload()
      } else {
        throw new Error('Failed to submit feedback')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleFeedbackButtonClick = () => {
    if (!session?.user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to submit feedback.",
        variant: "destructive",
      })
      setAuthModalOpen(true)
      return
    }
    setFeedbackModalOpen(true)
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Header />

      {/* Hero Section */}
      <section className="bg-black text-white py-16 pt-12">
        <div className="container mx-auto w-full max-w-[1400px] px-3 sm:px-4 md:px-6">
          <div className="grid lg:grid-cols-2 gap-6 xl:gap-16 items-center">
            <div className="space-y-6">
              <div className="space-y-4">
                <h1 className="text-4xl md:text-5xl xl:text-6xl font-bold leading-tight">
                  Reimagining Startup{" "}
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Funding
                  </span>{" "}
                  for Everyone
                </h1>
                <p className="text-xl text-gray-300 max-w-lg">
                  Break the barriers of pitch decks, costly VC intros, and language limitations. Submit your idea with a
                  simple video.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <Link href="/submit" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto bg-[#3591e2] text-white hover:bg-[#2a7bc8]" onClick={handleSubmitPitch}>
                    Submit Your Pitch
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/investor" className="w-full sm:w-auto">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto bg-transparent border-white/20 text-white hover:bg-white/10">
                    <Play className="mr-2 h-4 w-4" />
                    Explore Funded Ideas
                  </Button>
                </Link>
              </div>
            </div>

            <div className="relative mt-8 lg:mt-0">
              <div className="aspect-video rounded-xl shadow-lg overflow-hidden">
                <img
                  src="/video-pitch-image.png"
                  alt="Entrepreneur recording a pitch video"
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trusted Investors Section */}
      <section className="py-12 md:py-16 bg-black">
        <div className="overflow-hidden">
          <div className="text-center mb-8 md:mb-10 animate-fade-in">
            <p className="text-sm md:text-base font-medium text-gray-300/80 uppercase tracking-widest">
              Trusted by Investors Worldwide
            </p>
          </div>
          
          <div className="relative w-full overflow-hidden">
            {/* Logo wrapper */}
            <div className="animate-scroll flex w-fit">
              {/* First set of logos */}
              <div className="flex items-center gap-16 md:gap-24">
                <div className="h-16 flex-shrink-0 flex items-center justify-center">
                  <img src="/LetsVenture.png" alt="LetsVenture Logo" className="h-10 object-contain" />
                </div>
                <div className="h-16 flex-shrink-0 flex items-center justify-center">
                  <img src="/MicroVentures.png" alt="MicroVentures Logo" className="h-10 object-contain" />
                </div>
                <div className="h-16 flex-shrink-0 flex items-center justify-center">
                  <img src="/IAN.png" alt="IAN Logo" className="h-10 object-contain" />
                </div>
                <div className="h-16 flex-shrink-0 flex items-center justify-center">
                  <img src="/Seedrs.png" alt="Seedrs Logo" className="h-10 object-contain" />
                </div>
                <div className="h-16 flex-shrink-0 flex items-center justify-center">
                  <img src="/Axilor-Ventures.png" alt="Axilor Ventures Logo" className="h-10 object-contain" />
                </div>
                <div className="h-16 flex-shrink-0 flex items-center justify-center">
                  <img src="/SIDBI.png" alt="SIDBI Logo" className="h-10 object-contain" />
                </div>
                <div className="h-16 flex-shrink-0 flex items-center justify-center">
                  <img src="/unitus ventures.png" alt="Unitus Ventures Logo" className="h-10 object-contain" />
                </div>
                <div className="h-16 flex-shrink-0 flex items-center justify-center">
                  <img src="/saif-partners.png" alt="SAIF Partners Logo" className="h-10 object-contain" />
                </div>
                <div className="h-16 flex-shrink-0 flex items-center justify-center">
                  <img src="/Next47.png" alt="Next47 Logo" className="h-10 object-contain" />
                </div>
                <div className="h-16 flex-shrink-0 flex items-center justify-center">
                  <img src="/kalaari-capital.png" alt="Kalaari Capital Logo" className="h-10 object-contain" />
                </div>
                <div className="h-16 flex-shrink-0 flex items-center justify-center">
                  <img src="/Blume-ventures.png" alt="Blume Ventures Logo" className="h-10 object-contain" />
                </div>
                <div className="h-16 flex-shrink-0 flex items-center justify-center">
                  <img src="/ankur-capital.png" alt="Ankur Capital Logo" className="h-10 object-contain" />
                </div>
                <div className="h-16 flex-shrink-0 flex items-center justify-center">
                  <img src="/Accel.png" alt="Accel Partners Logo" className="h-10 object-contain" />
                </div>
              </div>
              
              {/* Exact duplicate set for seamless loop */}
              <div className="flex items-center gap-16 md:gap-24">
                <div className="h-16 flex-shrink-0 flex items-center justify-center">
                  <img src="/LetsVenture.png" alt="LetsVenture Logo" className="h-10 object-contain" />
                </div>
                <div className="h-16 flex-shrink-0 flex items-center justify-center">
                  <img src="/MicroVentures.png" alt="MicroVentures Logo" className="h-10 object-contain" />
                </div>
                <div className="h-16 flex-shrink-0 flex items-center justify-center">
                  <img src="/IAN.png" alt="IAN Logo" className="h-10 object-contain" />
                </div>
                <div className="h-16 flex-shrink-0 flex items-center justify-center">
                  <img src="/Seedrs.png" alt="Seedrs Logo" className="h-10 object-contain" />
                </div>
                <div className="h-16 flex-shrink-0 flex items-center justify-center">
                  <img src="/Axilor-Ventures.png" alt="Axilor Ventures Logo" className="h-10 object-contain" />
                </div>
                <div className="h-16 flex-shrink-0 flex items-center justify-center">
                  <img src="/SIDBI.png" alt="SIDBI Logo" className="h-10 object-contain" />
                </div>
                <div className="h-16 flex-shrink-0 flex items-center justify-center">
                  <img src="/unitus ventures.png" alt="Unitus Ventures Logo" className="h-10 object-contain" />
                </div>
                <div className="h-16 flex-shrink-0 flex items-center justify-center">
                  <img src="/saif-partners.png" alt="SAIF Partners Logo" className="h-10 object-contain" />
                </div>
                <div className="h-16 flex-shrink-0 flex items-center justify-center">
                  <img src="/Next47.png" alt="Next47 Logo" className="h-10 object-contain" />
                </div>
                <div className="h-16 flex-shrink-0 flex items-center justify-center">
                  <img src="/kalaari-capital.png" alt="Kalaari Capital Logo" className="h-10 object-contain" />
                </div>
                <div className="h-16 flex-shrink-0 flex items-center justify-center">
                  <img src="/Blume-ventures.png" alt="Blume Ventures Logo" className="h-10 object-contain" />
                </div>
                <div className="h-16 flex-shrink-0 flex items-center justify-center">
                  <img src="/ankur-capital.png" alt="Ankur Capital Logo" className="h-10 object-contain" />
                </div>
                <div className="h-16 flex-shrink-0 flex items-center justify-center">
                  <img src="/Accel.png" alt="Accel Partners Logo" className="h-10 object-contain" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-16 md:py-20" style={{ backgroundColor: '#0A0A0A' }}>
        <div className="container mx-auto w-full max-w-[1400px] px-3 sm:px-4 md:px-6">
          <div className="text-center space-y-4 mb-12 md:mb-16">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">How it Works</h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              The comprehensive journey from pitch to investor meeting
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {[
              {
                step: "01",
                icon: Film,
                iconColor: "text-blue-500",
                iconBg: "bg-blue-500/10",
                title: "Upload Pitch",
                description: "Upload a 2 minute video pitch, the admin will provide a score upon approval.",
              },
              {
                step: "02",
                icon: BarChart3,
                iconColor: "text-green-500",
                iconBg: "bg-green-500/10",
                title: "Admin Scoring and feedback",
                description: "Receive objective feedback and parameter scores from our admin team.",
              },
              {
                step: "03",
                icon: ClipboardCheck,
                iconColor: "text-purple-500",
                iconBg: "bg-purple-500/10",
                title: "Submission & Final Scorecard",
                description: "After you submit your refined pitch, an admin will approve it before assigning the final score and ranking.",
              },
              {
                step: "04",
                icon: UserCheck,
                iconColor: "text-orange-500",
                iconBg: "bg-orange-500/10",
                title: "Entrepreneur Registration & Document Verification",
                description: "Register and upload business documents, which the InvestorHunt team verifies for authenticity.",
              },
              {
                step: "05",
                icon: Users,
                iconColor: "text-cyan-500",
                iconBg: "bg-cyan-500/10",
                title: "Internal Interview Screening",
                description: "Our panel meets top-scoring founders online to assess their business clarity, team strength, and coachability.",
              },
              {
                step: "06",
                icon: CheckSquare,
                iconColor: "text-pink-500",
                iconBg: "bg-pink-500/10",
                title: "Finalist Selection for Live Investor Meetings",
                description: "Founders who pass the internal screening qualify for live pitch sessions with real investors.",
              },
              {
                step: "07",
                icon: Video,
                iconColor: "text-yellow-500",
                iconBg: "bg-yellow-500/10",
                title: "Live Investor Pitch & Follow-up",
                description: "Pitch directly to verified investors in a live meeting, with post-meeting follow-up options for further interest.",
              },
            ].map((item, index) => (
              <Card 
                key={index} 
                className="relative group transition-all duration-300 cursor-default border-2 border-transparent bg-zinc-900/50 hover:border-purple-600"
                style={{
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 20px 50px -12px rgba(147, 51, 234, 0.8), 0 10px 30px -5px rgba(147, 51, 234, 0.6), 0 0 40px rgba(147, 51, 234, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
                }}
              >
                <CardContent className="p-6 text-center space-y-4">
                  <div className="text-3xl font-bold text-muted-foreground/30 mb-2">{item.step}</div>
                  <div className={`w-16 h-16 ${item.iconBg} rounded-full flex items-center justify-center mx-auto mb-3 transition-transform duration-300 group-hover:scale-110`}>
                    <item.icon className={`h-8 w-8 ${item.iconColor} transition-all duration-300`} />
                  </div>
                  <h3 className="text-lg font-semibold">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section id="features" className="py-16 md:py-20" style={{ backgroundColor: '#0A0A0A' }}>
        <div className="container mx-auto w-full max-w-[1400px] px-3 sm:px-4 md:px-6">
          <div className="text-center space-y-4 mb-12 md:mb-16">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Key Features</h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to connect with the right investors
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Brain,
                iconColor: "text-purple-500",
                iconBg: "bg-purple-500/10",
                hoverBorderColor: "rgb(168, 85, 247)",
                title: "Expert Pitch Review",
                description: "Your pitch will be evaluated by an Admin for clarity, uniqueness, and market fit before a final score is assigned upon approval.",
              },
              {
                icon: Globe,
                iconColor: "text-blue-500",
                iconBg: "bg-blue-500/10",
                hoverBorderColor: "rgb(59, 130, 246)",
                title: "Inclusive Global Access",
                description: "Connect with investors worldwide, breaking geographical barriers.",
              },
              {
                icon: Zap,
                iconColor: "text-green-500",
                iconBg: "bg-green-500/10",
                hoverBorderColor: "rgb(34, 197, 94)",
                title: "Multilingual Support",
                description: "Submit pitches in your native language with AI-powered translation.",
              },
              {
                icon: MessageSquare,
                iconColor: "text-cyan-500",
                iconBg: "bg-cyan-500/10",
                hoverBorderColor: "rgb(6, 182, 212)",
                title: "Real-Time Community Feedback",
                description: "Get instant feedback from fellow entrepreneurs and early backers.",
              },
              {
                icon: Shield,
                iconColor: "text-red-500",
                iconBg: "bg-red-500/10",
                hoverBorderColor: "rgb(239, 68, 68)",
                title: "Transparent Evaluation",
                description: "Clear scoring system helps you understand how investors see your idea.",
              },
              {
                icon: Star,
                iconColor: "text-yellow-500",
                iconBg: "bg-yellow-500/10",
                hoverBorderColor: "rgb(234, 179, 8)",
                title: "Investor Chat + Follow-up Scheduling",
                description: "Direct messaging and meeting scheduling with interested investors.",
              },
            ].map((feature, index) => (
              <Card 
                key={index} 
                className="relative group hover:shadow-xl transition-all duration-300 border-2 border-transparent bg-zinc-900/50"
                style={{
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = feature.hoverBorderColor;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'transparent';
                }}
              >
                <CardContent className="p-6 space-y-4">
                  <div className={`w-12 h-12 ${feature.iconBg} rounded-lg flex items-center justify-center`}>
                    <feature.icon className={`h-6 w-6 ${feature.iconColor}`} />
                  </div>
                  <h3 className="text-lg font-semibold">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="py-16 md:py-20" style={{ backgroundColor: '#0A0A0A' }}>
        <div className="container mx-auto w-full max-w-[1400px] px-3 sm:px-4 md:px-6">
          <div className="text-center space-y-4 mb-12 md:mb-16">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">What Our Clients Say</h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Success stories from entrepreneurs who found their investors
            </p>
          </div>

          <div className="relative">
            <TestimonialCarousel />
            
            {/* Submit Feedback Button */}
            <div className="relative bottom-0 left-300 z-10">
              <Button 
                onClick={handleFeedbackButtonClick}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
              >
                Submit Feedback
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30">
        <div className="container mx-auto w-full max-w-[1400px] px-3 sm:px-4 md:px-6 py-12 md:py-16">
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">InvestorHunt</h3>
              <p className="text-sm text-muted-foreground">Reimagining startup funding for everyone, everywhere.</p>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold">Quick Links</h4>
              <div className="space-y-3 text-sm">
                <Link href="#" className="block text-muted-foreground hover:text-foreground">
                  About Us
                </Link>
                <Link href="#" className="block text-muted-foreground hover:text-foreground">
                  How it Works
                </Link>
                <Link href="#" className="block text-muted-foreground hover:text-foreground">
                  Success Stories
                </Link>
                <Link href="#" className="block text-muted-foreground hover:text-foreground">
                  Help Center
                </Link>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold">Legal</h4>
              <div className="space-y-3 text-sm">
                <Link href="#" className="block text-muted-foreground hover:text-foreground">
                  Privacy Policy
                </Link>
                <Link href="#" className="block text-muted-foreground hover:text-foreground">
                  Terms of Service
                </Link>
                <Link href="#" className="block text-muted-foreground hover:text-foreground">
                  Cookie Policy
                </Link>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold">Newsletter</h4>
              <p className="text-sm text-muted-foreground">Get the latest updates and funding opportunities.</p>
              <div className="flex space-x-2">
                <Input placeholder="Enter your email" className="flex-1" />
                <Button className="bg-[#3591e2] text-white hover:bg-[#2a7bc8]">Subscribe</Button>
              </div>
            </div>
          </div>

          <div className="border-t mt-12 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2024 InvestorHunt. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={authModalOpen} 
        onClose={() => {
          setAuthModalOpen(false);
          setAuthError(null); // Clear error on close
        }}
        initialError={authError} // Pass the error
      />

      {/* Feedback Modal */}
      <Dialog open={feedbackModalOpen} onOpenChange={setFeedbackModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Submit Your Feedback
            </DialogTitle>
            <DialogDescription>
              Share your experience with InvestorHunt. Your feedback helps us improve!
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleFeedbackSubmit} className="space-y-4 mt-4">
            {session?.user && (
              <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                <div className="flex items-center gap-3">
                  {session.user.avatar && (
                    <img 
                      src={session.user.avatar} 
                      alt={session.user.name}
                      className="w-12 h-12 rounded-full border-2 border-purple-500"
                    />
                  )}
                  <div>
                    <p className="font-semibold">{session.user.name}</p>
                    <p className="text-sm text-muted-foreground capitalize">{session.user.role}</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Star Rating */}
            <div>
              <label className="text-sm font-medium mb-3 block">
                Rate Your Experience
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="transition-all duration-200 hover:scale-110"
                  >
                    <Star
                      className={`h-8 w-8 transition-colors ${
                        star <= (hoverRating || rating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'fill-none text-gray-400 stroke-2'
                      }`}
                    />
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <p className="text-sm text-muted-foreground mt-2">
                  You rated: {rating} star{rating > 1 ? 's' : ''}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="feedback" className="text-sm font-medium mb-2 block">
                Your Feedback
              </label>
              <Textarea
                id="feedback"
                placeholder="Share your experience..."
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                required
                rows={6}
                className="resize-none"
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                className="flex-1 bg-[#3591e2] text-white hover:bg-[#2a7bc8]"
                onClick={() => {
                  setFeedbackModalOpen(false)
                  setRating(0)
                  setHoverRating(0)
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                Submit Feedback
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}