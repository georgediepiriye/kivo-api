import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { User } from "../models/User.js";
import config from "./config.js";

passport.use(
  new GoogleStrategy(
    {
      clientID: config.googleOAuth.clientId,
      clientSecret: config.googleOAuth.clientSecret,
      callbackURL: "/v1/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0].value;

        // 1. Search for a user by their Google ID OR their Email
        let user = await User.findOne({
          $or: [{ googleId: profile.id }, { email: email }],
        });

        if (user) {
          // 2. If user exists but doesn't have a googleId (signed up via email/pass before)
          // Update the record so they can log in via Google next time
          if (!user.googleId) {
            user.googleId = profile.id;
            // Also sync the avatar if they don't have one
            if (!user.avatar) user.avatar = profile.photos?.[0].value;
            await user.save();
          }
          return done(null, user);
        }

        // 3. No user exists at all -> Create a new account
        user = await User.create({
          googleId: profile.id,
          name: profile.name?.givenName + " " + profile.name?.familyName,
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
