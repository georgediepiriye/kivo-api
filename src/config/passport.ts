import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { User } from "../models/User.js";
import config from "./config.js";

passport.use(
  new GoogleStrategy(
    {
      clientID: config.googleOAuth.clientId,
      clientSecret: config.googleOAuth.clientSecret,
      callbackURL: `${config.apiUrl}/v1/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0].value;

        // Account Linking Logic: Search by Google ID OR Email
        let user = await User.findOne({
          $or: [{ googleId: profile.id }, { email: email }],
        });

        if (user) {
          if (!user.googleId) {
            user.googleId = profile.id;
            if (!user.avatar) user.avatar = profile.photos?.[0].value;
            await user.save();
          }
          return done(null, user);
        }

        // New User Creation
        user = await User.create({
          googleId: profile.id,
          name: profile.displayName,
          email: email,
          image: profile.photos?.[0].value,
        });

        return done(null, user);
      } catch (err) {
        return done(err as Error, false);
      }
    },
  ),
);

// Required even if not using sessions for Passport's internal flow
passport.serializeUser((user: any, done) => done(null, user.id));
passport.deserializeUser((id, done) => done(null, { id }));
