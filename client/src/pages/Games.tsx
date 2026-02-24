import { useGames } from "@/hooks/use-games";
import { motion } from "framer-motion";
import { Users, Lightbulb } from "lucide-react";
import { SuggestGame } from "@/components/SuggestGame";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function Games() {
  const { games, isLoading } = useGames();
  const [showSuggest, setShowSuggest] = useState(false);

  if (isLoading) return <div className="p-12 text-center">Loading library...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="mb-12 text-center max-w-2xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4">
          Game Library
        </h1>
        <p className="text-xl text-muted-foreground mb-8">
          Explore our collection of games. Nominate your favorites for upcoming events!
        </p>
        <Button 
          onClick={() => setShowSuggest(!showSuggest)} 
          variant={showSuggest ? "outline" : "default"}
          className="gap-2"
        >
          <Lightbulb className="w-4 h-4" />
          {showSuggest ? "Back to Library" : "Suggest a New Game"}
        </Button>
      </div>

      {showSuggest ? (
        <div className="max-w-xl mx-auto">
          <SuggestGame />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {games?.map((game: any, idx: number) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white rounded-xl shadow-sm border border-border overflow-hidden hover:shadow-lg transition-all"
            >
              {game.imageUrl ? (
                  <div className="aspect-video w-full overflow-hidden">
                      <img 
                          src={game.imageUrl} 
                          alt={game.title} 
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                      />
                  </div>
              ) : (
                  <div className="aspect-video w-full bg-secondary/10 flex items-center justify-center">
                      <span className="text-4xl">🎲</span>
                  </div>
              )}
              
              <div className="p-4">
                <h3 className="font-bold text-lg mb-1 truncate">{game.title}</h3>
                <div className="flex items-center text-sm text-muted-foreground mb-3">
                  <Users className="w-4 h-4 mr-1" />
                  {game.minPlayers}-{game.maxPlayers} players
                </div>
                {game.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                        {game.description}
                    </p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
