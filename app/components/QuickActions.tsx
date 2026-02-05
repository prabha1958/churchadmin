import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";



export default function QuickActions() {
    return (
        <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
                <CardTitle className="text-slate-100">Quick Actions</CardTitle>
            </CardHeader>

            <CardContent className="grid grid-cols-2 gap-3">
                <Button variant="outline">Add Member</Button>
                <Button variant="outline">Add Alliance</Button>
                <Button variant="outline">Record Payment</Button>
                <Button variant="outline">Post Announcement</Button>
            </CardContent>
        </Card>
    );
}
