import React, { useState, useRef } from 'react';
import { FaCamera, FaTimes, FaCheck } from 'react-icons/fa';
import api from '../../api/axios';

const ImageUpload = ({ type = 'profile', currentImage, onUploadSuccess }) => {
    const [preview, setPreview] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const fileInputRef = useRef(null);

    const isProfilePic = type === 'profile';
    const endpoint = isProfilePic ? '/users/profile-pic' : '/users/banner-pic';

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        if (!validTypes.includes(file.type)) {
            setError('Please upload a JPG or PNG image');
            return;
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            setError('Image must be less than 5MB');
            return;
        }

        setError('');
        setSelectedFile(file); // Store the file in state

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            setError('Please select a file first');
            return;
        }

        setUploading(true);
        setError('');
        setSuccess(false);

        try {
            const formData = new FormData();
            formData.append(isProfilePic ? 'profilePic' : 'bannerPic', selectedFile);


            const { data } = await api.put(endpoint, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });



            setSuccess(true);

            // Wait a moment to show success state
            setTimeout(() => {
                onUploadSuccess(data);
                setPreview(null);
                setSelectedFile(null);
                setSuccess(false);
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            }, 800);
        } catch (err) {
            console.error('Upload error:', err);
            console.error('Error response:', err.response);
            const errorMsg = err.response?.data?.message || err.message || 'Failed to upload image';
            setError(errorMsg);
        } finally {
            setUploading(false);
        }
    };

    const handleCancel = () => {
        setPreview(null);
        setSelectedFile(null);
        setError('');
        setSuccess(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleButtonClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    if (preview) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
                    <div className="mb-4">
                        <h3 className="text-xl font-bold text-gray-900">
                            Preview {isProfilePic ? 'Profile Picture' : 'Banner Image'}
                        </h3>
                    </div>

                    {error && (
                        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded flex items-center gap-2">
                            <FaCheck /> Upload successful!
                        </div>
                    )}

                    <div className="mb-6">
                        {isProfilePic ? (
                            <div className="flex justify-center">
                                <img
                                    src={preview}
                                    alt="Preview"
                                    className="w-48 h-48 rounded-full object-cover border-4 border-gray-200"
                                />
                            </div>
                        ) : (
                            <img
                                src={preview}
                                alt="Preview"
                                className="w-full h-64 object-cover rounded-lg"
                            />
                        )}
                    </div>

                    <div className="flex justify-end gap-3">
                        <button
                            onClick={handleCancel}
                            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                            disabled={uploading || success}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleUpload}
                            className="flex items-center gap-2 px-6 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={uploading || success}
                        >
                            {uploading ? (
                                <>
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Uploading...
                                </>
                            ) : success ? (
                                <>
                                    <FaCheck /> Uploaded!
                                </>
                            ) : (
                                <>
                                    <FaCheck /> Upload
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png"
                onChange={handleFileSelect}
                className="hidden"
            />
            <button
                onClick={handleButtonClick}
                className={isProfilePic
                    ? "absolute bottom-1 right-1 md:bottom-2 md:right-2 bg-sky-500 hover:bg-sky-600 text-white p-2 md:p-2.5 rounded-full shadow-md transition-all duration-200 hover:scale-110"
                    : "absolute top-4 left-4 md:top-auto md:left-auto md:bottom-4 md:right-4 bg-white/90 hover:bg-white text-gray-700 p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-110"
                }
                title={`Edit ${isProfilePic ? 'profile picture' : 'cover image'}`}
            >
                <FaCamera className={isProfilePic ? "w-3.5 h-3.5 md:w-4 md:h-4" : "w-5 h-5"} />
            </button>
        </>
    );
};

export default ImageUpload;
