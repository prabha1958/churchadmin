import { Suspense } from "react";
import RegisterForm from "./RegisterForm";

export default function RegisterPage() {
    return (
        <Suspense
            fallback={
                <main className="min-h-screen flex items-center justify-center bg-slate-100">
                    <div className="text-slate-600">
                        Loading registration...
                    </div>
                </main>
            }
        >
            <RegisterForm />
        </Suspense>
    );
}