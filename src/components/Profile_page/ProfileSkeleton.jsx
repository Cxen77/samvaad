import React from 'react';

const ProfileSkeleton = () => {
    return (
        <div className="min-h-screen bg-gray-50/50 animate-pulse">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Hero Skeleton */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
                    {/* Banner */}
                    <div className="h-48 md:h-64 bg-gray-200 w-full relative"></div>

                    <div className="relative px-4 sm:px-6 lg:px-8 pb-8">
                        <div className="flex flex-col sm:flex-row sm:items-end justify-between -mt-16 sm:-mt-20 mb-6 relative z-10">
                            {/* Profile Pic */}
                            <div className="flex items-center space-x-5">
                                <div className="h-32 w-32 sm:h-40 sm:w-40 rounded-full border-4 border-white bg-gray-200"></div>
                                <div className="mt-16 sm:mt-24 space-y-3">
                                    <div className="h-6 w-48 bg-gray-200 rounded"></div>
                                    <div className="h-4 w-32 bg-gray-200 rounded"></div>
                                </div>
                            </div>

                            {/* Buttons Skeleton */}
                            <div className="mt-6 sm:mt-0 flex gap-3">
                                <div className="h-10 w-24 bg-gray-200 rounded-lg"></div>
                                <div className="h-10 w-24 bg-gray-200 rounded-lg"></div>
                            </div>
                        </div>

                        {/* Bio & Stats Skeleton */}
                        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6 line-clamp-2">
                            <div className="md:col-span-2 space-y-3">
                                <div className="h-4 w-full bg-gray-200 rounded"></div>
                                <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
                                <div className="h-4 w-5/6 bg-gray-200 rounded"></div>
                            </div>
                            <div className="flex gap-6 items-start justify-start md:justify-end">
                                <div className="text-center">
                                    <div className="h-6 w-12 bg-gray-200 rounded mb-2"></div>
                                    <div className="h-4 w-16 bg-gray-200 rounded"></div>
                                </div>
                                <div className="text-center">
                                    <div className="h-6 w-12 bg-gray-200 rounded mb-2"></div>
                                    <div className="h-4 w-16 bg-gray-200 rounded"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tab Navigation Skeleton */}
                <div className="sticky top-16 z-20 bg-gray-50 pt-6 pb-4">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-1 flex">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="flex-1 h-10 bg-gray-100 rounded-lg mx-1"></div>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Main Content Area Skeleton */}
                    <div className="lg:col-span-8 space-y-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 min-h-[400px]">
                            <div className="h-8 w-40 bg-gray-200 rounded mb-6"></div>
                            <div className="space-y-4">
                                <div className="h-4 w-full bg-gray-200 rounded"></div>
                                <div className="h-4 w-5/6 bg-gray-200 rounded"></div>
                                <div className="h-4 w-full bg-gray-200 rounded"></div>
                                <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
                                <div className="h-4 w-full bg-gray-200 rounded"></div>
                            </div>
                        </div>
                    </div>

                    {/* Desktop Sidebar Skeleton */}
                    <div className="hidden lg:block lg:col-span-4 space-y-6 sticky top-24 self-start">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <div className="h-6 w-32 bg-gray-200 rounded mb-6"></div>
                            <div className="space-y-4 flex flex-col items-center">
                                <div className="h-24 w-24 bg-gray-200 rounded-full"></div>
                                <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
                            </div>
                        </div>
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <div className="h-6 w-32 bg-gray-200 rounded mb-6"></div>
                            <div className="space-y-4">
                                <div className="h-12 w-full bg-gray-200 rounded"></div>
                                <div className="h-12 w-full bg-gray-200 rounded"></div>
                                <div className="h-12 w-full bg-gray-200 rounded"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileSkeleton;
