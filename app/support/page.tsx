import Link from "next/link";

// Replace both placeholders with contact details that are actively monitored
// before publishing this page or submitting it to Apple.
const SUPPORT_EMAIL = "sudhir.nuli@gmail.com";
const SUPPORT_PHONE = "8985362014";

const faqs = [
    {
        question: "I cannot sign in. What should I check?",
        answer:
            "Confirm that you selected the correct church and entered the member details requested by your church. If sign-in uses an email one-time password (OTP), check your inbox and spam folder, then request a new code if the previous one has expired. Never share an OTP with anyone.",
    },
    {
        question: "I did not receive an email OTP.",
        answer:
            "Check that the email address registered with your church is correct, and look in your spam or junk folder. Wait briefly before requesting another code. If it still does not arrive, contact your church administrator and ask them to verify your registered email address.",
    },
    {
        question: "Why am I not receiving notifications?",
        answer:
            "Check that notifications are enabled for Church Community in your phone's Settings. Also check your internet connection and the app's notification settings, if available. Open the app to confirm whether the message is present even if no notification appeared.",
    },
    {
        question: "My subscription or payment information looks incorrect.",
        answer:
            "Contact your church administrator with the financial year and a description of the discrepancy. Do not send card details, passwords, OTPs, or other sensitive payment credentials through a support request.",
    },
    {
        question: "How do I update my member profile?",
        answer:
            "Open your profile in the app and check which details can be edited. If a detail cannot be changed in the app, contact your church administrator and ask them to update your membership record.",
    },
    {
        question: "What information should I include when reporting a problem?",
        answer:
            "Describe what you were trying to do, what happened, the approximate time, your phone model, and your app version if known. Include a screenshot only if it does not reveal private member information. Never include your password or OTP.",
    },
];

