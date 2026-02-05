import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { format } from 'date-fns';

type PoorFeeding = {
    date_of_event?: string;
    no_of_persons_fed?: number;
};



export default function PoorFeedingCard({
    pfeeding,
}: {
    pfeeding?: PoorFeeding;
}) {
    if (!pfeeding) {
        return (
            <Card className="bg-[#09947b] border-slate-50">
                <CardContent className="text-slate-100">
                    No poor feeding events yet
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="bg-[#09947b] border-slate-50">
            <CardHeader>
                <CardTitle className="text-slate-100">Poor Feeding</CardTitle>
            </CardHeader>

            <CardContent className="space-y-2">
                <div className="flex justify-between">
                    <span className="text-slate-50 text-xl">Last Event</span>
                    <span className="text-slate-200 text-xl">
                        {pfeeding?.date_of_event
                            ? format(new Date(pfeeding.date_of_event), "dd-MM-yyyy")
                            : "—"}
                    </span>
                </div>

                <div className="flex justify-between">
                    <span className="text-slate-50 text-xl">Persons Fed</span>
                    <span className="text-slate-200 text-xl">
                        {pfeeding.no_of_persons_fed}
                    </span>
                </div>

                <Separator />

                <Button variant="outline" className="w-full">
                    View History
                </Button>
            </CardContent>
        </Card>
    );
}
