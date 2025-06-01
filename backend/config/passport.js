const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const config = require('../config');

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

passport.use(
  new GoogleStrategy(
    {
      clientID: '1027576728634-9bjvnhjqofc970kpoaegbjhf64a1sb3q.apps.googleusercontent.com',
      clientSecret: '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',
      callbackURL: `${config.API_URL}/api/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ googleId: profile.id });

        // Get the highest resolution profile picture
        const picture = profile.photos && profile.photos.length > 0 
          ? profile.photos[0].value.replace('=s96-c', '=s400-c') 
          : null;

        if (!user) {
          user = await User.create({
            googleId: profile.id,
            email: profile.emails[0].value,
            name: profile.displayName,
            picture: picture,
          });
        } else {
          // Update user information including picture
          user.name = profile.displayName;
          user.email = profile.emails[0].value;
          user.picture = picture;
          user.lastLogin = new Date();
          await user.save();
        }

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
); 