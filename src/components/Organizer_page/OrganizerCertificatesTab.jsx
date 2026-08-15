import React, { useState, useEffect, useRef } from 'react';
import api from '../../api/axios';
import { FiAward, FiImage, FiX, FiRefreshCcw, FiCalendar, FiChevronDown, FiMapPin, FiCompass } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

const CustomSelect = ({ options, value, onChange, icon: Icon, placeholder = "-- Select --", labelKey = "label", valueKey = "value", isCustomLink = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    const selectedOption = options.find(o => o[valueKey] === value);

    return (
        <div className="relative w-full">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs outline-none transition group hover:border-sky-500/30 shadow-sm"
            >
                <div className="flex items-center gap-2 text-left truncate">
                    {Icon && <Icon className="text-sky-500 shrink-0" size={12} />}
                    <span className={`truncate ${selectedOption || (isCustomLink && value === 'custom') ? "font-semibold" : "text-gray-400"}`}>
                        {isCustomLink && value === 'custom' ? "-- Custom Event (Manual Input) --" : (selectedOption ? selectedOption[labelKey] : placeholder)}
                    </span>
                </div>
                <FiChevronDown className={`transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`} size={12} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
                        <motion.div
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            className="absolute z-20 w-full mt-1 py-1 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-lg shadow-xl overflow-hidden max-h-48 overflow-y-auto custom-scrollbar"
                        >
                            {isCustomLink && (
                                <>
                                    <button
                                        onClick={() => {
                                            onChange('custom');
                                            setIsOpen(false);
                                        }}
                                        className={`w-full text-left px-3 py-2 text-xs transition-colors hover:bg-gray-50 dark:hover:bg-white/5 flex items-center justify-between font-bold ${value === 'custom' ? 'text-sky-500 bg-sky-500/5' : 'text-sky-500/80'
                                            }`}
                                    >
                                        <span>-- Custom Event (Manual Input) --</span>
                                        {value === 'custom' && <CheckCircle2 size={12} className="text-sky-500 shrink-0" />}
                                    </button>
                                    <div className="h-px bg-gray-100 dark:bg-gray-800 my-1" />
                                </>
                            )}

                            {options.length === 0 ? (
                                <p className="px-3 py-2 text-xs text-gray-500 italic">No options found</p>
                            ) : (
                                options.map((opt, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => {
                                            onChange(opt[valueKey]);
                                            setIsOpen(false);
                                        }}
                                        className={`w-full text-left px-3 py-2 text-xs transition-colors hover:bg-gray-50 dark:hover:bg-white/5 flex items-center justify-between ${value === opt[valueKey] ? 'text-sky-500 bg-sky-500/5' : 'text-gray-700 dark:text-gray-300'
                                            }`}
                                    >
                                        <span className="truncate">{opt[labelKey]}</span>
                                        {value === opt[valueKey] && <CheckCircle2 size={12} className="text-sky-500 shrink-0" />}
                                    </button>
                                ))
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default function OrganizerCertificatesTab() {
    const [events, setEvents] = useState([]);
    const [selectedEventId, setSelectedEventId] = useState('');
    const [recipientsText, setRecipientsText] = useState('');
    const [certType, setCertType] = useState('participant');
    const [templateType, setTemplateType] = useState('modern');
    const [generating, setGenerating] = useState(false);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState('');
    const debounceTimer = useRef(null);

    // Live preview object URLs
    const [orgLogoUrl, setOrgUrl] = useState('');
    const [sponsorLogoUrl, setSponsorUrl] = useState('');

    // Custom text overrides
    const [certTitle, setCertTitle] = useState('');
    const [presentationText, setPresentationText] = useState('');
    const [descriptionText, setDescriptionText] = useState('');
    const [signaturesText, setSignaturesText] = useState('');

    // Custom manual event inputs
    const [customEventName, setCustomEventName] = useState('');
    const [customEventDate, setCustomEventDate] = useState('');
    const [customOrgName, setCustomOrgName] = useState('');

    // Array-based Logos
    // [{ file: File, preview: 'blob:url', position: 'center'}]
    const [organizerLogos, setOrganizerLogos] = useState([]);
    // [{ file: File, preview: 'blob:url'}]
    const [sponsorLogos, setSponsorLogos] = useState([]);

    useEffect(() => {
        api.get('/organizer/events/my').then(r => setEvents(r.data)).catch(() => { });
    }, []);

    // Set defaults based on type
    useEffect(() => {
        if (certType === 'winner') {
            setCertTitle('CERTIFICATE OF EXCELLENCE');
            setPresentationText('This certificate is proudly presented to');
            setDescriptionText('for outstanding excellence in');
        } else {
            setCertTitle('CERTIFICATE OF PARTICIPATION');
            setPresentationText('This certificate is proudly presented to');
            setDescriptionText('for outstanding participation in');
        }
    }, [certType]);

    const handleOrgFiles = (e) => {
        const files = Array.from(e.target.files);
        const valid = files.filter(f => f.size <= 2 * 1024 * 1024);
        if (valid.length < files.length) toast.error('Some images ignored (must be < 2MB)');

        if (organizerLogos.length + valid.length > 3) {
            toast.error('Maximum 3 Organizer logos allowed.');
            e.target.value = '';
            return;
        }

        const newLogos = valid.map(file => ({
            file,
            preview: URL.createObjectURL(file),
            position: 'center' // Default position
        }));
        setOrganizerLogos(prev => [...prev, ...newLogos]);
        e.target.value = '';
    };

    const handleSponsorFiles = (e) => {
        const files = Array.from(e.target.files);
        const valid = files.filter(f => f.size <= 2 * 1024 * 1024);
        if (valid.length < files.length) toast.error('Some images ignored (must be < 2MB)');

        if (sponsorLogos.length + valid.length > 5) {
            toast.error('Maximum 5 Sponsor logos allowed.');
            e.target.value = '';
            return;
        }

        const newLogos = valid.map(file => ({
            file,
            preview: URL.createObjectURL(file)
        }));
        setSponsorLogos(prev => [...prev, ...newLogos]);
        e.target.value = '';
    };

    const removeOrgLogo = (index) => {
        setOrganizerLogos(prev => prev.filter((_, i) => i !== index));
    };

    const removeSponsorLogo = (index) => {
        setSponsorLogos(prev => prev.filter((_, i) => i !== index));
    };

    const updateOrgPosition = (index, pos) => {
        setOrganizerLogos(prev => {
            const next = [...prev];
            next[index].position = pos;
            return next;
        });
    };

    // Debounced Preview Fetcher
    useEffect(() => {
        if (!selectedEventId) return;

        if (debounceTimer.current) clearTimeout(debounceTimer.current);

        debounceTimer.current = setTimeout(async () => {
            setPreviewLoading(true);
            try {
                const formData = new FormData();
                formData.append('type', certType);
                formData.append('template', templateType);
                formData.append('certTitle', certTitle);
                formData.append('presentationText', presentationText);
                formData.append('descriptionText', descriptionText);
                formData.append('signaturesText', signaturesText);

                if (selectedEventId === 'custom') {
                    formData.append('customEventName', customEventName);
                    formData.append('customEventDate', customEventDate);
                    formData.append('customOrganizerName', customOrgName);
                }

                const orgMeta = organizerLogos.map(ol => ol.position);
                formData.append('orgMeta', JSON.stringify(orgMeta));
                organizerLogos.forEach(logo => formData.append('organizerLogos', logo.file));
                sponsorLogos.forEach(logo => formData.append('sponsorLogos', logo.file));

                const response = await api.post(`/organizer/events/${selectedEventId}/certificates/preview`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });

                if (response.data?.previewUrl) {
                    setPreviewUrl(response.data.previewUrl);
                }
            } catch (err) {
                console.error("Preview generation failed", err);
            } finally {
                setPreviewLoading(false);
            }
        }, 800);

        return () => clearTimeout(debounceTimer.current);
    }, [
        selectedEventId, certType, templateType, certTitle,
        presentationText, descriptionText, signaturesText, customEventName,
        customEventDate, customOrgName, organizerLogos, sponsorLogos
    ]);

    const handleGenerate = async () => {
        if (!selectedEventId) return;

        const lines = recipientsText.split('\n').map(l => l.trim()).filter(Boolean);
        if (lines.length === 0) {
            toast.error('Please enter at least one recipient name.');
            return;
        }

        const recipients = lines.map(line => {
            const parts = line.split('::');
            if (parts.length === 2) {
                return { userId: parts[0].trim(), name: parts[1].trim() };
            }
            return { userId: null, name: line };
        });

        const orgMeta = organizerLogos.map(ol => ol.position);

        setGenerating(true);
        try {
            const formData = new FormData();
            formData.append('recipients', JSON.stringify(recipients));
            formData.append('type', certType);
            formData.append('template', templateType);
            formData.append('certTitle', certTitle);
            formData.append('presentationText', presentationText);
            formData.append('descriptionText', descriptionText);
            formData.append('signaturesText', signaturesText);

            if (selectedEventId === 'custom') {
                formData.append('customEventName', customEventName);
                formData.append('customEventDate', customEventDate);
                formData.append('customOrganizerName', customOrgName);
            }

            // Append multiple files for organizers and metadata mapping their positions
            formData.append('orgMeta', JSON.stringify(orgMeta));
            organizerLogos.forEach(logo => {
                formData.append('organizerLogos', logo.file);
            });

            // Append multiple sponsor files
            sponsorLogos.forEach(logo => {
                formData.append('sponsorLogos', logo.file);
            });

            const response = await api.post(
                `/organizer/events/${selectedEventId}/certificates`,
                formData,
                {
                    responseType: 'blob',
                    headers: { 'Content-Type': 'multipart/form-data' }
                }
            );

            // Determine filename based on headers or default logic
            const contentDisposition = response.headers['content-disposition'];
            let filename = `certificates-${selectedEventId}.zip`;
            if (contentDisposition && contentDisposition.includes('filename=')) {
                filename = contentDisposition.split('filename=')[1].replace(/["']/g, '');
            } else if (recipients.length === 1) {
                filename = `certificate-${selectedEventId}.png`;
            }

            const url = window.URL.createObjectURL(new Blob([response.data], { type: response.data.type }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);

            toast.success('Certificates generated and downloaded!');
        } catch (err) {
            console.error(err);
            toast.error('Failed to generate certificates.');
        } finally {
            setGenerating(false);
        }
    };

    const selectedEvent = events.find(e => e._id === selectedEventId);

    return (
        <div className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-gray-800 rounded-2xl p-6 sm:p-8 flex flex-col gap-8">
            <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Certificate Builder</h2>
                <p className="text-gray-400 dark:text-gray-500">Design and generate professional, verifiable PDF certificates. Upload logos and customize text perfectly suited for your event.</p>
            </div>

            {/* Core Event & Type Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-gray-100 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
                <div className="flex flex-col gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Select Event</label>
                        <CustomSelect
                            options={events}
                            value={selectedEventId}
                            onChange={id => setSelectedEventId(id)}
                            icon={FiCalendar}
                            labelKey="title"
                            valueKey="_id"
                            isCustomLink={true}
                            placeholder="-- Choose an Event --"
                        />
                    </div>

                    {selectedEventId === 'custom' && (
                        <div className="flex flex-col gap-3 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-sky-500/20">
                            <input type="text" placeholder="Custom Event Name" value={customEventName} onChange={e => setCustomEventName(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-sm" />
                            <input type="text" placeholder="Custom Event Date (e.g. Feb 28, 2026)" value={customEventDate} onChange={e => setCustomEventDate(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-sm" />
                            <input type="text" placeholder="Custom Organizer Name" value={customOrgName} onChange={e => setCustomOrgName(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-sm" />
                        </div>
                    )}
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Certificate Type</label>
                    <div className="flex gap-2">
                        {['participant', 'winner'].map(t => (
                            <button
                                key={t}
                                onClick={() => setCertType(t)}
                                className={`flex-1 py-3 rounded-xl capitalize font-semibold text-sm border transition ${certType === t
                                    ? 'bg-sky-600 border-sky-500 text-white'
                                    : 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 hover:border-gray-200'
                                    }`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* LIVE PREVIEW (MOVED IN BETWEEN) */}
            <div className="p-6 bg-gray-100 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
                <h3 className="text-gray-900 dark:text-white font-medium mb-4 flex justify-between items-center">
                    <span>Live Preview</span>
                    {previewLoading ? (
                        <span className="flex items-center gap-2 text-xs bg-sky-500/20 text-sky-400 px-3 py-1.5 rounded-full">
                            <FiRefreshCcw className="animate-spin" /> Rendering PNG...
                        </span>
                    ) : (
                        <span className="text-xs bg-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-full font-medium">Exact Representation</span>
                    )}
                </h3>
                <div className="w-full max-w-4xl mx-auto aspect-[1.414/1] bg-white dark:bg-black rounded-lg overflow-hidden shadow-2xl relative border border-gray-200 dark:border-gray-800 flex items-center justify-center">
                    {!selectedEventId ? (
                        <div className="text-gray-400 text-sm">Please select an event to preview</div>
                    ) : previewUrl ? (
                        <img src={previewUrl} alt="Certificate Live Preview" className="w-full h-full object-contain" />
                    ) : (
                        <div className="text-gray-400 text-sm flex flex-col items-center gap-2">
                            <FiImage size={32} className="opacity-50" />
                            Waiting for render...
                        </div>
                    )}
                </div>
                <p className="text-gray-400 text-xs mt-4 text-center">This PNG preview exactly matches the final downloaded file.</p>
            </div>

            {/* Template Selection */}
            <div className="mb-6 p-6 bg-gray-100 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Choose Template Design</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                        { id: 'modern', name: 'Corporate Modern', desc: 'Sleek white & thin blue accent' },
                        { id: 'academic', name: 'Academic Formal', desc: 'Formal cream & dark red serif' },
                        { id: 'dark', name: 'Hackathon Tech', desc: 'Premium dark neon gradient' }
                    ].map((t) => (
                        <button
                            key={t.id}
                            onClick={() => setTemplateType(t.id)}
                            className={`text-left p-4 rounded-xl border-2 transition ${templateType === t.id
                                ? 'border-sky-500 bg-sky-500/10 dark:bg-sky-500/20'
                                : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 bg-gray-50 dark:bg-gray-800'
                                }`}
                        >
                            <div className="font-bold text-gray-900 dark:text-white mb-1">{t.name}</div>
                            <div className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed">{t.desc}</div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Custom Text Fields */}
            <div className="p-6 bg-gray-100 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Customize Text</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Main Title</label>
                        <input
                            type="text"
                            value={certTitle}
                            onChange={(e) => setCertTitle(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none transition resize-y text-sm font-mono"
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">Presentation Line</label>
                            <input
                                type="text"
                                value={presentationText}
                                onChange={(e) => setPresentationText(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none transition resize-y text-sm font-mono"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">Description Line</label>
                            <input
                                type="text"
                                value={descriptionText}
                                onChange={(e) => setDescriptionText(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none transition resize-y text-sm font-mono"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-gray-400 mb-1">Signatories (One per line) - Leave empty for default</label>
                            <textarea
                                value={signaturesText}
                                onChange={(e) => setSignaturesText(e.target.value)}
                                rows="2"
                                placeholder={"E.g. Dr. John Doe, Principal\nProf. Jane Smith, HOD"}
                                className="w-full px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none transition text-sm resize-y"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Logos */}
            <div className="p-6 bg-gray-100 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Add Logos (Optional)</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Organizer Logos (Multiple + Position) */}
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-2">Organizer Logos (Top) - Max 3</label>

                        {organizerLogos.length > 0 && (
                            <div className="flex flex-col gap-3 mb-4">
                                {organizerLogos.map((logo, idx) => (
                                    <div key={idx} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 bg-gray-100 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                                        <div className="flex items-center gap-3 flex-1 min-w-0 w-full">
                                            <img src={logo.preview} alt="Org" className="h-10 w-10 object-contain rounded bg-white dark:bg-white/10" />
                                            <div className="flex-1 truncate text-sm text-gray-600 dark:text-gray-400">
                                                {logo.file.name}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between w-full sm:w-auto gap-3">
                                            <div className="w-32">
                                                <CustomSelect
                                                    options={[
                                                        { label: 'Left', value: 'left' },
                                                        { label: 'Center', value: 'center' },
                                                        { label: 'Right', value: 'right' }
                                                    ]}
                                                    value={logo.position}
                                                    onChange={(val) => updateOrgPosition(idx, val)}
                                                    icon={FiCompass}
                                                />
                                            </div>

                                            <button onClick={() => removeOrgLogo(idx)} className="p-1.5 text-gray-400 hover:text-red-400 bg-gray-50 dark:bg-gray-900 rounded"><FiX /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {organizerLogos.length < 3 && (
                            <div className="relative">
                                <input
                                    type="file"
                                    multiple
                                    accept="image/png, image/jpeg"
                                    onChange={handleOrgFiles}
                                    className="hidden"
                                    id="organizer-logo-upload"
                                />
                                <label
                                    htmlFor="organizer-logo-upload"
                                    className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-200 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-600 bg-gray-100 dark:bg-gray-800 rounded-xl cursor-pointer transition"
                                >
                                    <FiImage size={24} className="mb-1 text-gray-400 dark:text-gray-500 opacity-50" />
                                    <span className="text-gray-400 dark:text-gray-500 text-sm">Upload PNG/JPG File</span>
                                </label>
                            </div>
                        )}
                    </div>

                    {/* Sponsor Logos (Multiple) */}
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-2">Sponsors (Bottom Center) - Max 5</label>

                        {sponsorLogos.length > 0 && (
                            <div className="flex flex-col gap-2 mb-4">
                                {sponsorLogos.map((logo, idx) => (
                                    <div key={idx} className="flex items-center gap-3 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                        <img src={logo.preview} alt="Sponsor" className="h-8 w-8 object-contain rounded bg-white dark:bg-white/10" />
                                        <div className="flex-1 truncate text-xs text-gray-600 dark:text-gray-400">
                                            {logo.file.name}
                                        </div>
                                        <button onClick={() => removeSponsorLogo(idx)} className="p-1 text-gray-400 hover:text-red-400"><FiX /></button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {sponsorLogos.length < 5 && (
                            <div className="relative">
                                <input
                                    type="file"
                                    multiple
                                    accept="image/png, image/jpeg"
                                    onChange={handleSponsorFiles}
                                    className="hidden"
                                    id="sponsor-logo-upload"
                                />
                                <label
                                    htmlFor="sponsor-logo-upload"
                                    className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-200 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-600 bg-gray-100 dark:bg-gray-800 rounded-xl cursor-pointer transition"
                                >
                                    <FiImage size={24} className="mb-1 text-gray-400 dark:text-gray-500 opacity-50" />
                                    <span className="text-gray-400 dark:text-gray-500 text-sm">Upload Sponsors...</span>
                                </label>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Recipient Input */}
            <div className="p-6 bg-gray-100 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Recipient List <span className="text-gray-400 dark:text-gray-500 font-normal">(One name per line)</span>
                </label>
                <textarea
                    value={recipientsText}
                    onChange={e => setRecipientsText(e.target.value)}
                    rows="6"
                    placeholder={"John Doe\nJane Smith\n1234::Alice Johnson (optional userId prefix for verification)"}
                    className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none transition resize-y text-sm font-mono"
                />
            </div>

            <div className="flex border-t border-gray-200 dark:border-gray-800 pt-6">
                <button
                    onClick={handleGenerate}
                    disabled={!selectedEventId || generating}
                    className="flex items-center justify-center w-full gap-2 px-8 py-3.5 bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-500 hover:to-sky-600 disabled:from-gray-200 disabled:to-gray-200 disabled:text-gray-400 text-white rounded-xl font-bold transition shadow-lg shadow-sky-900/40 text-lg hover:scale-[1.02] active:scale-[0.98]"
                >
                    <FiAward className="text-xl" />
                    {generating ? 'Building PDF...' : 'Download Certificates'}
                </button>
            </div>
        </div>
    );
}

