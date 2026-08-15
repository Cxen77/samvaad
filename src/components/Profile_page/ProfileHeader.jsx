import React from 'react'
import userData from '../userdata'
import { FaCamera } from 'react-icons/fa'

const ProfileHeader = () => {
    const handleBannerEdit = () => {
        // TODO: Implement banner image upload
        console.log('Edit banner clicked')
    }

    const handleProfilePicEdit = () => {
        // TODO: Implement profile picture upload
        console.log('Edit profile picture clicked')
    }

    return (<>
        <div className="bg-white shadow-sm overflow-hidden">

            {/* Banner Container - ULTIMATE AGGRESSIVE FIX APPLIED */}
            <div
                className="h-48 relative overflow-hidden"
                // 🛑 RESET ALL KNOWN CLIPPING PROPERTIES TO FORCE RECTANGLE 🛑
                style={{
                    borderRadius: '0',
                    clipPath: 'none',
                    WebkitClipPath: 'none',
                    maskImage: 'none',
                    WebkitMaskImage: 'none',
                    // Adding a universal reset for all:
                    all: 'initial', // Note: This can break some utility classes like 'relative' and 'h-48'. Use with caution.
                }}
            >
                {userData.coverImage && (
                    <img
                        src={userData.coverImage}
                        alt="Cover"
                        className="w-full h-full object-cover"
                    />
                )}
                {/* Edit Banner Button */}
                <button
                    onClick={handleBannerEdit}
                    className="absolute bottom-4 right-4 bg-white/90 hover:bg-white text-gray-700 p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-110"
                    title="Edit cover image"
                >
                    <FaCamera className="w-5 h-5" />
                </button>
            </div>

            {/* Profile Info and Picture */}
            <div className="flex gap-2 lg:gap-4 p-4 relative -mt-20 ml-6">

                {/* Profile Picture with Edit Button */}
                <div className="relative">
                    <img
                        src={userData.profilePic}
                        alt="Profile"
                        className="w-32 h-32 rounded-full border-[4px] border-white bg-white overflow-hidden"
                        style={{ padding: 0, borderRadius: '50%' }}
                    />
                    {/* Edit Profile Picture Button */}
                    <button
                        onClick={handleProfilePicEdit}
                        className="absolute bottom-2 right-2 bg-sky-500 hover:bg-sky-600 text-white p-2 rounded-full shadow-lg transition-all duration-200 hover:scale-110"
                        title="Edit profile picture"
                    >
                        <FaCamera className="w-4 h-4" />
                    </button>
                </div>

                {/* User Text Details */}
                <div className="flex flex-col relative mt-16">
                    <h1 className="text-2xl font-bold">{userData.name}</h1>
                    <p className="text-gray-500">{userData.course}</p>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-4 p-4 lg:p-6">
                <button className="bg-sky-500 text-white px-4 py-2 rounded">
                    Follow
                </button>
            </div>
        </div>
    </>)
}

export default ProfileHeader