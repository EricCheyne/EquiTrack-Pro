import Link from "next/link";
import { ArrowRight, BarChart3, Clock, Users } from "lucide-react";
import { AuthButton } from "@/components/auth-button";

export default function Home() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
            {/* Navigation */}
            <nav className="border-b border-gray-200 bg-white">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700" />
                            <span className="text-xl font-bold text-gray-900">EquiTrack Pro</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
                                Dashboard
                            </Link>
                            <AuthButton />
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
                <div className="text-center">
                    <h1 className="text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl">
                        Professional Equestrian Management
                    </h1>
                    <p className="mx-auto mt-6 max-w-2xl text-xl text-gray-600">
                        Track, manage, and optimize your equestrian operations with EquiTrack Pro.
                        Designed for modern horse enthusiasts and professionals.
                    </p>
                    <div className="mt-10 flex justify-center gap-4">
                        <Link
                            href="/dashboard"
                            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-lg font-semibold text-white hover:bg-blue-700"
                        >
                            Get Started <ArrowRight className="h-5 w-5" />
                        </Link>
                        <button className="rounded-lg border border-gray-300 px-6 py-3 text-lg font-semibold text-gray-700 hover:bg-gray-50">
                            Learn More
                        </button>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="bg-white py-16 sm:py-24">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                            Features
                        </h2>
                        <p className="mx-auto mt-4 max-w-2xl text-gray-600">
                            Everything you need to manage your equestrian operations efficiently
                        </p>
                    </div>

                    <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                        {[
                            {
                                icon: BarChart3,
                                title: "Analytics & Reporting",
                                description: "Comprehensive insights into your operations with detailed analytics",
                            },
                            {
                                icon: Clock,
                                title: "Schedule Management",
                                description: "Manage schedules, appointments, and training sessions effortlessly",
                            },
                            {
                                icon: Users,
                                title: "Team Collaboration",
                                description: "Collaborate with your team and manage multiple users seamlessly",
                            },
                        ].map((feature, index) => (
                            <div
                                key={index}
                                className="rounded-lg border border-gray-200 bg-white p-8 hover:shadow-lg transition-shadow"
                            >
                                <feature.icon className="h-8 w-8 text-blue-600" />
                                <h3 className="mt-4 text-lg font-semibold text-gray-900">{feature.title}</h3>
                                <p className="mt-2 text-gray-600">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="bg-blue-600 py-16">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-3xl font-bold text-white">Ready to get started?</h2>
                    <p className="mt-4 text-lg text-blue-100">
                        Join equestrian professionals using EquiTrack Pro today
                    </p>
                    <Link
                        href="/dashboard"
                        className="mt-6 inline-block rounded-lg bg-white px-6 py-3 font-semibold text-blue-600 hover:bg-gray-100"
                    >
                        View Dashboard
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-gray-200 bg-white py-8">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="text-center text-gray-600">
                        <p>&copy; 2026 EquiTrack Pro. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
