import React, { useState } from 'react';
import { HiX, HiPencilAlt, HiPhotograph, HiPaperAirplane, HiTag } from 'react-icons/hi';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import RichTextEditor from '../common/RichTextEditor';

const CreatePostModal = ({ isOpen, onClose, forums, onCreated, defaultForumId }) => {
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        image: '',
        forumId: defaultForumId || '',
        tags: ''
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleContentChange = (value) => {
        setFormData({ ...formData, content: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.forumId) {
            toast.error('Please select a community');
            return;
        }

        setLoading(true);
        try {
            const tagsArray = formData.tags.split(',').map(t => t.trim()).filter(t => t);
            const { data } = await api.post(`/forums/${formData.forumId}/posts`, {
                title: formData.title,
                content: formData.content,
                image: formData.image,
                tags: tagsArray
            });
            toast.success('Post created successfully!');
            onCreated(data);
            onClose();
            setFormData({ title: '', content: '', image: '', forumId: defaultForumId || '', tags: '' });
        } catch (error) {
            console.error("Failed to create post", error);
            toast.error(error.response?.data?.message || 'Failed to create post');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in duration-200 border border-gray-100 flex flex-col max-h-[90vh]">
                <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 flex-shrink-0">
                    <h3 className="font-bold text-xl text-gray-900 flex items-center gap-2">
                        <div className="bg-sky-100 p-1.5 rounded-lg">
                            <HiPencilAlt className="text-sky-600 w-5 h-5" />
                        </div>
                        Create a Post
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition text-gray-400 hover:text-gray-600">
                        <HiX className="w-5 h-5" />
                    </button>
                </div>

                <div className="overflow-y-auto p-6 flex-1 custom-scrollbar">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Community Selector */}
                        {!defaultForumId && (
                            <div>
                                <select
                                    name="forumId"
                                    value={formData.forumId}
                                    onChange={handleChange}
                                    className="w-full md:w-1/2 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-100 focus:border-sky-500 outline-none transition font-medium text-gray-700"
                                    required
                                >
                                    <option value="">Select a Community</option>
                                    {forums.map(forum => (
                                        <option key={forum._id} value={forum._id}>r/{forum.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-transparent border-b-2 border-gray-100 focus:border-sky-500 outline-none transition font-bold text-2xl placeholder-gray-300"
                                placeholder="Title"
                                required
                                maxLength={300}
                            />
                        </div>

                        <div>
                            <RichTextEditor
                                value={formData.content}
                                onChange={handleContentChange}
                                placeholder="What's on your mind?"
                                minHeight="min-h-[200px]"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                    <HiPhotograph className="text-gray-400" />
                                    Image URL
                                </label>
                                <input
                                    type="url"
                                    name="image"
                                    value={formData.image}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-100 focus:border-sky-500 outline-none transition"
                                    placeholder="https://..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                    <HiTag className="text-gray-400" />
                                    Tags (comma separated)
                                </label>
                                <input
                                    type="text"
                                    name="tags"
                                    value={formData.tags}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-100 focus:border-sky-500 outline-none transition"
                                    placeholder="discussion, help, news"
                                />
                            </div>
                        </div>
                    </form>
                </div>

                <div className="p-5 border-t border-gray-50 bg-gray-50/30 flex justify-end gap-3 flex-shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2.5 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {loading ? (
                            <>Posting...</>
                        ) : (
                            <>
                                <HiPaperAirplane className="w-5 h-5 rotate-90" />
                                Post
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreatePostModal;
