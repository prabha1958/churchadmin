"use client";

import { useRouter } from "next/navigation";

export default function GettingStartedPage() {
    const router = useRouter();

    const handleGettingStarted = () => {
        router.push("/platform/register");
    };

    return (
        <main className="min-h-screen bg-slate-50">
            <div className="mx-auto flex min-h-screen w-full max-w-4xl items-center px-4 py-12 sm:px-6 lg:px-8">
                <div className="w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

                    {/* Header */}
                    <div className="bg-[#191970] px-6 py-10 text-center sm:px-10 sm:py-14">
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-300">
                            Church Community
                        </p>

                        <h1 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                            Set up your Church Community
                        </h1>

                        <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-200 sm:text-base">
                            Connect your church with its congregation through
                            messages, announcements, events and other church
                            services.
                        </p>
                    </div>

                    {/* Main content */}
                    <div className="px-6 py-8 sm:px-10 sm:py-10">

                        {/* Church in-charge */}
                        <section>
                            <div className="flex items-start gap-4">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#191970] text-sm font-bold text-white">
                                    1
                                </div>

                                <div>
                                    <h2 className="text-lg font-semibold text-slate-900">
                                        Are you the person responsible for
                                        setting up your church?
                                    </h2>

                                    <p className="mt-2 text-sm leading-6 text-slate-600">
                                        If you are the church in-charge or a
                                        person authorised by your church to
                                        establish the Church Community account,
                                        you can begin the setup process here.
                                    </p>
                                </div>
                            </div>

                            <div className="mt-6 flex justify-center sm:justify-start sm:pl-14">
                                <button
                                    type="button"
                                    onClick={handleGettingStarted}
                                    className="inline-flex items-center justify-center rounded-lg bg-[#191970] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#15155f] focus:outline-none focus:ring-2 focus:ring-[#191970] focus:ring-offset-2"
                                >
                                    Getting Started
                                    <span className="ml-2 text-amber-300">
                                        →
                                    </span>
                                </button>
                            </div>
                        </section>

                        <div className="my-8 border-t border-slate-200" />

                        {/* Existing church member */}
                        <section>
                            <div className="flex items-start gap-4">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-600">
                                    2
                                </div>

                                <div>
                                    <h2 className="text-lg font-semibold text-slate-900">
                                        Are you a church member?
                                    </h2>

                                    <p className="mt-2 text-sm leading-6 text-slate-600">
                                        If your church is already using Church
                                        Community, you do not need to register
                                        the church again.
                                    </p>

                                    <p className="mt-3 text-sm leading-6 text-slate-600">
                                        Please contact your church administrator
                                        or church office and ask them for the
                                        official QR code or setup information
                                        for your church.
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* Setup process */}
                        <section className="mt-10 rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-6">
                            <h2 className="text-base font-semibold text-slate-900">
                                What happens next?
                            </h2>

                            <ol className="mt-4 space-y-3 text-sm text-slate-600">
                                <li className="flex gap-3">
                                    <span className="font-semibold text-[#191970]">
                                        1.
                                    </span>
                                    <span>
                                        Register your church.
                                    </span>
                                </li>

                                <li className="flex gap-3">
                                    <span className="font-semibold text-[#191970]">
                                        2.
                                    </span>
                                    <span>
                                        Your church will receive a unique
                                        Church Code.
                                    </span>
                                </li>

                                <li className="flex gap-3">
                                    <span className="font-semibold text-[#191970]">
                                        3.
                                    </span>
                                    <span>
                                        Create the Setup Administrator
                                        account.
                                    </span>
                                </li>

                                <li className="flex gap-3">
                                    <span className="font-semibold text-[#191970]">
                                        4.
                                    </span>
                                    <span>
                                        The administrator will receive a
                                        temporary password by email.
                                    </span>
                                </li>

                                <li className="flex gap-3">
                                    <span className="font-semibold text-[#191970]">
                                        5.
                                    </span>
                                    <span>
                                        Sign in and complete the church setup.
                                    </span>
                                </li>

                                <li className="flex gap-3">
                                    <span className="font-semibold text-[#191970]">
                                        6.
                                    </span>
                                    <span>
                                        Generate the QR code for your church
                                        members.
                                    </span>
                                </li>
                            </ol>
                        </section>
                    </div>

                    {/* Footer */}
                    <div className="border-t border-slate-200 px-6 py-5 text-center sm:px-10">
                        <p className="text-xs text-slate-500">
                            Church Community — Connecting churches and
                            congregations.
                        </p>
                    </div>
                </div>
            </div>
        </main>
    );
}