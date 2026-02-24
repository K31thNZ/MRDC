import { useAuth } from "@/hooks/use-auth";
import { useEvents } from "@/hooks/use-events";
import { format } from "date-fns";
import { Calendar, MapPin, Loader2, CheckCircle2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useRef, useState } from "react";

export default function Profile() {
  const { user, isLoading: authLoading } = useAuth();
  const { events, isLoading: eventsLoading, cancelReservation } = useEvents();
  const { toast } = useToast();

  // Add this inside your Profile component, before the return statement
const [showTelegramWidget, setShowTelegramWidget] = useState(false);
const telegramContainerRef = useRef<HTMLDivElement>(null);

  // Add this effect to load the widget when showTelegramWidget is true
useEffect(() => {
  if (!showTelegramWidget || !telegramContainerRef.current) return;

  // Define the callback Telegram will call after authentication
  window.onTelegramAuth = async (telegramUser) => {
    try {
      const res = await apiRequest("POST", "/api/user/verify-telegram", telegramUser);
      const data = await res.json();
      
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Telegram Verified",
        description: "Your account has been successfully linked to Telegram.",
      });
      setShowTelegramWidget(false); // Hide widget after success
    } catch (error) {
      toast({
        title: "Verification Failed",
        description: "Could not link Telegram account. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Load Telegram widget script
  const script = document.createElement('script');
  script.src = 'https://telegram.org/js/telegram-widget.js?22';
  script.setAttribute('data-telegram-login', import.meta.env.VITE_TELEGRAM_BOT_USERNAME!);
  script.setAttribute('data-size', 'large');
  script.setAttribute('data-onauth', 'onTelegramAuth(user)');
  script.setAttribute('data-request-access', 'write');
  script.async = true;

  telegramContainerRef.current.appendChild(script);

  // Cleanup
  return () => {
    if (telegramContainerRef.current) {
      telegramContainerRef.current.innerHTML = '';
    }
    delete window.onTelegramAuth;
  };
}, [showTelegramWidget]);

  if (authLoading || eventsLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  const myReservations = events?.filter((e: any) => e.userReservationStatus !== null) || [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="bg-white rounded-3xl shadow-sm border border-border overflow-hidden mb-8">
        <div className="bg-secondary/10 p-8 text-center">
           <div className="inline-block p-4 bg-white rounded-full shadow-md mb-4 relative">
               <span className="text-4xl">👤</span>
               {user.isTelegramVerified && (
                 <div className="absolute -right-1 -bottom-1 bg-white rounded-full p-1 border border-green-100">
                    <CheckCircle2 className="w-6 h-6 text-green-500 fill-green-50" />
                 </div>
               )}
           </div>
           <h1 className="text-3xl font-bold mb-2 flex items-center justify-center gap-2">
             {user.username}
{!user.isTelegramVerified && (
  <div className="flex flex-col items-center gap-3">
    <div className="flex items-center gap-2 text-amber-600 font-bold">
      <ShieldAlert className="w-5 h-5" /> Not Verified
    </div>
    
    {!showTelegramWidget ? (
      <Button 
        size="sm" 
        variant="outline" 
        onClick={() => setShowTelegramWidget(true)}
      >
        Link Telegram Account
      </Button>
    ) : (
      <div className="flex flex-col items-center gap-2">
        <div ref={telegramContainerRef} className="mb-2"></div>
        <Button 
          size="sm" 
          variant="ghost" 
          onClick={() => setShowTelegramWidget(false)}
        >
          Cancel
        </Button>
      </div>
    )}
  </div>
)}

      <div className="bg-white rounded-2xl p-6 border border-border shadow-sm mb-12 flex items-center justify-between">
         <div>
            <h3 className="font-bold">Events Attended</h3>
            <p className="text-sm text-muted-foreground">Keep playing to level up!</p>
         </div>
         <div className="text-4xl font-display font-bold text-secondary">0</div>
      </div>

      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Calendar className="h-6 w-6 text-primary" /> 
        My Reservations
      </h2>

      <div className="space-y-4">
        {myReservations.length === 0 ? (
          <div className="text-center py-12 bg-muted/20 rounded-xl border-2 border-dashed border-border">
            <p className="text-muted-foreground">You haven't reserved any games yet.</p>
          </div>
        ) : (
          myReservations.map((event: any) => (
            <div key={event.id} className="bg-white p-6 rounded-xl shadow-sm border border-border flex flex-col md:flex-row justify-between items-center gap-4">
               <div className="flex-1">
                 <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                        event.userReservationStatus === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                        {event.userReservationStatus}
                    </span>
                    <h3 className="text-lg font-bold">{event.title}</h3>
                 </div>
                 <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" /> {format(new Date(event.date), "PPP p")}
                    </span>
                    <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" /> {event.location}
                    </span>
                 </div>
               </div>
               
               <Button 
                 variant="destructive" 
                 variant="outline"
                 size="sm"
                 onClick={() => cancelReservation.mutate(event.id)}
                 disabled={cancelReservation.isPending}
               >
                 Cancel
               </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