export default function SupportPage() {
    const hasEmail = Boolean(SUPPORT_EMAIL.trim()) && !SUPPORT_EMAIL.startsWith("REPLACE_WITH_");
    const hasPhone = Boolean(SUPPORT_PHONE.trim()) && !SUPPORT_PHONE.startsWith("REPLACE_WITH_");
    const phoneHref = SUPPORT_PHONE.replace(/[^\d+]/g, "");

    return (
        <main className="min-h-screen bg-slate-50 text-slate-800">
            <header className="bg-[#191970] text-white">
                <div className="mx-auto flex max-w-6xl items-center gap-4 px-5 py-5 sm:px-8">
                    <div aria-hidden="true" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/25 bg-white/10 text-2xl">✝</div>
                    <div>
                        <p className="text-lg font-bold tracking-tight">Church Community</p>
                        <p className="text-sm text-indigo-200">App Support Centre</p>
                    </div>
                </div>
            </header>

            <section className="bg-gradient-to-b from-[#191970] to-[#29298b] text-white">
                <div className="mx-auto max-w-6xl px-5 pb-12 pt-8 sm:px-8 sm:pb-16 sm:pt-12">
                    <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-indigo-200">We are here to help</p>
                    <h1 className="max-w-3xl text-3xl font-bold tracking-tight sm:text-5xl">How can we help you?</h1>
                    <p className="mt-4 max-w-2xl text-base leading-7 text-indigo-100 sm:text-lg">
                        Find help with signing in, church messages, notifications, your member profile, and subscription information in the Church Community app.
                    </p>
                    <div className="mt-7 flex flex-wrap gap-3">
                        {hasEmail && <a className="inline-flex min-h-11 items-center justify-center rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-[#191970] shadow-sm hover:bg-indigo-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white" href={`mailto:${SUPPORT_EMAIL}`}>Email support</a>}
                        {hasPhone && <a className="inline-flex min-h-11 items-center justify-center rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-[#191970] shadow-sm hover:bg-indigo-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white" href={`tel:${phoneHref}`}>Call support</a>}
                        {!hasEmail && !hasPhone && <p className="rounded-xl border border-white/30 bg-white/10 px-4 py-3 text-sm text-indigo-50">Contact details are being updated. Please contact your church administrator for assistance.</p>}
                    </div>
                </div>
            </section>

            <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
                <section aria-labelledby="topics-heading">
                    <h2 id="topics-heading" className="text-2xl font-bold text-slate-900">Browse help topics</h2>
                    <p className="mt-2 text-slate-600">Start with the topic that best matches your question.</p>
                    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {[
                            { icon: "👤", title: "Login and OTP", description: "Church code, member details, and email verification." },
                            { icon: "🔔", title: "Messages and alerts", description: "Missing messages or push notification problems." },
                            { icon: "💳", title: "Subscriptions", description: "Questions about subscription records or payments." },
                            { icon: "🪪", title: "Member profile", description: "Profile details and membership information." },
                        ].map((topic) => (
                            <article key={topic.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                <div aria-hidden="true" className="mb-4 inline-flex rounded-xl bg-indigo-50 p-3 text-2xl">{topic.icon}</div>
                                <h3 className="font-semibold text-slate-900">{topic.title}</h3>
                                <p className="mt-2 text-sm leading-6 text-slate-600">{topic.description}</p>
                            </article>
                        ))}
                    </div>
                </section>

                <section aria-labelledby="faq-heading" className="mt-12">
                    <h2 id="faq-heading" className="text-2xl font-bold text-slate-900">Frequently asked questions</h2>
                    <div className="mt-5 divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white px-5 sm:px-7">
                        {faqs.map((faq) => (
                            <details key={faq.question} className="group py-5">
                                <summary className="flex cursor-pointer list-none items-start justify-between gap-4 font-semibold text-slate-900 marker:content-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#191970]">
                                    <span>{faq.question}</span>
                                    <span aria-hidden="true" className="shrink-0 text-xl text-[#191970] transition group-open:rotate-45">+</span>
                                </summary>
                                <p className="mt-3 max-w-4xl pr-5 text-sm leading-7 text-slate-600">{faq.answer}</p>
                            </details>
                        ))}
                    </div>
                </section>

                <section aria-labelledby="contact-heading" className="mt-12 rounded-3xl bg-[#191970] p-6 text-white sm:p-9">
                    <h2 id="contact-heading" className="text-2xl font-bold">Still need help?</h2>
                    <p className="mt-3 max-w-2xl leading-7 text-indigo-100">
                        If these answers do not solve your problem, contact support using the details below or ask your church administrator for help with your membership record.
                    </p>
                    <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                        {hasEmail ? <a className="rounded-xl bg-white px-4 py-3 text-sm font-semibold text-[#191970] hover:bg-indigo-50" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> : <p className="rounded-xl border border-white/25 px-4 py-3 text-sm">Add your support email in this page before publishing.</p>}
                        {hasPhone ? <a className="rounded-xl bg-white px-4 py-3 text-sm font-semibold text-[#191970] hover:bg-indigo-50" href={`tel:${phoneHref}`}>{SUPPORT_PHONE}</a> : <p className="rounded-xl border border-white/25 px-4 py-3 text-sm">Add your support phone number in this page before publishing.</p>}
                    </div>
                    <p className="mt-6 text-xs leading-5 text-indigo-200">For your privacy, do not send passwords, one-time passwords, full payment card details, or other sensitive authentication information to support.</p>
                </section>

                <footer className="mt-10 border-t border-slate-200 pt-6 text-sm text-slate-500">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <p>© {new Date().getFullYear()} Church Community</p>
                        <nav aria-label="Support links" className="flex flex-wrap gap-4">
                            <Link className="underline underline-offset-4 hover:text-[#191970]" href="/privacypolicy">Privacy Policy</Link>
                            <Link className="underline underline-offset-4 hover:text-[#191970]" href="/">Website home</Link>
                        </nav>
                    </div>
                </footer>
            </div>
        </main>
    );
}
