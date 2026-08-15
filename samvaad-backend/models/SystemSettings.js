import mongoose from 'mongoose';

// Default features configuration
const DEFAULT_FEATURES = {
    maintenance: { enabled: false, isKilled: false },
    chat: { enabled: true, isKilled: false, rolesAllowed: ['user', 'moderator', 'admin', 'organizer'] },
    textPost: { enabled: true, isKilled: false, rolesAllowed: ['user', 'moderator', 'admin', 'organizer'] },
    imagePost: { enabled: true, isKilled: false, rolesAllowed: ['user', 'moderator', 'admin', 'organizer'] },
    forum: { enabled: true, isKilled: false, rolesAllowed: ['user', 'moderator', 'admin', 'organizer'] },
    events: { enabled: true, isKilled: false, rolesAllowed: ['user', 'moderator', 'admin', 'organizer'] },
    autoJoin: { enabled: true, isKilled: false, rolesAllowed: ['user', 'moderator', 'admin', 'organizer'] }
};

const featureSchema = new mongoose.Schema({
    enabled: { type: Boolean, default: true },
    isKilled: { type: Boolean, default: false },
    rolesAllowed: [{ type: String, enum: ['user', 'moderator', 'admin', 'organizer'] }]
}, { _id: false });

const systemSettingsSchema = new mongoose.Schema({
    features: {
        type: Map,
        of: featureSchema,
        default: () => new Map(Object.entries(DEFAULT_FEATURES))
    },
    // Legacy fields kept for migration detection
    autoJoinEnabled: { type: Boolean },
    chatEnabled: { type: Boolean },
    eventCreationEnabled: { type: Boolean },
    forumEnabled: { type: Boolean },
    maintenanceMode: { type: Boolean }
}, {
    timestamps: true
});

// Static method to get or create the singleton + auto-migrate
systemSettingsSchema.statics.getSettings = async function () {
    let settings = await this.findOne();
    if (!settings) {
        settings = await this.create({});
    }

    // Auto-migrate from old boolean flags to new features structure
    const needsMigration = (
        settings.maintenanceMode !== undefined ||
        settings.chatEnabled !== undefined ||
        settings.eventCreationEnabled !== undefined ||
        settings.forumEnabled !== undefined ||
        settings.autoJoinEnabled !== undefined
    ) && (!settings.features || settings.features.size === 0);

    if (needsMigration) {
        const features = { ...DEFAULT_FEATURES };
        if (settings.maintenanceMode !== undefined) features.maintenance.enabled = settings.maintenanceMode;
        if (settings.chatEnabled !== undefined) features.chat.enabled = settings.chatEnabled;
        if (settings.eventCreationEnabled !== undefined) features.events.enabled = settings.eventCreationEnabled;
        if (settings.forumEnabled !== undefined) features.forum.enabled = settings.forumEnabled;
        if (settings.autoJoinEnabled !== undefined) features.autoJoin.enabled = settings.autoJoinEnabled;

        settings.features = new Map(Object.entries(features));
        // Clear old fields
        settings.maintenanceMode = undefined;
        settings.chatEnabled = undefined;
        settings.eventCreationEnabled = undefined;
        settings.forumEnabled = undefined;
        settings.autoJoinEnabled = undefined;
        await settings.save();
        console.log('[SystemSettings] Migrated legacy flags → features map');
    }

    // Ensure all default features exist (in case new features added later)
    let patched = false;
    for (const [key, value] of Object.entries(DEFAULT_FEATURES)) {
        if (!settings.features.has(key)) {
            settings.features.set(key, value);
            patched = true;
        }
    }
    if (patched) await settings.save();

    return settings;
};

// Helper to get features as a plain object
systemSettingsSchema.methods.getFeaturesObject = function () {
    const obj = {};
    if (this.features) {
        for (const [key, value] of this.features.entries()) {
            obj[key] = {
                enabled: value.enabled,
                isKilled: value.isKilled || false,
                rolesAllowed: value.rolesAllowed || []
            };
        }
    }
    return obj;
};

const SystemSettings = mongoose.model('SystemSettings', systemSettingsSchema);

export { DEFAULT_FEATURES };
export default SystemSettings;
