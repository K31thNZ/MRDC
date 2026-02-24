import { useEvents } from "@/hooks/use-events";
import { EventCard } from "@/components/EventCard";
import { motion } from "framer-motion";

export default function Events() {
  const { events, isLoading } = useEvents();

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-display font-bold mb-8">All Events</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1,2,3,4,5,6].map(i => (
                <div key={i} className="h-80 bg-muted/20 animate-pulse rounded-2xl" />
            ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="mb-12 text-center max-w-2xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4">
          Game Schedule
        </h1>
        <p className="text-xl text-muted-foreground">
          Join us for weekly games. Spaces are limited, so reserve your seat early!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {events?.map((event: any, index: number) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <EventCard event={event} />
          </motion.div>
        ))}
        
        {(!events || events.length === 0) && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
                <div className="bg-muted/30 p-8 rounded-full mb-6">
                    <span className="text-6xl">📅</span>
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-2">No events found</h3>
                <p className="text-muted-foreground">We're planning our next game night. Stay tuned!</p>
            </div>
        )}
      </div>
    </div>
  );
}
