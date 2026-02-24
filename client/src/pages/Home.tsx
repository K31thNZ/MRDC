import { motion } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Dice5, Calendar, Award, Globe, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useEvents } from "@/hooks/use-events";
import { EventCard } from "@/components/EventCard";

export default function Home() {
  const { user } = useAuth();
  const { events, isLoading } = useEvents();

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-24 lg:pt-32 lg:pb-40">
        <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
             <div className="absolute top-10 left-10 w-32 h-32 bg-primary rounded-full blur-3xl" />
             <div className="absolute bottom-10 right-10 w-64 h-64 bg-secondary rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-5xl md:text-7xl font-display font-bold text-foreground mb-6 leading-tight">
              <span className="text-gradient">Board Games</span> <br/> in English
            </h1>
            <p className="text-2xl md:text-3xl font-light text-muted-foreground mb-8 font-sans">
              📖 Welcome / Добро пожаловать!
            </p>
            
            {!user && (
              <div className="flex justify-center gap-4">
                <Link href="/register">
                  <Button size="lg" className="bg-primary hover:bg-primary/90 text-white text-lg h-14 px-8 rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 transition-all">
                    Join the Club
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline" className="text-lg h-14 px-8 rounded-2xl border-2 hover:bg-secondary/5">
                    Log In
                  </Button>
                </Link>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-white/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {[
              { 
                icon: Dice5, 
                title: "What we do", 
                desc: "Play board games entirely in English to practice speaking, listening & thinking in a fun way!",
                color: "text-primary" 
              },
              { 
                icon: Calendar, 
                title: "When & Where", 
                desc: "Weekly games — check our upcoming events below!",
                color: "text-secondary" 
              },
              { 
                icon: Award, 
                title: "Loyalty Rewards", 
                desc: "Earn credits for attending & referring friends. Redeem for free events & prizes!",
                color: "text-accent" 
              },
              { 
                icon: Globe, 
                title: "All are welcome", 
                desc: "Beginner to advanced — gamify your education and meet new friends.",
                color: "text-purple-500" 
              }
            ].map((feature, idx) => (
              <motion.div key={idx} variants={item} className="bg-white p-8 rounded-3xl shadow-sm border border-border/50 hover:shadow-lg transition-shadow">
                <div className={`p-4 rounded-2xl bg-gray-50 inline-block mb-4 ${feature.color}`}>
                  <feature.icon size={32} />
                </div>
                <h3 className="text-xl font-bold mb-3 font-display">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Upcoming Events Preview */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12">
             <div>
                <h2 className="text-3xl md:text-4xl font-bold font-display text-foreground mb-2">Upcoming Events</h2>
                <p className="text-muted-foreground">Reserve your spot and start playing!</p>
             </div>
             <Link href="/events">
               <Button variant="ghost" className="group">
                 View All <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
               </Button>
             </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               {[1,2,3].map(i => (
                  <div key={i} className="h-64 bg-muted/20 animate-pulse rounded-2xl" />
               ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {events?.slice(0, 3).map((event: any) => (
                <EventCard key={event.id} event={event} />
              ))}
              {(!events || events.length === 0) && (
                 <div className="col-span-full text-center py-12 text-muted-foreground border-2 border-dashed border-border rounded-3xl">
                    No upcoming events scheduled yet. Check back soon!
                 </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
