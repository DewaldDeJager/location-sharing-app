# Roadmap

The below is a list of features that we are planning to implement soon.

- After logging in with social, it asks which app to open and shows 2 for some reason. Selecting the top one doesn't work.
  - Says unable to sign in. Please try again.
- Fix issue where the login page is blank in Brave browser
- Move to hosted UI for Cognito login and make styling more consistent with the app
- Sign out button takes you back to login screen, but this automatically signs you back in again (Especially login with Google)

## Goals for 5 March stream:
- [x] Move login and splash to Restyle
- [x] Only ask for location permission after login, not before
- [ ] Fix the Firebase permission issue in the CI/CD

### Stretch goal:
- Add an intro page to explain what the app is about
- Improve the UX around granting the background location permission
- Get rid of the "Powered by React Native" at the bottom of the splash/launch screen on iOS

Feedback from Florian:
- Sharing status pill should be centered vertically in the group card
- Sharing card on the View Group screen is too close to the app bar at the top of the screen
- The "share temporarily" needs an option to set either a duration or time manually
- Presets could be set manually via the settings or kept at default.
- Back button behaviour is a bit weird
  - If I go into "Sharing" and go to edit a group, when I press the back button it moves me back to "People" instead of going one back.
  - If I navigate away from editing a group from Sharing and come back, it's still in that group
- Edit button on "Sharing" screen takes up a lot of real estate
- Consider changing the layout of the "Sharing" screen to show people and groups in this order: Those you're sharing with temporarily, those you are always sharing with, and then the other people and groups
- [x] Creating a group still has the "Cancel" and "Set Rule" buttons but they are useless cause the "Create Group" one exists.
- Also the sharing options are sorted "Don't share", "Share" and then "Temp Share". Due to sharing being the main reason to have this app, it should be sorted "Share always", "Temp share", "Don't share".
- Extending a temporarily shared location should allow me to add time, set time, remove time and set a new end time.
- Also if I extend it to the next day it tells me like "at 22:06" but doesn't tell me it's in over a day.
- Focus on my location button should also reset the zoom level of the map to the default
- "If I try to rotate the map it resets the rotation when I remove my fingers..."
