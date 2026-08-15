const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const readline = require('readline');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// ──────────────────────────────────────────────────────────────
// SCHEMA (mirrors models/College.js)
// ──────────────────────────────────────────────────────────────
const collegeSchema = new mongoose.Schema({
    name: { type: String, required: true },
    normalizedName: { type: String, required: true },
    country: { type: String, enum: ["India", "Nepal"], required: true },
    state: { type: String, default: null },
    city: { type: String, default: null },
    type: { type: String, enum: ["University", "College"], required: true },
    source: { type: String, enum: ["UGC", "AISHE", "NepalMoE", "Manual"], default: "Manual" },
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

collegeSchema.index({ normalizedName: 1, country: 1 }, { unique: true });
collegeSchema.index({ name: "text" });

const College = mongoose.models.College || mongoose.model("College", collegeSchema);

// ──────────────────────────────────────────────────────────────
// NORMALIZATION
// ──────────────────────────────────────────────────────────────
const STRIP_WORDS = new Set(['the', 'of', 'and', 'for', 'in', 'at']);

function normalize(name) {
    if (!name) return '';
    let n = name.toLowerCase();
    // Remove AISHE ID markers: (Id: C-12345) or (Id: U-12345)
    n = n.replace(/\(id:\s*[cu]-\d+\)/gi, '');
    // Remove punctuation
    n = n.replace(/[.,\-()'"\/\\&!@#$%^*+=\[\]{}|:;?<>~`]/g, ' ');
    // Strip articles
    n = n.split(/\s+/).filter(w => w && !STRIP_WORDS.has(w)).join(' ');
    // Collapse spaces + trim
    return n.replace(/\s+/g, ' ').trim();
}

function titleCase(name) {
    if (!name) return '';
    // Clean AISHE IDs first
    let n = name.replace(/\(Id:\s*[CU]-\d+\)/g, '').trim();
    // Fix common casing
    return n.replace(/\w\S*/g, (txt) => {
        const lower = txt.toLowerCase();
        // Keep small words lowercase unless first word
        if (['of', 'the', 'and', 'for', 'in', 'at', 'a', 'an'].includes(lower)) return lower;
        return lower.charAt(0).toUpperCase() + lower.substring(1);
    }).replace(/^\w/, c => c.toUpperCase()); // Ensure first char is uppercase
}

// ──────────────────────────────────────────────────────────────
// EXCLUSION FILTER — remove non-degree institutions
// ──────────────────────────────────────────────────────────────
const EXCLUDE_KEYWORDS = [
    'study center', 'study centre',
    'distance learning', 'distance education',
    'extension center', 'extension centre',
    'coaching', 'training center', 'training centre',
    'training institute', 'tutorial',
    'skill center', 'skill centre',
    'correspondence', 'open learning',
    'learner support', 'programme center',
    'programme centre', 'program center',
    'regional center', 'regional centre',
    'sub center', 'sub centre',
    'examination center', 'examination centre',
    // Additional aggressive filters
    'community college', 'community center', 'community centre',
    'hostel', 'canteen', 'mess',
    'primary school', 'high school', 'secondary school',
    'workshop', 'seminar',
    'field station', 'research station',
    'zonal office', 'outreach',
    'pre-university', 'pre university',
    'iti ', ' iti', 'industrial training',
    'anganwadi', 'ashram school',
    'child development',
];

// AISHE colleges must contain at least one of these keywords
const REQUIRE_KEYWORDS = [
    'college', 'institute', 'academy', 'school of',
    'polytechnic', 'vidyalaya', 'mahavidyalaya',
    'vidyapeeth', 'vidyapith', 'university',
    'engineering', 'medical', 'dental', 'pharmacy',
    'law college', 'law school', 'business school',
    'management institute', 'technology',
    'arts and science', 'arts & science',
    'degree college', 'first grade',
    'campus', 'faculty',
];

function shouldExclude(name) {
    if (!name) return true;
    const lower = name.toLowerCase();
    return EXCLUDE_KEYWORDS.some(kw => lower.includes(kw));
}

function hasInstitutionKeyword(name) {
    if (!name) return false;
    const lower = name.toLowerCase();
    return REQUIRE_KEYWORDS.some(kw => lower.includes(kw));
}

// ──────────────────────────────────────────────────────────────
// UGC VERIFIED CENTRAL UNIVERSITIES (56) — from ugc.gov.in
// ──────────────────────────────────────────────────────────────
const UGC_CENTRAL_UNIVERSITIES = [
    { name: "Central University of Andhra Pradesh", state: "Andhra Pradesh", city: "Anantapuram" },
    { name: "Central Tribal University of Andhra Pradesh", state: "Andhra Pradesh", city: "Vizianagaram" },
    { name: "The National Sanskrit University", state: "Andhra Pradesh", city: "Tirupati" },
    { name: "Rajiv Gandhi University", state: "Arunachal Pradesh", city: "Itanagar" },
    { name: "Assam University", state: "Assam", city: "Silchar" },
    { name: "Tezpur University", state: "Assam", city: "Sonitpur" },
    { name: "Central University of South Bihar", state: "Bihar", city: "Gaya" },
    { name: "Mahatma Gandhi Central University", state: "Bihar", city: "Motihari" },
    { name: "Nalanda University", state: "Bihar", city: "Rajgir" },
    { name: "Dr. Rajendra Prasad Central Agricultural University", state: "Bihar", city: "Samastipur" },
    { name: "Guru Ghasidas Vishwavidyalaya", state: "Chhattisgarh", city: "Bilaspur" },
    { name: "Indira Gandhi National Open University", state: "Delhi", city: "New Delhi" },
    { name: "Jamia Millia Islamia", state: "Delhi", city: "New Delhi" },
    { name: "Jawaharlal Nehru University", state: "Delhi", city: "New Delhi" },
    { name: "South Asian University", state: "Delhi", city: "New Delhi" },
    { name: "University of Delhi", state: "Delhi", city: "Delhi" },
    { name: "The Central Sanskrit University", state: "Delhi", city: "New Delhi" },
    { name: "Shri Lal Bahadur Shastri National Sanskrit University", state: "Delhi", city: "New Delhi" },
    { name: "Central University of Gujarat", state: "Gujarat", city: "Gandhinagar" },
    { name: "Gati Shakti Vishwavidyalaya", state: "Gujarat", city: "Vadodara" },
    { name: "Central University of Haryana", state: "Haryana", city: "Mahendergarh" },
    { name: "Central University of Himachal Pradesh", state: "Himachal Pradesh", city: "Dharamshala" },
    { name: "Central University of Kashmir", state: "Jammu and Kashmir", city: "Srinagar" },
    { name: "Central University of Jammu", state: "Jammu and Kashmir", city: "Jammu" },
    { name: "Central University of Jharkhand", state: "Jharkhand", city: "Ranchi" },
    { name: "Central University of Karnataka", state: "Karnataka", city: "Gulbarga" },
    { name: "Central University of Kerala", state: "Kerala", city: "Kasaragod" },
    { name: "The Indira Gandhi National Tribal University", state: "Madhya Pradesh", city: "Amarkantak" },
    { name: "Dr. Harisingh Gour Vishwavidyalaya", state: "Madhya Pradesh", city: "Sagar" },
    { name: "Mahatma Gandhi Antarrashtriya Hindi Vishwavidyalaya", state: "Maharashtra", city: "Wardha" },
    { name: "Central Agricultural University", state: "Manipur", city: "Imphal" },
    { name: "Manipur University", state: "Manipur", city: "Imphal" },
    { name: "National Sports University", state: "Manipur", city: "Imphal" },
    { name: "North Eastern Hill University", state: "Meghalaya", city: "Shillong" },
    { name: "Mizoram University", state: "Mizoram", city: "Aizawl" },
    { name: "Nagaland University", state: "Nagaland", city: "Lumami" },
    { name: "Central University of Odisha", state: "Odisha", city: "Koraput" },
    { name: "Pondicherry University", state: "Puducherry", city: "Puducherry" },
    { name: "Central University of Punjab", state: "Punjab", city: "Bathinda" },
    { name: "Central University of Rajasthan", state: "Rajasthan", city: "Ajmer" },
    { name: "Sikkim University", state: "Sikkim", city: "Gangtok" },
    { name: "Central University of Tamil Nadu", state: "Tamil Nadu", city: "Tiruvarur" },
    { name: "Indian Maritime University", state: "Tamil Nadu", city: "Chennai" },
    { name: "The English and Foreign Languages University", state: "Telangana", city: "Hyderabad" },
    { name: "Maulana Azad National Urdu University", state: "Telangana", city: "Hyderabad" },
    { name: "University of Hyderabad", state: "Telangana", city: "Hyderabad" },
    { name: "Central Tribal University of Telangana", state: "Telangana", city: "Mulugu" },
    { name: "Tripura University", state: "Tripura", city: "Agartala" },
    { name: "Aligarh Muslim University", state: "Uttar Pradesh", city: "Aligarh" },
    { name: "Babasaheb Bhimrao Ambedkar University", state: "Uttar Pradesh", city: "Lucknow" },
    { name: "Banaras Hindu University", state: "Uttar Pradesh", city: "Varanasi" },
    { name: "University of Allahabad", state: "Uttar Pradesh", city: "Prayagraj" },
    { name: "Rajiv Gandhi National Aviation University", state: "Uttar Pradesh", city: "Rae Bareli" },
    { name: "Rani Lakshmi Bai Central Agricultural University", state: "Uttar Pradesh", city: "Jhansi" },
    { name: "Hemwati Nandan Bahuguna Garhwal University", state: "Uttarakhand", city: "Garhwal" },
    { name: "Visva-Bharati", state: "West Bengal", city: "Santiniketan" },
];

// ──────────────────────────────────────────────────────────────
// IITs (23) — Institutes of National Importance
// ──────────────────────────────────────────────────────────────
const IITS = [
    { name: "Indian Institute of Technology Bombay", state: "Maharashtra", city: "Mumbai" },
    { name: "Indian Institute of Technology Delhi", state: "Delhi", city: "New Delhi" },
    { name: "Indian Institute of Technology Madras", state: "Tamil Nadu", city: "Chennai" },
    { name: "Indian Institute of Technology Kanpur", state: "Uttar Pradesh", city: "Kanpur" },
    { name: "Indian Institute of Technology Kharagpur", state: "West Bengal", city: "Kharagpur" },
    { name: "Indian Institute of Technology Roorkee", state: "Uttarakhand", city: "Roorkee" },
    { name: "Indian Institute of Technology Guwahati", state: "Assam", city: "Guwahati" },
    { name: "Indian Institute of Technology Hyderabad", state: "Telangana", city: "Hyderabad" },
    { name: "Indian Institute of Technology Indore", state: "Madhya Pradesh", city: "Indore" },
    { name: "Indian Institute of Technology Varanasi", state: "Uttar Pradesh", city: "Varanasi" },
    { name: "Indian Institute of Technology Bhubaneswar", state: "Odisha", city: "Bhubaneswar" },
    { name: "Indian Institute of Technology Gandhinagar", state: "Gujarat", city: "Gandhinagar" },
    { name: "Indian Institute of Technology Jodhpur", state: "Rajasthan", city: "Jodhpur" },
    { name: "Indian Institute of Technology Patna", state: "Bihar", city: "Patna" },
    { name: "Indian Institute of Technology Ropar", state: "Punjab", city: "Rupnagar" },
    { name: "Indian Institute of Technology Mandi", state: "Himachal Pradesh", city: "Mandi" },
    { name: "Indian Institute of Technology Tirupati", state: "Andhra Pradesh", city: "Tirupati" },
    { name: "Indian Institute of Technology Palakkad", state: "Kerala", city: "Palakkad" },
    { name: "Indian Institute of Technology Dhanbad", state: "Jharkhand", city: "Dhanbad" },
    { name: "Indian Institute of Technology Bhilai", state: "Chhattisgarh", city: "Bhilai" },
    { name: "Indian Institute of Technology Goa", state: "Goa", city: "Ponda" },
    { name: "Indian Institute of Technology Jammu", state: "Jammu and Kashmir", city: "Jammu" },
    { name: "Indian Institute of Technology Dharwad", state: "Karnataka", city: "Dharwad" },
];

// ──────────────────────────────────────────────────────────────
// NITs (31) — National Institutes of Technology
// ──────────────────────────────────────────────────────────────
const NITS = [
    { name: "National Institute of Technology Tiruchirappalli", state: "Tamil Nadu", city: "Tiruchirappalli" },
    { name: "National Institute of Technology Surathkal", state: "Karnataka", city: "Surathkal" },
    { name: "National Institute of Technology Warangal", state: "Telangana", city: "Warangal" },
    { name: "National Institute of Technology Rourkela", state: "Odisha", city: "Rourkela" },
    { name: "National Institute of Technology Calicut", state: "Kerala", city: "Calicut" },
    { name: "National Institute of Technology Durgapur", state: "West Bengal", city: "Durgapur" },
    { name: "National Institute of Technology Kurukshetra", state: "Haryana", city: "Kurukshetra" },
    { name: "Motilal Nehru National Institute of Technology Allahabad", state: "Uttar Pradesh", city: "Prayagraj" },
    { name: "Maulana Azad National Institute of Technology Bhopal", state: "Madhya Pradesh", city: "Bhopal" },
    { name: "National Institute of Technology Jamshedpur", state: "Jharkhand", city: "Jamshedpur" },
    { name: "National Institute of Technology Silchar", state: "Assam", city: "Silchar" },
    { name: "National Institute of Technology Hamirpur", state: "Himachal Pradesh", city: "Hamirpur" },
    { name: "National Institute of Technology Srinagar", state: "Jammu and Kashmir", city: "Srinagar" },
    { name: "National Institute of Technology Patna", state: "Bihar", city: "Patna" },
    { name: "National Institute of Technology Raipur", state: "Chhattisgarh", city: "Raipur" },
    { name: "National Institute of Technology Agartala", state: "Tripura", city: "Agartala" },
    { name: "National Institute of Technology Arunachal Pradesh", state: "Arunachal Pradesh", city: "Yupia" },
    { name: "National Institute of Technology Delhi", state: "Delhi", city: "New Delhi" },
    { name: "National Institute of Technology Goa", state: "Goa", city: "Farmagudi" },
    { name: "National Institute of Technology Manipur", state: "Manipur", city: "Imphal" },
    { name: "National Institute of Technology Meghalaya", state: "Meghalaya", city: "Shillong" },
    { name: "National Institute of Technology Mizoram", state: "Mizoram", city: "Aizawl" },
    { name: "National Institute of Technology Nagaland", state: "Nagaland", city: "Dimapur" },
    { name: "National Institute of Technology Puducherry", state: "Puducherry", city: "Puducherry" },
    { name: "National Institute of Technology Sikkim", state: "Sikkim", city: "Ravangla" },
    { name: "National Institute of Technology Surat", state: "Gujarat", city: "Surat" },
    { name: "National Institute of Technology Jaipur", state: "Rajasthan", city: "Jaipur" },
    { name: "National Institute of Technology Uttarakhand", state: "Uttarakhand", city: "Srinagar" },
    { name: "National Institute of Technology Andhra Pradesh", state: "Andhra Pradesh", city: "Tadepalligudem" },
    { name: "Visvesvaraya National Institute of Technology Nagpur", state: "Maharashtra", city: "Nagpur" },
    { name: "Sardar Vallabhbhai National Institute of Technology Surat", state: "Gujarat", city: "Surat" },
];

// ──────────────────────────────────────────────────────────────
// IIITs (25) — Indian Institutes of Information Technology
// ──────────────────────────────────────────────────────────────
const IIITS = [
    { name: "Indian Institute of Information Technology Allahabad", state: "Uttar Pradesh", city: "Prayagraj" },
    { name: "Indian Institute of Information Technology Gwalior", state: "Madhya Pradesh", city: "Gwalior" },
    { name: "Indian Institute of Information Technology Jabalpur", state: "Madhya Pradesh", city: "Jabalpur" },
    { name: "Indian Institute of Information Technology Kancheepuram", state: "Tamil Nadu", city: "Kancheepuram" },
    { name: "Indian Institute of Information Technology Sri City", state: "Andhra Pradesh", city: "Chittoor" },
    { name: "Indian Institute of Information Technology Lucknow", state: "Uttar Pradesh", city: "Lucknow" },
    { name: "Indian Institute of Information Technology Kota", state: "Rajasthan", city: "Kota" },
    { name: "Indian Institute of Information Technology Guwahati", state: "Assam", city: "Guwahati" },
    { name: "Indian Institute of Information Technology Vadodara", state: "Gujarat", city: "Vadodara" },
    { name: "Indian Institute of Information Technology Kottayam", state: "Kerala", city: "Kottayam" },
    { name: "Indian Institute of Information Technology Manipur", state: "Manipur", city: "Imphal" },
    { name: "Indian Institute of Information Technology Nagpur", state: "Maharashtra", city: "Nagpur" },
    { name: "Indian Institute of Information Technology Pune", state: "Maharashtra", city: "Pune" },
    { name: "Indian Institute of Information Technology Ranchi", state: "Jharkhand", city: "Ranchi" },
    { name: "Indian Institute of Information Technology Sonepat", state: "Haryana", city: "Sonepat" },
    { name: "Indian Institute of Information Technology Trichy", state: "Tamil Nadu", city: "Tiruchirappalli" },
    { name: "Indian Institute of Information Technology Una", state: "Himachal Pradesh", city: "Una" },
    { name: "Indian Institute of Information Technology Kalyani", state: "West Bengal", city: "Kalyani" },
    { name: "Indian Institute of Information Technology Dharwad", state: "Karnataka", city: "Dharwad" },
    { name: "Indian Institute of Information Technology Bhagalpur", state: "Bihar", city: "Bhagalpur" },
    { name: "Indian Institute of Information Technology Bhopal", state: "Madhya Pradesh", city: "Bhopal" },
    { name: "Indian Institute of Information Technology Surat", state: "Gujarat", city: "Surat" },
    { name: "Indian Institute of Information Technology Agartala", state: "Tripura", city: "Agartala" },
    { name: "Indian Institute of Information Technology Raichur", state: "Karnataka", city: "Raichur" },
    { name: "Indian Institute of Information Technology Killyani", state: "West Bengal", city: "Killyani" },
];

// ──────────────────────────────────────────────────────────────
// OTHER PREMIER INDIAN INSTITUTIONS — IISc, IISERs, AIIMS, NIDs, etc.
// ──────────────────────────────────────────────────────────────
const PREMIER_INDIA = [
    { name: "Indian Institute of Science", state: "Karnataka", city: "Bengaluru", type: "University" },
    { name: "Indian Statistical Institute", state: "West Bengal", city: "Kolkata", type: "University" },
    { name: "Indian Institute of Science Education and Research Pune", state: "Maharashtra", city: "Pune", type: "University" },
    { name: "Indian Institute of Science Education and Research Kolkata", state: "West Bengal", city: "Kolkata", type: "University" },
    { name: "Indian Institute of Science Education and Research Mohali", state: "Punjab", city: "Mohali", type: "University" },
    { name: "Indian Institute of Science Education and Research Bhopal", state: "Madhya Pradesh", city: "Bhopal", type: "University" },
    { name: "Indian Institute of Science Education and Research Thiruvananthapuram", state: "Kerala", city: "Thiruvananthapuram", type: "University" },
    { name: "Indian Institute of Science Education and Research Tirupati", state: "Andhra Pradesh", city: "Tirupati", type: "University" },
    { name: "Indian Institute of Science Education and Research Berhampur", state: "Odisha", city: "Berhampur", type: "University" },
    { name: "All India Institute of Medical Sciences New Delhi", state: "Delhi", city: "New Delhi", type: "University" },
    { name: "All India Institute of Medical Sciences Bhopal", state: "Madhya Pradesh", city: "Bhopal", type: "University" },
    { name: "All India Institute of Medical Sciences Jodhpur", state: "Rajasthan", city: "Jodhpur", type: "University" },
    { name: "All India Institute of Medical Sciences Patna", state: "Bihar", city: "Patna", type: "University" },
    { name: "All India Institute of Medical Sciences Rishikesh", state: "Uttarakhand", city: "Rishikesh", type: "University" },
    { name: "All India Institute of Medical Sciences Raipur", state: "Chhattisgarh", city: "Raipur", type: "University" },
    { name: "All India Institute of Medical Sciences Bhubaneswar", state: "Odisha", city: "Bhubaneswar", type: "University" },
    { name: "National Institute of Design Ahmedabad", state: "Gujarat", city: "Ahmedabad", type: "University" },
    { name: "National Law School of India University", state: "Karnataka", city: "Bengaluru", type: "University" },
    { name: "National Law University Delhi", state: "Delhi", city: "New Delhi", type: "University" },
    { name: "NALSAR University of Law", state: "Telangana", city: "Hyderabad", type: "University" },
    // Popular Private Universities
    { name: "BITS Pilani", state: "Rajasthan", city: "Pilani", type: "University" },
    { name: "Vellore Institute of Technology", state: "Tamil Nadu", city: "Vellore", type: "University" },
    { name: "SRM Institute of Science and Technology", state: "Tamil Nadu", city: "Chennai", type: "University" },
    { name: "Manipal Academy of Higher Education", state: "Karnataka", city: "Manipal", type: "University" },
    { name: "Amity University", state: "Uttar Pradesh", city: "Noida", type: "University" },
    { name: "Lovely Professional University", state: "Punjab", city: "Phagwara", type: "University" },
    { name: "Chandigarh University", state: "Punjab", city: "Mohali", type: "University" },
    { name: "Symbiosis International University", state: "Maharashtra", city: "Pune", type: "University" },
    { name: "Christ University", state: "Karnataka", city: "Bengaluru", type: "University" },
    { name: "Jain University", state: "Karnataka", city: "Bengaluru", type: "University" },
    { name: "PES University", state: "Karnataka", city: "Bengaluru", type: "University" },
    { name: "Thapar Institute of Engineering and Technology", state: "Punjab", city: "Patiala", type: "University" },
    { name: "DIT University", state: "Uttarakhand", city: "Dehradun", type: "University" },
    { name: "Shiv Nadar University", state: "Uttar Pradesh", city: "Greater Noida", type: "University" },
    { name: "Ashoka University", state: "Haryana", city: "Sonepat", type: "University" },
    { name: "O.P. Jindal Global University", state: "Haryana", city: "Sonepat", type: "University" },
    { name: "Amrita Vishwa Vidyapeetham", state: "Tamil Nadu", city: "Coimbatore", type: "University" },
    { name: "Kalinga Institute of Industrial Technology", state: "Odisha", city: "Bhubaneswar", type: "University" },
    // Popular Colleges
    { name: "BMS College of Engineering", state: "Karnataka", city: "Bengaluru", type: "College" },
    { name: "RV College of Engineering", state: "Karnataka", city: "Bengaluru", type: "College" },
    { name: "Ramaiah Institute of Technology", state: "Karnataka", city: "Bengaluru", type: "College" },
    { name: "Dayananda Sagar College of Engineering", state: "Karnataka", city: "Bengaluru", type: "College" },
    { name: "Bangalore Institute of Technology", state: "Karnataka", city: "Bengaluru", type: "College" },
    { name: "College of Engineering Pune", state: "Maharashtra", city: "Pune", type: "College" },
    { name: "Netaji Subhas University of Technology", state: "Delhi", city: "New Delhi", type: "University" },
    { name: "Delhi Technological University", state: "Delhi", city: "New Delhi", type: "University" },
    { name: "Indraprastha Institute of Information Technology Delhi", state: "Delhi", city: "New Delhi", type: "University" },
];

// ──────────────────────────────────────────────────────────────
// NEPAL — Official Universities (14) from Ministry of Education
// ──────────────────────────────────────────────────────────────
const NEPAL_UNIVERSITIES = [
    { name: "Tribhuvan University", state: "Bagmati", city: "Kathmandu" },
    { name: "Kathmandu University", state: "Bagmati", city: "Dhulikhel" },
    { name: "Pokhara University", state: "Gandaki", city: "Pokhara" },
    { name: "Purbanchal University", state: "Province 1", city: "Biratnagar" },
    { name: "Nepal Sanskrit University", state: "Bagmati", city: "Dang" },
    { name: "Lumbini Buddhist University", state: "Lumbini", city: "Lumbini" },
    { name: "Mid-Western University", state: "Karnali", city: "Surkhet" },
    { name: "Far-Western University", state: "Sudurpashchim", city: "Mahendranagar" },
    { name: "Agriculture and Forestry University", state: "Bagmati", city: "Chitwan" },
    { name: "Nepal Open University", state: "Bagmati", city: "Lalitpur" },
    { name: "Rajarshi Janak University", state: "Madhesh", city: "Janakpur" },
    { name: "Madan Bhandari University of Science and Technology", state: "Province 1", city: "Dhankuta" },
    { name: "Gandaki University", state: "Gandaki", city: "Pokhara" },
    { name: "Manmohan Technical University", state: "Gandaki", city: "Pokhara" },
];

// ──────────────────────────────────────────────────────────────
// NEPAL — Verified Affiliated Colleges (from TU, KU, PU)
// ──────────────────────────────────────────────────────────────
const NEPAL_COLLEGES = [
    // TU Constituent Campuses
    { name: "Amrit Science Campus", state: "Bagmati", city: "Kathmandu" },
    { name: "Tri-Chandra Multiple Campus", state: "Bagmati", city: "Kathmandu" },
    { name: "Padma Kanya Multiple Campus", state: "Bagmati", city: "Kathmandu" },
    { name: "Shanker Dev Campus", state: "Bagmati", city: "Kathmandu" },
    { name: "Pulchowk Campus", state: "Bagmati", city: "Lalitpur" },
    { name: "Thapathali Campus", state: "Bagmati", city: "Kathmandu" },
    { name: "Central Department of Management", state: "Bagmati", city: "Kathmandu" },
    { name: "Patan Multiple Campus", state: "Bagmati", city: "Lalitpur" },
    { name: "Bhaktapur Multiple Campus", state: "Bagmati", city: "Bhaktapur" },
    { name: "Mahendra Ratna Campus Tahachal", state: "Bagmati", city: "Kathmandu" },
    { name: "Public Youth Campus", state: "Bagmati", city: "Kathmandu" },
    { name: "Prithvi Narayan Campus", state: "Gandaki", city: "Pokhara" },
    { name: "Mahendra Morang Adarsh Multiple Campus", state: "Province 1", city: "Biratnagar" },
    { name: "Paschimanchal Campus", state: "Lumbini", city: "Butwal" },
    { name: "Purwanchal Campus", state: "Province 1", city: "Dharan" },
    { name: "Birendra Multiple Campus", state: "Province 1", city: "Dharan" },
    { name: "Ratna Rajyalaxmi Campus", state: "Bagmati", city: "Kathmandu" },
    { name: "Saraswati Multiple Campus", state: "Bagmati", city: "Kathmandu" },
    { name: "Central Campus of Technology", state: "Province 1", city: "Dharan" },
    // TU Affiliated Private Colleges
    { name: "Prime College", state: "Bagmati", city: "Kathmandu" },
    { name: "Sagarmatha Engineering College", state: "Bagmati", city: "Lalitpur" },
    { name: "Himalaya College of Engineering", state: "Bagmati", city: "Lalitpur" },
    { name: "Kantipur Engineering College", state: "Bagmati", city: "Lalitpur" },
    { name: "Advanced College of Engineering and Management", state: "Bagmati", city: "Kathmandu" },
    { name: "Kathmandu Engineering College", state: "Bagmati", city: "Kathmandu" },
    { name: "Lalitpur Engineering College", state: "Bagmati", city: "Lalitpur" },
    { name: "National College of Engineering", state: "Bagmati", city: "Lalitpur" },
    { name: "Nepal Engineering College", state: "Bagmati", city: "Bhaktapur" },
    { name: "Khwopa Engineering College", state: "Bagmati", city: "Bhaktapur" },
    { name: "Khwopa College of Engineering", state: "Bagmati", city: "Bhaktapur" },
    { name: "Janakpur Engineering College", state: "Madhesh", city: "Janakpur" },
    { name: "Lumbini Engineering College", state: "Lumbini", city: "Butwal" },
    // Medical Colleges
    { name: "Kathmandu Medical College", state: "Bagmati", city: "Kathmandu" },
    { name: "Nepal Medical College", state: "Bagmati", city: "Kathmandu" },
    { name: "Manipal College of Medical Sciences", state: "Gandaki", city: "Pokhara" },
    { name: "College of Medical Sciences", state: "Province 1", city: "Bharatpur" },
    { name: "Universal College of Medical Sciences", state: "Lumbini", city: "Bhairahawa" },
    { name: "Chitwan Medical College", state: "Bagmati", city: "Chitwan" },
    { name: "Gandaki Medical College", state: "Gandaki", city: "Pokhara" },
    { name: "National Academy of Medical Sciences", state: "Bagmati", city: "Kathmandu" },
    { name: "B.P. Koirala Institute of Health Sciences", state: "Province 1", city: "Dharan" },
    { name: "Patan Academy of Health Sciences", state: "Bagmati", city: "Lalitpur" },
    { name: "Nepalgunj Medical College", state: "Lumbini", city: "Nepalgunj" },
    // KU Affiliated
    { name: "Kathmandu University School of Management", state: "Bagmati", city: "Lalitpur" },
    { name: "Kathmandu University School of Engineering", state: "Bagmati", city: "Dhulikhel" },
    { name: "Kathmandu University School of Science", state: "Bagmati", city: "Dhulikhel" },
    { name: "Kathmandu University School of Medical Sciences", state: "Bagmati", city: "Dhulikhel" },
    { name: "Kathmandu University School of Education", state: "Bagmati", city: "Lalitpur" },
    { name: "Kathmandu University School of Arts", state: "Bagmati", city: "Lalitpur" },
    { name: "Nepal College of Information Technology", state: "Bagmati", city: "Lalitpur" },
    { name: "Little Angels College of Management", state: "Bagmati", city: "Lalitpur" },
    { name: "National College Kathmandu", state: "Bagmati", city: "Kathmandu" },
    // PU Affiliated
    { name: "Ace Institute of Management", state: "Bagmati", city: "Kathmandu" },
    { name: "Uniglobe College", state: "Bagmati", city: "Kathmandu" },
    { name: "Cosmos College of Management and Technology", state: "Province 1", city: "Biratnagar" },
    { name: "Brihaspati College", state: "Bagmati", city: "Kathmandu" },
    { name: "SAIM College", state: "Bagmati", city: "Kathmandu" },
    { name: "Crimson College of Technology", state: "Lumbini", city: "Butwal" },
    { name: "Pokhara Engineering College", state: "Gandaki", city: "Pokhara" },
    { name: "School of Engineering Pokhara University", state: "Gandaki", city: "Pokhara" },
    { name: "School of Business Pokhara University", state: "Gandaki", city: "Pokhara" },
    { name: "School of Health and Allied Sciences Pokhara University", state: "Gandaki", city: "Pokhara" },
    // Other notable
    { name: "Balkumari College", state: "Province 1", city: "Chitwan" },
    { name: "Birgunj Public College", state: "Madhesh", city: "Birgunj" },
    { name: "Butwal Multiple Campus", state: "Lumbini", city: "Butwal" },
    { name: "Dharan Multiple Campus", state: "Province 1", city: "Dharan" },
    { name: "Hetauda City College", state: "Bagmati", city: "Hetauda" },
    { name: "Sunsari Technical College", state: "Province 1", city: "Dharan" },
    { name: "Gandaki College of Engineering and Science", state: "Gandaki", city: "Pokhara" },
    { name: "Nepal Polytechnic Institute", state: "Province 1", city: "Bharatpur" },
    { name: "Tribhuvan University Institute of Engineering", state: "Bagmati", city: "Lalitpur" },
    { name: "Tribhuvan University Institute of Medicine", state: "Bagmati", city: "Kathmandu" },
    { name: "Tribhuvan University Institute of Science and Technology", state: "Bagmati", city: "Kathmandu" },
    { name: "Tribhuvan University Central Department of Computer Science", state: "Bagmati", city: "Kathmandu" },
    { name: "Tribhuvan University Central Department of Physics", state: "Bagmati", city: "Kathmandu" },
];

// ──────────────────────────────────────────────────────────────
// MAIN SEED FUNCTION
// ──────────────────────────────────────────────────────────────
async function main() {
    console.log('╔══════════════════════════════════════════╗');
    console.log('║   TRUSTED COLLEGE DATA IMPORT            ║');
    console.log('╚══════════════════════════════════════════╝\n');

    // Connect
    await mongoose.connect(process.env.MONGO_URI);
    console.log(`✓ Connected to MongoDB: ${mongoose.connection.host}\n`);

    const seen = new Map(); // normalizedName+country → entry
    let stats = {
        aisheRaw: 0, aisheClean: 0, aisheSkipped: 0,
        ugc: 0, iit: 0, nit: 0, iiit: 0, premier: 0,
        nepalUni: 0, nepalCollege: 0,
        duplicatesRemoved: 0, excludedNonDegree: 0, excludedEmpty: 0,
    };

    function addEntry(name, country, state, city, type, source) {
        const cleanName = titleCase(name);
        const normName = normalize(name);
        if (!normName || normName.length < 3) { stats.excludedEmpty++; return; }
        if (shouldExclude(name)) { stats.excludedNonDegree++; return; }

        const key = `${normName}::${country}`;
        if (seen.has(key)) {
            stats.duplicatesRemoved++;
            return;
        }

        seen.set(key, {
            name: cleanName,
            normalizedName: normName,
            country,
            state: state || null,
            city: city || null,
            type,
            source,
            isVerified: true,
            isActive: true,
        });
    }

    // ──── 1. UGC Central Universities ──────────────────
    for (const u of UGC_CENTRAL_UNIVERSITIES) {
        addEntry(u.name, 'India', u.state, u.city, 'University', 'UGC');
        stats.ugc++;
    }
    console.log(`✓ UGC Central Universities: ${stats.ugc}`);

    // ──── 2. IITs ──────────────────────────────────────
    for (const u of IITS) {
        addEntry(u.name, 'India', u.state, u.city, 'University', 'UGC');
        stats.iit++;
    }
    console.log(`✓ IITs: ${stats.iit}`);

    // ──── 3. NITs ──────────────────────────────────────
    for (const u of NITS) {
        addEntry(u.name, 'India', u.state, u.city, 'University', 'UGC');
        stats.nit++;
    }
    console.log(`✓ NITs: ${stats.nit}`);

    // ──── 4. IIITs ─────────────────────────────────────
    for (const u of IIITS) {
        addEntry(u.name, 'India', u.state, u.city, 'University', 'UGC');
        stats.iiit++;
    }
    console.log(`✓ IIITs: ${stats.iiit}`);

    // ──── 5. Other Premier Institutions ────────────────
    for (const u of PREMIER_INDIA) {
        addEntry(u.name, 'India', u.state, u.city, u.type || 'University', 'UGC');
        stats.premier++;
    }
    console.log(`✓ Other Premier Institutions: ${stats.premier}`);

    // ──── 6. AISHE Data ────────────────────────────────
    const filePath = path.join(__dirname, '../../src/utils/colleges_varthan.json');
    if (!fs.existsSync(filePath)) {
        console.error('✗ AISHE file not found:', filePath);
        process.exit(1);
    }
    const aisheData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    stats.aisheRaw = aisheData.length;

    // Extract unique universities first
    const aisheUniversities = new Set();
    for (const entry of aisheData) {
        if (entry.university) {
            aisheUniversities.add(entry.university);
        }
    }

    // Add universities
    for (const uniName of aisheUniversities) {
        const sample = aisheData.find(e => e.university === uniName);
        addEntry(uniName, 'India', sample?.state || null, sample?.district || null, 'University', 'AISHE');
    }

    // Add colleges — ONLY those with recognized institution keywords
    let aisheCollegesSkipped = 0;
    for (const entry of aisheData) {
        if (!entry.college) continue;
        if (!hasInstitutionKeyword(entry.college)) {
            aisheCollegesSkipped++;
            continue;
        }
        addEntry(entry.college, 'India', entry.state || null, entry.district || null, 'College', 'AISHE');
    }
    stats.aisheClean = seen.size - stats.ugc - stats.iit - stats.nit - stats.iiit - stats.premier;
    console.log(`✓ AISHE: ${stats.aisheRaw} raw → ${stats.aisheClean} clean (${aisheCollegesSkipped} colleges lacked institution keywords)`);

    // ──── 7. Nepal Universities ────────────────────────
    for (const u of NEPAL_UNIVERSITIES) {
        addEntry(u.name, 'Nepal', u.state, u.city, 'University', 'NepalMoE');
        stats.nepalUni++;
    }
    console.log(`✓ Nepal Universities: ${stats.nepalUni}`);

    // ──── 8. Nepal Colleges ────────────────────────────
    for (const c of NEPAL_COLLEGES) {
        addEntry(c.name, 'Nepal', c.state, c.city, 'College', 'NepalMoE');
        stats.nepalCollege++;
    }
    console.log(`✓ Nepal Colleges: ${stats.nepalCollege}`);

    // ──── SUMMARY ──────────────────────────────────────
    const entries = Array.from(seen.values());
    const indiaCount = entries.filter(e => e.country === 'India').length;
    const nepalCount = entries.filter(e => e.country === 'Nepal').length;
    const uniCount = entries.filter(e => e.type === 'University').length;
    const colCount = entries.filter(e => e.type === 'College').length;

    console.log('\n╔══════════════════════════════════════════╗');
    console.log('║              SUMMARY                     ║');
    console.log('╠══════════════════════════════════════════╣');
    console.log(`║ AISHE raw entries:      ${String(stats.aisheRaw).padStart(6)}`);
    console.log(`║ Total after cleaning:   ${String(entries.length).padStart(6)}`);
    console.log(`║ ────────────────────────────────────────`);
    console.log(`║ India:                  ${String(indiaCount).padStart(6)}`);
    console.log(`║ Nepal:                  ${String(nepalCount).padStart(6)}`);
    console.log(`║ ────────────────────────────────────────`);
    console.log(`║ Universities:           ${String(uniCount).padStart(6)}`);
    console.log(`║ Colleges:               ${String(colCount).padStart(6)}`);
    console.log(`║ ────────────────────────────────────────`);
    console.log(`║ Duplicates removed:     ${String(stats.duplicatesRemoved).padStart(6)}`);
    console.log(`║ Non-degree excluded:    ${String(stats.excludedNonDegree).padStart(6)}`);
    console.log(`║ Empty/invalid excluded: ${String(stats.excludedEmpty).padStart(6)}`);
    console.log('╚══════════════════════════════════════════╝\n');

    if (entries.length > 4000) {
        console.log('⚠ WARNING: Over 4,000 entries. Check cleaning rules.');
    } else {
        console.log('✓ Under 4,000 — target met!');
    }

    // ──── CONFIRMATION ─────────────────────────────────
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const answer = await new Promise(resolve => {
        rl.question('Insert into database? [y/N] ', resolve);
    });
    rl.close();

    if (answer.toLowerCase() !== 'y') {
        console.log('Aborted.');
        process.exit(0);
    }

    // ──── DROP OLD DATA + INSERT ───────────────────────
    console.log('\nDropping existing colleges collection...');
    await mongoose.connection.db.collection('colleges').drop().catch(() => { });

    // Ensure indexes before insert
    await College.syncIndexes();
    console.log('✓ Indexes synced');

    // BulkWrite in batches of 1000
    const batchSize = 1000;
    let inserted = 0;
    let skipped = 0;

    for (let i = 0; i < entries.length; i += batchSize) {
        const batch = entries.slice(i, i + batchSize);
        const ops = batch.map(entry => ({
            updateOne: {
                filter: { normalizedName: entry.normalizedName, country: entry.country },
                update: { $setOnInsert: entry },
                upsert: true
            }
        }));

        const result = await College.bulkWrite(ops, { ordered: false });
        inserted += result.upsertedCount;
        skipped += result.modifiedCount;
        process.stdout.write(`\rInserted: ${inserted} / ${entries.length}`);
    }

    console.log(`\n\n✓ Done!`);
    console.log(`  Inserted: ${inserted}`);
    console.log(`  Skipped (already existed): ${skipped}`);

    // Verify
    const finalCount = await College.countDocuments();
    console.log(`  Final collection count: ${finalCount}`);

    process.exit(0);
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
