# Project specs

This document describes the specification for this project.

---

# 1. Specs Overview

- This project is for my friends' board, that has features:
  - Log-in via OAuth2
  - Has 'quest' boards
    - 'Ongoing quest' board: quest that is within due date
      - For 'Ongoing quest' board, users can upload and edit 1 record for each, that has multiple photos.
        - editing and deleting is restricted to the user who wrote.
        - everyone(including those who are not logged in) can see the records of quest.
    - 'Previous quests' board: quests that are out of date
      - No one can create/edit/delete on previous quests. Only reading is allowed.

---
    
# 2. Technical requirements

- Cheaper maintenance is the best
  - This mini project is only for my friends, not more than 30 people.
  - Since traffic would be very low, I want to keep service free or with very low cost.
  - But since the photo upload should be available, I guess the backend server is necessary.
- Frontend application
  - Mobile-based app is required
    - Many of them would upload their photo via their phone, not via PC.
  - Next.js is well-known to be most learned code by AI model, so it would be great.
- Backend application
  - If you think it would be better if frontend and backend application is combined together, it is fine.
    - But since there would be file uploads or else, I don't think it would work well. implement as you wish.
  - If backend application would be build separately, FastAPI would be great.
    - If you adopt FastAPI, make sure you declare types to the variables so that you can manage it easily without confusion.
- DB
  - Mentioned first, cheapest is the best.

---

# 3. User

- User has:
  - OAuth2 token
  - User name
- User can:
  - register (new one with OAuth2 authentication)
    - with:
      - Google ID
  - log in
  - log out
  - change its user name
  - delete account
    - when deleting account, all records would be also deleted
  - upload/edit/delete 'ongoing quest'

---

# 4. Quest

- Quest is:
  - What users do in a given time
  - Users upload their record to ongoing quest
    - Since this is for Rhythm Game record(Pump It Up), records would be a collection of photos of their game result.
  - Has start date and end date
  - Has 'charts'
    - Since this is for rhythm game(pump it up), chart is composed with 'song name' and 'difficulty'.
      - ex: song name 'Destination', difficulty 'D20'
    - There are multiple charts for given quests.
  - Has participants
    - Users choose to participate on ongoing quest
    - Everyone can see who participated ongoing quest
      - Also their ongoing process:
        - If user submitted every photo of curresponding 'charts', the user is 'FINISHED'.
        - If user submitted not every but some of photo, the user is 'SUBMITTING'.
        - If user did not submit any photo, the user is 'UNSUBMITTED'.

---

# 5. Record (for quest)

- Record is:
  - What users upload
  - Collection of photo
  - Can be edited/deleted after submit
    - After the due date of quest, it cannot be edited or submitted
