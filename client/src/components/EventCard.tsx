import { motion } from "framer-motion";
import { format } from "date-fns";
import { MapPin, Users, Calendar, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useEvents } from "@/hooks/use-events";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { NominationList } from "./NominationList";

interface EventProps {
  event: any; // Using any for simplicity here but corresponds to EventWithDetails
}

export function EventCard({ event }: EventProps) {
  const { user } = useAuth();
  const { reserve, cancelReservation } = useEvents();
  const [showDetails, setShowDetails] = useState(false);
  const [showNominations, setShowNominations] = useState(false);

  const isFull = event.attendeeCount >= event.maxSeats;
  const isReserved = event.userReservationStatus === "confirmed" || event.userReservationStatus === "waitlist";
  const date = new Date(event.date);

  return (
    <Dialog open={showDetails} onOpenChange={setShowDetails}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col h-full cursor-pointer group"
        onClick={() => setShowDetails(true)}
      >
        <div className="bg-secondary/5 p-6 flex-grow">
          <div className="flex justify-between items-start mb-4">
            <div>
              <span className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold mb-2">
                {isFull ? "Waitlist Only" : "Open Spots"}
              </span>
              <h3 className="text-xl font-bold font-display text-foreground leading-tight group-hover:text-primary transition-colors">{event.title}</h3>
            </div>
            <div className="text-center bg-white p-2 rounded-lg shadow-sm border border-border/50 min-w-[60px]">
              <div className="text-xs text-muted-foreground uppercase font-bold">{format(date, "MMM")}</div>
              <div className="text-2xl font-bold text-secondary">{format(date, "d")}</div>
            </div>
          </div>

          <p className="text-muted-foreground text-sm mb-6 line-clamp-3">{event.description}</p>

          <div className="space-y-2 text-sm text-foreground/80 mb-6">
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-2 text-primary" />
              {format(date, "EEEE, MMMM do")} • {format(date, "h:mm a")}
            </div>
            <div className="flex items-center">
              <MapPin className="w-4 h-4 mr-2 text-primary" />
              {event.location}
            </div>
            <div className="flex items-center">
              <Users className="w-4 h-4 mr-2 text-primary" />
              {event.attendeeCount} / {event.maxSeats} players
            </div>
          </div>
        </div>

        <div className="p-4 bg-muted/30 border-t border-border flex justify-between items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-bold font-display">
              {event.gameId ? "Game Details" : "Game Nominations"}
            </h4>
            {!event.gameId && (
              <Dialog open={showNominations} onOpenChange={setShowNominations}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="flex-1">
                    Nominations
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Game Nominations for {event.title}</DialogTitle>
                  </DialogHeader>
                  <NominationList eventId={event.id} />
                </DialogContent>
              </Dialog>
            )}
          </div>

          {user ? (
            isReserved ? (
              <Button 
                variant="destructive" 
                size="sm" 
                className="flex-1"
                onClick={() => cancelReservation.mutate(event.id)}
                disabled={cancelReservation.isPending}
              >
                {cancelReservation.isPending ? "Cancelling..." : "Cancel Seat"}
              </Button>
            ) : (
              <Button 
                className="flex-1 bg-secondary hover:bg-secondary/90 text-white" 
                size="sm"
                onClick={() => reserve.mutate(event.id)}
                disabled={reserve.isPending || (isFull && event.userReservationStatus !== null)}
              >
                {reserve.isPending ? "Reserving..." : isFull ? "Join Waitlist" : "Reserve Seat"}
              </Button>
            )
          ) : (
            <Button variant="ghost" size="sm" className="flex-1 text-muted-foreground" disabled>
              Login to Join
            </Button>
          )}
        </div>
      </motion.div>

      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-start pr-8">
            <div>
              <span className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold mb-2">
                {isFull ? "Waitlist Only" : "Open Spots Available"}
              </span>
              <DialogTitle className="text-3xl font-display font-bold text-foreground">{event.title}</DialogTitle>
            </div>
            <div className="text-center bg-muted/50 p-3 rounded-xl border border-border min-w-[80px]">
              <div className="text-sm text-muted-foreground uppercase font-bold">{format(date, "MMM")}</div>
              <div className="text-3xl font-bold text-secondary">{format(date, "d")}</div>
              <div className="text-xs text-muted-foreground font-medium">{format(date, "yyyy")}</div>
            </div>
          </div>
        </DialogHeader>
        
        <div className="space-y-8 py-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-xl border border-border/50">
              <Calendar className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <div className="text-sm font-bold text-foreground">Date & Time</div>
                <div className="text-sm text-muted-foreground">{format(date, "EEEE, MMMM do")}</div>
                <div className="text-sm text-muted-foreground">{format(date, "h:mm a")}</div>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-xl border border-border/50">
              <MapPin className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <div className="text-sm font-bold text-foreground">Location</div>
                <div className="text-sm text-muted-foreground">{event.location}</div>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-xl border border-border/50">
              <Users className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <div className="text-sm font-bold text-foreground">Capacity</div>
                <div className="text-sm text-muted-foreground">{event.attendeeCount} / {event.maxSeats} seats</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {isFull ? "Currently full - waitlist active" : `${event.maxSeats - event.attendeeCount} spots remaining`}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-lg font-bold font-display flex items-center gap-2">
              <Info className="w-5 h-5 text-primary" />
              About this Event
            </h4>
            <div className="text-muted-foreground leading-relaxed whitespace-pre-wrap bg-muted/10 p-4 rounded-xl border border-border/30">
              {event.description}
            </div>
          </div>

            <div className="space-y-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-bold font-display">
                  {event.gameId ? "Featured Game" : "Game Nominations"}
                </h4>
                {!event.gameId && user && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="gap-2"
                    onClick={() => setShowNominations(true)}
                  >
                    Nominate
                  </Button>
                )}
              </div>
              
              {event.gameId ? (
                <div className="bg-primary/5 border border-primary/10 rounded-xl p-4">
                  <div className="flex items-start gap-4">
                    {event.game?.imageUrl ? (
                      <img 
                        src={event.game.imageUrl} 
                        alt={event.game.title}
                        className="w-20 h-20 object-cover rounded-lg shadow-sm"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-lg bg-primary/10 flex items-center justify-center text-3xl">🎲</div>
                    )}
                    <div className="flex-1">
                      <div className="font-bold text-lg mb-1">{event.game?.title}</div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{event.game?.description}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" /> {event.game?.minPlayers}-{event.game?.maxPlayers} players
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground mb-4">
                    Vote for the games you'd like to play at this event or nominate a new one from our library.
                  </p>
                  <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
                    <NominationList eventId={event.id} />
                  </div>
                </>
              )}
            </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-6">
            {user ? (
              isReserved ? (
                <Button 
                  variant="destructive" 
                  size="lg" 
                  className="flex-1 h-12 text-base font-bold"
                  onClick={() => cancelReservation.mutate(event.id)}
                  disabled={cancelReservation.isPending}
                >
                  {cancelReservation.isPending ? "Processing..." : "Cancel My Reservation"}
                </Button>
              ) : (
                <Button 
                  className="flex-1 h-12 bg-secondary hover:bg-secondary/90 text-white text-base font-bold shadow-md hover:shadow-lg transition-all" 
                  size="lg"
                  onClick={() => reserve.mutate(event.id)}
                  disabled={reserve.isPending || (isFull && event.userReservationStatus !== null)}
                >
                  {reserve.isPending ? "Reserving..." : isFull ? "Join the Waitlist" : "Reserve My Spot"}
                </Button>
              )
            ) : (
              <div className="flex-1 flex flex-col items-center gap-2">
                <Button variant="outline" size="lg" className="w-full h-12 text-base font-bold" disabled>
                  Login to Participate
                </Button>
                <p className="text-xs text-muted-foreground italic">You must be logged in to reserve seats or nominate games.</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
