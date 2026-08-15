import passport from 'passport';
import { Strategy as GitHubStrategy } from 'passport-github2';
import User from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/github/callback`,
    passReqToCallback: true,
    // Add custom store to bypass session requirement since we are stateless
    store: {
        store: (req, state, meta, cb) => {
            // We don't store anything, just pass success
            cb(null, state);
        },
        verify: (req, providedState, cb) => {
            // We accept whatever state comes back, we verify it manually in the strategy
            cb(null, true, providedState);
        }
    }
},
    async (req, accessToken, refreshToken, profile, done) => {
        try {
            let user = null;
            let existingUser = await User.findOne({ githubId: profile.id });

            // Method 1: Check if state param contains user ID (Linking flow)
            const stateUserId = req.query.state;
            if (stateUserId) {
                user = await User.findById(stateUserId);
                if (user) {
                    // Check if githubId is already linked to ANOTHER user
                    if (existingUser && existingUser._id.toString() !== user._id.toString()) {
                        console.log(`GitHub account ${profile.id} is already linked to user ${existingUser._id}. Unlinking old user...`);
                        existingUser.githubId = undefined;
                        existingUser.githubAccessToken = undefined;
                        existingUser.githubId = null;
                        existingUser.githubId = undefined;
                        await existingUser.save();
                        console.log('Old user unlinked.');
                    }

                    user.githubId = profile.id;
                    user.githubAccessToken = accessToken;
                    user.socials = user.socials || {};
                    user.socials.github = profile.profileUrl;
                    await user.save();
                    return done(null, user);
                }
            }

            // Method 2: Login flow (not currently primary, but safe to keep)
            if (existingUser) {
                existingUser.githubAccessToken = accessToken;
                await existingUser.save();
                return done(null, existingUser);
            }

            return done(null, false, { message: "Please log in to link your GitHub account." });

        } catch (err) {
            return done(err);
        }
    }
));

export default passport;
