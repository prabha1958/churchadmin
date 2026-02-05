
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
import { Spinner } from "@/components/ui/spinner";

export default function GreetingsCard({
    title,
    lastRun,
    command,
    style,
    onRun,
    isLoading,
}: {
    title: string;
    lastRun: string;
    command: string;
    style: string;
    onRun: () => void | Promise<void>;
    isLoading: boolean;
}) {
    return (
        <Card className={style}>
            <CardHeader>
                <CardTitle className="text-slate-100">{title}</CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">
                <p className="text-sm text-slate-400">
                    Last sent on: <b className="text-slate-200">{lastRun}</b>
                </p>

                <Separator />
                {!isLoading && (

                    <Button
                        onClick={onRun} className="w-full bg-amber-500 hover:bg-amber-600 text-black"
                    >
                        Run Now
                    </Button>

                )}

                {isLoading && (
                    <Button
                        className="w-full bg-amber-500 hover:bg-amber-600 text-black"
                    >
                        <Spinner />
                    </Button>
                )}


                <p className="text-xs text-slate-500">
                    Command: <code>{command}</code>
                </p>
            </CardContent>
        </Card>
    );
}
