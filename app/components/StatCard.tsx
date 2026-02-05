import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"




export default function StatCard({
    title,
    value,
    subtitle,
    style,
    number
}: {
    title: string;
    value: string;
    subtitle?: string;
    style: string;
    number: string;
}) {
    return (
        <Card className={style}>
            <CardHeader className="pb-2">
                <CardTitle className="text-2xl text-slate-50">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-xl font-bold text-slate-100">{value}</div>
                <div className="text-2xl font-bold text-slate-100">{number}</div>

                {subtitle && (
                    <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
                )}
            </CardContent>
        </Card>
    );
}
