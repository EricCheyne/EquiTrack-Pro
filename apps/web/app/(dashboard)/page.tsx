"use client";

import { Activity, Users, Heart, TrendingUp } from "lucide-react";

export default function DashboardPage() {
    const stats = [
        {
            title: "Total Horses",
            value: "12",
            icon: Heart,
            color: "text-pink-600",
            bgColor: "bg-pink-100",
        },
        {
            title: "Active Events",
            value: "3",
            icon: Activity,
            color: "text-blue-600",
            bgColor: "bg-blue-100",
        },
        {
            title: "Team Members",
            value: "5",
            icon: Users,
            color: "text-green-600",
            bgColor: "bg-green-100",
        },
        {
            title: "Performance",
            value: "85%",
            icon: TrendingUp,
            color: "text-yellow-600",
            bgColor: "bg-yellow-100",
        },
    ];

    return (
        <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                    <div key={stat.title} className="rounded-lg border border-gray-200 bg-white p-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                                <p className="mt-2 text-3xl font-bold text-gray-900">{stat.value}</p>
                            </div>
                            <div className={`${stat.bgColor} rounded-lg p-3`}>
                                <stat.icon className={`h-6 w-6 ${stat.color}`} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Recent Activity */}
            <div className="rounded-lg border border-gray-200 bg-white p-6">
                <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
                <div className="mt-6 space-y-4">
                    {[
                        { title: "Horse \"Shadow\" checked in", time: "2 hours ago" },
                        { title: "Event scheduled for Tuesday", time: "4 hours ago" },
                        { title: "Team member invited", time: "1 day ago" },
                    ].map((activity, index) => (
                        <div key={index} className="border-t border-gray-100 pt-4 first:border-t-0 first:pt-0">
                            <p className="font-medium text-gray-900">{activity.title}</p>
                            <p className="text-sm text-gray-500">{activity.time}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid gap-4 md:grid-cols-2">
                <button className="rounded-lg border border-gray-200 bg-white p-6 hover:shadow-lg transition-shadow">
                    <h3 className="font-semibold text-gray-900">Add New Horse</h3>
                    <p className="mt-2 text-sm text-gray-600">Register a new horse to your account</p>
                </button>
                <button className="rounded-lg border border-gray-200 bg-white p-6 hover:shadow-lg transition-shadow">
                    <h3 className="font-semibold text-gray-900">Schedule Event</h3>
                    <p className="mt-2 text-sm text-gray-600">Create a new event or competition</p>
                </button>
            </div>
        </div>
    );
}
