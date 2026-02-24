import { useEventNominations, useGames } from "@/hooks/use-events";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { ThumbsUp, Plus } from "lucide-react";
import { 
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger 
} from "@/components/ui/dialog";
import { useGames as useAllGames } from "@/hooks/use-games";
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";

export function NominationList({ eventId }: { eventId: number }) {
    const { user } = useAuth();
    const { nominations, isLoading, vote, nominate } = useEventNominations(eventId);
    const { games } = useAllGames(); // Fetch full library for nomination dialog
    const [isNominateOpen, setIsNominateOpen] = useState(false);

    if (isLoading) return <div className="p-4 text-center">Loading nominations...</div>;

    const sortedNominations = nominations?.slice().sort((a: any, b: any) => b.voteCount - a.voteCount) || [];

    return (
        <div className="space-y-4">
            {sortedNominations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground italic">
                    No games nominated yet. Be the first!
                </div>
            ) : (
                <div className="space-y-3">
                    {sortedNominations.map((nom: any) => (
                        <div key={nom.id} className="flex items-center justify-between p-3 bg-secondary/5 rounded-lg border border-border">
                            <div>
                                <div className="font-bold">{nom.game.title}</div>
                                <div className="text-xs text-muted-foreground">
                                    {nom.game.minPlayers}-{nom.game.maxPlayers} players
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-bold text-secondary">
                                    {nom.voteCount} votes
                                </span>
                                {user && (
                                    <Button
                                        size="icon"
                                        variant={nom.hasVoted ? "secondary" : "outline"}
                                        className="h-8 w-8 rounded-full"
                                        onClick={() => vote.mutate(nom.id)}
                                        disabled={vote.isPending}
                                    >
                                        <ThumbsUp className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {user && (
                <Dialog open={isNominateOpen} onOpenChange={setIsNominateOpen}>
                    <DialogTrigger asChild>
                        <Button className="w-full mt-4" variant="outline">
                            <Plus className="mr-2 h-4 w-4" /> Nominate a Game
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Choose a game to nominate</DialogTitle>
                        </DialogHeader>
                        <ScrollArea className="h-[300px] mt-2 pr-4">
                            <div className="grid gap-2">
                                {games?.map((game: any) => (
                                    <Button
                                        key={game.id}
                                        variant="ghost"
                                        className="justify-start"
                                        onClick={() => {
                                            nominate.mutate(game.id);
                                            setIsNominateOpen(false);
                                        }}
                                    >
                                        <span className="truncate">{game.title}</span>
                                    </Button>
                                ))}
                            </div>
                        </ScrollArea>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}
